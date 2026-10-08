# TypeDash — Implementation Plan

> Goal: turn TypeDash from a single global race room into a typing platform people
> come back to daily, that supports private rooms, uses AI where it actually helps,
> and has clear ways to make money.
>
> This plan is meant to be implemented by AI coding agents (or humans) **one task at
> a time**. Every task has an ID, scope, and acceptance criteria so it can become a
> single, reviewable pull request.

---

## 0. Where the project is today (audit summary)

**Stack:** Node.js + Express + Socket.IO + MongoDB (Mongoose), with a vanilla
HTML/CSS/JS frontend (`public/`). About 5.3k lines. No tests, no lint, no build step.

**How it works now:** every connected socket goes into one global `users` array
(`utils/functions.js`). All events go out with `io.emit` to everyone. A race starts
only when **every** connected user is ready. The client keeps its own timer and
works out its own WPM, then sends it to the server, which saves it as a high score.

### 0.1 Bugs and risks found (ordered by severity)

| # | Severity | Issue | Where |
|---|----------|-------|-------|
| B1 | 🔴 Critical | **Stored XSS.** `username` comes from the URL query string, is saved to the DB, and is rendered with `innerHTML` in the race track and on the leaderboard for *every* visitor. The `maxlength=10` limit exists only on the client. | `public/js/socket.js`, `public/js/leaderboard.js`, `app.js` `join` |
| B2 | 🔴 Critical | **PII leak.** `GET /get-users-leaderboard` returns every full Racer document, including `userContact` (phone/email/Instagram that players typed in for prizes). | `app.js:29` |
| B3 | 🔴 Critical | **Trivial cheating.** The server trusts any `wpm` value sent in `user score` and `progress`. Running `socket.emit("user score",{wpm:999,quoteLevel:1})` in the console tops the leaderboard. | `app.js` `user score`, `progress` |
| B4 | 🔴 Critical | **Server crash.** Handlers do `users[getUserIndex(socket.id)].x = …` with no check. If the index is `-1` (an event arrives after disconnect, or a client sends events before `join`), this throws a `TypeError` that can take down the whole Node process. | `app.js` `ready status`, `not ready`, `leave match`, `progress`, `user score` |
| B5 | 🔴 Critical | **Account takeover.** "Log in" is just a guessable 6‑digit `joinId`. Anyone can log in as anyone and post scores under their name. | `join by Id` |
| B6 | 🟠 High | **One idle tab blocks everyone.** A race needs *all* global users to be ready, so one AFK player freezes the whole site. | `ready status` |
| B7 | 🟠 High | **Joining mid-race breaks the race.** `add user progress` re-renders every progress bar for all clients, which wipes their positions. Late joiners also have `leaveMatch` undefined, so `end game on request` never fires. | `join`, `leave match` |
| B8 | 🟠 High | **The DB connection string (with password) is logged** on every boot. | `utils/functions.js:4` |
| B9 | 🟠 High | Every `join` creates a **new Racer document**, even for the same person. `save()` is neither awaited nor error-handled, and the `playerIds` uniqueness cache is loaded asynchronously, so collisions are possible on boot. | `app.js` `join`, `utils/functions.js` |
| B10 | 🟡 Medium | `get rank` **sorts the shared `users` array in place** (it mutates server state) and ranks by the client-supplied WPM. | `app.js` `get rank` |
| B11 | 🟡 Medium | WPM is `counter/5 * 60/timepassed`. Ending in the first second (leaving the match) divides by 0, which gives `Infinity`/`NaN`. Accuracy ignores corrected errors and extra letters. | `multiplayer.js` `setWPM`, `showSummary` |
| B12 | 🟡 Medium | Race start and timer are client-side `setTimeout`s, so latency and tab throttling mean players start at different times. | `socket.js` `start game` |
| B13 | 🟡 Medium | The leaderboard query sorts by `highscore`, a field that doesn't exist (`highScore.*`), and it returns the whole collection with no limit. | `app.js:30` |
| B14 | 🟡 Medium | Device category (`Device=mobile`) is a URL param chosen by window width, so it's spoofable and separate mobile/laptop boards are easy to game. | `index.js`, `socket.js` |
| B15 | 🟢 Low | Dead code and unused exports (`checkIfunique`, `setWordspermin`, `getCurrentUser`, `SpaceHitScore`, `game users` event with no listener). `updateMany` vs `updateOne` is inconsistent. Mongoose options are deprecated. | various |
| B16 | 🟢 Low | Backspace into the previous word is commented out. Accuracy and caret logic are tangled with DOM state. | `multiplayer.js` |
| B17 | 🟢 Low | **About 14 MB of images and videos** (several PNGs are 1–1.8 MB). The free Render tier has cold starts of a minute or more. Both hurt first impressions and SEO. | `public/images`, hosting |
| B18 | 🟢 Low | `nodemon` is a prod dependency, there's no `start` script, the image is `node:18` (EOL), and compose bind-mounts source in "prod" profiles. | `package.json`, `Dockerfile` |

