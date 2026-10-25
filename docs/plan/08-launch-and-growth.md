# 08 — Launch, growth, metrics, costs & risks

## 1. Launch sequence

| Stage | When | Who | Goal | Checklist |
|-------|------|-----|------|-----------|
| **Private alpha** | End of M2 (solo: ~week 15, two lanes: ~week 8) | 20–50 friends, classmates, Discord | Find bugs in rooms/racing, tune bots and timings | Staging URL, feedback form, Sentry watched daily |
| **Public beta** | End of M3 (solo: ~week 22, two lanes: ~week 12) | Everyone. Legacy users are redirected | Validate retention (D1/D7) and the invite loop **before** monetizing | M3-15 go-live checklist. Legacy migration done. Privacy policy live. Status page |
| **v1.0 launch** | End of M5 (solo: ~week 33, two lanes: ~week 17) | Public push | Grow and start revenue | Below |
| **B2B pilots** | M6–M7 | 3–5 teachers, 1–2 event organizers, 1 company | First paying B2B customers, case studies | Free pilots in exchange for feedback + testimonial |

**v1.0 launch checklist:**
- [ ] Payments live: test-clock scenarios passed, refund policy page, tax setup reviewed
- [ ] Restore drill done. Alerts routed to your phone (Sentry, uptime, AI budget, Stripe)
- [ ] Load test passed on the production config (06§6)
- [ ] Landing, pricing, SEO pages, OG images, favicon set, `robots.txt`, sitemap
- [ ] Launch assets: 60-second demo video (race with friends + AI coach), screenshots, GIFs of the race track
- [ ] Posts scheduled: **Product Hunt**, **Show HN**, Reddit (r/typing, r/MechanicalKeyboards, r/SideProject, r/webdev, plus regional subreddits), X/LinkedIn, Indie Hackers, Discord typing communities
- [ ] Launch-week promo code (e.g. 30% off yearly Pro, first 7 days)
- [ ] A "launch tournament" event with a cosmetic prize (uses rooms + leaderboards; M7 tooling not required)

## 2. Growth loops

1. **Invite loop:** create room → share link/QR → friends join as guests in one
   click → some sign up → they create their own rooms. *Metric: invites sent per
   room, invite → join rate, joined guests → sign-up rate.*
2. **Share loop:** PB, achievement, or daily challenge result → share card → new
   visitors land on a result page with a "Beat this score" button that starts a
   race on the same text. *Metric: shares per 100 races, visits per share.*
3. **Daily habit loop:** daily challenge + streak + reminder → returns every day
   → daily board → share. *Metric: daily challenge participation (% of DAU),
   streak ≥ 7 share.*
4. **SEO loop:** "typing test" style pages with an embedded live test → first
   race → sign up. *Metric: organic sessions, organic → first race.*
5. **B2B loop:** a teacher runs class races → students use TypeDash at home →
   parents and other teachers discover it. An event organizer runs a branded
   tournament → participants keep playing.

## 3. KPIs

Instrument in M1–M3 (PostHog). Review weekly, starting at beta.

| KPI | Definition | Beta target | v1.0 + 3 months target |
|-----|------------|-------------|------------------------|
| Time to first race | Landing → first keystroke in a test/race (median) | < 15 s | < 10 s |
| Races per session | Median | ≥ 3 | ≥ 4 |
| Invite → join | % of invite link clicks that join the room | ≥ 50% | ≥ 60% |
| Guest → registered | % of guests who sign up within 7 days | ≥ 10% | ≥ 15% |
| D1 / D7 / D30 retention | Registered users | 30 / 15 / 7% | 35 / 18 / 9% |
| Daily challenge participation | % of DAU | ≥ 20% | ≥ 30% |
| Free → Pro conversion | % of MAU paying | — | 2–4% |
| AI cost per Pro user | Monthly AI spend ÷ Pro subs | — | < 15% of price |
| Crash-free sessions | Sentry | ≥ 99.5% | ≥ 99.8% |
| Race tick lag p95 | Server metric | < 50 ms | < 50 ms |

## 4. Running costs (rough estimates, verify current pricing before committing)

