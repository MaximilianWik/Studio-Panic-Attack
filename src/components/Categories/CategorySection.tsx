import { Html } from '@react-three/drei';
import { useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSectionProgress } from '../../helpers/useScrollSection';
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
  /** Animation style: each category gets a different entrance */
  entrance?: 'slide-left' | 'slide-right' | 'slide-up' | 'fade-scale';
}

/**
 * CategorySection — HUGE centerpiece (takes ~1/3 of viewport width).
 * Only renders during its own scroll range (progress > 0 && < 1).
 * Each category has a different slide-in entrance animation.
 */
export function CategorySection({
  id, number, eyebrow, title, body, children,
  chips = [], side = 'left', entrance = 'slide-left',
}: Props) {
  const yPos = getSectionWorldY(id);
  const progress = useSectionProgress(id);
  const htmlRef = useRef<HTMLDivElement>(null);
  const heroGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = progress();
    // Only show when this section's scroll range is active (p > 0 && < 1)
    const visible = p > 0.001 && p < 0.999;

    if (htmlRef.current) {
      if (!visible) {
        htmlRef.current.style.opacity = '0';
        htmlRef.current.style.pointerEvents = 'none';
        return;
      }

      // Entrance animation based on progress:
      // 0..0.2 = sliding in, 0.2..0.8 = fully visible, 0.8..1 = sliding out
      const fadeIn = Math.min(1, p / 0.2);
      const fadeOut = Math.min(1, (1 - p) / 0.2);
      const opacity = Math.min(fadeIn, fadeOut);

      // Different entrance transforms per category
      let tx = 0, ty = 0, scale = 1;
      const entryAmount = 1 - fadeIn;
      const exitAmount = 1 - fadeOut;

      switch (entrance) {
        case 'slide-left':
          tx = -80 * entryAmount + 80 * exitAmount;
          break;
        case 'slide-right':
          tx = 80 * entryAmount - 80 * exitAmount;
          break;
        case 'slide-up':
          ty = 60 * entryAmount - 60 * exitAmount;
          break;
        case 'fade-scale':
          scale = 0.85 + 0.15 * fadeIn;
          tx = 0;
          break;
      }

      htmlRef.current.style.opacity = opacity.toFixed(2);
      htmlRef.current.style.transform =
        `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    }

    if (heroGroupRef.current) {
      const p2 = progress();
      heroGroupRef.current.visible = p2 > 0.001 && p2 < 0.999;
    }
  });

  const heroX = side === 'left' ? 2.6 : -2.6;

  return (
    <group position={[0, yPos, 0]}>
      <Html
        position={[side === 'left' ? -1.8 : 1.8, 0, 0]}
        style={{ width: 'min(620px, 48vw)', pointerEvents: 'none' }}
        transform={false}
        center
      >
        <div ref={htmlRef} style={{
          transition: 'none',
          willChange: 'transform, opacity',
        }}>
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
        </div>
      </Html>

      <group ref={heroGroupRef} position={[heroX, 0, 0]}>
        {children}
      </group>
    </group>
  );
}

export default CategorySection;
