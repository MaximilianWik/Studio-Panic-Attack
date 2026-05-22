import { MeshTransmissionMaterial, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import { theme } from '../../config/theme';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { useSculptureEvents } from '../../helpers/sculptureEvents';
import { getSectionWorldY } from '../../config/sections';
import { DebugLabel } from '../Debug/DebugOverlay';
import { CategorySection } from './CategorySection';

/**
 * 01 — Graphic Design
 *
 * Hero effect: a `MeshTransmissionMaterial` glass torus-knot tracking
 * the pointer over a 3D headline behind the camera plane, refracting
 * the text in real time. On tier ≤ 1 we swap to a cheap
 * `MeshPhysicalMaterial` transmission. Click → fires a one-shot
 * "slash" event consumed by PostFx for a chromatic-aberration pulse.
 *
 * Wrapped in a viewport-aware scale group so the orbit reach + headline
 * width fit inside narrow (portrait phone) framings without cropping.
 */
export function GraphicDesign() {
  const profile = useDeviceProfile();
  const visibility = useSectionVisibility('graphic');
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const fitScale = Math.max(0.55, Math.min(1, viewport.width / 6.4));

  return (
    <CategorySection
      id="graphic"
      number="01"
      title="Graphic Design"
      body="A diverse collection showcasing a unique blend of renowned and niche styles. Each piece reflects experimentation and versatility, integrating fine art, sketching, AI, and even 3D modeling to create innovative and dynamic creations. Crafted with powerful tools like Adobe Creative Software, Procreate, Nomad, Midjourney, and more."
      side="left"
    >
      <group ref={groupRef} scale={fitScale}>
        <BackgroundHeadline />
        <Lens lowPower={profile.isLowPower} visibility={visibility} />
      </group>
      <DebugLabel
        name="Sculpture: Knot (01 graphic)"
        worldY={getSectionWorldY('graphic') + 10}
        offset={[0, 1.6, 0.5]}
      />
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

    // Reuse module-scope scratch vectors — no per-frame allocations.
    _orbit.set(Math.sin(t * 0.4) * 0.8, Math.cos(t * 0.3) * 0.5 + 0.3, 0);
    _pointer.set(
      state.pointer.x * viewport.width * 0.35,
      state.pointer.y * viewport.height * 0.35,
      0,
    );
    _diff.copy(pos.current).sub(_pointer);
    const dist = _diff.length();
    const pushStrength = Math.exp(-dist * 1.2) * 2.5;
    if (dist > 0.01) _diff.normalize().multiplyScalar(pushStrength);

    _target.copy(_orbit).sub(pos.current).multiplyScalar(0.8).add(_diff);
    vel.current.lerp(_target, 0.06);

    pos.current.addScaledVector(vel.current, dt);
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

export default GraphicDesign;

// Module-scope scratch vectors for Lens — avoids GC pressure each frame.
const _orbit = /* @__PURE__ */ new THREE.Vector3();
const _pointer = /* @__PURE__ */ new THREE.Vector3();
const _diff = /* @__PURE__ */ new THREE.Vector3();
const _target = /* @__PURE__ */ new THREE.Vector3();
