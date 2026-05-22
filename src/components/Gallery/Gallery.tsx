import { useFrame } from '@react-three/fiber';
import { Image, MeshReflectorMaterial, Text, useCursor, useTexture } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { assets, type AssetEntry } from '../../helpers/useImageAssets';
import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { openLightbox } from '../../helpers/lightbox';

const GOLDEN = 1.61803398875;
const CAROUSEL_SPEED = 0.15;
const CAROUSEL_WIDTH = 36;
/** Number of visible slots — fewer than total images so the pool can rotate. */
const SLOT_COUNT = 28;

interface SlotState {
  /** current image asset for this slot */
  asset: AssetEntry;
  /** current X offset along the carousel belt */
  offset: number;
  /** stable Z depth for this slot */
  depth: number;
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

  // Initialize slots — pick the first SLOT_COUNT distinct images from the pool
  const slots = useRef<SlotState[]>(
    Array.from({ length: SLOT_COUNT }, (_, i) => {
      const spacing = CAROUSEL_WIDTH / SLOT_COUNT;
      return {
        asset: pool[i % pool.length],
        offset: i * spacing - CAROUSEL_WIDTH / 2,
        depth: -1 + ((i * 7919) % 100) / 20, // -1 to +4
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

    // Advance carousel
    const spacing = CAROUSEL_WIDTH / SLOT_COUNT;
    for (let i = 0; i < slots.current.length; i++) {
      const s = slots.current[i];
      s.offset -= CAROUSEL_SPEED * dt;
      // Wrap: when fully off-screen left, recycle to the right with a NEW image
      if (s.offset < -CAROUSEL_WIDTH / 2 - 2) {
        s.offset += CAROUSEL_WIDTH + spacing;
        s.asset = pickNextAsset(s.asset.url);
        s.seed = Math.random();
      }
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
        {/* Reflective floor (FrontSide only — visible from above). */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[60, 60]} />
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
          />
        </mesh>

        {/* Underside fade. Renders only the back face (BackSide), so
            it's invisible while the camera is above the floor and
            takes over the moment scroll lifts the camera below it
            (post-gallery scroll). Without this the floor visibly
            "despawns" because the reflective material is FrontSide
            and the back face is culled. Semi-transparent dark fill
            so the brand backdrop still bleeds through — reads as a
            ghost of the floor instead of a solid wall. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial
            color="#050505"
            side={THREE.BackSide}
            transparent
            opacity={0.55}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>

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
  const colorTarget = useMemo(() => new THREE.Color('#f6f3ee'), []);

  // Track current url so we can rebuild the Image when it changes
  const slot = slots.current[slotIndex];
  const [currentUrl, setCurrentUrl] = useState(slot.asset.url);

  // Variable frame size based on aspect of the CURRENTLY assigned asset
  const aspect = slot.asset.aspect;
  // Per-slot stable size multiplier (random per slot, varies between slots)
  const sizeMultiplier = useMemo(() => 0.63 + Math.random() * 0.63, []); // 0.63 .. 1.26

  // Base sizes; aspect drives orientation
  const baseW = aspect >= 1 ? 1.54 : 1.05;
  const w = baseW * sizeMultiplier;
  const h = w / aspect;
  // Cap so portraits don't exceed reasonable height
  const clampedH = Math.min(h, GOLDEN * 1.82);
  const clampedW = Math.min(w, 2.52);

  useFrame((state, dt) => {
    const s = slots.current[slotIndex];
    if (!groupRef.current || !imageRef.current || !frameRef.current) return;

    // If this slot's asset changed (due to wrap), force a re-render to swap the texture
    if (s.asset.url !== currentUrl) {
      setCurrentUrl(s.asset.url);
    }

    groupRef.current.position.x = s.offset;
    groupRef.current.position.z = s.depth;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.35 + s.seed * 6.28) * 0.025;

    // Subtle breathing zoom centered on 1.0 — keeps the full image visible
    const mat = imageRef.current.material as THREE.Material & { zoom?: number };
    if (mat) mat.zoom = 0.97 + Math.sin(s.seed * 10000 + state.clock.elapsedTime / 3) * 0.03;

    colorTarget.set(hover ? '#d30000' : '#f6f3ee');
    const fmat = frameRef.current.material as THREE.MeshBasicMaterial;
    fmat.color.lerp(colorTarget, Math.min(1, 8 * dt));
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
