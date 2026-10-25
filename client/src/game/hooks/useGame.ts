import { useCallback, useMemo, useRef, useState } from 'react';
import { parseGameParams } from '../../lib/gameRules';
import { createSocket as createRealSocket } from '../../lib/socket';
import type { GameSocket, ServerHandlers } from './useGameSocket';
import { useEmit, useGameSocket } from './useGameSocket';
import { useGameKeys } from './useGameKeys';
import { useLeaderboardPanel } from './useLeaderboardPanel';
import { useRaceTrack } from './useRaceTrack';
import { useReadyControls } from './useReadyControls';
import type { KeyMode } from './useRound';
import { useRound } from './useRound';
import { useTimers } from './useTimers';

export const LEAVE_PROMPT = 'Are you sure you want to leave the game?';
export const HOME_URL = '/index.html';
/** how long "invite 1 more player" stays visible */
export const INSUFFICIENT_PLAYERS_MS = 5000;

export interface GameOptions {
  /** location.search of the page (join-id, username, image, identity, Device) */
  search: string;
  createSocket: () => GameSocket;
  confirmLeave: (message: string) => boolean;
  navigate: (url: string) => void;
}

export const defaultGameOptions = {
  createSocket: (): GameSocket => createRealSocket(),
  confirmLeave: (message: string): boolean => window.confirm(message),
  navigate: (url: string): void => {
    window.location.href = url;
  },
};

/** Composes the socket, the race track, the round state machine, the ready controls, the leaderboard and the key bindings. */
export function useGame({ search, createSocket, confirmLeave, navigate }: GameOptions) {
  const params = useMemo(() => parseGameParams(search), [search]);
  const socketRef = useRef<GameSocket | null>(null);
  const modeRef = useRef<KeyMode>('lobby');
  const emit = useEmit(socketRef);
  const timers = useTimers();

  const [profile, setProfile] = useState<{ username: string; userId: number | string }>({
    username: 'Username',
    userId: 123234,
  });
  const [serverWrongId, setServerWrongId] = useState(false);
  const [insufficientPlayers, setInsufficientPlayers] = useState(false);

  const getSocketId = useCallback(() => socketRef.current?.id, []);
  const race = useRaceTrack(getSocketId);
  const leaderboard = useLeaderboardPanel();
  const ready = useReadyControls(emit, leaderboard.setOpen);
  const round = useRound({
    emit,
    userDevice: params.device,
    modeRef,
    resetLanes: race.resetForRound,
    setCirclesHidden: race.setCirclesHidden,
    closeModals: leaderboard.close,
    toggleLeaderboard: leaderboard.toggle,
    notReady: ready.notReady,
  });

  const leaveGame = useCallback(() => {
    if (confirmLeave(LEAVE_PROMPT)) navigate(HOME_URL);
  }, [confirmLeave, navigate]);

  const leaveMatchRequest = useCallback(() => emit('leave match'), [emit]);

  const { setJoinId, refresh: refreshLeaderboard } = leaderboard;
  const handlers: ServerHandlers = {
    'joining id': (joinId) => {
      setProfile({ username: params.username ?? '', userId: joinId });
      setJoinId(joinId);
      refreshLeaderboard();
    },
    'joining by id': (joinId, username) => {
      setProfile({ username, userId: joinId });
      setJoinId(joinId);
      refreshLeaderboard();
    },
    'wrong join id error': () => setServerWrongId(true),
    'add user progress': race.refresh,
    'remove user progress': race.refresh,
    'user progress': race.applyProgress,
    sendStatusReady: (id) => race.setStatus(id, true),
    sendStatusNotReady: (id) => race.setStatus(id, false),
    'start game': round.startRound,
    'insufficient players': () => {
      setInsufficientPlayers(true);
      // legacy: every event schedules its own hide, nothing is debounced
      timers.after(() => setInsufficientPlayers(false), INSUFFICIENT_PLAYERS_MS);
    },
    'end game on request': round.endGame,
    'set player rank': ({ playerId, rank }) => race.setRank(playerId, rank),
    'update user leaderboard': refreshLeaderboard,
  };

  useGameSocket({ socketRef, createSocket, params, handlers });

  useGameKeys(modeRef, {
    leaveGame,
    onReadyBtnClick: ready.onReadyBtnClick,
    toggleLeaderboard: leaderboard.toggle,
    toggleLeaderboardLevel: leaderboard.toggleLevel,
    refreshLeaderboard,
    toggleDifficulty: ready.toggleDifficulty,
  });

  return {
    profile,
    // an unparsable join-id is reported locally, a rejected one by the server
    wrongId: serverWrongId || params.join.kind === 'invalid',
    insufficientPlayers,
    race,
    leaderboard,
    ready,
    round,
    leaveGame,
    leaveMatchRequest,
  };
}
