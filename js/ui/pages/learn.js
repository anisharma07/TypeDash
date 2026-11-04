/* TypeDash Academy — course map, guide reader and guides library. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  function lockReason(ep, d) {
    const eps = TD.course.episodes();
    const prev = eps[ep.index - 1];
    const pp = prev && d.episodes[prev.id];
    if (prev && !(pp && (pp.done || pp.skipped)) && !(d.unlockedThrough >= ep.chapter)) return 'Finish ' + prev.id + ' (' + prev.title + ') first.';
    if (ep.unlock && ep.unlock.bestWpm) {
      return 'Unlocks when your best speed reaches ' + ep.unlock.bestWpm + ' WPM (yours: ' + TD.stats.bestWpm(d) + '). Take speed tests in Challenges to raise it.';
    }
    return 'Locked for now.';
  }

  // ------------------------------------------------------------------ course map
  function learn(root, params, query) {
    const UI = TD.ui.kit;
    const d = TD.store.get();
    const chapters = TD.course.chapters();
    const next = TD.course.nextEpisode(d);
    const cp = TD.course.courseProgress(d);
    const focusCh = Number(query.ch) || (next ? next.chapter : chapters.length);

    const head = h('div.page-head',
      h('div',
        h('span.kicker', 'Typing Mastery Course'),
        h('h1', 'Your learning path'),
        h('p.muted', chapters.length + ' chapters · ' + cp.total + ' episodes · guides and typing tricks between lessons')),
      h('div.head-actions',
        h('a.btn.btn-ghost', { href: '#/guides' }, TD.icon('book'), 'Guides library'),
        cp.done < 10 ? h('a.btn.btn-ghost', { href: '#/placement' }, TD.icon('bolt'), 'Placement test') : null));

    const overall = h('div.card.course-progress',
      h('div.cpg-row',
        h('div', h('strong', cp.done + ' of ' + cp.total + ' episodes complete'), h('span.muted.small', ' · ★ ' + cp.stars + ' / ' + cp.maxStars + ' stars')),
        next ? h('a.btn.btn-primary', { href: '#/episode/' + next.id }, TD.icon('play'), 'Continue ' + next.id) : h('a.btn.btn-primary', { href: '#/certificate' }, TD.icon('cap'), 'Certificate')),
      UI.progress(cp.pct),
      d.settings.unlockAll ? h('p.small.muted.mt-8', 'Teacher mode is on: every lesson is unlocked. Turn it off in Settings.') : null,
      d.unlockedThrough ? h('p.small.muted.mt-8', 'Your placement test opened chapters 1–' + d.unlockedThrough + '.') : null);

    const list = h('div.chapters');
    chapters.forEach((ch) => {
      const p = TD.course.chapterProgress(ch, d);
      const firstState = TD.course.status(ch.episodes[0], d).state;
      const locked = firstState === 'locked';
      const open = ch.id === focusCh;
      const body = h('div.ch-path');
      TD.course.chapterItems(ch.id).forEach((item) => body.appendChild(item.type === 'guide' ? guideTile(item.guide, d) : episodeTile(item.episode, d, next)));
      const toggle = h('button.ch-head', { type: 'button', 'aria-expanded': String(open) },
        h('span.ch-num', String(ch.id)),
        h('span.ch-info',
          h('span.ch-title-row', h('strong.ch-title', ch.title), h('span.level.level-' + ch.level, TD.course.LEVEL_LABEL[ch.level])),
          h('span.ch-goal', ch.goal + ' · ' + ch.summary)),
        h('span.ch-meta',
          locked ? h('span.ch-lock', TD.icon('lock'), 'Locked') : p.complete ? h('span.ch-done', TD.icon('check'), 'Complete') : h('span', p.done + '/' + p.total),
          h('span.ch-stars', '★ ' + p.stars + '/' + p.maxStars),
          h('span.ch-bar', UI.progress(p.pct))),
        h('span.ch-chev', TD.icon('right')));
      const sec = h('section.chapter' + (open ? '.open' : '') + (locked ? '.locked' : '') + (p.complete ? '.complete' : ''), { id: 'ch-' + ch.id }, toggle, body);
      toggle.addEventListener('click', () => {
        const isOpen = sec.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
      list.appendChild(sec);
    });

    U.clear(root).appendChild(h('div.page.learn', head, overall, list));
    const target = document.getElementById('ch-' + focusCh);
    if (target && focusCh > 1) setTimeout(() => target.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
    return {};
  }

  function episodeTile(ep, d, next) {
    const UI = TD.ui.kit;
    const st = TD.course.status(ep, d);
    const isNext = next && next.id === ep.id;
    const inner = [
      h('span.te-id', ep.id),
      h('span.te-title', ep.title),
      h('span.te-foot',
        st.state === 'locked' ? h('span.te-lock', TD.icon('lock')) : st.state === 'done' ? UI.stars(st.stars) : st.state === 'skipped' ? h('span.te-skip', 'Skipped') : h('span.te-start', isNext ? 'Up next' : 'Start'),
        h('span.te-min', ep.minutes + ' min')),
    ];
    if (st.state === 'locked') {
      return h('button.tile-ep.state-locked', {
        type: 'button', title: lockReason(ep, d),
        on: { click: () => TD.ui.kit.toast(lockReason(ep, d), { icon: 'lock' }) },
      }, inner);
    }
    return h('a.tile-ep.state-' + st.state + (isNext ? '.is-next' : ''), { href: '#/episode/' + ep.id, title: ep.summary }, inner);
  }

  function guideTile(g, d) {
    const read = !!d.guides[g.id];
    return h('a.tile-guide' + (read ? '.read' : ''), { href: '#/guide/' + g.id, title: g.summary },
      h('span.tg-icon', g.icon),
      h('span.tg-body', h('span.tg-kicker', 'Guide · ' + g.minutes + ' min'), h('span.tg-title', g.title)),
      read ? h('span.tg-read', TD.icon('check')) : null);
  }

  // ------------------------------------------------------------------ guide blocks
  function renderBlocks(blocks, cleanups) {
    const S = TD.store.settings();
    return blocks.map((b) => {
      switch (b.type) {
        case 'p': return h('p', { html: U.md(b.text) });
        case 'h': return h('h2.g-h', { html: U.md(b.text) });
        case 'list': return h('ul.g-list', b.items.map((t) => h('li', { html: U.md(t) })));
        case 'steps': return h('ol.g-steps', b.items.map((t) => h('li', { html: U.md(t) })));
        case 'tip': return h('div.callout.callout-tip', h('div.callout-title', '💡 ' + (b.title || 'Pro tip')), h('p', { html: U.md(b.text) }));
        case 'warn': return h('div.callout.callout-warn', h('div.callout-title', '⚠️ ' + (b.title || 'Watch out')), h('p', { html: U.md(b.text) }));
        case 'compare': return h('div.compare',
          h('div.cmp.cmp-good', h('div.cmp-title', TD.icon('check'), 'Do'), h('p', { html: U.md(b.good) })),
          h('div.cmp.cmp-bad', h('div.cmp-title', TD.icon('x'), 'Don\'t'), h('p', { html: U.md(b.bad) })));
        case 'keys': {
          const kb = TD.ui.Keyboard({ compact: true, colors: S.fingerColors });
          const keys = [...b.keys].filter((c) => c.trim());
          kb.mark(keys.join(''), 'lit');
          const hands = TD.ui.Hands({ colors: S.fingerColors });
          let i = 0;
          const cyc = () => { const info = kb.highlight(keys[i++ % keys.length]); hands.highlight(info && info.finger); };
          if (keys.length) { cyc(); cleanups.push(setInterval(cyc, 1000)); }
          return h('figure.g-figure', h('div.g-kb', kb.el), h('div.g-hands', hands.el), b.caption ? h('figcaption', { html: U.md(b.caption) }) : null);
        }
        case 'fingers': {
          const kb = TD.ui.Keyboard({ compact: true, colors: true });
          const hands = TD.ui.Hands({ colors: true });
          const order = 'qazwsxedcrfvtgbyhnujmik,ol.p;/';
          let i = 0;
          const cyc = () => { const info = kb.highlight(order[i++ % order.length]); hands.highlight(info && info.finger); };
          cyc();
          cleanups.push(setInterval(cyc, 900));
          return h('figure.g-figure', h('div.g-kb', kb.el), h('div.g-hands', hands.el), TD.ui.fingerLegend(), b.caption ? h('figcaption', { html: U.md(b.caption) }) : null);
        }
        case 'try': return tryBlock(b);
        default: return null;
      }
    });
  }

  /** Inline practice box inside a guide. Focus it, then type. */
  function tryBlock(b) {
    const S = TD.store.settings();
    const box = h('div.try', { tabindex: '0', role: 'group', 'aria-label': 'Practice box. Focus it and type: ' + b.text });
    const area = h('div.try-area');
    const status = h('div.try-status', TD.icon('keyboard'), h('span', 'Click here, then type'));
    let session;
    let view;
    const setStatus = (t) => { status.lastChild.textContent = t; };
    function reset() {
      session = TD.engine.create({ text: b.text, mode: 'stop' });
      view = TD.ui.TypingView(session, { caret: S.caret, smooth: S.smoothCaret, lines: b.text.length > 46 ? 2 : 1 });
      session.on((evt) => {
        view.update(evt);
        if (evt.type === 'ok') TD.sound.click();
        if (evt.type === 'miss') TD.sound.error();
        if (evt.type === 'finish') {
          const r = session.result();
          const d = TD.store.get();
          TD.stats.mergeResult(d, r);
          TD.store.saveSoon();
          box.classList.add('done');
          setStatus('Done: ' + Math.round(r.wpm) + ' WPM, ' + Math.round(r.acc) + '% accuracy. Press Enter to try again.');
        }
      });
      U.clear(area).appendChild(view.el);
      box.classList.remove('done');
    }
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'Escape' || e.metaKey || e.ctrlKey) return;
      if (session.finished) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reset(); setStatus('Type the text above'); }
        return;
      }
      const a = TD.engine.actionFromEvent(e);
      if (!a) return;
      e.preventDefault();
      if (a.type === 'char') session.input(a.ch);
    });
    box.addEventListener('focus', () => { box.classList.add('focused'); if (!session.finished) setStatus('Type the text above'); TD.sound.prime(); });
    box.addEventListener('blur', () => { box.classList.remove('focused'); if (!session.finished) setStatus('Click here, then type'); });
    reset();
    box.append(h('div.try-label', 'Try it'), area, status);
    return h('figure.g-try', box, b.caption ? h('figcaption', { html: U.md(b.caption) }) : null);
  }

  // ------------------------------------------------------------------ guide page
  function guide(root, params) {
    const g = TD.course.guide(params.id);
    if (!g) { location.hash = '#/learn'; return {}; }
    const d = TD.store.get();
    if (!d.guides[g.id]) { d.guides[g.id] = Date.now(); TD.store.saveSoon(); const fresh = TD.achievements.check(d); fresh.forEach((a) => TD.ui.kit.achievementToast(a)); }
    const cleanups = [];
    const nextItem = TD.course.nextItemAfter(g.id, d);
    const before = TD.course.episode(g.before);
    const all = TD.course.guides();
    const gi = all.findIndex((x) => x.id === g.id);
    const nextHref = nextItem ? (nextItem.type === 'guide' ? '#/guide/' + nextItem.id : '#/episode/' + nextItem.id) : '#/learn';
    const nextLabel = nextItem ? (nextItem.type === 'guide' ? 'Next guide: ' + nextItem.guide.title : 'Continue to ' + nextItem.id + ': ' + nextItem.episode.title) : 'Back to the course';
    const locked = nextItem && nextItem.type === 'episode' && TD.course.status(nextItem.episode, d).state === 'locked';

    const article = h('article.guide.card',
      h('header.g-head',
        h('span.g-emoji', g.icon),
        h('div',
          h('span.kicker', 'Guide · ' + g.minutes + ' min read'),
          h('h1', g.title),
          h('p.g-summary', g.summary),
          before ? h('p.small.muted', 'Part of Chapter ' + before.chapter + ', read before Episode ' + before.id + ' (' + before.title + ').') : null)),
      h('div.g-body', renderBlocks(g.blocks, cleanups)),
      h('footer.g-foot',
        h('a.btn.btn-ghost', { href: '#/learn?ch=' + (before ? before.chapter : 12) }, TD.icon('map'), 'Course map'),
        locked
          ? h('span.small.muted', 'The next episode unlocks when you finish the previous one.')
          : h('a.btn.btn-primary.btn-lg', { href: nextHref }, h('span', nextLabel), TD.icon('right'))));

    const nav = h('nav.g-nav',
      gi > 0 ? h('a.small', { href: '#/guide/' + all[gi - 1].id }, '← ' + all[gi - 1].title) : h('span'),
      gi < all.length - 1 ? h('a.small', { href: '#/guide/' + all[gi + 1].id }, all[gi + 1].title + ' →') : h('span'));
    U.clear(root).appendChild(h('div.page.guide-page', article, nav));
    window.scrollTo({ top: 0 });
    return { destroy() { cleanups.forEach((t) => clearInterval(t)); } };
  }

  // ------------------------------------------------------------------ guides library
  function guides(root) {
    const d = TD.store.get();
    const list = TD.course.guides();
    const read = list.filter((g) => d.guides[g.id]).length;
    const byChapter = {};
    list.forEach((g) => {
      const ep = TD.course.episode(g.before);
      const ch = ep ? ep.chapter : 12;
      (byChapter[ch] = byChapter[ch] || []).push(g);
    });
    const sections = Object.keys(byChapter).map(Number).sort((a, b) => a - b).map((ch) => {
      const chapter = TD.course.chapters().find((c) => c.id === ch);
      return h('section.g-lib-sec',
        h('h2.label', 'Chapter ' + ch + (chapter ? ': ' + chapter.title : '')),
        h('div.g-lib-grid', byChapter[ch].map((g) => h('a.g-card' + (d.guides[g.id] ? '.read' : ''), { href: '#/guide/' + g.id },
          h('span.g-card-emoji', g.icon),
          h('strong', g.title),
          h('span.muted.small', g.summary),
          h('span.g-card-foot', g.minutes + ' min read', d.guides[g.id] ? h('span.badge.badge-good', TD.icon('check'), 'Read') : null)))));
    });
    U.clear(root).appendChild(h('div.page',
      h('div.page-head', h('div', h('span.kicker', 'Typing tricks & technique'), h('h1', 'Guides library'), h('p.muted', read + ' of ' + list.length + ' guides read. Each one also appears in your learning path right before the lesson it prepares you for.'))),
      sections));
    return {};
  }

  TD.pages = TD.pages || {};
  TD.pages.learn = learn;
  TD.pages.guide = guide;
  TD.pages.guides = guides;
})(window.TD = window.TD || {});
