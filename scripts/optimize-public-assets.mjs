#!/usr/bin/env node
/**
 * Best-effort asset optimizer.
 *
 * For each raster image in `public/` ≥ 200 KB, emits siblings:
 *   <name>.480.webp   (q=78, polaroid grid)
 *   <name>.1080.webp  (q=78, lightbox)
 *   <name>.1920.webp  (q=78, full zoom)
 *   <name>.1080.avif  (q=50, modern browsers)
 *   <name>.lqip.txt   (8x12 base64 thumbnail)
 *
 * For .mp4, emits sibling `.webm` (vp9, crf=34) and `.poster.jpg` (frame at 1s).
 *
 * Soft-skips quietly when `sharp` or `ffmpeg` is missing — the site still
 * works with raw assets, just larger. Run with:
 *
 *     node scripts/optimize-public-assets.mjs
 *
 * Idempotent: skips files whose target already exists and is newer than the
 * source. Safe to run multiple times.
 */
import { readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const IMG_RE = /\.(jpe?g|png)$/i;
const MIN_BYTES = 200 * 1024;

/** Per-width target sizes for responsive WebP. */
const WEBP_WIDTHS = [480, 1080, 1920];
/** Single AVIF size (lightbox only — AVIF decode is slow on tiny polaroids). */
const AVIF_WIDTH = 1080;

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('[optimize] sharp not installed — image optimisation skipped.');
}

const ffmpegOk = await new Promise((res) => {
  const p = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
  p.on('error', () => res(false));
  p.on('exit', (code) => res(code === 0));
});
if (!ffmpegOk) {
  console.log('[optimize] ffmpeg not on PATH — video transcode skipped.');
}

async function* walk(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

async function newerThan(target, source) {
  try {
    const [t, s] = await Promise.all([stat(target), stat(source)]);
    return t.mtimeMs >= s.mtimeMs;
  } catch {
    return false;
  }
}

/**
 * Strip the original extension and append a suffix.
 *   "/foo/bar.PNG" + ".480.webp"  → "/foo/bar.480.webp"
 */
function withSuffix(file, suffix) {
  return file.replace(IMG_RE, suffix);
}

async function optimiseImage(file) {
  if (!sharp) return;
  const sz = (await stat(file)).size;
  if (sz < MIN_BYTES) return;

  // Read source metadata once so we can skip up-scaling.
  let meta;
  try {
    meta = await sharp(file).metadata();
  } catch (e) {
    console.warn('[optimize] metadata fail', file, e.message);
    return;
  }
  const srcW = meta.width || 0;

  // WebP at each target width (only if we'd actually downscale). For very
  // small sources, only emit a single full-res .webp.
  for (const w of WEBP_WIDTHS) {
    if (srcW > 0 && w > srcW * 1.05) continue; // skip up-scale
    const out = withSuffix(file, `.${w}.webp`);
    if (await newerThan(out, file)) continue;
    try {
      await sharp(file)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(out);
      console.log('[webp]', relative(ROOT, out));
    } catch (e) {
      console.warn('[webp fail]', file, e.message);
    }
  }

  // AVIF at lightbox width.
  if (srcW === 0 || AVIF_WIDTH <= srcW * 1.05) {
    const avifOut = withSuffix(file, `.${AVIF_WIDTH}.avif`);
    if (!(await newerThan(avifOut, file))) {
      try {
        await sharp(file)
          .rotate()
          .resize({ width: AVIF_WIDTH, withoutEnlargement: true })
          .avif({ quality: 50, effort: 4 })
          .toFile(avifOut);
        console.log('[avif]', relative(ROOT, avifOut));
      } catch (e) {
        console.warn('[avif fail]', file, e.message);
      }
    }
  }

  // LQIP (tiny base64 blur).
  const lqip = withSuffix(file, '.lqip.txt');
  if (!(await newerThan(lqip, file))) {
    try {
      const buf = await sharp(file)
        .rotate()
        .resize(8, 12, { fit: 'cover' })
        .webp({ quality: 30 })
        .toBuffer();
      await writeFile(lqip, 'data:image/webp;base64,' + buf.toString('base64'));
      console.log('[lqip]', relative(ROOT, lqip));
    } catch (e) {
      console.warn('[lqip fail]', file, e.message);
    }
  }
}

function ffrun(args) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', args, { stdio: 'ignore' });
    p.on('error', rej);
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error('ffmpeg ' + code))));
  });
}

async function optimiseVideo(file) {
  if (!ffmpegOk) return;
  const webm = file.replace(/\.mp4$/i, '.webm');
  const poster = file.replace(/\.mp4$/i, '.poster.jpg');
  if (!(await newerThan(webm, file))) {
    try {
      await ffrun(['-y', '-i', file, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-an', webm]);
      console.log('[webm]', relative(ROOT, webm));
    } catch (e) {
      console.warn('[webm fail]', file, e.message);
    }
  }
  if (!(await newerThan(poster, file))) {
    try {
      await ffrun(['-y', '-ss', '1', '-i', file, '-frames:v', '1', '-q:v', '4', poster]);
      console.log('[poster]', relative(ROOT, poster));
    } catch (e) {
      console.warn('[poster fail]', file, e.message);
    }
  }
}

if (!existsSync(PUBLIC_DIR)) {
  console.error('[optimize] public/ not found at', PUBLIC_DIR);
  process.exit(1);
}

// Cap concurrency: sharp opens many file handles + decoders, and on Windows
// running 200+ at once thrashes badly. 6 workers is a good balance.
const CONCURRENCY = 6;

const tasks = [];
for await (const f of walk(PUBLIC_DIR)) {
  const ext = extname(f).toLowerCase();
  if (IMG_RE.test(f)) tasks.push(() => optimiseImage(f));
  else if (ext === '.mp4') tasks.push(() => optimiseVideo(f));
}

let cursor = 0;
async function worker() {
  while (cursor < tasks.length) {
    const i = cursor++;
    try { await tasks[i](); }
    catch (e) { console.warn('[task fail]', e.message); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log('[optimize] done — processed', tasks.length, 'sources.');
