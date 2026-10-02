/* Banco de Dados I — RPG · motor "puppet": heróis animados em canvas, em quadros de pixel art (12 fps).
   Corpo recortado + props desenhados em pixel art por código (cajado, Bíblia, runas, escudos, partículas).
   API: Puppet.has(w) · Puppet.play(w, nome, opts) · Puppet.setDead(w, bool) · Puppet.setAura(w, cor) · Puppet.reset() */
(() => {
'use strict';
const FPS = 12, U = 3;                       // 12 quadros/s; "pixel" dos props = 3 px do jogo (igual à arte)
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, easeOut = t => 1 - (1 - t) * (1 - t);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));      // progresso de t dentro de [a,b]
const snap = v => Math.round(v);

// ===== Primitivas de pixel art (tudo alinhado à grade U) =====
function px(c, x, y, w, h, col){ c.fillStyle = col; c.fillRect(Math.round(x / U) * U, Math.round(y / U) * U, w * U, h * U); }
function disc(c, cx, cy, r, col, a = 1){            // círculo "pixelado"
  c.save(); c.globalAlpha *= a; c.fillStyle = col;
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + .25)); c.fillRect(Math.round(cx / U) * U - w * U, Math.round(cy / U) * U + y * U, (w * 2 + 1) * U, U); }
  c.restore();
}
function ring(c, cx, cy, r, col, a = 1, thick = 1){   // anel pixelado
  c.save(); c.globalAlpha *= a; c.fillStyle = col; const n = Math.max(12, r * 6);
  for (let i = 0; i < n; i++) { const ang = i / n * Math.PI * 2; c.fillRect(Math.round((cx + Math.cos(ang) * r * U) / U) * U, Math.round((cy + Math.sin(ang) * r * U) / U) * U, thick * U, thick * U); }
  c.restore();
}
function star(c, x, y, s, col, a = 1){                // brilho em cruz
  c.save(); c.globalAlpha *= a; c.fillStyle = col; const X = Math.round(x / U) * U, Y = Math.round(y / U) * U;
  c.fillRect(X - s * U, Y, (s * 2 + 1) * U, U); c.fillRect(X, Y - s * U, U, (s * 2 + 1) * U);
  c.fillStyle = '#fff'; c.fillRect(X, Y, U, U); c.restore();
}
function mote(c, x, y, col, a = 1){ c.save(); c.globalAlpha *= a; c.fillStyle = col; c.fillRect(Math.round(x / U) * U, Math.round(y / U) * U, U, U); c.restore(); }
function sprite(c, rows, x, y, pal, flip){            // desenha sprite em strings
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && pal[ch]) px(c, x + (flip ? rows[0].length - 1 - i : i) * U, y + j * U, 1, 1, pal[ch]); }));
}

// ===== Props: Bíblia =====
const BOOK_PAL = {k:'#1a0b08', r:'#8c1d2b', R:'#c0392b', g:'#ffd24d', G:'#fff0a8', w:'#fff6dc', p:'#e8dcc0', l:'#caa86a', y:'#ffe9a0'};
const BOOK_CLOSED = [
  '.kkkkkkkkkk.',
  'krrrrrrrrrrk',
  'krrrrggrrrrk',
  'krrrrggrrrrk',
  'krrggggggrrk',
  'krrrrggrrrrk',
  'krrrrggrrrrk',
  'krrrrggrrrrk',
  'kRRRRRRRRRRk',
  '.kkkkkkkkkk.'];
const BOOK_HALF = [
  '..kkkkkkkkkkkk..',
  '.krrrrrrwwpprrk.',
  'krrrrrrlwwpprrrk',
  'krrggrrlwwppllrk',
  'krrrrrrlwwppllrk',
  'krrrrrrlwwpprrrk',
  'kRRRRRRlwwpRRRRk',
  '.kkkkkkkkkkkkkk.'];
const BOOK_OPEN = [
  '.kkkkkkkkkkkkkkkkkkkkkkk.',
  'kwwwwwwwwwwwkkwwwwwwwwwwk',
  'kwllllllllwwkkwwllllllwwk',
  'kwwwwwwwwwwwkkwwwwwwwwwwk',
  'kwllllllllwwkkwwllllllwwk',
  'kwwwwwwwwwwwkkwwwwwwwwwwk',
  'kwlllllllwwwkkwwwllllllwk',
  'kwwwwwwwwwwwkkwwwwwwwwwwk',
  'krrrrrrrrrrrkkrrrrrrrrrrk',
  '.kkkkkkkkkkkkkkkkkkkkkkk.'];
const BOOK_OPEN2 = BOOK_OPEN.map(r => r.replace(/l/g, 'y'));
function drawBook(c, cx, cy, st, glowCol){            // st: 0 fechado, 1 meio, 2 aberto, 3 aberto brilhando
  const rows = [BOOK_CLOSED, BOOK_HALF, BOOK_OPEN, BOOK_OPEN2][st], w = rows[0].length * U, h = rows.length * U;
  if (st >= 2) { c.save(); c.globalCompositeOperation = 'lighter'; disc(c, cx, cy - 6, 9, glowCol || '#ffd24d', st === 3 ? .35 : .2); c.restore(); }
  sprite(c, rows, cx - w / 2, cy - h / 2, BOOK_PAL);
}

// ===== Prop: cajado da Maga (cristal azul em garras de ouro) =====
function drawStaff(c, gx, gy, rot, o = {}){
  const col = o.color || '#4d8dff', core = o.core || '#cfe6ff', pv = o.pivot || 0;
  c.save(); c.translate(gx, gy); c.rotate(rot); c.translate(0, -pv);
  // haste de 3 colunas (grip na origem local; cristal em cima)
  for (let y = -64; y <= 100; y += U) { const band = ((y + 64) / U) % 9 === 0 || ((y + 64) / U) % 9 === 4;
    px(c, -U, y, 1, 1, band ? '#c98a22' : '#3a1c10'); px(c, 0, y, 1, 1, band ? '#ffd86b' : '#6a3a20'); px(c, U, y, 1, 1, band ? '#ffe9a0' : '#8a5230'); }
  px(c, -U, 100, 3, 1, '#c98a22'); px(c, 0, 103, 1, 1, '#ffd86b'); px(c, 0, 106, 1, 1, '#ffe9a0');   // ponteira
  // garras de ouro
  [[-15, -84], [-12, -78], [-9, -72], [15, -84], [12, -78], [9, -72]].forEach(([x, y]) => { px(c, x, y, 1, 1, '#ffd86b'); px(c, x + (x < 0 ? -3 : 3), y - 3, 1, 1, '#c98a22'); });
  px(c, -9, -64, 7, 1, '#ffd86b'); px(c, -6, -67, 5, 1, '#c98a22');
  // cristal
  c.save(); if (o.glow !== 0) { c.globalCompositeOperation = 'lighter'; const g = o.glow == null ? 1 : o.glow; disc(c, 0, -90, 8 + Math.round(g * 4), col, .25 * g); disc(c, 0, -90, 5 + Math.round(g * 2), col, .35 * g); } c.restore();
  disc(c, 0, -90, 6, '#1a3a8a'); disc(c, 0, -90, 5, col); disc(c, -3, -93, 3, core); mote(c, -3, -96, '#fff');
  c.restore();
}

