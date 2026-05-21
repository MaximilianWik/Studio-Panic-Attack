import { useEffect, useRef } from 'react';

/**
 * Custom DOM cursor — not part of the R3F tree.
 *
 * The body has `cursor: none`; this div replaces the OS pointer with a
 * dot that scales up to a ring when hovering interactive elements.
 *
 * Why DOM rather than a 3D crosshair: pointer events come from the native
 * DOM regardless of where they bubble through r3f, and a fixed-position
 * div with a single transform per frame is the cheapest possible cursor.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;

    // Seed an initial position immediately so the cursor never sits at (0,0).
    el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const interactive = t.closest('a, button, [data-cursor="hover"]');
      if (interactive) el.classList.add('hover');
      else el.classList.remove('hover');
    };

    const tick = () => {
      // critically-damped follow
      cx += (tx - cx) * 0.25;
      cy += (ty - cy) * 0.25;
      el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerover', onOver);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="cursor" aria-hidden />;
}
