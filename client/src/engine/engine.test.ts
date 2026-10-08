import { describe, expect, it } from 'vitest';
import { createEngine, pressBackspace, pressSpace, typeChar } from './index';
import type { EngineState } from './index';

// ---------------------------------------------------------------- helpers

const BS = '\b';

/** Feed a key string: '\b' = Backspace, ' ' = space, anything else = typeChar. */
function play(state: EngineState, keys: string): EngineState {
  let s = state;
  for (const k of keys) {
    s = k === BS ? pressBackspace(s) : k === ' ' ? pressSpace(s) : typeChar(s, k);
  }
  return s;
}

/** Status string per word: '.' pending, 'c' correct, 'x' incorrect, 'X' extra, 'm' missed. */
function statuses(s: EngineState): string {
  return s.words
    .map((w) =>
      w.letters
        .map((l) =>
          l.extra === true
            ? 'X'
            : l.status === 'pending'
              ? '.'
              : l.status === 'correct'
                ? 'c'
                : l.status === 'incorrect'
                  ? 'x'
                  : 'm',
        )
        .join(''),
    )
    .join(' ');
}

function pick(s: EngineState) {
  return {
    w: s.wordIndex,
    l: s.letterIndex,
    counter: s.counter,
    progress: s.progress,
    mistakes: s.mistakes,
    finished: s.finished,
  };
}

function deepFreeze<T>(o: T): T {
  if (o !== null && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as object)) deepFreeze(v);
  }
  return o;
}

/** mulberry32 seeded PRNG */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- createEngine

describe('createEngine', () => {
  it('splits exactly like fetchQuote', () => {
    const s = createEngine('hello big world');
    expect(s.words.map((w) => w.letters.map((l) => l.char).join(''))).toEqual(['hello', 'big', 'world']);
    expect(s.wordCount).toBe(3);
    expect(s.totalChars).toBe(13);
    expect(pick(s)).toEqual({ w: 0, l: 0, counter: 0, progress: 0, mistakes: 0, finished: false });
    expect(s.words.every((w) => w.letters.every((l) => l.status === 'pending' && l.extra === undefined))).toBe(true);
  });

  it('keeps empty words produced by consecutive/trailing spaces (split(" "))', () => {
    const s = createEngine('a  b ');
    expect(s.wordCount).toBe(4);
    expect(s.words.map((w) => w.letters.length)).toEqual([1, 0, 1, 0]);
    expect(s.totalChars).toBe(2);
  });

  it('empty text gives one empty word and does not throw', () => {
    const s = createEngine('');
    expect(s.wordCount).toBe(1);
    expect(s.totalChars).toBe(0);
    expect(s.words[0]?.letters).toEqual([]);
    expect(play(s, 'x \b')).toBeTruthy();
  });

  it('splits UTF-16 code units like String.split("")', () => {
    expect(createEngine('a\u{1F600}').totalChars).toBe(3);
  });
});

// ---------------------------------------------------------------- scenarios

interface Scenario {
  name: string;
  text: string;
  keys: string;
  statuses: string;
  w: number;
  l: number;
  counter: number;
  progress: number;
  mistakes: number;
  finished?: boolean;
}

