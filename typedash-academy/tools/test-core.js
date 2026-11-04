#!/usr/bin/env node
/*
 * TypeDash Academy — core logic tests (no browser needed).
 *   node tools/test-core.js
 * Loads the core + data scripts into a VM and checks: text generation for every episode step,
 * key restrictions, the typing engine in all three error modes, auto-indent, and course rules.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SCRIPTS = ['core/util', 'core/keyboard', 'core/storage', 'data/words', 'data/texts', 'data/guides', 'data/curriculum',
  'core/generator', 'core/engine', 'core/stats', 'core/course', 'core/plans', 'core/achievements', 'core/backup']
  .map((f) => [f, fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8')]);
let clock = 0;

/** A fresh, isolated "browser": its own localStorage and its own copy of the app scripts. */
function makeBrowser() {
  const storage = {};
  const sandbox = {
    console,
    performance: { now: () => clock },
    setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); }, removeItem: (k) => { delete storage[k]; } },
    addEventListener() {},
    matchMedia: () => ({ matches: false }),
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  SCRIPTS.forEach(([f, code]) => vm.runInContext(code, sandbox, { filename: f }));
  return sandbox.TD;
}
const TD = makeBrowser();

let failures = 0;
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.log('✖ ' + msg); } };

// ------------------------------------------------------------------ generation for every step
const eps = TD.course.episodes();
ok(eps.length === 76, 'expected 76 episodes, got ' + eps.length);
let generated = 0;
for (const ep of eps) {
  const allowed = ep.keys !== '*' ? new Set(ep.keys) : null;
  for (const [i, st] of ep.steps.entries()) {
    if (st.type !== 'type' && st.type !== 'timed') continue;
    for (let run = 0; run < 3; run++) {
      const text = TD.gen.generate(st.source, { allowed, weakKeys: ['q', 'z'], weakBigrams: ['th'] });
      generated++;
      ok(typeof text === 'string' && text.trim().length > 0, `${ep.id} step ${i + 1}: empty text`);
      ok(/^[\x20-\x7E\n]*$/.test(text), `${ep.id} step ${i + 1}: non-ASCII text`);
      if (allowed) {
        const bad = [...new Set([...text].filter((c) => c !== ' ' && c !== '\n' && !allowed.has(c)))];
        ok(!bad.length, `${ep.id} step ${i + 1} (${st.source.kind}): generated keys outside "${ep.keys}": ${JSON.stringify(bad.join(''))}`);
      }
      ok(!/  /.test(text.replace(/\n +/g, '\n')), `${ep.id} step ${i + 1}: double space in generated text`);
    }
  }
}

// ------------------------------------------------------------------ engine
function typeAll(s, text, opts) {
  opts = opts || {};
  for (const ch of text) { clock += opts.gap || 200; s.input(ch); }
}
{ // perfect typing, untimed
  clock = 1000;
  const s = TD.engine.create({ text: 'asdf jkl', mode: 'stop' });
  typeAll(s, 'asdf jkl');
  const r = s.result();
  ok(s.finished && r.acc === 100 && r.chars === 8, 'stop mode perfect run');
  ok(Math.abs(r.wpm - (8 / 5) / ((7 * 200) / 60000)) < 0.2, 'WPM formula (got ' + r.wpm + ')');
}
{ // stop mode: wrong key does not advance
  const s = TD.engine.create({ text: 'ab', mode: 'stop' });
  clock += 100; s.input('x');
  ok(s.pos === 0 && s.errors === 1, 'stop mode keeps position on error');
  typeAll(s, 'ab');
  const r = s.result();
  ok(s.finished && r.keystrokes === 3 && Math.round(r.acc) === 67, 'stop mode accuracy counts the miss');
}
{ // correct mode: blocked until Backspace
  const s = TD.engine.create({ text: 'ab', mode: 'correct' });
  clock += 100; s.input('x');
  ok(s.pos === 1 && s.blocked, 'correct mode advances and blocks');
  s.input('b');
  ok(s.pos === 1, 'correct mode ignores input while blocked');
  s.backspace();
  ok(s.pos === 0 && !s.blocked, 'backspace unblocks');
  typeAll(s, 'ab');
  ok(s.finished && s.result().chars === 2, 'correct mode completes with fixed char');
}
{ // advance mode + ctrl backspace + noBackspace
  const s = TD.engine.create({ text: 'hello world', mode: 'advance' });
  typeAll(s, 'hello wox');
  s.backspace(true);
  ok(s.pos === 6, 'ctrl+backspace deletes back to word start (pos ' + s.pos + ')');
  typeAll(s, 'world');
  ok(s.finished && s.result().chars === 11, 'advance mode finishes with corrected word');
  const n = TD.engine.create({ text: 'ab', mode: 'advance', noBackspace: true });
  n.input('x'); n.backspace();
  ok(n.pos === 1, 'noBackspace keeps the error');
}
{ // lives
  const s = TD.engine.create({ text: 'abcdef', mode: 'advance', lives: 2 });
  s.input('x'); s.input('x');
  ok(s.finished && s.failed === 'lives', 'lives end the step');
}
{ // auto indent
  const code = 'if (a) {\n  b();\n}';
  const s = TD.engine.create({ text: code, mode: 'advance', autoIndent: true });
  typeAll(s, 'if (a) {\n');
  ok(s.pos === 11 && s.text[s.pos] === 'b', 'auto-indent skips leading spaces (pos ' + s.pos + ')');
  typeAll(s, 'b();\n}');
  ok(s.finished && s.result().acc === 100, 'auto-indent run completes cleanly');
}
{ // timed with stream extension
  clock = 0;
  let n = 0;
  const s = TD.engine.create({ text: 'aa', mode: 'advance', timeLimit: 10, more: () => { n++; return ' aa'; } });
  typeAll(s, 'aa aa aa', { gap: 100 });
  ok(!s.finished && s.text.length > 8 && n > 0, 'timed session extends its text');
  clock += 20000; s.tick(clock);
  ok(s.finished && s.timedOut, 'timed session ends on the clock');
}