| Item | Beta (~1k MAU) | v1.0 + 3 months (~10k MAU) |
|------|----------------|----------------------------|
| Railway (web + worker + Redis, staging + PR envs) | ~$10–30/mo | ~$40–100/mo |
| MongoDB Atlas | Free/Flex tier ~$0–30/mo | Dedicated tier with backups ~$60–120/mo |
| Claude API | ~$20–60/mo | ~$300–500/mo (see 04§4, scales with usage; quotas cap it) |
| Resend (email) | Free tier | ~$20/mo |
| Sentry, PostHog | Free tiers | Free → ~$0–50/mo |
| Domain + Cloudflare | ~$1–2/mo | ~$1–2/mo |
| Stripe fees | — | ~3% + fixed per transaction (varies by country/method) + Stripe Tax fee |
| **Total (before Stripe fees)** | **≈ $30–120/mo** | **≈ $420–800/mo** |

**Break-even sketch at 10k MAU:** 2.5% Pro conversion = 250 subscribers. At about
$3.50/month net average (mix of monthly, yearly, and regional pricing, after
fees) that's ~$875/month, which roughly covers running costs before B2B, certificates, cosmetics, and ads. B2B
(classrooms, events, assessments) is the bigger lever. A single school license
of 300 students at $3 per student per year is $900/year.

## 5. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Empty lobbies at launch (low concurrency) | High | High | Bots fill in 8 s (M2-11). Daily challenge works async. Promote private rooms with friends over public matchmaking |
| Cheaters ruin leaderboards | High | High | Server-authoritative races + replay validation + soft flags + admin review (02§3). Public boards show only verified results |
| AI costs grow faster than revenue | Medium | Medium | Quotas, caching, batch generation, budget cap with automatic fallback, and the Haiku 5.5 cost option (04§1) |
| AI output is wrong or inappropriate | Medium | Medium | Structured outputs, grounding check, two moderation layers, evals per prompt version, kill switch per feature |
| Rebuild takes longer than planned | **High** (solo) | Medium | Estimates are derived from task sizes (README) with a 25% buffer, and still carry error. M0 hotfix keeps the live site safe. Ship beta (M3) before AI and payments. Cut in this order: M7, M6, then code mode and learn packs. Re-plan at every milestone exit (12§4) |
| Single-instance limits | Low (early) | High | Load tests each milestone. Documented Stage 2 path (06§8) |
| Payment provider availability / tax obligations | Medium | Medium | Billing isolated behind a provider interface. Merchant-of-record fallback (05§3.5). Accountant review before v1.0 |
| Children's privacy (classrooms) | Medium | High | Teacher-managed student accounts, no email/ads/public profile/open chat for students (M6-06). Legal review before selling to schools |
| Content licensing of passages | Medium | Medium | Public-domain + original + AI-generated texts only (A B19). Attribution stored |
| Mobile typing experience is poor | Medium | Medium | Mobile-specific layout and boards, testing on real devices every milestone |

## 6. Legal & compliance checklist

- [ ] Privacy policy: data collected (account, typing stats, keystroke timing
      logs, analytics), purposes, retention (keylogs 7 days unless PB, flagged, or
      certificate), processors (Railway, MongoDB, Stripe, Anthropic, Resend,
      PostHog, Sentry, ad network), user rights (access, export, deletion).
- [ ] Terms of service: fair play / anti-cheat, user content (custom texts, chat),
      subscriptions and refunds, account termination.
- [ ] Cookie/analytics consent where required (EEA/UK). Ads consent via a certified CMP.
- [ ] GDPR: data export + deletion endpoints (M3-13), a DPA available for B2B customers.
- [ ] Children: no self-sign-up under 13 outside teacher-managed classrooms. Follow
      COPPA / GDPR-K / India DPDP requirements for minors' data. Get a legal review
      before selling to schools.
- [ ] Payments: refund policy page, tax-inclusive pricing where required, invoices
      with correct tax details (Stripe).
- [ ] Prize events: contest rules page per event (eligibility, how winners are
      contacted). Contacts encrypted and deleted after the event.