const scenarios: Scenario[] = [
  { name: 'initial', text: 'ab cd', keys: '', statuses: '.. ..', w: 0, l: 0, counter: 0, progress: 0, mistakes: 0 },
  { name: 'one correct letter', text: 'ab cd', keys: 'a', statuses: 'c. ..', w: 0, l: 1, counter: 1, progress: 1, mistakes: 0 },
  { name: 'one wrong letter', text: 'ab cd', keys: 'z', statuses: 'x. ..', w: 0, l: 1, counter: 0, progress: 1, mistakes: 1 },
  { name: 'case sensitive', text: 'ab cd', keys: 'A', statuses: 'x. ..', w: 0, l: 1, counter: 0, progress: 1, mistakes: 1 },
  { name: 'correct then wrong, caret past end', text: 'ab cd', keys: 'ax', statuses: 'cx ..', w: 0, l: 2, counter: 1, progress: 2, mistakes: 1 },
  { name: 'extra letter: mistakes++ only', text: 'ab cd', keys: 'abz', statuses: 'ccX ..', w: 0, l: 3, counter: 2, progress: 2, mistakes: 1 },
  { name: 'two extras', text: 'ab cd', keys: 'abzz', statuses: 'ccXX ..', w: 0, l: 4, counter: 2, progress: 2, mistakes: 2 },
  { name: 'extra equal to the next word char is still an extra', text: 'ab cd', keys: 'abc', statuses: 'ccX ..', w: 0, l: 3, counter: 2, progress: 2, mistakes: 1 },
  { name: 'space after full correct word', text: 'ab cd', keys: 'ab ', statuses: 'cc ..', w: 1, l: 0, counter: 3, progress: 3, mistakes: 0 },
  { name: 'space strict: partial word ignored', text: 'ab cd', keys: 'a ', statuses: 'c. ..', w: 0, l: 1, counter: 1, progress: 1, mistakes: 0 },
  { name: 'space strict: wrong letter ignored', text: 'ab cd', keys: 'ax ', statuses: 'cx ..', w: 0, l: 2, counter: 1, progress: 2, mistakes: 1 },
  { name: 'space strict: extras ignored', text: 'ab cd', keys: 'abz ', statuses: 'ccX ..', w: 0, l: 3, counter: 2, progress: 2, mistakes: 1 },
  { name: 'space on first letter ignored', text: 'ab cd', keys: ' ', statuses: '.. ..', w: 0, l: 0, counter: 0, progress: 0, mistakes: 0 },
  { name: 'space at first letter of word 2 ignored', text: 'ab cd', keys: 'ab  ', statuses: 'cc ..', w: 1, l: 0, counter: 3, progress: 3, mistakes: 0 },
  { name: 'multiple spaces after word advance only once', text: 'ab cd ef', keys: 'ab   ', statuses: 'cc .. ..', w: 1, l: 0, counter: 3, progress: 3, mistakes: 0 },
  // backspace branches
  { name: 'backspace at start is a no-op', text: 'ab cd', keys: BS, statuses: '.. ..', w: 0, l: 0, counter: 0, progress: 0, mistakes: 0 },
  { name: 'backspace at first letter of word 2 is a no-op (no previous-word logic)', text: 'ab cd', keys: `ab ${BS}${BS}`, statuses: 'cc ..', w: 1, l: 0, counter: 3, progress: 3, mistakes: 0 },
  { name: 'backspace over correct letter (past end of 1-letter state)', text: 'ab cd', keys: `a${BS}`, statuses: '.. ..', w: 0, l: 0, counter: 0, progress: 0, mistakes: 0 },
  { name: 'backspace mid-word over correct letter: counter--, progress--', text: 'abc d', keys: `ab${BS}`, statuses: 'c.. .', w: 0, l: 1, counter: 1, progress: 1, mistakes: 0 },
  { name: 'backspace mid-word over incorrect letter: progress-- only, mistakes stay', text: 'abc d', keys: `ax${BS}`, statuses: 'c.. .', w: 0, l: 1, counter: 1, progress: 1, mistakes: 1 },
  { name: 'backspace past end over correct last letter', text: 'ab cd', keys: `ab${BS}`, statuses: 'c. ..', w: 0, l: 1, counter: 1, progress: 1, mistakes: 0 },
  { name: 'backspace past end over incorrect last letter', text: 'ab cd', keys: `ax${BS}`, statuses: 'c. ..', w: 0, l: 1, counter: 1, progress: 1, mistakes: 1 },
  { name: 'backspace removes a single extra: no counter/progress change', text: 'ab cd', keys: `abz${BS}`, statuses: 'cc ..', w: 0, l: 2, counter: 2, progress: 2, mistakes: 1 },
  { name: 'backspace removes extras one by one then the real letter', text: 'ab cd', keys: `abzz${BS}${BS}${BS}`, statuses: 'c. ..', w: 0, l: 1, counter: 1, progress: 1, mistakes: 2 },
  { name: 'fix a mistake and continue to the next word', text: 'ab cd', keys: `ax${BS}b `, statuses: 'cc ..', w: 1, l: 0, counter: 3, progress: 3, mistakes: 1 },
  { name: 'retyping after backspace counts again', text: 'ab cd', keys: `a${BS}a${BS}a`, statuses: 'c. ..', w: 0, l: 1, counter: 1, progress: 1, mistakes: 0 },
  { name: 'backspace over everything in the word returns to first letter', text: 'abc d', keys: `abc${BS}${BS}${BS}`, statuses: '... .', w: 0, l: 0, counter: 0, progress: 0, mistakes: 0 },
  { name: 'second word typing', text: 'ab cd', keys: 'ab c', statuses: 'cc c.', w: 1, l: 1, counter: 4, progress: 4, mistakes: 0 },
  { name: 'second word: wrong + extra + backspaces', text: 'ab cd e', keys: `ab cxz${BS}${BS}`, statuses: 'cc c. .', w: 1, l: 1, counter: 4, progress: 4, mistakes: 2 },
  // finish
  { name: 'whole quote correct finishes at the last letter (no trailing space needed)', text: 'ab cd', keys: 'ab cd', statuses: 'cc cc', w: 1, l: 2, counter: 5, progress: 5, mistakes: 0, finished: true },
  { name: 'last letter wrong still finishes', text: 'ab cd', keys: 'ab cx', statuses: 'cc cx', w: 1, l: 2, counter: 4, progress: 5, mistakes: 1, finished: true },
  { name: 'all wrong still finishes, strictness only applies to spaces', text: 'ab cd', keys: 'xx' + BS + BS + 'ab cx', statuses: 'cc cx', w: 1, l: 2, counter: 4, progress: 5, mistakes: 3, finished: true },
  { name: 'second to last letter does not finish', text: 'ab cd', keys: 'ab c', statuses: 'cc c.', w: 1, l: 1, counter: 4, progress: 4, mistakes: 0, finished: false },
  { name: 'single letter text finishes at once', text: 'a', keys: 'a', statuses: 'c', w: 0, l: 1, counter: 1, progress: 1, mistakes: 0, finished: true },
  { name: 'single word: wrong letters then last', text: 'abc', keys: 'xyc', statuses: 'xxc', w: 0, l: 3, counter: 1, progress: 3, mistakes: 2, finished: true },
  { name: 'input after finish is ignored (letters, space, backspace)', text: 'ab', keys: `ab xx${BS}${BS}`, statuses: 'cc', w: 0, l: 2, counter: 2, progress: 2, mistakes: 0, finished: true },
  { name: 'keys after the finishing wrong letter are ignored', text: 'ab cd', keys: `ab cx${BS}y`, statuses: 'cc cx', w: 1, l: 2, counter: 4, progress: 5, mistakes: 1, finished: true },
  // empty words are dead ends (legacy quirk)
  { name: 'advancing into an empty word still counts progress and counter', text: 'a  b', keys: 'a ', statuses: 'c  .', w: 1, l: 0, counter: 2, progress: 2, mistakes: 0 },
  { name: 'space in empty word is ignored', text: 'a  b', keys: 'a   ', statuses: 'c  .', w: 1, l: 0, counter: 2, progress: 2, mistakes: 0 },
  { name: 'backspace in empty word is a no-op (legacy would throw)', text: 'a  b', keys: `a ${BS}`, statuses: 'c  .', w: 1, l: 0, counter: 2, progress: 2, mistakes: 0 },
  { name: 'typing in empty word makes an extra; space then still ignored', text: 'a  b', keys: 'a x ', statuses: 'c X .', w: 1, l: 1, counter: 2, progress: 2, mistakes: 1 },
  { name: 'extra in empty word can be backspaced away', text: 'a  b', keys: `a x${BS}`, statuses: 'c  .', w: 1, l: 0, counter: 2, progress: 2, mistakes: 1 },
  { name: 'trailing empty last word can never finish', text: 'ab ', keys: 'ab  ', statuses: 'cc ', w: 1, l: 0, counter: 3, progress: 3, mistakes: 0, finished: false },
];

