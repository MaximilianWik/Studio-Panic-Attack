import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  url: string;
  aspect: number;
  position: [number, number, number];
  rotationY: number;
  size: number;
  jitterSeed: number;
  wobbleSpeed: number;
  dim?: number;
}

/**
 * One gallery card. A textured plane that:
 *   - aspect-fits the texture without distortion;
 *   - wobbles gently in Y (per-card seed) so the ring breathes;
 *   - pops in scale when its world Z is closest to the camera (cards
 *     "in front" feel closer).
 */
export function GalleryCard({
  url,
  aspect,
  position,
  rotationY,
  size,
  jitterSeed,
  wobbleSpeed,
  dim = 1,
}: Props) {
  const tex = useTexture(url) as THREE.Texture;
  const meshRef = useRef<THREE.Mesh>(null);

  const planeSize = useMemo<[number, number]>(() => {
    if (aspect >= 1) return [size * 1.1, (size * 1.1) / aspect];
    return [size * aspect, size];
  }, [size, aspect]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTex: { value: tex },
        uOpacity: { value: dim },
        uPop: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uTex;
        uniform float uOpacity;
        uniform float uPop;
        void main() {
          vec3 col = texture2D(uTex, vUv).rgb;
          float v = smoothstep(1.0, 0.5, length(vUv - 0.5) * 1.4);
          col *= 0.6 + 0.4 * v;
          col = (col - 0.5) * (1.0 + uPop * 0.18) + 0.5;
          col = mix(col, col * vec3(1.04, 0.94, 0.94), uPop * 0.6);
          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });
  }, [tex, dim]);

  useEffect(() => {
    if (!tex) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }, [tex]);

  // dispose material on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const wob = Math.sin(t * wobbleSpeed + jitterSeed * 0.21) * 0.06;
    meshRef.current.position.y = position[1] + wob;

    meshRef.current.getWorldPosition(_v);
    const focal = THREE.MathUtils.smoothstep(-2.5, 0.6, -_v.z);
    const pop = Math.pow(Math.max(0, 1 - Math.abs(focal - 0.5) * 2), 1.6);
    (material.uniforms.uPop.value as number) = pop;

    const popScale = 1 + pop * 0.18;
    meshRef.current.scale.setScalar(popScale);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, rotationY, 0]}
      material={material}
    >
      <planeGeometry args={[planeSize[0], planeSize[1], 1, 1]} />
    </mesh>
  );
}

const _v = /* @__PURE__ */ new THREE.Vector3();

export default GalleryCard;
