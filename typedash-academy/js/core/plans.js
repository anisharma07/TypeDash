/* TypeDash Academy — practice plans: speed tests, ghost race, weak-key drills, daily workout, custom text. */
(function (TD) {
  'use strict';
  const U = TD.util;
  const ADV = { errorMode: 'advance' };

  /** Restrict practice to what the learner has been taught (beginners get only their keys). */
  function scope(data) {
    const known = TD.course.knownKeys(data);
    const all = known === '*';
    const letters = all ? TD.kb.LETTERS : TD.gen.lettersOf(known);
    return { all, known, letters, allowed: all ? null : known };
  }

  function wordsSource(sc, count, top) {
    return sc.all || sc.letters.length >= 26
      ? { kind: 'common', top: top || 200, count }
      : { kind: 'letters', keys: sc.letters, count, max: 7 };
  }

  const plans = {
    scope,

    test(seconds, opts) {
      opts = opts || {};
      const id = 'test' + seconds;
      return {
        kind: opts.race ? 'race' : 'test',
        id: opts.race ? 'race60' : id,
        title: opts.race ? 'Ghost Race' : seconds + '-second speed test',
        kicker: opts.race ? 'Race your personal best' : 'Speed test',
        keys: '*',
        intro: opts.race
          ? 'A ghost caret replays your best 60-second test. Stay ahead of it! Your personal best updates if you win.'
          : 'Type the common words as fast and as accurately as you can. The clock starts with your first key. Errors lower your net speed.',
        steps: [{
          type: 'timed',
          title: opts.race ? 'Race the ghost' : seconds + ' seconds',
          text: 'Timer starts on your first keystroke.',
          seconds,
          scored: true,
          source: { kind: 'common', top: opts.top || 200, count: Math.ceil(seconds * 2.2) + 20 },
          options: Object.assign({}, ADV, { record: id }, opts.race ? { ghost: id } : {}, opts.hideKeyboard ? { hideKeyboard: true } : {}),
        }],
      };
    },

    placement() {
      const p = plans.test(60);
      p.kind = 'placement';
      p.id = 'placement';
      p.title = 'Placement test';
      p.kicker = 'Find your starting chapter';
      p.intro = 'One minute of common words. Type naturally, do not rush. Based on your speed and accuracy we will open the chapters you are ready for. You can always go back to earlier lessons.';
      p.steps[0].options = { errorMode: 'advance' };
      return p;
    },

    weak(data) {
      const sc = scope(data);
      const weak = TD.stats.weakKeys(data, { allowed: sc.all ? null : new Set(sc.letters), limit: 4 }).map((w) => w.key);
      return {
        kind: 'practice',
        id: 'weak',
        title: 'Weak-key workout',
        kicker: 'Smart revision',
        keys: sc.all ? '*' : sc.known,
        focusKeys: weak,
        intro: weak.length
          ? 'Built from your typing history: you most often miss or hesitate on ' + weak.map((k) => TD.kb.label(k)).join(', ') + '. First we isolate them, then put them into real words.'
          : 'We do not have enough typing history to find your weak keys yet, so this is a balanced drill. Keep practising and it will adapt to you.',
        steps: [
          { type: 'type', title: 'Isolate', text: 'Slow and exact. Feel each reach.', source: { kind: 'weak', count: 24, keys: sc.letters }, options: { errorMode: 'stop' } },
          { type: 'type', title: 'Weak keys in words', text: 'Read each word before you type it.', source: { kind: 'weak', count: 32, keys: sc.letters }, options: { errorMode: sc.all ? 'advance' : 'stop' } },
          { type: 'timed', title: 'Under pressure', text: '45 seconds. Keep the weak keys clean.', seconds: 45, scored: true, source: { kind: 'weak', count: 50, keys: sc.letters }, options: ADV },
        ],
      };
    },

    workout(data) {
      const sc = scope(data);
      const seqKeys = Object.keys(((TD.data.words || {}).seq) || {});
      const weakBg = TD.stats.weakBigrams(data, { limit: 3 }).map((b) => b.key);
      const seq = seqKeys.find((k) => weakBg.some((bg) => k.includes(bg))) || U.pick(seqKeys.length ? seqKeys : ['th']);
      const steps = [
        { type: 'type', title: 'Warm-up: home row flow', text: 'Settle your fingers on the home row.', source: { kind: 'letters', keys: 'asdfghjkl', count: 14, max: 6 }, options: { errorMode: 'stop' } },
        { type: 'type', title: 'Weak keys', text: 'Your personal trouble keys, isolated.', source: { kind: 'weak', count: 30, keys: sc.letters }, options: { errorMode: 'stop' } },
        { type: 'timed', title: 'Common words', text: 'One minute of the words you type most.', seconds: 60, source: wordsSource(sc, 120, 300), options: ADV },
      ];
      if (sc.all) {
        steps.push(
          { type: 'type', title: 'Pattern: ' + seq, text: 'Common letter cluster: let your fingers roll through it.', source: { kind: 'words', list: 'seq.' + seq, count: 18 }, options: ADV },
          { type: 'type', title: 'Real sentences', text: 'Capitals and punctuation at a calm pace.', source: { kind: 'corpus', name: 'paragraphs', count: 1 }, options: ADV },
        );
      } else {
        steps.push({ type: 'type', title: 'Key combos', text: 'Smooth transitions between your known keys.', source: { kind: 'combos', keys: sc.letters, count: 24, min: 2, max: 4 }, options: { errorMode: 'stop' } });
      }
      steps.push(
        { type: 'timed', title: 'Weak keys, faster', text: 'Same weak keys, now with a clock.', seconds: 60, source: { kind: 'weak', count: 50, keys: sc.letters }, options: ADV },
        { type: 'timed', title: 'Speed burst', text: '30 seconds flat out. Then breathe!', seconds: 30, scored: true, source: wordsSource(sc, 80, 100), options: ADV },
      );
      return {
        kind: 'workout',
        id: 'workout',
        title: '10-minute daily workout',
        kicker: 'Daily training',
        keys: sc.all ? '*' : sc.known,
        intro: 'A balanced session generated for you today: warm-up, your weak keys, common words, patterns and a speed burst. Do it daily to keep your streak alive.',
        steps,
      };
    },

    /** Free practice: { mode, rows, seconds, noLook, blind, metronome, top, corpus }. */
    quick(data, o) {
      const sc = scope(data);
      const rows = { home: 'asdfghjkl', top: 'qwertyuiop', bottom: 'zxcvbnm' };
      let keys = (o.rows || ['home', 'top', 'bottom']).map((r) => rows[r] || '').join('');
      if (!keys) keys = sc.letters;
      const options = Object.assign({}, ADV);
      if (o.noLook) options.hideKeyboard = true;
      if (o.blind) options.blind = true;
      if (o.metronome) options.metronome = 'auto';
      let source;
      let title = 'Quick practice';
      switch (o.mode) {
        case 'rows': source = { kind: 'letters', keys, count: 120, max: 8 }; title = 'Row drill'; break;
        case 'words': source = { kind: 'common', top: o.top || 200, count: 150 }; title = 'Top ' + (o.top || 200) + ' words'; break;
        case 'corpus': source = { kind: 'corpus', name: o.corpus, count: o.corpus === 'code' || o.corpus === 'chat' || o.corpus === 'emails' ? 1 : 3, join: ['code', 'chat', 'emails'].includes(o.corpus) ? '\n' : ' ' }; title = o.title || 'Practice'; break;
        default: source = wordsSource(sc, 150, 200);
      }
      if (o.corpus === 'code') options.autoIndent = true;
      const step = o.seconds
        ? { type: 'timed', title, seconds: o.seconds, scored: true, source, options }
        : { type: 'type', title, scored: true, source: Object.assign({}, source, source.kind === 'corpus' ? {} : { count: 40 }), options };
      return {
        kind: 'practice',
        id: 'quick-' + (o.mode || 'mix'),
        title,
        kicker: 'Practice',
        keys: o.mode === 'rows' ? keys : '*',
        intro: o.intro || 'Free practice. Nothing to unlock, just reps. Press Esc any time to pause.',
        steps: [step],
      };
    },

    custom(text, o) {
      o = o || {};
      const clean = String(text || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
        .replace(/\t/g, '  ')
        .replace(/[^\x20-\x7E\n]/g, '')
        .split('\n').map((l) => l.replace(/\s+$/, '')).join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ ]{2,}/g, o.keepSpaces ? (m) => m : ' ')
        .trim();
      return {
        kind: 'custom',
        id: 'custom',
        title: o.title || 'Custom text',
        kicker: 'Your own text',
        keys: '*',
        intro: 'Practise on anything you like: an article, your notes, a song you wrote. Smart quotes and dashes have been converted to plain keyboard characters.',
        steps: [{ type: 'type', title: o.title || 'Custom text', scored: true, source: { kind: 'text', text: clean || 'paste some text to practise' }, options: Object.assign({}, ADV, o.code ? { autoIndent: true } : {}) }],
      };
    },

    /** Adaptive focus step inserted after a step that went badly. */
    focus(missedKeys, allowedKeys) {
      const letters = TD.gen.lettersOf(allowedKeys && allowedKeys !== '*' ? allowedKeys : TD.kb.LETTERS);
      const keys = missedKeys.filter((k) => letters.includes(k)).slice(0, 3);
      return {
        type: 'type',
        title: 'Focus drill: ' + keys.map((k) => TD.kb.label(k)).join(' '),
        text: 'Adaptive extra: these keys slipped. Slow down, eyes on the screen.',
        inserted: true,
        focusKeys: keys,
        source: { kind: 'weak', count: 18, keys: letters },
        options: { errorMode: 'stop' },
      };
    },
  };

  TD.plans = plans;
})(window.TD = window.TD || {});
