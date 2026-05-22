/**
 * assetUrl — route image fetches through images.weserv.nl in production
 * so they're served as resized WebP, not as the original 5–17 MB PNGs.
 *
 * Why a runtime CDN proxy?
 *   The /landing/ source images are committed at full resolution. We can't
 *   install image-processing tooling locally (corp laptop), so we let the
 *   weserv.nl free image CDN do the resize + WebP transcode on demand and
 *   cache it at their edge. First request is slow, every subsequent
 *   request is hot from their CDN.
 *
 * Dev vs prod:
 *   - In dev (`vite`) the local origin is localhost — weserv can't reach it,
 *     so we return the local path unchanged. Devtools network tab shows
 *     full-size originals; that's fine in dev.
 *   - In prod, source URL is rooted at the *current* deploy origin
 *     (window.location.host). That makes the proxy work on the canonical
 *     Vercel URL, on Vercel preview deploys, and on any future custom
 *     domain — no hardcoded host to keep in sync.
 *
 * CORS:
 *   weserv responds with `Access-Control-Allow-Origin: *`, and three.js'
 *   TextureLoader sets `crossOrigin = 'anonymous'` by default, so r3f's
 *   `useTexture` works with these URLs without extra config.
 */

const PROXY = 'https://images.weserv.nl/';

export interface AssetUrlOpts {
  /** target longest edge (px). Defaults to 2000. */
  width?: number;
  /** WebP quality 1–100. Defaults to 82. */
  quality?: number;
}

function currentHost(): string {
  if (typeof window === 'undefined') return '';
  return window.location.host;
}

/**
 * Convert a `/landing/foo.png` path into a weserv-proxied WebP URL in prod,
 * or return it unchanged in dev. Pass through anything that's not an
 * /landing/ path (e.g. /logo/*) — the logo already loads fine at its native
 * size.
 */
export function assetUrl(path: string, opts: AssetUrlOpts = {}): string {
  if (import.meta.env.DEV) return path;
  if (!path.startsWith('/landing/')) return path;

  const host = currentHost();
  // Defensive: if for any reason we can't get a host (SSR / edge cases),
  // skip the proxy and serve the original. Better a slow image than a 404.
  if (!host) return path;

  const w = opts.width ?? 2000;
  const q = opts.quality ?? 82;

  // Build the query string by hand (rather than URLSearchParams) so we
  // keep `/` characters un-encoded in the source URL — weserv accepts
  // both but consistent encoding makes the URL easier to read and debug.
  const src = host + path;
  return PROXY + '?url=' + src + '&w=' + w + '&output=webp&q=' + q + '&we=1';
}
