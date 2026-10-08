# 02 — Gameplay spec

## 1. Typing engine (`packages/shared/src/engine`)

A **pure, deterministic** state machine with no DOM, no timers, and no globals.
The same code runs in the browser (live UI) and on the server (replay validation).

### 1.1 API

```ts
type EngineConfig = {
  text: string;                       // full passage, single spaces, normalized (NFC)
  mode: 'strict' | 'lenient';         // strict: can't advance past a wrong word (races default)
  allowBackspaceIntoPrevWord: boolean;// lenient only
  stopAt: { type: 'time'; ms: number } | { type: 'text-end' };
};

type KeyEvent = { t: number; key: string };   // t = ms since race start; key = char | 'Backspace' | 'CtrlBackspace'

createEngine(config): EngineState
applyKey(state, ev): EngineState              // pure
getView(state): { words: WordView[]; caret: {word: number; char: number} }
getMetrics(state, nowMs): Metrics
replay(config, events: KeyEvent[]): { state, metrics }   // used by server
```

### 1.2 Metrics (single source of truth)

| Metric | Definition |
|--------|-----------|
| `correctChars` | Characters in **fully correct words** typed so far, plus the spaces after them, plus correct characters of the final (possibly partial) word at stop time |
| `wpm` | `correctChars / 5 / minutes`, where `minutes = elapsedMs / 60000`. 0 when elapsed is under 1000 ms (fixes B11) |
| `rawWpm` | `allTypedChars / 5 / minutes` (includes errors and extras) |
| `accuracy` | `correctKeystrokes / totalCharKeystrokes × 100` at **keystroke level**, so corrected mistakes still count against you |
| `consistency` | `100 × (1 − cv)` clamped to 0–100, where `cv` is the coefficient of variation of per-second raw WPM |
| `progress` | `committedCorrectChars / text.length` (0–1), used for the race track |
| `perKey` | For each expected char: hits, misses, avg latency (ms). Feeds the heatmap and AI coach |
| `bigrams` | Avg latency + error rate per expected bigram (top N kept) |
| `timeline` | Per-second `{wpm, raw, errors}` series for charts |

Rounding: compute in floats; round to 1 decimal only for display/storage. Unit
tests must cover: empty input, all-wrong, extras, backspace across words (lenient),
strict-mode blocking, Unicode (accents, Devanagari later), code mode (newlines +
indentation auto-skip), finishing exactly at text end vs time stop.

### 1.3 Modes

| Mode | Text source | Stop | Engine mode |
|------|-------------|------|-------------|
| Race (rooms, quick match, ranked) | Server picks (quote/words/AI/custom) | Text end **or** room time limit (default 120 s cap) | strict |
| Practice: time 15/30/60/120 | Generated word stream (infinite, appended) | Time | lenient |
| Practice: words 10/25/50/100 | Word list | Text end | lenient |
| Practice: quote (short/medium/long) | Curated quotes | Text end | lenient |
| Code | Snippets per language (curated + AI) | Text end | strict, auto-indent |
| Custom | User-pasted text (moderated if shared in a room) | Text end | lenient |
| Daily challenge | Server-fixed text for the day | Text end | strict |
| Drill (M4) | Adaptive generator / AI | Words | lenient |

## 2. Rooms

### 2.1 Room model (in-memory, server)

```ts
type Room = {
  id: string;                 // internal uuid
  code: string;               // 6 chars, Crockford base32 without ambiguous chars (no 0/O/1/I)
  kind: 'private' | 'public' | 'ranked' | 'daily-live' | 'tournament' | 'class';
  hostId: UserId | null;      // null for public/ranked (system-hosted)
  settings: RoomSettings;
  players: Map<UserId, Player>;     // max settings.maxPlayers (free 10, Pro host 50)
  spectators: Map<UserId, Spectator>;
  state: 'LOBBY' | 'COUNTDOWN' | 'RACING' | 'RESULTS';
  race?: { raceId; textId; text; startAt; endAt; finishers: UserId[] };
  createdAt; lastActivityAt;
};
type RoomSettings = {
  textType: 'quote' | 'words' | 'punctuation' | 'numbers' | 'code' | 'custom' | 'ai-topic';
  language: 'en' | ...;          // M6+: more languages
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitSec: 30 | 60 | 120 | 180;
  wordCount?: 10 | 25 | 50 | 100;   // for 'words'
  codeLanguage?: 'js' | 'py' | 'java' | 'cpp' | 'sql' | ...;
  customText?: string;             // ≤ 1500 chars, moderated
  aiTopic?: string;                // ≤ 80 chars, moderated (M4)
  maxPlayers: number;
  visibility: 'private' | 'public';
  allowLateJoinAsSpectator: boolean;
  autoStart: { enabled: boolean; whenReadyCount?: number; afterSec?: number };
};
```

