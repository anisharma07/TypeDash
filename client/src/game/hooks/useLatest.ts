import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** A ref that always holds the value of the latest committed render (for timer / socket / key callbacks). */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
