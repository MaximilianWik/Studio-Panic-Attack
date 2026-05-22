import { useScroll } from '@react-three/drei';
import { getSectionRange, type SectionId } from '../config/sections';

/**
 * Group travel range hardcoded in Layout.tsx. World units of group
 * Y per unit of scroll offset (offset 0..1). Used to convert a
 * worldY offset (e.g. an entity placed N units above its section
 * centre) into the equivalent scroll-units shift.
 */
const SCROLL_PER_WORLD_UNIT = 1 / 64.5;

/**
 * Returns scalar scroll progress through a named section (0..1).
 */
export function useSectionProgress(id: SectionId): () => number {
  const scroll = useScroll();
  const [start, end] = getSectionRange(id);
  return () => scroll.range(start, end - start);
}

/**
 * Trapezoid visibility: ramps up over the first 15% of a wider window,
 * holds at 1.0 for 70%, then ramps down over the last 15%.
 *
 * The window starts 60% of a section-length BEFORE the section and
 * extends to 60% AFTER — so content is visible before the user fully
 * arrives and lingers as they leave.
 *
 * `worldYOffset` shifts the window earlier when the entity using
 * this visibility lives above its section centre (e.g. sculptures
 * lifted +7 units above section Y appear ~0.108 scroll units before
 * the section starts). Pass the same offset that's added to the
 * entity's world Y so its visibility tracks where it actually is on
 * screen, not where the section anchor is.
 */
export function useSectionVisibility(
  id: SectionId,
  worldYOffset = 0,
): () => number {
  const scroll = useScroll();
  const [start, end] = getSectionRange(id);
  const len = end - start;
  const scrollShift = worldYOffset * SCROLL_PER_WORLD_UNIT;
  // Positive worldYOffset means entity is above section centre →
  // appears earlier in scroll → shift the window earlier (smaller
  // start). Window length stays the same so the trapezoid plateau
  // is unchanged.
  const windowStart = start - len * 0.6 - scrollShift;
  const windowLen = len * 2.2;
  return () => {
    const r = scroll.range(windowStart, windowLen);
    // trapezoid: 15% ramp-in, 70% plateau, 15% ramp-out
    if (r < 0.15) return r / 0.15;
    if (r > 0.85) return (1 - r) / 0.15;
    return 1;
  };
}
