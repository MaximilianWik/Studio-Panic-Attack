import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { theme } from '../../config/theme';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { CategorySection } from './CategorySection';

/**
 * 01 Graphic Design — RIPPLING CANVAS sculpture.
 *
 * A flat subdivided plane that ripples like paper/fabric in a wind.
 * Cursor position drives a wave emanating from that point.
 * Click toggles between calm and stormy mode (different amplitudes).
 */

const RIPPLE_VERT = /* glsl */ `
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vDisp;

  // Simple value noise for background undulation
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    vec2 mp = uMouse * 0.5 + 0.5;
    float dist = distance(uv, mp);
    // Cursor ripple — decays with distance from cursor
    float ripple = sin(dist * 28.0 - uTime * 5.5) * exp(-dist * 3.5);
    // Slow background undulation
    float bg = (noise(uv * 4.0 + uTime * 0.15) - 0.5) * 0.6;
    float disp = ripple * uIntensity + bg * 0.4;
    vec3 p = position;
    p.z += disp * 0.5;
    vDisp = disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const RIPPLE_FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  varying float vDisp;
  uniform float uTime;

  void main() {
    // Paper base with red ripple highlights
    vec3 paper = vec3(0.94, 0.92, 0.86);
    vec3 ink = vec3(0.04);
    vec3 blood = vec3(0.83, 0.0, 0.0);
    vec3 col = mix(paper, blood, clamp(abs(vDisp) * 2.0, 0.0, 0.7));
    col = mix(col, ink, clamp(-vDisp * 1.5, 0.0, 0.4));
    // Edge vignette
    float edge = smoothstep(0.5, 0.0, length(vUv - 0.5)) * 0.6 + 0.4;
    col *= edge;
    // Subtle scan lines for editorial print feel
    float scan = sin(vUv.y * 200.0 + uTime * 0.5) * 0.5 + 0.5;
    col *= 0.92 + 0.08 * scan;
    gl_FragColor = vec4(col, 0.95);
  }
`;

export function GraphicDesign() {
  const visibility = useSectionVisibility('graphic');

  return (
    <CategorySection
      id="graphic"
      number="01"
      title="Graphic Design"
      body="A diverse collection showcasing a unique blend of renowned and niche styles. Each piece reflects experimentation and versatility, integrating fine art, sketching, AI, and even 3D modeling to create innovative and dynamic creations. Crafted with powerful tools like Adobe Creative Software, Procreate, Nomad, Midjourney, and more."
      side="left"
    >
      <BackgroundHeadline />
      <RipplingCanvas visibility={visibility} />
    </CategorySection>
  );
}

function BackgroundHeadline() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.16;
  });
  return (
    <group ref={ref} position={[0, 0, -1.5]}>
      <Text
        fontSize={0.42}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={5.5}
        lineHeight={0.92}
        letterSpacing={-0.02}
        color={theme.paper}
        position={[0, 0.6, 0]}
      >
        DESIGN BEYOND THE FORMAT
      </Text>
      <Text
        fontSize={0.1}
        anchorX="center"
        anchorY="middle"
        color={theme.blood}
        position={[0, -0.45, 0]}
        letterSpacing={0.4}
      >
        — A LIVING CANVAS —
      </Text>
    </group>
  );
}

interface RippleProps {
  visibility: () => number;
}

function RipplingCanvas({ visibility }: RippleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const [stormy, setStormy] = useState(false);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMouse: { value: new THREE.Vector2() },
        uTime: { value: 0 },
        uIntensity: { value: 1 },
      },
      vertexShader: RIPPLE_VERT,
      fragmentShader: RIPPLE_FRAG,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state, dt) => {
    const v = visibility();
    if (!meshRef.current) return;
    meshRef.current.visible = v > 0.01;
    if (v < 0.01) return;

    (material.uniforms.uTime.value as number) += dt;
    // Cursor in -1..1 range maps directly to plane UV via the shader
    (material.uniforms.uMouse.value as THREE.Vector2).set(
      state.pointer.x,
      state.pointer.y,
    );
    // Smooth intensity transitions
    const target = stormy ? 2.5 : 1.0;
    const cur = material.uniforms.uIntensity.value as number;
    material.uniforms.uIntensity.value = cur + (target - cur) * Math.min(1, dt * 3);

    // Idle drift rotation
    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    meshRef.current.rotation.x = -0.2 + Math.sin(state.clock.elapsedTime * 0.15) * 0.04;
  });

  void viewport;

  return (
    <mesh
      ref={meshRef}
      material={material}
      onClick={(e) => { e.stopPropagation(); setStormy((s) => !s); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
      position={[0, 0.2, 0]}
    >
      <planeGeometry args={[2.6, 2.0, 80, 60]} />
    </mesh>
  );
}

export default GraphicDesign;