// ------------------------------------------------------------------ course rules & stats
const p = TD.store.create('Tester', 'avatar1');
ok(TD.course.nextEpisode(p).id === '1.1', 'first episode is 1.1');
ok(TD.course.knownKeys(p) === 'asdfjkl;', 'fresh learner practises the home row only (got "' + TD.course.knownKeys(p) + '")');
ok(TD.course.status(TD.course.episode('1.2'), p).state === 'locked', '1.2 locked at start');
const ep11 = TD.course.episode('1.1');
const ev = TD.course.evaluate(ep11, { wpm: 0, acc: 95, completed: true, hasTyping: false });
ok(ev.passed && ev.stars === 3, 'keys-only episode can earn 3 stars');
TD.course.recordEpisode(p, ep11, { wpm: 0, acc: 95, completed: true, hasTyping: false }, ev);
ok(TD.course.status(TD.course.episode('1.2'), p).state === 'open', '1.2 opens after 1.1');
const ep121 = TD.course.episode('12.1');
ok(!TD.course.evaluate(ep121, { wpm: 29, acc: 97, completed: true, hasTyping: true }).passed, '12.1 needs 30 WPM to pass');
ok(TD.course.evaluate(ep121, { wpm: 31, acc: 92, completed: true, hasTyping: true }).passed, '12.1 passes at 31 WPM / 92%');
// placement opens chapters 1..N plus the first episode of chapter N+1, and recommends it
{
  const q = JSON.parse(JSON.stringify(p));
  q.unlockedThrough = 4;
  ok(TD.course.status(TD.course.episode('4.6'), q).state !== 'locked', 'placement opens chapter 4');
  ok(TD.course.status(TD.course.episode('5.1'), q).state === 'open', 'placement opens 5.1');
  ok(TD.course.status(TD.course.episode('5.2'), q).state === 'locked', '5.2 still sequential');
  ok(TD.course.nextEpisode(q).id === '5.1', 'placement recommends 5.1 (got ' + TD.course.nextEpisode(q).id + ')');
}
// weak keys from a synthetic session
const s = TD.engine.create({ text: 'qqqq qqqq aaaa aaaa qqqq aaaa', mode: 'stop' });
for (const ch of s.text) { clock += 150; if (ch === 'q') { s.input('w'); clock += 150; } s.input(ch); }
TD.stats.mergeResult(p, s.result());
const weak = TD.stats.weakKeys(p, { minN: 5 }).map((w) => w.key);
ok(weak[0] === 'q', 'weak-key detection finds q (got ' + weak.join(',') + ')');
const drill = TD.gen.generate({ kind: 'weak', count: 20 }, { weakKeys: weak, weakBigrams: [] });
ok((drill.match(/q/g) || []).length >= 6, 'weak drill concentrates on q');
// plans build for every practice mode
['workout', 'weak'].forEach((m) => ok(TD.plans[m](p).steps.length > 0, 'plan ' + m));
ok(TD.plans.test(60).steps[0].seconds === 60, 'test plan');
ok(TD.plans.custom('Hello “world” — test…').steps[0].source.text === 'Hello "world" - test...', 'custom text normalisation');
const fresh = TD.achievements.check(p, {});
ok(fresh.some((a) => a.id === 'first-steps'), 'achievement unlocks');

