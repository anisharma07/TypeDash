import { createElement, useMemo, useRef } from 'react';
import type { ReactElement } from 'react';
import type { EngineState, LetterModel } from '../../engine';
import { useTypingCaret } from '../hooks/useTypingCaret';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { useTypingInput } from '../hooks/useTypingInput';
import type { TypingAreaProps } from '../types';
import { withHidden } from './classes';

const PLACEHOLDER = 'Press Enter or click Get Ready. The race starts when every player is ready.';

/**
 * The legacy quote letters are the non-standard `<letter>` element. Decision:
 * render them as the valid custom element `<ty-letter>`.
 * - No stylesheet targets the tag; everything hangs off `.letter`.
 * - `<ty-letter>` (an undefined custom element) is a plain `display: inline`
 *   element with no UA styles, which the caret's getBoundingClientRect maths expects.
 * - React warns "The tag <letter> is unrecognized in this browser" for `letter`
 *   but not for hyphenated custom element names.
 */
const LETTER_TAG = 'ty-letter';

/**
 * Same decision for the words. Legacy puts `div.word` inside `p#text-content`
 * (innerHTML allows it), but React warns "<div> cannot be a descendant of <p>".
 * `.word` is `display: inline-block`, so the hyphenated custom element
 * `<ty-word class="word">` renders the same and keeps the `p#text-content` wrapper.
 */
const WORD_TAG = 'ty-word';

/** Legacy class strings: letter | letter current | letter correctText | letter incorrectText | letter missed | letter incorrectText extra */
function letterClassName(letter: LetterModel, current: boolean, ended: boolean): string {
  // legacy order: `current` is added when the caret arrives, a status class only afterwards (at the end of the
  // round for letters that were never typed), so a current letter reads "letter current incorrectText"
  const classes = current ? ['letter', 'current'] : ['letter'];
  if (letter.extra) {
    classes.push('incorrectText', 'extra');
  } else if (letter.status === 'correct') {
    classes.push('correctText');
  } else if (letter.status === 'incorrect') {
    classes.push('incorrectText');
  } else {
    if (letter.status === 'missed') classes.push('missed');
    // legacy endGame(): every letter that is neither correctText nor incorrectText becomes incorrectText
    if (ended) classes.push('incorrectText');
  }
  return classes.join(' ');
}

function renderQuote(engine: EngineState, ended: boolean): ReactElement[] {
  return engine.words.map((word, wordIndex) =>
    createElement(
      WORD_TAG,
      {
        key: wordIndex,
        className: wordIndex === engine.wordIndex ? 'word current' : 'word',
      },
      word.letters.map((letter, letterIndex) =>
        createElement(
          LETTER_TAG,
          {
            key: letterIndex,
            className: letterClassName(
              letter,
              wordIndex === engine.wordIndex && letterIndex === engine.letterIndex,
              ended,
            ),
          },
          letter.char,
        ),
      ),
    ),
  );
}

/**
 * Remounts the round for every new gameKey / quote: engine state, caret,
 * scroll offset and the hidden input all start from scratch.
 */
export function TypingArea(props: TypingAreaProps): ReactElement {
  return <TypingRound key={`${props.gameKey}\u0000${props.text ?? ''}`} {...props} />;
}

function TypingRound({
  text,
  enabled,
  ended,
  timeLabel,
  timerRunning,
  timeUp,
  onStats,
  onComplete,
}: TypingAreaProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const contentDivRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRefs = useMemo(
    () => ({ container: containerRef, cursor: cursorRef, contentDiv: contentDivRef, text: textRef }),
    [],
  );

  const typing = useTypingEngine(text, onStats, onComplete);
  const { engine, commit, transitionRef, passesRef } = typing;
  const input = useTypingInput({ enabled, inputRef, engine: typing });
  useTypingCaret({ refs: caretRefs, engine, commit, ended, transitionRef, passesRef });
  // The page re-renders this component every second (stopwatch) and on every 'user progress' event; the letters only
  // change with the engine state or the end of the round, so reuse the element tree (about 600 elements) in between.
  const quote = useMemo(() => (engine === null ? PLACEHOLDER : renderQuote(engine, ended)), [engine, ended]);

  return (
    <div className="container" ref={containerRef}>
      <div className="timerClass">
        <strong className={timerRunning ? 'stopwatch stopwatch--running' : 'stopwatch'} aria-label="Time left">
          {timeLabel}
        </strong>
      </div>
      <div className="typing-badges">
        <div className={withHidden('time-up-warn', !timeUp)} role="status">
          <p>Time up</p>
        </div>
        <div className={withHidden('caps-lock', !input.capsLock)} role="status">
          <p>
            <i className="bx bxs-lock-alt" aria-hidden="true"></i> Caps Lock is on
          </p>
        </div>
      </div>
      <div id="cursor" ref={cursorRef} className={withHidden('', !input.started || ended)}></div>
      <div
        className="text-content-div"
        ref={contentDivRef}
        style={{ overflow: ended ? 'auto' : 'hidden' }}
      >
        <div
          className={withHidden('dummy-cursor', !enabled || input.started || ended)}
        ></div>
        <p id="text-content" ref={textRef} onClick={input.focusInput}>
          {quote}
        </p>
      </div>
      <input
        type="text"
        className="input-field"
        ref={inputRef}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        disabled={!enabled}
        onInput={input.onInput}
        onKeyDown={input.onKeyDown}
        onPaste={input.onPaste}
      />
    </div>
  );
}
