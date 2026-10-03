/* Cenário vivo da sala do boss: chamas, luz/sombra, brasas, reflexos, nuvens no céu, poeira e morcegos em perspectiva. */
(() => {
const game = document.getElementById('game'); if (!game) return;
const W = 256, H = 384, K = 4;                       // grade 256x384 = arte 1024x1536 / 4
const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
const mk = cls => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.className = 'amb ' + cls; return c; };
const cb = mk('b'), cf = mk('f'); game.insertBefore(cb, document.getElementById('fx')); game.appendChild(cf);
const gb = cb.getContext('2d'), gf = cf.getContext('2d'); let g = gb;
const rect = (x, y, w, h, col, a) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
const poly = (pts, col, a) => { g.globalAlpha = a; g.fillStyle = col; let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; if ((p[1] <= y + .5 && q[1] > y + .5) || (q[1] <= y + .5 && p[1] > y + .5)) xs.push(p[0] + (y + .5 - p[1]) / (q[1] - p[1]) * (q[0] - p[0])); }
    xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) g.fillRect(Math.round(xs[i]), y, Math.max(1, Math.round(xs[i + 1]) - Math.round(xs[i])), 1); } };

/* tochas: x,y (arte 1024x1536), tamanho, chama? */
const T = [[192,205,.8],[230,295,.9],[118,395,1.15],[245,462,.9],[350,312,1],[22,640,1],[668,312,1],[793,293,.9],[905,395,1.15],[775,462,.9],[998,640,1],
  [293,180,.45,0],[727,178,.45,0],[36,38,.4,0],[158,40,.4,0],[856,48,.4,0]].map(([x, y, s, f], i) => ({ x: x / K, y: y / K, s, f: f !== 0, ph: R(0, 6.28), i }));
const embers = [], motes = Array.from({ length: 26 }, () => ({ x: R(0, W), y: R(60, 330), v: R(1.5, 4), ph: R(0, 6.28), a: R(.15, .4) }));
const shim = Array.from({ length: 70 }, () => { const cx = [5, 31, 61, 192, 224, 250][RI(0, 5)]; return { x: cx + RI(-2, 2), y: R(150, 250), ph: R(0, 6.28), sp: R(1.5, 4) }; });
const clouds = Array.from({ length: 3 }, (_, i) => ({ x: R(80, 175), y: 8 + i * 11 + R(0, 4), w: R(26, 44), v: R(1.2, 2.6), a: R(.05, .1) }));

function flame(t, tm) {
  const f = k => Math.sin(tm * k + t.ph), s = t.s, hh = (7 + 2 * f(11) + 1.5 * f(17.3) + 1.2 * f(5)) * s, sway = (f(4.1) * 1.3 + f(9.7) * .6) * s, base = t.y + 3 * s;
  for (const [sc, col, a] of [[1, '#ff4a12', .5], [.72, '#ff9a2a', .6], [.42, '#ffe27a', .75]]) { const h = hh * sc, w = 3.3 * s * (.55 + .45 * sc);
    for (let y = 0; y <= h; y++) { const u = y / h, half = w * Math.pow(1 - u, .8), cx = t.x + sway * u * u; rect(cx - half, base - y, Math.max(1, Math.round(half * 2)), 1, col, a); } }
  if (f(7) > .25) { const u = (f(7) - .25) * 1.2; for (let y = 0; y < 5 * s; y++) rect(t.x - 2.5 * s - y * .3 + sway * .3, base - hh * .5 - y, 1, 1, '#ffb040', .6 * u); }
  if (f(5.3) < -.25) { for (let y = 0; y < 4 * s; y++) rect(t.x + 2.5 * s + y * .35 + sway * .3, base - hh * .45 - y, 1, 1, '#ff8a30', .55); }
}
function glow(t, tm, fl) {
  const r = (t.f ? 24 : 12) * t.s * (1 + .08 * fl), gr = g.createRadialGradient(t.x, t.y, 0, t.x, t.y, r), a = (t.f ? .26 : .2) * (.8 + .25 * fl);
  gr.addColorStop(0, `rgba(255,150,50,${a})`); gr.addColorStop(.5, `rgba(255,100,30,${a * .35})`); gr.addColorStop(1, 'rgba(255,80,20,0)');
  g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(t.x - r, t.y - r, r * 2, r * 2);
}

