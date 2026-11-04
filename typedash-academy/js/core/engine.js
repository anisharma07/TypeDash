/* TypeDash Academy — typing session engine.
 *
 * Error modes:
 *   stop    – a wrong key does not advance; the learner must press the right key (counts as an error).
 *   correct – a wrong key is shown and blocks input until it is removed with Backspace.
 *   advance – free typing: wrong keys are marked and the caret moves on; Backspace fixes.
 *
 * Measurements:
 *   WPM      = (correct characters / 5) per minute of typing time
 *   raw WPM  = (all keystrokes / 5) per minute
 *   accuracy = correct keystrokes / all keystrokes
 * Untimed steps cap any pause at IDLE_CAP so reading an instruction mid-drill does not ruin the score.
 */
(function (TD) {
  'use strict';
  const IDLE_CAP = 2000;
  const ST = { PENDING: 0, OK: 1, WRONG: 2, FIXED: 3, AUTO: 4 };

  const normKey = (c) => (c >= 'A' && c <= 'Z' ? c.toLowerCase() : c);
  const isLetter = (c) => c >= 'a' && c <= 'z';

  class Session {
    constructor(opts) {
      this.text = String(opts.text || '');
      this.mode = opts.mode || 'advance';
      this.noBackspace = !!opts.noBackspace;
      this.lives = opts.lives || 0;
      this.livesLeft = this.lives;
      this.timeLimit = opts.timeLimit ? opts.timeLimit * 1000 : 0;
      this.autoIndent = !!opts.autoIndent;
      this.more = typeof opts.more === 'function' ? opts.more : null;
      this.listener = null;

      this.pos = 0;
      this.state = new Uint8Array(this.text.length + 16);
      this.typed = [];
      this.erred = new Uint8Array(this.text.length + 16);
      this.attempted = new Uint8Array(this.text.length + 16);
      this.charTimes = [];

      this.started = false;
      this.finished = false;
      this.failed = null;
      this.timedOut = false;
      this.t0 = 0;
      this.tLast = 0;
      this.tEnd = 0;
      this.active = 0;
      this.pausedAt = 0;
      this.pausedTotal = 0;

      this.keystrokes = 0;
      this.errors = 0;
      this.backspaces = 0;
      this.okCount = 0;
      this.blocked = false;
      this.prevOkPos = -1;
      this.log = [];        // [time, ok(1|0), gap]
      this.keyStats = {};
      this.bigrams = {};
      this.confusions = {};
      this._skipAuto();
    }

    on(fn) { this.listener = fn; return this; }
    emit(evt) { if (this.listener) this.listener(evt); }
    get timed() { return this.timeLimit > 0; }

    // ---------------------------------------------------------------- time
    elapsed(now) {
      if (!this.started) return 0;
      if (!this.timed) return this.active;
      const end = this.finished ? this.tEnd : (this.pausedAt || now || performance.now());
      return Math.max(0, Math.min(this.timeLimit, end - this.t0 - this.pausedTotal));
    }
    remaining(now) { return this.timed ? Math.max(0, this.timeLimit - this.elapsed(now)) : Infinity; }

    _stamp(t) {
      if (!this.started) {
        this.started = true;
        this.t0 = t;
        this.tLast = t;
        this.emit({ type: 'start' });
        return null;
      }
      const gap = t - this.tLast;
      this.tLast = t;
      if (!this.timed) this.active += Math.min(gap, IDLE_CAP);
      return gap;
    }
    _at(t) { return this.timed ? t - this.t0 - this.pausedTotal : this.active; }

    pause() { if (this.started && !this.finished && !this.pausedAt) this.pausedAt = performance.now(); }
    resume() {
      if (!this.pausedAt) return;
      const d = performance.now() - this.pausedAt;
      this.pausedTotal += d;
      this.tLast += d;
      this.pausedAt = 0;
    }
    get paused() { return !!this.pausedAt; }

    /** Call regularly (rAF/interval). Ends timed sessions when the clock runs out. */
    tick(now) {
      if (this.timed && this.started && !this.finished && !this.pausedAt && this.remaining(now) <= 0) {
        this.timedOut = true;
        this.finish();
      }
    }

    // ---------------------------------------------------------------- input
    input(ch) {
      if (this.finished || this.pausedAt) return;
      if (this.blocked) { this.emit({ type: 'blocked' }); return; }
      const p = this.pos;
      const expected = this.text[p];
      if (expected === undefined) return;
      const t = performance.now();
      const gap = this._stamp(t);
      const at = this._at(t);
      const ok = ch === expected;
      this.keystrokes++;
      if (!this.attempted[p]) {
        this.attempted[p] = 1;
        this._record(p, expected, ok, gap);
      }
      this.log.push([at, ok ? 1 : 0, gap]);

      if (ok) {
        this.state[p] = this.erred[p] ? ST.FIXED : ST.OK;
        this.okCount++;
        this.charTimes[p] = at;
        this.prevOkPos = p;
        this.pos++;
        this._skipAuto(at);
        this.emit({ type: 'ok', pos: p });
      } else {
        this.errors++;
        this.erred[p] = 1;
        this.prevOkPos = -1;
        const row = this.confusions[normKey(expected)] || (this.confusions[normKey(expected)] = {});
        row[normKey(ch)] = (row[normKey(ch)] || 0) + 1;
        if (this.mode === 'stop') {
          this.emit({ type: 'miss', pos: p, typed: ch });
        } else {
          this.state[p] = ST.WRONG;
          this.typed[p] = ch;
          this.pos++;
          if (this.mode === 'correct') this.blocked = true;
          this.emit({ type: 'wrong', pos: p, typed: ch });
        }
        if (this.lives) {
          this.livesLeft--;
          this.emit({ type: 'life', left: this.livesLeft });
          if (this.livesLeft <= 0) { this.failed = 'lives'; this.finish(); return; }
        }
      }
      this._maybeExtend();
      if (this.pos >= this.text.length && !this.finished) this.finish();
    }

    backspace(word) {
      if (this.finished || this.pausedAt) return;
      if (this.mode === 'stop') return;
      if (this.noBackspace) { this.emit({ type: 'denied' }); return; }
      if (this.pos === 0) return;
      const from = this.pos;
      const back = () => {
        this.pos--;
        if (this.state[this.pos] === ST.OK || this.state[this.pos] === ST.FIXED) this.okCount--;
        this.state[this.pos] = ST.PENDING;
        this.typed[this.pos] = undefined;
      };
      while (this.pos > 0 && this.state[this.pos - 1] === ST.AUTO) back();
      if (this.pos > 0) back();
      if (word) while (this.pos > 0 && !/\s/.test(this.text[this.pos - 1])) back();
      this.backspaces++;
      this.blocked = false;
      this.prevOkPos = -1;
      if (this.started) this._stamp(performance.now());
      this.emit({ type: 'back', from, to: this.pos });
    }

    _skipAuto(at) {
      if (!this.autoIndent) return;
      if (this.pos > 0 && this.text[this.pos - 1] !== '\n') return;
      while (this.text[this.pos] === ' ') {
        this.state[this.pos] = ST.AUTO;
        this.charTimes[this.pos] = at || 0;
        this.pos++;
      }
    }

    _maybeExtend() {
      if (!this.more || this.text.length - this.pos > 160) return;
      const add = this.more();
      if (!add) return;
      const from = this.text.length;
      this.text += add;
      const grow = (arr) => { const n = new Uint8Array(this.text.length + 16); n.set(arr.subarray(0, Math.min(arr.length, n.length))); return n; };
      this.state = grow(this.state);
      this.erred = grow(this.erred);
      this.attempted = grow(this.attempted);
      this.emit({ type: 'append', from });
    }

    _record(p, expected, ok, gap) {
      const key = normKey(expected);
      const ks = this.keyStats[key] || (this.keyStats[key] = { n: 0, e: 0, ls: 0, lc: 0 });
      const flowing = p > 0 && this.prevOkPos === p - 1 && gap != null && gap < IDLE_CAP;
      ks.n++;
      if (!ok) ks.e++;
      else if (flowing) { ks.ls += gap; ks.lc++; }
      if (p > 0 && this.prevOkPos === p - 1) {
        const a = normKey(this.text[p - 1]);
        if (isLetter(a) && isLetter(key)) {
          const bg = a + key;
          const bs = this.bigrams[bg] || (this.bigrams[bg] = { n: 0, e: 0, ls: 0, lc: 0 });
          bs.n++;
          if (!ok) bs.e++;
          else if (flowing) { bs.ls += gap; bs.lc++; }
        }
      }
    }

    finish() {
      if (this.finished) return;
      if (this.pausedAt) this.resume();
      this.finished = true;
      this.tEnd = performance.now();
      this.emit({ type: 'finish' });
    }

    // ---------------------------------------------------------------- stats
    live(now) {
      const ms = this.elapsed(now);
      const min = ms / 60000;
      return {
        wpm: min > 0 && ms >= 1500 ? (this.okCount / 5) / min : 0,
        acc: this.keystrokes ? ((this.keystrokes - this.errors) / this.keystrokes) * 100 : 100,
        ms,
        remaining: this.remaining(now),
        progress: this.text.length ? this.pos / this.text.length : 0,
        errors: this.errors,
        livesLeft: this.livesLeft,
      };
    }

    result() {
      const ms = Math.max(this.elapsed(), 1);
      const min = ms / 60000;
      const wpm = (this.okCount / 5) / min;
      const raw = (this.keystrokes / 5) / min;
      const acc = this.keystrokes ? ((this.keystrokes - this.errors) / this.keystrokes) * 100 : 100;

      // Per-second series (cumulative net WPM, raw WPM in that second, errors in that second).
      const secs = Math.max(1, Math.ceil(ms / 1000));
      const okIn = new Array(secs).fill(0);
      const keysIn = new Array(secs).fill(0);
      const errIn = new Array(secs).fill(0);
      this.log.forEach(([t, ok]) => {
        const s = Math.min(secs - 1, Math.floor(t / 1000));
        keysIn[s]++;
        if (ok) okIn[s]++; else errIn[s]++;
      });
      const series = { wpm: [], raw: [], err: errIn };
      let cum = 0;
      for (let s = 0; s < secs; s++) {
        cum += okIn[s];
        const m = Math.min((s + 1) * 1000, ms) / 60000;
        series.wpm.push(Math.round((cum / 5) / m));
        series.raw.push(keysIn[s] * 12);
      }

      // Consistency: 100 * (1 - coefficient of variation) of flowing inter-key intervals (trimmed).
      const gaps = this.log.filter((l) => l[1] && l[2] != null && l[2] < IDLE_CAP).map((l) => l[2]).sort((a, b) => a - b);
      let cons = 0;
      if (gaps.length >= 8) {
        const trim = Math.floor(gaps.length * 0.05);
        const g = gaps.slice(trim, gaps.length - trim);
        const mean = g.reduce((a, b) => a + b, 0) / g.length;
        const sd = Math.sqrt(g.reduce((a, b) => a + (b - mean) * (b - mean), 0) / g.length);
        cons = Math.max(0, Math.min(100, Math.round(100 * (1 - sd / mean))));
      }

      // Characters that were missed in this session, worst first.
      const missed = Object.entries(this.keyStats)
        .filter(([, v]) => v.e > 0)
        .sort((a, b) => b[1].e - a[1].e || b[1].e / b[1].n - a[1].e / a[1].n)
        .map(([k, v]) => ({ key: k, errors: v.e, n: v.n }));

      return {
        wpm: Math.round(wpm * 10) / 10,
        raw: Math.round(raw * 10) / 10,
        acc: Math.round(acc * 10) / 10,
        cons,
        ms: Math.round(ms),
        chars: this.okCount,
        keystrokes: this.keystrokes,
        errors: this.errors,
        backspaces: this.backspaces,
        completed: this.pos >= this.text.length,
        timedOut: this.timedOut,
        failed: this.failed,
        livesLeft: this.livesLeft,
        series,
        keyStats: this.keyStats,
        bigrams: this.bigrams,
        confusions: this.confusions,
        missed,
        charTimes: this.charTimes.slice(0, this.pos),
        typedLength: this.pos,
      };
    }
  }

  /** Translate a keydown event into an engine action, or null if it is not for us. */
  function actionFromEvent(e) {
    if (e.isComposing || e.keyCode === 229) return null;
    const k = e.key;
    if (k === 'Backspace') return { type: 'back', word: e.ctrlKey || e.altKey };
    if (e.metaKey || e.ctrlKey) return null;
    if (k === 'Enter') return { type: 'char', ch: '\n' };
    if (k === 'Dead') return { type: 'dead' };
    if (k && k.length === 1) {
      if (e.altKey && !/[ -~]/.test(k)) return null; // macOS Option-characters
      return { type: 'char', ch: k === ' ' ? ' ' : k };
    }
    return null;
  }

  TD.engine = {
    IDLE_CAP,
    ST,
    create: (opts) => new Session(opts),
    actionFromEvent,
  };
})(window.TD = window.TD || {});
