// node verify.js <width> <height> [shots]  - visitor-like scroll, asserts, section screenshots
const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const fs = require('fs');
const [W, H, shots] = process.argv.slice(2).map((v, i) => i < 2 ? +v : v);
const OUT = '/tmp/claude-1000/-home-my-computer-portfolio/0642a14d-eba0-4b53-aa66-a3de5c498977/scratchpad/shots';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const mobile = W < 768;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('requestfailed', r => { if (!/clarity/.test(r.url())) errs.push('REQFAIL ' + r.url()); });
  await page.goto('http://localhost:8123/herbius/case-herbius.html?v=' + Date.now(), { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
  // scroll like a visitor
  let total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 300) {
    await page.mouse.wheel(0, 300); await page.waitForTimeout(60);
    total = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('main img, header img')];
    const bad = imgs.filter(i => !(i.complete && i.naturalWidth)).map(i => i.getAttribute('src'));
    const over = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.scrolly,.sr,#orb,header')).slice(0, 8)
      .map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right));
    return { imgs: imgs.length, bad, sw: document.documentElement.scrollWidth, iw: innerWidth, over, H: document.documentElement.scrollHeight };
  });
  // video: scroll it into view and confirm it is playing
  const vid = await page.evaluate(async () => {
    const v = document.querySelector('video.loop'); const b = v.getBoundingClientRect();
    window.scrollTo(0, b.top + scrollY - innerHeight / 3);
    await new Promise(res => setTimeout(res, 2500));
    return { paused: v.paused, t: +v.currentTime.toFixed(2), rs: v.readyState };
  });
  console.log(W + 'x' + H, JSON.stringify(r), 'video', JSON.stringify(vid), 'errors', JSON.stringify(errs));
  if (shots) {
    const secs = await page.evaluate(() => [...document.querySelectorAll('header, main > section, .case-nav')].map((s, i) => ({ i, top: s.getBoundingClientRect().top + scrollY, label: (s.querySelector('.sec-label')?.textContent || s.tagName).trim() })));
    for (const s of secs) {
      await page.evaluate(y => window.scrollTo(0, y), Math.max(0, s.top - (s.label === 'HEADER' ? 0 : 60)));
      await page.waitForTimeout(700);
      await page.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
      await page.waitForTimeout(1100);
      await page.screenshot({ path: `${OUT}/${W}-${String(s.i).padStart(2, '0')}-${s.label.replace(/\W+/g, '_')}.png` });
    }
    // phone walk-through at three beats
    for (const f of [0.03, 0.4, 0.8]) {
      await page.evaluate(f => { const sc = document.getElementById('scrolly'); const top = sc.getBoundingClientRect().top + scrollY; window.scrollTo(0, top + f * (sc.offsetHeight - innerHeight)); }, f);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/${W}-scrolly-${f}.png` });
    }
    // chart tooltip on hover
    if (!mobile) {
      const b = await page.$$('.bar'); await b[4].scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
      await b[4].hover(); await page.waitForTimeout(500);
      const box = await (await page.$('figure.chart')).boundingBox();
      await page.screenshot({ path: `${OUT}/${W}-chart-hover.png`, clip: box });
    }
  }
  await browser.close();
})();
