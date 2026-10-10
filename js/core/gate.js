/* Transição dos portões: duas portas de madeira e ferro, em pixel art, fecham cobrindo a tela e abrem na página seguinte.
   Gate.close() -> portas fecham (promessa resolve com a batida)   Gate.arrive() -> na página nova, se veio pelos portões, as portas abrem.
   Usada entre a tela de salas e a seleção de classe (nos dois sentidos). */
(() => {
'use strict';
if (window.Gate) return;
const de = document.documentElement, reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
let door = null, dk = '';
// uma porta (metade da tela) desenhada em resolução baixa e ampliada sem suavizar
function build(w, h) {
  const k = w + 'x' + h; if (door && dk === k) return door; dk = k;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const seed = 11; let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const woods = ['#2a1a12', '#33200f', '#3b2614', '#2e1c10'], PW = 8;
  for (let i = 0; i * PW < w; i++) { const base = woods[Math.floor(r() * woods.length)]; x.fillStyle = base; x.fillRect(i * PW, 0, PW, h);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(i * PW + PW - 1, 0, 1, h); x.fillStyle = 'rgba(255,200,120,.10)'; x.fillRect(i * PW, 0, 1, h);
    for (let g = 0; g < h / 5; g++) { if (r() < .55) { x.fillStyle = r() < .5 ? 'rgba(0,0,0,.22)' : 'rgba(255,190,110,.08)'; x.fillRect(i * PW + 1 + Math.floor(r() * (PW - 3)), Math.floor(r() * h), 1, 2 + Math.floor(r() * 5)); } } }
  // faixas de ferro
  const bands = [.17, .5, .83];
  bands.forEach(f => { const y = Math.round(h * f) - 5;
    x.fillStyle = '#0e0f16'; x.fillRect(0, y - 1, w, 12); x.fillStyle = '#2b2e3d'; x.fillRect(0, y, w, 10); x.fillStyle = '#454a60'; x.fillRect(0, y + 1, w, 2); x.fillStyle = '#1a1c28'; x.fillRect(0, y + 8, w, 2);
    for (let px = 5; px < w; px += 12) { x.fillStyle = '#0e0f16'; x.fillRect(px - 1, y + 2, 5, 5); x.fillStyle = '#8b90a8'; x.fillRect(px, y + 3, 3, 3); x.fillStyle = '#d6dbf0'; x.fillRect(px, y + 3, 1, 1); } });
  // moldura de pedra na borda externa (lado esquerdo da porta esquerda) e viga no alto/baixo
  x.fillStyle = '#15121c'; x.fillRect(0, 0, 6, h); x.fillStyle = '#3a3548'; x.fillRect(1, 0, 4, h); x.fillStyle = '#524c68'; x.fillRect(1, 0, 1, h);
  x.fillStyle = '#15121c'; x.fillRect(0, 0, w, 6); x.fillStyle = '#3a3548'; x.fillRect(0, 1, w, 4); x.fillRect(0, h - 6, w, 6); x.fillStyle = '#15121c'; x.fillRect(0, h - 6, w, 1);
  // junta central dourada
  x.fillStyle = '#0a0710'; x.fillRect(w - 5, 0, 5, h); x.fillStyle = '#8a5a1a'; x.fillRect(w - 4, 0, 3, h); x.fillStyle = '#e0b04a'; x.fillRect(w - 4, 0, 1, h); x.fillStyle = '#ffe08a'; x.fillRect(w - 4, 0, 1, h);
  // argola de ferro com aldrava dourada
  const cx = w - 17, cy = Math.round(h * .5), R = 8;
  for (let a = 0; a < 360; a += 4) { const px = Math.round(cx + Math.cos(a * Math.PI / 180) * R), py = Math.round(cy + Math.sin(a * Math.PI / 180) * R); x.fillStyle = '#0a0710'; x.fillRect(px - 2, py - 2, 5, 5); }
  for (let a = 0; a < 360; a += 4) { const px = Math.round(cx + Math.cos(a * Math.PI / 180) * R), py = Math.round(cy + Math.sin(a * Math.PI / 180) * R); x.fillStyle = a > 200 && a < 340 ? '#e0b04a' : '#8a5a1a'; x.fillRect(px - 1, py - 1, 3, 3); }
  x.fillStyle = '#0a0710'; x.fillRect(cx - 3, cy - R - 5, 7, 7); x.fillStyle = '#c8902a'; x.fillRect(cx - 2, cy - R - 4, 5, 5); x.fillStyle = '#ffe08a'; x.fillRect(cx - 1, cy - R - 3, 2, 2);
  // sombra suave na junta
  const g = x.createLinearGradient(w - 26, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = g; x.fillRect(w - 26, 0, 26, h);
  door = c; return c;
}
function layer() {
  const vw = innerWidth, vh = innerHeight, P = Math.max(3, Math.round(vw / 120)), c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9999;pointer-events:auto;image-rendering:pixelated;touch-action:none';
  c.width = Math.ceil(vw / P); c.height = Math.ceil(vh / P); (document.body||de).appendChild(c);
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const half = Math.ceil(c.width / 2) + 2, d = build(half, c.height);
  // poeira que cai quando as portas batem/abrem
  const dust = Array.from({ length: 46 }, () => ({ x: rnd() * c.width, y: -rnd() * 20, v: .25 + rnd() * .7, a: .25 + rnd() * .5 }));
  // p = 0 aberta, 1 fechada; sh = tremor da batida; lt = brilho da fresta
  function draw(p, sh, lt, t) {
    x.clearRect(0, 0, c.width, c.height); const W = c.width, off = Math.round((1 - p) * (W / 2 + 4)), oy = Math.round(sh);
    if (p < 1 && lt > 0) { const gw = Math.round((1 - p) * W * .5); const gr = x.createLinearGradient(W / 2 - gw, 0, W / 2 + gw, 0);
      gr.addColorStop(0, 'rgba(255,224,138,0)'); gr.addColorStop(.5, 'rgba(255,224,138,' + (.55 * lt) + ')'); gr.addColorStop(1, 'rgba(255,224,138,0)'); x.fillStyle = gr; x.fillRect(W / 2 - gw, 0, gw * 2, c.height); }
    x.drawImage(d, 0, 0, half, c.height, -off, oy, half, c.height);
    x.save(); x.translate(W + off, oy); x.scale(-1, 1); x.drawImage(d, 0, 0, half, c.height, 0, 0, half, c.height); x.restore();
    if (t) dust.forEach(q => { q.y += q.v; if (q.y > c.height) q.y = -2; x.fillStyle = 'rgba(210,190,150,' + q.a * Math.min(1, t) + ')'; x.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); });
  }
  return { c, draw, remove() { c.remove(); } };
}
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function run(ms, fn) { return new Promise(res => { const T0 = performance.now(); const st = now => { const t = Math.min(1, (now - T0) / ms); fn(t); if (t < 1) requestAnimationFrame(st); else res(); }; requestAnimationFrame(st); }); }
// chegada: se veio pelos portões, as portas fechadas já são desenhadas ao carregar o script (no head), antes de qualquer pintura da página
let pre = null;
try { if (sessionStorage.getItem('bd1_gate') && !reduce()) { pre = layer(); pre.draw(1, 0, 0, 0); const mine = pre; setTimeout(() => { if (pre === mine) { mine.remove(); pre = null; de.classList.remove('gt'); } }, 9000); } } catch (e) {}
window.Gate = {
  close(ms = 950) {
    if (reduce()) return Promise.resolve();
    const L = layer(); L.draw(0, 0, 1, 0);
    return run(ms, t => L.draw(ease(t), 0, 1 - t, 0)).then(() => run(260, t => L.draw(1, Math.round(Math.sin(t * 24) * (1 - t) * 2), 0, 0))).then(() => { L.draw(1, 0, 0, 0); });
  },
  arrive(ms = 1250) {
    let on = false; try { on = !!sessionStorage.getItem('bd1_gate'); sessionStorage.removeItem('bd1_gate'); } catch (e) {}
    if (!on) { de.classList.remove('gt'); return Promise.resolve(); }
    if (reduce()) { de.classList.remove('gt'); return Promise.resolve(); }
    const L = pre || layer(); pre = null; L.draw(1, 0, 0, 0); de.classList.remove('gt');
    return new Promise(r => setTimeout(r, 380)).then(() => run(ms, t => L.draw(1 - ease(t), t < .15 ? Math.round(Math.sin(t * 90) * 2) : 0, Math.sin(Math.min(1, t * 1.6) * Math.PI) * .9 + .1, t < .9 ? 1 : (1 - t) * 10))).then(() => L.remove());
  }
};
})();
