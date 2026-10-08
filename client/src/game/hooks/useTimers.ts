import { useCallback, useEffect, useRef } from 'react';

export type TimerHandle = number;

export interface Timers {
  /** setTimeout that is cancelled automatically on unmount. */
  after: (fn: () => void, ms: number) => TimerHandle;
  /** setInterval that is cancelled automatically on unmount. */
  every: (fn: () => void, ms: number) => TimerHandle;
  /** Cancel one timer (a handle that already fired or is undefined is ignored). */
  cancel: (handle: TimerHandle | undefined) => void;
  cancelAll: () => void;
}

/**
 * A registry of timers owned by one component. Every timer started through it
 * is cleared when the component unmounts, so no callback can fire into a
 * dead page (and StrictMode's mount / cleanup / mount cycle leaves nothing behind).
 */
export function useTimers(): Timers {
  const live = useRef(new Map<TimerHandle, 'timeout' | 'interval'>());

  const cancel = useCallback((handle: TimerHandle | undefined) => {
    if (handle === undefined) return;
    const kind = live.current.get(handle);
    if (kind === 'timeout') window.clearTimeout(handle);
    else if (kind === 'interval') window.clearInterval(handle);
    live.current.delete(handle);
  }, []);

  const cancelAll = useCallback(() => {
    for (const handle of [...live.current.keys()]) cancel(handle);
  }, [cancel]);

  const after = useCallback((fn: () => void, ms: number) => {
    const handle = window.setTimeout(() => {
      live.current.delete(handle);
      fn();
    }, ms);
    live.current.set(handle, 'timeout');
    return handle;
  }, []);

  const every = useCallback((fn: () => void, ms: number) => {
    const handle = window.setInterval(fn, ms);
    live.current.set(handle, 'interval');
    return handle;
  }, []);

  useEffect(() => cancelAll, [cancelAll]);

  return { after, every, cancel, cancelAll };
}
