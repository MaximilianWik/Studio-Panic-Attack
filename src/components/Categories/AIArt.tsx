import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { CategorySection } from './CategorySection';

/**
 * 03 — AI Art — MAGNETIC PARTICLE SWARM
 *
 * A cursor-following swarm of particles. Each particle is attracted to
 * the cursor position with smooth lag, creating a flowing trail.
 * Click to "explode" — particles scatter outward, then re-attract.
 *
 * Implementation: simulate on CPU per-frame for ~3000 particles
 * (1500 on low-power). Each particle has position + velocity. Forces:
 *   - attraction toward cursor target (smoothed)
 *   - friction
 *   - noise jitter for organic motion
 *   - explosion impulse on click
 */

const HIGH_COUNT = 3000;
const LOW_COUNT = 1500;

const VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSpeed;
  varying float vSeed;
  varying float vSpeed;
  void main() {
    vSeed = aSeed;
    vSpeed = aSpeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(2.0, 5.0, aSeed);
    gl_PointSize = size * (220.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float vSeed;
  varying float vSpeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= mix(0.4, 1.0, vSeed);
    // Color shifts based on speed: paper at rest → blood red when fast
    vec3 paper = vec3(0.94, 0.92, 0.86);
    vec3 blood = vec3(0.83, 0.0, 0.0);
    vec3 col = mix(paper, blood, clamp(vSpeed * 1.5, 0.0, 1.0));
    gl_FragColor = vec4(col, a * 0.85);
  }
`;

export function AIArt() {
  const profile = useDeviceProfile();
  const visibility = useSectionVisibility('ai');

  return (
    <CategorySection
      id="ai"
      number="03"
      title="AI Art"
      body="Experimental AI art pushing the boundaries of creative expression and innovation. A wide range of creations, from illustrations and photorealistic images, to 3D models and videos created with nothing more than AI prompts. Crafted using advanced AI tools like Krea, Adobe Firefly, DALL-E, Midjourney, and more."
      side="left"
    >
      <ParticleSwarm
        count={profile.isLowPower ? LOW_COUNT : HIGH_COUNT}
        visibility={visibility}
      />
    </CategorySection>
  );
}

interface SwarmProps {
  count: number;
  visibility: () => number;
}

function ParticleSwarm({ count, visibility }: SwarmProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  const explodeImpulse = useRef(0);

  // CPU buffers
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const velocities = useMemo(() => new Float32Array(count * 3), [count]);
  const speeds = useMemo(() => new Float32Array(count), [count]);

  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // Initial positions: scattered in a small cube
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
    }
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    return { geometry: g, material: m };
  }, [count, positions, speeds]);

  useFrame((state, dt) => {
    const v = visibility();
    if (!pointsRef.current) return;
    if (v < 0.001) return; // parent group handles visibility

    const dtClamped = Math.min(dt, 0.05); // cap dt to avoid jumps

    // Cursor target in world space
    const targetX = state.pointer.x * viewport.width * 0.4;
    const targetY = state.pointer.y * viewport.height * 0.4;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const speedAttr = geometry.getAttribute('aSpeed') as THREE.BufferAttribute;

    const exImpulse = explodeImpulse.current;
    explodeImpulse.current = Math.max(0, exImpulse - dtClamped * 1.2);

    for (let i = 0; i < count; i++) {
      const px = positions[i * 3 + 0];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];

      // Attraction force toward cursor target
      const dx = targetX - px;
      const dy = targetY - py;
      const dz = 0 - pz;
      // Force magnitude — stronger when farther, capped
      const distSq = dx * dx + dy * dy + dz * dz + 0.1;
      const fx = (dx / Math.sqrt(distSq)) * 0.8;
      const fy = (dy / Math.sqrt(distSq)) * 0.8;
      const fz = (dz / Math.sqrt(distSq)) * 0.4;

      // Per-particle noise jitter
      const seed = i * 0.0173;
      const jx = Math.sin(state.clock.elapsedTime * 1.7 + seed) * 0.3;
      const jy = Math.cos(state.clock.elapsedTime * 1.3 + seed * 1.7) * 0.3;

      // Explosion outward from origin
      const r = Math.sqrt(px * px + py * py + pz * pz) + 0.01;
      const ex = (px / r) * exImpulse * 8;
      const ey = (py / r) * exImpulse * 8;
      const ez = (pz / r) * exImpulse * 4;

      velocities[i * 3 + 0] = (velocities[i * 3 + 0] + (fx + jx + ex) * dtClamped) * 0.92;
      velocities[i * 3 + 1] = (velocities[i * 3 + 1] + (fy + jy + ey) * dtClamped) * 0.92;
      velocities[i * 3 + 2] = (velocities[i * 3 + 2] + (fz + ez) * dtClamped) * 0.92;

      positions[i * 3 + 0] += velocities[i * 3 + 0];
      positions[i * 3 + 1] += velocities[i * 3 + 1];
      positions[i * 3 + 2] += velocities[i * 3 + 2];

      const vx = velocities[i * 3 + 0];
      const vy = velocities[i * 3 + 1];
      speeds[i] = Math.sqrt(vx * vx + vy * vy);
    }
    posAttr.needsUpdate = true;
    speedAttr.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onClick={(e) => {
        e.stopPropagation();
        explodeImpulse.current = 1.0;
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    />
  );
}

export default AIArt;
