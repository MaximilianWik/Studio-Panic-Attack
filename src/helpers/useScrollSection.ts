import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { totalPages } from '../config/sections';

/**
 * Returns a stable ref whose `.current` is updated each frame with the
 * normalized scroll progress (0..1) within a section that occupies
 * `pages` pages starting at `offset` pages.
 *
 * Values <0 or >1 mean the section is out of view. Most consumers will
 * clamp via `Math.max(0, Math.min(1, ref.current))`.
 *
 * Using a ref instead of state avoids re-rendering on every scroll tick.
 * Components that need to react visually should read the ref inside their
 * own `useFrame` and update three.js objects imperatively.
 */
export function useScrollSection(offset: number, pages: number) {
  const scroll = useScroll();
  const ref = useRef(0);

  useFrame(() => {
    if (!scroll) {
      ref.current = -1;
      return;
    }
    const start = offset / totalPages;
    const end = (offset + pages) / totalPages;
    const raw = (scroll.offset - start) / (end - start);
    ref.current = raw;
  });

  return ref;
}

/**
 * Returns scroll velocity (signed, in pages-per-second). Useful for
 * coupling visual effects (e.g. chromatic aberration) to user input.
 */
export function useScrollVelocity() {
  const scroll = useScroll();
  const lastOffset = useRef(0);
  const velocity = useRef(0);

  useFrame((_, delta) => {
    if (!scroll) return;
    const current = scroll.offset;
    const dy = (current - lastOffset.current) / Math.max(delta, 1e-4);
    // smooth toward target velocity
    velocity.current += (dy - velocity.current) * Math.min(1, delta * 6);
    lastOffset.current = current;
  });

  return velocity;
}
