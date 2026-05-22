import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, Lightformer } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { sections } from '../config/sections';
import { Hero } from './Hero/Hero';
import { Gallery } from './Gallery/Gallery';
import { GraphicDesign } from './Categories/GraphicDesign';
import { ThreeDeeArt } from './Categories/ThreeDeeArt';
import { AIArt } from './Categories/AIArt';
import { UXDesign } from './Categories/UXDesign';
import { Vocabulary } from './Vocabulary/Vocabulary';
import { Highlights } from './Highlights/Highlights';
import { ScatteredImages } from './ScatteredImages/ScatteredImages';
import { DebugOverlay } from './Debug/DebugOverlay';

export function Layout() {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  // Hardcoded travel range (TOTAL_PAGES = 7.1):
  //   hero center      worldY = -3.0  → group.y = 3.0  at offset=0
  //   gallery center   worldY = -16.0 (gallery is now 2.0 pages)
  //   graphic (01)     worldY = -30.5
  //   threeD  (02)     worldY = -37.0 (length 0.4 — no sculpture)
  //   ai      (03)     worldY = -43.5 (Hedgehog — close to Knot)
  //   ux      (04)     worldY = -52.5
  //   vocabulary       worldY = -60.5
  //   highlights       worldY = -67.5 → group.y = 67.5 at offset=1
  // travel = 64.5 (unchanged after the v6 section retune).
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 3.0 + scroll.offset * 64.5;
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
        <DebugOverlay />
      </group>
    </>
  );
}

export default Layout;
