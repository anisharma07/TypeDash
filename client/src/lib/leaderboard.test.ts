import { buildBoards } from './leaderboard';
import type { LeaderboardPlayer } from '../types/socket';

const row = (
  joinId: number,
  eM: number,
  eL: number,
  mM: number,
  mL: number,
  username = `u${joinId}`,
): LeaderboardPlayer => ({
  joinId,
  username,
  userAvatar: 'avatar1',
  highScore: { Easy: { Mobile: eM, Laptop: eL }, Medium: { Mobile: mM, Laptop: mL } },
});

describe('buildBoards', () => {
  it('sorts descending and maps devices', () => {
    const b = buildBoards([row(1, 30, 50, 0, 0), row(2, 0, 40, 0, 0)]);
    expect(b.easy.map((e) => [e.joinId, e.Highscore, e.device])).toEqual([
      [1, 50, 'computer'],
      [2, 40, 'computer'],
      [1, 30, 'iphone'],
    ]);
    expect(b.easy[0]).toEqual({
      joinId: 1,
      username: 'u1',
      userAvatar: 'avatar1',
      Highscore: 50,
      device: 'computer',
    });
  });

  it('drops zero scores and keeps levels separate', () => {
    const b = buildBoards([row(1, 0, 0, 0, 20), row(2, 10, 0, 0, 0)]);
    expect(b.easy.map((e) => e.joinId)).toEqual([2]);
    expect(b.medium.map((e) => [e.joinId, e.device])).toEqual([[1, 'computer']]);
  });

  it('keeps Mobile-before-Laptop and input order on ties (stable)', () => {
    const b = buildBoards([row(1, 0, 40, 0, 0), row(2, 40, 0, 0, 0), row(3, 40, 40, 0, 0)]);
    expect(b.easy.map((e) => [e.joinId, e.device])).toEqual([
      [2, 'iphone'],
      [3, 'iphone'],
      [1, 'computer'],
      [3, 'computer'],
    ]);
  });

  it('does not crash on malformed rows and skips them', () => {
    const bad = [
      { joinId: 9, username: 'x', userAvatar: 'a' },
      null,
      { joinId: 8, username: 'y', userAvatar: 'a', highScore: { Easy: {} } },
      { joinId: 7, username: 'z', userAvatar: 'a', highScore: { Easy: { Mobile: 'fast', Laptop: NaN } } },
      row(1, 5, 0, 0, 0),
    ] as unknown as LeaderboardPlayer[];
    const b = buildBoards(bad);
    expect(b.easy.map((e) => e.joinId)).toEqual([1]);
    expect(b.medium).toEqual([]);
  });

  it('handles non-array input and empty list', () => {
    expect(buildBoards([])).toEqual({ easy: [], medium: [] });
    expect(buildBoards(null as unknown as LeaderboardPlayer[])).toEqual({ easy: [], medium: [] });
  });
});
