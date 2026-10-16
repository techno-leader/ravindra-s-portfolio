const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })).newPage();
  await p.goto('http://localhost:8123/herbius/bench-system.html?v=' + Date.now(), { waitUntil: 'load' });
  await p.waitForTimeout(800);
  // frame the feed tee and the Pages drop
  await p.evaluate(() => { const s = document.getElementById('map'); const v = s.getAttribute('viewBox').split(' ').map(Number); s.setAttribute('viewBox', `${v[0] + v[2] * .42} ${v[1] + v[3] * .2} ${v[2] * .22} ${v[3] * .22}`); });
  await p.waitForTimeout(300);
  await (await p.$('#map')).screenshot({ path: process.argv[2] });
  await b.close();
})();
