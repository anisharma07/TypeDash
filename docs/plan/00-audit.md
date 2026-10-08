# 00 — Audit of the current codebase

Snapshot of TypeDash **before** the rebuild. It explains *why* each later decision
exists, and lists the M0 hotfix scope.

## How it works today

- **Stack:** Node.js + Express + Socket.IO 4 + MongoDB (Mongoose 7), with a vanilla
  HTML/CSS/JS frontend in `public/`. About 5.3k lines. No tests, no lint, no build step.
- **Flow:** `index.html` (pick an avatar and name) → `multiplayer.html?username=…&image=…`.
  Every socket is pushed into one global `users` array (`utils/functions.js`). All
  events are sent with `io.emit` to everyone. A race starts only when **every**
  connected user is ready. The client runs its own countdown and timer, computes its
  own WPM, and sends it to the server, which stores it as a high score in the
  `racers` collection.
- **Identity:** each join creates a Racer with a random 6‑digit `joinId`. Typing
  that number into "Log in" restores the identity.

## Bugs & risks (ordered by severity)

| # | Severity | Issue | Where |
|---|----------|-------|-------|
| B1 | 🔴 Critical | **Stored XSS.** `username` comes from the URL query string, is saved to the DB, and is rendered with `innerHTML` in the race track and on the leaderboard for *every* visitor. The `maxlength=10` limit exists only on the client. | `public/js/socket.js`, `public/js/leaderboard.js`, `app.js` `join` |
| B2 | 🔴 Critical | **PII leak.** `GET /get-users-leaderboard` returns every full Racer document, including `userContact` (phone/email/Instagram entered for prizes). | `app.js:29` |
| B3 | 🔴 Critical | **Trivial cheating.** The server trusts any `wpm` sent in `user score` and `progress`. `socket.emit("user score",{wpm:999,quoteLevel:1})` in the console tops the board. | `app.js` `user score`, `progress` |
| B4 | 🔴 Critical | **Server crash.** `users[getUserIndex(socket.id)].x = …` with no check. If the index is `-1` (an event after disconnect, or before `join`), this throws a `TypeError` that can kill the Node process. | `app.js` `ready status`, `not ready`, `leave match`, `progress`, `user score` |
| B5 | 🔴 Critical | **Account takeover.** "Log in" is a guessable 6‑digit `joinId`. | `join by Id` |
| B6 | 🟠 High | **One idle tab blocks everyone.** A race needs *all* global users ready. | `ready status` |
| B7 | 🟠 High | **Joining mid-race breaks the race.** `add user progress` re-renders every bar for all clients. Late joiners have `leaveMatch` undefined, so `end game on request` never fires. | `join`, `leave match` |
| B8 | 🟠 High | **The DB connection string (with password) is logged** on every boot. | `utils/functions.js:4` |
| B9 | 🟠 High | Every `join` creates a **new Racer document**. `save()` is neither awaited nor error-handled. The `playerIds` cache loads asynchronously, so ID collisions are possible on boot. | `app.js` `join`, `utils/functions.js` |
| B10 | 🟡 Medium | `get rank` **sorts the shared `users` array in place** and ranks by the client-supplied WPM. | `app.js` `get rank` |
| B11 | 🟡 Medium | `wpm = counter/5 * 60/timepassed`. Ending in the first second gives `Infinity`/`NaN`. Accuracy ignores corrected errors and extra letters. | `multiplayer.js` `setWPM`, `showSummary` |
| B12 | 🟡 Medium | Start and timer are client `setTimeout`s, so latency and tab throttling mean unfair starts. | `socket.js` `start game` |
| B13 | 🟡 Medium | Leaderboard sorts by `highscore` (a field that doesn't exist) and returns the whole collection with no limit. | `app.js:30` |
| B14 | 🟡 Medium | Device category is a URL param chosen by window width, so mobile and laptop boards are spoofable. | `index.js`, `socket.js` |
| B15 | 🟢 Low | Dead code (`checkIfunique`, `setWordspermin`, `getCurrentUser`, `SpaceHitScore`, a `game users` event with no listener). `updateMany` vs `updateOne` is inconsistent. Mongoose options are deprecated. | various |
| B16 | 🟢 Low | Backspace into the previous word is commented out. Typing logic is tangled with DOM state. | `multiplayer.js` |
| B17 | 🟢 Low | About **14 MB of images and video** (several PNGs are 1–1.8 MB). Free-tier cold starts. | `public/images`, hosting |
| B18 | 🟢 Low | `nodemon` is a prod dependency, there's no `start` script, the image is `node:18` (EOL), and compose bind-mounts source in "prod" profiles. | `package.json`, `Dockerfile` |
| B19 | 🟢 Low | **Content licensing:** `utils/quotes.js` contains quotes from living and recent authors. Fine for a hobby project, but a commercial product needs public-domain or licensed or original (AI-generated) texts. | `utils/quotes.js` |

## What to keep

- The **space identity** (avatars, planets, particles, glitch logo, traffic-light
  countdown). It's distinctive.
- The **mouseless, keyboard-first** spirit.
- The **event/exhibition** use case. It becomes the Tournaments & Events product (M7).
- The word list and avatar names. Quotes get re-licensed (B19).

## M0 hotfix scope (on the legacy code, while the rebuild happens)

Only what protects users and the live site. Everything else is fixed by the rebuild.
Task details are in [07-backlog.md](07-backlog.md#m0--legacy-hotfix-week-1).

- B1 XSS, B2 PII leak, B4 crash guards, B8 secret logging, B3 basic server-side
  score sanity check, B9 duplicate records.
