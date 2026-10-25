# 01 — Architecture

## 1. System overview

```
                              ┌──────────────────────────── Railway project ────────────────────────────┐
 Browser (React SPA)          │                                                                          │
 ┌──────────────────┐  HTTPS  │  ┌─────────────── web service ───────────────┐     ┌── worker service ──┐ │
 │ apps/web         │────────►│  │ Express 5                                  │     │ BullMQ workers      │ │
 │  • typing engine │  /api   │  │  ├ REST /api/*  (zod-validated)            │     │  • daily challenge  │ │
 │  • TanStack Query│         │  │  ├ Better Auth /api/auth/*                 │     │  • AI text pools    │ │
 │  • Zustand       │   WSS   │  │  ├ Stripe webhooks /api/webhooks/stripe    │     │  • leaderboard snap │ │
 │  • socket.io-cli │────────►│  │  ├ Socket.IO (rooms, races, chat)          │     │  • emails/digests   │ │
 └──────────────────┘ /socket │  │  ├ RoomManager (in-memory, authoritative)  │     │  • cleanup jobs     │ │
                              │  │  └ static SPA (apps/web/dist)              │     └─────────┬──────────┘ │
                              │  └──────┬───────────────┬─────────────────────┘               │            │
                              │         │               │            ┌────────────────────────┘            │
                              │         │               ▼            ▼                                     │
                              │         │        ┌──────────── Redis ────────────┐                         │
                              │         │        │ zsets (leaderboards), rate    │                         │
                              │         │        │ limits, BullMQ queues, AI     │                         │
                              │         │        │ quotas, socket.io adapter*    │                         │
                              │         │        └───────────────────────────────┘                         │
                              └─────────┼──────────────────────────────────────────────────────────────────┘
                                        ▼
         ┌────────────────┐   ┌────────────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────────────┐
         │ MongoDB Atlas  │   │ Stripe         │   │ Claude API   │   │ Resend    │   │ Sentry / PostHog │
         └────────────────┘   └────────────────┘   └──────────────┘   └───────────┘   └──────────────────┘
   * Redis adapter only needed when running >1 web replica (see 06-infrastructure.md § Scaling)
```

**Why one `web` service serves API, sockets, and the SPA:** one deploy unit, one
domain (no CORS, cookies just work), and the simplest thing that scales to many
thousands of concurrent racers on a single Node process. The `worker` is separate
so that slow jobs (AI batches, emails) never block the race loop.

## 2. Monorepo layout

```
typedash/
├─ apps/
│  ├─ web/                          # React SPA
│  │  ├─ src/
│  │  │  ├─ app/                    # router, providers, layout, error boundary
│  │  │  ├─ routes/                 # one folder per route (see §4)
│  │  │  ├─ features/
│  │  │  │  ├─ typing/              # <TypingArea/>, caret, word rendering (uses shared engine)
│  │  │  │  ├─ race/                # race track, live positions, results
│  │  │  │  ├─ lobby/               # room lobby, settings panel, invite/QR
│  │  │  │  ├─ practice/            # solo modes, daily challenge
│  │  │  │  ├─ stats/               # charts, key heatmap, coach card
│  │  │  │  ├─ leaderboard/
│  │  │  │  ├─ profile/
│  │  │  │  ├─ social/              # friends, invites, chat
│  │  │  │  ├─ billing/             # pricing, paywall, upgrade
│  │  │  │  └─ classroom/ tournaments/ admin/  (M6–M7)
│  │  │  ├─ components/ui/          # shadcn/ui primitives + design-system components
│  │  │  ├─ lib/                    # api client, socket client, time-sync, analytics, i18n
│  │  │  └─ stores/                 # Zustand stores (session, room, settings)
│  │  ├─ public/                    # optimized assets (avatars as WebP/SVG, sounds)
│  │  └─ index.html
│  ├─ server/
│  │  ├─ src/
│  │  │  ├─ index.ts                # boot: config → db → redis → http → socket
│  │  │  ├─ config.ts               # zod-validated env (fails fast)
│  │  │  ├─ http/                   # express app, middleware, routes/*
│  │  │  ├─ socket/                 # io setup, auth middleware, handlers/{room,race,chat,mm}.ts
│  │  │  ├─ rooms/                  # Room (FSM), RoomManager, Matchmaker, BotDriver
│  │  │  ├─ race/                   # text selection, result validation (replay), scoring
│  │  │  ├─ progression/            # XP, levels, streaks, achievements, rating
│  │  │  ├─ ai/                     # client wrapper, coach, drills, topic text, moderation
│  │  │  ├─ billing/                # stripe client, checkout, portal, webhook handlers, entitlements
│  │  │  ├─ auth/                   # better-auth config, session helpers, guest upgrade/merge
│  │  │  ├─ models/                 # mongoose models (03-data-and-api.md)
│  │  │  ├─ jobs/                   # BullMQ queue definitions + processors (worker entry: worker.ts)
│  │  │  └─ lib/                    # logger, errors, redis, rate-limit, clock, rng
│  │  └─ test/
│  └─ e2e/                          # Playwright specs + fixtures
├─ packages/
│  └─ shared/
│     ├─ src/
│     │  ├─ engine/                 # pure typing engine + metrics + replay (02 §1)
│     │  ├─ contracts/              # zod schemas: socket events, REST DTOs, settings
│     │  ├─ constants/              # limits, modes, durations, avatar ids, feature keys
│     │  └─ text/                   # word lists, text generators (non-AI), tokenization
│     └─ test/
├─ legacy/                          # old app kept read-only until cutover (M3), then deleted
├─ docs/plan/                       # this plan
├─ CLAUDE.md
├─ railway.json / Dockerfile        # see 06-infrastructure.md
└─ pnpm-workspace.yaml
```

