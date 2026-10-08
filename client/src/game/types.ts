/**
 * Seams between the game-page components, so they can be built in parallel.
 * Behavioural source of truth for all of them: legacy/public/js/*.js and
 * legacy/public/multiplayer.html (DOM structure and class names must be kept:
 * the legacy CSS in src/styles/ is reused unchanged).
 */
import type { Difficulty } from '../types/socket';

/** What the typing component reports to the page after every change (legacy globals). */
export interface TypingStats {
  /** legacy `counter` - correct chars (+ spaces), numerator of WPM */
  counter: number;
  /** legacy `progress` - race-track advancement units */
  progress: number;
  /** legacy `mistakes` */
  mistakes: number;
  /** legacy `quoteLength` (letters, no spaces) */
  totalChars: number;
  /** legacy `noOfWords` */
  wordCount: number;
}

/** Renders the whole legacy `.container` block (stopwatch, time-up, caps-lock, cursor, text, hidden input). */
export interface TypingAreaProps {
  /** Quote for this round; null before the first round (shows the legacy placeholder sentence). */
  text: string | null;
  /** Increments for every new round: resets engine state, scroll position and caret. */
  gameKey: number;
  /** Input accepted: from the end of the countdown until the round ends. */
  enabled: boolean;
  /** Round over: caret hidden, untyped letters flagged incorrect, text scrollable (legacy endGame()). */
  ended: boolean;
  /** Stopwatch text, "MM:SS". */
  timeLabel: string;
  /** Stopwatch uses the "running" colour (#e2b714) while true. */
  timerRunning: boolean;
  /** Show the legacy "Time Up!" banner. */
  timeUp: boolean;
  /** Called after every state change. */
  onStats: (stats: TypingStats) => void;
  /** Called once when the text is completed (legacy: the code paths that call endGame()). */
  onComplete: (stats: TypingStats) => void;
}

/** Renders the legacy `.leader-board-menu` block (the parent decides where it sits). */
export interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
  level: Difficulty;
  onLevelChange: (level: Difficulty) => void;
  /** Filter-icon click: re-fetch now (the parent also bumps refreshToken for keyboard/socket triggers). */
  onRefresh: () => void;
  /** Logged-in player's join id; their row gets the `me-rank-card` class. */
  joinId: number | null;
  /** Increment to re-fetch GET /get-users-leaderboard (filter icon, Ctrl key, 'update user leaderboard'). */
  refreshToken: number;
}
