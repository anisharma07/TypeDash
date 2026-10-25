# 03 — Data & API

## 1. MongoDB models (`apps/server/src/models`)

All documents have `createdAt`/`updatedAt` (Mongoose timestamps). IDs are
ObjectIds. Better Auth owns its own `user`, `session`, `account`, and
`verification` collections. Our `Profile` links 1:1 to the auth user.

### 1.1 Identity & social

| Model | Fields | Indexes |
|-------|--------|---------|
| **Profile** | `userId` (auth user), `handle` (3–20, `^[a-z0-9_]+$`), `displayName` (≤ 20, sanitized), `avatar` (enum/cosmetic id), `isGuest`, `timezone`, `country?`, `level`, `xp`, `streak {current, best, lastDay, freezes}`, `rating {mu, sigma, ordinal, season, placementLeft}`, `settings {theme, caret, font, sounds, layout, reducedMotion, focusMode}`, `privacy {publicProfile, showOnBoards}`, `flags {banned, shadowBanned, verifiedTypist}`, `legacyJoinId?` | `userId` unique; `handle` unique; `xp` desc; `rating.ordinal` desc (partial: season active) |
| **Friendship** | `a`, `b` (sorted pair), `status: pending\|accepted\|blocked`, `requestedBy` | `{a,b}` unique; `{b,status}` |
| **Notification** | `userId`, `kind`, `payload`, `readAt?` | `{userId, createdAt}` desc; TTL 90 d |

### 1.2 Content

| Model | Fields | Indexes |
|-------|--------|---------|
| **Text** | `content`, `language`, `kind: quote\|words\|code\|drill\|custom`, `codeLanguage?`, `source: curated\|ai\|custom`, `attribution?` (author/work for public-domain), `difficulty {score, band}`, `length`, `tags[]`, `moderation {status: pending\|approved\|rejected, reason?, by}`, `ai? {model, promptVersion, topic}`, `stats {plays, avgWpm}` | `{kind, language, difficulty.band, moderation.status}`; `{tags}`; text index on `tags` |
| **DailyChallenge** | `date` (YYYY-MM-DD UTC), `textId`, `stats {attempts, avgWpm}` | `date` unique |

### 1.3 Races & results

| Model | Fields | Indexes |
|-------|--------|---------|
| **Race** | `kind` (room kind / practice / daily / drill / assessment), `roomCode?`, `textId`, `settings` snapshot, `startedAt`, `endedAt`, `participantCount`, `humanCount` | `{startedAt}`; TTL none |
| **RaceResult** | `raceId`, `userId`, `mode`, `duration?`, `wordCount?`, `language`, `device: desktop\|mobile`, `wpm`, `rawWpm`, `accuracy`, `consistency`, `place?`, `finished`, `elapsedMs`, `perKey` (compact map), `bigrams` (top 30), `timeline` (per-second arrays), `keylog?` (gzip blob, only kept for PBs/flagged/certificates, else dropped after 7 d), `status: accepted\|flagged\|rejected`, `flags[]`, `xpGained`, `ratingDelta?` | `{userId, createdAt}` desc; `{raceId}`; `{status, createdAt}`; `{mode, duration, language, wpm}` desc (partial: accepted) |
| **PersonalBest** | `userId`, `key` (`mode:duration:language:device`), `wpm`, `accuracy`, `raceResultId`, `achievedAt` | `{userId, key}` unique; `{key, wpm}` desc |
| **UserStatsDaily** | `userId`, `day`, `races`, `secondsTyped`, `avgWpm`, `bestWpm`, `avgAcc`, `perKeyAgg` | `{userId, day}` unique. Pre-aggregated by the worker so `/stats` is fast |

### 1.4 Progression & AI

| Model | Fields | Indexes |
|-------|--------|---------|
| **UserAchievement** | `userId`, `code`, `unlockedAt`, `raceResultId?` | `{userId, code}` unique |
| **Season** | `number`, `startsAt`, `endsAt`, `status` | `number` unique |
| **CoachReport** | `userId`, `basedOnRaces` (count + last id), `input` (aggregated stats snapshot), `output` (structured JSON), `model`, `promptVersion`, `costUsd`, `createdAt` | `{userId, createdAt}` desc |
| **AiUsage** | `userId?`, `feature`, `model`, `inputTokens`, `outputTokens`, `cacheReadTokens`, `costUsd`, `ok`, `ms` | `{createdAt}`; `{userId, feature, createdAt}` |

