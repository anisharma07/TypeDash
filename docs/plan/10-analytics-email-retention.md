# 10 — Analytics, email & data retention

## 1. Analytics event catalog (PostHog)

The typed wrapper (M1-15) only allows the events below. Adding an event means
adding it here and in `packages/shared/constants/analytics.ts`. Names are
`snake_case`, past tense. Never send names, emails, typed text, or chat content as
properties. Use the internal `userId` (pseudonymous) as the distinct ID.

Events marked **(server)** are captured on the server (reliable, not blockable);
the rest are captured in the browser after consent where consent is required.

### Acquisition & onboarding
| Event | Properties |
|-------|-----------|
| `landing_viewed` | `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `is_returning` |
| `guest_session_started` | `entry` (landing/room_link/seo_page/share) |
| `room_link_opened` | `code_age_sec`, `room_state` |
| `signup_started` | `method` (google/github/email), `from` (nudge/settings/paywall/checkout) |
| `signup_completed` (server) | `method`, `was_guest` |
| `guest_upgraded` (server) | `races_before`, `days_since_first_visit` |

### Core loop
| Event | Properties |
|-------|-----------|
| `test_started` | `mode`, `duration`, `language`, `device_class` |
| `test_completed` (server) | `mode`, `duration`, `wpm_bucket`, `accuracy_bucket`, `accepted`, `device_class` |
| `test_abandoned` | `mode`, `elapsed_pct` |
| `room_created` (server) | `visibility`, `text_type`, `max_players`, `plan` |
| `room_joined` (server) | `kind`, `via` (link/code/quickplay/invite), `players_in_room` |
| `race_started` (server) | `kind`, `human_count`, `bot_count` |
| `race_completed` (server) | `kind`, `place_bucket`, `human_count`, `wpm_bucket` |
| `rematch_clicked` | `human_count` |
| `bot_fill_triggered` (server) | `wait_sec` |
| `time_to_first_keystroke` | `ms` (landing → first key; the headline onboarding KPI) |

### Engagement & retention
| Event | Properties |
|-------|-----------|
| `daily_challenge_started` / `daily_challenge_completed` (server) | `wpm_bucket`, `rank_bucket` |
| `streak_extended` (server) | `length` |
| `streak_broken` (server) | `length`, `freeze_used` |
| `achievement_unlocked` (server) | `code` |
| `level_up` (server) | `level` |
| `friend_request_sent` / `friend_added` (server) | — |
| `invite_sent` | `channel` (copy/qr/share_sheet/friend) |
| `result_shared` | `channel`, `what` (result/pb/badge/certificate) |
| `leaderboard_viewed` | `scope`, `mode` |
| `settings_changed` | `key` (never the value of free-text fields) |

### AI
| Event | Properties |
|-------|-----------|
| `coach_report_requested` / `coach_report_viewed` | `source` (stats/after_race) |
| `coach_report_generated` (server) | `ms`, `cached`, `fallback_used`, `cost_usd_bucket` |
| `drill_started` / `drill_completed` | `kind`, `ai`, `improvement_pct_bucket` |
| `topic_text_generated` (server) | `cached`, `moderation_blocked` |
| `ai_quota_hit` (server) | `feature`, `plan` |

### Monetization
| Event | Properties |
|-------|-----------|
| `paywall_viewed` | `feature`, `from` |
| `pricing_viewed` | `from` |
| `checkout_started` (server) | `price_key` |
| `checkout_completed` (server) | `price_key`, `amount_bucket`, `currency` |
| `subscription_canceled` (server) | `reason` (portal survey), `tenure_days` |
| `purchase_completed` (server) | `sku`, `amount_bucket` |
| `ad_slot_viewed` | `slot` (landing/lobby/results) |

### Health
| Event | Properties |
|-------|-----------|
| `client_error` | `kind`, `route` (Sentry is the source of truth for details) |
| `socket_reconnected` | `downtime_ms`, `resumed_race` |
| `race_result_rejected` (server) | `rule` (which 02§3.2 rule fired) |

### Funnels and dashboards to build in PostHog (M3 onward)
1. **Activation:** `landing_viewed` → `test_started` → `test_completed` (target: median
   `time_to_first_keystroke` < 15 s).
2. **Invite loop:** `room_created` → `invite_sent` → `room_link_opened` → `room_joined` →
   `race_completed` (by invited vs host).
3. **Guest conversion:** `guest_session_started` → 3rd `test_completed` → `signup_started`
   → `signup_completed`.
4. **Habit:** weekly cohort retention (D1/D7/D30) split by whether the user took a
   daily challenge in week 1.
5. **Revenue:** `paywall_viewed` → `pricing_viewed` → `checkout_started` →
   `checkout_completed`, per `feature`.
6. **Game health:** rejects per 1,000 races by rule, bot-fill rate, reconnect success rate.

### Privacy rules for analytics
- EEA/UK/CH visitors: analytics and ad scripts load only after consent. Server-side
  events about a signed-in user's own activity stay under legitimate interest and
  contain no free text.
- Session replay masks the typing area, chat, and all form inputs.
- A "Do not track" / "Opt out" toggle in Settings disables browser analytics for that account.

## 2. Email and notification catalog

Two classes, with separate rules:

- **Transactional**: required for the service (sign-in link, receipts, payment
  failures, account deletion confirmation). Cannot be unsubscribed from, but must
  contain only what's needed.
- **Lifecycle / marketing**: opt-in at sign-up (unchecked by default in the EEA/UK),
  one-click unsubscribe in every email, and a preference page.

| Email | Class | Trigger | Task |
|-------|-------|---------|------|
| Magic link | Transactional | Sign in with email | M1-07 |
| Welcome | Lifecycle | Sign-up completed | G-06 |
| Receipt / invoice | Transactional | `invoice.paid` | M5-13 |
| Payment failed (grace notice) | Transactional | `invoice.payment_failed` | M5-13 |
| Upcoming yearly renewal | Transactional | 14 days before renewal | M5-13 |
| Cancellation confirmation + survey | Transactional | Subscription canceled | M5-13 |
| Win-back (30 days after cancel) | Lifecycle | Scheduled job | M5-13 |
| Streak at risk | Lifecycle | 19:00 local, streak ≥ 3, nothing done today | M3-03 |
| Weekly progress digest | Lifecycle | Sunday local | G-06 |
| Friend beat your PB | Lifecycle | Event, max 1/day | G-06 |
| Account deletion confirmation | Transactional | `DELETE /api/me` | M3-13 |
| Data export ready | Transactional | `GET /api/me/export` | M3-13 |
| Class invite / assignment due | Transactional | Teacher action / 24 h before due | M6-07 |
| Certificate issued | Transactional | Certificate generated | M5-09 |

**Sending rules:** quiet hours (no lifecycle email 22:00–08:00 local), max 3
lifecycle emails per week per user, suppression list honored across all sends, bounce
and complaint webhooks from Resend disable the address after one complaint or three
hard bounces.

**In-app notifications** (M3-17) mirror: friend request, room invite, achievement,
streak at risk, assignment due (M6), season ended (M6). Web push is out of scope for
v1.0. Add it in G only if email click-through shows demand.

## 3. Data retention

| Data | Kept for | Why | Mechanism |
|------|----------|-----|-----------|
| Account + profile | Until deletion | Service | `DELETE /api/me` |
| Inactive guest accounts (no results) | 90 days since last visit | Clean up | M3-19 job |
| Guest accounts with results | 12 months since last visit, then anonymized | Allow return | M3-19 job |
| `RaceResult` metrics | Until account deletion, then **anonymized** (user link removed, numbers kept for aggregates) | Boards, stats | M3-13 |
| Keystroke logs (`keylog`) | **7 days**, except: personal bests (kept while they're the PB), flagged results (until review closes + 30 d), certificates (life of the certificate), replays for Pro (last 50) | Validation, replay | M3-19 job |
| Chat messages | 30 days | Moderation | TTL index |
| `Notification` | 90 days | UX | TTL index |
| `StripeEvent` | 60 days | Idempotency | TTL index |
| `AuditLog` | 365 days | Admin accountability | TTL index |
| `AiUsage` | 13 months (aggregates beyond that) | Cost analysis | job |
| `CoachReport` | 12 months or until deletion | UX | job |
| Tournament prize contacts | 30 days after the event closes, then deleted | Prize fulfillment only | M7-03 |
| Assessment candidate data | Per the hiring company's setting: 30/90/365 days, default 90 | Employer need | M7-04 |
| Invoices / tax records | As required by tax law (typically 7+ years) in Stripe | Legal | Stripe |
| Server logs | 14 days | Debugging | Log drain / Railway settings |
| Backups | 7–30 days (Atlas) | Recovery | Atlas policy. Deleted users re-purged after a restore (restore runbook step) |

**Deletion request SLA:** completed within 30 days (the target is immediate for the
profile and 24 h for derived data). Document the **post-restore re-purge**: after any
backup restore, run the deletion log replay so deleted users do not reappear.
