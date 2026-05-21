import { useScroll } from '@react-three/drei';
import { useRef } from 'react';

/**
 * Smoothed scroll velocity in [0..1+] units per frame.
 * Pull this every frame (via useFrame) — returns the *current* smoothed value.
 *
 * Implementation: tracks last raw offset, computes delta/dt, smooths with EMA.
 * Must be called inside <ScrollControls>.
 */
export function useScrollVelocity() {
  const scroll = useScroll();
  const last = useRef(0);
  const smoothed = useRef(0);

  return function tick(dt: number): number {
    const o = scroll.offset;
    const raw = Math.abs(o - last.current) / Math.max(dt, 1 / 240);
    last.current = o;
    // EMA — fast attack, slow decay
    const k = raw > smoothed.current ? 0.4 : 0.06;
    smoothed.current += (raw - smoothed.current) * k;
    return smoothed.current;
  };
}
