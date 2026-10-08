import { useEffect } from 'react';
import type { RefObject } from 'react';
import { FORBIDDEN_ROUND_KEYS } from '../../lib/gameRules';
import { useLatest } from './useLatest';
import type { KeyMode } from './useRound';

export interface KeyActions {
  leaveGame: () => void;
  onReadyBtnClick: () => void;
  toggleLeaderboard: () => void;
  toggleLeaderboardLevel: () => void;
  refreshLeaderboard: () => void;
  toggleDifficulty: () => void;
}

/**
 * The page-wide keydown handler. Legacy swapped two listeners
 * (keyBindsFunction / preventDefaultKeys via toggleEventListener); here one
 * listener dispatches on `modeRef`, which the round state machine flips.
 */
export function useGameKeys(modeRef: RefObject<KeyMode>, actions: KeyActions): void {
  const actionsRef = useLatest(actions);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const a = actionsRef.current;
      if (modeRef.current === 'round') {
        // legacy preventDefaultKeys
        if (FORBIDDEN_ROUND_KEYS.includes(e.key)) e.preventDefault();
        return;
      }
      // legacy keyBindsFunction (independent ifs, like the original)
      if (e.key === 'Escape') {
        e.preventDefault();
        a.leaveGame();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        a.onReadyBtnClick();
      }
      if (e.key === '`') {
        e.preventDefault();
        a.toggleLeaderboard();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        a.toggleLeaderboardLevel();
      }
      if (e.ctrlKey && e.key === 'Control') {
        e.preventDefault();
        a.refreshLeaderboard();
      }
      if (e.altKey && e.key === 'Alt') {
        e.preventDefault();
        a.toggleDifficulty();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modeRef, actionsRef]);
}
