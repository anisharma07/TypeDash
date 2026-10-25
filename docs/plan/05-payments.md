# 05 — Payments, plans & entitlements

## 1. Plans & prices (launch hypotheses, test and adjust)

Prices are in USD. **Stripe Adaptive Pricing** shows local currencies at
checkout, which is important for a global audience (India, LATAM, SEA).

| Plan | Price | For |
|------|-------|-----|
| **Free** | $0 | Everyone. Full racing, rooms up to 10, practice, daily challenge, basic stats, rule-based coach + 1 AI coach report/week, ads on lobby and results pages only |
| **Pro** | $4.99/mo or $39.99/yr (33% off) | Individuals. See entitlements below |
| **Teacher** | $6.99/mo or $59/yr | One teacher, up to 3 classes / 40 students, includes Pro for the teacher |
| **School** | $3 per student/year (min 100 seats), invoiced | Schools. Seats = subscription quantity; admin dashboard; SSO later |
| **Event Pass** | $49 (≤ 50 players) / $149 (≤ 300) / custom | One-off branded tournament (M7) |
| **Assessment pack** | $29 (25 candidates) / $99 (100) | Hiring typing tests (M7) |
| **Verified certificate** | $7.99 each (Pro: 1 free/year) | LinkedIn-shareable, verifiable certificate |
| **Cosmetics** | $1.99–$4.99 one-time | Avatars, track skins, caret trails, finish effects |

## 2. Entitlements (`packages/shared/src/constants/features.ts`)

All gating goes through `can(entitlements, feature)` and `limit(entitlements, key)`
on both server (authoritative) and client (UI only).

| Feature / limit | Guest | Free | Pro | Teacher | School student |
|-----------------|-------|------|-----|---------|----------------|
| Race, rooms, quick match, practice | ✅ | ✅ | ✅ | ✅ | ✅ |
| `room.maxPlayers` (as host) | 10 | 10 | 50 | 50 | — |
| `room.activePrivate` | 1 | 1 | 3 | 5 | — |
| Daily challenge ranked attempt | ❌ | ✅ | ✅ | ✅ | ✅ |
| Leaderboards appearance | ❌ | ✅ | ✅ | ✅ | class only |
| Ranked mode (M6) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Stats history | 7 d | 30 d | all | all | all |
| Key heatmap & bigram analysis | basic | basic | full | full | full |
| `ai.coach` per period | — | 1/week | 30/month | 30/month | 4/month |
| `ai.drill` (AI v2) | — | — | ✅ | ✅ | ✅ |
| `ai.topicText` per day | — | 3 | 50 | 50 | via teacher |
| Code mode languages | JS, Py | JS, Py | all | all | all |
| Replays & PB ghost (M6) | — | last 3 | all | all | — |
| Streak freezes | — | 1/month | 2 stored, weekly refill | same as Pro | — |
| Themes & cosmetics | default | default + earned | + Pro set | + Pro set | default |
| Ads | yes | yes | **no** | no | **never** (students) |
| Custom room branding (name, colors) | — | — | ✅ | ✅ | — |
| Classrooms / assignments / reports | — | — | — | ✅ | — |

**Entitlement resolution:** `getEntitlements(userId)` merges plan (from active
`Subscription`), org memberships (Teacher/School), and `Inventory`. The result is
cached in Redis for 60 s and invalidated by webhook handlers and membership
changes. It's exposed as `GET /api/me → entitlements`.

## 3. Stripe integration

### 3.1 Catalog as code
- `apps/server/src/billing/catalog.ts` defines products and prices with
  **lookup keys** (`pro_monthly`, `pro_yearly`, `teacher_monthly`,
  `teacher_yearly`, `school_seat_yearly`, `cert_single`, `event_50`, `event_300`,
  `assess_25`, `assess_100`, `cosmetic_*`).
- `pnpm stripe:sync` (idempotent script) creates or updates them in test or live
  mode. The code refers only to lookup keys, never to raw price IDs.

### 3.2 Checkout flow (subscriptions and one-time purchases)
1. The user must be **registered** (not a guest) so there's an email and
   account to attach. A guest is prompted to sign up first (one click with Google).
2. `POST /api/billing/checkout { priceKey }`:
   - Find or create the Stripe Customer and store it in `BillingCustomer`.
   - Create a Checkout Session: `mode` is `subscription` or `payment`,
     `client_reference_id = userId`, `metadata {ownerType, ownerId, priceKey}`
     (also on `subscription_data.metadata`), `automatic_tax.enabled = true`,
     `allow_promotion_codes = true`, `success_url = /billing/success?session_id={CHECKOUT_SESSION_ID}`,
     `cancel_url = /pricing`. Payment methods are managed in the Stripe Dashboard
     (dynamic payment methods: cards, Apple Pay, Google Pay, plus local methods per country).
