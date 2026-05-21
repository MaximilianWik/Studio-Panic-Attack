import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';

import { useScrollVelocity } from '../helpers/useScrollVelocity';
import { useDeviceProfile } from '../helpers/useDeviceProfile';

/**
 * One global postprocessing pipeline, scroll-velocity modulated.
 *
 *   Bloom (mild, low threshold)              ─ tier ≥ 2
 *   ChromaticAberration (velocity-driven)    ─ tier ≥ 2
 *   Vignette (constant subtle)
 *   Noise (very low filmic grain)
 *
 * On tier ≤ 1 we strip the bloom + chromatic aberration entirely.
 */
export function PostFx() {
  const profile = useDeviceProfile();
  const tickVel = useScrollVelocity();
  // Stable Vector2 we mutate each frame — react-three/postprocessing
  // forwards this directly to the effect instance.
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  useFrame((_, dt) => {
    const v = tickVel(dt);
    const amount = Math.min(0.0008 + v * 0.012, 0.005);
    caOffset.set(amount, amount);
  });

  if (profile.isLowPower) {
    return (
      <EffectComposer multisampling={0} enabled>
        <Vignette
          eskil={false}
          offset={0.18}
          darkness={0.55}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={2} enabled>
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.7}
        mipmapBlur
      />
      <ChromaticAberration
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette
        eskil={false}
        offset={0.18}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

export default PostFx;
