import { useCallback, useState } from 'react';
import { avatarLeft } from '../../lib/gameRules';
import type { RoomUser } from '../../types/socket';

export const STATUS_READY_COLOR = '#03ca0b';
export const STATUS_NOT_READY_COLOR = '#ff4848';

/** One `div.progress-bar` of the race track (legacy refreshProgressContainer). */
export interface Lane {
  id: string;
  username: string;
  avatar: string;
  /** rendered as "YOU" with the `player-you` class */
  isSelf: boolean;
  /** text of `.user-curr-wpm`, e.g. "42 wpm" */
  wpmLabel: string;
  /** inline `left` of the avatar, e.g. "26.7%" */
  left: string | undefined;
  /** text of `.user-rank-wpm`; null = empty */
  rank: number | null;
  /** inline background of `.status-circle`; undefined = stylesheet colour */
  statusColor: string | undefined;
  /** inline flex `order` of the lane; undefined = never reordered */
  order: number | undefined;
  /** `.status-circle` carries the `hidden` class */
  circleHidden: boolean;
}

export interface RaceTrack {
  /** null until the first 'add user progress' (the legacy page shows a static "YOU:" bar until then) */
  lanes: Lane[] | null;
  refresh: (users: RoomUser[]) => void;
  applyProgress: (users: RoomUser[]) => void;
  setStatus: (id: string, ready: boolean) => void;
  setRank: (id: string, rank: number) => void;
  resetForRound: () => void;
  setCirclesHidden: (hidden: boolean) => void;
}

/**
 * Race-track state. Every legacy handler looked lanes up with getElementById and
 * threw a TypeError when the lane did not exist; here events for an unknown
 * lane are ignored instead (listed as a deviation in the report).
 */
export function useRaceTrack(getSocketId: () => string | undefined): RaceTrack {
  const [lanes, setLanes] = useState<Lane[] | null>(null);

  /** 'add user progress' / 'remove user progress': rebuild every lane from scratch, current player first. */
  const refresh = useCallback(
    (users: RoomUser[]) => {
      const selfId = getSocketId();
      let built: Lane[] = [];
      for (const user of users) {
        const lane: Lane = {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isSelf: selfId === user.id,
          wpmLabel: '0 wpm',
          left: undefined,
          rank: null,
          statusColor: undefined,
          order: undefined,
          circleHidden: false,
        };
        // legacy: the current player's markup was prepended, everybody else appended
        built = lane.isSelf ? [lane, ...built] : [...built, lane];
      }
      setLanes(built);
    },
    [getSocketId],
  );

  /** 'user progress': reorder by currWpm (own lane first), move avatars, update the "N wpm" labels. */
  const applyProgress = useCallback(
    (users: RoomUser[]) => {
      const selfId = getSocketId();
      const sorted = [...users].sort((a, b) => b.currWpm - a.currWpm);
      setLanes((prev) => {
        if (prev === null) return prev;
        const known = new Set(prev.map((lane) => lane.id));
        const orders = new Map<string, number>();
        let currOrder = 2;
        for (const user of sorted) {
          if (!known.has(user.id)) continue;
          if (user.id === selfId) {
            orders.set(user.id, 1);
          } else {
            orders.set(user.id, currOrder);
            currOrder++;
          }
        }
        const byId = new Map(users.map((user) => [user.id, user]));
        return prev.map((lane) => {
          const user = byId.get(lane.id);
          if (!user) return lane;
          return {
            ...lane,
            order: orders.get(lane.id) ?? lane.order,
            wpmLabel: `${user.currWpm} wpm`,
            left: avatarLeft(user.progress),
          };
        });
      });
    },
    [getSocketId],
  );

  const patchLane = useCallback((id: string, patch: Partial<Lane>) => {
    setLanes((prev) => {
      if (prev === null || !prev.some((lane) => lane.id === id)) return prev;
      return prev.map((lane) => (lane.id === id ? { ...lane, ...patch } : lane));
    });
  }, []);

  const setStatus = useCallback(
    (id: string, ready: boolean) => {
      patchLane(id, { statusColor: ready ? STATUS_READY_COLOR : STATUS_NOT_READY_COLOR });
    },
    [patchLane],
  );

  const setRank = useCallback(
    (id: string, rank: number) => {
      patchLane(id, { rank });
    },
    [patchLane],
  );

  /** 'start game': empty the rank labels, "0 wpm", avatars back to 0%. */
  const resetForRound = useCallback(() => {
    setLanes((prev) =>
      prev === null ? prev : prev.map((lane) => ({ ...lane, rank: null, wpmLabel: '0 wpm', left: '0%' })),
    );
  }, []);

  const setCirclesHidden = useCallback((hidden: boolean) => {
    setLanes((prev) => (prev === null ? prev : prev.map((lane) => ({ ...lane, circleHidden: hidden }))));
  }, []);

  return { lanes, refresh, applyProgress, setStatus, setRank, resetForRound, setCirclesHidden };
}
