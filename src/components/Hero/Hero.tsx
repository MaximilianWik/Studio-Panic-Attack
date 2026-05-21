import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { HeroBackground } from './HeroBackground';
import { useScrollSection } from '../../helpers/useScrollSection';
import { LOGO_URL } from '../../helpers/useImageAssets';
import type { Section } from '../../config/sections';

interface Props {
  section: Section;
}

/**
 * Hero — first thing on screen.
 *
 * The logo and "scroll" prompt are HTML overlays (drei <Html />) rather
 * than 3D textured planes. This avoids two failure modes that caused
 * blank canvases for some users:
 *
 *  - `useTexture(LOGO_URL)` suspends the subtree until the PNG finishes
 *    decoding; in environments where the load stalls the whole Hero
 *    block stays hidden behind the section's <Suspense fallback={null}>.
 *  - drei's `<Text>` pulls a default font from a CDN; if that load is
 *    blocked or slow, the prompt never shows.
 *
 * The HeroBackground plane stays in the 3D scene because it has no
 * external dependencies (pure custom shader).
 */
export function Hero({ section }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const introMix = useRef(0);

  const progress = useScrollSection(section.offset, section.pages);

  useFrame((state, dt) => {
    introMix.current = Math.min(1, introMix.current + dt * 1.4);
    const p = Math.max(0, Math.min(1, progress.current));

    const exit = Math.max(0, Math.min(1, (p - 0.55) / 0.4));
    const opacity = introMix.current * (1 - exit);

    if (overlayRef.current) {
      overlayRef.current.style.opacity = `${opacity}`;
      overlayRef.current.style.transform = `translateY(${(1 - introMix.current) * 14 + exit * -20}px)`;
    }
    if (promptRef.current) {
      const promptOp = introMix.current * (1 - Math.min(1, p / 0.3));
      promptRef.current.style.opacity = `${promptOp}`;
    }

    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.04;
      groupRef.current.rotation.z = Math.sin(t * 0.27) * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      <HeroBackground section={section} />

      {/* Logo + studio name as an HTML overlay so it never suspends. */}
      <Html
        center
        position={[0, 0.2, 0]}
        wrapperClass="overlay"
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={overlayRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            opacity: 0,
            transition: 'none',
            textAlign: 'center',
          }}
        >
          <img
            src={LOGO_URL}
            alt="Studio Panic Attack"
            style={{
              width: 320,
              height: 'auto',
              maxWidth: '70vw',
              userSelect: 'none',
              pointerEvents: 'none',
              filter: 'none',
            }}
            draggable={false}
          />
        </div>
      </Html>

      {/* "Scroll" prompt below the logo. */}
      <Html
        center
        position={[0, -1.4, 0.1]}
        wrapperClass="overlay"
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={promptRef}
          className="overlay-eyebrow"
          style={{
            opacity: 0,
            transition: 'none',
            whiteSpace: 'nowrap',
            color: '#1a1814',
            animation: 'paFloat 3s ease-in-out infinite',
          }}
        >
          S c r o l l
        </div>
      </Html>
    </group>
  );
}
