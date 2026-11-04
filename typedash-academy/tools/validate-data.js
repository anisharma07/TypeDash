#!/usr/bin/env node
/*
 * TypeDash Academy — content validator.
 * Checks js/data/*.js against docs/CONTENT-SPEC.md.
 *
 *   node tools/validate-data.js                 # everything
 *   node tools/validate-data.js --only words    # words | texts | guides | curriculum (comma separated)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1].split(',') : null;
const want = (name) => !ONLY || ONLY.includes(name);

const errors = [];
const warnings = [];
const err = (scope, msg) => errors.push(`✖ [${scope}] ${msg}`);
const warn = (scope, msg) => warnings.push(`⚠ [${scope}] ${msg}`);

// ---------------------------------------------------------------- loading
const sandbox = { window: {}, console };
vm.createContext(sandbox);
const loaded = {};
for (const file of ['words', 'texts', 'guides', 'curriculum']) {
  const p = path.join(ROOT, 'js/data', file + '.js');
  if (!fs.existsSync(p)) {
    if (want(file)) warn(file, `js/data/${file}.js does not exist yet`);
    continue;
  }
  try {
    vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: p });
    loaded[file] = true;
  } catch (e) {
    err(file, `failed to execute: ${e.message}`);
  }
}
const DATA = (sandbox.window.TD && sandbox.window.TD.data) || {};

// ---------------------------------------------------------------- shared
const OFFICIAL_IDS = [];
[[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 7], [8, 6], [9, 7], [10, 6], [11, 7], [12, 7]]
  .forEach(([c, n]) => { for (let i = 1; i <= n; i++) OFFICIAL_IDS.push(`${c}.${i}`); });

const BLOCK = new Set(('ass asses arse arses bitch bitches bastard crap damn dick dicks dildo fag fags fuck fucks ' +
  'fucking fucked nazi nazis nigger nigga penis piss pissed porn rape raped sex sexy shit shits slut sluts tits twat ' +
  'whore wank cock cocks cunt pussy boob boobs retard retarded spastic hell kkk').split(' '));
const ASCII_RE = /^[\x20-\x7E\n]*$/;
const LEFT = new Set('qwertasdfgzxcvb');
const RIGHT = new Set('yuiophjklnm');
const toList = (v) => (Array.isArray(v) ? v : String(v || '').split(/\s+/).filter(Boolean));
const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const only = (word, set) => [...word].every((c) => set.has(c));
const countIn = (word, set) => [...word].filter((c) => set.has(c)).length;

function checkPlainText(scope, s, { code = false } = {}) {
  if (typeof s !== 'string' || !s.length) return err(scope, 'empty or not a string');
  if (!ASCII_RE.test(s)) {
    const bad = [...s].filter((c) => !/[\x20-\x7E\n]/.test(c));
    err(scope, `non-ASCII characters ${JSON.stringify([...new Set(bad)].join(''))} in "${s.slice(0, 50)}..."`);
  }
  if (s.includes('\t')) err(scope, 'contains a tab');
  s.split('\n').forEach((line, i) => {
    if (/ $/.test(line)) err(scope, `trailing space on line ${i + 1}: "${line.slice(-30)}"`);
    if (!code && /^ /.test(line)) err(scope, `leading space on line ${i + 1}`);
    const body = code ? line.replace(/^ +/, '') : line;
    if (!code && /  /.test(body)) err(scope, `double space in "${body.slice(0, 60)}"`);
  });
  if (/^\n|\n$/.test(s)) err(scope, 'starts or ends with a newline');
}

// ---------------------------------------------------------------- words
function validateWords(W) {
  const S = 'words';
  if (!W) return err(S, 'TD.data.words missing');
  const mins = {
    common: 900, extra: 3000, len2: 40, len3: 80, len4: 80, len5: 80, homeRow: 50, homeTop: 150,
    leftHand: 80, rightHand: 40, alternating: 60, difficult: 80, pinky: 60, ring: 60, bottomRow: 60,
  };
  const lists = {};
  for (const [key, min] of Object.entries(mins)) {
    if (W[key] == null) { err(S, `missing list "${key}"`); continue; }
    const list = toList(W[key]);
    lists[key] = list;
    if (list.length < min) err(S, `"${key}" has ${list.length} words, needs >= ${min}`);
    const seen = new Set();
    for (const w of list) {
      if (!/^[a-z]+$/.test(w)) err(S, `"${key}": invalid word "${w}"`);
      if (seen.has(w)) err(S, `"${key}": duplicate "${w}"`);
      seen.add(w);
      if (BLOCK.has(w)) err(S, `"${key}": blocked word "${w}"`);
    }
  }
  if (lists.common) {
    lists.common.filter((w) => w.length === 1 && w !== 'a' && w !== 'i')
      .forEach((w) => err(S, `common: single letter "${w}"`));
  }
  if (lists.common && lists.extra) {
    const c = new Set(lists.common);
    const dup = lists.extra.filter((w) => c.has(w));
    if (dup.length) warn(S, `extra repeats ${dup.length} words from common (e.g. ${dup.slice(0, 8).join(', ')})`);
  }
  [2, 3, 4, 5].forEach((n) => (lists['len' + n] || []).forEach((w) => {
    if (w.length !== n) err(S, `len${n}: "${w}" has length ${w.length}`);
  }));
  const setRule = (key, letters) => (lists[key] || []).forEach((w) => {
    if (!only(w, new Set(letters))) err(S, `${key}: "${w}" uses letters outside ${letters}`);
  });
  setRule('homeRow', 'asdfghjkl');
  setRule('homeTop', 'qwertyuiopasdfghjkl');
  setRule('leftHand', 'qwertasdfgzxcvb');
  setRule('rightHand', 'yuiophjklnm');
  (lists.alternating || []).forEach((w) => {
    for (let i = 1; i < w.length; i++) {
      if (LEFT.has(w[i]) === LEFT.has(w[i - 1])) { err(S, `alternating: "${w}" does not alternate hands`); break; }
    }
  });
  const atLeastTwo = (key, letters) => (lists[key] || []).forEach((w) => {
    if (countIn(w, new Set(letters)) < 2) err(S, `${key}: "${w}" has fewer than two of ${letters}`);
  });
  atLeastTwo('pinky', 'qazp');
  atLeastTwo('ring', 'wsxol');
  atLeastTwo('bottomRow', 'zxcvbnm');

  const SEQ = 'th he the and ing ion tion ment ough ight eigh str spr scr er re ed ly ch sh wh ph pre pro con com able less ness qu ck ou'.split(' ');
  const SMALL = new Set(['eigh', 'ough', 'spr', 'scr']);
  if (!W.seq || typeof W.seq !== 'object') err(S, 'missing object "seq"');
  else {
    for (const k of SEQ) {
      if (W.seq[k] == null) { err(S, `seq.${k} missing`); continue; }
      const list = toList(W.seq[k]);
      const min = SMALL.has(k) ? 20 : 30;
      if (list.length < min) err(S, `seq.${k} has ${list.length} words, needs >= ${min}`);
      const seen = new Set();
      list.forEach((w) => {
        if (!/^[a-z]+$/.test(w)) err(S, `seq.${k}: invalid word "${w}"`);
        if (!w.includes(k)) err(S, `seq.${k}: "${w}" does not contain "${k}"`);
        if (seen.has(w)) err(S, `seq.${k}: duplicate "${w}"`);
        if (BLOCK.has(w)) err(S, `seq.${k}: blocked word "${w}"`);
        seen.add(w);
      });
    }
    Object.keys(W.seq).filter((k) => !SEQ.includes(k)).forEach((k) => warn(S, `extra seq key "${k}" (fine, just unused)`));
  }
  const all = new Set([...(lists.common || []), ...(lists.extra || [])]);
  const homeCount = [...all].filter((w) => only(w, new Set('asdfghjkl'))).length;
  const rightCount = [...all].filter((w) => only(w, new Set('yuiophjklnm'))).length;
  if (homeCount < 40) warn(S, `common+extra contain only ${homeCount} home-row words`);
  if (rightCount < 30) warn(S, `common+extra contain only ${rightCount} right-hand words`);
  return { total: all.size };
}

// ---------------------------------------------------------------- texts
function validateTexts(T) {
  const S = 'texts';
  if (!T) return err(S, 'TD.data.texts missing');
  const rules = {
    pangrams: { min: 10, re: /^[A-Za-z ,.!'?]+$/ },
    sentencesShort: { min: 60, re: /^[a-z ]+$/, words: [4, 7] },
    sentencesMedium: { min: 50, re: /^[a-z ]+$/, words: [8, 14] },
    capitals: { min: 40, re: /^[A-Za-z .]+$/, end: /\.$/ },
    commas: { min: 40, re: /^[A-Za-z ,.]+$/, has: ',' },
    questions: { min: 40, re: /^[A-Za-z ,.?!]+$/, hasAny: '?!' },
    paragraphs: { min: 20, re: /^[A-Za-z ,.?!'";:-]+$/, words: [45, 120] },
    speed: { min: 20, re: /^[A-Za-z ,.]+$/, words: [38, 85] },
    rhythm: { min: 12, re: /^[a-z ]+$/, words: [25, 50] },
    accuracy: { min: 20, words: [18, 65] },
    chat: { min: 15, multiline: true },
    emails: { min: 12, multiline: true, words: [45, 130] },
    news: { min: 12, words: [65, 135] },
    technical: { min: 12, words: [55, 125] },
    numbers: { min: 25, re: /[0-9]/ },
    symbols: { min: 12, len: [30, 80] },
    longform: { min: 6, words: [190, 360] },
  };
  for (const [key, r] of Object.entries(rules)) {
    const arr = T[key];
    if (!Array.isArray(arr)) { err(S, `missing array "${key}"`); continue; }
    if (arr.length < r.min) err(S, `"${key}" has ${arr.length} items, needs >= ${r.min}`);
    const seen = new Set();
    arr.forEach((s, i) => {
      const scope = `${S}.${key}[${i}]`;
      checkPlainText(scope, s);
      if (typeof s !== 'string') return;
      if (seen.has(s)) warn(scope, 'duplicate item');
      seen.add(s);
      if (!r.multiline && s.includes('\n') && key !== 'longform') err(scope, 'unexpected line break');
      if (r.re && !r.re.test(s)) err(scope, `characters not allowed for ${key}: "${s.slice(0, 60)}"`);
      if (r.end && !r.end.test(s)) err(scope, 'must end with "."');
      if (r.has && !s.includes(r.has)) err(scope, `must contain "${r.has}"`);
      if (r.hasAny && ![...r.hasAny].some((c) => s.includes(c))) err(scope, `must contain one of ${r.hasAny}`);
      if (r.words) {
        const n = wordCount(s);
        if (n < r.words[0] || n > r.words[1]) err(scope, `${n} words, expected ${r.words[0]}-${r.words[1]}`);
      }
      if (r.len && (s.length < r.len[0] || s.length > r.len[1])) err(scope, `${s.length} chars, expected ${r.len.join('-')}`);
      if (key === 'capitals' && (s.match(/\b[A-Z]/g) || []).length < 2) err(scope, 'needs at least two capitalised words');
      if (key === 'chat') {
        const lines = s.split('\n');
        if (lines.length < 4 || lines.length > 8) err(scope, `${lines.length} messages, expected 4-8`);
        lines.forEach((l) => { if (!/^[A-Z][A-Za-z]*: \S/.test(l)) err(scope, `line not "Name: message": "${l}"`); });
      }
      if (key === 'emails' && !s.includes('\n')) err(scope, 'email needs line breaks');
    });
  }
  if (!Array.isArray(T.code)) err(S, 'missing array "code"');
  else {
    if (T.code.length < 18) err(S, `"code" has ${T.code.length} items, needs >= 18`);
    const LANGS = new Set(['javascript', 'python', 'html', 'css', 'sql', 'bash', 'json']);
    T.code.forEach((c, i) => {
      const scope = `${S}.code[${i}]`;
      if (!c || typeof c !== 'object') return err(scope, 'must be an object');
      if (!LANGS.has(c.lang)) err(scope, `bad lang "${c.lang}"`);
      if (!c.title) err(scope, 'missing title');
      checkPlainText(scope, c.text, { code: true });
      if (typeof c.text !== 'string') return;
      const lines = c.text.split('\n');
      if (lines.length < 4 || lines.length > 14) err(scope, `${lines.length} lines, expected 4-14`);
      lines.forEach((l) => {
        const lead = l.match(/^ */)[0].length;
        if (lead % 2) err(scope, `odd indentation: "${l}"`);
      });
    });
  }
}