// ------------------------------------------------------------------ backup & transfer between browsers
{
  const pass = (T, id, agg) => { const ep = T.course.episode(id); T.course.recordEpisode(T.store.get(), ep, agg, T.course.evaluate(ep, agg)); };
  const A = makeBrowser();
  const ava = A.store.create('Ava', 'avatar4');
  pass(A, '1.1', { wpm: 0, acc: 97, completed: true, hasTyping: false });
  A.stats.addHistory(ava, { kind: 'episode', id: '1.1', title: 'Meet the Keyboard', wpm: 0, acc: 97, ms: 60000, ch: 0 });
  ava.records.test60 = { wpm: 31, acc: 95, t: 1000, ghost: [1, 2, 3] };
  A.store.save();
  const file = A.backup.exportBackup({ scope: 'learner' });
  ok(file && file.count === 1 && /^typedash-academy-ava-\d{4}-\d{2}-\d{2}\.json$/.test(file.filename), 'export file name (' + (file && file.filename) + ')');
  ok(A.store.get().lastBackup > 0, 'export records the backup time');

  // Another browser: nothing there yet, restore from the file.
  const B = makeBrowser();
  ok(B.store.get() === null, 'fresh browser starts without a learner');
  const pv = B.backup.parse(file.json);
  ok(pv.ok && pv.items.length === 1 && !pv.items[0].match && pv.items[0].action === 'add', 'preview in a fresh browser offers "add"');
  ok(B.backup.apply(pv.items).ok && B.store.get() && B.store.get().name === 'Ava', 'restored learner becomes the active learner');
  ok(B.store.get().episodes['1.1'].done && B.store.get().episodes['1.1'].stars === 3, 'lesson progress restored');
  ok(B.store.get().records.test60.wpm === 31 && B.store.get().history.length === 1, 'records and history restored');
  ok(B.store.get().id === ava.id, 'learner keeps the same id across browsers');

  // Practice continues in B, then the older file is imported again: merge keeps both.
  pass(B, '1.2', { wpm: 12, acc: 95, completed: true, hasTyping: true });
  B.stats.addHistory(B.store.get(), { kind: 'episode', id: '1.2', title: 'Left Hand Home', wpm: 12, acc: 95, ms: 90000, ch: 100 });
  B.store.save();
  const pv2 = B.backup.parse(file.json);
  ok(pv2.items[0].match && pv2.items[0].match.sameId && pv2.items[0].action === 'merge', 'the same learner defaults to merge');
  B.backup.apply(pv2.items);
  ok(B.store.get().episodes['1.2'] && B.store.get().episodes['1.2'].done, 'merge keeps newer progress made in this browser');
  ok(B.store.get().history.length === 2, 'merge combines history without duplicates (' + B.store.get().history.length + ')');

  // Replace, then undo.
  const pv3 = B.backup.parse(file.json);
  pv3.items[0].action = 'replace';
  B.backup.apply(pv3.items);
  ok(!B.store.get().episodes['1.2'], 'replace makes this browser match the file');
  ok(!!B.backup.undoInfo() && B.backup.undo(), 'the import can be undone');
  ok(B.store.get().episodes['1.2'] && B.store.get().episodes['1.2'].done, 'undo restores the state before the import');

  // Import as a copy.
  const pv4 = B.backup.parse(file.json);
  pv4.items[0].action = 'copy';
  const r4 = B.backup.apply(pv4.items);
  ok(B.store.profiles().length === 2 && /\(copy\)$/.test(r4.results[0].name) && r4.results[0].id !== ava.id, 'copy adds a second learner');
  ok(B.store.get().id === ava.id, 'importing a copy does not switch the active learner');

  // Everyone on the device -> a third browser.
  const all = B.backup.exportBackup({ scope: 'all' });
  ok(all.count === 2 && /all-learners/.test(all.filename), 'export all learners');
  const C = makeBrowser();
  ok(C.backup.apply(C.backup.parse(all.json).items).ok && C.store.profiles().length === 2, 'all learners imported into another browser');

  // Same name, different learner.
  const D = makeBrowser();
  D.store.create('ava', 'avatar2');
  const pvd = D.backup.parse(file.json);
  ok(pvd.items[0].match && !pvd.items[0].match.sameId && pvd.items[0].action === 'add', 'a same-name learner defaults to a separate import');
  D.backup.apply(pvd.items);
  ok(D.store.profiles().map((x) => x.name).includes('Ava 2'), 'separate import gets a unique name (' + D.store.profiles().map((x) => x.name).join(', ') + ')');

  // Bad, old, edited and malicious files.
  ok(!B.backup.parse('').ok && !B.backup.parse('not json').ok && !B.backup.parse('{"app":"other"}').ok, 'invalid files are rejected');
  ok(!B.backup.parse(JSON.stringify({ app: 'typedash-academy', profiles: [] })).ok, 'a backup without learners is rejected');
  const edited = JSON.parse(file.json);
  edited.profiles[0].name = 'Mallory';
  const pve = B.backup.parse(JSON.stringify(edited));
  ok(pve.ok && pve.warnings.some((w) => /edited or damaged/.test(w)), 'an edited file imports with a warning');
  const legacy = JSON.stringify({ app: 'typedash-academy', version: 1, exported: new Date().toISOString(), profile: JSON.parse(file.json).profiles[0] });
  ok(makeBrowser().backup.parse(legacy).ok, 'older single-learner backups still import');
  const evil = JSON.parse(file.json);
  Object.assign(evil.profiles[0], { id: 'evil-1', avatar: '../../x', history: 'nope' });
  evil.profiles[0].settings.theme = '<img src=x>';
  const E = makeBrowser();
  E.backup.apply(E.backup.parse(JSON.stringify(evil)).items);
  ok(E.store.get().avatar === 'avatar1' && E.store.get().settings.theme === 'dark' && Array.isArray(E.store.get().history), 'imported values are sanitised');
}

console.log(`\n${checks - failures}/${checks} checks passed · ${generated} generated texts`);
process.exit(failures ? 1 : 0);