// ===== Efeitos reutilizáveis =====
function hexShield(c, cx, cy, r, col, a, t){
  c.save(); c.globalAlpha *= a; c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI * 2 + t * .3, a1 = (k + 1) / 6 * Math.PI * 2 + t * .3;
    for (let i = 0; i <= 10; i++) { const f = i / 10; px(c, cx + (Math.cos(a0) * (1 - f) + Math.cos(a1) * f) * r * U, cy + (Math.sin(a0) * (1 - f) + Math.sin(a1) * f) * r * U * 1.15, 1, 1, col); }
    for (let i = 1; i < 5; i++) { const f = i / 5; px(c, cx + Math.cos(a0) * r * U * f, cy + Math.sin(a0) * r * U * f * 1.15, 1, 1, col); } }
  disc(c, cx, cy, r - 1, col, .08); c.restore();
}
function puff(c, cx, cy, t, col = '#cfd6ff'){
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, d = easeOut(t) * (10 + (i % 3) * 5) * U / 1.5;
    c.save(); c.globalAlpha = 1 - t; px(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7 - t * 8, 2 - (t > .5 ? 1 : 0), 2 - (t > .5 ? 1 : 0), col); c.restore(); }
}
function beamCol(c, cx, topY, botY, w, col, a){
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) { c.globalAlpha = a * (.18 + i * .12); c.fillStyle = col; const ww = (w - i * 2) * U; c.fillRect(Math.round(cx / U) * U - ww / 2, topY, ww, botY - topY); }
  c.restore();
}
function glyph(c, x, y, col, a, seed){                // runa pequena (3x3 px com padrão)
  const P = [[1,0,1,0,1,1,1,0,1],[0,1,0,1,1,1,0,1,0],[1,1,0,0,1,0,0,1,1],[1,0,1,1,1,1,1,0,0]][seed % 4];
  c.save(); c.globalAlpha *= a; P.forEach((v, i) => { if (v) px(c, x + (i % 3) * U, y + Math.floor(i / 3) * U, 1, 1, col); }); c.restore();
}
function sparkleBurst(c, cx, cy, t, col, n = 8, r = 7){
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + .3, d = easeOut(t) * r * U; c.save(); c.globalAlpha = 1 - t; mote(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, i % 2 ? '#fff' : col); c.restore(); }
}

// ===== Definições dos heróis (coordenadas locais ao sprite) =====

// ===== Mão procedural (dedos animáveis) =====
function drawHand(c, x, y, o){
  const fh = o.fh || 1, rows = 4 * fh, cols = o.cols || 4, th = clamp(o.thumb || 0), fc = o.fc || [o.curl || 0, o.curl || 0, o.curl || 0, o.curl || 0];
  c.save(); c.translate(Math.round(x), Math.round(y)); if (o.rot) c.rotate(o.rot);
  const X0 = -Math.floor(cols / 2) * U, Y0 = -Math.floor(rows / 2) * U, line = o.line, skin = o.skin, shade = o.shade, hi = o.hi || skin;
  const ext = i => Math.round(clamp(fc[i]) * (2 + (i === 1 || i === 2 ? 1 : 0)));
  // contorno geral
  c.fillStyle = line; c.fillRect(X0 - U, Y0 - U, (cols + 2) * U, (rows + 2) * U);
  for (let i = 0; i < 4; i++) { const e = ext(i); if (e) c.fillRect(X0 + cols * U, Y0 + i * fh * U - U * (i ? 0 : 1) + (i ? 0 : U), (e + 1) * U, fh * U + (i === 3 ? U : 0)); }
  const th2 = Math.round(th * 2); c.fillRect(X0 - U, Y0 - U * (2 + th2), 3 * U, U * (2 + th2));
  // palma + dedos
  c.fillStyle = skin; c.fillRect(X0, Y0, cols * U, rows * U);
  for (let i = 0; i < 4; i++) {
    const fy = Y0 + i * fh * U, e = ext(i);
    if (e) { c.fillStyle = skin; c.fillRect(X0 + cols * U, fy, e * U, fh * U); c.fillStyle = shade; c.fillRect(X0 + cols * U, fy + (fh - 1) * U, e * U, U); c.fillStyle = hi; c.fillRect(X0 + (cols + e - 1) * U, fy, U, U); }
    c.fillStyle = shade; c.fillRect(X0 + U * (cols - 2), fy + (fh - 1) * U, U * 2, U);               // vinco entre dedos
    c.fillStyle = hi; c.fillRect(X0 + U * (cols - 3), fy, U, U);                                    // nó do dedo
    if (i) { c.fillStyle = line; c.fillRect(X0 + U * (cols - 1), fy, U, U / 3 | 0 || 1); }
  }
  // polegar
  c.fillStyle = skin; c.fillRect(X0, Y0 - U * (1 + th2), 2 * U, U * (1 + th2)); c.fillStyle = shade; c.fillRect(X0 + U, Y0 - U * (1 + th2), U, U * (1 + th2)); c.fillStyle = hi; c.fillRect(X0, Y0 - U * (1 + th2), U, U);
  // pulso / punho da manga
  if (o.cuff) { c.fillStyle = o.cuff; c.fillRect(X0 - 2 * U, Y0 + U, 2 * U, (rows - 2) * U); c.fillStyle = line; c.fillRect(X0 - 3 * U, Y0, U, rows * U); }
  c.restore();
}

// ===== Definições dos heróis (coordenadas locais ao sprite) =====
const DEF = {
  mage: {
    meta:{x:19, y:805, w:237, h:276}, pad:{l:70, t:100, r:70, b:30}, feet:[118, 268], center:[110, 150], aura:'#6a4dff',
    base:'rig/mage_base.png', parts:[{k:'arm', src:'rig/mage_arm.png', pivot:[154, 94]}, {k:'hat', src:'rig/mage_hat.png', pivot:[112, 60]}],
    zones:{top:66, waist:140, hem:272, cape:{x0:15, x1:115, y0:100, y1:240}, feet:{y:250, xs:[70, 150]}},
    hands:{R:{at:[197, 111], arm:'armR', armPart:'arm', fh:2, cols:4, skin:'#c9683f', shade:'#8d3f2a', hi:'#f0a070', line:'#1a0b08', cuff:'#d89a2a'}},
    hat:[112, 62], shoulder:[154, 94], grip:[196, 109]
  },
  assassin: {
    meta:{x:747, y:805, w:247, h:307}, pad:{l:100, t:60, r:20, b:20}, feet:[150, 290], center:[150, 160], aura:'#ffe08a',
    base:'rig/cleric_base.png', parts:[{k:'armL', src:'rig/cleric_armL.png', pivot:[96, 114]}, {k:'armR', src:'rig/cleric_armR.png', pivot:[178, 98]}, {k:'hat', src:'rig/cleric_hood.png', pivot:[130, 76]}],
    zones:{top:88, waist:145, hem:288, drape:{x0:150, x1:245, y0:180, y1:255}, feet:{y:262, xs:[80, 190]}},
    hands:{R:{at:[201, 87], arm:'armR', armPart:'armR', fh:1, cols:4, skin:'#f0b79a', shade:'#c98a70', hi:'#ffe0cc', line:'#3a1c10'},
           L:{at:[73, 165], arm:'armL', armPart:'armL', fh:2, cols:4, rot:Math.PI / 2, skin:'#f0b79a', shade:'#c98a70', hi:'#ffe0cc', line:'#3a1c10', curl0:.5}},
    hat:[130, 40], shoulder:[178, 98], staffHead:[203, 45], head:[130, 40], free:[72, 165]
  }
};
const PARTSRC = {};
const P = {};     // instâncias
const newPose = () => ({body:{lean:0, breath:0, sway:0, cape:0, footL:0, footR:0, crouch:0}, hat:{rot:0, dx:0, dy:0}, armR:{rot:0, dx:0, dy:0}, armL:{rot:0, dx:0, dy:0},
  handR:{curl:0, thumb:0, rot:0, fc:null, vis:true}, handL:{curl:0, thumb:0, rot:0, fc:null, vis:true}});

