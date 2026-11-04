/* TypeDash Academy — app shell: theme, navigation, routes. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;
  const root = document.getElementById('app');
  const navEl = document.getElementById('nav');

  // ------------------------------------------------------------------ appearance
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  function applyAppearance() {
    const s = TD.store.settings();
    const theme = s.theme === 'system' ? (media && media.matches ? 'light' : 'dark') : s.theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-size', s.fontSize || 'm');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f3f5fb' : '#070914');
  }
  if (media && media.addEventListener) media.addEventListener('change', applyAppearance);

  // ------------------------------------------------------------------ navigation
  const LINKS = [
    { href: '#/', icon: 'home', label: 'Dashboard', match: (p) => p === '/' },
    { href: '#/learn', icon: 'map', label: 'Learn', match: (p) => p.startsWith('/learn') || p.startsWith('/guide') || p.startsWith('/episode') },
    { href: '#/practice', icon: 'target', label: 'Practice', match: (p) => p.startsWith('/practice') },
    { href: '#/challenges', icon: 'trophy', label: 'Challenges', match: (p) => p.startsWith('/challenges') || p.startsWith('/test') || p === '/race' || p === '/certificate' },
    { href: '#/stats', icon: 'chart', label: 'Stats', match: (p) => p.startsWith('/stats') },
  ];
  function renderNav() {
    const d = TD.store.get();
    U.clear(navEl);
    const brand = h('a.brand', { href: '#/', 'aria-label': 'TypeDash Academy home' }, h('span.brand-mark', 'T'), h('span.brand-name', 'Type', h('em', 'Dash')), h('span.brand-tag', 'Academy'));
    navEl.hidden = !d;
    if (!d) return;
    const path = TD.router.path();
    const streak = TD.stats.streak(d);
    navEl.append(
      brand,
      h('nav.nav-links', { 'aria-label': 'Main' }, LINKS.map((l) => h('a' + (l.match(path) ? '.active' : ''), { href: l.href, 'aria-current': l.match(path) ? 'page' : null }, TD.icon(l.icon), h('span', l.label)))),
      h('div.nav-right',
        h('span.streak-chip' + (streak.current ? '.on' : ''), { title: streak.current ? streak.current + '-day streak' + (streak.today ? '' : ' (practise today to keep it)') : 'No streak yet. Practise today!' }, TD.icon('flame'), String(streak.current)),
        h('a.profile-chip', { href: '#/profiles', title: 'Learners' }, TD.ui.kit.avatar(d.avatar), h('span', { text: d.name })),
        h('a.btn-icon', { href: '#/settings', title: 'Settings', 'aria-label': 'Settings' }, TD.icon('sliders'))));
  }

  // ------------------------------------------------------------------ routes
  const page = (fn) => (params, query) => fn(root, params, query) || {};
  function player(plan, hooks) {
    if (!plan) return null;
    return TD.pages.player(root, plan, hooks);
  }

  TD.router
    .add('welcome', '/welcome', page(TD.pages.welcome))
    .add('home', '/', page(TD.pages.dashboard))
    .add('learn', '/learn', page(TD.pages.learn))
    .add('guides', '/guides', page(TD.pages.guides))
    .add('guide', '/guide/:id', page(TD.pages.guide))
    .add('episode', '/episode/:id', (p) => {
      const d = TD.store.get();
      const ep = TD.course.episode(p.id);
      if (!ep) { TD.router.go('/learn', true); return {}; }
      if (!TD.course.isUnlocked(ep, d)) {
        TD.ui.kit.toast('Episode ' + ep.id + ' is locked. Finish the earlier lessons first, or turn on Teacher mode in Settings.', { icon: 'lock' });
        TD.router.go('/learn?ch=' + ep.chapter, true);
        return {};
      }
      return player(TD.course.planFor(ep, d), { backTo: '#/learn?ch=' + ep.chapter, backLabel: 'Course' });
    })
    .add('practice', '/practice', page(TD.pages.practice))
    .add('practice-run', '/practice/:mode', (p, q) => {
      const plan = TD.pages.practicePlan(p.mode, q);
      if (!plan) { TD.router.go('/practice', true); return {}; }
      return player(plan, { backTo: '#/practice', backLabel: 'Practice' });
    })
    .add('test', '/test/:sec', (p) => {
      const s = [15, 30, 60, 120].includes(Number(p.sec)) ? Number(p.sec) : 60;
      return player(TD.plans.test(s), { backTo: '#/challenges', backLabel: 'Challenges' });
    })
    .add('race', '/race', () => player(TD.plans.test(60, { race: true }), { backTo: '#/challenges', backLabel: 'Challenges' }))
    .add('placement', '/placement', () => player(TD.plans.placement(), { backTo: '#/learn', backLabel: 'Course' }))
    .add('challenges', '/challenges', page(TD.pages.challenges))
    .add('stats', '/stats', page(TD.pages.stats))
    .add('settings', '/settings', page(TD.pages.settings))
    .add('profiles', '/profiles', page(TD.pages.profiles))
    .add('certificate', '/certificate', page(TD.pages.certificate));

  TD.router.guard((path) => {
    if (!TD.store.get() && path !== '/welcome') return '/welcome';
    return null;
  });

  // ------------------------------------------------------------------ events
  U.bus.on('route', () => { renderNav(); document.title = titleFor(TD.router.path()); });
  U.bus.on('settings:changed', applyAppearance);
  U.bus.on('profile:changed', () => { applyAppearance(); renderNav(); });
  U.bus.on('data:changed', renderNav);
  U.bus.on('storage:error', () => TD.ui.kit.toast('Could not save progress: browser storage is full or blocked. Export a backup from Settings.', { icon: 'info', tone: 'gold', timeout: 7000 }));

  function titleFor(path) {
    const map = { '/': 'Dashboard', '/learn': 'Learn', '/practice': 'Practice', '/challenges': 'Challenges', '/stats': 'Statistics', '/settings': 'Settings', '/profiles': 'Learners', '/welcome': 'Welcome', '/guides': 'Guides', '/certificate': 'Certificate' };
    let t = map[path];
    if (!t && path.startsWith('/episode/')) { const ep = TD.course.episode(path.split('/')[2]); t = ep ? ep.id + ' ' + ep.title : 'Lesson'; }
    if (!t && path.startsWith('/guide/')) { const g = TD.course.guide(path.split('/')[2]); t = g ? g.title : 'Guide'; }
    return (t ? t + ' · ' : '') + 'TypeDash Academy';
  }

  // ------------------------------------------------------------------ boot
  TD.store.init();
  applyAppearance();
  document.getElementById('year').textContent = new Date().getFullYear();
  TD.router.start();

  // Offline install support when served over http(s); file:// works without it.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})(window.TD = window.TD || {});
