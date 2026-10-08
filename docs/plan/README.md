# TypeDash — End-to-End Plan

> **Race your friends, train with an AI coach, prove your speed.**
>
> This folder is the single source of truth for rebuilding TypeDash from a
> single-global-room hobby game into a multiplayer typing platform that people
> return to daily and that earns money. It's written so **AI coding agents can
> execute it task by task**: every task in the backlog has an ID, dependencies, and
> acceptance criteria, and points to the spec it implements.

## Documents

| # | Document | What's inside |
|---|----------|---------------|
| 00 | [Audit](00-audit.md) | Current state, 19 bugs/risks, what to keep, hotfix scope |
| 01 | [Architecture](01-architecture.md) | System diagram, stack, monorepo layout, frontend routes/screens, UX principles |
| 02 | [Gameplay spec](02-gameplay-spec.md) | Typing engine & metrics, room state machine, socket contract, anti-cheat, bots, rating/XP/streaks/achievements |
| 03 | [Data & API](03-data-and-api.md) | MongoDB models + indexes, Redis keys, REST API, legacy data migration |
| 04 | [AI features](04-ai.md) | AI coach, adaptive drills, topic texts, code mode, moderation, cost control, evals |
| 05 | [Payments & plans](05-payments.md) | Stripe integration, plans, entitlements, pricing, webhooks |
| 06 | [Infrastructure](06-infrastructure.md) | Railway setup, environments, CI/CD, config, observability, security, testing, scaling |
| 07 | [Backlog](07-backlog.md) | **Every task by milestone**, with IDs, deps, acceptance criteria |
| 08 | [Launch & growth](08-launch-and-growth.md) | Launch sequence, growth loops, KPIs, running costs, risks, legal |
| 09 | [UX spec](09-ux-spec.md) | Wireframes for the key screens, states, shortcuts, accessibility, mobile and IME input, sounds |
| 10 | [Analytics, email & retention](10-analytics-email-retention.md) | Event catalog, funnels, email and notification catalog, data retention table |
| 11 | [Owner checklist](11-owner-checklist.md) | Non-code setup with lead times: accounts, verification, legal, domain, vendors |
| 12 | [Agent playbook](12-agent-playbook.md) | CLAUDE.md draft, task prompt, PR template, parallel lanes, review gates, re-planning |
| ops | [Railway runbook](../ops/railway.md) · [Stripe runbook](../ops/stripe.md) | Step-by-step setup and operations |

## Locked decisions

| Area | Decision |
|------|----------|
| Frontend | **React 19 + Vite + TypeScript**, React Router, TanStack Query, Zustand, Tailwind CSS + shadcn/ui (Radix), Motion, Recharts |
| Backend | **Node.js 24 LTS + TypeScript**, Express 5, Socket.IO 4, Mongoose, zod |
| Shared code | `packages/shared`: socket/REST contracts (zod) **and the typing engine**, which runs in the browser *and* on the server (for anti-cheat replay) |
| Monorepo | pnpm workspaces: `apps/web`, `apps/server`, `packages/shared` |
| Database | **MongoDB Atlas** (managed backups) |
| Cache / jobs | **Redis** (Railway) for leaderboards, rate limits, and BullMQ background jobs |
| Auth | **Better Auth**: guest (anonymous) sessions by default, then Google / GitHub / email magic link |
| Payments | **Stripe**: Checkout, Billing (subscriptions), Customer Portal, Stripe Tax, Adaptive Pricing (local currencies) |
| AI | **Claude API** (`@anthropic-ai/sdk`) behind an internal `ai/` module. Default model **Claude Opus 5.5** (`claude-opus-5-5`). See [04-ai.md](04-ai.md) for the cost option |
| Hosting | **Railway**: `web` service (API + sockets + static SPA), `worker` service (jobs), Redis. PR preview environments. Fly.io is the documented scale-out path |
| Email | Resend (magic links, receipts, digests) |
| Observability | Sentry (errors), PostHog (product analytics + feature flags), pino logs |
| Testing | Vitest (unit/integration), Playwright (E2E multi-player), Artillery (load) |

## Milestones & timeline

**Where the numbers come from.** Every backlog task has a size (S = ½ day,
M = 1, L = 2, XL = 3 focused developer-days, including review and fixes, assuming
AI agents write the first drafts). A script walked the dependency graph and
scheduled the 100 core tasks (M0–M7). The 8 growth tasks run alongside and are excluded. It scheduled in
milestone order. A "lane" is one independent stream of work: a second developer, or
a setup where agents work in parallel and review is not the bottleneck.

