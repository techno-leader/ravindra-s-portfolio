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
  amazon:{n:'Amazon', logo:'amazon'}, motion:{n:'Motion', img:'assets/stack/motion.png'},
  adstudio:{n:'TAE Ad Studio', mono:'AS'}, fal:{n:'fal.ai', img:'assets/stack/fal.png'},
  higgs:{n:'Higgsfield', img:'assets/stack/higgsfield.png'}, ps:{n:'Photoshop', logo:'adobephotoshop'},
  ae:{n:'After Effects', logo:'adobeaftereffects'}, figma:{n:'Figma', logo:'figma'},
  shopify:{n:'Shopify', logo:'shopify'}, reviewer:{n:'Native reviewer', ph:'user-check'},
  klaviyo:{n:'Klaviyo', img:'assets/stack/klaviyo.png'}, tiktok:{n:'TikTok Shop', logo:'tiktok'}
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
/* the AI skills: a graphics card lying on the floor, two fans on its shroud,
   heatsink fins down its side, and a halo of grain breathing around it */
function gpu(parent, gx, gy){
  const g = el('g', {'data-name':'AI skills GPU'}, parent);
  const GW = 7, GD = 3.2, PCB = .14, SH = .62;
  /* grain first, so the card occludes whatever falls behind it */
  const [ox, oy] = P(gx + GW / 2, gy + GD / 2, .4);
  const grain = el('g', {class:'grain', 'data-name':'Grain'}, g);
  const layers = [0, 1, 2].map(k => el('g', {class:'breath b' + k, style:`transform-origin:${ox}px ${oy}px`}, grain));
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  for(let n = 0; n < 1600; n++){
    const dx = gauss() * 96, dy = gauss() * 44;
    if((dx * dx) / (112 * 112) + (dy * dy) / (54 * 54) < 1) continue;   // keep the card itself clear
    el('circle', {cx:(ox + dx).toFixed(1), cy:(oy + dy).toFixed(1), r:(.4 + rnd() * .8).toFixed(2), class:'grn', 'fill-opacity':(.1 + rnd() * .45).toFixed(2)}, layers[n % 3]);
  }
  /* board, then shroud */
  el('polygon', {points:pts([P(gx-.15,gy+GD+.15,0),P(gx+GW+.15,gy+GD+.15,0),P(gx+GW+.15,gy+GD+.15,PCB),P(gx-.15,gy+GD+.15,PCB)]), class:'pcb'}, g);
  el('polygon', {points:pts([P(gx+GW+.15,gy-.15,0),P(gx+GW+.15,gy+GD+.15,0),P(gx+GW+.15,gy+GD+.15,PCB),P(gx+GW+.15,gy-.15,PCB)]), class:'pcb'}, g);
  const fingers = el('g', {transform:sideYM(gx, gy + GD + .15, PCB)}, g);
  for(let k = 0; k < 14; k++) el('rect', {x:1.1 + k * .2, y:.02, width:.11, height:PCB - .04, class:'finger'}, fingers);
  box(g, gx, gy, GW, GD, SH, PCB);
  /* fins on the long side */
  const fin = el('g', {transform:sideYM(gx, gy + GD, PCB + SH)}, g);
  for(let k = 0; k < 30; k++) el('line', {x1:.4 + k * .21, y1:.12, x2:.4 + k * .21, y2:SH - .1, class:'edge fin'}, fin);
  /* fans, turning slowly */
  const top = el('g', {transform:floorM(gx, gy, PCB + SH)}, g);
  el('rect', {x:.22, y:.22, width:GW - .44, height:GD - .44, rx:.2, class:'edge', fill:'none'}, top);
  [[GW * .3, GD / 2], [GW * .7, GD / 2]].forEach(([fx, fy]) => {
    const R = 1.22;
    el('circle', {cx:fx, cy:fy, r:R, class:'edge', fill:'var(--face-l)'}, top);
    const rot = el('g', {transform:`translate(${fx},${fy})`}, top);
    const blades = el('g', {class:'fan'}, rot);
    for(let b = 0; b < 9; b++){
      const a = b / 9 * Math.PI * 2, a2 = a + .75;
      el('path', {d:`M${(.34*Math.cos(a)).toFixed(3)},${(.34*Math.sin(a)).toFixed(3)} Q${(.9*Math.cos(a+.2)).toFixed(3)},${(.9*Math.sin(a+.2)).toFixed(3)} ${(1.1*Math.cos(a2)).toFixed(3)},${(1.1*Math.sin(a2)).toFixed(3)}`, class:'edge blade'}, blades);
    }
    el('circle', {cx:0, cy:0, r:.34, class:'hubdot'}, rot);
  });
  const lab = el('text', {transform:sideXR(gx + GW, gy + GD, PCB + SH), class:'lab', 'font-size':.3, x:.3, y:.4}, g); lab.textContent = 'AI skills';
  /* its floor label sits behind the card, away from the power bus */
  const l1 = floorText(g, gx - 1.5, gy + .9, 'AI skills', .55), l2 = floorText(g, gx - 1.5, gy + 1.65, 'Powers every station', .36, 'lab sm');
  l1.setAttribute('text-anchor', 'end'); l2.setAttribute('text-anchor', 'end');
  return {g, GW, GD};
}

