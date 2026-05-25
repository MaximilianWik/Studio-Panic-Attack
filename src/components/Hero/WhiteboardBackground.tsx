import { useEffect, useRef } from 'react';

/**
 * WhiteboardBackground
 *
 * Canvas-based animated perspective grid. Simulates looking down at a
 * receding ground plane — like a Figma/Notion canvas stretching away
 * from you. Key properties:
 *
 * - Single vanishing point at top-centre (~38 % of viewport height).
 * - Horizontal grid lines scroll toward the viewer continuously.
 * - Vertical lines radiate from the VP and are fixed.
 * - `+` crosses are drawn at every computed intersection (not at cell
 *   centres of a CSS tile — they follow the perspective projection).
 * - Everything fades to zero alpha at the horizon (depth fog).
 * - HiDPI-aware: canvas is sized in physical pixels, drawn in logical px.
 */

// ── Tunables ────────────────────────────────────────────────────────────────

const VP_Y_FRAC  = 0.38;  // vanishing point as fraction of screen height
const SCROLL_RPS = 0.55;  // rows that scroll past per second
const NUM_ROWS   = 22;    // horizontal lines visible at once
const NUM_COLS   = 11;    // columns each side of centre (VP fills viewport edge)
const ROW_EXPO   = 0.68;  // perspective curvature: lower = more dramatic bunching

// ── Colours ─────────────────────────────────────────────────────────────────

const BG_COLOR    = '#fafafa';
const LINE_RGB    = '175, 178, 192' as const;   // cool grey, grid lines
const CROSS_RGB   = '105, 110, 130' as const;   // slightly darker, crosses

// ── Helpers ─────────────────────────────────────────────────────────────────

function rgba(rgb: string, a: number): string {
  return `rgba(${rgb},${a.toFixed(3)})`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function WhiteboardBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = 0;
    let lastTs  = 0;
    let rowOffset = 0; // ∈ [0, 1) — fractional row position

    // Physical-pixel resize -------------------------------------------------
    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(window.innerWidth  * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    setup();
    window.addEventListener('resize', setup);

    // ── Draw loop ───────────────────────────────────────────────────────────
    const tick = (now: number) => {
      if (!lastTs) lastTs = now;
      const dt = Math.min((now - lastTs) / 1000, 1 / 20); // cap at 50 ms
      lastTs = now;
      rowOffset = (rowOffset + SCROLL_RPS * dt) % 1;

      const dpr = window.devicePixelRatio || 1;
      const W   = canvas.width;
      const H   = canvas.height;
      const ctx = canvas.getContext('2d')!;

      // Work in logical (CSS) pixels by scaling the context once.
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const Wl = W / dpr;
      const Hl = H / dpr;

      // Derived geometry
      const VPy      = Hl * VP_Y_FRAC;
      const VPx      = Wl / 2;
      const span     = Hl - VPy;                      // pixel distance VP→bottom
      const cellBase = VPx / NUM_COLS;                // column spacing at bottom row

      // Project a fractional depth t ∈ [0,1] to a screen y.
      // t=0 → VPy (horizon), t=1 → Hl (bottom).
      const projY = (t: number) => VPy + span * Math.pow(t, ROW_EXPO);

      // Screen x of column j at depth t.
      // At t=1 (bottom): x = VPx ± j*cellBase → left/right viewport edge.
      const projX = (j: number, t: number) =>
        VPx + j * cellBase * Math.pow(t, ROW_EXPO);

      // ── Background ────────────────────────────────────────────────────────
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, Wl, Hl);

      // ── Precompute visible rows ───────────────────────────────────────────
      // t_i = (i + rowOffset) / NUM_ROWS.  Only keep rows where t ∈ (0, 1].
      type Row = { t: number; y: number };
      const rows: Row[] = [];
      for (let i = 0; i <= NUM_ROWS; i++) {
        const t = (i + rowOffset) / NUM_ROWS;
        if (t <= 0 || t > 1.0) continue;
        rows.push({ t, y: projY(t) });
      }

      // ── Vertical lines (fixed, radiate from VP) ───────────────────────────
      ctx.lineWidth = 0.4;
      for (let j = -NUM_COLS; j <= NUM_COLS; j++) {
        const xBot    = projX(j, 1); // bottom endpoint (t = 1)
        const distFrac = Math.abs(j) / NUM_COLS;
        const alpha   = (1 - distFrac * 0.5) * 0.22;
        ctx.beginPath();
        ctx.moveTo(VPx, VPy);
        ctx.lineTo(xBot, Hl);
        ctx.strokeStyle = rgba(LINE_RGB, alpha);
        ctx.stroke();
      }

      // ── Horizontal lines (scrolling) ──────────────────────────────────────
      for (const { t, y } of rows) {
        const alpha  = t * 0.46;
        const lineW  = 0.3 + t * 0.8;
        const xL     = projX(-NUM_COLS, t); // left endpoint
        const xR     = projX( NUM_COLS, t); // right endpoint

        ctx.beginPath();
        ctx.moveTo(xL, y);
        ctx.lineTo(xR, y);
        ctx.strokeStyle = rgba(LINE_RGB, alpha);
        ctx.lineWidth   = lineW;
        ctx.stroke();
      }

      // ── Crosses at intersections ──────────────────────────────────────────
      // Drawn on top of the grid so they read clearly.
      for (const { t, y } of rows) {
        const crossSz   = 1.5 + t * 6.5;  // 1.5 px near horizon → 8 px at bottom
        const crossLW   = 0.6 + t * 0.9;
        const baseAlpha = t * 0.70;

        ctx.lineWidth = crossLW;

        for (let j = -NUM_COLS; j <= NUM_COLS; j++) {
          const x        = projX(j, t);
          const distFrac = Math.abs(j) / NUM_COLS;
          const alpha    = baseAlpha * (1 - distFrac * 0.42);
          if (alpha < 0.025) continue;

          ctx.beginPath();
          ctx.moveTo(x - crossSz, y);
          ctx.lineTo(x + crossSz, y);
          ctx.moveTo(x, y - crossSz);
          ctx.lineTo(x, y + crossSz);
          ctx.strokeStyle = rgba(CROSS_RGB, alpha);
          ctx.stroke();
        }
      }

      // ── Horizon fog ───────────────────────────────────────────────────────
      // Gradient from solid BG at the VP down ~16 % of the grid span,
      // fading the grid gently into the background colour so the horizon
      // isn't a hard cutoff.
      const fogBot = VPy + span * 0.16;
      const fog    = ctx.createLinearGradient(0, VPy, 0, fogBot);
      fog.addColorStop(0,   BG_COLOR);
      fog.addColorStop(0.6, BG_COLOR);
      fog.addColorStop(1,   'rgba(250,250,250,0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, Wl, fogBot);

      // Cover everything above the horizon line with solid BG.
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, Wl, VPy);

      ctx.restore();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', setup);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

export default WhiteboardBackground;