describe('scenarios derived from the legacy code', () => {
  for (const sc of scenarios) {
    it(sc.name, () => {
      const s = play(createEngine(sc.text), sc.keys);
      expect(statuses(s)).toBe(sc.statuses);
      expect(pick(s)).toEqual({
        w: sc.w,
        l: sc.l,
        counter: sc.counter,
        progress: sc.progress,
        mistakes: sc.mistakes,
        finished: sc.finished ?? false,
      });
    });
  }
});

describe('specific rules', () => {
  it('typeChar(" ") behaves exactly like pressSpace', () => {
    const base = play(createEngine('ab cd'), 'ab');
    expect(typeChar(base, ' ')).toEqual(pressSpace(base));
    const partial = play(createEngine('ab cd'), 'a');
    expect(typeChar(partial, ' ')).toEqual(pressSpace(partial));
  });

  it('typeChar("") is a no-op', () => {
    const s = createEngine('ab');
    expect(typeChar(s, '')).toBe(s);
  });

  it('extra letters never finish the race and never touch counter/progress', () => {
    const s = play(createEngine('a b'), 'a b');
    expect(s.finished).toBe(true);
    const t = play(createEngine('ab c'), 'abzzzz');
    expect(t.finished).toBe(false);
    expect(t.counter).toBe(2);
    expect(t.progress).toBe(2);
    expect(t.mistakes).toBe(4);
  });

  it('space on the last word of a hand-built state finishes without counter/progress change (dead code in legacy)', () => {
    const done = play(createEngine('ab cd'), 'ab cd');
    const reopened: EngineState = { ...done, finished: false };
    const s = pressSpace(reopened);
    expect(s.finished).toBe(true);
    expect(s.counter).toBe(done.counter);
    expect(s.progress).toBe(done.progress);
    expect(s.wordIndex).toBe(done.wordIndex);
  });

  it('space on the last word is ignored when the word is not completely correct', () => {
    const s = play(createEngine('ab cd'), 'ab c');
    expect(pressSpace(s)).toBe(s);
  });

  it('after finish every input returns the identical state', () => {
    const done = play(createEngine('ab'), 'ab');
    expect(typeChar(done, 'z')).toBe(done);
    expect(pressSpace(done)).toBe(done);
    expect(pressBackspace(done)).toBe(done);
  });

  it('progress and counter are never touched by mistakes decrementing (mistakes monotone)', () => {
    let s = createEngine('abcd efgh');
    let last = 0;
    for (const k of 'axyz\b\b\bqq\b\b\bbcd efgz') {
      s = k === BS ? pressBackspace(s) : k === ' ' ? pressSpace(s) : typeChar(s, k);
      expect(s.mistakes).toBeGreaterThanOrEqual(last);
      last = s.mistakes;
    }
  });
});

