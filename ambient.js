/* Cenário vivo da sala do boss: chamas, luz/sombra, brasas, reflexos, nuvens no céu, poeira e morcegos em perspectiva. */
(() => {
const game = document.getElementById('game'); if (!game) return;
if (window.STAGE && window.STAGE.ice) return;   // Hrimgar: o cenario vivo e o ambient_ice.js
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
let lit = 1, roarT = -1e9, bossBlink = 0;
const embers = [], motes = Array.from({ length: 26 }, () => ({ x: R(0, W), y: R(60, 330), v: R(1.5, 4), ph: R(0, 6.28), a: R(.15, .4) }));
const shim = Array.from({ length: 70 }, () => { const cx = [5, 31, 61, 192, 224, 250][RI(0, 5)]; return { x: cx + RI(-2, 2), y: R(150, 250), ph: R(0, 6.28), sp: R(1.5, 4) }; });
const clouds = Array.from({ length: 3 }, (_, i) => ({ x: R(80, 175), y: 8 + i * 11 + R(0, 4), w: R(26, 44), v: R(1.2, 2.6), a: R(.05, .1) }));

function flame(t, tm) {      // chama pixel art (autômato celular do pxfx.js, 1 célula = 1 pixel da grade); sem pxfx cai na chama antiga
  if (window.PXFX && PXFX.sim) { const s = t.s, cols = Math.max(5, Math.round(7 * s)), rows = Math.max(9, Math.round(14 * s)); if (!t.sim) { t.sim = PXFX.sim.make(cols, rows, 'fire'); t.cf = Array.from({length:cols}, () => Math.random()); }
    const now = performance.now(), cf = t.cf, base = t.y + 3 * s;
    PXFX.sim.step(t.sim, now, x => { if (x === 0) for (let i = 0; i < cols; i++) cf[i] = Math.max(0, Math.min(1, cf[i] + (Math.random() - .5) * .3)); const xn = (x / cols - .5) * 2;
      return 35 * Math.max(0, 1 - Math.pow(Math.abs(xn), 1.5)) * Math.max(.1, lit) * (.7 + .3 * cf[x]) * (.9 + .1 * Math.sin(tm * 11 + t.ph)); }, 0, 1);
    g.save(); g.globalCompositeOperation = 'source-over'; PXFX.sim.draw(g, t.sim, t.x, base, 1, .95); g.restore(); return; }
  const f = k => Math.sin(tm * k + t.ph), s = t.s, hh = (7 + 2 * f(11) + 1.5 * f(17.3) + 1.2 * f(5)) * s * Math.max(.12, lit), sway = (f(4.1) * 1.3 + f(9.7) * .6) * s, base = t.y + 3 * s;
  for (const [sc, col, a] of [[1, '#ff4a12', .5], [.72, '#ff9a2a', .6], [.42, '#ffe27a', .75]]) { const h = hh * sc, w = 3.3 * s * (.55 + .45 * sc);
    for (let y = 0; y <= h; y++) { const u = y / h, half = w * Math.pow(1 - u, .8), cx = t.x + sway * u * u; rect(cx - half, base - y, Math.max(1, Math.round(half * 2)), 1, col, a); } }
  if (f(7) > .25) { const u = (f(7) - .25) * 1.2; for (let y = 0; y < 5 * s; y++) rect(t.x - 2.5 * s - y * .3 + sway * .3, base - hh * .5 - y, 1, 1, '#ffb040', .6 * u); }
  if (f(5.3) < -.25) { for (let y = 0; y < 4 * s; y++) rect(t.x + 2.5 * s + y * .35 + sway * .3, base - hh * .45 - y, 1, 1, '#ff8a30', .55); }
}
function glow(t, tm, fl) {
  const r = (t.f ? 24 : 12) * t.s * (1 + .08 * fl), gr = g.createRadialGradient(t.x, t.y, 0, t.x, t.y, r), a = (t.f ? .26 : .2) * (.8 + .25 * fl) * lit;
  gr.addColorStop(0, `rgba(255,150,50,${a})`); gr.addColorStop(.5, `rgba(255,100,30,${a * .35})`); gr.addColorStop(1, 'rgba(255,80,20,0)');
  g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(t.x - r, t.y - r, r * 2, r * 2);
}

/* morcegos */
const bats = [];
function spawnBat() {
  const near = Math.random() < .55, side = Math.random() < .5 ? -1 : 1, n = near ? 1 : RI(1, 3), gid = Math.random();
  for (let k = 0; k < n; k++) {
    if (near) { const x0 = side < 0 ? R(-20, 40) : R(215, 276), y0 = R(55, 115); bats.push({ t0: performance.now() + k * 350, dur: R(5200, 7200), x0, y0, x1: (side < 0 ? R(150, 215) : R(40, 106)), y1: R(16, 48), s0: R(2.6, 3.3), s1: R(.3, .45), fl: R(15, 20), ph: R(0, 6.28), wob: R(6, 12), near: true }); }
    else { const y = R(18, 105) + k * R(4, 9); bats.push({ t0: performance.now() + k * 420, dur: R(7500, 12000), x0: side < 0 ? -12 : W + 12, y0: y, x1: side < 0 ? W + 12 : -12, y1: y + R(-18, 18), s0: R(.45, .8), s1: R(.45, .8), fl: R(15, 20), ph: R(0, 6.28), wob: R(2, 5), near: false }); }
  }
}
function drawBat(b, now, tm) {
  const u = (now - b.t0) / b.dur; if (u < 0 || u > 1) return u > 1;
  const e = b.near ? u * u * (3 - 2 * u) * .4 + u * .6 : u, s = b.s0 + (b.s1 - b.s0) * e, x = b.x0 + (b.x1 - b.x0) * e + Math.sin(u * 14 + b.ph) * b.wob * s * .5, y = b.y0 + (b.y1 - b.y0) * e + Math.sin(u * 23 + b.ph) * 3 * s;
  g = gb; g.globalCompositeOperation = 'source-over';
  const fa = Math.sin(tm * b.fl + b.ph), tip = fa * 5.2 * s - .6 * s, tr = 2.4 * s * (1 - .25 * fa), al = Math.min(1, u * 8, (1 - u) * 6) * (b.near ? 1 : .85);
    for (const d of [-1, 1]) {
    poly([[x + d * 1 * s, y - .5 * s], [x + d * 4.5 * s, y - 2.2 * s + tip * .35], [x + d * 8.6 * s, y + tip], [x + d * 6.4 * s, y + tip + 1.4 * s], [x + d * 4.4 * s, y + tr * .7 + tip * .3], [x + d * 2.4 * s, y + tr + .4 * s], [x + d * 1 * s, y + 1.6 * s]], '#080714', .96 * al);
    if (s > .9) poly([[x + d * 4.5 * s, y - 2.2 * s + tip * .35], [x + d * 8.6 * s, y + tip], [x + d * 8 * s, y + tip + .35 * s], [x + d * 4.4 * s, y - 1.6 * s + tip * .35]], '#6a55b8', .75 * al);
  }
  poly([[x - 1.1 * s, y - 1.2 * s], [x - .6 * s, y - 2.3 * s], [x, y - 1.5 * s], [x + .6 * s, y - 2.3 * s], [x + 1.1 * s, y - 1.2 * s], [x + 1.1 * s, y + 1.8 * s], [x, y + 2.6 * s], [x - 1.1 * s, y + 1.8 * s]], '#0b0918', al);
  g = gb; return false;
}


/* ---- extras v153 ---- */
const rage = () => { try { return window.BD_RAGE ? Math.min(1, window.BD_RAGE()) : 0; } catch (e) { return 0; } };
const roar = (k = 1) => { roarT = performance.now(); roarK = k; }; let roarK = 1;
try { new MutationObserver(() => { if (game.classList.contains('boss-attack') && !game._ra) { game._ra = 1; roar(1); } else if (!game.classList.contains('boss-attack')) game._ra = 0; }).observe(game, { attributes: true, attributeFilter: ['class'] });
  const tb = document.getElementById('turn-banner'); if (tb) new MutationObserver(() => { if (tb.classList.contains('show') && /ENFURECEU/.test(tb.textContent) && !tb._ra) { tb._ra = 1; roar(1.4); } if (!tb.classList.contains('show')) tb._ra = 0; }).observe(tb, { attributes: true, attributeFilter: ['class'], childList: true }); } catch (e) {}

/* banners balançando (canvas 1024px redesenha fatias da própria arte) */
const ref = document.getElementById('reference'), cban = document.createElement('canvas'); cban.width = 1024; cban.height = 330; cban.className = 'amb b'; cban.style.height = (330 / 1536 * 100) + '%'; game.insertBefore(cban, cb); const gban = cban.getContext('2d');
function banners(tm) {
  if (!ref || !ref.naturalWidth) return; const sc = ref.naturalWidth / 1024;
  for (const [x0, x1, ph] of [[34, 156, 0], [858, 984, 2.1]]) for (let y = 90; y < 322; y += 3) { const u = (y - 90) / 232, amp = Math.pow(u, 1.4) * 4.2, dx = amp * (Math.sin(tm * 1.5 + ph - u * 1.6) * .7 + Math.sin(tm * 2.7 + ph * 2 - u * 2.5) * .3);
    gban.drawImage(ref, x0 * sc, y * sc, (x1 - x0) * sc, 3 * sc, x0 + dx, y, x1 - x0, 3); }
}

/* raios de luar */
function shafts(tm, flash) {
  g = gb; g.globalCompositeOperation = 'lighter'; const k = (.55 + .45 * Math.sin(tm * .6)) * (1 + flash * 3);
  for (const [ox, w, sk, a] of [[100, 9, 58, .075], [118, 6, 66, .06], [138, 11, 52, .07], [152, 5, 74, .05]]) {
    const gr = g.createLinearGradient(0, 8, 0, 175); gr.addColorStop(0, `rgba(150,175,255,${a * k})`); gr.addColorStop(1, 'rgba(150,175,255,0)');
    g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.moveTo(ox, 8); g.lineTo(ox + w, 8); g.lineTo(ox + w - sk, 175); g.lineTo(ox - sk, 175); g.closePath(); g.fill(); }
}

/* névoa baixa */
const fogB = Array.from({ length: 7 }, (_, i) => ({ x: R(-40, 300), y: R(150, 330), w: R(60, 110), h: R(9, 17), v: R(1.5, 4.5) * (i % 2 ? 1 : -1), a: R(.05, .1) }));
function fog(dt) {
  g = gb; g.globalCompositeOperation = 'source-over';
  for (const f of fogB) { f.x += f.v * dt; if (f.x > W + f.w) f.x = -f.w; if (f.x < -f.w) f.x = W + f.w; g.save(); g.translate(f.x, f.y); g.scale(f.w, f.h); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(120,140,215,${f.a})`); gr.addColorStop(1, 'rgba(120,140,215,0)'); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore(); }
}

/* relâmpago raro no céu */
let nextBolt = performance.now() + 7000, boltT = -1e9, boltPts = [], boltBr = [];
function bolt(now) { boltT = now; const sd = Math.random() < .5 ? 1 : 0, x0 = sd ? R(155, 168) : R(88, 100); boltPts = [[x0, 12]]; let x = x0, y = 12; while (y < 76) { x += R(-5, 5) + (sd ? -.8 : .8); y += R(5, 9); boltPts.push([x, y]); } boltBr = []; for (let k = 1; k < boltPts.length - 2; k += 2) { let bx = boltPts[k][0], by = boltPts[k][1]; const dir = Math.random() < .5 ? -1 : 1, br = [[bx, by]]; for (let q = 0; q < 3; q++) { bx += dir * R(3, 6); by += R(3, 6); br.push([bx, by]); } boltBr.push(br); } roar(0); lit = 1; }
function lightning(now) {
  if (now > nextBolt) { bolt(now); nextBolt = now + R(10000, 24000); }
  const d = (now - boltT) / 1000; if (d > 1) return 0; const f = Math.max(0, d < .12 ? 1 : d < .22 ? .25 : d < .34 ? 1 : d < .42 ? .3 : Math.max(0, .9 - (d - .42) * 1.5));
  if (f > .02) { g = gf; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1; g.fillStyle = `rgba(105,130,255,${.26 * f})`; g.fillRect(0, 0, W, H);
    const mx = boltPts[Math.floor(boltPts.length / 2)][0], my = boltPts[Math.floor(boltPts.length / 2)][1], gr = g.createRadialGradient(mx, my, 0, mx, my, 70); gr.addColorStop(0, `rgba(210,225,255,${.35 * f})`); gr.addColorStop(1, 'rgba(210,225,255,0)'); g.fillStyle = gr; g.fillRect(mx - 70, my - 70, 140, 140); }
  if (d < .8 && f > .1) { g = gb; g.globalCompositeOperation = 'lighter'; const al = Math.min(1, f);
    const line = (pts, w, a) => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; rect(x - w - 2, y, w * 2 + 5, 1, '#6f8fff', a * .16); rect(x - w - 1, y, w * 2 + 3, 1, '#cfe0ff', a * .3); rect(x - (w > 0 ? 0 : 0), y, w, 1, '#fff', a); } } };
    line(boltPts, 1, al); for (const br of boltBr) line(br, 0, al * .8); }
  return f;
}

/* olhos do boss: brilham mais com a Fúria */
function eyes(tm) {
  const r = rage(), p = .7 + .3 * Math.sin(tm * (4 + r * 8)), a = (.18 + .82 * r) * p; g = gf; g.globalCompositeOperation = 'lighter';
  for (const ex of [121.6, 129]) { const rad = 3 + 8 * r, gr = g.createRadialGradient(ex, 52, 0, ex, 52, rad); gr.addColorStop(0, `rgba(255,60,40,${.7 * a})`); gr.addColorStop(1, 'rgba(255,40,20,0)'); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(ex - rad, 52 - rad, rad * 2, rad * 2); rect(ex - .5, 51.5, 1, 1, '#ff9a80', Math.min(1, .3 + a)); }
  if (r >= 1 && Math.random() < .35) rect(R(105, 145), R(46, 80), 1, 1, '#ff5a30', .7);
}

/* runas rituais no chão */
const GL = [[1,0,1,1,1,1,0,1,0],[1,1,1,0,1,0,1,1,1],[0,1,0,1,1,1,1,0,1],[1,0,1,0,1,0,1,1,1]];
function runes(tm) {
  g = gb; g.globalCompositeOperation = 'lighter'; const cx = 128, cy = 178, rx = 82, ry = 11, n = 16, r = rage();
  for (let i = 0; i < n; i++) { const an = i / n * 6.283, x = cx + Math.cos(an) * rx, y = cy + Math.sin(an) * ry, a = Math.max(0, Math.sin(tm * 1.8 - i * .5)), gl = GL[i % 4];
    for (let q = 0; q < 9; q++) if (gl[q]) rect(x - 1 + q % 3, y - 1 + Math.floor(q / 3), 1, 1, r > .6 ? '#ff4a50' : '#c04aff', (.1 + .5 * a) * (.5 + .5 * Math.max(.4, r))); 
    rect(x + Math.cos(an + .2) * 4, y + Math.sin(an + .2) * 1.2, 1, 1, '#a06aff', .14); }
}

/* teias nos cantos do vão do céu */
function webs(tm) {
  g = gb; g.globalCompositeOperation = 'source-over';
  for (const [cx, cy, dir] of [[0, 64, 1], [256, 64, -1]]) { const L = 15, sw = Math.sin(tm * 1.3 + cx) * .9; const ends = []; for (let k = 0; k <= 3; k++) { const an = k / 3 * 1.45 + .05, ex = cx + dir * Math.cos(an) * L, ey = cy + Math.sin(an) * L; ends.push([ex + sw * (k / 3), ey]); }
    for (const [ex, ey] of ends) for (let q = 0; q <= 14; q++) rect(cx + (ex - cx) * q / 14, cy + (ey - cy) * q / 14, 1, 1, '#c8c8e8', .28);
    for (const rr of [.38, .68]) for (let k = 0; k < 3; k++) { const [ax, ay] = ends[k], [bx, by] = ends[k + 1]; for (let q = 0; q <= 5; q++) { const t = q / 5, x = cx + ((ax + (bx - ax) * t) - cx) * rr, y = cy + ((ay + (by - ay) * t) - cy) * rr + Math.sin(t * 3.14) * .9; rect(x, y, 1, 1, '#c8c8e8', .24); } } }
}

/* sombras dos heróis tremendo com a luz */
const FEET = [[26, 268], [84, 271], [149, 271], [228, 268]];
function shadows(tm, fl) {
  g = gb; g.globalCompositeOperation = 'source-over';
  FEET.forEach(([x, y], i) => { const sx = Math.sin(tm * 3 + i) * .8 + fl * 1.1, wd = 12 * (1 + .09 * fl + (1 - lit) * .6);
    for (let r = -2; r <= 2; r++) { const w = Math.round(wd * (1 - Math.abs(r) * .22)); rect(x - w + sx, y + r, w * 2, 1, '#000', .22 + (1 - lit) * .12 - Math.abs(r) * .03); } });
}

/* corvos: pousam nos pilares e voam de vez em quando */
const SPOTS = [[88, 37], [167, 37], [68, 91], [187, 91]];
const crows = SPOTS.map((p, i) => ({ x: p[0], y: p[1], st: 'perch', next: performance.now() + R(4000, 16000) + i * 3000, dir: i % 2 ? -1 : 1, turn: performance.now() + R(1500, 4000), blink: 0, t0: 0, from: null, to: null, dur: 0, s: 1 }));
function drawCrowPerch(c, now) {
  g = gb; g.globalCompositeOperation = 'source-over'; const d = c.dir, x = c.x, y = c.y;
  rect(x - 2, y - 4, 5, 3, '#07060f', 1); rect(x - 1 + d * 2, y - 6, 2, 2, '#07060f', 1); rect(x - 2 - d * 1, y - 2, 3, 3, '#07060f', 1); rect(x - 3 - d * 2, y - 1, 2, 1, '#07060f', 1); rect(x - 2, y - 4, 4, 1, '#4a3d8a', .55);
  rect(x + d * 3 - (d < 0 ? 1 : 0), y - 5, 1, 1, '#d8d8ff', now < c.blink ? 0 : .9); rect(x - 1, y - 1, 1, 1, '#07060f', 1); rect(x + 1, y - 1, 1, 1, '#07060f', 1);
}
function updCrow(c, now, tm) {
  if (c.st === 'perch') { if (now > c.turn) { c.dir *= -1; c.turn = now + R(1500, 5000); } if (Math.random() < .015) c.blink = now + 140;
    drawCrowPerch(c, now); if (now > c.next) { c.st = 'away'; c.t0 = now; c.dur = R(2200, 3200); c.from = [c.x, c.y]; const sd = c.x < 128 ? -1 : 1; c.to = [c.x + sd * R(110, 170), c.y - R(40, 90)]; } return; }
  if (c.st === 'away' || c.st === 'back') { const u = (now - c.t0) / c.dur; if (u >= 1) { if (c.st === 'away') { c.st = 'gone'; c.next = now + R(7000, 20000); } else { c.st = 'perch'; c.next = now + R(9000, 30000); c.turn = now + 2000; } return; }
    const e = c.st === 'away' ? u : 1 - (1 - u) * (1 - u) * 0 + 0, a = c.st === 'away' ? [c.from, c.to] : [c.to, c.from], k = c.st === 'away' ? u * u * .6 + u * .4 : 1 - Math.pow(1 - u, 2);
    const x = a[0][0] + (a[1][0] - a[0][0]) * k, y = a[0][1] + (a[1][1] - a[0][1]) * k + Math.sin(u * 16) * 2 * (1 - (c.st === 'back' ? u : 0)); g = gb; g.globalCompositeOperation = 'source-over';
    const fa = Math.sin(tm * 18 + c.x), tip = fa * 3.2 - .4, s = 1, al = Math.min(1, u * 5, (1 - u) * 5);
    for (const d of [-1, 1]) poly([[x + d, y - 1], [x + d * 5, y - 1.5 + tip * .3], [x + d * 9, y + tip], [x + d * 6, y + tip + 1.2], [x + d * 3, y + 1.3], [x + d, y + 1.8]], '#06050e', .95 * al);
    poly([[x - 1.2, y - 1.6], [x, y - 2.6], [x + 1.2, y - 1.6], [x + 1.2, y + 2], [x, y + 3.2], [x - 1.2, y + 2]], '#07060f', al); return; }
  if (c.st === 'gone' && now > c.next) { c.st = 'back'; c.t0 = now; c.dur = R(2600, 3800); const sd = c.x < 128 ? -1 : 1; c.from = [c.x + sd * R(110, 170), c.y - R(40, 90)]; c.to = [c.x, c.y]; c.from = c.from; const tmp = c.from; c.from = c.to; c.to = tmp; }
}

let last = 0, nextBat = performance.now() + 2500, t0 = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden || now - last < 40) return; const dt = Math.min(.1, (now - last) / 1000); last = now; const tm = (now - t0) / 1000;
  gb.globalCompositeOperation = 'source-over'; gf.globalCompositeOperation = 'source-over'; gb.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H); gban.setTransform(1, 0, 0, 1, 0, 0);
  { const d = (now - roarT) / 1000; lit = d < 0 || d > 2.4 ? 1 : d < .25 ? 1 - .85 * (d / .25) : (() => { const u = (d - .25) / 2.15; return .15 + .85 * (1 - Math.pow(1 - u, 2)) + .3 * Math.sin(u * Math.PI) * (1 - u); })(); if (roarK === 0) lit = 1; }
  const fl0 = Math.sin(tm * 8.3) * .5 + Math.sin(tm * 13.7 + 1) * .3 + Math.sin(tm * 3.1) * .2; banners(tm); const bf = lightning(now); g = gb; shafts(tm, bf); fog(dt); runes(tm); webs(tm); shadows(tm, fl0); for (const c of crows) updCrow(c, now, tm);
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
  if (lit > .5 && embers.length < 26 && Math.random() < .5) { const t = T[RI(0, 10)]; embers.push({ x: t.x + R(-2, 2), y: t.y, vy: R(10, 22), vx: R(-3, 3), life: R(.9, 2.2), t: 0, ph: R(0, 6.28) }); }
  for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.t += dt; if (e.t > e.life) { embers.splice(i, 1); continue; } e.y -= e.vy * dt; e.x += (e.vx + Math.sin(e.t * 6 + e.ph) * 4) * dt; const u = e.t / e.life; rect(e.x, e.y, 1, 1, u < .5 ? '#ffd070' : '#ff7a2a', (1 - u) * .9); }
  /* poeira flutuando na luz */
  for (const m of motes) { m.y -= m.v * dt; m.x += Math.sin(tm * .8 + m.ph) * 3 * dt; if (m.y < 50) { m.y = R(300, 360); m.x = R(0, W); } rect(m.x, m.y, 1, 1, '#ffc080', m.a * (.5 + .5 * Math.sin(tm * 2 + m.ph))); }
  /* sombra ambiente que pulsa com o fogo (bordas) */
  g.globalCompositeOperation = 'source-over'; const v = gf.createRadialGradient(W / 2, 150, 70, W / 2, 150, 260); v.addColorStop(0, 'rgba(0,0,10,0)'); v.addColorStop(1, `rgba(0,0,10,${.2 - .05 * fl + (1 - lit) * .35})`); gf.globalAlpha = 1; gf.fillStyle = v; gf.fillRect(0, 0, W, H);
  /* morcegos */
  if (now > nextBat && bats.length < 5) { spawnBat(); nextBat = now + R(2800, 6500); }
  const order = bats.slice().sort((a, b) => a.s0 - b.s0);
  for (const b of order) if (drawBat(b, now, tm)) bats.splice(bats.indexOf(b), 1);
  gb.globalAlpha = 1; gf.globalAlpha = 1;
}
requestAnimationFrame(loop);
window.AMB = { bats, spawnBat, T, bolt: () => bolt(performance.now()), roar, crows };
})();
