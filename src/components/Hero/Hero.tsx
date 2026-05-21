import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';

/**
 * Hero — WebGL layer. Sits in front of the DOM mesh-gradient backdrop
 * (which is rendered behind the canvas) and adds:
 *   - a slow-drifting starfield of dust / debris particles
 *   - a soft tonal vignette ring that pulses with the music of the page
 *
 * The brand-mark text itself lives in HeroOverlay (DOM) so it is fully
 * present before any WebGL is ready. We never block on this.
 */

const DUST_COUNT = 480;

export function Hero() {
  const points = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const visibility = useSectionVisibility('hero');
  const yPos = getSectionWorldY('hero');

  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(DUST_COUNT * 3);
    const seed = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      // shallow shell around the camera
      const r = 1.2 + Math.random() * 4.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 1.4;
      pos[i * 3 + 0] = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * r * 0.55;
      pos[i * 3 + 2] = Math.sin(theta) * r * 0.65 - 0.5;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const dustMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.55 },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        varying float vSeed;
        uniform float uTime;
        void main() {
          vSeed = aSeed;
          vec3 p = position;
          // gentle parallax drift
          p.x += sin(uTime * 0.18 + aSeed * 6.28) * 0.08;
          p.y += cos(uTime * 0.13 + aSeed * 6.28) * 0.06;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = mix(0.6, 2.4, aSeed);
          gl_PointSize = size * (260.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying float vSeed;
        uniform float uOpacity;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d);
          a *= mix(0.4, 1.0, vSeed);
          vec3 col = mix(vec3(0.93, 0.92, 0.88), vec3(0.83, 0.05, 0.05), step(0.92, vSeed));
          gl_FragColor = vec4(col, a * uOpacity);
        }
      `,
    });
  }, []);

  const ringMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uVis: { value: 1 },
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
        uniform float uTime;
        uniform float uVis;
        void main() {
          vec2 p = vUv - 0.5;
          float d = length(p);
          // soft red vignette ring
          float ring = smoothstep(0.55, 0.18, d) * smoothstep(0.0, 0.18, d);
          float pulse = 0.5 + 0.5 * sin(uTime * 0.6);
          vec3 col = vec3(0.83, 0.0, 0.0) * (0.18 + 0.22 * pulse) * ring;
          // outer fade to fully transparent
          float outer = smoothstep(0.5, 0.35, d);
          gl_FragColor = vec4(col, ring * outer * uVis * 0.8);
        }
      `,
    });
  }, []);

  useFrame((_, dt) => {
    const v = visibility();
    if (points.current) {
      points.current.visible = v > 0.01;
    }
    if (ringRef.current) {
      ringRef.current.visible = v > 0.01;
    }
    if (v < 0.01) return;
    if (dustMat) (dustMat.uniforms.uTime.value as number) += dt;
    if (ringMat) {
      (ringMat.uniforms.uTime.value as number) += dt;
      ringMat.uniforms.uVis.value = v;
    }
    if (points.current) {
      points.current.rotation.y += dt * 0.02;
    }
  });

  return (
    <group position={[0, yPos, 0]}>
      {/* additive dust */}
      <points ref={points} geometry={dustGeo} material={dustMat} />

      {/* soft red vignette ring behind brand mark */}
      <mesh ref={ringRef} position={[0, 0, -1.5]} material={ringMat}>
        <planeGeometry args={[12, 7, 1, 1]} />
      </mesh>
    </group>
  );
}

export default Hero;
