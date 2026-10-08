# 07 — Backlog

Every task is sized for **one PR** (½–3 days for one developer working with AI
agents). Feed an agent the task row plus the referenced spec section. `Deps` must
be merged first. Tasks with no mutual dependency can run in parallel.

Legend for spec refs: `A`=00-audit, `01`…`06`=plan docs (e.g. `02§2.3` = gameplay
spec section 2.3).

---

## M0 — Legacy hotfix (week 1)

Work on the **existing** code (`app.js`, `public/`), before the monorepo
restructure. Keep the changes surgical.

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M0-01 | **Fix stored XSS.** Server-side validation of `username` (3–12, `^[A-Za-z0-9_ -]+$`) and `userAvatar` (allowlist `avatar1…15`) on `join`. Replace every `innerHTML` that contains user data in `socket.js`/`leaderboard.js` with DOM creation + `textContent`. One-off script that sanitizes existing Racer usernames | — | `?username=<img src=x onerror=alert(1)>` is rejected. Grep shows no user data reaching `innerHTML`. Existing bad names are cleaned | A B1 |
| M0-02 | **Stop the PII leak.** `/get-users-leaderboard` uses a projection (`username joinId userAvatar highScore`), correct sort, `limit(200)` per board | — | Response contains no `userContact`. Payload < 100 KB | A B2, B13 |
| M0-03 | **Crash guards.** `withUser(socket, fn)` wrapper for every handler that indexes `users`. try/catch in async DB handlers. `process.on('unhandledRejection'/'uncaughtException')` logging | — | A script that emits every event before `join` and after disconnect leaves the server running | A B4 |
| M0-04 | **Secrets & boot.** Remove the `mongoURI` log, drop deprecated mongoose options, fail fast if `MONGODB_URI` is missing. Add an `npm start` script, move `nodemon` to devDependencies, Dockerfile → `node:24-alpine` | — | Boot logs contain no credentials. `npm start` works in Docker | A B8, B18 |
| M0-05 | **Basic score sanity.** Server stores `{raceStartAt, textLength}` when the game starts. `user score` is accepted once per user per race, only if `wpm ≤ 250` and `wpm ≤ (textLength/5)/(elapsedMin)` + 10% tolerance. The rank is computed on a copy of the array | M0-03 | Console-emitting `{wpm:999}` doesn't change the DB. A second score emit in the same race is ignored | A B3, B10 |
| M0-06 | **No duplicate players on refresh.** Store `joinId` in `localStorage` after the first join and auto-rejoin by ID. Await `save()` with error handling | M0-03 | Refreshing 5× creates 1 Racer | A B9 |
| M0-07 | **Contact data safety.** Export `userContact` to an encrypted file for the owner. Stop collecting contact on the landing form (hide/remove the field) | M0-02 | No new contacts stored. The owner has an export | A B2, 03§4 |

**Exit:** deployed to the current host. Run the audit check again.

---

