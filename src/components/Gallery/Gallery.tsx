import { useFrame } from '@react-three/fiber';
import { Image, MeshReflectorMaterial, Text, useCursor, useTexture } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { assets, type AssetEntry } from '../../helpers/useImageAssets';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { openLightbox } from '../../helpers/lightbox';

const CAROUSEL_SPEED = 0.15;
const CAROUSEL_WIDTH = 44;
/** Radius of the carousel arc. Slots travel along an arc of this
    radius rather than a straight line, so the row of frames bends
    gently away from the camera at the edges (item I). */
const ARC_R = 30;
/** Number of visible slots. */
const SLOT_COUNT = 18;

/** Minimum offset separation enforced when a slot re-enters on the
    right after wrapping. As slots drift at different speeds the
    initial uniform spacing breaks down; without this check they can
    bunch up and the pointer-tilt causes their geometry to clip.
    One cascade pass at spawn time is enough — the gap won't
    perfectly survive the next lap, but it prevents the worst
    accumulation at the moment of re-entry. */
const MIN_SPAWN_GAP = 2.2;

/** Stage-local Z range for slots. Negative = further from camera.
    Front cap is well behind the gallery floor's "Have a peek inside
    my brain" text (which sits at z=3) so slots can never visually
    poke through the text from the front. Back cap pushes the
    carousel into a 18-unit Z corridor for real depth. */
const SLOT_Z_FRONT = -2;
const SLOT_Z_BACK = -20;

/** Camera Z relative to the stage origin (camera world z=6, stage
    world z=-2 → camera is +8 from stage origin). Used for the
    depth-driven size compensation so back slots don't shrink to
    nothing. */
const STAGE_TO_CAMERA = 8;

interface SlotState {
  /** current image asset for this slot */
  asset: AssetEntry;
  /** current X offset along the carousel belt */
  offset: number;
  /** stable Z depth for this slot (stage local; SLOT_Z_BACK..SLOT_Z_FRONT) */
  depth: number;
  /** stable per-slot scroll-speed multiplier — biased slow for far
      slots (parallax), with a small random jitter so adjacent slots
      don't move in lockstep. */
  speedFactor: number;
  /** breathing seed (regenerated each time a new image is assigned) */
  seed: number;
}

/**
 * Gallery — infinite horizontal carousel with rotating image pool.
 *
 * 12 visible slots cycle through 37+ unique images. As a slot wraps around
 * (exits left → re-enters right), it picks the next image from the pool that
 * is NOT currently assigned to any other visible slot. This guarantees no
 * duplicate images on screen at any moment.
 */
