/**
 * Single source of truth for "give me the best optimized variant of this URL
 * at the given width". Backed by `OPTIMIZED_INDEX` from the generated media
 * manifest, which is keyed by ORIGINAL URL (e.g. `/landing/foo.png` or
 * `/2.%20Projects/3.%203D/IMG_2309.PNG`).
 *
 * Use cases:
 *   - THREE.js textures (Gallery, ScatteredImages) — load `.1080.webp` instead
 *     of the multi-MB original; ~5–10× cheaper decode for the same on-screen
 *     resolution.
 *   - Manual `<img>` tags where threading webpSrcset through the React tree
 *     would be invasive (e.g. Highlights card backgrounds, hero strips).
 *
 * The `<Img>` helper (helpers/media.tsx) already accepts webpSrcset/avifSrcset
 * directly from MediaAsset and should be preferred when the data is at hand.
 */
import { OPTIMIZED_INDEX, type OptimizedSiblings } from '../generated/mediaManifest';

export type OptimizedWidth = 480 | 1080 | 1920;

/**
 * Pick the best WebP variant URL for the requested target width.
 *
 * Snaps UP to the nearest available variant — asking for 700 returns 1080
 * (so you don't get a fuzzy upscale), asking for 1200 returns 1920, etc.
 * Returns the original `url` unchanged when no optimized siblings exist
 * (e.g. the asset is below the optimizer's 200 KB threshold, or optimize
 * hasn't been run yet).
 */
export function pickOptimized(url: string, width: OptimizedWidth = 1080): string {
  const opt = OPTIMIZED_INDEX[url];
  if (!opt) return url;
  if (width <= 480 && opt.webp480) return opt.webp480;
  if (width <= 1080 && opt.webp1080) return opt.webp1080;
  if (opt.webp1920) return opt.webp1920;
  return opt.webp1080 ?? opt.webp480 ?? url;
}

/** Lookup the LQIP placeholder for a URL, or null if none. */
export function pickLqip(url: string): string | null {
  return OPTIMIZED_INDEX[url]?.lqip ?? null;
}

/** Full optimized siblings record for a URL, or null if none. */
export function getOptimized(url: string): OptimizedSiblings | null {
  return OPTIMIZED_INDEX[url] ?? null;
}

/**
 * Convenience for building <picture>-style props from a raw URL when the
 * caller doesn't have a MediaAsset in hand. Returns sane defaults when no
 * optimized siblings exist.
 */
export function buildPictureProps(url: string): {
  webpSrcset?: string;
  avifSrcset?: string;
  lqip?: string;
} {
  const o = OPTIMIZED_INDEX[url];
  if (!o) return {};
  const webpEntries: string[] = [];
  if (o.webp480) webpEntries.push(`${o.webp480} 480w`);
  if (o.webp1080) webpEntries.push(`${o.webp1080} 1080w`);
  if (o.webp1920) webpEntries.push(`${o.webp1920} 1920w`);
  return {
    webpSrcset: webpEntries.length ? webpEntries.join(', ') : undefined,
    avifSrcset: o.avif1080 ? `${o.avif1080} 1080w` : undefined,
    lqip: o.lqip ?? undefined,
  };
}