describe('immutability and structural sharing', () => {
  it('never mutates the input state and shares untouched words', () => {
    const start = deepFreeze(createEngine('ab cd ef'));
    const a = deepFreeze(typeChar(start, 'a'));
    expect(a).not.toBe(start);
    expect(start.words[0]?.letters[0]?.status).toBe('pending');
    expect(a.words[1]).toBe(start.words[1]);
    expect(a.words[2]).toBe(start.words[2]);
    expect(a.words[0]).not.toBe(start.words[0]);

    const b = deepFreeze(typeChar(a, 'b'));
    const c = deepFreeze(pressSpace(b));
    expect(c.wordIndex).toBe(1);
    const d = deepFreeze(typeChar(c, 'x'));
    expect(d.words[0]).toBe(c.words[0]);
    expect(d.words[2]).toBe(c.words[2]);
    const e = deepFreeze(typeChar(typeChar(d, 'y'), 'z'));
    const f = deepFreeze(pressBackspace(e));
    expect(e.words[1]!.letters.length).toBe(3);
    expect(f.words[1]?.letters.length).toBe(2);
  });
});

// ---------------------------------------------------------------- randomised invariants

const ALPHABET = 'abcde';

function randomText(rnd: () => number): string {
  const nWords = 1 + Math.floor(rnd() * 4);
  const parts: string[] = [];
  for (let i = 0; i < nWords; i++) {
    const len = 1 + Math.floor(rnd() * 4);
    let w = '';
    for (let j = 0; j < len; j++) w += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
    parts.push(w);
  }
  return parts.join(' ');
}

function randomKey(rnd: () => number, text: string): string {
  const r = rnd();
  if (r < 0.12) return ' ';
  if (r < 0.32) return BS;
  // bias towards the expected character for progress
  return r < 0.65 ? text[Math.floor(rnd() * text.length)]! : ALPHABET[Math.floor(rnd() * ALPHABET.length)]!;
}

