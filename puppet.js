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
const DEF = {
  mage: {
    src:'rig/mage_body.png', meta:{x:19, y:805, w:237, h:276}, pad:{l:60, t:80, r:70, b:30}, feet:[118, 268], center:[110, 150],
    hand:[196, 109], aura:'#6a4dff'
  },
  assassin: {
    src:'rig/cleric_body.png', meta:{x:747, y:805, w:247, h:307}, pad:{l:100, t:60, r:20, b:20}, feet:[150, 290], center:[150, 160],
    hand:[203, 88], free:[72, 165], head:[148, 38], staffHead:[203, 45], aura:'#ffe08a'
  }
};
const P = {};     // instâncias

function make(w){
  const d = DEF[w]; const m = d.meta, pad = d.pad;
  const cw = m.w + pad.l + pad.r, ch = m.h + pad.t + pad.b;
  const box = document.createElement('div'); box.className = 'pup ' + w;
  box.style.cssText = `position:absolute;z-index:4;pointer-events:none;left:${(m.x - pad.l) / 1024 * 100}%;top:${(m.y - pad.t) / 1536 * 100}%;width:${cw / 1024 * 100}%;height:${ch / 1536 * 100}%`;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; cv.style.cssText = 'width:100%;height:100%;display:block'; box.appendChild(cv);
  $('#reference').after(box);
  const body = new Image(); body.src = d.src;
  const oc = document.createElement('canvas'); oc.width = m.w; oc.height = m.h;
  const p = {w, d, box, cv, c:cv.getContext('2d'), body, oc, oco:oc.getContext('2d'), pad, cur:null, queue:null, dead:false, aura:null, idleT:null, busy:0, time:0, S:null, bubbleAt:[0, 0]};
  p.c.imageSmoothingEnabled = false; p.oco.imageSmoothingEnabled = false;
  resetState(p); return p;
}
function resetState(p){
  p.S = {dx:0, dy:0, sx:1, sy:1, rot:0, alpha:1, tint:null, dither:0, staff:{mode:'hand', x:0, y:0, rot:.14, glow:1, color:null, vis:true}, layers:[], extra:null};
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
function render(p){
  const c = p.c, S = p.S, d = p.d, m = d.meta, pad = p.pad;
  c.clearRect(0, 0, p.cv.width, p.cv.height); c.save(); c.translate(pad.l, pad.t);
  // respiração em degraus (1 px a cada ~0,7 s) — sempre ativa
  const br = Math.round(Math.sin(p.time / 650 + (p.w === 'mage' ? 0 : 1.5)) * .9);
  const bx = S.dx, by = S.dy + (p.dead ? 0 : br);
  // camadas de trás
  (S.layers || []).filter(l => l.back).forEach(l => l.draw(c, p));
  if (S.staff.vis && !(p.w !== 'mage')) { if (S.staff.back) drawStaffFor(p, c, S); }
  // corpo
  if (p.dead || S.alpha > 0) {
    const oc = p.oco; oc.clearRect(0, 0, m.w, m.h); oc.globalCompositeOperation = 'source-over'; if (p.body.complete && p.body.naturalWidth) oc.drawImage(p.body, 0, 0);
    if (S.tint) { oc.globalCompositeOperation = 'source-atop'; oc.globalAlpha = S.tint.a; oc.fillStyle = S.tint.c; oc.fillRect(0, 0, m.w, m.h); oc.globalAlpha = 1; }
    if (p.dead) { oc.globalCompositeOperation = 'source-atop'; oc.fillStyle = 'rgba(20,20,30,.62)'; oc.fillRect(0, 0, m.w, m.h); }
    if (S.dither > 0) { oc.globalCompositeOperation = 'destination-out'; oc.fillStyle = '#000'; const step = 3; for (let y = 0; y < m.h; y += step) for (let x = 0; x < m.w; x += step) { const o = ((x / step) * 7 + (y / step) * 13) % 16 / 16; if (o < S.dither) oc.fillRect(x, y, step, step); } }
    oc.globalCompositeOperation = 'source-over';
    c.save(); c.globalAlpha = S.alpha;
    if (p.aura && !p.dead) { c.shadowColor = p.aura; c.shadowBlur = 14; }
    c.translate(d.feet[0] + bx, d.feet[1] + by); c.rotate(S.rot); c.scale(S.sx, S.sy); c.translate(-d.feet[0], -d.feet[1]);
    c.drawImage(p.oc, 0, 0); c.restore();
  }
  if (p.w === 'mage') drawStaffFor(p, c, S, true);
  (S.layers || []).filter(l => !l.back).forEach(l => l.draw(c, p));
  if (p.dead) { c.save(); c.translate(d.center[0], 6); px(c, -6, 0, 5, 4, '#e8e8f0'); px(c, -3, 4, 3, 1, '#e8e8f0'); px(c, -6, 6, 1, 1, '#e8e8f0'); px(c, 0, 6, 1, 1, '#e8e8f0'); c.restore(); }
  c.restore();
}
function drawStaffFor(p, c, S, front){
  if (!S.staff.vis) return; const d = p.d;
  const st = S.staff; const hx = d.hand[0] + S.dx, hy = d.hand[1] + S.dy + (p.dead ? 0 : Math.round(Math.sin(p.time / 650) * .9));
  if (st.mode === 'hand') drawStaff(c, hx + st.x, hy + st.y, st.rot, {glow:st.glow, color:st.color});
  else drawStaff(c, st.x, st.y, st.rot, {glow:st.glow, color:st.color, pivot:st.pivot});
}

// ===== Animações =====
// helpers de estado
const L = (S, draw, back) => S.layers.push({draw, back});
const ANIM = { mage:{}, assassin:{} };
const IDLE = { mage:[], assassin:[] };
const alias = () => { const m = ANIM.mage; m.melee = m.heavy = m.holy = m.cast; };

// ---------- MAGA ----------
IDLE.mage.push({name:'orbe', dur:2600, fn:(t, S, p) => {                // cristal pulsa, motes orbitam
  const g = .6 + .4 * Math.sin(t * Math.PI * 4); S.staff.glow = g;
  L(S, c => { const ox = 196 + 6, oy = 19; for (let i = 0; i < 4; i++) { const a = t * Math.PI * 4 + i * Math.PI / 2; mote(c, ox + Math.cos(a) * 15 * U / 1.5, oy + Math.sin(a) * 6 * U / 1.5 - 2, i % 2 ? '#9fd0ff' : '#fff', .9); } });
}});
IDLE.mage.push({name:'giro', dur:3000, fn:(t, S, p) => {                 // cajado gira no ar com magia
  const lift = seg(t, 0, .16), spin = seg(t, .16, .72), land = seg(t, .72, .92);
  const rise = easeOut(lift) * (1 - ease(land));
  const hx = 196, hy = 109, cy = 56;                                     // centro do giro, acima da mão
  const turns = ease(spin) * Math.PI * 4;                                // 2 voltas
  S.staff.mode = 'free'; S.staff.pivot = 14;
  S.staff.x = hx + 6 * rise; S.staff.y = hy + 14 + (cy - hy - 14) * rise;                 // posição do centro do cajado
  S.staff.rot = spin > 0 && spin < 1 ? .14 + turns : .14 * (1 - rise) + (spin >= 1 ? .14 * rise : 0);
  S.staff.glow = 1 + .6 * rise; S.dy = Math.round(-2 * rise); S.rot = -.02 * rise;
  L(S, c => {
    if (spin > 0 && spin < 1) for (let i = 0; i < 10; i++) { const a = S.staff.rot - i * .28, r = 104; mote(c, S.staff.x + Math.sin(a) * r, S.staff.y + 14 - Math.cos(a) * r, i % 3 === 0 ? '#fff' : '#6fb4ff', 1 - i / 10); }
    if (lift > 0 && lift < 1) sparkleBurst(c, hx, hy - 6, lift, '#9fd0ff', 8, 6);
    if (land > .85) star(c, hx, hy - 6, 3, '#cfe6ff', 1);
    if (rise > .3) ring(c, S.staff.x, S.staff.y + 14, 22 + Math.round(3 * Math.sin(t * 20)), '#6fb4ff', .3 * rise);
  });
}});
IDLE.mage.push({name:'runas', dur:2800, fn:(t, S, p) => {                // círculo mágico e runas flutuando
  const a = Math.sin(t * Math.PI), fx = d => d;
  L(S, c => {
    const cx = 118, cy = 262; c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2 + t * 2.5; mote(c, cx + Math.cos(an) * 44 * 1.0, cy + Math.sin(an) * 12 * 1.0, i % 4 === 0 ? '#fff' : '#7a6cff', a); }
    for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 - t * 3; glyph(c, cx + Math.cos(an) * 28 - 4, cy + Math.sin(an) * 7 - 4, '#b9a8ff', a * .9, i); }
    c.restore();
    for (let i = 0; i < 5; i++) { const ft = (t * 1.4 + i * .2) % 1; mote(c, 60 + i * 30 + Math.sin(ft * 9 + i) * 4, 250 - ft * 190, '#9fd0ff', a * (1 - ft)); }
  }, true);
}});

