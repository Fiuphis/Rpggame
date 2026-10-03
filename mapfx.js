/* v141: mapa vivo — água com brilho e ondas, barcos, peixes, pedras caindo, criaturas e sereias.
   Tudo desenhado em pixel art num canvas pequeno (204×214, 1 px = 6 px da arte) e só nas áreas de água (map/water.png). */
(() => {
const map = document.getElementById('map');
if (!map || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
const W = 204, H = 214;
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
map.insertBefore(cv, document.getElementById('nodes'));
const g = cv.getContext('2d');
const cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H; cv2.className = 'fx fly'; cv2.setAttribute('aria-hidden', 'true');
const nodesEl = document.getElementById('nodes'); nodesEl.parentNode.insertBefore(cv2, nodesEl.nextSibling);   // acima dos nós e rótulos
const g2 = cv2.getContext('2d');
let ctx = g;
const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), PICK = a => a[RI(0, a.length - 1)];
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const COL = { k:'#0b1424', w:'#e8f4ff', b:'#6fa8d6', B:'#3c6e9c', g:'#2e6b5a', G:'#58b08a', p:'#5a2f7d', P:'#9a63c8', r:'#c0392b', y:'#f2c14e', n:'#6e4325', N:'#b07a45', s:'#f0c8a0', S:'#efe3c2', h:'#2fb3a8', H:'#1a7d77', f:'#37b6c8', e:'#ffe36b', o:'#e8903a' };

let m = null;   // máscara de água
const wat = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[(y | 0) * W + (x | 0)] === 1;
const free = (x, y, r) => wat(x - r, y - r) && wat(x + r, y - r) && wat(x - r, y + r) && wat(x + r, y + r) && wat(x, y);

const px = (x, y, c, a = 1) => { ctx.globalAlpha = a; ctx.fillStyle = COL[c] || c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
const spr = (rows, x, y, flip, a = 1, clipY = null) => {
  if (clipY !== null) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, clipY); ctx.clip(); }
  const w = rows[0].length;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < w; i++) { const ch = rows[j][flip ? w - 1 - i : i]; if (ch !== '.') px(x + i, y + j, ch, a); }
  if (clipY !== null) ctx.restore();
};
const ring = (x, y, r, a) => { if (a <= 0) return; for (let k = 0; k < r * 6; k++) { const t = k / (r * 6) * 6.283; px(x + Math.cos(t) * r, y + Math.sin(t) * r * .38, 'w', a); } };
const drops = (x, y, t, n = 5, a = 1) => { for (let k = 0; k < n; k++) { const ang = -1.2 - k * (1.1 / n) * 1.0, v = 6 + k % 2 * 2; px(x + Math.cos(ang + (k % 2 ? .6 : 0)) * v * t * 1.1, y + Math.sin(ang) * v * t + 14 * t * t, 'w', a * (1 - t)); } };

/* ---------- sprites ---------- */
const BOAT = [
  '.....y.....',
  '.....kSS...',
  '.....kSSSS.',
  '.....kSSSSS',
  '.....kSSSS.',
  '.....kSS...',
  '.....k.....',
  'nnnnnnnnnnn',
  '.nNNNNNNNn.',
  '..nnnnnnn..'];
const FISH = ['.bw.', 'bwwb', '.bb.'];
const ROCK = ['.N.', 'NnN', '.n.'];

/* ---------- efeitos de água (permanentes) ---------- */
let dashes = [], twinkles = [];
const initWater = pts => {
  for (let i = 0; i < 55; i++) { const p = PICK(pts); dashes.push({ x: p.x, y: p.y, l: RI(2, 4), v: R(1, 2.5), ph: R(0, 6.28), s: R(.6, 1.4) }); }
  for (let i = 0; i < 45; i++) { const p = PICK(pts); twinkles.push({ x: p.x, y: p.y, t: R(0, 5), per: R(2.5, 6) }); }
};
const drawWater = (dt, now) => {
  for (const d of dashes) {
    d.x += d.v * dt * wmul(d.x, d.y); d.y += Math.sin(now * .7 + d.ph) * .02;
    if (d.x > W) d.x = -d.l;
    const a = .16 + .16 * Math.sin(now * d.s + d.ph);
    for (let i = 0; i < d.l; i++) if (wat(d.x + i, d.y)) px(d.x + i, d.y, 'b', Math.max(0, a));
  }
  for (const t of twinkles) {
    const ph = ((now + t.t) % t.per) / t.per;
    if (ph < .12) { const a = Math.sin(ph / .12 * Math.PI); px(t.x, t.y, 'w', a * .85); if (a > .6) { px(t.x - 1, t.y, 'w', a * .35); px(t.x + 1, t.y, 'w', a * .35); px(t.x, t.y - 1, 'w', a * .35); } }
  }
};

/* ---------- barcos (permanentes): vagam pelos canais de água ---------- */
let boats = [];
const okBoat = (x, y) => wat(x, y) && wat(x - 4, y) && wat(x + 4, y) && wat(x, y - 1) && wat(x, y + 1);
const initBoats = ptsAll => {
  const starts = ptsAll.filter(p => okBoat(p.x, p.y)).sort(() => Math.random() - .5);
  for (const p of starts) { if (boats.length >= 3) break; if (boats.some(b => Math.hypot(b.x - p.x, b.y - p.y) < 45)) continue;
    boats.push({ x: p.x, y: p.y, ang: Math.random() < .5 ? 0 : Math.PI, v: R(3, 5), ph: R(0, 6), wake: [] }); }
};
const drawBoats = (dt, now) => {
  for (const b of boats) {
    const step = b.v * dt; let moved = false;
    for (const da of [0, .5, -.5, 1, -1, 1.6, -1.6, 2.4, -2.4, Math.PI]) {
      const a = b.ang + da, nx = b.x + Math.cos(a) * (step + 1), ny = b.y + Math.sin(a) * (step + 1) * .7;
      if (okBoat(nx, ny)) { b.ang = a; b.x += Math.cos(a) * step; b.y += Math.sin(a) * step * .7; moved = true; break; }
    }
    if (Math.random() < .015) b.ang += R(-.6, .6);
    b.wake.unshift([b.x, b.y]); if (b.wake.length > 7) b.wake.pop();
    const dir = Math.cos(b.ang) >= 0 ? 1 : -1, by = b.y + Math.sin(now * 1.4 + b.ph) * .8;
    b.wake.forEach((w, i) => { if (i > 1) px(w[0] + 5 - dir * 2, w[1] + 1 + (i % 2), 'w', .55 - i * .07); });
    spr(BOAT, b.x - 5, by - 8, dir < 0);
    for (let i = 0; i < 11; i += 2) px(b.x - 5 + i, b.y + 2 + Math.sin(now * 3 + i) * .5, 'w', .5);
  }
};

