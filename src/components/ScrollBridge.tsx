import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { useScrollVelocity } from '../helpers/useScrollVelocity';
import { useRef } from 'react';

/**
 * One-way bridge from r3f scroll state into DOM CSS custom properties so
 * pure-DOM overlays (hero brand mark, mesh-gradient background, marquee)
 * can react to scroll without subscribing to the canvas tree.
 *
 * Sets on document.documentElement:
 *   --spa-scroll : 0..1 raw offset
 *   --spa-vel    : 0..1+ smoothed velocity
 *   --spa-hero   : 1 → 0 as scroll leaves the hero (clamped)
 */
export function ScrollBridge() {
  const scroll = useScroll();
  const tickVel = useScrollVelocity();
  const last = useRef({ s: -1, v: -1 });

  useFrame((_, dt) => {
    const root = document.documentElement;
    const s = scroll.offset;
    const v = tickVel(dt);
    if (Math.abs(s - last.current.s) > 0.0005) {
      root.style.setProperty('--spa-scroll', s.toFixed(4));
      // hero fades fully out by 8% scroll
      const heroFade = Math.max(0, 1 - s / 0.08);
      root.style.setProperty('--spa-hero', heroFade.toFixed(4));
      last.current.s = s;
    }
    if (Math.abs(v - last.current.v) > 0.001) {
      root.style.setProperty('--spa-vel', Math.min(v, 4).toFixed(3));
      last.current.v = v;
    }
  });

  return null;
}

export default ScrollBridge;
