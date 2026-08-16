/**
 * Captures mobile screenshots of NLP7 and NLP8 ViewRyt pages
 * for the design decisions sections of the case study.
 *
 * Run: node capture_screenshots.js
 * Requires: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const MOBILE_VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };
const OUT_DIR = path.join(__dirname, 'screenshots');
const CHROME_PATH = '/home/my-computer/chrome-linux64/chrome';

const PAGES = {
  nlp7: 'https://theayurvedaexperience.com/pages/ayuttva-viewryt-nlp7',
  nlp8: 'https://theayurvedaexperience.com/pages/ayuttva-viewryt-nlp8',
};

// CSS selectors or approximate scroll positions for each section.
// Adjust these after inspecting the live pages.
const SECTIONS = [
  { name: 'hero',   scrollY: 0 },
  { name: 'social', scrollY: 2400 },
  { name: 'cta',    scrollY: 5200 },
  { name: 'table',  scrollY: 7000 },
  { name: 'ing',    scrollY: 4000 },
];

async function capturePage(browser, url, label) {
  const page = await browser.newPage();
  await page.setViewport(MOBILE_VIEWPORT);
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  );

  console.log(`Loading ${label}: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Close any popups / cookie banners
  try {
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  } catch (_) {}

  for (const section of SECTIONS) {
    await page.evaluate(y => window.scrollTo(0, y), section.scrollY);
    await new Promise(r => setTimeout(r, 800)); // allow lazy-loaded images

    const filename = path.join(OUT_DIR, `${label}_${section.name}.png`);
    await page.screenshot({ path: filename, clip: { x: 0, y: 0, width: 390, height: 844 } });
    console.log(`  ✓ ${filename}`);
  }

  await page.close();
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  await capturePage(browser, PAGES.nlp7, 'nlp7');
  await capturePage(browser, PAGES.nlp8, 'nlp8');

  await browser.close();
  console.log('\nAll screenshots saved to portfolio/screenshots/');
  console.log('Next: run embed_screenshots.js to update viewryt.html');
})();