/* ---------- eventos aleatórios ---------- */
const ev = [];
const E = {
  fish() { const p = pick(0, 2); if (!p) return; const dir = Math.random() < .5 ? 1 : -1, L = RI(7, 11), top = RI(5, 8);
    return { dur: 1100, draw(t, a) { const x = p.x + dir * L * t, y = p.y - 4 * top * t * (1 - t); spr(FISH, x - 2, y - 1, dir < 0, 1); if (t < .2) ring(p.x, p.y, 2 + t * 14, .6 - t * 3); if (t > .8) { ring(p.x + dir * L, p.y, 2 + (t - .8) * 30, .6 - (t - .8) * 3); } } }; },
  fin() { const p = pick(0, 2); if (!p) return; const dir = Math.random() < .5 ? 1 : -1, L = RI(14, 24); if (!path(p, dir, L, 2)) return;
    return { dur: 6500, draw(t, a) { const env = Math.min(1, t * 5, (1 - t) * 5), x = p.x + dir * L * t, y = p.y; this.pos = { x, y: y - 3 };
      for (let k = 1; k < 9; k++) px(x - dir * k * 2, y + 1 + (k % 2), 'w', env * (.5 - k * .05));
      for (let r = 0; r < 5; r++) for (let c = 0; c <= (r >> 1) + (r > 3 ? 1 : 0); c++) px(x - dir * c, y - 5 + r, c === 0 ? 'b' : 'k', env); } }; },
  serpent() { const p = pick(0, 3); if (!p) return; const dir = Math.random() < .5 ? 1 : -1, L = RI(18, 28); if (!path(p, dir, L, 3)) return;
    return { dur: 9000, draw(t, now) { const env = Math.min(1, t * 6, (1 - t) * 6), hx = p.x + dir * L * t, y = p.y; this.pos = { x: hx, y: y - 4 };
      for (let i = 0; i < 3; i++) { const cx = hx - dir * (i * 9 + 8), h = Math.max(0, 3.6 * (.55 + .45 * Math.sin(now * 3 + i * 1.7))) * env;
        for (let dx = -3; dx <= 3; dx++) { const hh = Math.round(Math.sqrt(Math.max(0, 9 - dx * dx)) * h / 3); for (let k = 0; k < hh; k++) px(cx + dx, y - k, k === hh - 1 ? 'G' : 'g'); } }
      const hh = Math.round(7 * env); for (let k = 0; k < hh; k++) { px(hx, y - k, 'g'); px(hx + dir, y - k, k > hh - 3 ? 'G' : 'g'); }
      if (hh > 4) { px(hx + dir * 2, y - hh + 2, 'g'); px(hx + dir * 2, y - hh + 3, 'g'); px(hx + dir, y - hh + 2, 'e'); px(hx - dir, y - hh - 1, 'r'); px(hx + dir * 2, y - hh, 'G'); } } }; },
  tentacle(at) { const p = at || pick(0, 3); if (!p) return; const n = RI(2, 3);
    const ts = Array.from({ length: n }, (_, j) => ({ bx: p.x + (j - (n - 1) / 2) * 7, j, tip: null, pull: 0, victim: null, dead: false, env: 0 }));
    return { dur: 6000, ts, p, draw(t, now) { const ms = performance.now(), env0 = Math.min(1, t * 4, (1 - t) * 4);
      ring(p.x, p.y, 3 + 9 * t, .5 * Math.sin(t * Math.PI)); ring(p.x, p.y, 2 + 6 * ((t * 1.7) % 1), .3);
      for (const T of ts) { if (T.dead) { T.tip = null; continue; }
        let e = env0; if (T.pull) e = Math.min(e, Math.max(0, 1 - (ms - T.pull) / 1000)); T.env = e;
        const a = ease(e), hgt = Math.round((11 + T.j % 2 * 4) * a), sw = now * 2.2 + T.j * 1.3, bx = T.bx;
        for (let k = 0; k < hgt; k++) { const o = Math.sin(sw + k * .45) * (k * .22), w = k > hgt * .7 ? 2 : 3, x = bx + o;
          for (let c = 0; c < w; c++) px(x + c - 1, p.y - k, c === w - 1 ? 'p' : 'P');
          if (k % 3 === 2 && k < hgt - 2) px(x - 1, p.y - k, 'w', .7); }
        if (hgt > 3) { const o = Math.sin(sw + hgt * .45) * (hgt * .22); px(bx + o, p.y - hgt, 'P'); px(bx + o + 1, p.y - hgt, 'p'); T.tip = { x: bx + o + .5, y: p.y - hgt }; } else T.tip = null;
        if (T.victim && (e < .08 || !T.tip)) { const v = T.victim; T.victim = null; v.dead = true; gulp(bx, p.y); } } } }; },
  eyes() { const p = pick(0, 3); if (!p) return;
    return { dur: 4200, draw(t, now) { this.pos = { x: p.x, y: p.y - 1 }; const env = Math.min(1, t * 6, (1 - t) * 6), blink = (t > .4 && t < .46) || (t > .7 && t < .75);
      ring(p.x, p.y + 3, 2 + env * 5, .35 * env);
      if (!blink) { for (const dx of [-3, 3]) { px(p.x + dx, p.y, 'e', env); px(p.x + dx + 1, p.y, 'e', env); px(p.x + dx, p.y - 1, 'r', env * .8); px(p.x + dx + 1, p.y - 1, 'r', env * .8); } } else { px(p.x - 3, p.y, 'k', env); px(p.x + 3, p.y, 'k', env); } } }; },
  rock() { const c = shore(); if (!c) return; const n = RI(1, 3);
    return { dur: 1500 + n * 700, draw(t, now) { const T = t * (1500 + n * 700);
      for (let i = 0; i < n; i++) { const st = i * 650, u = (T - st) / 620;
        if (u > 0 && u < 1) { const y = c.y0 + (c.y1 - c.y0) * u * u, x = c.x + i - 1; spr(ROCK, x - 1, y - 1, false); if (u < .35) for (let k = 0; k < 3; k++) px(x - 2 + k * 2, c.y0 - 1 - k * .3 - u * 3, 'N', .8 - u * 2); }
        else if (u >= 1 && u < 2.2) { const s = u - 1; ring(c.x + i - 1, c.y1 + 1, 2 + s * 9, .7 - s * .55); if (s < .8) drops(c.x + i - 1, c.y1, s / .8, 5, .9); } } } }; }
};
// pontos de água livres (janela r) e verificação de trajeto
let pts = [], shores = [];
let pickLast = null;
const pick = (r, margin) => { for (let k = 0; k < 14; k++) { const p = PICK(pts); if (free(p.x, p.y, margin || 3) && !ev.some(e => e.p && Math.hypot(e.p.x - p.x, e.p.y - p.y) < 24)) return (pickLast = p); } return null; };
const path = (p, dir, L, r) => { for (let k = 0; k <= L; k += 5) if (!free(p.x + dir * k, p.y, r)) return false; return true; };
const shore = () => PICK(shores);


