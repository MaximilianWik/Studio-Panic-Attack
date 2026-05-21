import { create } from 'zustand';

/**
 * Sculpture event bus.
 *
 * Each click-driven post-fx event writes its current timestamp here.
 * PostFx polls these in useFrame to decay one-shot effects.
 *
 * Timestamps are wall-clock seconds (performance.now() / 1000) — using
 * the same clock everywhere lets PostFx compute decay without coupling
 * to r3f's internal clock.
 */
interface SculptureEvents {
  /** 02 — 3D Art chrome lens (torus-knot) */
  knifeSlashAt: number;
  /** 04 — UX Design Hedgehog click pulse */
  hedgehogPulseAt: number;
  fire: (key: keyof Omit<SculptureEvents, 'fire'>) => void;
}

export const useSculptureEvents = create<SculptureEvents>((set) => ({
  knifeSlashAt: -1,
  hedgehogPulseAt: -1,
  fire: (key) => set({ [key]: performance.now() / 1000 } as Partial<SculptureEvents>),
}));

/**
 * Read-only snapshot. Use inside useFrame: getEvents() returns the
 * current state without subscribing the component to re-renders.
 */
export function getEvents() {
  return useSculptureEvents.getState();
}

/**
 * Standard one-shot decay envelope: 1 → 0 over `dur` seconds, 0 if the
 * event never fired or has elapsed.
 */
export function decay(at: number, dur: number): number {
  if (at < 0) return 0;
  const t = performance.now() / 1000 - at;
  if (t < 0 || t > dur) return 0;
  return 1 - t / dur;
}
