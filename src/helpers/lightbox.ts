/**
 * Tiny pubsub for the global lightbox. Any component can call
 * `openLightbox(url)` to surface that media in the floating overlay; an
 * optional second arg attaches a project hint so the overlay can render a
 * "View project →" link even when the URL itself doesn't sit under a
 * `/2. Projects/<folder>/` path (e.g. legacy /landing/* shots whose
 * project affiliation lives in code, not in the URL).
 */

export interface LightboxMeta {
  /** Project slug to link to (`/projects/<slug>`). */
  projectSlug?: string;
  /** Display title shown on the View-project pill. */
  projectTitle?: string;
}

export interface LightboxState {
  url: string;
  meta: LightboxMeta;
}

type Listener = (state: LightboxState | null) => void;
const LISTENERS = new Set<Listener>();
let _current: LightboxState | null = null;

export function openLightbox(url: string, meta: LightboxMeta = {}): void {
  _current = { url, meta };
  for (const l of LISTENERS) l(_current);
}

export function closeLightbox(): void {
  _current = null;
  for (const l of LISTENERS) l(null);
}

export function subscribeLightbox(cb: Listener): () => void {
  LISTENERS.add(cb);
  cb(_current);
  return () => { LISTENERS.delete(cb); };
}
