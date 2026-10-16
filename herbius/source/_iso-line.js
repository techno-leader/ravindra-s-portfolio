<script>
const ICONS = __ICONS__;
const ICONS_FILL = __ICONS_FILL__;
const LOGOS = __LOGOS__;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const U = 22, C = Math.cos(Math.PI / 6), S = .5;

/* the line, in order. Only the user's own facts, numbers and tools. */
const STEP = 7, UP = -2.6, DOWN = 2.6;
const T = {   // tech stack entries: a brand mark (path + colour), a favicon, or a monogram
  claude:{n:'Claude', logo:'claude'}, claudecode:{n:'Claude Code', logo:'claude'},
  meta:{n:'Meta Ad Library', logo:'meta'}, metaads:{n:'Meta Ads Manager', logo:'meta'},
  amazon:{n:'Amazon', logo:'amazon', s:20}, motion:{n:'Motion', img:'assets/stack/motion.png', s:22},
  adstudio:{n:'TAE Ad Studio', svg:'adstudio', s:24}, fal:{n:'fal.ai', img:'assets/stack/fal.png', s:22},
  higgs:{n:'Higgsfield', img:'assets/stack/higgsfield.png', s:22}, ps:{n:'Photoshop', logo:'adobephotoshop', s:20},
  ae:{n:'After Effects', logo:'adobeaftereffects', s:20}, figma:{n:'Figma', svg:'figma', s:24},
  shopify:{n:'Shopify', logo:'shopify'}, reviewer:{n:'Native reviewer', ph:'user-check'},
  klaviyo:{n:'Klaviyo', img:'assets/stack/klaviyo.png', s:24}, tiktok:{n:'TikTok Shop', logo:'tiktok'}
};
const STATIONS = [
  {name:'Research', icon:'magnifying-glass',
   subs:['Reviews','Competitors','Ad Library','Forums','Hooks & angles'],
   text:'Competitor ads from Meta’s Ad Library, customer reviews on Amazon and creative data from Motion, consolidated by a Claude skill into one brief. The team wrote its hooks and angles from that brief.',
   stat:'', stack:['claude','meta','amazon','motion']},
  {name:'Ads', icon:'image',
   subs:['Energy','Menopause','Joints','Men','Libido'], win:'Libido',
   text:'Every angle became ads in TAE Ad Studio, the ad tool I was building at the same time. Imagery and video came from fal.ai and Higgsfield, finished in Photoshop and After Effects. Five angles went out; libido won.',
   stat:'5 angles tested · libido won', stack:['adstudio','fal','higgs','ps','ae']},
  {name:'Pages', icon:'code',
   subs:['Figma frame','Coded page','No page builder'],
   text:'Pages designed in Figma, turned into coded HTML with Claude Code instead of a page builder, and published on Shopify. Faster to load and quick to change.',
   stat:'', stack:['figma','claudecode','shopify']},
  {name:'Translations', icon:'translate',
   subs:['EN','IT','NL'],
   text:'Ads translated in Ad Studio, pages with a Claude skill, and every market read by a native reviewer before it went live.',
   stat:'One page: 5-6h → under 1h · 3-4h saved per 15-20 ads', stack:['adstudio','claude','reviewer']},
  {name:'Launch', icon:'rocket-launch',
   subs:['US','UK','IT','NL','FR','HK','Email flows'],
   text:'The same campaign live in six markets through Meta Ads Manager, sold on Shopify, followed up with email and SMS flows in Klaviyo, then listed on Amazon and TikTok Shop.',
   stat:'6 markets', stack:['metaads','shopify','klaviyo','amazon','tiktok']}
];
/* marks drawn here rather than taken from Simple Icons: Figma's real five-colour mark,
   and the TAE Ad Studio app icon as it appears in the film (lime sparkle on green) */
