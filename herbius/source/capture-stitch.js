// Capture a long page one viewport at a time (each slice shot while it is really
// on screen, so lazy images render) and stitch with PIL afterwards.
// node capture-stitch.js <name> <url> [maxCssY]  -> lp/<name>-slices/NNN.png + meta.json
const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const fs = require('fs');
const [name, url, maxY] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const dir = `lp/${name}-slices`; fs.mkdirSync(dir, { recursive: true });
  const hideFixed = () => page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const p = getComputedStyle(el).position;
      if (p === 'fixed' || p === 'sticky') el.style.setProperty('display', 'none', 'important');
    }
    document.documentElement.style.scrollBehavior = 'auto';
  });
  await hideFixed();
  const VH = 900; let y = 0, i = 0; const ys = [];
  let H = await page.evaluate(() => document.documentElement.scrollHeight);
  const stop = maxY ? Math.min(+maxY, H) : H;
  while (y < stop) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(900);
    await hideFixed();                       // popups that appear mid-scroll
    const real = await page.evaluate(() => scrollY);
    await page.screenshot({ path: `${dir}/${String(i).padStart(3, '0')}.png` });
    ys.push(real); i++; y += VH;
    H = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  fs.writeFileSync(`${dir}/meta.json`, JSON.stringify({ ys, VH, H }));
  console.log(name, 'slices', i, 'H', H);
  await browser.close();
})();
