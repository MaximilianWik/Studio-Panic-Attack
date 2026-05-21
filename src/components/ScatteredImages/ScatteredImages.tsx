import { Suspense, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ImageEffect } from './ImageEffects';
import {
  portfolioImages,
  mulberry32,
} from '../../helpers/useImageAssets';
import type { ShaderKind } from '../../shaders/imageShaders';
import { Y_PER_PAGE, totalPages, sections } from '../../config/sections';

interface Props {
  reducedEffects: boolean;
}

interface ScatteredItem {
  url: string;
  kind: ShaderKind;
  worldY: number;
  x: number;
  z: number;
  rotZ: number;
  size: number;
  parallax: number;
}

/** All shader kinds in the rotation. */
const KINDS_FULL: ShaderKind[] = ['flute', 'halftone', 'dither', 'paper', 'liquid'];
const KINDS_REDUCED: ShaderKind[] = ['plain'];

/**
 * Pool of imagery distributed at deterministic positions across the
 * entire scroll range. Each item picks one shader effect at module load.
 *
 * Distribution strategy:
 *  - Skip the first 0.4 of the hero (don't compete with the logo)
 *  - Skip the gallery section entirely (already image-heavy)
 *  - Cluster more densely around the category sections (01..04) to fill
 *    the negative space alongside the headline + body text
 *  - Vary x offsets so some bleed off the left edge, some off the right,
 *    some sit on top of the text columns
 *  - Vary z so some are in front of category 3D content, some behind
 *
 * Magnetic cursor: each item's group is offset toward the projected
 * pointer when the pointer is within a screen-space radius. The
 * attraction is small (~0.15 world units max) — readable parallax, not
 * a snap.
 */
export function ScatteredImages({ reducedEffects }: Props) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const opacityRefs = useRef<{ current: number }[]>([]);
  const { camera, pointer } = useThree();

  const items = useMemo<ScatteredItem[]>(() => {
    if (portfolioImages.length === 0) return [];
    const rnd = mulberry32(0xc0ffee);
    const kinds = reducedEffects ? KINDS_REDUCED : KINDS_FULL;

    // Sections we want to cluster around (anything except hero/gallery).
    const clusters = sections
      .filter((s) =>
        ['graphic-design', 'three-dee-art', 'ai-art', 'ux-design', 'highlights'].includes(s.id),
      )
      .map((s) => s.offset + s.pages / 2);

    const out: ScatteredItem[] = [];
    const itemCount = reducedEffects ? 8 : 18;

    for (let i = 0; i < itemCount; i++) {
      // Pick a host cluster, then jitter around it
      const host = clusters[i % clusters.length]!;
      const jitterPages = (rnd() - 0.5) * 1.4;
      const pageOffset = Math.max(
        0.6, // never overlap hero
        Math.min(totalPages - 0.5, host + jitterPages),
      );
      const worldY = -pageOffset * Y_PER_PAGE;

      const url = portfolioImages[Math.floor(rnd() * portfolioImages.length)]!;
      const kind = kinds[Math.floor(rnd() * kinds.length)]!;

      // Side bias — alternate left/right with bleed
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (1.6 + rnd() * 1.8);
      const z = -1.0 + rnd() * 2.4; // -1 (in front of categories) to +1.4 (behind)
      const rotZ = (rnd() - 0.5) * 0.18;
      const size = 0.7 + rnd() * 0.9;
      const parallax = 0.5 + rnd() * 0.5;

      out.push({ url, kind, worldY, x, z, rotZ, size, parallax });
    }
    return out;
    // intentionally not depending on portfolioImages / sections — they
    // are module-level constants
  }, [reducedEffects]);

  // Initialize opacity refs once.
  useMemo(() => {
    opacityRefs.current = items.map(() => ({ current: 0 }));
  }, [items]);

  // Reusable scratch — avoid per-frame allocation
  const _vec = useRef(new THREE.Vector3());
  const _ndc = useRef(new THREE.Vector3());

  useFrame(() => {
    const cam = camera;

    for (let i = 0; i < items.length; i++) {
      const g = groupRefs.current[i];
      const item = items[i]!;
      if (!g) continue;

      // Distance from camera in world space along Y
      // (camera at (0,0,8), items at world (x, worldY + masterY, z),
      // but camera doesn't see masterY translation — easier to read
      // through projection).
      _vec.current.set(item.x, item.worldY, item.z);
      // Apply the master group's matrix — find world position
      const parent = g.parent;
      if (parent) {
        _vec.current.applyMatrix4(parent.matrixWorld);
      }

      // Distance from camera (z=8 looking at origin)
      const dyFromCam = _vec.current.y - 0;
      const visibleHalfHeight = 4.5; // approx vertical half-extent at item z

      const fade = 1 - Math.min(1, Math.abs(dyFromCam) / (visibleHalfHeight + 1.5));
      // ease for a softer entrance
      const opacity = Math.max(0, fade);
      const eased = opacity * opacity * (3 - 2 * opacity);
      opacityRefs.current[i]!.current = eased;

      // Magnetic cursor attraction — only when item is in view
      let mx = 0;
      let my = 0;
      if (eased > 0.05) {
        // Project item to NDC
        _ndc.current.copy(_vec.current).project(cam);
        const ndx = _ndc.current.x;
        const ndy = _ndc.current.y;
        const dx = pointer.x - ndx;
        const dy = pointer.y - ndy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const range = 0.45;
        const pull = Math.max(0, 1 - dist / range);
        const strength = pull * pull * 0.18;
        mx = dx * strength;
        my = dy * strength;
      }

      // Apply: parallax (tiny global pointer offset by depth) + magnet pull
      const paraX = pointer.x * 0.05 * item.parallax;
      const paraY = pointer.y * 0.05 * item.parallax;

      g.position.x = item.x + paraX + mx;
      g.position.y = item.worldY + paraY + my;

      // Subtle scale pulse: scale from 0 on entrance
      const scale = 0.5 + eased * 0.5;
      g.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {items.map((item, i) => (
        <Suspense key={i} fallback={null}>
          <group
            ref={(g: THREE.Group | null) => {
              groupRefs.current[i] = g;
            }}
            position={[item.x, item.worldY, item.z]}
            rotation={[0, 0, item.rotZ]}
          >
            <ImageEffect
              url={item.url}
              kind={item.kind}
              maxSize={item.size}
              opacityRef={opacityRefs.current[i]}
            />
          </group>
        </Suspense>
      ))}
    </group>
  );
}
