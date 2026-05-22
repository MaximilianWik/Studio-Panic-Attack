import { useEffect, useRef, useState } from 'react';

/**
 * Custom DOM cursor: a tight blood-red dot + a lagging outer ring.
 * Pure DOM — does not touch the canvas / r3f tree.
 *
 * Disabled on coarse-pointer / hover-incapable devices (phones, tablets
 * without a precision pointer); CSS in global.css also restores the
 * native cursor on those devices via `@media (hover: none)`.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const apply = () => setEnabled(!mq.matches);
    apply();
    if (mq.addEventListener) {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    // Safari fallback
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove);

    let raf = 0;
    const loop = () => {
      ring.current.x += (target.current.x - ring.current.x) * 0.18;
      ring.current.y += (target.current.y - ring.current.y) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x}px, ${target.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="spa-cursor--ring" />
      <div ref={dotRef} className="spa-cursor" />
    </>
  );
}

export default Cursor;