function img(src){ const i = new Image(); i.src = src; return i; }
function make(w){
  const d = DEF[w]; const m = d.meta, pad = d.pad;
  const cw = m.w + pad.l + pad.r, ch = m.h + pad.t + pad.b;
  const box = document.createElement('div'); box.className = 'pup ' + w;
  box.style.cssText = `position:absolute;z-index:4;pointer-events:none;left:${(m.x - pad.l) / 1024 * 100}%;top:${(m.y - pad.t) / 1536 * 100}%;width:${cw / 1024 * 100}%;height:${ch / 1536 * 100}%`;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; cv.style.cssText = 'width:100%;height:100%;display:block'; box.appendChild(cv);
  $('#reference').after(box);
  const oc = document.createElement('canvas'); oc.width = cw; oc.height = ch;
  const p = {w, d, box, cv, c:cv.getContext('2d'), baseImg:img(d.base), parts:d.parts.map(q => ({...q, img:img(q.src)})), oc, oco:oc.getContext('2d'), pad, cur:null, idleT:null, busy:0, time:0, S:null, dead:false, aura:null, cells:null, pos:{}};
  p.c.imageSmoothingEnabled = false; p.oco.imageSmoothingEnabled = false;
  resetState(p); return p;
}
function resetState(p){
  p.S = {dx:0, dy:0, sx:1, sy:1, rot:0, alpha:1, tint:null, dither:0, staff:{mode:'hand', x:0, y:0, rot:.14, glow:1, color:null, vis:true}, layers:[], pose:newPose(), extra:null};
}

// ===== Malha (deformação do corpo) =====
const CS = 6;
function buildCells(p){
  const im = p.baseImg, w = im.naturalWidth, h = im.naturalHeight, g = document.createElement('canvas'); g.width = w; g.height = h;
  const x = g.getContext('2d', {willReadFrequently:true}); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, w, h).data, cells = [];
  for (let cy = 0; cy < h; cy += CS) for (let cx = 0; cx < w; cx += CS) {
    let any = false; for (let y = cy; y < Math.min(h, cy + CS) && !any; y++) for (let xx = cx; xx < Math.min(w, cx + CS); xx++) if (d[(y * w + xx) * 4 + 3] > 8) { any = true; break; }
    if (any) cells.push([cx, cy, Math.min(CS + 1, w - cx), Math.min(CS + 1, h - cy)]);
  }
  p.cells = cells; p.cw = w; p.ch = h;
}
// movimento "vivo" contínuo (somado às poses): respiração, balanço da barra, capa ao vento, capuz
function life(p){
  if (p.dead) return {lean:0, breath:0, sway:0, cape:0, hat:0, hatY:0};
  const t = p.time, ph = p.w === 'mage' ? 0 : 1.7;
  return {lean:Math.sin(t / 1700 + ph) * .9, breath:(Math.sin(t / 650 + ph) + 1) * .7, sway:Math.sin(t / 1100 + ph) * 1.4, cape:1.4 + Math.sin(t / 2300 + ph) * .9, hat:Math.sin(t / 1900 + ph) * .014, hatY:0};
}
function makeField(p, S){
  const Z = p.d.zones, B = S.pose.body, L = life(p), t = p.time;
  const lean = B.lean + L.lean, breath = B.breath + L.breath, sway = B.sway + L.sway, cape = B.cape + L.cape, crouch = B.crouch;
  return (x, y) => {
    const up = clamp((Z.waist - y) / (Z.waist - Z.top)), down = clamp((y - Z.waist) / (Z.hem - Z.waist));
    let dx = lean * up * up + sway * Math.pow(down, 1.4), dy = -breath * up + crouch * (1 - up * .0) * Math.min(1, y / Z.hem);
    if (Z.cape) { const q = Z.cape, cw = clamp((q.x1 - x) / (q.x1 - q.x0)) * clamp((y - q.y0) / (q.y1 - q.y0)); dx += cape * cw * Math.sin(t / 380 + y * .045) * 1.2 - cape * cw * .6; dy += cw * Math.sin(t / 520 + x * .05) * .6; }
    if (Z.drape) { const q = Z.drape, cw = clamp((x - q.x0) / (q.x1 - q.x0)) * clamp((y - q.y0) / (q.y1 - q.y0)); dx += cape * cw * Math.sin(t / 420 + y * .05) * 1.3; dy += cw * Math.sin(t / 560 + x * .06) * .8; }
    if (Z.feet && y > Z.feet.y) { const f = clamp((y - Z.feet.y) / 24), left = x < (Z.feet.xs[0] + Z.feet.xs[1]) / 2; const k = left ? B.footL : B.footR; dy -= Math.max(0, k) * f * 5; dx += k * f * 2; }
    return [dx, dy];
  };
}
function drawMesh(c, p, S, field){
  if (!p.cells) { if (!p.baseImg.complete || !p.baseImg.naturalWidth) return; buildCells(p); }
  const im = p.baseImg;
  for (const [x, y, w, h] of p.cells) { const f = field(x + CS / 2, y + CS / 2); c.drawImage(im, x, y, w, h, x + Math.round(f[0]), y + Math.round(f[1]), w, h); }
}
// ponto de um ponto-do-corpo após o movimento do braço/parte
function partXf(p, S, field, key, pt){
  const q = p.parts.find(r => r.k === (key === 'hat' ? 'hat' : (key === 'armR' && p.w === 'mage' ? 'arm' : key)));
  const po = S.pose[key] || {rot:0, dx:0, dy:0}, pv = q.pivot, f = field(pv[0], pv[1]), rot = po.rot;
  const vx = pt[0] - pv[0], vy = pt[1] - pv[1], co = Math.cos(rot), si = Math.sin(rot);
  return [pv[0] + f[0] + po.dx + vx * co - vy * si, pv[1] + f[1] + po.dy + vx * si + vy * co, rot];
}

// ===== Loop de quadros =====
let tickId = null, last = 0;
function ticker(){
  const now = performance.now();
  if (now - last >= 1000 / FPS - 2) { last = now; Object.values(P).forEach(p => step(p, now)); }
  tickId = requestAnimationFrame(ticker);
}
function step(p, now){
  p.time = now;
  if (p.cur) {
    const t = clamp((now - p.cur.start) / p.cur.dur);
    resetBase(p); p.cur.fn(t, p.S, p);
    if (t >= 1) { const r = p.cur.res; p.cur = null; r(); }
  } else resetBase(p);
  render(p);
}
function resetBase(p){ const keep = p.S.extra; resetState(p); p.S.extra = keep; }
function run(p, dur, fn){ return new Promise(res => { if (p.cur) p.cur.res(); p.cur = {start:performance.now(), dur, fn, res}; }); }

