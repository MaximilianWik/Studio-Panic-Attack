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
 * CategorySection — text Html + 3D hero side-by-side on every viewport.
 *
 * v6 layout (Option B): both halves are anchored at section centre
 * Y=0 regardless of orientation. X positions scale with viewport
 * width so the two halves still fit on phones — they crowd
 * horizontally rather than stack vertically. Trade-off: on narrow
 * portrait phones the text Html and the 3D sculpture overlay each
 * other on screen (text on top, layered/editorial). The win is
 * that *every element's world Y is identical on every device*, so
 * scroll position reveals each section the same way everywhere.
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

  // X-scale: 1.0 on a wide desktop, ~0.5 on an extreme portrait
  // phone. Keeps both halves on screen without changing Y on
  // landscape.
  const xFit = Math.min(1, Math.max(0.4, viewport.width / 6.4));

  // Per-orientation positioning.
  //
  // Landscape: side-by-side at the section centre, sculpture lifted
  // +7, text dropped −10 (the manual placement values from v0.8.x).
  //
  // Portrait: phone viewports are ~8.4 world units tall (FOV 70°),
  // so the landscape Y offsets crowd adjacent sections — UX text
  // (at section_Y − 10) ends up only 5 units above the Highlights
  // anchor (5 < 8.4) and the two visibly stack on screen. We also
  // can't keep the X side-bias on portrait — at the current xFit
  // the Html anchor projects so far off-centre that a 62 vw wide
  // text box overflows the left edge of the viewport (the "first
  // letter of every line is cut off" symptom).
  //
  // Portrait policy: centre both halves on X (text overlays
  // sculpture, layered/editorial), and keep Y offsets small enough
  // that no two sections share screen space at the same scroll.
  const heroPos: [number, number, number] = portrait
    ? [0, 4, 0]
    : [(side === 'left' ? 2.4 : -2.4) * xFit, 7, 0];
  const htmlPos: [number, number, number] = portrait
    ? [0, -4, 0]
    : [(side === 'left' ? -1.6 : 1.6) * xFit, -10, 0];

  // Html screen-space width: narrower on portrait so the text
  // doesn't fully blanket the sculpture.
  const htmlWidth = portrait ? 'min(440px, 78vw)' : 'min(760px, 86vw)';

  return (
    <group position={[0, yPos, 0]}>
      <Html
        position={htmlPos}
        style={{
          width: htmlWidth,
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
