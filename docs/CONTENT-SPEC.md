# TypeDash Academy — Content Specification

All course content lives in four plain-JavaScript data files under `js/data/`.
They are loaded with classic `<script>` tags (no modules, no build step) so the
app also works when `index.html` is opened straight from disk (`file://`).

Every data file has the same shape:

```js
/* TypeDash Academy — <what this file holds> */
(function (TD) {
  'use strict';
  TD.data = TD.data || {};
  TD.data.<name> = /* ... */;
})(window.TD = window.TD || {});
```

Run `node tools/validate-data.js` after any change. It checks every rule below.

---

## Global text rules (apply to everything a learner types)

* Plain printable ASCII only (`0x20`–`0x7E`) plus `\n` for line breaks.
  No curly quotes, no em/en dashes, no ellipsis character, no tabs, no emoji.
* Single spaces between words. No leading or trailing spaces on a line.
* Family-friendly, inclusive, original writing. No real-person claims, no brands
  in a negative light, no politics, no copyrighted passages or song lyrics.

---

## 1. `words.js` → `TD.data.words`

Each list is **one space-separated string** of lowercase words (`/^[a-z]+$/`),
no duplicates inside a list, most common / most useful words first.

| key | contents | minimum |
| --- | --- | --- |
| `common` | the ~1000 most frequent English words, roughly in frequency order (`the of and to a in is you that it ...`). Single letters only `a` and `i`. | 900 |
| `extra` | 3000–4000 further everyday words (inflections such as `jumps`, `jumped`, `jumping` welcome) that are **not** in `common`. Must give good coverage for restricted letter sets: home-row words (`flask salsa gash`), top+home words (`typewriter quiet puppet`), left-hand words (`sweater bazaar`), right-hand words (`kiln pumpkin lollipop`). | 3000 |
| `len2` `len3` `len4` `len5` | common words of exactly 2 / 3 / 4 / 5 letters | 40 / 80 / 80 / 80 |
| `homeRow` | only letters `asdfghjkl` | 50 |
| `homeTop` | only letters `qwertyuiopasdfghjkl` (home + top rows) | 150 |
| `leftHand` | only letters `qwertasdfgzxcvb` | 80 |
| `rightHand` | only letters `yuiophjklnm` | 40 |
| `alternating` | letters strictly alternate hands (left `qwertasdfgzxcvb`, right `yuiophjklnm`), e.g. `the`, `if`, `sign`, `girl`, `problem` | 60 |
| `difficult` | commonly misspelled or awkward-to-type words (`necessary rhythm accommodate`) | 80 |
| `pinky` | every word has at least two letters from `qazp` | 60 |
| `ring` | every word has at least two letters from `wsxol` | 60 |
| `bottomRow` | every word has at least two letters from `zxcvbnm` | 60 |
| `seq` | object; each key is a letter sequence, value is a list of words that contain it | see below |

`seq` keys (each ≥ 30 words, except `eigh ough spr scr` which need ≥ 20):
`th he the and ing ion tion ment ough ight eigh str spr scr er re ed ly ch sh wh ph pre pro con com able less ness qu ck ou`

No offensive or crude words anywhere (the validator has a blocklist).

---

## 2. `texts.js` → `TD.data.texts`

Arrays of strings (except `code`). Every item obeys the global text rules.

| key | contents | minimum |
| --- | --- | --- |
| `pangrams` | sentences using every letter a–z, mixed case allowed, may end with `.` | 10 |
| `sentencesShort` | 4–7 words, **lowercase letters and spaces only** | 60 |
| `sentencesMedium` | 8–14 words, **lowercase letters and spaces only** | 50 |
| `capitals` | sentences with several capitalised words (names, places, days, months, `I`), ending with `.` Only letters, spaces and `.` | 40 |
| `commas` | sentences using commas and full stops (letters, spaces, `,` `.` and capitals only) | 40 |
| `questions` | questions and exclamations; letters, spaces, `, . ? !` and capitals only | 40 |
| `paragraphs` | 3–5 sentences, 50–110 words, standard punctuation (`, . ? ! ' " - ;` allowed) | 20 |
| `speed` | smooth, easy paragraphs of common words for speed tests, 40–80 words, only `, .` punctuation | 20 |
| `rhythm` | very even text: short common words of similar length, lowercase, no punctuation, 25–50 words | 12 |
| `accuracy` | tricky text for precision: double letters, look-alike words (`their there they're`), awkward reaches, mixed case, 20–60 words | 20 |
| `chat` | chat conversations, 4–8 messages separated by `\n`, each line `Name: message`, casual punctuation, contractions, simple emoticons like `:)` | 15 |
| `emails` | short emails: greeting line, body, sign-off and name, lines separated by `\n` (a blank line is `\n\n`), 50–120 words | 12 |
| `news` | original, fictional, neutral news-style paragraphs, 70–130 words | 12 |
| `technical` | clear technical explanations (how DNS, caches, compilers, batteries ... work), 60–120 words | 12 |
| `numbers` | sentences rich in numbers, dates, times, prices, percentages, measurements (`At 7:45 on 03/12/2026 the price rose 12.5% to $48.90.`) | 25 |
| `symbols` | symbol drills for programmers, e.g. `( ) [ ] { } ; : = + - * / < > ! & \| _ # @ $ % ^ ~` mixed with short identifiers, 30–80 chars | 12 |
| `longform` | original essays or stories, 200–350 words, paragraphs separated by `\n\n` | 6 |
| `code` | **objects** `{ lang, title, text }`; `lang` ∈ `javascript python html css sql bash json`; `text` is 4–14 lines, 2-space indentation, `\n` line breaks, no tabs, no trailing spaces | 18 |

