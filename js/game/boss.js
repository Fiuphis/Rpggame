/* Banco de Dados I — RPG · Malgorath, Lorde das Trevas (v88 — sprite sheets)
   Sprite sheets: assets/bosses/lorde/anim/malgorath_<nome>.png (faixa horizontal, célula 320×256, escala 3 → 960×768 no mundo 1024×1536).
   Âncora dos pés: (160,250) da célula → mundo pé fixo em feet().
   Eventos por ms absoluto desde o início da ação (calculados pela soma dos durs do manifest).
   API pública: BossRig.make → {start, play, nextHit, idle, has, fx, setMode, setDead, reset, feet}. */
(() => {
'use strict';
const SCALE = 3;
const CELL_W = 320, CELL_H = 256;
const FEET_X = 160, FEET_Y = 250;   // âncora dos pés na célula (px da cel original)
const RED = '255,50,50', HOT = '255,150,100', VIO = '175,70,255', ORG = '255,150,50';
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3);
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);

function glow(g, x, y, r, col, a){
  if (a <= 0.005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,235,225,${clamp(a * .6)})`); gr.addColorStop(.16, `rgba(${col},${clamp(a)})`); gr.addColorStop(.5, `rgba(${col},${clamp(a * .3)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function streak(g, x, y, ang, len, th, col, a){
  if (a <= .005) return; g.save(); g.translate(x, y); g.rotate(ang); g.scale(len / th, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, th); gr.addColorStop(0, `rgba(255,235,225,${clamp(a * .7)})`); gr.addColorStop(.3, `rgba(${col},${clamp(a)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-th, -th, th * 2, th * 2); g.restore();
}
function smokeBlob(g, x, y, r, a, col){
  if (a <= .005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${col},${clamp(a)})`); gr.addColorStop(.55, `rgba(${col},${clamp(a * .55)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host;
  const front = layers.front, fc = front.getContext('2d'), back = layers.back, bc = back.getContext('2d');
  let backUsed = false;
  const cw = cv.width, ch = cv.height;
  let MAN = null;
  const sheets = {};
  const tsc = () => (window.__ts == null ? 1 : window.__ts);

  fetch('assets/bosses/lorde/anim/manifest.json').then(r => r.json()).then(j => {
    MAN = j.malgorath;
    for (const name of Object.keys(MAN)) {
      const img = new Image(); img.src = `assets/bosses/lorde/${MAN[name].src}`; sheets[name] = img;
    }
    fogoAquecer();
  }).catch(() => {});

  const sheetReady = name => sheets[name] && sheets[name].complete && sheets[name].naturalWidth > 0;

  let fxl = [], cur = null, shakeT = 0, last = 0, t0 = clk(), running = false;
  let mode = null, held = null, tgt = {x:512, y:1000}, mark = null;
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); };

  const feet = () => ({x: world.x + W / 2, y: world.y + Hh});
  const bx0 = Px + W / 2;    // X do pé no canvas (constante)
  const by0 = Py + Hh;        // Y do pé no canvas (constante)

  // pontos medidos nos quadros novos (pe do quadro = 128,250; escala 3): mao erguida da invocacao (q4), ponta da estocada (q5), mascara, peito
  const hand   = () => { const f = feet(); return {x:f.x + 216, y:f.y - 555}; };
  const swordH = () => { const f = feet(); return {x:f.x - 150, y:f.y - 300}; };
  const swordT = () => { const f = feet(); return {x:f.x + 9,   y:f.y - 60}; };
  const head   = () => { const f = feet(); return {x:f.x,       y:f.y - 405}; };
  const handT  = () => { const f = feet(); return {x:f.x + 135, y:f.y - 255}; };   // mao no arremesso do orbe (invocacao q10)
  const chest  = () => { const f = feet(); return {x:f.x,       y:f.y - 270}; };
  // efeitos em pixel art (assets/fx/malgorath-*, js/game/vfx.js). FX(): camada do jogo (na frente ou atras dos herois);
  // FXU(): efeito de chao (anel, sigilo) na camada de tras do VFX, que fica atras do boss e dos herois
  const FX = (n, o) => (window.VFX && VFX.has(n)) ? VFX.play(n, Object.assign({scale:3}, o)) : null;
  const FXM = {};   // so para saber se o efeito existe antes de tocar
  fetch('data/vfx_manifest.json', {cache:'no-cache'}).then(r => r.json()).then(m => { Object.keys(m).filter(k => k.startsWith('malgorath')).forEach(k => { FXM[k] = 1; }); }).catch(() => {});
  const FXU = (n, o = {}) => FX(n, Object.assign({back:true}, o));   // no chao, atras do boss e dos herois (css: .fxl.back.vfx z-index 2)

  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), bk: !!o.back, un: !!o.under});   // under = no canvas do boss, ATRAS do sprite (a camada back fica na frente do boss)

  function hitFx(x, y, big){
    const bl = (r, col, a, dl = 0, d = 650) => E('glow', d, u => ({x, y, r:r * (.4 + eo(u) * .9), c:col, a:a * (1 - u) * (u < .08 ? u / .08 : 1)}), {delay:dl});
    bl(big ? 190 : 130, RED, .95, 0, 800); bl(big ? 110 : 80, '255,230,220', .9, 0, 450);
    E('ring', 700, u => ({x, y:y + 90, r:lerp(40, big ? 170 : 120, eo(u)), c:RED, a:.8 * (1 - u)}));
    for (let i = 0; i < (big ? 14 : 8); i++) { const an = rnd(0, 6.28), s = rnd(.5, 1) * (big ? 190 : 130); E('glow', 600, u => ({x:x + Math.cos(an) * s * eo(u), y:y + Math.sin(an) * s * eo(u) + 50 * u * u, r:13 * (1 - u * .6), c:HOT, a:.9 * (1 - u)}), {delay:i * 14}); }
    if (big) shakeT = clk();
  }
  function fly(a, b, d, o){
    const path = u => ({x:lerp(a.x, b.x, u), y:lerp(a.y, b.y, u) - (o.arc || 0) * Math.sin(Math.PI * u)});
    const fd = u => u < .1 ? u / .1 : u > .94 ? (1 - u) / .06 : 1;
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:(o.r || 56) * (.7 + .4 * u), c:o.col || RED, a:.8 * fd(u)}; });
    E('streak', d, u => { const p = path(u), q = path(Math.min(1, u + .04)); return {x:p.x, y:p.y, ang:o.ang != null ? o.ang : Math.atan2(q.y - p.y, q.x - p.x), len:o.len || 200, th:o.th || 28, c:o.sc || HOT, a:.9 * fd(u)}; });
    if (o.cross) E('streak', d, u => { const p = path(u); return {x:p.x, y:p.y, ang:o.ang2, len:o.len * .8, th:o.th * .8, c:RED, a:.7 * fd(u)}; });
    for (let i = 1; i <= 8; i++) { const ut = i / 9, p = path(ut); E('glow', 450, v => ({x:p.x, y:p.y + 8 * v, r:40 * (1 - v * .6), c:o.col || RED, a:.4 * (1 - v)}), {delay:ut * d}); }
    setTimeout(() => { hitFx(b.x, b.y, o.big); fireHit(); }, d / tsc()); return d;
  }

  const EV = {
    charge(){ const f = feet(); E('ring', 1000, u => ({x:f.x, y:f.y - 6, r:lerp(60, 260, eo(u)), c:RED, a:.8 * (1 - u)}));
      E('glow', 1200, u => ({x:f.x, y:f.y - 260, r:lerp(150, 330, eo(u)), c:RED, a:.5 * Math.sin(Math.PI * u)}), {under:true});
      for (let i = 0; i < 10; i++) { const ox = rnd(-260, 260); E('glow', 900, u => ({x:f.x + ox, y:f.y - 30 - 360 * eo(u), r:16, c:HOT, a:.8 * Math.sin(Math.PI * u)}), {delay:i * 60}); } },
    hit(){ fireHit(); },
    wave(k){ corteFogo(k); },   // rastro de fogo na espada + onda ate o heroi (o dano entra quando ela chega)
    orb(){ const h = hand(); if (FX('malgorath-carga', {x:h.x, y:h.y})) return;
      E('orb', 1000, u => ({x:h.x, y:h.y, r:lerp(10, 82, eo(u)), a:u < .1 ? u / .1 : 1})); },
    orbThrow(){ const h = handT(), b = tgt, d = 620;
      if (window.VFX && VFX.has('malgorath-orbe')) { FX('malgorath-orbe', {x:h.x, y:h.y, scale:4, rot:Math.atan2(b.y - h.y, b.x - h.x), loop:true, to:{x:b.x, y:b.y, ms:d, ease:'in'}});
        setTimeout(() => { FX('malgorath-explosao', {x:b.x, y:b.y}); shakeT = clk(); fireHit(); }, d / tsc()); return; }
      E('orb', d, u => ({x:lerp(h.x, b.x, eo(u) * .5 + u * .5), y:lerp(h.y, b.y, u * u * .4 + u * .6), r:82 * (1 - .25 * u), a:1 - clamp((u - .9) / .1)}));
      E('glow', d, u => ({x:lerp(h.x, b.x, eo(u) * .5 + u * .5), y:lerp(h.y, b.y, u * u * .4 + u * .6), r:130, c:RED, a:.5}));
      setTimeout(() => { hitFx(b.x, b.y, true); E('ring', 900, u => ({x:b.x, y:b.y + 90, r:lerp(60, 220, eo(u)), c:VIO, a:.7 * (1 - u)})); fireHit(); }, d / tsc()); },
    lance(){ lancaFogo(); },
    nova(){ const f = feet(), y0 = 1075, d = 520;
      if (FXM['malgorath-onda-choque'] && window.VFX && VFX.has('malgorath-erupcao')) { FXU('malgorath-onda-choque', {x:f.x, y:f.y, scale:4});
        const ws = ['mage','guerreiro','tank','cleriga'].map(w => window.Anim && Anim.feet ? Anim.feet(w) : null).filter(Boolean);
        (ws.length ? ws : [{x:150, y:y0}, {x:390, y:y0}, {x:640, y:y0}, {x:880, y:y0}]).forEach((p, i) => FX('malgorath-erupcao', {x:p.x, y:p.y, scale:3, back:true, delay:200 + i * 70}));
        shakeT = clk(); setTimeout(fireHit, d / tsc()); return; }
      E('glow', 900, u => ({x:f.x, y:f.y - 250, r:lerp(120, 420, eo(u)), c:RED, a:.8 * (1 - u)}), {under:true});
      for (let k = 0; k < 3; k++) E('ring', 1100, u => ({x:f.x, y:y0, r:lerp(60, 640, eo(u)), c:k === 1 ? HOT : RED, a:.8 * (1 - u)}), {delay:k * 150});
      for (let i = 0; i < 17; i++) { const x = 40 + i * 60, dl = Math.abs(x - f.x) / 640 * 330;
        E('streak', 700, u => ({x, y:y0 - 120 * Math.sin(Math.PI * Math.min(1, u * 1.15)) - 20, ang:-Math.PI / 2, len:260 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 30, th:20, c:RED, a:.85 * (1 - clamp((u - .6) / .4))}), {delay:dl});
        E('glow', 700, u => ({x, y:y0 - 30, r:44 * (1 - u * .5), c:HOT, a:.6 * (1 - u)}), {delay:dl}); }
      shakeT = clk(); setTimeout(fireHit, d / tsc()); },
    roar(k){ const f = feet(), n = k === '2' ? 2 : 1;
      if (FXM['malgorath-onda-choque']) { FXU('malgorath-onda-choque', {x:f.x, y:f.y, scale:3 + n}); shakeT = clk(); if (n === 2) setTimeout(fireHit, 200 / tsc()); return; }
      E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(60, 200 + 90 * n, eo(u)), c:RED, a:.85 * (1 - u)}));
      E('glow', 1300, u => ({x:f.x, y:f.y - 280, r:lerp(120, 360 + 60 * n, eo(u)), c:RED, a:.6 * Math.sin(Math.PI * u)}), {under:true});   // atras do boss: nao cobre o rosto/mascara
      for (let i = 0; i < 10; i++) { const ox = rnd(-240, 240); E('glow', 1000, u => ({x:f.x + ox, y:f.y - 30 - 400 * eo(u), r:18, c:'255,90,60', a:.8 * Math.sin(Math.PI * u)}), {delay:i * 60}); }
      shakeT = clk(); if (n === 2) setTimeout(fireHit, 200 / tsc()); },
    sigil(){ const f = feet(); if (FXM['malgorath-sigilo']) { FXU('malgorath-sigilo', {x:f.x, y:f.y + 6, scale:5, loop:true, dur:2000}); return; } E('sigil', 2400, u => ({x:f.x, y:f.y - 6, r:lerp(120, 300, eo(Math.min(1, u * 2))), rot:u * 2, a:Math.sin(Math.PI * Math.min(1, u * 1.05)) * .85}), {back:true}); },
    ring(){ const h = hand(); E('ring', 900, u => ({x:h.x, y:h.y + 40, r:lerp(30, 150, eo(u)), c:VIO, a:.65 * (1 - u)})); },
    omen(){ const f = feet();
      E('glow', 760, u => ({x:f.x, y:f.y - 300, r:lerp(80, 360, eo(u)), c:RED, a:.55 * u}), {under:true});
      E('streak', 600, u => ({x:f.x, y:f.y - 700 + 600 * (u*u), ang:Math.PI / 2, len:420, th:18, c:HOT, a:.7 * Math.sin(Math.PI * u)}), {delay:120}); },
    slam(){ const f = feet(); FXU('malgorath-onda-choque', {x:f.x, y:f.y, scale:4});
      E('glow', 700, u => ({x:f.x, y:f.y - 40, r:lerp(100, 520, eo(u)), c:'255,236,200', a:.8 * (1 - u)}));
      for (let k = 0; k < 3; k++) E('ring', 1000, u => ({x:f.x, y:f.y - 6, r:lerp(40, 460, eo(u)), c:k === 1 ? HOT : RED, a:.85 * (1 - u)}), {delay:k * 110});
      for (let i = 0; i < 12; i++) { const ox = (i < 6 ? -1 : 1) * (60 + (i % 6) * 55), dl = (i % 6) * 25; E('ash', 1100, u => ({x:f.x + ox * (.5 + u), y:f.y - 20 - 50 * eo(u), r:lerp(30, 85, eo(u)), a:.5 * Math.sin(Math.PI * u)}), {delay:dl, back:false}); }
      shakeT = clk(); },
    smoke(){ const f = feet(); if (FX('malgorath-fumaca', {x:f.x, y:f.y - 200, scale:3})) return; for (let i = 0; i < 16; i++) { const ox = rnd(-190, 190), oy = rnd(-520, -40), sp = rnd(.6, 1.3); E('smoke', 1300, u => ({x:f.x + ox * (.4 + u * .8), y:f.y + oy - 70 * u * sp, r:lerp(70, 150, eo(u)) * sp, a:.85 * Math.sin(Math.PI * Math.min(1, u * 1.05))}), {delay:i * 35}); }
      E('glow', 900, u => ({x:f.x, y:f.y - 280, r:lerp(120, 300, eo(u)), c:VIO, a:.45 * Math.sin(Math.PI * u)})); },
    smokeT(){ const b = tgt; if (FX('malgorath-fumaca', {x:b.x, y:b.y - 40, scale:3})) return; for (let i = 0; i < 12; i++) { const ox = rnd(-90, 90), oy = rnd(-300, 30), sp = rnd(.6, 1.2); E('smoke', 1000, u => ({x:b.x + ox, y:b.y + 90 + oy - 40 * u, r:lerp(40, 90, eo(u)) * sp, a:.8 * Math.sin(Math.PI * Math.min(1, u * 1.05))}), {delay:i * 28}); } },
    strikeT(){ const b = tgt; if (FX('malgorath-corte', {x:b.x, y:b.y - 30})) { setTimeout(fireHit, 190 / tsc()); return; } E('streak', 480, u => ({x:b.x, y:b.y - 20, ang:-.6, len:360 * (.5 + eo(u) * .7), th:30, c:HOT, a:.9 * (1 - u)}));
      E('streak', 480, u => ({x:b.x, y:b.y - 20, ang:.6, len:300 * (.5 + eo(u) * .7), th:26, c:RED, a:.9 * (1 - u)}), {delay:40}); hitFx(b.x, b.y + 20, false); fireHit(); },
    burst(){ const f = feet(), c0 = chest(); FX('malgorath-explosao', {x:c0.x + 30, y:c0.y - 20, scale:2.5}); E('glow', 1000, u => ({x:f.x, y:f.y - 250, r:lerp(100, 420, eo(u)), c:RED, a:.9 * (1 - u)}), {under:true}); E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(60, 340, eo(u)), c:RED, a:.8 * (1 - u)})); shakeT = clk(); },
    cacos(){ const h = head(); FX('malgorath-cacos', {x:h.x, y:h.y, scale:3}); },
    embers(){ const f = feet(); for (let i = 0; i < 22; i++) { const ox = rnd(-230, 230), oy = rnd(-420, -40); E('glow', 1700, u => ({x:f.x + ox + 30 * Math.sin(u * 6 + i), y:f.y + oy - 300 * eo(u), r:15 * (1 - u * .5), c:HOT, a:.85 * Math.sin(Math.PI * u)}), {delay:i * 70}); } },
  };
  function runEv(e){ const [k, a, b] = e.split(':'); if (EV[k]) EV[k](a, b); }

  // ── desenho de um quadro da sheet ─────────────────────────────────────────
  // ── fogo vivo (labaredas da espada e da mao sempre se mexendo, sobre qualquer quadro; 12 fps) ──
  // fios = pixels de fogo na borda da silhueta: sobem, balancam e piscam; fogo grande (lamina/mao) ganha luz correndo
  // (ciclo de paleta; componentes pequenos como os olhos ficam de fora); brasas sobem das pontas. Mesmo algoritmo de scripts/fogo_vivo.py.
  const RAMP = [[190,3,7],[230,13,10],[249,13,23],[253,67,29]], TIP = [253,67,29], TIP2 = [208,66,29];
  const fogoInfo = {}, fogoCv = document.createElement('canvas'), fogoG = fogoCv.getContext('2d', {willReadFrequently:true});
  const brasas = []; let fogoTick = -1, fogoKey = '', fogoRng = 1;
  const rnd01 = () => (fogoRng = (fogoRng * 16807) % 2147483647) / 2147483647;
  function fogoPrep(name, frame){
    const k = name + ':' + frame; if (fogoInfo[k]) return fogoInfo[k];
    fogoCv.width = CELL_W; fogoCv.height = CELL_H; fogoG.clearRect(0, 0, CELL_W, CELL_H);
    fogoG.drawImage(sheets[name], frame * CELL_W, 0, CELL_W, CELL_H, 0, 0, CELL_W, CELL_H);
    const d = fogoG.getImageData(0, 0, CELL_W, CELL_H), a = d.data, W = CELL_W, H = CELL_H;
    const isF = i => a[i + 3] && a[i] >= 185 && a[i + 1] <= 75 && a[i + 2] <= 45;
    const vaz = (x, y) => x < 0 || y < 0 || x >= W || y >= H || !a[(y * W + x) * 4 + 3];
    const comps = sel => { const vis = new Uint8Array(W * H), out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x; if (vis[p] || !sel(x, y)) continue;
        const st = [p], cc = []; vis[p] = 1;
        while (st.length) { const q = st.pop(), u = q % W, v = (q - u) / W; cc.push(q);
          for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const uu = u + c, vv = v + b; if (uu < 0 || vv < 0 || uu >= W || vv >= H) continue; const r = vv * W + uu; if (!vis[r] && sel(uu, vv)) { vis[r] = 1; st.push(r); } } }
        out.push(cc); }
      return out; };
    const fio = (x, y) => { if (!isF((y * W + x) * 4)) return false; let n = 0; for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) n += vaz(x + c, y + b); return n >= 3; };
    const fios = comps(fio).filter(c => c.length >= 2).map(c => { let top = 1e9, tp = 0; for (const p of c) { const y = (p / W) | 0; if (y < top) { top = y; tp = p; } } return {c, top, tp}; });
    const grandes = comps((x, y) => isF((y * W + x) * 4)).filter(c => c.length >= 18);
    const ramp = new Map(); for (const c of grandes) for (const p of c) { const i = p * 4; const k2 = RAMP.findIndex(r => r[0] === a[i] && r[1] === a[i + 1] && r[2] === a[i + 2]); if (k2 >= 0) ramp.set(p, k2); }
    return (fogoInfo[k] = {src:d, fios, ramp});
  }
  function fogoFrame(name, frame, now){   // devolve um canvas CELL_W x CELL_H com o quadro e o fogo animado
    const tick = Math.floor(now / 83), key = name + ':' + frame;
    if (tick === fogoTick && key === fogoKey) return fogoCv;
    const info = fogoPrep(name, frame), W = CELL_W, H = CELL_H, t = tick / 12;
    const out = new ImageData(new Uint8ClampedArray(info.src.data), W, H), o = out.data, s = info.src.data;
    const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; if (o[i + 3]) return; o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; o[i + 3] = 255; };
    info.ramp.forEach((k, p) => { const x = p % W, y = (p - x) / W, k2 = Math.max(0, Math.min(3, k + Math.round(Math.sin((x - y) / 3 - t * 7.5)))), i = p * 4; o[i] = RAMP[k2][0]; o[i + 1] = RAMP[k2][1]; o[i + 2] = RAMP[k2][2]; });
    for (const f of info.fios) for (const p of f.c) o[p * 4 + 3] = 0;
    const novaBrasa = tick !== fogoTick;
    info.fios.forEach((f, n) => { const ph = n * 1.7, dy = -Math.round(1 + Math.sin(t * 9 + ph));
      for (const p of f.c) { const x = p % W, y = (p - x) / W, h = y - f.top; if (h === 0 && Math.sin(t * 13 + ph * 3) > .55) continue;
        const dx = Math.round(Math.sin(t * 6 + ph + h * .45) * (h < 4 ? 1 : .5)), i = p * 4; put(x + dx, y + dy, [s[i], s[i + 1], s[i + 2]]); }
      const tx = f.tp % W;
      if (Math.sin(t * 11 + ph * 2) > .3) put(tx + Math.round(Math.sin(t * 6 + ph)), f.top + dy - 1, TIP);
      if (novaBrasa && brasas.length < 40 && rnd01() < .025 * Math.sqrt(f.c.length)) brasas.push([tx, f.top - 2, 0, (rnd01() - .5) * .6]); });
    if (novaBrasa) for (let i = brasas.length - 1; i >= 0; i--) { const b = brasas[i]; b[1] -= 1.1; b[0] += b[3]; if (++b[2] > 9) brasas.splice(i, 1); }
    for (const b of brasas) put(Math.round(b[0]), Math.round(b[1]), b[2] < 5 ? TIP : TIP2);
    if (key !== fogoKey) brasas.length = Math.min(brasas.length, 12);
    fogoCv.width = W; fogoCv.height = H; fogoG.putImageData(out, 0, 0); fogoTick = tick; fogoKey = key;
    return fogoCv;
  }
  // aquece o cache do fogo (componentes por quadro) aos poucos quando o navegador esta ocioso: evita tranco no 1o uso
  function fogoAquecer(){ const fila = []; Object.keys(MAN || {}).forEach(n => { for (let i = 0; i < MAN[n].frames; i++) fila.push([n, i]); });
    const passo = dl => { while (fila.length && (!dl || dl.timeRemaining() > 4)) { const [n, i] = fila[0]; if (!sheetReady(n)) break; fila.shift(); fogoPrep(n, i); }
      if (fila.length) (window.requestIdleCallback || (cb => setTimeout(cb, 50)))(passo); };
    setTimeout(passo, 1500); }
  if (/[?&]teste=1/.test(location.search)) window.__bossFogo = fogoFrame;

  // ── cortes de fogo (pixel art desenhado em codigo, no grid de pixel do chefe: 1 px = 3 px do mundo) ──
  // rastro: faixa de fogo seguindo o caminho da ponta da espada no golpe; onda: meia-lua de fogo que sai da ponta e cresce
  // em perspectiva ate o heroi (H larga/achatada, V alta/estreita); lanca: estocada de fogo da ponta ate o heroi.
  const PXS = 3, lc = document.createElement('canvas'); lc.width = 342; lc.height = 512; const lg = lc.getContext('2d');
  const FRAMP = [[2,1,2],[120,4,20],[190,3,7],[249,13,23],[253,67,29],[244,208,110]];
  const cortes = [];
  const pt = (q) => { const f = feet(); return {x:f.x + (q[0] - 128) * 3, y:f.y + (q[1] - 250) * 3}; };   // ponto do quadro 256 -> mundo
  const TIPS = {slashH:[[145,43],[188,244]], slashV:[[156,22],[124,246]], thrust:[[137,240]]};             // ponta da espada antes/depois do golpe
  const nz = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  function plotFogo(img, W, H, x, y, k){   // k: 0 contorno .. 5 nucleo
    if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 5, c = FRAMP[k];
    if (img[i + 3] && img[i + 4] >= k) return; img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; img[i + 3] = 255; img[i + 4] = k; }
  // desenha uma faixa (lista de pontos em px do grid baixo, largura por ponto) com nucleo claro, borda vermelha e lingua de fogo
  function faixa(buf, W, H, pts, t){
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0, w0] = pts[i], [x1, y1, w1] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let s2 = 0; s2 <= n; s2++) { const u = s2 / n, cx = x0 + (x1 - x0) * u, cy = y0 + (y1 - y0) * u, w = w0 + (w1 - w0) * u;
        if (w <= .3) continue; const R2 = Math.ceil(w + 2);
        for (let dy = -R2; dy <= R2; dy++) for (let dx = -R2; dx <= R2; dx++) {
          const d = Math.hypot(dx, dy), lick = (nz(Math.round(cx + dx), Math.round(cy + dy) + Math.floor(t * 14)) - .5) * 1.6, ww = w + lick;
          if (d > ww + 1) continue; const r = d / Math.max(ww, .5);
          plotFogo(buf, W, H, Math.round(cx + dx), Math.round(cy + dy), d > ww ? 0 : r > .8 ? 2 : r > .55 ? 3 : r > .28 ? 4 : 5); } } }
  }
  function arcoPts(cx, cy, rx, ry, a0, a1, wmax, rev){   // meia-lua: elipse de a0 a a1 (rad), afinando nas pontas; rev = quanto ja apareceu (0..1)
    const n = 28, pts = []; for (let i = 0; i <= n; i++) { const u = i / n; if (u > rev) break; const a = a0 + (a1 - a0) * u;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, wmax * Math.pow(Math.sin(Math.PI * u), .7)]); } return pts; }
  function drawCortes(now){
    if (!cortes.length) return; const W = lc.width, H = lc.height, id = lg.createImageData(W, H), img = new Uint8ClampedArray(W * H * 5);
    for (let i = cortes.length - 1; i >= 0; i--) { const c = cortes[i], u = (now - c.t0) / c.d; if (u < 0) continue; if (u >= 1) { cortes.splice(i, 1); continue; }
      const t = (now - c.t0) / 1000, pts = c.pts(u); if (pts && pts.length > 1) faixa(img, W, H, pts, t); }
    for (let p = 0, q = 0; p < W * H; p++, q += 5) { id.data[p * 4] = img[q]; id.data[p * 4 + 1] = img[q + 1]; id.data[p * 4 + 2] = img[q + 2]; id.data[p * 4 + 3] = img[q + 3]; }
    lg.putImageData(id, 0, 0); fc.save(); fc.imageSmoothingEnabled = false; fc.drawImage(lc, 0, 0, W * PXS, H * PXS); fc.restore();
  }
  // golpe com rastro + onda ate o heroi (k = 'h' | 'v')
  function corteFogo(k){
    const tp = TIPS[k === 'v' ? 'slashV' : 'slashH'], A = pt(tp[0]), B = pt(tp[1]), b = tgt, now = clk(), L = v => v / PXS;
    // rastro: arco de A ate B, abaulado para fora do corpo
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, bx = mx + (k === 'v' ? 70 : 170), by = my + (k === 'v' ? 0 : -40);
    cortes.push({t0:now, d:300, pts:u => { const rev = Math.min(1, u * 2.2), fade = u < .45 ? 1 : 1 - (u - .45) / .55, out = [];
      for (let i = 0; i <= 20; i++) { const s2 = i / 20; if (s2 > rev) break; const s3 = 1 - s2;
        const x = s3 * s3 * A.x + 2 * s3 * s2 * bx + s2 * s2 * B.x, y = s3 * s3 * A.y + 2 * s3 * s2 * by + s2 * s2 * B.y;
        out.push([L(x), L(y), 7 * fade * Math.pow(Math.sin(Math.PI * Math.min(1, s2 / Math.max(rev, .01))) || .2, .5)]); } return out; }});
    // onda: meia-lua que sai de B e cresce ate o heroi (perspectiva), convexa para o lado do heroi
    const ang = Math.atan2(b.y - B.y, b.x - B.x), dur = 300;
    cortes.push({t0:now + 120, d:dur, pts:u => { const e = u * u, x = B.x + (b.x - B.x) * e, y = B.y + (b.y - B.y) * e, sc = .45 + .85 * e;
      const R0 = 70 * sc, w = 9 * sc * (u > .85 ? (1 - u) / .15 : 1);
      return k === 'v' ? arcoPts(L(x), L(y), L(R0 * .45), L(R0 * 1.25), ang - 1.25, ang + 1.25, w, 1)
                       : arcoPts(L(x), L(y), L(R0 * 1.4), L(R0 * .55), ang - 1.35, ang + 1.35, w, 1); }});
    setTimeout(() => { FX('malgorath-corte', k === 'v' ? {x:b.x - 10, y:b.y - 30} : {x:b.x - 40, y:b.y + 20, rot:-1.15}); fireHit(); }, (120 + dur * .92) / tsc());
  }
  // estocada: lanca de fogo da ponta ate o heroi, fina perto do chefe e larga perto do heroi
  function lancaFogo(){
    const A = pt(TIPS.thrust[0]), b = tgt, now = clk(), L = v => v / PXS, d = 420;
    cortes.push({t0:now, d, pts:u => { const reach = Math.min(1, u / .3), fade = u < .55 ? 1 : 1 - (u - .55) / .45, out = [];
      for (let i = 0; i <= 18; i++) { const s2 = i / 18 * reach, x = A.x + (b.x - A.x) * s2, y = A.y + (b.y - A.y) * s2;
        const w = (1.2 + 6.5 * s2) * fade * (i === 18 ? .25 : i >= 16 ? .7 : 1); out.push([L(x), L(y), w]); } return out; }});
    setTimeout(() => { FX('malgorath-explosao', {x:b.x, y:b.y}); shakeT = clk(); fireHit(); }, d * .3 / tsc());
  }
  let tcv = null, tg = null;
  function drawSheet(g, name, frame, al, dx, dy, rot, sc){
    if (!sheetReady(name) || !MAN[name]) return;
    const drawSc = SCALE * (sc == null ? 1 : sc);
    const dstW = CELL_W * drawSc, dstH = CELL_H * drawSc;
    const ancX = FEET_X * drawSc, ancY = FEET_Y * drawSc;
    g.save(); g.globalAlpha = clamp(al == null ? 1 : al); g.imageSmoothingEnabled = false;
    g.translate((dx || 0), (dy || 0)); if (rot) g.rotate(rot * Math.PI / 180);
    g.drawImage(fogoFrame(name, frame, clk()), 0, 0, CELL_W, CELL_H, -ancX, -ancY, dstW, dstH); g.restore();
  }

  function frameAt(name, elapsed){
    const m = MAN && MAN[name]; if (!m) return 0;
    const durs = m.durs; let acc = 0;
    for (let i = 0; i < durs.length; i++){ acc += durs[i]; if (elapsed < acc) return i; }
    return durs.length - 1;
  }
  function msAt(name, idx){
    const m = MAN && MAN[name]; if (!m) return 0;
    return m.durs.slice(0, idx).reduce((a, b) => a + b, 0);
  }
  function totalMs(name){ const m = MAN && MAN[name]; if (!m) return 1000; return m.durs.reduce((a,b)=>a+b,0); }

  // ── loop de animação ──────────────────────────────────────────────────────
  const drawRing = s => { backUsed = true; [[bc, 3.1416, 6.2832], [fc, 0, 3.1416]].forEach(([g, a0, a1]) => { g.save(); g.translate(s.x, s.y); g.scale(1, .3); g.globalCompositeOperation = 'lighter'; g.lineWidth = 10; g.strokeStyle = `rgba(${s.c},${clamp(s.a * .7)})`; g.shadowColor = `rgba(${s.c},.9)`; g.shadowBlur = 30; g.beginPath(); g.arc(0, 0, s.r, a0, a1); g.stroke(); g.restore(); }); };

  function renderUnder(now){   // brilhos de corpo atras do sprite: desenha no canvas do boss (coords do mundo -> canvas)
    const ox = host.world.x - Px, oy = host.world.y - Py; c.save(); c.translate(-ox, -oy);
    for (const e of fxl) { if (!e.un) continue; const u = (now - e.t0) / e.d; if (u < 0 || u >= 1) continue; const s = e.f(u); if (s && e.name === 'glow') glow(c, s.x, s.y, s.r, s.c, s.a); }
    if (!(held && held.gone && !cur)) { const ft = feet(), tm = now - t0;
      if (mode === 'charge') glow(c, ft.x, ft.y - 260, 300 + 20 * Math.sin(tm / 220), RED, .34 + .1 * Math.sin(tm / 180));
      else if (mode === 'rage') glow(c, ft.x, ft.y - 260, 340 + 24 * Math.sin(tm / 240), RED, .38 + .1 * Math.sin(tm / 200));
      else if (mode === 'orange') glow(c, ft.x, ft.y - 260, 300, ORG, .22 + .06 * Math.sin(tm / 240)); }
    c.restore();
  }
  function renderFX(now){
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      if (e.un) return true;
      const s = e.f(u), g = e.bk ? bc : fc; if (e.bk) backUsed = true;
      if (!s) return true;
      if (e.name === 'glow') glow(g, s.x, s.y, s.r, s.c, s.a);
      else if (e.name === 'streak') streak(g, s.x, s.y, s.ang, s.len, s.th, s.c, s.a);
      else if (e.name === 'ring') drawRing(s);
      else if (e.name === 'smoke') smokeBlob(g, s.x, s.y, s.r, s.a, '38,6,52');
      else if (e.name === 'ash')   smokeBlob(g, s.x, s.y, s.r, s.a, '34,10,8');
      else if (e.name === 'spark') { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(${s.c},${clamp(s.a)})`; g.fillRect(Math.round(s.x / 4) * 4, Math.round(s.y / 4) * 4, s.z, s.z); g.restore(); }
      else if (e.name === 'orb') { glow(g, s.x, s.y, s.r * 2.1, RED, .35 * s.a); smokeBlob(g, s.x, s.y, s.r * 1.15, clamp(s.a), '10,0,14'); smokeBlob(g, s.x, s.y, s.r * .8, clamp(s.a), '0,0,0'); glow(g, s.x, s.y, s.r * 1.5, VIO, .18 * s.a); }
      else if (e.name === 'sigil') { g.save(); g.translate(s.x, s.y); g.scale(1, .28); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${RED},${s.a})`; g.shadowColor = `rgba(${RED},1)`; g.shadowBlur = 24; g.lineWidth = 8;
        g.beginPath(); g.arc(0, 0, s.r, 0, 6.2832); g.stroke(); g.lineWidth = 5; g.beginPath(); g.arc(0, 0, s.r * .72, 0, 6.2832); g.stroke();
        g.rotate(s.rot); g.beginPath(); for (let i = 0; i < 5; i++) { const an = i * 4 * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(an) * s.r * .72, Math.sin(an) * s.r * .72); } g.closePath(); g.stroke(); g.restore(); }
      return true;
    });
  }

  function drawMode(ft, tm){
    if (held && held.gone && !cur) return;
    // aura do modo (charge/rage/orange) agora em renderUnder: atras do sprite
  }
  function drawMark(now){
    const u = (now - mark.t0) / 1000, ps = .75 + .25 * Math.sin(u * 7);
    fc.save(); fc.translate(mark.x, mark.y); fc.scale(1, .3); fc.globalCompositeOperation = 'lighter'; fc.lineWidth = 9; fc.strokeStyle = `rgba(${RED},${.85 * ps})`; fc.shadowColor = `rgba(${RED},.95)`; fc.shadowBlur = 26; fc.beginPath(); fc.arc(0, 0, 105 + 12 * ps, 0, 6.2832); fc.stroke(); fc.beginPath(); fc.arc(0, 0, 62, 0, 6.2832); fc.stroke(); fc.restore();
    glow(fc, mark.x, mark.y - 30, 120, RED, .25 * ps);
  }

  function frame(){
    if (!running) return; requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 16) return; last = now;
    if (!MAN) return;
    const ft = feet(), tm = now - t0;
    c.clearRect(0, 0, cw, ch);
    fc.clearRect(0, 0, front.width, front.height);
    if (backUsed) { bc.clearRect(0, 0, back.width, back.height); backUsed = false; }

    const onFront = !!(cur && cur.front);
    const g = onFront ? bc : c; if (onFront) backUsed = true;
    const ancCx = onFront ? ft.x : bx0;
    const ancCy = onFront ? ft.y : by0;
    const vx = (cur && cur.pxpy) ? (tgt.x - ft.x) : 0;
    const vy = (cur && cur.pxpy) ? (tgt.y - ft.y) : 0;

    const gone = held && held.gone && !cur;
    if (!gone) {
      // shadow: posicionar como no código original para que shadow() use META[boss] corretamente
      c.save(); c.translate(Px - host.P, Py - host.P + (Hh - (Hh - 4))); host.shadow(c); c.restore();
    }
    renderUnder(now);

    // dispara eventos em ms absoluto
    if (cur) {
      ensureEvs(cur);
      const ev = cur.evs || [], el = now - cur.start;
      while (cur.fired < ev.length && el >= ev[cur.fired][0]){ runEv(ev[cur.fired][1]); cur.fired++; }
    }

    // ----- draw boss -----
    if (cur) {
      const el = now - cur.start, tot = cur.totalDur;

      if (cur._fireIn) {
        // queda + pouso em prep
        let f = 0, dy = 0, al = 1, sn = 'prep';
        if (el < 760) { dy = lerp(-190 * SCALE, 0, ease(el / 760)); al = el < 80 ? el / 80 : 1; f = 0; }
        else if (el < 1240) { f = Math.min(5, frameAt('prep', el - 760)); }
        else { const prog = Math.min(1, (el - 1240) / 360); f = Math.round(5 * (1 - prog)); }
        if (!cur._slammed && el >= 760) { EV.slam(); cur._slammed = true; }
        g.save(); g.translate(ancCx, ancCy); drawSheet(g, sn, f, al, 0, dy, 0, 1); g.restore();
        if (el >= tot) { const d = cur; cur = null; held = null; d.done(); }
      } else if (cur._gagCast) {
        const tailStart = msAt('summon', 9), tailMs2 = totalMs('summon') - tailStart;
        const loopEnd = tot - tailMs2;
        let f;
        if (el < loopEnd) { f = 8; }
        else { f = frameAt('summon', tailStart + (el - loopEnd)); f = Math.max(9, Math.min(13, f)); }
        g.save(); g.translate(ancCx, ancCy); drawSheet(g, 'summon', f, 1, 0, 0, 0, 1); g.restore();
        if (el >= tot) { const d = cur; cur = null; held = null; d.done(); }
      } else if (cur.loop) {
        const f = frameAt(cur.sheet, el % tot);
        g.save(); g.translate(ancCx, ancCy); drawSheet(g, cur.sheet, f, 1, 0, 0, 0, 1); g.restore();
        // idle loop não termina sozinho
      } else {
        const sn = cur.sheet;
        const nf = MAN[sn] ? MAN[sn].frames : 1;
        let f = 0, al = 1;
        if (el >= tot) {
          if (cur.hold === 'gone') {
            if (!cur._fadeStart) cur._fadeStart = now;
            const fu = clamp((now - cur._fadeStart) / 700);
            al = 1 - fu; f = nf - 1;
            g.save(); g.translate(ancCx + vx, ancCy + vy); drawSheet(g, sn, f, al, 0, 0, 0, 1); g.restore();
            if (fu >= 1) { held = {gone:true}; const d = cur; cur = null; d.done(); }
          } else if (cur.hold === 'last') {
            // segurar último quadro (gagLook): a promessa resolve no fim (o app espera para mostrar o banner),
            // mas o quadro fica parado até o gagDismiss (ou 8 s de segurança) para o boss não voltar ao idle no meio
            f = nf - 1;
            g.save(); g.translate(ancCx, ancCy); drawSheet(g, sn, f, 1, 0, 0, 0, 1); g.restore();
            if (!cur._resolvido) { cur._resolvido = true; cur.done(); }
            if (el >= tot + 8000) { cur = null; held = null; }
          } else {
            const d = cur; cur = null; held = null; d.done();
          }
        } else {
          f = frameAt(sn, el);
          const tint = cur.tint ? Math.sin(clamp(el / tot) * Math.PI) * (cur.tint === 'low' ? .28 : .5) * (cur.light ? .6 : 1) : 0;
          g.save(); g.translate(ancCx + vx, ancCy + vy);
          if (tint > 0.005) {   // clarao vermelho so no sprite (num canvas a parte: source-atop direto pintaria a sombra e os brilhos de baixo)
            if (!tcv) { tcv = document.createElement('canvas'); tcv.width = CELL_W; tcv.height = CELL_H; tg = tcv.getContext('2d'); }
            tg.globalCompositeOperation = 'copy'; tg.drawImage(fogoFrame(sn, f, clk()), 0, 0);
            tg.globalCompositeOperation = 'source-atop'; tg.globalAlpha = tint; tg.fillStyle = 'rgb(255,40,40)'; tg.fillRect(0, 0, CELL_W, CELL_H); tg.globalAlpha = 1;
            g.save(); g.globalAlpha = clamp(al); g.imageSmoothingEnabled = false; g.drawImage(tcv, -FEET_X * SCALE, -FEET_Y * SCALE, CELL_W * SCALE, CELL_H * SCALE); g.restore();
          } else drawSheet(g, sn, f, al, 0, 0, 0, 1);
          g.restore();
        }
      }
    } else if (!gone) {
      // sem ação ativa: mostrar idle quadro 0
      g.save(); g.translate(ancCx, ancCy); drawSheet(g, 'idle', 0, 1, 0, 0, 0, 1); g.restore();
    }

    renderFX(now);
    drawCortes(now);
    drawMode(ft, tm);
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, ge = host.shakeEl; if (ge) ge.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 1 * (1 - u)}px,${Math.cos(u * 50) * .8 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
    if (mark) drawMark(now);
  }

  // ── lançamento de ação ────────────────────────────────────────────────────
  function run(sheetName, opts){
    return new Promise(res => {
      if (cur) cur.done(false); held = null;
      const m = MAN && MAN[sheetName];
      const durs = m ? m.durs : [1000];
      const tot = durs.reduce((a, b) => a + b, 0);
      // guardar definições de eventos como [quadroIdx, 'nome']; converter em ms lazily no frame()
      const evDefs = opts.ev || [];
      cur = { sheet:sheetName, totalDur:tot, evDefs, evs:null, fired:0,
        hold:opts.hold||null, loop:!!opts.loop, front:!!opts.front,
        tint:opts.tint||null, light:!!opts.light, pxpy:!!opts.pxpy,
        start:clk(), done:ok => res(ok !== false), ...(opts.extra||{}) };
    });
  }
  // converte evDefs → evs (ms) quando MAN estiver disponível
  function ensureEvs(c){
    if (c.evs || !MAN || !c.evDefs) return;
    c.evs = c.evDefs.map(([idx, name]) => [msAt(c.sheet, idx), name]);
  }

  // ── API pública ───────────────────────────────────────────────────────────
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },

    async play(name, o = {}){
      if (o.tx != null) tgt = {x:o.tx, y:o.ty};

      if (name === 'tpIn'){
        await run('tpIn', {front:true, pxpy:true, ev:[[0,'smokeT']]});
        await run('slashV', {pxpy:true, ev:[[7,'strikeT']]});
        await run('tpOut', {pxpy:true, hold:'gone', ev:[[16,'smoke']]});
        held = {gone:true}; return true;
      }
      if (name === 'tpBack'){
        await run('tpIn', {ev:[[0,'smoke']]}); held = null; return true;
      }
      if (name === 'fireIn'){
        return new Promise(res => {
          if (cur) cur.done(false); held = null;
          cur = { _fireIn:true, sheet:'prep', totalDur:1600, evs:[], fired:0, loop:false, front:false,
            tint:null, light:false, pxpy:false, start:clk(), done:ok => res(ok !== false) };
          EV.omen();
        });
      }
      if (name === 'gagCast'){
        const sumDurs = MAN && MAN['summon'] ? MAN['summon'].durs : [];
        const tailMs2 = sumDurs.slice(9).reduce((a,b)=>a+b,0);
        return new Promise(res => {
          if (cur) cur.done(false); held = null;
          cur = { _gagCast:true, sheet:'summon', totalDur:3600, evs:[], fired:0, loop:false, front:false,
            tint:null, light:false, pxpy:false, start:clk(), done:ok => res(ok !== false) };
          EV.orb();
          setTimeout(() => EV.ring && EV.ring(), 1440 / tsc());
          setTimeout(() => EV.ring && EV.ring(), 2232 / tsc());
          setTimeout(() => EV.orb(), 2880 / tsc());
        });
      }
      if (name === 'gagLook'){
        return run('gagLook', {hold:'last'});
      }
      if (name === 'hurt'){
        const sheet = o.light ? 'hurtLight' : 'hurt';
        const p = run(sheet, {tint:true, light:!!o.light});
        p.then(ok => { if (ok) fireHit(); }); return p;
      }
      if (name === 'idle') return run('idle', {loop:true});

      // mapa de ações normais
      const MAP = {
        attack:    {sheet:'slashH',    ev:[[6,'wave:h']]},
        slashH:    {sheet:'slashH',    ev:[[6,'wave:h']]},
        slashV:    {sheet:'slashV',    ev:[[6,'wave:v']]},
        thrust:    {sheet:'thrust',    ev:[[4,'lance']]},
        summon:    {sheet:'summon',    ev:[[4,'orb'],[10,'orbThrow']]},
        aoe:       {sheet:'aoe',       ev:[[2,'charge'],[6,'nova']]},
        enrage:    {sheet:'enrage',    ev:[[1,'charge'],[5,'roar'],[7,'roar:2']]},
        phase2:    {sheet:'phase2',    ev:[[18,'roar'],[24,'roar:2']]},
        prep:      {sheet:'prep',      ev:[[1,'sigil'],[4,'charge']]},
        laugh:     {sheet:'laugh',     ev:[[3,'charge']]},
        die:       {sheet:'die',       hold:'gone', tint:'low', ev:[[1,'burst'],[7,'cacos'],[21,'slam'],[23,'embers'],[27,'embers']]},
        tpOut:     {sheet:'tpOut',     hold:'gone', ev:[[16,'smoke']]},
        gagDismiss:{sheet:'gagDismiss',ev:[]},
        awaken:    {sheet:'enrage',    ev:[[1,'omen'],[5,'slam'],[7,'embers']]},
      };
      const def = MAP[name]; if (!def) return Promise.resolve(false);
      const p = run(def.sheet, {ev:def.ev||[], hold:def.hold||null, tint:def.tint||null, light:!!o.light});
      p.then(ok => { if (ok) fireHit(); }); return p;
    },

    nextHit(){ return new Promise(r => hitW.push(r)); },
    idle(){ if (cur || held) return Promise.resolve(false); return run('idle', {loop:true}); },
    has(n){
      if (n === 'melee') return false;
      const names = ['attack','slashH','slashV','thrust','summon','aoe','enrage','phase2','prep','laugh','hurt','hurtLight','die','tpOut','tpIn','tpBack','fireIn','gagCast','gagLook','gagDismiss','awaken','idle'];
      return names.includes(n);
    },
    fx(name, o = {}){
      if (name === 'puff') {
        const n = o.n || 14, R = o.r || 60;
        for (let i = 0; i < n; i++) { const ox = rnd(-R, R), oy = rnd(-R * 1.4, R * .4), sp = rnd(.6, 1.2); E('smoke', 1100, u => ({x:o.x + ox * (.4 + u), y:o.y + oy - 40 * u * sp, r:lerp(R * .5, R * 1.1, eo(u)) * sp, a:.9 * Math.sin(Math.PI * Math.min(1, u * 1.05))}), {delay:i * 22}); }
        E('glow', 800, u => ({x:o.x, y:o.y - R * .4, r:lerp(R, R * 2.6, eo(u)), c:VIO, a:.5 * Math.sin(Math.PI * u)}));
      } else if (name === 'mark') mark = {x:o.x, y:o.y, t0:clk()};
      else if (name === 'unmark') mark = null;
    },
    setMode(m){ mode = m || null; },
    setDead(){},
    feet,
    reset(){
      if (cur) { const d = cur; cur = null; d.done(false); }
      fxl = []; held = null; mark = null; mode = null; hitW = [];
    },
  };
}
window.BossRig = {make};
})();