const SVGS = {
  figma:'<svg viewBox="0 0 38 57" aria-hidden="true"><path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/><path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/><path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg>',
  adstudio:'<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="asg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f6233"/><stop offset="1" stop-color="#17401f"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#asg)"/><path d="M22 13Q24 24 34 26Q24 28 22 39Q20 28 10 26Q20 24 22 13Z" fill="none" stroke="#d2e02a" stroke-width="2.6" stroke-linejoin="round"/><path d="M35 9v8M31 13h8" stroke="#d2e02a" stroke-width="2.6" stroke-linecap="round"/><circle cx="12.5" cy="36.5" r="2" fill="#d2e02a"/></svg>'
};
const USER_CHECK = 'M144,157.68a68,68,0,1,0-71.9,0c-20.65,6.76-39.23,19.39-54.17,37.17a8,8,0,0,0,12.25,10.3C50.25,181.19,77.91,168,108,168s57.75,13.19,77.87,37.15a8,8,0,0,0,12.25-10.3C183.18,177.07,164.6,164.44,144,157.68ZM56,100a52,52,0,1,1,52,52A52.06,52.06,0,0,1,56,100Zm197.66,33.66-32,32a8,8,0,0,1-11.32,0l-16-16a8,8,0,0,1,11.32-11.32L216,148.69l26.34-26.35a8,8,0,0,1,11.32,11.32Z';

const P = (x, y, z = 0) => [(x - y) * C * U, (x + y) * S * U - z * U];
const pts = a => a.map(p => p.join(',')).join(' ');
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; };
const floorM = (ox, oy, z = 0) => { const [tx, ty] = P(ox, oy, z); return `matrix(${C*U},${S*U},${-C*U},${S*U},${tx},${ty})`; };
const sideYM = (ox, oy, z) => { const [tx, ty] = P(ox, oy, z); return `matrix(${C*U},${S*U},0,${U},${tx},${ty})`; };
const sideXM = (ox, oy, z) => { const [tx, ty] = P(ox, oy, z); return `matrix(${-C*U},${S*U},0,${U},${tx},${ty})`; };
/* the same x-face, read the other way: for type, so it is never mirrored */
const sideXR = (ox, oy, z) => { const [tx, ty] = P(ox, oy, z); return `matrix(${C*U},${-S*U},0,${U},${tx},${ty})`; };

function box(g, x, y, w, d, h, z0 = 0){
  el('polygon', {points:pts([P(x,y+d,z0),P(x+w,y+d,z0),P(x+w,y+d,z0+h),P(x,y+d,z0+h)]), class:'fl edge'}, g);
  el('polygon', {points:pts([P(x+w,y,z0),P(x+w,y+d,z0),P(x+w,y+d,z0+h),P(x+w,y,z0+h)]), class:'fr edge'}, g);
  el('polygon', {points:pts([P(x,y,z0+h),P(x+w,y,z0+h),P(x+w,y+d,z0+h),P(x,y+d,z0+h)]), class:'top edge'}, g);
}
function deviceDetails(g, x, y, w, d, h, z0 = 0){
  const fy = el('g', {transform:sideYM(x, y + d, z0 + h)}, g);
  for(let i = 0; i < 5; i++) el('line', {x1:.35 + i*.13, y1:h*.38, x2:.35 + i*.13, y2:h*.66, class:'edge'}, fy);
  el('path', {d:`M${w*.62},${h} v${-h*.42} h${w*.16} v${h*.42}`, class:'edge'}, fy);
  const fx = el('g', {transform:sideXM(x + w, y, z0 + h)}, g);
  for(let i = 0; i < 3; i++) el('circle', {cx:d*.5 + i*.22, cy:h*.52, r:.06, class:'dot'}, fx);
}
function floorText(g, x, y, str, size = .5, cls = 'lab'){
  const t = el('text', {transform:floorM(x, y), class:cls, 'font-size':size}, g); t.textContent = str; return t;
}
/* a tube is an outline, a hollow core and a comet: five dashes sharing one head,
   longer and fainter towards the tail - the same transparent-to-ink fade as the
   site's scroll progress bar */