---

## 3. `guides.js` → `TD.data.guides` and `TD.data.tips`

`TD.data.guides` is an array of guide objects. Guides are reading lessons placed
**between episodes** in the learning path (and reachable from the Guides library).

```js
{
  id: 'posture',                 // unique, kebab-case
  title: 'Sit Like a Pro',
  icon: '🪑',                    // a single emoji
  before: '1.1',                 // episode id this guide appears right before; or 'end'
  minutes: 2,                    // reading time
  summary: 'One-line teaser shown on the path card.',
  blocks: [ /* Block objects, see below */ ]
}
```

Block types (text fields support inline `**bold**`, `*italic*`, `` `code` `` and `[[Key]]` which renders a keycap, e.g. `[[Shift]]`, `[[F]]`):

| type | fields | renders |
| --- | --- | --- |
| `p` | `text` | paragraph |
| `h` | `text` | sub-heading |
| `list` | `items: [text]` | bullet list |
| `steps` | `items: [text]` | numbered steps |
| `tip` | `title?`, `text` | green "pro tip" callout |
| `warn` | `title?`, `text` | amber "watch out" callout |
| `keys` | `keys` (characters), `caption?` | on-screen keyboard with those keys lit in their finger colours |
| `fingers` | `caption?` | full finger-zone keyboard plus hands diagram |
| `compare` | `good`, `bad` | side-by-side "Do / Don't" |
| `try` | `text`, `caption?` | small inline typing drill the reader can type right there (only characters a learner has met by that point) |

`TD.data.tips` is an array of ≥ 80 one-line typing tips (max 140 characters each)
shown on episode intro and results screens.

---

## 4. `curriculum.js` → `TD.data.curriculum`

```js
TD.data.curriculum = {
  chapters: [
    {
      id: 1,
      title: 'Keyboard Familiarization',
      level: 'beginner',            // beginner | intermediate | advanced | expert
      goal: 'Understand finger positioning',
      summary: 'Home row, finger positioning, keyboard layout',
      episodes: [ /* Episode */ ]
    }
  ]
};
```

### Episode

```js
{
  id: '2.2',                        // must match the official list below
  title: 'Home Row Repetition',
  summary: 'asdf jkl; in one smooth sweep.',
  minutes: 3,                       // rough duration
  keys: 'asdfjkl;',                 // allowed characters for this episode (space is always allowed,
                                    //  '\n' only where a source needs it); '*' = no restriction
  newKeys: 'asdfjkl;',              // keys introduced here ('' if none) - highlighted on the intro screen
  errorMode: 'stop',                // optional; default by chapter (see below)
  goals: { wpm: 10, accuracy: 92 }, // star targets
  pass:  { accuracy: 80 },          // optional; minimum to complete the episode (may also contain wpm)
  unlock: { bestWpm: 35 },          // optional extra unlock rule (best WPM so far must reach it)
  tip: 'Keep your eyes on the screen, not the keys.',
  intro: 'One or two short paragraphs shown before the episode starts.',
  steps: [ /* Step */ ]
}
```

**Stars:** ★ = completed with `pass` met · ★★ = accuracy ≥ `goals.accuracy` · ★★★ = also WPM ≥ `goals.wpm`.
Episode WPM/accuracy are aggregated over all typing steps, or only over steps with `scored: true` if any exist.