/* ---------- voadores como agentes (pássaros, morcegos, wyvern): interagem com clima e criaturas ---------- */
COL.c = '#f1ecdc'; COL.d = '#a79f8a'; COL.v = '#b58cff'; COL.V = '#6a3fb0'; COL.R = '#d8483a'; COL.q = '#8e2a2a'; COL.O = '#f0a14a';
const agents = [], groups = [], parts = [], flashes = [];
const ASH = ['#5d5955', '#8c867e', '#c9c3b8', '#e8e2d4'], EMBER = ['O', 'R', 'e', '#ffb04a'], SPLASH = ['w', 'b', '#cfe6ff'];
const dust = (x, y, n, cols, spread = 3, up = 6) => { for (let i = 0; i < n; i++) parts.push({ x: x + R(-spread, spread), y: y + R(-spread, spread), vx: R(-7, 7), vy: R(-up, 2), t: 0, life: R(.7, 1.5), col: PICK(cols) }); };
const tri = (ax, ay, bx, by, cx, cy, c) => {
  const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.ceil(Math.max(ax, bx, cx)), y0 = Math.floor(Math.min(ay, by, cy)), y1 = Math.ceil(Math.max(ay, by, cy));
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (!d) return;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d, l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
    if (l1 >= 0 && l2 >= 0 && l1 + l2 <= 1) px(x, y, c);
  }
};
const mk = (kind, x, y, vx, vy) => { const a = { kind, g: null, x, y, vx, vy, st: 'free', seen: true, panic: 0, burnT: 0, ph: R(0, 6), cool: R(.3, 1), fl: null, holder: null, age: 0, ox: 0, oy: 0, fq: R(8, 13) }; agents.push(a); return a; };
const newGroup = (kind, n, speed, start, d) => {
  const grp = { lx: start.x, ly: start.y, dx: d.dx, dy: d.dy, sp: speed, kind }; groups.push(grp);
  for (let i = 0; i < n; i++) { const a = mk(kind, start.x, start.y, d.dx * speed, d.dy * speed); a.g = grp; a.st = 'form'; a.seen = false;
    if (kind === 'bird') { const k = i === 0 ? 0 : (i + 1) >> 1, side = i === 0 ? 0 : (i % 2 ? 1 : -1); a.ox = -d.dx * k * 6 - d.dy * side * k * 4; a.oy = -d.dy * k * 6 + d.dx * side * k * 4; }
    else if (kind === 'bat') { a.ox = R(-10, 10); a.oy = R(-10, 10); } }
  return grp;
};
const randRoute = () => { const ang = R(0, 6.2832), off = R(-70, 70); return { start: { x: W / 2 - Math.cos(ang) * 150 - Math.sin(ang) * off, y: H / 2 - Math.sin(ang) * 150 + Math.cos(ang) * off }, d: { dx: Math.cos(ang), dy: Math.sin(ang) } }; };
// rota que passa por um alvo (função do tempo) daqui a T segundos, começando fora da tela
const aimed = (speed, at, T0, T1) => { for (let k = 0; k < 90; k++) { const ang = R(0, 6.2832), T = R(T0, T1), tp = at(T); if (!tp || tp.x < 8 || tp.x > W - 8 || tp.y < 8 || tp.y > H - 8) continue;
  const dx = Math.cos(ang), dy = Math.sin(ang), sx = tp.x - dx * speed * T, sy = tp.y - dy * speed * T; if (sx > -18 && sx < W + 18 && sy > -18 && sy < H + 18) continue; return { start: { x: sx, y: sy }, d: { dx, dy } }; } return null; };
