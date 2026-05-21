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
        <Vignette eskil={false} offset={0.3} darkness={0.35} />
        <Noise opacity={0.05} blendFunction={BlendFunction.MULTIPLY} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      {/* On a light bg, only super-bright highlights should bloom — keep
          threshold high and intensity low so the page stays crisp. */}
      <Bloom
        intensity={0.18}
        luminanceThreshold={0.95}
        luminanceSmoothing={0.15}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        offset={[0.0006, 0.0006] as unknown as THREE.Vector2}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.35} darkness={0.4} />
      <Noise opacity={0.045} blendFunction={BlendFunction.MULTIPLY} />
    </EffectComposer>
  );
}