### 1.5 Billing & B2B

| Model | Fields | Indexes |
|-------|--------|---------|
| **BillingCustomer** | `ownerType: user\|org`, `ownerId`, `stripeCustomerId` | `stripeCustomerId` unique; `{ownerType, ownerId}` unique |
| **Subscription** | `ownerType`, `ownerId`, `stripeSubscriptionId`, `plan: pro\|teacher\|school`, `interval`, `status` (mirrors Stripe), `quantity` (seats), `currentPeriodEnd`, `cancelAtPeriodEnd`, `graceUntil?` | `stripeSubscriptionId` unique; `{ownerType, ownerId}` |
| **Purchase** | `userId`, `kind: certificate\|cosmetic\|event\|assessment-pack`, `sku`, `stripePaymentIntentId`, `amount`, `currency`, `status` | `stripePaymentIntentId` unique |
| **Inventory** | `userId`, `items[] {sku, source: purchase\|season\|level\|referral, acquiredAt}` | `userId` unique |
| **StripeEvent** | `eventId`, `type`, `processedAt` (idempotency log) | `eventId` unique; TTL 60 d |
| **Certificate** | `userId`, `publicId` (unguessable), `wpm`, `accuracy`, `testRaceResultId`, `issuedAt`, `revoked` | `publicId` unique |
| **Organization** | `name`, `kind: school\|company\|event`, `members[] {userId, role: owner\|admin\|teacher\|member}`, `branding?` | `members.userId` |
| **Classroom** | `orgId`, `teacherId`, `name`, `joinCode`, `studentIds[]`, `settings` | `joinCode` unique |
| **Assignment** | `classroomId`, `title`, `target {wpm, accuracy, mode, duration}`, `dueAt`, `completions[] {userId, raceResultId, at}` | `{classroomId, dueAt}` |
| **Tournament** | `orgId?`, `slug`, `name`, `format: single\|double\|swiss`, `status`, `participants[]`, `rounds[] {matches[] {roomCode, players[], winnerId}}`, `branding`, `prizeContacts` (**encrypted**, never in public API) | `slug` unique |
| **Assessment** | `orgId`, `name`, `config`, `invites[] {token, email?, status, raceResultId?}` | `invites.token` unique |

### 1.6 Ops

| Model | Fields | Indexes |
|-------|--------|---------|
| **ModerationFlag** | `targetType: result\|text\|profile\|chat`, `targetId`, `reason`, `auto: boolean`, `status`, `reviewedBy?` | `{status, createdAt}` |
| **AuditLog** | `actorId`, `action`, `target`, `meta` | `{createdAt}`; TTL 365 d |
| **DeletionLog** | `userIdHash` (HMAC of the user id, not the id itself), `deletedAt` | `userIdHash` unique. Kept 35 days so a backup restore can re-purge deleted users (10§3) |

## 2. Redis keys

| Key | Type | Purpose | TTL |
|-----|------|---------|-----|
| `lb:d:{YYYY-MM-DD}:{boardKey}` | zset userId→wpm | Daily board | 8 d |
| `lb:w:{YYYY-Www}:{boardKey}` | zset | Weekly board | 5 w |
| `lb:daily-challenge:{date}` | zset | Daily challenge ranked attempts | 8 d |
| `rl:{scope}:{id}` | counters | REST/socket/AI rate limits | window |
| `aiq:{userId}:{feature}:{YYYY-MM}` | counter | Monthly AI quota | 40 d |
| `ai:cache:{hash}` | string | Cached AI outputs (topic texts) | 30 d |
| `presence:{userId}` | string (socket node) | Online status for friends | 60 s heartbeat |
| `bull:*` | BullMQ | Job queues | — |

`boardKey = {mode}:{duration}:{language}:{device}`, e.g. `time:60:en:desktop`.
The worker snapshots the top 1000 of each closed daily/weekly board to Mongo
(`LeaderboardSnapshot`) for history.

## 3. REST API (`/api`)

All responses are JSON. Errors are `{ error: { code, message } }`. Auth is via
Better Auth session cookie (httpOnly, Secure, SameSite=Lax). Mutations require
the CSRF header (`x-requested-with`) and an origin check. Cursor pagination:
`?cursor=…&limit≤50`.

