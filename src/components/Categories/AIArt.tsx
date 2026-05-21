import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useDeviceProfile } from '../../helpers/useDeviceProfile';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { usePointerVelocity } from '../../helpers/usePointerVelocity';
import { useSculptureEvents } from '../../helpers/sculptureEvents';
import { CategorySection } from './CategorySection';

/**
 * 03 — AI Art
 *
 * "Latent Bloom": a 5000-point cloud (1800 on tier ≤ 1) hallucinating
 * through a chain of seven SDF-sampled silhouettes — EYE, HAND,
 * BUTTERFLY, KEY, SKULL, "DREAM", BLOOM. Each silhouette is
 * canvas-rasterised at mount, sampled to a Float32Array of point
 * positions, then packed into a single (N × 7) DataTexture; the
 * vertex shader morphs between two consecutive targets per frame.
 *
 *   - Pointer velocity → morph speed multiplier. Slow cursor = slow
 *     dream, fast cursor = manic generation.
 *   - Click → freezes the morph mid-phase for ~220 ms and fires
 *     `aiGlitchAt`, consumed by PostFx as a chromatic-aberration burst.
 *   - Idle hum: low-frequency turbulence in vertex.
 *
 * Neon vaporwave palette (cyan ↔ magenta) — total break from paper/blood.
 */

const HIGH_COUNT = 5000;
const LOW_COUNT = 1800;
const TARGETS = 7;
const CANVAS = 256;

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

/* ─── silhouette draw functions ─────────────────────────────────────── */

const drawEye: DrawFn = (ctx) => {
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  // outer almond
  ctx.beginPath();
  ctx.ellipse(128, 128, 108, 56, 0, 0, Math.PI * 2);
  ctx.stroke();
  // iris
  ctx.beginPath();
  ctx.arc(128, 128, 38, 0, Math.PI * 2);
  ctx.stroke();
  // pupil (filled)
  ctx.beginPath();
  ctx.arc(128, 128, 14, 0, Math.PI * 2);
  ctx.fill();
};

const drawHand: DrawFn = (ctx) => {
  ctx.fillStyle = '#000';
  // palm
  ctx.fillRect(96, 128, 80, 90);
  // fingers
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(98 + i * 21, 60, 14, 80);
  }
  // thumb
  ctx.save();
  ctx.translate(96, 150);
  ctx.rotate(-0.6);
  ctx.fillRect(-30, -10, 38, 18);
  ctx.restore();
};

