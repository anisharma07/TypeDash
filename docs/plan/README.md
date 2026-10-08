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

The estimates assume one developer directing AI agents full-time. Calendar weeks
are cumulative.

```
Week:  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22
M0  ███                                                                                       Legacy hotfix
M1      ███████                                                                               Foundation
M2              ███████████                                                                   Rooms & racing
M3                          ███████████                                                       Engagement core
                                       ▲ Public beta (week 10)
M4                                      ███████████                                           AI features
M5                                              ███████████                                   Monetization
                                                           ▲ v1.0 launch (week 15)
M6                                                          ███████████                       Ranked, replays, classrooms
M7                                                                     ███████████████        Events, hiring, admin
G   ─────────────────────────────── Growth work runs continuously from beta ──────────────────
```

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
