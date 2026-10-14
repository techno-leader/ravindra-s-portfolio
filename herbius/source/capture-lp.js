// Full-page captures of the public Herbius landing pages, 2x, for the case study.
// node capture-lp.js  -> source/lp/<name>.png
const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const pages = [
  ['us-lp1', 'https://theayurvedaexperience.com/pages/herbius-ashwa-resin-lp'],
  ['us-lp2', 'https://theayurvedaexperience.com/pages/ashwaresin_herbius_lp2'],
  ['nl-lp2', 'https://theayurvedaexperience.nl/pages/ashwaresin_herbius_lp2'],
  ['uk-lp2', 'https://theayurvedaexperience.co.uk/pages/ashwaresin_herbius_lp2'],
  ['it-lp2', 'https://theayurvedaexperience.it/pages/ashwaresin_herbius_lp2'],
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--disable-gpu'] });
  for (const [name, url] of pages) {
    const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(4000);
      const final = page.url();
      // scroll like a visitor so lazy images load
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(250); }
      await page.waitForTimeout(2000);
      // hide cookie / popup overlays if any
      // hide only fixed/sticky overlays that cover the viewport (popups, cookie bars, chat), never page content
      const hidden = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          if (cs.position !== 'fixed') continue;
          const r = el.getBoundingClientRect();
          if (r.width * r.height < 20000 && !/cookie|chat|popup|klaviyo|consent/i.test(el.id + ' ' + el.className)) continue;
          el.style.setProperty('display', 'none', 'important'); out.push((el.id || el.className || el.tagName).toString().slice(0, 60));
        }
        document.documentElement.style.overflow = 'visible'; document.body.style.overflow = 'visible';
        return out;
      });
      console.log(name, 'hid', hidden.join(' | '));
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      await page.screenshot({ path: `lp/${name}.png`, fullPage: true, timeout: 120000 });
      console.log(name, 'ok', final, h);
    } catch (e) { console.log(name, 'FAIL', e.message.split('\n')[0]); }
    await ctx.close();
  }
  await browser.close();
})();
