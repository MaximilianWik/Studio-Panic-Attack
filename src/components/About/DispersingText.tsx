import { useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * DispersingText — renders multiple text blocks as individually-dispersible
 * characters. A single `pointermove` listener on the container and a single
 * RAF loop drives ALL chars. Chars near the cursor get pushed away; they
 * spring back when the cursor leaves.
 */

export interface TextBlock {
  /** The string to render. */
  text: string;
  /** CSS class applied to the wrapper <span> of this block. */
  className?: string;
  /** HTML tag for the block wrapper. Defaults to 'span'. */
  tag?: keyof React.JSX.IntrinsicElements;
}

interface Props {
  blocks: TextBlock[];
  /** Radius in px within which chars get dispersed. Default 120. */
  radius?: number;
  /** Max displacement in px. Default 60. */
  maxDisplace?: number;
  /** Spring factor (0-1) — how fast chars return. Default 0.08. */
  spring?: number;
  /** Friction damping (0-1). Default 0.85. */
  friction?: number;
  className?: string;
}

interface CharState {
  el: HTMLSpanElement;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function DispersingText({
  blocks,
  radius = 120,
  maxDisplace = 60,
  spring = 0.08,
  friction = 0.85,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<CharState[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // Collect all char spans after mount.
  const initChars = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const spans = container.querySelectorAll<HTMLSpanElement>('[data-dchar]');
    const rect = container.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const chars: CharState[] = [];
    spans.forEach((el) => {
      const r = el.getBoundingClientRect();
      chars.push({
        el,
        homeX: r.left + r.width / 2 - rect.left + scrollX - container.offsetLeft,
        homeY: r.top + r.height / 2 - rect.top + scrollY - container.offsetTop,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
    });
    charsRef.current = chars;
  }, []);

  // Single RAF loop.
  const tick = useCallback(() => {
    if (!mountedRef.current) return;
    const chars = charsRef.current;
    const container = containerRef.current;
    if (!container || chars.length === 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const rect = container.getBoundingClientRect();
    const mx = mouseRef.current.x - rect.left;
    const my = mouseRef.current.y - rect.top;
    const r2 = radius * radius;

    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const dx = c.homeX - mx;
      const dy = c.homeY - my;
      const dist2 = dx * dx + dy * dy;

      if (dist2 < r2 && dist2 > 0) {
        const dist = Math.sqrt(dist2);
        const force = (1 - dist / radius) * maxDisplace * 0.15;
        c.vx += (dx / dist) * force;
        c.vy += (dy / dist) * force;
      }

      // Spring back to home.
      c.vx += -c.x * spring;
      c.vy += -c.y * spring;
      // Friction.
      c.vx *= friction;
      c.vy *= friction;
      // Integrate.
      c.x += c.vx;
      c.y += c.vy;
      // Clamp.
      const len = Math.sqrt(c.x * c.x + c.y * c.y);
      if (len > maxDisplace) {
        const scale = maxDisplace / len;
        c.x *= scale;
        c.y *= scale;
      }
      // Apply transform only if meaningful.
      if (Math.abs(c.x) > 0.2 || Math.abs(c.y) > 0.2) {
        c.el.style.transform = `translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px)`;
      } else if (c.el.style.transform) {
        c.el.style.transform = '';
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [radius, maxDisplace, spring, friction]);

  // Pointer listener.
  const onPointerMove = useCallback((e: PointerEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Allow layout to settle.
    const t = setTimeout(() => {
      initChars();
      rafRef.current = requestAnimationFrame(tick);
    }, 100);
    window.addEventListener('pointermove', onPointerMove);

    // Recalculate home positions on resize.
    const onResize = () => initChars();
    window.addEventListener('resize', onResize);

    return () => {
      mountedRef.current = false;
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
    };
  }, [initChars, tick, onPointerMove]);

  // Build the char spans once.
  const rendered = useMemo(() => {
    return blocks.map((block, bi) => {
      const Tag = (block.tag ?? 'span') as any;
      const chars = block.text.split('').map((ch, ci) => (
        <span
          key={ci}
          data-dchar=""
          className="dtext-char"
          style={{ display: 'inline-block', willChange: 'transform' }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ));
      return (
        <Tag key={bi} className={block.className ?? ''}>
          {chars}
        </Tag>
      );
    });
  }, [blocks]);

  return (
    <div ref={containerRef} className={className ?? ''} style={{ position: 'relative' }}>
      {rendered}
    </div>
  );
}

export default DispersingText;
