import { useFrame } from '@react-three/fiber';
import { Image, MeshReflectorMaterial, useCursor } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { assets } from '../../helpers/useImageAssets';
import { openLightbox } from '../../helpers/lightbox';

const GOLDEN = 1.61803398875;
const CAROUSEL_SPEED = 0.35; // world-units per second
const CAROUSEL_WIDTH = 14; // total X range of the carousel belt

/**
 * Gallery — infinite horizontal carousel.
 *
 * Frames slide from right to left in a continuous loop. Each frame's
 * width/height reflects the image's aspect ratio for variety. The
 * reflective floor is set to high mixStrength for bold reflections.
 * Pointer parallax tilts the stage.
 */
export function Gallery() {
  const yPos = getSectionWorldY('gallery');
  const visibility = useSectionVisibility('gallery');
  const groupRef = useRef<THREE.Group>(null);
  const stageRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  // Use ALL gallery images for the carousel
  const galleryAssets = useMemo(() => {
    return assets.filter((a) => a.affinity === 'gallery' && a.kind === 'image');
  }, []);

  // Place frames evenly across the belt
  const frameCount = galleryAssets.length;
  const spacing = CAROUSEL_WIDTH / frameCount;

  // Store X offsets — each frame wraps around
  const offsets = useRef<number[]>(
    Array.from({ length: frameCount }, (_, i) => i * spacing - CAROUSEL_WIDTH / 2),
  );

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const v = visibility();
    groupRef.current.visible = v > 0.02;
    if (v < 0.02) return;

    // Advance the carousel
    for (let i = 0; i < offsets.current.length; i++) {
      offsets.current[i] -= CAROUSEL_SPEED * dt;
      // Wrap around: when a frame exits left, respawn on right
      if (offsets.current[i] < -CAROUSEL_WIDTH / 2 - 1) {
        offsets.current[i] += CAROUSEL_WIDTH + spacing;
      }
    }

    // Pointer parallax
    target.current.x = state.pointer.x * 0.12;
    target.current.y = state.pointer.y * 0.08;
    current.current.x += (target.current.x - current.current.x) * 0.05;
    current.current.y += (target.current.y - current.current.y) * 0.05;

    if (stageRef.current) {
      stageRef.current.rotation.y = current.current.x * 0.3;
      stageRef.current.rotation.x = -current.current.y * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, yPos, 0]}>
      <group ref={stageRef} position={[0, -0.5, -2]}>
        {/* Reflective floor with strong reflections */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[50, 50]} />
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

        {/* Carousel frames */}
        {galleryAssets.map((asset, i) => (
          <CarouselFrame
            key={asset.url}
            url={asset.url}
            aspect={asset.aspect}
            index={i}
            offsets={offsets}
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
}

function CarouselFrame({ url, aspect, index, offsets }: CarouselFrameProps) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random(), []);
  const colorTarget = useMemo(() => new THREE.Color('#f6f3ee'), []);

  // Variable frame size based on aspect
  const w = aspect >= 1 ? 1.1 : 0.75;
  const h = aspect >= 1 ? 1.1 / aspect : 0.75 / aspect;
  const clampedH = Math.min(h, GOLDEN * 1.2);
  const clampedW = Math.min(w, 1.4);

  useFrame((state, dt) => {
    if (!groupRef.current || !imageRef.current || !frameRef.current) return;

    // Position from carousel offset
    const x = offsets.current[index];
    groupRef.current.position.x = x;
    // Slight Y bob per frame
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4 + seed * 6.28) * 0.03;
    // Slight Z stagger for depth
    groupRef.current.position.z = Math.sin(seed * 12.57) * 0.8;

    // Image zoom breathing
    const mat = imageRef.current.material as THREE.Material & { zoom?: number };
    if (mat) mat.zoom = 1.8 + Math.sin(seed * 10000 + state.clock.elapsedTime / 3) / 3;

    // Frame hover color
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