export function Gallery() {
  const yPos = getSectionWorldY('gallery');
  const visibility = useSectionVisibility('gallery');
  const profile = useDeviceProfile();
  const groupRef = useRef<THREE.Group>(null);
  const stageRef = useRef<THREE.Group>(null);
  const camTarget = useRef({ x: 0, y: 0 });
  const camCurrent = useRef({ x: 0, y: 0 });

  // Radial alpha-mask for the floor — opaque at the centre, fades
  // to transparent at the rim. Replaces the old hard-edged 60×60
  // black square with a circular pedestal that dissolves into the
  // surrounding dark instead of terminating abruptly. The same
  // texture mounts on the underside plane so the back face of the
  // floor (visible after scrolling past the gallery) shares the
  // soft edge.
  const floorAlphaMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createRadialGradient(256, 256, 64, 256, 256, 256);
    g.addColorStop(0.00, '#ffffff');
    g.addColorStop(0.55, '#dddddd');
    g.addColorStop(0.85, '#444444');
    g.addColorStop(1.00, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      floorAlphaMap?.dispose();
    };
  }, [floorAlphaMap]);

  // Ground-mist textures (item H). Two cloned soft-noise canvases so
  // each layer can scroll its UVs independently — gives the
  // impression of slow drifting fog over the floor without needing
  // a real volume shader. Skipped on low-power; nothing else to do
  // when the perf override forces a low tier.
  const mistTexA = useMemo(
    () => (profile.isLowPower ? null : makeMistTexture(7)),
    [profile.isLowPower],
  );
  const mistTexB = useMemo(
    () => (profile.isLowPower ? null : makeMistTexture(131)),
    [profile.isLowPower],
  );
  useEffect(() => {
    return () => {
      mistTexA?.dispose();
      mistTexB?.dispose();
    };
  }, [mistTexA, mistTexB]);

  // De-duplicated pool of gallery images
  const pool = useMemo(() => {
    const seen = new Set<string>();
    const out: AssetEntry[] = [];
    for (const a of assets) {
      if (a.affinity !== 'gallery' || a.kind !== 'image') continue;
      if (seen.has(a.url)) continue;
      seen.add(a.url);
      out.push(a);
    }
    return out;
  }, []);

  // Preload every gallery texture once on mount. drei's <Image>/useTexture
  // pulls from the same THREE.Cache, so by the time a slot wraps to a new
  // url the texture is already resident and useTexture resolves synchronously
  // — no Suspense fallback, no scene blank.
  useEffect(() => {
    for (const a of pool) useTexture.preload(a.url);
  }, [pool]);

  // Pool cursor — advances when a slot needs a fresh image
  const poolCursor = useRef(0);

  // Initialize slots — pick the first SLOT_COUNT distinct images from the pool.
  // Depth is spread across SLOT_Z_BACK..SLOT_Z_FRONT via a deterministic
  // hash so the layout is stable across reloads. Speed factor is
  // anchored at 1.0× for slots at the front cap and biased slower
  // for far slots (parallax), with ±20 % random jitter on top so
  // adjacent slots don't drift in lockstep.
  const slots = useRef<SlotState[]>(
    Array.from({ length: SLOT_COUNT }, (_, i) => {
      const spacing = CAROUSEL_WIDTH / SLOT_COUNT;
      const r = ((i * 7919) % 1000) / 1000; // 0..1, deterministic
      const depth = SLOT_Z_BACK + r * (SLOT_Z_FRONT - SLOT_Z_BACK);
      // Distance from camera (approx, ignores arc curve); used to
      // bias speed so back slots drift slower for stronger parallax.
      // Anchor: a slot at SLOT_Z_FRONT has factor 1.0 and the curve
      // falls off as the slot moves further back.
      const dist = STAGE_TO_CAMERA - depth;
      const minDist = STAGE_TO_CAMERA - SLOT_Z_FRONT; // front-row distance
      const baseSpeed = Math.pow(minDist / dist, 0.55); // ~1.0 front, ~0.55 back
      const jitter = 0.8 + ((i * 6151) % 100) / 100 * 0.4; // 0.8..1.2
      return {
        asset: pool[i % pool.length],
        offset: i * spacing - CAROUSEL_WIDTH / 2,
        depth,
        speedFactor: baseSpeed * jitter,
        seed: Math.random(),
      };
    }),
  );

  // Mark the slot URLs as currently in use (start cursor right after init slots)
  if (poolCursor.current === 0) poolCursor.current = SLOT_COUNT;

  /** Pick the next image from the pool that is NOT in any visible slot. */
  const pickNextAsset = (excludeUrl?: string): AssetEntry => {
    const inUse = new Set<string>();
    for (const s of slots.current) inUse.add(s.asset.url);
    if (excludeUrl) inUse.add(excludeUrl);
    // Walk the pool starting at the cursor; return first not-in-use item
    for (let i = 0; i < pool.length; i++) {
      const idx = (poolCursor.current + i) % pool.length;
      const candidate = pool[idx];
      if (!inUse.has(candidate.url)) {
        poolCursor.current = (idx + 1) % pool.length;
        return candidate;
      }
    }
    // Fallback (shouldn't happen if pool > slot count)
    return pool[poolCursor.current++ % pool.length];
  };

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const v = visibility();
    groupRef.current.visible = v > 0.02;
    if (v < 0.02) return;

    // Advance carousel — each slot uses its own speedFactor for
    // parallax (far slots drift slower than near). Spacing drifts
    // over time but the wrap logic keeps each slot looping.
    const spacing = CAROUSEL_WIDTH / SLOT_COUNT;
    for (let i = 0; i < slots.current.length; i++) {
      const s = slots.current[i];
      s.offset -= CAROUSEL_SPEED * s.speedFactor * dt;
      // Wrap: when fully off-screen left, recycle to the right with a NEW image
      if (s.offset < -CAROUSEL_WIDTH / 2 - 2) {
        s.offset += CAROUSEL_WIDTH + spacing;
        s.asset = pickNextAsset(s.asset.url);
        s.seed = Math.random();

        // Spawn-gap safeguard: cascade the offset right until it is
        // at least MIN_SPAWN_GAP away from every other slot. Without
        // this, parallax-speed drift bunches slots together over time
        // and the pointer-tilt makes their geometry clip.
        for (let pass = 0; pass < SLOT_COUNT; pass++) {
          let clean = true;
          for (let j = 0; j < slots.current.length; j++) {
            if (j === i) continue;
            if (Math.abs(s.offset - slots.current[j].offset) < MIN_SPAWN_GAP) {
              s.offset = slots.current[j].offset + MIN_SPAWN_GAP;
              clean = false;
            }
          }
          if (clean) break;
        }
      }
    }

    // Drift the two mist layers in opposite directions on X (and a
    // tiny Y wobble) so the clouds look organic.
    if (mistTexA) {
      mistTexA.offset.x = (mistTexA.offset.x + dt * 0.012) % 1;
      mistTexA.offset.y = (mistTexA.offset.y - dt * 0.005 + 1) % 1;
    }
    if (mistTexB) {
      mistTexB.offset.x = (mistTexB.offset.x - dt * 0.008 + 1) % 1;
      mistTexB.offset.y = (mistTexB.offset.y + dt * 0.004) % 1;
    }

    // Camera pan via pointer
    camTarget.current.x = state.pointer.x * 1.2;
    camTarget.current.y = state.pointer.y * 0.6;
    camCurrent.current.x += (camTarget.current.x - camCurrent.current.x) * 0.03;
    camCurrent.current.y += (camTarget.current.y - camCurrent.current.y) * 0.03;
    if (stageRef.current) {
      stageRef.current.position.x = -camCurrent.current.x * 0.5;
      stageRef.current.rotation.y = camCurrent.current.x * 0.08;
      stageRef.current.rotation.x = -camCurrent.current.y * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, yPos, 0]}>
      <group ref={stageRef} position={[0, -0.5, -2]}>
        {/* Reflective floor — circular pedestal, radial alpha fade.
            The disc reads as a deliberate stage instead of an
            arbitrary square slice, and the alphaMap dissolves the
            edge so there's no hard "this is where the floor ends"
            line. Reflection naturally fades with the alpha. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[32, 96]} />
          <MeshReflectorMaterial
            blur={profile.isLowPower ? [0, 0] : [300, 100]}
            resolution={profile.isLowPower ? 128 : 256}
            mixBlur={1}
            mixStrength={profile.isLowPower ? 40 : 80}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050505"
            metalness={0.5}
            transparent
            alphaMap={floorAlphaMap ?? undefined}
          />
        </mesh>

        {/* Underside fade. Same circle + same alpha so the back-face
            visible from below shares the soft rim. BackSide-only so
            it doesn't z-fight with the reflective top. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[32, 96]} />
          <meshBasicMaterial
            color="#050505"
            side={THREE.BackSide}
            transparent
            opacity={0.55}
            alphaMap={floorAlphaMap ?? undefined}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>

        {/* Ground mist (item H) — two soft-noise sheets just above
            the floor, scrolling in opposite directions so the
            carousel looks like it's emerging from low fog. Both
            depthWrite=false so they don't break frame depth. Skipped
            entirely on low-power tier. */}
        {mistTexA ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} renderOrder={1}>
            <circleGeometry args={[30, 64]} />
            <meshBasicMaterial
              color="#1a0606"
              transparent
              opacity={0.32}
              alphaMap={mistTexA}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        ) : null}
        {mistTexB ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]} renderOrder={2}>
            <circleGeometry args={[28, 64]} />
            <meshBasicMaterial
              color="#0a0a0a"
              transparent
              opacity={0.22}
              alphaMap={mistTexB}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        ) : null}

        {/* Floor text */}
        <Text position={[0, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.6} color="#d30000" anchorX="center" anchorY="middle"
          letterSpacing={0.3} fillOpacity={0.15}>
          STUDIO PANIC ATTACK
        </Text>
        <Text position={[0, 0.01, 3]} rotation={[-Math.PI / 2, 0, 0]}
          font="https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@5.0.0/files/cormorant-garamond-latin-500-italic.woff"
          fontSize={0.5} color="#f6f3ee" anchorX="center" anchorY="middle"
          letterSpacing={0.04} fillOpacity={0.55}>
          Have a peek inside my brain
        </Text>
        <Text position={[-6, 0.01, 1]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          fontSize={0.12} color="#f6f3ee" anchorX="center" anchorY="middle"
          letterSpacing={0.6} fillOpacity={0.18}>
          EMA STOYANOVA
        </Text>

        {/* Slots — each renders the asset currently assigned to it.
            Per-slot Suspense keeps texture loads local: if a slot's texture
            isn't cached yet, only that slot is null while it resolves —
            never the whole scene. */}
        {slots.current.map((_s, i) => (
          <Suspense key={i} fallback={null}>
            <CarouselSlot slotIndex={i} slots={slots} />
          </Suspense>
        ))}
      </group>
    </group>
  );
}

