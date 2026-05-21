import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ChromaticAberrationEffect } from 'postprocessing';
import { useScrollVelocity } from '../helpers/useScrollSection';

interface PostFxProps {
  /** Disable expensive passes on low-power devices. */
  reduced?: boolean;
}

/**
 * Post-processing pipeline. Bloom + vignette + chromatic aberration + noise.
 *
 * Chromatic aberration intensity is coupled to scroll velocity — fast
 * scrolling pushes the channels apart, like a film camera being whipped.
 * On low-power devices we drop bloom and CA entirely.
 */
export function PostFx({ reduced = false }: PostFxProps) {
  const caRef = useRef<ChromaticAberrationEffect | null>(null);
  const velocity = useScrollVelocity();
  const targetOffset = useRef(new THREE.Vector2(0.0008, 0.0008));

  useFrame(() => {
    if (!caRef.current) return;
    const v = Math.min(0.012, Math.abs(velocity.current) * 0.0008 + 0.0008);
    targetOffset.current.set(v, v);
    // smoothly track the target — postprocessing's offset uses a Vector2
    const o = caRef.current.offset as unknown as THREE.Vector2 | undefined;
    if (o && typeof o.lerp === 'function') {
      o.lerp(targetOffset.current, 0.15);
    }
  });

  if (reduced) {
    return (
      <EffectComposer multisampling={0}>
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
        <Noise opacity={0.04} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.2}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        offset={[0.0008, 0.0008] as unknown as THREE.Vector2}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