## M1 — Foundation (weeks 2–3)

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M1-01 | **Monorepo scaffold.** pnpm workspaces (`apps/web`, `apps/server`, `packages/shared`), move the old app to `legacy/` (still runnable), TS project refs, ESLint (+ custom rules: no `io.emit`, no `innerHTML`/`dangerouslySetInnerHTML`), Prettier, Vitest, `docker-compose.yml` (mongo, redis), root scripts (`dev`, `build`, `test`, `lint`, `typecheck`), **`CLAUDE.md`** | M0 | `pnpm i && pnpm dev` runs empty web + server. Lint rules have tests | 01§2, README |
| M1-02 | **CI workflow** (static, unit, build jobs). Branch protection on `main` | M1-01 | A PR with a type error fails CI | 06§3 |
| M1-03 | **Server skeleton.** zod config, pino logger, Express 5, helmet (CSP), compression, `/api/health` + `/api/ready`, error middleware, Mongo + Redis clients, graceful shutdown, Socket.IO bootstrap (cors = APP_URL, `maxHttpBufferSize`), static SPA serving with history fallback | M1-01 | Missing env var → process exits with a clear message. `/api/ready` reflects DB/Redis state | 06§2.2, 06§5 |
| M1-04 | **Railway + Atlas staging.** Multi-stage Dockerfile, Railway project (web, redis), staging env, Atlas staging cluster, custom staging domain, PR environments, Sentry (web + server, source maps from CI) | M1-03 | Push to `main` → staging deploys after CI. A PR gets a preview URL. A thrown test error shows in Sentry with a readable stack | 06§1–2 |
| M1-05 | **Typing engine** in `packages/shared/engine`: state machine, strict/lenient, metrics, per-key/bigram stats, timeline, `replay()`. ≥ 95% coverage + fast-check property tests | M1-01 | All edge cases in 02§1.2 are tested. `replay(log)` equals the live state for 1,000 random sessions | 02§1 |
| M1-06 | **Shared contracts.** zod schemas + TS types for all socket events (02§2.3), REST DTOs (03§3, M1–M3 subset), `RoomSettings`, constants (modes, limits, avatars, feature keys) | M1-01 | Server and web compile against the same types. Invalid payload tests | 02§2.3, 03§3 |
| M1-07 | **Auth.** Better Auth + MongoDB adapter: anonymous (guest) sessions created on first visit, Google + GitHub OAuth, email magic link (Resend). `Profile` creation with a random space-themed handle. Guest → account upgrade **keeps all data**. Socket handshake auth via session cookie | M1-03, M1-06 | First visit = guest session automatically. Upgrade via Google keeps race history. Socket connections without a session are rejected | 01§4, 03§1.1 |
| M1-08 | **Web shell & design system.** Vite + React + TS + Tailwind + shadcn/ui, React Router, TanStack Query, Zustand, theme tokens (space-dark, light, high-contrast), layout/nav, error boundary, Sentry + PostHog init, optimized assets (legacy PNGs → WebP/SVG, avatars ≤ 20 KB each) | M1-01 | Lighthouse perf ≥ 90 / a11y ≥ 95 on the shell. Total landing weight < 1 MB | 01§5 |
| M1-09 | **`<TypingArea/>`** on top of the engine: word rendering, GPU caret, 3-line scroll, focus overlay, shortcuts (`Tab` restart, `Esc`, `?` help), caps-lock warning, paste blocked, mobile `visualViewport` handling, `isTrusted` counter | M1-05, M1-08 | < 4 ms JS per keystroke (Chrome perf profile, mid-tier Android emulation). Works on iOS Safari + Android Chrome | 01§4–5 |
| M1-10 | **Text pipeline v1.** `Text` model, import script for a curated **public-domain** quote set (~500, attribution kept), word lists (200/1k/5k), difficulty scorer, `GET /api/texts/next` | M1-03 | Quotes import idempotently. Every text has a difficulty band | 02§4, A B19 |
| M1-11 | **Solo practice MVP** `/practice`: time (15/30/60/120) and words (10/25/50/100) and quote modes → results screen (WPM, raw, acc, consistency, chart, errors) → `POST /api/practice/results` (server replay → `RaceResult`) | M1-07, M1-09, M1-10 | A forged log with impossible timings is rejected. A valid result is stored and shown in history | 02§1, 02§3.3 |
| M1-12 | **Settings** page + `PATCH /api/me` (display name with moderation layer 1, avatar, theme, caret, sounds, reduced motion, timezone auto-detect) | M1-07, M1-08 | Settings persist across devices for registered users and in-session for guests | 03§3 |

**Exit:** staging URL where a guest can do a solo test with stored results. CI is green.

---

