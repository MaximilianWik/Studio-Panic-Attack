import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { useSectionProgress, useSectionVisibility } from '../../helpers/useScrollSection';
import { useSculptureEvents } from '../../helpers/sculptureEvents';
import { CategorySection } from './CategorySection';

/**
 * 04 — UX Design
 *
 * "Hedgehog": an InstancedMesh of tall cones distributed via Fibonacci
 * spiral on a unit sphere, each oriented along its outward surface
 * normal. Spikes recoil from the pointer (length collapses toward 0
 * when cursor is near in screen-space) and the entire ball slowly
 * rotates with section scroll progress driving radius growth.
 *
 *   - Pointer near → spikes within falloff radius shrink (the surface
 *     "flinches"). Smoothed via per-instance lerp on a Float32 array.
 *   - Click → 250 ms global pulse: every spike length lerps to 2× and
 *     back, plus a one-shot post-fx noise burst via the event bus.
 *   - Idle (cursor offscreen) → low-frequency Perlin breathing across
 *     the field; disabled on tier ≤ 1.
 *
 * Conceptual inversion: a UX hero that visibly *refuses to be touched*.
 */

const HIGH_COUNT = 420;
const LOW_COUNT = 150;
const SPIKE_HEIGHT = 0.55;
const SPIKE_RADIUS = 0.04;
const BALL_RADIUS = 0.85;

/** Caution-tape yellow + ink black. */
const COL_BODY = new THREE.Color('#0a0a0a');
const COL_TIP = new THREE.Color('#f5d000');

