/* Banco de Dados I — RPG · tocador de sprite sheets
   Cada herói é um <canvas>. Sem sheet = imagem estática (spr_*.webp). Com sheet = toca os quadros desenhados.
   Configuração em data/anim_manifest.json (veja docs/ANIMACOES.md). API usada pelo js/game/app.js: Anim.play / setDead / setAura / reset (+ say/sfx vazios). */
(() => {
'use strict';
const META = {"mage":{"x":5,"y":839,"w":209,"h":284},"guerreiro":{"x":225,"y":838,"w":210,"h":262},"tank":{"x":541,"y":836,"w":244,"h":264},"cleriga":{"x":869,"y":803,"w":196,"h":282},"boss":{"x":93,"y":111,"w":848,"h":589}};
const WHO = Object.keys(META);
const FALLBACK = {heavy:['melee'], holy:['cast', 'melee'], cast:['melee'], super:['heavy', 'melee'], aoe:['attack'], enrage:['attack'], laugh:['idle'], die:['death', 'hurt']};
const $ = s => document.querySelector(s), rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
let CFG = {pad:60, heroes:{}}, built = false;
const H = {};   // estado por personagem

const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const list = v => v == null ? [] : Array.isArray(v) ? v : [v];

const pad = () => CFG.pad == null ? 60 : CFG.pad;
const cellW = w => { const s = (CFG.heroes || {})[w]; return (s && s._cell) ? s._cell[0] : META[w].w + 2 * pad(); };
const cellH = w => { const s = (CFG.heroes || {})[w]; return (s && s._cell) ? s._cell[1] : META[w].h + 2 * pad(); };

async function loadSheets(w){
  const spec = (CFG.heroes || {})[w] || {}, out = {};
  for (const [name, v] of Object.entries(spec)) {
    if (name.startsWith('_')) continue;
    const arr = [];
    for (const s of list(v)) {
      const img = await loadImg(s.src);
      if (img) {
        const cw = (spec._cell && spec._cell[0]) || (s.cell && s.cell[0]) || cellW(w);
        arr.push({...s, img, frames:s.frames || Math.max(1, Math.round(img.naturalWidth / cw))});
      }
    }
    if (arr.length) out[name] = arr;
  }
  return out;
}

function applyCanvasLayout(w){
  const h = H[w]; if (!h || h.rig) return;
  const m = META[w], spec = (CFG.heroes || {})[w] || {};
  if (spec._cell && spec._feet) {
    const [cw, ch] = spec._cell, [fx, fy] = spec._feet;
    const targetFeetX = m.x + m.w / 2 + (FEET_FB[w] ? FEET_FB[w][0] : 0);
    const targetFeetY = m.y + (FEET_FB[w] ? FEET_FB[w][1] : m.h);
    const left = targetFeetX - fx, top = targetFeetY - fy;
    h.cv.width = cw; h.cv.height = ch;
    h.cv.style.cssText = `left:${left / 1024 * 100}%;top:${top / 1536 * 100}%;width:${cw / 1024 * 100}%;height:${ch / 1536 * 100}%`;
  } else {
    const P = pad(), cw = cellW(w), ch = cellH(w);
    h.cv.width = cw; h.cv.height = ch;
    h.cv.style.cssText = `left:${(m.x - P) / 1024 * 100}%;top:${(m.y - P) / 1536 * 100}%;width:${cw / 1024 * 100}%;height:${ch / 1536 * 100}%`;
  }
}

function build(){
  const game = $('#game'), ref = $('#reference'); if (!game || !ref || built) return; built = true;
  WHO.forEach(w => {
    const m = META[w], P = pad(), cv = document.createElement('canvas'); cv.className = 'hero ' + w;
    ref.after(cv);
    const still = new Image(); still.src = `assets/sprites/spr_${w}.webp`;
    H[w] = {who:w, cv, c:cv.getContext('2d'), still, sheets:{}, cur:null, dead:false, idleT:null, token:0, hold:null};
    applyCanvasLayout(w);
    drawStill(w); still.onload = () => { if (!H[w].cur) drawStill(w); };
    if (w === 'boss' && (window.STAGE && STAGE.ice ? window.HrimgarRig : window.BossRig)) buildMage(H[w], m, P, window.STAGE && STAGE.ice ? window.HrimgarRig : window.BossRig, {PX:150, PXR:150, PT:200, PB:30, orb:{x:m.x + 300, y:m.y + 60}});
  });
  const bodyFeet = w => { const f = feetOf(w); return f ? {x:bodyX(w), y:f.y} : f; };   // efeitos sobre aliados (cura, proteção, pouca vida) centrados no corpo, não nos pés
  if (window.Extras) Extras.init($('#game'), bodyFeet);
  if (window.PXFX) PXFX.init($('#game'), bodyFeet);
  if (window.VFX) VFX.init($('#game'));
  fetch('data/anim_manifest.json', {cache:'no-cache'}).then(r => r.ok ? r.json() : null).catch(() => null).then(async cfg => {
    if (cfg) CFG = cfg;
    WHO.forEach(w => applyCanvasLayout(w));
    for (const w of WHO) { H[w].sheets = await loadSheets(w); drawStill(w); scheduleIdle(w, rnd(800, 2500)); }
  });
}
function buildMage(h, m, P, Rig, cfg){
  const {PX, PXR, PT, PB} = cfg, cw = m.w + PX + PXR, ch = m.h + PT + PB;
  h.cv.width = cw; h.cv.height = ch; h.px = PX; h.py = PT;
  h.cv.style.cssText = `left:${(m.x - PX) / 1024 * 100}%;top:${(m.y - PT) / 1536 * 100}%;width:${cw / 1024 * 100}%;height:${ch / 1536 * 100}%`;
  const mk = (cls) => { const k = document.createElement('canvas'); k.className = 'fxl ' + cls; k.width = 1024; k.height = 1536; return k; };
  const back = mk('back'), front = mk('front'); $('#game').append(back, front);
  h.rig = Rig.make({c:h.c, cv:h.cv, P, Px:PX, Py:PT, W:m.w, Hh:m.h, world:{x:m.x, y:m.y}, layers:{back, front}, orbWorld:cfg.orb,
    shadow:c => shadow(c, h.who), shakeEl:$('#game')});
  h.rig.start();
}
const FEET_FB = {mage:[0, 258], guerreiro:[0, 262], tank:[-18, 262], cleriga:[-46, 292], boss:[0, 560]};
const feetOf = w => { const h = H[w], m = META[w]; if (h && h.rig && h.rig.feet) return h.rig.feet(); const o = FEET_FB[w] || [0, m.h]; return {x:m.x + m.w / 2 + o[0], y:m.y + o[1]}; };
function drawStill(w){
  const h = H[w]; if (!h || h.rig) return;
  const spec = (CFG.heroes || {})[w] || {};
  if (spec._cell && h.sheets && h.sheets.idle && h.sheets.idle.length) {
    drawFrame(w, h.sheets.idle[0], 0);
    return;
  }
  if (!h.still.complete || !h.still.naturalWidth) return;
  const P = pad();
  h.c.clearRect(0, 0, h.cv.width, h.cv.height); shadow(h.c, w); h.c.drawImage(h.still, P, P);
}
function shadow(c, w){
  const m = META[w], P = pad(), g = c.createRadialGradient(P + m.w / 2, P + m.h - 4, 2, P + m.w / 2, P + m.h - 4, m.w * .5);
  g.addColorStop(0, 'rgba(0,0,10,.55)'); g.addColorStop(1, 'rgba(0,0,10,0)');
  c.save(); c.translate(0, P + m.h - 4); c.scale(1, w === 'boss' ? .12 : .16); c.translate(0, -(P + m.h - 4)); c.fillStyle = g; c.fillRect(P - 20, P + m.h - 4 - m.w * .5, m.w + 40, m.w); c.restore();
}
function drawFrame(w, s, f){
  const h = H[w], cw = (s.cell && s.cell[0]) || cellW(w), ch = (s.cell && s.cell[1]) || cellH(w);
  const cols = s.cols || s.frames, col = f % cols, row = Math.floor(f / cols);
  h.c.clearRect(0, 0, h.cv.width, h.cv.height);
  h.c.drawImage(s.img, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
}
function resolve(w, name){
  const h = H[w]; if (!h) return null;
  for (const n of [name, ...(FALLBACK[name] || [])]) if (h.sheets[n]) return {name:n, s:pick(h.sheets[n])};
  return null;
}
function playSheet(w, s, {loop = false, hold = false} = {}){
  const h = H[w], tok = ++h.token;
  const durs = s.durs && s.durs.length ? s.durs : null;
  const totalDur = durs ? durs.reduce((a, b) => a + b, 0) : s.frames * (1000 / (s.fps || 12));
  return new Promise(res => {
    let lastF = -1, start = performance.now();
    const tick = now => {
      if (h.token !== tok) return res(false);
      let elapsed = now - start;
      if (elapsed >= totalDur) {
        if (loop) {
          start = now;
          elapsed = 0;
        } else {
          if (hold) drawFrame(w, s, s.frames - 1);
          else drawStill(w);
          return res(true);
        }
      }
      let f = 0;
      if (durs) {
        let acc = 0;
        for (let i = 0; i < durs.length; i++) {
          acc += durs[i];
          if (elapsed < acc) { f = i; break; }
        }
      } else {
        const fps = s.fps || 12;
        f = Math.min(s.frames - 1, Math.floor(elapsed / (1000 / fps)));
      }
      if (f !== lastF) {
        lastF = f;
        drawFrame(w, s, f);
      }
      requestAnimationFrame(tick);
    };
    drawFrame(w, s, 0);
    lastF = 0;
    requestAnimationFrame(tick);
  });
}
async function play(w, name, opts = {}){
  const h = H[w]; if (!h) return false;
  if (h.dead && name !== 'revive') return false;
  if (opts.combo >= 3 && window.Extras) Extras.fx(w, 'combo', {n:opts.combo});   // sequência de acertos: aura extra no ataque
  if (h.rig) { const n = h.rig.has(name) ? name : h.rig.has('melee') && name !== 'idle' ? 'melee' : null; if (!n) return false; clearTimeout(h.idleT); h.cur = n; await h.rig.play(n, opts); h.cur = null; scheduleIdle(w, rnd(1200, 3200)); return true; }
  const r = resolve(w, name); if (!r) return false;
  clearTimeout(h.idleT); h.cur = name;
  await playSheet(w, r.s);
  h.cur = null; scheduleIdle(w, rnd(1200, 3200)); return true;
}
function scheduleIdle(w, delay){
  const h = H[w]; if (!h) return; clearTimeout(h.idleT);
  h.idleT = setTimeout(async () => {
    if (h.rig && !h.cur && !h.dead && !document.hidden) { h.cur = 'idle'; await h.rig.idle(); h.cur = null; return scheduleIdle(w, rnd(4500, 10000)); }
    if (h.cur || h.dead || document.hidden || !h.sheets.idle) return scheduleIdle(w, rnd(1500, 3500));
    h.cur = 'idle'; await playSheet(w, pick(h.sheets.idle)); h.cur = null; scheduleIdle(w, (w === 'mage' || w === 'cleriga' || w === 'tank' || w === 'guerreiro') ? rnd(300, 1200) : rnd(1500, 4000));
  }, delay);
}
const DEATH_MS = {mage:800, guerreiro:1790, tank:2400, cleriga:940};   // duracao da queda: o cinza so entra quando ela termina
function grayLater(h, dead){ clearTimeout(h.grayT); if (!dead) { h.cv.classList.remove('dead'); return; } h.grayT = setTimeout(() => { if (h.dead) h.cv.classList.add('dead'); }, DEATH_MS[h.who] || 900); }
function setDead(w, dead){
  const h = H[w]; if (!h || h.dead === dead) return;
  h.dead = dead;
  if (h.rig) {
    grayLater(h, dead);
    h.rig.setDead(dead);
    h.token++;
    h.cur = null;
    if (!dead) {
      scheduleIdle(w, 1500);
      if (window.Extras) Extras.fx(w, 'revive');
    } else if (window.Extras) Extras.low(w, false);
    return;
  }
  grayLater(h, dead);
  if (dead) {
    h.token++;
    h.cur = 'death';
    const r = resolve(w, 'death');
    if (r) playSheet(w, r.s, {hold:true});
    else h.cv.classList.add('dead');
  } else {
    h.token++;
    h.cur = 'revive';
    h.cv.classList.remove('dead');
    const r = resolve(w, 'revive');
    if (r) playSheet(w, r.s).then(() => { h.cur = null; scheduleIdle(w, 200); });
    else { h.cur = null; drawStill(w); scheduleIdle(w, 1500); }
  }
}
function setAura(w, kind){
  const h = H[w]; if (!h) return; if (h.rig && h.rig.setMode) { h.rig.setMode(kind === 'red' && w !== 'boss' ? 'bers' : kind); return; }   // Guerreiro: o modo troca as poses (aura já desenhada)
  ['red', 'blue', 'orange', 'gold'].forEach(c => h.cv.classList.toggle('aura-' + c, c === kind));
}
function react(w, kind){ const h = H[w]; if (!h || h.dead || !h.rig) return; if (window.Extras) Extras.fx(w, kind); if ((!h.cur || h.cur === 'idle') && h.rig.has(kind)) play(w, kind); }
function low(w, on){ const h = H[w]; if (!h || !h.rig || !h.rig.setLow) return; h.rig.setLow(on && !h.dead); if (window.Extras) Extras.low(w, on && !h.dead); }
function enterPrep(w){ const h = H[w]; if (h) { h.cv.style.opacity = 0; clearTimeout(h.enT); h.enT = setTimeout(() => { h.cv.style.opacity = ''; }, 6000); } }
function enter(w, delay = 0){ const h = H[w]; if (!h || !h.cv.animate) { if (h) h.cv.style.opacity = ''; return; }
  setTimeout(() => { clearTimeout(h.enT); h.cv.style.opacity = ''; h.cv.animate([{transform:'translateY(46px)', opacity:0}, {transform:'translateY(0)', opacity:1}], {duration:650, easing:'cubic-bezier(.2,.8,.3,1)'}); if (window.Extras) Extras.fx(w, 'enter'); }, delay); }
function reset(){ if (window.Extras) Extras.clear(); if (window.VFX) VFX.clear(); if (window.PXFX) PXFX.clear(); WHO.forEach(w => { const h = H[w]; if (!h) return; h.token++; h.cur = null; h.dead = false; clearTimeout(h.grayT); h.cv.classList.remove('dead'); if (h.rig) h.rig.reset(); setAura(w, null); drawStill(w); scheduleIdle(w, 1000); }); }
const none = () => {};
// centro do corpo do herói na pose atual (centro de massa horizontal dos pixels opacos do canvas, em coordenadas do mundo)
var bodyCache = {};
function bodyX(w){
  const h = H[w], now = performance.now(), c = bodyCache[w];
  if (c && now - c.t < 90) return c.x;
  let x = feetOf(w).x;
  try {
    if (h && h.rig && h.px != null) {
      const cv = h.cv, st = 4, d = h.c.getImageData(0, 0, cv.width, cv.height).data, col = new Uint32Array(Math.ceil(cv.width / st)); let n = 0;
      for (let yy = 0; yy < cv.height; yy += st) for (let xx = 0; xx < cv.width; xx += st) if (d[(yy * cv.width + xx) * 4 + 3] > 200) { col[xx / st | 0]++; n++; }
      if (n > 40) { let acc = 0, i = 0; while (i < col.length && acc + col[i] < n / 2) acc += col[i++]; x = META[w].x - h.px + (i + .5) * st; }   // mediana horizontal: armas e capas não puxam o centro
    }
  } catch (e) {}
  bodyCache[w] = {t:now, x}; return x;
}
window.Anim = {body:bodyX, feet:feetOf, META, play, react, low, enter, enterPrep, extra:(w, k, o) => window.Extras && Extras.fx(w, k, o), fx:(w, n, o) => H[w] && H[w].rig && H[w].rig.fx && H[w].rig.fx(n, o), hit:w => H[w] && H[w].rig && H[w].rig.nextHit ? H[w].rig.nextHit() : Promise.resolve(), idleNow:w => H[w] && H[w].rig && H[w].rig.idle(), setDead, setAura, reset, build, say:none, sayRandom:none, sfx:none, useSheet:() => {}, has:(w, n) => !!(H[w] && ((H[w].rig && H[w].rig.has(n)) || resolve(w, n)))};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(build, 0)); else setTimeout(build, 0);
})();