### 2.2 State machine

```
               join (≤ maxPlayers)                       start condition met
   ┌──────────────────────────┐            ┌──────────────────────────────────────────┐
   ▼                          │            │                                          ▼
 LOBBY ── ready/unready, settings (host), kick, chat ──────────────────────────► COUNTDOWN
   ▲                                                                                  │ startAt reached
   │ rematch / auto-return after 20 s                                                 ▼
 RESULTS ◄──── all players finished │ endAt reached │ all racers left ─────────── RACING
```

**Start conditions** (first one that's true wins):
- Private: host presses Start (needs ≥1 player; solo races are allowed for testing) **or** all players ready with ≥2 players.
- Public/quick match: ≥2 players and (all ready **or** 10 s since the 2nd player joined). If one human waits 8 s alone, add bots (§5).
- Ranked: matchmaker fills to N (2–5) and starts immediately.

**Timings:** COUNTDOWN = 3 s (`startAt = now + 3000 + 300 ms buffer`). RACING ends
at `endAt = startAt + timeLimitSec*1000`, or earlier when all have finished.
RESULTS lingers 20 s, then auto-returns to LOBBY (public) or stays until rematch
(private).

**Edge cases (all must be unit-tested):**
- Host leaves: the longest-present player becomes host. If there are no players, the room is closed after 5 min empty.
- Player disconnects mid-race: their seat is held for 30 s (reconnect with session token, not socket id). After that they're marked DNF.
- Joining during COUNTDOWN/RACING: becomes a spectator, and is promoted to player at the next LOBBY if there's space.
- Kicked users can't rejoin that room for 10 min.
- Settings change while in LOBBY resets everyone's ready state.
- Rooms per user: free 1 active private room, Pro 3. Rooms per IP: 5 (abuse cap).

### 2.3 Socket contract (`packages/shared/src/contracts/socket.ts`)

Every client→server event uses an **ack** `(res: {ok: true, data} | {ok: false, error: {code, message}})`.
All payloads are zod-validated. Unknown fields are rejected. Each event is
rate-limited per socket.

**Client → server**

| Event | Payload | Who | Rate limit |
|-------|---------|-----|-----------|
| `time:ping` | `{ clientTs }` → ack `{ serverTs }` | any | 10/s |
| `room:create` | `{ settings }` → ack `{ code }` | auth'd (guest ok) | 5/min |
| `room:join` | `{ code, asSpectator? }` → ack `{ snapshot }` | any | 10/min |
| `room:leave` | `{}` | member | — |
| `room:ready` | `{ ready: boolean }` | player | 5/s |
| `room:updateSettings` | `{ patch: Partial<RoomSettings> }` | host, LOBBY | 2/s |
| `room:start` | `{}` | host, LOBBY | 1/s |
| `room:kick` / `room:transferHost` | `{ userId }` | host | 2/s |
| `room:rematch` | `{}` | host (private) | 1/s |
| `mm:quickplay` | `{ textType? }` → ack `{ code }` | any | 2/s |
| `mm:ranked:queue` / `mm:ranked:cancel` | `{}` | registered (M6) | 1/s |
| `race:progress` | `{ raceId, seq, t, committed, typed, errors }` | racer | 8/s |
| `race:finish` | `{ raceId, log: EncodedKeyLog }` | racer | 1/race |
| `chat:send` | `{ text (≤200) }` | member, not RACING | 1/s, 20/min |

**Server → client**

| Event | Payload | When |
|-------|---------|------|
| `room:snapshot` | full room view (players, spectators, settings, state, host) | on join / reconnect |
| `room:patch` | `{ op: 'playerJoined' \| 'playerLeft' \| 'ready' \| 'settings' \| 'host' \| 'kicked', ... }` | incremental |
| `race:countdown` | `{ raceId, text, startAt, endAt, settings }` | LOBBY → COUNTDOWN |
| `race:tick` | `{ raceId, players: [{ id, progress, wpm, finished, place? }] }` | **5 Hz**, throttled, RACING only |
| `race:finished` | `{ userId, place, wpm }` | each finisher (validated) |
| `race:results` | `{ raceId, results: [...], you: { xp, levelUp?, achievements[], ratingDelta?, pb? } }` | → RESULTS |
| `chat:message` | `{ id, userId, name, text, ts }` | — |
| `notify` | `{ kind: 'invite' \| 'friendOnline' \| ..., ... }` | user-scoped channel |
| `error` | `{ code, message }` | — |

**Time sync:** on connect, the client sends 5 `time:ping`s and takes the median
`offset = serverTs − (clientTs + rtt/2)`. All `startAt`/`endAt` values are
converted with this offset. Input unlocks at `startAt` (local adjusted). Target
skew between clients is under 100 ms.

### 2.4 Race data flow

1. COUNTDOWN: the server picks the text, creates `raceId`, and broadcasts `race:countdown`.
2. RACING: the client runs the engine locally and sends `race:progress` at most
   every 150 ms. The server stores the latest value per player and **plausibility-checks**
   it (§3.1). It broadcasts `race:tick` at 5 Hz with *server-computed* WPM
   (`committed / 5 / elapsedServerMinutes`).
3. On finish (or `endAt`), the client sends `race:finish` with the **encoded
   keystroke log**: delta-encoded `[dt, keyCode]` pairs, gzip+base64, ≤ 32 KB
   (enforced).
4. The server **replays** the log with the shared engine → authoritative metrics.
   It cross-checks against stored progress samples (§3.2) and then assigns place.
5. When the race ends, the server persists `Race` and `RaceResult`s, enqueues the
   progression job (XP, streak, PB, achievements, rating, leaderboard), and emits
   `race:results` once progression is done (≤ 300 ms target, otherwise sends
   results first and follows up with `room:patch` progression info).

## 3. Anti-cheat

### 3.1 Live plausibility (during race)
- `committed` must be non-decreasing in strict mode and ≤ text length.
- Rate cap: `Δcommitted / Δt_server` ≤ 30 chars/s sustained over 1 s windows
  (about 360 WPM). Violations mark the player `suspect` and drop the sample.
- `seq` must be strictly increasing. Out-of-order samples are ignored.
- No progress before `startAt − 50 ms`.

### 3.2 Final validation (replay)
A result is **accepted** only if all of these hold:
1. The log decodes, is ≤ 32 KB, and its timestamps are monotonic.
2. The replay finishes in a state consistent with the claimed finish (text end or time).
3. Replay elapsed time agrees with server-observed time (first progress → finish
   receipt) within ±1.5 s + RTT.
4. The replayed progress curve matches the server's progress samples (each sample
   within ±8 chars of the replayed position at that time).
