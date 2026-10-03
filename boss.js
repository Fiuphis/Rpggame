/* Banco de Dados I — RPG · Lorde das Trevas (v87)
   12 poses recortadas da folha (boss/B_*.png, tools/cut_boss.py) + efeitos desenhados em canvas.
   Habilidades: intro, Golpe Horizontal, Golpe Vertical, Invocação Demoníaca (mão), Estocada, Onda Sombria (AoE), Enfurecer,
   Preparando Habilidade, Teleporte (some / aparece atrás do herói), dano leve/pesado, morte e risada.
   O dano só entra quando o golpe chega no alvo: o app espera A.hit('boss') (fireHit). Alvo do golpe: opts {tx, ty} (coords do mundo 1024x1536). */
(() => {
'use strict';
const BASE = 589, SZ = 1.05, XOFF = 0;
const RED = '255,50,50', HOT = '255,150,100', VIO = '175,70,255', GOLD = '255,205,120', ORG = '255,150,50';
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3);
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));
const S = (d, steps, ev = [], o = {}) => ({dur:d, steps, ev, ...o});
const TK = ['dx','dy','rot','sc','al','px','py'];

const ACT = {
  attack:[S(1000, [[0,'B_1'],[.25,'B_8'],[.75,'B_8',{dy:-3}],[.98,'B_1']], [[.18,'charge']])],
  slashH:[
    S(1700, [[0,'B_1'],[.14,'B_8'],[.3,'B_3',{dx:10}],[.5,'B_3',{dx:14}],[.72,'B_2'],[.95,'B_1']], [[.26,'wave:h']]),
    S(1750, [[0,'B_2'],[.14,'B_8',{dx:-4}],[.3,'B_3',{dx:12}],[.52,'B_3',{dx:16}],[.74,'B_1'],[.95,'B_2']], [[.26,'wave:h:2']]),
  ],
  slashV:[
    S(1950, [[0,'B_2'],[.12,'B_8'],[.3,'B_4',{dy:-6}],[.44,'B_4',{dy:-9}],[.52,'B_3',{dy:3}],[.74,'B_2'],[.95,'B_1']], [[.38,'wave:v']]),
    S(2000, [[0,'B_1'],[.12,'B_8'],[.3,'B_4',{dy:-5}],[.46,'B_4',{dy:-10}],[.54,'B_3',{dy:3}],[.76,'B_1'],[.95,'B_2']], [[.4,'wave:v:2']]),
  ],
  summon:[S(2400, [[0,'B_1'],[.16,'B_6'],[.5,'B_6',{dy:-4}],[.6,'B_6',{dy:-2}],[.8,'B_2'],[.96,'B_1']], [[.16,'orb'],[.52,'orbThrow']])],
  thrust:[S(1700, [[0,'B_1'],[.14,'B_8'],[.32,'B_5',{dx:-14}],[.55,'B_5',{dx:-8}],[.78,'B_2'],[.96,'B_1']], [[.3,'lance']])],
  aoe:[S(2500, [[0,'B_1'],[.14,'B_8'],[.28,'B_7'],[.6,'B_7',{dy:-3}],[.82,'B_8'],[.97,'B_1']], [[.14,'charge'],[.26,'nova']])],
  enrage:[S(2800, [[0,'B_1'],[.14,'B_8'],[.3,'B_11'],[.48,'B_12',{dy:-4}],[.8,'B_12'],[.96,'B_11']], [[.1,'charge'],[.34,'roar'],[.55,'roar:2']])],
  prep:[S(2200, [[0,'B_1'],[.2,'B_8'],[.55,'B_8',{dy:-3}],[.95,'B_8']], [[.1,'sigil'],[.2,'charge']])],
  hurt:[
    S(850, [[0,'B_1'],[.12,'B_9',{dx:-8}],[.5,'B_9'],[.92,'B_1']], [], {tint:true}),
    S(900, [[0,'B_2'],[.12,'B_10',{dx:-10,rot:-2}],[.5,'B_10'],[.92,'B_2']], [], {tint:true}),
  ],
  die:[S(4200, [[0,'B_1'],[.08,'B_9',{dx:-10}],[.26,'B_10',{dy:2}],[.5,'B_10',{dy:12,rot:3}],[.95,'B_10',{dy:30,rot:5,al:0}]], [[.08,'burst'],[.3,'embers'],[.5,'embers']], {tint:'low', hold:'gone'})],
  laugh:[S(2800, [[0,'B_1'],[.1,'B_11',{dy:-5}],[.2,'B_2'],[.3,'B_11',{dy:-5}],[.4,'B_2'],[.5,'B_11',{dy:-5}],[.6,'B_2'],[.92,'B_1']], [[.1,'charge']])],
  tpOut:[S(1300, [[0,'B_1'],[.2,'B_8'],[.5,'B_8',{dy:-8,al:.6}],[.95,'B_8',{dy:-22,al:0}]], [[.18,'smoke']], {hold:'gone'})],
  tpIn:[S(2000, [[0,'B_8',{px:1,py:1,al:0,sc:.5}],[.16,'B_8',{px:1,py:1,al:.95,sc:.54}],[.34,'B_3',{px:1,py:1,al:1,sc:.58}],[.6,'B_3',{px:1,py:1,al:1,sc:.58}],[.8,'B_8',{px:1,py:1,al:.5,sc:.54}],[.95,'B_8',{px:1,py:1,al:0,sc:.5}]], [[.02,'smokeT'],[.36,'strikeT'],[.82,'smokeT']], {hold:'gone', front:true})],
  tpBack:[S(1100, [[0,'B_8',{dy:-22,al:0}],[.5,'B_8',{dy:-6,al:1}],[.9,'B_1']], [[.04,'smoke']])],
};
const IDLES = [
  S(4200, [[0,'B_1'],[.3,'B_2'],[.7,'B_2'],[.95,'B_1']]),
  S(3600, [[0,'B_1'],[.3,'B_8'],[.65,'B_8'],[.95,'B_1']]),
  S(3200, [[0,'B_1'],[.3,'B_2'],[.6,'B_1'],[.95,'B_1']]),
];
IDLES.forEach(a => { a.dur = Math.round(a.dur * 1.4); });
const BASE_POSE = {n:'B_1', charge:'B_8', rage:'B_11', orange:'B_1'};
const bags = new WeakMap();
const variant = v => { if (!Array.isArray(v)) return v; if (window.__vi != null) return v[window.__vi % v.length]; let b = bags.get(v); if (!b || !b.l.length) { const l = v.map((_, i) => i); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } if (b && l.length > 1 && l[0] === b.last) [l[0], l[l.length - 1]] = [l[l.length - 1], l[0]]; b = {l, last:b ? b.last : -1}; bags.set(v, b); } const i = b.l.shift(); b.last = i; return v[i]; };
const POSES = (() => { const s = new Set(); const add = a => (a.steps || a).forEach(p => s.add(p[1])); Object.values(ACT).forEach(v => v.forEach(add)); IDLES.forEach(add); Object.values(BASE_POSE).forEach(p => s.add(p)); return [...s]; })();

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
function smokeBlob(g, x, y, r, a, col){      // fumaça escura (source-over): violeta/vermelho escuro
  if (a <= .005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${col},${clamp(a)})`); gr.addColorStop(.55, `rgba(${col},${clamp(a * .55)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, front = layers.front, fc = front.getContext('2d'), back = layers.back, bc = back.getContext('2d');
  let backUsed = false;
  const cw = cv.width, ch = cv.height;
  let M = null; const img = {};
  fetch('boss/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => { img[n] = Object.assign(new Image(), {src:`boss/${n}.png`}); }); }).catch(() => {});
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); };
  let fxl = [], cur = null, shakeT = 0, last = 0, t0 = clk(), running = false, mode = null, held = null, tgt = {x:512, y:1000}, mark = null;
  let prev = null, curPose = null, lastT = {dx:0, dy:0, rot:0, sc:1, al:1}, cur_t = 0, fade = 240;
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), bk: !!o.back});
  const feet = () => ({x:world.x + W / 2 + XOFF, y:world.y + BASE});
  const hand = () => { const f = feet(); return {x:f.x + 105, y:f.y - 535}; };        // mão erguida (Invocação)
  const swordH = () => { const f = feet(); return {x:f.x + 300, y:f.y - 310}; };      // ponta da espada no golpe horizontal
  const swordT = () => { const f = feet(); return {x:f.x - 250, y:f.y - 400}; };      // ponta da espada na estocada
  const baseP = () => BASE_POSE[mode] || BASE_POSE.n;
  const tsc = () => (window.__ts == null ? 1 : window.__ts);

  function hitFx(x, y, big){            // impacto vermelho no alvo
    const bl = (r, col, a, dl = 0, d = 650) => E('glow', d, u => ({x, y, r:r * (.4 + eo(u) * .9), c:col, a:a * (1 - u) * (u < .08 ? u / .08 : 1)}), {delay:dl});
    bl(big ? 190 : 130, RED, .95, 0, 800); bl(big ? 110 : 80, '255,230,220', .9, 0, 450);
    E('ring', 700, u => ({x, y:y + 90, r:lerp(40, big ? 170 : 120, eo(u)), c:RED, a:.8 * (1 - u)}));
    for (let i = 0; i < (big ? 14 : 8); i++) { const an = rnd(0, 6.28), s = rnd(.5, 1) * (big ? 190 : 130); E('glow', 600, u => ({x:x + Math.cos(an) * s * eo(u), y:y + Math.sin(an) * s * eo(u) + 50 * u * u, r:13 * (1 - u * .6), c:HOT, a:.9 * (1 - u)}), {delay:i * 14}); }
    if (big) shakeT = clk();
  }
  function fly(a, b, d, o){              // projétil/onda de a até b (devolve duração); no fim: impacto + fireHit
    const path = u => ({x:lerp(a.x, b.x, u), y:lerp(a.y, b.y, u) - (o.arc || 0) * Math.sin(Math.PI * u)});
    const fd = u => u < .1 ? u / .1 : u > .94 ? (1 - u) / .06 : 1;
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:(o.r || 56) * (.7 + .4 * u), c:o.col || RED, a:.8 * fd(u)}; });
    E('streak', d, u => { const p = path(u), q = path(Math.min(1, u + .04)); return {x:p.x, y:p.y, ang:o.ang != null ? o.ang : Math.atan2(q.y - p.y, q.x - p.x), len:o.len || 200, th:o.th || 28, c:o.sc || HOT, a:.9 * fd(u)}; });
    if (o.cross) E('streak', d, u => { const p = path(u); return {x:p.x, y:p.y, ang:o.ang2, len:o.len * .8, th:o.th * .8, c:RED, a:.7 * fd(u)}; });
    for (let i = 1; i <= 8; i++) { const ut = i / 9, p = path(ut); E('glow', 450, v => ({x:p.x, y:p.y + 8 * v, r:40 * (1 - v * .6), c:o.col || RED, a:.4 * (1 - v)}), {delay:ut * d}); }
    setTimeout(() => { hitFx(b.x, b.y, o.big); fireHit(); }, d / tsc());
    return d;
  }
  const EV = {
    charge(){ const f = feet(); E('ring', 1000, u => ({x:f.x, y:f.y - 6, r:lerp(60, 260, eo(u)), c:RED, a:.8 * (1 - u)}));
      E('glow', 1200, u => ({x:f.x, y:f.y - 260, r:lerp(150, 330, eo(u)), c:RED, a:.5 * Math.sin(Math.PI * u)}), {back:true});
      for (let i = 0; i < 10; i++) { const ox = rnd(-260, 260); E('glow', 900, u => ({x:f.x + ox, y:f.y - 30 - 360 * eo(u), r:16, c:HOT, a:.8 * Math.sin(Math.PI * u)}), {delay:i * 60}); } },
    wave(k){ const o = swordH(), b = tgt;
      if (k === 'v') { const a = {x:b.x + rnd(-30, 30), y:b.y - 700}; fly(a, b, 480, {ang:Math.PI / 2, len:300, th:34, r:70, big:false}); }
      else fly(o, b, 640, {len:300, th:30, r:60, arc:60, cross:true, ang2:Math.atan2(b.y - o.y, b.x - o.x) + .9}); },
    orb(){ const h = hand(); E('orb', 1000, u => ({x:h.x, y:h.y, r:lerp(10, 82, eo(u)), a:u < .1 ? u / .1 : 1}));
      E('ring', 900, u => ({x:h.x, y:h.y + 40, r:lerp(30, 140, eo(u)), c:VIO, a:.6 * (1 - u)})); },
    orbThrow(){ const h = hand(), b = tgt, d = 620;
      E('orb', d, u => ({x:lerp(h.x, b.x, eo(u) * .5 + u * .5), y:lerp(h.y, b.y, u * u * .4 + u * .6), r:82 * (1 - .25 * u), a:1 - seg(u, .9, 1)}));
      E('glow', d, u => ({x:lerp(h.x, b.x, eo(u) * .5 + u * .5), y:lerp(h.y, b.y, u * u * .4 + u * .6), r:130, c:RED, a:.5}));
      setTimeout(() => { hitFx(b.x, b.y, true); E('ring', 900, u => ({x:b.x, y:b.y + 90, r:lerp(60, 220, eo(u)), c:VIO, a:.7 * (1 - u)})); fireHit(); }, d / tsc()); },
    lance(){ const o = swordT(), b = tgt; fly(o, b, 380, {len:420, th:18, r:44, sc:'255,210,190'}); },
    nova(){ const f = feet(), y0 = 1075, d = 520;
      E('glow', 900, u => ({x:f.x, y:f.y - 250, r:lerp(120, 420, eo(u)), c:RED, a:.8 * (1 - u)}));
      for (let k = 0; k < 3; k++) E('ring', 1100, u => ({x:f.x, y:y0, r:lerp(60, 640, eo(u)), c:k === 1 ? HOT : RED, a:.8 * (1 - u)}), {delay:k * 150});
      for (let i = 0; i < 17; i++) { const x = 40 + i * 60, dl = Math.abs(x - f.x) / 640 * 330;
        E('streak', 700, u => ({x, y:y0 - 120 * Math.sin(Math.PI * Math.min(1, u * 1.15)) - 20, ang:-Math.PI / 2, len:260 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 30, th:20, c:RED, a:.85 * (1 - seg(u, .6, 1))}), {delay:dl});
        E('glow', 700, u => ({x, y:y0 - 30, r:44 * (1 - u * .5), c:HOT, a:.6 * (1 - u)}), {delay:dl}); }
      shakeT = clk(); setTimeout(fireHit, d / tsc()); },
    roar(k){ const f = feet(), n = k === '2' ? 2 : 1;
      E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(60, 200 + 90 * n, eo(u)), c:RED, a:.85 * (1 - u)}));
      E('glow', 1300, u => ({x:f.x, y:f.y - 280, r:lerp(120, 360 + 60 * n, eo(u)), c:RED, a:.6 * Math.sin(Math.PI * u)}));
      for (let i = 0; i < 10; i++) { const ox = rnd(-240, 240); E('glow', 1000, u => ({x:f.x + ox, y:f.y - 30 - 400 * eo(u), r:18, c:'255,90,60', a:.8 * Math.sin(Math.PI * u)}), {delay:i * 60}); }
      shakeT = clk(); if (n === 2) setTimeout(fireHit, 200 / tsc()); },
    sigil(){ const f = feet(); E('sigil', 2400, u => ({x:f.x, y:f.y - 6, r:lerp(120, 300, eo(Math.min(1, u * 2))), rot:u * 2, a:Math.sin(Math.PI * Math.min(1, u * 1.05)) * .85}), {back:true}); },
    smoke(){ const f = feet(); for (let i = 0; i < 16; i++) { const ox = rnd(-190, 190), oy = rnd(-520, -40), sp = rnd(.6, 1.3); E('smoke', 1300, u => ({x:f.x + ox * (.4 + u * .8), y:f.y + oy - 70 * u * sp, r:lerp(70, 150, eo(u)) * sp, a:.85 * Math.sin(Math.PI * Math.min(1, u * 1.05))}), {delay:i * 35}); }
      E('glow', 900, u => ({x:f.x, y:f.y - 280, r:lerp(120, 300, eo(u)), c:VIO, a:.45 * Math.sin(Math.PI * u)})); },
    smokeT(){ const b = tgt; for (let i = 0; i < 12; i++) { const ox = rnd(-90, 90), oy = rnd(-300, 30), sp = rnd(.6, 1.2); E('smoke', 1000, u => ({x:b.x + ox, y:b.y + 90 + oy - 40 * u, r:lerp(40, 90, eo(u)) * sp, a:.8 * Math.sin(Math.PI * Math.min(1, u * 1.05))}), {delay:i * 28}); } },
    strikeT(){ const b = tgt; E('streak', 480, u => ({x:b.x, y:b.y - 20, ang:-.6, len:360 * (.5 + eo(u) * .7), th:30, c:HOT, a:.9 * (1 - u)}));
      E('streak', 480, u => ({x:b.x, y:b.y - 20, ang:.6, len:300 * (.5 + eo(u) * .7), th:26, c:RED, a:.9 * (1 - u)}), {delay:40}); hitFx(b.x, b.y + 20, false); fireHit(); },
    burst(){ const f = feet(); E('glow', 1000, u => ({x:f.x, y:f.y - 250, r:lerp(100, 420, eo(u)), c:RED, a:.9 * (1 - u)})); E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(60, 340, eo(u)), c:RED, a:.8 * (1 - u)})); shakeT = clk(); },
    embers(){ const f = feet(); for (let i = 0; i < 22; i++) { const ox = rnd(-230, 230), oy = rnd(-420, -40); E('glow', 1700, u => ({x:f.x + ox + 30 * Math.sin(u * 6 + i), y:f.y + oy - 300 * eo(u), r:15 * (1 - u * .5), c:HOT, a:.85 * Math.sin(Math.PI * u)}), {delay:i * 70}); } },
  };
  function runEv(e){ const [k, a, b] = e.split(':'); if (EV[k]) EV[k](a, b); }

  function poseAt(a, pe){
    const st = a.steps; let i = 0; while (i < st.length - 1 && pe >= st[i + 1][0]) i++;
    const A = st[i], B = st[Math.min(i + 1, st.length - 1)], u = A === B ? 1 : ease(clamp((pe - A[0]) / (B[0] - A[0])));
    const ta = A[2] || {}, tb = B[2] || {}, o = {pose:A[1]};
    TK.forEach(k => { const d0 = k === 'sc' || k === 'al' ? 1 : 0; o[k] = lerp(ta[k] != null ? ta[k] : d0, tb[k] != null ? tb[k] : d0, u); });
    return o;
  }
