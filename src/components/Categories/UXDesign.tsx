import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { theme } from '../../config/theme';
import { useSectionProgress } from '../../helpers/useScrollSection';
import { CategorySection } from './CategorySection';

/**
 * 04 — UX Design
 *
 * Hero effect: 5 schematic UI mockup planes that assemble from offscreen
 * during the first half of the section's scroll progress, then explode
 * apart in the second half to reveal a wireframe grid behind.
 *
 *   - Each plane has a "scene" ShaderMaterial drawing a fake UI layout
 *     (header bar, sidebar, title block, image grid, body lines).
 *   - A CRT scan-line + RGB-shift effect plays over the result.
 *   - The wireframe grid is a separate plane behind the mockups,
 *     fading in as the explode phase progresses.
 *   - On pointer-near, mockup pieces magnetically nudge toward the cursor.
 */

const FRAG_UI = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uHue;
  uniform float uScan;
  uniform float uIntensity;

  // round-rect distance
  float rrect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= 1.5;

    // body
    vec3 col = vec3(0.06);

    // header bar
    float head = step(uv.y, 0.92) - step(uv.y, 1.0);
    col = mix(col, vec3(0.12, 0.05, 0.05), 1.0 - smoothstep(0.86, 0.92, uv.y));

    // sidebar
    float sb = 1.0 - smoothstep(0.16, 0.18, uv.x);
    col = mix(col, vec3(0.04), sb * step(uv.y, 0.86));

    // title block
    float t = 1.0 - smoothstep(0.0, 0.018, abs(rrect(p - vec2(-0.4, 0.4), vec2(0.55, 0.06), 0.02)));
    col = mix(col, vec3(0.94, 0.0, 0.0), t * 0.9);

    // sub bar
    float t2 = 1.0 - smoothstep(0.0, 0.012, abs(rrect(p - vec2(-0.65, 0.25), vec2(0.3, 0.02), 0.01)));
    col = mix(col, vec3(0.55), t2 * 0.6);

    // image grid (3 cols x 2 rows)
    for (int y = 0; y < 2; y++) {
      for (int x = 0; x < 3; x++) {
        vec2 c = vec2(-0.65 + float(x) * 0.45, -0.1 - float(y) * 0.35);
        float box = 1.0 - smoothstep(0.0, 0.012, rrect(p - c, vec2(0.18, 0.13), 0.03));
        // alternating fills
        float fill = mod(float(x + y * 3), 2.0);
        vec3 fc = mix(vec3(0.16), vec3(0.22, 0.08, 0.06), fill);
        col = mix(col, fc, box);
      }
    }

    // scan line
    float scan = sin((vUv.y + uTime * 0.3) * 360.0) * 0.5 + 0.5;
    col -= 0.06 * scan * uScan;

    // RGB shift on horizontal sweep
    float shift = 0.004 * sin(uTime * 0.7);
    col.r *= 1.0 + shift;
    col.b *= 1.0 - shift;

    // hue shift
    col = mix(col, col * vec3(1.0, 0.85, 0.85), uHue * 0.4);

    // border
    float border = step(0.99, max(abs(p.x) / 1.5, abs(p.y))) * 0.4;
    col += vec3(0.94, 0.94, 0.9) * border * 0.6;

    col *= uIntensity;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT_UI = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface MockupSpec {
  /** assembled local-space pos */
  homeX: number;
  homeY: number;
  homeZ: number;
  /** offscreen entry origin */
  entryX: number;
  entryY: number;
  /** explode target */
  explodeX: number;
  explodeY: number;
  explodeZ: number;
  /** rotation when assembled */
  rotZ: number;
  /** rotation when exploded */
  explodeRotX: number;
  explodeRotY: number;
  /** size */
  w: number;
  h: number;
  hue: number;
  scan: number;
}

const MOCKUPS: MockupSpec[] = [
  {
    homeX: -1.2, homeY: 0.6, homeZ: 0,
    entryX: -10, entryY: 5,
    explodeX: -3.5, explodeY: 1.5, explodeZ: -2,
    rotZ: -0.04,
    explodeRotX: 0.4, explodeRotY: -0.6,
    w: 2.4, h: 1.6, hue: 0.0, scan: 0.5,
  },
  {
    homeX: 0.7, homeY: 0.45, homeZ: -0.3,
    entryX: 8, entryY: 6,
    explodeX: 3.5, explodeY: 1.2, explodeZ: 1,
    rotZ: 0.02,
    explodeRotX: -0.3, explodeRotY: 0.5,
    w: 2.0, h: 1.4, hue: 0.7, scan: 0.8,
  },
  {
    homeX: -1.6, homeY: -0.7, homeZ: 0.2,
    entryX: -9, entryY: -6,
    explodeX: -2.5, explodeY: -2.4, explodeZ: 1.2,
    rotZ: 0.05,
    explodeRotX: 0.5, explodeRotY: 0.3,
    w: 2.0, h: 1.2, hue: 0.3, scan: 0.4,
  },
  {
    homeX: 1.3, homeY: -0.8, homeZ: 0.1,
    entryX: 9, entryY: -7,
    explodeX: 3.0, explodeY: -2.6, explodeZ: -1.8,
    rotZ: -0.03,
    explodeRotX: -0.4, explodeRotY: -0.4,
    w: 2.2, h: 1.4, hue: 0.5, scan: 0.6,
  },
  {
    homeX: 0.0, homeY: 1.1, homeZ: -0.2,
    entryX: 0, entryY: 9,
    explodeX: 0, explodeY: 3.6, explodeZ: -3,
    rotZ: 0.0,
    explodeRotX: 0.7, explodeRotY: 0.0,
    w: 3.0, h: 1.0, hue: 0.2, scan: 0.7,
  },
];

