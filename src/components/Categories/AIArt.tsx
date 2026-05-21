import { CategorySection } from './CategorySection';

/**
 * 03 — AI Art
 *
 * Hero effect intentionally empty per design pass; the
 * CategorySection eyebrow + title + body still register for scroll
 * layout, no 3D content is rendered.
 */
export function AIArt() {
  return (
    <CategorySection
      id="ai"
      number="03"
      title="AI Art"
      body="Experimental AI art pushing the boundaries of creative expression and innovation. A wide range of creations, from illustrations and photorealistic images, to 3D models and videos created with nothing more than AI prompts. Crafted using advanced AI tools like Krea, Adobe Firefly, DALL-E, Midjourney, and more."
      side="left"
    />
  );
}

export default AIArt;