function checkInvariants(s: EngineState): void {
  expect(s.wordIndex).toBeGreaterThanOrEqual(0);
  expect(s.wordIndex).toBeLessThan(s.words.length);
  const word = s.words[s.wordIndex]!;
  expect(s.letterIndex).toBeGreaterThanOrEqual(0);
  expect(s.letterIndex).toBeLessThanOrEqual(word.letters.length);
  expect(s.counter).toBeGreaterThanOrEqual(0);
  expect(s.progress).toBeGreaterThanOrEqual(0);
  expect(s.mistakes).toBeGreaterThanOrEqual(0);
  expect(s.progress).toBeLessThanOrEqual(s.totalChars + s.wordCount - 1);
  expect(s.counter).toBeLessThanOrEqual(s.progress);

  let typed = 0;
  let correct = 0;
  let incorrect = 0;
  s.words.forEach((w, wi) => {
    w.letters.forEach((l, li) => {
      expect(l.status).not.toBe('missed');
      if (l.extra === true) {
        expect(l.status).toBe('incorrect');
        expect(wi).toBe(s.wordIndex);
        expect(s.letterIndex).toBe(w.letters.length); // extras only while the caret is past the end
      } else if (l.status !== 'pending') {
        typed++;
      }
      if (l.status === 'correct') correct++;
      if (l.status === 'incorrect') incorrect++;
      // letters before the caret are typed, from the caret on they are pending (current word)
      if (wi === s.wordIndex) {
        if (li < s.letterIndex) expect(l.status).not.toBe('pending');
        else expect(l.status).toBe('pending');
      }
      if (wi < s.wordIndex) expect(l.status).toBe('correct');
      if (wi > s.wordIndex) expect(l.status).toBe('pending');
    });
  });
  // extras are strictly at the end of the word
  const lt = word.letters;
  const firstExtra = lt.findIndex((l) => l.extra === true);
  if (firstExtra >= 0) expect(lt.slice(firstExtra).every((l) => l.extra === true)).toBe(true);

  expect(s.progress).toBe(typed + s.wordIndex);
  expect(s.counter).toBe(correct + s.wordIndex);
  expect(s.mistakes).toBeGreaterThanOrEqual(incorrect);
}

describe('randomised invariants (seeded)', { timeout: 120_000 }, () => {
  it('holds for thousands of random key sequences, never mutates, finish is terminal', () => {
    const rnd = prng(0xc0ffee);
    let finishedRuns = 0;
    for (let run = 0; run < 500; run++) {
      const text = randomText(rnd);
      let s = deepFreeze(createEngine(text));
      checkInvariants(s);
      let lastMistakes = 0;
      const steps = 1 + Math.floor(rnd() * 60);
      for (let i = 0; i < steps; i++) {
        const key = randomKey(rnd, text);
        const before = s;
        const snapshot = JSON.stringify(before);
        const next: EngineState =
          key === BS ? pressBackspace(s) : key === ' ' ? pressSpace(s) : typeChar(s, key);
        expect(JSON.stringify(before)).toBe(snapshot); // input untouched (and frozen)
        if (before.finished) expect(next).toBe(before);
        expect(next.mistakes).toBeGreaterThanOrEqual(lastMistakes);
        lastMistakes = next.mistakes;
        s = deepFreeze(next);
        checkInvariants(s);
      }
      if (s.finished) {
        finishedRuns++;
        const lastWord = s.words.length - 1;
        expect(s.wordIndex).toBe(lastWord);
        expect(s.letterIndex).toBe(s.words[lastWord]!.letters.length);
      }
    }
    expect(finishedRuns).toBeGreaterThan(10); // the generator really reaches the end
  });

  it('a perfect run always ends finished with counter === progress === totalChars + wordCount - 1', () => {
    const rnd = prng(42);
    for (let run = 0; run < 200; run++) {
      const text = randomText(rnd);
      const s = play(createEngine(text), text);
      expect(s.finished).toBe(true);
      expect(s.mistakes).toBe(0);
      expect(s.counter).toBe(s.totalChars + s.wordCount - 1);
      expect(s.progress).toBe(s.counter);
    }
  });
});

// ---------------------------------------------------------------- differential test against the legacy DOM code

