/**
 * Section registry — single source of truth for scroll layout.
 *
 * Each section declares how many `pages` it occupies in drei's <ScrollControls>.
 * `offset` is computed cumulatively at module load so consumers can ask
 * `useScrollSection(section.offset, section.pages)` and get a normalized 0..1
 * progress value scoped to that section.
 *
 * `damping` on ScrollControls is set globally in App.tsx; per-section eases
 * are handled inside each section component via its own progress curve.
 */

export type SectionId =
  | 'hero'
  | 'gallery'
  | 'graphic-design'
  | 'three-dee-art'
  | 'ai-art'
  | 'ux-design'
  | 'highlights';

export interface Section {
  id: SectionId;
  pages: number;
  /** filled in below */
  offset: number;
  title: string;
  number?: string;
  body?: string;
}

const rawSections: Omit<Section, 'offset'>[] = [
  {
    id: 'hero',
    pages: 1.2,
    title: 'Studio Panic Attack',
  },
  {
    id: 'gallery',
    pages: 2.0,
    title: 'Selected Work',
  },
  {
    id: 'graphic-design',
    pages: 1.5,
    number: '01',
    title: 'Graphic Design',
    body: 'Design beyond the traditional format. Editorial systems, type as image, posters that talk back. Every brief is an opportunity to break a grid.',
  },
  {
    id: 'three-dee-art',
    pages: 1.5,
    number: '02',
    title: '3D Art',
    body: 'Sculpting in software. Procedural geometry, iridescent surfaces, and forms that exist only as light hitting a virtual camera.',
  },
  {
    id: 'ai-art',
    pages: 1.5,
    number: '03',
    title: 'AI Art',
    body: 'Diffusion as a brush. Conditioning, fine-tuning, and the strange textures that emerge when language and pixels collide.',
  },
  {
    id: 'ux-design',
    pages: 1.5,
    number: '04',
    title: 'UX Design',
    body: 'Interfaces as choreography. Deconstructing the rectangle, then putting it back together with intent.',
  },
  {
    id: 'highlights',
    pages: 1.0,
    title: 'Highlights',
  },
];

let cursor = 0;
export const sections: Section[] = rawSections.map((s) => {
  const out: Section = { ...s, offset: cursor };
  cursor += s.pages;
  return out;
});

export const totalPages = cursor;

export const sectionsById = Object.fromEntries(
  sections.map((s) => [s.id, s]),
) as Record<SectionId, Section>;

/**
 * World-space vertical distance covered by one scroll page. Tuned so that
 * a 1-page section roughly fills the camera frustum at z=0 with our
 * default fov=35 / camera z=8 setup.
 */
export const Y_PER_PAGE = 5.5;

/** World-space total scrollable height (Y units). */
export const worldHeight = totalPages * Y_PER_PAGE;

/** World-space Y position where a section is centered in the camera. */
export function sectionWorldY(s: Section): number {
  // Section centers at its midpoint along scroll. We negate so later
  // sections sit at more-negative Y; the master group then translates
  // *up* with scroll to bring them into the camera.
  return -((s.offset + s.pages / 2) * Y_PER_PAGE);
}
