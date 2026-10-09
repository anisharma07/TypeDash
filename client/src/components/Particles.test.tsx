import { StrictMode } from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { destroys, loadParticles } = vi.hoisted(() => {
  const destroys: ReturnType<typeof vi.fn>[] = [];
  const loadParticles = vi.fn(async (el: HTMLElement, _id: string) => {
    // Like the real engine (getCanvasFromContainer): reuse a canvas that already lives in the element.
    // A mock that always created a fresh canvas hid the StrictMode bug where two loads shared one canvas.
    const canvas = el.querySelector('canvas') ?? el.appendChild(document.createElement('canvas'));
    const destroy = vi.fn(() => canvas.remove());
    destroys.push(destroy);
    return { destroy };
  });
  return { destroys, loadParticles };
});
vi.mock('./particlesLoader', () => ({ loadParticles }));

import { Particles } from './Particles';
import { particlesOptions } from './particlesOptions';

afterEach(() => {
  cleanup();
  destroys.length = 0;
  loadParticles.mockClear();
});

describe('<Particles />', () => {
  it('renders the legacy #tsparticles host and loads once', async () => {
    const { container } = render(<Particles />);
    expect(container.querySelector('div#tsparticles')).not.toBeNull();
    await waitFor(() => expect(container.querySelectorAll('canvas')).toHaveLength(1));
    expect(loadParticles).toHaveBeenCalledTimes(1);
  });

  it('destroys the container on unmount', async () => {
    const { container, unmount } = render(<Particles />);
    await waitFor(() => expect(container.querySelectorAll('canvas')).toHaveLength(1));
    unmount();
    expect(destroys[0]).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('leaves exactly one canvas after StrictMode mount/cleanup/mount', async () => {
    const { container } = render(
      <StrictMode>
        <Particles />
      </StrictMode>,
    );
    await waitFor(() => expect(destroys).toHaveLength(2));
    await waitFor(() => expect(container.querySelectorAll('canvas')).toHaveLength(1));
    expect(destroys.filter((d) => d.mock.calls.length > 0)).toHaveLength(1);
  });

  it('gives every load its own host element, so a discarded StrictMode load cannot take the live canvas with it', async () => {
    const { container } = render(
      <StrictMode>
        <Particles />
      </StrictMode>,
    );
    await waitFor(() => expect(loadParticles).toHaveBeenCalledTimes(2));
    const hosts = loadParticles.mock.calls.map((c) => c[0]);
    expect(hosts[0]).not.toBe(hosts[1]);
    expect(container.querySelector('div#tsparticles')!.contains(hosts[1] as HTMLElement)).toBe(true);
    await waitFor(() => expect(container.querySelectorAll('canvas')).toHaveLength(1));
  });

  it('removes its private host element on unmount', async () => {
    const { container, unmount } = render(<Particles />);
    await waitFor(() => expect(container.querySelectorAll('canvas')).toHaveLength(1));
    const host = container.querySelector('div#tsparticles')!;
    expect(host.children).toHaveLength(1);
    unmount();
    expect(host.children).toHaveLength(0);
  });

  it('uses a distinct id per load', async () => {
    render(
      <StrictMode>
        <Particles />
      </StrictMode>,
    );
    await waitFor(() => expect(loadParticles).toHaveBeenCalledTimes(2));
    const ids = loadParticles.mock.calls.map((c) => c[1]);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('particlesOptions', () => {
  it('matches the legacy visual configuration', () => {
    const o = particlesOptions;
    expect(o.fullScreen).toEqual({ enable: true, zIndex: -100 });
    expect(o.detectRetina).toBe(true);
    expect(o.fpsLimit).toBe(120);
    expect(o.particles?.number?.value).toBe(300);
    expect(o.particles?.number?.density).toEqual({ enable: true, width: 1920, height: 1080 });
    expect(o.particles?.move?.direction).toBe('bottom-right');
    expect(o.particles?.move?.speed).toBe(0.3);
    expect(o.particles?.shape?.type).toBe('circle');
    expect(JSON.stringify(o.particles?.paint)).toContain('#ffffff');
    expect(o.interactivity).toBeUndefined();
  });
});
