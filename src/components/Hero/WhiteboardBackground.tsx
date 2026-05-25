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

const VP_Y_FRAC  = 0.18;  // vanishing point as fraction of screen height
const SCROLL_RPS = 0.55;  // rows that scroll past per second
const NUM_ROWS   = 22;    // horizontal lines visible at once
const NUM_COLS   = 11;    // base columns each side (determines cell spacing)
const MAX_COLS   = 38;    // hard cap — near-horizon rows get more columns dynamically
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

      // Screen x of column j given the already-computed t^EXPO value.
      // At t=1 (tExpo=1, bottom row): x = VPx ± j*cellBase → viewport edges.
      const projX = (j: number, tExpo: number) =>
        VPx + j * cellBase * tExpo;

      // ── Background ────────────────────────────────────────────────────────
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, Wl, Hl);

      // ── Precompute visible rows ───────────────────────────────────────────
      // t_i = (i + rowOffset) / NUM_ROWS.  Only keep rows where t ∈ (0, 1].
      type Row = { t: number; tExpo: number; y: number };
      const rows: Row[] = [];
      for (let i = 0; i <= NUM_ROWS; i++) {
        const t = (i + rowOffset) / NUM_ROWS;
        if (t <= 0 || t > 1.0) continue;
        const tExpo = Math.pow(t, ROW_EXPO);
        rows.push({ t, tExpo, y: projY(t) });
      }

      // ── Vertical lines (fixed, radiate from VP) ───────────────────────────
      // Drawn for MAX_COLS each side. For j > NUM_COLS the bottom lands
      // off-screen; canvas clips, but the upper portion fans into the viewport
      // filling the sides that would otherwise be empty near the horizon.
      ctx.lineWidth = 0.4;
      for (let j = -MAX_COLS; j <= MAX_COLS; j++) {
        const xBot    = projX(j, 1); // tExpo=1 at the bottom row
        const distFrac = Math.abs(j) / MAX_COLS;
        const alpha   = (1 - distFrac * 0.55) * 0.20;
        if (alpha < 0.01) continue;
        ctx.beginPath();
        ctx.moveTo(VPx, VPy);
        ctx.lineTo(xBot, Hl);
        ctx.strokeStyle = rgba(LINE_RGB, alpha);
        ctx.stroke();
      }

      // ── Horizontal lines (scrolling, full viewport width) ────────────────
      // Always span 0 → Wl so the grid fills edge-to-edge at every depth.
      for (const { t, y } of rows) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(Wl, y);
        ctx.strokeStyle = rgba(LINE_RGB, t * 0.44);
        ctx.lineWidth   = 0.3 + t * 0.8;
        ctx.stroke();
      }

      // ── Crosses at intersections ──────────────────────────────────────────
      // jMax is computed per row: ceil(NUM_COLS / tExpo) gives exactly the
      // column count needed to reach the viewport edge at this depth, capped
      // at MAX_COLS. This means shallow rows get many small crosses that fill
      // the full width, and deep rows get fewer larger crosses.
      for (const { t, tExpo, y } of rows) {
        const crossSz   = 1.5 + t * 6.5;  // 1.5 px near horizon → 8 px at bottom
        const crossLW   = 0.6 + t * 0.9;
        const baseAlpha = t * 0.68;
        const jMax      = Math.min(MAX_COLS, Math.ceil(NUM_COLS / tExpo));

        ctx.lineWidth = crossLW;

        for (let j = -jMax; j <= jMax; j++) {
          const x        = projX(j, tExpo);
          if (x < -crossSz || x > Wl + crossSz) continue;
          const distFrac = Math.abs(j) / jMax;
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
      // Slightly lessened: span×0.12 (was 0.16), solid stop at 0.4 (was 0.6).
      const fogBot = VPy + span * 0.12;
      const fog    = ctx.createLinearGradient(0, VPy, 0, fogBot);
      fog.addColorStop(0,   BG_COLOR);
      fog.addColorStop(0.4, BG_COLOR);
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
