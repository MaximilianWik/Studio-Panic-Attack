import { CategorySection } from './CategorySection';

/**
 * 04 — UX Design
 *
 * Hero effect intentionally empty (sculpture relocated to 03).
 * CategorySection text still registers for scroll layout.
 */
export function UXDesign() {
  return (
    <CategorySection
      id="ux"
      number="04"
      title="UX Design"
      body="Dynamic website prototypes designed for intuitive user experiences and visually stunning interfaces. From interactive elements to visual coding techniques, I enhance user engagement through subtle animations and bold transitions. Innovative approaches, like integrating 3D models, push the boundaries of traditional web design, creating memorable digital experiences."
      side="right"
    />
  );
}

export default UXDesign;
