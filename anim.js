/* Banco de Dados I — RPG · tocador de sprite sheets
   Cada herói é um <canvas>. Sem sheet = imagem estática (spr_*.webp). Com sheet = toca os quadros desenhados.
   Configuração em anim/manifest.json (veja ANIMACOES.md). API usada pelo app.js: Anim.play / setDead / setAura / reset (+ say/sfx vazios). */
(() => {
'use strict';
const META = {"mage":{"x":19,"y":805,"w":237,"h":276},"knight":{"x":255,"y":811,"w":236,"h":286},"tank":{"x":515,"y":810,"w":276,"h":280},"assassin":{"x":747,"y":805,"w":247,"h":307},"boss":{"x":44,"y":95,"w":946,"h":601}};
const WHO = Object.keys(META);
const FALLBACK = {heavy:['melee'], holy:['cast', 'melee'], cast:['melee'], super:['heavy', 'melee'], aoe:['attack'], enrage:['attack'], laugh:['idle'], die:['death', 'hurt']};
const $ = s => document.querySelector(s), rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
let CFG = {pad:60, heroes:{}}, built = false;
const H = {};   // estado por personagem

const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const list = v => v == null ? [] : Array.isArray(v) ? v : [v];

async function loadSheets(w){
  const spec = (CFG.heroes || {})[w] || {}, out = {};
  for (const [name, v] of Object.entries(spec)) {
    const arr = [];
    for (const s of list(v)) { const img = await loadImg(s.src); if (img) arr.push({...s, img, frames:s.frames || Math.max(1, Math.round(img.naturalWidth / cellW(w)))}); }
    if (arr.length) out[name] = arr;
  }
  return out;
}
const pad = () => CFG.pad == null ? 60 : CFG.pad;
const cellW = w => META[w].w + 2 * pad(), cellH = w => META[w].h + 2 * pad();

function build(){
  const game = $('#game'), ref = $('#reference'); if (!game || !ref || built) return; built = true;
  WHO.forEach(w => {
    const m = META[w], P = pad(), cv = document.createElement('canvas'); cv.className = 'hero ' + w; cv.width = cellW(w); cv.height = cellH(w);
    cv.style.cssText = `left:${(m.x - P) / 1024 * 100}%;top:${(m.y - P) / 1536 * 100}%;width:${cellW(w) / 1024 * 100}%;height:${cellH(w) / 1536 * 100}%`;
    ref.after(cv);
    const still = new Image(); still.src = `spr_${w}.webp`;
    H[w] = {cv, c:cv.getContext('2d'), still, sheets:{}, cur:null, dead:false, idleT:null, token:0, hold:null};
    drawStill(w); still.onload = () => { if (!H[w].cur) drawStill(w); };
  });
  fetch('anim/manifest.json', {cache:'no-cache'}).then(r => r.ok ? r.json() : null).catch(() => null).then(async cfg => {
    if (cfg) CFG = cfg;
    if (cfg && cfg.pad != null) WHO.forEach(w => { H[w].cv.width = cellW(w); H[w].cv.height = cellH(w); });
    for (const w of WHO) { H[w].sheets = await loadSheets(w); drawStill(w); scheduleIdle(w, rnd(800, 2500)); }
  });
}
function drawStill(w){
  const h = H[w]; if (!h || !h.still.complete || !h.still.naturalWidth) return; const P = pad();
  h.c.clearRect(0, 0, h.cv.width, h.cv.height); if (w !== 'boss') h.c.drawImage(h.still, P, P);   // o boss já está no cenário
}
function drawFrame(w, s, f){
  const h = H[w], cw = cellW(w), ch = cellH(w), cols = s.cols || s.frames, col = f % cols, row = Math.floor(f / cols);
  h.c.clearRect(0, 0, h.cv.width, h.cv.height); h.c.drawImage(s.img, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
}
function resolve(w, name){
  const h = H[w]; if (!h) return null;
  for (const n of [name, ...(FALLBACK[name] || [])]) if (h.sheets[n]) return {name:n, s:pick(h.sheets[n])};
  return null;
}
function playSheet(w, s, {loop = false, hold = false} = {}){
  const h = H[w], tok = ++h.token, fps = s.fps || 12, dur = 1000 / fps;
  return new Promise(res => {
    let f = 0, start = performance.now();
    const tick = now => {
      if (h.token !== tok) return res(false);
      const nf = Math.floor((now - start) / dur);
      if (nf >= s.frames) { if (loop) { start = now; f = 0; } else { if (hold) drawFrame(w, s, s.frames - 1); else drawStill(w); return res(true); } }
      else f = nf;
      drawFrame(w, s, f); requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
async function play(w, name, opts = {}){
  const h = H[w]; if (!h) return false;
  if (h.dead && name !== 'revive') return false;
  const r = resolve(w, name); if (!r) return false;
  clearTimeout(h.idleT); h.cur = name;
  await playSheet(w, r.s);
  h.cur = null; scheduleIdle(w, rnd(1200, 3200)); return true;
}
function scheduleIdle(w, delay){
  const h = H[w]; if (!h) return; clearTimeout(h.idleT);
  h.idleT = setTimeout(async () => {
    if (h.cur || h.dead || document.hidden || !h.sheets.idle) return scheduleIdle(w, rnd(1500, 3500));
    h.cur = 'idle'; await playSheet(w, pick(h.sheets.idle)); h.cur = null; scheduleIdle(w, rnd(1500, 4000));
  }, delay);
}
function setDead(w, dead){
  const h = H[w]; if (!h || h.dead === dead) return; h.dead = dead; h.cv.classList.toggle('dead', dead);
  if (dead) { const r = resolve(w, 'death'); if (r) playSheet(w, r.s, {hold:true}); }
  else { h.token++; h.cur = null; const r = resolve(w, 'revive'); if (r) playSheet(w, r.s).then(() => scheduleIdle(w, 1500)); else { drawStill(w); scheduleIdle(w, 1500); } }
}
function setAura(w, kind){
  const h = H[w]; if (!h) return; ['red', 'blue', 'orange', 'gold'].forEach(c => h.cv.classList.toggle('aura-' + c, c === kind));
}
function reset(){ WHO.forEach(w => { const h = H[w]; if (!h) return; h.token++; h.cur = null; h.dead = false; h.cv.classList.remove('dead'); setAura(w, null); drawStill(w); scheduleIdle(w, 1000); }); }
const none = () => {};
window.Anim = {META, play, setDead, setAura, reset, build, say:none, sayRandom:none, sfx:none, useSheet:() => {}, has:(w, n) => !!(H[w] && resolve(w, n))};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(build, 0)); else setTimeout(build, 0);
})();