## M2 — Rooms & racing (weeks 4–6)

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M2-01 | **Room FSM** (`rooms/Room.ts`): states, start conditions, timings, host migration, spectators, kick, settings reset of ready; injected clock + RNG | M1-06 | Unit tests cover every transition + edge case in 02§2.2 | 02§2.1–2.2 |
| M2-02 | **RoomManager**: code generation (Crockford base32, collision-checked), create/join/leave, empty-room cleanup (5 min), per-user/per-IP caps | M2-01 | 10k create/destroy cycles leave no leaked timers or rooms | 02§2.2 |
| M2-03 | **Socket room handlers**: all `room:*` events with zod validation, acks, per-event rate limits, `room:snapshot` + `room:patch`, room-scoped emits only | M2-02, M1-07 | Integration test: two rooms racing concurrently never see each other's events | 02§2.3 |
| M2-04 | **Time sync** (`time:ping` + client offset estimator in `web/lib/time-sync.ts`) | M1-03 | Simulated 200 ms RTT gives an offset error < 20 ms | 02§2.3 |
| M2-05 | **Race loop**: `race:countdown` with `startAt/endAt`, `race:progress` plausibility checks, a 5 Hz `race:tick` broadcaster with server-computed WPM, finish/DNF/end conditions | M2-03, M2-04, M1-05 | 20-player room: tick loop lag p95 < 10 ms. Progress faster than 30 chars/s is dropped and flagged | 02§2.4, 02§3.1 |
| M2-06 | **Result validation & persistence**: `race:finish` log decode, replay, cross-checks, soft flags, `Race`/`RaceResult` persistence, places | M2-05 | Forged log / edited timestamps / mismatched progress → rejected (tests for each rule in 02§3.2) | 02§3.2 |
| M2-07 | **Lobby UI** `/r/:code`: create room flow, player cards, ready toggle (`Enter`), host settings panel, invite link copy + **QR**, kick/transfer, spectator list, "room not found" page | M2-03, M1-08 | 2 browsers: create → share link → join in 1 click as guest | 01§4, 01§5 |
| M2-08 | **Race UI**: track with avatars on a space path, **traffic-light countdown** (legacy identity), live positions, finish animation, results (ranking, WPM/acc, chart), **Rematch** | M2-05, M2-07, M1-09 | 4-player race renders smoothly at 5 Hz updates with no full-tree re-renders (React profiler) | 01§5 |
| M2-09 | **Reconnect & seat hold**: session-token rejoin within 30 s, resume race state (text, own progress from server), DNF after timeout | M2-05 | Playwright: go offline 5 s mid-race → continues. 40 s offline → DNF | 02§2.2 |
| M2-10 | **Quick match** `/play`: public matchmaker (join an open LOBBY or create one), auto-start rules, "Next race" loop | M2-05 | Two guests clicking Play within 10 s land in the same race | 02§2.2 |
| M2-11 | **BotDriver + bot fill** (8 s alone → bots), always labeled, no XP/boards | M2-10 | Bots finish within ±5% of target WPM over 100 simulated races | 02§5 |
| M2-12 | **Room chat + emotes** (LOBBY/RESULTS only), moderation layer 1, mute, report | M2-03 | Chat blocked during RACING. Rate limits enforced. Reports create a `ModerationFlag` | 04§2.5 |
| M2-13 | **Invite unfurls**: `GET /api/rooms/:code/preview` + OG image for `/r/:code` | M2-02 | Pasting the link in WhatsApp/Discord shows "Join X's TypeDash room" | 03§3 |
| M2-14 | **E2E suite** for rooms (4-player private race, quick match + bots, reconnect, forged finish rejected, kick) | M2-08…M2-11 | Runs in CI in < 6 min | 06§6 |
| M2-15 | **Load test** harness (Artillery Socket.IO) + first run on a staging instance sized like production. Fix hotspots | M2-05 | 2,000 simulated racers / 200 rooms, tick lag p95 < 50 ms, no memory growth over 10 min | 06§8 |

**Exit:** private rooms + quick match + bots on staging. E2E + load criteria met.

---

