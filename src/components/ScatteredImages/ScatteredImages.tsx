import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { getSectionWorldY, type SectionId, VIEWPORT_HEIGHT_UNITS } from '../../config/sections';
import { pickByAffinity, type AssetEntry } from '../../helpers/useImageAssets';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { shaderIds, type ShaderId } from '../../shaders/imageShaders';
import { openLightbox } from '../../helpers/lightbox';
import { ImageEffect } from './ImageEffects';

interface ScatteredItem {
  asset: AssetEntry;
  worldY: number;
  offsetX: number;
  offsetZ: number;
  rotZ: number;
  height: number;
  effect: ShaderId | 'plain';
  parallax: number;
  magnet: number;
  seed: number;
}

const sectionAffinities: { id: SectionId; count: number }[] = [
  { id: 'graphic', count: 2 },
  { id: 'threeD', count: 2 },
  { id: 'ai', count: 1 },
  { id: 'ux', count: 1 },
];

function hash(i: number): number {
  let h = i * 2654435761;
  h ^= h >>> 13;
  h = Math.imul(h, 1597334677);
  return ((h >>> 0) % 100000) / 100000;
}

function buildLayout(lowPower: boolean): ScatteredItem[] {
  const items: ScatteredItem[] = [];
  let idx = 0;
  for (const seg of sectionAffinities) {
    const yCenter = getSectionWorldY(seg.id);
    const pool = pickByAffinity(seg.id);
    if (!pool.length) continue;
    const want = lowPower ? Math.max(1, Math.floor(seg.count / 2)) : seg.count;
    for (let k = 0; k < want; k++) {
      const r1 = hash(idx + 11);
      const r2 = hash(idx + 23);
      const r3 = hash(idx + 37);
      const r4 = hash(idx + 41);
      const r5 = hash(idx + 53);
      const asset = pool[(idx * 7 + k * 3) % pool.length];
      const ySpread = (k / Math.max(1, want - 1) - 0.5) * VIEWPORT_HEIGHT_UNITS * 0.6;
      const worldY = yCenter + ySpread + (r1 - 0.5) * 0.6;
      const side = k % 2 === 0 ? -1 : 1;
      const offsetX = side * (4.6 + r2 * 1.0);
      const offsetZ = -2.0 - r3 * 2.5;
      const rotZ = (r4 - 0.5) * 0.14;
      const height = 2.4 + r5 * 1.2;
      const effect: ShaderId | 'plain' = lowPower ? 'plain' : shaderIds[(idx * 3 + k) % shaderIds.length];
      items.push({ asset, worldY, offsetX, offsetZ, rotZ, height, effect, parallax: 0.04 + r1 * 0.14, magnet: 0.12 + r2 * 0.3, seed: r3 * 100 });
      idx++;
    }
  }
  return items;
}

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
    const off = scroll.offset;
    const hide = off < 0.13 || off > 0.96;
    groupRef.current.visible = !hide;
    if (hide) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const ref = itemRefs.current[i];
      if (!ref) continue;
      const it = items[i];
      const wob = Math.sin(t * 0.5 + it.seed) * 0.04;
      ref.getWorldPosition(_w);
      const distY = Math.abs(_w.y - camera.position.y);
      const pullScale = Math.max(0, 1 - distY / 5);
      ref.position.x = it.offsetX + pointer.current.x * it.magnet * pullScale;
      ref.position.y = wob + pointer.current.y * it.magnet * 0.4 * pullScale;
      ref.position.z = it.offsetZ + Math.sin(t * 0.45 + it.seed) * it.parallax * 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((it, i) => (
        <group key={i} ref={(g) => { itemRefs.current[i] = g; }} position={[it.offsetX, 0, it.offsetZ]} rotation={[0, 0, it.rotZ]}>
          <group position={[0, it.worldY, 0]}>
            <Suspense fallback={null}>
              <ImageEffect url={it.asset.url} height={it.height} effect={it.effect} intensity={lowPower ? 0 : 1} onClick={() => openLightbox(it.asset.url)} />
            </Suspense>
          </group>
        </group>
      ))}
    </group>
  );
}

export default ScatteredImages;

const _w = /* @__PURE__ */ new THREE.Vector3();
