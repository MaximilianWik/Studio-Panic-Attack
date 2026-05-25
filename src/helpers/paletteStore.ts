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
  /**
   * Five-stop colour list.
   * - For `type === 'mesh'` (default): passed straight to <MeshGradient colors>.
   * - For `type === 'whiteboard'`: colours[3]/[4] drive the nav swatch only.
   */
  colors: [string, string, string, string, string];
  /**
   * Background renderer to use.
   * - `'mesh'` (default when absent): animated MeshGradient shader.
   * - `'whiteboard'`: CSS cross-grid pattern on a light background.
   */
  type?: 'mesh' | 'whiteboard';
}

/**
 * Five-stop format mirrors the original: ink → smoke → muted accent
 * → mid accent → bright accent. Keep the first two near-black so the
 * page edges stay grounded; the last three carry the hue.
 *
 * WHITEBOARD is index 0 — the default. All mesh-gradient palettes
 * follow and remain fully accessible via the palette cycle button.
 */
export const PALETTES: Palette[] = [
  // Default — whiteboard cross-grid (light background)
  { id: 'GRID', type: 'whiteboard', colors: ['#fafafa', '#f0f0f0', '#e0e0e0', '#d4d4d4', '#a0a0a0'] },
  // Mesh-gradient colourways
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
  return 0; // Always start on GRID (index 0)
}

function persist(idx: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, String(idx));
  } catch {
    /* ignore */
  }
}

export const usePalette = create<PaletteState>((set, get) => ({  idx: readInitial(),
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

/** Returns true when the active palette uses the whiteboard renderer. */
export function useIsWhiteboard(): boolean {
  return usePalette((s) => PALETTES[s.idx].type === 'whiteboard');
}
