/* Banco de Dados I — RPG · js/core/pxfx.js: motor de efeitos em pixel art (camada própria, coordenadas do mundo 1024x1536, pixels de 4 px sem suavização).
   Fogo e derivados: autômato celular no estilo "fogo do DOOM" (cada célula herda o calor da de baixo com decaimento e vento aleatórios) + paleta de 36 tons.
   Trocando a paleta o mesmo motor vira fogo sagrado (gold), chama de cura (heal), fogo de gelo (frost), fogo sombrio (dark), poeira (dust) e jato d'água (water).
   Também: respingos e anéis de água, espirais de vento, detritos de terra, raio em zigue-zague e estrelas de cura. Tudo em quadrados de 4 px.
   API: PXFX.init(el, feetFn) · fire/heal/frost/dark/dust/water(x, y, o) · burn(chave, on, o) · splash · ripple · wind · debris · bolt · sparks · clear
   Posições em coordenadas do mundo (as mesmas dos rigs). o.w/o.h = tamanho em px, o.dur = ms, o.cell = tamanho do pixel (padrão 4). */
(() => {
'use strict';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const eo = u => 1 - Math.pow(1 - u, 3), seg = (u, a, b) => clamp((u - a) / (b - a));
const clk = () => performance.now() * (window.__ts == null ? 1 : window.__ts);
const Q = 4, q = v => Math.round(v / Q) * Q;

// ---- paletas de 36 tons: [índice, r, g, b, alpha] interpolados ----
const KEYS = {
  fire:  [[0,0,0,0,0],[1,40,4,6,.35],[5,96,10,10,.75],[9,160,18,10,.95],[14,214,42,10,1],[19,244,88,14,1],[24,255,138,24,1],[28,255,186,48,1],[31,255,222,100,1],[34,255,244,170,1],[35,255,253,232,1]],
  gold:  [[0,0,0,0,0],[1,50,30,4,.35],[6,110,70,6,.75],[12,190,130,16,.95],[18,235,180,40,1],[24,255,215,90,1],[29,255,236,150,1],[33,255,248,205,1],[35,255,255,240,1]],
  heal:  [[0,0,0,0,0],[1,6,40,24,.35],[6,10,90,50,.75],[12,24,160,80,.95],[18,70,215,120,1],[24,140,245,160,1],[29,200,255,200,1],[35,245,255,240,1]],
  frost: [[0,0,0,0,0],[1,8,20,50,.35],[6,20,60,130,.75],[12,50,120,200,.95],[18,110,185,240,1],[24,170,220,255,1],[29,215,240,255,1],[35,250,254,255,1]],
  dark:  [[0,0,0,0,0],[1,20,4,30,.4],[6,56,10,80,.8],[12,100,20,140,.95],[18,150,40,190,1],[24,200,80,220,1],[29,235,150,245,1],[35,255,235,255,1]],
  dust:  [[0,0,0,0,0],[1,70,52,34,.2],[8,110,84,54,.38],[16,150,118,78,.5],[24,185,150,105,.55],[35,215,185,140,.5]],
  water: [[0,0,0,0,0],[1,10,40,90,.3],[8,30,100,180,.7],[16,70,160,235,.9],[24,150,215,250,1],[35,240,252,255,1]],
  wind:  [[0,0,0,0,0],[1,120,150,140,.15],[10,170,210,195,.3],[20,205,240,225,.45],[35,245,255,250,.6]],
};
const PAL = {}; Object.keys(KEYS).forEach(n => { const K = KEYS[n], out = [];
  for (let i = 0; i < 36; i++) { let k = 0; while (k < K.length - 2 && K[k + 1][0] < i) k++; const a = K[k], c = K[k + 1], u = clamp((i - a[0]) / (c[0] - a[0] || 1)); out.push([0, 1, 2, 3].map(j => Math.round(lerp(a[j + 1], c[j + 1], u)))); }
  PAL[n] = out; });
const solid = (pal, i) => { const c = PAL[pal][clamp(Math.round(i), 0, 35)]; return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(3)})`; };

// ---- simulação ----
function makeSim(cols, rows, pal){ const cv = document.createElement('canvas'); cv.width = cols; cv.height = rows; const cx = cv.getContext('2d'); const vmax = Math.min(35, Math.round(rows * .95 * .55)); return {cols, rows, pal, vmax, buf:new Uint8Array(cols * rows), cv, cx, img:cx.createImageData(cols, rows), acc:0, last:null, dec:vmax / (rows * .95)}; }   // vmax: chamas curtas usam menos níveis (mapeados para a paleta inteira)
function sweep(s, src, wind = 0){
  const {cols, rows, buf} = s, top = rows * .4;
  for (let x = 0; x < cols; x++) buf[(rows - 1) * cols + x] = Math.max(0, Math.min(s.vmax, Math.round((src(x) + (Math.random() - .5) * 5) * s.vmax / 35)));
  for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols; x++) { const v = buf[(y + 1) * cols + x], r = (Math.random() * 3) | 0, nx = x - r + 1 + wind;
    if (nx < 0 || nx >= cols) { buf[y * cols + x] = 0; continue; } const dec = Math.random() < s.dec + (y < top ? .22 * (1 - y / top) : 0) ? 1 : 0; buf[y * cols + nx] = v > dec ? v - dec : 0; }
}
function stepSim(s, now, src, wind, per = 3){
  if (s.last == null) { s.last = now; const w = Math.round(s.rows * .8); for (let i = 0; i < w; i++) sweep(s, x => src(x) * .85, wind); }   // pré-aquece: a chama já nasce com altura
  s.acc += now - s.last; s.last = now; while (s.acc >= 40) { s.acc -= 40; for (let i = 0; i < per; i++) sweep(s, src, wind); }
}
function drawSim(g, s, x, y, cell, alpha = 1){
  const {cols, rows, buf, cx, img} = s, d = img.data, P = PAL[s.pal];
  for (let i = 0; i < cols * rows; i++) { let v = buf[i]; if (v > 2 && Math.random() < .12) v = clamp(v + (Math.random() < .5 ? -1 : 1), 0, s.vmax); const c = P[Math.min(35, Math.round(v * 35 / s.vmax))]; d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = Math.round(c[3] * 255); }
  cx.putImageData(img, 0, 0); g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha; g.drawImage(s.cv, Math.round(x - cols * cell / 2), Math.round(y - rows * cell), cols * cell, rows * cell); g.restore();
}

// ---- gerenciador ----
let cv = null, g = null, list = [], running = false, feetOf = () => null, burns = {};
const add = (d, draw, delay = 0) => { const e = {t0:clk() + delay, d, draw, dead:false}; list.push(e); start(); return e; };
function frame(){
  if (!running) return; const now = clk(); g.clearRect(0, 0, cv.width, cv.height);
  const cur = list; list = []; const keep = cur.filter(e => { if (e.dead) return false; const u = e.d === Infinity ? 0 : (now - e.t0) / e.d; if (now < e.t0) return true; if (u >= 1) return false; e.draw(g, u, now); return true; });
  list = keep.concat(list);   // efeitos criados durante o desenho (later) entram sem se perder
  if (!list.length) { running = false; return; } requestAnimationFrame(frame);
}
const later = (delay, fn) => { const e = add(1e9, () => { if (!e.fired) { e.fired = true; e.dead = true; fn(); } }, delay); return e; };   // executa fn depois de delay ms (tempo do jogo)
function start(){ if (!running && cv) { running = true; requestAnimationFrame(frame); } }

// fogo (e derivados pela paleta): monte de chamas com línguas que oscilam
function flames(pal, x, y, o = {}){
  if (!cv) return null; const cell = o.cell || Q, w = o.w || 260, h = o.h || 200, cols = Math.max(6, Math.round(w / cell)), rows = Math.max(8, Math.round(h / cell)), sim = makeSim(cols, rows, pal), dur = o.dur == null ? 1500 : o.dur;
  const peaks = [rnd(0, 6), rnd(0, 6)], cf = Array.from({length:Math.ceil(cols / 3)}, () => Math.random()), col = o.col, inten = o.i == null ? 1 : o.i, wind = o.wind || 0, grow = o.grow == null ? .22 : o.grow, hold = o.hold == null ? .5 : o.hold;
  const pos = typeof x === 'function' ? x : () => ({x, y});
  const e = add(dur, (g2, u, now) => {
    const p = pos(); if (!p) return;
    const env = dur === Infinity ? (o.live ? o.live() : 1) : (.75 + .25 * eo(seg(u, 0, grow))) * (1 - Math.pow(seg(u, hold, .88), 1.2));
    stepSim(sim, now, xx => { if (xx === 0) for (let i = 0; i < cf.length; i++) cf[i] = clamp(cf[i] + (Math.random() - .5) * .22);
      const xn = (xx / cols - .5) * 2, prof = col ? (1 - Math.pow(Math.abs(xn), 1.4)) : (1 - Math.pow(Math.abs(xn), 1.7)) * (.62 + .38 * Math.abs(Math.sin(xn * 7.5 + peaks[0])) * (.6 + .4 * Math.sin(xn * 3 + peaks[1])));
      return 35 * clamp(prof * 1.15) * env * inten * (.72 + .28 * Math.pow(cf[(xx / 3) | 0], .7)); }, wind, o.per || (rows > 60 ? 3 : 2));
    drawSim(g2, sim, p.x, p.y, cell, o.alpha == null ? 1 : o.alpha);
  });
  if (o.glow !== false) { const gc = { fire:'255,150,40', gold:'255,210,90', heal:'110,240,150', frost:'150,210,255', dark:'180,70,230', dust:'190,150,100', water:'90,170,255' }[pal] || '255,150,40';
    const gr = o.glowR || Math.max(w, h) * .9; add(dur === Infinity ? Infinity : dur, (g2, u) => { const p = pos(); if (!p) return; const a = (dur === Infinity ? 1 : Math.sin(Math.PI * clamp(u * 1.05))) * (o.glowA == null ? .34 : o.glowA) * inten;
      g2.save(); g2.globalCompositeOperation = 'lighter'; const gg = g2.createRadialGradient(p.x, p.y - h * .35, 0, p.x, p.y - h * .35, gr); gg.addColorStop(0, `rgba(${gc},${a})`); gg.addColorStop(1, `rgba(${gc},0)`); g2.fillStyle = gg; g2.fillRect(p.x - gr, p.y - h * .35 - gr, gr * 2, gr * 2); g2.restore(); }); }
  return e;
}
// faíscas/brasas em quadrados de 4 px, com a cor sorteada da paleta
function sparks(x, y, n, o = {}){
  const pal = o.pal || 'fire', hi = o.hi || [22, 35];
  for (let i = 0; i < n; i++) { const ox = rnd(-(o.spread || 60), o.spread || 60), vy = rnd(o.vy0 || 160, o.vy1 || 420), sx = rnd(-40, 40), z = Math.random() < .3 ? 8 : 4, c = solid(pal, rnd(hi[0], hi[1])), dl = rnd(0, o.span || 500), d = rnd(o.d0 || 700, o.d1 || 1500), ph = rnd(0, 6.28);
    add(d, (g2, u) => { g2.save(); g2.globalCompositeOperation = 'lighter'; g2.globalAlpha = Math.sin(Math.PI * Math.pow(u, .6)); g2.fillStyle = c; g2.fillRect(q(x + ox + sx * u + Math.sin(u * 8 + ph) * 10), q(y - vy * eo(u)), z, z); g2.restore(); }, dl); }
}
// anel pixelado (elipse) que se expande
function ringPx(g2, x, y, rx, ry, col, a, th = 4){
  const n = Math.max(24, Math.round((rx + ry) / 3)); g2.save(); g2.fillStyle = col; g2.globalAlpha = clamp(a);
  for (let i = 0; i < n; i++) { const an = i / n * 6.2832; g2.fillRect(q(x + Math.cos(an) * rx), q(y + Math.sin(an) * ry), th, th); } g2.restore();
}
function ripple(x, y, o = {}){
  const R = o.r || 140, col = o.col || '150,215,250', n = o.n || 3;
  for (let k = 0; k < n; k++) add(o.d || 1000, (g2, u) => { const r = lerp(14, R, eo(u)); ringPx(g2, x, y, r, r * .3, `rgba(${col},1)`, (1 - u) * .9); if (u > .15) ringPx(g2, x, y, r * .72, r * .22, 'rgba(240,252,255,1)', (1 - u) * .5); }, k * (o.gap || 150));
}
function splash(x, y, o = {}){      // água: coluna em jato (autômato com paleta water), gotas em arco e anéis no chão
  const s = o.s || 1; flames('water', x, y, {w:90 * s, h:o.h || 220 * s, dur:o.dur || 900, col:true, per:3, glowA:.15, hold:.4});
  ripple(x, y - 4, {r:130 * s, n:2});
  for (let i = 0; i < (o.n || 22); i++) { const vx = rnd(-260, 260) * s, vy = -rnd(300, 760) * s, z = Math.random() < .35 ? 8 : 4, dl = rnd(0, 220), d = rnd(650, 1100);
    add(d, (g2, u) => { const t = u * d / 1000, px = x + vx * t, py = y + vy * t + 1700 * t * t / 2; if (py > y + 6) return; g2.fillStyle = 'rgb(70,160,235)'; g2.fillRect(q(px), q(py), z, z); g2.fillStyle = 'rgb(235,250,255)'; g2.fillRect(q(px), q(py), z / 2, z / 2); }, dl); }
}
function wind(x, y, o = {}){        // vento: espirais de riscos pálidos subindo + nuvem de poeira na base
  const s = o.s || 1, N = o.n || 3, H = (o.h || 360) * s;
  for (let k = 0; k < N; k++) { const a0 = rnd(0, 6.28), r0 = rnd(50, 110) * s, turns = rnd(1.4, 2.2), dir = k % 2 ? 1 : -1, dl = k * 120, dur = o.d || 1100;
    add(dur, (g2, u) => { g2.save(); g2.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 14; j++) { const uu = u - j * .018; if (uu < 0) break; const an = a0 + dir * uu * turns * 6.28, rr = r0 * (1 - uu * .25), px = x + Math.cos(an) * rr, py = y - uu * H + Math.sin(an) * rr * .28, back = Math.sin(an) > 0;
        g2.globalAlpha = (1 - j / 14) * Math.sin(Math.PI * uu) * (back ? 1 : .5); g2.fillStyle = j < 3 ? 'rgb(245,255,250)' : 'rgb(190,235,220)'; g2.fillRect(q(px), q(py), j < 5 ? 8 : 4, 4); } g2.restore(); }, dl); }
  flames('dust', x, y, {w:150 * s, h:80 * s, dur:900, glow:false, alpha:.7, col:true, per:2, i:.5});
  for (let i = 0; i < 10; i++) { const ox = rnd(-90, 90) * s, dl = rnd(0, 500), d = rnd(900, 1500), ph = rnd(0, 6.28), sp = rnd(.5, 1);   // folhinhas de 2x2 que esvoaçam
    add(d, (g2, u) => { g2.fillStyle = 'rgb(200,235,190)'; g2.globalAlpha = Math.sin(Math.PI * u); const px = x + ox + Math.sin(u * 9 + ph) * 40 * s, py = y - 20 - 260 * s * eo(u) * sp; g2.fillRect(q(px), q(py), 4, 4); if (((u * 14) | 0) % 2) g2.fillRect(q(px) + 4, q(py), 4, 4); g2.globalAlpha = 1; }, dl); }
}
function debris(x, y, o = {}){      // terra: pedras de 2 tons com gravidade e quique + poeira
  const s = o.s || 1, n = o.n || 12;
  for (let i = 0; i < n; i++) { const vx = rnd(-340, 340) * s, vy = -rnd(420, 900) * s, z = (Math.random() < .4 ? 16 : Math.random() < .5 ? 12 : 8), d = rnd(900, 1400), dl = rnd(0, 90), base = rnd(0, 1) < .5 ? [150, 108, 64] : [124, 92, 60];
    add(d, (g2, u) => { const t = u * d / 1000, tL = -2 * vy / 1900, px = x + vx * t; let py; if (t < tL) py = y + vy * t + 950 * t * t; else { const t2 = t - tL; py = Math.min(y, y + vy * .32 * t2 + 950 * t2 * t2); }
      g2.globalAlpha = 1 - seg(u, .75, 1); g2.fillStyle = `rgb(${base[0] - 70},${base[1] - 56},${base[2] - 40})`; g2.fillRect(q(px) - 4, q(py) - 4, z + 8, z + 8); g2.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g2.fillRect(q(px), q(py), z, z);
      g2.fillStyle = `rgb(${base[0] + 55},${base[1] + 50},${base[2] + 38})`; g2.fillRect(q(px), q(py), z / 2, z / 2); g2.globalAlpha = 1; }, dl); }
  flames('dust', x, y, {w:220 * s, h:130 * s, dur:1100, glow:false, alpha:.8, per:2, i:.5});
}
function bolt(x0, y0, x1, y1, o = {}){   // raio: deslocamento do ponto médio, ajustado à grade; pisca em 3 quadros
  const pts = [[x0, y0], [x1, y1]], rough = o.rough || .22; let amp = Math.hypot(x1 - x0, y1 - y0) * rough;
  const build = () => { let p = [[x0, y0], [x1, y1]], a = amp; for (let k = 0; k < 6; k++) { const nx = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const m = [(p[i][0] + p[i + 1][0]) / 2 + rnd(-a, a), (p[i][1] + p[i + 1][1]) / 2 + rnd(-a * .5, a * .5)]; nx.push(m, p[i + 1]); } p = nx; a *= .55; } return p; };
  const shapes = [build(), build(), build()], dur = o.d || 420, col = o.col || '120,190,255';
  add(dur, (g2, u) => { const p = shapes[Math.min(2, (u * 7 | 0) % 3)]; g2.save(); g2.globalCompositeOperation = 'lighter'; g2.globalAlpha = (1 - seg(u, .5, 1)) * (.7 + .3 * Math.random());
    for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1], steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
      for (let k = 0; k <= steps; k++) { const px = q(lerp(a[0], b[0], k / steps)), py = q(lerp(a[1], b[1], k / steps)); g2.fillStyle = `rgba(${col},.55)`; g2.fillRect(px - 8, py - 8, 20, 20); g2.fillStyle = 'rgb(255,255,255)'; g2.fillRect(px, py, 4, 4); } }
    g2.restore(); });
}
function crosses(x, y, n, o = {}){   // estrelas de cura em formato de cruz de 4 px, subindo
  const pal = o.pal || 'heal';
  for (let i = 0; i < n; i++) { const ox = rnd(-(o.spread || 50), o.spread || 50), dl = rnd(0, o.span || 700), d = rnd(900, 1400), rise = rnd(160, 300), c = solid(pal, rnd(24, 35)), ph = rnd(0, 6.28);
    add(d, (g2, u) => { const px = q(x + ox + Math.sin(u * 6 + ph) * 8), py = q(y - 20 - rise * eo(u)); g2.save(); g2.globalCompositeOperation = 'lighter'; g2.globalAlpha = Math.sin(Math.PI * u); g2.fillStyle = c;
      g2.fillRect(px, py, 4, 4); if (u > .1 && u < .85) { g2.fillRect(px - 4, py, 4, 4); g2.fillRect(px + 4, py, 4, 4); g2.fillRect(px, py - 4, 4, 4); g2.fillRect(px, py + 4, 4, 4); } g2.restore(); }, dl); }
}

const NOOP = () => {};
window.PXFX = {
  init(el, feet){ if (cv) return; cv = document.createElement('canvas'); cv.className = 'fxl front px'; cv.width = 1024; cv.height = 1536; el.append(cv); g = cv.getContext('2d'); g.imageSmoothingEnabled = false; if (feet) feetOf = feet; },
  // Efeitos desativados no jogo (so as tochas usam o modulo, via PXFX.sim). Mantidos no codigo para uso futuro: troque NOOP por as funcoes.
  fire:NOOP, gold:NOOP, heal:NOOP, frost:NOOP, dark:NOOP, dust:NOOP, water:NOOP, burn:NOOP,
  later:NOOP, splash:NOOP, ripple:NOOP, wind:NOOP, debris:NOOP, bolt:NOOP, sparks:NOOP, crosses:NOOP, ring:NOOP, add:NOOP, PAL, solid, sim:{make:makeSim, step:stepSim, draw:drawSim},
  clear(){ list = []; burns = {}; if (g) g.clearRect(0, 0, cv.width, cv.height); },
};
})();
