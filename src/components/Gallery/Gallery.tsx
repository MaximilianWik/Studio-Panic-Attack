import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { getSectionWorldY, getSectionRange } from '../../config/sections';
import { useScrollVelocity } from '../../helpers/useScrollVelocity';
import { GalleryCard } from './GalleryCard';
import { pickByAffinity } from '../../helpers/useImageAssets';

/**
 * Spatial 3D gallery — option α from the brief.
 *
 *   - Foreground ring of N cards orbiting around the camera (radius RF)
 *     at eye height, tilted slightly so we see them from a 3/4 angle.
 *   - Background ring of half as many cards at radius RB, half speed,
 *     for a parallax-depth feel.
 *
 * Rotation is driven by:
 *   - a constant idle rotation (so the ring is in motion at first paint)
 *   - scroll velocity injected so faster scroll spins the ring
 *
 * Cards passing through the front of the ring get a focal pop in scale
 * (computed per-frame from each card's projected z).
 *
 * Pointer parallax tilts the whole rig.
 *
 * The ring `culls` itself when far outside the gallery scroll range,
 * so the entire group becomes invisible after we leave the section.
 */

const F_COUNT = 16;
const B_COUNT = 9;
const F_RADIUS = 4.6;
const B_RADIUS = 8.5;

export function Gallery() {
  const yPos = getSectionWorldY('gallery');
  const [rangeStart, rangeEnd] = getSectionRange('gallery');
  const rangeLen = rangeEnd - rangeStart;

  const groupRef = useRef<THREE.Group>(null);
  const fRingRef = useRef<THREE.Group>(null);
  const bRingRef = useRef<THREE.Group>(null);

  const scroll = useScroll();
  const tickVel = useScrollVelocity();
  const { viewport } = useThree();

  // pick a deterministic stable subset of gallery images for each ring
  const fgImages = useMemo(() => {
    const pool = pickByAffinity('gallery');
    return Array.from({ length: F_COUNT }, (_, i) => pool[i % pool.length]);
  }, []);
  const bgImages = useMemo(() => {
    const pool = pickByAffinity('gallery');
    return Array.from({ length: B_COUNT }, (_, i) => pool[(i * 3 + 7) % pool.length]);
  }, []);

  const fgJitter = useMemo(
    () =>
      Array.from({ length: F_COUNT }, (_, i) => ({
        tilt: ((i * 73) % 100) / 100 - 0.5,
        liftY: (((i * 41) % 100) / 100 - 0.5) * 0.6,
        wobbleSpeed: 0.4 + ((i * 17) % 100) / 200,
        wobbleSeed: (i * 7) % 100,
      })),
    [],
  );

  // Pointer parallax target (smoothed)
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    const offset = scroll.offset;
    // visibility curve: wide in/out so cards pop from offscreen with momentum
    const local = (offset - rangeStart + rangeLen * 0.4) / (rangeLen * 1.8);
    const localClamped = Math.max(0, Math.min(1, local));
    // 0..1..0 triangular
    const visibility = 1 - Math.abs(localClamped * 2 - 1);

    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.001;
      // raise / lower the whole rig as we enter / exit
      const enterY = (1 - visibility) * 2.5;
      groupRef.current.position.y = yPos + enterY * (offset < (rangeStart + rangeEnd) / 2 ? -1 : 1);
    }

    // rotation: idle + scroll-velocity boost
    const vel = tickVel(dt);
    const idle = 0.06;
    const boost = vel * 12;
    if (fRingRef.current) {
      fRingRef.current.rotation.y += dt * (idle + boost) + dt * 0.15 * Math.sin(state.clock.elapsedTime * 0.4);
    }
    if (bRingRef.current) {
      bRingRef.current.rotation.y -= dt * (idle * 0.6 + boost * 0.5);
    }

    // pointer parallax (read mouse from r3f)
    target.current.x = state.pointer.x * 0.18;
    target.current.y = state.pointer.y * 0.12;
    current.current.x += (target.current.x - current.current.x) * 0.06;
    current.current.y += (target.current.y - current.current.y) * 0.06;
    if (groupRef.current) {
      groupRef.current.rotation.x = current.current.y;
      groupRef.current.rotation.z = current.current.x * -0.35;
    }
  });

  // safety: viewport.width when canvas is alpha can be small on first frame
  const camFwd = Math.max(viewport.width, 1);

  return (
    <group ref={groupRef} position={[0, yPos, 0]}>
      {/* Foreground ring — at camera eye level, tilted up slightly */}
      <group ref={fRingRef} rotation={[-0.05, 0, 0]}>
        {fgImages.map((asset, i) => {
          const angle = (i / F_COUNT) * Math.PI * 2;
          const j = fgJitter[i];
          const x = Math.cos(angle) * F_RADIUS;
          const z = Math.sin(angle) * F_RADIUS;
          return (
            <GalleryCard
              key={'f-' + i + '-' + asset.url}
              url={asset.url}
              aspect={asset.aspect}
              position={[x, j.liftY, z]}
              rotationY={-angle + Math.PI / 2 + j.tilt * 0.18}
              size={1.7}
              jitterSeed={j.wobbleSeed}
              wobbleSpeed={j.wobbleSpeed}
            />
          );
        })}
      </group>

      {/* Background ring — wider, slower, smaller cards */}
      <group ref={bRingRef} rotation={[0.06, 0, 0]} scale={0.78}>
        {bgImages.map((asset, i) => {
          const angle = (i / B_COUNT) * Math.PI * 2 + 0.21;
          const x = Math.cos(angle) * B_RADIUS;
          const z = Math.sin(angle) * B_RADIUS;
          return (
            <GalleryCard
              key={'b-' + i + '-' + asset.url}
              url={asset.url}
              aspect={asset.aspect}
              position={[x, ((i * 13) % 100) / 100 - 0.5, z]}
              rotationY={-angle + Math.PI / 2}
              size={1.4}
              jitterSeed={(i * 11) % 100}
              wobbleSpeed={0.25}
              dim={0.55}
            />
          );
        })}
      </group>

      {/* keep camFwd referenced so layout doesn't pretend it's unused */}
      <object3D position={[0, 0, -camFwd * 0.001]} />
    </group>
  );
}

export default Gallery;
