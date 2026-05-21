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
 * so that each section enters the camera at its allocated scroll range.
 *
 * Camera stays still — this approach keeps lighting and post-processing
 * stable while still feeling like a smooth vertical pan through the scene.
 */
export function Layout({ reducedEffects }: LayoutProps) {
  const masterRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!masterRef.current) return;
    masterRef.current.position.y = scroll.offset * totalPages * Y_PER_PAGE;
  });

  return (
    <group ref={masterRef}>
      <Suspense fallback={null}>
        {/* Background-z scattered imagery — placed inside the master group
            so it scrolls with the rest of the scene. */}
        <ScatteredImages reducedEffects={reducedEffects} />

        <group position={[0, sectionWorldY(sectionsById.hero), 0]}>
          <Hero section={sectionsById.hero} />
        </group>
        <group position={[0, sectionWorldY(sectionsById.gallery), 0]}>
          <Gallery section={sectionsById.gallery} reducedEffects={reducedEffects} />
        </group>
        <group position={[0, sectionWorldY(sectionsById['graphic-design']), 0]}>
          <GraphicDesign
            section={sectionsById['graphic-design']}
            reducedEffects={reducedEffects}
          />
        </group>
        <group position={[0, sectionWorldY(sectionsById['three-dee-art']), 0]}>
          <ThreeDeeArt
            section={sectionsById['three-dee-art']}
            reducedEffects={reducedEffects}
          />
        </group>
        <group position={[0, sectionWorldY(sectionsById['ai-art']), 0]}>
          <AIArt section={sectionsById['ai-art']} reducedEffects={reducedEffects} />
        </group>
        <group position={[0, sectionWorldY(sectionsById['ux-design']), 0]}>
          <UXDesign
            section={sectionsById['ux-design']}
            reducedEffects={reducedEffects}
          />
        </group>
        <group position={[0, sectionWorldY(sectionsById.highlights), 0]}>
          <Highlights section={sectionsById.highlights} />
        </group>
      </Suspense>
    </group>
  );
}

export { sections, totalPages };
