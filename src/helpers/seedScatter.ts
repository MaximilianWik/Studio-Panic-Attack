/**
 * Seeded RNG + scatter helpers used by the projects whiteboard.
 *
 * Why deterministic: layouts must look identical between SSR and CSR (we
 * have no SSR but the server might prerender) and across reloads. Math.random
 * would jitter the scatter every navigation, which feels broken on a
 * "whiteboard" page — items should feel pinned in place.
 */

/** Mulberry32 — small, fast, good-enough seedable RNG. */
export function makeRng(seed: number): () => number {
  let t = seed >>> 0;
  return function rng() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string into a uint32 seed (FNV-1a). */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface ScatterRect {
  /** Center X in % of board width. */
  x: number;
  /** Center Y in % of board height. */
  y: number;
  /** Rotation in degrees. */
  rot: number;
  /** Width in % of board width. */
  w: number;
  /** Aspect ratio used for collision (h/w). 1 if unknown. */
  ar: number;
  /** Z-index 0..N for layering. */
  z: number;
}

interface ScatterOptions {
  /** Bounds (% of width / % of height) — items center will stay inside. */
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
  /** Min / max width as % of board width. */
  size?: { min: number; max: number };
  /** Max rotation +/- degrees. */
  maxRot?: number;
  /** How many tries before giving up on collision avoidance. */
  tries?: number;
}

/** Approximate AABB collision in % space — treats AR=1 if unknown. */
function overlaps(a: ScatterRect, b: ScatterRect, gap: number): boolean {
  const halfWa = a.w / 2 + gap;
  const halfHa = (a.w * a.ar) / 2 + gap;
  const halfWb = b.w / 2 + gap;
  const halfHb = (b.w * b.ar) / 2 + gap;
  return (
    Math.abs(a.x - b.x) < halfWa + halfWb &&
    Math.abs(a.y - b.y) < halfHa + halfHb
  );
}

/**
 * Lay out N items on a board with a seeded scatter — each item gets a
 * deterministic x/y/rot/w. Items try to avoid overlap with a small gap;
 * if the algorithm can't find a free slot in `tries` attempts, it places
 * the item anyway (graceful degrade rather than infinite loop).
 *
 * The aspect ratios are unknown at layout time (we'd have to load images),
 * so we treat everything as 1:1 + small AR jitter for collision purposes.
 * Final visual aspect is governed by CSS object-fit.
 */
export function scatter(seed: number, count: number, opt: ScatterOptions = {}): ScatterRect[] {
  const rng = makeRng(seed);
  const bounds = opt.bounds ?? { minX: 12, maxX: 88, minY: 22, maxY: 86 };
  const size = opt.size ?? { min: 14, max: 22 };
  const maxRot = opt.maxRot ?? 10;
  const tries = opt.tries ?? 60;
  const gap = 0.5; // %

  const out: ScatterRect[] = [];
  for (let i = 0; i < count; i++) {
    const w = size.min + rng() * (size.max - size.min);
    const ar = 0.7 + rng() * 0.7; // 0.7..1.4 — covers most photo / square / portrait ratios
    const rot = (rng() * 2 - 1) * maxRot;
    let placed = false;
    let candidate: ScatterRect | null = null;
    for (let t = 0; t < tries; t++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);
      candidate = { x, y, rot, w, ar, z: i };
      let ok = true;
      for (const r of out) {
        if (overlaps(candidate, r, gap)) { ok = false; break; }
      }
      if (ok) { placed = true; break; }
    }
    out.push(candidate ?? { x: 50, y: 50, rot, w, ar, z: i });
    void placed;
  }
  return out;
}
