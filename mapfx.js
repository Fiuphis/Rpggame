/* v141: mapa vivo — água com brilho e ondas, barcos, peixes, pedras caindo, criaturas e sereias.
   Tudo desenhado em pixel art num canvas pequeno (204×214, 1 px = 6 px da arte) e só nas áreas de água (map/water.png). */
(() => {
const map = document.getElementById('map');
if (!map || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
const W = 204, H = 214;
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
map.insertBefore(cv, document.getElementById('nodes'));
const g = cv.getContext('2d');
const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), PICK = a => a[RI(0, a.length - 1)];
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const COL = { k:'#0b1424', w:'#e8f4ff', b:'#6fa8d6', B:'#3c6e9c', g:'#2e6b5a', G:'#58b08a', p:'#5a2f7d', P:'#9a63c8', r:'#c0392b', y:'#f2c14e', n:'#6e4325', N:'#b07a45', s:'#f0c8a0', S:'#efe3c2', h:'#2fb3a8', H:'#1a7d77', f:'#37b6c8', e:'#ffe36b', o:'#e8903a' };

let m = null;   // máscara de água
const wat = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[(y | 0) * W + (x | 0)] === 1;
const free = (x, y, r) => wat(x - r, y - r) && wat(x + r, y - r) && wat(x - r, y + r) && wat(x + r, y + r) && wat(x, y);

const px = (x, y, c, a = 1) => { g.globalAlpha = a; g.fillStyle = COL[c] || c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
const spr = (rows, x, y, flip, a = 1, clipY = null) => {
  if (clipY !== null) { g.save(); g.beginPath(); g.rect(0, 0, W, clipY); g.clip(); }
  const w = rows[0].length;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < w; i++) { const ch = rows[j][flip ? w - 1 - i : i]; if (ch !== '.') px(x + i, y + j, ch, a); }
  if (clipY !== null) g.restore();
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
const MERMAID = [   // cabeça e ombros; água corta na linha 8
  '..hhhhh..',
  '.hhhhhhH.',
  '.hhsssHH.',
  '.hHskskH.',
  '.hHssssH.',
  'hH.sssH.H',
  'hH.ssss.H',
  'h.ssssss.',
  '..ssssss.'];
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
    d.x += d.v * dt; d.y += Math.sin(now * .7 + d.ph) * .02;
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
  mermaid() { const p = pick(0, 3); if (!p) return; const flip = Math.random() < .5;
    return { dur: 7000, draw(t, now) {
      const yw = p.y + 3;                                  // linha d'água
      const up = t < .12 ? ease(t / .12) : t < .78 ? 1 : t < .88 ? 1 - ease((t - .78) / .1) : 0;
      if (up > 0) { const by = yw - 8 + (1 - up) * 10 + Math.sin(now * 2.2) * .6;
        spr(MERMAID, p.x - 4, by, flip, 1, yw);
        if (t > .18 && t < .72) { const wv = Math.sin(now * 7) > 0 ? 0 : 1, hx = p.x + (flip ? -6 : 6) - (flip ? 1 : 0); px(hx, by + 1 - wv, 's'); px(hx, by + 2 - wv, 's'); px(hx + (flip ? -1 : 1), by - wv, 's'); }
        ring(p.x, yw, 5 + 3 * Math.sin(now * 2), .45 * up); }
      if (t > .86) { const u = (t - .86) / .14, ty = yw - 7 * Math.sin(u * Math.PI) + 2;     // cauda no mergulho
        for (let k = 0; k < 4; k++) px(p.x + (flip ? 1 : -1) * k * .8, ty + k * .3 - 3, 'f'); px(p.x - 3, ty - 4, 'f'); px(p.x + 3, ty - 4, 'f'); px(p.x - 2, ty - 5, 'f'); px(p.x + 2, ty - 5, 'f'); px(p.x, ty - 3, 'B');
        drops(p.x, yw - 2, u, 6, .9); ring(p.x, yw, 2 + u * 10, .6 * (1 - u)); } } }; },
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

const WEIGHTS = [['fish', 3], ['rock', 2.5], ['fin', 2], ['eyes', 1.5], ['tentacle', 1.5], ['serpent', 1], ['mermaid', 1.2]];
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
let last = 0, acc = 0, nextSpawn = 0, run = false;
const frame = now => {
  if (!run) return; requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  const dt = Math.min(.1, (now - last) / 1000); acc += now - last; last = now;
  if (acc < 50) return; acc = 0;                       // ~20 quadros/s
  g.clearRect(0, 0, W, H); g.globalAlpha = 1;
  const s = now / 1000;
  drawWater(.05, s); drawBoats(.05, s);
  for (let i = ev.length - 1; i >= 0; i--) { const e = ev[i], t = (now - e.born) / e.dur; if (t >= 1) { ev.splice(i, 1); continue; } e.draw(t, s); }
  g.globalAlpha = 1;
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
  initWater(pts); initBoats(pts);
  run = true; last = performance.now(); nextSpawn = last + 900; requestAnimationFrame(frame);
  window.MAPFX = { spawn, ev, pts: pts.length, shores: shores.length, boats: boats.length };
};
})();
