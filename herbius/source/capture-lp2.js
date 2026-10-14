// Slow, visitor-like capture of one landing page + the page offsets of its beats.
// node capture-lp2.js <name> <url>  -> lp/<name>.png + lp/<name>.anchors.json
const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const fs = require('fs');
const [name, url] = process.argv.slice(2);
// text that opens each beat on the US lp2 (other locales just get the capture)
const ANCHORS = [
  ['hero', "You Don't Have to Feel"],
  ['stat', 'of women believe'],
  ['hormones', 'The Real Reason'],
  ['voices', 'So where do you go from here'],
  ['fixes', 'Estrogen creams'],
  ['testosterone', 'TESTOSTERONE'],
  ['ancient', 'Its earliest mention'],
  ['myth', "Isn't Shilajit Just for Men"],
  ['proof', 'Why We’re Different'],
  ['compare', 'how we outshine'],
  ['offer', 'FREE GIFT'],
  ['pitch', "That's Our Pitch"],
  ['faq', 'FAQs'],
  ['footer', 'Restore Your Harmony'],
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  let h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 350) {
    await page.mouse.wheel(0, 350); await page.waitForTimeout(450);
    h = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  // wait until every image in the page has decoded (or 20s)
  await page.waitForFunction(() => [...document.images].filter(i => i.getBoundingClientRect().width > 40).every(i => i.complete), null, { timeout: 20000 }).catch(() => console.log('some images never completed'));
  await page.waitForTimeout(2500);
  const info = await page.evaluate((ANCHORS) => {
    const hid = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      el.style.setProperty('display', 'none', 'important'); hid.push((el.id || el.className || el.tagName).toString().slice(0, 40));
    }
    const H = document.documentElement.scrollHeight;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const found = {};
    let n;
    while ((n = walker.nextNode())) {
      for (const [k, t] of ANCHORS) {
        if (found[k] != null) continue;
        if (n.textContent.toLowerCase().includes(t.toLowerCase())) {
          const r = n.parentElement.getBoundingClientRect();
          if (r.height > 0) found[k] = Math.round(r.top + scrollY);
        }
      }
    }
    return { H, found, hid };
  }, ANCHORS);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `lp/${name}.png`, fullPage: true, timeout: 180000 });
  fs.writeFileSync(`lp/${name}.anchors.json`, JSON.stringify(info, null, 1));
  console.log(name, JSON.stringify(info));
  await browser.close();
})();