**Default error modes** (episode `errorMode` or step `options.errorMode` override):
`stop` for chapters 1–7 (a wrong key does not advance; press the right key) ·
`advance` for chapters 8–12 (keep typing; Backspace allowed).
`correct` = a wrong key must be removed with Backspace before you can continue.

**Default pass accuracy:** 80% (ch 1–4), 85% (ch 5–8), 88% (ch 9–12).

### Step

```js
{ type: 'learn', title, text, keys? }          // explanation card: keyboard with `keys` lit + hands; Enter to continue
{ type: 'keys',  title, text?, keys, count, order? } // "find the key" game: one key at a time; order 'random' (default) or 'sequence'
{ type: 'type',  title, text?, source, options?, scored? }        // untimed: type the whole generated text
{ type: 'timed', title, text?, seconds, source, options?, scored? } // timed: text keeps extending until time is up
```

`text` on a step is a one-line instruction shown above the typing area.

### Source (what text to generate)

| kind | fields | produces |
| --- | --- | --- |
| `text` | `text` | exactly that text |
| `repeat` | `pattern`, `times` | pattern repeated, joined by spaces: `asdf jkl; asdf jkl;` |
| `drill` | `items`, `each` | each item repeated `each` times in order: `fj fj fj dk dk dk` |
| `shuffle` | `items`, `count` | `count` items picked at random (no immediate repeats) |
| `words` | `list` (array, or a list name such as `'len3'`, `'seq.th'`, `'homeRow'`, `'common'`), `count` | random words from the list |
| `letters` | `keys`, `count`, `min?`, `max?`, `focus?` | real words using only `keys` (falls back to pseudo-words); with `focus` every word contains one of those letters |
| `combos` | `keys`, `count`, `min?`, `max?`, `focus?` | pseudo-word letter groups from `keys` |
| `common` | `top`, `count` | random words from the `top` most common words |
| `corpus` | `name` (a `texts` key), `count`, `join?` (default `' '`; use `'\n'` or `'\n\n'` for multi-line), `lang?` (for `code`) | random items from a text corpus |
| `weak` | `count`, `keys?` | adaptive drill built from the learner's weakest keys and transitions (within `keys`); falls back to `letters` when there is no history yet |
| `numbers` | `count`, `style` (`digits` `mixed` `dates`) | generated number drills |
| `mix` | `parts: [Source]`, `shuffle?` | the parts joined (word-level shuffle if `shuffle`) |

### Step options

| option | effect |
| --- | --- |
| `errorMode` | `stop` / `correct` / `advance` for this step |
| `noBackspace` | Backspace is disabled (zero-backspace challenge) |
| `hideKeyboard` | hides on-screen keyboard and hands (no-look) |
| `blind` | typed characters are not coloured until the step ends |
| `lives` | sudden-death: the step ends after this many errors |
| `metronome` | `'auto'` or a number of keystrokes per minute; plays a steady tick |
| `ghost` | `'pb'` (this step's best) or a record id such as `'test60'`: race a ghost cursor |
| `record` | `'test15'` `'test30'` `'test60'` `'test120'`: counts as an official speed test |
| `autoIndent` | after Enter, leading spaces of the next line are skipped automatically (code) |

### Official episode list

```
1.1–1.6   Keyboard Familiarization      7.1–7.7   Common Letter Sequences
2.1–2.6   Home Row Mastery              8.1–8.6   Sentence Practice
3.1–3.6   Top Row Training              9.1–9.7   Speed Building
4.1–4.6   Bottom Row Training           10.1–10.6 Accuracy Training
5.1–5.6   Key Combinations              11.1–11.7 Real-World Typing
6.1–6.6   Word Building                 12.1–12.7 Ultimate Speed Challenges
```

### Key progression (what `keys` may contain)

| episodes | allowed keys |
| --- | --- |
| 1.2 | `asdf` · 1.3 `jkl;` · 1.4 `fj` · 1.5–1.6 `asdfjkl;` (1.1 is a `keys` game over all letters) |
| 2.1–2.5 | `asdfjkl;` · 2.6 adds `g h` |
| 3.1 | home row + `qweruiop` · 3.2 adds `t y` · 3.3–3.6 home + full top row |
| 4.1 | + `zxcvnm` · 4.2 adds `b` · 4.3–4.6 all 26 letters + `;` |
| 5–7 | all lowercase letters (no capitals, no punctuation) |
| 8.1–8.2 | lowercase letters · 8.3 + capitals and `.` · 8.4 + `,` · 8.5 + `? !` · 8.6 `*` |
| 9–12 | `*` (11.5 introduces the number row, 11.6 programming symbols) |