const ambush = grp => {   // às vezes um tentáculo sobe no caminho do bando
  const T = R(4, 8), lp = { x: grp.lx + grp.dx * grp.sp * T, y: grp.ly + grp.dy * grp.sp * T }; if (lp.x < 14 || lp.x > W - 14 || lp.y < 14 || lp.y > H - 14) return;
  const c = pts.filter(q => Math.abs(q.x - lp.x) < 10 && q.y > lp.y + 3 && q.y < lp.y + 14 && free(q.x, q.y, 3)); if (!c.length) return; const p = PICK(c);
  setTimeout(() => { const o = E.tentacle(p); if (o) { o.born = performance.now(); o.name = 'tentacle'; o.p = p; ev.push(o); } }, Math.max(0, (T - 1.7) * 1000));
};
const FW = [['birds', 3], ['bats', 2], ['wyvern', 1.6]];
const spawnFly = (force, opts = {}) => {
  if (!force && groups.length >= 3) return null;
  let r0 = Math.random() * FW.reduce((s, w) => s + w[1], 0), name = FW[0][0]; for (const [n, w] of FW) { if ((r0 -= w) <= 0) { name = n; break; } }
  name = force || name; const kind = name === 'birds' ? 'bird' : name === 'bats' ? 'bat' : 'wyv';
  const speed = kind === 'bird' ? R(15, 22) : kind === 'bat' ? R(18, 26) : R(13, 19), n = kind === 'bird' ? RI(5, 9) : kind === 'bat' ? RI(4, 7) : 1;
  let rt = null; const r = Math.random();
  if (!opts.noaim) {
    const wy = agents.find(a => a.kind === 'wyv' && a.st === 'form'), cyc = cells.find(c => c.mood === 'cyclone' && c.cyc && c.k > .5);
    if (kind !== 'wyv') { if (wy && r < .5) rt = aimed(speed, T => ({ x: wy.x + wy.vx * T, y: wy.y + wy.vy * T }), 3, 9); else if (cyc && r < .6) rt = aimed(speed, () => ({ x: cyc.cyc.x, y: cyc.cyc.y }), 4, 10); }
    else { const fb = agents.find(a => (a.kind === 'bird' || a.kind === 'bat') && a.st === 'form'); if (fb && r < .55) rt = aimed(speed, T => ({ x: fb.x + fb.vx * T, y: fb.y + fb.vy * T }), 3, 9); }
  }
  if (!rt) rt = randRoute();
  const grp = newGroup(kind, n, speed, rt.start, rt.d);
  if (kind !== 'wyv' && !opts.noaim && Math.random() < .4) ambush(grp);
  return grp;
};

/* movimento */
const stepAgents = (dt, nowS) => {
  for (const g_ of groups) { g_.lx += g_.dx * g_.sp * dt; g_.ly += g_.dy * g_.sp * dt; }
  for (const a of agents) {
    a.age += dt; a.cool -= dt;
    if (a.st === 'form') { const gp = a.g; let tx = gp.lx + a.ox, ty = gp.ly + a.oy;
      if (a.kind === 'bird') { tx += Math.sin(nowS + a.ph) * .6; ty += Math.cos(nowS * 1.3 + a.ph) * .6; } else if (a.kind === 'bat') { tx += Math.sin(nowS * 2.1 + a.ph) * 7; ty += Math.cos(nowS * 2.7 + a.ph * 2) * 6; } else ty += Math.sin(nowS * 2) * 1.2;
      a.vx = gp.dx * gp.sp; a.vy = gp.dy * gp.sp; a.x = tx; a.y = ty; }
    else if (a.st === 'free') { if (a.panic > 0) { a.panic -= dt; a.vx += R(-40, 40) * dt * 3; a.vy += R(-40, 40) * dt * 3; }
      const sp = Math.hypot(a.vx, a.vy), mx = a.panic > 0 ? 58 : 42; if (sp > mx) { a.vx *= mx / sp; a.vy *= mx / sp; } a.x += a.vx * dt; a.y += a.vy * dt; }
    else if (a.st === 'burn') { a.burnT += dt; a.vy += 38 * dt; a.x += a.vx * dt; a.y += a.vy * dt; if (Math.random() < .8) dust(a.x, a.y, 1, EMBER, 1, 2); if (a.burnT > 1.1) { dust(a.x, a.y, 10, ASH, 2, 4); a.dead = true; } }
    else if (a.st === 'held') { const h = a.holder; if (h && h.tip && h.victim === a) { a.x = h.tip.x + R(-.7, .7); a.y = h.tip.y - 1 + R(-.7, .7); } else { a.st = 'free'; a.holder = null; a.vy = 8; } }
    if (!a.seen && a.x > 0 && a.x < W && a.y > 0 && a.y < H) a.seen = true;
    if ((a.seen && (a.x < -45 || a.x > W + 45 || a.y < -45 || a.y > H + 45)) || a.age > 90) a.dead = true;
  }
};
const toFree = a => { if (a.st === 'form') { a.st = 'free'; a.vx = a.g.dx * a.g.sp; a.vy = a.g.dy * a.g.sp; } };
const scare = (from, who, ms_) => { for (const o of agents) if (o !== who && o.kind === who.kind && (o.st === 'form' || o.st === 'free') && Math.hypot(o.x - from.x, o.y - from.y) < 38) {
  toFree(o); const dx = o.x - from.x, dy = o.y - from.y, d = Math.hypot(dx, dy) || 1; o.vx = dx / d * 40 + o.vx * .3; o.vy = dy / d * 40 + o.vy * .3; o.panic = 2.6; } };
const gulp = (x, y) => { ring(x, y, 3, .8); ring(x, y, 6, .5); dust(x, y - 2, 7, SPLASH, 2, 9); };

