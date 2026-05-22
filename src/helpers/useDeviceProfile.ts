import { useEffect, useState } from 'react';
import { getGPUTier, type TierResult } from 'detect-gpu';

import { usePerfOverride } from './perfOverride';

export interface DeviceProfile {
  /** detect-gpu tier, 0..3. 0 = blacklisted/unknown, 3 = top. */
  tier: 0 | 1 | 2 | 3;
  /** true = mobile or fallback CPU device */
  mobile: boolean;
  /** convenience: tier <= 1 */
  isLowPower: boolean;
  /** ready === false on first render until detection completes */
  ready: boolean;
  /** true when the manual nav override is active (not 'auto') */
  overridden: boolean;
}

const DEFAULT: DeviceProfile = {
  tier: 2,
  mobile: false,
  isLowPower: false,
  ready: false,
  overridden: false,
};

let cached: DeviceProfile | null = null;
let pending: Promise<DeviceProfile> | null = null;

async function detect(): Promise<DeviceProfile> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async () => {
    let r: TierResult | null = null;
    try {
      r = await getGPUTier();
    } catch {
      r = null;
    }
    const tier = ((r?.tier ?? 2) as 0 | 1 | 2 | 3);
    const mobile = !!r?.isMobile;
    cached = {
      tier,
      mobile,
      isLowPower: tier <= 1 || mobile,
      ready: true,
      overridden: false,
    };
    return cached;
  })();
  return pending;
}

/**
 * Synchronous-default device profile. Returns a sensible default on first
 * frame (tier 2, not low power) so the hero never blocks on detection,
 * then upgrades to the real value once detect-gpu resolves.
 *
 * Honours the nav-bar performance override: when the user picks a
 * specific tier (0/1/2/3) instead of 'auto', this hook returns that
 * tier on every consumer so the whole site re-renders against the
 * forced tier (Hedgehog spike count, postprocessing, DPR, etc.).
 */
export function useDeviceProfile(): DeviceProfile {
  const [base, setBase] = useState<DeviceProfile>(cached ?? DEFAULT);
  const override = usePerfOverride((s) => s.value);

  useEffect(() => {
    let alive = true;
    detect().then((r) => {
      if (alive) setBase(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (override === 'auto') return base;

  // Manual override — keep `mobile` from the real detection so coarse-
  // pointer / touch fallbacks stay correct, but force tier + recompute
  // isLowPower from the override alone.
  return {
    tier: override,
    mobile: base.mobile,
    isLowPower: override <= 1,
    ready: true,
    overridden: true,
  };
}
