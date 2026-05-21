import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { CategorySection } from './CategorySection';
import { useScrollSection } from '../../helpers/useScrollSection';
import { mulberry32 } from '../../helpers/useImageAssets';
import type { Section } from '../../config/sections';

interface Props {
  section: Section;
  reducedEffects: boolean;
}

interface UiElement {
  target: [number, number, number];
  size: [number, number];
  shape: 'rect' | 'circle' | 'pill';
  color: string;
  /** Where it flies in from (and explodes out toward). */
  offDir: [number, number, number];
}

/* -------------------------------------------------------------------------- */
/* CRT scan-line background plane                                             */
/* -------------------------------------------------------------------------- */

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SCREEN_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uOpacity;

void main() {
  // light-paper screen base
  vec3 base = vec3(0.96, 0.93, 0.86);
  // soft edge tint toward warmer tone
  float v = smoothstep(0.05, 0.5, length(vUv - 0.5));
  base *= 1.0 - v * 0.06;
  // subtle scan lines (darker grooves)
  float scan = 1.0 - 0.06 * step(0.5, fract(vUv.y * 400.0));
  base *= scan;
  // slow horizontal sweep — warm wash
  float sweep = smoothstep(0.0, 0.05, 0.05 - abs(fract(vUv.y - uTime * 0.04) - 0.5)) * 0.07;
  base += vec3(sweep * 0.8, sweep * 0.5, sweep * 0.2);
  gl_FragColor = vec4(base, uOpacity);
}
`;

/* -------------------------------------------------------------------------- */
/* UI element layout                                                          */
/* -------------------------------------------------------------------------- */

function generateElements(): UiElement[] {
  const rnd = mulberry32(0x40ce);
  const out: UiElement[] = [];

  // Header bar — light gray nav strip
  out.push({
    target: [0, 0.6, 0.05],
    size: [1.6, 0.18],
    shape: 'rect',
    color: '#1a1814',
    offDir: [0, 1.5, 0],
  });

  // Two cards side-by-side — soft beige
  out.push({
    target: [-0.45, 0.15, 0.06],
    size: [0.65, 0.5],
    shape: 'rect',
    color: '#e6dccb',
    offDir: [-1.5, 0, 0],
  });
  out.push({
    target: [0.45, 0.15, 0.06],
    size: [0.65, 0.5],
    shape: 'rect',
    color: '#e6dccb',
    offDir: [1.5, 0, 0],
  });

  // Avatar circle on top-left card — accent
  out.push({
    target: [-0.6, 0.27, 0.07],
    size: [0.16, 0.16],
    shape: 'circle',
    color: '#c97e3a',
    offDir: [-2, 1, 0],
  });

  // Two buttons (pill) — primary + secondary
  out.push({
    target: [-0.4, -0.4, 0.06],
    size: [0.45, 0.13],
    shape: 'pill',
    color: '#1a1814',
    offDir: [0, -1.5, 0],
  });
  out.push({
    target: [0.18, -0.4, 0.06],
    size: [0.34, 0.13],
    shape: 'pill',
    color: '#a89c88',
    offDir: [0, -1.8, 0],
  });

  // Scattered small dots / accents
  for (let i = 0; i < 4; i++) {
    out.push({
      target: [(rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.9, 0.07],
      size: [0.06, 0.06],
      shape: 'circle',
      color: i % 2 ? '#5a5450' : '#c97e3a',
      offDir: [(rnd() - 0.5) * 3, (rnd() - 0.5) * 3, 0],
    });
  }

  return out;
}

/**
 * 04 — UX Design.
 *
 * A schematic UI mockup is assembled from off-screen during the section's
 * first half, then exploded apart in the second half to reveal the
 * underlying grid. Hovering near an element subtly attracts it.
 *
 * Wrapped in a "screen" — a dark plane with CRT scan-line + sweep
 * shader. The grid lines appear as the explode phase begins.
 */
export function UXDesign({ section, reducedEffects }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const screenMatRef = useRef<THREE.ShaderMaterial>(null);
  const progress = useScrollSection(section.offset, section.pages);
  const { pointer, camera } = useThree();

  const elements = useMemo(() => generateElements(), []);
  const elemRefs = useRef<(THREE.Group | null)[]>([]);

  // Grid lines for the wireframe reveal
  const gridLines = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    const w = 1.8;
    const h = 1.2;
    const cols = 8;
    const rows = 6;
    for (let i = 0; i <= cols; i++) {
      const x = -w / 2 + (i / cols) * w;
      lines.push([
        new THREE.Vector3(x, -h / 2, 0.01),
        new THREE.Vector3(x, h / 2, 0.01),
      ]);
    }
    for (let i = 0; i <= rows; i++) {
      const y = -h / 2 + (i / rows) * h;
      lines.push([
        new THREE.Vector3(-w / 2, y, 0.01),
        new THREE.Vector3(w / 2, y, 0.01),
      ]);
    }
    return lines;
  }, []);
  const gridGroupRef = useRef<THREE.Group>(null);

  const screenUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [],
  );

  // Scratch — pointer projection
  const _ray = useRef(new THREE.Raycaster());
  const _plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.06));
  const _hit = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    screenUniforms.uTime.value += dt;
    const p = Math.max(0, Math.min(1, progress.current));

    // Phase split — 0..0.5 assemble, 0.5..1 explode
    const assembleT = Math.min(1, p / 0.5);
    const explodeT = Math.max(0, (p - 0.5) / 0.5);

    // Project pointer to plane at the UI's z so we can do magnetic pulls
    _ray.current.setFromCamera(pointer as unknown as THREE.Vector2, camera);
    const fieldPlaneZ = 1.4 + 0.06; // group origin x depends, but z is shared
    _plane.current.set(new THREE.Vector3(0, 0, 1), -fieldPlaneZ);
    let hasHit = false;
    if (_ray.current.ray.intersectPlane(_plane.current, _hit.current)) {
      hasHit = true;
    }

    for (let i = 0; i < elements.length; i++) {
      const ref = elemRefs.current[i];
      const el = elements[i]!;
      if (!ref) continue;

      // assemble: lerp from offDir to target
      const ax = el.offDir[0] + (el.target[0] - el.offDir[0]) * easeOut(assembleT);
      const ay = el.offDir[1] + (el.target[1] - el.offDir[1]) * easeOut(assembleT);
      const az = el.offDir[2] + (el.target[2] - el.offDir[2]) * easeOut(assembleT);

      // explode: push outward along offDir during second half
      const ex = el.offDir[0] * 0.9 * easeIn(explodeT);
      const ey = el.offDir[1] * 0.9 * easeIn(explodeT);
      const ez = el.offDir[2] * 0.9 * easeIn(explodeT);

      let x = ax + ex;
      let y = ay + ey;
      let z = az + ez;

      // pointer pull while not exploded
      if (hasHit && explodeT < 0.4) {
        const localPx = _hit.current.x - 1.4;
        const localPy = _hit.current.y;
        const dx = localPx - el.target[0];
        const dy = localPy - el.target[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        const range = 0.45;
        const pull = Math.max(0, 1 - dist / range);
        x += dx * pull * pull * 0.15 * (1 - explodeT);
        y += dy * pull * pull * 0.15 * (1 - explodeT);
      }

      ref.position.set(x, y, z);

      // rotate during explode for chaos
      ref.rotation.z = explodeT * (i % 2 ? 0.5 : -0.5) * Math.PI * 0.5;

      // fade during explode tail
      const op = 1 - Math.max(0, (explodeT - 0.7) / 0.3);
      const child = ref.children[0] as THREE.Mesh | undefined;
      if (child) {
        const m = child.material as THREE.MeshBasicMaterial;
        m.opacity = op;
      }
    }

    // Grid reveals during explode
    if (gridGroupRef.current) {
      const op = Math.min(1, explodeT * 1.5);
      gridGroupRef.current.visible = op > 0.01;
      gridGroupRef.current.scale.setScalar(0.95 + op * 0.05);
      // Lines API: each Line component handles its own material; rely on
      // child opacity by walking children
      gridGroupRef.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m && 'opacity' in m) {
          (m as { opacity: number; transparent: boolean }).opacity = op * 0.6;
          (m as { transparent: boolean }).transparent = true;
        }
      });
    }

    // Slight overall float on the whole screen
    if (groupRef.current) {
      groupRef.current.rotation.y = pointer.x * 0.06;
      groupRef.current.rotation.x = -pointer.y * 0.04;
    }
  });

  return (
    <CategorySection section={section} textSide="left">
      <group ref={groupRef} position={[1.4, 0, 0]}>
        {/* The "screen" — CRT shader plane behind everything */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[2.0, 1.4]} />
          <shaderMaterial
            ref={screenMatRef}
            vertexShader={SCREEN_VERT}
            fragmentShader={SCREEN_FRAG}
            uniforms={screenUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Wireframe grid (revealed during explode) */}
        <group ref={gridGroupRef} visible={false}>
          {!reducedEffects &&
            gridLines.map((pts, i) => (
              <Line
                key={i}
                points={pts}
                color="#1a1814"
                lineWidth={0.6}
                transparent
                opacity={0}
              />
            ))}
        </group>

        {/* UI elements */}
        {elements.map((el, i) => (
          <group
            key={i}
            ref={(g: THREE.Group | null) => {
              elemRefs.current[i] = g;
            }}
            position={[el.offDir[0], el.offDir[1], el.offDir[2]]}
          >
            <UiShape el={el} />
          </group>
        ))}
      </group>
    </CategorySection>
  );
}

/* -------------------------------------------------------------------------- */

function UiShape({ el }: { el: UiElement }) {
  const [w, h] = el.size;
  if (el.shape === 'circle') {
    return (
      <mesh>
        <circleGeometry args={[Math.min(w, h) / 2, 32]} />
        <meshBasicMaterial color={el.color} transparent opacity={1} toneMapped={false} />
      </mesh>
    );
  }
  if (el.shape === 'pill') {
    // approximate pill via wide box; for v1, plane is fine
    return (
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={el.color} transparent opacity={1} toneMapped={false} />
      </mesh>
    );
  }
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={el.color} transparent opacity={1} toneMapped={false} />
    </mesh>
  );
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function easeIn(t: number): number {
  return t * t * t;
}
