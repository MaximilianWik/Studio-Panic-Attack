import { useScroll } from '@react-three/drei';
import { getSectionRange, type SectionId } from '../config/sections';

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
 */
export function useSectionVisibility(id: SectionId): () => number {
  const scroll = useScroll();
  const [start, end] = getSectionRange(id);
  const len = end - start;
  const windowStart = start - len * 0.6;
  const windowLen = len * 2.2;
  return () => {
    const r = scroll.range(windowStart, windowLen);
    // trapezoid: 15% ramp-in, 70% plateau, 15% ramp-out
    if (r < 0.15) return r / 0.15;
    if (r > 0.85) return (1 - r) / 0.15;
    return 1;
  };
}