| Milestone | Effort | One lane (solo) | + 25% buffer | Two lanes | + 25% buffer |
|-----------|--------|-----------------|--------------|-----------|--------------|
| M0 Legacy hotfix | 5.5 d | wk 2 | wk 2 | wk 1 | wk 1 |
| M1 Foundation | 27 d | wk 7 | wk 9 | wk 4 | wk 5 |
| M2 Rooms & racing | 27 d | wk 12 | wk 15 | wk 7 | wk 8 |
| **M3 Engagement → public beta** | 28.5 d | **wk 18** | **wk 22** | **wk 10** | **wk 12** |
| M4 AI features | 18.5 d | wk 22 | wk 27 | wk 11 | wk 14 |
| **M5 Monetization → v1.0** | 22 d | **wk 26** | **wk 33** | **wk 14** | **wk 17** |
| M6 Ranked, replays, classrooms | 20 d | wk 30 | wk 38 | wk 16 | wk 19 |
| M7 Events, hiring, admin | 12 d | wk 33 | wk 41 | wk 17 | wk 21 |
| G Growth (continuous, from beta) | 10.5 d | runs alongside | | | |

(Generated by `python3 docs/plan/tools/schedule.py`. Weeks are rounded up.)

Total core effort: **160.5 developer-days**. Plan on the **buffered** columns.

- **Working alone:** public beta in about **5 months** and v1.0 in about **7–8
  months** (week 26 raw, week 33 buffered). If that is too slow, cut scope in this order: M7, then M6, then M4's
  code mode and learn-while-typing packs. Never cut M0, M2's anti-cheat, or M5's webhook
  handling.
- **With a second lane** (a collaborator, or a setup where review is not the
  bottleneck): beta in about **3 months** (week 10–12), v1.0 in about **4 months** (week 14–17).
- The dependency graph alone (infinite lanes) bottoms out at about **6 weeks**
  (the longest chain of dependent tasks, which ends at the beta go-live), so adding lanes beyond two or three buys little. The limiting
  factors are review and integration, not typing speed.
- Milestones overlap at their edges, and M5's payment work can start before M4
  finishes. The week numbers above already include that.

Re-run the numbers whenever sizes change. The estimation script is described in
[12-agent-playbook.md](12-agent-playbook.md#4-re-planning-the-schedule).

| Milestone | Outcome | Exit criteria |
|-----------|---------|---------------|
| **M0** Legacy hotfix | Live site is safe while the rebuild happens | No XSS, no PII in public API, no crash on bad events, no secrets in logs |
| **M1** Foundation | Monorepo, CI, staging on Railway, auth, design system, typing engine | `pnpm dev` works; CI green; staging URL with guest login + solo typing test |
| **M2** Rooms & racing | Private rooms, quick match, bots, server-authoritative races | 4-player private race passes E2E; anti-cheat replay rejects forged results |
| **M3** Engagement core | Practice, profiles, stats, leaderboards, daily challenge, XP/streaks/badges, friends | **Public beta**: legacy site retired, old players can claim scores |
| **M4** AI features | Coach, adaptive drills, topic texts, code mode, moderation | AI spend per active user within budget; evals pass |
| **M5** Monetization | Stripe Pro plan, entitlements, pricing page, certificates, cosmetics | **v1.0 launch**: real payments in production; refunds/cancel tested |
| **M6** Depth | Ranked seasons, replays & ghosts, classrooms (B2B) | First paying classroom |
| **M7** B2B & events | Tournaments, projector mode, hiring assessments, admin console | First paid event / assessment customer |
| **G** Growth | SEO pages, share cards, referrals, PWA, i18n | See KPIs in [08](08-launch-and-growth.md#3-kpis) |

## How to execute this with AI agents

1. **One task ID = one branch = one PR.** Give the agent the task row from
   [07-backlog.md](07-backlog.md) plus the spec section it references. Nothing more
   is needed.
2. **Root `CLAUDE.md`** (created in task M1-01) holds the commands (dev, test,
   lint, typecheck, e2e), the architecture map, and the non-negotiable conventions
   below. Agents read it on every task.
3. **Non-negotiable conventions:**
   - Every socket event and REST body is validated with a zod schema from
     `packages/shared`. No ad-hoc payloads.
   - The server is authoritative for race text, start time, timer, and final
     scores. Clients never send a WPM that gets stored.
   - All emits are room-scoped (`io.to(roomId)`). Global `io.emit` is banned by
     a lint rule.
   - No `dangerouslySetInnerHTML` (lint rule). No user content in HTML strings.
   - Entitlement checks go through `can(user, feature)`. Never `if (user.plan === 'pro')`.
   - Secrets only come from validated env config and are never logged.
4. **Definition of Done (every PR):** CI green (typecheck, lint, unit,
   integration, and e2e when touched). New logic has tests. Docs updated if
   behavior or contracts changed. A "How to verify manually" section in the PR
   body. No new `TODO` without a backlog ID.
5. **Humans review** anything touching auth, payments, anti-cheat, AI prompts,
   data deletion, or migrations, before merge.
6. **Order matters.** Respect the `Deps` column in the backlog. Tasks without
   mutual deps can run in parallel agent sessions.
