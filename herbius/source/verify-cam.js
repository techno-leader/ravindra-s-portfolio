const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const OUT = '/tmp/claude-1000/-home-my-computer-portfolio/0642a14d-eba0-4b53-aa66-a3de5c498977/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [w, h] of [[1440, 900], [400, 860]]) {
    const mobile = w < 768;
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto('http://localhost:8123/herbius/case-herbius.html?v=' + Date.now(), { waitUntil: 'load' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const s = document.querySelector('.sys'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 80); });
    await p.waitForTimeout(1800);
    const sys = await p.$('.sys');
    await sys.screenshot({ path: `${OUT}cam-${w}-map.png` });
    await p.click('.sys #map .st >> nth=1');
    await p.waitForTimeout(1800);
    await sys.screenshot({ path: `${OUT}cam-${w}-ads.png` });
    const d = await p.evaluate(() => ({ zoomed: document.getElementById('stage').classList.contains('zoomed'), vb: document.getElementById('map').getAttribute('viewBox'),
      stack: [...document.querySelectorAll('#dStack li')].map(li => li.textContent), head: document.querySelector('.stack-h').textContent,
      sw: document.documentElement.scrollWidth, iw: innerWidth }));
    console.log(w, JSON.stringify(d), 'errors', JSON.stringify(errs.filter(e => !/clarity|404/i.test(e))));
    await p.close();
  }
  await b.close();
})();
