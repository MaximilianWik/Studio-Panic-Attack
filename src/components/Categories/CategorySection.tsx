import { useRef, type ReactNode } from 'react';
import { Text, Html, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollSection } from '../../helpers/useScrollSection';
import type { Section } from '../../config/sections';

interface Props {
  section: Section;
  /** The unique 3D content for the category (sculpture, particles, etc.). */
  children?: ReactNode;
  /** Side the headline text sits on. */
  textSide?: 'left' | 'right';
  /** Optional: which numeric label to show — defaults to section.number */
  number?: string;
}

/**
 * Shared layout for the four category sections (01 Graphic Design,
 * 02 3D Art, 03 AI Art, 04 UX Design). Each category provides its own
 * 3D centerpiece via `children`; this wrapper supplies:
 *
 *  - The massive outlined number (with iridescent metal material)
 *  - The eyebrow + title + body HTML overlay
 *  - Subtle entrance animation tied to scroll progress within the section
 */
export function CategorySection({ section, children, textSide = 'right', number }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const titleHtmlRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<THREE.Group>(null);
  const progress = useScrollSection(section.offset, section.pages);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const p = progress.current;
    const visible = p > -0.4 && p < 1.4;
    groupRef.current.visible = visible;
    if (!visible) return;

    // Entrance ease — content lifts in as p moves through 0..0.4
    const enter = Math.max(0, Math.min(1, (p + 0.2) / 0.6));
    const exit = Math.max(0, Math.min(1, (p - 0.6) / 0.4));
    const opacity = enter * (1 - exit);

    if (titleHtmlRef.current) {
      titleHtmlRef.current.style.opacity = `${opacity}`;
      const tx = (1 - enter) * 30 - exit * 30;
      titleHtmlRef.current.style.transform = `translate(${textSide === 'left' ? -tx : tx}px, ${(1 - enter) * 20}px)`;
    }

    // Number floats subtly + drifts in opposite direction
    if (numberRef.current) {
      const t = state.clock.elapsedTime;
      numberRef.current.position.x +=
        ((textSide === 'left' ? 1.3 : -1.3) - numberRef.current.position.x) * 0.1;
      numberRef.current.position.y =
        Math.sin(t * 0.4) * 0.08 + (1 - enter) * -0.6 + exit * 0.6;
      numberRef.current.rotation.z = Math.sin(t * 0.27) * 0.01;
      // Hide via scale during exit/enter
      const ns = enter * (1 - exit);
      numberRef.current.scale.setScalar(0.6 + ns * 0.4);
    }
    // dt is unused — silence lint
    void dt;
  });

  const num = number ?? section.number ?? '';

  return (
    <group ref={groupRef}>
      {/* Massive outlined number behind everything */}
      <group ref={numberRef} position={[textSide === 'left' ? 1.3 : -1.3, 0, -1.4]}>
        <Float speed={0.6} floatIntensity={0.3} rotationIntensity={0}>
          <Text
            fontSize={3.8}
            anchorX="center"
            anchorY="middle"
            letterSpacing={-0.04}
            outlineWidth={0.012}
            outlineColor="#f0ece6"
            outlineOpacity={0.9}
            fillOpacity={0.9}
          >
            {num}
            <meshPhysicalMaterial
              attach="material"
              color="#1a1a1f"
              metalness={1}
              roughness={0.18}
              iridescence={1}
              iridescenceIOR={1.6}
              clearcoat={1}
              clearcoatRoughness={0.15}
              envMapIntensity={1.0}
              transparent
            />
          </Text>
        </Float>
      </group>

      {/* HTML overlay: eyebrow + title + body */}
      <Html
        position={[textSide === 'left' ? -2.2 : 2.2, 0.6, 0]}
        center
        style={{ pointerEvents: 'none', width: '320px' }}
        wrapperClass="overlay"
      >
        <div
          ref={titleHtmlRef}
          style={{
            textAlign: textSide === 'left' ? 'right' : 'left',
            transition: 'none',
          }}
        >
          <div className="overlay-eyebrow" style={{ marginBottom: 12 }}>
            {num} — Category
          </div>
          <div
            className="overlay-title"
            style={{ fontSize: 38, marginBottom: 18 }}
          >
            {section.title}
          </div>
          <div className="overlay-body">{section.body}</div>
        </div>
      </Html>

      {/* The category-specific 3D content */}
      {children}
    </group>
  );
}