---

## 1. Product vision & positioning

**One-liner:** *"Race your friends, train with an AI coach, and prove your speed."*

Three audiences, in priority order for revenue:

1. **Casual and competitive typists (B2C):** quick races, private rooms with friends,
   ranked ladder, daily challenge, streaks. Monetized with **Pro subscription +
   cosmetics + light ads**.
2. **Educators and schools (B2B):** classrooms, assignments, progress reports. They
   pay per seat per year. Of the three, this group is the **most reliable income**.
3. **Event organizers and companies (B2B):** this was TypeDash's original use case.
   Branded tournaments, hiring typing assessments, verified certificates. They pay
   **per event or per assessment**.

Monetization is designed in from Phase 2 onward but **switched on only after
retention is proven** (Phase 4). Don't paywall before people love it.

---

## 2. Target architecture

Keep what works (Node, Express, Socket.IO, MongoDB) and add structure, type safety,
and a real frontend build.

```
typedash/
├─ server/                 # Node + Express + Socket.IO (TypeScript)
│  ├─ src/
│  │  ├─ app.ts            # express app, middleware (helmet, rate-limit, compression)
│  │  ├─ socket/           # socket handlers split by domain (room, race, chat)
│  │  ├─ rooms/            # RoomManager + Room state machine (pure, unit-tested)
│  │  ├─ race/             # text selection, scoring, anti-cheat validation
│  │  ├─ ai/               # AI text generation, coach, moderation (provider wrapper)
│  │  ├─ auth/             # sessions, OAuth, guest accounts
│  │  ├─ models/           # Mongoose models
│  │  ├─ routes/           # REST: /api/leaderboard, /api/me, /api/rooms, /api/stats …
│  │  └─ lib/              # logger (pino), config (zod-validated env), errors
│  └─ test/
├─ client/                 # Vite + React + TypeScript + Tailwind
│  └─ src/
│     ├─ engine/           # typing engine (pure TS, no DOM) – unit tested
│     ├─ features/         # race, lobby, practice, profile, leaderboard, coach …
│     └─ components/       # design-system primitives
├─ shared/                 # socket event contracts + zod schemas shared both sides
└─ e2e/                    # Playwright multi-browser race tests
```

**Key decisions (recommended):**

- **TypeScript + shared zod schemas for every socket event.** Most bugs B1–B4 come
  from unvalidated payloads. Shared types also make AI-written code much safer,
  because the compiler catches contract drift.
- **React + Vite on the frontend.** The app is about to grow from 2 pages to 10+
  (lobby, room, practice, profile, stats, pricing, classroom, admin). A component
  framework pays for itself there, and it's the stack AI agents are most reliable in.
  The current typing engine is ported into a framework-agnostic `engine/` module.
  *Alternative if you want to stay vanilla:* Vite + TS modules. Everything else in
  the plan still applies.
- **Server-authoritative races.** The server owns the text, start time, timer, and
  final scores. Clients send progress events; the server computes WPM.
- **Redis** (when scaling past 1 instance) for the Socket.IO adapter, room state,
  rate limits, and daily-challenge leaderboards (sorted sets).
- **Hosting:** move off the free tier (cold starts kill multiplayer). Use
  Fly.io/Railway/Render paid with sticky sessions + MongoDB Atlas + Redis (Upstash).
- **Observability:** pino logs, Sentry errors, PostHog product analytics. You can't
  improve retention you don't measure.

### 2.1 Core data model

