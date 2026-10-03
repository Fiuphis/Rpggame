/* Banco de Dados I — RPG · Maga (v41)
   Quadros de COSTAS recortados das folhas de referência (mage2: p_ = personagem; e_ e g_ = efeitos), trocados com transição suave,
   deformados por linhas (respiração, manto, chapéu) e acompanhados dos efeitos originais: giro de cajado, golpes, elementos, escudos, buraco negro.
   Só a Maga usa isto; os outros personagens continuam como imagem/sprite sheets. */
(() => {
'use strict';
const Y0 = [55, 262, 468, 682, 848];                                  // topo de cada linha da folha (para achar efeitos por coordenada)
const T = {x:517, y:330};                                             // alvo no chefe (design 1024x1536)
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
function kf(t, keys){
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, a] = keys[i-1], [t1, b] = keys[i], u = ease((t - t0) / (t1 - t0)), o = {};
    for (const k in {...a, ...b}) o[k] = lerp(a[k] || 0, b[k] || 0, u); return o;
  }
  return keys[keys.length-1][1];
}
// ---- quadros: nome do personagem na folha + efeitos (por coordenada na folha: [linha, x, y_relativo_da_linha])
const F = (r, x, y, add) => ({r, x, y: y + Y0[r], add});
const IDLE = 'p_0_0';
const A = {   // ‘s’ = passos [tempo(0-1), pose, [efeitos]]
  melee:{dur:1150, s:[[0, 'p_0_0'], [.1, 'p_3_6', [F(3, 827, 57)]], [.3, 'p_3_7', [F(3, 961, 75)]], [.48, 'p_3_8', [F(3, 1083, 58)]], [.62, 'p_3_9', [F(3, 1480, 67)]], [.84, 'p_0_1']],
    keys:[[0,{}],[.3,{lean:-5}],[.5,{lean:8,rise:4}],[1,{}]], hit:.56, fly:null, imp:[['burst2']]},
  cast:{dur:1700, s:[[0, 'p_0_0'], [.1, 'p_0_3'], [.28, 'p_0_4'], [.46, 'p_0_5', [F(0, 843, 65, 1)]], [.8, 'p_0_1']],
    keys:[[0,{}],[.25,{lean:-4}],[.46,{lean:-6,rise:3}],[.56,{lean:8}],[1,{}]], proj:{t:.5, fx:F(0, 843, 65, 1), arc:80, d:520}, imp:[F(0, 958, 75, 1)], impT:.78},
  fire:{dur:1900, s:[[0, 'p_0_0'], [.08, 'p_0_6', [F(0, 1127, 25)]], [.28, 'p_0_7', [F(0, 1207, 38, 1)]], [.44, 'p_0_8', [F(0, 1270, 45)]], [.6, 'p_0_9'], [.9, 'p_0_1']],
    keys:[[0,{}],[.3,{lean:-4}],[.5,{lean:6}],[1,{}]], proj:{t:.55, fx:F(0, 1352, 80, 1), arc:100, d:560}, imp:[F(0, 1495, 90, 1)], impT:.8},
  water:{dur:1900, s:[[0, 'p_0_0'], [.08, 'p_1_0'], [.24, 'p_1_1', [F(1, 205, 75)]], [.42, 'p_1_2', [F(1, 340, 65, 1)]], [.58, 'p_1_3', [F(1, 480, 75)]], [.9, 'p_0_1']],
    keys:[[0,{}],[.3,{lean:-4}],[.5,{lean:6}],[1,{}]], proj:{t:.5, fx:F(1, 340, 65, 1), arc:90, d:560}, imp:[F(1, 480, 75, 1)], impT:.8},
  air:{dur:1900, s:[[0, 'p_0_0'], [.08, 'p_1_4'], [.28, 'p_1_5', [F(1, 650, 45), F(1, 655, 110)]], [.5, 'p_1_6', [F(1, 800, 70)]], [.9, 'p_0_1']],
    keys:[[0,{}],[.3,{lean:-4}],[.55,{lean:7}],[1,{}]], proj:{t:.55, fx:F(1, 950, 95), arc:70, d:560, spin:1}, imp:[F(1, 950, 95)], impT:.8},
  earth:{dur:1900, s:[[0, 'p_0_0'], [.08, 'p_1_7'], [.3, 'p_1_8', [F(1, 1237, 68)]], [.5, 'p_1_9', [F(1, 1312, 45), F(1, 1333, 70)]], [.9, 'p_0_1']],
    keys:[[0,{}],[.3,{lean:-4}],[.55,{lean:6}],[1,{}]], proj:{t:.55, pose:'p_1_10', arc:90, d:600, spin:1}, imp:[], impPose:'p_1_10', impT:.8},
  heavy:{dur:2300, s:[[0, 'p_0_0'], [.06, 'p_3_4', [F(3, 584, 56)]], [.24, 'p_3_5', [F(3, 727, 42)]], [.4, 'p_3_6', [F(3, 827, 57)]], [.56, 'p_0_5', [F(0, 843, 65, 1)]], [.84, 'p_0_1']],
    keys:[[0,{}],[.25,{lean:-6,rise:6}],[.42,{lean:-8,rise:10}],[.56,{lean:10}],[1,{}]], proj:{t:.58, fx:F(0, 843, 65, 1), arc:130, d:560, big:1.7}, imp:[F(0, 958, 75, 1)], impT:.84, shake:true},
  ult:{dur:4600, s:[[0, 'p_0_0'], [.05, 'p_4_0'], [.16, 'p_4_1', [F(4, 192, 32)]], [.3, 'p_4_2', [F(4, 346, 56)]], [.46, 'p_4_3', [F(4, 500, 74)]], [.78, 'p_4_1'], [.92, 'p_0_1']],
    keys:[[0,{}],[.15,{lean:-4}],[.46,{lean:-2,rise:6}],[.7,{lean:4}],[1,{}]], hole:{t:.5, d:2300}, imp:[F(4, 854, 83, 1)], impT:.8, shake:true, flash:.5},
  guard:{dur:1900, g:true, keys:[[0,{}],[.15,{squash:.02}],[1,{}]]},
  dodge:{dur:1000, s:[[0, 'p_3_0'], [.1, 'p_3_1', [F(3, 122, 62, 1)]], [.3, 'p_3_2', [F(3, 256, 60, 1)]], [.5, 'p_3_3', [F(3, 364, 65, 1)]], [.75, 'p_3_0'], [.9, 'p_0_0']],
    keys:[[0,{}],[.15,{dx:-10}],[.35,{dx:-40}],[.55,{dx:-52}],[.8,{dx:-20}],[1,{}]], ghost:true},
  hurt:{dur:750, s:[[0, 'p_0_0'], [.1, 'p_3_0'], [.55, 'p_3_0'], [.8, 'p_0_0']], keys:[[0,{}],[.12,{lean:-10,rise:-4,tint:1,dx:-8}],[.3,{tint:.7,dx:6}],[.5,{tint:.3,dx:-2}],[1,{}]]},
  pass:{dur:1500, s:[[0, 'p_0_0'], [.2, 'p_0_1', [F(0, 167, 92), F(0, 255, 82)]], [.8, 'p_0_2', [F(0, 312, 98)]], [.95, 'p_0_0']], keys:[[0,{}],[.4,{squash:.06,lean:-4}],[.7,{squash:.06,lean:-4}],[1,{}]]},
  victory:{dur:2700, s:[[0, 'p_0_0'], [.1, 'p_3_4', [F(3, 584, 56)]], [.3, 'p_3_5', [F(3, 727, 42)]], [.5, 'p_3_6', [F(3, 827, 57)]], [.72, 'p_3_4', [F(3, 584, 56)]], [.92, 'p_0_1']],
    keys:[[0,{}],[.1,{squash:.06}],[.3,{rise:30,lean:-3}],[.45,{squash:.04}],[.62,{rise:36,lean:3}],[.8,{rise:6}],[1,{}]]},
};
A.holy = A.cast; A.super = A.heavy; A.aoe = A.heavy;
const ELEM = {'#ff7a2e':'fire', '#3db4ff':'water', '#9fe8d0':'air', '#c19a52':'earth'};
const GUARD = {fire:[0, 1], water:[2, 3], air:[4, 5], earth:[7, 8], mana:[9, 10]};
const IDLES = [   // idles extras (além do ciclo contínuo)
  {dur:2800, s:[[0, 'p_0_0'], [.15, 'p_0_1', [F(0, 167, 92), F(0, 255, 82)]], [.6, 'p_0_1', [F(0, 167, 92), F(0, 255, 82)]], [.85, 'p_0_0']], keys:[[0,{}],[.5,{rise:3}],[1,{}]]},
  {dur:2600, s:[[0, 'p_0_0'], [.2, 'p_0_2', [F(0, 312, 98)]], [.75, 'p_0_2', [F(0, 312, 98)]], [.92, 'p_0_0']], keys:[[0,{}],[.5,{tip:10}],[1,{}]]},
  {dur:3400, s:[[0, 'p_0_0'], [.12, 'p_0_3'], [.4, 'p_0_4'], [.7, 'p_0_3'], [.9, 'p_0_0']], keys:[[0,{}],[.5,{lean:3}],[1,{}]]},
];
const IDLE_CYCLE = [['p_0_0', 2200], ['p_0_1', 1300], ['p_0_0', 1800], ['p_0_2', 1300]];

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, back = layers.back, front = layers.front, fc = front.getContext('2d');
  const cw = cv.width, ch = cv.height;
  let M = null; const img = {}, cell = {}, fxs = {};
  const load = n => img[n] || (img[n] = Object.assign(new Image(), {src: 'mage2/' + n + '.png'}));
  fetch('mage2/meta.json').then(r => r.json()).then(j => { M = j; Object.keys(j.poses).forEach(load); Object.keys(j.fx).forEach(load); }).catch(() => {});
  let parts = [], cur = null, flashT = 0, shakeT = 0, dead = 0, deadTarget = 0, last = 0, t0 = clk(), running = false, dirty = false;
  let pose = 'p_0_0', prevPose = null, pStart = 0, pDur = 120, shown = [], dirtyFx = false;

  function getCell(n){
    const i = img[n], m = M && M.poses[n]; if (!m || !i || !i.complete || !i.naturalWidth) return null;
    if (cell[n]) return cell[n];
    const k = document.createElement('canvas'); k.width = cw; k.height = ch;
    const x = Math.round(Px + W / 2 - m.cx), y = Math.round(Py + Hh - m.h + 2); const kc = k.getContext('2d'), row = +n.split('_')[1]; if (row >= 3) kc.filter = 'brightness(1.32) saturate(1.1)'; else if (row >= 1) kc.filter = 'brightness(1.12)'; kc.drawImage(i, x, y);
    return cell[n] = {k, x, y, m};
  }
  function findFx(f){                                            // efeito mais próximo da coordenada pedida
    const key = f.r + ',' + f.x + ',' + f.y; if (fxs[key] !== undefined) return fxs[key];
    let best = null, bd = 60 * 60; const pre = f.r === 2 ? 'g_' : 'e_';
    for (const [n, v] of Object.entries(M.fx)) { if (!n.startsWith(pre + f.r + '_')) continue; const d = (v.cx - f.x) ** 2 + (v.cy - f.y) ** 2; if (d < bd) { bd = d; best = n; } }
    return fxs[key] = best;
  }
  function setPose(n, fade){ if (n === pose) return; prevPose = pose; pose = n; pStart = clk(); pDur = fade || 130; }

  function deform(tm, p){
    const br = Math.sin(tm / 1100) * .5 + .5, sw = Math.sin(tm / 1700 + 1), sw2 = Math.sin(tm / 930);
    const lean = (p.lean || 0) + sw * 1.1, rise = (p.rise || 0) + br * 1.4, squash = p.squash || 0, tip = (p.tip || 0) + Math.sin(tm / 1300 + 2) * 1.8;
    return y => {
      const h = clamp(y / Hh, 0, 1), up = 1 - h;
      const dx = (p.dx || 0) + lean * Math.pow(up, 1.7) + sw2 * 1.1 * h * h + sw * 1 * h * h * h + (h < .2 ? tip * Math.pow(1 - h / .2, 2) : 0);
      const dy = -rise * (.3 + .7 * up) + squash * 44 * Math.pow(up, .8);
      return {dx, dy, s: 1 + br * .008 + squash * .06 * (1 - Math.abs(h - .55) * 2)};
    };
  }
  const spawn = o => parts.push({t0: clk(), ...o});
  const toWorld = (cl, p, f, m) => ({x: world.x - Px + cl.x + (m.sx - cl.m.sx) * M.S, y: world.y - Py + cl.y + (m.sy - cl.m.sy) * M.S});
  function drawFxImg(ctx, name, x, y, a, add, sc = 1, rot = 0){
    const i = img[name]; if (!i || !i.complete || !i.naturalWidth) return;
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.globalCompositeOperation = add ? 'lighter' : 'source-over';
    ctx.translate(x + i.naturalWidth * sc / 2, y + i.naturalHeight * sc / 2); ctx.rotate(rot); ctx.drawImage(i, -i.naturalWidth * sc / 2, -i.naturalHeight * sc / 2, i.naturalWidth * sc, i.naturalHeight * sc); ctx.restore();
  }
  const center = n => { const m = M.fx[n], i = img[n]; return {x: m.cx, y: m.cy}; };

  function frame(){
    if (!running) return;
    requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 30) return; last = now;
    if (!M) return;
    const tm = now - t0; let p = {}, pe = 0, stepFx = [], guardFx = null;
    if (cur) {
      const a = cur.a; pe = (now - cur.start) / a.dur; p = kf(clamp(pe), a.keys);
      if (a.g) { const [k0, k1] = cur.guard, k = (Math.floor((now - cur.start) / 380) % 2) ? k1 : k0, e = clamp(pe < .1 ? pe / .1 : pe > .9 ? (1 - pe) / .1 : 1); setPose('p_2_' + k, 70); guardFx = {name: 'g_2_' + k, a: e}; if (pe < .1 || pe > .9) setPose(pe < .1 ? 'p_0_0' : 'p_0_0', 100); }
      else {
        let st = a.s[0]; for (const s of a.s) if (pe >= s[0]) st = s; setPose(st[1], 70); stepFx = st[2] || [];
        if (a.proj && !cur.projDone && pe >= a.proj.t) { cur.projDone = true; spawn({proj: a.proj, d: a.proj.d}); }
        if (a.hole && !cur.holeDone && pe >= a.hole.t) { cur.holeDone = true; spawn({hole: true, d: a.hole.d}); flashT = now; }
        if (a.imp && !cur.impDone && pe >= (a.impT || a.hit || 1)) { cur.impDone = true; if (a.impPose) spawn({impPose: a.impPose, d: 900}); a.imp.forEach(f => f.r != null && spawn({imp: f, d: 800})); if (a.shake) shakeT = now; if (a.flash) flashT = now; }
      }
      if (pe >= 1) { const d = cur; cur = null; d.done(); }
    } else setPose((() => { let t = tm % IDLE_CYCLE.reduce((s, b) => s + b[1], 0); for (const [n, d] of IDLE_CYCLE) { if (t < d) return n; t -= d; } return 'p_0_0'; })(), 300);
    if (!cur) { /* idle: efeitos do ciclo */ const cyc = pose; if (cyc === 'p_0_1') stepFx = [F(0, 167, 92), F(0, 255, 82)]; else if (cyc === 'p_0_2') stepFx = [F(0, 312, 98)]; }
    dead += (deadTarget - dead) * .12;
    const f0 = deform(tm, p), fall = dead;
    c.clearRect(0, 0, cw, ch); c.save(); c.translate(Px - host.P, Py - host.P); host.shadow(c); c.restore(); c.imageSmoothingEnabled = false;
    const Ac = getCell(pose), Bc = prevPose ? getCell(prevPose) : null, t = clamp((now - pStart) / pDur);
    const body = (cl, alpha, offx) => {
      if (!cl || alpha <= 0) return; c.globalAlpha = alpha;
      for (let y = 0; y < ch; y++) { const d = f0(y - Py), sy = fall * .55, ty = Py + Hh - (Py + Hh - y) * (1 - sy);
        c.drawImage(cl.k, 0, y, cw, 1, Math.round(cw / 2 + (0 - cw / 2) * d.s + d.dx + offx), Math.round(ty + d.dy * (1 - fall)), Math.round(cw * d.s), 2); }
      c.globalAlpha = 1;
    };
    const ghost = cur && cur.a.ghost ? clamp(Math.sin(clamp(pe) * Math.PI) * .5) : 0;
    if (ghost) { body(Ac, .25 * ghost * 2, 40 * ghost * 2); body(Ac, .15 * ghost * 2, 80 * ghost * 2); }
    if (Bc && t < 1) body(Bc, 1, 0); body(Ac, t < 1 && Bc ? t : 1, 0); if (t >= 1) prevPose = null;
    if (p.tint) { c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,50,40,${.55 * p.tint})`; c.fillRect(0, 0, cw, ch); c.restore(); }
    // ---- efeitos da pose atual (camada da frente) e efeitos soltos
    fc.clearRect(0, 0, front.width, front.height);
    if (Ac) {
      if (guardFx) { const m = M.fx[guardFx.name]; if (m) { const w = toWorld(Ac, pose, null, m); const d = f0(Hh / 2); drawFxImg(fc, guardFx.name, w.x + d.dx, w.y + d.dy, guardFx.a); } }
      for (const f of stepFx) { const n = findFx(f); if (!n) continue; const m = M.fx[n], w = toWorld(Ac, pose, f, m); const d = f0((m.sy - Ac.m.sy) * M.S + Ac.m.h * .3); drawFxImg(fc, n, w.x + d.dx, w.y + d.dy, t < 1 ? t : 1, f.add); }
    }
    const next = [];
    for (const q of parts) {
      const u = (now - q.t0) / q.d; if (u >= 1) continue; next.push(q);
      if (q.proj) {
        const P = q.proj, from = {x: world.x + W - 20, y: world.y + 50 - (cur ? 0 : 0)}, e = Math.pow(u, 1.4), x = lerp(from.x, T.x, e), y = lerp(from.y, T.y, e) - Math.sin(u * Math.PI) * P.arc, a = u > .92 ? (1 - u) / .08 : Math.min(1, u * 10);
        if (P.pose) { const m = M.poses[P.pose], i = img[P.pose]; if (i && i.complete) { fc.save(); fc.globalAlpha = a; fc.translate(x, y); fc.rotate(u * 8); const sc = .55; fc.drawImage(i, -i.naturalWidth * sc / 2, -i.naturalHeight * sc / 2, i.naturalWidth * sc, i.naturalHeight * sc); fc.restore(); } }
        else { const n = findFx(P.fx), i = img[n]; if (i && i.complete) { const sc = (P.big || 1) * (.7 + .5 * u); fc.save(); fc.globalAlpha = a; fc.globalCompositeOperation = P.fx.add ? 'lighter' : 'source-over'; fc.translate(x, y); if (P.spin) fc.rotate(u * 10); fc.drawImage(i, -i.naturalWidth * sc / 2, -i.naturalHeight * sc / 2, i.naturalWidth * sc, i.naturalHeight * sc); fc.restore(); } }
      } else if (q.imp) {
        const n = findFx(q.imp), i = img[n]; if (i && i.complete) { const sc = lerp(.6, 1.5, ease(u)), a = u < .15 ? u / .15 : 1 - Math.pow((u - .15) / .85, 1.5); fc.save(); fc.globalAlpha = a; fc.globalCompositeOperation = q.imp.add ? 'lighter' : 'source-over'; fc.translate(T.x, T.y); fc.drawImage(i, -i.naturalWidth * sc / 2, -i.naturalHeight * sc / 2, i.naturalWidth * sc, i.naturalHeight * sc); fc.restore(); }
      } else if (q.impPose) {
        const i = img[q.impPose]; if (i && i.complete) { const sc = lerp(.5, 1.4, ease(u)), a = u < .15 ? u / .15 : 1 - Math.pow((u - .15) / .85, 1.5); fc.save(); fc.globalAlpha = a; fc.translate(T.x, T.y); fc.rotate(u * 1.2); fc.drawImage(i, -i.naturalWidth * sc / 2, -i.naturalHeight * sc / 2, i.naturalWidth * sc, i.naturalHeight * sc); fc.restore(); }
      } else if (q.hole) {
        const i = img[findFx(F(4, 692, 74))]; if (i && i.complete) { const sc = lerp(.2, 1.1, ease(Math.min(1, u * 1.6))), a = u < .12 ? u / .12 : u > .8 ? (1 - u) / .2 : 1; fc.save(); fc.globalAlpha = a; fc.translate(T.x, T.y); { const rr = i.naturalWidth * sc * .27, gd = fc.createRadialGradient(0, 0, 0, 0, 0, rr * 1.25); gd.addColorStop(0, 'rgba(0,0,8,1)'); gd.addColorStop(.8, 'rgba(2,0,20,.95)'); gd.addColorStop(1, 'rgba(10,0,40,0)'); fc.fillStyle = gd; fc.beginPath(); fc.arc(0, 0, rr * 1.25, 0, 7); fc.fill(); } fc.rotate(u * 7); fc.drawImage(i, -i.naturalWidth * sc / 2, -i.naturalHeight * sc / 2, i.naturalWidth * sc, i.naturalHeight * sc); fc.restore(); }
      }
    }
    parts = next;
    if (flashT) { const u = (now - flashT) / 420; if (u < 1) { fc.save(); fc.fillStyle = `rgba(150,170,255,${.5 * (1 - u)})`; fc.fillRect(0, 0, front.width, front.height); fc.restore(); } else flashT = 0; }
    if (shakeT) { const u = (now - shakeT) / 420; const g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 4 * (1 - u)}px,${Math.cos(u * 50) * 3 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); cur = {a, start: clk(), done: ok => res(ok !== false), ...extra}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (dead > .05) return Promise.resolve(false);
      if (name === 'cast' || name === 'holy') { const e = ELEM[(o.color || '').toLowerCase()]; return run(A[e || 'cast']); }
      if (name === 'guard') { const e = ELEM[(o.color || '').toLowerCase()] || 'mana'; return run(A.guard, {guard: GUARD[e]}); }
      const a = A[name]; return a ? run(a) : Promise.resolve(false);
    },
    idle(){ if (cur) return Promise.resolve(false); return run(IDLES[Math.floor(Math.random() * IDLES.length)]); },
    has: n => !!A[n],
    setDead(d){ deadTarget = d ? 1 : 0; if (d) { if (cur) cur.done(false); cur = null; } else flashT = clk(); },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } parts = []; deadTarget = 0; dead = 0; },
  };
}
window.MageRig = {make};
})();