ANIM.mage.cast = {dur:760, fn:(t, S, p, o = {}) => {
  const col = (p.opt && p.opt.color) || '#4d8dff', ch = seg(t, 0, .45), rel = seg(t, .45, .6), back = seg(t, .6, 1);
  const pose = ease(ch) * (1 - ease(back));
  S.staff.rot = .14 + pose * .9 + (rel > 0 && back < 1 ? .15 * Math.sin(rel * Math.PI) : 0); S.staff.y = -10 * pose; S.staff.x = 4 * pose;
  S.staff.color = col; S.staff.glow = 1 + 1.4 * ch * (1 - back);
  S.dx = Math.round(-3 * ch * (1 - rel)); S.sy = 1 + .02 * pose; S.rot = -.03 * pose;
  const gx = 196 + 34 * Math.sin(S.staff.rot) + 4, gy = 109 - 90 * Math.cos(S.staff.rot) - 10 * pose;
  L(S, c => {
    if (ch > 0 && rel === 0) { for (let i = 0; i < 3; i++) { const r = Math.max(2, Math.round((1 - ((ch * 2 + i / 3) % 1)) * 16)); ring(c, gx, gy, r, i ? col : '#fff', .6); } }
    if (rel > 0 && rel < 1) { sparkleBurst(c, gx, gy, rel, col, 10, 9); star(c, gx, gy, 5, '#fff', 1 - rel); }
  });
}};
ANIM.mage.guard = {dur:800, fn:(t, S, p) => {
  const col = (p.opt && p.opt.color) || '#4da3ff', up = seg(t, 0, .25), dn = seg(t, .75, 1), k = ease(up) * (1 - ease(dn));
  S.staff.rot = .14 - k * .45; S.staff.y = 8 * k; S.staff.x = 12 * k; S.staff.color = col; S.staff.glow = 1 + k;
  S.sy = 1 - .04 * k; S.dy = Math.round(3 * k);
  L(S, c => { if (k > 0) hexShield(c, 140, 150, 40, col, Math.min(1, k * 1.4) * (t > .5 && t < .75 ? .8 + .2 * Math.sin(t * 60) : 1), t * 4); if (up > .2 && up < 1) sparkleBurst(c, 140, 150, up, col, 8, 12); });
}};
ANIM.mage.dodge = {dur:900, fn:(t, S, p) => {
  const out = seg(t, 0, .22), away = seg(t, .22, .62), inn = seg(t, .62, .9);
  S.dither = out < 1 ? out : (inn > 0 ? 1 - inn : 1); S.dx = (away > 0 && inn < 1) ? 26 : 0; S.staff.vis = S.dither < .95;
  if (S.dither < 1) S.alpha = 1; else S.alpha = 0;
  S.staff.mode = 'hand';
  L(S, c => { if (out > 0 && out < 1) puff(c, 118, 250, out); if (inn > 0 && inn < 1) puff(c, 144, 250, inn, '#9fd0ff'); if (away > 0 && away < 1) for (let i = 0; i < 3; i++) mote(c, 118 + i * 6, 120 + i * 40, '#cfd6ff', 1 - away); });
}};
ANIM.mage.hurt = {dur:480, fn:(t, S, p) => {
  const k = Math.floor(t * 4); S.tint = k % 2 === 0 ? {c:'#ff3030', a:.7} : (k === 1 ? {c:'#ffffff', a:.55} : null);
  S.dx = [-5, 3, -2, 0][Math.min(3, k)]; S.staff.rot = .14 + [.25, -.2, .1, 0][Math.min(3, k)]; S.sy = k === 0 ? .97 : 1;
}};
ANIM.mage.ult = {dur:1300, fn:(t, S, p) => {
  const up = seg(t, 0, .25), k = ease(up) * (1 - ease(seg(t, .85, 1)));
  const spin = seg(t, .15, .85) * Math.PI * 10;
  S.staff.mode = 'free'; S.staff.x = 196 - 40 * k; S.staff.y = 109 - 100 * k; S.staff.rot = spin * k + .14 * (1 - k); S.staff.glow = 2; S.staff.color = '#9b5cff'; S.dy = Math.round(-4 * k);
  L(S, c => {
    const bx = 150, by = 0, r = Math.round(14 * k + 8 * Math.sin(t * 12) * k);
    c.save(); disc(c, bx, by, r, '#08040f'); disc(c, bx, by, Math.max(1, r - 4), '#000'); c.restore();
    for (let a = 0; a < 3; a++) for (let i = 0; i < 14; i++) { const an = a * 2.094 + i * .38 + t * 14, rr = (r + 4 + i * 1.6) * U / 1.4; mote(c, bx + Math.cos(an) * rr, by + Math.sin(an) * rr * .55, i % 4 ? '#7a3cff' : '#fff', k * (1 - i / 16)); }
    ring(c, bx, by, r + 3, '#9b5cff', .7 * k);
  });
}};
ANIM.mage.victory = {dur:1100, fn:(t, S, p) => {
  const hop = Math.abs(Math.sin(t * Math.PI * 2)) ; S.dy = Math.round(-9 * hop); S.sy = 1 + .02 * hop;
  S.staff.rot = .14 - .6 * Math.sin(t * Math.PI * 4); S.staff.glow = 1.6;
  L(S, c => { for (let i = 0; i < 6; i++) { const a = t * 8 + i; star(c, 200 + Math.cos(a) * 36, 40 + Math.sin(a * 1.3) * 26, 2, '#fff', .9); } });
}};
ANIM.mage.revive = {dur:800, fn:(t, S) => { S.dither = 1 - ease(t); S.tint = t < .5 ? {c:'#ffe08a', a:.6 * (1 - t * 2)} : null; L(S, c => beamCol(c, 118, 0, 270, 22 * (1 - t), '#ffe08a', 1 - t)); }};
ANIM.mage.pass = {dur:600, fn:(t, S) => { const k = Math.sin(t * Math.PI); S.staff.rot = .14 + k * .7; S.dx = Math.round(2 * k); }};

