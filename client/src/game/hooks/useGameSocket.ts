import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { GameParams } from '../../lib/gameRules';
import type { ClientToServerEvents, ServerToClientEvents } from '../../types/socket';
import { useLatest } from './useLatest';

/** The part of the socket.io client socket the game page uses (FakeSocket implements it too). */
export interface GameSocket {
  id: string | undefined;
  on<E extends keyof ServerToClientEvents>(event: E, listener: ServerToClientEvents[E]): unknown;
  off(event: keyof ServerToClientEvents, listener: (...args: never[]) => void): unknown;
  emit<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>): unknown;
  disconnect(): unknown;
}

export type ServerHandlers = { [E in keyof ServerToClientEvents]?: ServerToClientEvents[E] };

/**
 * The events the page listens to. 'display board' and 'game users' are
 * emitted by the server but, exactly like the legacy client, never handled.
 */
export const HANDLED_EVENTS = [
  'joining id',
  'joining by id',
  'wrong join id error',
  'add user progress',
  'remove user progress',
  'user progress',
  'sendStatusReady',
  'sendStatusNotReady',
  'start game',
  'insufficient players',
  'end game on request',
  'set player rank',
  'update user leaderboard',
] as const satisfies readonly (keyof ServerToClientEvents)[];

type HandledEvent = (typeof HANDLED_EVENTS)[number];

export type Emit = <E extends keyof ClientToServerEvents>(
  event: E,
  ...args: Parameters<ClientToServerEvents[E]>
) => void;

/** Stable emit that talks to whichever socket is currently alive (no-op when there is none). */
export function useEmit(socketRef: RefObject<GameSocket | null>): Emit {
  return useCallback(
    (event, ...args) => {
      socketRef.current?.emit(event, ...args);
    },
    [socketRef],
  );
}

function subscribe<E extends HandledEvent>(
  socket: GameSocket,
  event: E,
  handlers: RefObject<ServerHandlers>,
): () => void {
  // Dispatch through the ref so the page can hand in fresh closures on every render
  // without re-subscribing.
  const listener = ((...args: Parameters<ServerToClientEvents[E]>) => {
    const handler = handlers.current[event] as ((...a: Parameters<ServerToClientEvents[E]>) => void) | undefined;
    handler?.(...args);
  }) as ServerToClientEvents[E];
  socket.on(event, listener);
  return () => {
    socket.off(event, listener);
  };
}

interface Options {
  socketRef: RefObject<GameSocket | null>;
  createSocket: () => GameSocket;
  params: GameParams;
  handlers: ServerHandlers;
}

/**
 * Owns the socket for the lifetime of the page (StrictMode safe).
 *
 * The socket is created in an effect and the join request is deferred with a
 * zero-delay timer that the cleanup cancels: React 19 StrictMode runs
 * mount -> cleanup -> mount synchronously, so the first (discarded) socket never
 * emits and exactly one join is sent per surviving connection.
 *
 * An invalid `join-id` never reaches the server (see parseJoinRequest), so no
 * socket is opened for it either: the page only shows the "WRONG JOIN ID" notice.
 */
export function useGameSocket({ socketRef, createSocket, params, handlers }: Options): void {
  const handlersRef = useLatest(handlers);
  const createRef = useLatest(createSocket);

  useEffect(() => {
    const { join, username, image, identity } = params;
    if (join.kind === 'invalid') return undefined;

    const socket = createRef.current();
    socketRef.current = socket;
    const unsubscribers = HANDLED_EVENTS.map((event) => subscribe(socket, event, handlersRef));

    const joinTimer = window.setTimeout(() => {
      if (join.kind === 'byId') {
        socket.emit('join by Id', join.joinId);
      } else {
        socket.emit('join', { username, userAvatar: image, userIdentity: identity });
      }
    }, 0);

    return () => {
      window.clearTimeout(joinTimer);
      for (const unsubscribe of unsubscribers) unsubscribe();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [params, socketRef, createRef, handlersRef]);
}
