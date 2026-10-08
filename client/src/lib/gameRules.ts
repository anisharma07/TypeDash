/**
 * Pure game rules, ported from legacy/public/js/multiplayer.js and socket.js.
 * No DOM, no timers, no sockets: everything here is unit-testable.
 */

/** Length of one round in seconds (legacy `timeInc = 60`). */
export const ROUND_SECONDS = 60;
/** Countdown before the match starts, in seconds. */
export const COUNTDOWN_SECONDS = 10;

/**
 * Legacy `setWPM()`: `Math.round((counter / 5) * (60 / timepassed))`.
 * DEVIATION: `secondsElapsed <= 0` (or a non finite input) gives 0; the legacy
 * expression produced NaN (0/0) or Infinity there.
 */
export function calcWpm(counter: number, secondsElapsed: number): number {
  if (!Number.isFinite(counter) || !Number.isFinite(secondsElapsed) || secondsElapsed <= 0) return 0;
  return Math.round((counter / 5) * (60 / secondsElapsed));
}

/** Seconds elapsed in a round given the countdown value (legacy `60 - timeInc`). */
export function secondsElapsed(timeLeft: number): number {
  return ROUND_SECONDS - timeLeft;
}

/**
 * Legacy `showSummary()` accuracy: `Math.floor(100 - (mistakes / quoteLength) * 100)`,
 * shown as "0" when it is not greater than 0 (this also covers the legacy NaN and
 * -Infinity results of an empty quote, so the output is identical).
 */
export function calcAccuracy(mistakes: number, totalChars: number): number {
  const accuracy = Math.floor(100 - (mistakes / totalChars) * 100);
  return accuracy > 0 ? accuracy : 0;
}

/** Text of `#terminal-accuracy` after a round, e.g. "97%". */
export function formatAccuracy(mistakes: number, totalChars: number): string {
  return `${calcAccuracy(mistakes, totalChars)}%`;
}

/**
 * Legacy `sendProgress()`: `Math.trunc((progress / totalChar) * 100)` with
 * `totalChar = quoteLength + noOfWords - 1`.
 * DEVIATION: a non positive denominator (empty quote) gives 0 instead of NaN/Infinity.
 */
export function progressPercent(progress: number, totalChars: number, wordCount: number): number {
  const denominator = totalChars + wordCount - 1;
  if (!(denominator > 0)) return 0;
  const percent = Math.trunc((progress / denominator) * 100);
  return Number.isFinite(percent) ? percent : 0;
}

/** Legacy `fetchQuote()` counters: words = split(" ").length, chars = letters without the spaces. */
export function quoteMetrics(quote: string): { totalChars: number; wordCount: number } {
  const words = quote.split(' ');
  return { totalChars: words.reduce((n, word) => n + word.length, 0), wordCount: words.length };
}

/** Legacy stopwatch text: "MM:SS" of the seconds left. */
export function formatStopwatch(secondsLeft: number): string {
  const minutes = String(Math.trunc(secondsLeft / 60));
  const secs = String(secondsLeft % 60);
  return `${minutes.padStart(2, '0')}:${secs.padStart(2, '0')}`;
}

export interface Ordinal {
  rank: number;
  suffix: 'st' | 'nd' | 'rd' | 'th';
}

/**
 * Legacy 'set player rank': 1 -> st, 2 -> nd, 3 -> rd, everything else -> th
 * (so 21 renders "21th", exactly like the legacy page). Loose `==` comparison
 * in the legacy code, hence the Number() coercion.
 */
export function ordinal(rank: number): Ordinal {
  const n = Number(rank);
  if (n === 1) return { rank, suffix: 'st' };
  if (n === 2) return { rank, suffix: 'nd' };
  if (n === 3) return { rank, suffix: 'rd' };
  return { rank, suffix: 'th' };
}

/** Race-track avatar offset: legacy `user.progress * 0.89` followed by "%". */
export function avatarLeft(progress: number): string {
  const gotProgress = progress * 0.89;
  return gotProgress + '%';
}

export type JoinRequest =
  | { kind: 'new' }
  | { kind: 'byId'; joinId: number }
  | { kind: 'invalid'; raw: string };

/**
 * Interprets the `join-id` URL parameter. Legacy: any truthy value was sent to
 * the server as a string. DEVIATION: only a plain non-negative integer is
 * accepted (and sent as a Number); anything else is `invalid` and must never reach
 * the server (the legacy server crashes on the resulting NaN cast).
 */
export function parseJoinRequest(raw: string | null): JoinRequest {
  if (raw === null || raw === '') return { kind: 'new' };
  if (/^\d+$/.test(raw)) {
    const joinId = Number(raw);
    if (Number.isSafeInteger(joinId)) return { kind: 'byId', joinId };
  }
  return { kind: 'invalid', raw };
}

/** Keys swallowed during a round (legacy `preventDefaultKeys`). */
export const FORBIDDEN_ROUND_KEYS: readonly string[] = [
  'Alt',
  'Control',
  'Fn',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'PrintScreen',
  'Insert',
  'Delete',
  'Tab',
];

export interface GameParams {
  join: JoinRequest;
  username: string | null;
  /** `image` URL parameter, sent to the server as `userAvatar` */
  image: string | null;
  /** `identity` URL parameter, sent as `userIdentity` */
  identity: string | null;
  /** `Device` URL parameter, sent with 'user score' as `userDevice` */
  device: string | null;
}

/** Reads the legacy URL parameters: join-id, username, image, identity, Device. */
export function parseGameParams(search: string): GameParams {
  const params = new URLSearchParams(search);
  return {
    join: parseJoinRequest(params.get('join-id')),
    username: params.get('username'),
    image: params.get('image'),
    identity: params.get('identity'),
    device: params.get('Device'),
  };
}
