import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import {
  COUNTDOWN_SECONDS,
  ROUND_SECONDS,
  calcWpm,
  formatAccuracy,
  formatStopwatch,
  progressPercent,
  quoteMetrics,
  secondsElapsed,
} from '../../lib/gameRules';
import type { QuoteLevel, StartGamePayload } from '../../types/socket';
import type { TypingStats } from '../types';
import type { Emit } from './useGameSocket';
import { useLatest } from './useLatest';
import type { TimerHandle } from './useTimers';
import { useTimers } from './useTimers';

/** Which document-level key handler is active (legacy keyBindsFunction vs preventDefaultKeys). */
export type KeyMode = 'lobby' | 'round';

export interface LightState {
  red: CSSProperties;
  yellow: CSSProperties;
  green: CSSProperties;
}

/** Everything the round renders. */
export interface RoundView {
  text: string | null;
  gameKey: number;
  enabled: boolean;
  ended: boolean;
  timeLabel: string;
  timerRunning: boolean;
  timeUp: boolean;
  countdownVisible: boolean;
  countdownNumber: number;
  countOverVisible: boolean;
  light: LightState;
  summaryVisible: boolean;
  summaryWpm: number;
  summaryAccuracy: string;
  leaveMatchVisible: boolean;
  playerStatusVisible: boolean;
}

const INITIAL_VIEW: RoundView = {
  text: null,
  gameKey: 0,
  enabled: false,
  ended: false,
  timeLabel: '00:00',
  timerRunning: false,
  timeUp: false,
  countdownVisible: false,
  countdownNumber: COUNTDOWN_SECONDS,
  countOverVisible: false,
  light: { red: {}, yellow: {}, green: {} },
  summaryVisible: false,
  summaryWpm: 0,
  summaryAccuracy: '0',
  leaveMatchVisible: false,
  playerStatusVisible: true,
};

export interface RoundDeps {
  emit: Emit;
  /** `Device` URL parameter */
  userDevice: string | null;
  modeRef: RefObject<KeyMode>;
  resetLanes: () => void;
  setCirclesHidden: (hidden: boolean) => void;
  /** legacy closeModalFunction(): hide the leaderboard / overlays */
  closeModals: () => void;
  toggleLeaderboard: () => void;
  /** legacy notReady(): button back to "Get Ready" and emit 'not ready' */
  notReady: () => void;
}

export interface Round {
  view: RoundView;
  startRound: (payload: StartGamePayload) => void;
  endGame: () => void;
  /** wire to TypingArea.onStats */
  onStats: (stats: TypingStats) => void;
  /** wire to TypingArea.onComplete: records the final stats, then ends the round */
  onComplete: (stats: TypingStats) => void;
}

const ZERO_STATS = { counter: 0, progress: 0, mistakes: 0 };

/**
 * The round state machine (legacy socket.js 'start game' / countCounter /
 * startMatchCountdown / initTimer and multiplayer.js endGame / newGame).
 *
 * Timeline after 'start game' (t in seconds):
 *   t=1..9  countdown ticks 9..1, the traffic light cycles by value % 3
 *   t=10    tick 0 -> "start typing..." + light sequence (+1s/+2s/+3s/+4s timeouts);
 *           the 10 s timeout starts the match: input enabled, 1 s timer, "running" colour
 *   t=11..  every second: timeLeft--, stopwatch, emit 'progress'; at 0 -> endGame()
 *
 * All timers go through useTimers, so unmounting cancels them.
 */