interface CarouselSlotProps {
  slotIndex: number;
  slots: React.MutableRefObject<SlotState[]>;
}

function CarouselSlot({ slotIndex, slots }: CarouselSlotProps) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const colorTarget = useMemo(() => new THREE.Color('#f6f3ee'), []);

  // Track current url so we can rebuild the Image when it changes
  const slot = slots.current[slotIndex];
  const [currentUrl, setCurrentUrl] = useState(slot.asset.url);

  // Variable frame size based on aspect of the CURRENTLY assigned asset
  const aspect = slot.asset.aspect;
  // Per-slot stable size multiplier — wider range for true variation
  // between intimate small slots and statement large slots.
  const sizeMultiplier = useMemo(() => 0.55 + Math.random() * 1.1, []); // 0.55 .. 1.65

  // Depth-driven size compensation. Slots further from the camera
  // need to be physically larger or they shrink to specks. Curve
  // is a soft power of distance/4 so back slots are roughly 4× the
  // physical size of front slots — they read at a similar apparent
  // size on screen but with subtle "further away" diminishing.
  // sizeMultiplier still varies them per-slot on top.
  const depth = slot.depth;
  const distance = STAGE_TO_CAMERA - depth; // approx; ignores arc curve
  const depthSizeFactor = Math.pow(distance / 4, 0.72);

  // Base sizes; aspect drives orientation
  const baseW = aspect >= 1 ? 1.54 : 1.05;
  const w = baseW * sizeMultiplier * depthSizeFactor;
  const h = w / aspect;
  // Generous caps so the back-rank slots can actually be huge without
  // the carousel turning into a wall of identical rectangles.
  const clampedH = Math.min(h, 9);
  const clampedW = Math.min(w, 8);

  useFrame((state, dt) => {
    const s = slots.current[slotIndex];
    if (!groupRef.current || !imageRef.current || !frameRef.current) return;

    // If this slot's asset changed (due to wrap), force a re-render to swap the texture
    if (s.asset.url !== currentUrl) {
      setCurrentUrl(s.asset.url);
    }

    // I — curved arc. The carousel is no longer a straight belt:
    // each slot's offset is treated as arc-length along a circle of
    // radius ARC_R, so slots curve gently away in Z toward the
    // edges. Slot rotation faces toward the centre of the arc.
    const angle = s.offset / ARC_R;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    groupRef.current.position.x = sinA * ARC_R;
    groupRef.current.position.z = (cosA - 1) * ARC_R + s.depth;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.35 + s.seed * 6.28) * 0.025;

    // K — pointer tilt. Each slot rotates a few degrees around Y
    // following the cursor X, on top of the arc-facing rotation.
    // Reads as the carousel "watching" the user without breaking
    // the arc's geometry.
    groupRef.current.rotation.y = -angle + state.pointer.x * 0.10;

    // E — depth dimming. Slots farther from the camera (more
    // negative position.z relative to the stage) get tinted darker.
    // With SLOT_Z_FRONT = -2 and arc-curve up to ~-8 at the edges,
    // z ranges roughly +0/-2 (centre, front) down to ~-28 (far edge,
    // back). Map [-28, -2] onto [0.45, 1.0].
    const z = groupRef.current.position.z;
    const depthFactor = THREE.MathUtils.lerp(
      0.45,
      1.0,
      THREE.MathUtils.clamp((z + 28) / 26, 0, 1),
    );

    // Image colour tint via the material's `color` uniform.
    const imat = imageRef.current.material as THREE.Material & { color?: THREE.Color };
    if (imat.color) imat.color.setRGB(depthFactor, depthFactor, depthFactor);

    // Subtle breathing zoom centered on 1.0 — keeps the full image visible
    const mat = imageRef.current.material as THREE.Material & { zoom?: number };
    if (mat) mat.zoom = 0.97 + Math.sin(s.seed * 10000 + state.clock.elapsedTime / 3) * 0.03;

    // Existing frame colour, modulated by depthFactor so the frames
    // also dim with distance — keeps the frame visually attached
    // to the image rather than glowing at full strength on a
    // dimmed background.
    colorTarget.set(hover ? '#d30000' : '#f6f3ee').multiplyScalar(depthFactor);
    const fmat = frameRef.current.material as THREE.MeshBasicMaterial;
    fmat.color.lerp(colorTarget, Math.min(1, 8 * dt));

    // F — rim glow on hover. A red additive plane sitting just
    // behind the image, slightly larger, opacity ramps in over
    // ~250 ms when hovered. Reads as the slot lighting up from
    // behind without disturbing the rest of the frame.
    if (rimRef.current) {
      const rmat = rimRef.current.material as THREE.MeshBasicMaterial;
      const target = hover ? 0.6 : 0;
      rmat.opacity += (target - rmat.opacity) * Math.min(1, 6 * dt);
      // Hide the mesh entirely once it's effectively zero so it's
      // not eating draw calls when no slot is hovered.
      rimRef.current.visible = rmat.opacity > 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => { e.stopPropagation(); openLightbox(currentUrl); }}
        scale={[clampedW, clampedH, 0.05]}
        position={[0, clampedH / 2, 0]}
      >
        <boxGeometry />
        <meshStandardMaterial color="#151515" metalness={0.5} roughness={0.5} envMapIntensity={2} />
        <mesh ref={frameRef} raycast={() => null} scale={[0.9, 0.93, 0.9]} position={[0, 0, 0.2]}>
          <boxGeometry />
          <meshBasicMaterial toneMapped={false} fog={false} />
        </mesh>
        {/* Rim glow plane — sits just behind the image, slightly
            larger, additively blended. Hidden until hover. */}
        <mesh ref={rimRef} raycast={() => null} scale={[1.08, 1.08, 1]} position={[0, 0, 0.65]} visible={false}>
          <planeGeometry />
          <meshBasicMaterial
            color="#d30000"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
        <Image
          key={currentUrl}
          ref={imageRef}
          raycast={() => null}
          position={[0, 0, 0.7]}
          url={currentUrl}
        />
      </mesh>
    </group>
  );
}

export default Gallery;

/**
 * Build a soft 256×256 noise canvas suitable for use as an alphaMap
 * on a horizontal mist plane. Per-pixel random luminance, then a CSS
 * `filter: blur(8px)` pass smooths it into organic clouds. The
 * texture is set to repeat-wrap so its UV `offset` can be advanced
 * each frame for a slow drift.
 *
 * `seed` is mixed into the random sequence so two cloned textures
 * produce visibly different noise patterns — used to layer two
 * mist sheets at different heights without them looking identical.
 */
function makeMistTexture(seed: number): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  // Cheap deterministic PRNG so the seed actually produces
  // reproducible output without pulling in a real RNG.
  let s = seed >>> 0 || 1;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const data = ctx.createImageData(256, 256);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = (rng() * 255) | 0;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  // Two-pass blur for smoother clouds.
  ctx.filter = 'blur(10px)';
  ctx.drawImage(c, 0, 0);
  ctx.drawImage(c, 0, 0);
  ctx.filter = 'none';

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