/* morcegos */
const bats = [];
function spawnBat() {
  const near = Math.random() < .55, side = Math.random() < .5 ? -1 : 1, n = near ? 1 : RI(1, 3), gid = Math.random();
  for (let k = 0; k < n; k++) {
    if (near) { const x0 = side < 0 ? R(-20, 40) : R(215, 276), y0 = R(205, 300); bats.push({ t0: performance.now() + k * 350, dur: R(5200, 7200), x0, y0, x1: R(105, 150) + R(-12, 12), y1: R(78, 118), s0: R(2.6, 3.3), s1: R(.3, .45), fl: R(15, 20), ph: R(0, 6.28), wob: R(6, 12), near: true }); }
    else { const y = R(26, 150) + k * R(4, 9); bats.push({ t0: performance.now() + k * 420, dur: R(7500, 12000), x0: side < 0 ? -12 : W + 12, y0: y, x1: side < 0 ? W + 12 : -12, y1: y + R(-30, 30), s0: R(.45, .8), s1: R(.45, .8), fl: R(15, 20), ph: R(0, 6.28), wob: R(2, 5), near: false }); }
  }
}
function drawBat(b, now, tm) {
  const u = (now - b.t0) / b.dur; if (u < 0 || u > 1) return u > 1;
  const e = b.near ? u * u * (3 - 2 * u) * .4 + u * .6 : u, s = b.s0 + (b.s1 - b.s0) * e, x = b.x0 + (b.x1 - b.x0) * e + Math.sin(u * 14 + b.ph) * b.wob * s * .5, y = b.y0 + (b.y1 - b.y0) * e + Math.sin(u * 23 + b.ph) * 3 * s;
  g = (b.near && s > .95) ? gf : gb; g.globalCompositeOperation = 'source-over';
  const fa = Math.sin(tm * b.fl + b.ph), tip = fa * 5.2 * s - .6 * s, tr = 2.4 * s * (1 - .25 * fa), al = Math.min(1, u * 8, (1 - u) * 6) * (b.near ? 1 : .85);
  if (b.near && s > 1.1) { for (let dy = -1; dy <= 1; dy++) rect(x - 7 * s * (1 - Math.abs(dy) * .35), y + 17 * s + dy * 1.4 * s, Math.round(14 * s * (1 - Math.abs(dy) * .35)), Math.max(1, Math.round(s)), '#000', .13 * al); }
  for (const d of [-1, 1]) {
    poly([[x + d * 1 * s, y - .5 * s], [x + d * 4.5 * s, y - 2.2 * s + tip * .35], [x + d * 8.6 * s, y + tip], [x + d * 6.4 * s, y + tip + 1.4 * s], [x + d * 4.4 * s, y + tr * .7 + tip * .3], [x + d * 2.4 * s, y + tr + .4 * s], [x + d * 1 * s, y + 1.6 * s]], '#080714', .96 * al);
    if (s > .9) poly([[x + d * 4.5 * s, y - 2.2 * s + tip * .35], [x + d * 8.6 * s, y + tip], [x + d * 8 * s, y + tip + .35 * s], [x + d * 4.4 * s, y - 1.6 * s + tip * .35]], '#6a55b8', .75 * al);
  }
  poly([[x - 1.1 * s, y - 1.2 * s], [x - .6 * s, y - 2.3 * s], [x, y - 1.5 * s], [x + .6 * s, y - 2.3 * s], [x + 1.1 * s, y - 1.2 * s], [x + 1.1 * s, y + 1.8 * s], [x, y + 2.6 * s], [x - 1.1 * s, y + 1.8 * s]], '#0b0918', al);
  g = gb; return false;
}

let last = 0, nextBat = performance.now() + 2500, t0 = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden || now - last < 40) return; const dt = Math.min(.1, (now - last) / 1000); last = now; const tm = (now - t0) / 1000;
  gb.globalCompositeOperation = 'source-over'; gf.globalCompositeOperation = 'source-over'; gb.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
  g = gb; g.globalCompositeOperation = 'lighter';
  const fl = (Math.sin(tm * 8.3) * .5 + Math.sin(tm * 13.7 + 1) * .3 + Math.sin(tm * 3.1) * .2);
  /* nuvens no céu (janela do trono) */
  g.save(); g.beginPath(); g.rect(84, 4, 90, 58); g.clip();
  for (const c of clouds) { c.x += c.v * dt; if (c.x > 190) c.x = 60 - c.w; for (let i = 0; i < 3; i++) rect(c.x + i * 4, c.y + i, c.w - i * 8, 2, '#8fa6ff', c.a); }
  g.restore();
  /* luz no ambiente */
  for (const t of T) glow(t, tm, Math.sin(tm * 9 + t.ph) * .6 + Math.sin(tm * 15 + t.ph * 2) * .4);
  /* reflexos no chão */
  for (const p of shim) { const a = Math.max(0, Math.sin(tm * p.sp + p.ph)); if (a > .2) rect(p.x, p.y, 1, 2, '#ff9a3a', a * .55 * (.8 + .2 * fl)); }
  /* chamas */
  for (const t of T) if (t.f) flame(t, tm);
  /* brasas */
  if (embers.length < 26 && Math.random() < .5) { const t = T[RI(0, 10)]; embers.push({ x: t.x + R(-2, 2), y: t.y, vy: R(10, 22), vx: R(-3, 3), life: R(.9, 2.2), t: 0, ph: R(0, 6.28) }); }
  for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.t += dt; if (e.t > e.life) { embers.splice(i, 1); continue; } e.y -= e.vy * dt; e.x += (e.vx + Math.sin(e.t * 6 + e.ph) * 4) * dt; const u = e.t / e.life; rect(e.x, e.y, 1, 1, u < .5 ? '#ffd070' : '#ff7a2a', (1 - u) * .9); }
  /* poeira flutuando na luz */
  for (const m of motes) { m.y -= m.v * dt; m.x += Math.sin(tm * .8 + m.ph) * 3 * dt; if (m.y < 50) { m.y = R(300, 360); m.x = R(0, W); } rect(m.x, m.y, 1, 1, '#ffc080', m.a * (.5 + .5 * Math.sin(tm * 2 + m.ph))); }
  /* sombra ambiente que pulsa com o fogo (bordas) */
  g.globalCompositeOperation = 'source-over'; const v = gf.createRadialGradient(W / 2, 150, 70, W / 2, 150, 260); v.addColorStop(0, 'rgba(0,0,10,0)'); v.addColorStop(1, `rgba(0,0,10,${.2 - .05 * fl})`); gf.globalAlpha = 1; gf.fillStyle = v; gf.fillRect(0, 0, W, H);
  /* morcegos */
  if (now > nextBat && bats.length < 5) { spawnBat(); nextBat = now + R(2800, 6500); }
  const order = bats.slice().sort((a, b) => a.s0 - b.s0);
  for (const b of order) if (drawBat(b, now, tm)) bats.splice(bats.indexOf(b), 1);
  gb.globalAlpha = 1; gf.globalAlpha = 1;
}
requestAnimationFrame(loop);
window.AMB = { bats, spawnBat, T };
})();
