import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

import {
  getSectionWorldY,
  type SectionId,
  VIEWPORT_HEIGHT_UNITS,
} from '../../config/sections';
import {
  pickByAffinity,
  type AssetEntry,
} from '../../helpers/useImageAssets';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { shaderIds, type ShaderId } from '../../shaders/imageShaders';
import { ImageEffect } from './ImageEffects';

interface ScatteredItem {
  asset: AssetEntry;
  /** world-Y center for this image */
  worldY: number;
  /** offset on X (left/right of center column) */
  offsetX: number;
  /** offset on Z (depth jitter) */
  offsetZ: number;
  rotZ: number;
  height: number;
  effect: ShaderId | 'plain';
  /** parallax weight: 0 = locked to scroll, 0.4 = drifts slower */
  parallax: number;
  /** magnetic pull weight on pointer */
  magnet: number;
  /** seed for breathing wobble */
  seed: number;
}

const sectionAffinities: { id: SectionId | 'gallery'; count: number }[] = [
  { id: 'graphic', count: 5 },
  { id: 'threeD', count: 5 },
  { id: 'ai', count: 5 },
  { id: 'ux', count: 4 },
];

/**
 * Hash a stable seed for layout — keeps positions identical across reloads.
 */
function hash(i: number): number {
  let h = i * 2654435761;
  h ^= h >>> 13;
  h = Math.imul(h, 1597334677);
  return ((h >>> 0) % 100000) / 100000;
}

function buildLayout(lowPower: boolean): ScatteredItem[] {
  const items: ScatteredItem[] = [];
  let i = 0;

  for (const seg of sectionAffinities) {
    const yCenter = getSectionWorldY(seg.id as SectionId);
    const pool = pickByAffinity(seg.id);
    if (!pool.length) continue;
    const want = lowPower ? Math.ceil(seg.count / 2) : seg.count;

    for (let k = 0; k < want; k++) {
      const r1 = hash(i + 11);
      const r2 = hash(i + 23);
      const r3 = hash(i + 37);
      const r4 = hash(i + 41);
      const r5 = hash(i + 53);

      const asset = pool[(i * 7 + k * 3) % pool.length];

      // Y inside the section: spread across the section span
      const ySpread = (k / Math.max(1, want - 1) - 0.5) * VIEWPORT_HEIGHT_UNITS * 1.0;
      const worldY = yCenter + ySpread + (r1 - 0.5) * 1.4;

      // X: alternate left/right with jitter
      const side = k % 2 === 0 ? -1 : 1;
      const offsetX = side * (3.6 + r2 * 1.6);

      // Z: small depth jitter, never in front of the camera
      const offsetZ = -2.2 - r3 * 4.5;

      // tilt
      const rotZ = (r4 - 0.5) * 0.18;

      // size
      const height = 1.2 + r5 * 1.4;

      // effect: pick deterministically among the 5
      const effect: ShaderId | 'plain' = lowPower
        ? 'plain'
        : shaderIds[(i * 3 + k) % shaderIds.length];

      items.push({
        asset,
        worldY,
        offsetX,
        offsetZ,
        rotZ,
        height,
        effect,
        parallax: 0.05 + r1 * 0.18,
        magnet: 0.2 + r2 * 0.5,
        seed: r3 * 100,
      });

      i++;
    }
  }
  return items;
}

/**
 * Scattered image planes with mixed shader treatments. Distributed
 * across the scroll range, clustered around the four category sections.
 *
 *   - Each plane has a tiny parallax weight so deeper ones drift slower
 *     than scroll (depth illusion).
 *   - Each plane gets a soft magnetic pull toward the cursor when its
 *     world-Y is within a few units of the camera.
 *   - On GPU tier ≤ 1 we halve the count and force `effect = 'plain'`.
 *
 * The whole group is hidden when the user is far from any of the
 * category sections (in hero or highlights), to save fill rate.
 */
export function ScatteredImages() {
  const profile = useDeviceProfile();
  const lowPower = profile.isLowPower;

  const items = useMemo(() => buildLayout(lowPower), [lowPower]);

  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  const itemRefs = useRef<(THREE.Group | null)[]>([]);
  itemRefs.current = items.map((_, i) => itemRefs.current[i] ?? null);

  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;

    if (!groupRef.current) return;

    // viewport-cull: hide when scroll is in hero or highlights
    const off = scroll.offset;
    const hide = off < 0.07 || off > 0.94;
    groupRef.current.visible = !hide;
    if (hide) return;

    const t = state.clock.elapsedTime;

    for (let i = 0; i < items.length; i++) {
      const ref = itemRefs.current[i];
      if (!ref) continue;
      const it = items[i];

      // breathing wobble per seed
      const wob = Math.sin(t * 0.6 + it.seed) * 0.05;

      // magnetic pull: stronger when this item is currently close to the
      // camera in world space (which means it's the visible one as we
      // scroll past)
      ref.getWorldPosition(_w);
      const distY = Math.abs(_w.y - camera.position.y);
      const pullScale = Math.max(0, 1 - distY / 5);
      const px = pointer.current.x * it.magnet * pullScale;
      const py = pointer.current.y * it.magnet * 0.4 * pullScale;

      ref.position.x = it.offsetX + px;
      ref.position.y = wob + py;
      ref.position.z = it.offsetZ + Math.sin(t * 0.5 + it.seed) * it.parallax * 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((it, i) => (
        <group
          key={i}
          ref={(g) => {
            itemRefs.current[i] = g;
          }}
          position={[it.offsetX, 0, it.offsetZ]}
          rotation={[0, 0, it.rotZ]}
        >
          {/* pin world-Y by parking the inner Image at the section's center;
              the outer scaffold then moves x/y/z per-frame around that. */}
          <group position={[0, it.worldY, 0]}>
            <Suspense fallback={null}>
              <ImageEffect
                url={it.asset.url}
                height={it.height}
                effect={it.effect}
                intensity={lowPower ? 0 : 1}
              />
            </Suspense>
          </group>
        </group>
      ))}
    </group>
  );
}

export default ScatteredImages;

const _w = /* @__PURE__ */ new THREE.Vector3();
