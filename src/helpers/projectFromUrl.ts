/**
 * Map any image URL back to the project it belongs to.
 *
 * URLs in the manifest carry the originating folder in the path:
 *   /2.%20Projects/3.%203D/cemetery-scene1.png
 *                  ^^^^^^^^
 * We decode that segment and look up the matching `Project` slug + title.
 *
 * Used by the lightbox to show a "View project →" link when an image was
 * opened from the home-page Gallery / ScatteredImages pool — so anywhere a
 * portfolio image is clicked, the user can jump straight to that project's
 * board with one click.
 */
import { PROJECTS } from '../config/projects';

const FOLDER_TO_PROJECT = new Map<string, { slug: string; title: string }>(
  PROJECTS.map((p) => [p.folder, { slug: p.slug, title: p.title }]),
);

/**
 * Extract the project folder name from a URL like
 * `/2.%20Projects/3.%203D/foo.png`. Returns null when the URL doesn't sit
 * inside `/2. Projects/<folder>/`.
 *
 * Handles both encoded (`%20`) and decoded (` `) forms — the manifest
 * always emits `%20` but caller code occasionally hands us already-decoded
 * paths, e.g. after manual concatenation.
 */
function folderFromUrl(url: string): string | null {
  if (!url) return null;
  let path = url;
  // Strip query / hash so they don't pollute the segment match.
  path = path.replace(/[?#].*$/, '');

  // Decode percent-escapes once. We don't care about double-decoding edge
  // cases — manifest URLs use a controlled set of escaped chars.
  let decoded: string;
  try { decoded = decodeURIComponent(path); }
  catch { decoded = path; }

  // Match `/2. Projects/<folder>/...`. The leading slash is optional so
  // relative URLs work too. The `2. Projects` literal must match exactly
  // — that's the on-disk root for every project board.
  const m = decoded.match(/(?:^|\/)2\. Projects\/([^/]+)\//);
  return m?.[1] ?? null;
}

export interface ProjectLink {
  slug: string;
  title: string;
  href: string;
}

/**
 * Resolve a `ProjectLink` for the given URL, or null when the URL doesn't
 * map to a known project (e.g. `/landing/*`, `/3. Highlights/*`, `/logo/*`).
 */
export function projectFromUrl(url: string): ProjectLink | null {
  const folder = folderFromUrl(url);
  if (!folder) return null;
  const proj = FOLDER_TO_PROJECT.get(folder);
  if (!proj) return null;
  return {
    slug: proj.slug,
    title: proj.title,
    href: '/projects/' + proj.slug,
  };
}
