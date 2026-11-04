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
const store = {};
const sandbox = {
  console,
  performance: { now: () => clock },
  setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  addEventListener() {},
  matchMedia: () => ({ matches: false }),
};
sandbox.window = sandbox;
let clock = 0;
vm.createContext(sandbox);
['core/util', 'core/keyboard', 'core/storage', 'data/words', 'data/texts', 'data/guides', 'data/curriculum',
  'core/generator', 'core/engine', 'core/stats', 'core/course', 'core/plans', 'core/achievements']
  .forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), sandbox, { filename: f }));
const TD = sandbox.TD;

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

console.log(`\n${checks - failures}/${checks} checks passed · ${generated} generated texts`);
process.exit(failures ? 1 : 0);
