import { useEffect, useRef } from 'react';

let instance = 0;
let loaderModule: Promise<typeof import('./particlesLoader')> | undefined;
const getLoader = () => (loaderModule ??= import('./particlesLoader'));

/**
 * Shared animated star background (legacy `#tsparticles`). The tsParticles
 * bundle is loaded lazily; the container is destroyed on unmount and a load
 * that finishes after unmount is destroyed immediately.
 *
 * Every effect run loads into its OWN child element. tsParticles reuses an
 * existing canvas inside the element it is given, so under StrictMode
 * (mount -> cleanup -> mount) two loads into the same host would share one
 * canvas, and the discarded first container's late destroy() would remove the
 * canvas the second one is drawing on (no stars in dev on about half the loads).
 */
export function Particles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const element = document.createElement('div');
    host.appendChild(element);
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
      element.remove();
    };
  }, []);

  return <div id="tsparticles" ref={ref} />;
}
