const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:8123/herbius/bench-system.html?v=' + Date.now(), { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const st = await p.$('#stage'); await st.screenshot({ path: process.argv[2] + '-map.png' });
  await p.click('#map .st:nth-of-type(1)').catch(() => {});
  await p.evaluate(() => openDetail(1)); await p.waitForTimeout(1600);
  await st.screenshot({ path: process.argv[2] + '-detail.png' });
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