const COMET = [[34,.10,.5],[24,.2,.55],[15,.38,.62],[8,.65,.7],[3,1,.8]];
function tube(g, d, z, wide, cls, name){
  const fg = el('g', {transform:floorM(0, 0, z), class:'tube ' + cls, 'data-name':name || cls}, g);
  el('path', {d, class:'tube-o', 'stroke-width':wide}, fg);
  el('path', {d, class:'tube-i', 'stroke-width':wide * .7}, fg);
  const cm = el('g', {class:'comet'}, fg);
  COMET.forEach(([l, o, w], k) => el('path', {d, pathLength:100, class:'c' + k, 'stroke-width':wide * .7 * w}, cm));
  return fg;
}
/* one unit: the box, its outline and filled icon, its number and name, and its sub-stations */
function unit(parent, s, i, cx, cy, W, H){
  const x = cx - W / 2, y = cy - W / 2;
  const g = el('g', {class:'st', tabindex:0, role:'button', 'aria-label':`${i + 1}. ${s.name}, open details`, 'data-name':`Unit ${String(i + 1).padStart(2, '0')} ${s.name}`}, parent);
  const lift = el('g', {class:'lift'}, g);
  box(lift, x, y, W, W, H);
  deviceDetails(lift, x, y, W, W, H);
  const top = el('g', {transform:floorM(x, y, H)}, lift);
  el('rect', {x:.28, y:.28, width:W - .56, height:W - .56, rx:.18, class:'edge', fill:'none'}, top);
  const ic = el('g', {transform:`translate(${W / 2 - .6},${W / 2 - .6}) scale(${1.2 / 256})`}, top);
  (ICONS[s.icon] || []).forEach(d => el('path', {d, class:'ico ico-r'}, ic));
  (ICONS_FILL[s.icon] || []).forEach(d => el('path', {d, class:'ico ico-f'}, ic));
  floorText(g, x, y + W + .8, String(i + 1).padStart(2, '0'), .4, 'lab sm');
  floorText(g, x + .85, y + W + .8, s.name, .5);
  const pg = el('g', {class:'pills', 'data-name':`Sub-stations ${String(i + 1).padStart(2, '0')} ${s.name}`}, parent);
  s.subs.forEach((t, k) => {
    const w = .55 + t.length * .26;
    const fg = el('g', {class:'pill' + (t === s.win ? ' win' : ''), transform:floorM(x, y + W + 1.5 + k * .92)}, pg);
    el('rect', {x:0, y:0, width:w, height:.72, rx:.36}, fg);
    const tx = el('text', {x:.26, y:.49, 'font-size':.34}, fg); tx.textContent = t.toUpperCase();
  });
  return [g, pg];
}
/* the AI skills: a chip in the manner of Apple's M-series renders - a dark package,
   a raised metal die with the name engraved, memory beside it, a row of capacitors */
function chip(parent, gx, gy){
  const g = el('g', {'data-name':'AI skills chip'}, parent);
  const PS = 5.4, PH = .28, DS = 2.9, DH = .2;
  const [ox, oy] = P(gx + PS / 2, gy + PS / 2, .3);
  /* a solid with its own three face fills */
  const solid = (x, y, w, d, h, z, top, l, r) => {
    el('polygon', {points:pts([P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)]), class:l + ' chip-edge'}, g);
    el('polygon', {points:pts([P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)]), class:r + ' chip-edge'}, g);
    return el('polygon', {points:pts([P(x,y,z+h),P(x+w,y,z+h),P(x+w,y+d,z+h),P(x,y+d,z+h)]), class:top + ' chip-edge'}, g);
  };
  solid(gx, gy, PS, PS, PH, 0, 'pkg', 'pkg-l', 'pkg-r');
  /* capacitors along the front edge of the package */
  const caps = el('g', {transform:floorM(gx, gy, PH)}, g);
  for(let k = 0; k < 9; k++) el('rect', {x:.5 + k * .5, y:PS - .42, width:.22, height:.12, class:'cap'}, caps);
  for(let k = 0; k < 7; k++) el('rect', {x:PS - .42, y:.6 + k * .5, width:.12, height:.22, class:'cap'}, caps);
  /* the die, brushed metal, and two memory packages beside it */
  const dx0 = gx + .55, dy0 = gy + (PS - DS) / 2 - .15;
  const dieTop = solid(dx0, dy0, DS, DS, DH, PH, 'die-top', 'die-l', 'die-r');
  dieTop.setAttribute('fill', 'url(#dieMetal)');
  [0, 1].forEach(k => solid(gx + PS - 1.75, gy + .65 + k * 2.05, 1.1, 1.75, .16, PH, 'mem', 'mem-l', 'mem-r'));
  /* the engraving */
  const eng = el('g', {transform:floorM(dx0, dy0, PH + DH)}, g);
  const t1 = el('text', {x:DS / 2, y:DS / 2 + .15, 'text-anchor':'middle', 'font-size':1.05, class:'die-txt'}, eng); t1.textContent = 'AI';
  const t2 = el('text', {x:DS / 2, y:DS / 2 + .78, 'text-anchor':'middle', 'font-size':.26, class:'die-sub'}, eng); t2.textContent = 'SKILLS';
  /* its floor label sits behind the package, away from the power bus */
  const l1 = floorText(g, gx - 1.2, gy + .9, 'AI skills', .55), l2 = floorText(g, gx - 1.2, gy + 1.65, 'Powers every station', .36, 'lab sm');
  l1.setAttribute('text-anchor', 'end'); l2.setAttribute('text-anchor', 'end');
  return g;
}

