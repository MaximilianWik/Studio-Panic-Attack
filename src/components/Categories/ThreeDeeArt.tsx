import { CategorySection } from './CategorySection';

/**
 * 02 — 3D Art
 *
 * Hero effect intentionally empty (sculpture relocated to 01).
 * CategorySection text still registers for scroll layout.
 */
export function ThreeDeeArt() {
  return (
    <CategorySection
      id="threeD"
      number="02"
      title="3D Art"
      body="From high-poly nature environments to charming low-poly scenes, each creation reflects my passion for crafting immersive worlds and characters. Whether organic or inorganic, 3D modeling allows me to bring my ideas to life, sharing unique experiences with others. Crafted in Autodesk Maya, Blender, Unreal Engine 5, and more."
      side="right"
    />
  );
}

export default ThreeDeeArt;
