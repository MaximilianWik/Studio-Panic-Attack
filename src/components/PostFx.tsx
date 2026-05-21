import { EffectComposer, Vignette, BrightnessContrast } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useDeviceProfile } from '../helpers/useDeviceProfile';

export function PostFx() {
  const profile = useDeviceProfile();
  if (profile.isLowPower) return null;

  return (
    <EffectComposer multisampling={0} enabled>
      <BrightnessContrast brightness={0.0} contrast={0.04} />
      <Vignette eskil={false} offset={0.18} darkness={0.65} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

export default PostFx;
