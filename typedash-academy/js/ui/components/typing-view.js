/* TypeDash Academy — renders a typing session: characters, caret, line scrolling, ghost caret. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  /**
   * TypingView(session, { caret, smooth, blind, ghost, lines })
   * → { el, update(evt), moveCaret(), setGhost(pos|null), reveal(), shake(), destroy() }
   */
  function TypingView(session, opts) {
    opts = opts || {};
    const ST = TD.engine.ST;
    const lines = opts.lines || 3;
    const el = h('div.tv' + (opts.blind ? '.blind' : '') + (opts.smooth === false ? '.no-smooth' : ''), { style: { '--lines': lines }, role: 'document', 'aria-label': 'Text to type' });
    const inner = h('div.tv-inner');
    const caret = h('div.tv-caret.caret-' + (opts.caret || 'line'));
    const ghost = h('div.tv-ghost', { hidden: true });
    inner.append(caret, ghost);
    el.appendChild(inner);
    const spans = [];
    let openWord = null;
    let scrollLine = 0;

    function render(from) {
      const text = session.text;
      const frag = document.createDocumentFragment();
      let word = openWord;
      const close = () => { if (word && word !== openWord) frag.appendChild(word); word = null; };
      for (let i = from; i < text.length; i++) {
        const c = text[i];
        if (!word) word = h('span.w');
        const s = document.createElement('span');
        if (c === '\n') {
          s._b = 'c nl';
          s.textContent = '↵';
          word.appendChild(s);
          spans[i] = s;
          close();
          openWord = null;
          frag.appendChild(document.createElement('br'));
          continue;
        }
        s._b = c === ' ' ? 'c sp' : 'c';
        s.textContent = c;
        word.appendChild(s);
        spans[i] = s;
        if (c === ' ') { close(); openWord = null; }
      }
      if (word && word !== openWord) { frag.appendChild(word); openWord = word; }
      inner.appendChild(frag);
      for (let i = from; i < text.length; i++) paint(i);
    }

    function paint(i) {
      const s = spans[i];
      if (!s) return;
      const st = session.state[i];
      let cls = s._b;
      if (i < session.pos) {
        if (st === ST.OK) cls += ' ok';
        else if (st === ST.FIXED) cls += ' ok fix';
        else if (st === ST.WRONG) cls += ' bad';
        else if (st === ST.AUTO) cls += ' auto';
      } else if (i === session.pos) {
        cls += ' cur';
        if (session.erred[i]) cls += ' miss';
      }
      if (s.className !== cls) s.className = cls;
    }
    function paintRange(a, b) {
      for (let i = Math.max(0, a); i <= Math.min(session.text.length - 1, b); i++) paint(i);
    }

    function posOf(p) {
      const s = spans[p];
      if (s) return { x: s.offsetLeft, y: s.offsetTop, w: s.offsetWidth, h: s.offsetHeight };
      const last = spans[p - 1];
      if (!last) return { x: 0, y: 0, w: 0, h: 0 };
      if (session.text[p - 1] === '\n') return { x: 0, y: last.offsetTop + lineHeight(), w: 0, h: last.offsetHeight };
      return { x: last.offsetLeft + last.offsetWidth, y: last.offsetTop, w: 0, h: last.offsetHeight };
    }
    function lineHeight() {
      const lh = parseFloat(getComputedStyle(inner).lineHeight);
      return lh || 40;
    }

    function moveCaret() {
      const p = posOf(session.pos);
      const lh = lineHeight();
      const lineIdx = Math.round(p.y / lh);
      const target = Math.max(0, lineIdx - 1);
      if (target !== scrollLine) {
        scrollLine = target;
        inner.style.transform = 'translateY(' + (-scrollLine * lh) + 'px)';
      }
      caret.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      if (p.h) caret.style.height = p.h + 'px';
      if (opts.caret === 'block' || opts.caret === 'underline') caret.style.width = Math.max(p.w, 10) + 'px';
      caret.classList.toggle('idle', !session.started || session.finished);
    }
    function setGhost(pos) {
      if (pos == null) { ghost.hidden = true; return; }
      ghost.hidden = false;
      const p = posOf(Math.min(pos, session.text.length));
      ghost.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
    }

    function shake() {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    }

    function update(evt) {
      switch (evt.type) {
        case 'ok':
        case 'wrong':
          paintRange(evt.pos - 1, session.pos + 1);
          break;
        case 'miss': {
          paint(evt.pos);
          const s = spans[evt.pos];
          if (s) { s.classList.remove('flash'); void s.offsetWidth; s.classList.add('flash'); }
          break;
        }
        case 'back':
          paintRange(evt.to - 1, evt.from + 1);
          break;
        case 'append':
          render(evt.from);
          break;
        case 'blocked':
        case 'denied':
          shake();
          break;
        default:
          break;
      }
      moveCaret();
    }

    function reveal() { el.classList.remove('blind'); }

    render(0);
    const onResize = U.debounce(() => { scrollLine = -1; moveCaret(); }, 80);
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { scrollLine = -1; moveCaret(); });
    requestAnimationFrame(moveCaret);

    return {
      el,
      update,
      moveCaret,
      setGhost,
      reveal,
      shake,
      destroy() { window.removeEventListener('resize', onResize); },
    };
  }

  TD.ui = TD.ui || {};
  TD.ui.TypingView = TypingView;
})(window.TD = window.TD || {});
