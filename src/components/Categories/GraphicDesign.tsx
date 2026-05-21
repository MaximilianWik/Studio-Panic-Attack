import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { CategorySection } from './CategorySection';
import type { Section } from '../../config/sections';

interface Props {
  section: Section;
  reducedEffects: boolean;
}

const HEADLINE = 'DESIGN BEYOND\nTHE TRADITIONAL\nFORMAT.';

/**
 * 01 — Graphic Design.
 *
 * Centerpiece is a glass torus-knot orbiting in front of large 3D text.
 * The transmission material refracts the text glyphs behind it with
 * chromatic aberration, giving a real lensing effect. Pointer moves the
 * lens horizontally + vertically (parallax).
 *
 * On reduced-effects devices, MeshTransmissionMaterial is replaced with
 * a cheap glass-ish MeshPhysicalMaterial.
 */
export function GraphicDesign({ section, reducedEffects }: Props) {
  const lensRef = useRef<THREE.Mesh>(null);
  const lensGroup = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector2(0, 0));
  const { pointer } = useThree();

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    if (lensRef.current) {
      lensRef.current.rotation.x = t * 0.35;
      lensRef.current.rotation.y = t * 0.5;
    }

    if (lensGroup.current) {
      // Lerp toward pointer-driven target. Constrain so the lens never
      // wanders too far off the headline.
      targetPos.current.set(pointer.x * 0.6, pointer.y * 0.4);
      lensGroup.current.position.x +=
        (targetPos.current.x - lensGroup.current.position.x) * Math.min(1, dt * 4);
      lensGroup.current.position.y +=
        (targetPos.current.y - lensGroup.current.position.y) * Math.min(1, dt * 4);
    }
  });

  return (
    <CategorySection section={section} textSide="right">
      {/* The 3D headline that sits behind the lens */}
      <group position={[-1.4, 0.0, -0.4]}>
        <Text
          fontSize={0.34}
          maxWidth={3.2}
          lineHeight={1.0}
          letterSpacing={-0.02}
          textAlign="left"
          anchorX="center"
          anchorY="middle"
          color="#1a1814"
          outlineWidth={0.0}
        >
          {HEADLINE}
        </Text>
      </group>

      {/* The glass lens object */}
      <group ref={lensGroup} position={[-1.4, 0.0, 0.6]}>
        <mesh ref={lensRef}>
          <torusKnotGeometry args={[0.55, 0.18, 160, 24]} />
          {reducedEffects ? (
            <meshPhysicalMaterial
              color="#ffffff"
              metalness={0}
              roughness={0.05}
              transmission={0.9}
              thickness={0.4}
              ior={1.5}
              transparent
            />
          ) : (
            <MeshTransmissionMaterial
              transmission={1}
              thickness={0.4}
              chromaticAberration={0.08}
              anisotropicBlur={0.05}
              roughness={0.04}
              ior={1.5}
              backside
              backsideThickness={0.3}
              samples={6}
              resolution={512}
              distortion={0.2}
              distortionScale={0.4}
              temporalDistortion={0.15}
            />
          )}
        </mesh>
      </group>
    </CategorySection>
  );
}
