/* TypeDash Academy — the player: runs an episode or practice plan step by step and shows results. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const h = U.h;

  const MODE_HINT = {
    stop: 'Wrong key? Just press the right one. Errors still count, so aim first.',
    correct: 'Wrong key? Press Backspace to remove it, then type the right key.',
    advance: 'Keep the flow going. Backspace fixes mistakes.',
  };
  const STEP_ICON = { learn: 'book', keys: 'keyboard', type: 'text', timed: 'clock' };

  function Player(root, plan, hooks) {
    hooks = hooks || {};
    const UI = TD.ui.kit;
    const data = TD.store.get();
    const S = data.settings;
    const steps = plan.steps.map((s) => Object.assign({}, s));
    let idx = 0;
    let phase = 'overview';
    const results = [];
    let cur = null;
    let paused = false;
    let insertedCount = 0;
    let destroyed = false;
    let ignoreUntil = 0;
    let deadWarned = false;
    let overviewTimer = null;
    let resultsActions = {};

    document.body.classList.add('focus-mode');
    const top = h('header.player-top');
    const main = h('main.player-main', { id: 'main-content' });
    const shell = h('div.player', top, main);
    U.clear(root).appendChild(shell);

    // ---------------------------------------------------------------- chrome
    function renderTop() {
      U.clear(top);
      const soundBtn = h('button.btn-icon', {
        type: 'button', title: 'Sound (on/off)', 'aria-label': 'Toggle sound',
        on: { click: () => { TD.store.setSetting('sound', !S.sound); soundBtn.replaceChildren(TD.icon(S.sound ? 'volume' : 'mute')); } },
      }, TD.icon(S.sound ? 'volume' : 'mute'));
      top.append(
        h('button.btn.btn-ghost.btn-sm.pt-back', { type: 'button', on: { click: () => exit() } }, TD.icon('left'), h('span.hide-sm', hooks.backLabel || 'Back')),
        h('div.pt-title', h('span.kicker', plan.kicker || ''), h('strong', plan.title)),
        h('div.pt-dots', { 'aria-label': 'Step ' + (idx + 1) + ' of ' + steps.length },
          steps.map((s, i) => h('span.pt-dot' + (phase === 'results' || i < idx ? '.done' : '') + (i === idx && phase !== 'overview' && phase !== 'results' ? '.cur' : '') + (s.inserted ? '.extra' : ''), { title: s.title }))),
        h('div.pt-tools', soundBtn,
          h('button.btn-icon', { type: 'button', title: 'Pause (Esc)', 'aria-label': 'Pause', on: { click: () => (phase === 'step' ? pause() : null) } }, TD.icon('pause'))));
    }

    function exit(force) {
      const busy = phase === 'step' && cur && cur.session && cur.session.started && !cur.session.finished;
      const go = () => { location.hash = hooks.backTo || '#/learn'; };
      if (busy && !force) {
        if (cur.session) cur.session.pause();
        UI.confirm('Leave this session?', 'Your current step will not be scored. Practice time is still counted.', { ok: 'Leave', cancel: 'Keep typing' })
          .then((ok) => { if (ok) go(); else if (cur && cur.session && !paused) cur.session.resume(); });
      } else go();
    }

    function cleanupStep() {
      clearInterval(overviewTimer);
      overviewTimer = null;
      if (!cur) return;
      cancelAnimationFrame(cur.raf);
      clearInterval(cur.metro);
      if (cur.view) cur.view.destroy();
      cur = null;
    }

    // ---------------------------------------------------------------- generation context
    function genCtx(step) {
      const allowed = plan.keys && plan.keys !== '*' ? new Set(plan.keys) : null;
      const letters = allowed ? new Set([...allowed].filter((c) => /[a-z]/.test(c))) : null;
      return {
        allowed,
        weakKeys: step.focusKeys || plan.focusKeys || TD.stats.weakKeys(data, { allowed: letters, limit: 4 }).map((w) => w.key),
        weakBigrams: TD.stats.weakBigrams(data, { allowed: letters, limit: 3 }).map((b) => b.key),
      };
    }

    function aids(step, force) {
      const opts = step.options || {};
      const show = force || (S.keyboard && !opts.hideKeyboard);
      const kb = show ? TD.ui.Keyboard({ colors: S.fingerColors }) : null;
      if (kb) kb.setDim(plan.keys);
      const hands = show && S.hands ? TD.ui.Hands({ colors: S.fingerColors }) : null;
      const hint = h('div.hint-line', { 'aria-live': 'off' });
      const el = h('div.aids' + (show ? '' : '.aids-hidden'),
        show ? h('div.aids-kb', kb.el)
          : opts.hideKeyboard ? h('div.nolook', TD.icon('eyeoff'), h('div', h('strong', 'No-look mode'), h('span', 'The keyboard is hidden. Trust your fingers and keep your eyes on the text.')))
            : null,
        hands ? h('div.aids-hands', hands.el) : null);
      function point(ch, blocked) {
        if (blocked) {
          if (kb) { kb.clear(); kb.keyEls.Backspace.classList.add('next'); }
          if (hands) hands.highlight('rp');
          hint.textContent = 'Press Backspace to remove the wrong key';
          return;
        }
        const info = kb ? kb.highlight(ch) : TD.kb.info(ch);
        if (hands) hands.highlight(info && info.finger, info && info.shiftKey ? (info.shiftKey === 'ShiftLeft' ? 'lp' : 'rp') : null);
        hint.textContent = S.hints && show && ch != null ? TD.kb.label(ch) + ' · ' + TD.kb.describe(ch) : '';
      }
      return { el, kb, hands, hint, point, show };
    }

    // ---------------------------------------------------------------- overview
    function showOverview() {
      phase = 'overview';
      renderTop();
      const ep = plan.episode;
      const prog = ep ? data.episodes[ep.id] : null;
      const kb = TD.ui.Keyboard({ colors: S.fingerColors });
      kb.setDim(plan.keys);
      const newKeys = [...(plan.newKeys || '')].filter((c) => c.trim());
      if (newKeys.length) kb.mark(newKeys.join(''), 'new');
      const hands = TD.ui.Hands({ colors: S.fingerColors });
      const goals = [];
      if (plan.goals) {
        goals.push(h('span.goal', TD.icon('target'), h('span', 'Accuracy ', h('b', plan.goals.accuracy + '%'))));
        goals.push(h('span.goal', TD.icon('bolt'), h('span', 'Speed ', h('b', plan.goals.wpm + ' WPM'))));
      }
      if (plan.pass && (plan.pass.wpm || ep)) goals.push(h('span.goal.goal-pass', TD.icon('check'), h('span', 'Pass: ', h('b', plan.pass.accuracy + '%' + (plan.pass.wpm ? ' + ' + plan.pass.wpm + ' WPM' : '')))));
      if (plan.minutes) goals.push(h('span.goal', TD.icon('clock'), h('span', '~' + plan.minutes + ' min')));
      const start = h('button.btn.btn-primary.btn-lg', { type: 'button', on: { click: () => startStep(0) } }, TD.icon('play'), 'Start', h('kbd.kbd-inline', 'Enter'));
      const card = h('section.ov.card',
        h('div.ov-main',
          h('span.kicker', plan.kicker || ''),
          h('h1.ov-title', plan.title),
          plan.summary ? h('p.ov-summary', plan.summary) : null,
          plan.intro ? h('p.ov-intro', { html: U.md(plan.intro) }) : null,
          goals.length ? h('div.goals', goals) : null,
          newKeys.length ? h('div.ov-newkeys', h('h3.label', 'New keys'),
            newKeys.map((c) => h('div.nk', h('kbd.key-lg', { dataset: { f: TD.kb.fingerOf(c) || '' } }, TD.kb.label(c)), h('span', TD.kb.describe(c))))) : null,
          h('h3.label', 'In this ' + (plan.kind === 'episode' ? 'episode' : 'session')),
          h('ol.ov-steps', steps.map((s) => h('li', TD.icon(STEP_ICON[s.type] || 'text'), h('span', s.title), s.seconds ? h('small', s.seconds + 's') : null))),
          prog && prog.attempts ? h('div.ov-best', h('span.muted', 'Your best'), UI.stars(prog.stars || 0), h('span', (prog.bestWpm || 0) + ' WPM · ' + (prog.bestAcc || 0) + '%')) : null,
          h('div.ov-actions', start)),
        h('div.ov-side',
          h('div.ov-kb', kb.el),
          S.hands ? h('div.ov-hands', hands.el) : null,
          plan.tip ? h('div.tipbox', h('div.tipbox-label', '💡 Tip'), h('p', { html: U.md(plan.tip) })) : null));
      U.clear(main).appendChild(card);
      if (U.isTouchOnly()) main.prepend(h('div.notice.notice-warn', TD.icon('keyboard'), 'TypeDash Academy needs a physical keyboard. Connect one to type the lessons.'));
      const cycleKeys = newKeys.length ? newKeys : [...(plan.keys && plan.keys !== '*' ? plan.keys : '')].slice(0, 8);
      if (cycleKeys.length) {
        let i = 0;
        const cyc = () => {
          const info = kb.highlight(cycleKeys[i++ % cycleKeys.length]);
          hands.highlight(info && info.finger);
        };
        cyc();
        overviewTimer = setInterval(cyc, 1100);
      }
      setTimeout(() => start.focus({ preventScroll: true }), 50);
    }

    // ---------------------------------------------------------------- steps
    function startStep(i) {
      cleanupStep();
      paused = false;
      idx = i;
      if (idx >= steps.length) { finishPlan(); return; }
      phase = 'step';
      renderTop();
      const step = steps[idx];
      TD.sound.prime();
      if (step.type === 'learn') renderLearn(step);
      else if (step.type === 'keys') renderKeys(step);
      else renderTyping(step);
      window.scrollTo({ top: 0 });
    }

    function stepHead(step, liveEl) {
      return h('div.stage-head',
        h('div.sh-left',
          h('span.step-no', 'Step ' + (idx + 1) + ' of ' + steps.length + (step.inserted ? ' · adaptive extra' : '')),
          h('h2', step.title),
          step.text ? h('p.sh-text', { html: U.md(step.text) }) : null),
        liveEl || null);
    }

    function renderLearn(step) {
      const a = aids({ options: {} }, true);
      const cont = h('button.btn.btn-primary', { type: 'button', on: { click: () => nextStep() } }, 'Continue', h('kbd.kbd-inline', 'Enter'));
      const stage = h('section.stage.stage-learn.card',
        stepHead(step),
        a.el,
        a.hint,
        h('div.stage-actions', cont));
      U.clear(main).appendChild(stage);
      if (a.kb) { a.kb.setDim(plan.keys); if (step.keys) a.kb.mark(step.keys, 'lit'); }
      const keys = [...(step.keys || '')].filter((c) => c.trim());
      if (keys.length) {
        let k = 0;
        const cyc = () => a.point(keys[k++ % keys.length]);
        cyc();
        overviewTimer = setInterval(cyc, 1000);
      }
      cur = { kind: 'learn', onKey(e) { if (e.key === 'Enter') { e.preventDefault(); nextStep(); } else if (e.key === 'Escape') { e.preventDefault(); exit(); } } };
      setTimeout(() => cont.focus({ preventScroll: true }), 50);
    }

    // "Find the key" game
    function renderKeys(step) {
      const pool = [...step.keys].filter((c) => c.trim());
      const count = step.count || pool.length;
      let seq;
      if (step.order === 'sequence') seq = Array.from({ length: count }, (_, j) => pool[j % pool.length]);
      else {
        seq = [];
        while (seq.length < count) {
          const c = U.pick(pool);
          if (pool.length > 1 && c === seq[seq.length - 1]) continue;
          seq.push(c);
        }
      }
      const a = aids(step);
      const target = h('div.kg-target', { 'aria-live': 'polite' });
      const counter = h('div.kg-count');
      const bar = UI.progress(0);
      let k = 0;
      let hits = 0;
      let misses = 0;
      let t0 = 0;
      let tPrev = 0;
      const times = [];
      function show() {
        const c = seq[k];
        target.textContent = TD.kb.label(c);
        target.dataset.f = TD.kb.fingerOf(c) || '';
        counter.textContent = (k + 1) + ' / ' + seq.length;
        bar.firstChild.style.width = (k / seq.length) * 100 + '%';
        a.point(c);
      }
      const stage = h('section.stage.card',
        stepHead(step, h('div.live', h('div.live-item', h('span', 'Accuracy'), h('strong.kg-acc', '100%')), h('div.live-item', h('span', 'Key'), counter))),
        h('div.kg', target, h('p.kg-help', a.show ? 'Find the glowing key on your keyboard and press it.' : 'Find this key without looking at the keyboard.')),
        bar,
        a.hint,
        a.el);
      U.clear(main).appendChild(stage);
      const accEl = stage.querySelector('.kg-acc');
      show();
      cur = {
        kind: 'keys',
        onKey(e) {
          if (e.key === 'Escape') { e.preventDefault(); pause(); return; }
          const act = TD.engine.actionFromEvent(e);
          if (!act || act.type !== 'char') return;
          e.preventDefault();
          const now = performance.now();
          if (!t0) { t0 = now; tPrev = now; }
          const want = seq[k];
          const ok = act.ch === want || (/[a-z]/.test(want) && act.ch.toLowerCase() === want);
          if (ok) {
            hits++;
            times.push(now - tPrev);
            tPrev = now;
            if (a.kb) a.kb.flash(act.ch, true);
            TD.sound.click();
            target.classList.remove('pop'); void target.offsetWidth; target.classList.add('pop');
            k++;
            if (k >= seq.length) {
              bar.firstChild.style.width = '100%';
              const ms = now - t0;
              TD.stats.addTime(data, ms, 0);
              TD.store.saveSoon();
              stepDone({ kind: 'keys', step, res: { acc: (hits / (hits + misses)) * 100, keystrokes: hits + misses, errors: misses, ms, chars: 0, reaction: Math.round(U.avg(times.slice(1))) } });
              return;
            }
            show();
          } else {
            misses++;
            if (a.kb) a.kb.flash(act.ch, false);
            TD.sound.error();
            target.classList.remove('shake'); void target.offsetWidth; target.classList.add('shake');
          }
          accEl.textContent = Math.round((hits / (hits + misses)) * 100) + '%';
        },
      };
    }

    function renderTyping(step) {
      const opts = step.options || {};
      const ctx = genCtx(step);
      const timed = step.type === 'timed';
      const sep = TD.gen.streamSeparator(step.source);
      const text = TD.gen.generate(step.source, ctx) || 'asdf jkl;';
      const session = TD.engine.create({
        text,
        mode: opts.errorMode || 'advance',
        noBackspace: opts.noBackspace,
        lives: opts.lives,
        timeLimit: timed ? step.seconds : 0,
        autoIndent: opts.autoIndent,
        more: timed ? () => sep + TD.gen.generate(step.source, ctx) : null,
      });
      const multiline = text.includes('\n');
      const view = TD.ui.TypingView(session, { caret: S.caret, smooth: S.smoothCaret, blind: opts.blind, lines: multiline ? 5 : 3 });
      const a = aids(step);

      // live readouts
      const wpmEl = h('strong', '0');
      const accEl = h('strong', '100%');
      const timeEl = h('strong', timed ? U.fmtClock(step.seconds * 1000) : '0:00');
      const live = h('div.live',
        h('div.live-item', h('span', 'WPM'), wpmEl),
        h('div.live-item', h('span', 'Accuracy'), accEl),
        h('div.live-item' + (timed ? '.live-timer' : ''), h('span', timed ? 'Time left' : 'Time'), timeEl));
      let heartsEl = null;
      if (opts.lives) {
        heartsEl = h('div.live-item.lives', h('span', 'Lives'), h('div.hearts'));
        live.appendChild(heartsEl);
      }
      const drawHearts = () => {
        if (!heartsEl) return;
        const box = heartsEl.querySelector('.hearts');
        U.clear(box);
        for (let i = 0; i < opts.lives; i++) box.appendChild(TD.icon('heart', i < session.livesLeft ? 'on' : 'off'));
      };
      drawHearts();

      // ghost
      let ghostTimes = null;
      let ghostRec = null;
      if (opts.ghost) {
        ghostRec = data.records[opts.ghost === 'pb' ? 'ep:' + plan.id : opts.ghost] || null;
        if (ghostRec && ghostRec.ghost) ghostTimes = TD.stats.decodeGhost(ghostRec.ghost);
      }
      const ghostIndex = (t) => {
        let lo = 0;
        let hi = ghostTimes.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (ghostTimes[mid] <= t) lo = mid + 1; else hi = mid; }
        return lo;
      };

      // badges
      const badges = [];
      if (opts.hideKeyboard) badges.push(h('span.badge', TD.icon('eyeoff'), 'No-look'));
      if (opts.blind) badges.push(h('span.badge', TD.icon('eyeoff'), 'Blind: feedback at the end'));
      if (opts.noBackspace) badges.push(h('span.badge.badge-warn', TD.icon('x'), 'Backspace disabled'));
      if (opts.lives) badges.push(h('span.badge.badge-warn', TD.icon('heart'), opts.lives + ' lives'));
      if (opts.record) badges.push(h('span.badge', TD.icon('trophy'), 'Counts as an official ' + opts.record.replace('test', '') + 's test'));
      let metroDot = null;
      if (opts.metronome) {
        metroDot = h('span.metro-dot');
        badges.push(h('span.badge.badge-metro', metroDot, TD.icon('music'), 'Metronome ' + autoCpm(opts.metronome) + ' keys/min'));
      }
      if (opts.ghost) {
        badges.push(ghostTimes
          ? h('span.badge.badge-ghost', TD.icon('ghost'), 'Ghost: your best ' + Math.round(ghostRec.wpm) + ' WPM')
          : h('span.badge', TD.icon('ghost'), 'No record yet: this run becomes your ghost'));
      }
      const caps = h('span.badge.badge-warn.caps', { hidden: true }, TD.icon('info'), 'Caps Lock is on');
      badges.push(caps);

      const startHint = h('div.start-hint', TD.icon('keyboard'), timed ? 'Start typing: the clock starts on your first key' : 'Start typing when you are ready');
      const prog = UI.progress(0, 'thin');
      const modeHint = h('p.mode-hint', opts.noBackspace ? 'Backspace is off: if you slip, keep going.' : MODE_HINT[opts.errorMode || 'advance']);
      const stage = h('section.stage.card',
        stepHead(step, live),
        h('div.badges', badges),
        h('div.tv-card' + (a.show ? '' : '.tv-card-big'), view.el, startHint),
        timed ? null : prog,
        a.hint,
        modeHint,
        a.el);
      U.clear(main).appendChild(stage);
      a.point(session.text[session.pos]);

      const c = { kind: 'type', step, session, view, kb: a.kb, raf: 0, metro: 0 };
      cur = c;
      session.on((evt) => {
        view.update(evt);
        switch (evt.type) {
          case 'start': startHint.classList.add('gone'); break;
          case 'ok': TD.sound.click(); if (a.kb) a.kb.flash(session.text[evt.pos], true); break;
          case 'wrong':
          case 'miss': TD.sound.error(); if (a.kb) a.kb.flash(evt.typed, false); break;
          case 'blocked': TD.sound.error(); break;
          case 'denied': TD.sound.error(); UI.toast('Backspace is disabled in this challenge. Keep going!', { icon: 'info', timeout: 1800 }); break;
          case 'life': drawHearts(); break;
          case 'finish': setTimeout(() => finishTyping(c), 0); return;
          default: break;
        }
        if (!session.finished) a.point(session.text[session.pos], session.blocked);
      });

      if (opts.metronome) {
        const interval = 60000 / autoCpm(opts.metronome);
        c.metro = setInterval(() => {
          if (paused || session.finished) return;
          TD.sound.tick();
          metroDot.classList.remove('beat'); void metroDot.offsetWidth; metroDot.classList.add('beat');
        }, interval);
      }

      let lastLive = 0;
      const loop = () => {
        if (destroyed || cur !== c) return;
        const now = performance.now();
        session.tick(now);
        if (session.finished) return;
        if (now - lastLive > 120) {
          lastLive = now;
          const l = session.live(now);
          wpmEl.textContent = session.started ? Math.round(l.wpm) : '0';
          accEl.textContent = Math.round(l.acc) + '%';
          timeEl.textContent = timed ? U.fmtClock(l.remaining) : U.fmtClock(l.ms);
          if (timed) timeEl.parentElement.classList.toggle('low', l.remaining < 5000 && session.started);
          if (!timed) prog.firstChild.style.width = Math.round(l.progress * 100) + '%';
        }
        if (ghostTimes && session.started) view.setGhost(ghostIndex(session.elapsed(now)));
        c.raf = requestAnimationFrame(loop);
      };
      c.raf = requestAnimationFrame(loop);

      c.onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); pause(); return; }
        if (e.key === 'Tab') { e.preventDefault(); return; }
        // Infer Caps Lock from what the key produced (more reliable than getModifierState everywhere).
        if (/^[a-zA-Z]$/.test(e.key) && !e.altKey) caps.hidden = !((e.key === e.key.toUpperCase()) !== e.shiftKey);
        const act = TD.engine.actionFromEvent(e);
        if (!act) return;
        e.preventDefault();
        if (session.finished) return;
        if (act.type === 'dead') {
          if (!deadWarned) UI.toast('Your keyboard layout uses "dead keys" for quotes and accents. Switch to the US layout for the smoothest practice.', { icon: 'info', timeout: 6000 });
          deadWarned = true;
          return;
        }
        if (act.type === 'back') session.backspace(act.word);
        else session.input(act.ch);
      };
    }

    function autoCpm(m) {
      if (typeof m === 'number') return m;
      const r = TD.stats.recent(data, 10);
      return U.clamp(Math.round((r.count ? r.wpm : 20) * 5 * 0.9), 60, 450);
    }

    function finishTyping(c) {
      if (cur !== c) return;
      cancelAnimationFrame(c.raf);
      clearInterval(c.metro);
      const res = c.session.result();
      if (c.step.options && c.step.options.blind) c.view.reveal();
      c.view.setGhost(null);
      TD.stats.mergeResult(data, res);
      TD.store.saveSoon();
      stepDone({ kind: 'type', step: c.step, res });
    }

    // ---------------------------------------------------------------- pause
    function pause() {
      if (phase !== 'step' || paused || !cur) return;
      paused = true;
      if (cur.session) cur.session.pause();
      const stage = main.querySelector('.stage');
      const resumeBtn = h('button.btn.btn-primary', { type: 'button', on: { click: resume } }, TD.icon('play'), 'Resume', h('kbd.kbd-inline', 'Esc'));
      const overlay = h('div.pause-overlay', { role: 'dialog', 'aria-label': 'Paused' },
        h('div.pause-card.card',
          h('h2', 'Paused'),
          h('p.muted', 'Take a breath, shake out your hands. The timer is stopped.'),
          h('div.pause-actions',
            resumeBtn,
            h('button.btn.btn-ghost', { type: 'button', on: { click: () => startStep(idx) } }, TD.icon('retry'), 'Restart step'),
            plan.kind === 'episode' ? h('button.btn.btn-ghost', { type: 'button', on: { click: () => TD.router.reload() } }, TD.icon('retry'), 'Restart episode') : null,
            h('button.btn.btn-ghost', { type: 'button', on: { click: () => exit(true) } }, TD.icon('left'), 'Exit'))));
      (stage || main).appendChild(overlay);
      setTimeout(() => resumeBtn.focus({ preventScroll: true }), 30);
    }
    function resume() {
      if (!paused) return;
      paused = false;
      const o = main.querySelector('.pause-overlay');
      if (o) o.remove();
      if (cur && cur.session) cur.session.resume();
    }

    // ---------------------------------------------------------------- step done
    function stepDone(entry) {
      results.push(entry);
      maybeInsertFocus(entry);
      if (idx >= steps.length - 1) { finishPlan(); return; }
      phase = 'stepDone';
      ignoreUntil = performance.now() + 450;
      TD.sound.step();
      renderTop();
      const r = entry.res;
      const inserted = steps[idx + 1] && steps[idx + 1].inserted && !steps[idx + 1]._announced ? steps[idx + 1] : null;
      if (inserted) inserted._announced = true;
      const tiles = entry.kind === 'keys'
        ? [UI.tile('Accuracy', Math.round(r.acc) + '%'), UI.tile('Avg. reaction', (r.reaction || 0) + ' ms'), UI.tile('Time', U.fmtDuration(r.ms))]
        : [UI.tile('Speed', Math.round(r.wpm), { unit: 'WPM' }), UI.tile('Accuracy', Math.round(r.acc) + '%'), UI.tile('Time', U.fmtDuration(r.ms)), UI.tile('Errors', r.errors)];
      const cont = h('button.btn.btn-primary', { type: 'button', on: { click: () => nextStep() } }, 'Continue', h('kbd.kbd-inline', 'Enter'));
      const panel = h('div.step-done',
        h('div.sd-head', h('span.sd-check', TD.icon('check')), h('div', h('span.step-no', 'Step ' + (idx + 1) + ' complete'), h('h3', entry.step.title))),
        h('div.tiles.tiles-sm', tiles),
        r.failed === 'lives' ? h('p.notice.notice-warn', TD.icon('heart'), 'Out of lives! The step ended early.') : null,
        inserted ? h('p.notice.notice-info', TD.icon('sparkles'), h('span', h('b', 'Adaptive drill added. '), 'You slipped on ' + inserted.focusKeys.map((k) => TD.kb.label(k)).join(', ') + ', so a short focus round comes next.')) : null,
        h('div.stage-actions',
          h('button.btn.btn-ghost', { type: 'button', on: { click: () => { results.pop(); if (inserted) { steps.splice(idx + 1, 1); insertedCount--; } startStep(idx); } } }, TD.icon('retry'), 'Retry step'),
          cont));
      const stage = main.querySelector('.stage');
      const tvCard = stage && stage.querySelector('.tv-card, .kg');
      if (stage) {
        U.$$('.aids, .hint-line, .mode-hint, .progress.thin, .badges, .kg-help', stage).forEach((x) => x.remove());
        if (tvCard) tvCard.after(panel); else stage.appendChild(panel);
      } else U.clear(main).appendChild(panel);
      setTimeout(() => cont.focus({ preventScroll: true }), 30);
    }

    function maybeInsertFocus(entry) {
      if (entry.kind !== 'type' || plan.kind !== 'episode' || !S.adaptive || entry.step.inserted || entry.step.scored || insertedCount >= 2) return false;
      const goal = (plan.goals && plan.goals.accuracy) || 90;
      if (entry.res.acc >= goal - 3) return false;
      const missed = entry.res.missed.filter((m) => /[a-z]/.test(m.key) && m.errors >= 2).map((m) => m.key);
      if (!missed.length) return false;
      const f = TD.plans.focus(missed, plan.keys);
      if (!f.focusKeys.length) return false;
      steps.splice(idx + 1, 0, f);
      insertedCount++;
      return true;
    }

    function nextStep() {
      if (phase !== 'stepDone' && phase !== 'step') return;
      startStep(idx + 1);
    }

    // ---------------------------------------------------------------- results
    function aggregate() {
      const typing = results.filter((r) => r.kind === 'type');
      const scored = typing.filter((r) => r.step.scored);
      const use = scored.length ? scored : typing;
      let chars = 0; let ms = 0; let ks = 0; let er = 0; let consSum = 0; let consW = 0; let failed = null;
      use.forEach((r) => {
        chars += r.res.chars; ms += r.res.ms; ks += r.res.keystrokes; er += r.res.errors;
        if (r.res.cons) { consSum += r.res.cons * r.res.chars; consW += r.res.chars; }
      });
      typing.forEach((r) => { if (r.res.failed) failed = r.res.failed; });
      if (!use.length) results.filter((r) => r.kind === 'keys').forEach((r) => { ks += r.res.keystrokes; er += r.res.errors; ms += r.res.ms; });
      const missed = {};
      typing.forEach((r) => r.res.missed.forEach((m) => { missed[m.key] = (missed[m.key] || 0) + m.errors; }));
      const chartFrom = use.slice(-1)[0];
      return {
        wpm: use.length && ms > 0 ? Math.round(((chars / 5) / (ms / 60000)) * 10) / 10 : 0,
        acc: ks ? Math.round(((ks - er) / ks) * 1000) / 10 : 100,
        cons: consW ? Math.round(consSum / consW) : 0,
        chars, ms, errors: er, keystrokes: ks,
        totalMs: results.reduce((s, r) => s + (r.res.ms || 0), 0),
        hasTyping: typing.length > 0,
        completed: true,
        failed,
        chart: chartFrom ? chartFrom.res : null,
        missed: Object.entries(missed).sort((x, y) => y[1] - x[1]).slice(0, 8),
      };
    }

    function finishPlan() {
      cleanupStep();
      phase = 'results';
      ignoreUntil = performance.now() + 700;
      const agg = aggregate();
      const ep = plan.episode;
      let ev = null;
      const records = [];
      const ach = {};
      const hist = TD.stats.addHistory(data, { kind: plan.kind, id: plan.id, title: plan.title, wpm: agg.wpm, acc: agg.acc, cons: agg.cons, ms: agg.ms, ch: agg.chars, er: agg.errors });
      if (plan.kind === 'episode') {
        ev = TD.course.evaluate(ep, agg);
        hist.stars = ev.stars;
        hist.passed = ev.passed;
        const rec = TD.course.recordEpisode(data, ep, agg, ev);
        ev.newBest = ev.stars > (rec.before.stars || 0) && rec.before.done;
        ev.firstPass = ev.passed && !rec.before.done;
        ev.fails = rec.p.fails;
        ach.perfect = ev.passed && agg.hasTyping && agg.acc >= 100;
      }
      results.forEach((r) => {
        const o = r.step.options || {};
        if (r.kind !== 'type') return;
        if (o.ghost) {
          const g = data.records[o.ghost === 'pb' ? 'ep:' + plan.id : o.ghost];
          if (g && r.res.wpm > g.wpm && r.res.acc >= 75) ach.beatGhost = true;
        }
        if (o.record) {
          const u = TD.stats.updateRecord(data, o.record, r.res);
          if (u.isNew) records.push({ id: o.record, wpm: r.res.wpm, prev: u.prev });
        }
      });
      if (plan.kind === 'placement') {
        const ch = TD.course.placementChapter(agg.wpm, agg.acc);
        data.unlockedThrough = Math.max(data.unlockedThrough || 0, ch);
        data.placement = { wpm: agg.wpm, acc: agg.acc, t: Date.now(), chapter: ch };
      }
      const fresh = TD.achievements.check(data, ach);
      TD.store.save();
      TD.util.bus.emit('data:changed', data);
      renderResults(agg, ev, records, ach);
      if (ev && ev.passed) TD.sound.success(); else if (ev) TD.sound.fail(); else TD.sound.success();
      fresh.forEach((a, i) => setTimeout(() => UI.achievementToast(a), 1100 + i * 900));
    }

    function renderResults(agg, ev, records, ach) {
      renderTop();
      const ep = plan.episode;
      const head = h('div.res-head');
      if (ev) {
        const stars = UI.stars(ev.stars, 3, 'stars-xl');
        head.append(stars,
          h('h1', ev.passed ? (ev.stars === 3 ? 'Perfect run!' : ev.stars === 2 ? 'Great job!' : 'Episode complete!') : agg.failed === 'lives' ? 'Out of lives' : 'Not quite there yet'),
          h('p.res-sub', ev.passed ? starHint(ev, agg) : failHint(ev, agg)));
        U.$$('.ico', stars).forEach((s, i) => { s.style.animationDelay = 0.25 + i * 0.25 + 's'; if (i < ev.stars) setTimeout(() => TD.sound.star(i), 250 + i * 250); });
      } else if (plan.kind === 'placement') {
        const ch = data.placement.chapter;
        head.append(h('div.hero-num', Math.round(agg.wpm), h('small', 'WPM')),
          h('h1', ch ? 'Chapters 1–' + ch + ' unlocked' : 'Start from Chapter 1'),
          h('p.res-sub', ch
            ? 'You type ' + Math.round(agg.wpm) + ' WPM at ' + agg.acc + '% accuracy. Those chapters are open now; Chapter ' + (ch + 1) + ' is your recommended start, but revisiting earlier lessons is great for technique.'
            : 'You type ' + Math.round(agg.wpm) + ' WPM at ' + agg.acc + '% accuracy. Learning proper finger placement from the start is the fastest way to real speed.'));
      } else {
        head.append(h('div.hero-num', Math.round(agg.wpm), h('small', 'WPM')),
          h('h1', plan.kind === 'race' ? (ach.beatGhost ? 'You beat your ghost!' : records.length ? 'First race recorded: that is your ghost now' : 'The ghost wins this time') : records.length ? 'New personal best!' : 'Session complete'),
          h('p.res-sub', agg.acc + '% accuracy · ' + U.fmtDuration(agg.totalMs) + ' of practice'));
      }

      const goal = plan.goals || {};
      const tiles = [];
      if (agg.hasTyping) tiles.push(UI.tile('Speed', Math.round(agg.wpm), { unit: 'WPM', sub: goal.wpm ? 'Goal ' + goal.wpm : null, cls: goal.wpm && agg.wpm >= goal.wpm ? 'met' : '' }));
      tiles.push(UI.tile('Accuracy', agg.acc + '%', { sub: goal.accuracy ? 'Goal ' + goal.accuracy + '%' : null, cls: goal.accuracy && agg.acc >= goal.accuracy ? 'met' : '' }));
      tiles.push(UI.tile('Time', U.fmtDuration(agg.totalMs)));
      if (agg.cons) tiles.push(UI.tile('Consistency', agg.cons + '%', { sub: 'Rhythm evenness' }));
      tiles.push(UI.tile('Errors', agg.errors, { sub: U.fmtNum(agg.keystrokes) + ' keystrokes' }));

      const blocks = [];
      records.forEach((r) => blocks.push(h('div.notice.notice-gold', TD.icon('trophy'),
        h('span', h('b', 'New record: ' + r.id.replace('test', '') + '-second test, ' + Math.round(r.wpm) + ' WPM'), r.prev ? ' (previous best ' + Math.round(r.prev.wpm) + ')' : ' (your first official result)'))));

      const ch = agg.chart;
      if (ch && ch.series && ch.series.wpm.length >= 3) {
        const C = TD.ui.charts;
        const sec = ch.series.wpm.length;
        const chartStep = results.filter((r) => r.kind === 'type' && r.res === ch)[0];
        blocks.push(h('div.res-chart.card-inset',
          h('div.chart-head', h('h3', 'Speed over time', chartStep && results.length > 1 ? h('span.muted.small', ' · ' + chartStep.step.title) : null), h('div.legend',
            h('span.lg', h('span.lg-line', { style: { background: 'var(--viz-1)' } }), 'Net WPM'),
            h('span.lg', h('span.lg-line', { style: { background: 'var(--viz-muted)' } }), 'Raw WPM'),
            h('span.lg', h('span.lg-x'), 'Errors'))),
          C.line({
            height: 190,
            ariaLabel: 'Words per minute for each second of the ' + (agg.hasTyping ? 'last scored step' : 'session'),
            series: [
              { name: 'Net WPM', values: ch.series.wpm, color: 'var(--viz-1)', area: true },
              { name: 'Raw WPM', values: ch.series.raw, color: 'var(--viz-muted)', muted: true },
            ],
            markers: ch.series.err.map((n, i) => ({ i, n })),
            xLabel: (i) => (i + 1) + 's',
            title: (i) => 'Second ' + (i + 1) + ' of ' + sec,
            endLabel: true,
          }),
          C.table('Speed per second', ['Second', 'Net WPM', 'Raw WPM', 'Errors'], ch.series.wpm.map((v, i) => [i + 1, v, ch.series.raw[i], ch.series.err[i]]))));
      }

      const stepRows = results.map((r, i) => [i + 1, r.step.title, r.kind === 'keys' ? '—' : Math.round(r.res.wpm), Math.round(r.res.acc) + '%', U.fmtDuration(r.res.ms)]);
      if (results.length > 1) {
        blocks.push(h('details.steps-table',
          h('summary', 'Step breakdown'),
          h('div.table-scroll', h('table', h('thead', h('tr', ['#', 'Step', 'WPM', 'Accuracy', 'Time'].map((x) => h('th', { scope: 'col', text: x })))),
            h('tbody', stepRows.map((row) => h('tr', row.map((c) => h('td', { text: String(c) })))))))));
      }

      if (agg.missed.length) {
        blocks.push(h('div.missed',
          h('h3.label', 'Keys you missed'),
          h('div.chips', agg.missed.map(([k, n]) => h('span.chip.chip-key', { dataset: { f: TD.kb.fingerOf(k) || '' } }, h('kbd', TD.kb.label(k)), h('span', '×' + n)))),
          h('a.btn.btn-ghost.btn-sm', { href: '#/practice/weak' }, TD.icon('dumbbell'), 'Drill my weak keys')));
      }

      const tips = (TD.data.tips || []);
      if (tips.length) blocks.push(h('div.tipbox', h('div.tipbox-label', '💡 Tip'), h('p', { html: U.md(U.pick(tips)) })));

      // actions
      const actions = h('div.res-actions');
      resultsActions = {};
      const back = h('a.btn.btn-ghost', { href: hooks.backTo || '#/learn' }, TD.icon('left'), hooks.backLabel || 'Back');
      if (ev) {
        const nextItem = ev.passed ? TD.course.nextItemAfter(ep.id, data) : null;
        const retryBtn = h('button.btn' + (ev.passed ? '.btn-ghost' : '.btn-primary'), { type: 'button', on: { click: () => TD.router.reload() } }, TD.icon('retry'), 'Retry', h('kbd.kbd-inline', ev.passed ? 'R' : 'Enter'));
        resultsActions.retry = () => TD.router.reload();
        if (ev.passed) {
          let nextBtn;
          if (nextItem) {
            const href = nextItem.type === 'guide' ? '#/guide/' + nextItem.id : '#/episode/' + nextItem.id;
            const label = nextItem.type === 'guide' ? 'Next: read "' + nextItem.guide.title + '"' : 'Next: ' + nextItem.id + ' ' + nextItem.episode.title;
            nextBtn = h('a.btn.btn-primary', { href }, h('span', label), TD.icon('right'), h('kbd.kbd-inline', 'Enter'));
            resultsActions.primary = () => { location.hash = href; };
          } else {
            nextBtn = h('a.btn.btn-primary', { href: '#/certificate' }, TD.icon('cap'), 'Course complete: get your certificate', h('kbd.kbd-inline', 'Enter'));
            resultsActions.primary = () => { location.hash = '#/certificate'; };
          }
          actions.append(back, retryBtn, nextBtn);
        } else {
          resultsActions.primary = resultsActions.retry;
          actions.append(back);
          if (ev.fails >= 3) {
            actions.append(h('button.btn.btn-ghost', {
              type: 'button',
              title: 'Mark as skipped so the next episode opens. You can come back any time.',
              on: { click: () => { data.episodes[ep.id].skipped = true; TD.store.save(); const n = TD.course.nextItemAfter(ep.id, data); location.hash = n ? (n.type === 'guide' ? '#/guide/' : '#/episode/') + n.id : '#/learn'; } },
            }, TD.icon('skip'), 'Skip for now'));
          }
          actions.append(retryBtn);
        }
      } else {
        resultsActions.retry = () => TD.router.reload();
        if (plan.kind === 'placement') {
          const n = TD.course.nextEpisode(data);
          const startHref = n ? '#/episode/' + n.id : '#/learn';
          actions.append(
            h('button.btn.btn-ghost', { type: 'button', on: { click: () => TD.router.reload() } }, TD.icon('retry'), 'Take it again', h('kbd.kbd-inline', 'R')),
            h('a.btn.btn-primary', { href: startHref }, 'Start learning' + (n ? ' at ' + n.id : ''), TD.icon('right'), h('kbd.kbd-inline', 'Enter')));
          resultsActions.primary = () => { location.hash = startHref; };
        } else {
          actions.append(back, h('button.btn.btn-primary', { type: 'button', on: { click: () => TD.router.reload() } }, TD.icon('retry'), 'Go again', h('kbd.kbd-inline', 'Enter')));
          resultsActions.primary = resultsActions.retry;
        }
      }

      const card = h('section.results.card', head, h('div.tiles', tiles), blocks, actions);
      U.clear(main).appendChild(card);
      window.scrollTo({ top: 0 });
      if (hooks.onFinish) hooks.onFinish(agg, ev);
    }

    function starHint(ev, agg) {
      const g = plan.goals;
      if (ev.stars >= 3) return 'All three stars. You hit ' + agg.acc + '% accuracy at ' + Math.round(agg.wpm) + ' WPM.' + (ev.firstPass ? ' The next lesson is unlocked.' : '');
      const need = [];
      if (agg.acc < g.accuracy) need.push(g.accuracy + '% accuracy');
      if (agg.hasTyping && agg.wpm < g.wpm) need.push(g.wpm + ' WPM');
      return (ev.firstPass ? 'Next lesson unlocked! ' : '') + 'For ' + (ev.stars + 1 === 3 ? 'three' : 'two') + ' stars, reach ' + need.join(' and ') + '.';
    }
    function failHint(ev, agg) {
      if (agg.failed === 'lives') return 'Every error costs a life in this challenge. Slow down slightly and aim for clean keystrokes.';
      const p = ev.pass;
      const parts = [];
      if (agg.acc < p.accuracy) parts.push(p.accuracy + '% accuracy (you had ' + agg.acc + '%)');
      if (p.wpm && agg.wpm < p.wpm) parts.push(p.wpm + ' WPM (you had ' + Math.round(agg.wpm) + ')');
      return 'To pass, reach ' + parts.join(' and ') + '. Accuracy first: slow down a little and the speed will follow.';
    }

    // ---------------------------------------------------------------- keyboard routing
    function onKeyDown(e) {
      if (destroyed || UI.isModalOpen()) return;
      if (e.metaKey || (e.ctrlKey && e.key !== 'Backspace')) return;
      if (paused) {
        if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); resume(); }
        return;
      }
      if (performance.now() < ignoreUntil) {
        if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') e.preventDefault();
        return;
      }
      const tag = (e.target && e.target.tagName) || '';
      const onButton = tag === 'BUTTON' || tag === 'A';
      switch (phase) {
        case 'overview':
          if (e.key === 'Enter' && !onButton) { e.preventDefault(); startStep(0); } else if (e.key === 'Escape') exit();
          break;
        case 'step':
          if (cur && cur.onKey) cur.onKey(e);
          break;
        case 'stepDone':
          if (e.key === 'Enter' && !onButton) { e.preventDefault(); nextStep(); } else if (e.key === 'Escape') exit(); else if (e.key === ' ') e.preventDefault();
          break;
        case 'results':
          if (e.key === 'Enter' && !onButton && resultsActions.primary) { e.preventDefault(); resultsActions.primary(); } else if ((e.key === 'r' || e.key === 'R') && resultsActions.retry) { e.preventDefault(); resultsActions.retry(); } else if (e.key === 'Escape') exit();
          break;
        default:
          break;
      }
    }
    function onVisibility() { if (document.hidden && phase === 'step' && cur && cur.session && cur.session.started && !cur.session.finished) pause(); }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);

    showOverview();

    return {
      destroy() {
        destroyed = true;
        cleanupStep();
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('visibilitychange', onVisibility);
        document.body.classList.remove('focus-mode');
      },
    };
  }

  TD.pages = TD.pages || {};
  TD.pages.player = Player;
})(window.TD = window.TD || {});
