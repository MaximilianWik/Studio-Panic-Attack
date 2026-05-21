/**
 * Section registry. Each section occupies a slice of the scroll range.
 * `pages` units in <ScrollControls pages={N}> determine total scroll length.
 *
 * Layout (top → bottom):
 *   hero        : 1 page
 *   gallery     : 1.2 pages
 *   graphic     : 1.2 pages
 *   threeD      : 1.2 pages
 *   ai          : 1.2 pages
 *   ux          : 1.2 pages
 *   highlights  : 1.0 pages
 *
 * Total = 8.0 pages.
 */

export type SectionId =
  | 'hero'
  | 'gallery'
  | 'graphic'
  | 'threeD'
  | 'ai'
  | 'ux'
  | 'highlights';

export interface SectionDef {
  id: SectionId;
  /** scroll length in pages (1 page = 1 viewport height) */
  length: number;
}

export const sections: SectionDef[] = [
  { id: 'hero', length: 1.0 },
  { id: 'gallery', length: 1.2 },
  { id: 'graphic', length: 1.2 },
  { id: 'threeD', length: 1.2 },
  { id: 'ai', length: 1.2 },
  { id: 'ux', length: 1.2 },
  { id: 'highlights', length: 1.0 },
];

export const TOTAL_PAGES = sections.reduce((sum, s) => sum + s.length, 0);

/** Returns [startNorm, endNorm] in 0..1 along the full scroll range. */
export function getSectionRange(id: SectionId): [number, number] {
  let acc = 0;
  for (const s of sections) {
    const start = acc / TOTAL_PAGES;
    acc += s.length;
    const end = acc / TOTAL_PAGES;
    if (s.id === id) return [start, end];
  }
  return [0, 1];
}

/**
 * World-Y position for a section's center.
 * Higher index = lower in the world (more negative Y).
 * VIEWPORT_HEIGHT_UNITS is the world-space camera viewport height at z=0.
 */
export const VIEWPORT_HEIGHT_UNITS = 10;

export function getSectionWorldY(id: SectionId): number {
  let acc = 0;
  for (const s of sections) {
    const center = acc + s.length / 2;
    acc += s.length;
    if (s.id === id) return -center * VIEWPORT_HEIGHT_UNITS;
  }
  return 0;
}
