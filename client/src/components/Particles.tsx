import { useEffect, useRef } from 'react';

let instance = 0;
let loaderModule: Promise<typeof import('./particlesLoader')> | undefined;
const getLoader = () => (loaderModule ??= import('./particlesLoader'));

/**
 * Shared animated star background (legacy `#tsparticles`). The tsParticles
 * bundle is loaded lazily; the container is destroyed on unmount and a load
 * that finishes after unmount is destroyed immediately, so StrictMode's
 * mount -> cleanup -> mount never leaves a duplicate canvas behind.
 */
export function Particles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let cancelled = false;
    let container: { destroy: () => void } | undefined;
    const id = `tsparticles-${++instance}`;

    void getLoader()
      .then(({ loadParticles }) => loadParticles(element, id))
      .then((c) => {
        if (!c) return;
        if (cancelled) c.destroy();
        else container = c;
      })
      .catch((err: unknown) => {
        // The background is purely decorative: never break the page.
        console.error('Particles failed to load', err);
      });

    return () => {
      cancelled = true;
      container?.destroy();
      container = undefined;
    };
  }, []);

  return <div id="tsparticles" ref={ref} />;
}
