/**
 * Pure, DOM-free port of the typing logic of legacy/public/js/multiplayer.js.
 *
 * Legacy -> engine mapping
 * ------------------------
 *   fetchQuote(quote)              -> createEngine(text)
 *   initTyping(), typed char       -> typeChar(state, ch)       (space is delegated to pressSpace)
 *   spacePressed()                 -> pressSpace(state)
 *   backspacePressed()             -> pressBackspace(state)
 *   endGame() finish trigger       -> `finished: true`
 *   newGame() reset                -> createEngine(text) again (counter/progress/mistakes = 0)
 *
 * Legacy DOM -> state mapping
 * ---------------------------
 *   `.word.current`    == words[wordIndex]
 *   `.letter.current`  == words[wordIndex].letters[letterIndex]  when letterIndex < letters.length;
 *                         otherwise (letterIndex === letters.length) the legacy DOM has NO current letter
 *   class correctText / incorrectText == status 'correct' / 'incorrect'; no class == 'pending'
 *   `.extra` letter    == LetterModel.extra === true (always status 'incorrect', always at the end of the word)
 *   status 'missed' is never produced (see "dead code" below).
 *
 * Invariants that follow from the legacy code (and are asserted by the tests):
 *   - extras only exist while the caret is past the end of the word (letterIndex === letters.length);
 *   - progress === (typed, non-extra letters) + wordIndex
 *   - counter  === (correct letters) + wordIndex
 *   - mistakes >= (incorrect letters currently shown); backspace NEVER decrements mistakes.
 *
 * Finished state: legacy endGame() removes the "input" listener and disables the
 * input field, so no further key reaches initTyping/spacePressed/backspacePressed.
 * Hence every function returns its input state unchanged when `state.finished`.
 * (endGame also marks never-typed letters incorrect; that is presentation and is
 * done by the TypingArea component, NOT here.)
 *
 * No-op calls return the very same state object (cheap for React bail-out);
 * every effective call returns a new state and never mutates its input.
 * Words/letters that did not change are shared structurally.
 *
 * Preserved legacy quirks
 * -----------------------
 *  Q1  Typing the last letter of the last word finishes the race regardless of
 *      correctness (initTyping: !currentLetter.nextSibling && !currentWord.nextElementSibling).
 *      The finishing letter is marked first (progress++, counter++ or mistakes++).
 *  Q2  Extra letters (typed past the end of a word) are incorrect, mistakes++, but
 *      progress and counter do NOT change. They can never finish the race.
 *  Q3  Mistakes are never decremented (backspace over an incorrect letter keeps them).
 *  Q4  Backspace at the first letter of a word is a no-op: the previous-word logic is
 *      commented out in legacy. A word can never be re-entered.
 *  Q5  Backspace over an extra letter removes it without touching progress/counter;
 *      backspace over a regular letter does progress-- and (only if it was correct) counter--.
 *  Q6  Strict space: space advances only if EVERY letter of the current word is 'correct'
 *      (so also no extras) and the caret is not on the first letter. Otherwise it is
 *      silently ignored (no mistake, no progress). Wrong or missing letters must be
 *      backspaced and fixed, a word can never be skipped.
 *  Q7  Space accounting: advancing costs progress++ and counter++ (the space counts as a
 *      correct character).
 *  Q8  Dead code in spacePressed (observable behaviour reproduced by omission): the
 *      "mark remaining letters as missed, progress++ each" block can never run, because
 *      it is only reached when every letter of the word is already correct, so the set
 *      of not-yet-typed letters is empty. Likewise `if (currentLetter) removeClass else
 *      counter++`: with all letters correct the caret is always past the end, so counter++
 *      always happens. The "space on the last word => endGame()" branch is also dead in
 *      practice (typing the last letter already finished the race, see Q1) but is
 *      implemented for hand-built states; it changes neither counter nor progress.
 *  Q9  Empty words (quote with consecutive spaces / trailing space) are dead ends exactly
 *      like in legacy: advancing into an empty word still does progress++/counter++
 *      (legacy mutated state, then threw a TypeError on addClass(null)); in an empty word
 *      space is ignored (isFirstLetter is true: null === null), typed chars become
 *      extras. An empty LAST word can therefore never be finished.
 *
 * Deliberate deviations (also listed in the task report)
 *  D1  checkIfInspected (DOM anti-tamper) is not ported.
 *  D2  Legacy crashes are turned into no-ops/non-crashing: backspace inside an empty word
 *      (currentWord.lastChild === null -> TypeError before any mutation) is a no-op;
 *      an empty text "" gives one empty word (legacy threw in fetchQuote after rendering).
 *  D3  A quote starting with a space (empty FIRST word): legacy marks the first letter of
 *      the whole document as current, i.e. a letter of word 1 while word 0 is the current
 *      word (incoherent). Here word 0 is current and has no current letter, like any other
 *      empty word (Q9).
 *  D4  typeChar(state, " ") is delegated to pressSpace (as initTyping does); typeChar(state, "")
 *      is a no-op. Letters are UTF-16 code units (split("")), like legacy.
 *  D5  HTML-sensitive characters are plain data here; the legacy innerHTML XSS is gone.
 */