/* ---------------- the line ---------------- */
const svg = document.getElementById('map');
const root = el('g', {}, svg);
const W = 2.8, H = 1.1, BUS = UP - W / 2 - 2.2, HUB = [(STATIONS.length - 1) * STEP / 2 - 2.6, BUS - 7.4];
const xs = STATIONS.map((s, i) => i * STEP), ys = STATIONS.map((s, i) => i % 2 ? DOWN : UP);

const grid = el('g', {class:'grid', transform:floorM(0, 0), 'data-name':'Floor grid'}, root);
for(let i = -20; i <= 40; i++) el('line', {x1:i, y1:-22, x2:i, y2:20}, grid);
for(let j = -22; j <= 20; j++) el('line', {x1:-20, y1:j, x2:40, y2:j}, grid);

const power = el('g', {'data-name':'Power'}, root);
tube(power, `M${xs[0]},${BUS} L${xs[xs.length - 1]},${BUS}`, .25, .26, 'bus', 'Power bus');
tube(power, `M${HUB[0] + 1},${HUB[1] + 3.4} L${HUB[0] + 1},${BUS}`, .25, .26, 'feed', 'Power feed');
const drops = xs.map((x, i) => tube(power, `M${x},${BUS} L${x},${ys[i] - W / 2}`, .25, .26, 'drop', `Power drop ${i + 1}`));
xs.forEach(x => { const c = el('g', {transform:floorM(x, BUS, .25)}, power); el('circle', {cx:0, cy:0, r:.26, class:'edge', fill:'var(--paper)'}, c); });

gpu(root, HUB[0], HUB[1]);

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

