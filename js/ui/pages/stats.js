/* TypeDash Academy — statistics: progress charts, heatmaps, finger analysis and Typing DNA. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  function stats(root) {
    const UI = TD.ui.kit;
    const C = TD.ui.charts;
    const d = TD.store.get();
    const S = TD.stats;
    const hist = d.history.filter((x) => x.ch >= 30 && x.wpm > 0);

    if (!d.history.length) {
      U.clear(root).appendChild(h('div.page',
        h('div.page-head', h('div', h('span.kicker', 'Your numbers'), h('h1', 'Statistics'))),
        h('div.card', UI.empty('chart', 'No data yet', 'Finish your first lesson and your speed, accuracy, weak keys and Typing DNA will appear here.',
          h('a.btn.btn-primary', { href: '#/learn' }, TD.icon('play'), 'Go to the course')))));
      return {};
    }

    const rec = S.recent(d, 10);
    const streak = S.streak(d);
    const best = S.bestWpm(d);
    const overview = h('section.tiles.stats-tiles',
      UI.tile('Best speed', best || '—', { icon: 'trophy', unit: best ? 'WPM' : '', sub: '30s+ tests and sessions' }),
      UI.tile('Current speed', rec.count ? rec.wpm : '—', { icon: 'bolt', unit: rec.count ? 'WPM' : '', sub: 'average of last ' + rec.count }),
      UI.tile('Accuracy', rec.count ? rec.acc + '%' : '—', { icon: 'target', sub: 'average of last ' + rec.count }),
      UI.tile('Practice time', U.fmtDuration(d.totals.ms), { icon: 'clock', sub: U.plural(d.totals.sessions, 'session') }),
      UI.tile('Streak', streak.current, { icon: 'flame', unit: streak.current === 1 ? 'day' : 'days', sub: 'best ' + U.plural(streak.best, 'day') }),
      UI.tile('Characters', U.fmtNum(d.totals.ch), { icon: 'keyboard', sub: U.fmtNum(d.totals.ks) + ' keystrokes' }));

    // ---- speed & accuracy history (two charts, never a dual axis)
    const last = hist.slice(-60);
    const dateLbl = (i) => U.fmtDate(last[i].t);
    const titleFor = (i) => (last[i].title || last[i].id) + ' · ' + U.fmtDate(last[i].t);
    const speedCard = h('section.card',
      h('div.card-head', h('h2', TD.icon('bolt'), 'Speed over your last ' + U.plural(last.length, 'session')), h('span.small.muted', 'WPM')),
      last.length >= 2
        ? h('div', C.line({ height: 210, ariaLabel: 'Words per minute per session', series: [{ name: 'WPM', values: last.map((x) => x.wpm), color: 'var(--viz-1)', area: true }], xLabel: dateLbl, title: titleFor, endLabel: true, format: (v) => Math.round(v) + '' }),
          C.table('Speed per session', ['Date', 'Session', 'WPM', 'Accuracy'], last.slice().reverse().map((x) => [U.fmtDate(x.t, true), x.title || x.id, Math.round(x.wpm), x.acc + '%'])))
        : h('p.muted', 'Complete one more session to see your trend.'));
    const accVals = last.map((x) => x.acc);
    const accCard = h('section.card',
      h('div.card-head', h('h2', TD.icon('target'), 'Accuracy trend'), h('span.small.muted', '%')),
      last.length >= 2
        ? C.line({ height: 210, ariaLabel: 'Accuracy per session', series: [{ name: 'Accuracy', values: accVals, color: 'var(--viz-2)', area: true }], yMin: Math.max(0, Math.floor((Math.min(...accVals) - 3) / 5) * 5), yMax: 100, xLabel: dateLbl, title: titleFor, endLabel: true, format: (v) => (Math.round(v * 10) / 10) + '%' })
        : h('p.muted', 'Complete one more session to see your trend.'));

    // ---- daily practice
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const dt = U.addDays(new Date(), -i);
      days.push({ key: U.dayKey(dt), date: dt, ms: ((d.daily[U.dayKey(dt)] || {}).ms) || 0 });
    }
    const dailyCard = h('section.card',
      h('div.card-head', h('h2', TD.icon('clock'), 'Practice minutes, last 30 days'), h('span.small.muted', 'Goal ' + d.settings.dailyGoal + ' min/day')),
      C.columns({ height: 170, ariaLabel: 'Minutes practised per day', values: days.map((x) => Math.round(x.ms / 6000) / 10), labels: days.map((x) => String(x.date.getDate())), titles: days.map((x) => U.fmtDate(x.date, true)), unit: 'practised', minMax: d.settings.dailyGoal, format: (v) => v + ' min' }),
      h('h3.label', 'Activity calendar'),
      C.calendar(S.calendar(d, 20), d.settings.dailyGoal * 60000));

    // ---- keyboard heatmap
    const heat = S.keyHeat(d);
    const kb = TD.ui.Keyboard({ colors: false });
    let metric = 'err';
    const legend = h('div.heat-legend');
    function drawHeat() {
      kb.setHeat(heat, metric);
      U.clear(legend);
      const labels = metric === 'err' ? ['<2%', '2–4%', '4–7%', '7–12%', '12%+'] : ['fast', 'typical', 'a bit slow', 'slow', 'slowest'];
      legend.append(h('span', metric === 'err' ? 'Error rate:' : 'Speed vs your median:'));
      [0, 1, 2, 3, 4].forEach((i) => legend.append(h('span.kb-key-sw', h('span.sw.heat-sw-' + (metric === 'err' ? 'e' : 'l') + i)), h('span', labels[i])));
      legend.append(h('span.muted', '· faded = not enough data'));
    }
    drawHeat();
    const heatCard = h('section.card',
      h('div.card-head', h('h2', TD.icon('keyboard'), 'Keyboard heatmap'),
        UI.segmented([{ value: 'err', label: 'Mistakes' }, { value: 'lat', label: 'Speed' }], 'err', (v) => { metric = v; drawHeat(); }, 'Heatmap metric')),
      h('p.muted.small', 'Hover a key for its exact accuracy and average time. Darker = needs more practice.'),
      h('div.heat-kb', kb.el),
      legend);

    // ---- fingers
    const fs = S.fingerStats(d);
    const fingers = TD.kb.FINGER_ORDER.filter((f) => fs[f].n > 0);
    const hb = S.handBalance(d);
    const handsHeat = TD.ui.Hands({ colors: false });
    const levels = {};
    const titles = {};
    TD.kb.FINGER_ORDER.concat(['th']).forEach((f) => {
      if (fs[f].n < 20) return;
      const er = 1 - fs[f].acc / 100;
      levels[f] = er < 0.02 ? 0 : er < 0.04 ? 1 : er < 0.07 ? 2 : er < 0.12 ? 3 : 4;
      titles[f] = TD.kb.FINGERS[f].name + ': ' + Math.round(fs[f].acc * 10) / 10 + '% accuracy, ' + U.fmtNum(fs[f].n) + ' keystrokes';
    });
    handsHeat.setHeat(levels, titles);
    const fingerHeat = h('figure.finger-heat',
      h('div.fh-hands', handsHeat.el),
      h('figcaption.heat-legend', h('span', 'Finger error rate:'),
        ['<2%', '2–4%', '4–7%', '7–12%', '12%+'].map((l, i) => [h('span.kb-key-sw', h('span.sw.heat-sw-e' + i)), h('span', l)]),
        h('span.muted', '· hover a finger for details')));
    const fingerCard = h('section.card',
      h('div.card-head', h('h2', TD.icon('hand'), 'Finger heatmap')),
      fingers.length ? fingerHeat : null,
      fingers.length
        ? h('div.finger-grid',
          h('div', h('h3.label', 'Accuracy by finger'),
            C.hbars(fingers.map((f) => ({ label: TD.kb.FINGERS[f].name, swatch: 'var(--f-' + f + ')', value: fs[f].acc, display: Math.round(fs[f].acc * 10) / 10 + '%', sub: U.fmtNum(fs[f].n) + ' keystrokes' })), { min: Math.max(0, Math.floor(Math.min(...fingers.map((f) => fs[f].acc)) / 5) * 5 - 5), max: 100, color: 'var(--viz-2)' })),
          h('div', h('h3.label', 'Average time per key (lower is faster)'),
            C.hbars(fingers.filter((f) => fs[f].lat).map((f) => ({ label: TD.kb.FINGERS[f].name, swatch: 'var(--f-' + f + ')', value: fs[f].lat, display: Math.round(fs[f].lat) + ' ms' })), { color: 'var(--viz-1)' })))
        : h('p.muted', 'Type a little more to see finger statistics.'),
      fingers.length ? h('div.hand-balance',
        h('span', 'Left hand ' + Math.round(hb.leftShare * 100) + '%'),
        h('div.hb-bar', h('span.hb-left', { style: { width: Math.round(hb.leftShare * 100) + '%' } })),
        h('span', 'Right hand ' + Math.round((1 - hb.leftShare) * 100) + '%')) : null,
      fingers.length ? C.table('Finger statistics', ['Finger', 'Keystrokes', 'Accuracy', 'Avg ms'], fingers.map((f) => [TD.kb.FINGERS[f].name, fs[f].n, Math.round(fs[f].acc * 10) / 10 + '%', fs[f].lat ? Math.round(fs[f].lat) : '—'])) : null);

    // ---- Typing DNA
    const dna = S.dna(d);
    const keyChips = (arr, fmt) => (arr.length ? h('div.chips', arr.map((k) => h('span.chip.chip-key', { dataset: { f: TD.kb.fingerOf(k.key[0]) || '' } }, h('kbd', k.key.length > 1 ? k.key : TD.kb.label(k.key)), h('span', fmt(k))))) : h('span.muted.small', 'Not enough data yet'));
    const dnaCard = h('section.card.dna',
      h('div.card-head', h('h2', TD.icon('sparkles'), 'Your Typing DNA')),
      h('div.dna-style', h('span.dna-name', dna.style.name), h('p.muted', dna.style.desc)),
      h('div.dna-grid',
        h('div', h('h3.label', 'Strongest keys'), keyChips(dna.strongest, (k) => Math.round(k.acc) + '%')),
        h('div', h('h3.label', 'Weakest keys'), keyChips(dna.weakest, (k) => Math.round(k.acc) + '%')),
        h('div', h('h3.label', 'Trickiest transitions'), keyChips(dna.weakBigrams, (k) => Math.round((1 - k.errRate) * 100) + '%')),
        h('div', h('h3.label', 'Slowest transitions'), keyChips(dna.slowBigrams, (k) => Math.round(k.lat) + ' ms')),
        h('div', h('h3.label', 'Common slips'), dna.confusions.length
          ? h('ul.list-plain.slips', dna.confusions.map((c) => h('li', 'Typed ', h('kbd', TD.kb.label(c.typed)), ' instead of ', h('kbd', TD.kb.label(c.exp)), h('span.muted', ' ×' + c.n))))
          : h('span.muted.small', 'No repeated slips. Nice!')),
        h('div', h('h3.label', 'Profile'), h('ul.list-plain.dna-facts',
          h('li', 'Weakest finger: ', h('b', dna.weakestFinger ? TD.kb.FINGERS[dna.weakestFinger].name : '—')),
          h('li', 'Slowest finger: ', h('b', dna.slowestFinger ? TD.kb.FINGERS[dna.slowestFinger].name : '—')),
          h('li', 'Rhythm consistency: ', h('b', dna.recent.cons ? dna.recent.cons + '%' : '—')),
          h('li', 'Rank: ', h('b', S.rank(best).icon + ' ' + S.rank(best).name))))),
      dna.weakest.length ? h('a.btn.btn-primary.btn-sm', { href: '#/practice/weak' }, TD.icon('dumbbell'), 'Train my weak keys') : null);

    // ---- records & history
    const recRows = S.TESTS.map((id) => [id.replace('test', '') + ' seconds', d.records[id] ? Math.round(d.records[id].wpm) + ' WPM' : '—', d.records[id] ? d.records[id].acc + '%' : '—', d.records[id] ? U.fmtDate(d.records[id].t, true) : '—']);
    const recordsCard = h('section.card',
      h('div.card-head', h('h2', TD.icon('trophy'), 'Personal records'), h('a.btn.btn-sm', { href: '#/challenges' }, 'Take a test')),
      h('div.table-scroll', h('table', h('thead', h('tr', ['Test', 'Best', 'Accuracy', 'Date'].map((x) => h('th', { scope: 'col', text: x })))),
        h('tbody', recRows.map((r) => h('tr', r.map((c) => h('td', { text: c }))))))));
    const histCard = h('section.card',
      h('div.card-head', h('h2', TD.icon('list'), 'Recent sessions')),
      h('div.table-scroll', h('table.hist-table', h('thead', h('tr', ['When', 'Session', 'WPM', 'Accuracy', 'Time', 'Stars'].map((x) => h('th', { scope: 'col', text: x })))),
        h('tbody', d.history.slice(-25).reverse().map((x) => h('tr',
          h('td', U.timeAgo(x.t)), h('td', { text: x.title || x.id }), h('td', x.wpm ? String(Math.round(x.wpm)) : '—'), h('td', x.acc + '%'), h('td', U.fmtDuration(x.ms || 0)),
          h('td', x.stars != null ? UI.stars(x.stars) : '')))))));

    U.clear(root).appendChild(h('div.page.stats',
      h('div.page-head', h('div', h('span.kicker', 'Your numbers'), h('h1', 'Statistics'), h('p.muted', 'Everything is computed from your own sessions on this device.'))),
      overview,
      h('div.two-col', speedCard, accCard),
      dailyCard,
      h('div.two-col', heatCard, dnaCard),
      fingerCard,
      h('div.two-col', recordsCard, histCard)));
    return {};
  }

  TD.pages = TD.pages || {};
  TD.pages.stats = stats;
})(window.TD = window.TD || {});
