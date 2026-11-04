/* TypeDash Academy — Backup & transfer page: export progress to a file, import it in any browser. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  const progressLine = (s) => s.done + '/' + s.total + ' episodes · ★ ' + s.stars + (s.best ? ' · best ' + s.best + ' WPM' : '') + ' · ' + U.plural(s.sessions, 'session') + (s.last ? ' · last active ' + U.fmtDate(s.last, true) : '');

  function optionText(it, o) {
    const here = it.match && it.match.summary ? it.match.summary.name : '';
    switch (o) {
      case 'add': return it.match
        ? ['Import as a separate learner', 'Keeps both learners. The imported one gets a slightly different name.']
        : ['Import', 'Adds this learner to this browser.'];
      case 'merge': return it.match.sameId
        ? ['Merge with the copy in this browser (recommended)', 'Keeps the best of both: every finished lesson, the highest stars and records, all sessions and practice days.']
        : ['Merge into "' + here + '" in this browser', 'Use this if they are the same person. Keeps the best of both copies.'];
      case 'replace': return ['Replace the copy in this browser', 'This browser ends up exactly like the file. Anything practised here after the backup is lost.'];
      case 'copy': return ['Import as a copy', 'Adds the file\'s version as a second learner next to the existing one.'];
      default: return ['Skip', 'Leave this learner out.'];
    }
  }

  function backup(root) {
    const UI = TD.ui.kit;
    const d = TD.store.get();
    let scope = 'learner';

    // ---------------------------------------------------------------- export
    let exportCard;
    if (d) {
      const all = TD.store.profiles();
      const summaryEl = h('p.exp-summary');
      const lastEl = h('p.small.muted');
      const refresh = () => {
        if (scope === 'all') {
          const s = all.map((e) => TD.backup.summary(TD.store.peek(e.id))).filter(Boolean);
          summaryEl.textContent = s.length + ' learners: ' + s.map((x) => x.name + ' (' + x.done + '/' + x.total + ' episodes)').join(', ');
        } else {
          const s = TD.backup.summary(d);
          summaryEl.textContent = s.name + ': ' + progressLine(s) + ' · ' + U.fmtDuration(s.ms) + ' practised';
        }
        const lb = TD.store.get().lastBackup;
        lastEl.textContent = lb ? 'Last backup: ' + U.timeAgo(lb) + ' (' + U.fmtDate(lb, true) + ').' : d.name + ' has never been backed up.';
      };
      exportCard = h('section.card.exp-card',
        h('div.card-head', h('h2', TD.icon('download'), 'Export')),
        h('p.muted', 'Download a backup file of your progress. Keep it safe, or use it to continue on another browser or computer.'),
        all.length > 1 ? h('div.form-row', h('span.form-label', 'Include'),
          UI.segmented([{ value: 'learner', label: 'Only ' + d.name }, { value: 'all', label: 'All ' + all.length + ' learners' }], scope, (v) => { scope = v; refresh(); }, 'What to export')) : null,
        summaryEl,
        h('ul.include-list', [
          'Lessons, stars and unlocked chapters',
          'Every session, speed and accuracy',
          'Weak keys, heatmaps and Typing DNA',
          'Records, ghosts, achievements and streak days',
          'Settings, name and avatar',
        ].map((t) => h('li', TD.icon('check'), t))),
        lastEl,
        h('div.stage-actions', h('button.btn.btn-primary.btn-lg', {
          type: 'button',
          on: { click: () => {
            const b = TD.backup.download({ scope });
            if (!b) return;
            UI.toast(b.filename, { title: 'Backup downloaded', icon: 'download' });
            refresh();
          } },
        }, TD.icon('download'), 'Download backup')));
      refresh();
    } else {
      exportCard = h('section.card.exp-card',
        h('div.card-head', h('h2', TD.icon('download'), 'Export')),
        h('p.muted', 'There are no learners in this browser yet, so there is nothing to export. Import a backup file to bring your progress here, or go back and create a new learner.'),
        h('a.btn', { href: '#/welcome' }, TD.icon('plus'), 'Create a new learner instead'));
    }

    // ---------------------------------------------------------------- import
    const input = h('input', { type: 'file', accept: '.json,application/json', hidden: true, 'aria-label': 'Backup file' });
    const zone = h('div.dropzone', { tabindex: '0', role: 'button', 'aria-label': 'Choose a backup file to import' },
      TD.icon('upload'),
      h('strong', 'Drop your backup file here'),
      h('span.muted.small', 'or'),
      h('span.btn.btn-sm', 'Choose file'),
      h('span.small.muted', 'The .json file you downloaded from TypeDash Academy'));
    const previewEl = h('div.import-preview', { 'aria-live': 'polite' });

    async function readFile(file) {
      if (!file) return;
      let text;
      try { text = await U.readFile(file); } catch (e) { text = null; }
      if (text == null) { renderPreview({ ok: false, error: 'This file could not be opened.' }); return; }
      renderPreview(TD.backup.parse(text), file.name);
    }
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { readFile(input.files[0]); input.value = ''; });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag');
      readFile(e.dataTransfer && e.dataTransfer.files[0]);
    });
    // Dropping a file anywhere else on the page must not navigate away from the app.
    const block = (e) => { if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')) e.preventDefault(); };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);

    function renderPreview(parsed, fileName) {
      U.clear(previewEl);
      zone.hidden = !!parsed.ok;
      if (!parsed.ok) {
        previewEl.append(h('div.notice.notice-warn', TD.icon('info'), h('span', h('b', 'Cannot import this file. '), parsed.error)));
        return;
      }
      const go = h('button.btn.btn-primary.btn-lg', { type: 'button' }, TD.icon('upload'), h('span'));
      const updateGo = () => {
        const n = parsed.items.filter((x) => x.action !== 'skip').length;
        go.disabled = !n;
        go.lastChild.textContent = n ? 'Import ' + U.plural(n, 'learner') : 'Nothing selected';
      };
      previewEl.append(h('div.ip-head',
        h('span', 'Found ', h('b', U.plural(parsed.items.length, 'learner')), ' in ', h('code', { text: fileName || 'backup' })),
        parsed.meta.exported ? h('span.muted.small', 'Backup made on ' + U.fmtDate(Date.parse(parsed.meta.exported), true)) : null));
      parsed.warnings.forEach((w) => previewEl.append(h('div.notice.notice-warn', TD.icon('info'), h('span', w))));
      parsed.items.forEach((it, i) => {
        const s = it.summary;
        const status = !it.match ? h('span.badge.badge-good', 'New in this browser')
          : it.match.sameId ? h('span.badge', 'Already in this browser') : h('span.badge.badge-warn', 'Same name as a learner here');
        const opts = h('div.ii-opts', { role: 'radiogroup', 'aria-label': 'What to do with ' + s.name });
        it.options.forEach((o) => {
          const [label, desc] = optionText(it, o);
          const radio = h('input', { type: 'radio', name: 'imp-' + i, value: o, checked: o === it.action });
          const row = h('label.ii-opt' + (o === it.action ? '.on' : ''), radio, h('span', h('strong', label), h('small', desc)));
          radio.addEventListener('change', () => {
            it.action = o;
            U.$$('.ii-opt', opts).forEach((x) => x.classList.toggle('on', x === row));
            updateGo();
          });
          opts.appendChild(row);
        });
        previewEl.append(h('div.import-item',
          UI.avatar(s.avatar, 'avatar-lg'),
          h('div.ii-body',
            h('div.ii-head', h('strong', { text: s.name }), status),
            h('div.ii-sum', h('span.ii-tag', 'In the file'), progressLine(s)),
            it.match ? h('div.ii-sum', h('span.ii-tag', 'In this browser'), progressLine(it.match.summary)) : null,
            opts)));
      });
      go.addEventListener('click', () => {
        go.disabled = true;
        renderResult(TD.backup.apply(parsed.items));
      });
      updateGo();
      previewEl.append(h('div.stage-actions',
        h('button.btn.btn-ghost', { type: 'button', on: { click: () => { U.clear(previewEl); zone.hidden = false; } } }, 'Choose another file'),
        go));
      previewEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function renderResult(res) {
      U.clear(previewEl);
      if (!res.ok) {
        previewEl.append(h('div.notice.notice-warn', TD.icon('info'), h('span', res.error)));
        zone.hidden = false;
        return;
      }
      const VERB = { add: 'added', merge: 'merged with the copy in this browser', replace: 'replaced the copy in this browser', copy: 'added as a copy' };
      const activeId = TD.store.activeId();
      previewEl.append(
        h('div.notice.notice-good', TD.icon('check'), h('div',
          h('b', res.results.length ? 'Import complete.' : 'Nothing was imported.'),
          h('ul.list-plain.result-list', res.results.map((r) => h('li',
            h('span', { text: r.name + ': ' + VERB[r.action] }),
            r.id !== activeId ? h('button.linkish', { type: 'button', on: { click: () => { TD.store.switchTo(r.id); UI.toast('Switched to ' + r.name, { icon: 'user' }); location.hash = '#/'; } } }, 'Switch to ' + r.name) : null))))),
        h('div.stage-actions',
          res.results.length ? h('button.btn.btn-ghost', { type: 'button', on: { click: undoNow } }, TD.icon('retry'), 'Undo import') : null,
          h('a.btn.btn-primary', { href: '#/' }, 'Go to dashboard', TD.icon('right'))));
      if (res.results.length) TD.sound.success();
    }

    function undoNow() {
      if (!TD.backup.undo()) { UI.toast('There is nothing to undo.', { icon: 'info' }); return; }
      UI.toast('Import undone. Everything is back as it was.', { icon: 'retry' });
      TD.router.go(TD.store.get() ? '/backup' : '/welcome', true);
    }

    const importCard = h('section.card.imp-card',
      h('div.card-head', h('h2', TD.icon('upload'), 'Import')),
      h('p.muted', 'Bring progress into this browser from a backup file. You will see exactly what is in the file before anything changes.'),
      zone, input, previewEl);

    const u = TD.backup.undoInfo();
    const undoBanner = u && u.results.length ? h('div.notice.notice-info', TD.icon('info'),
      h('span', 'You imported a backup ' + U.timeAgo(u.t) + ' (' + u.results.map((r) => r.name).join(', ') + '). ',
        h('button.linkish', { type: 'button', on: { click: undoNow } }, 'Undo that import'))) : null;

    const steps = h('ol.bsteps',
      [
        ['Download a backup', 'Here, in the browser you have been practising in.'],
        ['Move the file', 'USB stick, email, cloud drive or chat: anything that gets the file to the other device.'],
        ['Import it there', 'Open TypeDash Academy in the other browser and import the file. The same browser works too.'],
      ].map(([t, s], i) => h('li.bstep', h('span.bstep-num', String(i + 1)), h('div', h('strong', t), h('span.small.muted', s)))));

    const tips = h('section.card.tips-card',
      h('div.card-head', h('h2', TD.icon('info'), 'Good to know')),
      h('ul.g-list',
        h('li', { html: '<b>Merge never loses progress.</b> Practising on two devices? Import the newer file and pick Merge to combine both.' }),
        h('li', { html: '<b>Same browser restores too.</b> Cleared your browsing data or reset a learner by mistake? Import your last backup.' }),
        h('li', { html: '<b>Private by design.</b> The file stays on your device unless you share it. Nothing is uploaded anywhere.' }),
        h('li', { html: '<b>Back up regularly.</b> Browsers can wipe site data, especially in private windows or when storage runs low.' })));

    U.clear(root).appendChild(h('div.page.backup',
      h('div.page-head',
        h('div',
          h('span.kicker', d ? 'Your data' : 'Restore your progress'),
          h('h1', 'Backup & transfer'),
          h('p.muted', 'Save your progress to a file, then open it in any browser or on any computer and carry on where you left off.')),
        d ? null : h('a.btn.btn-ghost', { href: '#/welcome' }, TD.icon('left'), 'Back')),
      steps,
      undoBanner,
      h('div.two-col.backup-cols', d ? exportCard : importCard, d ? importCard : exportCard),
      tips));

    return {
      destroy() {
        window.removeEventListener('dragover', block);
        window.removeEventListener('drop', block);
      },
    };
  }

  TD.pages = TD.pages || {};
  TD.pages.backup = backup;
})(window.TD = window.TD || {});
