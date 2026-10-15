// Static, Figma-ready SVG of the launch-system illustration.
// node export-figma.js  -> ../assets/system-illustration.svg
// Every unit, pipe, sub-station group and folder is its own named group (id = layer name in Figma).
// Styles are resolved and written as attributes, because Figma ignores CSS variables and classes.
const { chromium } = require('/home/my-computer/.npm-global/lib/node_modules/agent-browser/node_modules/playwright-core');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })).newPage();
  await p.goto('http://localhost:8123/herbius/bench-system.html?v=' + Date.now(), { waitUntil: 'load' });
  await p.waitForTimeout(800);
  const out = await p.evaluate(() => {
    stopAuto();
    const svg = document.getElementById('map');
    /* neutral state: every unit in ink, nothing lifted, no packets */
    svg.querySelectorAll('.on,.idle').forEach(e => e.classList.remove('on', 'idle'));
    const m0 = svg.querySelector(':scope > g').getCTM();
    const k0 = Math.sqrt(Math.abs(m0.a * m0.d - m0.b * m0.c));
    const used = new Set();
    const clone = svg.cloneNode(true);
    const live = [...svg.querySelectorAll('*')], copy = [...clone.querySelectorAll('*')];
    const drop = [];
    live.forEach((e, i) => {
      const c = copy[i], cs = getComputedStyle(e);
      if(cs.display === 'none' || +cs.opacity === 0) { drop.push(c); return; }
      const tag = e.tagName.toLowerCase();
      if(['path','polygon','rect','circle','line','text'].includes(tag)){
        c.setAttribute('fill', cs.fill === 'none' ? 'none' : cs.fill);
        if(cs.stroke && cs.stroke !== 'none'){
          let sw = parseFloat(cs.strokeWidth);
          if(cs.vectorEffect === 'non-scaling-stroke'){
            const m = e.getCTM(); const s = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / k0;
            sw = sw / s;
          }
          c.setAttribute('stroke', cs.stroke); c.setAttribute('stroke-width', +sw.toFixed(4));
          if(cs.strokeLinecap !== 'butt') c.setAttribute('stroke-linecap', cs.strokeLinecap);
          if(cs.strokeLinejoin !== 'miter') c.setAttribute('stroke-linejoin', cs.strokeLinejoin);
        } else c.setAttribute('stroke', 'none');
        if(+cs.opacity < 1) c.setAttribute('opacity', cs.opacity);
      }
      if(tag === 'text'){
        c.setAttribute('font-family', 'SF Mono, Menlo, monospace');
        c.setAttribute('font-size', e.getAttribute('font-size'));
        const ls = parseFloat(cs.letterSpacing) / (parseFloat(cs.fontSize) || 1) * parseFloat(e.getAttribute('font-size'));
        if(ls) c.setAttribute('letter-spacing', +ls.toFixed(4));
        if(cs.textTransform === 'uppercase') c.textContent = c.textContent.toUpperCase();
        if(cs.textAnchor !== 'start') c.setAttribute('text-anchor', cs.textAnchor);
      }
      const name = e.getAttribute('data-name');
      ['class','tabindex','role','aria-label','style','data-name','opacity'].forEach(a => a !== 'opacity' && c.removeAttribute(a));
      if(name){ let id = name.replace(/[^A-Za-z0-9 _\-→&]/g, '').trim(), n = id, k = 2; while(used.has(n)) n = id + ' ' + k++; used.add(n); c.setAttribute('id', n); }
      else if(c.getAttribute('id') !== 'frame') c.removeAttribute('id');
    });
    drop.forEach(c => c.remove());
    clone.querySelectorAll('title').forEach(t => t.remove());
    ['role','aria-labelledby','id','class','style'].forEach(a => clone.removeAttribute(a));
    const vb = clone.getAttribute('viewBox').split(' ').map(Number);
    clone.setAttribute('width', Math.round(vb[2] * 2)); clone.setAttribute('height', Math.round(vb[3] * 2));
    /* paper behind everything */
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('id', 'Background'); bg.setAttribute('x', vb[0]); bg.setAttribute('y', vb[1]); bg.setAttribute('width', vb[2]); bg.setAttribute('height', vb[3]); bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);
    return new XMLSerializer().serializeToString(clone);
  });
  fs.writeFileSync('../assets/system-illustration.svg', '<?xml version="1.0" encoding="UTF-8"?>\n' + out);
  console.log('wrote', out.length, 'bytes');
  await b.close();
})();
