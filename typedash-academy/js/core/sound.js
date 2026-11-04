/* TypeDash Academy — tiny WebAudio sound kit (no audio files, works offline). */
(function (TD) {
  'use strict';
  let ctx = null;
  let master = null;
  let noiseBuf = null;

  function settings() { return TD.store ? TD.store.settings() : { sound: true, volume: 0.6 }; }
  function audio() {
    if (!settings().sound) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const ch = noiseBuf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3);
      }
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.value = Math.max(0, Math.min(1, settings().volume)) * 0.9;
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, dur, opts) {
    const a = audio();
    if (!a) return;
    opts = opts || {};
    const t = a.currentTime + (opts.delay || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain || 0.2, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  const sound = {
    /** Soft mechanical click for a correct key. */
    click() {
      const a = audio();
      if (!a) return;
      const src = a.createBufferSource();
      src.buffer = noiseBuf;
      src.playbackRate.value = 0.9 + Math.random() * 0.25;
      const f = a.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2400 + Math.random() * 600;
      f.Q.value = 0.9;
      const g = a.createGain();
      g.gain.value = 0.35;
      src.connect(f).connect(g).connect(master);
      src.start();
    },
    error() { tone(196, 0.12, { type: 'triangle', to: 150, gain: 0.18 }); },
    tick() { tone(1320, 0.03, { type: 'sine', gain: 0.08 }); },
    step() { tone(660, 0.09, { gain: 0.12 }); tone(990, 0.12, { gain: 0.1, delay: 0.07 }); },
    success() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, { gain: 0.12, delay: i * 0.09 })); },
    star(i) { tone(880 * Math.pow(1.26, i || 0), 0.18, { type: 'triangle', gain: 0.12 }); },
    fail() { tone(392, 0.16, { type: 'triangle', gain: 0.12 }); tone(311, 0.24, { type: 'triangle', gain: 0.12, delay: 0.14 }); },
    unlock() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, { type: 'triangle', gain: 0.1, delay: i * 0.06 })); },
    /** Call from a user gesture once so browsers allow audio. */
    prime() { audio(); },
  };

  TD.sound = sound;
})(window.TD = window.TD || {});
