/**
 * Typed contract of the existing Socket.IO protocol (see /app.js).
 * The server is NOT changed by the React conversion: every event name and
 * payload below mirrors what app.js emits and listens to today.
 */

/** 0 = "easy" (random words), 1 = "medium" (quote). Mirrors server `levelOfQuote`. */
export type QuoteLevel = 0 | 1;
export type Difficulty = 'easy' | 'medium';

/** A connected player as the server broadcasts it (utils/functions.js `userJoin`). */
export interface RoomUser {
  id: string; // socket id
  username: string;
  wpm: number;
  avatar: string; // "avatar1" ... "avatar15"
  userJoinId: number;
  status: boolean; // ready
  progress: number; // 0-100
  currWpm: number;
  difficulty?: Difficulty;
  leaveMatch?: 0 | 1;
}

export interface StartGamePayload {
  quoteFromServer: string;
  levelOfQuote: QuoteLevel;
}

export interface UserScorePayload {
  wpm: number;
  quoteLevel: QuoteLevel;
  /** "mobile" or anything else (legacy sends "Laptop"/"laptop") */
  userDevice: string | null;
}

export interface JoinPayload {
  username: string | null;
  userAvatar: string | null;
  userIdentity: string | null;
}

export interface ServerToClientEvents {
  'joining id': (userJoinId: number) => void;
  'joining by id': (joinId: number, username: string) => void;
  'wrong join id error': () => void;
  'add user progress': (users: RoomUser[]) => void;
  'remove user progress': (users: RoomUser[]) => void;
  'display board': (users: RoomUser[]) => void; // emitted, never used by the legacy client
  'game users': (usernames: string[]) => void; // emitted, never used by the legacy client
  'user progress': (users: RoomUser[]) => void;
  sendStatusReady: (socketId: string) => void;
  sendStatusNotReady: (socketId: string) => void;
  'start game': (payload: StartGamePayload) => void;
  'insufficient players': () => void;
  'end game on request': () => void;
  'set player rank': (payload: { playerId: string; rank: number }) => void;
  'update user leaderboard': () => void;
}

export interface ClientToServerEvents {
  join: (payload: JoinPayload) => void;
  'join by Id': (joinId: number) => void;
  'ready status': (difficulty: Difficulty) => void;
  'not ready': () => void;
  'set leave match true': () => void;
  'leave match': () => void;
  progress: (percent: number, wpm: number) => void;
  'user score': (payload: UserScorePayload) => void;
  'get rank': () => void;
}

/** One row of GET /get-users-leaderboard (only the fields the UI reads). */
export interface LeaderboardPlayer {
  joinId: number;
  username: string;
  userAvatar: string;
  highScore: {
    Easy: { Mobile: number; Laptop: number };
    Medium: { Mobile: number; Laptop: number };
  };
}