/* interações */
const interact = (dt, ms) => {
  // ciclone: puxa e faz girar quem chega perto; quem chega no olho cai na água
  for (const c of cells) if (c.mood === 'cyclone' && c.cyc && c.k > .4) { const cx = c.cyc.cx === undefined ? c.cyc.x : c.cyc.cx, cy = c.cyc.cy === undefined ? c.cyc.y : c.cyc.cy;
    for (const a of agents) { if (a.dead || a.st === 'held' || a.st === 'burn') continue; const dx = cx - a.x, dy = cy - a.y, d = Math.hypot(dx, dy); if (d > 27) continue;
      toFree(a); const w = (a.kind === 'wyv' ? .45 : 1) * (1 - d / 27) * c.k, ux = dx / (d || 1), uy = dy / (d || 1);
      a.vx += (ux * 70 - uy * 60) * w * dt * 2; a.vy += (uy * 70 + ux * 60) * w * dt * 2; a.panic = Math.max(a.panic, .3);
      if (d < 4.5) { gulp(a.x, a.y); a.dead = true; } } }
  // wyvern: queima morcegos e pássaros que passam perto
  for (const w of agents) if (w.kind === 'wyv' && !w.dead && (w.st === 'form' || w.st === 'free')) {
    if (w.fl) { w.fl.t -= dt; if (w.fl.t <= 0 || w.fl.v.dead) w.fl = null; }
    if (w.cool <= 0) { let best = null, bd = 22; for (const v of agents) if ((v.kind === 'bird' || v.kind === 'bat') && (v.st === 'form' || v.st === 'free')) { const d = Math.hypot(v.x - w.x, v.y - w.y); if (d < bd) { bd = d; best = v; } }
      if (best) { toFree(best); best.st = 'burn'; best.burnT = 0; best.vx = w.vx * .4; best.vy = -6; w.fl = { v: best, t: .45 }; w.cool = 1; dust(best.x, best.y, 6, EMBER, 2, 4); scare(best, best, ms); } } }
  // tentáculos: cada um agarra um e arrasta pra água; os outros fogem apavorados
  for (const e of ev) if (e.name === 'tentacle' && e.ts) for (const T of e.ts) { if (T.dead || T.pull || !T.tip || T.env < .5) continue;
    let best = null, bd = 9; for (const v of agents) if ((v.kind === 'bird' || v.kind === 'bat') && (v.st === 'form' || v.st === 'free')) { const d = Math.hypot(v.x - T.tip.x, v.y - T.tip.y); if (d < bd) { bd = d; best = v; } }
    if (best) { toFree(best); best.st = 'held'; best.holder = T; T.victim = best; T.pull = ms; scare(T.tip, best, ms); } }
};
const cleanup = () => { for (let i = agents.length - 1; i >= 0; i--) { const a = agents[i]; if (!a.dead) continue; if (a.holder && a.holder.victim === a) a.holder.victim = null; agents.splice(i, 1); }
  for (let i = groups.length - 1; i >= 0; i--) if (!agents.some(a => a.g === groups[i])) groups.splice(i, 1); };

/* raios: fritam o que estiver no caminho (viram pó no ar) */
const segDist = (x, y, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, l = dx * dx + dy * dy || 1; let t = ((x - x0) * dx + (y - y0) * dy) / l; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)); };
const polyDist = (poly, x, y) => { let m = 1e9; for (let i = 0; i < poly.length - 1; i++) m = Math.min(m, segDist(x, y, poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1])); return m; };
const fry = a => { dust(a.x, a.y, a.kind === 'wyv' ? 44 : 16, ASH, a.kind === 'wyv' ? 6 : 3, 10); flashes.push({ x: a.x, y: a.y, t: 0 }); if (a.holder && a.holder.victim === a) a.holder.victim = null; a.dead = true; };
const strike = poly => {
  for (const a of agents) if (!a.dead && polyDist(poly, a.x, a.y) < (a.kind === 'wyv' ? 9 : 6)) fry(a);
  for (const e of ev) {
    if (e.name === 'tentacle' && e.ts) { for (const T of e.ts) if (!T.dead && T.tip && (polyDist(poly, T.tip.x, T.tip.y) < 7 || polyDist(poly, T.bx, e.p.y - 5) < 6)) { T.dead = true; dust(T.tip.x, T.tip.y, 12, ['P', 'p', 'w', '#c9b6ff'], 3, 6); flashes.push({ x: T.tip.x, y: T.tip.y, t: 0 }); if (T.victim) fry(T.victim); } }
    else if (e.pos && polyDist(poly, e.pos.x, e.pos.y) < 9) { dust(e.pos.x, e.pos.y, 12, ['#9ad7b0', '#2e6b5a', 'w'], 3, 6); flashes.push({ x: e.pos.x, y: e.pos.y, t: 0 }); e.born = -1e9; }
  }
};

