import { useCallback, useRef, useState } from 'react';
import type { Difficulty } from '../../types/socket';
import type { Emit } from './useGameSocket';

/** idle = never clicked, ready = "Ready", notReady = "Get Ready" again after un-readying (styled per phase) */
export type ReadyPhase = 'idle' | 'ready' | 'notReady';

export interface ReadyControls {
  label: 'Get Ready' | 'Ready';
  phase: ReadyPhase;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  /** Alt key: flips the select */
  toggleDifficulty: () => void;
  /** legacy onReadyBtnClick(): Get Ready -> ready (+ hide leaderboard), Ready -> not ready (+ show leaderboard) */
  onReadyBtnClick: () => void;
  /** legacy notReady() without the leaderboard side effect (used by 'start game') */
  notReady: () => void;
}

export function useReadyControls(emit: Emit, setLeaderboardOpen: (open: boolean) => void): ReadyControls {
  const [phase, setPhaseState] = useState<ReadyPhase>('idle');
  const [difficulty, setDifficultyState] = useState<Difficulty>('easy');
  // The key handler needs the current values synchronously (legacy read them from the DOM).
  const phaseRef = useRef<ReadyPhase>('idle');
  const difficultyRef = useRef<Difficulty>('easy');

  const setPhase = useCallback((next: ReadyPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const setDifficulty = useCallback((next: Difficulty) => {
    difficultyRef.current = next;
    setDifficultyState(next);
  }, []);

  const toggleDifficulty = useCallback(() => {
    setDifficulty(difficultyRef.current === 'easy' ? 'medium' : 'easy');
  }, [setDifficulty]);

  const playerReady = useCallback(() => {
    setPhase('ready');
    emit('ready status', difficultyRef.current);
  }, [emit, setPhase]);

  const notReady = useCallback(() => {
    setPhase('notReady');
    emit('not ready');
  }, [emit, setPhase]);

  const onReadyBtnClick = useCallback(() => {
    if (phaseRef.current !== 'ready') {
      playerReady();
      setLeaderboardOpen(false);
    } else {
      notReady();
      setLeaderboardOpen(true);
    }
  }, [playerReady, notReady, setLeaderboardOpen]);

  return {
    label: phase === 'ready' ? 'Ready' : 'Get Ready',
    phase,
    difficulty,
    setDifficulty,
    toggleDifficulty,
    onReadyBtnClick,
    notReady,
  };
}