import type { EngineState, LetterModel, WordModel } from './types';

export function createEngine(text: string): EngineState {
  const words: WordModel[] = text.split(' ').map((w) => ({
    letters: w.split('').map((char): LetterModel => ({ char, status: 'pending' })),
  }));
  let totalChars = 0;
  for (const w of words) totalChars += w.letters.length;
  return {
    words,
    wordIndex: 0,
    letterIndex: 0,
    counter: 0,
    progress: 0,
    mistakes: 0,
    totalChars,
    wordCount: words.length,
    finished: false,
  };
}

function replaceWord(state: EngineState, letters: LetterModel[]): WordModel[] {
  const words = state.words.slice();
  words[state.wordIndex] = { letters };
  return words;
}

/** One non-backspace character typed (legacy initTyping, branches after the space/null checks). */
export function typeChar(state: EngineState, ch: string): EngineState {
  if (state.finished) return state;
  if (ch === ' ') return pressSpace(state);
  if (ch === '') return state;
  const word = state.words[state.wordIndex];
  if (word === undefined) return state;
  const letters = word.letters;
  const len = letters.length;

  if (state.letterIndex < len) {
    // currentLetter exists
    const cur = letters[state.letterIndex] as LetterModel;
    const match = cur.char === ch;
    const next = letters.slice();
    next[state.letterIndex] = { ...cur, status: match ? 'correct' : 'incorrect' };
    const hasNextLetter = state.letterIndex + 1 < len;
    const isLastWord = state.wordIndex === state.words.length - 1;
    return {
      ...state,
      words: replaceWord(state, next),
      letterIndex: state.letterIndex + 1,
      mistakes: state.mistakes + (match ? 0 : 1),
      counter: state.counter + (match ? 1 : 0),
      progress: state.progress + 1,
      finished: !hasNextLetter && isLastWord,
    };
  }

  // caret past the end of the word: append an extra incorrect letter (progress/counter untouched)
  const next = letters.slice();
  next.push({ char: ch, status: 'incorrect', extra: true });
  return {
    ...state,
    words: replaceWord(state, next),
    letterIndex: next.length,
    mistakes: state.mistakes + 1,
  };
}

/** Legacy spacePressed(). */
export function pressSpace(state: EngineState): EngineState {
  if (state.finished) return state;
  const word = state.words[state.wordIndex];
  if (word === undefined) return state;
  const len = word.letters.length;
  const hasCurrent = state.letterIndex < len;
  // currentLetter === currentWord.firstChild (null === null for an empty word)
  const isFirstLetter = hasCurrent ? state.letterIndex === 0 : len === 0;
  const allCorrect = word.letters.every((l) => l.status === 'correct');
  if (!allCorrect || isFirstLetter) return state;

  if (state.wordIndex + 1 < state.words.length) {
    return {
      ...state,
      wordIndex: state.wordIndex + 1,
      letterIndex: 0,
      progress: state.progress + 1,
      counter: hasCurrent ? state.counter : state.counter + 1,
    };
  }
  return { ...state, finished: true };
}

/** Legacy backspacePressed(). */
export function pressBackspace(state: EngineState): EngineState {
  if (state.finished) return state;
  const word = state.words[state.wordIndex];
  if (word === undefined) return state;
  const letters = word.letters;
  const len = letters.length;

  if (state.letterIndex < len) {
    if (state.letterIndex === 0) return state; // Q4: previous-word logic is commented out in legacy
    const prevIdx = state.letterIndex - 1;
    const prev = letters[prevIdx] as LetterModel;
    const next = letters.slice();
    next[prevIdx] = { ...prev, status: 'pending' };
    return {
      ...state,
      words: replaceWord(state, next),
      letterIndex: prevIdx,
      counter: state.counter - (prev.status === 'correct' ? 1 : 0),
      progress: state.progress - 1,
    };
  }

  // caret past the end
  if (len === 0) return state; // legacy: TypeError on addClass(null) before any mutation
  const last = letters[len - 1] as LetterModel;
  const counter = state.counter - (last.status === 'correct' ? 1 : 0);
  if (last.extra === true) {
    return {
      ...state,
      words: replaceWord(state, letters.slice(0, len - 1)),
      letterIndex: len - 1,
      counter,
    };
  }
  const next = letters.slice();
  next[len - 1] = { ...last, status: 'pending' };
  return {
    ...state,
    words: replaceWord(state, next),
    letterIndex: len - 1,
    counter,
    progress: state.progress - 1,
  };
}
