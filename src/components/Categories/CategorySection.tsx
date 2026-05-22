import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
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
 * CategorySection — text Html + 3D hero side-by-side on landscape,
 * stacked vertically on portrait so neither half gets cropped on
 * narrow phones / tablets.
 *
 * Always renders. Html projection handles off-screen positioning
 * naturally based on world Y.
 */
export function CategorySection({
  id, number, title, body, children, side = 'left',
}: Props) {
  const yPos = getSectionWorldY(id);
  const { viewport } = useThree();
  const portrait = viewport.width / viewport.height < 1;

  // Landscape: text on one side, hero on the other (alternating).
  // Portrait: hero floats above, text drops below — both centered.
  const heroPos: [number, number, number] = portrait
    ? [0, 1.1, 0]
    : [side === 'left' ? 2.4 : -2.4, 0, 0];
  const htmlPos: [number, number, number] = portrait
    ? [0, -1.6, 0]
    : [side === 'left' ? -1.6 : 1.6, 0, 0];

  return (
    <group position={[0, yPos, 0]}>
      <Html
        position={htmlPos}
        style={{
          width: 'min(760px, 86vw)',
          pointerEvents: 'none',
        }}
        transform={false}
        center
      >
        <div className={'spa-cat-elegant' + (portrait ? ' spa-cat-elegant--portrait' : '')}>
          <span className="spa-cat-elegant__number">{number}</span>
          <h2 className="spa-cat-elegant__title">{title}</h2>
          <div className="spa-cat-elegant__body-wrap">
            <p className="spa-cat-elegant__body">{body}</p>
          </div>
        </div>
      </Html>

      <group position={heroPos}>
        {children}
      </group>
    </group>
  );
}

export default CategorySection;
