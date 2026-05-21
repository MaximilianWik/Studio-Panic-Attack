import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CategorySection } from './CategorySection';
import { useScrollSection } from '../../helpers/useScrollSection';
import { mulberry32 } from '../../helpers/useImageAssets';
import type { Section } from '../../config/sections';

interface Props {
  section: Section;
  reducedEffects: boolean;
}

const PARTICLES_FULL = 18_000;
const PARTICLES_REDUCED = 4_500;

/* -------------------------------------------------------------------------- */
/* Shape generators — each returns Float32Array of xyz triplets.              */
/* -------------------------------------------------------------------------- */

function spherePoints(n: number, radius: number, seed: number): Float32Array {
  const rnd = mulberry32(seed);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // uniform on sphere
    const u = rnd() * 2 - 1;
    const t = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    out[i * 3 + 0] = r * Math.cos(t) * radius;
    out[i * 3 + 1] = u * radius;
    out[i * 3 + 2] = r * Math.sin(t) * radius;
  }
  return out;
}

function torusPoints(
  n: number,
  R: number,
  r: number,
  seed: number,
): Float32Array {
  const rnd = mulberry32(seed);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rnd() * Math.PI * 2;
    const v = rnd() * Math.PI * 2;
    out[i * 3 + 0] = (R + r * Math.cos(v)) * Math.cos(u);
    out[i * 3 + 1] = r * Math.sin(v);
    out[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
  }
  return out;
}

/* -------------------------------------------------------------------------- */

const VERT = /* glsl */ `
attribute vec3 positionA;
attribute vec3 positionB;
attribute float seed;
uniform float uMix;        // 0 → A, 1 → B
uniform float uTime;
uniform vec3  uPointerW;    // pointer projected to world at field's z
uniform float uPointerStrength;
uniform float uSize;

varying float vSeed;

void main() {
  vec3 a = positionA;
  vec3 b = positionB;
  // smooth ease for the blend
  float t = smoothstep(0.0, 1.0, uMix);
  vec3 p = mix(a, b, t);

  // turbulence — small per-particle wobble
  float ph = seed * 6.2831853;
  p += vec3(
    sin(uTime * 0.6 + ph),
    cos(uTime * 0.5 + ph * 1.7),
    sin(uTime * 0.4 + ph * 0.7)
  ) * 0.03;

  // pointer scatter — push away from pointerW with falloff
  vec3 d = p - uPointerW;
  float dist = length(d);
  float push = uPointerStrength / max(dist * dist, 0.04);
  p += normalize(d + 1e-4) * push;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // size attenuated by depth so far points are smaller
  gl_PointSize = uSize * (300.0 / -mv.z);
  vSeed = seed;
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying float vSeed;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.2, d);
  vec3 col = mix(uColorA, uColorB, vSeed);
  gl_FragColor = vec4(col, a * uOpacity);
}
`;

/**
 * 03 — AI Art.
 *
 * Two particle distributions (sphere → torus) interpolated in the vertex
 * shader by scroll progress within the section. Per-particle turbulence
 * keeps it organic. Pointer is projected into the field's plane and
 * pushes nearby particles outward like a soft repulsion field.
 */
export function AIArt({ section, reducedEffects }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const progress = useScrollSection(section.offset, section.pages);
  const { pointer, camera } = useThree();

  const count = reducedEffects ? PARTICLES_REDUCED : PARTICLES_FULL;

  const { geometry } = useMemo(() => {
    const a = spherePoints(count, 1.0, 0xa1a1);
    const b = torusPoints(count, 0.95, 0.32, 0xb2b2);
    const seeds = new Float32Array(count);
    const rnd = mulberry32(0xcccc);
    for (let i = 0; i < count; i++) seeds[i] = rnd();

    const g = new THREE.BufferGeometry();
    // dummy position attribute — required by three for setting up draw range
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('positionA', new THREE.BufferAttribute(a, 3));
    g.setAttribute('positionB', new THREE.BufferAttribute(b, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    g.computeBoundingSphere();
    return { geometry: g };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uMix: { value: 0 },
      uTime: { value: 0 },
      uPointerW: { value: new THREE.Vector3(100, 100, 100) },
      uPointerStrength: { value: 0 },
      uSize: { value: 2.4 },
      uOpacity: { value: 0.85 },
      uColorA: { value: new THREE.Color('#cab8a4') },
      uColorB: { value: new THREE.Color('#48345e') },
    }),
    [],
  );

  // Reusable scratch
  const _ray = useRef(new THREE.Raycaster());
  const _plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.5));
  const _hit = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    const p = Math.max(0, Math.min(1, progress.current));
    uniforms.uMix.value = p;

    // Project pointer to a plane that sits at the particle field's z
    // (group is positioned at z=0.4, see below — we use a plane at z=0.4 in world).
    _ray.current.setFromCamera(pointer as unknown as THREE.Vector2, camera);
    const fieldPlaneZ = 0.4;
    _plane.current.set(new THREE.Vector3(0, 0, 1), -fieldPlaneZ);
    if (_ray.current.ray.intersectPlane(_plane.current, _hit.current)) {
      // The points group sits at world (-1.4, 0, 0.4) (left side); convert
      // hit to local space by subtracting the group origin.
      uniforms.uPointerW.value.set(_hit.current.x + 1.4, _hit.current.y, 0);
      uniforms.uPointerStrength.value = 0.018;
    } else {
      uniforms.uPointerStrength.value = 0;
    }
  });

  return (
    <CategorySection section={section} textSide="right">
      <group position={[-1.4, 0, 0.4]}>
        <points ref={pointsRef} geometry={geometry}>
          <shaderMaterial
            ref={matRef}
            vertexShader={VERT}
            fragmentShader={FRAG}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </CategorySection>
  );
}
