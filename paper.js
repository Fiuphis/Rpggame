/* Papiro pixelart (faixa de baixo do jogo): pergaminho gasto, rolos de madeira com pontas douradas, runas e brilho mágico. */
(() => {
const box = document.getElementById('scroll'); if (!box) return;
const S = 3, mk = cls => { const c = document.createElement('canvas'); c.className = cls; return c; };
const art = mk('sc-art'), fx = mk('sc-fx'); box.insertBefore(fx, box.firstChild); box.insertBefore(art, box.firstChild);
const ga = art.getContext('2d'), gf = fx.getContext('2d');
let cw = 0, ch = 0, sparks = [], timer = 0, geo = null;
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const sm = t => t * t * (3 - 2 * t);
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
const fbm = (x, y) => vn(x, y) * .55 + vn(x * 2.1, y * 2.1) * .3 + vn(x * 4.3, y * 4.3) * .15;
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const TONE = ['#efdcaa', '#e0c88f', '#d0b27a', '#bf9a64', '#a98050'];
function draw() {
  const W = box.clientWidth, H = box.clientHeight; if (!W || !H) return; cw = Math.ceil(W / S); ch = Math.ceil(H / S); art.width = fx.width = cw; art.height = fx.height = ch;
  const R = 6, L = 5, rd = rng(91), id = ga.createImageData(cw, ch), d = id.data;
  const put = (x, y, hex) => { if (x < 0 || y < 0 || x >= cw || y >= ch) return; const i = (y * cw + x) * 4, n = parseInt(hex.slice(1), 16); d[i] = n >> 16; d[i + 1] = n >> 8 & 255; d[i + 2] = n & 255; d[i + 3] = 255; };
  const px = (x, y) => { if (x < 0 || y < 0 || x >= cw || y >= ch) return null; const i = (y * cw + x) * 4; return d[i + 3] ? i : null; };
  // fundo escuro atrás do papel
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) put(x, y, '#0b0810');
  const eL = y => L + Math.floor(vn(y * .35, 3) * 3.4), eR = y => L + Math.floor(vn(y * .35, 9) * 3.4);
  for (let y = R; y < ch - R; y++) { const xl = eL(y), xr = cw - 1 - eR(y);
    for (let x = xl; x <= xr; x++) {
      const t = fbm(x * .07, y * .07) * .65 + fbm(x * .28 + 7, y * .28) * .35 + (B4[y & 3][x & 3] / 16 - .5) * .16; let c = TONE[Math.max(0, Math.min(4, Math.floor(t * 5.2 - .5)))];
      const ds = Math.min(x - xl, xr - x), dv = Math.min(y - R, ch - R - 1 - y), n = vn(x * .5, y * .5);
      let wear = Math.max(0, 1 - ds / (7 + n * 5)); wear += Math.max(0, 1 - dv / (3 + n * 3)) * .55;
      if (wear + (B4[y & 3][x & 3] / 16 - .5) * .22 > .98) c = '#2a1a0c'; else if (wear + (B4[x & 3][y & 3] / 16 - .5) * .2 > .72) c = '#5a3a1c'; else if (wear > .5) c = '#7a5630'; else if (wear > .3) c = '#94703f';
      put(x, y, c);
    } }
  // queimaduras nos cantos
  for (const [cx, cy] of [[L, R], [cw - L, R], [L, ch - R], [cw - L, ch - R]]) for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const r = Math.hypot(x, y) + vn((cx + x) * .6, (cy + y) * .6) * 4; if (r < 8 && px(cx + x, cy + y) !== null) put(cx + x, cy + y, r < 4 ? '#2a1a0c' : r < 6 ? '#4a2f17' : '#6a4524'); }
  // dobras verticais
  for (const f of [.27, .52, .78]) { const x0 = Math.floor(cw * f + (rd() - .5) * 8); for (let y = R + 2; y < ch - R - 2; y++) { const x = x0 + Math.round(Math.sin(y * .22 + f * 9) * 1.2); if (px(x, y) !== null) put(x, y, '#b08a54'); if (px(x + 1, y) !== null && y % 2) put(x + 1, y, '#f3e2b0'); } }
  // manchas
  for (let k = 0; k < 7; k++) { const cx = Math.floor(L + 12 + rd() * (cw - 2 * L - 24)), cy = Math.floor(R + 6 + rd() * (ch - 2 * R - 12)), r = 3 + rd() * 6;
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) { const dd = Math.hypot(x, y) * (.8 + vn((cx + x) * .5, (cy + y) * .5) * .5); if (dd < r && dd > r * .62 && px(cx + x, cy + y) !== null) put(cx + x, cy + y, '#bd9d66'); else if (dd <= r * .62 && (x + y & 1) && px(cx + x, cy + y) !== null && r > 6) put(cx + x, cy + y, '#d3b97f'); } }
  for (let k = 0; k < 14; k++) { const x = Math.floor(L + 6 + rd() * (cw - 2 * L - 12)), y = Math.floor(R + 3 + rd() * (ch - 2 * R - 6)); if (px(x, y) !== null) { put(x, y, '#8a6034'); if (rd() < .3) put(x + 1, y, '#a98650'); } }
  // moldura (régua dupla) e ornamentos
  const m = 5, x0 = L + 4 + m, x1 = cw - L - 5 - m, y0 = R + m, y1 = ch - R - 1 - m;
  const line = (xa, ya, xb, yb, c) => { for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) put(x, y, c); };
  if (y1 - y0 > 14) { line(x0 + 3, y0, x1 - 3, y0, '#6a4524'); line(x0 + 3, y1, x1 - 3, y1, '#6a4524'); line(x0, y0 + 3, x0, y1 - 3, '#6a4524'); line(x1, y0 + 3, x1, y1 - 3, '#6a4524');
    line(x0 + 3, y0 + 1, x1 - 3, y0 + 1, '#e6cf98'); line(x0 + 3, y1 - 1, x1 - 3, y1 - 1, '#e6cf98');
    const dia = (cx, cy, c1, c2) => { for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const a = Math.abs(x) + Math.abs(y); if (a <= 3) put(cx + x, cy + y, a === 3 ? '#3a2410' : a === 2 ? c1 : c2); } };
    for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) dia(cx, cy, '#d7a45a', '#f3d58a');
    for (const cx of [Math.floor((x0 + x1) / 2)]) { dia(cx, y0, '#9a6aff', '#d8c0ff'); dia(cx, y1, '#9a6aff', '#d8c0ff'); }
    for (const f of [.22, .78]) for (const cy of [y0, y1]) dia(Math.floor(x0 + (x1 - x0) * f), cy, '#d7a45a', '#f3d58a'); }
  // rolos de madeira com pontas douradas
  const rod = ['#2a1a0c', '#6a4524', '#b5834a', '#e8be72', '#a2733a', '#4a2f17'];
  for (let k = 0; k < R; k++) for (let x = 0; x < cw; x++) { put(x, k, rod[k]); put(x, ch - 1 - k, rod[k]); }
  for (let x = 0; x < cw; x += 7) { put(x, 2, '#c9964f'); put(x, ch - 3, '#c9964f'); }
  const cap = (cx, cy, dir) => { for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const r = Math.hypot(x, y); if (r <= 4.2) put(cx + x, cy + y, r > 3.4 ? '#3a2410' : r > 2.2 ? '#c9964f' : r > 1.1 ? '#f1cf80' : '#fff2c0'); } };
  for (const cy of [2, ch - 3]) { cap(4, cy); cap(cw - 5, cy); }
  for (const cy of [2, ch - 3]) for (let x = Math.floor(cw / 2) - 2; x <= Math.floor(cw / 2) + 2; x++) put(x, cy, '#7a4ad8');
  ga.putImageData(id, 0, 0);
  geo = { x0, x1, y0, y1, gx: Math.floor(cw / 2), top: 2, bot: ch - 3 };
}
const GL = [[1,1,1,0,1,0,1,1,1],[0,1,0,1,1,1,0,1,0],[1,0,1,0,1,0,1,0,1],[1,1,0,0,1,0,0,1,1],[0,1,1,1,0,1,1,1,0]];
function burst(n = 12) { if (!geo) return; for (let i = 0; i < n; i++) sparks.push({ x: geo.x0 + 8 + Math.random() * (geo.x1 - geo.x0 - 16), y: geo.y0 + 3 + Math.random() * (geo.y1 - geo.y0 - 6), vx: (Math.random() - .5) * 8, vy: -4 - Math.random() * 8, life: .7 + Math.random() * .8, t: 0, c: ['#fff2c0', '#ffd870', '#c8a8ff', '#fff'][i % 4] }); }
let last = 0;
function loop(now) {
  timer = requestAnimationFrame(loop); if (document.hidden || !geo || now - last < 100) return; const dt = Math.min(.2, (now - last) / 1000); last = now; const tm = now / 1000;
  gf.clearRect(0, 0, cw, ch); gf.globalCompositeOperation = 'lighter';
  // brilho da gema
  for (const cy of [geo.top, geo.bot]) { const a = .5 + .5 * Math.sin(tm * 2.4 + cy); for (const [r, al] of [[9, .1], [6, .18], [3, .3]]) { gf.globalAlpha = al * a; gf.fillStyle = '#b48aff'; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) gf.fillRect(geo.gx + x, cy + y, 1, 1); } }
  // runas pulsando na moldura
  const rs = [[.12, 0], [.34, 1], [.66, 2], [.88, 3]];
  for (const cy of [geo.y0, geo.y1]) rs.forEach(([f, k], i) => { const x = Math.floor(geo.x0 + (geo.x1 - geo.x0) * f), a = Math.max(0, Math.sin(tm * 1.6 - i * .9 + (cy > geo.y0 ? 1.5 : 0))); gf.globalAlpha = .15 + .75 * a; gf.fillStyle = i % 2 ? '#ffd870' : '#c8a8ff'; GL[(k + (cy > geo.y0 ? 2 : 0)) % 5].forEach((v, q) => { if (v) gf.fillRect(x - 1 + q % 3, cy - 1 + Math.floor(q / 3), 1, 1); }); });
  // faíscas
  if (sparks.length < 18 && Math.random() < .35) burst(1);
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt; if (s.t > s.life) { sparks.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.vy *= .98; const u = s.t / s.life; gf.globalAlpha = Math.sin(u * Math.PI) * .9; gf.fillStyle = s.c; gf.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); if (u < .5 && (Math.round(s.t * 10) & 1)) { gf.globalAlpha *= .5; gf.fillRect(Math.round(s.x) + 1, Math.round(s.y), 1, 1); gf.fillRect(Math.round(s.x) - 1, Math.round(s.y), 1, 1); } }
  gf.globalAlpha = 1; gf.globalCompositeOperation = 'source-over';
}
let rt = 0; const redo = () => { clearTimeout(rt); rt = setTimeout(() => { if (box.clientHeight) { draw(); } }, 80); };
addEventListener('resize', redo); new MutationObserver(redo).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
window.Paper = { draw, burst, redo }; setTimeout(draw, 50); requestAnimationFrame(loop);
})();
