import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Same-origin connection (Vite proxies /socket.io to the Node server in dev). */
export function createSocket(): TypedSocket {
  return io();
}