5. Replayed WPM ≤ 300 (configurable hard cap).

**Soft flags** (accepted for the room's results but **hidden from public
leaderboards** until reviewed, or until the user passes a verification re-test):
- Inter-key interval std-dev < 8 ms over 50+ keys (robotic).
- WPM > user's rolling best + 25 with < 20 prior races.
- Zero corrections at > 150 WPM over 200+ chars.
- `paste`/synthetic input signals from the client (`isTrusted=false` events counted and reported).

Flagged results go to `/admin/flags`. The admin can approve, reject, or shadow-ban.

### 3.3 Solo / daily results
Solo practice and the daily challenge submit via REST with the same keystroke
log, and the server replays it. The daily challenge's ranked attempt also requires
the attempt to have been **started via the server** (`POST /api/daily/attempt` →
returns `attemptId` + `startToken`). Elapsed time is checked server-side.

## 4. Text pipeline

| Source | Use | Notes |
|--------|-----|-------|
| Word lists (`packages/shared/text/words-en-*.json`) | words / time modes, bots | Top 200 / 1k / 5k English. Public-domain frequency lists |
| Curated quotes (`Text` collection, `source: 'curated'`) | quote mode, races | **Public-domain** sources (Project Gutenberg, pre-1929 authors) + original texts. Tagged length/difficulty. Replaces `utils/quotes.js` (B19) |
| AI texts (`source: 'ai'`) | topic texts, drills, races | Pre-generated nightly pools + on-demand (04-ai.md). Always moderated |
| Code snippets (`source: 'curated' \| 'ai'`, `tags: ['code', lang]`) | code mode | Original snippets; normalized indentation (2 spaces); ≤ 25 lines |
| Custom (`source: 'custom'`) | private rooms | Moderated, ≤ 1500 chars, stored only if the room is persisted |

