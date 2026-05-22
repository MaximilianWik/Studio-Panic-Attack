/**
 * Static asset registry. We *could* glob `public/landing/*` at build time
 * via `import.meta.glob`, but Vite's default behaviour with `/public/` is
 * to expose files at root URLs without imports. We list them explicitly
 * here so we can tag them with section affinities and aspect hints.
 *
 * Filenames mirror the on-disk names in `public/landing/` (already
 * sanitized to ASCII-safe lowercase kebab-case during the previous pass).
 */

import type { SectionId } from '../config/sections';
import { assetUrl } from './assetUrl';

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
