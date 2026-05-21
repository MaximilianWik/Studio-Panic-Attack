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
 * CategorySection — text on one side, 3D sculpture BEHIND the text in
 * the background. Sculpture only updates / renders when the section is
 * close to the camera in world Y (within 6 units).
 */
export function CategorySection({
  id, number, title, body, children, side = 'left',
}: Props) {
  const yPos = getSectionWorldY(id);
  // Both text and sculpture share the same horizontal anchor; sculpture
  // sits behind the text in z so it acts as a backdrop.
  const anchorX = side === 'left' ? -1.6 : 1.6;
  const sculptureGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const _w = useRef(new THREE.Vector3()).current;

  useFrame(() => {
    if (!sculptureGroupRef.current) return;
    sculptureGroupRef.current.getWorldPosition(_w);
    const dy = Math.abs(_w.y - camera.position.y);
    // Render whenever section is near camera (within ~6 units = ~viewport-height)
    sculptureGroupRef.current.visible = dy < 6;
  });

  return (
    <group position={[0, yPos, 0]}>
      {/* Sculpture sits behind the text — same X, z = -2 */}
      <group ref={sculptureGroupRef} position={[anchorX, 0, -2]}>
        {children}
      </group>

      <Html
        position={[anchorX, 0, 0]}
        style={{
          width: 'min(760px, 56vw)',
          pointerEvents: 'none',
        }}
        transform={false}
        center
      >
        <div className="spa-cat-elegant">
          <span className="spa-cat-elegant__number">{number}</span>
          <h2 className="spa-cat-elegant__title">{title}</h2>
          <div className="spa-cat-elegant__body-wrap">
            <p className="spa-cat-elegant__body">{body}</p>
          </div>
        </div>
      </Html>
    </group>
  );
}

export default CategorySection;
