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
    return { dur: 6500, draw(t, a) { const env = Math.min(1, t * 5, (1 - t) * 5), x = p.x + dir * L * t, y = p.y;
      for (let k = 1; k < 9; k++) px(x - dir * k * 2, y + 1 + (k % 2), 'w', env * (.5 - k * .05));
      for (let r = 0; r < 5; r++) for (let c = 0; c <= (r >> 1) + (r > 3 ? 1 : 0); c++) px(x - dir * c, y - 5 + r, c === 0 ? 'b' : 'k', env); } }; },
  serpent() { const p = pick(0, 3); if (!p) return; const dir = Math.random() < .5 ? 1 : -1, L = RI(18, 28); if (!path(p, dir, L, 3)) return;
    return { dur: 9000, draw(t, now) { const env = Math.min(1, t * 6, (1 - t) * 6), hx = p.x + dir * L * t, y = p.y;
      for (let i = 0; i < 3; i++) { const cx = hx - dir * (i * 9 + 8), h = Math.max(0, 3.6 * (.55 + .45 * Math.sin(now * 3 + i * 1.7))) * env;
        for (let dx = -3; dx <= 3; dx++) { const hh = Math.round(Math.sqrt(Math.max(0, 9 - dx * dx)) * h / 3); for (let k = 0; k < hh; k++) px(cx + dx, y - k, k === hh - 1 ? 'G' : 'g'); } }
      const hh = Math.round(7 * env); for (let k = 0; k < hh; k++) { px(hx, y - k, 'g'); px(hx + dir, y - k, k > hh - 3 ? 'G' : 'g'); }
      if (hh > 4) { px(hx + dir * 2, y - hh + 2, 'g'); px(hx + dir * 2, y - hh + 3, 'g'); px(hx + dir, y - hh + 2, 'e'); px(hx - dir, y - hh - 1, 'r'); px(hx + dir * 2, y - hh, 'G'); } } }; },
  tentacle() { const p = pick(0, 3); if (!p) return; const n = RI(2, 3);
    return { dur: 6000, draw(t, now) { const env = Math.min(1, t * 4, (1 - t) * 4), a = ease(env);
      ring(p.x, p.y, 3 + 9 * t, .5 * Math.sin(t * Math.PI)); ring(p.x, p.y, 2 + 6 * ((t * 1.7) % 1), .3);
      for (let j = 0; j < n; j++) { const bx = p.x + (j - (n - 1) / 2) * 7, hgt = Math.round((11 + j % 2 * 4) * a), sw = now * 2.2 + j * 1.3;
        for (let k = 0; k < hgt; k++) { const o = Math.sin(sw + k * .45) * (k * .22), w = k > hgt * .7 ? 2 : 3, x = bx + o;
          for (let c = 0; c < w; c++) px(x + c - 1, p.y - k, c === w - 1 ? 'p' : 'P');
          if (k % 3 === 2 && k < hgt - 2) px(x - 1 + 0, p.y - k, 'w', .7); }
        if (hgt > 3) { const o = Math.sin(sw + hgt * .45) * (hgt * .22); px(bx + o, p.y - hgt, 'P'); px(bx + o + 1, p.y - hgt, 'p'); } } } }; },
  eyes() { const p = pick(0, 3); if (!p) return;
    return { dur: 4200, draw(t, now) { const env = Math.min(1, t * 6, (1 - t) * 6), blink = (t > .4 && t < .46) || (t > .7 && t < .75);
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


/* ---------- voadores: bandos de pássaros, morcegos e wyverns cruzando o mapa em direções aleatórias ---------- */
COL.c = '#f1ecdc'; COL.d = '#a79f8a'; COL.v = '#b58cff'; COL.V = '#6a3fb0'; COL.R = '#d8483a'; COL.q = '#8e2a2a'; COL.O = '#f0a14a';
const fl = [];
const route = (speed, jitter = 70) => {          // reta de uma borda a outra, em direção aleatória
  const ang = R(0, 6.2832), dx = Math.cos(ang), dy = Math.sin(ang), off = R(-jitter, jitter), R0 = 150;
  const sx = W / 2 - dx * R0 - dy * off, sy = H / 2 - dy * R0 + dx * off;
  return { dx, dy, sx, sy, dur: (2 * R0) / speed * 1000 };
};
const tri = (ax, ay, bx, by, cx, cy, c) => {
  const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.ceil(Math.max(ax, bx, cx)), y0 = Math.floor(Math.min(ay, by, cy)), y1 = Math.ceil(Math.max(ay, by, cy));
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (!d) return;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d, l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
    if (l1 >= 0 && l2 >= 0 && l1 + l2 <= 1) px(x, y, c);
  }
};
const F = {
  birds() { const n = RI(5, 9), sp = R(15, 22), r = route(sp), ph = R(0, 6);
    return { dur: r.dur, draw(t, now) { const bx = r.sx + r.dx * 2 * 150 * t, by = r.sy + r.dy * 2 * 150 * t, px_ = -r.dy, py_ = r.dx;
      for (let i = 0; i < n; i++) { const k = i === 0 ? 0 : (i + 1) >> 1, side = i === 0 ? 0 : (i % 2 ? 1 : -1);   // formação em V
        const x = bx - r.dx * k * 6 + px_ * side * k * 4 + Math.sin(now + i) * .6, y = by - r.dy * k * 6 + py_ * side * k * 4 + Math.cos(now * 1.3 + i) * .6;
        const up = Math.sin(now * 9 + ph + i * .7) > 0; px(x, y, 'c'); px(x - 1, y + (up ? -1 : 1), 'c'); px(x + 1, y + (up ? -1 : 1), 'c'); px(x - 2, y + (up ? -1 : 0), 'd'); px(x + 2, y + (up ? -1 : 0), 'd'); } } }; },
  bats() { const n = RI(4, 7), sp = R(18, 26), r = route(sp, 60), bats = Array.from({ length: n }, () => ({ o: R(0, 6), ox: R(-10, 10), oy: R(-10, 10), f: R(8, 13) }));
    return { dur: r.dur, draw(t, now) { const bx = r.sx + r.dx * 2 * 150 * t, by = r.sy + r.dy * 2 * 150 * t;
      for (const b of bats) { const x = bx + b.ox + Math.sin(now * 2.1 + b.o) * 7, y = by + b.oy + Math.cos(now * 2.7 + b.o * 2) * 6, up = Math.sin(now * b.f + b.o) > 0;
        px(x, y, 'v'); px(x - 1, y + (up ? -1 : 1), 'V'); px(x + 1, y + (up ? -1 : 1), 'V'); px(x - 2, y + (up ? -1 : 0), 'V'); px(x + 2, y + (up ? -1 : 0), 'V'); px(x, y - 1, 'R', .8); } } }; },
  wyvern() { const sp = R(13, 19), r = route(sp, 50), f = r.dx >= 0 ? 1 : -1, ph = R(0, 6);
    return { dur: r.dur, draw(t, now) { const x = r.sx + r.dx * 2 * 150 * t, y = r.sy + r.dy * 2 * 150 * t + Math.sin(now * 2) * 1.2, a = Math.sin(now * 6 + ph), h = a * 7;
      // asa (atrás do corpo), cauda ondulando, corpo, pescoço e cabeça
      tri(x + f * 2, y - 1, x - f * 3, y - 1, x - f * 3 - f * 3, y - 1 - h, 'q'); tri(x + f * 2, y - 1, x - f * 3, y - 1, x + f * 0, y - 1 - h * 1.15, 'q');
      px(x - f * 3, y - 1 - h, 'O'); px(x, y - 1 - h * 1.15, 'O');
      for (let i = 1; i <= 8; i++) { const ty = y + Math.round(Math.sin(now * 5 - i * .7) * 1.4); px(x - f * (3 + i), ty, 'R'); if (i < 5) px(x - f * (3 + i), ty + 1, 'O'); }
      px(x - f * 11, y + Math.round(Math.sin(now * 5 - 6.3) * 1.4), 'O');
      for (let i = -3; i <= 3; i++) { px(x + f * i, y, 'R'); px(x + f * i, y + 1, i > -3 && i < 3 ? 'O' : 'R'); }
      px(x + f * 4, y - 1, 'R'); px(x + f * 4, y, 'R'); px(x + f * 5, y - 2, 'R'); px(x + f * 6, y - 2, 'R'); px(x + f * 7, y - 2, 'R'); px(x + f * 6, y - 3, 'k'); px(x + f * 5, y - 3, 'R'); px(x + f * 6, y - 1, 'O'); px(x + f * 6, y - 2, 'e'); } }; }
};
const FW = [['birds', 3], ['bats', 2], ['wyvern', 1.6]];
const spawnFly = force => {
  if (!force && fl.length >= 2) return;
  let r = Math.random() * FW.reduce((s, w) => s + w[1], 0), name = FW[0][0];
  for (const [n, w] of FW) { if ((r -= w) <= 0) { name = n; break; } }
  const o = F[force || name](); o.born = performance.now(); o.name = force || name; fl.push(o);
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
      if (ms > c.nextFlash && k > .6) { c.flash = 1; c.nextFlash = ms + R(2200, 6000); const tp = PICK(pts); const pp = pts.filter(q => Math.hypot(q.x - c.cx, q.y - c.cy) < 45); const t = pp.length ? PICK(pp) : tp; c.bolt = { pts: bolt(t.x + RI(-10, 10), c.cy - 52, t.x, t.y), t: ms, tx: t.x, ty: t.y }; }
      if (c.flash > 0) { const fg = ctx.createRadialGradient(c.cx, c.cy, 2, c.cx, c.cy, 70); fg.addColorStop(0, 'rgba(235,240,255,' + (.7 * c.flash) + ')'); fg.addColorStop(1, 'rgba(235,240,255,0)'); ctx.globalAlpha = 1; ctx.fillStyle = fg; ctx.fillRect(c.cx - 72, c.cy - 72, 144, 144); c.flash = Math.max(0, c.flash - dt * 7); }
      if (c.bolt && ms - c.bolt.t < 220) { const b = c.bolt.pts, vis = ms - c.bolt.t < 70 || Math.floor((ms - c.bolt.t) / 45) % 2 === 0;
        if (vis) { for (let q = 0; q < b.length - 1; q++) { const [x0, y0] = b[q], [x1, y1] = b[q + 1], n = Math.max(1, Math.abs(y1 - y0)); for (let s = 0; s <= n; s++) { const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n; px(x, y, 'w'); px(x + 1, y, 'w'); px(x - 1, y, '#9fb4ff', .6); px(x + 2, y, '#9fb4ff', .35); } } ring(c.bolt.tx, c.bolt.ty, 3 + (ms - c.bolt.t) / 25, .7); } }
    }
    // ciclone: braços em espiral girando sobre a água
    if (c.mood === 'cyclone' && c.cyc && k > 0) {
      c.cyc.x += wmul(c.cyc.x, c.cyc.y) * .0; const cx = c.cyc.x + Math.sin(nowS * .3) * 2, cy = c.cyc.y, Rr = 22 * Math.min(1, k * 1.3);
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
      for (let dx = -w / 2; dx <= w / 2; dx++) { const arc = Math.round(dx * dx / (w * 1.1)); if (wat(wv.x + dx, y + arc)) { px(wv.x + dx, y + arc - 1, 'w', .95); px(wv.x + dx, y + arc, 'w', .9); px(wv.x + dx, y + arc + 1, 'b', .75); px(wv.x + dx, y + arc + 2, 'B', .55); } } }
    else { const s = (u - .7) / .3; drops(wv.x - 5, wv.y1 + 1, s, 8, 1); drops(wv.x, wv.y1 + 1, s, 8, 1); drops(wv.x + 5, wv.y1 + 1, s, 8, 1); for (let dx = -wv.w / 2; dx <= wv.w / 2; dx++) if (wat(wv.x + dx, wv.y1 + 2)) { px(wv.x + dx, wv.y1 + 2, 'w', (1 - s) * .9); px(wv.x + dx, wv.y1 + 3, 'w', (1 - s) * .5); } } }
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

const WEIGHTS = [['fish', 3], ['rock', 2.5], ['fin', 2], ['eyes', 1.5], ['tentacle', 1.5], ['serpent', 1]];
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
  ctx = g2; for (let i = fl.length - 1; i >= 0; i--) { const e = fl[i], t = (now - e.born) / e.dur; if (t >= 1) { fl.splice(i, 1); continue; } e.draw(t, s); }
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
  window.MAPFX = { spawn, spawnFly, fl, cells, wavesL, clouds, spawnCloud, pickMood, ev, pts: pts.length, shores: shores.length, boats: 0 };
};
})();
