/**
 * Captures mobile screenshots using playwright-core from agent-browser deps.
 * Run: node capture_pw.js
 */

const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/home/my-computer/chrome-linux64/chrome';
const OUT = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 390, height: 844 };

const PAGES = [
  { label: 'nlp7', url: 'https://theayurvedaexperience.com/pages/ayuttva-viewryt-nlp7' },
  { label: 'nlp8', url: 'https://theayurvedaexperience.com/pages/ayuttva-viewryt-nlp8' },
];

// Approximate scroll-Y positions for each decision section on mobile.
// These will need tuning — set based on visual inspection of the live pages.
const SECTIONS = [
  { name: 'hero',   scrollY: 0 },
  { name: 'social', scrollY: 2600 },
  { name: 'cta',    scrollY: 6000 },
  { name: 'table',  scrollY: 7800 },
  { name: 'ing',    scrollY: 4200 },
];

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  for (const { label, url } of PAGES) {
    console.log(`\nCapturing ${label}: ${url}`);
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for images and fonts to settle
    await page.waitForTimeout(3000);

    // Dismiss any overlays / cookie banners
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    for (const { name, scrollY } of SECTIONS) {
      await page.evaluate(y => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(800);
      const out = path.join(OUT, `${label}_${name}.png`);
      await page.screenshot({
        path: out,
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
      console.log(`  ✓ ${label}_${name}.png`);
    }

    await ctx.close();
  }

  await browser.close();
  console.log('\nDone. Run: node embed_screenshots.js');
}

main().catch(err => { console.error(err); process.exit(1); });
