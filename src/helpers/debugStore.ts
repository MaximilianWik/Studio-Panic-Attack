import { create } from 'zustand';

/**
 * Debug overlay toggle. Persists to localStorage so a refresh
 * doesn't clobber the inspection state. Read by DebugOverlay,
 * NavHeader (toggle button), and per-component label render
 * branches (sculptures, scattered images, floating quote).
 */
interface DebugState {
  enabled: boolean;
  toggle: () => void;
  set: (v: boolean) => void;
}

const KEY = 'spa-debug';

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function writePersisted(v: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, v ? '1' : '0');
  } catch {
    /* private mode — no-op */
  }
}

export const useDebug = create<DebugState>((set, get) => ({
  enabled: readInitial(),
  toggle: () => {
    const next = !get().enabled;
    writePersisted(next);
    set({ enabled: next });
  },
  set: (v) => {
    writePersisted(v);
    set({ enabled: v });
  },
}));
