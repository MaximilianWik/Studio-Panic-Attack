import { useScroll } from '@react-three/drei';
import { getSectionRange, type SectionId } from '../config/sections';

/**
 * Returns scalar scroll progress through a named section.
 *   <  range start          → 0
 *   in range                → 0..1 linear
 *   >  range end            → 1
 *
 * Must be called inside a <ScrollControls> ancestor.
 */
export function useSectionProgress(id: SectionId): () => number {
  const scroll = useScroll();
  const [start, end] = getSectionRange(id);
  return () => scroll.range(start, end - start);
}

/** Smoother per-section curve: in 0..1 then plateau then out 0..1. */
export function useSectionVisibility(id: SectionId): () => number {
  const scroll = useScroll();
  const [start, end] = getSectionRange(id);
  const len = end - start;
  return () => {
    const r = scroll.range(start - len * 0.4, len * 1.8);
    // triangular: 0 → 1 mid → 0
    return 1 - Math.abs(r * 2 - 1);
  };
}
