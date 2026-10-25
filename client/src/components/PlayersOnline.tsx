import { useEffect, useState } from 'react';
import type { ServerToClientEvents } from '../types/socket';

/** The part of the socket the home page needs to follow the count (the real socket and FakeSocket both fit). */
export interface PresenceSocket {
  on(event: 'players online', listener: ServerToClientEvents['players online']): unknown;
  off(event: 'players online', listener: ServerToClientEvents['players online']): unknown;
  disconnect(): unknown;
}

/**
 * Follows the server's 'players online' count over a socket of its own. The socket never joins, so the
 * visitor is not counted as a player. Returns null until the first count arrives.
 */
export function usePlayersOnline(createSocket: () => PresenceSocket): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const socket = createSocket();
    const onCount = (n: number) => setCount(n);
    socket.on('players online', onCount);
    return () => {
      socket.off('players online', onCount);
      socket.disconnect();
    };
  }, [createSocket]);

  return count;
}

/** Top-bar badge: how many players are in the game right now. Hidden until the server has reported. */
export function PlayersOnline({ count }: { count: number | null }) {
  if (count === null) return null;
  const players = count === 1 ? 'player' : 'players';
  // Reads "3 players online"; shows "3 online" (just "3" on narrow screens).
  return (
    <div className="players-online" role="status" title={`${count} ${players} online`}>
      <i className="bx bx-group" aria-hidden="true"></i>
      {/* keyed by the value, so the pop animation replays on every change */}
      <span key={count} className="players-online-count">
        {count}
      </span>
      <span className="players-online-label">
        <span className="visually-hidden">{players} </span>online
      </span>
    </div>
  );
}