| Model | Purpose | Key fields |
|-------|---------|-----------|
| `User` | Account (guest or registered) | `handle`, `displayName`, `avatar`, `authProviders[]`, `isGuest`, `plan`, `xp`, `level`, `rating` (MMR), `streak`, `settings`, `createdAt` |
| `Text` | Passages to type | `content`, `language`, `difficulty`, `source` (`curated`/`ai`/`custom`), `tags`, `moderation` |
| `Race` | One completed race | `roomId`, `mode`, `textId`, `startedAt`, `durationMs`, `participants[]` |
| `RaceResult` | Per-player result | `userId`, `raceId`, `wpm`, `rawWpm`, `accuracy`, `consistency`, `charStats`, `keystrokeSummary`, `flagged`, `device` |
| `PersonalBest` | Fast leaderboard reads | `userId`, `mode`, `duration`, `language`, `wpm`, `raceResultId` |
| `DailyChallenge` | One text per day | `date`, `textId`, leaderboard (Redis zset, snapshot to Mongo) |
| `Achievement` / `UserAchievement` | Badges | `code`, `criteria`, `unlockedAt` |
| `Subscription` | Payments | `userId`, `provider`, `status`, `plan`, `currentPeriodEnd` |
| `Organization` / `Classroom` / `Assignment` | B2B | members, roles, assignment targets, due dates |
| `Tournament` | Events | bracket, rounds, rooms, branding |

Rooms in progress are **ephemeral** (memory/Redis). Only finished `Race`/`RaceResult`
records are persisted.

### 2.2 Room & race state machine (server)

```
            create/join                 host starts / all ready / auto-timer
  (none) ───────────────► LOBBY ─────────────────────────────────► COUNTDOWN (3s, server startAt)
                            ▲                                               │
                            │ rematch                                       ▼
                         RESULTS ◄──── all finished / time up / all left ── RACING
```

- **LOBBY:** players join and leave, toggle ready, host edits settings. Late joiners
  during COUNTDOWN/RACING become **spectators** and auto-join the next round.
- **COUNTDOWN:** the server broadcasts `startAt` (epoch ms) plus the text. Clients
  render a countdown against the server clock (with offset measured by a ping
  handshake).
- **RACING:** clients send `progress {charIndex, errors, t}` at most about 5×/s.
  The server validates that progress is monotonic and plausible and rebroadcasts a
  compact snapshot about 5×/s (throttled, not per keystroke).
- **RESULTS:** the server computes the final WPM and accuracy, persists the results,
  updates ratings, XP, and streaks, and emits a results payload.
