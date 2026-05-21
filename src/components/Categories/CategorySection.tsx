import { Html } from '@react-three/drei';
import type { ReactNode } from 'react';

interface Props {
  /** the section's world-Y center; passed in so the parent controls placement */
  yPos: number;
  number: string; // "01" .. "04"
  eyebrow: string;
  title: string;
  body: string;
  /** the 3D hero effect for this section */
  children?: ReactNode;
  /** override copy column position (left | right) */
  side?: 'left' | 'right';
  /** add an extra HTML element below the body (link row etc.) */
  meta?: ReactNode;
}

/**
 * Shared category section layout. Three layers in world Y:
 *
 *   1. massive outlined number glyph (DOM via <Html>) sitting back at z = -1.5
 *   2. eyebrow + title + body (DOM via <Html>) anchored to one column
 *   3. the 3D hero effect (children) on the opposite column
 *
 * Body and number are HTML overlays (sharper text, no jagged anti-aliasing).
 * The 3D hero effect renders on canvas.
 */
export function CategorySection({
  yPos,
  number,
  eyebrow,
  title,
  body,
  children,
  side = 'left',
  meta,
}: Props) {
  const copyOffset: [number, number, number] =
    side === 'left' ? [-3.2, 0, 0] : [3.2, 0, 0];
  const heroOffset: [number, number, number] =
    side === 'left' ? [3.0, 0, 0] : [-3.0, 0, 0];

  return (
    <group position={[0, yPos, 0]}>
      {/* massive section number — DOM via <Html> on a fixed back plate */}
      <Html
        center
        position={[0, 1.4, -2.5]}
        style={{ pointerEvents: 'none', zIndex: 0 }}
        transform={false}
        occlude={false}
      >
        <div
          className="spa-section-number"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          {number}
        </div>
      </Html>

      {/* copy column */}
      <Html
        center
        position={copyOffset}
        style={{
          width: '420px',
          pointerEvents: 'none',
          zIndex: 2,
        }}
        transform={false}
      >
        <div className="spa-overlay" style={{ width: '100%' }}>
          <div className="spa-eyebrow">{number} — {eyebrow}</div>
          <h2 className="spa-title">{title}</h2>
          <p className="spa-body">{body}</p>
          {meta ? <div style={{ marginTop: 18 }}>{meta}</div> : null}
        </div>
      </Html>

      {/* hero effect column */}
      <group position={heroOffset}>{children}</group>
    </group>
  );
}

export default CategorySection;