// ===== Render =====
function drawRig(o, p, S){
  const d = p.d, field = makeField(p, S), L = life(p), PO = S.pose;
  drawMesh(o, p, S, field);
  // partes rígidas (ordem do DEF), presas à malha pelo pivô
  p.parts.forEach(q => {
    if (!q.img.complete || !q.img.naturalWidth) return;
    const key = q.k === 'arm' ? 'armR' : q.k, po = PO[key], f = field(q.pivot[0], q.pivot[1]);
    o.save(); o.translate(q.pivot[0] + f[0] + po.dx, q.pivot[1] + f[1] + po.dy + (key === 'hat' ? 0 : 0)); o.rotate(po.rot + (key === 'hat' ? L.hat : 0)); o.translate(-q.pivot[0], -q.pivot[1]); o.drawImage(q.img, 0, 0); o.restore();
  });
  // cajado da maga (preso à mão, ou livre) — entre o braço e os dedos
  const hp = {};
  Object.keys(d.hands).forEach(side => {
    const hd = d.hands[side], key = 'arm' + side, a = partXf(p, S, field, key, hd.at); hp[side] = a;
  });
  p.pos.hand = hp;
  if (p.w === 'mage') drawStaffFor(p, o, S, hp.R);
  else { const a = partXf(p, S, field, 'armR', d.staffHead); p.pos.staffHead = [a[0], a[1]]; const h = partXf(p, S, field, 'hat', d.head); p.pos.head = [h[0], h[1]]; }
  if (p.w === 'mage') { const h = partXf(p, S, field, 'hat', d.hat); p.pos.head = [h[0], h[1]]; }
  // mãos com dedos
  Object.keys(d.hands).forEach(side => {
    const hd = d.hands[side], hs = PO['hand' + side]; if (hs.vis === false) return; const a = hp[side];
    drawHand(o, a[0], a[1], {...hd, rot:(hd.rot || 0) + a[2] + (hs.rot || 0), curl:(hs.curl != null ? hs.curl : 0) + (hd.curl0 || 0), fc:hs.fc && hs.fc.map(v => v + (hd.curl0 || 0)), thumb:hs.thumb});
  });
}
function render(p){
  const c = p.c, S = p.S, d = p.d, pad = p.pad, o = p.oco, W = p.cv.width, H = p.cv.height;
  c.clearRect(0, 0, W, H);
  o.clearRect(0, 0, W, H); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
  if (p.dead || S.alpha > 0) {
    o.save(); o.translate(pad.l, pad.t); drawRig(o, p, S); o.restore();
    if (S.tint) { o.globalCompositeOperation = 'source-atop'; o.globalAlpha = S.tint.a; o.fillStyle = S.tint.c; o.fillRect(0, 0, W, H); o.globalAlpha = 1; }
    if (p.dead) { o.globalCompositeOperation = 'source-atop'; o.fillStyle = 'rgba(20,20,30,.62)'; o.fillRect(0, 0, W, H); }
    if (S.dither > 0) { o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; const step = 3; for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) { const q = ((x / step) * 7 + (y / step) * 13) % 16 / 16; if (q < S.dither) o.fillRect(x, y, step, step); } }
    o.globalCompositeOperation = 'source-over';
  }
  c.save(); c.translate(pad.l, pad.t);
  (S.layers || []).filter(l => l.back).forEach(l => l.draw(c, p));
  c.restore();
  if (p.dead || S.alpha > 0) {
    c.save(); c.globalAlpha = S.alpha;
    if (p.aura && !p.dead) { c.shadowColor = p.aura; c.shadowBlur = 14; }
    const fx = pad.l + d.feet[0], fy = pad.t + d.feet[1];
    c.translate(fx + S.dx, fy + S.dy); c.rotate(S.rot); c.scale(S.sx, S.sy); c.translate(-fx, -fy);
    c.drawImage(p.oc, 0, 0); c.restore();
  }
  c.save(); c.translate(pad.l, pad.t);
  (S.layers || []).filter(l => !l.back).forEach(l => l.draw(c, p));
  if (p.dead) { c.save(); c.translate(d.center[0], 6); px(c, -6, 0, 5, 4, '#e8e8f0'); px(c, -3, 4, 3, 1, '#e8e8f0'); px(c, -6, 6, 1, 1, '#e8e8f0'); px(c, 0, 6, 1, 1, '#e8e8f0'); c.restore(); }
  c.restore();
}
function drawStaffFor(p, c, S, hp){
  const st = S.staff; if (!st.vis) return;
  if (st.mode === 'hand') drawStaff(c, hp[0] + st.x, hp[1] + st.y, st.rot + hp[2], {glow:st.glow, color:st.color});
  else drawStaff(c, st.x, st.y, st.rot, {glow:st.glow, color:st.color, pivot:st.pivot});
  const pv = st.pivot || 0, rr = st.mode === 'hand' ? st.rot + hp[2] : st.rot, gx = st.mode === 'hand' ? hp[0] + st.x : st.x, gy = st.mode === 'hand' ? hp[1] + st.y : st.y;
  p.pos.crystal = [gx + Math.sin(rr) * (90 + pv), gy - Math.cos(rr) * (90 + pv)];
}

// ===== Animações =====
const ANIM = { mage:{}, assassin:{} };
const IDLE = { mage:[], assassin:[] };
const alias = () => { const m = ANIM.mage; m.melee = m.heavy = m.holy = m.cast; };
const L = (S, draw, back) => S.layers.push({draw, back});
const lerp = (a, b, k) => a + (b - a) * k;
const kf = (t, pts) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, a] = pts[i - 1], [t1, b] = pts[i]; return a + (b - a) * ease((t - t0) / (t1 - t0)); } return pts[pts.length - 1][1]; };
const wig = (t, f, k = 1) => [0, 1, 2, 3].map(i => k * (.55 + .45 * Math.sin(t * f + i * 1.4)));   // dedos ondulando
// cajado preso à mão: rotação absoluta (compensa o giro do braço)
const world = (S, r) => { S.staff.rot = r - S.pose.armR.rot; };
// cajado solto: (x,y) = ponto de empunhadura; rot absoluta
const gripFree = (S, x, y, rot) => { S.staff.mode = 'free'; S.staff.pivot = 14; S.staff.x = x - Math.sin(rot) * 14; S.staff.y = y + Math.cos(rot) * 14; S.staff.rot = rot; };
const hnd = (p, s = 'R') => (p.pos.hand && p.pos.hand[s]) || [197, 111, 0];
const crys = p => p.pos.crystal || [200, 20];

// ---------- MAGA ----------
IDLE.mage.push({name:'giro', dur:3800, fn:(t, S, p) => {                 // lança o cajado ao ar, ele gira e ela o agarra
  const PO = S.pose, h = hnd(p), lift = seg(t, 0, .14), land = seg(t, .7, .88), spin = seg(t, .14, .7);
  const r = easeOut(lift) * (1 - ease(land)), k = kf(t, [[0, 0], [.14, 1], [.7, 1], [.88, 0]]), op = kf(t, [[0, 0], [.12, 0], [.19, 1], [.7, 1], [.8, .15], [.88, 0]]);
  PO.armR.rot = -.62 * k; PO.hat.rot = -.07 * k + .06 * Math.sin(seg(t, .88, 1) * Math.PI); PO.hat.dy = Math.round(2 * Math.sin(seg(t, .88, 1) * Math.PI));
  PO.body.crouch = kf(t, [[0, 0], [.07, 1.6], [.15, -1.2], [.5, -.3], [.7, 0]]); PO.body.lean = -2 * k; PO.body.cape = 2 + 5 * k; PO.body.sway = 2.5 * k;
  PO.handR.fc = wig(t, 38, op); PO.handR.thumb = op; PO.handR.rot = -.35 * op;
  const rot = .14 + PO.armR.rot + ease(spin) * Math.PI * 4;
  gripFree(S, h[0] + 8 * r, h[1] - 46 * r, rot); S.staff.glow = 1 + .7 * r;
  L(S, c => {
    const [cx, cy] = [S.staff.x, S.staff.y];
    if (spin > 0 && spin < 1) for (let i = 0; i < 12; i++) { const a = rot - i * .26, d = 98; mote(c, cx + Math.sin(a) * d, cy - 14 - Math.cos(a) * d, i % 3 === 0 ? '#fff' : '#6fb4ff', 1 - i / 12); }
    if (lift > 0 && lift < 1) sparkleBurst(c, h[0], h[1] - 6, lift, '#9fd0ff', 8, 6);
    if (land > .8 && land < 1) { sparkleBurst(c, h[0], h[1], land, '#cfe6ff', 8, 8); star(c, h[0], h[1] - 6, 3, '#cfe6ff', 1); }
    if (r > .3) ring(c, cx, cy - 14, 22 + Math.round(3 * Math.sin(t * 20)), '#6fb4ff', .3 * r);
  });
}});
IDLE.mage.push({name:'orbe', dur:3200, fn:(t, S, p) => {                 // fita o cristal: chapéu inclina, dedos batucam, cristal pulsa
  const PO = S.pose, g = .6 + .4 * Math.sin(t * Math.PI * 6), k = kf(t, [[0, 0], [.18, 1], [.8, 1], [1, 0]]);
  PO.armR.rot = -.2 * k; world(S, .14 - .1 * k); PO.hat.rot = -.05 * k + .02 * Math.sin(t * 20) * k; PO.body.lean = -1.5 * k; PO.body.cape = 2.5;
  PO.handR.fc = [0, 1, 2, 3].map(i => Math.max(0, Math.sin(t * 24 - i * 1.1)) * .8 * k); PO.handR.thumb = k * .3;
  S.staff.glow = g + .4 * k;
  L(S, c => { const [ox, oy] = crys(p); for (let i = 0; i < 5; i++) { const a = t * Math.PI * 4 + i * 1.256; mote(c, ox + Math.cos(a) * 24, oy + Math.sin(a) * 9 - 2, i % 2 ? '#9fd0ff' : '#fff', .9 * k); } if (g > .95) star(c, ox, oy, 4, '#fff', k); });
}});
IDLE.mage.push({name:'runas', dur:3400, fn:(t, S, p) => {                // conjura: cajado levita, mão aberta desenha círculo de runas
  const PO = S.pose, h = hnd(p), k = kf(t, [[0, 0], [.2, 1], [.82, 1], [1, 0]]);
  PO.armR.rot = -.5 * k; PO.hat.rot = -.04 * k; PO.body.lean = -1.5 * k; PO.body.cape = 2 + 4 * k; PO.body.sway = 2 * k;
  PO.handR.fc = wig(t, 22, k); PO.handR.thumb = k; PO.handR.rot = Math.sin(t * 14) * .25 * k;
  gripFree(S, 193, 106 - 3 * Math.sin(t * 6) * k, .1); S.staff.glow = 1 + .5 * k;
  L(S, c => {
    c.save(); c.globalCompositeOperation = 'lighter';
    const cx = h[0] + 6, cy = h[1] - 20; for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2 + t * 6; mote(c, cx + Math.cos(an) * 32 * k, cy + Math.sin(an) * 10 * k, i % 4 === 0 ? '#fff' : '#7a6cff', k); }
    for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 - t * 5; glyph(c, cx + Math.cos(an) * 20 * k - 4, cy + Math.sin(an) * 6 * k - 4, '#b9a8ff', k * .95, i); }
    c.restore();
    for (let i = 0; i < 5; i++) { const ft = (t * 1.4 + i * .2) % 1; mote(c, 60 + i * 30 + Math.sin(ft * 9 + i) * 4, 250 - ft * 190, '#9fd0ff', k * (1 - ft)); }
  }, true);
}});
IDLE.mage.push({name:'chapeu', dur:3200, fn:(t, S, p) => {                // cajado levita; ela cumprimenta tocando a aba do chapéu
  const PO = S.pose, h = hnd(p), k = kf(t, [[0, 0], [.2, 1], [.7, 1], [.88, 0]]), tap = Math.sin(seg(t, .38, .56) * Math.PI);
  PO.armR.rot = -1.72 * k; PO.handR.fc = [0, 0, .9 * k, .9 * k]; PO.handR.thumb = .6 * k; PO.handR.rot = .7 * k;
  PO.hat.rot = .1 * tap - .02 * k; PO.hat.dy = Math.round(2 * tap) + Math.round(-1 * Math.sin(seg(t, .56, .8) * Math.PI)); PO.body.lean = 1.2 * k; PO.body.cape = 3;
  gripFree(S, 195, 104 - 4 * Math.sin(t * 7), .1 - .05 * Math.sin(t * 5)); S.staff.glow = 1.2;
  L(S, c => { if (tap > .2) sparkleBurst(c, h[0], h[1], seg(t, .38, .56), '#ffe9a0', 6, 6); const [ox, oy] = crys(p); mote(c, ox + Math.cos(t * 20) * 14, oy + Math.sin(t * 20) * 6, '#9fd0ff', k); });
}});