/* ---------------- the detail face ---------------- */
const stage = document.getElementById('stage');
const dsvg = document.getElementById('dmap');
function logoTile(key){
  const t = T[key], li = document.createElement('li');
  const tile = document.createElement('span'); tile.className = 'logo';
  if(t.logo){ const L = LOGOS[t.logo]; tile.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${L.hex}" d="${L.d}"/></svg>`; }
  else if(t.img){ tile.innerHTML = `<img src="${t.img}" alt="" width="96" height="96">`; }
  else if(t.ph){ tile.innerHTML = `<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="${USER_CHECK}"/></svg>`; }
  else { tile.classList.add('mono'); tile.textContent = t.mono; }
  const n = document.createElement('span'); n.className = 'nm'; n.textContent = t.n;
  li.append(tile, n); return li;
}
function drawDetail(i){
  dsvg.innerHTML = '';
  const s = STATIONS[i], r = el('g', {}, dsvg);
  const DW = 3.6, DH = 1.35;
  const dg = el('g', {class:'grid', transform:floorM(0, 0)}, r);
  for(let k = -14; k <= 14; k++){ el('line', {x1:k, y1:-14, x2:k, y2:14}, dg); el('line', {x1:-14, y1:k, x2:14, y2:k}, dg); }
  /* power from behind, the line in from the left and out to the right */
  tube(r, `M0,-6 L0,${-DW / 2}`, .25, .26, 'drop on', 'Power');
  if(i > 0) tube(r, `M-6.5,0 L${-DW / 2},0`, .4, .78, 'seg on', 'In');
  if(i < STATIONS.length - 1) tube(r, `M${DW / 2},0 L6.5,0`, .4, .78, 'seg', 'Out');
  const [g, pg] = unit(r, s, i, 0, 0, DW, DH);
  g.classList.add('on'); g.removeAttribute('tabindex'); g.removeAttribute('role'); g.removeAttribute('aria-label');
  pg.classList.add('on');
  dg.style.display = 'none';
  const b = r.getBBox(), p = 18;
  dg.style.display = '';
  dsvg.setAttribute('viewBox', `${b.x - p} ${b.y - p} ${b.width + p * 2} ${b.height + p * 2}`);
  const c = el('clipPath', {id:'dframe'}, dsvg); el('rect', {x:b.x - p, y:b.y - p, width:b.width + p * 2, height:b.height + p * 2}, c);
  r.setAttribute('clip-path', 'url(#dframe)');
  document.getElementById('dNum').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(STATIONS.length).padStart(2, '0');
  document.getElementById('dName').textContent = s.name;
  document.getElementById('dText').textContent = s.text;
  const st = document.getElementById('dStat'); st.textContent = s.stat; st.hidden = !s.stat;
  const ul = document.getElementById('dStack'); ul.innerHTML = ''; s.stack.forEach(k => ul.appendChild(logoTile(k)));
  document.getElementById('dPrev').disabled = i === 0;
  document.getElementById('dNext').disabled = i === STATIONS.length - 1;
}
let detailAt = -1;
function openDetail(i){
  stopAuto(); set(i); drawDetail(i); detailAt = i;
  stage.classList.add('flipped');
  document.getElementById('faceMap').setAttribute('aria-hidden', 'true');
  document.getElementById('faceMap').inert = true;
  document.getElementById('faceDetail').setAttribute('aria-hidden', 'false');
  document.getElementById('faceDetail').inert = false;
  setTimeout(() => document.getElementById('dBack').focus({preventScroll:true}), REDUCED ? 0 : 450);
}
function closeDetail(){
  stage.classList.remove('flipped');
  document.getElementById('faceMap').setAttribute('aria-hidden', 'false');
  document.getElementById('faceMap').inert = false;
  document.getElementById('faceDetail').setAttribute('aria-hidden', 'true');
  document.getElementById('faceDetail').inert = true;
  const back = stG[detailAt]; detailAt = -1;
  setTimeout(() => back && back.focus({preventScroll:true}), REDUCED ? 0 : 450);
}
document.getElementById('faceDetail').inert = true;
document.getElementById('dBack').addEventListener('click', closeDetail);
document.getElementById('dPrev').addEventListener('click', () => { if(detailAt > 0){ detailAt--; set(detailAt); drawDetail(detailAt); } });
document.getElementById('dNext').addEventListener('click', () => { if(detailAt < STATIONS.length - 1){ detailAt++; set(detailAt); drawDetail(detailAt); } });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && stage.classList.contains('flipped')) closeDetail(); });

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
  g.addEventListener('mouseenter', () => { stopAuto(); set(i); });
  g.addEventListener('focus', () => { stopAuto(); set(i); });
  g.addEventListener('click', () => openDetail(i));
  g.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openDetail(i); } });
});
set(0);
REDUCED ? stopAuto() : startAuto();
</script>
