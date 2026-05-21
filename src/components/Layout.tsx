import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import {
  sections,
  sectionsById,
  totalPages,
  Y_PER_PAGE,
  sectionWorldY,
} from '../config/sections';
import { Hero } from './Hero/Hero';
import { Gallery } from './Gallery/Gallery';
import { GraphicDesign } from './Categories/GraphicDesign';
import { ThreeDeeArt } from './Categories/ThreeDeeArt';
import { AIArt } from './Categories/AIArt';
import { UXDesign } from './Categories/UXDesign';
import { Highlights } from './Highlights/Highlights';
import { ScatteredImages } from './ScatteredImages/ScatteredImages';

interface LayoutProps {
  reducedEffects: boolean;
}

/**
 * Top-level scene. Sections are placed at fixed world-Y positions; the
 * master group is translated upward by `scroll.offset * totalPages * Y_PER_PAGE`
 * so each section enters the camera at the start of its allocated scroll
 * range. Camera stays still — this approach keeps lighting and post stable
 * while still feeling like a smooth vertical pan.
 *
 * Each section is wrapped in its own <Suspense> so a single failing
 * texture or HDRI never blanks the entire page.
 */
export function Layout({ reducedEffects }: LayoutProps) {
  const masterRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!masterRef.current || !scroll) return;
    masterRef.current.position.y = scroll.offset * totalPages * Y_PER_PAGE;
  });

  return (
    <group ref={masterRef}>
      {/* Background-z scattered imagery */}
      <Suspense fallback={null}>
        <ScatteredImages reducedEffects={reducedEffects} />
      </Suspense>

      <group position={[0, sectionWorldY(sectionsById.hero), 0]}>
        <Suspense fallback={null}>
          <Hero section={sectionsById.hero} />
        </Suspense>
      </group>

      <group position={[0, sectionWorldY(sectionsById.gallery), 0]}>
        <Suspense fallback={null}>
          <Gallery section={sectionsById.gallery} reducedEffects={reducedEffects} />
        </Suspense>
      </group>

      <group position={[0, sectionWorldY(sectionsById['graphic-design']), 0]}>
        <Suspense fallback={null}>
          <GraphicDesign
            section={sectionsById['graphic-design']}
            reducedEffects={reducedEffects}
          />
        </Suspense>
      </group>

      <group position={[0, sectionWorldY(sectionsById['three-dee-art']), 0]}>
        <Suspense fallback={null}>
          <ThreeDeeArt
            section={sectionsById['three-dee-art']}
            reducedEffects={reducedEffects}
          />
        </Suspense>
      </group>

      <group position={[0, sectionWorldY(sectionsById['ai-art']), 0]}>
        <Suspense fallback={null}>
          <AIArt section={sectionsById['ai-art']} reducedEffects={reducedEffects} />
        </Suspense>
      </group>

      <group position={[0, sectionWorldY(sectionsById['ux-design']), 0]}>
        <Suspense fallback={null}>
          <UXDesign
            section={sectionsById['ux-design']}
            reducedEffects={reducedEffects}
          />
        </Suspense>
      </group>

      <group position={[0, sectionWorldY(sectionsById.highlights), 0]}>
        <Suspense fallback={null}>
          <Highlights section={sectionsById.highlights} />
        </Suspense>
      </group>
    </group>
  );
}

export { sections, totalPages };