ANIM.mage.cast = {dur:900, fn:(t, S, p) => {
  const PO = S.pose, col = (p.opt && p.opt.color) || '#4d8dff', ch = seg(t, 0, .4), rel = seg(t, .4, .58), back = seg(t, .58, 1);
  PO.armR.rot = kf(t, [[0, 0], [.4, .35], [.5, -1.05], [.7, -.9], [1, 0]]); world(S, kf(t, [[0, .14], [.4, -.35], [.5, 1.1], [.7, .9], [1, .14]]));
  PO.hat.rot = kf(t, [[0, 0], [.4, -.06], [.5, .09], [.75, .03], [1, 0]]); PO.hat.dy = Math.round(kf(t, [[0, 0], [.4, -1], [.5, 2], [1, 0]]));
  PO.body.lean = kf(t, [[0, 0], [.4, -4], [.5, 5], [.7, 2], [1, 0]]); PO.body.cape = kf(t, [[0, 2], [.4, 6], [.5, -3], [.8, 4], [1, 2]]); PO.body.sway = kf(t, [[0, 0], [.4, -3], [.5, 3], [1, 0]]); PO.body.crouch = kf(t, [[0, 0], [.4, 1.5], [.5, -1], [1, 0]]);
  PO.handR.fc = [0, 1, 2, 3].map(i => kf(t, [[0, 0], [.46, 0], [.54, .9 - i * .08], [.8, .2], [1, 0]])); PO.handR.thumb = kf(t, [[0, 0], [.5, 1], [1, 0]]);
  S.staff.color = col; S.staff.glow = 1 + 1.5 * ch * (1 - back);
  const [gx, gy] = crys(p);
  L(S, c => {
    if (ch > 0 && rel === 0) for (let i = 0; i < 3; i++) { const r = Math.max(2, Math.round((1 - ((ch * 2 + i / 3) % 1)) * 16)); ring(c, gx, gy, r, i ? col : '#fff', .6); }
    if (rel > 0 && rel < 1) { sparkleBurst(c, gx, gy, rel, col, 10, 9); star(c, gx, gy, 5, '#fff', 1 - rel); }
  });
}};
ANIM.mage.guard = {dur:900, fn:(t, S, p) => {
  const PO = S.pose, col = (p.opt && p.opt.color) || '#4da3ff', up = seg(t, 0, .22), dn = seg(t, .75, 1), k = ease(up) * (1 - ease(dn));
  PO.armR.rot = -.8 * k; world(S, .14 - 1.0 * k); PO.hat.dy = Math.round(2 * k); PO.hat.rot = .06 * k; PO.body.crouch = 3 * k; PO.body.lean = 3 * k; PO.body.cape = 2 + 3 * k;
  PO.handR.fc = [0, 0, 0, 0]; PO.handR.thumb = 0; S.staff.color = col; S.staff.glow = 1 + k;
  L(S, c => { if (k > 0) hexShield(c, 140, 150, 40, col, Math.min(1, k * 1.4) * (t > .5 && t < .75 ? .8 + .2 * Math.sin(t * 60) : 1), t * 4); if (up > .2 && up < 1) sparkleBurst(c, 140, 150, up, col, 8, 12); });
}};
ANIM.mage.dodge = {dur:900, fn:(t, S, p) => {
  const PO = S.pose, out = seg(t, 0, .22), away = seg(t, .22, .62), inn = seg(t, .62, .9);
  S.dither = out < 1 ? out : (inn > 0 ? 1 - inn : 1); S.dx = (away > 0 && inn < 1) ? 26 : 0; S.alpha = S.dither < 1 ? 1 : 0;
  PO.body.lean = 5 * Math.sin(out * Math.PI / 2); PO.hat.rot = .12 * out; PO.armR.rot = .3 * out; PO.body.cape = 7 * out; PO.body.crouch = 2 * out; PO.handR.fc = wig(t, 30, out * .8);
  L(S, c => { if (out > 0 && out < 1) puff(c, 118, 250, out); if (inn > 0 && inn < 1) puff(c, 144, 250, inn, '#9fd0ff'); if (away > 0 && away < 1) for (let i = 0; i < 3; i++) mote(c, 118 + i * 6, 120 + i * 40, '#cfd6ff', 1 - away); });
}};
ANIM.mage.hurt = {dur:560, fn:(t, S, p) => {
  const PO = S.pose, k = Math.floor(t * 4), r = kf(t, [[0, 0], [.12, 1], [.5, .4], [1, 0]]);
  S.tint = k % 2 === 0 ? {c:'#ff3030', a:.7} : (k === 1 ? {c:'#ffffff', a:.55} : null); S.dx = [-5, 3, -2, 0][Math.min(3, k)];
  PO.body.lean = -7 * r; PO.hat.rot = -.2 * r; PO.hat.dx = Math.round(-3 * r); PO.hat.dy = Math.round(-3 * r); PO.armR.rot = .5 * r; PO.body.cape = 8 * r; PO.body.crouch = 2 * r;
  PO.handR.fc = [.9, .9, .9, .9].map(v => v * r); PO.handR.thumb = r; world(S, .14 + .3 * r);
}};
ANIM.mage.ult = {dur:1500, fn:(t, S, p) => {
  const PO = S.pose, h = hnd(p), up = seg(t, 0, .25), k = ease(up) * (1 - ease(seg(t, .85, 1))), spin = seg(t, .15, .85) * Math.PI * 10;
  PO.armR.rot = -1.15 * k; PO.hat.rot = -.12 * k; PO.hat.dy = Math.round(-2 * k); PO.body.lean = -3 * k; PO.body.crouch = -3 * k + 2 * Math.sin(Math.min(1, t / .12) * Math.PI) * (1 - up); PO.body.cape = 3 + 9 * k; PO.body.sway = 4 * k;
  PO.handR.fc = wig(t, 40, k); PO.handR.thumb = k; PO.handR.rot = -.4 * k;
  gripFree(S, h[0] + 6 * k, h[1] - 54 * k, .14 + PO.armR.rot + spin * k); S.staff.glow = 2; S.staff.color = '#9b5cff';
  L(S, c => {
    const bx = 150, by = 0, r = Math.round(14 * k + 8 * Math.sin(t * 12) * k);
    c.save(); disc(c, bx, by, r, '#08040f'); disc(c, bx, by, Math.max(1, r - 4), '#000'); c.restore();
    for (let a = 0; a < 3; a++) for (let i = 0; i < 14; i++) { const an = a * 2.094 + i * .38 + t * 14, rr = (r + 4 + i * 1.6) * U / 1.4; mote(c, bx + Math.cos(an) * rr, by + Math.sin(an) * rr * .55, i % 4 ? '#7a3cff' : '#fff', k * (1 - i / 16)); }
    ring(c, bx, by, r + 3, '#9b5cff', .7 * k);
  });
}};
ANIM.mage.victory = {dur:1300, fn:(t, S, p) => {
  const PO = S.pose, hop = Math.abs(Math.sin(t * Math.PI * 2)), k = kf(t, [[0, 0], [.15, 1], [.85, 1], [1, 0]]);
  S.dy = Math.round(-9 * hop); PO.armR.rot = -1.2 * k + .15 * Math.sin(t * Math.PI * 8) * k; world(S, .14 - .3 * k + .4 * Math.sin(t * Math.PI * 4) * k); PO.hat.rot = .1 * Math.sin(t * Math.PI * 4); PO.body.cape = 3 + 6 * hop; PO.handR.fc = [0, 0, 0, 0]; S.staff.glow = 1.6;
  L(S, c => { for (let i = 0; i < 6; i++) { const a = t * 8 + i; star(c, 200 + Math.cos(a) * 36, 40 + Math.sin(a * 1.3) * 26, 2, '#fff', .9); } });
}};
ANIM.mage.revive = {dur:800, fn:(t, S) => { S.dither = 1 - ease(t); S.tint = t < .5 ? {c:'#ffe08a', a:.6 * (1 - t * 2)} : null; L(S, c => beamCol(c, 118, 0, 270, 22 * (1 - t), '#ffe08a', 1 - t)); }};
ANIM.mage.pass = {dur:700, fn:(t, S) => { const k = Math.sin(t * Math.PI); S.pose.armR.rot = -.5 * k; world(S, .14 + .5 * k); S.pose.hat.rot = .06 * k; S.pose.handR.thumb = k; S.pose.handR.fc = [1, 1, 0, 0].map(v => v * k); }};

