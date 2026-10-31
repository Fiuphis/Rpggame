/* Banco de Dados I — RPG · efeitos em pixel art (sprite sheets do PixelLab vfx_workbench)
   Tiras horizontais em assets/fx/, descritas em data/vfx_manifest.json ({src, w, h, ax, ay, frames, durs}; ax/ay = origem do efeito).
   Desenha numa camada própria (coordenadas do grid 1024x1536, ampliado x2 como os heróis), com brilho aditivo por baixo.
   API: VFX.play(nome, {x, y, scale, speed, loop, dur, glow, back, to:{x, y, ms, ease}}) (back = atrás dos heróis) -> promessa (fim), VFX.flash(cor, ms, a), VFX.shake(px, ms), VFX.clear(). */
(() => {
'use strict';
let cv = null, g = null, gf = null, gb = null, cvb = null, el = null, MAN = {}, list = [], running = false;
const IMG = {};
const clk = () => performance.now() * (window.__ts == null ? 1 : window.__ts);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const EASE = {lin:u => u, in:u => u * u, out:u => 1 - (1 - u) * (1 - u), inout:u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2};

function img(n){
  const m = MAN[n]; if (!m) return null;
  if (!IMG[n]) { const i = new Image(); i.src = m.src; IMG[n] = i; }
  return IMG[n].complete && IMG[n].naturalWidth ? IMG[n] : null;
}
function glow(x, y, r, col, a){
  if (a <= .005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,250,240,${clamp(a * .55)})`); gr.addColorStop(.2, `rgba(${col},${clamp(a)})`); gr.addColorStop(.55, `rgba(${col},${clamp(a * .3)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function frameAt(m, t, loop){
  const tot = m.durs.reduce((a, b) => a + b, 0); if (loop) t %= tot; else if (t >= tot) return -1;
  for (let i = 0; i < m.frames; i++) { if (t < m.durs[i]) return i; t -= m.durs[i]; }
  return m.frames - 1;
}
function draw(e, now){
  const t = (now - e.t0) * e.speed; if (t < 0) return true;
  g = e.back ? gb : gf;
  const m = MAN[e.n], im = img(e.n); if (!m) return false;
  if (e.dur != null && now - e.t0 >= e.dur) return false;
  const f = frameAt(m, t, e.loop); if (f < 0) return false;
  let x = e.x, y = e.y;
  if (e.to) { const u = clamp((now - e.t0) / e.to.ms), k = (EASE[e.to.ease] || EASE.in)(u); x += (e.to.x - e.x) * k; y += (e.to.y - e.y) * k; if (u >= 1 && !e.to.stay) return false; }
  let a = 1; if (e.dur != null && e.fade) a = clamp((e.dur - (now - e.t0)) / e.fade) * clamp((now - e.t0) / e.fade);   // entra e sai suave
  const s = e.scale * (e.pop ? .6 + .4 * clamp((now - e.t0) / e.pop) : 1);
  if (e.glow) { const p = .85 + .15 * Math.sin(now / 90); glow(x, y, e.glow.r * s / 2 * p, e.glow.col, (e.glow.a || .5) * a); }
  if (im) { g.save(); g.globalAlpha = a; g.imageSmoothingEnabled = false; const w = m.w * s, h = m.h * s; const ax = (m.ax != null ? m.ax : m.w / 2) * s, ay = (m.ay != null ? m.ay : m.h / 2) * s; g.drawImage(im, f * m.w, 0, m.w, m.h, Math.round(x - ax), Math.round(y - ay), w, h); g.restore(); }
  return true;
}
function frame(){
  if (!running) return; const now = clk();
  gf.clearRect(0, 0, cv.width, cv.height); gb.clearRect(0, 0, cv.width, cv.height);
  list = list.filter(e => { const ok = draw(e, now); if (!ok && e.done) e.done(); return ok; });
  if (!list.length) { running = false; return; }
  requestAnimationFrame(frame);
}
function start(){ if (!running && cv) { running = true; requestAnimationFrame(frame); } }

window.VFX = {
  init(root){
    if (cv) return; el = root; cv = document.createElement('canvas'); cv.className = 'fxl front vfx'; cv.width = 1024; cv.height = 1536; root.append(cv); gf = g = cv.getContext('2d');
    cvb = document.createElement('canvas'); cvb.className = 'fxl back vfx'; cvb.width = 1024; cvb.height = 1536; root.append(cvb); gb = cvb.getContext('2d');
    fetch('data/vfx_manifest.json', {cache:'no-cache'}).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(m => { MAN = m || {}; Object.keys(MAN).forEach(img); });
  },
  has: n => !!MAN[n],
  len: (n, speed = 1) => MAN[n] ? MAN[n].durs.reduce((a, b) => a + b, 0) / speed : 0,
  play(n, o = {}){
    if (!cv || !MAN[n]) return Promise.resolve(false);
    return new Promise(res => {
      const e = {n, x:o.x || 0, y:o.y || 0, scale:o.scale || 2, speed:o.speed || 1, loop:!!o.loop, dur:o.dur, fade:o.fade || 0, pop:o.pop || 0, glow:o.glow || null, back:!!o.back, to:o.to || null, t0:clk() + (o.delay || 0), done:() => res(true)};
      list.push(e); start(); if (o.handle) o.handle(e);
    });
  },
  stop(e){ if (e) e.dur = 0; },
  flash(col = '255,255,255', ms = 260, a = .45){   // clarão na tela inteira do jogo
    if (!el) return; const d = document.createElement('div'); d.className = 'vfx-flash'; d.style.background = `rgb(${col})`; el.append(d);
    d.animate([{opacity:a}, {opacity:0}], {duration:ms, easing:'ease-out'}).finished.then(() => d.remove());
  },
  shake(px = 6, ms = 320){
    if (!el) return; const k = [], n = 8; for (let i = 0; i <= n; i++) { const f = 1 - i / n; k.push({transform:`translate(${((i % 2 ? 1 : -1) * px * f).toFixed(1)}px,${((i % 3 ? -1 : 1) * px * .5 * f).toFixed(1)}px)`}); }
    el.animate(k, {duration:ms, easing:'linear'});
  },
  clear(){ list.forEach(e => e.done && e.done()); list = []; if (gf) { gf.clearRect(0, 0, cv.width, cv.height); gb.clearRect(0, 0, cv.width, cv.height); } },
};
})();
