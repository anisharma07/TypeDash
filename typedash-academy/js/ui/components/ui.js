/* TypeDash Academy — shared UI pieces: toasts, modals, stars, rings, avatars, stat tiles. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;
  const UI = {};

  // ------------------------------------------------------------------ toasts
  let stack = null;
  UI.toast = function toast(message, opts) {
    opts = opts || {};
    if (!stack) { stack = h('div.toast-stack', { role: 'status', 'aria-live': 'polite' }); document.body.appendChild(stack); }
    const el = h('div.toast' + (opts.tone ? '.toast-' + opts.tone : ''),
      opts.emoji ? h('span.toast-emoji', opts.emoji) : opts.icon ? TD.icon(opts.icon) : null,
      h('div.toast-body', opts.title ? h('strong', opts.title) : null, h('span', message)));
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    const close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); };
    setTimeout(close, opts.timeout || 3800);
    el.addEventListener('click', close);
    return close;
  };
  UI.achievementToast = (a) => {
    UI.toast(a.desc, { title: 'Achievement unlocked: ' + a.title, emoji: a.icon, tone: 'gold', timeout: 5200 });
    if (TD.sound) TD.sound.unlock();
  };

  // ------------------------------------------------------------------ modal
  let openModal = null;
  UI.modal = function modal(opts) {
    if (openModal) openModal.close();
    const prevFocus = document.activeElement;
    const close = (value) => {
      if (!backdrop.isConnected) return;
      backdrop.classList.remove('in');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => backdrop.remove(), 200);
      openModal = null;
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      if (opts.onClose) opts.onClose(value);
    };
    const actions = (opts.actions || []).map((a) => h('button.btn' + (a.primary ? '.btn-primary' : a.danger ? '.btn-danger' : '.btn-ghost'), {
      type: 'button',
      on: { click: () => { const r = a.onClick ? a.onClick() : a.value; if (r !== false) close(a.value != null ? a.value : r); } },
    }, a.label));
    const box = h('div.modal' + (opts.wide ? '.modal-wide' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Dialog' },
      h('div.modal-head', h('h2', opts.title || ''), h('button.btn-icon', { type: 'button', 'aria-label': 'Close', on: { click: () => close() } }, TD.icon('x'))),
      h('div.modal-body', opts.body || null),
      actions.length ? h('div.modal-actions', actions) : null);
    const backdrop = h('div.modal-backdrop', { on: { mousedown: (e) => { if (e.target === backdrop) close(); } } }, box);
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    }
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('in'));
    const focusable = box.querySelector('input, select, textarea, .btn-primary') || box.querySelector('button');
    if (focusable) setTimeout(() => focusable.focus(), 30);
    openModal = { close, el: box };
    return openModal;
  };
  UI.confirm = (title, text, opts) => new Promise((resolve) => {
    opts = opts || {};
    UI.modal({
      title,
      body: h('p.muted', text),
      actions: [
        { label: opts.cancel || 'Cancel', value: false },
        Object.assign({ label: opts.ok || 'OK', value: true }, opts.danger ? { danger: true } : { primary: true }),
      ],
      onClose: (v) => resolve(v === true),
    });
  });
  UI.isModalOpen = () => !!openModal;

  // ------------------------------------------------------------------ small widgets
  UI.stars = function stars(n, max, cls) {
    max = max || 3;
    const el = h('span.stars' + (cls ? '.' + cls : ''), { 'aria-label': n + ' of ' + max + ' stars', role: 'img' });
    for (let i = 0; i < max; i++) el.appendChild(TD.icon('star', i < n ? 'on' : 'off'));
    return el;
  };

  UI.ring = function ring(pct, opts) {
    opts = opts || {};
    const size = opts.size || 72;
    const sw = opts.stroke || 7;
    const r = (size - sw) / 2;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(1, pct || 0));
    const svg = U.frag('<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + Math.round(p * 100) + ' percent">' +
      '<circle class="ring-track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + sw + '" fill="none"/>' +
      '<circle class="ring-value" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + sw + '" fill="none" stroke-linecap="round" ' +
      'stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - p) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>');
    return h('div.ring-wrap', { style: { width: size + 'px', height: size + 'px' } }, svg, opts.label != null ? h('div.ring-label', opts.label) : null);
  };

  UI.progress = (pct, cls) => h('div.progress' + (cls ? '.' + cls : ''), { role: 'progressbar', attrs: { 'aria-valuenow': Math.round((pct || 0) * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 } },
    h('div.progress-fill', { style: { width: Math.round(Math.max(0, Math.min(1, pct || 0)) * 100) + '%' } }));

  UI.avatarSrc = (name) => 'assets/avatars/' + (name || 'avatar1') + '.png';
  UI.avatar = (name, cls) => h('img.avatar' + (cls ? '.' + cls : ''), { src: UI.avatarSrc(name), alt: '', draggable: false });
  UI.AVATARS = Array.from({ length: 15 }, (_, i) => 'avatar' + (i + 1));

  /** Stat tile: label, big value, optional unit + sub line. */
  UI.tile = (label, value, opts) => {
    opts = opts || {};
    return h('div.tile' + (opts.cls ? '.' + opts.cls : ''),
      h('div.tile-label', opts.icon ? TD.icon(opts.icon) : null, label),
      h('div.tile-value', h('span', value), opts.unit ? h('small', opts.unit) : null),
      opts.sub ? h('div.tile-sub', opts.sub) : null);
  };

  UI.kbd = (k) => h('kbd', TD.kb ? TD.kb.label(k) : k);
  UI.empty = (icon, title, text, action) => h('div.empty', TD.icon(icon), h('h3', title), text ? h('p.muted', text) : null, action || null);

  /** Segmented control. options: [{value, label}] */
  UI.segmented = (options, value, onChange, label) => {
    const wrap = h('div.segmented', { role: 'radiogroup', 'aria-label': label || '' });
    options.forEach((o) => {
      const b = h('button', {
        type: 'button', role: 'radio', 'aria-checked': String(o.value === value), class: o.value === value ? 'on' : '',
        on: { click: () => { U.$$('button', wrap).forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); }); b.classList.add('on'); b.setAttribute('aria-checked', 'true'); onChange(o.value); } },
      }, o.label);
      wrap.appendChild(b);
    });
    return wrap;
  };

  UI.toggle = (checked, onChange, label) => {
    const input = h('input', { type: 'checkbox', checked: !!checked, on: { change: () => onChange(input.checked) } });
    return h('label.switch', input, h('span.switch-track', h('span.switch-thumb')), label ? h('span.switch-label', label) : null);
  };

  TD.ui = TD.ui || {};
  TD.ui.kit = UI;
})(window.TD = window.TD || {});
