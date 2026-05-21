import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { useSculptureEvents } from '../../helpers/sculptureEvents';
import { CategorySection } from './CategorySection';

/**
 * 01 — Graphic Design
 *
 * "CMYK Misregistration": a stack of three halftone dot screens — pure
 * Cyan, Magenta, Yellow — multiplied against a white backdrop. Each
 * layer drifts xy with different sensitivity to pointer position, so
 * the slightest movement breaks registration into a moiré dance.
 *
 *   - Each plane runs the same halftone fragment shader sampling a
 *     baked "01" canvas-texture as the source intensity image.
 *   - Layer offsets follow the cursor with three distinct factors,
 *     producing constant misregistration.
 *   - Click → all three offsets spring to zero over ~600 ms → the
 *     three screens lock into perfect register, the "01" briefly
 *     resolves crisply, then drifts apart again. Fires `cmykSnapAt`
 *     for a gentle PostFx noise pulse on the snap.
 *
 * Direct reference to print's heritage. Maximum break from the
 * paper/blood vocabulary — pure C / M / Y on white.
 */

const TEX_SIZE = 256;
const PLANE_W = 4.6;
const PLANE_H = 3.2;
const BACKDROP_Z = -0.6;

interface LayerSpec {
  color: [number, number, number];
  /** halftone screen angle, radians */
  angle: number;
  /** dot grid scale (cells across the plane) */
  scale: number;
  /** how far this layer follows pointer (in plane units) */
  drag: number;
  /** spring constant — higher = snappier follow */
  k: number;
  /** local z so the three planes don't z-fight */
  z: number;
}

