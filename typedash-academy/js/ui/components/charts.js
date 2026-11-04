/* TypeDash Academy — small SVG charts (line, columns, horizontal bars, calendar heatmap, sparkline).
 * Follows the data-viz rules: 2px lines, hairline solid grid, one y-axis, end-dot with a surface ring,
 * crosshair + tooltip (pointer and keyboard), selective labels, table-view twins.
 * Colours come from CSS tokens (--viz-*) so light/dark themes are handled in CSS. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function yTicks(min, max, count) {
    const step = niceStep((max - min) / (count || 4));
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 100) / 100);
    return out;
  }
  const fmtTick = (v) => (Math.abs(v) >= 10000 ? Math.round(v / 1000) + 'K' : U.fmtNum(Math.round(v * 10) / 10));

  /** Shared tooltip element positioned inside a chart wrapper. */
  function makeTip(wrap) {
    const tip = h('div.chart-tip', { role: 'status' });
    wrap.appendChild(tip);
    return {
      show(x, y, title, rows) {
        U.clear(tip);
        if (title) tip.appendChild(h('div.chart-tip-title', { text: title }));
        rows.forEach((r) => tip.appendChild(h('div.chart-tip-row',
          h('span.chart-tip-key' + (r.kind ? '.k-' + r.kind : ''), { style: { '--k': r.color || 'currentColor' } }),
          h('strong', { text: r.value }),
          h('span', { text: r.label }))));
        tip.classList.add('on');
        const ww = wrap.clientWidth;
        const tw = tip.offsetWidth;
        tip.style.left = Math.max(4, Math.min(ww - tw - 4, x + 14)) + 'px';
        tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + 'px';
      },
      hide() { tip.classList.remove('on'); },
    };
  }

  function observe(wrap, render) {
    let lastW = 0;
    const run = () => { const w = wrap.clientWidth; if (w && w !== lastW) { lastW = w; render(w); } };
    if (window.ResizeObserver) new ResizeObserver(U.debounce(run, 60)).observe(wrap);
    else window.addEventListener('resize', U.debounce(run, 100));
    requestAnimationFrame(run);
  }

  // ------------------------------------------------------------------ line chart
  /**
   * cfg: { series: [{ name, values, color (css var), muted?, area? }], height, xLabel(i), title(i),
   *        yMin?, yMax?, yUnit?, format(v), markers?: [{ i, n }] (error marks), endLabel?: bool, ariaLabel }
   */
  function line(cfg) {
    const H = cfg.height || 200;
    const wrap = h('div.chart', { style: { height: H + 'px' } });
    const svgHost = h('div.chart-svg');
    wrap.appendChild(svgHost);
    const tip = makeTip(wrap);
    const n = Math.max(...cfg.series.map((s) => s.values.length), 0);
    const fmt = cfg.format || ((v) => String(Math.round(v)));
    let geom = null;

    function render(W) {
      const pad = { l: 34, r: cfg.endLabel ? 46 : 14, t: 14, b: 24 };
      const pw = W - pad.l - pad.r;
      const ph = H - pad.t - pad.b;
      const all = cfg.series.flatMap((s) => s.values.filter((v) => v != null));
      let yMin = cfg.yMin != null ? cfg.yMin : 0;
      let yMax = cfg.yMax != null ? cfg.yMax : Math.max(10, ...all) * 1.1;
      if (cfg.yMin == null && all.length) yMin = Math.min(0, ...all);
      const ticks = yTicks(yMin, yMax, 4);
      yMin = ticks[0];
      yMax = ticks[ticks.length - 1];
      const X = (i) => pad.l + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
      const Y = (v) => pad.t + ph - ((v - yMin) / (yMax - yMin || 1)) * ph;
      geom = { X, Y, pad, pw, ph, W };

      let s = '<svg class="chart-plot" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" tabindex="0" role="img" aria-label="' + U.escape(cfg.ariaLabel || 'Chart') + '">';
      ticks.forEach((t) => {
        const y = Y(t).toFixed(1);
        s += '<line class="grid" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y + '" y2="' + y + '"/>';
        s += '<text class="tick" x="' + (pad.l - 8) + '" y="' + y + '" dy="0.32em" text-anchor="end">' + fmtTick(t) + '</text>';
      });
      s += '<line class="axis" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + Y(yMin) + '" y2="' + Y(yMin) + '"/>';
      // x labels: first, a few in between, last
      if (cfg.xLabel && n) {
        const count = Math.min(n, Math.max(2, Math.floor(pw / 90)));
        const idx = new Set();
        for (let k = 0; k < count; k++) idx.add(Math.round((k / Math.max(1, count - 1)) * (n - 1)));
        [...idx].forEach((i) => {
          const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
          s += '<text class="tick" x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (n === 1 ? 'middle' : anchor) + '">' + U.escape(cfg.xLabel(i)) + '</text>';
        });
      }
      cfg.series.forEach((ser, si) => {
        const pts = ser.values.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
        if (!pts.length) return;
        const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
        if (ser.area && pts.length > 1) {
          s += '<path class="area" style="fill:' + ser.color + '" d="' + d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + Y(yMin) + ' L' + pts[0][0].toFixed(1) + ' ' + Y(yMin) + ' Z"/>';
        }
        s += '<path class="line' + (ser.muted ? ' muted' : '') + '" style="stroke:' + ser.color + '" d="' + d + '"/>';
        if (si === 0) {
          const last = pts[pts.length - 1];
          s += '<circle class="dot" cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="4" style="fill:' + ser.color + '"/>';
          if (cfg.endLabel) {
            const lv = ser.values[ser.values.length - 1];
            s += '<text class="end-label" x="' + (last[0] + 9).toFixed(1) + '" y="' + last[1].toFixed(1) + '" dy="0.32em">' + U.escape(fmt(lv)) + '</text>';
          }
        }
      });
      (cfg.markers || []).forEach((m) => {
        if (!m.n) return;
        const x = X(m.i);
        const y = Y(yMin) - 7;
        const r = Math.min(4.5, 2.5 + m.n * 0.6);
        s += '<path class="err-mark" d="M' + (x - r) + ' ' + (y - r) + 'L' + (x + r) + ' ' + (y + r) + 'M' + (x + r) + ' ' + (y - r) + 'L' + (x - r) + ' ' + (y + r) + '"/>';
      });
      s += '<line class="crosshair" x1="0" x2="0" y1="' + pad.t + '" y2="' + (pad.t + ph) + '" visibility="hidden"/>';
      cfg.series.forEach((ser, si) => { s += '<circle class="hover-dot" data-s="' + si + '" r="4" style="fill:' + ser.color + '" visibility="hidden"/>'; });
      s += '</svg>';
      svgHost.innerHTML = s;
      bind(svgHost.firstElementChild);
    }

    let focusIdx = -1;
    function showAt(svg, i) {
      if (!geom || i < 0 || i >= n) return;
      focusIdx = i;
      const x = geom.X(i);
      const ch = svg.querySelector('.crosshair');
      ch.setAttribute('x1', x); ch.setAttribute('x2', x); ch.setAttribute('visibility', 'visible');
      const rows = [];
      let topY = geom.pad.t + geom.ph;
      cfg.series.forEach((ser, si) => {
        const v = ser.values[i];
        const dot = svg.querySelector('.hover-dot[data-s="' + si + '"]');
        if (v == null) { dot.setAttribute('visibility', 'hidden'); return; }
        const y = geom.Y(v);
        topY = Math.min(topY, y);
        dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('visibility', 'visible');
        rows.push({ value: fmt(v), label: ser.name, color: ser.color, kind: 'line' });
      });
      const m = (cfg.markers || []).find((mk) => mk.i === i);
      if (m && m.n) rows.push({ value: String(m.n), label: m.n === 1 ? 'error' : 'errors', color: 'var(--viz-critical)', kind: 'x' });
      if (cfg.extraRows) rows.push(...cfg.extraRows(i));
      tip.show(x, topY, cfg.title ? cfg.title(i) : null, rows);
    }
    function hide(svg) {
      focusIdx = -1;
      svg.querySelector('.crosshair').setAttribute('visibility', 'hidden');
      svg.querySelectorAll('.hover-dot').forEach((d) => d.setAttribute('visibility', 'hidden'));
      tip.hide();
    }
    function bind(svg) {
      svg.addEventListener('pointermove', (e) => {
        const r = svg.getBoundingClientRect();
        const x = e.clientX - r.left;
        const i = n <= 1 ? 0 : Math.round(((x - geom.pad.l) / geom.pw) * (n - 1));
        showAt(svg, Math.max(0, Math.min(n - 1, i)));
      });
      svg.addEventListener('pointerleave', () => hide(svg));
      svg.addEventListener('focus', () => showAt(svg, n - 1));
      svg.addEventListener('blur', () => hide(svg));
      svg.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); showAt(svg, Math.max(0, focusIdx - 1)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); showAt(svg, Math.min(n - 1, focusIdx + 1)); }
      });
    }
    observe(wrap, render);
    return wrap;
  }

  // ------------------------------------------------------------------ column chart
  /** cfg: { values, labels (short), titles (tooltip), color, height, format, ariaLabel, showEvery } */
  function columns(cfg) {
    const H = cfg.height || 160;
    const wrap = h('div.chart', { style: { height: H + 'px' } });
    const host = h('div.chart-svg');
    wrap.appendChild(host);
    const tip = makeTip(wrap);
    const n = cfg.values.length;
    const fmt = cfg.format || ((v) => String(v));
    function render(W) {
      const pad = { l: 34, r: 8, t: 12, b: 22 };
      const pw = W - pad.l - pad.r;
      const ph = H - pad.t - pad.b;
      const ticks = yTicks(0, Math.max(cfg.minMax || 1, ...cfg.values), 3);
      const yMax = ticks[ticks.length - 1];
      const slot = pw / Math.max(1, n);
      const bw = Math.max(2, Math.min(24, slot - 2));
      const Y = (v) => pad.t + ph - (v / (yMax || 1)) * ph;
      let s = '<svg class="chart-plot" width="' + W + '" height="' + H + '" role="img" aria-label="' + U.escape(cfg.ariaLabel || 'Chart') + '">';
      ticks.forEach((t) => {
        const y = Y(t).toFixed(1);
        s += '<line class="grid" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y + '" y2="' + y + '"/>';
        s += '<text class="tick" x="' + (pad.l - 8) + '" y="' + y + '" dy="0.32em" text-anchor="end">' + fmtTick(t) + '</text>';
      });
      cfg.values.forEach((v, i) => {
        const x = pad.l + slot * i + (slot - bw) / 2;
        if (v > 0) {
          const y = Y(v);
          const hgt = Math.max(1, Y(0) - y);
          const r = Math.min(4, bw / 2, hgt);
          s += '<path class="bar" style="fill:' + (cfg.color || 'var(--viz-1)') + '" d="M' + x + ' ' + (y + hgt) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (y + hgt) + 'Z"/>';
        }
        s += '<rect class="hit" data-i="' + i + '" x="' + (pad.l + slot * i) + '" y="' + pad.t + '" width="' + slot + '" height="' + ph + '" tabindex="-1"/>';
        const every = cfg.showEvery || Math.ceil(n / Math.max(1, Math.floor(pw / 46)));
        if (cfg.labels && (i % every === 0 || i === n - 1)) s += '<text class="tick" x="' + (pad.l + slot * i + slot / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + U.escape(cfg.labels[i]) + '</text>';
      });
      s += '<line class="axis" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/></svg>';
      host.innerHTML = s;
      const svg = host.firstElementChild;
      svg.querySelectorAll('.hit').forEach((r) => {
        const i = Number(r.dataset.i);
        const show = () => {
          svg.querySelectorAll('.hit.on').forEach((x) => x.classList.remove('on'));
          r.classList.add('on');
          tip.show(pad.l + slot * i + slot / 2, Y(cfg.values[i]), cfg.titles ? cfg.titles[i] : cfg.labels[i], [{ value: fmt(cfg.values[i]), label: cfg.unit || '', color: cfg.color || 'var(--viz-1)', kind: 'bar' }]);
        };
        r.addEventListener('pointerenter', show);
        r.addEventListener('pointerleave', () => { r.classList.remove('on'); tip.hide(); });
      });
    }
    observe(wrap, render);
    return wrap;
  }

  // ------------------------------------------------------------------ horizontal bars (HTML)
  /** items: [{ label, value, display, swatch, sub }], max */
  function hbars(items, opts) {
    opts = opts || {};
    const max = opts.max || Math.max(1, ...items.map((i) => i.value || 0));
    return h('div.hbars', items.map((it) => h('div.hbar', { title: it.sub || '' },
      h('span.hbar-label', it.swatch ? h('span.swatch', { style: { background: it.swatch } }) : null, it.label),
      h('span.hbar-track', h('span.hbar-fill', { style: { width: (it.value == null ? 0 : Math.max(0, Math.min(1, ((it.value - (opts.min || 0)) / (max - (opts.min || 0))))) * 100) + '%', background: opts.color || 'var(--viz-1)' } })),
      h('span.hbar-val', it.display != null ? it.display : it.value == null ? '—' : String(it.value)))));
  }

  // ------------------------------------------------------------------ calendar heatmap
  /** days: [{ key, date, ms }] (from TD.stats.calendar), goalMs */
  function calendar(days, goalMs) {
    const cell = 13;
    const gap = 3;
    const weeks = Math.ceil(days.length / 7);
    const W = 28 + weeks * (cell + gap);
    const H = 18 + 7 * (cell + gap);
    const level = (ms) => (ms <= 0 ? 0 : ms < goalMs * 0.25 ? 1 : ms < goalMs * 0.6 ? 2 : ms < goalMs ? 3 : 4);
    let s = '<svg class="cal" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Daily practice calendar">';
    ['Mon', 'Wed', 'Fri'].forEach((d, i) => { s += '<text class="tick" x="0" y="' + (18 + (i * 2 + 1) * (cell + gap) + cell - 3) + '">' + d + '</text>'; });
    let lastMonth = -1;
    days.forEach((d, idx) => {
      const w = Math.floor(idx / 7);
      const dow = idx % 7;
      const x = 28 + w * (cell + gap);
      const y = 18 + dow * (cell + gap);
      if (dow === 0 && d.date.getMonth() !== lastMonth) {
        lastMonth = d.date.getMonth();
        if (w < weeks - 1) s += '<text class="tick" x="' + x + '" y="11">' + U.fmtDate(d.date).split(' ')[0] + '</text>';
      }
      s += '<rect class="cal-cell l' + level(d.ms) + '" x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="3" data-i="' + idx + '"/>';
    });
    s += '</svg>';
    const wrap = h('div.chart.cal-wrap');
    const host = h('div.cal-scroll', { html: s });
    wrap.appendChild(host);
    const tip = makeTip(wrap);
    host.querySelectorAll('.cal-cell').forEach((r) => {
      r.addEventListener('pointerenter', () => {
        const d = days[Number(r.dataset.i)];
        const box = r.getBoundingClientRect();
        const wb = wrap.getBoundingClientRect();
        tip.show(box.left - wb.left, box.top - wb.top, U.fmtDate(d.date, true), [{ value: d.ms ? U.fmtDuration(d.ms) : 'No practice', label: d.n ? U.plural(d.n, 'session') : '', color: 'var(--viz-1)', kind: 'bar' }]);
      });
      r.addEventListener('pointerleave', () => tip.hide());
    });
    const legend = h('div.cal-legend', h('span', 'Less'), [0, 1, 2, 3, 4].map((l) => h('span.cal-swatch.l' + l)), h('span', 'More (goal met)'));
    return h('div', wrap, legend);
  }

  // ------------------------------------------------------------------ sparkline
  function spark(values, opts) {
    opts = opts || {};
    const W = opts.width || 120;
    const H = opts.height || 32;
    if (values.length < 2) return h('span.spark-empty', '—');
    const min = Math.min(...values);
    const max = Math.max(...values);
    const X = (i) => 2 + (i / (values.length - 1)) * (W - 6);
    const Y = (v) => H - 4 - ((v - min) / (max - min || 1)) * (H - 8);
    const d = values.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const last = values.length - 1;
    return U.frag('<svg class="spark" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path d="' + d + '"/><circle cx="' + X(last) + '" cy="' + Y(values[last]) + '" r="3"/></svg>');
  }

  /** Accessible table twin for a chart. */
  function table(caption, headers, rows) {
    return h('details.table-view',
      h('summary', 'Show as table'),
      h('div.table-scroll', h('table',
        h('caption.sr-only', caption),
        h('thead', h('tr', headers.map((x) => h('th', { scope: 'col', text: x })))),
        h('tbody', rows.map((r) => h('tr', r.map((c) => h('td', { text: String(c) }))))))));
  }

  TD.ui = TD.ui || {};
  TD.ui.charts = { line, columns, hbars, calendar, spark, table };
})(window.TD = window.TD || {});
