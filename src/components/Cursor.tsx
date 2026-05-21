import { useEffect, useRef } from 'react';

/**
 * Custom DOM cursor — not part of the R3F tree.
 *
 * Why DOM and not a 3D crosshair: the 3D scene renders inside drei's
 * <ScrollControls> which positions <Canvas> in a transformed scroll
 * container. Pointer events still come from the native DOM, so a fixed
 * DOM dot tracking pointer-move is the cheapest way to get a smooth
 * cursor that responds to interactive elements anywhere on the page.
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
