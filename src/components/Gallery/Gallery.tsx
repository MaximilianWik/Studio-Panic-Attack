import { useFrame } from '@react-three/fiber';
import { Image, MeshReflectorMaterial, useCursor } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { pickByAffinity } from '../../helpers/useImageAssets';
import { openLightbox } from '../../helpers/lightbox';

const GOLDEN = 1.61803398875;

interface FrameSpec {
  url: string;
  aspect: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

export function Gallery() {
  const yPos = getSectionWorldY('gallery');
  const visibility = useSectionVisibility('gallery');
  const groupRef = useRef<THREE.Group>(null);
  const stageRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const images = useMemo(() => {
    const pool = pickByAffinity('gallery');
    return Array.from({ length: 9 }, (_, i) => pool[(i * 5 + 3) % pool.length]);
  }, []);

  // Variable sizes based on each image's aspect ratio
  const frames: FrameSpec[] = useMemo(() => [
    { url: images[0].url, aspect: images[0].aspect, position: [0, 0, 1.4], rotation: [0, 0, 0] },
    { url: images[1].url, aspect: images[1].aspect, position: [-0.9, 0, -0.6], rotation: [0, 0, 0] },
    { url: images[2].url, aspect: images[2].aspect, position: [0.9, 0, -0.6], rotation: [0, 0, 0] },
    { url: images[3].url, aspect: images[3].aspect, position: [-1.9, 0, 0.25], rotation: [0, Math.PI / 2.6, 0] },
    { url: images[4].url, aspect: images[4].aspect, position: [-2.35, 0, 1.5], rotation: [0, Math.PI / 2.6, 0] },
    { url: images[5].url, aspect: images[5].aspect, position: [-2.15, 0, 2.7], rotation: [0, Math.PI / 2.6, 0] },
    { url: images[6].url, aspect: images[6].aspect, position: [1.9, 0, 0.25], rotation: [0, -Math.PI / 2.6, 0] },
    { url: images[7].url, aspect: images[7].aspect, position: [2.35, 0, 1.5], rotation: [0, -Math.PI / 2.6, 0] },
    { url: images[8].url, aspect: images[8].aspect, position: [2.15, 0, 2.7], rotation: [0, -Math.PI / 2.6, 0] },
  ], [images]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const v = visibility();
    groupRef.current.visible = v > 0.02;
    if (v < 0.02) return;
    target.current.x = state.pointer.x * 0.14;
    target.current.y = state.pointer.y * 0.08;
    current.current.x += (target.current.x - current.current.x) * 0.05;
    current.current.y += (target.current.y - current.current.y) * 0.05;
    if (stageRef.current) {
      stageRef.current.position.z = -1.5;
      stageRef.current.rotation.y = current.current.x;
      stageRef.current.rotation.x = -current.current.y;
    }
  });

  return (
    <group ref={groupRef} position={[0, yPos, 0]}>
      <group ref={stageRef} position={[0, -0.5, 0]}>
        {/* Semi-transparent reflective floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <MeshReflectorMaterial
            blur={[150, 60]}
            resolution={256}
            mixBlur={1.0}
            mixStrength={15}
            roughness={0.9}
            depthScale={0.8}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0a0604"
            metalness={0.3}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Godrays — simulated with an additive cone of light */}
        <mesh position={[0, 3.5, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[4, 7, 32, 1, true]} />
          <meshBasicMaterial
            color="#d30000"
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[-2, 4, 1]} rotation={[0, 0.5, 0]}>
          <coneGeometry args={[2.5, 6, 16, 1, true]} />
          <meshBasicMaterial
            color="#f6f3ee"
            transparent
            opacity={0.025}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {frames.map((f, i) => (
          <VictorianFrame key={i} {...f} />
        ))}
      </group>
    </group>
  );
}

interface VFrameProps extends FrameSpec {}

/**
 * Victorian-style frame: ornate gold-toned thick frame with inner
 * dark border. Size varies based on image aspect ratio.
 */
function VictorianFrame({ url, aspect, position, rotation }: VFrameProps) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random(), []);
  const colorTarget = useMemo(() => new THREE.Color('#8b6914'), []);

  // Frame dimensions based on aspect ratio
  const frameW = aspect >= 1 ? 1.2 : 0.85;
  const frameH = aspect >= 1 ? 1.2 / aspect : 0.85 / aspect;
  // Clamp height
  const h = Math.min(frameH, GOLDEN * 1.1);
  const w = Math.min(frameW, 1.4);
  const frameThickness = 0.08; // thicker = more victorian

  useFrame((state, dt) => {
    if (!imageRef.current || !frameRef.current || !groupRef.current) return;
    // breathing zoom
    const mat = imageRef.current.material as THREE.Material & { zoom?: number };
    if (mat) mat.zoom = 1.8 + Math.sin(seed * 10000 + state.clock.elapsedTime / 3) / 3;
    // frame tint on hover
    colorTarget.set(hover ? '#d30000' : '#8b6914');
    const fmat = frameRef.current.material as THREE.MeshStandardMaterial;
    fmat.color.lerp(colorTarget, Math.min(1, 6 * dt));
    // independent drift
    groupRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 0.25 + seed * 6.28) * 0.03;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.35 + seed * 3.14) * 0.025;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Outer ornate frame (gold) */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => { e.stopPropagation(); openLightbox(url); }}
        scale={[w + frameThickness * 2, h + frameThickness * 2, frameThickness]}
        position={[0, h / 2 + frameThickness, 0]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#8b6914"
          metalness={0.7}
          roughness={0.35}
          envMapIntensity={2.5}
        />
      </mesh>

      {/* Inner dark mat border */}
      <mesh
        raycast={() => null}
        scale={[w + 0.02, h + 0.02, frameThickness + 0.01]}
        position={[0, h / 2 + frameThickness, 0.01]}
      >
        <boxGeometry />
        <meshStandardMaterial color="#1a1008" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Victorian frame detail — inner gold lip */}
      <mesh
        ref={frameRef}
        raycast={() => null}
        scale={[w - 0.02, h - 0.02, 0.03]}
        position={[0, h / 2 + frameThickness, 0.035]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#8b6914"
          metalness={0.8}
          roughness={0.25}
          envMapIntensity={3}
        />
      </mesh>

      {/* Image */}
      <Image
        ref={imageRef}
        raycast={() => null}
        position={[0, h / 2 + frameThickness, 0.045]}
        scale={[w - 0.06, h - 0.06]}
        url={url}
      />
    </group>
  );
}

export default Gallery;