- **Public rooms** use an auto-start timer (for example, 10 s after 2+ players are in
  the lobby, or when everyone's ready). Nobody can block a race by idling (fixes B6).

---

## 3. Phased roadmap

Each phase ships something users can feel. Rough effort assumes one developer
directing AI agents.

| Phase | Theme | Outcome | Est. |
|-------|-------|---------|------|
| **P0** | Stabilize & secure | No crashes, no XSS, no PII leak, no trivial cheating | 3–5 days |
| **P1** | Rooms & modern foundation | Private and public rooms, server-authoritative races, new frontend shell | 2–3 weeks |
| **P2** | Engagement core | Accounts, solo practice, stats, daily challenge, streaks, XP, ranked | 3–4 weeks |
| **P3** | AI features | AI coach, adaptive drills, topic text generation, smart bots | 2–3 weeks |
| **P4** | Monetization | Pro plan, payments, ads, cosmetics, certificates | 2 weeks |
| **P5** | B2B & events | Classrooms, tournaments, hiring assessments | 3–4 weeks |
| **P6** | Growth | SEO pages, share cards, PWA, i18n, referrals | ongoing |

---

### Phase 0 — Stabilize & secure (do this first, on the current codebase)

These are small, surgical fixes to the **existing** code so the live site is safe
while the bigger work happens.

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P0-1 | **Kill XSS.** Validate `username` on the server (3–12 chars, `^[A-Za-z0-9_ -]+$`) and `userAvatar` against an allowlist (`avatar1…avatar15`). On the client, replace `innerHTML` with `textContent`/DOM creation wherever user data is rendered. Sanitize existing DB records with a one-off script. | Joining with `?username=<img src=x onerror=alert(1)>` is rejected. No user-controlled string reaches `innerHTML`. |
| P0-2 | **Stop the PII leak.** The leaderboard endpoint uses a projection (`username, joinId, userAvatar, highScore`), sorts correctly, and has `limit(100)`. | Response has no `userContact`. Payload stays under 50 KB with many users. |
| P0-3 | **Crash-proof handlers.** Add a `withUser(socket, fn)` guard that no-ops when the user isn't found. Wrap async handlers in try/catch. Add `process.on('unhandledRejection')` logging. | Fuzzing every event before `join` and after disconnect never crashes the server. |
| P0-4 | **Basic anti-cheat now.** The server stores the race text and start time. `user score` is recomputed from server-side elapsed time and the last reported `charIndex`, rejects WPM above 250 or progress jumps above 30 chars/s, and accepts a score only once per race per user. | The console-emit cheat no longer changes the leaderboard. |
| P0-5 | Remove the `mongoURI` log. Use `MONGODB_URI` from env without deprecated options. Fail fast if it's missing. | Boot logs contain no credentials. |
| P0-6 | Fix the WPM divide-by-zero (`timepassed <= 0` → 0). Make `get rank` sort a **copy**, ranked by server-computed WPM. | No `Infinity`/`NaN` in UI or DB. |
| P0-7 | Don't create a new Racer on every `join`. Use `findOneAndUpdate` with upsert for the session's player. Handle DB errors. | Refreshing doesn't create duplicate leaderboard rows. |
| P0-8 | Rate-limit socket events (per-socket token bucket) and add `helmet` + `compression`. | Spamming `progress` 1000×/s is throttled. |
| P0-9 | Tooling: add an `npm start` script, move `nodemon` to devDependencies, use the `node:22-alpine` image, add ESLint + Prettier, and a GitHub Actions CI for lint and test. | CI is green on PRs. |
| P0-10 | Compress images to WebP/AVIF, lazy-load non-critical images, move the demo video out of the repo (YouTube/CDN). | Landing page weight drops below 1.5 MB and Lighthouse performance is at least 85. |

---

### Phase 1 — Rooms & modern foundation

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P1-1 | **Monorepo scaffold:** `server/` (TS), `client/` (Vite + React + TS + Tailwind), `shared/` (zod event schemas), Vitest, Playwright, and a root `npm run dev` that starts both. | `npm run dev` serves the new client and proxies the socket. CI runs typecheck, lint, and test. |
| P1-2 | **Typing engine port.** Move the typing logic from `multiplayer.js` into `client/src/engine/` as a pure state machine (`input → state`): correct, incorrect, extra, missed, backspace across words (optional setting), and caret position. Use standard metrics: **WPM = correct chars / 5 / minutes**, **raw WPM**, **accuracy = correct keystrokes / total keystrokes**, **consistency** (stddev of per-second WPM). | At least 30 unit tests cover edge cases. Metrics match a reference implementation within ±1. |
| P1-3 | **Room state machine** (`server/src/rooms/Room.ts`): pure class implementing §2.2, with injected clock and RNG for testability. `RoomManager` handles create, join, leave, cleanup of empty rooms after 5 min, and a cap on rooms per IP. | Unit tests cover every transition, including host leaving (host migrates), everyone leaving, and late joiner → spectator. |
| P1-4 | **Socket layer on rooms:** use `socket.join(roomId)` and `io.to(roomId).emit`. Never broadcast globally. All payloads are validated with shared zod schemas. | Two private rooms racing at the same time don't see each other's events (Playwright test with 4 browsers). |
| P1-5 | **Private rooms UX:** create a room, get a 6-char code + shareable link (`/r/ABC123`) + QR code. Lobby shows players, ready state, and a host crown. Host can kick players, transfer host, and change settings. | A friend opening the link lands in the lobby with one click (guest name auto-generated, editable). |
| P1-6 | **Room settings:** duration (15/30/60/120 s) or word count (10/25/50/100), text type (words / quotes / punctuation / numbers / code / custom text pasted by host), language, max players (2–20 free), visibility (private/public), "allow late join as spectator". | Settings sync live in the lobby. Only the host can edit. |
| P1-7 | **Public quick match:** a "Play now" button puts the player into an open public room (or creates one). Auto-start countdown when there are 2+ players. If nobody joins within about 8 s, fill with **bot racers** (P1-8). | Time from landing to racing is under 15 s, even at 3 a.m. with 0 other users. |
| P1-8 | **Bots (non-AI v1):** server-side ghost racers with a target WPM and human-like jitter, mistakes, and pauses. Clearly labeled "BOT". They never save to leaderboards. | Bots finish within ±5% of their target WPM. They're visually indistinguishable in motion from humans but always labeled. |
| P1-9 | **Server time sync & fair start:** a ping handshake to estimate clock offset, then render the countdown from `startAt`. Input unlocks exactly at `startAt` (local adjusted). | Start skew between two clients is under 100 ms on normal connections. |
| P1-10 | **Race UI rebuild:** progress track with avatars (keep the space theme), live WPM, position, finish order, finish-line animation, and a results screen with a WPM-over-time chart, accuracy, errors heatmap, and **Rematch** button. | Rematch keeps everyone in the same room and returns to LOBBY. |
| P1-11 | **Room chat + emotes** (lobby and results only, never during the race), with a profanity filter and per-user mute. | Messages are rate-limited, sanitized, and moderated. |
| P1-12 | **Reconnect handling:** a refresh or network blip during a race rejoins the same seat within 30 s (session token, not socket id). | Killing Wi-Fi for 5 s mid-race doesn't drop the player. |

**P1 exit criteria:** old global mode is replaced by quick match + private rooms. P0
security guarantees still hold, and E2E tests cover a 4-player private race.

---

### Phase 2 — Engagement core

These features give people a reason to come back tomorrow.

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P2-1 | **Accounts:** guest by default (cookie session), upgrade to Google/GitHub OAuth or email magic link. Guest history merges into the account on upgrade. Retire the 6-digit join-ID login, with a migration that lets old IDs claim their scores once. | Fixes B5. A player can race without signing up but keeps progress after signing up. |
| P2-2 | **Solo practice mode:** instant test (time/words/quote/custom), no lobby, keyboard-first, plus **restart with Tab+Enter**. | This becomes the default landing action alongside "Play with friends". |
| P2-3 | **Profile & stats dashboard:** WPM/accuracy history chart, personal bests per mode, races played, time typed, **per-key accuracy heatmap** on a keyboard visual, slowest bigrams. | Loads in under 1 s for users with 1000+ races (pre-aggregated). |
| P2-4 | **Leaderboards v2:** all-time, weekly, daily, and friends boards. Filter by mode, duration, and language. Only server-validated, non-flagged results. Pagination, plus "jump to my rank". | Uses Redis zsets or indexed `PersonalBest`. |
| P2-5 | **Daily Challenge:** the same text for everyone each day, one ranked attempt plus unlimited practice. Daily board and a shareable result. | Daily text rotates at 00:00 UTC. There's a countdown to the next one. |
| P2-6 | **Streaks & XP/levels:** XP for races, accuracy bonuses, and the daily challenge. Daily streak with a "streak freeze" (later a Pro perk). | Level-up and streak animations. Streak breaks are handled correctly across time zones. |
| P2-7 | **Achievements:** about 25 badges to start (first 100 WPM, 7-day streak, 99% accuracy, win 10 races, host 5 rooms, invite a friend…). | Defined declaratively and evaluated server-side after each race. |
| P2-8 | **Ranked mode:** Glicko-2/Elo rating, tiers (Bronze→Diamond→Legend), matchmaking by rating band, monthly seasons with soft reset and season rewards (cosmetic). | Rating changes are shown on the results screen. Leaving a ranked race counts as a loss. |
| P2-9 | **Friends & invites:** add a friend by handle, see online friends, invite to a room, friends leaderboard. | Invites arrive in real time via socket. |
| P2-10 | **Customization:** themes (keep "space" as the signature), caret style, font, sounds (typing clicks, countdown), reduced-motion mode, color-blind-safe error colors. | Saved per user. Defaults respect `prefers-reduced-motion`. |
| P2-11 | **Replays & ghost racing:** store a compact keystroke log for PBs, watch a replay, race against your PB ghost. | A replay renders identically to the original race. |
| P2-12 | **Anti-cheat v2:** keystroke timing analysis (inter-key interval variance too low → bot), WPM ceiling checks per user history, and a "verify" re-test for suspicious top-board entries. An admin review queue. | Flagged scores are hidden from public boards until reviewed. |

---

### Phase 3 — AI features (the differentiator)

Principles: **use AI where it's personal or creative; use plain code where it's
deterministic.** Pre-generate and cache to keep costs low. Gate the heavy features
behind Pro.

| ID | Feature | How it works | Free vs Pro |
|----|---------|-------------|-------------|
| P3-1 | **AI provider wrapper** | `server/src/ai/` wraps the Claude API: a cheap, fast model (Claude Haiku 5.5) for text generation and moderation, a stronger model (Claude Sonnet 5.5) for coaching. Structured JSON outputs validated with zod, timeouts, retries, per-user quotas, cost logging, and caching. Provider-agnostic interface. | Infrastructure |
| P3-2 | **AI Typing Coach** | After a race (or on demand from the stats page), send *aggregated* stats (weak keys, slow bigrams, error patterns, WPM trend, accuracy vs speed trade-off) and get back a short diagnosis, 3 concrete tips, and a 7‑day practice plan. Shown as a friendly "Coach" card. | Free: 1 report/week. Pro: unlimited and with history |
| P3-3 | **Adaptive drills** | Generate practice text that over-represents the user's weak keys and bigrams **while staying readable** (real words and sentences). v1 is deterministic (weighted word picker from a dictionary). v2 adds an LLM to produce natural sentences constrained to target letters. Improvement is tracked per drill. | Free: basic drills. Pro: AI-written adaptive drills |
| P3-4 | **Topic-based texts for rooms** | Host types a topic ("Formula 1", "JavaScript promises", "Harry Potter trivia") and picks a length and difficulty. The AI generates an original passage, then moderation runs before anyone sees it. Popular topics are cached into the `Text` pool. | Free: 3/day. Pro: unlimited |
| P3-5 | **Code typing mode** | AI-generated or curated snippets per language (JS, Python, Java, C++, SQL) with proper indentation handling. Great for the developer audience and SEO. | Free: 2 languages. Pro: all |
| P3-6 | **Learn-while-typing packs** | Typing passages that teach something: vocabulary for exam prep (GRE/IELTS), language learning (type Spanish sentences with translations), facts quizzes after the race. | Packs as a Pro/cosmetic upsell |
| P3-7 | **Smarter bots** | Bots get "personas" with AI-generated names, taunts, and emote reactions in chat (pre-generated pools, not live calls). Bot WPM adapts to keep races close, which helps engagement. | Free |
| P3-8 | **AI moderation** | Usernames, room names, chat, custom texts, and topic prompts go through a fast keyword filter first, then LLM moderation for borderline cases. | Infrastructure |
| P3-9 | **Natural-language stats** | Ask questions like "When do I type fastest?" or "How much did I improve this month?" over the user's own aggregated stats (tool-calling over safe, pre-defined queries). | Pro |

**Cost control:** pre-generate nightly text pools per (topic, difficulty, language).
Cache coach reports until 10+ new races. Enforce hard monthly spend caps and per-user
quotas, and fall back to curated texts if the AI fails or the cap is hit. **Send only
aggregated stats to the AI provider, never raw contact info**, and say so in the
privacy policy.

---

### Phase 4 — Monetization

| ID | Task | Notes |
|----|------|-------|
| P4-1 | **TypeDash Pro** subscription (~$3–5/mo or ~$30/yr, with regional pricing). | Perks: unlimited AI coach and drills, advanced stats and full history, replays, private rooms up to 50 players with saved presets, custom room branding (name and colors), streak freezes, exclusive themes and avatars, no ads, Pro badge. |
| P4-2 | **Payments:** Stripe Checkout + Customer Portal + webhooks → `Subscription`. Use **Razorpay** if your main audience is in India (UPI support matters). | Webhook signature verification, idempotent handlers, grace periods. |
| P4-3 | **Feature-flag/entitlement service** (`can(user, 'ai.coach')`) used by both server and client. | One source of truth for gating. |
| P4-4 | **Ads (free tier only):** one non-intrusive slot on landing, lobby, and results. **Never during typing.** Respect consent (GDPR/CMP). | Ads disappear for Pro users. |
| P4-5 | **Cosmetics store:** avatars, track skins, caret trails, finish-line effects, profile banners. One-time purchases or earned via season rewards. | Cosmetic only; never pay-to-win. |
| P4-6 | **Verified typing certificate:** a proctored test (fullscreen, webcam optional, server-validated keystrokes) produces a PDF + public verification URL, shareable on LinkedIn and résumés. | One-time fee per certificate. Strong SEO and virality. |
| P4-7 | **Pricing page + paywall moments:** show the upgrade card when a free limit is hit (coach quota, room size), not as random popups. | Track conversion per paywall moment in PostHog. |

---

### Phase 5 — B2B: classrooms, events, hiring

| ID | Task | Notes |
|----|------|-------|
| P5-1 | **Organizations & roles** (owner/admin/teacher/member), seat-based billing. | Foundation for everything below. |
| P5-2 | **Classroom mode:** teacher creates a class, students join by code (no email needed for kids; COPPA/GDPR-K aware), assignments ("reach 40 WPM at 95% by Friday"), live class race, progress reports (CSV/PDF export). | Price per seat per year; free tier for one class of up to 30 students. |
| P5-3 | **Tournaments & events:** brackets (single/double elimination, Swiss), check-in, auto-created rooms per round, a big-screen **spectator/projector view** for live events, branded event pages, prize-contact collection **stored privately** (replaces the current public `userContact`). | This is TypeDash's original exhibition use case, turned into a product. Charge per event, or sponsors pay. |
| P5-4 | **Hiring assessments:** a company creates a typing test (duration, text type, minimum WPM/accuracy), sends candidate links, and gets a results dashboard with integrity signals. | Per-assessment pricing. Useful for data-entry, support, and transcription roles. |
| P5-5 | **Admin console:** moderation queue, flagged scores, user bans, text pool management, AI spend dashboard, feature flags. | Internal only. |

---

### Phase 6 — Growth (ongoing)

- **SEO landing pages:** "typing test 1 minute", "typing speed test online", "typing
  test for kids", "code typing test", one per language. These should be server-rendered
  or prerendered pages with fast load.
- **Share cards:** auto-generated OG image for every result ("I hit 92 WPM on
  TypeDash 🚀"), plus a one-tap share to X/WhatsApp/Instagram story.
- **Referral loop:** invite a friend who plays 3 races and both get a cosmetic or a
  week of Pro.
- **PWA + mobile polish:** installable, offline solo practice, a proper mobile typing
  layout (virtual-keyboard-aware viewport).
- **i18n:** UI translations + typing texts in Hindi (Devanagari input), Spanish,
  French, German, Portuguese.
- **Community:** Discord server, weekly community tournament, streamer mode (hide
  names, OBS overlay).
- **Email/push re-engagement:** streak reminder, weekly progress digest, "your friend
  beat your PB". Opt-in only.

---

## 4. UI/UX improvements (applied throughout P1–P2)

1. **Two-click onboarding.** Landing shows **Play now**, **Create room**, and
   **Practice solo**. No forced username form; a random space-themed name is
   pre-filled and editable later. The avatar picker moves to the profile.
2. **Design system:** tokens for color, spacing, and type; dark space theme as the
   default, plus a light theme. Consistent buttons, modals, and toasts. Keep the
   current identity (planets, particles, glitch logo) but make it lighter and faster
   (particles off on low-end and mobile, respect reduced motion).
3. **Typing area:** larger monospace text, smooth caret, 3-line viewport, live
   WPM/time in a quiet corner, focus mode that hides everything else while typing,
   and a clear "click to focus" overlay when the input loses focus.
4. **Results screen:** WPM/raw/accuracy/consistency, WPM-over-time chart with error
   markers, weak keys, a coach teaser, and **Rematch / New text / Share** buttons.
5. **Lobby:** big room code + copy link + QR, player cards with ready state, settings
   panel (host only), chat, "waiting for players" with a bot-fill countdown.
6. **Keyboard shortcuts:** keep the mouseless spirit, but use standard, discoverable
   shortcuts (`Tab` restart, `Esc` menu, `?` help overlay) instead of hijacking
   `Ctrl`/`Alt`, which breaks accessibility and browser behavior.
7. **Accessibility:** ARIA live regions for countdown and results, visible focus
   rings, WCAG AA contrast, screen-reader-friendly menus, no info conveyed by color
   alone.
8. **Mobile:** a dedicated mobile layout, avoid the virtual keyboard covering the
   text, separate mobile leaderboards based on server-detected input type.
9. **Performance budget:** JS under 200 KB gzipped on first load, LCP under 2 s,
   images in WebP/AVIF, fonts self-hosted with `font-display: swap`.

---

## 5. Quality, security & operations checklist

- [ ] Validate every socket event and REST body with zod. Reject unknown fields.
- [ ] Render no user content with `innerHTML` (React escapes by default; ban
      `dangerouslySetInnerHTML` via lint rule).
- [ ] Rate limits: per IP (REST), per socket (events), per user (AI calls, room creation).
- [ ] Secrets only in env, validated at boot; never logged.
- [ ] Sessions: httpOnly, secure, sameSite cookies; CSRF protection on mutations.
- [ ] Privacy policy, terms, cookie consent, account deletion, and data export (GDPR).
      Contact info for prizes is stored encrypted and never returned by public APIs.
- [ ] Tests: unit (engine, scoring, room FSM, rating, anti-cheat), integration (socket
      handlers with a real Mongo memory server), and E2E (Playwright multi-player race,
      private room flow, payment sandbox).
- [ ] CI: typecheck, lint, test, build on every PR; preview deploys.
- [ ] Monitoring: Sentry errors, uptime checks, a `/healthz` endpoint, logs with room/race IDs.
- [ ] Backups: Atlas automated backups. Run a restore drill once.
- [ ] Load test: k6/Artillery with 500 concurrent sockets in 50 rooms; p95 broadcast
      latency under 150 ms.

---

## 6. Success metrics (instrument in P1, review weekly)

| Metric | Why | Target after P2 |
|--------|-----|-----------------|
| Time to first race | Onboarding friction | < 15 s |
| Races per session | Core-loop fun | ≥ 4 |
| Private room invite → join rate | Viral loop health | ≥ 50% |
| D1 / D7 / D30 retention | Habit formation | 30% / 15% / 7% |
| Daily challenge participation | Daily habit | ≥ 25% of DAU |
| Free → Pro conversion (after P4) | Revenue | 2–4% of MAU |
| AI cost per Pro user / month | Margin | < 15% of price |

---

## 7. How to execute this plan with AI agents

1. **One task ID = one branch = one PR.** Give the agent the task row, the relevant
   section of this doc, and the acceptance criteria. Ask it to write tests first for
   engine, room, and scoring logic.
2. **Order matters:** P0 (all) → P1-1 → P1-2 and P1-3 in parallel → P1-4 … Don't
   start P3/P4 until the P1 exit criteria are met.
3. **Keep a `CLAUDE.md`** at the repo root with run, test, and lint commands,
   architecture notes, and conventions (shared zod schemas, no `innerHTML`, room-scoped
   emits only). Agents follow it on every task.
4. **Every PR must:** pass CI, include tests, update docs if behavior changed, and
   include a short "how to verify manually" section.
5. **Review hotspots yourself:** anything touching auth, payments, anti-cheat, AI
   prompts, and data deletion.

### Suggested first sprint (about 1 week)

1. P0-1 XSS fix → P0-2 leaderboard projection → P0-3 crash guards → P0-5 secret log
   (same day, highest risk reduction)
2. P0-4 basic server-side score validation
3. P0-6 / P0-7 / P0-8 correctness and rate limiting
4. P0-9 tooling + CI, P0-10 image compression
5. P1-1 monorepo scaffold (ready for rooms next sprint)

---

## 8. Open decisions for the owner

| Decision | Recommendation |
|----------|----------------|
| Frontend framework | React + Vite + TS (alternative: stay vanilla with Vite + TS modules) |
| Primary market & payments | If mostly India → Razorpay + INR pricing; else Stripe |
| AI provider | Claude API behind a provider-agnostic wrapper |
| Hosting | Fly.io or Railway (WebSocket-friendly, no cold starts) + Atlas + Upstash Redis |
| Keep device-split leaderboards? | Yes, but detect the input type server-side and add a "mobile" filter rather than separate boards |
| Brand | Keep "TypeDash" and the space theme; they're distinctive |
