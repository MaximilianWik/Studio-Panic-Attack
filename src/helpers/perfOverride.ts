import { create } from 'zustand';

/**
 * Manual performance-tier override. When set to anything other than
 * 'auto', `useDeviceProfile` returns this value instead of the
 * detect-gpu result, letting you preview the low-power code paths
 * (Hedgehog spike count, MeshReflector blur, postprocessing on/off,
 * DPR, antialias, etc.) on a beefy desktop.
 *
 * Persisted to localStorage so the chosen tier survives a refresh.
 */
export type PerfTier = 0 | 1 | 2 | 3;
export type PerfOverride = 'auto' | PerfTier;

interface PerfOverrideState {
  value: PerfOverride;
  set: (v: PerfOverride) => void;
  cycle: () => void;
}

const KEY = 'spa-perf-override';
const ORDER: PerfOverride[] = ['auto', 0, 1, 2, 3];

function readInitial(): PerfOverride {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === '0' || raw === '1' || raw === '2' || raw === '3') {
      return Number(raw) as PerfTier;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

function persist(v: PerfOverride) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, String(v));
  } catch {
    /* ignore */
  }
}

export const usePerfOverride = create<PerfOverrideState>((set, get) => ({
  value: readInitial(),
  set: (v) => {
    persist(v);
    set({ value: v });
  },
  cycle: () => {
    const idx = ORDER.indexOf(get().value);
    const next = ORDER[(idx + 1) % ORDER.length];
    persist(next);
    set({ value: next });
  },
}));