/* ---------------- the line ---------------- */
const svg = document.getElementById('map');
const defs = el('defs', {}, svg);
const lg = el('linearGradient', {id:'dieMetal', x1:'0', y1:'0', x2:'1', y2:'1'}, defs);
[['0','#f4f4f4'],['.55','#d6d6d6'],['1','#b8b8b8']].forEach(([o, c]) => el('stop', {offset:o, 'stop-color':c}, lg));
const root = el('g', {}, svg);
const W = 2.8, H = 1.1, BUS = UP - W / 2 - 2.2, HUB = [(STATIONS.length - 1) * STEP / 2 - 2.2, BUS - 7.6];
const xs = STATIONS.map((s, i) => i * STEP), ys = STATIONS.map((s, i) => i % 2 ? DOWN : UP);

const grid = el('g', {class:'grid', transform:floorM(0, 0), 'data-name':'Floor grid'}, root);
for(let i = -20; i <= 40; i++) el('line', {x1:i, y1:-22, x2:i, y2:20}, grid);
for(let j = -22; j <= 20; j++) el('line', {x1:-20, y1:j, x2:40, y2:j}, grid);

/* power: one hollow pipe from the chip, along the bus and down into every station.
   Branches leave the bus on rounded fillets, and all outlines are drawn before all
   cores, so the joins read as one continuous pipe rather than tubes laid on tubes. */
const power = el('g', {'data-name':'Power'}, root);
const pOut = el('g', {'data-name':'Power outline'}, power), pIn = el('g', {'data-name':'Power core'}, power), pCm = el('g', {'data-name':'Power flow'}, power);
function pipe(d, cls, name, flow = d, fill = null, z = .25, wide = .26){
  const parts = [pOut, pIn, pCm].map(L => el('g', {transform:floorM(0, 0, z), class:'tube ' + cls, 'data-name':name}, L));
  el('path', {d, class:'tube-o', 'stroke-width':wide}, parts[0]);
  el('path', {d, class:'tube-i', 'stroke-width':wide * .7}, parts[1]);
  const cm = el('g', {class:'comet'}, parts[2]);
  COMET.forEach(([l, o, w], k) => el('path', {d:flow, pathLength:100, class:'c' + k, 'stroke-width':wide * .7 * w}, cm));
  /* a tee's two arms leave a sliver of outline between them; the core layer fills it */
  if(fill) el('path', {d:fill, class:'tube-fill'}, parts[1]);
  /* one handle that toggles the pipe's state on all three layers */
  return {classList:{toggle:(c, v) => parts.forEach(q => q.classList.toggle(c, v))}};
}
const R = .7, last = xs.length - 1, FX = HUB[0] + 1.4;
pipe(`M${xs[0] + R},${BUS} L${xs[last] - R},${BUS}`, 'bus', 'Power bus');
pipe(`M${FX},${HUB[1] + 5.4} L${FX},${BUS - R} Q${FX},${BUS} ${FX + R},${BUS} M${FX},${BUS - R} Q${FX},${BUS} ${FX - R},${BUS}`, 'feed', 'Power feed', `M${FX},${HUB[1] + 5.4} L${FX},${BUS}`,
  `M${FX - R},${BUS} Q${FX},${BUS} ${FX},${BUS - R} Q${FX},${BUS} ${FX + R},${BUS} Z`);
