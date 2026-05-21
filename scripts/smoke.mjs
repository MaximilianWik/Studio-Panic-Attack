// Detailed inspection: capture canvas at a few wait intervals so we can
// see whether the scene is just slow to mount or genuinely empty.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = 'http://127.0.0.1:5173/';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
const consoleMsgs = [];
page.on('console', (m) => {
  if (['error', 'warning'].includes(m.type())) consoleMsgs.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`PAGE ERROR: ${e.message}`));
page.on('requestfailed', (req) => errors.push(`REQ FAIL: ${req.url()} - ${req.failure()?.errorText}`));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

for (const t of [1000, 2500, 5000, 8000]) {
  await page.waitForTimeout(t === 1000 ? 1000 : t - 1000);
  await page.screenshot({ path: `${OUT}/wait-${t}ms.png` });
  // Sample center pixel + a handful of points to detect "mostly black"
  const stats = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { err: 'no canvas' };
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 200, 200);
    const data = ctx.getImageData(0, 0, 200, 200).data;
    let total = 0, nonBlack = 0, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      total += lum;
      if (lum > 8) nonBlack++;
      if (lum > max) max = lum;
    }
    return {
      avgLum: (total / (data.length / 4)).toFixed(2),
      nonBlackPct: ((nonBlack / (data.length / 4)) * 100).toFixed(2),
      maxLum: max,
      canvasSize: { w: canvas.width, h: canvas.height },
    };
  });
  console.log(`@${t}ms`, JSON.stringify(stats));
}

console.log('\nERRORS:');
for (const e of errors) console.log('  ', e);
console.log('\nCONSOLE:');
for (const m of consoleMsgs.slice(0, 20)) console.log('  ', m);

await browser.close();
