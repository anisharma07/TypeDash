/* TypeDash Academy — learner analytics: merging sessions, weak keys, fingers, streaks, ranks, Typing DNA. */
(function (TD) {
  'use strict';
  const U = TD.util;

  const RANKS = [
    { min: 0, name: 'Newbie', icon: '🌱' },
    { min: 10, name: 'Beginner', icon: '🐣' },
    { min: 20, name: 'Learner', icon: '📘' },
    { min: 30, name: 'Typist', icon: '⌨️' },
    { min: 40, name: 'Skilled', icon: '⚡' },
    { min: 50, name: 'Pro', icon: '🚀' },
    { min: 65, name: 'Expert', icon: '🔥' },
    { min: 80, name: 'Master', icon: '👑' },
    { min: 100, name: 'Legend', icon: '🌌' },
  ];
  const TESTS = ['test15', 'test30', 'test60', 'test120'];

  // ------------------------------------------------------------------ merging
  function mergeStat(store, key, s) {
    if (!s || !s.n) return;
    const k = store[key] || (store[key] = { n: 0, e: 0, ls: 0, lc: 0, re: null, rl: null });
    k.n += s.n;
    k.e += s.e;
    k.ls = Math.round(k.ls + s.ls);
    k.lc += s.lc;
    // Exponential moving averages so recent practice outweighs old mistakes.
    const a = Math.min(0.5, s.n / 40);
    const er = s.e / s.n;
    k.re = Math.round((k.re == null ? er : k.re * (1 - a) + er * a) * 10000) / 10000;
    if (s.lc) {
      const lat = s.ls / s.lc;
      const b = Math.min(0.5, s.lc / 40);
      k.rl = Math.round(k.rl == null ? lat : k.rl * (1 - b) + lat * b);
    }
  }

  /** Merge an engine result (one step) into the learner's long-term stats. */
  function mergeResult(data, result) {
    if (!result) return;
    Object.entries(result.keyStats || {}).forEach(([k, s]) => mergeStat(data.keys, k, s));
    Object.entries(result.bigrams || {}).forEach(([k, s]) => mergeStat(data.bigrams, k, s));
    Object.entries(result.confusions || {}).forEach(([exp, row]) => {
      const r = data.confusions[exp] || (data.confusions[exp] = {});
      Object.entries(row).forEach(([t, n]) => { r[t] = (r[t] || 0) + n; });
    });
    addTime(data, result.ms || 0, result.chars || 0);
    data.totals.ks += result.keystrokes || 0;
  }

  function addTime(data, ms, chars) {
    const d = data.daily[U.dayKey()] || (data.daily[U.dayKey()] = { ms: 0, n: 0, ch: 0 });
    d.ms += Math.round(ms);
    d.ch += chars || 0;
    data.totals.ms += Math.round(ms);
    data.totals.ch += chars || 0;
  }

  function addHistory(data, entry) {
    const e = Object.assign({ t: Date.now() }, entry);
    ['wpm', 'acc'].forEach((k) => { if (e[k] != null) e[k] = Math.round(e[k] * 10) / 10; });
    data.history.push(e);
    data.totals.sessions++;
    const d = data.daily[U.dayKey()] || (data.daily[U.dayKey()] = { ms: 0, n: 0, ch: 0 });
    d.n++;
    return e;
  }

  // ------------------------------------------------------------------ records & ghosts
  function encodeGhost(times) {
    const out = [];
    let prev = 0;
    for (let i = 0; i < times.length; i++) {
      const t = times[i] != null ? times[i] : prev;
      const d = Math.max(0, Math.round((t - prev) / 10));
      out.push(d);
      prev += d * 10;
    }
    return out;
  }
  function decodeGhost(arr) {
    const out = [];
    let t = 0;
    (arr || []).forEach((d) => { t += d * 10; out.push(t); });
    return out;
  }

  /** Store a personal record if beaten. Returns { isNew, prev }. */
  function updateRecord(data, id, result) {
    const prev = data.records[id] || null;
    if (result.acc < 75 || result.chars < 10 || result.failed) return { isNew: false, prev };
    if (!prev || result.wpm > prev.wpm) {
      data.records[id] = { wpm: result.wpm, acc: result.acc, t: Date.now(), ghost: encodeGhost(result.charTimes || []) };
      return { isNew: true, prev };
    }
    return { isNew: false, prev };
  }

  // ------------------------------------------------------------------ key analysis
  function keyScores(data, minN) {
    minN = minN || 12;
    const entries = Object.entries(data.keys).filter(([k, v]) => v.n >= minN && k !== ' ' && k !== '\n');
    const med = U.median(entries.map(([, v]) => v.rl).filter((x) => x != null)) || 300;
    return entries.map(([k, v]) => {
      const errRate = v.re != null ? v.re : v.e / v.n;
      const slow = v.rl != null ? Math.max(0, v.rl / med - 1) : 0;
      return { key: k, score: errRate * 100 + slow * 25, errRate, lat: v.rl, n: v.n, acc: 100 * (1 - v.e / v.n) };
    });
  }

  /** Keys the learner most often misses or hesitates on. */
  function weakKeys(data, opts) {
    opts = opts || {};
    return keyScores(data, opts.minN)
      .filter((s) => (!opts.allowed || opts.allowed.has(s.key)) && (opts.lettersOnly === false || /[a-z]/.test(s.key)) && s.score >= (opts.min || 4))
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit || 5);
  }
  function strongKeys(data, limit) {
    return keyScores(data, 15).filter((s) => /[a-z]/.test(s.key)).sort((a, b) => a.score - b.score || (a.lat || 0) - (b.lat || 0)).slice(0, limit || 5);
  }
  function weakBigrams(data, opts) {
    opts = opts || {};
    const entries = Object.entries(data.bigrams).filter(([, v]) => v.n >= 6);
    const med = U.median(entries.map(([, v]) => v.rl).filter((x) => x != null)) || 300;
    return entries
      .map(([k, v]) => {
        const errRate = v.re != null ? v.re : v.e / v.n;
        const slow = v.rl != null ? Math.max(0, v.rl / med - 1) : 0;
        return { key: k, score: errRate * 100 + slow * 20, errRate, lat: v.rl, n: v.n };
      })
      .filter((s) => s.score >= 5 && (!opts.allowed || [...s.key].every((c) => opts.allowed.has(c))))
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit || 5);
  }
  function slowBigrams(data, limit) {
    return Object.entries(data.bigrams)
      .filter(([, v]) => v.lc >= 5 && v.rl != null)
      .map(([k, v]) => ({ key: k, lat: v.rl, n: v.n }))
      .sort((a, b) => b.lat - a.lat)
      .slice(0, limit || 5);
  }
  function topConfusions(data, limit) {
    const out = [];
    Object.entries(data.confusions).forEach(([exp, row]) => Object.entries(row).forEach(([typed, n]) => out.push({ exp, typed, n })));
    return out.sort((a, b) => b.n - a.n).slice(0, limit || 6);
  }

  /** Per physical key: { id: { n, e, err, lat } } for the keyboard heatmap. */
  function keyHeat(data) {
    const out = {};
    Object.entries(data.keys).forEach(([ch, v]) => {
      const info = TD.kb.info(ch);
      if (!info) return;
      const o = out[info.id] || (out[info.id] = { n: 0, e: 0, ls: 0, lc: 0 });
      o.n += v.n; o.e += v.e; o.ls += v.ls; o.lc += v.lc;
    });
    Object.values(out).forEach((o) => { o.err = o.n ? o.e / o.n : 0; o.lat = o.lc ? o.ls / o.lc : null; });
    return out;
  }

  function fingerStats(data) {
    const out = {};
    TD.kb.FINGER_ORDER.concat(['th']).forEach((f) => { out[f] = { n: 0, e: 0, ls: 0, lc: 0 }; });
    Object.entries(data.keys).forEach(([k, v]) => {
      const f = TD.kb.fingerOf(k);
      if (!f || !out[f]) return;
      out[f].n += v.n; out[f].e += v.e; out[f].ls += v.ls; out[f].lc += v.lc;
    });
    Object.values(out).forEach((o) => { o.acc = o.n ? 100 * (1 - o.e / o.n) : null; o.lat = o.lc ? o.ls / o.lc : null; });
    return out;
  }
  function handBalance(data) {
    const fs = fingerStats(data);
    const sum = (ids) => ids.reduce((acc, f) => ({ n: acc.n + fs[f].n, e: acc.e + fs[f].e, ls: acc.ls + fs[f].ls, lc: acc.lc + fs[f].lc }), { n: 0, e: 0, ls: 0, lc: 0 });
    const L = sum(['lp', 'lr', 'lm', 'li']);
    const R = sum(['ri', 'rm', 'rr', 'rp']);
    const fin = (o) => ({ n: o.n, acc: o.n ? 100 * (1 - o.e / o.n) : null, lat: o.lc ? o.ls / o.lc : null });
    return { left: fin(L), right: fin(R), leftShare: L.n + R.n ? L.n / (L.n + R.n) : 0.5 };
  }

  // ------------------------------------------------------------------ progress over time
  function practicedDays(data) {
    return new Set(Object.entries(data.daily).filter(([, d]) => d.n > 0 || d.ms >= 30000).map(([k]) => k));
  }
  function streak(data) {
    const days = practicedDays(data);
    let cur = 0;
    let d = new Date();
    const today = days.has(U.dayKey(d));
    if (!today) d = U.addDays(d, -1);
    while (days.has(U.dayKey(d))) { cur++; d = U.addDays(d, -1); }
    let best = 0;
    let run = 0;
    let prev = null;
    [...days].sort().forEach((k) => {
      const day = U.dayFromKey(k);
      run = prev && Math.round((day - prev) / 86400000) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = day;
    });
    return { current: cur, best: Math.max(best, cur), today };
  }
  function today(data) {
    const d = data.daily[U.dayKey()] || { ms: 0, n: 0, ch: 0 };
    const goalMs = (data.settings.dailyGoal || 10) * 60000;
    return { ms: d.ms, n: d.n, ch: d.ch, goalMs, pct: Math.min(1, d.ms / goalMs) };
  }
  function calendar(data, weeks) {
    const out = [];
    const end = new Date();
    const start = U.addDays(end, -(weeks * 7 - 1) - end.getDay());
    for (let d = new Date(start); d <= end; d = U.addDays(d, 1)) {
      const k = U.dayKey(d);
      out.push({ key: k, date: new Date(d), ms: (data.daily[k] || {}).ms || 0, n: (data.daily[k] || {}).n || 0 });
    }
    return out;
  }

  /** Average speed and accuracy over the last n meaningful sessions. */
  function recent(data, n, filter) {
    const h = data.history.filter((x) => x.ch >= 30 && x.wpm > 0 && (!filter || filter(x))).slice(-(n || 10));
    return {
      wpm: Math.round(U.avg(h.map((x) => x.wpm))),
      acc: Math.round(U.avg(h.map((x) => x.acc)) * 10) / 10,
      cons: Math.round(U.avg(h.filter((x) => x.cons > 0).map((x) => x.cons))),
      count: h.length,
    };
  }
  /** Best sustained speed: 30s+ official tests or long, accurate sessions. */
  function bestWpm(data) {
    let best = 0;
    ['test30', 'test60', 'test120'].forEach((id) => { if (data.records[id]) best = Math.max(best, data.records[id].wpm); });
    data.history.forEach((h) => { if (h.ms >= 30000 && h.acc >= 85 && h.ch >= 50) best = Math.max(best, h.wpm); });
    return Math.round(best);
  }
  function rank(wpm) {
    let i = 0;
    RANKS.forEach((r, idx) => { if (wpm >= r.min) i = idx; });
    const r = RANKS[i];
    const next = RANKS[i + 1] || null;
    return Object.assign({}, r, { level: i + 1, next, progress: next ? U.clamp((wpm - r.min) / (next.min - r.min), 0, 1) : 1 });
  }

  // ------------------------------------------------------------------ Typing DNA
  function dna(data) {
    const rec = recent(data, 10);
    const fingers = fingerStats(data);
    const usable = TD.kb.FINGER_ORDER.filter((f) => fingers[f].n >= 30);
    const weakestFinger = usable.slice().sort((a, b) => fingers[a].acc - fingers[b].acc)[0] || null;
    const slowestFinger = usable.filter((f) => fingers[f].lat).sort((a, b) => fingers[b].lat - fingers[a].lat)[0] || null;
    let style;
    if (rec.count < 3) style = { name: 'Explorer', desc: 'Complete a few more sessions and your typing profile will appear here.' };
    else if (rec.acc >= 97 && rec.cons >= 55) style = { name: 'Metronome', desc: 'Precise and even. Your rhythm is your super-power; now push the tempo.' };
    else if (rec.acc >= 96) style = { name: 'Sniper', desc: 'You rarely miss. Try short speed bursts to turn accuracy into speed.' };
    else if (rec.wpm >= 45 && rec.acc < 93) style = { name: 'Sprinter', desc: 'Fast hands, loose aim. Slow down 10% and your net speed will rise.' };
    else if (rec.cons >= 55) style = { name: 'Steady Flow', desc: 'Consistent and calm. Keep building the weak keys below.' };
    else style = { name: 'All-Rounder', desc: 'Balanced speed and accuracy. Target your weakest keys to level up.' };
    return {
      style,
      recent: rec,
      best: bestWpm(data),
      weakest: weakKeys(data, { limit: 5, min: 0 }),
      strongest: strongKeys(data, 5),
      weakBigrams: weakBigrams(data, { limit: 5 }),
      slowBigrams: slowBigrams(data, 5),
      confusions: topConfusions(data, 6),
      fingers,
      weakestFinger,
      slowestFinger,
      hands: handBalance(data),
    };
  }

  TD.stats = {
    RANKS,
    TESTS,
    mergeResult,
    addTime,
    addHistory,
    encodeGhost,
    decodeGhost,
    updateRecord,
    keyScores,
    weakKeys,
    strongKeys,
    weakBigrams,
    slowBigrams,
    topConfusions,
    keyHeat,
    fingerStats,
    handBalance,
    streak,
    today,
    calendar,
    recent,
    bestWpm,
    rank,
    dna,
  };
})(window.TD = window.TD || {});
