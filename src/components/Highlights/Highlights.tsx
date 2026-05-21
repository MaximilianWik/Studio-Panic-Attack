import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { LiquidMetal } from '@paper-design/shaders-react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollSection } from '../../helpers/useScrollSection';
import { portfolioImages } from '../../helpers/useImageAssets';
import type { Section } from '../../config/sections';

interface Props {
  section: Section;
}

interface Highlight {
  src: string;
  title: string;
  category: string;
}

/**
 * Picks four "featured" works for the highlights grid. We don't have
 * tagged metadata so we choose images by their filenames, which happen
 * to be descriptive.
 */
function pickHighlights(): Highlight[] {
  // Try to find specific filenames; fall back to first 4 if missing.
  const find = (needle: string) =>
    portfolioImages.find((u) => u.toLowerCase().includes(needle.toLowerCase()));

  const list: Highlight[] = [];
  const candidates: [string, string, string][] = [
    ['panic-attack-type-final', 'Panic Attack Type', 'Graphic Design'],
    ['urbanwarholtv', 'Urban Warhol TV', '3D Art'],
    ['cemetery-scene1.', 'Cemetery Scene', 'AI Art'],
    ['glasserrorscrnshot', 'Glass Error', 'UX Design'],
  ];
  for (const [needle, title, category] of candidates) {
    const src = find(needle);
    if (src) list.push({ src, title, category });
  }
  // Top up if any didn't resolve
  for (let i = 0; list.length < 4 && i < portfolioImages.length; i++) {
    const src = portfolioImages[i]!;
    if (!list.find((h) => h.src === src)) {
      list.push({ src, title: 'Selected Work', category: 'Studio' });
    }
  }
  return list.slice(0, 4);
}

const HIGHLIGHTS = pickHighlights();

/**
 * Highlights — closing grid of four featured pieces. Each card uses
 * paper-design's LiquidMetal shader as a hover overlay, with a CSS
 * crossfade between the static thumbnail and the metal treatment.
 *
 * Float animation is implemented as a CSS-keyframe stagger rather than
 * drei <Float>, since the cards live inside <Html transform>.
 */
export function Highlights({ section }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const progress = useScrollSection(section.offset, section.pages);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = progress.current;
    const visible = p > -0.5 && p < 1.5;
    groupRef.current.visible = visible;
    if (!visible || !htmlRef.current) return;

    const enter = Math.max(0, Math.min(1, (p + 0.2) / 0.6));
    const exit = Math.max(0, Math.min(1, (p - 0.7) / 0.4));
    const opacity = enter * (1 - exit);
    htmlRef.current.style.opacity = `${opacity}`;
    htmlRef.current.style.transform = `translateY(${(1 - enter) * 24}px)`;
  });

  return (
    <group ref={groupRef}>
      <Html
        center
        transform={false}
        position={[0, 0, 0]}
        wrapperClass="overlay"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          ref={htmlRef}
          style={{
            width: 'min(900px, 88vw)',
            transition: 'transform 0.4s ease-out',
          }}
        >
          <div
            className="overlay-eyebrow"
            style={{ marginBottom: 12, textAlign: 'center' }}
          >
            Highlights
          </div>
          <div
            className="overlay-title"
            style={{ fontSize: 42, marginBottom: 28, textAlign: 'center' }}
          >
            Recent Pieces
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {HIGHLIGHTS.map((h, i) => (
              <HighlightCard key={i} h={h} delayMs={i * 80} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <a
              href="#"
              data-cursor="hover"
              className="overlay-eyebrow"
              style={{
                color: '#1a1814',
                textDecoration: 'none',
                borderBottom: '1px solid #1a1814',
                paddingBottom: 4,
                pointerEvents: 'auto',
              }}
            >
              See all work →
            </a>
          </div>
        </div>
      </Html>
    </group>
  );
}

function HighlightCard({ h, delayMs }: { h: Highlight; delayMs: number }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#"
      data-cursor="hover"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{
        position: 'relative',
        aspectRatio: '4 / 3',
        overflow: 'hidden',
        textDecoration: 'none',
        color: '#1a1814',
        background: '#ebe3d3',
        animation: `paFloat 4.8s ease-in-out ${delayMs}ms infinite`,
        transition: 'transform 0.4s ease-out',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Static thumbnail */}
      <img
        src={h.src}
        alt={h.title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: hover ? 0.0 : 1,
          transition: 'opacity 0.45s ease-out',
        }}
      />
      {/* Liquid metal hover layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.45s ease-out',
          mixBlendMode: 'normal',
          pointerEvents: 'none',
        }}
      >
        <LiquidMetal
          colorBack="#f5efe4"
          colorTint="#1a1814"
          repetition={3}
          softness={0.35}
          shiftRed={0.35}
          shiftBlue={0.45}
          distortion={0.2}
          contour={0.5}
          shape="circle"
          offsetX={0}
          offsetY={0}
          scale={1.1}
          rotation={0}
          speed={1}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Title overlay (always visible) */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          color: hover ? '#1a1814' : '#f5efe4',
          textShadow: hover ? 'none' : '0 2px 12px rgba(0,0,0,0.45)',
          transition: 'color 0.45s ease-out',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 500 }}>{h.title}</span>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          {h.category}
        </span>
      </div>

      {/* Keyframes injected once via inline style tag */}
      <style>{`
        @keyframes paFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
      `}</style>
    </a>
  );
}