/* desenho */
const drawAgent = (a, nowS) => {
  const f = a.vx >= 0 ? 1 : -1, pan = (a.panic > 0 || a.st === 'held') ? 1.8 : 1;
  if (a.kind === 'wyv') { const x = a.x, y = a.y, h = Math.sin(nowS * 6 + a.ph) * 7;
    tri(x + f * 2, y - 1, x - f * 3, y - 1, x - f * 6, y - 1 - h, 'q'); tri(x + f * 2, y - 1, x - f * 3, y - 1, x, y - 1 - h * 1.15, 'q');
    px(x - f * 6, y - 1 - h, 'O'); px(x, y - 1 - h * 1.15, 'O');
    for (let i = 1; i <= 8; i++) { const ty = y + Math.round(Math.sin(nowS * 5 - i * .7) * 1.4); px(x - f * (3 + i), ty, 'R'); if (i < 5) px(x - f * (3 + i), ty + 1, 'O'); }
    px(x - f * 11, y + Math.round(Math.sin(nowS * 5 - 6.3) * 1.4), 'O');
    for (let i = -3; i <= 3; i++) { px(x + f * i, y, 'R'); px(x + f * i, y + 1, i > -3 && i < 3 ? 'O' : 'R'); }
    px(x + f * 4, y - 1, 'R'); px(x + f * 4, y, 'R'); px(x + f * 5, y - 2, 'R'); px(x + f * 6, y - 2, 'R'); px(x + f * 7, y - 2, 'R'); px(x + f * 6, y - 3, 'k'); px(x + f * 5, y - 3, 'R'); px(x + f * 6, y - 1, 'O'); px(x + f * 6, y - 2, 'e');
    if (a.fl) { const mx = x + f * 8, my = y - 2, tx = a.fl.v.x, ty = a.fl.v.y, n = Math.max(1, Math.hypot(tx - mx, ty - my)); for (let s = 0; s <= n; s++) { const t = s / n; px(mx + (tx - mx) * t + R(-1, 1) * t * 1.6, my + (ty - my) * t + R(-1, 1) * t * 1.6, PICK(['O', 'e', 'R']), .95 - t * .3); if (s % 2 === 0) px(mx + (tx - mx) * t + R(-2, 2) * t * 2, my + (ty - my) * t + R(-2, 2) * t * 2, 'O', .6); } }
    return; }
  const up = Math.sin(nowS * (a.kind === 'bat' ? a.fq : 9) * pan + a.ph) > 0, burn = a.st === 'burn';
  const c1 = burn ? PICK(['O', 'R']) : a.kind === 'bird' ? 'c' : 'v', c2 = burn ? 'R' : a.kind === 'bird' ? 'd' : 'V', x = a.x, y = a.y;
  px(x, y, c1); px(x - 1, y + (up ? -1 : 1), c1); px(x + 1, y + (up ? -1 : 1), c1); px(x - 2, y + (up ? -1 : 0), c2); px(x + 2, y + (up ? -1 : 0), c2);
  if (a.kind === 'bat' && !burn) px(x, y - 1, 'R', .8);
  if (burn) { px(x, y - 2, 'e', .9); px(x + R(-1, 1), y - 3, 'O', .7); }
};
const drawFliers = (dt, nowS) => {
  for (const a of agents) if (!a.dead) drawAgent(a, nowS);
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; if (p.t > p.life) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 9 * dt; px(p.x, p.y, p.col, (1 - p.t / p.life) * .95); }
  for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i]; f.t += dt; if (f.t > .3) { flashes.splice(i, 1); continue; } const al = 1 - f.t / .3, r = 1 + Math.round(f.t * 14); for (let q = -r; q <= r; q++) { px(f.x + q, f.y, 'w', al); px(f.x, f.y + q, 'w', al * .8); } }
};

