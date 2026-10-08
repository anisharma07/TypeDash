# 09 — UX spec

Wireframes are intentionally low-fidelity. They fix **layout, hierarchy, states, and
behavior**, so that a designer (or an agent with the design system) can build
screens without guessing. Visual style comes from the design tokens in
[01§5](01-architecture.md#5-design--ux-principles).

## 1. Rules that apply to every screen

1. **Four states, always.** Every data-driven view defines *loading* (skeleton, not
   spinner, if > 300 ms), *empty* (says what to do next), *error* (says what
   happened and offers retry), and *offline* (banner + what still works).
2. **One primary action per screen**, visually dominant. Everything else is secondary.
3. **Never block typing with UI.** Modals, toasts, and banners never appear while a
   test or race is in progress, except the reconnect overlay.
4. **Text is never rendered as HTML.** Names, chat, room names, and custom text are
   plain text everywhere (lint-enforced, 01 conventions).
5. **Copy voice:** short, direct, a little playful (space theme), never
   condescending. Errors say what to do ("Room not found. Check the code or create
   a new room.").
6. **Optimistic UI** for ready toggles, friend actions, and settings. Roll back with
   a toast on failure.

## 2. Wireframes

### 2.1 Landing `/`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ◇ TypeDash                       Daily  Leaderboard  Pricing  [Sign in]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│            Race your friends. Prove your speed.                     │
│                                                                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │  ▶ PLAY NOW  │  │ Create room  │  │ Practice solo│              │
│   │ (primary)    │  │ invite link  │  │ 15·30·60·120 │              │
│   └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│   ┌── Today's challenge ─────────────┐  ┌── You ───────────────────┐│
│   │ Same text for everyone · 2h 14m  │  │ 🔥 5-day streak  Lv 12   ││
│   │ 1,284 players        [Take it]   │  │ Best 74 wpm · 96% acc    ││
│   └──────────────────────────────────┘  └──────────────────────────┘│
│   Live now: 142 racing · 23 rooms                                   │
└─────────────────────────────────────────────────────────────────────┘
```
- First-time visitor: the "You" card is replaced by a one-line explainer. No sign-up
  wall. A random space name is assigned silently.
- **Play now** → `/play`. **Create room** → opens the settings drawer, then `/r/:code`.
- The typing test itself is embeddable here on SEO pages (G-01) so a visitor can
  type without clicking anything.

### 2.2 Lobby `/r/:code`

```
┌─────────────────────────────────────────────────────────────────────┐
│ Room  K7M2QX  [Copy link] [QR]           Waiting for players (3/10) │
├──────────────────────────────────┬──────────────────────────────────┤
│ PLAYERS                          │ SETTINGS  (host only editable)   │
│ ┌────────────────────────────┐   │ Text      ○ Quotes ● Words ○ Code│
│ │ 👑 NovaK     Lv 12   ✅ ready│   │ Length    ○ 30s ● 60s ○ 120s     │
│ │ 🚀 Orion7    Lv  3   ⬜ ...  │   │ Difficulty  Easy · [Medium] · Hard│
│ │ 🛰 you       Lv  1   ⬜ ...  │   │ Max players  10                  │
│ └────────────────────────────┘   │ Visibility   Private              │
│ Spectators: 1                    │ [AI topic ▾] (Pro: unlimited)     │
├──────────────────────────────────┴──────────────────────────────────┤
│ CHAT                                                                │
│ NovaK: ready when you are                              [  message ] │
├─────────────────────────────────────────────────────────────────────┤
│               [ READY  ⏎ ]            (host: [ START ])             │
└─────────────────────────────────────────────────────────────────────┘
```
- `Enter` toggles ready. Changing a setting un-readies everyone (with a toast
  explaining why).
- Invite panel: link, QR, native share sheet on mobile.
- Late arrivals during a race see "Race in progress — you'll join the next one" and
  a live spectator view.
- Host controls on each player row: transfer host, kick.

### 2.3 Race (typing view)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ● ● ○   3                                     │  ← traffic light + countdown
├─────────────────────────────────────────────────────────────────────┤
│ 🚀 Orion7   ──────────────●──────────────────────────────  61 wpm  │
│ 🛰 you      ────────────────────●────────────────────────   58 wpm  │  ← your lane is always first
│ 👑 NovaK    ───────────────────────────●─────────────────   72 wpm  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   the quick brown fox jumps over the lazy dog and keeps running     │
│   until the ▌ending of the line where a new one begins smoothly     │
│   with the caret moving between letters and never jumping           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                  0:42            [Esc] leave                        │
└─────────────────────────────────────────────────────────────────────┘
```
- **Focus mode while racing:** nav, chat, and ads are gone. Only the track, text,
  and clock remain.
- Own progress updates locally every keystroke (zero latency). Others update at 5 Hz
  with interpolation so the motion looks smooth.
- Focus lost → a translucent "Click or press any key to continue typing" overlay.
  The clock keeps running.
- Finishing: your avatar crosses the finish line, your place is shown big, and the
  text area freezes until the race ends for others (spectate their tracks).

### 2.4 Results

```
┌─────────────────────────────────────────────────────────────────────┐
│  🥈 2nd place                                          +86 XP  Lv 12→13│
├───────────────┬─────────────────────────────────────────────────────┤
│   72 wpm      │   WPM over time                                      │
│   raw 75      │   ╱╲_╱‾╲___╱‾‾╲                                      │
│   96% acc     │   errors:  ✕   ✕       ✕                             │
│   consist. 88 │                                                      │
├───────────────┴─────────────────────────────────────────────────────┤
│ 1 NovaK 81 · 2 you 72 · 3 Orion7 64                                 │
├─────────────────────────────────────────────────────────────────────┤
│ 🎖 New badge: Steady Hands      🏆 New personal best (60s)           │
│ 🤖 Coach: "You slow down 120 ms on 'th'."   [See plan]  (card)      │
├─────────────────────────────────────────────────────────────────────┤
│ [ Rematch ⏎ ]   [ Practice weak keys ]   [ Share ]   [ Leave ]      │
└─────────────────────────────────────────────────────────────────────┘
```
- Order of reveal: place → numbers → chart → rewards, with a 600 ms staggered
  animation (skipped with reduced motion).
- Exactly one **primary** next action: *Rematch* (rooms), *Next race* (quick
  match), *Again* (solo).
- Coach card appears every 10th race or on a PB, never on every race.
- Guests see a "Save your progress" banner after the 3rd race and after a PB.

### 2.5 Stats `/stats`

```
┌─ Range: [7d] 30d all ──────────────────────────────────────────────┐
│ WPM / accuracy trend (line)                      Races 142 · 3h 41m │
├────────────────────────────────────────────────────────────────────┤
│ Keyboard heatmap (layout-aware)      │ Slowest bigrams              │
│ ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐               │ th  212 ms   he  198 ms      │
│ │q│w│e│r│t│y│u│i│o│p│  colour =      │ in  187 ms   ...            │
│ │ a s d f g h j k l ;│  error rate    │                              │
├────────────────────────────────────────────────────────────────────┤
│ 🤖 Coach  headline · 3 tips · 7-day plan          [Start today's drill]│
└────────────────────────────────────────────────────────────────────┘
```
- Locked sections (beyond free history, AI v2 drills) show the real data blurred
  with an upgrade card. See the paywall rules in §2.6.

### 2.6 Paywall moments (M5)

Show the upgrade card **only** when the user hits a real limit or looks at a Pro
feature. Never as a random popup, never during typing, never more than once per
session per feature.

```
┌──────────────────────────────────────────────┐
│ You've used your free coach report this week │
│ Pro: unlimited AI coaching, full history,    │
│ 50-player rooms, no ads.                     │
│ [ See Pro · $4.99/mo ]        [ Maybe later ]│
└──────────────────────────────────────────────┘
```
The card names the specific limit hit, links to `/pricing` with `?from=<feature>`, and
fires `paywall_viewed` (10§1).

## 3. Keyboard shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Practice / results | Restart with a new text |
| `Tab` then `Enter` | Practice | Restart with the same text |
| `Esc` | Race / lobby | Open menu (leave room, settings). Confirmation before leaving a live race |
| `Enter` | Lobby | Toggle ready. Results: rematch |
| `?` | Anywhere not typing | Shortcut help overlay |
| `/` | Anywhere not typing | Focus search/command palette (M3+) |
| `Ctrl/Cmd + Enter` | Chat | Send |

Shortcuts never trigger while the typing input has focus during a test, except `Tab`
(restart) and `Esc`. All shortcuts are listed in `?` and in Settings. The legacy
`Ctrl`/`Alt` modifier hijacking is removed.

## 4. Accessibility

- WCAG 2.2 AA: contrast ≥ 4.5:1 for text, 3:1 for UI. Verified in all themes by an
  automated token check.
- Correct/incorrect letters use **color and a second cue** (underline for incorrect,
  dim for untyped), so color blindness never hides state.
- Countdown and results use `aria-live="polite"`. The final place is announced.
- Text size slider (100–200%), dyslexia-friendly font option, adjustable caret.
- Full keyboard navigation with visible focus rings. No keyboard traps (the typing
  input releases focus on `Esc`).
- `prefers-reduced-motion`: no particles, no stagger animations, no caret smoothing.
- Screen readers do not read the typing text letter by letter (the text region is
  `aria-hidden` during a test with a separate polite status for WPM at the end).
- CI runs axe on every page in the e2e suite (06§6).

## 5. Sound & motion

- Sounds are **off by default** for first-time visitors (autoplay policy and
  courtesy). A one-click toggle sits in the nav and settings.
- Sprite set under 100 KB total: key click (3 variants), error, countdown beep,
  go, finish, level-up, badge. Played through Web Audio after the first user
  gesture. Target latency under 20 ms.
- Particles (the space background) pause during typing and are disabled on
  `prefers-reduced-motion`, on devices with ≤ 4 CPU cores or ≤ 4 GB memory
  (`navigator.hardwareConcurrency`, `deviceMemory`), and on mobile by default.

## 6. Mobile, IME and keyboard layouts

Typing on phones is the most technically fragile part of the product, because soft
keyboards do not behave like physical ones. Treat this section as the spec for task
M1-13 and M3-18.

### 6.1 Input strategy
- Use a visually hidden but focusable `<textarea>` (not `contenteditable`) with
  `autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false"
  inputmode="text" enterkeyhint="done"`. Tapping the text area focuses it, which
  opens the keyboard.
- **Do not rely on `keydown`.** On Android (Gboard and others) `keydown` often
  reports `key: "Unidentified"` / `keyCode: 229`. Drive the engine from
  `beforeinput` / `input` events: `insertText`, `deleteContentBackward`, and
  composition events (`compositionstart/update/end`). Convert each into engine
  `KeyEvent`s (`char` or `Backspace`) with a timestamp.
- Keep the hidden input's value as the *current word buffer* and clear it on space,
  like the legacy app. Diff the value against the previous value on each event to
  derive what changed.
- A composition update that changes several characters at once (swipe typing,
  predictive-word taps, voice dictation) is **detected** (more than one character
  inserted in a single event outside a deliberate IME composition) and handled as:
  allowed in practice mode (marked "assisted", not on boards), rejected in ranked,
  races, and certificates.
- Paste (`insertFromPaste`, drop) is always blocked.
- Keep the caret and current line in view when the keyboard opens: listen to
  `visualViewport` `resize`/`scroll`, scroll the text container, and use `dvh`
  units. Avoid `position: fixed` bars at the bottom on iOS.
- Disable pull-to-refresh and overscroll while a test is active
  (`overscroll-behavior: none`).

### 6.2 Device classification (replaces the spoofable URL param, audit B14)
Boards are split by **input evidence**, not by screen width:
- `physical`: ≥ 80% of `keydown` events during the test carried a non-empty
  `event.code` and a real `key` value.
- `soft`: otherwise (touch keyboards).
The class is computed client-side, sent with the keylog, and **re-derived on the
server from the log's metadata** (key codes present or not). Mismatch → the server
value wins. Boards: `desktop` (physical) and `mobile` (soft). An iPad with a hardware
keyboard correctly lands on the physical board.

### 6.3 Real-device test matrix (manual, before each milestone exit from M2 on)

| Device / browser | Keyboard | Must pass |
|------------------|----------|-----------|
| iPhone, Safari (current and current −1 iOS) | Default + predictive on | No autocorrect changes, caret in view, countdown → type → results |
| iPhone, Chrome | Default | Same |
| Android (Pixel), Chrome | Gboard (predictive on) | Same + swipe typing detected |
| Android (Samsung), Chrome / Samsung Internet | Samsung Keyboard | Same |
| iPad, Safari | On-screen + hardware keyboard | Hardware keyboard lands on the physical board |
| Desktop Chrome, Firefox, Safari, Edge | Physical | Full test + race on Windows, macOS, Linux; CapsLock warning works |
| Chromebook | Physical | Full test |

"Pass" = no lost or duplicated characters, no autocorrect substitution, metrics match
a reference replay, and no layout jump when the keyboard opens or closes.

### 6.4 Keyboard layouts and international input
- The text is **characters**, so any physical layout works with no mapping. Layout
  matters only for the **heatmap** and per-key stats grouping.
- Settings: `QWERTY (default) · Dvorak · Colemak · AZERTY · QWERTZ`. A layout table
  maps each character to its physical key position per layout. Results store the
  *character*; the stats view maps to position at render time.
- Dead keys and compose sequences (é, ñ, ü): handled via composition events as in
  §6.1. A composed character counts as one correct keystroke.
- Right-to-left and Devanagari scripts are out of scope until G-05 (the engine uses
  grapheme clusters via `Intl.Segmenter` from the start, so they will work then).
