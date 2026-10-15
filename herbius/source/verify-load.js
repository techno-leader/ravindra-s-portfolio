const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto('http://localhost:8123/herbius/case-herbius.html?v=' + Date.now(), { waitUntil: 'load' });
  await p.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
  let total = await p.evaluate(() => document.documentElement.scrollHeight), y = 0;
  while (y < total) { await p.mouse.wheel(0, 300); await p.waitForTimeout(180); y = await p.evaluate(() => scrollY + innerHeight); total = await p.evaluate(() => document.documentElement.scrollHeight); }
  await p.waitForTimeout(2000);
  console.log(JSON.stringify(await p.evaluate(() => ({ reached: scrollY + innerHeight, H: document.documentElement.scrollHeight,
    bad: [...document.querySelectorAll('main img')].filter(i => !(i.complete && i.naturalWidth)).map(i => i.getAttribute('src')) }))));
  await b.close();
})();
