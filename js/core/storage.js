/* TypeDash Academy — local storage: multiple learner profiles on one device, settings, export/import. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const VERSION = 1;
  const INDEX_KEY = 'tda:index';
  const PROFILE_KEY = (id) => 'tda:profile:' + id;
  const HISTORY_CAP = 1500;

  const DEFAULT_SETTINGS = {
    theme: 'dark',          // dark | light | system
    sound: true,
    volume: 0.6,
    keyboard: true,         // show on-screen keyboard while typing
    hands: true,            // show hands diagram
    fingerColors: true,     // colour keys by finger zone
    hints: true,            // "Left index · reach up from F" hint line
    errorMode: 'auto',      // auto | stop | correct | advance
    fontSize: 'm',          // s | m | l | xl
    caret: 'line',          // line | block | underline
    smoothCaret: true,
    dailyGoal: 10,          // minutes per day
    unlockAll: false,       // teacher mode
    adaptive: true,         // add focus drills when a step goes badly
  };

  // ------------------------------------------------------------------ safe localStorage
  const memory = {};
  let persistent = true;
  try {
    const k = '__tda_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
  } catch (e) {
    persistent = false;
  }
  const ls = {
    get(k) { if (!persistent) return memory[k] ?? null; try { return window.localStorage.getItem(k); } catch (e) { return memory[k] ?? null; } },
    set(k, v) {
      memory[k] = v;
      if (!persistent) return true;
      try { window.localStorage.setItem(k, v); return true; } catch (e) {
        console.warn('TypeDash Academy: could not save (storage full?)', e);
        U.bus.emit('storage:error', e);
        return false;
      }
    },
    del(k) { delete memory[k]; if (persistent) try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const readJSON = (k) => { try { const v = ls.get(k); return v ? JSON.parse(v) : null; } catch (e) { console.warn('Corrupt data in', k, e); return null; } };

  // ------------------------------------------------------------------ profile shape
  function blankProfile(name, avatar) {
    return {
      v: VERSION,
      id: U.uid(),
      name: name || 'Learner',
      avatar: avatar || 'avatar1',
      created: Date.now(),
      settings: Object.assign({}, DEFAULT_SETTINGS),
      episodes: {},        // '2.2' -> { stars, bestWpm, bestAcc, attempts, fails, done, skipped, first, last, ghost }
      guides: {},          // guideId -> timestamp read
      keys: {},            // char -> { n, e, ls, lc, re, rl }
      bigrams: {},         // 'th' -> { n, e, ls, lc, re, rl }
      confusions: {},      // expected -> { typed: count }
      history: [],         // [{ t, kind, id, title, wpm, acc, cons, ms, ch, er, stars }]
      daily: {},           // 'YYYY-MM-DD' -> { ms, n, ch }
      records: {},         // test15 | test30 | test60 | test120 -> { wpm, acc, t, ghost }
      achievements: {},    // id -> timestamp
      unlockedThrough: 0,  // chapters opened by the placement test
      placement: null,     // { wpm, acc, t }
      totals: { ks: 0, ch: 0, ms: 0, sessions: 0 },
      onboarded: false,
      lastBackup: null,    // timestamp of the last exported backup
    };
  }

  // Everything loaded (including imported backups) is normalised: unknown or invalid values fall back to defaults.
  const AVATAR_RE = /^avatar([1-9]|1[0-5])$/;
  const CHOICES = { theme: ['dark', 'light', 'system'], errorMode: ['auto', 'stop', 'correct', 'advance'], fontSize: ['s', 'm', 'l', 'xl'], caret: ['line', 'block', 'underline'] };
  const OBJECT_FIELDS = ['episodes', 'guides', 'keys', 'bigrams', 'confusions', 'daily', 'records', 'achievements'];
  function sanitize(p) {
    p.id = String(p.id).slice(0, 40);
    p.name = String(p.name || 'Learner').trim().slice(0, 24) || 'Learner';
    if (!AVATAR_RE.test(p.avatar || '')) p.avatar = 'avatar1';
    const s = p.settings;
    Object.keys(CHOICES).forEach((k) => { if (!CHOICES[k].includes(s[k])) s[k] = DEFAULT_SETTINGS[k]; });
    Object.keys(DEFAULT_SETTINGS).forEach((k) => { if (typeof DEFAULT_SETTINGS[k] === 'boolean' && typeof s[k] !== 'boolean') s[k] = DEFAULT_SETTINGS[k]; });
    s.volume = Number.isFinite(Number(s.volume)) ? Math.max(0, Math.min(1, Number(s.volume))) : DEFAULT_SETTINGS.volume;
    s.dailyGoal = [5, 10, 15, 20, 30].includes(Number(s.dailyGoal)) ? Number(s.dailyGoal) : DEFAULT_SETTINGS.dailyGoal;
    OBJECT_FIELDS.forEach((k) => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
    if (!Array.isArray(p.history)) p.history = [];
    p.history = p.history.filter((x) => x && typeof x === 'object' && Number.isFinite(x.t));
    Object.keys(p.totals).forEach((k) => { p.totals[k] = Number(p.totals[k]) || 0; });
    p.unlockedThrough = Math.max(0, Math.min(12, Math.floor(Number(p.unlockedThrough) || 0)));
    return p;
  }

  function migrate(p) {
    if (!p || typeof p !== 'object' || !p.id) return null;
    const base = blankProfile(p.name, p.avatar);
    for (const k of Object.keys(base)) if (p[k] == null) p[k] = base[k];
    p.settings = Object.assign({}, DEFAULT_SETTINGS, p.settings && typeof p.settings === 'object' ? p.settings : {});
    p.totals = Object.assign({}, base.totals, p.totals && typeof p.totals === 'object' ? p.totals : {});
    p.v = VERSION;
    return sanitize(p);
  }

  // ------------------------------------------------------------------ state
  let index = readJSON(INDEX_KEY) || { active: null, list: [] };
  let current = null;

  function writeIndex() { ls.set(INDEX_KEY, JSON.stringify(index)); }
  function syncIndexEntry(p) {
    const e = index.list.find((x) => x.id === p.id);
    const entry = { id: p.id, name: p.name, avatar: p.avatar, created: p.created };
    if (e) Object.assign(e, entry); else index.list.push(entry);
  }

  function save() {
    if (!current) return;
    if (current.history.length > HISTORY_CAP) current.history.splice(0, current.history.length - HISTORY_CAP);
    ls.set(PROFILE_KEY(current.id), JSON.stringify(current));
    syncIndexEntry(current);
    writeIndex();
  }
  const saveSoon = U.debounce(save, 300);
  window.addEventListener('beforeunload', () => save());

  function load(id) {
    const p = migrate(readJSON(PROFILE_KEY(id)));
    return p;
  }

  const store = {
    VERSION,
    DEFAULT_SETTINGS,
    isPersistent: () => persistent,

    /** Loads the active profile; returns it or null when onboarding is needed. */
    init() {
      if (index.active) current = load(index.active);
      if (!current && index.list.length) {
        for (const e of index.list) { current = load(e.id); if (current) break; }
      }
      if (current) { index.active = current.id; writeIndex(); }
      return current;
    },
    get: () => current,
    settings: () => (current ? current.settings : DEFAULT_SETTINGS),
    profiles: () => index.list.slice(),
    activeId: () => (current ? current.id : null),

    create(name, avatar) {
      if (current) save();
      current = blankProfile(String(name || '').trim().slice(0, 24) || 'Learner', avatar);
      index.active = current.id;
      save();
      U.bus.emit('profile:changed', current);
      return current;
    },
    switchTo(id) {
      if (current && current.id === id) return current;
      const p = load(id);
      if (!p) return null;
      if (current) save();
      current = p;
      index.active = id;
      writeIndex();
      U.bus.emit('profile:changed', current);
      return current;
    },
    remove(id) {
      ls.del(PROFILE_KEY(id));
      index.list = index.list.filter((e) => e.id !== id);
      if (index.active === id) {
        index.active = null;
        current = null;
        const next = index.list[0];
        if (next) current = load(next.id);
        if (current) index.active = current.id;
      }
      writeIndex();
      U.bus.emit('profile:changed', current);
    },
    /** Read another profile without switching (local leaderboard). */
    peek: (id) => (current && current.id === id ? current : load(id)),

    update(fn) { if (!current) return; fn(current); saveSoon(); U.bus.emit('data:changed', current); },
    save,
    saveSoon,

    setSetting(key, value) {
      if (!current) return;
      current.settings[key] = value;
      save();
      U.bus.emit('settings:changed', { key, value, settings: current.settings });
    },
    setProfile(name, avatar) {
      if (!current) return;
      if (name != null) current.name = String(name).trim().slice(0, 24) || current.name;
      if (avatar) current.avatar = avatar;
      save();
      U.bus.emit('profile:changed', current);
    },

    resetProgress() {
      if (!current) return;
      const keep = { id: current.id, name: current.name, avatar: current.avatar, created: current.created, settings: current.settings };
      current = Object.assign(blankProfile(), keep, { onboarded: true });
      save();
      U.bus.emit('profile:changed', current);
    },

    // ---------------------------------------------------------------- low-level helpers for backup & transfer
    /** Deep-copied, migrated and sanitised copy of any profile-like object (null if unusable). */
    normalize: (p) => { try { return migrate(JSON.parse(JSON.stringify(p))); } catch (e) { return null; } },
    /** Raw stored JSON for a profile id (null if none). */
    rawProfile: (id) => ls.get(PROFILE_KEY(id)),
    /** Write a whole profile. Returns false if the browser refused (storage full). */
    putProfile(p, opts) {
      const m = store.normalize(p);
      if (!m) return false;
      if (m.history.length > HISTORY_CAP) m.history.splice(0, m.history.length - HISTORY_CAP);
      if (!ls.set(PROFILE_KEY(m.id), JSON.stringify(m))) return false;
      syncIndexEntry(m);
      if ((opts && opts.activate) || !current) { current = m; index.active = m.id; } else if (current.id === m.id) current = m;
      writeIndex();
      U.bus.emit('profile:changed', current);
      return true;
    },
    /** Remember when these learners were last backed up. */
    markBackup(ids, t) {
      ids.forEach((id) => {
        if (current && current.id === id) { current.lastBackup = t; save(); return; }
        const p = load(id);
        if (p) { p.lastBackup = t; ls.set(PROFILE_KEY(id), JSON.stringify(p)); }
      });
    },
    /** Undo support: the index plus raw profile JSON (null = did not exist) for the given ids. */
    snapshot(ids) {
      save();
      const raws = {};
      ids.forEach((id) => { raws[id] = ls.get(PROFILE_KEY(id)); });
      return { t: Date.now(), index: JSON.parse(JSON.stringify(index)), raws };
    },
    restoreSnapshot(snap) {
      Object.entries(snap.raws).forEach(([id, raw]) => { if (raw == null) ls.del(PROFILE_KEY(id)); else ls.set(PROFILE_KEY(id), raw); });
      index = JSON.parse(JSON.stringify(snap.index));
      current = index.active ? load(index.active) : null;
      if (!current && index.list.length) current = load(index.list[0].id);
      index.active = current ? current.id : null;
      writeIndex();
      U.bus.emit('profile:changed', current);
    },
    /** Small key/value slot in the same safe storage (used for the undo snapshot). */
    kv: {
      get: (k) => readJSON('tda:' + k),
      set: (k, v) => ls.set('tda:' + k, JSON.stringify(v)),
      del: (k) => ls.del('tda:' + k),
    },
  };

  TD.store = store;
})(window.TD = window.TD || {});
