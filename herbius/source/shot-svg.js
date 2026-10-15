const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  await p.goto('http://localhost:8123/herbius/bench-system.html');
  await p.evaluate(() => { document.body.innerHTML = '<img id="x" src="assets/system-illustration.svg?v=' + Date.now() + '" style="width:1400px;display:block">'; document.body.style.margin = 0; });
  await p.waitForFunction(() => document.getElementById('x').complete); await p.waitForTimeout(800);
  console.log(await p.evaluate(() => [document.getElementById('x').naturalWidth, document.getElementById('x').naturalHeight]));
  await p.screenshot({ path: process.argv[2], fullPage: true }); await b.close(); })();