const drops = xs.map((x, i) => {
  const end = ys[i] - W / 2;
  const left = `M${x - R},${BUS} Q${x},${BUS} ${x},${BUS + R}`, right = `M${x + R},${BUS} Q${x},${BUS} ${x},${BUS + R}`;
  const arms = i === 0 ? right : i === last ? left : left + ' ' + right;   // the ends turn, the middle ones tee
  /* packets take the left arm in, or the right one at the first station */
  const tee = i > 0 && i < last ? `M${x - R},${BUS} Q${x},${BUS} ${x},${BUS + R} Q${x},${BUS} ${x + R},${BUS} Z` : null;
  return pipe(`${arms} L${x},${end}`, 'drop', `Power drop ${i + 1}`, `${i === 0 ? right : left} L${x},${end}`, tee);
});

chip(root, HUB[0], HUB[1]);

const line = el('g', {'data-name':'Pipeline'}, root);
const segs = xs.slice(1).map((x, i) => { const m = x - W / 2 - 1.2; return tube(line, `M${xs[i] + W / 2},${ys[i]} L${m},${ys[i]} L${m},${ys[i + 1]} L${x - W / 2},${ys[i + 1]}`, .4, .78, 'seg', `Pipe ${i + 1}-${i + 2}`); });

const stG = [], pillG = [];
STATIONS.forEach((s, i) => { const [g, pg] = unit(root, s, i, xs[i], ys[i], W, H); stG.push(g); pillG.push(pg); });

grid.style.display = 'none';
const bb = root.getBBox(), pad = 22;
grid.style.display = '';
svg.setAttribute('viewBox', `${bb.x - pad} ${bb.y - pad} ${bb.width + pad * 2} ${bb.height + pad * 2}`);
const cp = el('clipPath', {id:'frame'}, svg); el('rect', {x:bb.x - pad, y:bb.y - pad, width:bb.width + pad * 2, height:bb.height + pad * 2}, cp);
root.setAttribute('clip-path', 'url(#frame)');

/* comet keyframes: each layer's dash runs so all five heads stay together */
(() => {
  const st = document.createElement('style');
  st.textContent = COMET.map(([l], k) => `@keyframes cm${k}{from{stroke-dashoffset:${l}}to{stroke-dashoffset:${l - 135}}}`).join('') +
    COMET.map(([l, o], k) => `.comet .c${k}{stroke-dasharray:${l} 400;stroke-dashoffset:${l};--o:${o};animation-name:cm${k};}`).join('');
  document.head.appendChild(st);
})();

/* ---------------- the camera ---------------- */
/* Clicking a station glides the map's viewBox in until that station and its
   sub-stations fill the left of the frame; its story slides in on the right.
   Phones stack the story under the map, so there the station is centred. */
