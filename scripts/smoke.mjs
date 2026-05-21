// Test wheel scroll behavior — this is what the user actually does.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = 'http://127.0.0.1:5173/';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(2500);

await page.screenshot({ path: `${OUT}/wheel-0.png` });

// Move pointer to center then dispatch wheel events
await page.mouse.move(720, 450);

for (let i = 1; i <= 5; i++) {
  // 5 stops, big wheel scroll between each
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/wheel-${i}.png` });

  // Check what the scroll container's scrollTop is
  const scroll = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div'));
    const scroller = all.find((d) => {
      const cs = getComputedStyle(d);
      return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') &&
             d.scrollHeight > d.clientHeight + 50;
    });
    return scroller
      ? { scrollTop: scroller.scrollTop, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight }
      : { error: 'no scroller' };
  });
  console.log(`wheel ${i}: ${JSON.stringify(scroll)}`);
}

if (errors.length) {
  console.log('ERRORS:', errors);
}

await browser.close();
