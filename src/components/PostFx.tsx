import {
  EffectComposer,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

interface PostFxProps {
  /** Disable expensive passes on low-power devices. */
  reduced?: boolean;
}

/**
 * Post-processing pipeline. Static effects only.
 *
 * Earlier versions held a ref to the ChromaticAberration effect so we
 * could couple aberration intensity to scroll velocity. That ref made
 * @react-three/postprocessing's children-key memoization choke on
 * `Converting circular structure to JSON` because effect instances
 * carry circular `parent`/`children` references. The dynamic effect was
 * a luxury — kept the API straight and the page rendering instead.
 *
 * On low-power devices we drop CA entirely.
 */
export function PostFx({ reduced = false }: PostFxProps) {
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
      <ChromaticAberration
        offset={new THREE.Vector2(0.0008, 0.0008)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.35} darkness={0.4} />
      <Noise opacity={0.045} blendFunction={BlendFunction.MULTIPLY} />
    </EffectComposer>
  );
}
