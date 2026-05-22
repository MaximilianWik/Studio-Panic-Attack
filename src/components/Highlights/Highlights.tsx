import { Html } from '@react-three/drei';
import { LiquidMetal } from '@paper-design/shaders-react';
import { useState } from 'react';

import { getSectionWorldY } from '../../config/sections';
import { assetUrl } from '../../helpers/assetUrl';

interface HighlightSpec {
  num: string;
  title: string;
  blurb: string;
  href: string;
  media: string;
}

/**
 * Highlights — 4-card DOM grid.
 *
 *   - Each card is a portrait-aspect tile: image + title + index.
 *   - Hover overlays a paper-design `LiquidMetal` shader as a "treatment"
 *     screen-blended over the image.
 *   - Cards stagger-float gently (CSS @keyframes).
 *   - The "/highlights/[slug]" route does not exist yet — placeholder
 *     hrefs keep the markup correct. // TODO: route to future highlights
 *     detail page.
 *
 * Sits inside <Html transform={false}> so it lives in screen-space
 * regardless of camera framing.
 */

const HIGHLIGHTS: HighlightSpec[] = [
  {
    num: 'I',
    title: 'Cemetery — long sequence',
    blurb: 'Unreal Engine 5',
    href: '/highlights/cemetery-sequence',
    media: assetUrl('/landing/cemetery-scene16.png'),
  },
  {
    num: 'II',
    title: 'Holistic — editorial',
    blurb: 'Editorial / 3D',
    href: '/highlights/holistic-editorial',
    media: assetUrl('/landing/holistic-letter-from-the-editor-and-3d-article.png'),
  },
  {
    num: 'III',
    title: 'Chrome type',
    blurb: 'Type / liquid metal',
    href: '/highlights/chrome-type',
    media: assetUrl('/landing/chrome-type-bw-4.png'),
  },
  {
    num: 'IV',
    title: 'Glass error',
    blurb: 'UX / interaction',
    href: '/highlights/glass-error',
    media: assetUrl('/landing/glasserrorscrnshot.png'),
  },
];

export function Highlights() {
  const yPos = getSectionWorldY('highlights');

  return (
    <group position={[0, yPos, 0]}>
      <Html
        center
        position={[0, 0, 0]}
        style={{ width: '100vw', pointerEvents: 'none', zIndex: 3 }}
        transform={false}
        occlude={false}
      >
        <div
          className="spa-overlay spa-overlay--interactive"
          style={{
            width: '100vw',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'end',
            width: 'min(1200px, 92vw)',
            gap: '40px',
            marginBottom: '8px',
          }}>
            <div>
              <div className="spa-eyebrow">— SELECTED HIGHLIGHTS</div>
              <h2 className="spa-title" style={{ fontSize: 'clamp(48px, 7vw, 120px)', textAlign: 'left' }}>
                Featured pieces
              </h2>
            </div>
            <p className="spa-highlights-quote">
              There may be no better way to communicate what we do than through images. As you browse my site, take a few moments to let your eyes linger here, and see if you can get a feel for my signature touch.
            </p>
          </div>

          <div className="spa-highlights">
            {HIGHLIGHTS.map((h, i) => (
              <HighlightCard key={h.num} h={h} index={i} />
            ))}
          </div>

          <div className="spa-footer" style={{ marginTop: 60 }}>
            <div className="spa-footer__row">
              <span>EMA STOYANOVA</span>
              <span>STUDIO · PANIC · ATTACK</span>
              <span>2026</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

interface CardProps {
  h: HighlightSpec;
  index: number;
}

function HighlightCard({ h, index }: CardProps) {
  const [hover, setHover] = useState(false);
  const stagger = (['spa-card--stagger-0', 'spa-card--stagger-1', 'spa-card--stagger-2', 'spa-card--stagger-3'] as const)[index % 4];

  return (
    <a
      // TODO: route to future highlights detail page
      href={h.href}
      className={'spa-card ' + stagger}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={(e) => e.preventDefault()}
    >
      <img
        className="spa-card__media"
        src={h.media}
        alt={h.title}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
      />

      {/* paper-design liquid metal treatment, only mounted when hovered
          to avoid running 4 simultaneous shader contexts at idle */}
      {hover ? (
        <div
          className="spa-card__shader"
          style={{ opacity: 0.75, mixBlendMode: 'screen' }}
        >
          <LiquidMetal
            style={{ width: '100%', height: '100%' }}
            colorBack="#050505"
            colorTint="#d30000"
            softness={0.4}
            repetition={2.8}
            shiftRed={0.4}
            shiftBlue={-0.3}
            distortion={0.5}
            contour={0.6}
            shape="metaballs"
            speed={1.6}
          />
        </div>
      ) : null}

      <div className="spa-card__copy">
        <span className="spa-card__num">{h.num}</span>
        <span className="spa-card__title">{h.title}</span>
        <span className="spa-meta" style={{ marginTop: 4 }}>{h.blurb}</span>
      </div>
    </a>
  );
}

export default Highlights;
