import { useEffect, useState } from 'react';

/**
 * usePreloadGate — DOM-side image preloader with a progress signal.
 *
 * Lives ABOVE the r3f canvas so we can gate scroll on its `ready` state
 * before `<ScrollControls>` mounts the gallery slots. Uses native
 * `new Image()` so the fetched bytes land in the browser's HTTP cache;
 * three.js `TextureLoader` then re-uses the cached response when it
 * later loads the same URL into a GPU texture.
 *
 * Both `onload` and `onerror` count as "done" so a single broken/blocked
 * URL can't deadlock the gate. We also fail-safe at 8 s — if the network
 * is dragging, the user gets to scroll anyway and individual textures
 * stream in via per-slot Suspense (already in place).
 */
export function usePreloadGate(urls: string[]): {
  ready: boolean;
  progress: number;
} {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (urls.length === 0) {
      setReady(true);
      setLoaded(0);
      return;
    }

    let cancelled = false;
    let count = 0;
    const total = urls.length;

    const tick = () => {
      if (cancelled) return;
      count += 1;
      setLoaded(count);
      if (count >= total) setReady(true);
    };

    const imgs: HTMLImageElement[] = [];
    for (const url of urls) {
      const img = new Image();
      // Match three.js' TextureLoader so the browser cache entry is
      // shared between the preload fetch and the later GPU upload.
      img.crossOrigin = 'anonymous';
      img.onload = tick;
      img.onerror = tick;
      img.src = url;
      imgs.push(img);
    }

    // Failsafe: don't block forever on a stalled network.
    const failsafe = window.setTimeout(() => {
      if (cancelled) return;
      setReady(true);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      // Drop handlers so a late `onload` doesn't update state on an
      // unmounted component.
      for (const img of imgs) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [urls.join('|')]);

  return {
    ready,
    progress: urls.length === 0 ? 1 : Math.min(1, loaded / urls.length),
  };
}