Difficulty score = f(avg word length, % punctuation, % capitals, % rare words,
digits). Computed when a text is ingested. Easy/medium/hard thresholds are tuned
from data.

## 5. Bots

- `BotDriver` simulates a racer server-side: target WPM sampled around the room's
  median (or a player's rating band), keystroke timing from a log-normal
  distribution, per-bigram slowdowns, 2–5% error rate with corrections, and
  occasional micro-pauses at punctuation.
- Bots are **always labeled** (🤖 badge), never get XP or leaderboard entries, and
  never appear in ranked.
- Names and avatars come from the space name list. Lines are pre-generated (M4
  adds AI personas with canned taunts and emotes).
- Purpose: there's never an empty lobby, so time-to-first-race is under 15 s at
  any hour.

## 6. Progression

### 6.1 XP & levels
- `xp = round(wpm × (accuracy/100)² × durationFactor) + bonuses`, where `durationFactor = clamp(elapsedSec/30, 0.5, 2)`.
- Bonuses: win +20 (≥3 humans), first race of the day +25, daily challenge +50,
  new PB +30, 100% accuracy +15.
- Level `n` requires `round(100 × n^1.5)` cumulative XP. Shown with level-up
  animation and unlocks (avatars and themes at levels 5/10/20/30/50).
- Anti-farm: XP only for races ≥ 10 s with accuracy ≥ 75%, and guest XP is
  capped at 1,000 total until sign-up (a strong upgrade nudge).

### 6.2 Streaks
- A day counts if the user completes ≥ 1 race or practice ≥ 30 s, in **their
  stored timezone** (IANA, captured from the browser).
- Streak freeze: auto-consumed on a missed day. Free users get 1/month; Pro gets
  up to 2 stored, refilling weekly.
- The worker job at 00:15 local per-timezone bucket resets broken streaks and
  sends an opt-in reminder email/push at 19:00 local if today isn't done yet.

### 6.3 Achievements (initial set, declarative)

Stored as `{ code, name, description, tier, criteria }`. They're evaluated by
`progression/achievements.ts` after each accepted result and are idempotent.

| Category | Examples |
|----------|----------|
| Speed | 40 / 60 / 80 / 100 / 120 / 150 WPM (accuracy ≥ 95%) |
| Accuracy | 100% accuracy on a ≥ 60 s test; 20 races in a row ≥ 97% |
| Volume | 10 / 100 / 1,000 races; 1 / 10 / 100 hours typed |
| Streak | 3 / 7 / 30 / 100 / 365 days |
| Social | Host a room with 5+ players; invite a friend who completes a race; win against a friend |
| Competitive | First win; 10 wins; win by < 0.5 s; reach Gold / Diamond (M6) |
| Explorer | Try code mode; complete a daily challenge; finish an AI drill |

### 6.4 Rating (ranked, M6)
- **OpenSkill (Weng-Lin / Plackett-Luce)**, built for free-for-all multiplayer
  (`openskill` npm). Store `mu`, `sigma`. Display `ordinal = mu − 3σ` mapped to
  0–3000.
- Tiers: Bronze < 800 ≤ Silver < 1200 ≤ Gold < 1600 ≤ Platinum < 2000 ≤ Diamond <
  2400 ≤ Legend (top 100).
- Placement: 5 races. Leaving mid-race counts as last place.
- Seasons: 8 weeks. Soft reset (`mu` pulled 50% toward the mean, `sigma` raised).
  End-of-season cosmetic rewards per tier.
- Matchmaking: queue by ordinal band ±150, widening by 50 every 5 s, with a 3-player
  minimum after 20 s, 2 after 40 s.

### 6.5 Personal bests & leaderboards
- PB key: `(userId, mode, duration|wordCount, language)`. Updated only from
  **accepted, unflagged** results.
- Boards: daily, weekly, and all-time per `(mode, duration, language, device)`.
  Friends boards are computed on read from the friend list + PB.
- Live boards in Redis zsets (`03-data-and-api.md` §2). All-time is backed by the
  `PersonalBest` collection with a compound index.
