import { Float, MeshTransmissionMaterial, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { theme } from '../../config/theme';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { CategorySection } from './CategorySection';

/**
 * 01 Graphic Design
 *
 * Hero effect:
 *   - 3D headline text "DESIGN BEYOND THE TRADITIONAL FORMAT" laid out
 *     in a slow rotation behind the camera plane;
 *   - a `MeshTransmissionMaterial` glass torus-knot tracking the pointer
 *     over the headline, refracting the text in real time;
 *   - on tier ≤ 1 we swap to a cheap `MeshPhysicalMaterial` transmission.
 */
export function GraphicDesign() {
  const yPos = getSectionWorldY('graphic');
  const profile = useDeviceProfile();
  const visibility = useSectionVisibility('graphic');
  const groupRef = useRef<THREE.Group>(null);

  return (
    <CategorySection
      yPos={yPos}
      number="01"
      eyebrow="CATEGORY"
      title="Graphic Design"
      body="A diverse collection showcasing a unique blend of renowned and niche styles. Each piece reflects experimentation and versatility, integrating fine art, sketching, AI, and even 3D modeling to create innovative and dynamic creations. Crafted with powerful tools like Adobe Creative Software, Procreate, Nomad, Midjourney, and more."
      side="left"
      meta={
        <span className="spa-meta">
          adobe · procreate · nomad · midjourney
        </span>
      }
    >
      <group ref={groupRef}>
        {/* The headline text floats behind, slowly drifting */}
        <BackgroundHeadline />

        {/* Glass lens — torus-knot — tracking the pointer */}
        <Lens lowPower={profile.isLowPower} visibility={visibility} />
      </group>
    </CategorySection>
  );
}

function BackgroundHeadline() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.18) * 0.18;
  });

  return (
    <group ref={ref} position={[0, 0, -1.2]}>
      <Text
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={6.2}
        lineHeight={0.92}
        letterSpacing={-0.02}
        color={theme.paper}
        position={[0, 0.7, 0]}
      >
        DESIGN BEYOND THE TRADITIONAL FORMAT
      </Text>
      <Text
        fontSize={0.12}
        anchorX="center"
        anchorY="middle"
        color={theme.blood}
        position={[0, -0.55, 0]}
        letterSpacing={0.4}
      >
        — A LIVING CANVAS, REFRACTED —
      </Text>
    </group>
  );
}

interface LensProps {
  lowPower: boolean;
  visibility: () => number;
}

function Lens({ lowPower, visibility }: LensProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const target = useRef(new THREE.Vector3());
  const current = useRef(new THREE.Vector3());
  const { viewport } = useThree();

  // small offsetting jitter so the lens never sits dead-still
  const jitter = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const v = visibility();
    if (!meshRef.current) return;
    if (v < 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    target.current.set(
      state.pointer.x * (viewport.width * 0.18),
      state.pointer.y * (viewport.height * 0.14),
      0,
    );
    // EMA → elastic damping
    current.current.lerp(target.current, 0.08);
    jitter.set(
      Math.sin(state.clock.elapsedTime * 1.3) * 0.06,
      Math.cos(state.clock.elapsedTime * 1.1) * 0.05,
      0,
    );
    meshRef.current.position
      .copy(current.current)
      .add(jitter);
    meshRef.current.rotation.x += dt * 0.35;
    meshRef.current.rotation.y += dt * 0.5;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={meshRef} castShadow receiveShadow scale={lowPower ? 0.85 : 1}>
        <torusKnotGeometry args={[0.6, 0.22, 200, 32]} />
        {lowPower ? (
          <meshPhysicalMaterial
            transmission={0.9}
            roughness={0.18}
            thickness={1.2}
            ior={1.42}
            clearcoat={1}
            color={theme.paper}
            attenuationColor={theme.blood}
            attenuationDistance={1.2}
          />
        ) : (
          <MeshTransmissionMaterial
            samples={6}
            resolution={256}
            transmission={1}
            roughness={0.08}
            thickness={1.4}
            ior={1.45}
            chromaticAberration={0.08}
            anisotropy={0.2}
            distortion={0.3}
            distortionScale={0.4}
            temporalDistortion={0.06}
            color={theme.paper}
          />
        )}
      </mesh>
    </Float>
  );
}

export default GraphicDesign;
