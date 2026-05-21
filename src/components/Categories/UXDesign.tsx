import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useSectionVisibility } from '../../helpers/useScrollSection';
import { CategorySection } from './CategorySection';

/**
 * 04 — UX Design — FLOATING GEOMETRIC TOWER
 *
 * A vertical column of 7 wireframe primitives (cube, octahedron,
 * tetrahedron, dodecahedron, icosahedron). Each rotates on its own
 * axis at different speeds. On hover, they SCATTER outward radially.
 * On pointer leave, they SNAP back. Click SHUFFLES the order.
 */

type ShapeKind = 'box' | 'octa' | 'tetra' | 'dodeca' | 'icosa';

interface StackItem {
  kind: ShapeKind;
  baseY: number;          // resting Y position
  rotAxis: THREE.Vector3; // rotation axis (unit vector)
  rotSpeed: number;       // radians per second
  size: number;
  scatterDir: THREE.Vector3; // direction to fly when scattered
}

function shuffleSeed(seed: number): ShapeKind[] {
  const kinds: ShapeKind[] = ['box', 'octa', 'tetra', 'dodeca', 'icosa', 'box', 'octa'];
  // Fisher-Yates with seeded RNG
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return kinds;
}

export function UXDesign() {
  const visibility = useSectionVisibility('ux');

  return (
    <CategorySection
      id="ux"
      number="04"
      title="UX Design"
      body="Dynamic website prototypes designed for intuitive user experiences and visually stunning interfaces. From interactive elements to visual coding techniques, I enhance user engagement through subtle animations and bold transitions. Innovative approaches, like integrating 3D models, push the boundaries of traditional web design, creating memorable digital experiences."
      side="right"
    >
      <GeometricTower visibility={visibility} />
    </CategorySection>
  );
}

interface TowerProps {
  visibility: () => number;
}

function GeometricTower({ visibility }: TowerProps) {
  const [shuffleKey, setShuffleKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const items: StackItem[] = useMemo(() => {
    const kinds = shuffleSeed(shuffleKey + 1);
    const count = 7;
    return Array.from({ length: count }, (_, i) => {
      const t = (i / (count - 1) - 0.5) * 2; // -1..1
      const baseY = t * 2.4;
      const a = i * 0.8;
      const rotAxis = new THREE.Vector3(
        Math.cos(a),
        Math.sin(a * 1.7),
        Math.sin(a),
      ).normalize();
      const rotSpeed = 0.4 + (i % 3) * 0.2;
      const size = 0.5 + (i % 4) * 0.05;
      const scatterAngle = (i / count) * Math.PI * 2;
      const scatterDir = new THREE.Vector3(
        Math.cos(scatterAngle),
        Math.sin(scatterAngle * 0.5),
        Math.sin(scatterAngle),
      ).normalize();
      return {
        kind: kinds[i % kinds.length],
        baseY,
        rotAxis,
        rotSpeed,
        size,
        scatterDir,
      };
    });
  }, [shuffleKey]);

  const itemRefs = useRef<(THREE.Mesh | null)[]>([]);
  itemRefs.current = items.map((_, i) => itemRefs.current[i] ?? null);

  useFrame((_, dt) => {
    const v = visibility();
    if (!groupRef.current) return;
    groupRef.current.visible = v > 0.001;
    if (v < 0.001) return;

    const scatterTarget = hovered ? 1 : 0;

    for (let i = 0; i < items.length; i++) {
      const ref = itemRefs.current[i];
      if (!ref) continue;
      const it = items[i];

      // Smoothed scatter amount per item (overshoots slightly for "snap" feel)
      const cur = (ref.userData.scatter as number) ?? 0;
      const next = cur + (scatterTarget - cur) * Math.min(1, dt * 5);
      ref.userData.scatter = next;

      // Position: base + scatter direction * scatter amount
      ref.position.set(
        it.scatterDir.x * next * 1.6,
        it.baseY + it.scatterDir.y * next * 0.8,
        it.scatterDir.z * next * 1.0,
      );

      // Independent rotation
      ref.rotateOnAxis(it.rotAxis, dt * it.rotSpeed * (1 + next * 1.5));
    }

    // Whole tower drifts slowly
    groupRef.current.rotation.y += dt * 0.08;
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
      onClick={(e) => { e.stopPropagation(); setShuffleKey((k) => k + 1); }}
    >
      {items.map((it, i) => (
        <mesh
          key={shuffleKey + '-' + i}
          ref={(el) => { itemRefs.current[i] = el; }}
          position={[0, it.baseY, 0]}
        >
          {renderGeometry(it.kind, it.size)}
          <meshStandardMaterial
            color={i % 2 === 0 ? '#f6f3ee' : '#d30000'}
            wireframe
            wireframeLinewidth={1.5}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function renderGeometry(kind: ShapeKind, size: number) {
  switch (kind) {
    case 'box':     return <boxGeometry args={[size, size, size]} />;
    case 'octa':    return <octahedronGeometry args={[size, 0]} />;
    case 'tetra':   return <tetrahedronGeometry args={[size, 0]} />;
    case 'dodeca':  return <dodecahedronGeometry args={[size, 0]} />;
    case 'icosa':   return <icosahedronGeometry args={[size, 0]} />;
  }
}

export default UXDesign;