/**
 * Literal port of legacy initTyping/spacePressed/backspacePressed (DOM + class names + the
 * substring based removeClass), executed on a real (jsdom) DOM. cursor/scroll/checkIfInspected
 * /sound/socket parts are dropped; endGame() only sets a flag (and stops further input, as the
 * removed listener does). innerText -> textContent (jsdom has no layout).
 */
class LegacySim {
  root: HTMLElement;
  counter = 0;
  progress = 0;
  mistakes = 0;
  finished = false;
  crashes = 0;

  constructor(quote: string) {
    this.root = document.createElement('div');
    const quoteArray = quote.split(' ');
    const html = quoteArray
      .map((each) =>
        each
          .split('')
          .map((letter) => `<letter class="letter">${letter}</letter>`)
          .join(''),
      )
      .map((each) => `<div class = "word">${each}</div>`)
      .join('');
    this.root.innerHTML = html;
    this.addClass(this.root.querySelector('.word'), 'current');
    this.addClass(this.root.querySelector('.letter'), 'current');
  }

  addClass(el: Element | null, name: string): void {
    if (el === null) throw new TypeError('addClass(null)');
    el.classList.add(name);
  }
  removeClass(el: Element, name: string): void {
    el.className = el.className.replace(name, '');
  }

  key(k: string): void {
    if (this.finished) return;
    try {
      if (k === BS) this.backspacePressed();
      else this.initTyping(k);
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
      this.crashes++;
    }
  }

  endGame(): void {
    this.finished = true;
  }

  initTyping(typedChar: string): void {
    const currentWord = this.root.querySelector('.word.current')!;
    const currentLetter = this.root.querySelector('.letter.current');
    if (typedChar === ' ') {
      this.spacePressed(currentWord, currentLetter);
    } else if (currentLetter) {
      if (currentLetter.textContent !== typedChar) this.mistakes++;
      else this.counter++;
      this.progress++;
      this.addClass(currentLetter, currentLetter.textContent === typedChar ? 'correctText' : 'incorrectText');
      this.removeClass(currentLetter, 'current');
      if (!currentLetter.nextSibling && !currentWord.nextElementSibling) this.endGame();
      if (currentLetter.nextSibling) this.addClass(currentLetter.nextSibling as Element, 'current');
    } else {
      const incorrectLetter = document.createElement('letter');
      incorrectLetter.textContent = typedChar;
      incorrectLetter.className = 'letter incorrectText extra';
      currentWord.appendChild(incorrectLetter);
      this.mistakes++;
    }
  }

  spacePressed(currentWord: Element, currentLetter: Element | null): void {
    const isFirstLetter = currentLetter === currentWord.firstChild;
    const currentWordLetters = [...this.root.querySelectorAll('.word.current .letter')];
    if (currentWordLetters.every((letter) => letter.classList.contains('correctText'))) {
      if (!isFirstLetter) {
        const expectedEl = currentLetter?.innerHTML ?? ' ';
        if (expectedEl !== ' ') {
          const lettersMissed = [
            ...this.root.querySelectorAll('.word.current .letter:not(.correctText):not(.incorrectText)'),
          ];
          lettersMissed.forEach((letter) => {
            this.addClass(letter, 'missed');
            this.progress++;
          });
        }
        if (currentWord.nextSibling) {
          this.removeClass(currentWord, 'current');
          this.addClass(currentWord.nextSibling as Element, 'current');
          this.progress++;
          if (currentLetter) this.removeClass(currentLetter, 'current');
          else this.counter++;
          this.addClass((currentWord.nextSibling as Element).firstChild as Element | null, 'current');
        } else {
          this.endGame();
        }
      }
    }
  }

  backspacePressed(): void {
    const currentWord = this.root.querySelector('.word.current')!;
    const currentLetter = this.root.querySelector('.letter.current');
    const isFirstLetter = currentLetter === currentWord.firstChild;
    if (currentLetter && !isFirstLetter) {
      const prev = currentLetter.previousSibling as Element;
      if (prev.classList.contains('correctText')) this.counter--;
      this.removeClass(currentLetter, 'current');
      this.addClass(prev, 'current');
      this.removeClass(prev, 'incorrectText');
      this.removeClass(prev, 'correctText');
      this.removeClass(prev, 'missed');
      this.progress--;
    }
    if (!currentLetter) {
      const last = currentWord.lastChild as Element;
      this.addClass(last, 'current');
      if (last.classList.contains('correctText')) this.counter--;
      this.removeClass(last, 'incorrectText');
      this.removeClass(last, 'correctText');
      this.removeClass(last, 'missed');
      if (last.classList.contains('extra')) last.remove();
      else this.progress--;
    }
  }

