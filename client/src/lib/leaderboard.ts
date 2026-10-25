import type { LeaderboardPlayer } from '../types/socket';

export type BoardDevice = 'iphone' | 'computer';

export interface LeaderboardEntry {
  joinId: number;
  username: string;
  userAvatar: string;
  Highscore: number;
  device: BoardDevice;
}

export interface Boards {
  easy: LeaderboardEntry[];
  medium: LeaderboardEntry[];
}

type Level = 'Easy' | 'Medium';
type Device = 'Mobile' | 'Laptop';

/** Score of a row, or 0 for anything malformed (missing/non-numeric), which drops it. */
function scoreOf(row: unknown, level: Level, device: Device): number {
  if (typeof row !== 'object' || row === null) return 0;
  const hs = (row as { highScore?: unknown }).highScore;
  if (typeof hs !== 'object' || hs === null) return 0;
  const lv = (hs as Record<string, unknown>)[level];
  if (typeof lv !== 'object' || lv === null) return 0;
  const v = (lv as Record<string, unknown>)[device];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function pick(players: readonly LeaderboardPlayer[], level: Level, device: Device): LeaderboardEntry[] {
  const out: LeaderboardEntry[] = [];
  for (const p of players) {
    const score = scoreOf(p, level, device);
    if (score === 0) continue;
    out.push({
      joinId: p.joinId,
      username: p.username,
      userAvatar: p.userAvatar,
      Highscore: score,
      device: device === 'Mobile' ? 'iphone' : 'computer',
    });
  }
  return out;
}

/**
 * Legacy transform: per level, Mobile entries then Laptop entries, zero scores
 * dropped, then a stable sort by score descending.
 */
export function buildBoards(players: readonly LeaderboardPlayer[]): Boards {
  const list = Array.isArray(players) ? players : [];
  const sortDesc = (a: LeaderboardEntry, b: LeaderboardEntry) => b.Highscore - a.Highscore;
  return {
    easy: pick(list, 'Easy', 'Mobile').concat(pick(list, 'Easy', 'Laptop')).sort(sortDesc),
    medium: pick(list, 'Medium', 'Mobile').concat(pick(list, 'Medium', 'Laptop')).sort(sortDesc),
  };
}

export async function fetchLeaderboard(signal?: AbortSignal): Promise<LeaderboardPlayer[]> {
  const res = await fetch('/get-users-leaderboard', { method: 'GET', signal });
  if (!res.ok) throw new Error(`leaderboard request failed: ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error('leaderboard response is not a list');
  return data as LeaderboardPlayer[];
}
