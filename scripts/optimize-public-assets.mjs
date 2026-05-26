#!/usr/bin/env node
/**
 * Best-effort asset optimizer.
 *
 * - Walks `public/` for images >= 200 KB, emits sibling `.webp` (q=78) and a
 *   tiny `.lqip.txt` (8x12 base64 thumbnail) used as the LQIP for <Img>.
 * - For .mp4, emits sibling `.webm` (vp9, crf=34) and `.poster.jpg` (frame at 1s).
 *
 * Soft-skips quietly when `sharp` or `ffmpeg` is missing — the site still
 * works with raw assets, just larger. Run with:
 *
 *     node scripts/optimize-public-assets.mjs
 *
 * Idempotent: skips files whose target already exists and is newer than the
 * source. Safe to run multiple times.
 */
import { readdir, stat, mkdir, writeFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const IMG_RE = /\.(jpe?g|png)$/i;
const MIN_BYTES = 200 * 1024;

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

async function optimiseImage(file) {
  if (!sharp) return;
  const sz = (await stat(file)).size;
  if (sz < MIN_BYTES) return;
  const webp = file.replace(IMG_RE, '.webp');
  const lqip = file.replace(IMG_RE, '.lqip.txt');
  if (!(await newerThan(webp, file))) {
    await sharp(file).rotate().webp({ quality: 78 }).toFile(webp);
    console.log('[webp]', relative(ROOT, webp));
  }
  if (!(await newerThan(lqip, file))) {
    const buf = await sharp(file).rotate().resize(8, 12, { fit: 'cover' }).webp({ quality: 30 }).toBuffer();
    await writeFile(lqip, 'data:image/webp;base64,' + buf.toString('base64'));
    console.log('[lqip]', relative(ROOT, lqip));
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

const queue = [];
for await (const f of walk(PUBLIC_DIR)) {
  const ext = extname(f).toLowerCase();
  if (IMG_RE.test(f)) queue.push(optimiseImage(f));
  else if (ext === '.mp4') queue.push(optimiseVideo(f));
}
await Promise.all(queue);
console.log('[optimize] done.');
