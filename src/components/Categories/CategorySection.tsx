import { Html } from '@react-three/drei';
import { useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
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
  entrance?: 'slide-left' | 'slide-right' | 'slide-up' | 'fade-scale';
}

/**
 * CategorySection — ALWAYS renders. No visibility gating. The drei
 * Html projection naturally puts it off-screen when the world-Y is
 * far from camera. Large centerpiece card.
 */
export function CategorySection({
  id, number, eyebrow, title, body, children,
  chips = [], side = 'left', entrance = 'slide-left',
}: Props) {
  const yPos = getSectionWorldY(id);
  const heroGroupRef = useRef<THREE.Group>(null);

  // No visibility gating — always visible. Let world projection handle it.
  void entrance; // entrance animations can be added via CSS if needed

  return (
    <group position={[0, yPos, 0]}>
      <Html
        position={[side === 'left' ? -1.8 : 1.8, 0, 0]}
        style={{ width: 'min(620px, 48vw)', pointerEvents: 'none' }}
        transform={false}
        center
      >
        <div className="spa-catgrid spa-catgrid--large">
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

      <group ref={heroGroupRef} position={[side === 'left' ? 2.6 : -2.6, 0, 0]}>
        {children}
      </group>
    </group>
  );
}

export default CategorySection;
