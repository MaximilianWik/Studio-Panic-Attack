import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollSection } from '../../helpers/useScrollSection';
import type { Section } from '../../config/sections';

/**
 * Fullscreen-ish dark gradient backdrop for the hero. A custom fragment
 * shader paints three pools of color blended via smooth noise so the
 * background slowly drifts. Sits at a deep z behind everything else.
 *
 * Driven by elapsed time only — scroll affects opacity (the plane fades
 * out as the gallery section takes over).
 */
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uOpacity;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uColorC;

// classic 2D simplex noise (Ashima)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 p = vUv * 1.4 - 0.7;
  float t = uTime * 0.06;

  float n1 = snoise(p * 1.2 + vec2(t, -t * 0.7));
  float n2 = snoise(p * 0.7 + vec2(-t * 0.5, t * 0.9) + 5.0);
  float n3 = snoise(p * 2.4 + vec2(t * 0.3, t * 0.4) + 11.0);

  float w1 = smoothstep(-0.2, 1.0, n1);
  float w2 = smoothstep(-0.2, 1.0, n2);
  float w3 = smoothstep(-0.6, 0.6, n3) * 0.5;

  vec3 col = mix(uColorA, uColorB, w1);
  col = mix(col, uColorC, w2 * 0.4);
  col -= vec3(w3 * 0.03);

  // very soft radial vignette toward edges — pull toward warmer tone
  float r = length(vUv - 0.5);
  col = mix(col * 0.92, col, smoothstep(0.95, 0.15, r));

  gl_FragColor = vec4(col, uOpacity);
}
`;

interface Props {
  section: Section;
}

export function HeroBackground({ section }: Props) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const progress = useScrollSection(section.offset, section.pages);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColorA: { value: new THREE.Color('#f5efe4') },
      uColorB: { value: new THREE.Color('#e2d2b3') },
      uColorC: { value: new THREE.Color('#c9a874') },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (!matRef.current) return;
    uniforms.uTime.value += dt;
    // fade the backdrop out as user leaves the hero
    const p = Math.max(0, Math.min(1, progress.current));
    uniforms.uOpacity.value = 1 - Math.pow(p, 1.5);
  });

  // Place the plane behind everything, scaled to cover the camera frustum.
  // Camera is at z=8, fov=35, so a plane at z=-2 needs ~6.4 height to fill.
  return (
    <mesh position={[0, 0, -8]} renderOrder={-100}>
      <planeGeometry args={[40, 24]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        transparent
      />
    </mesh>
  );
}
