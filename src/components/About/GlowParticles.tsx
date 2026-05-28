import { useRef, useEffect, useCallback } from 'react';

/**
 * GlowParticles — full-page interactive particle canvas.
 * Particles drift lazily; the cursor attracts them (within a radius)
 * and they glow brighter near it. Fully self-contained: one canvas,
 * one RAF loop.
 */

interface Props {
  /** Number of particles. Default 80. */
  count?: number;
  /** Attraction radius in px. Default 200. */
  attractRadius?: number;
  /** Base hue (0-360). Default 270 (purple). */
  hue?: number;
  /** Hue variance ±. Default 40. */
  hueSpread?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  hue: number;
  alpha: number;
  pulse: number; // phase offset for size pulsing
}

export function GlowParticles({
  count = 80,
  attractRadius = 200,
  hue = 270,
  hueSpread = 40,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });

  const initParticles = useCallback((w: number, h: number) => {
    const ps: Particle[] = [];
    for (let i = 0; i < count; i++) {
      ps.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseSize: 1.5 + Math.random() * 2.5,
        hue: hue + (Math.random() - 0.5) * hueSpread * 2,
        alpha: 0.3 + Math.random() * 0.4,
        pulse: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = ps;
  }, [count, hue, hueSpread]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    sizeRef.current = { w, h };
    if (particlesRef.current.length === 0) initParticles(w, h);
  }, [initParticles]);

  const tick = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    const dpr = canvas.width / w || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const r2 = attractRadius * attractRadius;
    const particles = particlesRef.current;
    const t = time * 0.001;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Attraction to cursor.
      const dx = mx - p.x;
      const dy = my - p.y;
      const dist2 = dx * dx + dy * dy;
      let proximity = 0; // 0..1, 1 = right at cursor
      if (dist2 < r2 && dist2 > 0) {
        const dist = Math.sqrt(dist2);
        proximity = 1 - dist / attractRadius;
        const force = proximity * 0.6;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      // Drift friction.
      p.vx *= 0.96;
      p.vy *= 0.96;
      // Integrate.
      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges.
      if (p.x < -20) p.x = w + 20;
      else if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      else if (p.y > h + 20) p.y = -20;

      // Pulsing size.
      const size = p.baseSize + Math.sin(t * 1.5 + p.pulse) * 0.8;
      // Glow intensity increases near cursor.
      const glowAlpha = p.alpha + proximity * 0.5;
      const glowSize = size + proximity * 4;

      // Fire/film palette: at rest = deep red/amber, near cursor = bright orange/yellow.
      const litHue = p.hue + proximity * 15; // shift toward yellow when attracted
      const litLight = 45 + proximity * 25;  // 45% dim ember → 70% bright flame
      const litSat = 85 + proximity * 10;

      // Outer glow.
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize * 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${litHue}, ${litSat}%, ${litLight - 10}%, ${glowAlpha * 0.15})`;
      ctx.fill();

      // Core.
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${litHue}, ${litSat}%, ${litLight}%, ${glowAlpha})`;
      ctx.fill();
    }

    // Draw faint connections between close particles near the cursor.
    if (mx > 0) {
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const dax = mx - a.x;
        const day = my - a.y;
        if (dax * dax + day * day > r2) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dbx = mx - b.x;
          const dby = my - b.y;
          if (dbx * dbx + dby * dby > r2) continue;
          const abx = b.x - a.x;
          const aby = b.y - a.y;
          const abDist = Math.sqrt(abx * abx + aby * aby);
          if (abDist < 100) {
            const lineAlpha = (1 - abDist / 100) * 0.3;
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 80%, 50%, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
    rafRef.current = requestAnimationFrame(tick);
  }, [attractRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resize();
    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    const parent = canvas.parentElement!;
    parent.addEventListener('pointermove', onMove);
    parent.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
    };
  }, [resize, tick]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? ''}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden
    />
  );
}

export default GlowParticles;
