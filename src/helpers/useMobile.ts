import { useEffect, useState } from 'react';
import { getGPUTier } from 'detect-gpu';

export interface DeviceProfile {
  /** True for phones, tablets, and underpowered laptops. */
  isLowPower: boolean;
  /** True for touch-only devices. */
  isTouch: boolean;
  /** 0 = unknown / very low, 3 = high. From detect-gpu. */
  gpuTier: number;
  /** Convenience flag to gate post-processing and heavy shaders. */
  reduceEffects: boolean;
}

const DEFAULT_PROFILE: DeviceProfile = {
  isLowPower: false,
  isTouch: false,
  gpuTier: 3,
  reduceEffects: false,
};

/**
 * Detects device capability once on mount. Used to gate heavy effects.
 *
 * We deliberately return a single profile (no responsive resize handling)
 * because the things this controls — particle counts, post chain — should
 * not change mid-session.
 */
export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const isTouch = matchMedia('(pointer: coarse)').matches;
      const cores = navigator.hardwareConcurrency ?? 4;

      let gpuTier = 3;
      try {
        const tier = await getGPUTier();
        gpuTier = tier.tier;
      } catch {
        // detect-gpu can fail in headless / locked-down browsers; fall back to
        // a conservative tier based on cores + touch.
        gpuTier = isTouch ? 1 : cores >= 8 ? 3 : 2;
      }

      const isLowPower = gpuTier <= 1 || (isTouch && gpuTier <= 2);
      const reduceEffects = isLowPower;

      if (!cancelled) {
        setProfile({ isLowPower, isTouch, gpuTier, reduceEffects });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}