const drawButterfly: DrawFn = (ctx) => {
  ctx.fillStyle = '#000';
  // body
  ctx.fillRect(124, 80, 8, 100);
  // upper wings
  ctx.beginPath();
  ctx.ellipse(82, 105, 50, 38, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(174, 105, 50, 38, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // lower wings
  ctx.beginPath();
  ctx.ellipse(94, 168, 36, 30, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(162, 168, 36, 30, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // antennae (stroked)
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(128, 80);
  ctx.quadraticCurveTo(118, 60, 102, 50);
  ctx.moveTo(128, 80);
  ctx.quadraticCurveTo(138, 60, 154, 50);
  ctx.stroke();
};

const drawKey: DrawFn = (ctx) => {
  ctx.fillStyle = '#000';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#000';
  // bow
  ctx.beginPath();
  ctx.arc(80, 128, 38, 0, Math.PI * 2);
  ctx.stroke();
  // shaft
  ctx.fillRect(118, 120, 100, 16);
  // teeth
  ctx.fillRect(180, 136, 12, 22);
  ctx.fillRect(204, 136, 10, 16);
};

const drawSkull: DrawFn = (ctx) => {
  ctx.fillStyle = '#000';
  // cranium
  ctx.beginPath();
  ctx.arc(128, 110, 76, 0, Math.PI * 2);
  ctx.fill();
  // jaw
  ctx.fillRect(82, 168, 92, 38);
  // eye sockets (cut out)
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(102, 110, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(154, 110, 22, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ctx.beginPath();
  ctx.moveTo(128, 130);
  ctx.lineTo(120, 154);
  ctx.lineTo(136, 154);
  ctx.closePath();
  ctx.fill();
  // teeth gaps
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(86 + i * 14, 178, 4, 22);
  }
  ctx.globalCompositeOperation = 'source-over';
};

const drawDream: DrawFn = (ctx) => {
  ctx.fillStyle = '#000';
  ctx.font = '900 70px "Helvetica Neue", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DREAM', 128, 128);
};

const drawBloom: DrawFn = (ctx) => {
  ctx.fillStyle = '#000';
  // 5 petals
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.save();
    ctx.translate(128 + Math.cos(a) * 50, 128 + Math.sin(a) * 50);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // center
  ctx.beginPath();
  ctx.arc(128, 128, 24, 0, Math.PI * 2);
  ctx.fill();
};

const SHAPES: DrawFn[] = [drawEye, drawHand, drawButterfly, drawKey, drawSkull, drawDream, drawBloom];

/* ─── point sampling ─────────────────────────────────────────────────── */

function sampleSilhouette(draw: DrawFn, n: number): Float32Array {
  const c = document.createElement('canvas');
  c.width = c.height = CANVAS;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, CANVAS, CANVAS);
  draw(ctx);
  const img = ctx.getImageData(0, 0, CANVAS, CANVAS).data;
  const points = new Float32Array(n * 3);
  let i = 0;
  let attempts = 0;
  const maxAttempts = n * 400;
  while (i < n && attempts < maxAttempts) {
    attempts++;
    const px = Math.floor(Math.random() * CANVAS);
    const py = Math.floor(Math.random() * CANVAS);
    const idx = (py * CANVAS + px) * 4;
    if (img[idx] < 60) {
      // map to [-1.6, 1.6] in xy, small z jitter; flip y because canvas y is down.
      points[i * 3 + 0] = (px / CANVAS - 0.5) * 3.2;
      points[i * 3 + 1] = -(py / CANVAS - 0.5) * 3.2;
      points[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      i++;
    }
  }
  // If we didn't fill (degenerate shape), pad with last value.
  while (i < n) {
    points[i * 3 + 0] = 0;
    points[i * 3 + 1] = 0;
    points[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    i++;
  }
  return points;
}

/* ─── shaders ────────────────────────────────────────────────────────── */

const VERT = /* glsl */ `
  uniform sampler2D uTargets;
  uniform float uTargetCount;
  uniform float uPCount;
  uniform float uPhase;
  uniform float uTime;
  uniform float uFreeze;
  attribute float aIdx;
  attribute float aSeed;
  varying float vSeed;
  varying float vPhaseFrac;

  void main() {
    vSeed = aSeed;
    float ti = floor(uPhase);
    float tf = fract(uPhase);
    vPhaseFrac = tf;
    float idxA = mod(ti, uTargetCount);
    float idxB = mod(ti + 1.0, uTargetCount);
    vec2 uvA = vec2((aIdx + 0.5) / uPCount, (idxA + 0.5) / uTargetCount);
    vec2 uvB = vec2((aIdx + 0.5) / uPCount, (idxB + 0.5) / uTargetCount);
    vec3 A = texture2D(uTargets, uvA).rgb;
    vec3 B = texture2D(uTargets, uvB).rgb;
    vec3 p = mix(A, B, smoothstep(0.0, 1.0, tf));

    // Idle turbulence — quietened during freeze.
    float t = uTime * 0.5 + aSeed * 6.2831;
    p += vec3(sin(t * 0.7), cos(t * 1.1), sin(t * 0.5)) * 0.04 * (1.0 - uFreeze * 0.85);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = mix(1.4, 3.6, aSeed) * (220.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float vSeed;
  varying float vPhaseFrac;
  uniform float uTime;
  uniform float uFreeze;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);

    // Neon vaporwave: cyan ↔ magenta by seed; subtle phase tint.
    vec3 cyan = vec3(0.20, 0.95, 1.00);
    vec3 magenta = vec3(1.00, 0.15, 0.85);
    vec3 col = mix(cyan, magenta, smoothstep(0.25, 0.75, vSeed));
    // hot edge during morph crossover (around tf=0.5 where shapes are most ambiguous)
    float morphHeat = 1.0 - abs(vPhaseFrac - 0.5) * 2.0;
    col += vec3(1.0, 0.4, 0.9) * morphHeat * 0.18;
    // shimmer
    col += 0.18 * vec3(1.0) * pow(0.5 + 0.5 * sin(uTime * 5.0 + vSeed * 32.0), 10.0);
    // freeze tint — push toward white when frozen
    col = mix(col, vec3(1.0), uFreeze * 0.35);

    gl_FragColor = vec4(col, a * 0.92);
  }
`;

/* ─── component ──────────────────────────────────────────────────────── */

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
      <LatentBloom
        count={profile.isLowPower ? LOW_COUNT : HIGH_COUNT}
        visibility={visibility}
      />
    </CategorySection>
  );
}

interface BloomProps {
  count: number;
  visibility: () => number;
}

function LatentBloom({ count, visibility }: BloomProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const fire = useSculptureEvents((s) => s.fire);
  const pointerVel = usePointerVelocity();
  const phaseRef = useRef(0);

  const { geometry, material, dataTex } = useMemo(() => {
    // 1) Bake all 7 silhouette point sets.
    const targets = SHAPES.map((s) => sampleSilhouette(s, count));

    // 2) Pack into (count × TARGETS) RGBA Float32 texture (RGB = position, A = 1).
    const data = new Float32Array(count * TARGETS * 4);
    for (let t = 0; t < TARGETS; t++) {
      const arr = targets[t];
      for (let i = 0; i < count; i++) {
        const dst = (t * count + i) * 4;
        data[dst + 0] = arr[i * 3 + 0];
        data[dst + 1] = arr[i * 3 + 1];
        data[dst + 2] = arr[i * 3 + 2];
        data[dst + 3] = 1;
      }
    }
    const tex = new THREE.DataTexture(data, count, TARGETS, THREE.RGBAFormat, THREE.FloatType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;

    // 3) Geometry — a placeholder position attribute (unused) plus aIdx and aSeed.
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3); // zeros; vertex shader ignores
    const idx = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      idx[i] = i;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aIdx', new THREE.BufferAttribute(idx, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTargets: { value: tex },
        uTargetCount: { value: TARGETS },
        uPCount: { value: count },
        uPhase: { value: 0 },
        uTime: { value: 0 },
        uFreeze: { value: 0 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });

    return { geometry: g, material: m, dataTex: tex };
  }, [count]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      dataTex.dispose();
    };
  }, [geometry, material, dataTex]);

  useFrame((_state, dt) => {
    const v = visibility();
    const pts = pointsRef.current;
    if (!pts) return;
    if (v < 0.005) {
      pts.visible = false;
      return;
    }
    pts.visible = true;

    // Pointer-velocity → morph speed.
    const pv = pointerVel(dt);

    // Freeze envelope from event timestamp.
    const ev = useSculptureEvents.getState();
    let freeze = 0;
    if (ev.aiGlitchAt > 0) {
      const since = performance.now() / 1000 - ev.aiGlitchAt;
      const dur = 0.22;
      if (since >= 0 && since <= dur) {
        freeze = since < 0.04 ? since / 0.04 : 1 - (since - 0.04) / (dur - 0.04);
      }
    }

    const baseSpeed = 0.07;
    const speed = (baseSpeed + Math.min(pv, 5.0) * 0.18) * (1 - freeze);
    phaseRef.current += speed * dt;

    const u = material.uniforms;
    u.uPhase.value = phaseRef.current;
    (u.uTime.value as number) += dt;
    u.uFreeze.value = freeze;

    pts.rotation.y += dt * 0.06;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onClick={(e) => {
        e.stopPropagation();
        fire('aiGlitchAt');
      }}
    />
  );
}

export default AIArt;
