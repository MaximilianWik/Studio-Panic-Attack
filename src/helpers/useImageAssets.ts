/**
 * Static asset manifest. Mirrors the contents of `public/landing/`.
 *
 * Filenames are pre-sanitized to ASCII-safe lowercase kebab-case so we
 * never deal with URL-encoding edge cases (spaces, parens, ampersands)
 * which Vite's static middleware handles inconsistently.
 */

const RAW_IMAGES = [
  '000008390027_26a.jpg',
  '000008390032_31a.jpg',
  '000008390034_33a-copy-2.jpg',
  'add-more-chaos.png',
  'artist-frame-1.png',
  'artist-frame-2.png',
  'blob-ogzeet.png',
  'cemetery-scene1.png',
  'cemetery-scene16.png',
  'cemetery-scene20.png',
  'chrome-type-bw-4.png',
  'glasserrorscrnshot.png',
  'holistic-letter-from-the-editor-and-3d-article.png',
  'img_1027-2.png',
  'img_1034.png',
  'img_1041-1.png',
  'img_2778.png',
  'img_2832.png',
  'img_3370.png',
  'img_3375.png',
  'img_4145-1.jpg',
  'img_4253-1.jpg',
  'img_4256.jpg',
  'img_4258.jpg',
  'img_4263.jpg',
  'img_4269.jpg',
  'img_4285.jpg',
  'img_4287-1.jpg',
  'img_4288.jpg',
  'img_4294.jpg',
  'img_4296.jpg',
  'img_4297.jpg',
  'img_4298.jpg',
  'img_4303.jpg',
  'img_4559-1.jpg',
  'img_8105.png',
  'img_9089.png',
  'img_9247.png',
  'img_9258.jpeg',
  'img_9712-min.png',
  'img_9748a-min.png',
  'img_9754-min.png',
  'img_9788-min.png',
  'img_9790-min.png',
  'img_9791-min.png',
  'img_9793-min.png',
  'img_9794-min.png',
  'img_9796-min.png',
  'img_9800-min-1.png',
  'img_9805-min.jpeg',
  'img_9826-min.png',
  'jolly-smile-design.png',
  'levelsequence-1.0011.png',
  'panic-attack-type-final-in-a-row.png',
  'paper.portfolio_journal.9.png',
  'poster-story.png',
  'rustycementt.png',
  'skjermbilde-2024-05-07-011311.png',
  'underwater13.jpg',
  'untitled5.png',
  'urbanwarholtv.png',
];

const RAW_VIDEOS = [
  '01-done-downloaded-from-ig.mp4',
  '68-epic_motion.mp4',
  'the_lovers_i.mp4',
];

export const LOGO_URL = '/logo/PanicAttackLogo.png';

export const portfolioImages: readonly string[] = RAW_IMAGES.map(
  (n) => `/landing/${n}`,
);

export const portfolioVideos: readonly string[] = RAW_VIDEOS.map(
  (n) => `/landing/${n}`,
);

/** Deterministic 32-bit hash from a string — used as a seed source. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick `count` images deterministically based on a tag string. Uses a
 * golden-ratio multiplier to distribute picks across the image pool with
 * minimal repetition for small counts.
 */
export function pickImages(tag: string, count: number): string[] {
  if (portfolioImages.length === 0) return [];
  const seed = hash(tag);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(portfolioImages[(seed + i * 2654435761) % portfolioImages.length]!);
  }
  return out;
}

/** Mulberry32 PRNG — small, fast, deterministic. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