// ---------- CLÉRIGA ----------
const CL = { gold:'#ffd86b', light:'#fff3b0' };
const bookAt = (p, side = 'L') => { const h = hnd(p, side); return [h[0] - 6, h[1] - 22]; };
IDLE.assassin.push({name:'biblia', dur:5200, fn:(t, S, p) => {            // levanta uma Bíblia, abre, lê virando páginas, fecha e guarda
  const PO = S.pose, appear = seg(t, 0, .12), open = seg(t, .12, .24), read = seg(t, .24, .74), close = seg(t, .74, .85), vanish = seg(t, .85, .96);
  const k = kf(t, [[0, 0], [.14, 1], [.84, 1], [.97, 0]]);
  PO.armL.rot = .5 * k - .06 * Math.sin(t * 10) * k; PO.handL.curl = -.2 * k; PO.handL.rot = -.6 * k; PO.body.lean = -1.5 * k;
  PO.hat.rot = .07 * kf(t, [[.1, 0], [.3, 1], [.72, 1], [.86, 0]]); PO.hat.dy = Math.round(2 * kf(t, [[.1, 0], [.3, 1], [.72, 1], [.86, 0]]));
  const flip = [.36, .5, .62].map(a => Math.sin(clamp((t - a) / .05) * Math.PI)).reduce((m, v) => Math.max(m, v), 0);
  PO.handL.thumb = flip; PO.handL.fc = [.15, .15, .15, .15];
  PO.hat.rot += .02 * Math.sin(t * 9) * (read > 0 && close === 0 ? 1 : 0);
  const st = vanish > 0 ? 0 : close > 0 ? (close < .5 ? 2 : 1) : read > 0 ? (Math.floor(t * 14) % 6 < 3 ? 2 : 3) : open > 0 ? (open < .5 ? 1 : 2) : 0;
  const [fx, fy] = bookAt(p, 'L');
  L(S, c => {
    const a = vanish > 0 ? 1 - vanish : 1; if (appear === 0) return;
    c.save(); c.globalAlpha = a; c.translate(0, Math.round(Math.sin(t * Math.PI * 6) * 1.2)); drawBook(c, fx, fy, st, '#ffd24d'); c.restore();
    if (appear > 0 && appear < 1) sparkleBurst(c, fx, fy, appear, '#ffd86b', 10, 8);
    if (vanish > 0 && vanish < 1) sparkleBurst(c, fx, fy, vanish, '#fff3b0', 12, 10);
    if (flip > .5) sparkleBurst(c, fx + 10, fy - 4, flip, '#fff6dc', 4, 4);
    if (read > 0 && close === 0) { for (let i = 0; i < 6; i++) { const ft = (read * 2.2 + i / 6) % 1; glyph(c, fx - 18 + i * 7 + Math.sin(ft * 7 + i) * 3, fy - 10 - ft * 70, i % 2 ? '#fff0a8' : '#ffd24d', (1 - ft) * .95, i); }
      c.save(); c.globalCompositeOperation = 'lighter'; beamCol(c, fx, fy - 70, fy - 6, 8, '#ffd86b', .25 + .1 * Math.sin(t * 40)); c.restore(); }
  });
}});
IDLE.assassin.push({name:'oracao', dur:3400, fn:(t, S, p) => {             // mão ao peito, capuz inclinado, halo e brilho sagrado
  const PO = S.pose, k = kf(t, [[0, 0], [.22, 1], [.8, 1], [1, 0]]), a = Math.sin(t * Math.PI), hh = p.pos.head || [130, 40];
  PO.armL.rot = -.72 * k; PO.handL.rot = .5 * k; PO.handL.curl = -.1 * k; PO.hat.rot = .08 * k; PO.hat.dy = Math.round(3 * k); PO.body.lean = -1 * k; PO.body.breath = 1.2 * k;
  PO.armR.rot = -.05 * k; PO.handR.thumb = 0; PO.handR.fc = [0, 0, 0, 0].map((_, i) => .15 * Math.sin(t * 8 + i) * k);
  L(S, c => {
    const [hx, hy] = hh; ring(c, hx, hy - 22, 15, '#ffd86b', .9 * a, 1); ring(c, hx, hy - 22, 13, '#fff3b0', .5 * a);
    for (let i = 0; i < 4; i++) { const an = t * 5 + i * Math.PI / 2; mote(c, hx + Math.cos(an) * 45, hy - 22 + Math.sin(an) * 12, '#fff', a); }
    star(c, hx, hy - 40, 3 + Math.round(a * 2), '#ffe9a0', a);
  });
}});
IDLE.assassin.push({name:'cajado', dur:3000, fn:(t, S, p) => {             // ergue o cajado e o finca no chão: onda sagrada
  const PO = S.pose, lift = seg(t, 0, .35), hit = seg(t, .35, .46), k = kf(t, [[0, 0], [.3, 1], [.38, -.4], [.46, 0], [1, 0]]), g = Math.sin(seg(t, .36, .9) * Math.PI);
  PO.armR.rot = -.3 * ease(lift) * (1 - ease(hit)) + .06 * Math.sin(hit * Math.PI); PO.handR.fc = [0, 0, 0, 0]; PO.handR.thumb = 0; PO.body.crouch = kf(t, [[0, 0], [.35, -1.5], [.42, 2], [.6, 0]]); PO.hat.dy = Math.round(PO.body.crouch * .6);
  PO.hat.rot = -.04 * ease(lift) * (1 - hit); PO.armL.rot = -.12 * k; PO.body.sway = 1.5 * g;
  const sh = p.pos.staffHead || [203, 45];
  L(S, c => {
    if (hit > 0 && t < .8) { const r = Math.round(easeOut(seg(t, .4, .8)) * 26); ring(c, 226, 205, r, '#ffd86b', 1 - seg(t, .4, .8)); ring(c, 226, 205, Math.max(1, r - 4), '#fff3b0', .6 * (1 - seg(t, .4, .8))); }
    if (g > 0) { c.save(); c.globalCompositeOperation = 'lighter'; disc(c, sh[0], sh[1], 10 + Math.round(g * 4), '#ffd86b', .15 + g * .15); c.restore(); if (g > .8) star(c, sh[0], sh[1], 4, '#fff', 1); for (let i = 0; i < 5; i++) { const ft = (t * 1.5 + i * .2) % 1; mote(c, sh[0] - 30 + i * 15, sh[1] + 10 + ft * 100, '#ffe9a0', g * (1 - ft)); } }
  });
}});
IDLE.assassin.push({name:'olhar', dur:3400, fn:(t, S, p) => {              // olha pros lados, mexe os dedos, ajeita o manto
  const PO = S.pose, look = kf(t, [[0, 0], [.2, -1], [.42, -1], [.62, 1], [.82, 1], [1, 0]]), k = Math.sin(t * Math.PI);
  PO.hat.rot = .05 * look; PO.hat.dx = Math.round(2 * look); PO.body.lean = 1.2 * look; PO.body.sway = 1.2 * look; PO.armL.rot = .15 * look * -1 + .06 * Math.sin(t * 9); PO.handL.fc = [0, 1, 2, 3].map(i => .5 + .5 * Math.sin(t * 16 - i)); PO.handL.thumb = Math.max(0, Math.sin(t * 12)); PO.handL.curl = -.2;
  PO.body.footL = kf(t, [[0, 0], [.55, 0], [.62, 1], [.75, 0]]); PO.body.footR = 0;
}});
IDLE.assassin.push({name:'bencao', dur:3600, fn:(t, S, p) => {              // ergue o cajado aos céus; luz desce do cajado
  const PO = S.pose, k = kf(t, [[0, 0], [.25, 1], [.75, 1], [1, 0]]), g = Math.sin(t * Math.PI * 3) * .5 + .5, sh = p.pos.staffHead || [203, 45];
  PO.armR.rot = -.38 * k; PO.handR.thumb = k * .4; PO.hat.rot = -.05 * k; PO.hat.dy = Math.round(-1 * k); PO.armL.rot = -.15 * k; PO.handL.curl = .6 * k; PO.body.lean = 1.5 * k; PO.body.cape = 2 + 3 * k;
  L(S, c => {
    c.save(); c.globalCompositeOperation = 'lighter'; disc(c, sh[0], sh[1], 11 + Math.round(g * 3), '#ffd86b', (.12 + g * .14) * k); c.restore(); ring(c, sh[0], sh[1], 11 + Math.round(g * 4), '#ffe9a0', .4 * g * k);
    for (let i = 0; i < 7; i++) { const ft = (t * 1.2 + i * .15) % 1; mote(c, sh[0] - 60 + i * 20 + Math.sin(ft * 8 + i) * 5, sh[1] + ft * 200, i % 2 ? '#fff6dc' : '#ffd86b', (1 - ft) * .9 * k); }
    if (g > .85) star(c, sh[0], sh[1], 4, '#fff', k);
  });
}});
ANIM.assassin.holy = {dur:1100, fn:(t, S, p) => {
  const PO = S.pose, open = seg(t, 0, .3), rel = seg(t, .38, .55), back = seg(t, .62, 1), k = ease(open) * (1 - ease(back)), sh = p.pos.staffHead || [203, 45], [bx, by] = bookAt(p, 'L');
  PO.armL.rot = .55 * k; PO.handL.rot = -.6 * k; PO.handL.thumb = k; PO.handL.curl = -.1 * k; PO.armR.rot = kf(t, [[0, 0], [.3, .15], [.42, -.45], [.7, -.3], [1, 0]]); PO.hat.rot = kf(t, [[0, 0], [.3, .06], [.42, -.07], [.8, 0]]);
  PO.body.lean = kf(t, [[0, 0], [.3, -2], [.42, 3], [1, 0]]); PO.body.cape = 2 + 4 * k; PO.body.crouch = -1.5 * k;
  L(S, c => {
    if (k > 0) { c.save(); c.globalAlpha = Math.min(1, k * 1.5); drawBook(c, bx, by - 6 * k, back > .5 ? 1 : (open < .4 ? 1 : 3), '#ffd24d'); c.restore(); }
    if (open > 0 && rel === 0) { for (let i = 0; i < 3; i++) { const r = Math.max(2, Math.round((1 - ((open * 2 + i / 3) % 1)) * 14)); ring(c, sh[0], sh[1], r, i ? '#ffd86b' : '#fff', .7); } beamCol(c, bx, 60, by + 30, 8 * open, '#ffd86b', .5); }
    if (rel > 0 && rel < 1) { sparkleBurst(c, sh[0], sh[1], rel, '#ffd86b', 12, 11); star(c, sh[0], sh[1], 7, '#fff', 1 - rel); beamCol(c, sh[0], 0, sh[1], 10, '#fff3b0', 1 - rel); }
  });
}};
ANIM.assassin.melee = {dur:760, fn:(t, S, p) => {
  const PO = S.pose, st = seg(t, .32, .55), sh = p.pos.staffHead || [203, 45];
  PO.armR.rot = kf(t, [[0, 0], [.3, .55], [.5, -1.0], [.7, -.7], [1, 0]]); PO.handR.thumb = 0; PO.handR.fc = [0, 0, 0, 0];
  PO.hat.rot = kf(t, [[0, 0], [.3, -.05], [.5, .08], [1, 0]]); PO.body.lean = kf(t, [[0, 0], [.3, -4], [.5, 6], [.75, 2], [1, 0]]); PO.body.crouch = kf(t, [[0, 0], [.3, 2], [.5, -1.5], [1, 0]]); PO.body.cape = kf(t, [[0, 2], [.3, 5], [.5, -2], [1, 2]]);
  PO.armL.rot = kf(t, [[0, 0], [.3, -.2], [.5, .3], [1, 0]]); PO.body.footR = kf(t, [[0, 0], [.35, 0], [.5, -1], [.8, 0]]);
  L(S, c => { if (st > 0 && st < 1) { for (let i = 0; i < 12; i++) { const a = -2.6 + i * .3 * st * 3; mote(c, 150 + Math.cos(a) * 65, 70 + Math.sin(a) * 55, i % 3 ? '#ffd86b' : '#fff', 1 - i / 14); } sparkleBurst(c, sh[0], sh[1], st, '#ffd86b', 8, 8); } });
}};
ANIM.assassin.cast = ANIM.assassin.holy;
ANIM.assassin.heavy = ANIM.assassin.melee;
ANIM.assassin.guard = {dur:900, fn:(t, S, p) => {
  const PO = S.pose, up = seg(t, 0, .25), dn = seg(t, .75, 1), k = ease(up) * (1 - ease(dn)), col = (p.opt && p.opt.color) || '#ffe08a', [bx, by] = bookAt(p, 'L');
  PO.armR.rot = -.2 * k; PO.armL.rot = .75 * k; PO.handL.rot = -.5 * k; PO.handL.thumb = k; PO.hat.dy = Math.round(2 * k); PO.hat.rot = .05 * k; PO.body.crouch = 3 * k; PO.body.lean = 2 * k; PO.body.cape = 2 + 3 * k;
  L(S, c => { if (k > 0) { drawBook(c, bx + 10 * k, by - 4, 3, '#ffd24d'); hexShield(c, 150, 150, 46, col, k, t * 3); } if (up > .2 && up < 1) sparkleBurst(c, 150, 130, up, col, 10, 12); });
}};
ANIM.assassin.dodge = {dur:900, fn:(t, S, p) => {
  const PO = S.pose, out = seg(t, 0, .25), away = seg(t, .25, .62), inn = seg(t, .62, .9);
  S.dither = out < 1 ? out : (inn > 0 ? 1 - inn : 1); S.dx = (away > 0 && inn < 1) ? -28 : 0; S.alpha = S.dither < 1 ? 1 : 0;
  PO.body.lean = -5 * out; PO.hat.rot = -.1 * out; PO.body.cape = 7 * out; PO.body.crouch = 2 * out; PO.armL.rot = .5 * out; PO.armR.rot = -.2 * out; PO.body.footL = out;
  L(S, c => {
    if (out > 0 && out < 1) for (let i = 0; i < 5; i++) beamCol(c, 110 + i * 22, 20 * (1 - out) + 20, 285, 3, '#ffe08a', 1 - out);
    if (inn > 0 && inn < 1) for (let i = 0; i < 5; i++) beamCol(c, 82 + i * 22, 20, 285, 3, '#ffe08a', 1 - inn);
    sparkleBurst(c, 150, 200, out || inn, '#fff3b0', 10, 14);
  });
}};
ANIM.assassin.hurt = {dur:560, fn:(t, S) => {
  const PO = S.pose, k = Math.floor(t * 4), r = kf(t, [[0, 0], [.12, 1], [.5, .4], [1, 0]]);
  S.tint = k % 2 === 0 ? {c:'#ff3030', a:.7} : (k === 1 ? {c:'#ffffff', a:.55} : null); S.dx = [4, -3, 2, 0][Math.min(3, k)];
  PO.body.lean = 7 * r; PO.hat.rot = .2 * r; PO.hat.dx = Math.round(3 * r); PO.hat.dy = Math.round(-2 * r); PO.armR.rot = -.35 * r; PO.armL.rot = .45 * r; PO.body.cape = 8 * r; PO.body.crouch = 2 * r; PO.handL.curl = .9 * r; PO.handR.thumb = r;
}};
ANIM.assassin.ult = {dur:1500, fn:(t, S, p) => {
  const PO = S.pose, up = seg(t, 0, .3), k = ease(up) * (1 - ease(seg(t, .85, 1))), sh = p.pos.staffHead || [203, 45];
  PO.armR.rot = -.5 * k; PO.armL.rot = .95 * k; PO.handL.curl = 1 * k; PO.handL.thumb = k; PO.handL.rot = -.7 * k; PO.hat.rot = -.1 * k; PO.hat.dy = Math.round(-2 * k); PO.body.crouch = -3 * k; PO.body.cape = 3 + 9 * k; PO.body.sway = 3 * k; PO.body.lean = 2 * k;
  L(S, c => {
    beamCol(c, 150, 0, 285, 26 * k, '#fff3b0', .9 * k);
    c.save(); c.globalAlpha = k; drawBook(c, 150, 20 + (1 - k) * 40, 3, '#fff3b0'); c.restore();
    for (let i = 0; i < 12; i++) { const ft = (t * 1.6 + i / 12) % 1; mote(c, 100 + (i % 6) * 18 + Math.sin(ft * 9 + i) * 4, 30 + ft * 230, i % 2 ? '#fff' : '#ffd86b', k * (1 - ft)); }
    ring(c, 150, 270, 22, '#ffd86b', .8 * k); ring(c, 150, 270, 30, '#fff3b0', .4 * k); ring(c, sh[0], sh[1], 14, '#fff', .8 * k);
  });
}};
ANIM.assassin.victory = {dur:1300, fn:(t, S, p) => {
  const PO = S.pose, hop = Math.abs(Math.sin(t * Math.PI * 2)), k = kf(t, [[0, 0], [.15, 1], [.85, 1], [1, 0]]);
  S.dy = Math.round(-9 * hop); PO.armR.rot = -.45 * k + .08 * Math.sin(t * Math.PI * 8) * k; PO.armL.rot = .9 * k; PO.handL.curl = k; PO.hat.rot = .08 * Math.sin(t * Math.PI * 4); PO.body.cape = 3 + 6 * hop;
  L(S, c => { ring(c, 148, 18, 15, '#ffd86b', 1); for (let i = 0; i < 6; i++) { const a = t * 8 + i; star(c, 148 + Math.cos(a) * 50, 60 + Math.sin(a * 1.3) * 40, 2, '#fff', .9); } });
}};
ANIM.assassin.revive = ANIM.mage.revive;
ANIM.assassin.pass = {dur:700, fn:(t, S) => { const k = Math.sin(t * Math.PI); S.pose.armL.rot = .5 * k; S.pose.handL.curl = k; S.pose.hat.rot = .05 * k; }};

