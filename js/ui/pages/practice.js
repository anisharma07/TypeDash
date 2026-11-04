/* TypeDash Academy — practice hub and practice-plan routing. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;
  // Custom text survives a page reload within the tab (sessionStorage, if available).
  let customText = '';
  let customCode = false;
  try { customText = sessionStorage.getItem('tda:custom') || ''; customCode = sessionStorage.getItem('tda:customCode') === '1'; } catch (e) { /* ignore */ }
  function rememberCustom() {
    try { sessionStorage.setItem('tda:custom', customText); sessionStorage.setItem('tda:customCode', customCode ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  const CORPORA = [
    { id: 'sentencesShort', title: 'Short sentences', icon: 'text', desc: 'Lowercase, no punctuation' },
    { id: 'paragraphs', title: 'Paragraphs', icon: 'book', desc: 'Capitals and punctuation' },
    { id: 'speed', title: 'Flow paragraphs', icon: 'bolt', desc: 'Easy words for speed' },
    { id: 'accuracy', title: 'Tricky text', icon: 'target', desc: 'Look-alike words, doubles' },
    { id: 'numbers', title: 'Numbers & dates', icon: 'hash', desc: 'Digits, prices, times' },
    { id: 'chat', title: 'Chat messages', icon: 'users', desc: 'Casual, multi-line' },
    { id: 'emails', title: 'Emails', icon: 'clipboard', desc: 'Greetings and sign-offs' },
    { id: 'news', title: 'News articles', icon: 'list', desc: 'Longer real-world text' },
    { id: 'technical', title: 'Technical writing', icon: 'info', desc: 'Precise vocabulary' },
    { id: 'symbols', title: 'Symbol drills', icon: 'hash', desc: 'Brackets, operators' },
    { id: 'code', title: 'Code snippets', icon: 'code', desc: 'JS, Python, SQL, CSS...' },
    { id: 'longform', title: 'Long-form', icon: 'book', desc: '250-word stories' },
  ];

  function practice(root) {
    const UI = TD.ui.kit;
    const d = TD.store.get();
    const sc = TD.plans.scope(d);
    const weak = TD.stats.weakKeys(d, { limit: 4 });

    // quick drill options
    const q = { rows: ['home', 'top', 'bottom'], seconds: 60, noLook: false, blind: false, metronome: false };
    const rowsBox = h('div.chips');
    [['home', 'Home row'], ['top', 'Top row'], ['bottom', 'Bottom row']].forEach(([id, label]) => {
      const cb = h('input', { type: 'checkbox', checked: true, on: { change: () => { q.rows = U.$$('input', rowsBox).map((x, i) => (x.checked ? ['home', 'top', 'bottom'][i] : null)).filter(Boolean); } } });
      rowsBox.appendChild(h('label.chip.chip-check', cb, label));
    });
    const quickHref = (mode, extra) => {
      const o = Object.assign({ mode, rows: q.rows.join(','), s: q.seconds, nolook: q.noLook ? 1 : 0, blind: q.blind ? 1 : 0, metro: q.metronome ? 1 : 0 }, extra || {});
      return '#/practice/quick?' + Object.entries(o).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
    };
    const go = (mode, extra) => { location.hash = quickHref(mode, extra); };

    const hero = h('div.practice-hero',
      h('a.card.ph-card.ph-workout', { href: '#/practice/workout' },
        h('span.ph-icon', TD.icon('dumbbell')),
        h('div', h('span.kicker', 'Recommended daily'), h('h2', '10-minute workout'), h('p.muted', 'Warm-up, your weak keys, common words, patterns and a speed burst, generated fresh for you every day.')),
        h('span.btn.btn-primary', 'Start workout', TD.icon('right'))),
      h('a.card.ph-card', { href: '#/practice/weak' },
        h('span.ph-icon.ph-violet', TD.icon('sparkles')),
        h('div', h('span.kicker', 'Adaptive'), h('h2', 'Weak-key drill'),
          weak.length
            ? h('p.muted', 'Targets ', h('span.inline-keys', weak.map((w) => h('kbd', TD.kb.label(w.key)))), '. First isolated, then in real words.')
            : h('p.muted', 'Needs a little typing history first. Until then it is a balanced drill.')),
        h('span.btn', 'Start drill', TD.icon('right'))));

    const quick = h('section.card',
      h('div.card-head', h('h2', TD.icon('keyboard'), 'Row drills')),
      h('p.muted', 'Real words that only use the rows you pick. Great for polishing a row you just learned.'),
      h('div.form-row', h('span.form-label', 'Rows'), rowsBox),
      h('div.form-row', h('span.form-label', 'Length'), UI.segmented([{ value: 30, label: '30 s' }, { value: 60, label: '1 min' }, { value: 120, label: '2 min' }, { value: 0, label: '40 words' }], q.seconds, (v) => { q.seconds = v; })),
      h('div.form-row.options',
        UI.toggle(false, (v) => { q.noLook = v; }, 'No-look mode (hide keyboard)'),
        UI.toggle(false, (v) => { q.blind = v; }, 'Blind mode (no colour feedback)'),
        UI.toggle(false, (v) => { q.metronome = v; }, 'Rhythm metronome')),
      h('div.stage-actions', h('button.btn.btn-primary', { type: 'button', on: { click: () => (q.rows.length ? go('rows') : UI.toast('Pick at least one row.', { icon: 'info' })) } }, TD.icon('play'), 'Start row drill')));

    const words = h('section.card',
      h('div.card-head', h('h2', TD.icon('list'), 'Common words')),
      h('p.muted', 'The most frequent English words make up most of everything you type. Master them and your speed follows.'),
      h('div.word-sets', [100, 200, 500, 1000].map((n) => h('button.word-set', { type: 'button', on: { click: () => go('words', { top: n }) } },
        h('strong', 'Top ' + n), h('span.muted.small', n === 100 ? 'the core' : n === 200 ? 'everyday' : n === 500 ? 'broad' : 'full range')))),
      !sc.all ? h('p.small.muted.mt-8', 'Tip: these use every letter. You have learned ' + sc.letters.length + ' of 26 so far, so expect a few new keys.') : null);

    const real = h('section.card',
      h('div.card-head', h('h2', TD.icon('book'), 'Real-world text')),
      h('p.muted', 'Sentences, emails, chats, numbers and code. Untimed: finish the text at your own pace.'),
      h('div.corpus-grid', CORPORA.map((c) => h('button.corpus-btn', { type: 'button', on: { click: () => go('corpus', { corpus: c.id, title: c.title, s: 0 }) } },
        TD.icon(c.icon), h('span', h('strong', c.title), h('small.muted', c.desc))))));

    const ta = h('textarea', { placeholder: 'Paste an article, your notes, a poem, some code...', 'aria-label': 'Custom text', value: customText });
    const codeToggle = UI.toggle(customCode, (v) => { customCode = v; }, 'Code mode (keep indentation, auto-indent after Enter)');
    const custom = h('section.card',
      h('div.card-head', h('h2', TD.icon('clipboard'), 'Custom text')),
      h('p.muted', 'Practise on anything. Curly quotes, dashes and emoji are converted or removed so every character is typable.'),
      ta,
      h('div.form-row.options', codeToggle),
      h('div.stage-actions', h('button.btn.btn-primary', {
        type: 'button',
        on: { click: () => {
          customText = ta.value;
          if (customText.trim().length < 5) { UI.toast('Paste or type at least a few words first.', { icon: 'info' }); return; }
          rememberCustom();
          location.hash = '#/practice/custom';
        } },
      }, TD.icon('play'), 'Practise this text')));

    U.clear(root).appendChild(h('div.page.practice',
      h('div.page-head', h('div', h('span.kicker', 'Free practice'), h('h1', 'Practice'), h('p.muted', 'Short, focused drills. Nothing to unlock: just reps that count towards your streak and stats.'))),
      hero,
      h('div.practice-grid', quick, words, real, custom)));
    return {};
  }

  /** Build the plan for #/practice/:mode. Returns null if the mode is unknown. */
  function planFor(mode, query) {
    const d = TD.store.get();
    switch (mode) {
      case 'workout': return TD.plans.workout(d);
      case 'weak': return TD.plans.weak(d);
      case 'custom': return customText.trim() ? TD.plans.custom(customText, { code: customCode, keepSpaces: customCode }) : null;
      case 'quick': {
        const o = {
          mode: query.mode || 'rows',
          rows: (query.rows || 'home,top,bottom').split(',').filter(Boolean),
          seconds: Number(query.s) || 0,
          noLook: query.nolook === '1',
          blind: query.blind === '1',
          metronome: query.metro === '1',
          top: Number(query.top) || 200,
          corpus: query.corpus,
          title: query.title,
        };
        return TD.plans.quick(d, o);
      }
      default: return null;
    }
  }

  TD.pages = TD.pages || {};
  TD.pages.practice = practice;
  TD.pages.practicePlan = planFor;
})(window.TD = window.TD || {});
