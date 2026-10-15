const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const OUT = '/tmp/claude-1000/-home-my-computer-portfolio/0642a14d-eba0-4b53-aa66-a3de5c498977/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [w, h] of [[1440, 900], [400, 860]]) {
    const mobile = w < 768;
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto('http://localhost:8123/herbius/case-herbius.html?v=' + Date.now(), { waitUntil: 'load' });
    await p.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
    let total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 300) { await p.mouse.wheel(0, 300); await p.waitForTimeout(50); total = await p.evaluate(() => document.documentElement.scrollHeight); }
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => ({ bad: [...document.querySelectorAll('main img')].filter(i => !(i.complete && i.naturalWidth)).map(i => i.getAttribute('src')),
      sw: document.documentElement.scrollWidth, iw: innerWidth, units: document.querySelectorAll('.sys #map .st').length,
      logos: 0 }));
    const sys = await p.$('.sys');
    await p.evaluate(() => { const s = document.querySelector('.sys'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 80); });
    await p.waitForTimeout(1500);
    await sys.screenshot({ path: `${OUT}sys-${w}-map.png` });
    await p.click('.sys #map .st >> nth=3');
    await p.waitForTimeout(1500);
    const d = await p.evaluate(() => ({ flipped: document.getElementById('stage').classList.contains('flipped'), name: document.getElementById('dName').textContent,
      logos: [...document.querySelectorAll('#dStack li')].map(li => li.textContent), imgsOk: [...document.querySelectorAll('#dStack img')].every(i => i.complete && i.naturalWidth) }));
    await sys.screenshot({ path: `${OUT}sys-${w}-detail.png` });
    console.log(w, JSON.stringify(r), JSON.stringify(d), 'errors', JSON.stringify(errs.filter(e => !/clarity/i.test(e))));
    await p.close();
  }
  await b.close();
})();
