import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Float, Text } from '@react-three/drei';
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
 * Composition:
 *  - HeroBackground: animated noise gradient on a deep plane
 *  - Logo plane: textured PNG, fades in on mount, scales down + dissolves
 *    out toward the end of the hero range
 *  - "scroll" prompt: 3D text floating below the logo, fades on scroll
 */
export function Hero({ section }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const logoRef = useRef<THREE.Mesh>(null);
  const promptRef = useRef<THREE.Group>(null);
  const promptMatRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const logoMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const introMix = useRef(0); // 0 → 1 over first ~1s after mount

  const tex = useTexture(LOGO_URL);
  // PNG with transparency — keep colorspace correct so it isn't washed out.
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const progress = useScrollSection(section.offset, section.pages);

  // Logo aspect — read from the texture once it's loaded.
  // drei's useTexture suspends until ready, so dimensions are available.
  const aspect = tex.image
    ? tex.image.width / tex.image.height
    : 1;
  const baseHeight = 1.6;
  const baseWidth = baseHeight * aspect;

  useFrame((state, dt) => {
    if (!groupRef.current) return;

    introMix.current = Math.min(1, introMix.current + dt * 1.0);
    const p = Math.max(0, Math.min(1, progress.current));

    // Logo: fade in on mount, scale + fade out as scroll progresses past 0.6
    if (logoRef.current) {
      const exit = Math.max(0, Math.min(1, (p - 0.55) / 0.4));
      const scale = (1 + introMix.current * 0.0) * (1 - exit * 0.35);
      logoRef.current.scale.setScalar(scale);
      logoRef.current.position.y = -exit * 0.6;
    }
    if (logoMatRef.current) {
      const exit = Math.max(0, Math.min(1, (p - 0.55) / 0.4));
      logoMatRef.current.opacity = introMix.current * (1 - exit);
    }

    // Subtle drift on the whole group — like the logo is breathing
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.4) * 0.04;
    groupRef.current.rotation.z = Math.sin(t * 0.27) * 0.005;

    // Prompt fade — gone by p≈0.3
    if (promptRef.current) {
      const opacity = introMix.current * (1 - Math.min(1, p / 0.3));
      promptRef.current.visible = opacity > 0.01;
      for (const m of promptMatRef.current) {
        if (m) m.opacity = opacity;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <HeroBackground section={section} />

      {/* Logo plane */}
      <mesh ref={logoRef} position={[0, 0.2, 0]}>
        <planeGeometry args={[baseWidth, baseHeight]} />
        <meshBasicMaterial
          ref={logoMatRef}
          map={tex}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Scroll prompt — drifts gently below the logo */}
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.4}>
        <group ref={promptRef} position={[0, -1.4, 0.1]}>
          <Text
            fontSize={0.075}
            letterSpacing={0.4}
            anchorX="center"
            anchorY="middle"
            color="#1a1814"
          >
            S C R O L L
            <meshBasicMaterial
              attach="material"
              ref={(m: THREE.MeshBasicMaterial | null) => {
                if (m) promptMatRef.current[0] = m;
              }}
              color="#1a1814"
              transparent
              opacity={0}
              toneMapped={false}
            />
          </Text>
          {/* small underline tick */}
          <mesh position={[0, -0.08, 0]}>
            <planeGeometry args={[0.012, 0.32]} />
            <meshBasicMaterial
              ref={(m: THREE.MeshBasicMaterial | null) => {
                if (m) promptMatRef.current[1] = m;
              }}
              color="#1a1814"
              transparent
              opacity={0}
              toneMapped={false}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}