// Print-shop screen angles: C 15°, M 75°, Y 0°.
const LAYERS: LayerSpec[] = [
  { color: [0, 0.85, 0.95], angle: (15 * Math.PI) / 180, scale: 36, drag: 0.32, k: 0.10, z: 0.04 },
  { color: [0.95, 0, 0.55], angle: (75 * Math.PI) / 180, scale: 36, drag: 0.18, k: 0.07, z: 0.02 },
  { color: [0.98, 0.85, 0], angle: 0, scale: 36, drag: 0.42, k: 0.13, z: 0.0 },
];

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uSrc;
  uniform vec3 uColor;
  uniform float uAngle;
  uniform float uScale;
  uniform vec2 uOffset;

  void main() {
    // Sample source intensity at offset-shifted uv (so the "image" itself
    // moves with the layer — that's what creates registration error).
    vec2 srcUv = vUv - uOffset;
    if (srcUv.x < 0.0 || srcUv.x > 1.0 || srcUv.y < 0.0 || srcUv.y > 1.0) {
      gl_FragColor = vec4(1.0); // white outside source = no contribution
      return;
    }
    float src = texture2D(uSrc, srcUv).r;

    // Halftone screen — rotated grid of dots.
    vec2 p = (vUv - 0.5) * uScale;
    float c = cos(uAngle); float s = sin(uAngle);
    vec2 r = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    vec2 g = fract(r) - 0.5;
    float d = length(g);

    // Dot radius derives from source intensity. AA via smoothstep.
    float rad = sqrt(src) * 0.45;
    float dot = 1.0 - smoothstep(rad - 0.04, rad + 0.04, d);

    // White where no dot, layer color where dot. Multiply blend produces
    // subtractive CMY on the white backdrop.
    vec3 col = mix(vec3(1.0), uColor, dot);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function GraphicDesign() {
  const profile = useDeviceProfile();
  const visibility = useSectionVisibility('graphic');

  return (
    <CategorySection
      id="graphic"
      number="01"
      title="Graphic Design"
      body="A diverse collection showcasing a unique blend of renowned and niche styles. Each piece reflects experimentation and versatility, integrating fine art, sketching, AI, and even 3D modeling to create innovative and dynamic creations. Crafted with powerful tools like Adobe Creative Software, Procreate, Nomad, Midjourney, and more."
      side="left"
    >
      <CMYKMisregistration lowPower={profile.isLowPower} visibility={visibility} />
    </CategorySection>
  );
}

interface CMYKProps {
  lowPower: boolean;
  visibility: () => number;
}

function buildSourceTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = TEX_SIZE;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  // White background = zero source intensity (no dots will fire).
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  // Source image = bold "01" — black ink where we want max dot density.
  ctx.fillStyle = '#000000';
  ctx.font = '900 230px "Helvetica Neue", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('01', TEX_SIZE / 2, TEX_SIZE / 2 + 8);
  // Invert so dark text = high source intensity (black=1, white=0).
  const img = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 255 - img.data[i];
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function CMYKMisregistration({ lowPower, visibility }: CMYKProps) {
  void lowPower;
  const groupRef = useRef<THREE.Group>(null);
  const planeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const offsets = useRef(LAYERS.map(() => new THREE.Vector2(0, 0)));
  const fire = useSculptureEvents((s) => s.fire);
  const { viewport } = useThree();

  const sourceTex = useMemo(() => buildSourceTexture(), []);

  const materials = useMemo(() => {
    return LAYERS.map(
      (l) =>
        new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          uniforms: {
            uSrc: { value: sourceTex },
            uColor: { value: new THREE.Color(...l.color) },
            uAngle: { value: l.angle },
            uScale: { value: l.scale },
            uOffset: { value: new THREE.Vector2(0, 0) },
          },
          transparent: false,
          blending: THREE.MultiplyBlending,
          depthWrite: false,
        }),
    );
  }, [sourceTex]);

  useEffect(() => {
    return () => {
      sourceTex.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [sourceTex, materials]);

  useFrame((state) => {
    const v = visibility();
    const grp = groupRef.current;
    if (!grp) return;
    if (v < 0.005) {
      grp.visible = false;
      return;
    }
    grp.visible = true;

    const ev = useSculptureEvents.getState();
    let snap = 0;
    if (ev.cmykSnapAt > 0) {
      const since = performance.now() / 1000 - ev.cmykSnapAt;
      const dur = 0.6;
      if (since >= 0 && since <= dur) {
        // Snap envelope: hard hit at t=0, gentle release.
        snap = since < 0.05 ? 1 : 1 - (since - 0.05) / (dur - 0.05);
      }
    }

    // Pointer in [-1, 1] NDC → plane-local target offset.
    const px = state.pointer.x;
    const py = state.pointer.y;

    for (let i = 0; i < LAYERS.length; i++) {
      const l = LAYERS[i];
      // Target offset scales with drag factor; snap event collapses it to 0.
      const tx = px * l.drag * (1 - snap) * 0.05;
      const ty = py * l.drag * (1 - snap) * 0.05;
      offsets.current[i].x += (tx - offsets.current[i].x) * (l.k + snap * 0.4);
      offsets.current[i].y += (ty - offsets.current[i].y) * (l.k + snap * 0.4);
      const u = materials[i].uniforms.uOffset.value as THREE.Vector2;
      u.copy(offsets.current[i]);
    }

    // Subtle group sway — keeps the static stack from feeling dead.
    const t = state.clock.elapsedTime;
    grp.rotation.z = Math.sin(t * 0.18) * 0.015;
    grp.position.x = Math.sin(t * 0.22) * 0.04;
    void viewport;
  });

  return (
    <group ref={groupRef}>
      {/* White backdrop — the "paper" that the CMY screens multiply against. */}
      <mesh position={[0, 0, BACKDROP_Z]}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Three CMY screens stacked at slightly different z. */}
      {LAYERS.map((l, i) => (
        <mesh
          key={i}
          ref={(el) => {
            planeRefs.current[i] = el;
          }}
          position={[0, 0, l.z]}
          material={materials[i]}
          onClick={(e) => {
            e.stopPropagation();
            fire('cmykSnapAt');
          }}
        >
          <planeGeometry args={[PLANE_W, PLANE_H]} />
        </mesh>
      ))}
    </group>
  );
}

export default GraphicDesign;
