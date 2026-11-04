/* TypeDash Academy — backup & transfer.
 *
 * Export one learner (or every learner on this device) to a JSON file, then import that file into any
 * browser — another computer, another browser, or this same browser. Imports are previewed first, each
 * learner gets an action (add / merge / replace / copy / skip), and the last import can be undone.
 *
 * File format (format 2):
 *   { app: 'typedash-academy', kind: 'backup', format: 2, version, exported, scope: 'learner'|'all',
 *     profiles: [ ...learner data... ], checksum }      checksum = FNV-1a of JSON.stringify(profiles)
 * Format 1 files ({ app, version, exported, profile }) from earlier builds are still accepted.
 */
(function (TD) {
  'use strict';
  const U = TD.util;
  const APP = 'typedash-academy';
  const FORMAT = 2;
  const MAX_BYTES = 20 * 1024 * 1024;
  const UNDO_TTL = 24 * 3600 * 1000;
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  let memUndo = null;

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  /** Short description of a learner's progress, for previews. */
  function summary(p) {
    if (!p) return null;
    const cp = TD.course.courseProgress(p);
    const lastSession = p.history.length ? p.history[p.history.length - 1].t : 0;
    return {
      name: p.name,
      avatar: p.avatar,
      done: cp.done,
      total: cp.total,
      stars: cp.stars,
      best: TD.stats.bestWpm(p),
      sessions: p.history.length,
      ms: p.totals.ms || 0,
      achievements: Object.keys(p.achievements).length,
      last: lastSession || p.created || 0,
      lastBackup: p.lastBackup || null,
    };
  }

  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'learner';

  // ------------------------------------------------------------------ export
  /** Build a backup. opts.scope: 'learner' (active learner, default) or 'all'. Returns { json, filename, count, profiles }. */
  function exportBackup(opts) {
    TD.store.save();
    const scope = opts && opts.scope === 'all' ? 'all' : 'learner';
    const cur = TD.store.get();
    const live = scope === 'all' ? TD.store.profiles().map((e) => TD.store.peek(e.id)).filter(Boolean) : cur ? [cur] : [];
    if (!live.length) return null;
    const now = Date.now();
    TD.store.markBackup(live.map((p) => p.id), now);
    const profiles = live.map((p) => Object.assign(clone(p), { lastBackup: now }));
    const body = { app: APP, kind: 'backup', format: FORMAT, version: TD.store.VERSION, exported: new Date(now).toISOString(), scope, profiles };
    body.checksum = fnv1a(JSON.stringify(profiles));
    const who = scope === 'all' ? (profiles.length > 1 ? 'all-learners' : slug(profiles[0].name)) : slug(cur.name);
    return { json: JSON.stringify(body), filename: 'typedash-academy-' + who + '-' + U.dayKey(now) + '.json', count: profiles.length, profiles };
  }

  /** Export and download in one go. */
  function download(opts) {
    const b = exportBackup(opts);
    if (!b) return null;
    U.download(b.filename, b.json, 'application/json');
    U.bus.emit('backup:exported', b);
    return b;
  }

  // ------------------------------------------------------------------ import: preview
  /**
   * Read a backup file's text. Returns { ok, error } or
   * { ok: true, items: [{ data, summary, match, action, options }], warnings, meta }.
   */
  function parse(text) {
    if (text == null || !String(text).trim()) return { ok: false, error: 'The file is empty.' };
    if (String(text).length > MAX_BYTES) return { ok: false, error: 'The file is too large to be a TypeDash Academy backup.' };
    let data;
    try { data = JSON.parse(text); } catch (e) {
      return { ok: false, error: 'This file could not be read. Choose the .json file you downloaded from TypeDash Academy.' };
    }
    if (!data || typeof data !== 'object' || data.app !== APP) return { ok: false, error: 'This file is not a TypeDash Academy backup.' };
    const raw = Array.isArray(data.profiles) ? data.profiles : data.profile ? [data.profile] : [];
    const warnings = [];
    if ((data.format || 1) > FORMAT || (data.version || 1) > TD.store.VERSION) warnings.push('This backup was made by a newer version of TypeDash Academy. Some details may not import.');
    if (data.checksum && fnv1a(JSON.stringify(raw)) !== data.checksum) warnings.push('This file looks edited or damaged. You can still import it, but check the result afterwards.');
    const seen = new Set();
    const profiles = raw
      .filter((p) => p && typeof p === 'object' && typeof p.id === 'string' && p.id && typeof p.name === 'string')
      .filter((p) => !seen.has(p.id) && seen.add(p.id))
      .map((p) => TD.store.normalize(p))
      .filter(Boolean);
    if (!profiles.length) return { ok: false, error: 'This backup does not contain any learners.' };

    const local = TD.store.profiles();
    const items = profiles.map((p) => {
      const byId = local.find((e) => e.id === p.id);
      const byName = byId ? null : local.find((e) => e.name.trim().toLowerCase() === p.name.trim().toLowerCase());
      const m = byId || byName;
      const match = m ? { id: m.id, sameId: !!byId, summary: summary(TD.store.peek(m.id)) } : null;
      const options = !match ? ['add', 'skip'] : match.sameId ? ['merge', 'replace', 'copy', 'skip'] : ['add', 'merge', 'skip'];
      return { data: p, summary: summary(p), match, options, action: options[0] };
    });
    return {
      ok: true,
      items,
      warnings,
      meta: { exported: data.exported || null, scope: data.scope || 'learner', format: data.format || 1 },
    };
  }

  // ------------------------------------------------------------------ import: merge
  const num = (x) => Number(x) || 0;
  const maxOf = (a, b) => Math.max(num(a), num(b));
  const earliest = (a, b) => (a && b ? Math.min(a, b) : a || b || undefined);

  /**
   * Merge `incoming` into `target` (this device's copy) without losing progress from either side:
   * completed lessons, the best stars/speeds/records, every session and practice day, read guides and
   * achievements. Settings, name and avatar stay as they are on this device.
   */
  function merge(target, incoming) {
    const m = clone(target);
    const b = incoming;
    Object.entries(b.episodes).forEach(([id, e]) => {
      const t = m.episodes[id];
      if (!t) { m.episodes[id] = clone(e); return; }
      t.done = !!(t.done || e.done);
      t.stars = maxOf(t.stars, e.stars);
      t.bestWpm = maxOf(t.bestWpm, e.bestWpm);
      t.bestAcc = maxOf(t.bestAcc, e.bestAcc);
      t.attempts = maxOf(t.attempts, e.attempts);
      t.fails = maxOf(t.fails, e.fails);
      t.first = earliest(t.first, e.first);
      t.last = maxOf(t.last, e.last);
      t.completedAt = earliest(t.completedAt, e.completedAt);
      t.skipped = !t.done && !!(t.skipped || e.skipped);
    });
    ['guides', 'achievements'].forEach((k) => Object.entries(b[k]).forEach(([id, ts]) => { m[k][id] = earliest(m[k][id], ts); }));
    Object.entries(b.records).forEach(([id, r]) => {
      if (r && (!m.records[id] || num(r.wpm) > num(m.records[id].wpm))) m.records[id] = clone(r);
    });
    // Per day keep the larger numbers: safe when both copies grew from the same earlier backup.
    Object.entries(b.daily).forEach(([day, v]) => {
      const t = m.daily[day] || (m.daily[day] = { ms: 0, n: 0, ch: 0 });
      t.ms = maxOf(t.ms, v.ms);
      t.n = maxOf(t.n, v.n);
      t.ch = maxOf(t.ch, v.ch);
    });
    const key = (x) => x.t + '|' + x.kind + '|' + x.id;
    const seen = new Set(m.history.map(key));
    b.history.forEach((x) => { if (!seen.has(key(x))) { seen.add(key(x)); m.history.push(clone(x)); } });
    m.history.sort((x, y) => x.t - y.t);
    // Key statistics are running averages and cannot be added together; keep the richer set.
    if (num(b.totals.ks) > num(target.totals.ks)) {
      m.keys = clone(b.keys);
      m.bigrams = clone(b.bigrams);
      m.confusions = clone(b.confusions);
    }
    m.totals = {
      ks: maxOf(target.totals.ks, b.totals.ks),
      ch: maxOf(target.totals.ch, b.totals.ch),
      ms: maxOf(target.totals.ms, b.totals.ms),
      sessions: Math.max(num(target.totals.sessions), num(b.totals.sessions), m.history.length),
    };
    m.unlockedThrough = maxOf(target.unlockedThrough, b.unlockedThrough);
    if (b.placement && (!m.placement || num(b.placement.t) > num(m.placement.t))) m.placement = clone(b.placement);
    m.onboarded = !!(target.onboarded || b.onboarded);
    m.created = earliest(target.created, b.created);
    m.lastBackup = maxOf(target.lastBackup, b.lastBackup) || null;
    return m;
  }

  function uniqueName(name, selfId) {
    const taken = new Set(TD.store.profiles().filter((e) => e.id !== selfId).map((e) => e.name.trim().toLowerCase()));
    let n = String(name).slice(0, 24);
    for (let i = 2; taken.has(n.trim().toLowerCase()); i++) n = String(name).slice(0, 20) + ' ' + i;
    return n;
  }

  // ------------------------------------------------------------------ import: apply & undo
  /**
   * Apply a previewed import. items: the parse() items, each with its chosen `action`.
   * Returns { ok, results: [{ name, action, id }], error }.
   */
  function apply(items) {
    const plan = [];
    const taken = new Set(TD.store.profiles().map((e) => e.id));
    items.forEach((it) => {
      if (!it || it.action === 'skip') return;
      if (!it.options.includes(it.action)) return;
      let id;
      if (it.action === 'merge' || it.action === 'replace') id = it.match.id;
      else if (it.action === 'copy' || taken.has(it.data.id)) id = U.uid();
      else id = it.data.id;
      taken.add(id);
      plan.push({ it, id });
    });
    if (!plan.length) return { ok: true, results: [] };

    const snap = TD.store.snapshot(plan.map((p) => p.id));
    const hadLearner = !!TD.store.get();
    const results = [];
    for (const { it, id } of plan) {
      let profile;
      if (it.action === 'merge') profile = merge(TD.store.peek(id), it.data);
      else if (it.action === 'replace') profile = Object.assign(clone(it.data), { id });
      else profile = Object.assign(clone(it.data), { id, name: uniqueName(it.data.name + (it.action === 'copy' ? ' (copy)' : ''), id) });
      const ok = TD.store.putProfile(profile, { activate: !hadLearner && !results.length });
      if (!ok) {
        TD.store.restoreSnapshot(snap);
        return { ok: false, error: 'This browser ran out of storage space while importing, so nothing was changed. Free some space (or delete an unused learner) and try again.', results };
      }
      results.push({ name: profile.name, action: it.action, id });
    }
    saveUndo({ snap, results });
    U.bus.emit('backup:imported', results);
    return { ok: true, results };
  }

  function saveUndo(u) {
    memUndo = u;
    if (!TD.store.kv.set('undo-import', u)) TD.store.kv.del('undo-import');
  }
  /** The last import, if it can still be undone: { t, results } or null. */
  function undoInfo() {
    const u = memUndo || TD.store.kv.get('undo-import');
    if (!u || !u.snap || Date.now() - u.snap.t > UNDO_TTL) return null;
    return { t: u.snap.t, results: u.results || [] };
  }
  function undo() {
    const u = memUndo || TD.store.kv.get('undo-import');
    if (!u || !u.snap) return false;
    TD.store.restoreSnapshot(u.snap);
    memUndo = null;
    TD.store.kv.del('undo-import');
    U.bus.emit('backup:undone');
    return true;
  }

  // ------------------------------------------------------------------ compatibility helpers
  TD.store.exportJSON = () => { const b = exportBackup({ scope: 'learner' }); return b ? b.json : ''; };
  /** One-step import with the default actions (merge known learners, add new ones). */
  TD.store.importJSON = (text) => {
    const p = parse(text);
    if (!p.ok) return { ok: false, error: p.error };
    const r = apply(p.items);
    if (!r.ok) return r;
    const first = r.results[0];
    return { ok: true, profile: first ? TD.store.peek(first.id) : null, replaced: !!(first && first.action !== 'add'), results: r.results };
  };

  TD.backup = { FORMAT, exportBackup, download, parse, apply, merge, undo, undoInfo, summary, checksum: fnv1a };
})(window.TD = window.TD || {});