const EYES = {B_1:[[351,107],[381,108]],B_2:[[322,106],[351,110]],B_3:[[263,102],[291,100]],B_4:[[307,249],[332,248]],B_5:[[426,97],[453,95]],B_6:[[296,200],[326,200]],B_7:[[338,135],[367,136]],B_8:[[381,98],[411,98]],B_10:[[345,119]],B_11:[[350,155],[377,156]],B_12:[[369,130],[404,130]]};
  function drawPose(g, name, o, tm, tint, ox, oy){
    const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return;
    const br = Math.sin(tm / 1000 * 1.8) * (o.breathe == null ? 1 : o.breathe), sc = SZ * (o.sc || 1);
    g.save(); g.globalAlpha = clamp(o.al == null ? 1 : o.al); g.translate(ox + (o.dx || 0), oy + (o.dy || 0)); g.rotate((o.rot || 0) * Math.PI / 180); g.scale(sc * (1 - .004 * br), sc * (1 + .008 * br));
    g.drawImage(im, -m.cx, -m.gy);
    const ey = EYES[name]; if (ey && !(tint && tint > 0.2)) { let r = 0; try { r = window.BD_RAGE ? clamp(window.BD_RAGE()) : 0; } catch (e) {} const p = .78 + .22 * Math.sin(tm / 1000 * (4 + r * 8)), a = (.14 + .86 * r) * p, rad = 6 + 14 * r;
      g.globalCompositeOperation = 'lighter'; for (const [x, y] of ey) { const X = x - m.cx, Y = y - m.gy, gr = g.createRadialGradient(X, Y, 0, X, Y, rad); gr.addColorStop(0, `rgba(255,70,50,${.85 * a})`); gr.addColorStop(.35, `rgba(255,40,30,${.35 * a})`); gr.addColorStop(1, 'rgba(255,30,20,0)'); g.fillStyle = gr; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2); g.fillStyle = `rgba(255,170,140,${Math.min(1, .25 + a)})`; g.fillRect(X - 2, Y - 1.5, 4, 3); }
      g.globalCompositeOperation = 'source-over'; }
    if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(255,40,40,${tint})`; g.fillRect(-m.cx, -m.gy, m.w, m.h); }
    g.restore();
  }
  function frame(){
    if (!running) return; requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 16) return; last = now;
    if (!M) return;
    const tm = now - t0; let st, a = cur && cur.a, pe = 0;
    if (cur) {
      pe = (now - cur.start) / a.dur; st = poseAt(a, clamp(pe));
      const ev = a.ev || []; while (cur.fired < ev.length && pe >= ev[cur.fired][0]) runEv(ev[cur.fired++][1]);
      if (pe >= 1) { const d = cur; cur = null; if (d.a.hold) held = {pose:st.pose, al:0}; d.done(); }
    } else if (held) st = {pose:held.pose, dx:0, dy:0, rot:0, sc:1, al:held.al, px:0, py:0};
    else st = {pose:baseP(), dx:0, dy:0, rot:0, sc:1, al:1, px:0, py:0};
    if (st.pose !== curPose) { prev = curPose ? {...lastT, pose:curPose} : null; curPose = st.pose; cur_t = now; fade = cur ? 110 : 240; }
    lastT = st;
    const f = clamp((now - cur_t) / fade), ft = feet();
    c.clearRect(0, 0, cw, ch);
    const alive = !(held && !cur);
    const onFront = !!(a && a.front);
    if (alive && !onFront && (st.al == null || st.al > .15)) { c.save(); c.translate(Px - host.P, Py - host.P + (BASE - (Hh - 4))); c.globalAlpha = clamp(st.al == null ? 1 : st.al); host.shadow(c); c.restore(); }
    c.imageSmoothingEnabled = true;
    const tint = a && a.tint ? Math.sin(clamp(pe) * Math.PI) * (a.tint === 'low' ? .28 : .5) * (cur && cur.light ? .6 : 1) : 0;
    fc.clearRect(0, 0, front.width, front.height);
    if (backUsed) { bc.clearRect(0, 0, back.width, back.height); backUsed = false; }
    if (alive || cur) {
      const g = onFront ? bc : c; if (onFront) backUsed = true; const bx = onFront ? ft.x : Px + W / 2 + XOFF, by = onFront ? ft.y : Py + BASE;
      const vx = onFront ? (tgt.x + 70 - ft.x) : 0, vy = onFront ? (tgt.y + 70 - ft.y) : 0;
      const ps = o2 => ({...o2, dx:(o2.dx || 0) + (o2.px || 0) * vx, dy:(o2.dy || 0) + (o2.py || 0) * vy, breathe:onFront ? 0 : 1});
      if (prev && f < 1) drawPose(g, prev.pose, ps(prev), tm, tint, bx, by);
      drawPose(g, st.pose, ps({...st, al:(st.al == null ? 1 : st.al) * (prev && f < 1 ? f : 1)}), tm, tint, bx, by);
    }
    if (!held || cur) {
      if (mode === 'charge') { glow(bc, ft.x, ft.y - 260, 300 + 20 * Math.sin(tm / 220), RED, .34 + .1 * Math.sin(tm / 180)); backUsed = true; }
      else if (mode === 'rage') { glow(bc, ft.x, ft.y - 260, 340 + 24 * Math.sin(tm / 240), RED, .38 + .1 * Math.sin(tm / 200)); backUsed = true; }
      else if (mode === 'orange') { glow(bc, ft.x, ft.y - 260, 300, ORG, .22 + .06 * Math.sin(tm / 240)); backUsed = true; }
    }
    if (mark) { const u = (now - mark.t0) / 1000, ps = .75 + .25 * Math.sin(u * 7); fc.save(); fc.translate(mark.x, mark.y); fc.scale(1, .3); fc.globalCompositeOperation = 'lighter'; fc.lineWidth = 9; fc.strokeStyle = `rgba(${RED},${.85 * ps})`; fc.shadowColor = `rgba(${RED},.95)`; fc.shadowBlur = 26; fc.beginPath(); fc.arc(0, 0, 105 + 12 * ps, 0, 6.2832); fc.stroke(); fc.beginPath(); fc.arc(0, 0, 62, 0, 6.2832); fc.stroke(); fc.restore();
      glow(fc, mark.x, mark.y - 30, 120, RED, .25 * ps); }
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), g = e.bk ? bc : fc; if (e.bk) backUsed = true;
      if (!s) return true;
      if (e.name === 'glow') glow(g, s.x, s.y, s.r, s.c, s.a);
      else if (e.name === 'streak') streak(g, s.x, s.y, s.ang, s.len, s.th, s.c, s.a);
      else if (e.name === 'ring') { g.save(); g.translate(s.x, s.y); g.scale(1, .3); g.globalCompositeOperation = 'lighter'; g.lineWidth = 10; g.strokeStyle = `rgba(${s.c},${clamp(s.a * .7)})`; g.shadowColor = `rgba(${s.c},.9)`; g.shadowBlur = 30; g.beginPath(); g.arc(0, 0, s.r, 0, 6.2832); g.stroke(); g.restore(); }
      else if (e.name === 'smoke') smokeBlob(g, s.x, s.y, s.r, s.a, '38,6,52');
      else if (e.name === 'orb') { glow(g, s.x, s.y, s.r * 2.1, RED, .35 * s.a); smokeBlob(g, s.x, s.y, s.r * 1.15, clamp(s.a), '10,0,14'); smokeBlob(g, s.x, s.y, s.r * .8, clamp(s.a), '0,0,0'); glow(g, s.x, s.y, s.r * 1.5, VIO, .18 * s.a); }
      else if (e.name === 'sigil') { g.save(); g.translate(s.x, s.y); g.scale(1, .28); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${RED},${s.a})`; g.shadowColor = `rgba(${RED},1)`; g.shadowBlur = 24; g.lineWidth = 8;
        g.beginPath(); g.arc(0, 0, s.r, 0, 6.2832); g.stroke(); g.lineWidth = 5; g.beginPath(); g.arc(0, 0, s.r * .72, 0, 6.2832); g.stroke();
        g.rotate(s.rot); g.beginPath(); for (let i = 0; i < 5; i++) { const an = i * 4 * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(an) * s.r * .72, Math.sin(an) * s.r * .72); } g.closePath(); g.stroke(); g.restore(); }
      return true;
    });
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 1 * (1 - u)}px,${Math.cos(u * 50) * .8 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); held = null; cur = {a, start: clk(), fired: 0, done: ok => res(ok !== false), ...extra}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (o.tx != null) tgt = {x:o.tx, y:o.ty};
      const a = variant(ACT[name]); if (!a) return Promise.resolve(false);
      const p = run(a, {light:!!o.light}); p.then(ok => { if (ok) fireHit(); }); return p;
    },
    nextHit(){ return new Promise(r => hitW.push(r)); },
    idle(){ if (cur || held) return Promise.resolve(false); return run(variant(IDLES)); },
    has: n => !!ACT[n],
    fx(name, o = {}){ if (name === 'mark') mark = {x:o.x, y:o.y, t0:clk()}; else if (name === 'unmark') mark = null; },
    setMode(m){ mode = m || null; },
    setDead(){},
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } fxl = []; held = null; mark = null; mode = null; hitW = []; },
  };
}
window.BossRig = {make};
})();
