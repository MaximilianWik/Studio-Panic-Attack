import { useThree } from '@react-three/fiber';
import { useRef } from 'react';

/**
 * Smoothed pointer-velocity in NDC units / second.
 *
 * Returns a function that should be called every frame from useFrame
 * (passing dt). Tracks the previous NDC pointer position and emits a
 * smoothed magnitude. Cheap — just two refs and a couple of subtractions.
 */
export function usePointerVelocity() {
  const { pointer } = useThree();
  const lastX = useRef(0);
  const lastY = useRef(0);
  const smoothed = useRef(0);

  return function tick(dt: number): number {
    const px = pointer.x;
    const py = pointer.y;
    const dx = px - lastX.current;
    const dy = py - lastY.current;
    lastX.current = px;
    lastY.current = py;

    const raw = Math.hypot(dx, dy) / Math.max(dt, 1 / 240);
    // EMA: fast attack, slow decay so the value lingers briefly after motion stops
    const k = raw > smoothed.current ? 0.45 : 0.08;
    smoothed.current += (raw - smoothed.current) * k;
    return smoothed.current;
  };
}

export default usePointerVelocity;
