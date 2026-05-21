import { Html } from '@react-three/drei';
import type { ReactNode } from 'react';
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
 * CategorySection — dead simple. Always renders. Html projection
 * handles off-screen positioning naturally based on world Y.
 */
export function CategorySection({
  id, number, title, body, children, side = 'left',
}: Props) {
  const yPos = getSectionWorldY(id);
  const heroX = side === 'left' ? 2.4 : -2.4;
  const htmlX = side === 'left' ? -1.6 : 1.6;

  return (
    <group position={[0, yPos, 0]}>
      <Html
        position={[htmlX, 0, 0]}
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

      <group position={[heroX, 0, 0]}>
        {children}
      </group>
    </group>
  );
}

export default CategorySection;
