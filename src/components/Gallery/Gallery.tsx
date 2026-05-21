import { useFrame } from '@react-three/fiber';
import { Image, MeshReflectorMaterial, Text, useCursor } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { pickByAffinity } from '../../helpers/useImageAssets';
import { openLightbox } from '../../helpers/lightbox';

const GOLDEN = 1.61803398875;

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

  const frames = useMemo(() => [
    { url: images[0].url, position: [0, 0, 1.4] as const, rotation: [0, 0, 0] as const },
    { url: images[1].url, position: [-0.85, 0, -0.55] as const, rotation: [0, 0, 0] as const },
    { url: images[2].url, position: [0.85, 0, -0.55] as const, rotation: [0, 0, 0] as const },
    { url: images[3].url, position: [-1.85, 0, 0.25] as const, rotation: [0, Math.PI / 2.6, 0] as const },
    { url: images[4].url, position: [-2.30, 0, 1.45] as const, rotation: [0, Math.PI / 2.6, 0] as const },
    { url: images[5].url, position: [-2.10, 0, 2.65] as const, rotation: [0, Math.PI / 2.6, 0] as const },
    { url: images[6].url, position: [1.85, 0, 0.25] as const, rotation: [0, -Math.PI / 2.6, 0] as const },
    { url: images[7].url, position: [2.30, 0, 1.45] as const, rotation: [0, -Math.PI / 2.6, 0] as const },
    { url: images[8].url, position: [2.10, 0, 2.65] as const, rotation: [0, -Math.PI / 2.6, 0] as const },
  ], [images]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const v = visibility();
    groupRef.current.visible = v > 0.02;
    if (v < 0.02) return;

    target.current.x = state.pointer.x * 0.16;
    target.current.y = state.pointer.y * 0.10;
    current.current.x += (target.current.x - current.current.x) * 0.06;
    current.current.y += (target.current.y - current.current.y) * 0.06;

    if (stageRef.current) {
      const dropY = (1 - v) * -1.6;
      stageRef.current.position.y = -0.5 + dropY;
      stageRef.current.position.z = -1.5;
      stageRef.current.rotation.y = current.current.x;
      stageRef.current.rotation.x = -current.current.y;
    }
  });

  return (
    <group ref={groupRef} position={[0, yPos, 0]}>
      <group ref={stageRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <MeshReflectorMaterial
            blur={[120, 50]}
            resolution={256}
            mixBlur={1.0}
            mixStrength={20}
            roughness={1}
            depthScale={1.0}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050505"
            metalness={0.4}
          />
        </mesh>
        {frames.map((f, i) => (
          <Frame key={i} url={f.url} position={f.position as [number, number, number]} rotation={f.rotation as [number, number, number]} />
        ))}
        <Text
          position={[0, 0.01, 3.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.14}
          color="#d30000"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.4}
        >
          PROJECTS · 2024 — 2026
        </Text>
      </group>
    </group>
  );
}

interface FrameProps {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

function Frame({ url, position, rotation }: FrameProps) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const frameRef = useRef<THREE.Mesh>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random(), []);
  const colorTarget = useMemo(() => new THREE.Color('#f6f3ee'), []);

  useFrame((state, dt) => {
    if (!imageRef.current || !frameRef.current) return;
    const mat = imageRef.current.material as THREE.Material & { zoom?: number };
    if (mat) mat.zoom = 2 + Math.sin(seed * 10000 + state.clock.elapsedTime / 3) / 2;
    colorTarget.set(hover ? '#d30000' : '#f6f3ee');
    const fmat = frameRef.current.material as THREE.MeshBasicMaterial;
    fmat.color.lerp(colorTarget, Math.min(1, 8 * dt));
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => { e.stopPropagation(); openLightbox(url); }}
        scale={[1, GOLDEN, 0.05]}
        position={[0, GOLDEN / 2, 0]}
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
