/* TypeDash Academy — US QWERTY keyboard model: rows, fingers, character → key mapping. */
(function (TD) {
  'use strict';

  const FINGERS = {
    lp: { name: 'Left pinky', short: 'L pinky', hand: 'L', home: 'a' },
    lr: { name: 'Left ring', short: 'L ring', hand: 'L', home: 's' },
    lm: { name: 'Left middle', short: 'L middle', hand: 'L', home: 'd' },
    li: { name: 'Left index', short: 'L index', hand: 'L', home: 'f' },
    th: { name: 'Thumb', short: 'Thumb', hand: 'B', home: ' ' },
    ri: { name: 'Right index', short: 'R index', hand: 'R', home: 'j' },
    rm: { name: 'Right middle', short: 'R middle', hand: 'R', home: 'k' },
    rr: { name: 'Right ring', short: 'R ring', hand: 'R', home: 'l' },
    rp: { name: 'Right pinky', short: 'R pinky', hand: 'R', home: ';' },
  };
  const FINGER_ORDER = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];

  // [id, base, shifted, width(u), finger, flags]
  const K = (id, base, shift, w, f, flags) => ({ id, base, shift, w: w || 1, finger: f, flags: flags || {} });
  const ROWS = [
    [
      K('`', '`', '~', 1, 'lp'), K('1', '1', '!', 1, 'lp'), K('2', '2', '@', 1, 'lr'), K('3', '3', '#', 1, 'lm'),
      K('4', '4', '$', 1, 'li'), K('5', '5', '%', 1, 'li'), K('6', '6', '^', 1, 'ri'), K('7', '7', '&', 1, 'ri'),
      K('8', '8', '*', 1, 'rm'), K('9', '9', '(', 1, 'rr'), K('0', '0', ')', 1, 'rp'), K('-', '-', '_', 1, 'rp'),
      K('=', '=', '+', 1, 'rp'), K('Backspace', null, null, 2, 'rp', { label: 'backspace', mod: true }),
    ],
    [
      K('Tab', null, null, 1.5, 'lp', { label: 'tab', mod: true }),
      K('q', 'q', 'Q', 1, 'lp'), K('w', 'w', 'W', 1, 'lr'), K('e', 'e', 'E', 1, 'lm'), K('r', 'r', 'R', 1, 'li'),
      K('t', 't', 'T', 1, 'li'), K('y', 'y', 'Y', 1, 'ri'), K('u', 'u', 'U', 1, 'ri'), K('i', 'i', 'I', 1, 'rm'),
      K('o', 'o', 'O', 1, 'rr'), K('p', 'p', 'P', 1, 'rp'), K('[', '[', '{', 1, 'rp'), K(']', ']', '}', 1, 'rp'),
      K('\\', '\\', '|', 1.5, 'rp'),
    ],
    [
      K('CapsLock', null, null, 1.75, 'lp', { label: 'caps', mod: true }),
      K('a', 'a', 'A', 1, 'lp'), K('s', 's', 'S', 1, 'lr'), K('d', 'd', 'D', 1, 'lm'), K('f', 'f', 'F', 1, 'li', { bump: true }),
      K('g', 'g', 'G', 1, 'li'), K('h', 'h', 'H', 1, 'ri'), K('j', 'j', 'J', 1, 'ri', { bump: true }), K('k', 'k', 'K', 1, 'rm'),
      K('l', 'l', 'L', 1, 'rr'), K(';', ';', ':', 1, 'rp'), K("'", "'", '"', 1, 'rp'),
      K('Enter', '\n', null, 2.25, 'rp', { label: 'enter', mod: true }),
    ],
    [
      K('ShiftLeft', null, null, 2.25, 'lp', { label: 'shift', mod: true }),
      K('z', 'z', 'Z', 1, 'lp'), K('x', 'x', 'X', 1, 'lr'), K('c', 'c', 'C', 1, 'lm'), K('v', 'v', 'V', 1, 'li'),
      K('b', 'b', 'B', 1, 'li'), K('n', 'n', 'N', 1, 'ri'), K('m', 'm', 'M', 1, 'ri'), K(',', ',', '<', 1, 'rm'),
      K('.', '.', '>', 1, 'rr'), K('/', '/', '?', 1, 'rp'),
      K('ShiftRight', null, null, 2.75, 'rp', { label: 'shift', mod: true }),
    ],
    [
      K('CtrlLeft', null, null, 1.25, null, { mod: true, blank: true }), K('MetaLeft', null, null, 1.25, null, { mod: true, blank: true }),
      K('AltLeft', null, null, 1.25, null, { mod: true, blank: true }),
      K('Space', ' ', null, 6.25, 'th', { label: '' }),
      K('AltRight', null, null, 1.25, null, { mod: true, blank: true }), K('MetaRight', null, null, 1.25, null, { mod: true, blank: true }),
      K('Menu', null, null, 1.25, null, { mod: true, blank: true }), K('CtrlRight', null, null, 1.25, null, { mod: true, blank: true }),
    ],
  ];
  const ROW_NAMES = ['number', 'top', 'home', 'bottom', 'space'];

  // ------------------------------------------------------------------ lookup tables
  const KEYS = {};     // id -> key (with row index and x position in key units)
  const CHARS = {};    // char -> { key, shift }
  ROWS.forEach((row, ri) => {
    let x = 0;
    row.forEach((k) => {
      k.row = ri;
      k.x = x;
      x += k.w;
      KEYS[k.id] = k;
      if (k.base != null) CHARS[k.base] = { key: k, shift: false };
      if (k.shift != null) CHARS[k.shift] = { key: k, shift: true };
    });
  });

  function info(ch) {
    if (ch == null) return null;
    const hit = CHARS[ch];
    if (!hit) return null;
    const k = hit.key;
    const hand = k.finger ? FINGERS[k.finger].hand : null;
    // Touch typists press Shift with the opposite hand's pinky.
    const shiftKey = hit.shift ? (hand === 'L' ? 'ShiftRight' : 'ShiftLeft') : null;
    return { char: ch, key: k, id: k.id, finger: k.finger, hand, row: k.row, shift: hit.shift, shiftKey };
  }

  /** Base (unshifted) character of the physical key that produces `ch` ("A" -> "a", "!" -> "1"). */
  function baseOf(ch) {
    const i = info(ch);
    return i ? (i.key.base === '\n' ? '\n' : i.key.base) : ch;
  }

  /** Human description of how to reach a key, e.g. "Left middle finger · reach up from D". */
  function describe(ch) {
    const i = info(ch);
    if (!i || !i.finger) return '';
    if (ch === ' ') return 'Thumb · space bar';
    const f = FINGERS[i.finger];
    const homeKey = CHARS[f.home].key;
    let reach;
    if (i.key === homeKey) reach = 'home key';
    else {
      const dx = (i.key.x + i.key.w / 2) - (homeKey.x + homeKey.w / 2);
      if (i.row === 2) reach = 'stretch ' + (dx > 0 ? 'right' : 'left');
      else {
        const horiz = dx > 0.7 ? ' and right' : dx < -0.7 ? ' and left' : '';
        reach = (i.row === 0 ? 'reach two rows up' : i.row === 1 ? 'reach up' : 'reach down') + horiz;
      }
      reach += ' from ' + label(f.home);
    }
    let s = f.name + ' finger · ' + reach;
    if (i.shift) s += ' · hold ' + (i.shiftKey === 'ShiftLeft' ? 'left' : 'right') + ' Shift';
    return s;
  }

  function label(ch) {
    if (ch === ' ') return 'Space';
    if (ch === '\n') return 'Enter';
    return /[a-z]/.test(ch) ? ch.toUpperCase() : ch;
  }

  TD.kb = {
    FINGERS,
    FINGER_ORDER,
    ROWS,
    ROW_NAMES,
    KEYS,
    info,
    baseOf,
    describe,
    label,
    fingerOf: (ch) => { const i = info(ch); return i ? i.finger : null; },
    handOf: (ch) => { const i = info(ch); return i ? i.hand : null; },
    rowOf: (ch) => { const i = info(ch); return i ? i.row : null; },
    isTypable: (ch) => ch === '\n' || !!CHARS[ch],
    LETTERS: 'abcdefghijklmnopqrstuvwxyz',
    HOME_ROW: 'asdfghjkl;',
    TOP_ROW: 'qwertyuiop',
    BOTTOM_ROW: 'zxcvbnm',
    NUMBER_ROW: '1234567890',
  };
})(window.TD = window.TD || {});
