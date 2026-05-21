import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { SectionId } from '../../config/sections';
import { getSectionWorldY } from '../../config/sections';

interface Props {
  id: SectionId;
  number: string;
  title: string;
  body: string;
  children?: ReactNode;
  side?: 'left' | 'right';
}

/**
 * CategorySection — visibility based on WORLD-SPACE distance from
 * camera, not scroll page ranges. Reliable across any scroll formula.
 */
export function CategorySection({
  id, number, title, body, children, side = 'left',
}: Props) {
  const yPos = getSectionWorldY(id);
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const { camera } = useThree();
  const _w = useRef(new THREE.Vector3()).current;

  useFrame(() => {
    if (!groupRef.current || !htmlRef.current) return;
    groupRef.current.getWorldPosition(_w);
    // Distance from camera Y to this section's world Y after translation
    const dy = Math.abs(_w.y - camera.position.y);
    // Visible window: ±5 world units around camera Y
    // Fade out edges from 4..5 units
    const visibility = Math.max(0, Math.min(1, (5 - dy) / 1));
    htmlRef.current.style.opacity = visibility.toFixed(2);
    htmlRef.current.style.display = visibility > 0.01 ? '' : 'none';
  });

  const heroX = side === 'left' ? 2.4 : -2.4;

  return (
    <group ref={groupRef} position={[0, yPos, 0]}>
      <Html
        position={[side === 'left' ? -1.6 : 1.6, 0, 0]}
        style={{ width: 'min(760px, 56vw)', pointerEvents: 'none' }}
        transform={false}
        center
      >
        <div ref={htmlRef} className="spa-cat-elegant" style={{ transition: 'opacity 0.15s ease' }}>
          <span className="spa-cat-elegant__number">{number}</span>
          <h2 className="spa-cat-elegant__title">{title}</h2>
          <div className="spa-cat-elegant__body-wrap">
            <p className="spa-cat-elegant__body">{body}</p>
          </div>
        </div>
      </Html>

      <group position={[heroX, 0, 0]}>
        {children}
      </group>
    </group>
  );
}

export default CategorySection;
