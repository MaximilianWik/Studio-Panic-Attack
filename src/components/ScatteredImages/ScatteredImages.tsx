import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { getSectionWorldY, type SectionId, VIEWPORT_HEIGHT_UNITS } from '../../config/sections';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { shaderIds, type ShaderId } from '../../shaders/imageShaders';
import { openLightbox } from '../../helpers/lightbox';
import { assetUrl } from '../../helpers/assetUrl';
import { DebugLabel } from '../Debug/DebugOverlay';
import { ImageEffect } from './ImageEffects';

// All scattered images live alongside the gallery pool in /landing/.
// Reusing the same URLs lets the browser share a single cached texture
// across Gallery and ScatteredImages — no duplicate network fetches,
// no duplicate GPU textures. URLs are routed through assetUrl() so
// production fetches the resized WebP via weserv.
const SCATTER_IMAGES = [
  '/landing/000008390034_33a-copy-2.jpg',
  '/landing/add-more-chaos.png',
  '/landing/blob-ogzeet.png',
  '/landing/cemetery-scene1.png',
  '/landing/glasserrorscrnshot.png',
  '/landing/holistic-letter-from-the-editor-and-3d-article.png',
  '/landing/img_1027-2.png',
  '/landing/img_1034.png',
  '/landing/img_2832.png',
  '/landing/img_3370.png',
  '/landing/img_3375.png',
  '/landing/img_4253-1.jpg',
  '/landing/img_4256.jpg',
  '/landing/img_4258.jpg',
  '/landing/img_4297.jpg',
  '/landing/img_9089.png',
  '/landing/img_9247.png',
  '/landing/img_9258.jpeg',
  '/landing/img_9790-min.png',
  '/landing/img_9791-min.png',
  '/landing/img_9793-min.png',
  '/landing/levelsequence-1.0011.png',
].map((p) => assetUrl(p));

interface ScatteredItem {
  url: string;
  worldY: number;
  affinity: SectionId;
  offsetX: number;
  offsetZ: number;
  rotZ: number;
  height: number;
  effect: ShaderId | 'plain';
  parallax: number;
  magnet: number;
  seed: number;
}

const sectionAffinities: SectionId[] = ['graphic', 'threeD', 'ai', 'ux'];

function hash(i: number): number {
  let h = i * 2654435761;
  h ^= h >>> 13;
  h = Math.imul(h, 1597334677);
  return ((h >>> 0) % 100000) / 100000;
}

function buildLayout(lowPower: boolean): ScatteredItem[] {
  const items: ScatteredItem[] = [];
  // Bumped slightly after the v6 section retune — gallery is longer
  // and 02 is shorter, so the categories felt sparse with the old
  // counts. More density flanking the text keeps the bg alive.
  const count = lowPower ? 10 : 18;
  // Randomly shuffle which images go where
  const shuffled = [...SCATTER_IMAGES].sort(() => hash(Date.now() % 1000 + Math.random() * 100) - 0.5);

  for (let i = 0; i < count; i++) {
    const r1 = hash(i + 11);
    const r2 = hash(i + 23);
    const r3 = hash(i + 37);
    const r4 = hash(i + 41);
    const r5 = hash(i + 53);

    // Distribute across the 4 category sections
    const sectionIdx = i % sectionAffinities.length;
    const yCenter = getSectionWorldY(sectionAffinities[sectionIdx]);
    const url = shuffled[i % shuffled.length];

    // ySpread (section-local; positive = above section centre, i.e.
    // earlier in scroll). Tightened from ±2.5 to a narrower band and
    // biased UP so items read as "alongside / just above" the
    // category text instead of trailing far below it. Centre Y of
    // each item lands roughly between -0.6 and +2.4 of the section
    // centre, then random jitter adds ±0.5.
    const ySpread = ((i % 3) / 2 - 0.2) * VIEWPORT_HEIGHT_UNITS * 0.3;
    const worldY = yCenter + ySpread + (r1 - 0.5) * 1.0;

    const side = i % 2 === 0 ? -1 : 1;
    const offsetX = side * (4.2 + r2 * 1.4);
    const offsetZ = -1.8 - r3 * 3.0;
    const rotZ = (r4 - 0.5) * 0.16;
    const height = 2.6 + r5 * 1.8;

    // Rotate through all shader effects
    const effect: ShaderId | 'plain' = lowPower
      ? 'plain'
      : shaderIds[i % shaderIds.length];

    items.push({
      url,
      worldY,
      affinity: sectionAffinities[sectionIdx],
      offsetX,
      offsetZ,
      rotZ,
      height,
      effect,
      parallax: 0.04 + r1 * 0.14,
      magnet: 0.12 + r2 * 0.3,
      seed: r3 * 100,
    });
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
              <ImageEffect url={it.url} height={it.height} effect={it.effect} intensity={lowPower ? 0 : 1} onClick={() => openLightbox(it.url)} />
            </Suspense>
            <DebugLabel
              name={'Scatter[' + i + '] (' + it.affinity + ')'}
              worldY={it.worldY}
              offset={[0, it.height / 2 + 0.5, 0.3]}
              color="#ff8800"
              fontSize={0.18}
            />
          </group>
        </group>
      ))}
    </group>
  );
}

export default ScatteredImages;

const _w = /* @__PURE__ */ new THREE.Vector3();
