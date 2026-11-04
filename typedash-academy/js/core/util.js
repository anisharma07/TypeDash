/* TypeDash Academy — core utilities (DOM helpers, events, random, formatting). */
(function (TD) {
  'use strict';
  const U = {};

  // ------------------------------------------------------------------ DOM
  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /**
   * Hyperscript helper: h('div.card.wide', { on: { click }, dataset, style, attrs }, ...children)
   * Props: class, text, html, style (string|object), dataset, attrs, on, any DOM property.
   */
  U.h = function h(tag, props, ...children) {
    const m = String(tag).match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, v) => {
      if (t === '.') el.classList.add(v); else el.id = v;
    });
    // A non-object second argument (including 0 or '') is a child, not props.
    if (props != null && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
      children.unshift(props);
      props = null;
    }
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') String(v).split(/\s+/).filter(Boolean).forEach((c) => el.classList.add(c));
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style') {
          if (typeof v === 'string') el.style.cssText += v;
          else Object.entries(v).forEach(([sk, sv]) => (sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv)));
        } else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k === 'attrs') Object.entries(v).forEach(([ak, av]) => av != null && av !== false && el.setAttribute(ak, av === true ? '' : av));
        else if (k === 'on') Object.entries(v).forEach(([ev, fn]) => el.addEventListener(ev, fn));
        else if (k.startsWith('aria-') || k === 'role' || k === 'for' || k === 'tabindex') el.setAttribute(k, v);
        else el[k] = v;
      }
    }
    U.append(el, children);
    return el;
  };

  U.append = function append(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false || c === true) continue;
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  };

  U.clear = (el) => { while (el && el.firstChild) el.removeChild(el.firstChild); return el; };

  /** Parse an HTML string (trusted, internal) into a single element. */
  U.frag = function frag(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  // ------------------------------------------------------------------ events
  const listeners = {};
  U.bus = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return () => U.bus.off(evt, fn); },
    off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn); },
    emit(evt, data) { (listeners[evt] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); },
  };

  // ------------------------------------------------------------------ random
  U.rand = (n) => Math.floor(Math.random() * n);
  U.pick = (arr) => arr[U.rand(arr.length)];
  U.shuffle = function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = U.rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.weightedPick = function weightedPick(items, weights) {
    let total = 0;
    for (const w of weights) total += w;
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ------------------------------------------------------------------ math & format
  U.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  U.round = (v, d = 0) => { const p = Math.pow(10, d); return Math.round(v * p) / p; };
  U.avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  U.median = function median(arr) {
    if (!arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  U.pad2 = (n) => String(n).padStart(2, '0');
  /** 65000 -> "1:05" */
  U.fmtClock = function fmtClock(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + U.pad2(s % 60);
  };
  /** 3725000 -> "1h 2m", 125000 -> "2m 5s", 9000 -> "9s" */
  U.fmtDuration = function fmtDuration(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm' + (s % 60 && m < 10 ? ' ' + (s % 60) + 's' : '');
    const h = Math.floor(m / 60);
    return h + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '');
  };
  U.fmtNum = (n) => Number(n || 0).toLocaleString('en-US');
  U.plural = (n, word, many) => n + ' ' + (n === 1 ? word : many || word + 's');

  /** Local calendar day key, e.g. "2026-11-04". */
  U.dayKey = function dayKey(d) {
    d = d ? new Date(d) : new Date();
    return d.getFullYear() + '-' + U.pad2(d.getMonth() + 1) + '-' + U.pad2(d.getDate());
  };
  U.dayFromKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
  U.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  U.fmtDate = function fmtDate(ts, withYear) {
    const d = new Date(ts);
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + (withYear ? ', ' + d.getFullYear() : '');
  };
  U.fmtLongDate = (ts) => { const d = new Date(ts); return d.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getFullYear(); };
  U.timeAgo = function timeAgo(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago';
    return U.fmtDate(ts);
  };

  // ------------------------------------------------------------------ text
  U.escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /** Tiny inline markdown: **bold**, *em*, `code`, [[Key]] keycaps. Input is escaped first. */
  U.md = function md(s) {
    return U.escape(s || '')
      .replace(/\[\[(.+?)\]\]/g, '<kbd>$1</kbd>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  };
  /** Visible label for a character on screen. */
  U.charLabel = (c) => (c === ' ' ? 'Space' : c === '\n' ? 'Enter' : c);

  // ------------------------------------------------------------------ misc
  U.debounce = function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  };
  U.download = function download(filename, text, type) {
    const blob = new Blob([text], { type: type || 'application/json' });
    const a = U.h('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  U.readFile = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
  U.prefersReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  U.isTouchOnly = () => window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  TD.util = U;
})(window.TD = window.TD || {});
