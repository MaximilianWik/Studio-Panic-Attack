import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { getSectionWorldY, type SectionId, VIEWPORT_HEIGHT_UNITS } from '../../config/sections';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { shaderIds, type ShaderId } from '../../shaders/imageShaders';
import { openLightbox } from '../../helpers/lightbox';
import { pickOptimized } from '../../helpers/optimizedSrc';
import { DebugLabel } from '../Debug/DebugOverlay';
import { ImageEffect } from './ImageEffects';

// Section affinity → matching project (slug + display title). Used to wire
// the lightbox "View project →" pill to the correct board when the user
// clicks one of the legacy /landing/ scatter images.
const AFFINITY_TO_PROJECT: Record<SectionId, { slug: string; title: string } | null> = {
  graphic: { slug: 'graphic-design', title: 'Graphic Design' },
  threeD:  { slug: '3d', title: '3D' },
  ai:      { slug: 'ai', title: 'AI Art' },
  ux:      { slug: 'ux-ui', title: 'UX / UI' },
  // Sections that don't have a 1:1 project mapping fall back to no link.
  hero:       null,
  highlights: null,
  vocabulary: null,
  gallery:    null,
};

// Per-image scatter pool. Each entry pairs a /landing/ source with the
// section it visually belongs to — `affinity` drives both the section it
// orbits in worldspace and the project the lightbox "View project" pill
// links to. Originals (no .webp suffix) are kept here so we can load the
// 1080 WebP for the texture (cheap decode) and the 1920 WebP for the
// lightbox click (still WebP, ample fidelity for fullscreen).
interface ScatterSource { url: string; affinity: SectionId; }
const SCATTER_SOURCES: ScatterSource[] = [
  { url: '/landing/000008390034_33a-copy-2.jpg', affinity: 'graphic' },
  { url: '/landing/add-more-chaos.png',          affinity: 'ai' },
  { url: '/landing/blob-ogzeet.png',             affinity: 'threeD' },
  { url: '/landing/cemetery-scene1.png',         affinity: 'threeD' },
  { url: '/landing/glasserrorscrnshot.png',      affinity: 'ux' },
  { url: '/landing/holistic-letter-from-the-editor-and-3d-article.png', affinity: 'ux' },
  { url: '/landing/img_1027-2.png',              affinity: 'graphic' },
  { url: '/landing/img_1034.png',                affinity: 'graphic' },
  { url: '/landing/img_2832.png',                affinity: 'ai' },
  { url: '/landing/img_3370.png',                affinity: 'ai' },
  { url: '/landing/img_3375.png',                affinity: 'ai' },
  { url: '/landing/img_4253-1.jpg',              affinity: 'graphic' },
  { url: '/landing/img_4256.jpg',                affinity: 'graphic' },
  { url: '/landing/img_4258.jpg',                affinity: 'graphic' },
  { url: '/landing/img_4297.jpg',                affinity: 'graphic' },
  { url: '/landing/img_9089.png',                affinity: 'graphic' },
  { url: '/landing/img_9247.png',                affinity: 'graphic' },
  { url: '/landing/img_9258.jpeg',               affinity: 'graphic' },
  { url: '/landing/img_9790-min.png',            affinity: 'graphic' },
  { url: '/landing/img_9791-min.png',            affinity: 'graphic' },
  { url: '/landing/img_9793-min.png',            affinity: 'graphic' },
  { url: '/landing/levelsequence-1.0011.png',    affinity: 'threeD' },
];

interface ScatteredItem {
  /** WebP variant URL for the THREE texture (cheap decode). */
  texUrl: string;
  /** Higher-res variant URL for the lightbox click (still WebP). */
  fullUrl: string;
  /** Project hint passed to the lightbox so the View-project pill renders. */
  project: { slug: string; title: string } | null;
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
  const shuffled = [...SCATTER_SOURCES].sort(() => hash(Date.now() % 1000 + Math.random() * 100) - 0.5);

  for (let i = 0; i < count; i++) {
    const r1 = hash(i + 11);
    const r2 = hash(i + 23);
    const r3 = hash(i + 37);
    const r4 = hash(i + 41);
    const r5 = hash(i + 53);

    // Distribute across the 4 category sections
    const sectionIdx = i % sectionAffinities.length;
    const yCenter = getSectionWorldY(sectionAffinities[sectionIdx]);
    const src = shuffled[i % shuffled.length];

    // ySpread (section-local; positive = above section centre, i.e.
    // earlier in scroll). Tightened from ±2.5 to a narrower band and
    // biased UP so items read as "alongside / just above" the
    // biased UP so items read as "alongside / just above" the
    // category text instead of trailing far below it. Centre Y of
    // each item lands roughly between -0.6 and +2.4 of the section
    // centre, then random jitter adds ±0.5.
    const ySpread = ((i % 3) / 2 - 0.2) * VIEWPORT_HEIGHT_UNITS * 0.3;
    // Lifted +7 worldY so the bg cluster sits well above the
    // CategorySection text (which is dropped -10 inside
    // CategorySection). Net separation between scattered cluster
    // and text body: 17 world units.
    const worldY = yCenter + ySpread + (r1 - 0.5) * 1.0 + 7;

    const side = i % 2 === 0 ? -1 : 1;
    const offsetX = side * (4.2 + r2 * 1.4);
    const offsetZ = -1.8 - r3 * 3.0;
    const rotZ = (r4 - 0.5) * 0.16;
    const height = 2.6 + r5 * 1.8;

    // Rotate through all shader effects
    const effect: ShaderId | 'plain' = lowPower
      ? 'plain'
      : shaderIds[i % shaderIds.length];

    // Use the image's own affinity (curated per /landing/ entry above) so
    // the View-project link points to the right board even when the item
    // landed in a different section's worldY column.
    const proj = AFFINITY_TO_PROJECT[src.affinity];

    items.push({
      texUrl: pickOptimized(src.url, 1080),
      fullUrl: pickOptimized(src.url, 1920),
      project: proj,
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
              <ImageEffect
                url={it.texUrl}
                height={it.height}
                effect={it.effect}
                intensity={lowPower ? 0 : 1}
                onClick={() => openLightbox(
                  it.fullUrl,
                  it.project ? { projectSlug: it.project.slug, projectTitle: it.project.title } : {},
                )}
              />
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
