import { Float, PresentationControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { theme } from '../../config/theme';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { CategorySection } from './CategorySection';

/**
 * 02 — 3D Art
 *
 * Hero effect: a procedurally noise-displaced icosahedron with
 * iridescent clearcoat metal, wrapped in <PresentationControls> so
 * the user can drag-rotate it within polar/azimuth bounds. Scroll
 * progress modulates the displacement amplitude — at section center
 * the surface boils harder.
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;
  varying vec3 vNormal;
  varying vec3 vPos;

  // Inigo Quilez classic-snoise approximation
  vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

  float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);
    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);
    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);
    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));
    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
    return o4.y * d.y + o4.x * (1.0 - d.y);
  }

  void main() {
    vec3 p = position;
    vec3 n = normal;
    float a = noise(p * uFreq + uTime * 0.4);
    float b = noise(p * uFreq * 2.3 - uTime * 0.6);
    float disp = (a - 0.5) * uAmp + (b - 0.5) * uAmp * 0.4;
    p += n * disp;
    vNormal = normalize(normalMatrix * n);
    vPos = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform vec3 uCam;
  uniform float uTime;

  // iridescent dispersion based on view angle
  vec3 iridescent(float t) {
    return 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + t));
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCam - vPos);
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - NdotV, 4.0);
    vec3 base = mix(vec3(0.06, 0.05, 0.04), vec3(0.97, 0.95, 0.91), NdotV);
    vec3 ir = iridescent(NdotV * 0.7 + uTime * 0.04);
    base = mix(base, base * ir, 0.55);
    // rim
    base += vec3(0.83, 0.0, 0.0) * fres * 0.45;
    base += pow(NdotV, 8.0) * 0.4;
    gl_FragColor = vec4(base, 1.0);
  }
`;

export function ThreeDeeArt() {
  const visibility = useSectionVisibility('threeD');

  return (
    <CategorySection
      id="threeD"
      number="02"
      eyebrow="3D Art"
      title="Worlds, organic and otherwise."
      body="High-poly nature environments to charming low-poly scenes. Each creation reflects a passion for crafting immersive worlds and characters. Organic or inorganic, 3D modeling brings ideas to life. Crafted in Maya, Blender, Unreal Engine 5, and more."
      side="right"
      entrance="slide-right"
      chips={['Maya', 'Blender', 'Unreal 5', 'ZBrush']}
    >
      <Sculpture visibility={visibility} />
    </CategorySection>
  );
}

interface SculptureProps {
  visibility: () => number;
}

function Sculpture({ visibility }: SculptureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.18 },
        uFreq: { value: 1.6 },
        uCam: { value: new THREE.Vector3() },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
  }, []);

  useFrame((state, dt) => {
    const v = visibility();
    if (!meshRef.current) return;
    meshRef.current.visible = v > 0.001;
    if (v < 0.001) return;
    matRef.current = material;
    (material.uniforms.uTime.value as number) += dt;
    // amplitude peaks at section center
    material.uniforms.uAmp.value = 0.06 + v * 0.22;
    (material.uniforms.uCam.value as THREE.Vector3).copy(state.camera.position);
    // gentle idle rotation when not being dragged
    meshRef.current.rotation.y += dt * 0.12;
  });

  void theme;

  return (
    <PresentationControls
      enabled
      cursor
      snap
      polar={[-0.5, 0.6]}
      azimuth={[-0.9, 0.9]}
      damping={0.18}
      speed={0.9}
    >
      <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.2}>
        <mesh ref={meshRef} material={material} scale={1.1}>
          <icosahedronGeometry args={[1, 28]} />
        </mesh>
      </Float>
    </PresentationControls>
  );
}

export default ThreeDeeArt;