/* ---------- clima por região: calmo / ventando / ondas grandes / tempestade / ciclone (raro), mais nuvens raras ---------- */
const CW = W / 3, CH = H / 2, cellOf = (x, y) => Math.min(2, Math.max(0, Math.floor(x / CW))) + 3 * Math.min(1, Math.max(0, Math.floor(y / CH)));
const MOODS = [['calm', 4], ['windy', 3], ['waves', 2.5], ['storm', 2], ['cyclone', .6]];
const cells = Array.from({ length: 6 }, (_, i) => ({ mood: 'calm', k: 0, state: 'in', until: 0, cx: CW * (i % 3 + .5) + R(-12, 12), cy: CH * (Math.floor(i / 3) + .5) + R(-12, 12), flash: 0, nextFlash: 0, bolt: null, cyc: null, nextWave: 0, born: 0 }));
const MULT = { calm: 0, windy: 2.2, waves: .8, storm: 3, cyclone: 2 };
const wmul = (x, y) => { const c = cells[cellOf(x, y)]; return 1 + MULT[c.mood] * c.k; };
const pickMood = (c, i, now) => {
  const stormN = cells.filter(o => o.mood === 'storm' && o !== c).length, cycN = cells.filter(o => o.mood === 'cyclone' && o !== c).length;
  let opts = MOODS.filter(([n]) => (n !== 'storm' || stormN < 2) && (n !== 'cyclone' || cycN < 1) && n !== c.mood);
  let r = Math.random() * opts.reduce((s, o) => s + o[1], 0), name = opts[0][0];
  for (const [n, w] of opts) { if ((r -= w) <= 0) { name = n; break; } }
  c.cyc = null;
  if (name === 'cyclone') {                              // precisa de um trecho de água largo na região
    for (let k = 0; k < 60 && !c.cyc; k++) { const p = PICK(pts); if (cellOf(p.x, p.y) === i && free(p.x, p.y, 6)) c.cyc = { x: p.x, y: p.y }; }
    if (!c.cyc) name = 'windy';
  }
  c.mood = name; c.state = 'in'; c.born = now;
  c.until = now + (name === 'cyclone' ? R(9000, 14000) : name === 'storm' ? R(14000, 24000) : R(18000, 38000));
  c.nextFlash = now + R(800, 2500); c.nextWave = now + R(500, 2000);
};
const wavesL = [], flecks = [], clouds = [];
const shoresBy = [[], [], [], [], [], []];
const bolt = (x0, y0, x1, y1) => { const pts_ = [[x0, y0]]; let x = x0, y = y0; while (y < y1) { y += RI(3, 6); x += RI(-3, 3) + (x1 - x) * .15; pts_.push([x, Math.min(y, y1)]); } return pts_; };
const drawWeather = (dt, now) => {
  const nowS = now / 1000, ms = performance.now();
  cells.forEach((c, i) => {
    if (c.state === 'in') { c.k = Math.min(1, c.k + dt / 3); if (c.k >= 1) c.state = 'on'; }
    else if (c.state === 'on' && ms > c.until) c.state = 'out';
    else if (c.state === 'out') { c.k = Math.max(0, c.k - dt / 3); if (c.k <= 0) pickMood(c, i, ms); }
    const k = c.k, ix = i % 3, iy = Math.floor(i / 3);
    // vento: flecos brancos rasgando a água
    if ((c.mood === 'windy' || c.mood === 'storm' || c.mood === 'cyclone') && k > .3 && flecks.length < 110 && Math.random() < 1.6 * k) {
      const p = PICK(pts); if (cellOf(p.x, p.y) === i) flecks.push({ x: p.x, y: p.y, l: RI(6, 12), v: R(26, 44) * (c.mood === 'storm' ? 1.4 : 1), life: R(.35, .8), t: 0 });
    }
    // tempestade: escurece, chove, relâmpagos
    if (c.mood === 'storm' && k > 0) {
      const gr = ctx.createRadialGradient(c.cx, c.cy, 4, c.cx, c.cy, 76); gr.addColorStop(0, 'rgba(6,9,26,' + (.5 * k) + ')'); gr.addColorStop(1, 'rgba(6,9,26,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(c.cx - 78, c.cy - 78, 156, 156);
      for (let n = 0; n < 130 * k; n++) { const a = R(0, 6.28), r = Math.sqrt(Math.random()) * 70, x = c.cx + Math.cos(a) * r, y = c.cy + Math.sin(a) * r * .9, al = .85 * (1 - r / 80); px(x, y, '#cfe6ff', al); px(x - 1, y - 2, '#cfe6ff', al * .8); px(x - 2, y - 4, '#9fc4e8', al * .5); }
      if (ms > c.nextFlash && k > .6) { c.flash = 1; c.nextFlash = ms + R(2200, 6000); const cand = []; for (const a of agents) if (!a.dead && Math.hypot(a.x - c.cx, a.y - c.cy) < 66) cand.push({ x: a.x, y: a.y });
        for (const e of ev) { if (e.name === 'tentacle' && e.ts) { for (const T of e.ts) if (!T.dead && T.tip && Math.hypot(T.tip.x - c.cx, T.tip.y - c.cy) < 66) cand.push(T.tip); } else if (e.pos && Math.hypot(e.pos.x - c.cx, e.pos.y - c.cy) < 66) cand.push(e.pos); }
        let t; if (cand.length && Math.random() < .85) { const q = PICK(cand); t = { x: q.x, y: q.y }; } else { const pp = pts.filter(q => Math.hypot(q.x - c.cx, q.y - c.cy) < 45); t = pp.length ? PICK(pp) : PICK(pts); }
        c.bolt = { pts: bolt(t.x + RI(-8, 8), Math.min(c.cy - 52, t.y - 36), t.x, t.y), t: ms, tx: t.x, ty: t.y }; strike(c.bolt.pts); }
      if (c.flash > 0) { const fg = ctx.createRadialGradient(c.cx, c.cy, 2, c.cx, c.cy, 70); fg.addColorStop(0, 'rgba(235,240,255,' + (.7 * c.flash) + ')'); fg.addColorStop(1, 'rgba(235,240,255,0)'); ctx.globalAlpha = 1; ctx.fillStyle = fg; ctx.fillRect(c.cx - 72, c.cy - 72, 144, 144); c.flash = Math.max(0, c.flash - dt * 7); }
      if (c.bolt && ms - c.bolt.t < 220) { const b = c.bolt.pts, vis = ms - c.bolt.t < 70 || Math.floor((ms - c.bolt.t) / 45) % 2 === 0;
        if (vis) { for (let q = 0; q < b.length - 1; q++) { const [x0, y0] = b[q], [x1, y1] = b[q + 1], n = Math.max(1, Math.abs(y1 - y0)); for (let s = 0; s <= n; s++) { const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n; px(x, y, 'w'); px(x + 1, y, 'w'); px(x - 1, y, '#9fb4ff', .6); px(x + 2, y, '#9fb4ff', .35); } } ring(c.bolt.tx, c.bolt.ty, 3 + (ms - c.bolt.t) / 25, .7); } }
    }
    // ciclone: braços em espiral girando sobre a água
    if (c.mood === 'cyclone' && c.cyc && k > 0) {
      const cx = c.cyc.x + Math.sin(nowS * .3) * 2, cy = c.cyc.y; c.cyc.cx = cx; c.cyc.cy = cy; const Rr = 22 * Math.min(1, k * 1.3);
      for (let arm = 0; arm < 3; arm++) for (let r = 1.5; r < Rr; r += .55) { const a = nowS * 3.2 + r * .36 + arm * 2.094, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .5, al = (.95 - r / Rr * .5) * k, cc = r < Rr * .5 ? 'w' : 'b'; px(x, y, cc, al); px(x + 1, y, cc, al * .9); px(x, y + 1, 'B', al * .7); }
      ring(cx, cy, 2 + (nowS * 5 % 5), .5 * k); ring(cx, cy, 8 + (nowS * 4 % 6), .3 * k); for (let q = 0; q < 3; q++) px(cx + R(-8, 8), cy - R(1, 7), 'w', .8 * k);
    }
    // ondas grandes batendo na costa
    const waveEvery = c.mood === 'waves' ? [1100, 2200] : c.mood === 'storm' ? [1500, 3000] : [9000, 16000];
    if (ms > c.nextWave && shoresBy[i].length && wavesL.length < 6) { const s = PICK(shoresBy[i]); wavesL.push({ x: s.x, y1: s.y1, t: ms, w: RI(16, 26) }); c.nextWave = ms + R(waveEvery[0], waveEvery[1]) * (c.state === 'on' ? 1 : 2); }
  });
  for (let i = flecks.length - 1; i >= 0; i--) { const f = flecks[i]; f.t += dt; f.x += f.v * dt; if (f.t > f.life) { flecks.splice(i, 1); continue; } const a = Math.sin(f.t / f.life * Math.PI) * .8; for (let q = 0; q < f.l; q++) if (wat(f.x - q, f.y)) px(f.x - q, f.y, 'w', a * (1 - q / f.l * .6)); }
  for (let i = wavesL.length - 1; i >= 0; i--) { const wv = wavesL[i], u = (ms - wv.t) / 2300; if (u >= 1) { wavesL.splice(i, 1); continue; }
    if (u < .7) { const e = ease(u / .7), y = wv.y1 + 14 * (1 - e), w = wv.w * (.55 + .45 * e);
      for (let dx = -w / 2; dx <= w / 2; dx++) { const arc = Math.round(dx * dx / (w * 1.1)); if (wat(wv.x + dx, y + arc)) { px(wv.x + dx, y + arc, 'w', .9); } } }
    else { const s = (u - .7) / .3; for (let dx = -wv.w / 2; dx <= wv.w / 2; dx++) if (wat(wv.x + dx, wv.y1 + 2)) { px(wv.x + dx, wv.y1 + 2, 'w', (1 - s) * .9);  } } }
};
const drawClouds = (dt, now) => {
  for (let i = clouds.length - 1; i >= 0; i--) { const c = clouds[i]; c.x += c.vx * dt; c.y += c.vy * dt; if (c.x > W + 40 || c.x < -50 || c.y > H + 30 || c.y < -30) { clouds.splice(i, 1); continue; }
    for (const [ctxx, off, col, al] of [[g, 8, 'rgba(0,0,12,1)', .13], [g2, 0, 'rgba(236,241,255,1)', .3]]) { ctx = ctxx; ctx.globalAlpha = al; ctx.fillStyle = col;
      for (const b of c.blobs) for (let dy = -b.r; dy <= b.r; dy++) { const hw = Math.round(Math.sqrt(b.r * b.r - dy * dy) * 1.45); ctx.fillRect(Math.round(c.x + b.x - hw), Math.round(c.y + b.y + dy + off), hw * 2, 1); } } }
  ctx = g;
};
let nextCloud = 0;
const spawnCloud = () => { const ang = R(-.5, .5) + (Math.random() < .25 ? Math.PI : 0), sp = R(2.5, 5), nb = RI(6, 9), blobs = Array.from({ length: nb }, (_, i) => { const m = Math.sin((i + .5) / nb * Math.PI); return { x: i * 3.4 + R(-1.5, 1.5), y: R(-2, 2) - m * 2, r: Math.max(2, Math.round(2 + m * 4 + R(0, 1.5))) }; });
  const sx = Math.cos(ang) > 0 ? -35 : W + 15; clouds.push({ x: sx, y: R(20, H - 20), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * .6, blobs }); };

const WEIGHTS = [['rock', 2.5], ['fin', 2], ['eyes', 1.5], ['tentacle', 1.5], ['serpent', 1]];
const spawn = force => {
  if (!force && ev.length >= 3) return;
  let tot = WEIGHTS.reduce((s, w) => s + w[1], 0), r = Math.random() * tot, name = WEIGHTS[0][0];
  for (const [n, w] of WEIGHTS) { if ((r -= w) <= 0) { name = n; break; } }
  if (force) name = force;
  const fn = E[name]; let o = null;
  for (let k = 0; k < 6 && !o; k++) { pickLast = null; o = fn(); }
  if (o) { o.born = performance.now(); o.name = name; o.p = pickLast; ev.push(o); }
};

/* ---------- laço ---------- */
let last = 0, acc = 0, nextSpawn = 0, nextFly = 0, run = false;
const frame = now => {
  if (!run) return; requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  const dt = Math.min(.1, (now - last) / 1000); acc += now - last; last = now;
  if (acc < 50) return; acc = 0;                       // ~20 quadros/s
  g.clearRect(0, 0, W, H); g.globalAlpha = 1; g2.clearRect(0, 0, W, H); ctx = g;
  const s = now / 1000;
  drawWater(.05, s); drawWeather(.05, s);
  for (let i = ev.length - 1; i >= 0; i--) { const e = ev[i], t = (now - e.born) / e.dur; if (t >= 1) { ev.splice(i, 1); continue; } e.draw(t, s); }
  drawClouds(.05, s);
  stepAgents(.05, s); interact(.05, now); cleanup();
  ctx = g2; drawFliers(.05, s);
  ctx = g; g.globalAlpha = 1; g2.globalAlpha = 1;
  if (now > nextCloud) { if (!clouds.length) spawnCloud(); nextCloud = now + R(22000, 45000); }
  if (now > nextFly) { spawnFly(); nextFly = now + R(5000, 11000); }
  if (now > nextSpawn) { spawn(); nextSpawn = now + R(1800, 4200); }
};

/* ---------- inicialização: lê a máscara ---------- */
const img = new Image(); img.src = 'map/water.png';
img.onload = () => {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data; m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) m[i] = d[i * 4] > 128 ? 1 : 0;
  for (let y = 3; y < H - 3; y++) for (let xx = 3; xx < W - 3; xx++) if (free(xx, y, 2)) pts.push({ x: xx, y });
  // costas: terra em cima e pelo menos 9 px de terra acima, água logo abaixo (pedras caem de falésias no mar)
  for (let y = 8; y < H - 4; y++) for (let xx = 4; xx < W - 4; xx++) {
    if (wat(xx, y + 1) && wat(xx, y + 2) && !wat(xx, y) && !wat(xx, y - 3) && !wat(xx, y - 6) && wat(xx - 1, y + 2) && wat(xx + 1, y + 2)) shores.push({ x: xx, y0: y - 6, y1: y + 1 });
  }
  if (!pts.length) return;
  initWater(pts);
  run = true; last = performance.now(); nextSpawn = last + 900; nextFly = last + 2500; nextCloud = last + 6000; for (const s of shores) shoresBy[cellOf(s.x, s.y1)].push(s);
  cells.forEach(c => { c.mood = PICK(['calm', 'calm', 'windy', 'waves']); c.state = 'on'; c.k = 1; c.until = performance.now() + R(5000, 22000); }); requestAnimationFrame(frame);
  window.MAPFX = { ptsArr: pts, E, ev, spawn, spawnFly, agents, groups, mk, strike, interact, parts, cells, wavesL, clouds, spawnCloud, pickMood, ev, pts: pts.length, shores: shores.length, boats: 0 };
};
})();
