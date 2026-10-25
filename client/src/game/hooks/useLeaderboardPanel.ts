import { useCallback, useState } from 'react';
import type { Difficulty } from '../../types/socket';

export interface LeaderboardPanel {
  open: boolean;
  level: Difficulty;
  /** the logged-in player's join id (highlighted row) */
  joinId: number | null;
  refreshToken: number;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
  setLevel: (level: Difficulty) => void;
  /** Tab key: Easy <-> Medium */
  toggleLevel: () => void;
  /** legacy populateLeaderboard(): re-fetch GET /get-users-leaderboard */
  refresh: () => void;
  setJoinId: (joinId: number) => void;
}

/** State of the leaderboard modal. The legacy page starts with it open. */
export function useLeaderboardPanel(): LeaderboardPanel {
  const [open, setOpen] = useState(true);
  const [level, setLevel] = useState<Difficulty>('easy');
  const [joinId, setJoinId] = useState<number | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  const toggleLevel = useCallback(() => setLevel((l) => (l === 'easy' ? 'medium' : 'easy')), []);
  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  return { open, level, joinId, refreshToken, setOpen, toggle, close, setLevel, toggleLevel, refresh, setJoinId };
}
