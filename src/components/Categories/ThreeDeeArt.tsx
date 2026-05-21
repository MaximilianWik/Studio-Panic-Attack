import { MeshTransmissionMaterial, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import { theme } from '../../config/theme';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { useSculptureEvents } from '../../helpers/sculptureEvents';
import { CategorySection } from './CategorySection';

/**
 * 02 — 3D Art
 *
 * Hero effect (relocated from 01): a `MeshTransmissionMaterial` glass
 * torus-knot tracking the pointer over a 3D headline behind the camera
 * plane, refracting the text in real time. On tier ≤ 1 we swap to a
 * cheap `MeshPhysicalMaterial` transmission. Click → fires a one-shot
 * "slash" event consumed by PostFx for a chromatic-aberration pulse.
 */
export function ThreeDeeArt() {
  const profile = useDeviceProfile();
  const visibility = useSectionVisibility('threeD');
  const groupRef = useRef<THREE.Group>(null);

  return (
    <CategorySection
      id="threeD"
      number="02"
      title="3D Art"
      body="From high-poly nature environments to charming low-poly scenes, each creation reflects my passion for crafting immersive worlds and characters. Whether organic or inorganic, 3D modeling allows me to bring my ideas to life, sharing unique experiences with others. Crafted in Autodesk Maya, Blender, Unreal Engine 5, and more."
      side="right"
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
  const pos = useRef(new THREE.Vector3(0, 0.3, 0));
  const vel = useRef(new THREE.Vector3());
  const { viewport } = useThree();
  const fire = useSculptureEvents((s) => s.fire);

  useFrame((state, dt) => {
    const v = visibility();
    if (!meshRef.current) return;
    if (v < 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    const t = state.clock.elapsedTime;

    // Autonomous floating orbit
    const orbitX = Math.sin(t * 0.4) * 0.8;
    const orbitY = Math.cos(t * 0.3) * 0.5 + 0.3;
    const orbitTarget = new THREE.Vector3(orbitX, orbitY, 0);

    // Magnetic repulsion from cursor
    const pointerWorld = new THREE.Vector3(
      state.pointer.x * viewport.width * 0.35,
      state.pointer.y * viewport.height * 0.35,
      0,
    );
    const diff = pos.current.clone().sub(pointerWorld);
    const dist = diff.length();
    const pushStrength = Math.exp(-dist * 1.2) * 2.5;
    if (dist > 0.01) {
      diff.normalize().multiplyScalar(pushStrength);
    }

    // Combine: drift toward orbit + push from cursor
    vel.current.lerp(
      orbitTarget.sub(pos.current).multiplyScalar(0.8).add(diff),
      0.06,
    );
    pos.current.add(vel.current.clone().multiplyScalar(dt));

    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.x += dt * 0.35;
    meshRef.current.rotation.y += dt * 0.5;
  });

  return (
    <mesh
      ref={meshRef}
      scale={lowPower ? 0.85 : 1}
      onClick={(e) => {
        e.stopPropagation();
        fire('knifeSlashAt');
      }}
    >
      <torusKnotGeometry args={[0.6, 0.22, 160, 24]} />
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
          samples={4}
          resolution={192}
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
  );
}

export default ThreeDeeArt;
