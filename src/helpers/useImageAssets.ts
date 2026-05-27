/**
 * Static asset registry. We *could* glob `public/landing/*` at build time
 * via `import.meta.glob`, but Vite's default behaviour with `/public/` is
 * to expose files at root URLs without imports. We list them explicitly
 * here so we can tag them with section affinities and aspect hints.
 *
 * Filenames mirror the on-disk names in `public/landing/` (already
 * sanitized to ASCII-safe lowercase kebab-case during the previous pass).
 *
 * For the home-page Gallery, the pool no longer pulls only `/landing/*`
 * gallery images — it now mixes EVERY image from EVERY project folder
 * (via `getAllPortfolioImages()`) shuffled deterministically. Aspect and
 * dimensions come from the manifest's intrinsic width/height fields when
 * available (sharp metadata baked in at gen:manifest time), so each slot
 * sizes correctly even before its texture has finished decoding.
 */

import type { SectionId } from '../config/sections';
import { assetUrl } from './assetUrl';
import { PROJECT_FOLDERS, LANDING_ASSETS, type MediaAsset } from '../generated/mediaManifest';

export interface AssetEntry {
  /** root-relative URL, e.g. /landing/img_4145-1.jpg */
  url: string;
  /** rough section affinity (used for clustering scattered images) */
  affinity: SectionId | 'gallery';
  /** w/h hint (used for aspect-fit before loader resolves) */
  aspect: number;
  /** kind */
  kind: 'image' | 'video';
}

const L = (f: string) => assetUrl('/landing/' + f);

