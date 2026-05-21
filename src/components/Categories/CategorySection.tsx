import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
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

export function CategorySection({ id, number, eyebrow, title, body, children, chips = [], side = 'left' }: Props) {
  const yPos = getSectionWorldY(id);
  const visibility = useSectionVisibility(id);
  const htmlRef = useRef<HTMLDivElement>(null);
  const heroGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const v = visibility();
    if (htmlRef.current) {
      const visible = v > 0.15;
      htmlRef.current.style.opacity = visible ? String(Math.min(1, v * 2).toFixed(2)) : '0';
      htmlRef.current.style.pointerEvents = visible ? 'none' : 'none';
    }
    if (heroGroupRef.current) {
      heroGroupRef.current.visible = v > 0.05;
    }
  });

  const heroX = side === 'left' ? 2.8 : -2.8;
  const htmlX = side === 'left' ? -2.8 : 2.8;

  return (
    <group position={[0, yPos, 0]}>
      <group position={[htmlX, 0, 0]}>
        <Html
          position={[0, 0, 0]}
          style={{ width: '440px', pointerEvents: 'none' }}
          transform={false}
          center
        >
          <div ref={htmlRef} style={{ transition: 'opacity 0.2s ease' }}>
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
          </div>
        </Html>
      </group>
      <group ref={heroGroupRef} position={[heroX, 0, 0]}>{children}</group>
    </group>
  );
}

export default CategorySection;
