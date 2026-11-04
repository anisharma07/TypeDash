/* TypeDash Academy — on-screen keyboard and hands diagram. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  /**
   * Keyboard({ colors, compact, heat })
   * → { el, highlight(ch), clear(), flash(ch, ok), setDim(keys), mark(keys, cls), setHeat(map|null, metric), setColors(on) }
   */
  function Keyboard(opts) {
    opts = opts || {};
    const el = h('div.kb' + (opts.compact ? '.kb-compact' : ''), { 'aria-hidden': 'true' });
    const keyEls = {};
    TD.kb.ROWS.forEach((row) => {
      const r = h('div.kb-row');
      row.forEach((k) => {
        const isLetter = k.base && /[a-z]/.test(k.base);
        const label = k.flags.label != null ? k.flags.label : isLetter ? k.base.toUpperCase() : k.base;
        const ke = h('div.kb-key' + (k.flags.mod ? '.mod' : '') + (k.flags.blank ? '.blank' : '') + (k.id === 'Space' ? '.space' : ''), {
          dataset: { key: k.id, f: k.finger || 'none' },
          style: { flex: k.w + ' 1 0' },
        },
        k.shift && !isLetter ? h('span.kb-shift', k.shift) : null,
        h('span.kb-label' + (label && label.length > 1 ? '.word' : ''), label),
        k.flags.bump ? h('span.kb-bump') : null);
        keyEls[k.id] = ke;
        r.appendChild(ke);
      });
      el.appendChild(r);
    });

    let lit = [];
    const clear = () => { lit.forEach((e) => e.classList.remove('next', 'next-shift')); lit = []; };
    function highlight(ch) {
      clear();
      const info = ch != null ? TD.kb.info(ch) : null;
      if (!info) return null;
      const k = keyEls[info.id];
      if (k) { k.classList.add('next'); lit.push(k); }
      if (info.shiftKey && keyEls[info.shiftKey]) { keyEls[info.shiftKey].classList.add('next-shift'); lit.push(keyEls[info.shiftKey]); }
      return info;
    }
    function flash(ch, ok) {
      const info = TD.kb.info(ch);
      const k = info && keyEls[info.id];
      if (!k) return;
      k.classList.remove('hit', 'miss');
      void k.offsetWidth; // restart animation
      k.classList.add(ok ? 'hit' : 'miss');
      clearTimeout(k._t);
      k._t = setTimeout(() => k.classList.remove('hit', 'miss'), 220);
    }
    function setDim(keys) {
      const allowed = keys && keys !== '*' ? new Set([...keys].map((c) => { const i = TD.kb.info(c); return i && i.id; }).filter(Boolean)) : null;
      Object.entries(keyEls).forEach(([id, e]) => {
        const k = TD.kb.KEYS[id];
        e.classList.toggle('dim', !!allowed && !allowed.has(id) && !k.flags.mod && id !== 'Space');
      });
    }
    function mark(keys, cls) {
      Object.values(keyEls).forEach((e) => e.classList.remove(cls));
      [...(keys || '')].forEach((c) => { const i = TD.kb.info(c); if (i && keyEls[i.id]) keyEls[i.id].classList.add(cls); });
    }
    /** map: keyId -> { n, err, lat }; metric 'err' | 'lat'. Binned single-hue ramp (CSS classes heat-0..4). */
    function setHeat(map, metric) {
      el.classList.toggle('kb-heat', !!map);
      el.classList.toggle('kb-heat-lat', !!map && metric === 'lat');
      const lats = map ? Object.values(map).filter((v) => v.lat && v.n >= 5).map((v) => v.lat) : [];
      const med = U.median(lats) || 300;
      Object.entries(keyEls).forEach(([id, e]) => {
        e.classList.remove('heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-na');
        e.removeAttribute('title');
        if (!map) return;
        const k = TD.kb.KEYS[id];
        if (k.flags.mod && id !== 'Enter' && id !== 'Backspace') return;
        const v = map[id];
        if (!v || v.n < 5) { e.classList.add('heat-na'); e.title = TD.kb.label(k.base || '') + ': not enough data yet'; return; }
        let lvl;
        if (metric === 'lat') {
          const r = v.lat ? v.lat / med : 1;
          lvl = r < 0.9 ? 0 : r < 1.05 ? 1 : r < 1.25 ? 2 : r < 1.5 ? 3 : 4;
        } else {
          const er = v.err;
          lvl = er < 0.02 ? 0 : er < 0.04 ? 1 : er < 0.07 ? 2 : er < 0.12 ? 3 : 4;
        }
        e.classList.add('heat-' + lvl);
        e.title = (id === 'Space' ? 'Space' : TD.kb.label(k.base)) + ': ' + Math.round((1 - v.err) * 1000) / 10 + '% accuracy' + (v.lat ? ', ' + Math.round(v.lat) + ' ms average' : '') + ' (' + v.n + ' presses)';
      });
    }
    const setColors = (on) => el.classList.toggle('kb-colors', !!on);
    setColors(opts.colors !== false);
    return { el, highlight, clear, flash, setDim, mark, setHeat, setColors, keyEls };
  }

  // ------------------------------------------------------------------ hands
  const FINGER_SHAPES = [
    // [finger (left-hand id), x, y, w, h] in the left-hand coordinate space; right hand is mirrored.
    ['p', 52, 74, 32, 74],
    ['r', 90, 44, 34, 104],
    ['m', 130, 30, 34, 116],
    ['i', 170, 46, 34, 100],
  ];
  function handSVG(side) {
    const ids = side === 'L' ? { p: 'lp', r: 'lr', m: 'lm', i: 'li' } : { p: 'rp', r: 'rr', m: 'rm', i: 'ri' };
    let s = '<g class="hand hand-' + side + '"' + (side === 'R' ? ' transform="translate(560 0) scale(-1 1)"' : '') + '>';
    s += '<rect class="palm" x="48" y="120" width="164" height="78" rx="34"/>';
    FINGER_SHAPES.forEach(([f, x, y, w, hh]) => {
      s += '<rect class="hf" data-f="' + ids[f] + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="' + w / 2 + '"/>';
      s += '<circle class="nail" data-f="' + ids[f] + '" cx="' + (x + w / 2) + '" cy="' + (y + 15) + '" r="6"/>';
    });
    s += '<rect class="hf thumb" data-f="th" x="206" y="112" width="32" height="74" rx="16" transform="rotate(42 222 149)"/>';
    s += '</g>';
    return s;
  }

  /** Hands() → { el, highlight(finger, shiftFinger) } */
  function Hands(opts) {
    opts = opts || {};
    const el = U.frag('<div class="hands' + (opts.colors !== false ? ' hands-colors' : '') + '" aria-hidden="true"><svg viewBox="0 0 560 210" width="100%" height="100%">' +
      handSVG('L') + handSVG('R') + '</svg></div>');
    const parts = U.$$('[data-f]', el);
    function highlight(finger, shiftFinger) {
      parts.forEach((p) => {
        const f = p.getAttribute('data-f');
        p.classList.toggle('on', !!finger && f === finger);
        p.classList.toggle('shift', !!shiftFinger && f === shiftFinger);
      });
    }
    /** Finger heatmap: levels = { lp: 0..4, ... } (null = no data). */
    function setHeat(levels, titles) {
      el.classList.toggle('hands-heat', !!levels);
      U.$$('.hf', el).forEach((p) => {
        const f = p.getAttribute('data-f');
        [0, 1, 2, 3, 4].forEach((i) => p.classList.remove('heat-' + i));
        if (levels && levels[f] != null) p.classList.add('heat-' + levels[f]);
        const t = p.querySelector('title') || p.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'title'));
        t.textContent = (titles && titles[f]) || '';
      });
    }
    return { el, highlight, setHeat };
  }

  /** Finger legend chips (used in guides / intro). */
  function fingerLegend() {
    return h('div.finger-legend', TD.kb.FINGER_ORDER.concat(['th']).map((f) => h('span.fl-item', { dataset: { f } }, h('span.fl-dot'), TD.kb.FINGERS[f].short)));
  }

  TD.ui = TD.ui || {};
  TD.ui.Keyboard = Keyboard;
  TD.ui.Hands = Hands;
  TD.ui.fingerLegend = fingerLegend;
})(window.TD = window.TD || {});