// ---------------------------------------------------------------- guides
function validateGuides(G, tips) {
  const S = 'guides';
  if (!Array.isArray(G)) return err(S, 'TD.data.guides must be an array');
  const ids = new Set();
  const placements = new Set([...OFFICIAL_IDS, 'end']);
  const TYPES = { p: ['text'], h: ['text'], list: ['items'], steps: ['items'], tip: ['text'], warn: ['text'],
    keys: ['keys'], fingers: [], compare: ['good', 'bad'], try: ['text'] };
  G.forEach((g, i) => {
    const scope = `${S}[${i}:${g && g.id}]`;
    if (!g || typeof g !== 'object') return err(scope, 'not an object');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.id || '')) err(scope, 'id must be kebab-case');
    if (ids.has(g.id)) err(scope, 'duplicate id');
    ids.add(g.id);
    ['title', 'icon', 'summary'].forEach((f) => { if (!g[f] || typeof g[f] !== 'string') err(scope, `missing ${f}`); });
    if (!placements.has(g.before)) err(scope, `"before" must be an episode id or "end", got ${g.before}`);
    if (typeof g.minutes !== 'number') err(scope, 'minutes must be a number');
    if (!Array.isArray(g.blocks) || !g.blocks.length) return err(scope, 'blocks must be a non-empty array');
    g.blocks.forEach((b, j) => {
      const bs = `${scope}.blocks[${j}]`;
      if (!b || !TYPES[b.type]) return err(bs, `unknown block type ${b && b.type}`);
      TYPES[b.type].forEach((f) => { if (b[f] == null) err(bs, `${b.type} needs "${f}"`); });
      if ((b.type === 'list' || b.type === 'steps') && (!Array.isArray(b.items) || !b.items.length)) err(bs, 'items must be a non-empty array');
      if (b.type === 'try') checkPlainText(bs, b.text);
      if (b.type === 'keys' && !ASCII_RE.test(b.keys || '')) err(bs, 'keys must be ASCII');
    });
  });
  if (G.length < 18) warn(S, `only ${G.length} guides (aim for ~24)`);
  if (!Array.isArray(tips)) err('tips', 'TD.data.tips must be an array');
  else {
    if (tips.length < 80) err('tips', `${tips.length} tips, needs >= 80`);
    tips.forEach((t, i) => {
      if (typeof t !== 'string' || !t) err('tips', `tip ${i} empty`);
      else if (t.length > 140) err('tips', `tip ${i} is ${t.length} chars (> 140)`);
    });
  }
}

