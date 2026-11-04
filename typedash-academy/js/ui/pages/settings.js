/* TypeDash Academy — settings: profile, appearance, lesson aids, sound, goals, teacher mode, data. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  function settings(root) {
    const UI = TD.ui.kit;
    const d = TD.store.get();
    const S = d.settings;
    const set = (k) => (v) => { TD.store.setSetting(k, v); };
    const row = (title, desc, control) => h('div.set-row', h('div.set-text', h('strong', title), desc ? h('span', desc) : null), h('div.set-control', control));

    // profile
    const nameInput = h('input', { type: 'text', value: d.name, maxLength: 24, 'aria-label': 'Name' });
    const avatars = h('div.avatar-grid.avatar-grid-sm');
    UI.AVATARS.forEach((a) => {
      const b = h('button.avatar-opt' + (a === d.avatar ? '.on' : ''), { type: 'button', 'aria-label': 'Avatar ' + a.replace('avatar', ''), on: { click: () => { TD.store.setProfile(null, a); U.$$('.avatar-opt', avatars).forEach((x) => x.classList.toggle('on', x === b)); } } }, h('img', { src: UI.avatarSrc(a), alt: '' }));
      avatars.appendChild(b);
    });
    const profile = h('section.card',
      h('div.card-head', h('h2', TD.icon('user'), 'Profile')),
      h('div.set-row', h('div.set-text', h('strong', 'Name')), h('div.set-control.name-ctl', nameInput, h('button.btn', { type: 'button', on: { click: () => { TD.store.setProfile(nameInput.value); UI.toast('Name saved', { icon: 'check' }); } } }, 'Save'))),
      h('div.set-row.set-col', h('div.set-text', h('strong', 'Avatar')), avatars));

    const appearance = h('section.card',
      h('div.card-head', h('h2', TD.icon('sun'), 'Appearance')),
      row('Theme', 'Dark is the classic TypeDash space look.', UI.segmented([{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'System' }], S.theme, set('theme'), 'Theme')),
      row('Text size', 'Size of the text you type.', UI.segmented([{ value: 's', label: 'S' }, { value: 'm', label: 'M' }, { value: 'l', label: 'L' }, { value: 'xl', label: 'XL' }], S.fontSize, set('fontSize'), 'Text size')),
      row('Caret style', null, UI.segmented([{ value: 'line', label: 'Line' }, { value: 'block', label: 'Block' }, { value: 'underline', label: 'Underline' }], S.caret, set('caret'), 'Caret style')),
      row('Smooth caret', 'Glide between letters instead of jumping.', UI.toggle(S.smoothCaret, set('smoothCaret'))));

    const aids = h('section.card',
      h('div.card-head', h('h2', TD.icon('keyboard'), 'Lesson aids')),
      row('On-screen keyboard', 'Shows the next key. Turn off once you stop needing it (no-look steps always hide it).', UI.toggle(S.keyboard, set('keyboard'))),
      row('Hands diagram', 'Highlights the finger to use.', UI.toggle(S.hands, set('hands'))),
      row('Finger colours', 'Colour keys by the finger that owns them.', UI.toggle(S.fingerColors, set('fingerColors'))),
      row('Key hints', 'A line under the text such as "E · Left middle finger · reach up from D".', UI.toggle(S.hints, set('hints'))),
      row('Adaptive focus drills', 'When a step goes badly, add a short drill on the keys you missed.', UI.toggle(S.adaptive, set('adaptive'))),
      row('Error behaviour', 'Lesson default: early chapters stop on errors, later ones let you flow.',
        h('select', { 'aria-label': 'Error behaviour', on: { change: (e) => TD.store.setSetting('errorMode', e.target.value) } },
          [['auto', 'Lesson default (recommended)'], ['stop', 'Stop on error: press the right key'], ['correct', 'Must correct: Backspace first'], ['advance', 'Free typing: keep going']]
            .map(([v, l]) => h('option', { value: v, selected: S.errorMode === v }, l)))));

    const volume = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: S.volume, 'aria-label': 'Volume', on: { change: (e) => { TD.store.setSetting('volume', Number(e.target.value)); TD.sound.click(); } } });
    const sound = h('section.card',
      h('div.card-head', h('h2', TD.icon('volume'), 'Sound')),
      row('Sound effects', 'Soft key clicks, error buzz and celebration chimes.', UI.toggle(S.sound, set('sound'))),
      row('Volume', null, h('div.inline-ctl', volume, h('button.btn.btn-sm', { type: 'button', on: { click: () => TD.sound.success() } }, 'Test'))));

    const goals = h('section.card',
      h('div.card-head', h('h2', TD.icon('target'), 'Goals & teaching')),
      row('Daily practice goal', 'Counts towards your streak ring on the dashboard.', UI.segmented([5, 10, 15, 20, 30].map((m) => ({ value: m, label: m + ' min' })), S.dailyGoal, set('dailyGoal'), 'Daily goal')),
      row('Teacher mode: unlock all lessons', 'Open every episode without completing the previous one. Handy for coaches and for jumping around.', UI.toggle(S.unlockAll, set('unlockAll'))));

    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, on: { change: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const res = TD.store.importJSON(await U.readFile(f));
      if (!res.ok) UI.toast(res.error, { icon: 'info', tone: 'gold' });
      else { UI.toast((res.replaced ? 'Restored ' : 'Imported ') + res.profile.name + "'s progress.", { icon: 'check' }); location.hash = '#/'; }
      fileInput.value = '';
    } } });
    const data = h('section.card',
      h('div.card-head', h('h2', TD.icon('download'), 'Your data')),
      h('p.muted.small', TD.store.isPersistent()
        ? 'Progress is stored in this browser\'s local storage. Clearing site data deletes it, so export a backup now and then (and to move to another computer).'
        : 'Local storage is blocked in this browser, so progress only lasts until you close the tab.'),
      row('Export backup', 'Download this learner\'s progress as a JSON file.', h('button.btn', { type: 'button', on: { click: () => { U.download('typedash-academy-' + d.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + U.dayKey() + '.json', TD.store.exportJSON()); } } }, TD.icon('download'), 'Export')),
      row('Import backup', 'Restore or add a learner from a backup file.', h('div', h('button.btn', { type: 'button', on: { click: () => fileInput.click() } }, TD.icon('upload'), 'Import'), fileInput)),
      row('Reset progress', 'Erase lessons, stats and achievements for ' + d.name + '. Settings are kept.', h('button.btn.btn-danger', { type: 'button', on: { click: () => UI.confirm('Reset all progress?', 'This erases every lesson, star, stat and achievement for ' + d.name + '. It cannot be undone.', { ok: 'Reset progress', danger: true }).then((ok) => { if (ok) { TD.store.resetProgress(); UI.toast('Progress reset. Fresh start!', { icon: 'retry' }); location.hash = '#/'; } }) } }, TD.icon('trash'), 'Reset')));

    U.clear(root).appendChild(h('div.page.settings',
      h('div.page-head', h('div', h('span.kicker', d.name), h('h1', 'Settings'), h('p.muted', 'Changes save instantly.'))),
      h('div.settings-grid', profile, appearance, aids, sound, goals, data),
      h('p.small.muted.about', 'TypeDash Academy · the offline training edition of TypeDash. Works without internet: open index.html directly, or serve the folder to install it as an app.')));
    return {};
  }

  TD.pages = TD.pages || {};
  TD.pages.settings = settings;
})(window.TD = window.TD || {});