| Method & path | Auth | Purpose |
|---------------|------|---------|
| `GET /api/health` | — | Liveness (process up) |
| `GET /api/ready` | — | Readiness (Mongo + Redis reachable) |
| `* /api/auth/*` | — | Better Auth: anonymous sign-in, OAuth callbacks, magic link, sign-out |
| `GET /api/me` | session | Profile + entitlements + streak + level |
| `PATCH /api/me` | session | displayName, handle (30-day cooldown), avatar, settings, timezone, privacy |
| `DELETE /api/me` | session | Account deletion (GDPR). Cancels the Stripe subscription, anonymizes results |
| `GET /api/me/export` | session | Data export (JSON) |
| `GET /api/me/stats?range=7d\|30d\|all` | session | Aggregates, timeline, per-key heatmap, bigrams |
| `GET /api/me/races?cursor` | session | Race history |
| `GET /api/users/:handle` | — | Public profile (respects privacy) |
| `GET /api/races/:id` | — | Result page data (public fields only) |
| `GET /api/races/:id/replay` | — | Keylog for replay (if kept) (M6) |
| `GET /api/texts/next?mode&lang&difficulty` | session | Text for solo practice |
| `POST /api/practice/results` | session | Solo result `{textId \| seed, settings, log}` → server replay → accepted result + progression |
| `GET /api/daily` | — | Today's challenge meta + your status |
| `POST /api/daily/attempt` | session | Start a ranked attempt → `{attemptId, text, startToken}` |
| `POST /api/daily/attempt/:id/finish` | session | Submit log → validated result |
| `GET /api/leaderboards?scope&mode&duration&lang&device&cursor` | — | Boards (`scope`: daily/weekly/alltime/friends/daily-challenge) + `me` rank |
| `GET /api/achievements` | — | Catalog. With session: unlocked state |
| `GET/POST/DELETE /api/friends[/:userId]` | session | List, request/accept, remove/block |
| `GET /api/rooms/:code/preview` | — | For link unfurls: room name, host, player count (no PII) |
| `POST /api/ai/coach` | session | Get latest or generate a coach report (quota-gated) (M4) |
| `POST /api/ai/drill` | session | Generate an adaptive drill text (M4) |
| `POST /api/ai/topic-text` | session | Generate topic text for a room (host) (M4) |
| `POST /api/billing/checkout` | session (registered) | `{ priceKey }` → Stripe Checkout URL (M5) |
| `POST /api/billing/portal` | session | Stripe Customer Portal URL |
| `POST /api/webhooks/stripe` | Stripe signature | Webhook receiver (raw body) |
| `POST /api/certify/start` / `.../finish` | session | Certificate test flow (M5) |
| `GET /api/cert/:publicId` | — | Public verification |
| `GET /og/race/:id.png`, `/og/profile/:handle.png` | — | Generated share images (satori + resvg) |
| `/api/class/*`, `/api/tournaments/*`, `/api/assessments/*` | org roles | B2B (M6–M7) |
| `/api/admin/*` | admin role | Moderation, flags, texts, users, AI spend (M3 basic → M7) |

## 4. Legacy data migration (task M3-14)

The legacy `racers` collection has: `username`, `joinId`, `userAvatar`,
`userContact`, and `highScore.{Easy,Medium}.{Mobile,Laptop}`.

1. **Before cutover:** export `userContact` values to an encrypted file for the
   owner (prize fulfillment), then **delete the field from the database**. The
   new system never stores contacts in plain text.
2. Run `scripts/migrate-legacy.ts` (idempotent). For each Racer, upsert a
   `LegacyPlayer {joinId, username (sanitized), avatar, bests}`. Duplicate
   usernames are kept as separate entries.
3. **Hall of Fame:** a read-only "Legacy (2024–2026)" board shows the old high
   scores. They're *not* merged into new boards, because old scores were
   unverifiable (B3).
4. **Claiming:** a signed-in user can enter an old join ID once. A claim gives the
   "Pioneer" badge + avatar and links `legacyJoinId`. Each joinId is claimable
   once, there's a 5-attempts-per-day limit, and the claim window is 90 days.
   (Join IDs were guessable, so a claim grants only cosmetics, never rank.)
5. Redirect old URLs: `/multiplayer.html*` → `/play`, `/index.html` → `/`.