// ---------- CLÉRIGA ----------
const CL = { gold:'#ffd86b', light:'#fff3b0' };
IDLE.assassin.push({name:'halo', dur:2600, fn:(t, S, p) => {                 // pulso no cajado + motes sagrados
  const g = Math.sin(t * Math.PI * 3) * .5 + .5;
  L(S, c => {
    const [sx, sy] = p.d.staffHead; c.save(); c.globalCompositeOperation = 'lighter'; disc(c, sx, sy, 11 + Math.round(g * 3), '#ffd86b', .12 + g * .12); c.restore(); ring(c, sx, sy, 11 + Math.round(g * 4), '#ffe9a0', .4 * g);
    for (let i = 0; i < 6; i++) { const ft = (t * 1.2 + i * .17) % 1; mote(c, 80 + i * 24 + Math.sin(ft * 8 + i) * 5, 40 + ft * 200, i % 2 ? '#fff6dc' : '#ffd86b', (1 - ft) * .9); }
    if (g > .85) star(c, sx, sy, 4, '#fff', 1);
  });
}});
IDLE.assassin.push({name:'biblia', dur:4200, fn:(t, S, p) => {                // abre uma Bíblia, lê e guarda
  const appear = seg(t, 0, .12), open = seg(t, .12, .24), read = seg(t, .24, .72), close = seg(t, .72, .84), vanish = seg(t, .84, .96);
  const [fx, fy] = [64, 146], bob = Math.round(Math.sin(t * Math.PI * 6) * 1.2);
  const st = vanish > 0 ? 0 : close > 0 ? (close < .5 ? 2 : 1) : read > 0 ? (Math.floor(t * 12) % 6 < 3 ? 2 : 3) : open > 0 ? (open < .5 ? 1 : 2) : 0;
  S.rot = -.012 * Math.sin(Math.min(1, appear + vanish * 0) * Math.PI) - .01 * (read > 0 && close === 0 ? 1 : 0);   // leve inclinação lendo
  S.dx = 0;
  L(S, c => {
    const a = vanish > 0 ? 1 - vanish : 1; if (appear === 0 && t < .001) return;
    c.save(); c.globalAlpha = a; c.translate(0, bob); drawBook(c, fx, fy - (1 - ease(appear)) * 14 * U / 3, st, '#ffd24d'); c.restore();
    if (appear > 0 && appear < 1) sparkleBurst(c, fx, fy, appear, '#ffd86b', 10, 8);
    if (vanish > 0 && vanish < 1) sparkleBurst(c, fx, fy, vanish, '#fff3b0', 12, 10);
    // runas sobem das páginas enquanto lê
    if (read > 0 && close === 0) for (let i = 0; i < 6; i++) { const ft = (read * 2.2 + i / 6) % 1; glyph(c, fx - 18 + i * 7 + Math.sin(ft * 7 + i) * 3, fy - 10 - ft * 70, i % 2 ? '#fff0a8' : '#ffd24d', (1 - ft) * .95, i); }
    if (read > 0 && close === 0) { c.save(); c.globalCompositeOperation = 'lighter'; beamCol(c, fx, fy - 70, fy - 6, 8, '#ffd86b', .25 + .1 * Math.sin(t * 40)); c.restore(); }
  });
}});
IDLE.assassin.push({name:'oracao', dur:2600, fn:(t, S, p) => {                // halo e brilho de cruz sobre o capuz
  const a = Math.sin(t * Math.PI), [hx, hy] = p.d.head;
  S.dy = Math.round(-2 * a);
  L(S, c => {
    ring(c, hx, hy - 20, 15, '#ffd86b', .9 * a, 1); ring(c, hx, hy - 20, 13, '#fff3b0', .5 * a);
    for (let i = 0; i < 4; i++) { const an = t * 5 + i * Math.PI / 2; mote(c, hx + Math.cos(an) * 15 * U / 1.4 * .0 + Math.cos(an) * 45, hy - 20 + Math.sin(an) * 12, '#fff', a); }
    star(c, hx, hy - 38, 3 + Math.round(a * 2), '#ffe9a0', a);
  });
}});
ANIM.assassin.holy = {dur:900, fn:(t, S, p) => {
  const open = seg(t, 0, .3), rel = seg(t, .35, .55), back = seg(t, .6, 1), [sx, sy] = p.d.staffHead;
  const k = ease(open) * (1 - ease(back)); S.dy = Math.round(-3 * k); S.sy = 1 + .02 * k;
  L(S, c => {
    if (k > 0) { c.save(); c.globalAlpha = Math.min(1, k * 1.5); drawBook(c, 64, 146 - 10 * k, back > .5 ? 1 : (open < .4 ? 1 : 3), '#ffd24d'); c.restore(); }
    if (open > 0 && rel === 0) { for (let i = 0; i < 3; i++) { const r = Math.max(2, Math.round((1 - ((open * 2 + i / 3) % 1)) * 14)); ring(c, sx, sy, r, i ? '#ffd86b' : '#fff', .7); } beamCol(c, 64, 60, 136, 8 * open, '#ffd86b', .5); }
    if (rel > 0 && rel < 1) { sparkleBurst(c, sx, sy, rel, '#ffd86b', 12, 11); star(c, sx, sy, 7, '#fff', 1 - rel); beamCol(c, sx, 0, sy, 10, '#fff3b0', 1 - rel); }
  });
}};
ANIM.assassin.melee = {dur:620, fn:(t, S, p) => {
  const w = seg(t, 0, .3), st = seg(t, .3, .55), b = seg(t, .55, 1); const [sx, sy] = p.d.staffHead;
  S.rot = -.05 * ease(w) * (1 - st) + .06 * Math.sin(st * Math.PI) * (1 - b); S.dy = Math.round(-5 * Math.sin(st * Math.PI)); S.sx = 1 + .03 * Math.sin(st * Math.PI); S.sy = S.sx;
  L(S, c => { if (st > 0 && st < 1) { for (let i = 0; i < 10; i++) { const a = -2.4 + i * .28 * st * 3; mote(c, sx - 30 + Math.cos(a) * 55, sy + 20 + Math.sin(a) * 45, i % 3 ? '#ffd86b' : '#fff', 1 - i / 12); } sparkleBurst(c, sx, sy, st, '#ffd86b', 8, 8); } });
}};
ANIM.assassin.cast = ANIM.assassin.holy;
ANIM.assassin.heavy = ANIM.assassin.melee;
ANIM.assassin.guard = {dur:800, fn:(t, S, p) => {
  const up = seg(t, 0, .25), dn = seg(t, .75, 1), k = ease(up) * (1 - ease(dn)); const col = (p.opt && p.opt.color) || '#ffe08a';
  S.sy = 1 - .03 * k; S.dy = Math.round(2 * k);
  L(S, c => { if (k > 0) { drawBook(c, 150, 130, 3, '#ffd24d'); hexShield(c, 150, 150, 46, col, k, t * 3); } if (up > .2 && up < 1) sparkleBurst(c, 150, 130, up, col, 10, 12); });
}};
ANIM.assassin.dodge = {dur:900, fn:(t, S, p) => {
  const out = seg(t, 0, .25), away = seg(t, .25, .62), inn = seg(t, .62, .9);
  S.dither = out < 1 ? out : (inn > 0 ? 1 - inn : 1); S.dx = (away > 0 && inn < 1) ? -28 : 0; S.alpha = S.dither < 1 ? 1 : 0;
  L(S, c => {
    if (out > 0 && out < 1) for (let i = 0; i < 5; i++) beamCol(c, 110 + i * 22, 20 * (1 - out) + 20, 285, 3, '#ffe08a', 1 - out);
    if (inn > 0 && inn < 1) for (let i = 0; i < 5; i++) beamCol(c, 82 + i * 22, 20, 285, 3, '#ffe08a', 1 - inn);
    sparkleBurst(c, 150, 200, out || inn, '#fff3b0', 10, 14);
  });
}};
ANIM.assassin.hurt = {dur:480, fn:(t, S) => { const k = Math.floor(t * 4); S.tint = k % 2 === 0 ? {c:'#ff3030', a:.7} : (k === 1 ? {c:'#ffffff', a:.55} : null); S.dx = [4, -3, 2, 0][Math.min(3, k)]; S.sy = k === 0 ? .97 : 1; }};
ANIM.assassin.ult = {dur:1300, fn:(t, S, p) => {
  const up = seg(t, 0, .3), k = ease(up) * (1 - ease(seg(t, .85, 1)));
  S.dy = Math.round(-6 * k); S.sy = 1 + .02 * k;
  L(S, c => {
    beamCol(c, 150, 0, 285, 26 * k, '#fff3b0', .9 * k);
    c.save(); c.globalAlpha = k; drawBook(c, 150, 20 + (1 - k) * 40, 3, '#fff3b0'); c.restore();
    for (let i = 0; i < 12; i++) { const ft = (t * 1.6 + i / 12) % 1; mote(c, 100 + (i % 6) * 18 + Math.sin(ft * 9 + i) * 4, 30 + ft * 230, i % 2 ? '#fff' : '#ffd86b', k * (1 - ft)); }
    ring(c, 150, 270, 22, '#ffd86b', .8 * k); ring(c, 150, 270, 30, '#fff3b0', .4 * k);
  });
}};
ANIM.assassin.victory = {dur:1100, fn:(t, S, p) => {
  const hop = Math.abs(Math.sin(t * Math.PI * 2)); S.dy = Math.round(-9 * hop);
  L(S, c => { ring(c, 148, 18, 15, '#ffd86b', 1); for (let i = 0; i < 6; i++) { const a = t * 8 + i; star(c, 148 + Math.cos(a) * 50, 60 + Math.sin(a * 1.3) * 40, 2, '#fff', .9); } });
}};
ANIM.assassin.revive = ANIM.mage.revive;
ANIM.assassin.pass = {dur:600, fn:(t, S) => { S.dy = Math.round(-2 * Math.sin(t * Math.PI)); }};

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
async function playIdle(w, name){ const p = P[w], id = IDLE[w].find(i => i.name === name); if (!p || !id) return; clearTimeout(p.idleT); p.busy++; await run(p, id.dur, (t, S, pp) => id.fn(t, S, pp)); p.busy--; scheduleIdle(p, 1500); }
window.Puppet = {has:w => !!P[w], playIdle, play, setDead, setAura, reset, build, DEF, P};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(build, 0)); else setTimeout(build, 0);
})();
