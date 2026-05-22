/**
 * Section registry — v6.
 * - Gallery extended to 2.0 pages so the carousel has space to breathe
 *   before the user falls into category 01 (was 1.5 → felt cramped,
 *   01 read on top of the gallery).
 * - 3D (02) shrunk to 0.4 pages — it has no sculpture (relocated to
 *   01), only text, so it doesn't need a full page. This pulls
 *   Hedgehog (03) much closer to Knot (01): graphic→ai distance
 *   collapses from 18 → 13 world units.
 * - Net total stays at 7.1 pages, so Layout.tsx's hardcoded travel
 *   range (64.5) does NOT need to change.
 */

export type SectionId =
  | 'hero'
  | 'gallery'
  | 'graphic'
  | 'threeD'
  | 'ai'
  | 'ux'
  | 'vocabulary'
  | 'highlights';

export interface SectionDef {
  id: SectionId;
  length: number;
  label: string;
}

export const sections: SectionDef[] = [
  { id: 'hero',       length: 0.6, label: 'Home' },
  { id: 'gallery',    length: 2.0, label: 'Projects' },
  { id: 'graphic',    length: 0.9, label: 'Graphic' },
  { id: 'threeD',     length: 0.4, label: '3D' },
  { id: 'ai',         length: 0.9, label: 'AI' },
  { id: 'ux',         length: 0.9, label: 'UX' },
  { id: 'vocabulary', length: 0.7, label: 'Vocabulary' },
  { id: 'highlights', length: 0.7, label: 'Highlights' },
];

export const TOTAL_PAGES = sections.reduce((sum, s) => sum + s.length, 0);

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
