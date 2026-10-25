import type { ISourceOptions } from '@tsparticles/engine';

/**
 * Port of legacy/public/js/particles.js (tsParticles 2.0.6 options) to the
 * tsParticles v4 option schema. Everything the legacy file configured with a
 * non-default effect is kept; options that only restated defaults, or that
 * belong to features that were disabled (interactivity, links, twinkle, tilt,
 * roll, wobble, orbit, life, rotate, destroy, repulse, shadow, stroke) are
 * dropped because they have no visible effect and need extra plugin packages.
 *
 * v2 -> v4 mapping: particles.color -> particles.paint.fill.color,
 * shape.type -> shape.type (circle), opacity/size stay under their updaters.
 */
export const particlesOptions: ISourceOptions = {
  autoPlay: true,
  delay: 0,
  duration: 0,
  fullScreen: { enable: true, zIndex: -100 },
  detectRetina: true,
  fpsLimit: 120,
  pauseOnBlur: true,
  pauseOnOutsideViewport: true,
  smooth: false,
  zLayers: 100,
  particles: {
    paint: { fill: { enable: true, color: { value: '#ffffff' } } },
    move: {
      angle: { offset: 45, value: 0 },
      direction: 'bottom-right',
      enable: true,
      straight: true,
      outModes: { default: 'out' },
      speed: 0.3,
    },
    number: {
      density: { enable: true, width: 1920, height: 1080 },
      limit: { value: 0 },
      value: 300,
    },
    opacity: {
      value: { min: 0.1, max: 1 },
      animation: {
        count: 0,
        enable: true,
        speed: 0.5,
        decay: 0,
        delay: 0,
        sync: false,
        mode: 'auto',
        startValue: 'random',
        destroy: 'none',
      },
    },
    reduceDuplicates: false,
    shape: { type: 'circle' },
    size: {
      value: { min: 0.1, max: 1 },
      animation: {
        count: 0,
        enable: false,
        speed: 4,
        decay: 0,
        delay: 0,
        sync: false,
        mode: 'auto',
        startValue: 'random',
        destroy: 'none',
      },
    },
  },
};
