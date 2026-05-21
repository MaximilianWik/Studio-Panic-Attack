import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  VERT,
  HALFTONE_FRAG,
  DITHER_FRAG,
  PAPER_FRAG,
  FLUTE_FRAG,
  LIQUID_METAL_FRAG,
  type ShaderKind,
} from '../../shaders/imageShaders';

interface Props {
  url: string;
  kind: ShaderKind;
  /** Max size of longer side; aspect-fits to image. */
  maxSize?: number;
  /** Initial opacity multiplier (parents drive entrance via this). */
  opacityRef?: React.MutableRefObject<number>;
}

/**
 * One textured plane drawn through one of the custom image shaders.
 * The kind selects which fragment shader is compiled.
 *
 * Aspect-fits the source image to `maxSize` along its longer side.
 *
 * `opacityRef`, if provided, lets the parent imperatively drive the
 * material's `uOpacity` per frame without re-rendering.
 */
export function ImageEffect({ url, kind, maxSize = 1.4, opacityRef }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // Bilinear; nearest would clash with the dither pixelation step.
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const img = tex.image;
  const aspect = img ? img.width / img.height : 1;
  const w = aspect >= 1 ? maxSize : maxSize * aspect;
  const h = aspect >= 1 ? maxSize / aspect : maxSize;

  const uniforms = useMemo(() => {
    const base = {
      uMap: { value: tex },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uResolution: { value: new THREE.Vector2(512 * (w / maxSize), 512 * (h / maxSize)) },
    };
    switch (kind) {
      case 'halftone':
        return {
          ...base,
          uDotSize: { value: 6.0 },
          uInk: { value: new THREE.Color('#0a0a0a') },
          uPaper: { value: new THREE.Color('#e8e2d4') },
        };
      case 'dither':
        return {
          ...base,
          uPixel: { value: 4.0 },
          uInk: { value: new THREE.Color('#1a1a1a') },
          uPaper: { value: new THREE.Color('#f0ece6') },
        };
      case 'flute':
        return {
          ...base,
          uRibCount: { value: 14 },
          uShear: { value: 0.014 },
        };
      case 'liquid':
        return {
          ...base,
          uTintA: { value: new THREE.Color('#c97e3a') },
          uTintB: { value: new THREE.Color('#e8d8c0') },
        };
      case 'paper':
      case 'plain':
      default:
        return base;
    }
    // tex/maxSize/kind — uniforms must rebuild only if those change
  }, [tex, kind, w, h, maxSize]);

  const fragmentShader = useMemo(() => {
    switch (kind) {
      case 'halftone':
        return HALFTONE_FRAG;
      case 'dither':
        return DITHER_FRAG;
      case 'paper':
        return PAPER_FRAG;
      case 'flute':
        return FLUTE_FRAG;
      case 'liquid':
        return LIQUID_METAL_FRAG;
      case 'plain':
      default:
        return PLAIN_FRAG;
    }
  }, [kind]);

  useFrame((_, dt) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms as Record<string, { value: unknown }>;
    if ('uTime' in u) {
      (u.uTime as { value: number }).value += dt;
    }
    if (opacityRef && 'uOpacity' in u) {
      (u.uOpacity as { value: number }).value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Plain pass-through fragment shader — used for the "plain" kind so we
 * uniformly drive opacity through `uOpacity` no matter the variant.
 */
const PLAIN_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uOpacity;
void main() {
  vec4 src = texture2D(uMap, vUv);
  if (src.a < 0.01) discard;
  gl_FragColor = vec4(src.rgb, src.a * uOpacity);
}
`;
