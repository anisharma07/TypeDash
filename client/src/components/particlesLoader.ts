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

export async function loadParticles(element: HTMLElement, id: string): Promise<Container | undefined> {
  await init();
  return tsParticles.load({ id, element, options: particlesOptions });
}
