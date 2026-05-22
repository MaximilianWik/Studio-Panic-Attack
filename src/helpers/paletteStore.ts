import { create } from 'zustand';

/**
 * Palette override for the site's `MeshGradient` backdrop.
 * Lets the design pass try out different colourways live without
 * code edits.
 *
 * Persists to localStorage so a refresh keeps the chosen palette.
 */

export interface Palette {
  /** Short uppercase label rendered in the nav button. */
  id: string;
  /** Five-stop colour list passed straight to <MeshGradient colors>. */
  colors: [string, string, string, string, string];
}

/**
 * Five-stop format mirrors the original: ink → smoke → muted accent
 * → mid accent → bright accent. Keep the first two near-black so the
 * page edges stay grounded; the last three carry the hue.
 */
export const PALETTES: Palette[] = [
  // Default — the current site
  { id: 'BLOOD',  colors: ['#050505', '#0a0a0a', '#1a0606', '#3a0a04', '#d30000'] },
  { id: 'OCEAN',  colors: ['#050505', '#0a0a0a', '#06141a', '#04203a', '#0066d3'] },
  { id: 'AMBER',  colors: ['#050505', '#0a0a0a', '#1a1306', '#3a2a04', '#d39000'] },
  { id: 'MOSS',   colors: ['#050505', '#0a0a0a', '#06140a', '#043a14', '#00d345'] },
  { id: 'VIOLET', colors: ['#050505', '#0a0a0a', '#0e061a', '#220438', '#7c00d3'] },
  { id: 'BUBBLEGUM',  colors: ['#050505', '#0a0a0a', '#1a0612', '#3a0420', '#d3007a'] },
  { id: 'CYAN',   colors: ['#050505', '#0a0a0a', '#06181a', '#04323a', '#00d3c8'] },
  { id: 'INK',    colors: ['#050505', '#0a0a0a', '#1a1a1a', '#3a3a3a', '#888888'] },
];

interface PaletteState {
  /** Index into PALETTES. */
  idx: number;
  /** Convenience getter — current palette object. */
  current: () => Palette;
  set: (idx: number) => void;
  cycle: () => void;
}

const KEY = 'spa-palette';

function readInitial(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(KEY);
    const n = raw == null ? 0 : Number(raw);
    if (Number.isInteger(n) && n >= 0 && n < PALETTES.length) return n;
    return 0;
  } catch {
    return 0;
  }
}

function persist(idx: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, String(idx));
  } catch {
    /* ignore */
  }
}

export const usePalette = create<PaletteState>((set, get) => ({
  idx: readInitial(),
  current: () => PALETTES[get().idx],
  set: (idx) => {
    const clamped = ((idx % PALETTES.length) + PALETTES.length) % PALETTES.length;
    persist(clamped);
    set({ idx: clamped });
  },
  cycle: () => {
    const next = (get().idx + 1) % PALETTES.length;
    persist(next);
    set({ idx: next });
  },
}));
