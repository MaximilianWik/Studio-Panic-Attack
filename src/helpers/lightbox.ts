type Listener = (url: string | null) => void;
const LISTENERS = new Set<Listener>();
let _current: string | null = null;

export function openLightbox(url: string): void {
  _current = url;
  for (const l of LISTENERS) l(url);
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
