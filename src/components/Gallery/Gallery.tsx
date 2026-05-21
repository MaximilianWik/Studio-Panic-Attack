import { useFrame } from '@react-three/fiber';
import { Image, MeshReflectorMaterial, Text, useCursor } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { assets } from '../../helpers/useImageAssets';
import { openLightbox } from '../../helpers/lightbox';

const GOLDEN = 1.61803398875;
const CAROUSEL_SPEED = 0.15; // slower — was 0.35
const CAROUSEL_WIDTH = 24; // wider spacing

/**
 * Gallery — infinite horizontal carousel.
 * Slower pace, more spacing, varied Z-depth, floor text, camera pan on pointer.
 */
export function Gallery() {
  const yPos = getSectionWorldY('gallery');
  const visibility = useSectionVisibility('gallery');
  const groupRef = useRef<THREE.Group>(null);
  const stageRef = useRef<THREE.Group>(null);
  const camTarget = useRef({ x: 0, y: 0 });
  const camCurrent = useRef({ x: 0, y: 0 });

  const galleryAssets = useMemo(() => {
    return assets.filter((a) => a.affinity === 'gallery' && a.kind === 'image');
  }, []);

  const frameCount = galleryAssets.length;
  const spacing = CAROUSEL_WIDTH / frameCount;

  const offsets = useRef<number[]>(
    Array.from({ length: frameCount }, (_, i) => i * spacing - CAROUSEL_WIDTH / 2),
  );

  // Per-frame Z depth (seeded, more variation)
  const depths = useMemo(() => {
    return galleryAssets.map((_, i) => {
      const seed = ((i * 7919) % 100) / 100;
      return -1 + seed * 5; // Z ranges from -1 to +4 (close to far)
    });
  }, [galleryAssets]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const v = visibility();
    groupRef.current.visible = v > 0.02;
    if (v < 0.02) return;

    // Advance carousel (slower)
    for (let i = 0; i < offsets.current.length; i++) {
      offsets.current[i] -= CAROUSEL_SPEED * dt;
      if (offsets.current[i] < -CAROUSEL_WIDTH / 2 - 2) {
        offsets.current[i] += CAROUSEL_WIDTH + spacing;
      }
    }

    // Camera pan — pointer moves the whole stage camera-like
    camTarget.current.x = state.pointer.x * 1.2;
    camTarget.current.y = state.pointer.y * 0.6;
    camCurrent.current.x += (camTarget.current.x - camCurrent.current.x) * 0.03;
    camCurrent.current.y += (camTarget.current.y - camCurrent.current.y) * 0.03;

    if (stageRef.current) {
      // Pan = translate + slight rotation for parallax
      stageRef.current.position.x = -camCurrent.current.x * 0.5;
      stageRef.current.rotation.y = camCurrent.current.x * 0.08;
      stageRef.current.rotation.x = -camCurrent.current.y * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, yPos, 0]}>
      <group ref={stageRef} position={[0, -0.5, -2]}>
        {/* Reflective floor — strong reflections */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={512}
            mixBlur={1}
            mixStrength={80}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050505"
            metalness={0.5}
          />
        </mesh>

        {/* Floor text */}
        <Text
          position={[0, 0.01, -2]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.6}
          color="#d30000"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.3}
          fillOpacity={0.15}
        >
          STUDIO PANIC ATTACK
        </Text>
        <Text
          position={[0, 0.01, -4]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.4}
          color="#f6f3ee"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          fillOpacity={0.7}
          fontStyle="italic"
        >
          Have a peek inside my brain
        </Text>
        <Text
          position={[0, 0.01, 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.18}
          color="#f6f3ee"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.5}
          fillOpacity={0.3}
        >
          PROJECTS · GALLERY · 2024 — 2026
        </Text>
        <Text
          position={[-6, 0.01, 1]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          fontSize={0.12}
          color="#f6f3ee"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.6}
          fillOpacity={0.18}
        >
          EMA STOYANOVA
        </Text>

        {/* Carousel frames */}
        {galleryAssets.map((asset, i) => (
          <CarouselFrame
            key={asset.url}
            url={asset.url}
            aspect={asset.aspect}
            index={i}
            offsets={offsets}
            depth={depths[i]}
          />
        ))}
      </group>
    </group>
  );
}

interface CarouselFrameProps {
  url: string;
  aspect: number;
  index: number;
  offsets: React.MutableRefObject<number[]>;
  depth: number;
}

function CarouselFrame({ url, aspect, index, offsets, depth }: CarouselFrameProps) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random(), []);
  const colorTarget = useMemo(() => new THREE.Color('#f6f3ee'), []);

  // Variable frame size based on aspect
  const w = aspect >= 1 ? 1.2 : 0.8;
  const h = aspect >= 1 ? 1.2 / aspect : 0.8 / aspect;
  const clampedH = Math.min(h, GOLDEN * 1.3);
  const clampedW = Math.min(w, 1.5);

  useFrame((state, dt) => {
    if (!groupRef.current || !imageRef.current || !frameRef.current) return;

    const x = offsets.current[index];
    groupRef.current.position.x = x;
    groupRef.current.position.z = depth;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.35 + seed * 6.28) * 0.025;

    const mat = imageRef.current.material as THREE.Material & { zoom?: number };
    if (mat) mat.zoom = 1.8 + Math.sin(seed * 10000 + state.clock.elapsedTime / 3) / 3;

    colorTarget.set(hover ? '#d30000' : '#f6f3ee');
    const fmat = frameRef.current.material as THREE.MeshBasicMaterial;
    fmat.color.lerp(colorTarget, Math.min(1, 8 * dt));
  });

  return (
    <group ref={groupRef}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => { e.stopPropagation(); openLightbox(url); }}
        scale={[clampedW, clampedH, 0.05]}
        position={[0, clampedH / 2, 0]}
      >
        <boxGeometry />
        <meshStandardMaterial color="#151515" metalness={0.5} roughness={0.5} envMapIntensity={2} />
        <mesh ref={frameRef} raycast={() => null} scale={[0.9, 0.93, 0.9]} position={[0, 0, 0.2]}>
          <boxGeometry />
          <meshBasicMaterial toneMapped={false} fog={false} />
        </mesh>
        <Image ref={imageRef} raycast={() => null} position={[0, 0, 0.7]} url={url} />
      </mesh>
    </group>
  );
}

export default Gallery;
