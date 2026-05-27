/**
 * assetUrl — return the best on-disk WebP variant for a public-folder image.
 *
 * Background
 *   The original implementation routed `/landing/*` through
 *   `images.weserv.nl` to transcode and resize on the fly. That worked but
 *   added third-party latency on first hit, depended on weserv staying up,
 *   and produced no benefit for assets outside `/landing/`.
 *
 *   We now run a local optimize pass (scripts/optimize-public-assets.mjs)
 *   that emits `.480.webp / .1080.webp / .1920.webp / .lqip.txt` siblings
 *   for every raster ≥ 200 KB across the entire `public/` tree. This helper
 *   simply looks up the best sibling for the requested target width and
 *   returns its URL. No network round-trips, no proxy.
 *
 * Behaviour
 *   - When an optimized sibling exists for `path`, returns the WebP URL at
 *     a width ≥ `opts.width` (snaps UP — never serves a blurry upscale).
 *   - When no sibling exists (asset below the 200 KB threshold, or
 *     pre-optimize), returns `path` unchanged. Layout still works.
 *   - Identical behaviour in dev and prod — the WebP siblings are committed
 *     and Vite serves them straight from `public/`.
 *
 * Quality is no longer a runtime knob — it's baked into the optimize step
 * (q=78 for WebP, q=50 for AVIF). The `quality` field is accepted but
 * ignored, kept for backward compatibility with existing call sites.
 */
import { pickOptimized, type OptimizedWidth } from './optimizedSrc';

export interface AssetUrlOpts {
  /**
   * Target longest edge (px). Snaps UP to one of 480 / 1080 / 1920 — the
   * three sizes the optimizer emits. Defaults to 1080 (good for desktop
   * viewport-scale images; pick 1920 only when you really need full-bleed
   * detail like a hero or lightbox source).
   */
  width?: number;
  /** @deprecated quality is baked into the optimize pass, this is ignored. */
  quality?: number;
}

function snapWidth(w: number): OptimizedWidth {
  if (w <= 480) return 480;
  if (w <= 1080) return 1080;
  return 1920;
}

/**
 * Convert a public-folder path into the URL that should actually be fetched.
 * Pass-through for unknown paths (logos, fonts, anything not optimized).
 */
export function assetUrl(path: string, opts: AssetUrlOpts = {}): string {
  const target = snapWidth(opts.width ?? 1080);
  return pickOptimized(path, target);
}