export function useRound(deps: RoundDeps): Round {
  const [view, setView] = useState<RoundView>(INITIAL_VIEW);
  const timers = useTimers();
  const depsRef = useLatest(deps);

  // legacy globals
  const timeLeftRef = useRef(0); // timeInc
  const quoteLevelRef = useRef<QuoteLevel>(0);
  const metricsRef = useRef({ totalChars: 0, wordCount: 0 }); // quoteLength / noOfWords
  const statsRef = useRef(ZERO_STATS); // counter / progress / mistakes reported by the typing area
  const counterValueRef = useRef(COUNTDOWN_SECONDS - 1);
  const wpmRef = useRef(0);

  // timer handles
  const countingRef = useRef<TimerHandle | undefined>(undefined);
  const startRef = useRef<TimerHandle | undefined>(undefined);
  const matchRef = useRef<TimerHandle | undefined>(undefined);
  const lightRefs = useRef<TimerHandle[]>([]);

  const patch = useCallback((changes: Partial<RoundView>) => {
    setView((prev) => ({ ...prev, ...changes }));
  }, []);

  const setWpm = useCallback(() => {
    wpmRef.current = calcWpm(statsRef.current.counter, secondsElapsed(timeLeftRef.current));
  }, []);

  /** legacy sendProgress(): stopwatch text + 'progress' emit. */
  const sendProgress = useCallback(() => {
    patch({ timeLabel: formatStopwatch(timeLeftRef.current) });
    const { totalChars, wordCount } = metricsRef.current;
    const percent = progressPercent(statsRef.current.progress, totalChars, wordCount);
    setWpm();
    depsRef.current.emit('progress', percent, wpmRef.current);
  }, [patch, setWpm, depsRef]);

  const endGame = useCallback(() => {
    const d = depsRef.current;
    d.emit('set leave match true');
    d.modeRef.current = 'lobby';
    // legacy: toggleLeaderboardFunction(); // twice cause problem
    // It flips the modal on every call: the round start closed it, so the first
    // endGame() opens it again; a repeated endGame() closes it again.
    d.toggleLeaderboard();
    timers.cancel(matchRef.current);
    matchRef.current = undefined;
    sendProgress();
    setWpm(); // legacy getWPM()
    const wpm = wpmRef.current;
    const timeLeft = timeLeftRef.current;
    const accuracy = formatAccuracy(statsRef.current.mistakes, metricsRef.current.totalChars);
    setView((prev) => ({
      ...prev,
      enabled: false,
      ended: true,
      summaryVisible: true,
      summaryWpm: wpm,
      summaryAccuracy: accuracy,
      playerStatusVisible: true,
      leaveMatchVisible: false,
      timeUp: timeLeft === 0 ? true : prev.timeUp,
    }));
    d.setCirclesHidden(false);
    d.emit('user score', { wpm, quoteLevel: quoteLevelRef.current, userDevice: d.userDevice });
    d.emit('get rank');
  }, [depsRef, timers, sendProgress, setWpm]);

  const endGameRef = useLatest(endGame);

  /** legacy initTimer() */
  const timerTick = useCallback(() => {
    timeLeftRef.current -= 1;
    sendProgress();
    if (timeLeftRef.current === 0) endGameRef.current();
  }, [sendProgress, endGameRef]);

  /**
   * legacy startMatchCountdown(): arms the input and the clock 10 s after 'start game' whatever happened in
   * between. If the round was ended during the countdown ('end game on request' after every player pressed
   * "Leave match") legacy still started typing at t=10 and showed the caret, so `ended` is cleared here;
   * otherwise the page would accept keystrokes with both carets hidden.
   */
  const startMatch = useCallback(() => {
    timers.cancel(matchRef.current);
    matchRef.current = timers.every(timerTick, 1000);
    patch({ enabled: true, timerRunning: true, countdownVisible: false, ended: false });
  }, [timers, timerTick, patch]);

  /** legacy countCounter() */
  const countTick = useCallback(() => {
    const value = counterValueRef.current;
    const next = value - 1;
    const finished = next === -1;
    const big: CSSProperties = { transform: 'scale(1.4)' };
    const small: CSSProperties = { transform: 'scale(1)' };

    setView((prev) => {
      const changes: Partial<RoundView> = { countdownNumber: finished ? COUNTDOWN_SECONDS : value };
      if (value === 0) {
        changes.light = {
          red: { ...prev.light.red, backgroundColor: '#03ca0b' },
          yellow: { ...prev.light.yellow, backgroundColor: '#03ca0b' },
          green: { ...prev.light.green, transform: 'scale(1)' },
        };
        changes.countdownVisible = false;
        changes.countOverVisible = true;
      } else {
        // the legacy code only touches transforms here, never the colours
        const scales =
          value % 3 === 0
            ? { red: big, yellow: small, green: small }
            : value % 3 === 2
              ? { red: small, yellow: big, green: small }
              : { red: small, yellow: small, green: big };
        changes.light = {
          red: { ...prev.light.red, ...scales.red },
          yellow: { ...prev.light.yellow, ...scales.yellow },
          green: { ...prev.light.green, ...scales.green },
        };
      }
      return { ...prev, ...changes };
    });

    if (value === 0) {
      const paint = (red: string, yellow: string, green: string, extra?: Partial<RoundView>) => () =>
        setView((prev) => ({
          ...prev,
          ...extra,
          light: {
            red: { ...prev.light.red, backgroundColor: red },
            yellow: { ...prev.light.yellow, backgroundColor: yellow },
            green: { ...prev.light.green, backgroundColor: green },
          },
        }));
      lightRefs.current.push(
        timers.after(paint('green', 'green', 'green'), 1000),
        timers.after(paint('#03ca0b', '#03ca0b', '#03ca0b'), 2000),
        timers.after(paint('green', 'green', 'green'), 3000),
        timers.after(paint('#ff0000', '#ffd505', '#03ca0b', { countOverVisible: false }), 4000),
      );
    }

    counterValueRef.current = next;
    if (finished) {
      timers.cancel(countingRef.current);
      countingRef.current = undefined;
      counterValueRef.current = COUNTDOWN_SECONDS - 1;
    }
  }, [timers]);

  /** 'start game' */
  const startRound = useCallback(
    (payload: StartGamePayload) => {
      const d = depsRef.current;
      // The legacy page leaked the previous round's timers; cancel them instead.
      timers.cancel(countingRef.current);
      timers.cancel(startRef.current);
      timers.cancel(matchRef.current);
      // The four start-light timeouts end the sequence ("start typing..." banner off, lights back to red/yellow/green).
      // Legacy leaked them into the next round, where they still fired and finished the job; cancelling them means
      // the final frame must be applied here, or a round that starts early keeps the banner and green lights.
      const lightsInFlight = lightRefs.current.length > 0;
      for (const handle of lightRefs.current) timers.cancel(handle);
      lightRefs.current = [];

      d.resetLanes();
      quoteLevelRef.current = payload.levelOfQuote;
      d.closeModals();

      // fetchQuote + newGame
      metricsRef.current = quoteMetrics(payload.quoteFromServer);
      statsRef.current = ZERO_STATS;
      timeLeftRef.current = ROUND_SECONDS;
      wpmRef.current = 0;
      counterValueRef.current = COUNTDOWN_SECONDS - 1;
      d.modeRef.current = 'round';
      setView((prev) => ({
        ...prev,
        text: payload.quoteFromServer,
        gameKey: prev.gameKey + 1,
        enabled: false,
        ended: false,
        timeLabel: formatStopwatch(ROUND_SECONDS),
        timerRunning: false,
        timeUp: false,
        countdownVisible: true,
        countdownNumber: COUNTDOWN_SECONDS,
        summaryVisible: false,
        leaveMatchVisible: true,
        playerStatusVisible: false,
        ...(lightsInFlight
          ? {
              countOverVisible: false,
              light: {
                red: { ...prev.light.red, backgroundColor: '#ff0000' },
                yellow: { ...prev.light.yellow, backgroundColor: '#ffd505' },
                green: { ...prev.light.green, backgroundColor: '#03ca0b' },
              },
            }
          : {}),
      }));

      countingRef.current = timers.every(countTick, 1000);
      startRef.current = timers.after(startMatch, COUNTDOWN_SECONDS * 1000);

      d.notReady();
      d.setCirclesHidden(true);
    },
    [depsRef, timers, countTick, startMatch],
  );

  const onStats = useCallback((stats: TypingStats) => {
    statsRef.current = { counter: stats.counter, progress: stats.progress, mistakes: stats.mistakes };
  }, []);

  const onComplete = useCallback(
    (stats: TypingStats) => {
      onStats(stats);
      endGameRef.current();
    },
    [onStats, endGameRef],
  );

  return { view, startRound, endGame, onStats, onComplete };
}
