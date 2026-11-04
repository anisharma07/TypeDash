/* TypeDash Academy — challenges (tests, ghost race, milestones, leaderboard, achievements), profiles, certificate. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  const MILESTONES = [
    { wpm: 20, ep: null, label: 'Getting going' },
    { wpm: 30, ep: '12.1', label: 'Average typist' },
    { wpm: 40, ep: '12.2', label: 'Above average' },
    { wpm: 50, ep: '12.3', label: 'Fast' },
    { wpm: 60, ep: '12.4', label: 'Professional' },
    { wpm: 80, ep: '12.5', label: 'Very fast' },
    { wpm: 100, ep: '12.6', label: 'Elite' },
  ];

  function leaderboardRows() {
    return TD.store.profiles().map((e) => {
      const p = TD.store.peek(e.id);
      if (!p) return null;
      const t60 = p.records.test60;
      return {
        id: p.id, name: p.name, avatar: p.avatar,
        best: TD.stats.bestWpm(p),
        t60: t60 ? Math.round(t60.wpm) : 0,
        acc: t60 ? t60.acc : TD.stats.recent(p, 10).acc,
        course: TD.course.courseProgress(p),
        active: p.id === TD.store.activeId(),
      };
    }).filter(Boolean).sort((a, b) => b.best - a.best || b.course.stars - a.course.stars);
  }

  function challenges(root) {
    const UI = TD.ui.kit;
    const d = TD.store.get();
    const best = TD.stats.bestWpm(d);

    const tests = h('div.test-grid', [15, 30, 60, 120].map((s) => {
      const r = d.records['test' + s];
      return h('a.test-card', { href: '#/test/' + s },
        h('span.test-time', s < 60 ? s + ' sec' : s / 60 + ' min'),
        h('span.test-pb', r ? h('span', h('b', String(Math.round(r.wpm))), ' WPM') : h('span.muted', 'No record yet')),
        h('span.small.muted', r ? r.acc + '% · ' + U.fmtDate(r.t) : 'Set your first record'),
        h('span.test-go', TD.icon('play')));
    }));

    const ghostRec = d.records.test60;
    const race = h('section.card.race-card',
      h('span.race-ghost', TD.icon('ghost')),
      h('div',
        h('h2', 'Ghost race'),
        h('p.muted', ghostRec
          ? 'Race a replay of your best 60-second test (' + Math.round(ghostRec.wpm) + ' WPM). The violet caret is your ghost: stay ahead of it.'
          : 'Set a 60-second record first. Your best run becomes a ghost caret you can race.')),
      ghostRec ? h('a.btn.btn-primary', { href: '#/race' }, TD.icon('play'), 'Race my ghost') : h('a.btn', { href: '#/test/60' }, 'Take the 60s test'));

    const miles = h('div.milestones', MILESTONES.map((m) => {
      const got = best >= m.wpm;
      const ep = m.ep && TD.course.episode(m.ep);
      const st = ep ? TD.course.status(ep, d) : null;
      return h('div.milestone' + (got ? '.got' : ''),
        h('span.ms-wpm', String(m.wpm)),
        h('span.ms-unit', 'WPM'),
        h('span.ms-label', m.label),
        ep ? (st.state === 'locked' ? h('span.ms-link.muted', TD.icon('lock'), 'Ep ' + ep.id) : h('a.ms-link', { href: '#/episode/' + ep.id }, st.state === 'done' ? 'Passed ' : 'Try ', ep.id)) : null);
    }));

    const lb = leaderboardRows();
    const board = h('section.card',
      h('div.card-head', h('h2', TD.icon('users'), 'Leaderboard on this device'), h('a.btn.btn-sm', { href: '#/profiles' }, 'Manage learners')),
      lb.length > 1 ? null : h('p.muted.small', 'Add more learners (family, classmates, students) on the Profiles page and compete for the top spot.'),
      h('div.table-scroll', h('table.lb',
        h('thead', h('tr', ['#', 'Learner', 'Best WPM', '60s test', 'Course'].map((x) => h('th', { scope: 'col', text: x })))),
        h('tbody', lb.map((r, i) => h('tr' + (r.active ? '.me' : ''),
          h('td', i === 0 && r.best ? '🥇' : i === 1 && r.best ? '🥈' : i === 2 && r.best ? '🥉' : String(i + 1)),
          h('td', h('span.lb-name', UI.avatar(r.avatar), h('span', { text: r.name }), r.active ? h('span.badge.badge-good', 'You') : null)),
          h('td', h('b', r.best ? String(r.best) : '—')),
          h('td', r.t60 ? r.t60 + ' WPM' : '—'),
          h('td', r.course.done + '/' + r.course.total + ' · ★' + r.course.stars)))))));

    const got = Object.keys(d.achievements).length;
    const ach = h('section.card',
      h('div.card-head', h('h2', TD.icon('award'), 'Achievements'), h('span.muted', got + ' / ' + TD.achievements.LIST.length)),
      h('div.ach-grid', TD.achievements.LIST.map((a) => {
        const t = d.achievements[a.id];
        return h('div.ach' + (t ? '.got' : ''), { title: t ? 'Earned ' + U.fmtDate(t, true) : 'Not earned yet' },
          h('span.ach-emoji', a.icon), h('strong', a.title), h('span.small.muted', a.desc), t ? h('span.ach-date', U.fmtDate(t)) : null);
      })));

    const cp = TD.course.courseProgress(d);
    const cert = h('section.card.cert-card',
      h('span.cert-ico', TD.icon('cap')),
      h('div', h('h2', 'Certificate of Typing Mastery'),
        h('p.muted', cp.pct >= 1 ? 'You completed the whole course. Print your certificate!' : 'Complete all ' + cp.total + ' episodes to earn it. You have ' + (cp.total - cp.done) + ' to go.'),
        UI.progress(cp.pct)),
      h('a.btn' + (cp.pct >= 1 ? '.btn-primary' : ''), { href: '#/certificate' }, cp.pct >= 1 ? 'View certificate' : 'Preview'));

    U.clear(root).appendChild(h('div.page.challenges',
      h('div.page-head', h('div', h('span.kicker', 'Push your limits'), h('h1', 'Challenges'), h('p.muted', 'Official speed tests, ghost races and milestones. Personal bests count toward your rank and unlock the Chapter 12 challenges.'))),
      h('h2.label', 'Speed tests'),
      tests,
      race,
      h('h2.label', 'WPM milestones · your best: ' + (best || 0) + ' WPM'),
      miles,
      h('div.two-col', board, cert),
      ach));
    return {};
  }

  // ------------------------------------------------------------------ profiles
  function profiles(root) {
    const UI = TD.ui.kit;
    const rows = leaderboardRows();
    const list = h('div.profile-list', rows.map((r) => h('div.card.profile-row' + (r.active ? '.active' : ''),
      UI.avatar(r.avatar, 'avatar-lg'),
      h('div.pr-info', h('strong', { text: r.name }), h('span.small.muted', 'Best ' + (r.best || 0) + ' WPM · ' + r.course.done + '/' + r.course.total + ' episodes · ★' + r.course.stars)),
      h('div.pr-actions',
        r.active ? h('span.badge.badge-good', 'Active') : h('button.btn.btn-sm.btn-primary', { type: 'button', on: { click: () => { TD.store.switchTo(r.id); UI.toast('Switched to ' + r.name, { icon: 'user' }); location.hash = '#/'; } } }, 'Switch'),
        h('button.btn-icon', {
          type: 'button', title: 'Delete ' + r.name, 'aria-label': 'Delete ' + r.name,
          on: { click: () => UI.confirm('Delete ' + r.name + '?', 'All progress for this learner will be erased from this browser. Export a backup in Settings first if you might need it.', { ok: 'Delete', danger: true }).then((ok) => {
            if (!ok) return;
            TD.store.remove(r.id);
            if (!TD.store.get()) location.hash = '#/welcome'; else TD.router.reload();
          }) },
        }, TD.icon('trash'))))));
    U.clear(root).appendChild(h('div.page.profiles',
      h('div.page-head',
        h('div', h('span.kicker', 'Shared computer?'), h('h1', 'Learners'), h('p.muted', 'Each learner has their own progress, stats and settings. Perfect for families, classrooms and coaching.')),
        h('div.head-actions',
          h('a.btn.btn-ghost', { href: '#/backup' }, TD.icon('upload'), 'Import from backup'),
          h('a.btn.btn-primary', { href: '#/welcome' }, TD.icon('plus'), 'Add learner'))),
      list));
    return {};
  }

  // ------------------------------------------------------------------ certificate
  function certificate(root) {
    const d = TD.store.get();
    const cp = TD.course.courseProgress(d);
    const done = cp.pct >= 1;
    const best = TD.stats.bestWpm(d);
    const rec = TD.stats.recent(d, 20);
    const lastDone = Math.max(0, ...Object.values(d.episodes).map((p) => p.completedAt || 0));
    const cert = h('div.certificate' + (done ? '' : '.preview'),
      h('div.cert-inner',
        h('div.cert-brand', h('span.brand-mark', 'T'), h('span.cert-brand-name', 'TypeDash Academy')),
        h('p.cert-kicker', 'Certificate of'),
        h('h1.cert-title', 'Typing Mastery'),
        h('p.cert-sub', 'This certifies that'),
        h('p.cert-name', { text: d.name }),
        h('p.cert-text', 'completed all 12 chapters and ' + cp.total + ' episodes of the TypeDash Academy touch-typing course, from the home row to real-world text and speed challenges.'),
        h('div.cert-stats',
          h('div', h('b', String(best || '—')), h('span', 'best WPM')),
          h('div', h('b', rec.count ? rec.acc + '%' : '—'), h('span', 'accuracy')),
          h('div', h('b', '★ ' + cp.stars), h('span', 'stars earned'))),
        h('div.cert-foot',
          h('div', h('span.cert-line', done && lastDone ? U.fmtLongDate(lastDone) : U.fmtLongDate(Date.now())), h('small', 'Date')),
          h('div', h('span.cert-line.cert-sign', 'TypeDash'), h('small', 'TypeDash Academy')))),
      done ? null : h('div.cert-watermark', 'PREVIEW'));
    U.clear(root).appendChild(h('div.page.cert-page',
      h('div.page-head.no-print',
        h('div', h('span.kicker', done ? 'Congratulations!' : 'Keep going'), h('h1', 'Certificate'), h('p.muted', done ? 'Print it or save it as a PDF from the print dialog.' : 'Finish the course to remove the preview mark. ' + (cp.total - cp.done) + ' episodes to go.')),
        done ? h('button.btn.btn-primary', { type: 'button', on: { click: () => window.print() } }, TD.icon('printer'), 'Print certificate') : h('a.btn.btn-primary', { href: '#/learn' }, TD.icon('map'), 'Back to the course')),
      cert));
    return {};
  }

  TD.pages = TD.pages || {};
  TD.pages.challenges = challenges;
  TD.pages.profiles = profiles;
  TD.pages.certificate = certificate;
})(window.TD = window.TD || {});
