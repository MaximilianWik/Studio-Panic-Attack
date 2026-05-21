// Quick smoke test — load the dev server, capture console messages
// and any uncaught errors, then take a screenshot of the hero.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL || 'http://127.0.0.1:5173/';
const OUT = process.env.OUT || 'screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleMsgs = [];
const errors = [];
page.on('console', (m) => {
  consoleMsgs.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => {
  errors.push(`PAGE ERROR: ${e.message}\n${e.stack ?? ''}`);
});
page.on('requestfailed', (req) => {
  errors.push(`REQ FAIL: ${req.url()} - ${req.failure()?.errorText}`);
});

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
} catch (e) {
  console.log('GOTO FAILED:', e.message);
}

await page.waitForTimeout(2500);

await page.screenshot({ path: `${OUT}/hero.png`, fullPage: false });

// scroll through and capture each section
const sections = ['hero', 'gallery', 'graphic', '3d', 'ai', 'ux', 'highlights'];
const total = sections.length;
for (let i = 0; i < total; i++) {
  // drei ScrollControls renders a scroll container — find it
  const sel = '[data-scroll-container], div[style*="overflow"][tabindex="0"]';
  await page.evaluate((target) => {
    const containers = document.querySelectorAll('div');
    let scroller = null;
    for (const c of containers) {
      if (c.scrollHeight > c.clientHeight + 100 && getComputedStyle(c).overflowY !== 'visible') {
        scroller = c;
        break;
      }
    }
    if (scroller) {
      const ratio = target / 6.0; // 7 sections, position scroll
      scroller.scrollTop = scroller.scrollHeight * ratio * 0.95;
    }
  }, i);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${i}-${sections[i]}.png`, fullPage: false });
}

console.log('CONSOLE:');
for (const m of consoleMsgs) console.log('  ', m);
console.log('ERRORS:');
for (const e of errors) console.log('  ', e);
console.log(`\nScreenshots written to ${OUT}/`);

await browser.close();
