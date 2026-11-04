# TypeDash Academy

**The offline training edition of TypeDash.** A client-only touch-typing course, in the spirit of TypingClub, that takes a learner from their first home-row key to 60+ WPM. It has 12 chapters and 76 short episodes, with guides and typing tricks between lessons and drills that adapt to each learner's weak keys. Progress is saved in the browser's `localStorage`. There is no server, account, build step or internet connection.

**Live:** https://anisharma07.github.io/TypeDash/

---

## Run it

| Option | How |
| --- | --- |
| **Just open it** | Double-click `index.html`. It works straight from disk (`file://`), offline. |
| **Serve it** (optional) | `python3 -m http.server 8080` or `npx serve .` inside this folder, then open `http://localhost:8080`. Served over http(s), it can also be installed as an app and cached for offline use (service worker). |

Use Chrome, Edge, Firefox or Safari (2023 or later) with a **physical keyboard**. The lessons assume a US QWERTY layout.

---

## What's inside

- **Structured course.** It has 12 chapters and 76 episodes, from keyboard familiarization through the home, top and bottom rows, key combinations, words, letter clusters, sentences, speed, accuracy and real-world text, up to WPM milestones.
- **The 5-step episode pattern.** Each pattern episode has a pattern introduction, repetition, word practice and a 30-second speed challenge, followed by results with stars.
- **26 guides between episodes.** They cover posture, the finger map, muscle memory, the Shift technique, rhythm, plateaus, error fixing, the number row and coding. Each guide includes interactive "try it" boxes, keyboard diagrams and do/don't comparisons.
- **Adaptive learning engine**
  - *Weak-key detection*: per-key error rate and hesitation, weighted towards recent practice.
  - *Weak transitions*: letter pairs such as `th` and `io` that slow the learner down.
  - *Focus drills*: when a step goes badly, an extra drill on the missed keys is added automatically.
  - *Weighted generation*: every generated drill leans on the learner's weak keys.
  - *Smart revision*: suggests finished episodes to repeat.
- **On-screen keyboard and hands.** The next key lights up in its finger's colour, the correct Shift key is shown (opposite hand), and a hint reads e.g. *"E · Left middle finger · reach up from D"*.
- **Three error modes**
  - *Stop on error*: chapters 1–7.
  - *Must correct with Backspace*: the error-correction drills.
  - *Free flow*: chapters 8–12.
