# 11 — Owner checklist (non-code work with lead times)

Code is only part of the critical path. These items need **you** (accounts, legal
identity, DNS, money, approvals), and several have waiting periods you can't speed
up. Start each one by its "Start by" milestone, not when the code needs it.

Lead times are typical and can vary by country and provider. Treat them as
planning figures and check each provider's current terms.

## 1. Before any code (start this week)

| # | Item | Why | Typical lead time | Notes |
|---|------|-----|-------------------|-------|
| 1 | **Back up the production database** (M0-08) | M0 changes live data | Minutes | Do this before anything else |
| 2 | **Decide the name & check conflicts** | "TypeDash" may be taken as a trademark or domain. Rebranding later is expensive | 1–3 days | Search trademark databases for your country and the US/EU in the "typing / games / software" classes. Check app stores and social handles |
| 3 | **Buy the domain** and put DNS on Cloudflare | Needed for email, OAuth, Stripe, SEO | Same day | Buy the `.com` if you can. Turn on registrar 2FA and auto-renew |
| 4 | **Password manager + 2FA on every account** below | One compromised account (Stripe, Railway, Atlas, domain) ends the business | 1 hour | Store recovery codes offline. Name a trusted backup person for emergencies |
| 5 | **Pick your legal setup** (sole proprietor vs company) | Stripe onboarding, tax, liability, and contracts with schools all depend on it | 1–4 weeks to register a company | Ask an accountant. In many countries you can start as an individual and convert later. Do it before taking real money |

## 2. By the start of M1 (infrastructure accounts)

| Item | Notes | Lead time |
|------|-------|-----------|
| GitHub: protect `main`, enable Dependabot, secret scanning, 2FA | Free | Same day |
| Railway account (Pro plan) + team | Staging environment and PR environments need it | Same day |
| MongoDB Atlas org, **separate projects** for staging and production, billing set up | Staging can start on a shared/flex tier. Production needs a dedicated tier with backups before M5 | Same day |
| Sentry, PostHog accounts | Free tiers are enough to start | Same day |
| Resend account + domain verification (SPF, DKIM, DMARC) | Magic-link sign-in needs it (M1-07). DNS propagation can take hours | Hours–1 day |
| Google Cloud project + OAuth consent screen (Google sign-in), GitHub OAuth app | Publish the consent screen to production, or sign-in is limited to test users. Brand verification can take days | Days |
| **Anthropic Console**: organization, one workspace per environment, API keys, **monthly spend limits** per workspace | Set limits before you write any AI code (M4-01) | Minutes |

## 3. By the start of M3 (before public beta)

| Item | Why | Lead time |
|------|-----|-----------|
| **Privacy policy & terms of service** (M3-13) | Required to collect data, take payments, and run ads. See the checklist in 08§6 | 1–2 weeks (draft with a template, then review) |
| **Cookie / analytics consent** approach chosen | EEA/UK users. Pick a consent tool now so M1-15 can integrate it | Days |
| **Legacy players notice**: announce the move, the claim window, and the contact-data deletion on the old site | Players must hear about it before the cutover (M3-14) | 2+ weeks of notice |
| **Prize obligations from the old site** ("Exciting prize for winners") | You collected contacts for prizes. Decide what is owed, fulfil it, then delete the contacts | Days |
| **Public-domain text sources** documented (M1-10) | Keep a list of every source and its licence in the repo | Days |
| **Support channel**: a support email on your domain, a Discord, and a one-page FAQ. Decide who answers and how fast | Beta users will write in | Days |
| Status page + uptime monitor account (M3-20) | Free tiers exist | Hours |

## 4. By the start of M5 (before taking money)

| Item | Why | Lead time | Notes |
|------|-----|-----------|-------|
| **Stripe account activation** | Stripe verifies identity and business details, and a bank account. Live payments are blocked until it's done | Days to 2+ weeks if more documents are requested | **Start in M3.** Check that Stripe supports your country and the one where your business is registered. If not, plan for a merchant of record (Paddle / Lemon Squeezy): see 05§3.5. Decide before M5-02 |
| **Tax** | Stripe Tax calculates tax, but **you** register and file | 1–4 weeks per jurisdiction | Talk to an accountant about thresholds (US states, EU VAT OSS, UK, India GST). Turn on Stripe Tax monitoring |
| **Pricing decision** | The numbers in 05§1 are hypotheses | Days | Before M5-02, run a short survey or a smoke-test of the pricing page at beta |
| **Refund & cancellation policy page** | Required by card networks and consumer law | Days | 14-day first-purchase refund is in the plan (05§3.5) |
| **Ad network approval** (e.g. AdSense) | Needs a live site with real content and a privacy policy | 1–4 weeks, can be rejected | Apply right after beta. If rejected, Pro's value must not depend on ads: the product works without them |
| **Consent management platform** certified for ads in EEA/UK | Ads without consent are non-compliant | Days | Needed before M5-10 |
| **Bookkeeping** | Revenue, expenses, VAT | Ongoing | Set up when the first payment arrives |
| **Restore drill** performed and documented (M5-12) | A backup you haven't restored isn't a backup | 1 day | Atlas restore into a scratch cluster |

## 5. By the start of M6–M7 (B2B)

| Item | Why | Lead time |
|------|-----|-----------|
| **Legal review for schools and minors** (COPPA, GDPR-K, India DPDP, local education rules) | You'll hold data about children. The classroom design assumes no email, no ads, and no public profiles for students. A lawyer must confirm that for your target countries | 2–4 weeks |
| **Data processing agreement (DPA)** template | Schools and companies ask for it | 1–2 weeks |
| **Contest/giveaway rules template** for events | Prizes are regulated in many places | Days |
| **Invoicing details** (company name, tax ID, bank info on invoices) | Schools pay by purchase order and invoice | Days |
| **Insurance** (professional liability / cyber), optional but common for B2B | Larger customers ask | 1–2 weeks |
| **Pilot partners**: identify 3–5 teachers, 1–2 event organizers, 1 company | M6–M7 need real users to validate against | Start recruiting in M4 |

## 6. Launch & community (rolling)

- [ ] Social handles claimed (X, Instagram, YouTube, TikTok, Discord, Product Hunt maker page)
- [ ] A 60-second demo video recorded on staging (M3), re-recorded for v1.0
- [ ] Press/launch list prepared: typing and mechanical-keyboard communities, student
      communities, Indian tech communities if that's your base
- [ ] A recurring community event: weekly tournament (needs M7-01, or run it in a
      private room by hand until then)
- [ ] Referral/affiliate policy decided (G-03)

## 7. Operating the business (ongoing)

- **On-call:** decide who gets paged (Sentry, uptime, AI budget, Stripe webhook failures)
  and what a bad night looks like. Alerts must reach a phone. Solo founders: set a
  "paged only for down/payments" rule so you can sleep.
- **Monthly:** review AI spend vs revenue, Stripe MRR/churn, error budget, and the
  top 5 support issues. Update the plan (12§4).
- **Quarterly:** restore drill, dependency upgrade sweep, security checklist (06§5),
  legal pages review.
- **Incident template** (keep in the repo): what happened, impact, timeline, cause,
  fix, follow-ups. Write one after every production incident, however small.
