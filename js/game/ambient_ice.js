/* Banco de Dados I — RPG · cenario vivo do Tumulo do Rei Gelado: chamas azuis nas tochas, neve, nevoa baixa, reflexos no gelo e estandartes ao vento.
   So roda quando STAGE.ice (js/game/ambient.js se desliga nessa fase). Grade 256x384 (arte 1024x1536 / 4). */
(() => {
const S = window.STAGE; if (!S || !S.ice) return;
const game = document.getElementById('game'); if (!game) return;
const W = 256, H = 384, K = 4, R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
const mk = (cls, w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'amb ' + cls; return c; };
const cb = mk('b'), cf = mk('f'); game.insertBefore(cb, document.getElementById('fx')); game.appendChild(cf);
const cban = mk('b', 1024, 480); cban.style.height = (480 / 1536 * 100) + '%'; game.insertBefore(cban, cb);
const gb = cb.getContext('2d'), gf = cf.getContext('2d'), gban = cban.getContext('2d');
let g = gb, boost = 0;
const rect = (x, y, w, h, col, a) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
const T = [[362, 437, 1], [662, 437, 1], [188, 597, .9], [832, 597, .9], [22, 563, .8], [1002, 563, .8], [422, 522, .45], [602, 522, .45]].map(([x, y, s], i) => ({x:x / K, y:y / K, s, ph:R(0, 6.28), i}));
function flame(t, tm) {
  if (!(window.PXFX && PXFX.sim)) return;
  const s = t.s, cols = Math.max(5, Math.round(7 * s)), rows = Math.max(9, Math.round(14 * s)); if (!t.sim) { t.sim = PXFX.sim.make(cols, rows, 'frost'); t.cf = Array.from({length:cols}, () => Math.random()); }
  const now = performance.now(), cf = t.cf, base = t.y + 2 * s;
  PXFX.sim.step(t.sim, now, x => { if (x === 0) for (let i = 0; i < cols; i++) cf[i] = Math.max(0, Math.min(1, cf[i] + (Math.random() - .5) * .3)); const xn = (x / cols - .5) * 2;
    return 35 * Math.max(0, 1 - Math.pow(Math.abs(xn), 1.5)) * (.7 + .3 * cf[x]) * (.9 + .1 * Math.sin(tm * 11 + t.ph)) * (1 + boost * .3); }, 0, 1);
  g.save(); g.globalCompositeOperation = 'source-over'; PXFX.sim.draw(g, t.sim, t.x, base, 1, .95); g.restore();
}
function glow(t, fl) {
  const r = 26 * t.s * (1 + .08 * fl + boost * .3), gr = g.createRadialGradient(t.x, t.y - 4 * t.s, 0, t.x, t.y - 4 * t.s, r), a = .3 * (.8 + .25 * fl) + boost * .1;
  gr.addColorStop(0, `rgba(150,210,255,${a})`); gr.addColorStop(.5, `rgba(80,150,255,${a * .35})`); gr.addColorStop(1, 'rgba(60,120,255,0)');
  g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(t.x - r, t.y - r, r * 2, r * 2);
}
const ref = document.getElementById('reference');
function banners(tm) {
  if (!ref || !ref.naturalWidth) return; const sc = ref.naturalWidth / 1024;
  for (const [x0, x1, ph] of [[40, 140, 0], [886, 984, 2.1]]) for (let y = 186; y < 478; y += 3) { const u = (y - 186) / 292, amp = Math.pow(u, 1.4) * 4.2, dx = amp * (Math.sin(tm * 1.4 + ph - u * 1.6) * .7 + Math.sin(tm * 2.5 + ph * 2 - u * 2.5) * .3);
    gban.drawImage(ref, x0 * sc, y * sc, (x1 - x0) * sc, 3 * sc, x0 + dx, y, x1 - x0, 3); }
}
const fogB = Array.from({length:8}, (_, i) => ({x:R(-40, 300), y:R(190, 340), w:R(70, 120), h:R(9, 17), v:R(2, 6) * (i % 2 ? 1 : -1), a:R(.06, .12)}));
function fog(dt) {
  g = gb; g.globalCompositeOperation = 'source-over';
  for (const f of fogB) { f.x += f.v * dt; if (f.x > W + f.w) f.x = -f.w; if (f.x < -f.w) f.x = W + f.w; g.save(); g.translate(f.x, f.y); g.scale(f.w, f.h); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(170,205,255,${f.a})`); gr.addColorStop(1, 'rgba(170,205,255,0)'); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore(); }
}
const snow = Array.from({length:70}, () => ({x:R(0, W), y:R(0, H), vy:R(10, 26), ph:R(0, 6.28), a:R(.35, .9), z:Math.random() < .2 ? 2 : 1}));
const shim = Array.from({length:60}, () => { const cx = [29, 56, 198, 226][RI(0, 3)]; return {x:cx + RI(-2, 2), y:R(215, 335), ph:R(0, 6.28), sp:R(1.5, 4)}; });
let last = 0, t0 = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden || now - last < 40) return; const dt = Math.min(.1, (now - last) / 1000); last = now; const tm = (now - t0) / 1000;
  gb.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H); gban.clearRect(0, 0, 1024, 480); boost = Math.max(0, boost - dt * .6);
  banners(tm); fog(dt); g = gb; g.globalCompositeOperation = 'lighter';
  const fl = Math.sin(tm * 8.3) * .5 + Math.sin(tm * 13.7 + 1) * .3 + Math.sin(tm * 3.1) * .2;
  for (const t of T) glow(t, Math.sin(tm * 9 + t.ph) * .6 + Math.sin(tm * 15 + t.ph * 2) * .4);
  for (const p of shim) { const a = Math.max(0, Math.sin(tm * p.sp + p.ph)); if (a > .2) rect(p.x, p.y, 1, 2, '#bfe4ff', a * .5 * (.8 + .2 * fl)); }
  g.globalCompositeOperation = 'source-over'; for (const t of T) flame(t, tm);
  g = gf; g.globalCompositeOperation = 'source-over';
  for (const f of snow) { f.y += f.vy * dt; f.x += (Math.sin(tm * .9 + f.ph) * 4 + 7) * dt; if (f.y > H) { f.y = -2; f.x = R(0, W); } if (f.x > W) f.x = 0; rect(f.x, f.y, f.z, f.z, '#eaf6ff', f.a * (.7 + .3 * Math.sin(tm * 2 + f.ph))); }
  gb.globalAlpha = 1; gf.globalAlpha = 1;
}
requestAnimationFrame(loop);
window.AMB = {bats:[], spawnBat(){}, T, bolt(){ boost = 1; }, roar(){ boost = 1; }, crows:[]};
})();