- **Special training modes**: no-look (hidden keyboard), blind (no colour feedback), rhythm metronome, sudden-death lives, zero-backspace, ghost race against your best run, and auto-indent for code.
- **Practice hub**: a 10-minute daily workout, weak-key drill, row drills, common-word sets, 12 real-world corpora (chat, email, news, numbers, code...) and custom pasted text.
- **Challenges**: official 15/30/60/120-second tests, ghost race, WPM milestones, 34 achievements and a printable certificate.
- **Statistics**: speed and accuracy trends, practice minutes, an activity calendar, a keyboard heatmap (mistakes or speed), per-finger accuracy and speed, hand balance and **Typing DNA** (strongest/weakest keys, slowest transitions, common slips, typing style).
- **Multiple learners on one device**, each with their own progress, plus a local leaderboard. This makes it suitable for families, classrooms and coaching.
- **Backup & transfer**: download your progress as a file and import it into any other browser or computer (or the same browser) to carry on where you left off. See [Moving to another browser](#moving-to-another-browser).

---

## The course

| # | Chapter | Level | Episodes |
| --- | --- | --- | --- |
| 1 | Keyboard Familiarization | Beginner | Meet the Keyboard · Left Hand Home: A S D F · Right Hand Home: J K L ; · Find the F and J Bumps · Home Position Without Looking · Both Hands Together |
| 2 | Home Row Mastery | Beginner | Anchor Keys: F J D K · Home Row Sweep · Mirror Pairs · First Words · Longer Home Row Words · Home Row Remix: G and H |
| 3 | Top Row Training | Beginner | Reach Up: Q W E R and U I O P · The Full Top Row: T and Y · Finger Rolls: WE ER RE · Top Row Words · Power Words · Home and Top Row Mix |
| 4 | Bottom Row Training | Beginner | Reach Down: Z X C V and N M · The Full Bottom Row: B · Inner Reaches: C V B N · Bottom Row Words · Mixed Row Words · All Three Rows Together |
| 5 | Key Combinations | Intermediate | Alternating Hands · Index Finger Reaches · Every Finger Reaches · The Big Four: THE SHE HE HER · Endings: ING ION TION · Random Letter Sequences |
| 6 | Word Building | Intermediate | Two-, Three-, Four- and Five-Letter Words · Common English Words · Difficult Spellings |
| 7 | Common Letter Sequences | Intermediate | TH · ING · TION · MENT · OUGH, IGHT and EIGH · STR, SPR and SCR · Mixed Sequence Drills |
| 8 | Sentence Practice | Intermediate | Short Sentences · Medium Sentences · Capital Letters · Full Stops and Commas · Questions and Exclamations · Paragraph Typing |
| 9 | Speed Building | Advanced | 15-Second Sprint · 30-Second Test · 60-Second Test · 2-Minute Test · Steady Rhythm · Speed Without Looking · Beat Your Personal Record |
| 10 | Accuracy Training | Advanced | The 95% Accuracy Challenge · Zero-Backspace Challenge · Difficult Letter Combinations · Weak Finger Training · Error Correction Drills · High Accuracy Under Pressure |
| 11 | Real-World Typing | Advanced | Chat Conversations · Email Writing · News Articles · Technical Paragraphs · Numbers and Dates · Programming Syntax · Long-Form Typing |
| 12 | Ultimate Speed Challenges | Expert | 30 · 40 · 50 · 60 · 80 · 100 WPM Challenges · Personal Best Championship |

**Stars:** ★ passed (pass accuracy reached) · ★★ accuracy goal · ★★★ accuracy and speed goal.
Each episode unlocks when the previous one is passed. The Chapter 12 milestones only pass when you actually hit the target speed, and each one also needs your best speed to be close to it before it opens. After three failed tries an episode can be skipped and revisited later. **Teacher mode** (Settings) unlocks everything, and the **placement test** opens chapters for people who can already type.

---

## Coaching plan: newbie to pro

Speeds are typical outcomes with daily practice, not guarantees.

| Phase | Chapters | Daily routine | Typical result |
| --- | --- | --- | --- |
| Week 1 | 1–2 | 15 min: 2–3 episodes, read every guide | Home row by touch, ~10 WPM |
| Weeks 2–3 | 3–4 | 15–20 min: 2 episodes + row drill of the new row | All letters by touch, 15–20 WPM |
| Weeks 4–5 | 5–7 | 20 min: episodes + 10-minute daily workout | Smooth patterns, 25–30 WPM |
| Weeks 6–7 | 8–9 | 20 min: episodes + one speed test per day | Real sentences, 30–40 WPM |
| Weeks 8–10 | 10–11 | 20–30 min: episodes + weak-key drill + custom text from real work | Clean, real-world typing, 40–50 WPM |
| Then | 12 | Daily workout + ghost race; attempt the next milestone weekly | 50–80+ WPM |

Coaching tips:
- Insist on **accuracy before speed**. Below 95% accuracy, slow down.
- Keep the **on-screen keyboard on** at first. Turn it off in Settings once the learner stops glancing at it. No-look steps always hide it.
- Check **Stats → Typing DNA** weekly to see which fingers need extra work.
- Short daily sessions beat long weekly ones. The streak counter helps.

---

## How it measures

- **WPM** = (correct characters ÷ 5) per minute. **Raw WPM** counts every keystroke.
- **Accuracy** = correct keystrokes ÷ all keystrokes (fixed mistakes still count as errors).
- **Consistency** = how even the gaps between your keystrokes are (100% = perfect metronome).
- Untimed lesson steps cap any single pause at 2 seconds, so reading an instruction mid-drill does not ruin the score. Timed tests use real time.
- **Best speed** (used for ranks and milestone unlocks) comes from 30-second-or-longer tests, and sessions of 30 seconds or more at 85%+ accuracy.

---

## Keyboard shortcuts

| Key | Where | Action |
| --- | --- | --- |
| `Enter` | Lesson overview, step summary, results | Start / continue / next |
| `Esc` | While typing | Pause menu (resume, restart step, restart episode, exit) |
| `R` | Results | Retry |
| `Backspace` / `Ctrl+Backspace` (`Option+Backspace` on Mac) | Free-flow steps | Delete a character / a word |

---

## Data and privacy

Everything stays in the browser on this device:

- `tda:index` lists the learner profiles.
- `tda:profile:<id>` holds one learner's progress, stats and settings.
- `tda:undo-import` holds a temporary snapshot so the last import can be undone (kept for 24 hours).

Clearing site data erases progress, so download a backup now and then. When `index.html` is opened from disk, the browser ties saved progress to the file's location. Keep the folder in one place, and download a backup before moving it.

### Moving to another browser

Open **Backup & transfer**. It's in Settings, on the Learners page, and on the welcome screen of a new browser.

1. **Download a backup** in the browser you have been using. You can include just the current learner or every learner on the device. The file is a small `.json` file named like `typedash-academy-mia-2026-11-04.json`.
2. **Move the file** to the other device: USB stick, email, cloud drive or chat.
3. **Import it** in the other browser. A brand-new browser offers *Restore from a backup* on its welcome screen, so there's no need to create a learner first. Drag the file onto the page or choose it.

Before anything changes, the import shows what the file contains and lets you pick an action for each learner:

| Action | When it's offered | What it does |
| --- | --- | --- |
| **Import** | The learner isn't in this browser yet | Adds them. The learner keeps the same identity, so later imports can merge. |
| **Merge** (default for a known learner) | The same learner is already here | Keeps the best of both copies: every finished lesson, the highest stars, speeds and records, all sessions and practice days, guides read and achievements. This browser's settings stay. Use it when you practise on two devices. |
| **Replace** | The same learner is already here | Makes this browser match the file exactly. Progress made here after the backup is lost. |
| **Import as a copy / separate learner** | The learner (or a learner with the same name) is already here | Adds a second learner alongside the existing one. |
| **Skip** | Always | Leaves that learner out. |

After an import you can **undo** it with one click (available for 24 hours), which restores this browser exactly as it was. The same flow restores progress in the **same browser**, for example after clearing browsing data or resetting a learner by mistake.

Files are checked when imported. Anything that isn't a TypeDash Academy backup is rejected, a file that looks edited or damaged shows a warning, and every imported value is validated. Backups from earlier versions of the app still import. Nothing is uploaded anywhere: the file stays on your devices unless you share it.

---

## Project structure

```
typedash-academy/
├── index.html              app shell (classic <script defer> tags, works from file://)
├── css/                    tokens (themes, finger colours), base, player, pages
├── js/
│   ├── core/               util, keyboard model, storage, generator, engine, stats, sound,
│   │                       course logic, practice plans, achievements, backup & transfer
│   ├── data/               words.js · texts.js · guides.js · curriculum.js  (all course content)
│   ├── ui/components/      icons, toasts/modals, charts, keyboard + hands, typing view
│   ├── ui/pages/           player, dashboard/onboarding, learn/guides, practice, challenges, stats, settings, backup
│   └── app.js              routes, navigation, theme
├── assets/                 fonts (Poppins, Bangers, Roboto Mono, bundled for offline use), avatars, favicon
├── docs/CONTENT-SPEC.md    how to write or change lessons, guides, word lists and texts
├── tools/validate-data.js  checks all content against the spec: `node tools/validate-data.js`
├── tools/test-core.js      logic tests: text generation for every episode step, engine modes, unlock rules
└── tools/build-sw.js       regenerates the offline cache list: `node tools/build-sw.js`
```

### Changing the course

All lessons are plain data. Edit `js/data/curriculum.js` (episodes and steps), `guides.js`, `texts.js` or `words.js` following [docs/CONTENT-SPEC.md](docs/CONTENT-SPEC.md), then run:

```bash
node tools/validate-data.js   # must report 0 errors
node tools/test-core.js       # generates every step of every episode and checks the engine
node tools/build-sw.js        # only matters when serving over http(s)
```

### Deploying to GitHub Pages

The live site is served from the `gh-pages` branch, which holds only the contents of this folder. After committing your changes, run:

```bash
bash typedash-academy/tools/deploy-pages.sh
```

The script validates the content and runs the logic tests. It then refreshes the offline cache list and force-pushes this folder to `gh-pages`. Pages updates within a minute or two.

---

Part of the [TypeDash](../README.md) project. The multiplayer race game lives in the repository root; this folder is fully independent and needs no Node, MongoDB or Socket.io.
Fonts: Poppins and Bangers (SIL Open Font License 1.1), Roboto Mono (Apache License 2.0).