## 3. Backend module responsibilities

| Module | Owns | Must not |
|--------|------|----------|
| `rooms/` | Room lifecycle, players, host, settings, FSM transitions, timers (via injected clock) | Touch Mongo directly. It emits domain events that `race/` persists |
| `race/` | Picking texts, issuing `raceId`, validating final results by replaying keystroke logs, persisting `Race`/`RaceResult` | Trust client-sent metrics |
| `progression/` | XP, levels, streaks, achievements, OpenSkill rating, personal bests, leaderboard writes | Run inside the socket hot path synchronously. It runs after results are accepted |
| `ai/` | All Claude API calls, prompt templates, output schemas, quotas, caching, cost logging | Be called from the race hot path |
| `billing/` | Stripe objects ↔ `Subscription`, entitlements | Grant access from anything other than verified webhooks |
| `auth/` | Sessions, guest users, OAuth/magic link, account merge | — |
| `socket/` | Thin adapters: validate payload → call domain → ack | Contain business logic |

## 4. Frontend routes & screens

| Route | Screen | Milestone |
|-------|--------|-----------|
| `/` | Landing: **Play now**, **Practice**, **Create room**, and today's daily challenge card. Logged-in users see their streak, level, and last result | M1/M3 |
| `/practice` | Solo test: mode bar (time 15/30/60/120 · words 10/25/50/100 · quote · code · custom) → typing area → results | M1 |
| `/play` | Quick match: finding race → lobby → race → results → "Next race" | M2 |
| `/r/:code` | Private room: lobby (players, ready, host settings, invite link, QR, chat) → race → results → rematch | M2 |
| `/daily` | Daily challenge: today's text, your attempt, daily leaderboard, countdown | M3 |
| `/leaderboard` | Boards with tabs (daily/weekly/all-time/friends) and filters (mode, duration, language) | M3 |
| `/u/:handle` | Public profile: avatar, level, badges, PBs, recent races, rating tier | M3 |
| `/stats` | My stats: WPM/accuracy over time, key heatmap, slow bigrams, **AI Coach** card, drills | M3/M4 |
| `/race/:id` | Race result page (shareable, OG image) + replay (M6) | M3 |
| `/friends` | Friends list, online status, invites | M3 |
| `/settings` | Profile, theme, caret, sounds, keyboard layout, privacy, account deletion | M1/M3 |
| `/pricing`, `/billing` | Plans, checkout redirect, success, manage subscription (Stripe Portal) | M5 |
| `/certify` | Verified typing certificate flow + public verification page `/cert/:id` | M5 |
| `/login` | Sign in / upgrade guest | M1 |
| `/ranked` | Ranked queue, season, tier progress | M6 |
| `/class/*` | Teacher dashboard, class join, assignments, reports | M6 |
| `/t/:slug` | Tournament page, bracket, projector view `/t/:slug/live` | M7 |
| `/hire/*` | Assessment builder, candidate link `/assess/:token`, results | M7 |
| `/admin/*` | Moderation queue, flagged scores, texts, AI spend, users | M7 (basic in M3) |

**Client state:** server state lives in TanStack Query. Session, room, and
settings live in Zustand. Socket events update the room store; components
subscribe via selectors so 5 Hz race ticks don't re-render the whole tree.

**Typing area performance:** render words as spans keyed by index and update only
the current word on input. Position the caret with `transform` (GPU) using
measured letter rects. No layout thrash per keystroke. Target under 4 ms of JS per
keystroke on a mid-range phone.

## 5. Design & UX principles

1. **Zero-friction start.** A first-time visitor is typing within **one click**:
   guest identity is automatic, a random space name is assigned, and they can edit
   it later. No forms before fun.
2. **Keep the space identity, make it fast.** Dark space theme by default, with
   particles that are lighter, paused during typing, and disabled on low-end devices
   and with `prefers-reduced-motion`. Assets are WebP/AVIF/SVG. Total landing
   weight under 1 MB.
3. **Typing area first.** Large monospace text, three visible lines, a smooth
   caret, quiet live stats, and a **focus mode** that hides chrome while typing.
   A clear "Click or press any key to focus" overlay appears when focus is lost.
4. **Standard, discoverable shortcuts.** `Tab` restarts/next, `Esc` opens the menu
   or leaves, `?` shows the shortcut help, and `Enter` toggles ready in a lobby.
   Never hijack `Ctrl`/`Alt` (the legacy app does, which breaks browser and
   accessibility shortcuts).
5. **Results that teach.** Every result shows WPM, raw, accuracy, consistency, a
   WPM-over-time chart with error markers, and weak keys, plus one clear next
   action (Rematch / Next / Practice weak keys / Share).
6. **Accessible.** WCAG 2.2 AA contrast, visible focus, ARIA live regions for
   countdown and results, color-blind-safe correct/incorrect styling (underline +
   color), and full keyboard navigation.
7. **Mobile is first-class.** A layout aware of the virtual keyboard
   (`visualViewport`), larger touch targets, mobile-specific leaderboards based on
   server-detected input type (touch vs physical keyboard heuristics).
8. **Design system.** Tokens for color, space, radius, and type in Tailwind config.
   Themes are CSS-variable sets (space-dark default, light, high-contrast, plus Pro
   themes). Components come from shadcn/ui, restyled once.
9. **Performance budget.** Initial JS under 180 KB gzipped (route-level code
   splitting), LCP under 2.0 s on 4G, CLS under 0.05, INP under 100 ms.
