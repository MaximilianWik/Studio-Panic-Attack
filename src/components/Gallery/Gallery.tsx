import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollSection } from '../../helpers/useScrollSection';
import { pickImages, mulberry32 } from '../../helpers/useImageAssets';
import type { Section } from '../../config/sections';
import { GalleryCard } from './GalleryCard';

interface Props {
  section: Section;
  reducedEffects: boolean;
}

const RING_COUNT = 14;
const RING_RADIUS = 4.2;
const RING_HEIGHT = 0.6; // helix pitch — tiny vertical wave around the ring

/**
 * Orbital gallery ring.
 *
 * RING_COUNT cards orbit the camera focal point at radius RING_RADIUS.
 * Each card is rotated to face outward (away from ring center) so it
 * always presents flat to the camera when it sits at the front of the
 * ring. As cards approach the front focal point (angle = π/2, +z toward
 * camera), they scale up and have a slight z-push so they pop forward.
 *
 * The ring auto-rotates slowly. Scroll within the section adds extra
 * angular velocity proportional to scroll velocity. Pointer position
 * tilts the entire ring on its X/Z axes, parallax-style.
 *
 * A second, smaller, slower-rotating ring sits behind the main one for
 * background depth.
 */
export function Gallery({ section, reducedEffects }: Props) {
  const ringRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const bgRingRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0);
  const lastProgress = useRef(0);

  const progress = useScrollSection(section.offset, section.pages);
  const { pointer } = useThree();

  // Stable pick of images — same on every render.
  const images = useMemo(() => pickImages('gallery', RING_COUNT), []);
  const bgImages = useMemo(() => pickImages('gallery-bg', 8), []);

  // Per-card random tilt + z offset, seeded for stability.
  const cardJitter = useMemo(() => {
    const rnd = mulberry32(0xa11);
    return new Array(RING_COUNT).fill(0).map(() => ({
      tiltX: (rnd() - 0.5) * 0.18,
      tiltY: (rnd() - 0.5) * 0.12,
      z: (rnd() - 0.5) * 0.4,
      yOff: (rnd() - 0.5) * 0.6,
    }));
  }, []);

  // Reusable scratch object so the matrix sets don't allocate per frame.
  const cardRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dt) => {
    const p = progress.current;
    const visible = p > -0.3 && p < 1.3;
    if (ringRef.current) ringRef.current.visible = visible;
    if (bgRingRef.current) bgRingRef.current.visible = visible;
    if (!visible) return;

    // Angular velocity = base + scroll velocity within section
    const scrollDelta = p - lastProgress.current;
    lastProgress.current = p;
    const scrollOmega = scrollDelta / Math.max(dt, 1e-4); // pages/s within section
    const baseOmega = 0.18; // rad/s
    const omega = baseOmega + scrollOmega * 1.6;
    angleRef.current += omega * dt;

    if (ringRef.current) ringRef.current.rotation.y = angleRef.current;
    if (bgRingRef.current) bgRingRef.current.rotation.y = -angleRef.current * 0.45;

    // Pointer tilt — small parallax response.
    if (tiltRef.current) {
      const tx = pointer.x * 0.18;
      const ty = pointer.y * 0.12;
      tiltRef.current.rotation.x += (-ty - tiltRef.current.rotation.x) * 0.06;
      tiltRef.current.rotation.z += (tx - tiltRef.current.rotation.z) * 0.06;
    }

    // Per-card focal pop: scale up cards near front (+z) of the ring.
    for (let i = 0; i < RING_COUNT; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      const cardAngle = (i / RING_COUNT) * Math.PI * 2 + angleRef.current;
      // Front of ring is +z direction → angle = π/2
      // Distance from front in angle space:
      let d = cardAngle - Math.PI / 2;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // wrap to [-π, π]
      const focal = 1 - Math.min(1, Math.abs(d) / (Math.PI / 3));
      const scale = 1 + focal * focal * 0.45;
      card.scale.setScalar(scale);
      // Push forward when focal
      const j = cardJitter[i]!;
      card.position.z = j.z + focal * 0.6;
    }
  });

  return (
    <group ref={tiltRef}>
      {/* Tiny "selected work" eyebrow label */}
      <Html
        position={[0, 2.6, 0]}
        center
        wrapperClass="overlay"
        style={{ pointerEvents: 'none' }}
      >
        <div className="overlay-eyebrow">Selected Work</div>
      </Html>

      {/* Background ring — smaller, dimmer cards for parallax depth */}
      <group ref={bgRingRef} position={[0, 0, -2]}>
        {bgImages.map((url, i) => {
          const a = (i / bgImages.length) * Math.PI * 2;
          const r = RING_RADIUS + 1.8;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
          const lookAtY = Math.atan2(x, z);
          return (
            <group
              key={`${url}-${i}`}
              position={[x, Math.sin(a * 1.7) * 0.4, z]}
              rotation={[0, lookAtY, 0]}
            >
              {reducedEffects ? (
                <mesh>
                  <planeGeometry args={[0.9, 0.6]} />
                  <meshBasicMaterial
                    color="#1a1a1a"
                    transparent
                    opacity={0.4}
                    toneMapped={false}
                  />
                </mesh>
              ) : (
                <BgCard url={url} />
              )}
            </group>
          );
        })}
      </group>

      {/* Main ring */}
      <group ref={ringRef}>
        {images.map((url, i) => {
          const a = (i / RING_COUNT) * Math.PI * 2;
          const r = RING_RADIUS;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
          const j = cardJitter[i]!;
          const y = Math.sin(a * 2 + 0.6) * RING_HEIGHT + j.yOff;
          // Face outward — rotation around Y so plane faces away from origin
          const lookAtY = Math.atan2(x, z);
          return (
            <group
              key={`${url}-${i}`}
              position={[x, y, z]}
              rotation={[j.tiltX, lookAtY + j.tiltY, 0]}
              ref={(g: THREE.Group | null) => {
                cardRefs.current[i] = g;
              }}
            >
              <GalleryCard url={url} size={[1.5, 1.0]} />
            </group>
          );
        })}
      </group>
    </group>
  );
}

/** Smaller faded card for the background ring — textured but dim. */
function BgCard({ url }: { url: string }) {
  return (
    <group>
      <GalleryCard url={url} size={[0.95, 0.65]} />
    </group>
  );
}
