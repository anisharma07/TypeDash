import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

type Listener = (...args: never[]) => void;

export interface EmittedEvent {
  event: string;
  args: unknown[];
}

/**
 * In-memory stand-in for the typed socket.io client socket. Implements the
 * surface the game page uses (on / off / emit / connect / disconnect / id) and
 * adds test helpers:
 *   - receive(event, ...args)  deliver a server event to the registered listeners
 *   - emitted / emitsOf(event) what the client sent, in order
 *   - listenerCount()          leak check for unsubscribe-on-cleanup
 */
export class FakeSocket {
  /** socket.io assigns the id on connect; tests may overwrite it. */
  id: string | undefined = 'me';
  connected = false;
  connectCalls = 0;
  disconnectCalls = 0;
  readonly emitted: EmittedEvent[] = [];
  private readonly listeners = new Map<string, Set<Listener>>();

  on<E extends keyof ServerToClientEvents>(event: E, listener: ServerToClientEvents[E]): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as unknown as Listener);
    return this;
  }

  off<E extends keyof ServerToClientEvents>(event?: E, listener?: ServerToClientEvents[E]): this {
    if (event === undefined) {
      this.listeners.clear();
    } else if (listener === undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(listener as unknown as Listener);
    }
    return this;
  }

  emit<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>): this {
    this.emitted.push({ event, args });
    return this;
  }

  connect(): this {
    this.connected = true;
    this.connectCalls += 1;
    return this;
  }

  disconnect(): this {
    this.connected = false;
    this.disconnectCalls += 1;
    return this;
  }

  /** Test helper: deliver a server event to every listener registered for it. */
  receive<E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      (listener as unknown as (...a: unknown[]) => void)(...args);
    }
  }

  /** Arguments of every emit of `event`, in order. */
  emitsOf(event: keyof ClientToServerEvents): unknown[][] {
    return this.emitted.filter((e) => e.event === event).map((e) => e.args);
  }

  /** Names of everything emitted, in order. */
  emittedNames(): string[] {
    return this.emitted.map((e) => e.event);
  }

  clearEmitted(): void {
    this.emitted.length = 0;
  }

  /** Number of registered listeners (for one event, or in total). */
  listenerCount(event?: keyof ServerToClientEvents): number {
    if (event !== undefined) return this.listeners.get(event)?.size ?? 0;
    let n = 0;
    for (const set of this.listeners.values()) n += set.size;
    return n;
  }
}

/**
 * A socket factory that records every socket it creates, so StrictMode's
 * mount / cleanup / mount cycle can be asserted (`sockets.length`, `live()`).
 */
export function createFakeSocketFactory() {
  const sockets: FakeSocket[] = [];
  const factory = (): FakeSocket => {
    const socket = new FakeSocket();
    sockets.push(socket);
    return socket;
  };
  return {
    factory,
    sockets,
    /** Sockets that were created and never disconnected. */
    live: () => sockets.filter((s) => s.disconnectCalls === 0),
    /** The most recently created socket. */
    last: (): FakeSocket => {
      const s = sockets[sockets.length - 1];
      if (!s) throw new Error('no socket created yet');
      return s;
    },
  };
}