3. Redirect to the Stripe-hosted Checkout.
4. `/billing/success` polls `GET /api/me` (up to 15 s) until the entitlement
   appears; otherwise it shows "Payment received, activating…" and a refresh. Access
   is **only** granted by webhooks, never by the success redirect.

### 3.3 Webhooks (`POST /api/webhooks/stripe`)
- Mounted with `express.raw({ type: 'application/json' })` **before** the JSON
  body parser. Verified with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`.
- Idempotency: insert `StripeEvent {eventId}` (unique). On duplicate key, return 200
  and skip.
- For subscription events, **re-fetch the subscription from the Stripe API**
  instead of trusting event order.
- Respond 2xx quickly. Anything slow (emails, cosmetics grants) goes to a BullMQ job.

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link customer ↔ owner. For `mode=payment`, create `Purchase` and fulfill (inventory item / certificate credit / event or assessment credits) |
| `customer.subscription.created` / `.updated` | Upsert `Subscription` (status, plan, quantity, period end, cancelAtPeriodEnd) → invalidate entitlements |
| `customer.subscription.deleted` | Mark ended → entitlements drop to Free |
| `invoice.paid` | Clear `graceUntil`; record revenue analytics event |
| `invoice.payment_failed` | Set `graceUntil = now + 7 d` (Pro stays active during grace) and email the user (Stripe Smart Retries handles retries) |
| `customer.subscription.trial_will_end` | Reminder email (if trials are enabled) |
| `charge.refunded` | Revoke the related `Purchase` item / certificate credit |
| `charge.dispute.created` | Flag account, revoke purchase, alert admin |

### 3.4 Self-service
- **Stripe Customer Portal** (`POST /api/billing/portal`): cancel at period end,
  switch monthly ↔ yearly, update payment method, download invoices.
  Configured in the Dashboard. Settings are documented in `docs/ops/stripe.md`.
- Schools that need purchase orders get **Stripe Invoicing** (`collection_method:
  send_invoice`, net 30) created by an admin from `/admin/billing`.

### 3.5 Tax, compliance, policies
- **Stripe Tax** calculates and collects VAT/GST/sales tax. You still need to
  **register** in jurisdictions as you cross their thresholds. Stripe Tax's
  monitoring shows when; confirm with an accountant.
- **If Stripe isn't available for your business's country**, or you'd rather not
  handle tax registrations yourself, use a **merchant of record** (Paddle or Lemon
  Squeezy). They sell on your behalf and handle global sales tax for a higher fee.
  The billing module is isolated behind `billing/provider.ts` so this is a
  contained swap.
- Refund policy: 14-day refund on first purchase of a subscription (it also
  satisfies EU consumer rules). After that, cancel at period end.
- Prices shown tax-inclusive where required (EU/UK/AU/IN), tax-exclusive in the US.

### 3.6 Testing
- Test mode keys in dev, staging, and PR environments. Live keys **only** in production.
- Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
- **Test clocks** for renewals, failed payments → grace → cancellation, and
  yearly renewal.
- E2E (Playwright, staging): checkout with test card `4242…` → webhook → Pro
  entitlement visible; decline card `4000 0000 0000 0002` → error UX; portal
  cancel → access until period end.
- Unit: every webhook handler with recorded fixture payloads, including duplicate
  and out-of-order delivery.

## 4. Ads (free tier, M5)

- Google AdSense (or another network) with **one** slot on landing, lobby, and
  results pages. **Never on the typing area, never during a race, never for
  students in School or Teacher accounts.**
- A Google-certified consent management platform (CMP) for EEA/UK/CH. Show
  non-personalized ads without consent.
- Lazy-load the ad script after the page is interactive. It must not hurt LCP/INP
  budgets (enforced by a Lighthouse CI check).
- Expect ad revenue to be small. Its main job is to make **Pro's "no ads"**
  attractive. Re-evaluate after 60 days with data.

## 5. Revenue analytics

PostHog events: `paywall_viewed {feature}`, `checkout_started {priceKey}`,
`checkout_completed`, `subscription_canceled {reason}`, `purchase_completed {sku}`.
The Stripe Dashboard is the source of truth for MRR and churn. Build a weekly
admin summary (MRR, new and churned subs, ARPPU, AI cost per Pro user).