const VERT = /* glsl */ `
  varying float vY;
  varying vec3 vNormal;
  void main() {
    vY = position.y;
    vec4 worldNormal = instanceMatrix * vec4(normal, 0.0);
    vNormal = normalize(normalMatrix * worldNormal.xyz);
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float vY;
  varying vec3 vNormal;
  uniform float uHeight;
  uniform vec3 uBody;
  uniform vec3 uTip;
  void main() {
    float t = clamp(vY / uHeight, 0.0, 1.0); // 0 base → 1 tip
    float tipBand = smoothstep(0.62, 0.96, t);
    vec3 N = normalize(vNormal);
    float l = max(dot(N, normalize(vec3(0.4, 0.7, 0.5))), 0.0);
    float rim = pow(1.0 - max(N.z, 0.0), 3.0) * 0.35;
    vec3 lit = uBody * (l * 0.75 + 0.25) + vec3(0.05) * rim;
    vec3 col = mix(lit, uTip, tipBand);
    // boost tip beyond 1 for that emissive-yellow pop
    col += uTip * tipBand * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Fibonacci sphere — n unit-vectors evenly distributed on a sphere. */
function fibSphere(n: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const phi = Math.PI * (Math.sqrt(5) - 1); // golden angle
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    out.push(new THREE.Vector3(x, y, z));
  }
  return out;
}

export function UXDesign() {
  const profile = useDeviceProfile();
  const progress = useSectionProgress('ux');
  const visibility = useSectionVisibility('ux');

  return (
    <CategorySection
      id="ux"
      number="04"
      title="UX Design"
      body="Dynamic website prototypes designed for intuitive user experiences and visually stunning interfaces. From interactive elements to visual coding techniques, I enhance user engagement through subtle animations and bold transitions. Innovative approaches, like integrating 3D models, push the boundaries of traditional web design, creating memorable digital experiences."
      side="right"
    >
      <Hedgehog
        count={profile.isLowPower ? LOW_COUNT : HIGH_COUNT}
        breathingEnabled={!profile.isLowPower}
        progress={progress}
        visibility={visibility}
      />
    </CategorySection>
  );
}

interface HedgehogProps {
  count: number;
  breathingEnabled: boolean;
  progress: () => number;
  visibility: () => number;
}

function Hedgehog({ count, breathingEnabled, progress, visibility }: HedgehogProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const fire = useSculptureEvents((s) => s.fire);

  // Scratch allocations reused across frames.
  const scratch = useMemo(() => {
    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    const tmpV = new THREE.Vector3();
    const tmpV2 = new THREE.Vector3();
    return { dummy, up, q, tmpV, tmpV2 };
  }, []);

  // Static per-instance data.
  const data = useMemo(() => {
    const dirs = fibSphere(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = Math.random();
    const lay = new Float32Array(count); // 0 = erect, 1 = flat
    return { dirs, seeds, lay };
  }, [count]);

  // Custom geometry: cone with base shifted to y=0 so instance position
  // sits on the sphere surface and the tip extends outward along +Y.
  const geometry = useMemo(() => {
    const g = new THREE.ConeGeometry(SPIKE_RADIUS, SPIKE_HEIGHT, 6, 1, false);
    g.translate(0, SPIKE_HEIGHT / 2, 0);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uHeight: { value: SPIKE_HEIGHT },
          uBody: { value: COL_BODY },
          uTip: { value: COL_TIP },
        },
      }),
    [],
  );

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  // Click handling — onPointerDown/Up logic to distinguish click from drag-y noise.
  const downAtRef = useRef<{ x: number; y: number; t: number } | null>(null);

  // Pulse state — ramps up to 1 over 80ms then decays over 170ms.
  const pulseUntil = useRef(0);

  useFrame((state, dt) => {
    const v = visibility();
    const mesh = meshRef.current;
    const grp = groupRef.current;
    if (!mesh || !grp) return;
    if (v < 0.005) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const t = state.clock.elapsedTime;
    const p = progress();

    // Section-progress drives radius growth + slow yaw.
    const radius = BALL_RADIUS * (0.45 + 0.55 * THREE.MathUtils.smoothstep(p, 0.0, 0.85));
    grp.rotation.y += dt * 0.18;
    grp.rotation.x = Math.sin(t * 0.27) * 0.12;

    // Pulse: 0..1 envelope from event timestamp
    const ev = useSculptureEvents.getState();
    let pulse = 0;
    if (ev.hedgehogPulseAt > 0) {
      const since = performance.now() / 1000 - ev.hedgehogPulseAt;
      const dur = 0.25;
      if (since >= 0 && since <= dur) {
        // ramp 0→1 first 30%, decay 1→0 rest
        pulse = since < dur * 0.3 ? since / (dur * 0.3) : 1 - (since - dur * 0.3) / (dur * 0.7);
        pulseUntil.current = ev.hedgehogPulseAt + dur;
      }
    }

    // Pointer in world-space (project NDC to a plane at the ball's z).
    const px = state.pointer.x;
    const py = state.pointer.y;
    // Convert pointer to a direction vector in the ball's local frame.
    // Approximation: the section lives in the layout's main z-plane, so
    // map NDC pointer to a tangent influence vector relative to the ball.
    const pointerWorld = scratch.tmpV.set(
      px * state.viewport.width * 0.4,
      py * state.viewport.height * 0.4,
      0.6,
    );
    grp.updateWorldMatrix(true, false);
    const inv = scratch.tmpV2.copy(pointerWorld).applyMatrix4(grp.matrixWorld.clone().invert()).normalize();

    const { dummy, up, q, dirs, seeds, lay } = { ...scratch, ...data };

    for (let i = 0; i < count; i++) {
      const dir = dirs[i];
      // Recoil: cosine similarity between spike direction and pointer dir.
      // Close pointer (high cosSim) → high lay target.
      const cs = Math.max(0, dir.dot(inv));
      // Smooth threshold — only spikes within ~30° of the pointer recoil.
      const target = THREE.MathUtils.smoothstep(cs, 0.55, 0.95);
      // Lerp lay toward target (fast on, slow off so it visibly shrinks then unfolds).
      const k = target > lay[i] ? 0.35 : 0.05;
      lay[i] += (target - lay[i]) * k;

      // Breathing noise — a tiny sin wave per-spike when not low-power.
      const breath = breathingEnabled ? Math.sin(t * 0.9 + seeds[i] * 6.28) * 0.06 : 0;

      // Length scale: base * (1 - lay*0.92) + breath, plus pulse extension.
      const lenScale = (1 - lay[i] * 0.92) + breath + pulse * 1.0;

      // Build matrix: position at (radius * dir), orientation aligning +Y to dir, scale Y by lenScale.
      dummy.position.copy(dir).multiplyScalar(radius);
      q.setFromUnitVectors(up, dir);
      dummy.quaternion.copy(q);
      dummy.scale.set(1, Math.max(0.08, lenScale), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        onPointerDown={(e) => {
          downAtRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
        }}
        onPointerUp={(e) => {
          const d = downAtRef.current;
          downAtRef.current = null;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.hypot(dx, dy) < 6 && performance.now() - d.t < 350) {
            e.stopPropagation();
            fire('hedgehogPulseAt');
          }
        }}
      />
    </group>
  );
}

export default UXDesign;
