import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { shaders, type ShaderId } from '../../shaders/imageShaders';

interface Props {
  url: string;
  /** target plane height in world units (width derived from texture aspect) */
  height: number;
  /** which custom shader to apply, or 'plain' for a passthrough */
  effect: ShaderId | 'plain';
  /** 0..1 intensity blend between original and shaded */
  intensity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Image plane that compiles one of the five custom shaders against the
 * texture. Aspect-fits the texture to the requested height. Each
 * shader takes uTex + uIntensity uniforms; some also take uTime and
 * uResolution (set per-frame).
 *
 * On low-power devices, ScatteredImages forces effect to 'plain' so we
 * skip the shader entirely.
 */
export function ImageEffect({
  url,
  height,
  effect,
  intensity = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: Props) {
  const tex = useTexture(url) as THREE.Texture;
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!tex) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  }, [tex]);

  const aspect = useMemo(() => {
    if (!tex || !tex.image) return 1;
    const w = tex.image.naturalWidth ?? tex.image.width ?? 1;
    const h = tex.image.naturalHeight ?? tex.image.height ?? 1;
    return w / Math.max(1, h);
  }, [tex]);

  const planeArgs = useMemo<[number, number]>(() => {
    return [height * aspect, height];
  }, [height, aspect]);

  const material = useMemo(() => {
    if (effect === 'plain') {
      return new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
      });
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

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((_, dt) => {
    if (effect === 'plain') return;
    const m = material as THREE.ShaderMaterial;
    if (m.uniforms.uTime) (m.uniforms.uTime.value as number) += dt;
    if (m.uniforms.uResolution && tex.image) {
      const w = tex.image.naturalWidth ?? tex.image.width ?? 512;
      const h = tex.image.naturalHeight ?? tex.image.height ?? 512;
      (m.uniforms.uResolution.value as THREE.Vector2).set(w, h);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      material={material}
    >
      <planeGeometry args={[planeArgs[0], planeArgs[1], 1, 1]} />
    </mesh>
  );
}

export default ImageEffect;