const stage = document.getElementById('stage');
const dpanel = document.getElementById('dpanel');
function logoTile(key){
  const t = T[key], li = document.createElement('li');
  const tile = document.createElement('span'); tile.className = 'logo';
  if(t.s) tile.style.setProperty('--s', t.s + 'px');
  if(t.logo){ const L = LOGOS[t.logo]; tile.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${L.hex}" d="${L.d}"/></svg>`; }
  else if(t.svg){ tile.innerHTML = SVGS[t.svg]; }
  else if(t.img){ tile.innerHTML = `<img src="${t.img}" alt="" width="96" height="96">`; }
  else if(t.ph){ tile.innerHTML = `<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="${USER_CHECK}"/></svg>`; }
  const n = document.createElement('span'); n.className = 'nm'; n.textContent = t.n;
  li.append(tile, n); return li;
}
const FULL = svg.getAttribute('viewBox').split(' ').map(Number);
let vb = FULL.slice(), anim = null, detailAt = -1;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function moveTo(target){
  cancelAnimationFrame(anim);
  if(REDUCED){ vb = target.slice(); svg.setAttribute('viewBox', vb.join(' ')); return; }
  const from = vb.slice(), t0 = performance.now(), D = 950;
  const step = now => {
    const k = ease(Math.min(1, (now - t0) / D));
    vb = from.map((v, n) => v + (target[n] - v) * k);
    svg.setAttribute('viewBox', vb.map(v => v.toFixed(2)).join(' '));
    if(k < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
function shotOf(i){
  const a = stG[i].getBBox(), b = pillG[i].getBBox();
  const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x + a.width, b.x + b.width), y1 = Math.max(a.y + a.height, b.y + b.height);
  const bw = x1 - x0, bh = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, A = FULL[2] / FULL[3];
  const side = innerWidth > 760;                       // panel over the map on the right, or under it
  const room = side ? .5 : .82;                         // share of the frame the station may use
  const h = Math.max(bh / .76, bw / room / A), w = h * A;
  return [cx - w * (side ? .3 : .5), cy - h / 2, w, h];
}
function fillPanel(i){
  const s = STATIONS[i];
  document.getElementById('dNum').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(STATIONS.length).padStart(2, '0');
  document.getElementById('dName').textContent = s.name;
  document.getElementById('dText').textContent = s.text;
  const st = document.getElementById('dStat'); st.textContent = s.stat; st.hidden = !s.stat;
  const ul = document.getElementById('dStack'); ul.innerHTML = ''; s.stack.forEach(k => ul.appendChild(logoTile(k)));
  document.getElementById('dPrev').disabled = i === 0;
  document.getElementById('dNext').disabled = i === STATIONS.length - 1;
}
function openDetail(i){
  stopAuto(); set(i); fillPanel(i); detailAt = i;
  stage.classList.add('zoomed');
  dpanel.setAttribute('aria-hidden', 'false'); dpanel.inert = false;
  moveTo(shotOf(i));
  setTimeout(() => document.getElementById('dBack').focus({preventScroll:true}), REDUCED ? 0 : 600);
}
function closeDetail(){
  stage.classList.remove('zoomed');
  dpanel.setAttribute('aria-hidden', 'true'); dpanel.inert = true;
  moveTo(FULL);
  const back = stG[detailAt]; detailAt = -1;
  setTimeout(() => back && back.focus({preventScroll:true}), REDUCED ? 0 : 600);
}
dpanel.inert = true;
document.getElementById('dBack').addEventListener('click', closeDetail);
document.getElementById('dPrev').addEventListener('click', () => { if(detailAt > 0) openDetail(detailAt - 1); });
document.getElementById('dNext').addEventListener('click', () => { if(detailAt < STATIONS.length - 1) openDetail(detailAt + 1); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && stage.classList.contains('zoomed')) closeDetail(); });
addEventListener('resize', () => { if(detailAt >= 0){ cancelAnimationFrame(anim); vb = shotOf(detailAt); svg.setAttribute('viewBox', vb.join(' ')); } });

/* ---------------- state ---------------- */
const btnBox = document.getElementById('stations');
const btns = STATIONS.map((s, i) => { const b = document.createElement('button'); b.textContent = `${i + 1}. ${s.name}`; b.addEventListener('click', () => openDetail(i)); btnBox.appendChild(b); return b; });
const autoBtn = document.createElement('button'); autoBtn.className = 'auto'; btnBox.appendChild(autoBtn);
let cur = -1, timer = null;
function set(i){
  cur = i;
  STATIONS.forEach((s, j) => {
    const on = j === i;
    stG[j].classList.toggle('on', on); pillG[j].classList.toggle('on', on);
    stG[j].classList.toggle('idle', !on); pillG[j].classList.toggle('idle', !on);
    drops[j].classList.toggle('on', on); drops[j].classList.toggle('idle', !on);
    btns[j].setAttribute('aria-pressed', on);
  });
  segs.forEach((sg, k) => { sg.classList.toggle('on', k === i - 1); sg.classList.toggle('idle', k !== i - 1); });
  const s = STATIONS[i];
  document.getElementById('pNum').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(STATIONS.length).padStart(2, '0');
  document.getElementById('pName').textContent = s.name;
  document.getElementById('pText').textContent = s.text;
  document.getElementById('pStat').textContent = s.stat;
}
function stopAuto(){ clearInterval(timer); timer = null; autoBtn.textContent = 'Play'; autoBtn.setAttribute('aria-pressed', false); }
function startAuto(){ if(REDUCED) return; clearInterval(timer); timer = setInterval(() => set((cur + 1) % STATIONS.length), 3200); autoBtn.textContent = 'Pause'; autoBtn.setAttribute('aria-pressed', true); }
autoBtn.addEventListener('click', () => timer ? stopAuto() : startAuto());
stG.forEach((g, i) => {
  g.addEventListener('mouseenter', () => { if(detailAt >= 0) return; stopAuto(); set(i); });
  g.addEventListener('focus', () => { if(detailAt >= 0) return; stopAuto(); set(i); });
  g.addEventListener('click', () => openDetail(i));
  g.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openDetail(i); } });
});
set(0);
REDUCED ? stopAuto() : startAuto();
</script>
