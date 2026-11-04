/* TypeDash Academy — achievements. */
(function (TD) {
  'use strict';

  const chapterDone = (n) => (d) => {
    const ch = TD.course.chapters().find((c) => c.id === n);
    return !!ch && TD.course.chapterProgress(ch, d).complete;
  };
  const stars = (d) => TD.course.courseProgress(d).stars;
  const best = (d) => TD.stats.bestWpm(d);

  const LIST = [
    { id: 'first-steps', icon: '👣', title: 'First Steps', desc: 'Complete your first episode.', test: (d) => TD.course.courseProgress(d).done >= 1 },
    { id: 'ch1', icon: '🧭', title: 'Navigator', desc: 'Complete Chapter 1: Keyboard Familiarization.', test: chapterDone(1) },
    { id: 'ch2', icon: '🏠', title: 'Home Row Hero', desc: 'Complete Chapter 2: Home Row Mastery.', test: chapterDone(2) },
    { id: 'ch3', icon: '⛰️', title: 'Top Row Climber', desc: 'Complete Chapter 3: Top Row Training.', test: chapterDone(3) },
    { id: 'ch4', icon: '🤿', title: 'Bottom Row Diver', desc: 'Complete Chapter 4: Bottom Row Training.', test: chapterDone(4) },
    { id: 'ch5', icon: '🔗', title: 'Combo Maker', desc: 'Complete Chapter 5: Key Combinations.', test: chapterDone(5) },
    { id: 'ch6', icon: '🧱', title: 'Wordsmith', desc: 'Complete Chapter 6: Word Building.', test: chapterDone(6) },
    { id: 'ch7', icon: '🧬', title: 'Pattern Master', desc: 'Complete Chapter 7: Common Letter Sequences.', test: chapterDone(7) },
    { id: 'ch8', icon: '✍️', title: 'Storyteller', desc: 'Complete Chapter 8: Sentence Practice.', test: chapterDone(8) },
    { id: 'ch9', icon: '🏎️', title: 'Speedster', desc: 'Complete Chapter 9: Speed Building.', test: chapterDone(9) },
    { id: 'ch10', icon: '🎯', title: 'Sharpshooter', desc: 'Complete Chapter 10: Accuracy Training.', test: chapterDone(10) },
    { id: 'ch11', icon: '🌍', title: 'Real-World Ready', desc: 'Complete Chapter 11: Real-World Typing.', test: chapterDone(11) },
    { id: 'graduate', icon: '🎓', title: 'Graduate', desc: 'Complete all 12 chapters.', test: (d) => TD.course.courseProgress(d).pct >= 1 },
    { id: 'perfect', icon: '💎', title: 'Flawless', desc: 'Finish an episode with 100% accuracy.', test: (d, ctx) => !!(ctx && ctx.perfect) },
    { id: 'stars-30', icon: '⭐', title: 'Star Collector', desc: 'Earn 30 stars.', test: (d) => stars(d) >= 30 },
    { id: 'stars-100', icon: '🌟', title: 'Star Hoarder', desc: 'Earn 100 stars.', test: (d) => stars(d) >= 100 },
    { id: 'stars-all', icon: '💫', title: 'Superstar', desc: 'Earn every star in the course.', test: (d) => { const p = TD.course.courseProgress(d); return p.maxStars > 0 && p.stars >= p.maxStars; } },
    { id: 'wpm-20', icon: '🚲', title: '20 WPM', desc: 'Reach 20 WPM in a 30-second+ test or session.', test: (d) => best(d) >= 20 },
    { id: 'wpm-30', icon: '🛵', title: '30 WPM', desc: 'Reach 30 WPM.', test: (d) => best(d) >= 30 },
    { id: 'wpm-40', icon: '🚗', title: '40 WPM', desc: 'Reach 40 WPM: faster than the average typist.', test: (d) => best(d) >= 40 },
    { id: 'wpm-50', icon: '🏁', title: '50 WPM', desc: 'Reach 50 WPM.', test: (d) => best(d) >= 50 },
    { id: 'wpm-60', icon: '✈️', title: '60 WPM', desc: 'Reach 60 WPM: professional speed.', test: (d) => best(d) >= 60 },
    { id: 'wpm-80', icon: '🚀', title: '80 WPM', desc: 'Reach 80 WPM.', test: (d) => best(d) >= 80 },
    { id: 'wpm-100', icon: '🌌', title: '100 WPM', desc: 'Reach 100 WPM. Legendary.', test: (d) => best(d) >= 100 },
    { id: 'streak-3', icon: '🔥', title: 'On Fire', desc: 'Practise 3 days in a row.', test: (d) => TD.stats.streak(d).best >= 3 },
    { id: 'streak-7', icon: '📅', title: 'Week Warrior', desc: 'Practise 7 days in a row.', test: (d) => TD.stats.streak(d).best >= 7 },
    { id: 'streak-30', icon: '🏆', title: 'Unstoppable', desc: 'Practise 30 days in a row.', test: (d) => TD.stats.streak(d).best >= 30 },
    { id: 'workout', icon: '🏋️', title: 'Daily Grinder', desc: 'Finish a 10-minute daily workout.', test: (d) => d.history.some((h) => h.kind === 'workout') },
    { id: 'ghost', icon: '👻', title: 'Ghostbuster', desc: 'Beat your own ghost in a race.', test: (d, ctx) => !!(ctx && ctx.beatGhost) },
    { id: 'hour', icon: '⏱️', title: 'Hour of Power', desc: 'Practise for 60 minutes in total.', test: (d) => d.totals.ms >= 3600000 },
    { id: 'chars-10k', icon: '⌨️', title: '10K Club', desc: 'Type 10,000 correct characters.', test: (d) => d.totals.ch >= 10000 },
    { id: 'chars-100k', icon: '🏔️', title: '100K Club', desc: 'Type 100,000 correct characters.', test: (d) => d.totals.ch >= 100000 },
    { id: 'reader', icon: '📚', title: 'Bookworm', desc: 'Read 10 guides.', test: (d) => Object.keys(d.guides).length >= 10 },
    { id: 'custom', icon: '📝', title: 'Make It Yours', desc: 'Practise with your own custom text.', test: (d) => d.history.some((h) => h.kind === 'custom') },
  ];

  /** Unlock anything newly earned. Returns the list of new achievements. */
  function check(data, ctx) {
    const fresh = [];
    LIST.forEach((a) => {
      if (data.achievements[a.id]) return;
      let ok = false;
      try { ok = a.test(data, ctx); } catch (e) { ok = false; }
      if (ok) {
        data.achievements[a.id] = Date.now();
        fresh.push(a);
      }
    });
    return fresh;
  }

  TD.achievements = { LIST, check, get: (id) => LIST.find((a) => a.id === id) };
})(window.TD = window.TD || {});
