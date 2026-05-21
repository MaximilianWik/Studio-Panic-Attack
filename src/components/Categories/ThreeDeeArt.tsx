import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { CategorySection } from './CategorySection';
import { useScrollSection } from '../../helpers/useScrollSection';
import type { Section } from '../../config/sections';

interface Props {
  section: Section;
  reducedEffects: boolean;
}

/**
 * 02 — 3D Art.
 *
 * A high-poly icosahedron displaced by simplex noise (drei
 * MeshDistortMaterial). Iridescent + clearcoat gives the surface a
 * holographic-metal vibe. The auto-rotation is gentle; <PresentationControls>
 * lets the user drag to spin it within bounded angles.
 *
 * Scroll progress within the section shifts the distortion amplitude so
 * the sculpture "evolves" as the viewer passes through.
 */
export function ThreeDeeArt({ section, reducedEffects }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.Material | null>(null);
  const progress = useScrollSection(section.offset, section.pages);
  const innerRef = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (innerRef.current) {
      // gentle auto-rotation on top of whatever PresentationControls applies
      innerRef.current.rotation.y += dt * 0.18;
      innerRef.current.position.y = Math.sin(t * 0.6) * 0.08;
    }

    // Modulate distort over scroll progress
    if (matRef.current) {
      const p = Math.max(0, Math.min(1, progress.current));
      const amp = 0.25 + Math.sin(p * Math.PI) * 0.35;
      // MeshDistortMaterial exposes `distort` as a settable scalar
      (matRef.current as unknown as { distort: number }).distort = amp;
    }
  });

  const detail = reducedEffects ? 32 : 64;

  return (
    <CategorySection section={section} textSide="left">
      <PresentationControls
        global={false}
        snap
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 6, Math.PI / 6]}
        azimuth={[-Math.PI / 3, Math.PI / 3]}
      >
        <group ref={innerRef} position={[1.4, 0, 0.4]}>
          <mesh ref={meshRef}>
            <icosahedronGeometry args={[1.0, detail]} />
            <MeshDistortMaterial
              ref={(m: THREE.Material | null) => {
                matRef.current = m;
              }}
              color="#1a1620"
              metalness={1}
              roughness={0.22}
              clearcoat={1}
              clearcoatRoughness={0.15}
              iridescence={1}
              iridescenceIOR={1.7}
              iridescenceThicknessRange={[100, 1000]}
              envMapIntensity={1.4}
              speed={0.8}
              distort={0.4}
            />
          </mesh>
          {/* secondary glow shell */}
          {!reducedEffects && (
            <mesh scale={1.18}>
              <icosahedronGeometry args={[1.0, 16]} />
              <meshBasicMaterial
                color="#c97e3a"
                transparent
                opacity={0.05}
                depthWrite={false}
                side={THREE.BackSide}
              />
            </mesh>
          )}
        </group>
      </PresentationControls>
    </CategorySection>
  );
}
