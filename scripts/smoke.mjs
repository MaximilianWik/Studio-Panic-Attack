// Detailed inspection: capture canvas at intervals + count distinct
// non-bg pixels + capture an explicit center crop where the logo would be.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = 'http://127.0.0.1:5173/';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
const consoles = [];
page.on('console', (m) => {
  if (['error', 'warning', 'log', 'info'].includes(m.type())) {
    consoles.push(`[${m.type()}] ${m.text()}`);
  }
});
page.on('pageerror', (e) => errors.push(`PAGE ERROR: ${e.message}\n${e.stack}`));
page.on('requestfailed', (req) => errors.push(`REQ FAIL: ${req.url()} ${req.failure()?.errorText}`));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/full.png`, fullPage: false });
await page.screenshot({ path: `${OUT}/center.png`, clip: { x: 520, y: 280, width: 400, height: 340 } });

// Count textures created in the WebGL context
const stats = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll('canvas'));
  const out = canvases.map((c, i) => ({
    i,
    w: c.width,
    h: c.height,
    classes: c.className,
    cssWidth: c.style.width,
    parent: c.parentElement?.className,
  }));
  return out;
});
console.log('canvases:', JSON.stringify(stats, null, 2));

// Try to read three.js scene state from the global window if r3f exposed it
const sceneStats = await page.evaluate(() => {
  // r3f doesn't expose by default; look for `__r3f` on canvases
  const canvases = Array.from(document.querySelectorAll('canvas'));
  for (const c of canvases) {
    const r = (c).__r3f;
    if (r && r.root) {
      try {
        const snapshot = r.root.getState();
        const scene = snapshot.scene;
        let count = 0;
        const types = {};
        scene.traverse((o) => {
          count++;
          types[o.type] = (types[o.type] || 0) + 1;
        });
        return {
          totalObjects: count,
          types,
          children: scene.children.length,
          camera: snapshot.camera ? { pos: snapshot.camera.position.toArray(), fov: snapshot.camera.fov } : null,
        };
      } catch (e) {
        return { error: String(e) };
      }
    }
  }
  return { error: 'no r3f root found' };
});
console.log('scene:', JSON.stringify(sceneStats, null, 2));

console.log('\nERRORS:');
for (const e of errors) console.log('  ', e);
console.log('\nCONSOLE:');
for (const m of consoles.slice(0, 40)) console.log('  ', m);

await browser.close();
