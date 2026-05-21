import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import {
  useSectionProgress,
  useSectionVisibility,
} from '../../helpers/useScrollSection';
import { CategorySection } from './CategorySection';

/**
 * 03 — AI Art
 *
 * 4500-particle (1800 on tier ≤ 1) GPU morph between two attractor
 * distributions:
 *   - distribution A: sphere shell
 *   - distribution B: torus
 *
 * Vertex shader handles the blend, per-particle turbulence, and a
 * pointer-driven scatter on the field plane (simulated via a ripple
 * uniform). Both attractor positions are baked once into BufferAttribute
 * arrays at mount.
 */

const HIGH_COUNT = 4500;
const LOW_COUNT = 1800;

const VERT = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aSeed;
  uniform float uTime;
  uniform float uMorph;
  uniform float uScatter;
  uniform vec2 uPointer;
  varying float vSeed;
  varying float vDist;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vSeed = aSeed;
    vec3 a = position;
    vec3 b = aTarget;
    vec3 p = mix(a, b, smoothstep(0.0, 1.0, uMorph));

    // turbulence
    float t = uTime * 0.6 + aSeed * 6.28;
    p += vec3(sin(t * 0.7), cos(t * 1.1), sin(t * 0.5)) * 0.04;

    // pointer scatter
    vec2 d = p.xy - uPointer * 1.6;
    float r = length(d);
    float push = exp(-r * r * 1.2) * uScatter;
    p.xy += normalize(d + 1e-5) * push * 0.7;
    p.z += push * 0.3;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vDist = length(mv.xyz);
    float size = mix(1.6, 4.5, aSeed);
    gl_PointSize = size * (220.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float vSeed;
  varying float vDist;
  uniform float uTime;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= mix(0.4, 1.0, vSeed);
    // colour shift between paper and blood, sparkles in the seam
    vec3 paper = vec3(0.94, 0.92, 0.86);
    vec3 blood = vec3(0.83, 0.0, 0.0);
    vec3 col = mix(paper, blood, smoothstep(0.55, 1.0, vSeed));
    // shimmer
    col += 0.25 * vec3(1.0) * pow(0.5 + 0.5 * sin(uTime * 4.0 + vSeed * 24.0), 6.0);
    gl_FragColor = vec4(col, a * 0.85);
  }
`;

function buildSphere(n: number, r = 1.4): Float32Array {
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // uniform on sphere (Marsaglia)
    let x = 0,
      y = 0,
      z = 0,
      s = 2;
    while (s >= 1) {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      s = x * x + y * y;
    }
    const f = 2 * Math.sqrt(1 - s);
    z = 1 - 2 * s;
    arr[i * 3 + 0] = x * f * r;
    arr[i * 3 + 1] = y * f * r;
    arr[i * 3 + 2] = z * r;
  }
  return arr;
}

function buildTorus(n: number, R = 1.0, tubeR = 0.4): Float32Array {
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const x = (R + tubeR * Math.cos(v)) * Math.cos(u);
    const y = (R + tubeR * Math.cos(v)) * Math.sin(u);
    const z = tubeR * Math.sin(v);
    arr[i * 3 + 0] = x * 1.5;
    arr[i * 3 + 1] = y * 1.5;
    arr[i * 3 + 2] = z * 1.5;
  }
  return arr;
}

export function AIArt() {
  const profile = useDeviceProfile();
  const progress = useSectionProgress('ai');
  const visibility = useSectionVisibility('ai');

  return (
    <CategorySection
      id="ai"
      number="03"
      eyebrow="AI Art"
      title="Prompts that push back."
      body="Experimental AI art pushing the boundaries of creative expression and innovation. Illustrations, photorealistic images, 3D models, and videos created with AI prompts. Crafted using advanced tools like Krea, Adobe Firefly, DALL-E, Midjourney, and more."
      side="left"
      chips={['Krea', 'Firefly', 'DALL·E', 'Midjourney']}
    >
      <ParticleMorph
        count={profile.isLowPower ? LOW_COUNT : HIGH_COUNT}
        progress={progress}
        visibility={visibility}
      />
    </CategorySection>
  );
}

interface ParticleProps {
  count: number;
  progress: () => number;
  visibility: () => number;
}

function ParticleMorph({ count, progress, visibility }: ParticleProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = buildSphere(count, 1.4);
    const tar = buildTorus(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) seed[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aTarget', new THREE.BufferAttribute(tar, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uScatter: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state, dt) => {
    const v = visibility();
    if (!pointsRef.current) return;
    pointsRef.current.visible = v > 0.001;
    if (v < 0.001) return;
    matRef.current = material;
    (material.uniforms.uTime.value as number) += dt;
    // morph: 0..1 sweep through section
    const p = progress();
    // triangular wave for back-and-forth between distributions
    const m = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
    material.uniforms.uMorph.value = m;
    // scatter follows pointer presence
    const sc = Math.min(1, Math.hypot(state.pointer.x, state.pointer.y));
    material.uniforms.uScatter.value = sc * v * 0.6;
    (material.uniforms.uPointer.value as THREE.Vector2).set(
      state.pointer.x,
      state.pointer.y,
    );
    pointsRef.current.rotation.y += dt * 0.08;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
}

export default AIArt;