// ---------------------------------------------------------------- curriculum
function validateCurriculum(C, W, T) {
  const S = 'curriculum';
  if (!C || !Array.isArray(C.chapters)) return err(S, 'TD.data.curriculum.chapters must be an array');
  if (C.chapters.length !== 12) err(S, `expected 12 chapters, got ${C.chapters.length}`);
  const LEVELS = new Set(['beginner', 'intermediate', 'advanced', 'expert']);
  const MODES = new Set(['stop', 'correct', 'advance']);
  const OPTS = new Set(['errorMode', 'noBackspace', 'hideKeyboard', 'blind', 'lives', 'metronome', 'ghost', 'record', 'autoIndent']);
  const RECORDS = new Set(['test15', 'test30', 'test60', 'test120']);
  const ids = [];

  const listWords = (name) => {
    if (!W) return null;
    if (name.startsWith('seq.')) return W.seq && W.seq[name.slice(4)] != null ? toList(W.seq[name.slice(4)]) : undefined;
    return W[name] != null ? toList(W[name]) : undefined;
  };

  function checkChars(scope, text, allowed) {
    if (!allowed) return;
    const bad = [...new Set([...text].filter((c) => c !== ' ' && c !== '\n' && !allowed.has(c)))];
    if (bad.length) err(scope, `uses keys not allowed in this episode: ${JSON.stringify(bad.join(''))} in "${text.slice(0, 50)}"`);
  }

  function checkSource(scope, src, allowed) {
    if (!src || typeof src !== 'object') return err(scope, 'source missing');
    const need = (f, type) => {
      if (src[f] == null) return err(scope, `${src.kind} source needs "${f}"`);
      if (type && typeof src[f] !== type) err(scope, `"${f}" must be ${type}`);
    };
    switch (src.kind) {
      case 'text': need('text', 'string'); if (typeof src.text === 'string') { checkPlainText(scope, src.text, { code: true }); checkChars(scope, src.text, allowed); } break;
      case 'repeat': need('pattern', 'string'); need('times', 'number'); if (src.pattern) checkChars(scope, src.pattern, allowed); break;
      case 'drill': need('items'); need('each', 'number'); (src.items || []).forEach((it) => checkChars(scope, it, allowed)); break;
      case 'shuffle': need('items'); need('count', 'number'); (src.items || []).forEach((it) => checkChars(scope, it, allowed)); break;
      case 'words':
        need('list'); need('count', 'number');
        if (Array.isArray(src.list)) src.list.forEach((w) => checkChars(scope, w, allowed));
        else if (typeof src.list === 'string') {
          const words = listWords(src.list);
          if (words === undefined) err(scope, `unknown word list "${src.list}"`);
          else if (words && allowed) {
            const usable = words.filter((w) => [...w].every((c) => allowed.has(c)));
            if (usable.length < 10) err(scope, `list "${src.list}" has only ${usable.length} words usable with this episode's keys`);
            else if (usable.length < words.length * 0.6) warn(scope, `list "${src.list}": only ${usable.length}/${words.length} words fit the allowed keys (others are filtered out)`);
          }
        }
        break;
      case 'letters': case 'combos':
        need('keys', 'string'); need('count', 'number');
        if (src.keys) checkChars(scope, src.keys, allowed);
        if (src.focus) checkChars(scope, src.focus, allowed);
        break;
      case 'common': need('top', 'number'); need('count', 'number'); break;
      case 'corpus':
        need('name', 'string'); need('count', 'number');
        if (T && src.name && T[src.name] == null) err(scope, `unknown corpus "${src.name}"`);
        break;
      case 'weak': need('count', 'number'); if (src.keys) checkChars(scope, src.keys, allowed); break;
      case 'numbers': need('count', 'number'); if (!['digits', 'mixed', 'dates'].includes(src.style)) err(scope, 'numbers.style must be digits|mixed|dates'); break;
      case 'mix': need('parts'); (src.parts || []).forEach((p, i) => checkSource(`${scope}.parts[${i}]`, p, allowed)); break;
      default: err(scope, `unknown source kind "${src.kind}"`);
    }
  }

  C.chapters.forEach((ch, ci) => {
    const cs = `${S}.ch${ch && ch.id}`;
    if (ch.id !== ci + 1) err(cs, `chapter id should be ${ci + 1}`);
    ['title', 'goal', 'summary'].forEach((f) => { if (!ch[f]) err(cs, `missing ${f}`); });
    if (!LEVELS.has(ch.level)) err(cs, `bad level "${ch.level}"`);
    if (!Array.isArray(ch.episodes) || !ch.episodes.length) return err(cs, 'episodes missing');
    ch.episodes.forEach((ep) => {
      const es = `${S}.ep${ep && ep.id}`;
      ids.push(ep.id);
      ['title', 'summary', 'intro', 'tip'].forEach((f) => { if (!ep[f] || typeof ep[f] !== 'string') err(es, `missing ${f}`); });
      if (typeof ep.minutes !== 'number') err(es, 'minutes must be a number');
      if (typeof ep.keys !== 'string' || !ep.keys) err(es, 'keys must be a non-empty string');
      if (typeof ep.newKeys !== 'string') err(es, 'newKeys must be a string');
      if (!ep.goals || typeof ep.goals.wpm !== 'number' || typeof ep.goals.accuracy !== 'number') err(es, 'goals {wpm, accuracy} required');
      if (ep.errorMode && !MODES.has(ep.errorMode)) err(es, `bad errorMode ${ep.errorMode}`);
      // Characters are case-sensitive: capitals are only allowed when listed (or keys is '*').
      const allowedSet = ep.keys && ep.keys !== '*' ? new Set([...ep.keys]) : null;
      if (allowedSet && ep.newKeys) checkChars(`${es}.newKeys`, ep.newKeys, allowedSet);
      if (!Array.isArray(ep.steps) || !ep.steps.length) return err(es, 'steps missing');
      ep.steps.forEach((st, si) => {
        const ss = `${es}.step${si + 1}`;
        if (!st.title) err(ss, 'missing title');
        if (st.options) {
          Object.keys(st.options).forEach((k) => { if (!OPTS.has(k)) err(ss, `unknown option "${k}"`); });
          if (st.options.errorMode && !MODES.has(st.options.errorMode)) err(ss, 'bad errorMode');
          if (st.options.record && !RECORDS.has(st.options.record)) err(ss, `bad record "${st.options.record}"`);
          if (st.options.ghost && st.options.ghost !== 'pb' && !RECORDS.has(st.options.ghost)) err(ss, `bad ghost "${st.options.ghost}"`);
        }
        switch (st.type) {
          case 'learn': if (!st.text) err(ss, 'learn step needs text'); if (st.keys && !ASCII_RE.test(st.keys)) err(ss, 'keys must be ASCII'); break;
          case 'keys':
            if (typeof st.keys !== 'string' || !st.keys) err(ss, 'keys step needs keys');
            if (typeof st.count !== 'number') err(ss, 'keys step needs count');
            if (st.keys && /\s/.test(st.keys)) err(ss, 'keys step keys must not contain whitespace');
            break;
          case 'type': checkSource(`${ss}.source`, st.source, allowedSet); break;
          case 'timed':
            if (typeof st.seconds !== 'number') err(ss, 'timed step needs seconds');
            checkSource(`${ss}.source`, st.source, allowedSet);
            break;
          default: err(ss, `unknown step type "${st.type}"`);
        }
      });
      if (!ep.steps.some((s) => s.type === 'type' || s.type === 'timed' || s.type === 'keys')) err(es, 'episode has nothing to type');
    });
  });
  const missing = OFFICIAL_IDS.filter((id) => !ids.includes(id));
  const extra = ids.filter((id) => !OFFICIAL_IDS.includes(id));
  if (missing.length) err(S, `missing episodes: ${missing.join(', ')}`);
  if (extra.length) err(S, `unexpected episodes: ${extra.join(', ')}`);
  if (JSON.stringify(ids.filter((id) => OFFICIAL_IDS.includes(id))) !== JSON.stringify(OFFICIAL_IDS.filter((id) => ids.includes(id)))) err(S, 'episodes are out of order');
  return { episodes: ids.length };
}

// ---------------------------------------------------------------- run
const summary = [];
if (want('words') && loaded.words) { const r = validateWords(DATA.words); if (r) summary.push(`words: ${r.total} unique words in common+extra`); }
if (want('texts') && loaded.texts) { validateTexts(DATA.texts); summary.push(`texts: ${Object.keys(DATA.texts || {}).length} corpora`); }
if (want('guides') && loaded.guides) { validateGuides(DATA.guides, DATA.tips); summary.push(`guides: ${(DATA.guides || []).length} guides, ${(DATA.tips || []).length} tips`); }
if (want('curriculum') && loaded.curriculum) {
  const r = validateCurriculum(DATA.curriculum, loaded.words ? DATA.words : null, loaded.texts ? DATA.texts : null);
  if (r) summary.push(`curriculum: ${r.episodes} episodes`);
}

warnings.forEach((w) => console.log(w));
errors.slice(0, 200).forEach((e) => console.log(e));
if (errors.length > 200) console.log(`... and ${errors.length - 200} more errors`);
console.log('\n' + summary.join('\n'));
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
