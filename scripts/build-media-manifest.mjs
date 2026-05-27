#!/usr/bin/env node
/**
 * Scans public/ and emits src/generated/mediaManifest.ts — the single source
 * of truth for which images/videos exist in each project folder, plus the
 * highlights/about/vocab/contact assets.
 *
 * URLs are emitted with proper percent-encoding for the spaces and special
 * characters in the source folder names (e.g. "2. Projects/11. UX`UI/...").
 *
 * For each raster image asset, the optimizer (scripts/optimize-public-assets.mjs)
 * may have produced sibling files:
 *   <name>.480.webp / .1080.webp / .1920.webp   responsive WebP
 *   <name>.1080.avif                            modern fallback
 *   <name>.lqip.txt                             tiny blurred placeholder
 *
 * We probe for these on disk and emit per-asset srcset strings + lqip data
 * so the runtime <Img> can render <picture> with srcset without further
 * filesystem checks. If the siblings don't exist (optimize hasn't been run
 * yet), the asset falls back to a plain <img src=originalUrl>.
 *
 * Run via: npm run gen:manifest
 */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const OUT = join(ROOT, 'src', 'generated', 'mediaManifest.ts');

const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const RASTER_RE = /\.(jpe?g|png)$/i;
// .mov files are QuickTime containers — typically H.264 or HEVC. Chrome on
// Windows can play H.264 MOVs but not HEVC. We include them anyway: in the
// polaroid grid the <Vid> placeholder shows a film icon, and clicking opens
// the lightbox with a real <video controls> element. Unsupported codecs
// produce a visible "can't play" error inside the lightbox + download link
// instead of silently breaking.
const VID_EXT = new Set(['.mp4', '.webm', '.mov']);

const WEBP_WIDTHS = [480, 1080, 1920];
const AVIF_WIDTH = 1080;

