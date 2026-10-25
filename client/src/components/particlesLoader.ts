// Dynamically imported by <Particles /> so the tsParticles engine stays out of
// the page's critical JS (it becomes its own lazy chunk).
import { tsParticles } from '@tsparticles/engine';
import type { Container } from '@tsparticles/engine';
import { loadBasic } from '@tsparticles/basic';
import { particlesOptions } from './particlesOptions';

let ready: Promise<void> | undefined;

function init(): Promise<void> {
  ready ??= loadBasic(tsParticles).then(() => tsParticles.init());
  return ready;
}

/**
 * The current theme's ink as an rgb() string. Theme colours are OKLCH, which tsParticles cannot parse, so the
 * browser converts it by painting one pixel.
 */
function starColor(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim();
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!value || !ctx) return '#ffffff';
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export async function loadParticles(element: HTMLElement, id: string): Promise<Container | undefined> {
  await init();
  const options = {
    ...particlesOptions,
    particles: {
      ...particlesOptions.particles,
      paint: { fill: { enable: true, color: { value: starColor() } } },
    },
  };
  return tsParticles.load({ id, element, options });
}
