import { Html } from '@react-three/drei';
import { useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import type { SectionId } from '../../config/sections';
import { getSectionWorldY } from '../../config/sections';

interface Props {
  id: SectionId;
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
  chips?: string[];
  side?: 'left' | 'right';
}

/**
 * CategorySection — large centerpiece. NO visibility fade — always
 * renders at full opacity. drei Html handles off-screen culling
 * naturally via CSS projection. Responsive width via vw units.
 */
export function CategorySection({ id, number, eyebrow, title, body, children, chips = [], side = 'left' }: Props) {
  const yPos = getSectionWorldY(id);
  const heroGroupRef = useRef<THREE.Group>(null);
  const visibility = useSectionVisibility(id);

  useFrame(() => {
    if (heroGroupRef.current) {
      heroGroupRef.current.visible = visibility() > 0.01;
    }
  });

  const heroX = side === 'left' ? 2.6 : -2.6;

  return (
    <group position={[0, yPos, 0]}>
      <Html
        position={[side === 'left' ? -2.2 : 2.2, 0, 0]}
        style={{ width: 'min(520px, 42vw)', pointerEvents: 'none' }}
        transform={false}
        center
      >
        <div className="spa-catgrid">
          <div className="spa-catgrid__num"><span>{number}</span></div>
          <div className="spa-catgrid__eyebrow">{eyebrow}</div>
          <div className="spa-catgrid__title"><h2>{title}</h2></div>
          <div className="spa-catgrid__body"><p>{body}</p></div>
          <div className="spa-catgrid__chips">
            <span className="spa-catgrid__chips-label">Toolkit</span>
            <div className="spa-catgrid__chips-list">
              {chips.map((c) => (<span key={c} className="spa-catgrid__chip">{c}</span>))}
            </div>
          </div>
          <div className="spa-catgrid__index">
            <span>file · {number}</span>
            <span style={{ color: '#d30000' }}>/ 04</span>
            <span>{eyebrow}</span>
          </div>
        </div>
      </Html>

      <group ref={heroGroupRef} position={[heroX, 0, 0]}>
        {children}
      </group>
    </group>
  );
}

export default CategorySection;