function urlPath(absInsidePublic) {
  // Encode path segments for use in a URL src attribute.
  // We ONLY encode characters that are actually special in a URL path:
  //   space   → %20   (breaks the URL parser)
  //   #       → %23   (starts a fragment)
  //   ?       → %3F   (starts a query string)
  //   %       → %25   (already-encoded literals — prevent double-encoding)
  // Characters like & + , = ; : @ ( ) are valid in path segments per
  // RFC 3986 and do NOT need encoding. encodeURIComponent is too aggressive
  // and can confuse some browser URL parsers when used in src attributes.
  const rel = absInsidePublic.replace(/\\/g, '/');
  return '/' + rel.split('/').map((seg) =>
    seg
      .replace(/%/g, '%25')   // must be first
      .replace(/ /g, '%20')
      .replace(/#/g, '%23')
      .replace(/\?/g, '%3F')
  ).join('/');
}

async function listDir(dir) {
  try {
    const ents = await readdir(dir, { withFileTypes: true });
    return ents.filter((e) => e.isFile()).map((e) => e.name).sort((a, b) => a.localeCompare(b, 'en'));
  } catch {
    return [];
  }
}

async function listSubdirs(dir) {
  try {
    const ents = await readdir(dir, { withFileTypes: true });
    return ents.filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => {
      // Sort by leading number when present
      const an = parseInt(a, 10), bn = parseInt(b, 10);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.localeCompare(b, 'en');
    });
  } catch {
    return [];
  }
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

/**
 * Probe sibling optimized files for a raster image and return responsive
 * metadata (srcset strings + LQIP). Returns null if no siblings exist.
 */
async function readOptimized(absImagePath, urlBase) {
  if (!RASTER_RE.test(absImagePath)) return null;

  const baseAbs = absImagePath.replace(RASTER_RE, '');
  const baseUrl = urlBase.replace(RASTER_RE, '');

  // WebP srcset.
  const webpEntries = [];
  for (const w of WEBP_WIDTHS) {
    if (await exists(baseAbs + '.' + w + '.webp')) {
      webpEntries.push(`${baseUrl}.${w}.webp ${w}w`);
    }
  }

  // AVIF (single width).
  const avifAbs = baseAbs + '.' + AVIF_WIDTH + '.avif';
  const avif = (await exists(avifAbs)) ? `${baseUrl}.${AVIF_WIDTH}.avif ${AVIF_WIDTH}w` : null;

  // LQIP.
  let lqip = null;
  const lqipAbs = baseAbs + '.lqip.txt';
  if (await exists(lqipAbs)) {
    try {
      lqip = (await readFile(lqipAbs, 'utf8')).trim();
    } catch { /* ignore */ }
  }

  if (!webpEntries.length && !avif && !lqip) return null;
  return {
    webpSrcset: webpEntries.length ? webpEntries.join(', ') : null,
    avifSrcset: avif,
    lqip,
  };
}

async function toAsset(folderRel, filename) {
  const ext = extname(filename).toLowerCase();
  const isVid = VID_EXT.has(ext);
  const isImg = IMG_EXT.has(ext);
  if (!isVid && !isImg) return null;

  // Skip generated siblings — they're consumed via the optimized fields below,
  // not as standalone assets.
  if (filename.endsWith('.lqip.txt')) return null;
  if (filename.endsWith('.poster.jpg')) return null;
  // Generated WebP/AVIF siblings: pattern <name>.<width>.webp / .avif.
  if (/\.\d+\.(webp|avif)$/i.test(filename)) return null;

  const url = urlPath(folderRel + '/' + filename);
  const asset = {
    file: filename,
    url,
    type: isVid ? 'video' : 'image',
  };

  if (isImg && RASTER_RE.test(filename)) {
    const abs = join(PUBLIC_DIR, folderRel, filename);
    const opt = await readOptimized(abs, url);
    if (opt) {
      if (opt.webpSrcset) asset.webpSrcset = opt.webpSrcset;
      if (opt.avifSrcset) asset.avifSrcset = opt.avifSrcset;
      if (opt.lqip) asset.lqip = opt.lqip;
    }
  }

  return asset;
}

async function buildProjects() {
  const projectsRoot = '2. Projects';
  const folders = await listSubdirs(join(PUBLIC_DIR, projectsRoot));
  const out = [];
  for (const folder of folders) {
    const files = await listDir(join(PUBLIC_DIR, projectsRoot, folder));
    const assets = (await Promise.all(files.map((f) => toAsset(projectsRoot + '/' + folder, f)))).filter(Boolean);
    out.push({ folder, assets });
  }
  return out;
}

async function listSimple(rel) {
  const files = await listDir(join(PUBLIC_DIR, rel));
  return (await Promise.all(files.map((f) => toAsset(rel, f)))).filter(Boolean);
}

async function listLanding() {
  const files = await listDir(join(PUBLIC_DIR, 'landing'));
  return (await Promise.all(files.map((f) => toAsset('landing', f)))).filter(Boolean);
}

const projects = await buildProjects();
const highlights = await listSimple('3. Highlights');
const vocabulary = await listSimple('4. Vocabulary');
const about = await listSimple('5. About');
const contact = await listSimple('6. Contact');
const landing = await listLanding();

const optimizedCount = (() => {
  let n = 0;
  const all = [...highlights, ...vocabulary, ...about, ...contact, ...landing];
  for (const p of projects) all.push(...p.assets);
  for (const a of all) if (a.webpSrcset) n++;
  return n;
})();

const header = `// AUTO-GENERATED by scripts/build-media-manifest.mjs
// Do not edit by hand — re-run via \`npm run gen:manifest\`.
//
// Each entry's \`url\` is properly percent-encoded so it can be used directly
// in src/href attributes without further escaping.
//
// Optional fields populated when scripts/optimize-public-assets.mjs has run:
//   webpSrcset  — responsive WebP sources, comma-separated "<url> <w>w"
//   avifSrcset  — single-width AVIF source for modern browsers
//   lqip        — tiny base64 data-URL blurred placeholder

export interface MediaAsset {
  file: string;
  url: string;
  type: 'image' | 'video';
  webpSrcset?: string;
  avifSrcset?: string;
  lqip?: string;
}

export interface ProjectFolder {
  /** Disk folder name, e.g. "1. Events" */
  folder: string;
  assets: MediaAsset[];
}

`;

const body =
  'export const PROJECT_FOLDERS: ProjectFolder[] = ' + JSON.stringify(projects, null, 2) + ';\n\n' +
  'export const HIGHLIGHTS_ASSETS: MediaAsset[] = ' + JSON.stringify(highlights, null, 2) + ';\n\n' +
  'export const VOCABULARY_ASSETS: MediaAsset[] = ' + JSON.stringify(vocabulary, null, 2) + ';\n\n' +
  'export const ABOUT_ASSETS: MediaAsset[] = ' + JSON.stringify(about, null, 2) + ';\n\n' +
  'export const CONTACT_ASSETS: MediaAsset[] = ' + JSON.stringify(contact, null, 2) + ';\n\n' +
  'export const LANDING_ASSETS: MediaAsset[] = ' + JSON.stringify(landing, null, 2) + ';\n';

await mkdir(join(ROOT, 'src', 'generated'), { recursive: true });
await writeFile(OUT, header + body, 'utf8');
console.log('[manifest] wrote', OUT);
console.log('  projects:', projects.length, '— total assets:', projects.reduce((n, p) => n + p.assets.length, 0));
console.log('  highlights:', highlights.length);
console.log('  vocabulary:', vocabulary.length);
console.log('  about:', about.length);
console.log('  contact:', contact.length);
console.log('  landing:', landing.length);
console.log('  optimized assets (with srcset):', optimizedCount);
