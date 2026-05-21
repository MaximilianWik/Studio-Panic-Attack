import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, Lightformer } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { sections, VIEWPORT_HEIGHT_UNITS } from '../config/sections';
import { Hero } from './Hero/Hero';
import { Gallery } from './Gallery/Gallery';
import { GraphicDesign } from './Categories/GraphicDesign';
import { ThreeDeeArt } from './Categories/ThreeDeeArt';
import { AIArt } from './Categories/AIArt';
import { UXDesign } from './Categories/UXDesign';
import { Vocabulary } from './Vocabulary/Vocabulary';
import { Highlights } from './Highlights/Highlights';
import { ScatteredImages } from './ScatteredImages/ScatteredImages';

export function Layout() {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!groupRef.current) return;
    const totalScroll = (scroll.pages - 1) * VIEWPORT_HEIGHT_UNITS;
    groupRef.current.position.y = scroll.offset * totalScroll;
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#f6f3ee" />
      <directionalLight position={[5, 4, 5]} intensity={0.7} color="#f6f3ee" />
      <directionalLight position={[-4, -2, 3]} intensity={0.3} color="#d30000" />
      <Environment frames={1} resolution={32} environmentIntensity={0.5}>
        <Lightformer position={[6, 2, 4]} intensity={2.0} color="#f6f3ee" form="rect" scale={[6, 4, 1]} />
        <Lightformer position={[-5, 0, 4]} intensity={1.2} color="#d30000" form="rect" scale={[5, 4, 1]} />
        <Lightformer position={[0, 5, -4]} intensity={0.7} color="#3a0a04" form="rect" scale={[8, 2, 1]} />
      </Environment>
      <group ref={groupRef}>
        {sections.map((s) => {
          switch (s.id) {
            case 'hero': return <Hero key={s.id} />;
            case 'gallery': return <Gallery key={s.id} />;
            case 'graphic': return <GraphicDesign key={s.id} />;
            case 'threeD': return <ThreeDeeArt key={s.id} />;
            case 'ai': return <AIArt key={s.id} />;
            case 'ux': return <UXDesign key={s.id} />;
            case 'vocabulary': return <Vocabulary key={s.id} />;
            case 'highlights': return <Highlights key={s.id} />;
            default: return null;
          }
        })}
        <ScatteredImages />
      </group>
    </>
  );
}

export default Layout;
