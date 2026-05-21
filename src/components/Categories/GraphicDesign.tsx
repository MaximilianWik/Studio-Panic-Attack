import { CategorySection } from './CategorySection';

/**
 * 01 — Graphic Design
 *
 * Hero effect intentionally empty: previous sculpture lived here was
 * relocated to 02; no replacement is rendered. The CategorySection
 * eyebrow + title + body still register for scroll layout.
 */
export function GraphicDesign() {
  return (
    <CategorySection
      id="graphic"
      number="01"
      title="Graphic Design"
      body="A diverse collection showcasing a unique blend of renowned and niche styles. Each piece reflects experimentation and versatility, integrating fine art, sketching, AI, and even 3D modeling to create innovative and dynamic creations. Crafted with powerful tools like Adobe Creative Software, Procreate, Nomad, Midjourney, and more."
      side="left"
    />
  );
}

export default GraphicDesign;