export function UXDesign() {
  const progress = useSectionProgress('ux');

  return (
    <CategorySection
      id="ux"
      number="04"
      eyebrow="UX Design"
      title="Interfaces with a pulse."
      body="Dynamic website prototypes designed for intuitive user experiences and visually stunning interfaces. From interactive elements to visual coding techniques, enhancing engagement through subtle animations. Innovative approaches, like integrating 3D models, push the boundaries of traditional web design."
      side="right"
      chips={['Figma', 'Webflow', 'Framer', 'React', 'three.js']}
    >
      <UXMockupRig progress={progress} />
    </CategorySection>
  );
}

interface RigProps {
  progress: () => number;
}

function UXMockupRig({ progress }: RigProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mockupRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<THREE.ShaderMaterial[]>([]);
  const wireRef = useRef<THREE.Mesh>(null);
  const wireMatRef = useRef<THREE.ShaderMaterial>(null);

  const materials = useMemo(() => {
    return MOCKUPS.map((m) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uHue: { value: m.hue },
          uScan: { value: m.scan },
          uIntensity: { value: 1 },
        },
        vertexShader: VERT_UI,
        fragmentShader: FRAG_UI,
        transparent: true,
      }),
    );
  }, []);

  const wireMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uOpacity: { value: 0 },
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
        uniform float uOpacity;
        void main() {
          vec2 g = fract(vUv * vec2(36.0, 24.0));
          float lx = step(0.97, g.x);
          float ly = step(0.97, g.y);
          float l = max(lx, ly);
          // accent every 6th line
          vec2 g6 = fract(vUv * vec2(6.0, 4.0));
          float lx6 = step(0.97, g6.x);
          float ly6 = step(0.97, g6.y);
          float l6 = max(lx6, ly6);
          vec3 col = mix(vec3(0.18), vec3(0.83, 0.0, 0.0), l6);
          float falloff = smoothstep(0.6, 0.0, length(vUv - 0.5));
          gl_FragColor = vec4(col, l * 0.55 * uOpacity * falloff);
        }
      `,
    });
  }, []);

  useFrame((state, dt) => {
    matRefs.current = materials;
    wireMatRef.current = wireMaterial;
    if (!groupRef.current) return;

    const p = progress();
    // assemble: 0..0.5
    // explode:  0.5..1.0
    const assemble = THREE.MathUtils.smoothstep(p, 0.0, 0.5);
    const explode = THREE.MathUtils.smoothstep(p, 0.5, 1.0);

    // pointer for magnetic pull on mockups
    const px = state.pointer.x;
    const py = state.pointer.y;

    for (let i = 0; i < MOCKUPS.length; i++) {
      const m = MOCKUPS[i];
      const meshRef = mockupRefs.current[i];
      if (!meshRef) continue;

      // entry → home → explode
      const x1 = THREE.MathUtils.lerp(m.entryX, m.homeX, assemble);
      const y1 = THREE.MathUtils.lerp(m.entryY, m.homeY, assemble);
      const z1 = m.homeZ;
      const x2 = THREE.MathUtils.lerp(x1, m.explodeX, explode);
      const y2 = THREE.MathUtils.lerp(y1, m.explodeY, explode);
      const z2 = THREE.MathUtils.lerp(z1, m.explodeZ, explode);

      // magnetic pull when assembled & not yet exploded
      const magnetWindow = (1 - explode) * assemble;
      meshRef.position.set(
        x2 + px * 0.18 * magnetWindow,
        y2 + py * 0.12 * magnetWindow,
        z2,
      );

      const rx = THREE.MathUtils.lerp(0, m.explodeRotX, explode);
      const ry = THREE.MathUtils.lerp(0, m.explodeRotY, explode);
      const rz = THREE.MathUtils.lerp(m.rotZ, m.rotZ * 2.0, explode);
      meshRef.rotation.set(rx, ry, rz);

      const mat = materials[i];
      (mat.uniforms.uTime.value as number) += dt;
      // fade as exploded
      mat.uniforms.uIntensity.value = 1 - explode * 0.55;
    }

    // wireframe fades in during the explode phase
    wireMaterial.uniforms.uOpacity.value = explode;
  });

  return (
    <group ref={groupRef}>
      {/* wireframe grid behind */}
      <mesh ref={wireRef} position={[0, 0, -2]} material={wireMaterial}>
        <planeGeometry args={[10, 7]} />
      </mesh>

      {MOCKUPS.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            mockupRefs.current[i] = el;
          }}
          position={[m.homeX, m.homeY, m.homeZ]}
          rotation={[0, 0, m.rotZ]}
          material={materials[i]}
        >
          <planeGeometry args={[m.w, m.h]} />
        </mesh>
      ))}
    </group>
  );
}

void theme;

export default UXDesign;