export const assets: AssetEntry[] = [
  // photography / film stills → photography flavor for graphic + 3D
  { url: L('000008390027_26a.jpg'), affinity: 'graphic', aspect: 1.5, kind: 'image' },
  { url: L('000008390032_31a.jpg'), affinity: 'graphic', aspect: 1.5, kind: 'image' },
  { url: L('000008390034_33a-copy-2.jpg'), affinity: 'graphic', aspect: 1.5, kind: 'image' },
  { url: L('underwater13.jpg'), affinity: 'graphic', aspect: 1.5, kind: 'image' },

  // 3D scenes
  { url: L('cemetery-scene1.png'), affinity: 'threeD', aspect: 1.78, kind: 'image' },
  { url: L('cemetery-scene16.png'), affinity: 'threeD', aspect: 1.78, kind: 'image' },
  { url: L('cemetery-scene20.png'), affinity: 'threeD', aspect: 1.78, kind: 'image' },
  { url: L('levelsequence-1.0011.png'), affinity: 'threeD', aspect: 1.78, kind: 'image' },
  { url: L('rustycementt.png'), affinity: 'threeD', aspect: 1.0, kind: 'image' },
  { url: L('blob-ogzeet.png'), affinity: 'threeD', aspect: 1.0, kind: 'image' },

  // ai art
  { url: L('chrome-type-bw-4.png'), affinity: 'ai', aspect: 1.0, kind: 'image' },
  { url: L('img_2778.png'), affinity: 'ai', aspect: 1.0, kind: 'image' },
  { url: L('img_2832.png'), affinity: 'ai', aspect: 1.0, kind: 'image' },
  { url: L('img_3370.png'), affinity: 'ai', aspect: 1.0, kind: 'image' },
  { url: L('img_3375.png'), affinity: 'ai', aspect: 1.0, kind: 'image' },
  { url: L('add-more-chaos.png'), affinity: 'ai', aspect: 1.5, kind: 'image' },
  { url: L('jolly-smile-design.png'), affinity: 'ai', aspect: 1.0, kind: 'image' },
  { url: L('panic-attack-type-final-in-a-row.png'), affinity: 'ai', aspect: 2.0, kind: 'image' },

  // ux / editorial
  { url: L('glasserrorscrnshot.png'), affinity: 'ux', aspect: 1.78, kind: 'image' },
  { url: L('holistic-letter-from-the-editor-and-3d-article.png'), affinity: 'ux', aspect: 1.5, kind: 'image' },
  { url: L('paper.portfolio_journal.9.png'), affinity: 'ux', aspect: 1.4, kind: 'image' },
  { url: L('poster-story.png'), affinity: 'ux', aspect: 0.75, kind: 'image' },
  { url: L('urbanwarholtv.png'), affinity: 'ux', aspect: 1.0, kind: 'image' },
  { url: L('skjermbilde-2024-05-07-011311.png'), affinity: 'ux', aspect: 1.6, kind: 'image' },

  // gallery hero
  { url: L('artist-frame-1.png'), affinity: 'gallery', aspect: 0.75, kind: 'image' },
  { url: L('artist-frame-2.png'), affinity: 'gallery', aspect: 0.75, kind: 'image' },
  { url: L('img_1027-2.png'), affinity: 'gallery', aspect: 0.75, kind: 'image' },
  { url: L('img_1034.png'), affinity: 'gallery', aspect: 0.75, kind: 'image' },
  { url: L('img_1041-1.png'), affinity: 'gallery', aspect: 0.75, kind: 'image' },
  { url: L('img_4145-1.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4253-1.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4256.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4258.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4263.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4269.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4285.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4287-1.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4288.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4294.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4296.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4297.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4298.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4303.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_4559-1.jpg'), affinity: 'gallery', aspect: 1.5, kind: 'image' },
  { url: L('img_8105.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9089.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9247.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9258.jpeg'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9712-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9748a-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9754-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9788-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9790-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9791-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9793-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9794-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9796-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9800-min-1.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9805-min.jpeg'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('img_9826-min.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
  { url: L('untitled5.png'), affinity: 'gallery', aspect: 1.0, kind: 'image' },
];

export function pickByAffinity(
  affinity: AssetEntry['affinity'],
  fallbackToAll = true,
): AssetEntry[] {
  const matched = assets.filter((a) => a.affinity === affinity);
  if (matched.length || !fallbackToAll) return matched;
  return assets;
}

/**
 * Build the complete cross-project gallery pool: every image asset across
 * every project folder, plus the legacy /landing/ gallery images, deduped
 * by URL. Used by the home-page <Gallery /> so the carousel rotates the
 * full body of work rather than a hand-curated subset.
 *
 * Aspect ratio is taken from the manifest's intrinsic width/height fields
 * (sharp metadata) when present; falls back to 1.0 (square) so the slot
 * has a sensible bounding box before the texture finishes decoding. The
 * box dimensions are corrected post-load by the slot itself.
 *
 * The returned `url` is the ORIGINAL (raw `.png`/`.jpg`) — callers should
 * route it through `pickOptimized()` (or use it as-is for the lightbox
 * source). We intentionally don't pre-resolve the WebP here so the same
 * AssetEntry can drive both the texture (via `.1080.webp`) and the
 * lightbox (full-res original).
 *
 * Order is randomised deterministically (a Mulberry32 PRNG seeded from a
 * stable constant) so reloads see the same shuffle but the carousel
 * doesn't always start with `1. Events`. Pass a different seed at the
 * call site to vary it.
 */
export interface PortfolioImage {
  url: string;
  aspect: number;
  /** Originating project folder ("3. 3D", etc.) or "landing" for the legacy pool. */
  source: string;
  /** Optional manifest-derived metadata (used by callers for srcset/lqip). */
  asset: MediaAsset;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function aspectFromAsset(a: MediaAsset, fallback: number): number {
  if (a.width && a.height && a.height > 0) return a.width / a.height;
  return fallback;
}

export function getAllPortfolioImages(seed = 0xC0FFEE): PortfolioImage[] {
  const out: PortfolioImage[] = [];
  const seen = new Set<string>();

  // 1) Every project folder, every image.
  for (const proj of PROJECT_FOLDERS) {
    for (const a of proj.assets) {
      if (a.type !== 'image') continue;
      if (seen.has(a.url)) continue;
      seen.add(a.url);
      out.push({
        url: a.url,
        aspect: aspectFromAsset(a, 1.33),
        source: proj.folder,
        asset: a,
      });
    }
  }

  // 2) Legacy /landing/* gallery shots — these don't live under a project
  //    folder but were curated for the home-page reel. Include the image
  //    entries; skip videos (Gallery only renders still planes).
  for (const a of LANDING_ASSETS) {
    if (a.type !== 'image') continue;
    if (seen.has(a.url)) continue;
    seen.add(a.url);
    out.push({
      url: a.url,
      aspect: aspectFromAsset(a, 1.0),
      source: 'landing',
      asset: a,
    });
  }

  // 3) Deterministic shuffle so the carousel mixes projects rather than
  //    spinning through them folder-by-folder.
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
}
