import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createEngine } from '../../engine';
import type { EngineState } from '../../engine';
import type { TypingStats } from '../types';

/** Maps the engine counters to the stats object the page consumes (legacy globals). */
export function toTypingStats(engine: EngineState): TypingStats {
  return {
    counter: engine.counter,
    progress: engine.progress,
    mistakes: engine.mistakes,
    totalChars: engine.totalChars,
    wordCount: engine.wordCount,
  };
}

export interface TypingEngineApi {
  /** Engine state to render; null while there is no quote (placeholder). */
  engine: EngineState | null;
  /** Always the latest engine state, safe to read from event handlers. */
  engineRef: RefObject<EngineState | null>;
  /** Increments for every applied operation (even when the engine returned the same state). */
  commit: number;
  /** CSS transition the caret should use for the next caret update (legacy `cursor.style.transition`). */
  transitionRef: RefObject<string>;
  /** How many times the caret/scroll computation runs for the latest operation (legacy runs it twice for an accepted Space and for a soft-keyboard deletion). */
  passesRef: RefObject<number>;
  /**
   * Apply one engine operation and schedule a caret update.
   * `passes` (default 1) maps (previous, next) state to the number of legacy
   * getLineAndCursor() calls that operation made.
   */
  apply: (
    op: (state: EngineState) => EngineState,
    transition: string,
    passes?: (previous: EngineState, next: EngineState) => number,
  ) => void;
}

/**
 * Holds the pure engine state for one round and reports it upwards.
 * The quote is read once on mount: the parent remounts this (via `key`) for every new round.
 * onStats / onComplete are called from an effect (never during render) and are
 * de-duplicated by state identity so React StrictMode's double effect run does not
 * report twice.
 */
export function useTypingEngine(
  text: string | null,
  onStats: (stats: TypingStats) => void,
  onComplete: (stats: TypingStats) => void,
): TypingEngineApi {
  const [engine, setEngine] = useState<EngineState | null>(() =>
    text === null ? null : createEngine(text),
  );
  const [commit, setCommit] = useState(0);
  const engineRef = useRef<EngineState | null>(engine);
  const transitionRef = useRef('');
  const passesRef = useRef(1);

  const apply = useCallback(
    (
      op: (state: EngineState) => EngineState,
      transition: string,
      passes?: (previous: EngineState, next: EngineState) => number,
    ) => {
      const current = engineRef.current;
      if (current === null) return;
      const next = op(current);
      engineRef.current = next;
      transitionRef.current = transition;
      passesRef.current = passes ? passes(current, next) : 1;
      setEngine(next);
      setCommit((c) => c + 1);
    },
    [],
  );

  const onStatsRef = useRef(onStats);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onStatsRef.current = onStats;
    onCompleteRef.current = onComplete;
  });

  const lastReported = useRef<EngineState | null>(null);
  const completed = useRef(false);
  useEffect(() => {
    if (engine === null || lastReported.current === engine) return;
    lastReported.current = engine;
    const stats = toTypingStats(engine);
    onStatsRef.current(stats);
    if (engine.finished && !completed.current) {
      completed.current = true;
      onCompleteRef.current(stats);
    }
  }, [engine]);

  return { engine, engineRef, commit, transitionRef, passesRef, apply };
}
