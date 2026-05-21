import { useEffect, useState } from 'react';
import { getGPUTier, type TierResult } from 'detect-gpu';

export interface DeviceProfile {
  /** detect-gpu tier, 0..3. 0 = blacklisted/unknown, 3 = top. */
  tier: 0 | 1 | 2 | 3;
  /** true = mobile or fallback CPU device */
  mobile: boolean;
  /** convenience: tier <= 1 */
  isLowPower: boolean;
  /** ready === false on first render until detection completes */
  ready: boolean;
}

const DEFAULT: DeviceProfile = {
  tier: 2,
  mobile: false,
  isLowPower: false,
  ready: false,
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
    };
    return cached;
  })();
  return pending;
}

/**
 * Synchronous-default device profile. Returns a sensible default on first
 * frame (tier 2, not low power) so the hero never blocks on detection,
 * then upgrades to the real value once detect-gpu resolves.
 */
export function useDeviceProfile(): DeviceProfile {
  const [p, setP] = useState<DeviceProfile>(cached ?? DEFAULT);
  useEffect(() => {
    let alive = true;
    detect().then((r) => {
      if (alive) setP(r);
    });
    return () => {
      alive = false;
    };
  }, []);
  return p;
}
