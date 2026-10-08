import { createElement, useMemo, useRef } from 'react';
import type { ReactElement } from 'react';
import type { EngineState, LetterModel } from '../../engine';
import { useTypingCaret } from '../hooks/useTypingCaret';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { useTypingInput } from '../hooks/useTypingInput';
import type { TypingAreaProps } from '../types';

const PLACEHOLDER = 'Press Enter or Click on Get Ready button to start....';

/**
 * The legacy quote letters are the non-standard `<letter>` element. Decision:
 * render them as the valid custom element `<ty-letter>`.
 * - No stylesheet targets the `letter` tag; everything hangs off `.letter`.
 * - Both `<letter>` (HTMLUnknownElement) and `<ty-letter>` (undefined custom
 *   element) are plain `display: inline` elements with no UA styles, so layout
 *   (and the getBoundingClientRect maths of the caret) is identical.
 * - A `<span>` would NOT be identical: game.css has a global `span { position: relative }`.
 * - React warns "The tag <letter> is unrecognized in this browser" for `letter`
 *   but not for hyphenated custom element names.
 */
const LETTER_TAG = 'ty-letter';

/**
 * Same decision for the words. Legacy puts `div.word` inside `p#text-content`
 * (innerHTML allows it), but React warns "<div> cannot be a descendant of <p>".
 * `.word` is `display: inline-block` and no rule targets `div` (a `span` would
 * add `position: relative`), so the hyphenated custom element
 * `<ty-word class="word">` renders identically and keeps the `p#text-content` wrapper.
 */
const WORD_TAG = 'ty-word';

const STOPWATCH_RUNNING_COLOR = '#e2b714';

function hiddenWhen(base: string, hidden: boolean): string {
  return hidden ? `${base} hidden`.trim() : base;
}

/** Legacy class strings: letter | letter current | letter correctText | letter incorrectText | letter missed | letter incorrectText extra */
function letterClassName(letter: LetterModel, current: boolean, ended: boolean): string {
  const classes = ['letter'];
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
  if (current) classes.push('current');
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
  const { engine, commit, transitionRef } = typing;
  const input = useTypingInput({ enabled, inputRef, engine: typing });
  useTypingCaret({ refs: caretRefs, engine, commit, ended, transitionRef });

  return (
    <div className="container" ref={containerRef}>
      <div className={hiddenWhen('time-up-warn', !timeUp)}>
        <p>Time Up!</p>
      </div>
      <div className="timerClass">
        <h3>
          <strong
            className="stopwatch"
            style={timerRunning ? { color: STOPWATCH_RUNNING_COLOR } : undefined}
          >
            {timeLabel}
          </strong>
        </h3>
      </div>
      <div className={hiddenWhen('caps-lock', !input.capsLock)}>
        <p>
          <i className="bx bxs-lock-alt"></i> Caps Lock
        </p>
      </div>
      <div id="cursor" ref={cursorRef} className={hiddenWhen('', !input.started || ended)}></div>
      <div
        className="text-content-div"
        ref={contentDivRef}
        style={{ overflow: ended ? 'auto' : 'hidden' }}
      >
        <div
          className={hiddenWhen('dummy-cursor', !enabled || input.started || ended)}
        ></div>
        <p id="text-content" ref={textRef} onClick={input.focusInput}>
          {engine === null ? PLACEHOLDER : renderQuote(engine, ended)}
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
