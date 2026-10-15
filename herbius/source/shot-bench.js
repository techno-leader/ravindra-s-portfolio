const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:8123/herbius/bench-system.html?v=' + Date.now(), { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  // hover the translation tile so one scene is mid-play in the shot
  await p.waitForTimeout(2000);
  await p.screenshot({ path: process.argv[2], fullPage: true });
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