## M3 — Engagement core → **Public beta** (weeks 7–9)

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M3-01 | **Worker service**: BullMQ setup, `worker.ts`, Railway service, repeatable jobs framework, job dashboard (admin-only) | M1-04 | Jobs survive a worker restart. Failed jobs retry with backoff | 06§2 |
| M3-02 | **Progression pipeline**: after an accepted result, compute XP/level, PB update, leaderboard zset writes, `xpGained` in `race:results` | M2-06, M3-01 | XP formula + anti-farm rules tested. Results payload includes progression in < 300 ms p95 | 02§6.1, 02§6.5 |
| M3-03 | **Streaks** with user timezones, freezes, nightly reset job, opt-in reminder email | M3-02 | Tests across DST changes and UTC±14 zones | 02§6.2 |
| M3-04 | **Achievements** engine + initial ~25 badges + unlock toasts + profile display | M3-02 | Idempotent: replaying the same result never double-awards | 02§6.3 |
| M3-05 | **Leaderboards** API + UI (daily/weekly/all-time/friends × mode/duration/lang/device, "my rank"), worker snapshot of closed boards | M3-02 | Board query p95 < 50 ms with 100k entries. Flagged results excluded | 02§6.5, 03§2 |
| M3-06 | **Daily challenge**: worker picks the text at 00:00 UTC, `/daily` page, server-started ranked attempt, unlimited practice, daily board, countdown, share | M3-01, M3-05 | One ranked attempt per user per day enforced server-side | 02§3.3, 03§3 |
| M3-07 | **Stats**: `UserStatsDaily` aggregation job, `GET /api/me/stats`, `/stats` page (WPM/acc over time, per-key heatmap on a keyboard, slow bigrams), **rule-based coach card** | M3-01 | `/stats` loads < 1 s for a user with 2,000 races | 02§1.2, 04§2.1 |
| M3-08 | **Profiles & result pages**: `/u/:handle`, `/race/:id`, OG images (satori + resvg) | M3-02 | Shared result link shows a rich preview card | 01§4 |
| M3-09 | **Friends**: requests, accept/block, list with presence, invite to room (real-time `notify`), friends board | M3-05 | Invite toast arrives in < 1 s. Blocked users can't invite | 03§1.1 |
| M3-10 | **Landing page** redesign: Play now / Practice / Create room, daily card, streak and level for returning users, SEO meta. The marketing route is prerendered | M1-08, M3-06 | Time-to-first-race < 15 s for a new visitor (PostHog funnel) | 01§5 |
| M3-11 | **Guest upgrade nudges**: XP cap at 1,000 for guests, "save your progress" prompts after the 3rd race and after a PB | M1-07, M3-02 | Funnel event `guest_upgraded` tracked | 02§6.1 |
| M3-12 | **Admin v1**: `/admin` (role-gated, 2FA): flagged results queue, ban/shadow-ban, text moderation, reports | M2-06 | Approving a flagged result puts it on boards. All admin actions are in `AuditLog` | 02§3.2 |
| M3-13 | **Legal & privacy**: privacy policy, terms, cookie/analytics consent, `DELETE /api/me`, `GET /api/me/export` | M1-07 | Deletion anonymizes results and removes the profile. Export returns all user data | 06§5, 08§6 |
| M3-14 | **Legacy migration**: migrate script, Hall of Fame board, claim-by-joinId flow (cosmetic only), redirects from old URLs, delete legacy contact field | M3-05, M0-07 | Dry-run report matches counts. Each claim works once | 03§4 |
| M3-15 | **Beta go-live**: production Railway env, Atlas production cluster, monitoring and alerts (06§4), load test on production config, DNS cutover, remove `legacy/` from deploy | all M3 | Go-live checklist signed off. Rollback rehearsed | 06 |

**Exit = Public beta.** Measure the KPIs in 08 for 2 weeks before monetizing.

---

## M4 — AI features (weeks 10–12)

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M4-01 | **AI module**: Anthropic SDK client, per-feature model/effort config, structured outputs + zod validation, refusal handling with server-side fallback, typed error handling, `AiUsage` logging, monthly budget cap, kill switches, per-user quotas (Redis) | M3-01 | Budget at 100% → features return fallbacks, not errors. Each call logged with cost | 04§1 |
| M4-02 | **AI eval harness** `pnpm eval:ai` + golden sets (coach, topics, moderation) | M4-01 | Produces a pass/fail report per feature against the thresholds in 04§5 | 04§5 |
| M4-03 | **Moderation layer 2** (AI) for borderline names/texts/topics + review queue integration | M4-01 | Precision/recall ≥ 95% on the labeled set | 04§2.5 |
| M4-04 | **AI Coach**: prompt v1, schema, numeric-grounding check + one regeneration, caching (≥ 10 new races), quotas, coach card UI on `/stats` + after every 10th race, fallback to rule-based | M4-01, M3-07 | Evals pass. 20 human-reviewed reports judged useful. p95 latency < 15 s with a streaming/progress UI | 04§2.1 |
| M4-05 | **Adaptive drills v1** (deterministic sampler) + drill player + per-target improvement tracking | M3-07 | Drill text has ≥ 40% words containing targets. Improvement chart works | 04§2.2 |
| M4-06 | **Adaptive drills v2** (AI sentences, gated by `ai.drill`; entitlement stub until M5) | M4-01, M4-05 | Target coverage check + fallback to v1 tested | 04§2.2 |
| M4-07 | **Topic texts for rooms**: host UI in the settings panel, moderation → cache → generation → validation → moderation → `Text` | M4-03, M2-07 | Adversarial topic set is blocked. Cache hits cost $0 | 04§2.3 |
| M4-08 | **Code mode**: engine support (newline/indent auto-skip), curated seeds (JS, Py, Java, C++, SQL, Go), parse validation, practice + room text type | M1-05 | Code passages type correctly with auto-indent. Invalid snippets are rejected at ingest | 02§1.3, 04§2.4 |
| M4-09 | **Nightly batch pools** (Message Batches API from the worker): topic pools, code snippets, drill sentences | M4-01, M4-08 | A batch job completes and texts land as `pending` → auto-moderated → `approved` | 04§1, 04§2 |
| M4-10 | **Bot personas** batch + lobby lines + emotes | M4-01, M2-11 | 200 personas stored as static JSON. No AI calls at race time | 04§2.6 |
| M4-11 | **AI admin dashboard**: spend per feature/day, failure rate, sample outputs for spot-review, prompt version comparison | M4-01, M3-12 | Shows yesterday's spend within 1% of `AiUsage` totals | 04§1 |

