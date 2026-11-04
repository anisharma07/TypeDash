/* TypeDash Academy — course logic: learning path, unlocking, stars, episode plans. */
(function (TD) {
  'use strict';
  const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

  let cache = null;
  function build() {
    if (cache) return cache;
    const C = (TD.data && TD.data.curriculum) || { chapters: [] };
    const G = (TD.data && TD.data.guides) || [];
    const chapters = C.chapters || [];
    const episodes = [];
    const byId = {};
    const chapterOf = {};
    chapters.forEach((ch) => (ch.episodes || []).forEach((ep, i) => {
      ep.chapter = ch.id;
      ep.index = episodes.length;
      ep.indexInChapter = i;
      episodes.push(ep);
      byId[ep.id] = ep;
      chapterOf[ep.id] = ch;
    }));
    const guides = {};
    G.forEach((g) => { guides[g.id] = g; });
    const path = [];
    const byChapter = {};
    chapters.forEach((ch) => {
      const items = [];
      (ch.episodes || []).forEach((ep) => {
        G.filter((g) => g.before === ep.id).forEach((g) => items.push({ type: 'guide', id: g.id, guide: g, chapter: ch.id }));
        items.push({ type: 'episode', id: ep.id, episode: ep, chapter: ch.id });
      });
      byChapter[ch.id] = items;
      path.push(...items);
    });
    const last = chapters[chapters.length - 1];
    G.filter((g) => !byId[g.before]).forEach((g) => {
      const item = { type: 'guide', id: g.id, guide: g, chapter: last ? last.id : 0 };
      if (last) byChapter[last.id].push(item);
      path.push(item);
    });
    cache = { chapters, episodes, byId, chapterOf, guides, path, byChapter };
    return cache;
  }

  // ------------------------------------------------------------------ rules
  const defaultMode = (ep) => (ep.chapter <= 7 ? 'stop' : 'advance');
  function passRule(ep) {
    const acc = ep.chapter <= 4 ? 80 : ep.chapter <= 8 ? 85 : 88;
    return Object.assign({ accuracy: acc }, ep.pass || {});
  }

  function isUnlocked(ep, data) {
    if (!data || !ep) return false;
    const p = data.episodes[ep.id];
    if (p && (p.done || p.skipped)) return true;
    if (data.settings.unlockAll) return true;
    if (ep.unlock && ep.unlock.bestWpm && TD.stats.bestWpm(data) < ep.unlock.bestWpm) return false;
    if (ep.index === 0) return true;
    if (data.unlockedThrough >= ep.chapter) return true;
    // The placement test also opens the first episode of the recommended next chapter.
    if (data.unlockedThrough > 0 && ep.chapter === data.unlockedThrough + 1 && ep.indexInChapter === 0) return true;
    const prev = build().episodes[ep.index - 1];
    const pp = prev && data.episodes[prev.id];
    return !!(pp && (pp.done || pp.skipped));
  }

  function status(ep, data) {
    const p = data.episodes[ep.id];
    if (p && p.done) return { state: 'done', stars: p.stars || 0, p };
    if (p && p.skipped) return { state: 'skipped', stars: 0, p };
    return { state: isUnlocked(ep, data) ? 'open' : 'locked', stars: 0, p };
  }

  function nextEpisode(data) {
    const eps = build().episodes;
    const open = (ep) => status(ep, data).state === 'open';
    // After a placement test, recommend the first chapter beyond the placed level.
    const placed = data.unlockedThrough > 0 && !data.settings.unlockAll ? eps.find((ep) => ep.chapter > data.unlockedThrough && open(ep)) : null;
    return placed || eps.find(open) || eps.find((ep) => status(ep, data).state === 'skipped') || null;
  }

  /** The item that follows `id` in the learning path, skipping guides already read. */
  function nextItemAfter(id, data) {
    const path = build().path;
    const i = path.findIndex((it) => it.id === id);
    for (let j = i + 1; j < path.length; j++) {
      const it = path[j];
      if (it.type === 'guide' && data.guides[it.id]) continue;
      return it;
    }
    return null;
  }

  /** ★ pass · ★★ accuracy goal · ★★★ accuracy + speed goal. */
  function evaluate(ep, agg) {
    const pass = passRule(ep);
    const passed = !!(agg.completed && !agg.failed && agg.acc >= pass.accuracy && (!pass.wpm || agg.wpm >= pass.wpm));
    let stars = 0;
    if (passed) {
      stars = 1;
      if (agg.acc >= ep.goals.accuracy) {
        stars = 2;
        if (!agg.hasTyping || agg.wpm >= ep.goals.wpm) stars = 3;
      }
    }
    return { passed, stars, pass };
  }

  function recordEpisode(data, ep, agg, ev) {
    const now = Date.now();
    const p = data.episodes[ep.id] || (data.episodes[ep.id] = { stars: 0, bestWpm: 0, bestAcc: 0, attempts: 0, fails: 0, done: false, first: now });
    const before = { stars: p.stars, bestWpm: p.bestWpm, done: p.done };
    p.attempts++;
    p.last = now;
    if (ev.passed) {
      if (!p.done) p.completedAt = now;
      p.done = true;
      p.skipped = false;
      p.stars = Math.max(p.stars || 0, ev.stars);
    } else p.fails++;
    if (agg.hasTyping && agg.completed) p.bestWpm = Math.max(p.bestWpm || 0, Math.round(agg.wpm));
    if (agg.completed) p.bestAcc = Math.max(p.bestAcc || 0, Math.round(agg.acc * 10) / 10);
    return { p, before };
  }

  function chapterProgress(ch, data) {
    let done = 0;
    let stars = 0;
    (ch.episodes || []).forEach((ep) => {
      const p = data.episodes[ep.id];
      if (p && p.done) { done++; stars += p.stars || 0; }
    });
    const total = (ch.episodes || []).length;
    return { done, total, stars, maxStars: total * 3, pct: total ? done / total : 0, complete: total > 0 && done === total };
  }
  function courseProgress(data) {
    const c = build();
    let done = 0;
    let stars = 0;
    c.chapters.forEach((ch) => { const p = chapterProgress(ch, data); done += p.done; stars += p.stars; });
    return { done, total: c.episodes.length, stars, maxStars: c.episodes.length * 3, pct: c.episodes.length ? done / c.episodes.length : 0 };
  }

  /** Characters the learner has been taught so far ('*' once punctuation is reached). */
  function knownKeys(data) {
    const c = build();
    if (data.settings.unlockAll) return '*';
    let keys = '';
    for (const ep of c.episodes) {
      if (status(ep, data).state === 'locked') break;
      // Key-finding tours (e.g. 1.1) show every letter but do not teach typing them yet.
      if (!ep.steps.some((s) => s.type === 'type' || s.type === 'timed')) continue;
      if (ep.keys === '*' && ep.chapter >= 8) return '*';
      if (ep.keys !== '*') keys += ep.keys;
    }
    const set = [...new Set(keys || 'asdfjkl;')];
    return set.join('');
  }

  /** Placement test → highest chapter to open. */
  function placementChapter(wpm, acc) {
    if (acc < 85) return 0;
    if (wpm >= 50) return 11;
    if (wpm >= 35) return 8;
    if (wpm >= 25) return 7;
    if (wpm >= 15) return 4;
    return 0;
  }

  /** Turn an episode into a runnable plan for the player. */
  function planFor(ep, data) {
    const pref = data.settings.errorMode;
    const fallback = ep.errorMode || (pref && pref !== 'auto' ? pref : defaultMode(ep));
    return {
      kind: 'episode',
      id: ep.id,
      title: ep.title,
      kicker: 'Chapter ' + ep.chapter + ' · Episode ' + ep.id,
      episode: ep,
      chapter: build().chapterOf[ep.id],
      keys: ep.keys,
      newKeys: ep.newKeys || '',
      goals: ep.goals,
      pass: passRule(ep),
      intro: ep.intro,
      tip: ep.tip,
      summary: ep.summary,
      minutes: ep.minutes,
      steps: ep.steps.map((st) => Object.assign({}, st, {
        options: Object.assign({}, st.options || {}, { errorMode: (st.options && st.options.errorMode) || fallback }),
      })),
    };
  }

  TD.course = {
    LEVEL_LABEL,
    data: build,
    chapters: () => build().chapters,
    episodes: () => build().episodes,
    episode: (id) => build().byId[id] || null,
    chapterOf: (id) => build().chapterOf[id] || null,
    guide: (id) => build().guides[id] || null,
    guides: () => Object.values(build().guides),
    path: () => build().path,
    chapterItems: (chId) => build().byChapter[chId] || [],
    defaultMode,
    passRule,
    isUnlocked,
    status,
    nextEpisode,
    nextItemAfter,
    evaluate,
    recordEpisode,
    chapterProgress,
    courseProgress,
    knownKeys,
    placementChapter,
    planFor,
    _reset() { cache = null; },
  };
})(window.TD = window.TD || {});
