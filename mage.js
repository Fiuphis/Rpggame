/* Banco de Dados I — RPG · Maga (v42)
   Poses de COSTAS recortadas da folha de fundo branco (mage3/*.png), todas na mesma escala e ancoradas no chão pelo mesmo ponto,
   trocadas com transição suave + movimento (deslocar, inclinar, respirar) e os efeitos originais da folha (mage3/fx_*.png).
   Só a Maga usa isto; os outros personagens continuam como imagem/sprite sheets. */
(() => {
'use strict';
const POSES = ['idle1','idle2','idle3','idle4','atk1','atk2','atk3','fire','water','air','earth','castdef','defmana','deffire','defwater','defair','defearth','dodge1','dodge2','dodge3','dodge4','bh1','bh2','walk2','run3'];
const FXS = ['comet','orbb','fire_fall','water_pillar','air_swirl','earth_spikes','rock','bh_small','bh_spikes','bh_big','bh_big2','bolt','cross','crystal','whirl','mana_aura','orb_red','orb_orange','orb_blue','star_big','star_small','rocks'];
const T = {x:517, y:340};                                    // alvo no chefe (design 1024x1536)
const BASE = 258;                                            // linha da barra do manto dentro do sprite 209x284
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3), ei = u => u * u * u;
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));

// ---- ações: steps [t, pose, {dx,dy,rot}] (interpolados) · ev [t, 'nome'|fn]
const ACT = {
  melee:{dur:1050, steps:[[0,'idle1'],[.12,'atk1',{dx:-4,rot:-2}],[.3,'atk2',{dx:-8,rot:-4}],[.48,'atk3',{dx:6,dy:-6,rot:3}],[.8,'atk3',{dx:2,rot:1}],[.96,'idle1']], ev:[[.47,'shot:orbb:1'],[.78,'hit:small']]},
  cast:{dur:1700, steps:[[0,'idle1'],[.1,'atk1',{dx:-4}],[.3,'atk2',{dx:-10,rot:-4}],[.52,'atk3',{dx:6,dy:-8,rot:3}],[.82,'atk3'],[.97,'idle1']], ev:[[.22,'charge'],[.52,'shot:orbb:1.5'],[.8,'hit:mana']]},
  heavy:{dur:2300, steps:[[0,'idle1'],[.1,'atk1',{dx:-6}],[.35,'atk2',{dx:-14,rot:-5}],[.55,'atk3',{dx:8,dy:-10,rot:4}],[.86,'atk3',{dx:2}],[.98,'idle1']], ev:[[.15,'charge'],[.3,'charge'],[.56,'shot:comet:1.9'],[.82,'hit:big']]},
  fire:{dur:1900, steps:[[0,'idle1'],[.1,'fire',{dx:-4}],[.8,'fire',{dx:2}],[.97,'idle1']], ev:[[.4,'shot:orb_red:.9'],[.5,'fire']]},
  water:{dur:1900, steps:[[0,'idle1'],[.1,'water',{dx:-4}],[.8,'water',{dx:2}],[.97,'idle1']], ev:[[.4,'shot:orb_blue:.9'],[.5,'water']]},
  air:{dur:1900, steps:[[0,'idle1'],[.1,'air',{dx:-4}],[.8,'air',{dx:2}],[.97,'idle1']], ev:[[.4,'shot:orbb:1'],[.5,'air']]},
  earth:{dur:1900, steps:[[0,'idle1'],[.1,'earth',{dx:-4}],[.8,'earth',{dx:2}],[.97,'idle1']], ev:[[.4,'shot:orb_orange:.9'],[.5,'earth']]},
  ult:{dur:4800, steps:[[0,'idle1'],[.08,'bh1',{dx:-4}],[.2,'bh1',{dy:-6,rot:-2}],[.28,'bh2',{dy:-10,rot:2}],[.8,'bh2',{dy:-8}],[.95,'idle1']], ev:[[.1,'charge'],[.26,'bhopen'],[.5,'bhbig'],[.72,'bhend']]},
  dodge:{dur:1050, steps:[[0,'idle1'],[.08,'dodge1',{dx:-6}],[.26,'dodge2',{dx:-40,dy:-4}],[.46,'dodge3',{dx:-56,dy:2}],[.66,'dodge4',{dx:-30}],[.88,'idle1']], ghost:true, ev:[]},
  hurt:{dur:750, steps:[[0,'idle1'],[.1,'idle3',{dx:-10,rot:-7}],[.32,'idle3',{dx:6,rot:-3}],[.55,'idle3',{dx:-2}],[.9,'idle1']], tint:true, ev:[]},
  pass:{dur:1600, steps:[[0,'idle1'],[.25,'idle2'],[.75,'idle3',{dy:2}],[.96,'idle1']], ev:[]},
  victory:{dur:2800, steps:[[0,'idle1'],[.1,'atk1'],[.26,'atk3',{dy:-12,rot:2}],[.4,'atk2',{dy:-3}],[.56,'atk3',{dy:-14,rot:-2}],[.8,'atk3',{dy:-4}],[.96,'idle1']], ev:[[.28,'cheer'],[.58,'cheer']]},
  guard:{dur:1900, steps:[], ev:[]},
};
ACT.holy = ACT.cast; ACT.super = ACT.heavy; ACT.aoe = ACT.heavy;
const ELEM = {'#ff7a2e':'fire', '#3db4ff':'water', '#9fe8d0':'air', '#c19a52':'earth'};
const GUARD = {fire:'deffire', water:'defwater', air:'defair', earth:'defearth', mana:'defmana'};
const IDLE_CYCLE = [['idle1', 1900], ['idle2', 1000], ['idle3', 1700], ['idle4', 1000]];
const IDLES = [   // idles extras ocasionais
  {dur:2600, steps:[[0,'idle1'],[.2,'idle4',{dx:3}],[.7,'idle4',{dx:3}],[.95,'idle1']], ev:[]},
  {dur:3000, steps:[[0,'idle1'],[.2,'idle3',{dx:-6,rot:-1.5}],[.55,'idle3',{dx:-6,rot:-1.5}],[.8,'idle2'],[.96,'idle1']], ev:[]},
];

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, front = layers.front, fc = front.getContext('2d');
  const cw = cv.width, ch = cv.height, OX = world.x - Px, OY = world.y - Py;      // canvas da Maga → coordenadas do design
  let M = null; const img = {}, fxm = {};
  const load = (k, src) => img[k] || (img[k] = Object.assign(new Image(), {src}));
  fetch('mage3/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => load(n, `mage3/${n}.png`)); FXS.forEach(n => load('fx_' + n, `mage3/fx_${n}.png`)); }).catch(() => {});
  let fxl = [], cur = null, shakeT = 0, flashT = 0, last = 0, t0 = clk(), running = false;
  let dead = 0, deadTarget = 0, prev = null, curPose = null, orbW = {x:world.x + 150, y:world.y + 60};
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;

  // ---- efeitos: E(nome, duração, u => estado)
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), add: o.add !== false});
  const orbPos = () => ({...orbW});
  const dir = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  function shot(name, size){                                          // projétil do orbe até o alvo
    const a = orbPos(), b = T, d = 380 + Math.hypot(b.x - a.x, b.y - a.y) * .55, ang = dir(a, b);
    E('fx_' + name, d, u => { const e = ei(u * .6 + .4 * u * u) * 0 + Math.pow(u, 1.6); return {x:lerp(a.x, b.x, e), y:lerp(a.y, b.y, e) - Math.sin(Math.PI * u) * 35, s:size * 1.8 * (.75 + .4 * u), rot:name === 'comet' ? ang + 1.57 : u * 6, a:u < .08 ? u / .08 : u > .93 ? (1 - u) / .07 : 1}; });
    if (Math.random() < 2) for (let i = 0; i < 6; i++) E('fx_star_small', 320, u => ({x:lerp(a.x, b.x, Math.pow(i / 6 * .9 + .05, 1.6) + u * .05), y:lerp(a.y, b.y, Math.pow(i / 6 * .9 + .05, 1.6)) - Math.sin(Math.PI * (i / 6 * .9 + .05)) * 60, s:.6 * (1 - u), a:1 - u}), {delay:i * d / 7});
  }
  function hit(kind){
    if (kind === 'small') { E('fx_star_big', 520, u => ({...T, s:lerp(.4, 1.1, eo(u)), a:u < .1 ? u / .1 : 1 - seg(u, .1, 1)})); }
    else if (kind === 'mana') { E('fx_star_big', 700, u => ({...T, s:lerp(.4, 1.7, eo(u)), a:u < .1 ? u / .1 : 1 - seg(u, .1, 1)})); E('fx_orb_blue', 600, u => ({...T, s:lerp(.5, 1.5, eo(u)), a:1 - u})); E('fx_cross', 500, u => ({...T, s:lerp(.4, 1.4, eo(u)), a:1 - u})); }
    else { E('fx_star_big', 900, u => ({...T, s:lerp(.5, 2.3, eo(u)), a:u < .08 ? u / .08 : 1 - seg(u, .08, 1)})); E('fx_mana_aura', 800, u => ({...T, s:lerp(.4, 2.2, eo(u)), a:(1 - u) * .9})); E('fx_cross', 650, u => ({...T, s:lerp(.4, 2, eo(u)), a:1 - u})); E('fx_crystal', 550, u => ({x:T.x, y:T.y - 20, s:lerp(.5, 1.8, eo(u)), a:1 - u}), {delay:80}); shakeT = clk(); }
  }
  const EV = {
    charge(){ const o = orbPos(); E('fx_orb_blue', 900, u => ({...orbPos(), s:lerp(.2, 1.1, eo(u)), a:u < .3 ? u / .3 : 1 - seg(u, .3, 1)}), {}); E('fx_star_small', 900, u => ({...orbPos(), s:.5 + u, rot:u * 3, a:1 - u})); },
    cheer(){ E('fx_star_big', 700, u => ({...orbPos(), s:lerp(.3, 1.2, eo(u)), a:1 - u})); E('fx_cross', 600, u => ({...orbPos(), s:lerp(.3, 1, eo(u)), a:1 - u})); for (let i = 0; i < 4; i++) E('fx_star_small', 800, u => ({x:orbPos().x + Math.cos(i * 1.7) * 50 * eo(u), y:orbPos().y + Math.sin(i * 1.7) * 40 * eo(u) - 20 * u, s:.7 * (1 - u), a:1 - u}), {delay:i * 90}); },
    fire(){ E('fx_fire_fall', 760, u => ({x:T.x, y:lerp(T.y - 360, T.y + 30, ei(u)), s:lerp(1.1, 1.5, u), a:u > .94 ? (1 - u) / .06 : 1})); E('fx_orb_orange', 700, u => ({x:T.x, y:T.y + 20, s:lerp(.4, 1.5, eo(u)), a:1 - u}), {delay:700}); E('fx_orb_red', 600, u => ({x:T.x, y:T.y + 20, s:lerp(.4, 1.5, eo(u)), a:1 - u}), {delay:720}); shakeT = clk() + 700; },
    water(){ E('fx_water_pillar', 1100, u => ({x:T.x, y:T.y + 90, s:1.4, sy:lerp(.15, 1, eo(Math.min(1, u * 2.2))), anchorB:1, a:u < .1 ? u / .1 : u > .7 ? (1 - u) / .3 : 1})); E('fx_orb_blue', 700, u => ({x:T.x, y:T.y - 20, s:lerp(.4, 2, eo(u)), a:1 - u}), {delay:350}); },
    air(){ E('fx_air_swirl', 1300, u => ({x:T.x, y:T.y, s:lerp(.6, 2.1, eo(Math.min(1, u * 1.5))), rot:u * 7, a:u < .1 ? u / .1 : u > .65 ? (1 - u) / .35 : 1})); E('fx_whirl', 1200, u => ({x:T.x, y:T.y, s:lerp(.5, 1.6, eo(u)), rot:-u * 6, a:(u < .15 ? u / .15 : 1 - seg(u, .15, 1)) * .8}), {delay:100}); },
    earth(){ E('fx_earth_spikes', 1100, u => ({x:T.x, y:T.y + 90, s:1.6, sy:lerp(.1, 1, eo(Math.min(1, u * 2.6))), anchorB:1, a:u > .72 ? (1 - u) / .28 : 1}), {add:false}); E('fx_rock', 700, u => ({x:T.x + 40, y:lerp(T.y - 300, T.y, ei(u)), s:1.6, rot:u * 5, a:u > .95 ? (1 - u) / .05 : 1}), {add:false, delay:150}); E('fx_rocks', 900, u => ({x:T.x, y:T.y + 30, s:lerp(.7, 1.6, eo(u)), a:1 - seg(u, .2, 1)}), {add:false, delay:820}); shakeT = clk() + 820; },
    bhopen(){ E('fx_bh_small', 3000, u => ({x:T.x, y:T.y, s:lerp(.12, .85, eo(Math.min(1, u * 2))), rot:u * 12, a:u < .08 ? u / .08 : u > .85 ? (1 - u) / .15 : 1})); flashT = clk(); },
    bhbig(){ E('fx_bh_big', 2300, u => ({x:T.x, y:T.y, s:lerp(.2, 1.05, eo(Math.min(1, u * 1.7))), rot:-u * 10, a:u < .1 ? u / .1 : u > .8 ? (1 - u) / .2 : 1})); E('fx_bh_spikes', 1500, u => ({x:T.x, y:T.y + 20, s:lerp(.3, 1.1, eo(Math.min(1, u * 2))), a:u < .12 ? u / .12 : 1 - seg(u, .5, 1)}), {delay:300}); shakeT = clk() + 300; },
    bhend(){ E('fx_bh_big2', 800, u => ({x:T.x, y:T.y, s:lerp(1.05, 1.5, eo(u)), rot:u * 6, a:1 - u})); E('fx_star_big', 800, u => ({x:T.x, y:T.y, s:lerp(.5, 2.2, eo(u)), a:1 - u})); flashT = clk(); },
  };
  function runEv(e){ if (typeof e === 'function') return e(); const [k, a, b] = e.split(':'); if (k === 'shot') shot(a, +b); else if (k === 'hit') hit(a); else if (EV[k]) EV[k](); }

  // ---- corpo
  function poseAt(a, pe){                                              // pose + transformações no instante pe
    const st = a.steps; let i = 0; while (i < st.length - 1 && pe >= st[i + 1][0]) i++;
    const A = st[i], B = st[Math.min(i + 1, st.length - 1)], u = A === B ? 1 : ease(clamp((pe - A[0]) / (B[0] - A[0])));
    const ta = A[2] || {}, tb = B[2] || {};
    return {pose:A[1], dx:lerp(ta.dx || 0, tb.dx || 0, u), dy:lerp(ta.dy || 0, tb.dy || 0, u), rot:lerp(ta.rot || 0, tb.rot || 0, u), since:(pe - A[0]) * a.dur, next:B[1], u};
  }
  function drawPose(name, dx, dy, rot, alpha, tm, tint){
    const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return null;
    const br = Math.sin(tm / 1000 * 2.2), fx = Px + W / 2 + dx, fy = Py + BASE + dy;
    c.save(); c.globalAlpha = alpha; c.translate(fx, fy); c.rotate(rot * Math.PI / 180); c.scale(1 - .004 * br, 1 + .010 * br);
    c.drawImage(im, -m.cx, -m.gy);
    if (tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,40,40,${tint})`; c.fillRect(-m.cx, -m.gy, m.w, m.h); }
    c.restore();
    if (m.orb) { const k = Math.cos(rot * Math.PI / 180), s = Math.sin(rot * Math.PI / 180), ox = m.orb[0] - m.cx, oy = m.orb[1] - m.gy; return {x:OX + fx + ox * k - oy * s, y:OY + fy + ox * s + oy * k}; }
    return null;
  }
  function frame(){
    if (!running) return; requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 16) return; last = now;
    if (!M) return;
    const tm = now - t0; let st, a = cur && cur.a, pe = 0, guard = cur && cur.guard;
    if (cur) {
      pe = (now - cur.start) / a.dur;
      if (guard) { const k = pe; st = {pose:k < .16 ? 'castdef' : guard, dx:0, dy:0, rot:0, since:(k < .16 ? k : k - .16) * a.dur, u:1}; if (k < .16 && guard !== 'defmana') st.pose = 'castdef'; }
      else st = poseAt(a, clamp(pe));
      const ev = a.ev || []; while (cur.fired < ev.length && pe >= ev[cur.fired][0]) runEv(ev[cur.fired++][1]);
      if (pe >= 1) { const d = cur; cur = null; d.done(); }
    } else {
      let t = tm % IDLE_CYCLE.reduce((s, b) => s + b[1], 0), n = 'idle1'; for (const [nm, d] of IDLE_CYCLE) { if (t < d) { n = nm; break; } t -= d; }
      st = {pose:n, dx:0, dy:0, rot:0, since:t};
    }
    // transição suave entre quadros (cross-fade curto)
    if (st.pose !== curPose) { prev = curPose ? {pose:curPose, dx:cur ? lastT.dx : 0, dy:lastT.dy, rot:lastT.rot} : null; curPose = st.pose; cur_t = now; fade = (cur ? 90 : 240); }
    lastT = st;
    const f = clamp((now - cur_t) / fade);
    dead += (deadTarget - dead) * .1;
    c.clearRect(0, 0, cw, ch); c.save(); c.translate(Px - host.P, Py - host.P); host.shadow(c); c.restore(); c.imageSmoothingEnabled = false;
    const dRot = -dead * 82, dDy = dead * 6, dAl = 1 - dead * .25;
    const tint = a && a.tint ? Math.sin(clamp(pe) * Math.PI) * .6 : 0;
    if (a && a.ghost) { const g = Math.sin(clamp(pe) * Math.PI); drawPose(st.pose, st.dx + 46 * g, st.dy, st.rot, .18 * g, tm); drawPose(st.pose, st.dx + 90 * g, st.dy, st.rot, .10 * g, tm); }
    if (prev && f < 1) drawPose(prev.pose, prev.dx, prev.dy, prev.rot, 1, tm, tint);
    const o = drawPose(st.pose, st.dx, st.dy + dDy, st.rot + dRot, (prev && f < 1 ? f : 1) * dAl, tm, tint);
    if (!o && M.poses[st.pose] && M.poses[st.pose].orb == null) {} else if (o) orbW = o;
    // ---- efeitos (camada da frente, coordenadas do design)
    fc.clearRect(0, 0, front.width, front.height);
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), im = img[e.name]; if (!ready(e.name) || !s) return true;
      const w = im.naturalWidth * (s.s || 1) * (s.sx || 1), h = im.naturalHeight * (s.s || 1) * (s.sy || 1);
      fc.save(); fc.globalAlpha = clamp(s.a == null ? 1 : s.a); fc.globalCompositeOperation = e.add ? 'lighter' : 'source-over'; fc.translate(s.x, s.y); if (s.rot) fc.rotate(s.rot);
      fc.drawImage(im, -w / 2, s.anchorB ? -h : -h / 2, w, h); fc.restore(); return true;
    });
    if (flashT && now >= flashT) { const u = (now - flashT) / 420; if (u < 1) { fc.save(); fc.fillStyle = `rgba(150,160,255,${.5 * (1 - u)})`; fc.fillRect(0, 0, front.width, front.height); fc.restore(); } else flashT = 0; }
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 4 * (1 - u)}px,${Math.cos(u * 50) * 3 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  let lastT = {dx:0, dy:0, rot:0}, cur_t = 0, fade = 240;
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); cur = {a, start: clk(), fired: 0, done: ok => res(ok !== false), ...extra}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (dead > .05) return Promise.resolve(false);
      if (name === 'cast' || name === 'holy') { const e = ELEM[(o.color || '').toLowerCase()]; return run(ACT[e || 'cast']); }
      if (name === 'guard') return run(ACT.guard, {guard: GUARD[ELEM[(o.color || '').toLowerCase()] || 'mana']});
      const a = ACT[name]; return a ? run(a) : Promise.resolve(false);
    },
    idle(){ if (cur) return Promise.resolve(false); return run(IDLES[Math.floor(Math.random() * IDLES.length)]); },
    has: n => !!ACT[n],
    setDead(d){ deadTarget = d ? 1 : 0; if (d) { if (cur) cur.done(false); cur = null; } else flashT = clk(); },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } fxl = []; deadTarget = 0; dead = 0; },
  };
}
window.MageRig = {make};
})();
