/* TypeDash Academy — practice text generator (resolves curriculum "source" objects into text). */
(function (TD) {
  'use strict';
  const U = TD.util;

  const BLOCK_WORDS = new Set(('ass asses arse bitch bastard crap damn dick dildo fag fuck nazi nigger nigga penis piss porn ' +
    'rape sex sexy shit slut tits twat whore wank cock cunt pussy boob boobs retard hell kkk').split(' '));
  // Substrings never allowed inside random pseudo-words.
  const BLOCK_PARTS = ['ass', 'fag', 'fuk', 'fuc', 'fck', 'sex', 'dik', 'dic', 'cum', 'tit', 'sht', 'shit', 'jiz', 'kkk',
    'nazi', 'fap', 'wtf', 'hoe', 'slut', 'cok', 'kok', 'cock', 'pus', 'porn', 'nig', 'gay', 'jap', 'spic', 'kike', 'twat',
    'wank', 'piss', 'poo', 'pee', 'butt', 'damn', 'hell', 'crap', 'rape', 'anal', 'anus', 'homo', 'lez', 'suk', 'xxx',
    'vag', 'boob', 'nud', 'fart', 'die', 'kil', 'gun'];
  const blockedPseudo = (s) => BLOCK_PARTS.some((b) => s.includes(b));

  const FALLBACK_COMMON = 'the of and to a in is you that it he was for on are as with his they i at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part'.split(' ');

  // ------------------------------------------------------------------ word bank
  let bank = null;
  const split = (v) => (Array.isArray(v) ? v.slice() : String(v || '').split(/\s+/).filter(Boolean));

  function getBank() {
    if (bank) return bank;
    const W = (TD.data && TD.data.words) || {};
    const common = split(W.common).filter((w) => !BLOCK_WORDS.has(w));
    if (!common.length) common.push(...FALLBACK_COMMON);
    const seen = new Set(common);
    const extra = split(W.extra).filter((w) => !BLOCK_WORDS.has(w) && !seen.has(w) && seen.add(w));
    const all = common.concat(extra);
    const rank = new Map(all.map((w, i) => [w, i]));
    const lists = {};
    Object.keys(W).forEach((k) => { if (k !== 'seq') lists[k] = split(W[k]).filter((w) => !BLOCK_WORDS.has(w)); });
    Object.keys(W.seq || {}).forEach((k) => { lists['seq.' + k] = split(W.seq[k]).filter((w) => !BLOCK_WORDS.has(w)); });
    lists.common = common;
    bank = { common, all, rank, lists, fit: new Map() };
    return bank;
  }

  /** All bank words whose letters are a subset of `letters` (cached). */
  function wordsFitting(letters) {
    const b = getBank();
    const key = [...new Set(letters)].sort().join('');
    if (b.fit.has(key)) return b.fit.get(key);
    const set = new Set(key);
    const res = b.all.filter((w) => { for (const c of w) if (!set.has(c)) return false; return true; });
    b.fit.set(key, res);
    return res;
  }

  const lettersOf = (keys) => [...new Set(String(keys || '').toLowerCase())].filter((c) => /[a-z]/.test(c)).join('');
  const fitsAllowed = (w, allowed) => { if (!allowed) return true; for (const c of w) if (!allowed.has(c)) return false; return true; };

  // ------------------------------------------------------------------ sampling
  /** Weighted sampling with replacement, avoiding immediate repeats. */
  function sample(cands, count, weightFn) {
    if (!cands.length || count <= 0) return [];
    const cum = [];
    let total = 0;
    cands.forEach((w, i) => { total += Math.max(0.0001, weightFn ? weightFn(w, i) : 1); cum.push(total); });
    const out = [];
    const recent = [];
    for (let n = 0; n < count; n++) {
      let w;
      for (let tries = 0; tries < 8; tries++) {
        const r = Math.random() * total;
        let lo = 0;
        let hi = cum.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; }
        w = cands[lo];
        if (cands.length < 4 || !recent.includes(w)) break;
      }
      out.push(w);
      recent.push(w);
      if (recent.length > Math.min(4, cands.length - 1)) recent.shift();
    }
    return out;
  }

  /** Weight favouring common words and words that contain the learner's weak keys. */
  function wordWeight(ctx, base) {
    const b = getBank();
    const weak = (ctx && ctx.weakKeys) || [];
    return (w, i) => {
      const r = b.rank.has(w) ? b.rank.get(w) : 2000 + (i || 0);
      let wt = base === 'order' ? 1 / (1 + (i || 0) / 60) : 1 / (1 + r / 400);
      if (weak.length) {
        let hits = 0;
        for (const c of w) if (weak.includes(c)) hits++;
        if (hits) wt *= 1 + Math.min(3, hits) * 0.8;
      }
      return wt;
    };
  }

  // ------------------------------------------------------------------ pseudo-words
  function combo(letters, min, max, focus) {
    const pool = [...letters];
    const hasLetters = pool.some((c) => /[a-z]/.test(c));
    for (let attempt = 0; attempt < 25; attempt++) {
      const len = min + U.rand(Math.max(1, max - min + 1));
      let s = '';
      while (s.length < len) {
        const c = U.pick(pool);
        if (pool.length > 1 && s.length >= 2 && c === s[s.length - 1] && c === s[s.length - 2]) continue;
        if (hasLetters && !/[a-z]/.test(c) && (s.length === 0 || /[^a-z]/.test(s[s.length - 1]))) continue;
        s += c;
      }
      if (focus && focus.length && ![...s].some((c) => focus.includes(c))) {
        const i = U.rand(s.length);
        s = s.slice(0, i) + U.pick([...focus]) + s.slice(i + 1);
      }
      if (!blockedPseudo(s) || attempt === 24) return s;
    }
    return pool[0];
  }

  function combos(keys, count, min, max, focus) {
    const letters = [...new Set(String(keys || 'asdfjkl'))].filter((c) => c.trim()).join('');
    const out = [];
    for (let i = 0; i < count; i++) out.push(combo(letters, min || 2, max || 4, focus));
    return out;
  }

  // ------------------------------------------------------------------ numbers
  function numbers(style, count) {
    const d = (n) => String(U.rand(Math.pow(10, n))).padStart(n, '0');
    const out = [];
    for (let i = 0; i < count; i++) {
      if (style === 'digits') {
        const len = 2 + U.rand(3);
        let s = '';
        while (s.length < len) s += String(U.rand(10));
        out.push(s);
      } else if (style === 'dates') {
        const m = 1 + U.rand(12);
        const day = 1 + U.rand(28);
        const year = 2020 + U.rand(10);
        const forms = [
          () => U.pad2(m) + '/' + U.pad2(day) + '/' + year,
          () => year + '-' + U.pad2(m) + '-' + U.pad2(day),
          () => (1 + U.rand(12)) + ':' + U.pad2(U.rand(60)),
          () => '$' + (1 + U.rand(499)) + '.' + d(2),
          () => (1 + U.rand(99)) + '%',
          () => (1 + U.rand(90)) + '.' + U.rand(10) + ' km',
          () => d(3) + '-' + d(4),
          () => 'v' + (1 + U.rand(9)) + '.' + U.rand(20) + '.' + U.rand(10),
        ];
        out.push(U.pick(forms)());
      } else {
        out.push(U.pick(getBank().common.slice(0, 200)));
        out.push(String(U.rand(2) ? U.rand(100) : U.rand(10000)));
        i++;
      }
    }
    return out.slice(0, Math.max(count, 1)).join(' ');
  }

  // ------------------------------------------------------------------ adaptive weak-key drill
  function weakDrill(src, ctx) {
    const count = src.count || 30;
    const allowed = ctx.allowed;
    const keyPool = lettersOf(src.keys || (allowed ? [...allowed].join('') : TD.kb.LETTERS));
    const weak = (ctx.weakKeys || []).filter((k) => /[a-z]/.test(k) && keyPool.includes(k)).slice(0, 4);
    const bigrams = (ctx.weakBigrams || []).filter((bg) => [...bg].every((c) => keyPool.includes(c))).slice(0, 3);
    if (!weak.length && !bigrams.length) {
      return generate({ kind: 'letters', keys: keyPool, count }, ctx);
    }
    const parts = [];
    // 1. Isolate each weak key, then anchor it to home-row neighbours.
    const anchors = lettersOf('asdfjkl').split('').filter((c) => keyPool.includes(c));
    weak.forEach((k) => {
      parts.push(k + k, k + k + k);
      if (anchors.length) parts.push(k + U.pick(anchors) + k, U.pick(anchors) + k + U.pick(anchors));
    });
    // 2. Repeat weak transitions.
    bigrams.forEach((bg) => parts.push(bg, bg, bg + bg[0], bg));
    // 3. Real words that contain the weak keys / transitions (common words first).
    const focusSet = new Set([...weak, ...bigrams.join('')]);
    const cands = wordsFitting(keyPool).filter((w) => weak.some((k) => w.includes(k)) || bigrams.some((bg) => w.includes(bg)));
    const nWords = Math.max(6, count - parts.length);
    const weighting = (w) => {
      const r = getBank().rank.get(w) || 3000;
      let hits = 0;
      for (const c of w) if (focusSet.has(c)) hits++;
      bigrams.forEach((bg) => { if (w.includes(bg)) hits += 2; });
      return (1 + hits) / (1 + r / 500);
    };
    const words = cands.length >= 4 ? sample(cands, nWords, weighting) : combos(keyPool, nWords, 3, 5, weak.join(''));
    return parts.concat(words).join(' ');
  }

  // ------------------------------------------------------------------ main resolver
  function generate(src, ctx) {
    ctx = ctx || {};
    const allowed = ctx.allowed || null;
    if (!src) return '';
    // Keep generated pseudo-words inside the keys this learner/episode allows.
    if ((src.kind === 'letters' || src.kind === 'combos') && allowed && src.keys) {
      const inside = [...src.keys].filter((c) => allowed.has(c)).join('');
      if (inside && inside !== src.keys) src = Object.assign({}, src, { keys: inside, focus: src.focus ? [...src.focus].filter((c) => allowed.has(c)).join('') || undefined : undefined });
    }
    switch (src.kind) {
      case 'text':
        return src.text;
      case 'repeat':
        return Array(Math.max(1, src.times || 1)).fill(src.pattern).join(' ');
      case 'drill':
        return (src.items || []).map((it) => Array(Math.max(1, src.each || 1)).fill(it).join(' ')).join(' ');
      case 'shuffle':
        return sample(src.items || [], src.count || 10).join(' ');
      case 'words': {
        let list = Array.isArray(src.list) ? src.list : getBank().lists[src.list] || [];
        list = list.filter((w) => fitsAllowed(w, allowed));
        if (!list.length) return generate({ kind: 'letters', keys: allowed ? [...allowed].join('') : TD.kb.LETTERS, count: src.count }, ctx);
        return sample(list, src.count || 20, wordWeight(ctx, 'order')).join(' ');
      }
      case 'letters': {
        const letters = lettersOf(src.keys);
        const min = src.min || 1;
        const max = src.max || 12;
        let cands = wordsFitting(letters).filter((w) => w.length >= min && w.length <= max && fitsAllowed(w, allowed));
        if (src.focus) cands = cands.filter((w) => [...src.focus].some((c) => w.includes(c)));
        const count = src.count || 20;
        if (cands.length >= 8) return sample(cands, count, wordWeight(ctx)).join(' ');
        // Too few real words for this key set: mix what exists with pseudo-words.
        const real = cands.length ? sample(cands, Math.ceil(count / 2), wordWeight(ctx)) : [];
        const fake = combos(src.keys, count - real.length, Math.max(2, min), Math.min(Math.max(3, max), 5), src.focus);
        return U.shuffle(real.concat(fake)).join(' ');
      }
      case 'combos':
        return combos(src.keys, src.count || 20, src.min || 2, src.max || 4, src.focus).join(' ');
      case 'common': {
        const top = getBank().common.slice(0, src.top || 200).filter((w) => fitsAllowed(w, allowed));
        return sample(top, src.count || 40, wordWeight(ctx)).join(' ');
      }
      case 'corpus': {
        const T = (TD.data && TD.data.texts) || {};
        let items = T[src.name] || [];
        if (src.name === 'code') items = items.filter((c) => !src.lang || c.lang === src.lang).map((c) => c.text);
        if (!items.length) return generate({ kind: 'common', top: 200, count: 30 }, ctx);
        const picked = U.shuffle(items).slice(0, Math.max(1, src.count || 1));
        return picked.join(src.join != null ? src.join : ' ');
      }
      case 'weak':
        return weakDrill(src, ctx);
      case 'numbers':
        return numbers(src.style || 'digits', src.count || 20);
      case 'mix': {
        const parts = (src.parts || []).map((p) => generate(p, ctx)).filter(Boolean);
        if (src.shuffle) return U.shuffle(parts.join(' ').split(' ')).join(' ');
        return parts.join(' ');
      }
      default:
        console.warn('Unknown source kind', src.kind);
        return generate({ kind: 'common', top: 100, count: 20 }, ctx);
    }
  }

  /** Separator to use when a timed step needs more of the same source. */
  function streamSeparator(src) {
    if (src && src.kind === 'corpus' && src.join && src.join.includes('\n')) return src.join;
    if (src && src.kind === 'corpus' && ['chat', 'emails', 'code', 'longform'].includes(src.name)) return '\n';
    return ' ';
  }

  TD.gen = {
    generate,
    streamSeparator,
    wordsFitting,
    combos,
    sample,
    bank: getBank,
    lettersOf,
    /** Reset the cached bank (used after data hot-reload in tests). */
    _reset() { bank = null; },
  };
})(window.TD = window.TD || {});