  /** Project the DOM into the engine's state shape. */
  toState(): Pick<EngineState, 'words' | 'wordIndex' | 'letterIndex' | 'counter' | 'progress' | 'mistakes' | 'finished'> {
    const wordEls = [...this.root.querySelectorAll('.word')];
    const wordIndex = wordEls.findIndex((w) => w.classList.contains('current'));
    const words = wordEls.map((w) => ({
      letters: [...w.children].map((l) => {
        const status: 'pending' | 'correct' | 'incorrect' = l.classList.contains('correctText')
          ? 'correct'
          : l.classList.contains('incorrectText')
            ? 'incorrect'
            : 'pending';
        return l.classList.contains('extra')
          ? { char: l.textContent ?? '', status, extra: true as const }
          : { char: l.textContent ?? '', status };
      }),
    }));
    const cur = wordEls[wordIndex]!;
    const idx = [...cur.children].findIndex((l) => l.classList.contains('current'));
    return {
      words,
      wordIndex,
      letterIndex: idx === -1 ? cur.children.length : idx,
      counter: this.counter,
      progress: this.progress,
      mistakes: this.mistakes,
      finished: this.finished,
    };
  }
}

describe('differential test against the legacy DOM logic (jsdom)', { timeout: 120_000 }, () => {
  function run(seed: number, runs: number, withEmptyWords: boolean): number {
    const rnd = prng(seed);
    let totalSteps = 0;
    for (let r = 0; r < runs; r++) {
      let text = randomText(rnd);
      if (withEmptyWords && rnd() < 0.5) {
        // inject an empty word in the middle/end (never at the very start: documented deviation D3)
        const parts = text.split(' ');
        const at = 1 + Math.floor(rnd() * parts.length);
        parts.splice(at, 0, '');
        text = parts.join(' ');
      }
      const sim = new LegacySim(text);
      let s = createEngine(text);
      const steps = 1 + Math.floor(rnd() * 80);
      const log: string[] = [];
      for (let i = 0; i < steps; i++) {
        const k = randomKey(rnd, text.replace(/ /g, '') || 'a');
        const key = rnd() < 0.15 ? ' ' : k;
        log.push(key === BS ? '<' : key);
        sim.key(key);
        if (!s.finished) {
          s = key === BS ? pressBackspace(s) : key === ' ' ? pressSpace(s) : typeChar(s, key);
        }
        const expected = sim.toState();
        const actual = {
          words: s.words,
          wordIndex: s.wordIndex,
          letterIndex: s.letterIndex,
          counter: s.counter,
          progress: s.progress,
          mistakes: s.mistakes,
          finished: s.finished,
        };
        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
          throw new Error(
            `divergence for text ${JSON.stringify(text)} after keys ${JSON.stringify(log.join(''))}\n` +
              `legacy: ${JSON.stringify(expected)}\nengine: ${JSON.stringify(actual)}`,
          );
        }
        totalSteps++;
      }
    }
    return totalSteps;
  }

  it('matches on random key sequences over normal quotes', () => {
    expect(run(1234, 1000, false)).toBeGreaterThan(5000);
  });

  it('matches on random key sequences over quotes with empty words (legacy exceptions == engine no-op/partial state)', () => {
    expect(run(98765, 500, true)).toBeGreaterThan(5000);
  });

  it('the simulator itself is able to disagree (sanity: a broken engine would fail)', () => {
    const sim = new LegacySim('ab cd');
    sim.key('a');
    sim.key('x');
    const legacy = sim.toState();
    const mutated = { ...play(createEngine('ab cd'), 'ax'), counter: 2 };
    expect(JSON.stringify(legacy)).not.toBe(JSON.stringify({ ...legacy, counter: mutated.counter }));
    expect(legacy.counter).toBe(1);
    expect(legacy.mistakes).toBe(1);
  });
});
