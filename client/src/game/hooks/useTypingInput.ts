import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent, KeyboardEvent, RefObject } from 'react';
import { pressBackspace, pressSpace, typeChar } from '../../engine';
import type { TypingEngineApi } from './useTypingEngine';
import { CURSOR_TRANSITION } from './useTypingCaret';

/** Keys whose default (moving the caret inside the hidden input) is suppressed; legacy list incl. its odd names. */
const BLOCKED_KEYS: ReadonlySet<string> = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'HomeLeft',
  'End',
  'EndRight',
]);

interface UseTypingInputArgs {
  enabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  engine: Pick<TypingEngineApi, 'engineRef' | 'apply'>;
}

export interface TypingInputApi {
  /** Caps Lock indicator visible (legacy: .caps-lock without .hidden). */
  capsLock: boolean;
  /** An input event has happened this round: real cursor shown, dummy cursor hidden. */
  started: boolean;
  onInput: (event: FormEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  /** Click on the quote focuses the hidden input. */
  focusInput: () => void;
}

/**
 * Port of the legacy input plumbing (initTyping reading of the hidden field,
 * the input keydown/paste listeners and the document keydown focus grab).
 */
export function useTypingInput({ enabled, inputRef, engine }: UseTypingInputArgs): TypingInputApi {
  const [capsLock, setCapsLock] = useState(false);
  const [started, setStarted] = useState(false);
  // legacy `i`: index of the newest character inside the accumulated input value
  const indexRef = useRef(0);
  const { engineRef, apply } = engine;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  // legacy: document.addEventListener("keydown", () => inpField.focus())
  useEffect(() => {
    document.addEventListener('keydown', focusInput);
    return () => document.removeEventListener('keydown', focusInput);
  }, [focusInput]);

  /** Whether engine operations are accepted right now. */
  const accepting = useCallback((): boolean => {
    const current = engineRef.current;
    return enabled && current !== null && !current.finished;
  }, [enabled, engineRef]);

  const resetField = (input: HTMLInputElement) => {
    input.value = '';
    indexRef.current = 0;
  };

  const onInput = (event: FormEvent<HTMLInputElement>) => {
    if (!accepting()) return;
    setStarted(true);
    const input = event.currentTarget;
    const typedChar: string | undefined = input.value.split('')[indexRef.current];
    indexRef.current++;
    if (typedChar === ' ') {
      resetField(input);
      apply(pressSpace, CURSOR_TRANSITION);
    } else if (typedChar === undefined) {
      // a deletion on a soft keyboard: the value got shorter
      resetField(input);
      apply(pressBackspace, CURSOR_TRANSITION);
    } else {
      apply((state) => typeChar(state, typedChar), CURSOR_TRANSITION);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'));
    const input = event.currentTarget;
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (accepting()) {
        resetField(input);
        apply(pressBackspace, '');
      }
    }
    if (BLOCKED_KEYS.has(event.key)) {
      event.preventDefault();
    }
    if (input.selectionStart !== input.selectionEnd) {
      input.selectionStart = input.selectionEnd;
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
  };

  return { capsLock, started, onInput, onKeyDown, onPaste, focusInput };
}
