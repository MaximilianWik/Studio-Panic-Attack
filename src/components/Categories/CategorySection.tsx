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

/**
 * CategorySection — large centerpiece card spanning most of the viewport.
 * Text content on one side, transparent gap on the other side where the
 * 3D hero effect renders through (canvas is behind the Html layer).
 *
 * The r3f effect is positioned at the opposite world-X so it visually
 * "fills" the transparent half of the card.
 */
export function CategorySection({ id, number, eyebrow, title, body, children, chips = [], side = 'left' }: Props) {
  const yPos = getSectionWorldY(id);
  const visibility = useSectionVisibility(id);
  const htmlRef = useRef<HTMLDivElement>(null);
  const heroGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const v = visibility();
    if (htmlRef.current) {
      htmlRef.current.style.opacity = String(Math.min(1, v).toFixed(2));
      // subtle parallax entrance
      const y = (1 - Math.min(1, v * 1.5)) * 20;
      htmlRef.current.style.transform = `translateY(${y.toFixed(1)}px)`;
    }
    if (heroGroupRef.current) {
      heroGroupRef.current.visible = v > 0.05;
    }
  });

  const heroX = side === 'left' ? 2.4 : -2.4;

  return (
    <group position={[0, yPos, 0]}>
      <Html
        position={[0, 0, 0]}
        style={{ width: '860px', pointerEvents: 'none' }}
        transform={false}
        center
      >
        <div ref={htmlRef} style={{ transition: 'opacity 0.15s ease, transform 0.15s ease' }}>
          <div className="spa-catgrid" style={{
            gridTemplateColumns: side === 'left' ? 'repeat(12, 1fr)' : 'repeat(12, 1fr)',
          }}>
            {/* Number card — large */}
            <div className="spa-catgrid__num" style={{
              gridColumn: side === 'left' ? '1 / span 4' : '9 / span 4',
              gridRow: '1 / span 4',
            }}>
              <span>{number}</span>
            </div>

            {/* Eyebrow */}
            <div className="spa-catgrid__eyebrow" style={{
              gridColumn: side === 'left' ? '5 / span 4' : '5 / span 4',
              gridRow: '1',
            }}>
              {eyebrow}
            </div>

            {/* Title */}
            <div className="spa-catgrid__title" style={{
              gridColumn: side === 'left' ? '5 / span 8' : '1 / span 8',
              gridRow: '2 / span 3',
            }}>
              <h2>{title}</h2>
            </div>

            {/* Body */}
            <div className="spa-catgrid__body" style={{
              gridColumn: side === 'left' ? '1 / span 6' : '7 / span 6',
              gridRow: '5 / span 3',
            }}>
              <p>{body}</p>
            </div>

            {/* Chips */}
            <div className="spa-catgrid__chips" style={{
              gridColumn: side === 'left' ? '7 / span 3' : '4 / span 3',
              gridRow: '5 / span 3',
            }}>
              <span className="spa-catgrid__chips-label">Toolkit</span>
              <div className="spa-catgrid__chips-list">
                {chips.map((c) => (<span key={c} className="spa-catgrid__chip">{c}</span>))}
              </div>
            </div>

            {/* 3D viewport placeholder — transparent cell where effect shows through */}
            <div style={{
              gridColumn: side === 'left' ? '10 / span 3' : '1 / span 3',
              gridRow: '5 / span 3',
              background: 'transparent',
              border: '1px dashed rgba(211,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(246,243,238,0.3)',
            }}>
              3D · live
            </div>

            {/* Index strip */}
            <div className="spa-catgrid__index" style={{ gridColumn: '1 / -1', gridRow: '8' }}>
              <span>file · {number}</span>
              <span style={{ color: '#d30000' }}>/ 04</span>
              <span>{eyebrow}</span>
            </div>
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
