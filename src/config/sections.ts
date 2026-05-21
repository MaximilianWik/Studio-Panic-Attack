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
  { id: 'hero', length: 0.85, label: 'Home' },
  { id: 'gallery', length: 1.0, label: 'Projects' },
  { id: 'graphic', length: 0.85, label: 'Graphic' },
  { id: 'threeD', length: 0.85, label: '3D' },
  { id: 'ai', length: 0.85, label: 'AI' },
  { id: 'ux', length: 0.85, label: 'UX' },
  { id: 'vocabulary', length: 0.85, label: 'Vocabulary' },
  { id: 'highlights', length: 1.0, label: 'Highlights' },
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
