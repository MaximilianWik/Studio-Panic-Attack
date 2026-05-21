import { Html } from '@react-three/drei';
import { useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
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
 * CategorySection — dramatic, elegant, minimal.
 *
 * Layout: one side has a MASSIVE number + title + body in elegant
 * serif italic. The other side hosts the 3D hero effect.
 * No chips, no eyebrow, no index strip.
 */
export function CategorySection({
  id, number, title, body, children, side = 'left',
}: Props) {
  const yPos = getSectionWorldY(id);
  const heroGroupRef = useRef<THREE.Group>(null);
  const heroX = side === 'left' ? 2.4 : -2.4;

  return (
    <group position={[0, yPos, 0]}>
      {/* Text side — huge number + elegant title + body */}
      <Html
        position={[side === 'left' ? -2.0 : 2.0, 0, 0]}
        style={{ width: 'min(680px, 52vw)', pointerEvents: 'none' }}
        transform={false}
        center
      >
        <div className="spa-cat-elegant">
          <span className="spa-cat-elegant__number">{number}</span>
          <h2 className="spa-cat-elegant__title">{title}</h2>
          <p className="spa-cat-elegant__body">{body}</p>
        </div>
      </Html>

      {/* 3D effect side */}
      <group ref={heroGroupRef} position={[heroX, 0, 0]}>
        {children}
      </group>
    </group>
  );
}

export default CategorySection;
