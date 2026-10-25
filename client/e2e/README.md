# End-to-end UI tests (Playwright)

These tests drive the real app in real browsers. Each test starts its own copy of the real server (`app.js`) on a
free port, with an in-memory database (`e2e/support/fake-mongoose.cjs`). That means no MongoDB is needed, tests
don't share a lobby, and they run in parallel.

Every test also fails if:

- the server process dies, or logs an error (`[error] ...` from `logError()` in `app.js`)
- a page throws an uncaught error or logs `console.error`

## Running

```bash
npm install                      # repo root: server packages (express, socket.io)
npm --prefix client install      # client packages, including @playwright/test
npm --prefix client run e2e:install   # once: downloads Playwright's Chromium

npm run e2e                      # from the repo root, or `npm run e2e` inside client/
npm run e2e -- e2e/race.spec.ts  # one file
npm run e2e -- -g "leaderboard"  # tests whose name matches
npm --prefix client run e2e:ui   # Playwright's UI mode, to watch and debug
```

The first step of a run builds the client into `client/.e2e-dist`, so the tests always cover the current source.
`E2E_SKIP_BUILD=1` reuses the last build while you work on the tests themselves. To use a browser you already
have, set `PW_CHROMIUM_PATH=/usr/bin/brave-browser` (or the path to any other Chromium-based browser).

A full run takes about 2 minutes. Races use the real timers: a 10 s countdown, and one test waits out a full
60 s round.

## What is covered

| File | What it checks |
| --- | --- |
| `home.spec.ts` | Landing page, ship picker (mouse and arrow keys), random names and the girl-names switch, the 10-character limit, form validation, join and log-in by Player ID, the device flag, the live online count, names shown as plain text |
| `lobby.spec.ts` | Player ID and lanes, the leaderboard panel and its keys, players arriving and leaving, ready/not ready and status lights, the "invite one more player" notice, level switch, leave confirmation, returning players, unknown or malformed IDs, bad URL parameters |
| `race.spec.ts` | Countdown, letter feedback, strict space, extra letters, paste blocked, lobby keys off during a race, results and ranks, leaving a match, time up, majority level, Medium and mobile boards, best score kept, back-to-back races, dropouts and late joiners |
| `settings.spec.ts` | Settings dialog (open, close, focus trap, keys kept inside), theme filters, live theme switch, persistence, sync across tabs and pages, starfield switch, unknown saved theme, theme applied before the app script |
| `themes.spec.ts` | All 49 themes on both pages: no errors, no sideways scroll, readable text contrast |
| `responsive.spec.ts` | 320, 390, 768, 1024 and 1440 px: nothing past the right edge, key controls on screen, settings dialog fits, lobby hint never clipped (loads the real web fonts, since text width decides what fits) |
| `server.spec.ts` | Raw Socket.IO clients send every event, with junk of every type, from players who have joined and from sockets that never did. Also covers junk join details, junk Player IDs, double joins, out-of-range progress, scores only from a race and capped at 400 wpm, a flood of 60 players, disconnects mid-lookup, and a database that is down |

## README screenshots

`npm run screenshots` (from the repo root or `client/`) regenerates `docs/screenshots/*.png` by playing a short
three-player race. It needs internet access for the web fonts.

## Keeping the tests current

When a change adds or alters something a player can see or do, add or update a test here in the same change. That
includes new UI, new keys, new socket events and new server rules. When a test fails after an intended change,
update the test. When it fails without one, fix the code.

Shared selectors live in `helpers.ts` (`game(page)`), so a renamed class usually needs fixing in one place only.
