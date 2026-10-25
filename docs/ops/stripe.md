# Stripe runbook

Companion to [05-payments.md](../plan/05-payments.md). Covers dashboard setup and
the operational procedures. Do everything in **test mode** first. Go live only
after the M5-11 payments QA passes.

## 1. Account setup

1. Create the Stripe account for the legal entity you chose (11§1). Complete
   business verification and add the bank account **early**: activation can take
   days to weeks.
2. Turn on 2FA for every user with dashboard access. Use restricted API keys for
   anything that doesn't need full access.
3. If Stripe doesn't support your country or you don't want to handle tax
   registrations, stop and pick a merchant of record instead (05§3.5).

## 2. Dashboard configuration

| Area | Setting |
|------|---------|
| Branding | Logo, colors, support email, statement descriptor (e.g. `TYPEDASH`) |
| Payment methods | Use dynamic payment methods: cards, Apple Pay, Google Pay, plus local methods for your target countries |
| Adaptive Pricing | On, so customers see local currency |
| Tax | Enable Stripe Tax, set your head-office address and product tax codes (SaaS / digital services). Turn on monitoring for registration thresholds |
| Customer Portal | Allow: cancel at period end, switch plan (monthly ↔ yearly), update payment method, view invoices. Set the cancellation survey reasons. Disallow immediate cancellation with refund (handle by support) |
| Billing | Smart Retries on. Failed-payment emails off if you send your own (M5-13), otherwise on. Subscription grace behavior: keep active for 7 days (matches `graceUntil`) |
| Emails | Receipts on |
| Radar | Default rules on. Review the dispute and fraud alerts |
| Webhooks | Endpoint `https://<domain>/api/webhooks/stripe` with events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.trial_will_end`, `charge.refunded`, `charge.dispute.created`. One endpoint per environment, each with its own signing secret |

## 3. Keys and environments

| Environment | Keys | Webhook secret |
|-------------|------|----------------|
| Local | Test keys | From `stripe listen` (printed on start) |
| Staging / PR | Test keys | Test-mode endpoint secret |
| Production | **Live keys** | Live-mode endpoint secret |

Never put live keys anywhere except Railway's production environment. CI, PR
environments, and developer machines use test keys only.

## 4. Catalog

`pnpm stripe:sync` creates or updates products and prices from
`apps/server/src/billing/catalog.ts` using lookup keys. Run it against test mode freely.
**Running it against live mode needs a human to confirm** (it asks). Do not change a
live price in place: create a new price with a new lookup key version and move the
lookup key, so existing subscribers keep their price.

## 5. Local development

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the printed whsec_... into your local env as STRIPE_WEBHOOK_SECRET
stripe trigger checkout.session.completed
```

Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline),
`4000 0027 6000 3184` (3-D Secure required). Any future expiry, any CVC.

## 6. Test clocks (required before launch)

Run these as a scripted checklist in M5-11:
1. Subscribe monthly → advance 1 month → renewal succeeds, `currentPeriodEnd` moves.
2. Subscribe → payment method fails on renewal → `graceUntil` set, user keeps Pro, email sent → retries fail → subscription ends → entitlements drop to Free after grace.
3. Subscribe yearly → advance to the renewal reminder date → reminder email sent.
4. Cancel at period end in the portal → access remains until the end → then drops.
5. Change seats on a school subscription mid-period → proration is correct.
6. Refund a one-time purchase → the inventory item / certificate credit is revoked.

## 7. Operations

| Situation | Procedure |
|-----------|-----------|
| Customer says "I paid but have no Pro" | Look up the customer in Stripe. Check the webhook delivery log for that event. If delivery failed, **resend the event** from the dashboard (the handler is idempotent). Then check `GET /api/me` for the entitlement |
| Refund request within the policy window | Refund in the dashboard. The `charge.refunded` webhook revokes access. Reply to the customer |
| Chargeback / dispute | Respond in the dashboard within the deadline with evidence (account activity, race history, IP logs). The webhook flags the account. Don't ban automatically |
| Webhook failures alert | Fix the cause, then replay failed events from the dashboard. Never edit the database by hand to grant access |
| Price change | New lookup key version. Communicate to existing subscribers according to local consumer law. Never silently raise a price |
| Taxes | Review Stripe Tax's threshold alerts monthly. Register where required, then enable collection there |
| Monthly review | MRR, new vs churned, failed payments, disputes, AI cost per Pro user (05§5) |