---

## M5 — Monetization → **v1.0 launch** (weeks 12–14)

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M5-01 | **Entitlements**: feature constants, `getEntitlements()`, `can()/limit()` on server and client, Redis cache + invalidation. Replace all ad-hoc gates | M1-07 | Unit tests for every row of the matrix in 05§2 | 05§2 |
| M5-02 | **Stripe catalog as code** + `pnpm stripe:sync` (test and live) | M5-01 | Running it twice is a no-op. Lookup keys resolve | 05§3.1 |
| M5-03 | **Checkout**: `POST /api/billing/checkout`, `BillingCustomer`, success page polling, guest → sign-up gate | M5-02 | Test card → redirect → success page shows Pro after the webhook | 05§3.2 |
| M5-04 | **Webhooks**: raw-body route, signature verification, idempotency (`StripeEvent`), subscription sync (re-fetch), grace period, refunds/disputes, async side-effects via jobs | M5-02, M3-01 | Duplicate and out-of-order fixture deliveries produce the correct final state | 05§3.3 |
| M5-05 | **Billing self-service**: Customer Portal session, `/billing` page (plan, renewal date, invoices link) | M5-04 | Cancel in the portal → access until period end → Free | 05§3.4 |
| M5-06 | **Pricing page + paywall moments** (contextual upgrade cards at limits: coach quota, room size, history, themes) + analytics events | M5-01 | Funnel `paywall_viewed → checkout_started → checkout_completed` visible in PostHog | 05§5 |
| M5-07 | **Pro perks wiring**: 50-player rooms, full history, Pro themes/avatars, streak freezes, room branding, no ads | M5-01 | Each perk toggles correctly when a subscription starts or ends (integration tests) | 05§2 |
| M5-08 | **Cosmetics store**: `Inventory`, catalog, purchase via Checkout (payment mode), equip UI, season/level unlock sources | M5-04 | A purchased item appears in < 5 s after the webhook. A refund revokes it | 05§1 |
| M5-09 | **Verified certificate**: proctored flow (fullscreen, focus-loss + paste detection, strict replay validation, 2 attempts), PDF (server-rendered), `/cert/:id` verification page, LinkedIn "add to profile" link | M5-04, M2-06 | Tampered attempts fail. The verification page shows the issue date + WPM + accuracy | 05§1 |
| M5-10 | **Ads** (free tier only) with a consent management platform, lazy-loaded, never on typing or race screens or for students | M5-01 | Lighthouse budgets still pass. Ads are absent for Pro, Teacher, and School | 05§4 |
| M5-11 | **Payments QA**: Stripe test clocks (renewal, failed payment → grace → cancel), Playwright checkout on staging, refund policy page, tax setup review | M5-03…M5-05 | All scenarios in 05§3.6 pass | 05§3.5–3.6 |
| M5-12 | **Production hardening for v1.0**: Atlas production on a dedicated tier with continuous backup + **restore drill**, security CI job blocking, live Stripe keys, launch checklist (08§1) | M5-11 | Restore drill documented with timings. Checklist signed off | 06§5, 08§1 |

**Exit = v1.0 launch** (see 08§1).

---