alias();
// ===== Controle =====
function scheduleIdle(p, delay){
  clearTimeout(p.idleT);
  p.idleT = setTimeout(async () => {
    if (p.busy || p.dead || document.hidden) return scheduleIdle(p, rnd(800, 1800));
    const id = pick(IDLE[p.w]); p.busy++; await run(p, id.dur, (t, S, pp) => id.fn(t, S, pp)); p.busy--;
    scheduleIdle(p, rnd(900, 2600));
  }, delay);
}
async function play(w, name, opt){
  const p = P[w]; if (!p) return false; const a = ANIM[w][name]; if (!a) return false;
  if (p.dead && name !== 'revive') return true;
  clearTimeout(p.idleT); p.opt = opt || {}; p.busy++; await run(p, a.dur, (t, S, pp) => a.fn(t, S, pp)); p.opt = null; p.busy--;
  if (!p.busy) scheduleIdle(p, rnd(500, 1200)); return true;
}
function setDead(w, dead){ const p = P[w]; if (!p || p.dead === dead) return; p.dead = dead; if (!dead) play(w, 'revive'); }
function setAura(w, col){ const p = P[w]; if (p) p.aura = col; }
function reset(){ Object.values(P).forEach(p => { p.dead = false; p.aura = null; p.busy = 0; p.cur = null; scheduleIdle(p, 400); }); }
function build(){
  if (P.mage || !$('#reference')) return;
  Object.keys(DEF).forEach(w => { P[w] = make(w); const old = $('.spr.' + w); if (old) old.style.display = 'none'; scheduleIdle(P[w], rnd(500, 2000)); });
  if (!tickId) tickId = requestAnimationFrame(ticker);
}
function playIdle(w, name){ const p = P[w], id = IDLE[w].find(i => i.name === name); if (!p || !id) return; clearTimeout(p.idleT); p.busy++; run(p, id.dur, (t, S, pp) => id.fn(t, S, pp)).then(() => { p.busy--; scheduleIdle(p, 1500); }); }
window.Puppet = {has:w => !!P[w], playIdle, play, setDead, setAura, reset, build, DEF, P, idles:w => IDLE[w].map(i => i.name)};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(build, 0)); else setTimeout(build, 0);
})();
