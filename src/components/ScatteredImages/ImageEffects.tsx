import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { shaders, type ShaderId } from '../../shaders/imageShaders';

interface Props {
  url: string;
  height: number;
  effect: ShaderId | 'plain';
  intensity?: number;
  onClick?: () => void;
}

export function ImageEffect({ url, height, effect, intensity = 1, onClick }: Props) {
  const tex = useTexture(url) as THREE.Texture;
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    if (!tex) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  }, [tex]);

  const aspect = useMemo(() => {
    if (!tex?.image) return 1;
    const w = tex.image.naturalWidth ?? tex.image.width ?? 1;
    const h = tex.image.naturalHeight ?? tex.image.height ?? 1;
    return w / Math.max(1, h);
  }, [tex]);

  const planeArgs = useMemo<[number, number]>(() => [height * aspect, height], [height, aspect]);

  const material = useMemo(() => {
    if (effect === 'plain') {
      return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
    }
    const mod = shaders[effect];
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTex: { value: tex },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(512, 512) },
        uIntensity: { value: intensity },
      },
      vertexShader: mod.vertex,
      fragmentShader: mod.fragment,
    });
  }, [tex, effect, intensity]);

  useEffect(() => () => { material.dispose(); }, [material]);

  useFrame((_, dt) => {
    if (meshRef.current) {
      const s = hovered ? 1.05 : 1.0;
      meshRef.current.scale.x += (s - meshRef.current.scale.x) * Math.min(1, 8 * dt);
      meshRef.current.scale.y += (s - meshRef.current.scale.y) * Math.min(1, 8 * dt);
    }
    if (effect === 'plain') return;
    const m = material as THREE.ShaderMaterial;
    if (!m.uniforms?.uTime) return;
    (m.uniforms.uTime.value as number) += dt;
    if (m.uniforms.uResolution && tex.image) {
      const w = tex.image.naturalWidth ?? tex.image.width ?? 512;
      const h = tex.image.naturalHeight ?? tex.image.height ?? 512;
      (m.uniforms.uResolution.value as THREE.Vector2).set(w, h);
    }
    const target = hovered ? 0 : intensity;
    intensityRef.current += (target - intensityRef.current) * Math.min(1, 8 * dt);
    m.uniforms.uIntensity.value = intensityRef.current;
  });

  return (
    <mesh
      ref={meshRef}
      material={material}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(); } }}
    >
      <planeGeometry args={[planeArgs[0], planeArgs[1], 1, 1]} />
    </mesh>
  );
}

export default ImageEffect;