## M6 — Depth: ranked, replays, classrooms (weeks 15–18)

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M6-01 | **Ranked**: OpenSkill ratings, placement (5), tiers, matchmaker queue with widening bands, `/ranked` UI, rating delta on results | M2-10, M3-02 | Simulation: 10k synthetic players converge (ordinal correlates with true skill > 0.9) | 02§6.4 |
| M6-02 | **Seasons**: rollover job, soft reset, tier rewards → `Inventory` | M6-01, M5-08 | Season end is idempotent. Rewards are granted once | 02§6.4 |
| M6-03 | **Replays**: keylog retention policy (PBs, flagged, certificates, last N for Pro), replay player on `/race/:id` | M2-06 | The replay renders the same final state as the original | 02§1, 03§1.3 |
| M6-04 | **PB ghost racing** in practice (race against your best run's keylog) | M6-03 | The ghost caret follows the recorded timing within ±1 frame | — |
| M6-05 | **Organizations & roles** (owner/admin/teacher/member), org switching UI | M5-01 | Role checks covered by tests on every org route | 03§1.5 |
| M6-06 | **Teacher plan & classrooms**: create class, join code, **student accounts without email** (teacher-managed, for under-13s), roster management | M6-05 | Students under 13 have no email, no public profile, no chat with non-classmates, no ads | 05§2, 08§6 |
| M6-07 | **Assignments & reports**: targets + due dates, completion tracking, live class race, CSV/PDF reports | M6-06 | A teacher sees per-student progress. Exports open in Excel/Sheets | 03§1.5 |
| M6-08 | **School seat billing**: quantity subscriptions, seat assignment, invoicing for POs | M6-05, M5-04 | Changing the seat count prorates correctly (test clock) | 05§3.4 |
| M6-09 | **Learn-while-typing packs** (batch-generated, admin-reviewed, Pro/cosmetic gating) | M4-09 | Pack quiz flow works. Admin approval required to publish | 04§2.7 |
| M6-10 | **Ask your stats** (Pro): Claude with pre-defined stats tools, rendered answers + mini charts | M4-01, M3-07 | Tools never expose other users' data (tests) | 04§2.8 |

---

## M7 — B2B & events (weeks 18–22)

| ID | Task | Deps | Acceptance criteria | Spec |
|----|------|------|---------------------|------|
| M7-01 | **Tournaments**: create, registration + check-in, single/double elimination + Swiss, auto room per match, result propagation, bracket UI `/t/:slug` | M2-05, M6-05 | A 32-player double-elimination bracket completes end-to-end in E2E with bots as players | 03§1.5 |
| M7-02 | **Projector & streamer mode**: big-screen live view `/t/:slug/live` and `/r/:code/live`, OBS overlay URL, streamer mode (hide names) | M7-01 | Readable at 1080p from 5 m. 60 fps animations on a mid laptop | — |
| M7-03 | **Event branding & Event Pass**: logo, colors, sponsor slot, purchase via Checkout, **encrypted** prize-contact collection (organizer-only export) | M7-01, M5-04 | Contacts encrypted at rest and never in public APIs (test) | 05§1, 06§5 |
| M7-04 | **Hiring assessments**: builder, candidate invite links (token), proctored test, results dashboard with integrity signals, assessment packs billing | M5-09, M6-05 | A candidate takes a test without an account. The company sees validated results only | 03§1.5 |
| M7-05 | **Admin console v2**: users, orgs, invoices, text library, feature flags, impersonation (read-only, audited) | M3-12 | Every admin action audited | 06§5 |

---

## G — Growth (continuous from beta)

| ID | Task | Deps | Acceptance criteria |
|----|------|------|---------------------|
| G-01 | **SEO pages** (prerendered): "typing test" (1/3/5 min), "typing test for kids", "code typing test", "typing speed test in Hindi/Spanish", sitemap, structured data, internal linking | M3-10 | Pages are indexable, LCP < 2 s, each has a live embedded test |
| G-02 | **Share flows**: one-tap share of results/PBs/achievements (Web Share API + X/WhatsApp/Instagram story image) | M3-08 | `result_shared` event. The shared link brings new users (UTM) |
| G-03 | **Referrals**: invite link → friend completes 3 races → both get a cosmetic, or 1 week of Pro | M5-08 | Fraud checks (same device/IP limits) |
| G-04 | **PWA**: installable, offline solo practice, app icons | M1-11 | Lighthouse PWA checks pass. Practice works offline |
| G-05 | **i18n**: react-i18next, UI translations (es, pt, hi, fr, de), language word lists + quote sets, Devanagari input support in the engine | M1-05 | A language switch changes UI + texts. Hindi typing works with standard IMEs |
| G-06 | **Lifecycle email** (opt-in): welcome, streak at risk, weekly digest, friend beat your PB | M3-03 | Unsubscribe in one click. Sends respect timezones |
| G-07 | **Community**: Discord server, weekly community tournament (M7-01), monthly typing events with sponsors | M7-01 | — |
| G-08 | **Content**: typing tips blog (guides on touch typing, WPM benchmarks by profession), linked from the coach | G-01 | — |
