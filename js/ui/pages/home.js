/* TypeDash Academy — onboarding (create a learner profile) and the dashboard. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  // ------------------------------------------------------------------ onboarding
  function welcome(root) {
    const UI = TD.ui.kit;
    const hasProfiles = TD.store.profiles().length > 0;
    let avatar = U.pick(UI.AVATARS);
    let goal = 10;
    let level = 'new';

    const nameInput = h('input', { type: 'text', maxLength: 24, placeholder: 'e.g. Aarav, Mia, Sam', autocomplete: 'off', spellcheck: false, 'aria-label': 'Your name' });
    const avatars = h('div.avatar-grid', { role: 'radiogroup', 'aria-label': 'Choose an avatar' });
    UI.AVATARS.forEach((a) => {
      const b = h('button.avatar-opt' + (a === avatar ? '.on' : ''), {
        type: 'button', role: 'radio', 'aria-checked': String(a === avatar), 'aria-label': 'Avatar ' + a.replace('avatar', ''),
        on: { click: () => { avatar = a; U.$$('.avatar-opt', avatars).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); }); } },
      }, h('img', { src: UI.avatarSrc(a), alt: '' }));
      avatars.appendChild(b);
    });
    const levels = h('div.level-pick', { role: 'radiogroup', 'aria-label': 'Experience' });
    [
      { v: 'new', icon: '🌱', t: 'I am new to touch typing', d: 'Start at Chapter 1 and learn the home row properly.' },
      { v: 'some', icon: '⚡', t: 'I can already type a bit', d: 'Take a 1-minute placement test to unlock the right chapters.' },
    ].forEach((o) => {
      const b = h('button.level-opt' + (o.v === level ? '.on' : ''), {
        type: 'button', role: 'radio', 'aria-checked': String(o.v === level),
        on: { click: () => { level = o.v; U.$$('.level-opt', levels).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); }); } },
      }, h('span.lo-icon', o.icon), h('span', h('strong', o.t), h('small', o.d)));
      levels.appendChild(b);
    });
    const err = h('p.form-error', { hidden: true });
    const startBtn = h('button.btn.btn-primary.btn-lg.btn-block', { type: 'submit' }, 'Start my training', TD.icon('right'));
    const form = h('form.card.welcome-form', {
      on: {
        submit: (e) => {
          e.preventDefault();
          const name = nameInput.value.trim();
          if (name.length < 2) { err.textContent = 'Please type a name with at least 2 letters.'; err.hidden = false; nameInput.focus(); return; }
          const d = TD.store.create(name, avatar);
          d.settings.dailyGoal = goal;
          d.onboarded = true;
          TD.store.save();
          TD.sound.prime();
          location.hash = level === 'some' ? '#/placement' : '#/guide/welcome';
        },
      },
    },
    h('h2', hasProfiles ? 'Add a learner' : 'Create your learner profile'),
    h('p.muted', 'Progress is saved in this browser only. Several learners can share this computer.'),
    h('label.field', h('span', 'Your name'), nameInput),
    h('div.field', h('span', 'Pick an avatar'), avatars),
    h('div.field', h('span', 'Daily practice goal'), UI.segmented([5, 10, 15, 20].map((m) => ({ value: m, label: m + ' min' })), goal, (v) => { goal = v; }, 'Daily goal')),
    h('div.field', h('span', 'Where are you starting?'), levels),
    err,
    startBtn,
    hasProfiles ? h('a.btn.btn-ghost.btn-block.mt-8', { href: '#/profiles' }, TD.icon('left'), 'Back to profiles') : null);

    const kb = TD.ui.Keyboard({ compact: true });
    const demo = 'typedash';
    let i = 0;
    const cyc = () => kb.highlight(demo[i++ % demo.length]);
    cyc();
    const timer = setInterval(cyc, 700);

    const page = h('div.welcome',
      h('section.welcome-hero',
        h('div.brand.brand-xl', h('span.brand-mark', 'T'), h('span.brand-name', 'Type', h('em', 'Dash')), h('span.brand-tag', 'Academy')),
        h('h1', 'Teach your fingers to type without looking.'),
        h('p.lead', 'An offline touch-typing course that takes you from your first home-row key to 60+ WPM: 12 chapters, 76 bite-size episodes, guides between lessons and drills that adapt to your weak keys.'),
        h('ul.feature-list',
          h('li', TD.icon('map'), h('span', h('b', 'A structured path. '), 'Keys, then patterns, then words, then real-world text.')),
          h('li', TD.icon('sparkles'), h('span', h('b', 'Adaptive drills. '), 'Weak-key detection builds practice around your mistakes.')),
          h('li', TD.icon('chart'), h('span', h('b', 'Real progress. '), 'WPM, accuracy, streaks, finger heatmaps and your Typing DNA.')),
          h('li', TD.icon('lock'), h('span', h('b', 'Private and offline. '), 'No account, no server: everything stays on this device.'))),
        h('div.welcome-kb', kb.el)),
      form);
    U.clear(root).appendChild(h('div.page', page));
    setTimeout(() => nameInput.focus(), 60);
    return { destroy() { clearInterval(timer); } };
  }

  // ------------------------------------------------------------------ dashboard helpers
  function greeting() {
    const hr = new Date().getHours();
    return hr < 5 ? 'Burning the midnight oil' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  }

  /** Smart revision: finished episodes worth repeating (few stars, weak keys, or long ago). */
  function reviewSuggestions(d, limit) {
    const weak = new Set(TD.stats.weakKeys(d, { limit: 5 }).map((w) => w.key));
    const now = Date.now();
    return TD.course.episodes()
      .map((ep) => {
        const p = d.episodes[ep.id];
        if (!p || !p.done) return null;
        let score = (3 - (p.stars || 0)) * 2;
        const reasons = [];
        if (p.stars < 3) reasons.push((p.stars || 0) + ' of 3 stars');
        const overlap = [...(ep.newKeys || '')].filter((c) => weak.has(c));
        if (overlap.length) { score += 3; reasons.push('practises your weak key' + (overlap.length > 1 ? 's ' : ' ') + overlap.map((c) => TD.kb.label(c)).join(' ')); }
        if (now - (p.last || 0) > 7 * 86400000 && p.stars < 3) { score += 1; reasons.push('not practised for a week'); }
        return score > 0 ? { ep, p, score, why: reasons.join(' · ') } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit || 3);
  }

  function kindIcon(kind) {
    return { episode: 'book', test: 'clock', race: 'ghost', workout: 'dumbbell', practice: 'target', custom: 'clipboard', placement: 'map' }[kind] || 'text';
  }

  // ------------------------------------------------------------------ dashboard
  function dashboard(root) {
    const UI = TD.ui.kit;
    const d = TD.store.get();
    const S = TD.stats;
    const next = TD.course.nextEpisode(d);
    const cp = TD.course.courseProgress(d);
    const today = S.today(d);
    const streak = S.streak(d);
    const rec = S.recent(d, 10);
    const best = S.bestWpm(d);
    const rank = S.rank(best);
    const weak = S.weakKeys(d, { limit: 5 });
    const isNew = !d.history.length;

    // hero
    const hero = h('section.dash-hero',
      h('img.avatar.avatar-xl', { src: UI.avatarSrc(d.avatar), alt: '' }),
      h('div.dh-text',
        h('h1', greeting() + ', ' + d.name + '!'),
        h('div.rank-line',
          h('span.rank-badge', rank.icon + ' ' + rank.name),
          rank.next
            ? h('span.muted', best ? 'Best ' + best + ' WPM · next rank ' + rank.next.name + ' at ' + rank.next.min + ' WPM' : 'Reach ' + rank.next.min + ' WPM to become a ' + rank.next.name)
            : h('span.muted', 'Top rank reached. Legendary!')),
        rank.next ? h('div.rank-progress', UI.progress(rank.progress)) : null));

    // continue card
    let cont;
    if (next) {
      const ch = TD.course.chapterOf(next.id);
      const chp = TD.course.chapterProgress(ch, d);
      const prevItem = TD.course.path()[TD.course.path().findIndex((it) => it.id === next.id) - 1];
      const pendingGuide = prevItem && prevItem.type === 'guide' && !d.guides[prevItem.id] ? prevItem.guide : null;
      const st = TD.course.status(next, d);
      cont = h('section.card.dash-continue',
        h('div.dc-top', h('span.kicker', isNew ? 'Your first lesson' : st.state === 'skipped' ? 'Skipped earlier' : 'Up next'), h('span.level.level-' + ch.level, TD.course.LEVEL_LABEL[ch.level])),
        h('h2', next.title),
        h('p.muted', 'Chapter ' + ch.id + ': ' + ch.title + ' · Episode ' + next.id + ' · ~' + next.minutes + ' min'),
        h('p', next.summary),
        h('div.dc-progress', h('span.small.muted', chp.done + ' of ' + chp.total + ' episodes in this chapter'), UI.progress(chp.pct)),
        h('div.dc-actions',
          pendingGuide
            ? h('a.btn.btn-primary.btn-lg', { href: '#/guide/' + pendingGuide.id }, TD.icon('book'), 'Read: ' + pendingGuide.title)
            : h('a.btn.btn-primary.btn-lg', { href: '#/episode/' + next.id }, TD.icon('play'), isNew ? 'Start lesson 1.1' : 'Continue'),
          pendingGuide ? h('a.btn.btn-ghost.btn-lg', { href: '#/episode/' + next.id }, 'Skip to the lesson') : h('a.btn.btn-ghost.btn-lg', { href: '#/learn?ch=' + ch.id }, TD.icon('map'), 'Course map'),
          isNew ? h('a.btn.btn-ghost.btn-lg', { href: '#/placement' }, TD.icon('bolt'), 'I can type: placement test') : null));
    } else {
      cont = h('section.card.dash-continue.done',
        h('span.kicker', 'Course complete'),
        h('h2', 'You finished all 12 chapters! 🎓'),
        h('p.muted', 'Keep your skills sharp with daily workouts, speed tests and ghost races.'),
        h('div.dc-actions', h('a.btn.btn-primary.btn-lg', { href: '#/certificate' }, TD.icon('cap'), 'View certificate'), h('a.btn.btn-ghost.btn-lg', { href: '#/challenges' }, TD.icon('trophy'), 'Challenges')));
    }

    // today card
    const mins = Math.floor(today.ms / 60000);
    const todayCard = h('section.card.dash-today',
      h('div.card-head', h('h3', TD.icon('target'), 'Today')),
      h('div.today-row',
        UI.ring(today.pct, { size: 92, stroke: 9, label: h('span', h('b', String(mins)), h('small', '/' + d.settings.dailyGoal + ' min')) }),
        h('div',
          h('div.today-streak' + (streak.current ? '.on' : ''), TD.icon('flame'), h('b', streak.current + '-day streak')),
          h('p.small.muted', streak.today ? (today.pct >= 1 ? 'Daily goal reached. Great discipline!' : 'Nice, you practised today. Finish your goal to keep momentum.') : streak.current ? 'Practise today to keep your streak alive.' : 'Practise today to start a streak.'),
          h('p.small.muted', 'Best streak: ' + U.plural(streak.best, 'day')))),
      h('a.btn.btn-block', { href: '#/practice/workout' }, TD.icon('dumbbell'), '10-minute daily workout'));

    // tiles
    const recentWpm = d.history.filter((x) => x.ch >= 30 && x.wpm > 0).slice(-14).map((x) => x.wpm);
    const tiles = h('section.tiles.dash-tiles',
      h('div.tile', h('div.tile-label', TD.icon('bolt'), 'Current speed'), h('div.tile-value', h('span', rec.count ? String(rec.wpm) : '—'), h('small', 'WPM')), h('div.tile-sub.spark-row', rec.count ? 'avg of last ' + rec.count : 'no sessions yet', TD.ui.charts.spark(recentWpm, { width: 90, height: 26 }))),
      UI.tile('Accuracy', rec.count ? rec.acc + '%' : '—', { icon: 'target', sub: rec.count ? 'last ' + rec.count + ' sessions' : 'aim for 95%+' }),
      UI.tile('Best speed', best || '—', { icon: 'trophy', unit: best ? 'WPM' : '', sub: '30s+ tests and sessions' }),
      UI.tile('Course', cp.done + '/' + cp.total, { icon: 'map', sub: '★ ' + cp.stars + ' of ' + cp.maxStars + ' stars' }));

    // weak keys
    const weakCard = h('section.card',
      h('div.card-head', h('h3', TD.icon('sparkles'), 'Weak keys')),
      weak.length
        ? h('div',
          h('div.chips', weak.map((w) => h('span.chip.chip-key', { dataset: { f: TD.kb.fingerOf(w.key) || '' }, title: Math.round(w.acc) + '% accuracy' + (w.lat ? ', ' + Math.round(w.lat) + ' ms' : '') }, h('kbd', TD.kb.label(w.key)), h('span', Math.round(w.acc) + '%')))),
          h('p.small.muted.mt-8', 'Detected from your mistakes and hesitations. Drills will lean on these keys automatically.'),
          h('a.btn.btn-primary.btn-sm', { href: '#/practice/weak' }, TD.icon('dumbbell'), 'Fix them now'))
        : h('p.muted.small', 'Complete a few lessons and we will spot the keys that slow you down.'));

    // review
    const review = reviewSuggestions(d, 3);
    const reviewCard = h('section.card',
      h('div.card-head', h('h3', TD.icon('retry'), 'Smart revision')),
      review.length
        ? h('ul.list-plain', review.map((r) => h('li.rev-row',
          h('div', h('strong', r.ep.id + ' ' + r.ep.title), h('small.muted', r.why)),
          UI.stars(r.p.stars || 0),
          h('a.btn.btn-sm', { href: '#/episode/' + r.ep.id }, 'Review'))))
        : h('p.muted.small', isNew ? 'Finished episodes that need another pass will appear here.' : 'Nothing to revise right now. Every finished episode has three stars or is fresh.'));

    // recent sessions
    const recent = d.history.slice(-5).reverse();
    const recentCard = h('section.card',
      h('div.card-head', h('h3', TD.icon('clock'), 'Recent sessions'), d.history.length ? h('a.small', { href: '#/stats' }, 'All stats') : null),
      recent.length
        ? h('ul.list-plain', recent.map((x) => h('li.hist-row',
          h('span.hist-ico', TD.icon(kindIcon(x.kind))),
          h('div', h('strong', x.title || x.id), h('small.muted', U.timeAgo(x.t))),
          h('span.hist-val', x.wpm ? Math.round(x.wpm) + ' WPM' : ''),
          h('span.hist-val.muted', Math.round(x.acc) + '%'))))
        : h('p.muted.small', 'Your sessions will be listed here.'));

    // achievements
    const got = TD.achievements.LIST.filter((a) => d.achievements[a.id]).sort((a, b) => d.achievements[b.id] - d.achievements[a.id]);
    const achCard = h('section.card.dash-ach',
      h('div.card-head', h('h3', TD.icon('award'), 'Achievements ', h('span.muted.small', got.length + ' / ' + TD.achievements.LIST.length)), h('a.small', { href: '#/challenges' }, 'See all')),
      got.length
        ? h('div.ach-row', got.slice(0, 8).map((a) => h('div.ach-mini', { title: a.title + ': ' + a.desc }, h('span.ach-emoji', a.icon), h('span', a.title))))
        : h('p.muted.small', 'Earn badges for finishing chapters, streaks and speed milestones.'));

    const page = h('div.page.dashboard',
      hero,
      !TD.store.isPersistent() ? h('div.notice.notice-warn', TD.icon('info'), 'This browser is blocking local storage, so progress will be lost when you close the tab. Try another browser or disable private mode.') : null,
      h('div.dash-grid', cont, todayCard, tiles, weakCard, reviewCard, recentCard, achCard));
    U.clear(root).appendChild(page);
    return {};
  }

  TD.pages = TD.pages || {};
  TD.pages.welcome = welcome;
  TD.pages.dashboard = dashboard;
  TD.pages.kindIcon = kindIcon;
})(window.TD = window.TD || {});
