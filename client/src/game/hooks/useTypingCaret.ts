import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { EngineState } from '../../engine';

export interface TypingCaretRefs {
  /** div.container (the cursor is positioned relative to it) */
  container: RefObject<HTMLDivElement | null>;
  /** div#cursor */
  cursor: RefObject<HTMLDivElement | null>;
  /** div.text-content-div (the clipping viewport) */
  contentDiv: RefObject<HTMLDivElement | null>;
  /** p#text-content (its marginTop is the scroll offset); its children are the word divs */
  text: RefObject<HTMLParagraphElement | null>;
}

/** Cursor transition used while typing (legacy initTyping / spacePressed). */
export const CURSOR_TRANSITION = 'top 0.08s linear, left 0.08s linear';

const WIDE_THRESHOLD = 600;
const WIDE_SCROLL_TRIGGER = 90;
const NARROW_SCROLL_TRIGGER = 60;
const STEP_BACK = 36.1;

function currentMargin(text: HTMLElement): number {
  const margin = parseFloat(text.style.marginTop || '0px');
  // Legacy would propagate NaN into the layout; the margin is only ever written by us, so this is a pure safety net.
  return Number.isFinite(margin) ? margin : 0;
}

/**
 * Faithful port of legacy getLineAndCursor(): places #cursor on the current
 * letter (or after the current word when past its last letter) and scrolls
 * #text-content by whole thirds of the viewport height.
 */
export function getLineAndCursor(refs: TypingCaretRefs, engine: EngineState): void {
  const container = refs.container.current;
  const cursor = refs.cursor.current;
  const contentDiv = refs.contentDiv.current;
  const text = refs.text.current;
  if (!container || !cursor || !contentDiv || !text) return;

  const nextWord = text.children[engine.wordIndex];
  // Legacy would throw on a missing current word; nothing to position then.
  if (!nextWord) return;
  const nextLetter = nextWord.children[engine.letterIndex] as Element | undefined;

  const containerDivRect = container.getBoundingClientRect();
  const nextWordRect = nextWord.getBoundingClientRect();
  const parentDivRect = contentDiv.getBoundingClientRect();
  const parentRelativeTop = nextWordRect.top - parentDivRect.top;
  const relativeTop = nextWordRect.top - containerDivRect.top;

  const targetRect = (nextLetter ?? nextWord).getBoundingClientRect();
  cursor.style.top = targetRect.top - containerDivRect.top + 2 + 'px';
  cursor.style.left =
    (nextLetter ? targetRect.left : targetRect.right) - containerDivRect.left - 3 + 'px';

  const hbythree = parentDivRect.height / 3;

  if (parentDivRect.width > WIDE_THRESHOLD) {
    if (parentRelativeTop > WIDE_SCROLL_TRIGGER) {
      const margin = currentMargin(text);
      text.style.marginTop = `${margin - 2 * hbythree}px`;
      cursor.style.top = `${relativeTop - 2 * hbythree}px`;
    }
  } else if (parentRelativeTop > NARROW_SCROLL_TRIGGER) {
    const margin = currentMargin(text);
    text.style.marginTop = `${margin - hbythree}px`;
    cursor.style.top = `${relativeTop - hbythree}px`;
  }

  if (parentRelativeTop < 0) {
    const margin = currentMargin(text);
    text.style.marginTop = `${margin + STEP_BACK}px`;
    cursor.style.top = `${relativeTop + STEP_BACK}px`;
  }
}

interface UseTypingCaretArgs {
  refs: TypingCaretRefs;
  engine: EngineState | null;
  /** Counts applied engine operations; a caret update runs once per new value. */
  commit: number;
  ended: boolean;
  transitionRef: RefObject<string>;
  passesRef: RefObject<number>;
}

/**
 * Layout effects behind the caret and the line scrolling.
 * - mount (every new round, the parent remounts): cursor back to top 53px / left 23px, scroll cleared
 * - after each applied operation: legacy `cursor.style.transition = ...; getLineAndCursor()`, run
 *   once or twice exactly as often as legacy did (the second pass re-measures the layout the first
 *   pass just scrolled, so it can scroll again and corrects the caret position)
 * - round end: scroll cleared (the text div becomes overflow:auto, rendered by the component); when the
 *   round ended on the final keystroke the legacy handler still ran getLineAndCursor() AFTER endGame()
 *   had cleared the offset, which re-applies a scroll so the last lines stay visible
 */
export function useTypingCaret({ refs, engine, commit, ended, transitionRef, passesRef }: UseTypingCaretArgs): void {
  useLayoutEffect(() => {
    const cursor = refs.cursor.current;
    const text = refs.text.current;
    if (cursor) {
      cursor.style.top = '53px';
      cursor.style.left = '23px';
    }
    if (text) text.style.marginTop = '';
  }, [refs]);

  const handledCommit = useRef(0);
  useLayoutEffect(() => {
    if (commit === handledCommit.current) return;
    handledCommit.current = commit;
    if (ended || engine === null) return;
    const cursor = refs.cursor.current;
    if (cursor) cursor.style.transition = transitionRef.current;
    for (let pass = 0; pass < passesRef.current; pass++) getLineAndCursor(refs, engine);
  }, [commit, engine, ended, refs, transitionRef, passesRef]);

  // Latest engine for the round-end effect below without re-running it on every operation.
  const latestEngine = useRef(engine);
  useLayoutEffect(() => {
    latestEngine.current = engine;
  });

  useLayoutEffect(() => {
    if (!ended) return;
    const text = refs.text.current;
    if (text) text.style.marginTop = '';
    const finalState = latestEngine.current;
    if (finalState?.finished) getLineAndCursor(refs, finalState);
  }, [ended, refs]);
}
