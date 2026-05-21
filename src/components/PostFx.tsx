import { EffectComposer, Vignette, BrightnessContrast } from '@react-three/postprocessing';
import {
  BlendFunction,
  ChromaticAberrationEffect,
  NoiseEffect,
} from 'postprocessing';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Vector2 } from 'three';
import { useDeviceProfile } from '../helpers/useDeviceProfile';
import { decay, useSculptureEvents } from '../helpers/sculptureEvents';

/**
 * Post-processing chain.
 *
 * Static effects: brightness/contrast + vignette.
 * Transient effects driven by sculpture click events:
 *   - ChromaticAberration: 02 chrome lens slash
 *   - Noise: 04 hedgehog pulse
 *
 * Each transient is decayed in useFrame from the event timestamp.
 * Effects are constructed manually with `useMemo` and inserted via
 * <primitive> so we can mutate `offset` and `blendMode.opacity.value`
 * directly without going through the drei wrapper's prop-diffing.
 */
export function PostFx() {
  const profile = useDeviceProfile();

  const ca = useMemo(
    () =>
      new ChromaticAberrationEffect({
        blendFunction: BlendFunction.NORMAL,
        offset: new Vector2(0, 0),
        radialModulation: false,
        modulationOffset: 0,
      }),
    [],
  );

  const noise = useMemo(() => {
    const e = new NoiseEffect({
      blendFunction: BlendFunction.SCREEN,
      premultiply: true,
    });
    e.blendMode.opacity.value = 0;
    return e;
  }, []);

  useEffect(() => {
    return () => {
      ca.dispose();
      noise.dispose();
    };
  }, [ca, noise]);

  useFrame(() => {
    if (profile.isLowPower) return;
    const ev = useSculptureEvents.getState();

    const knife = decay(ev.knifeSlashAt, 0.4);
    ca.offset.set(knife * 0.014, knife * 0.014 * 0.6);

    const hh = decay(ev.hedgehogPulseAt, 0.25);
    noise.blendMode.opacity.value = hh * 0.55;
  });

  if (profile.isLowPower) return null;

  return (
    <EffectComposer multisampling={0} enabled>
      <BrightnessContrast brightness={0.0} contrast={0.04} />
      <primitive object={ca} />
      <primitive object={noise} />
      <Vignette eskil={false} offset={0.18} darkness={0.65} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

export default PostFx;
