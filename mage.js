/* Banco de Dados I — RPG · Maga (v40)
   Poses de COSTAS recortadas da folha de referência (mage/*.png) trocadas com transição suave, deformadas por linhas
   (respiração, manto, chapéu, salto) + efeitos da folha (fx/*.png): azul, fogo, água, ar, terra, escudos e buraco negro.
   Só a Maga usa isto; os outros personagens continuam como imagem/sprite sheets. */
(() => {
'use strict';
const FX_NAMES = ['rune','ring','proj','crystal','column','burst','flame','star','wisp','star2',
  'fire_orb','fireball','fire_burst','fire_flame','water_orb','water_pillar','water_orb2','air_swirl','air_swirl2','air_ring','air_orb',
  'earth_orb','earth_spikes','earth_big','rocks','boulder','shield_blue','bh_hole','bh_hole2','bh_spike','bh_orb','atk_orb','atk_bolt'];
const NORM = new Set(['earth_orb','earth_spikes','earth_big','rocks','boulder','bh_hole','bh_hole2','bh_spike','bh_orb']);   // sem brilho aditivo
const FXK = {rune:2.4, ring:2.4, proj:2.4, crystal:2, column:2.2, burst:2.4, flame:2, star:1.5, wisp:1.8, star2:2};         // folha 1 → tamanho do jogo
const FXK2 = 2.25;                                                                                                           // folha 2 (mesma escala das poses)
const POSES = ['idle1','idle2','idle3','idle4','walk1','walk2','walk3','walk4','walk5','run1','run2','run3','run4','dodge1','dodge2','dodge3','dodge4',
  'atk1','atk2','atk3','fire','water','air','earth','def','defbubble','deffire','defwater','defair','defearth','bh1','bh2','bh4'];
const ELEM = {   // cor que o app manda → elemento
  '#ff7a2e':'fire', '#3db4ff':'water', '#9fe8d0':'air', '#c19a52':'earth'};
const EL = {
  fire :{pose:'fire',  orb:'fire_orb',  proj:'fireball',    hit:[['fire_burst', 1.5], ['fire_flame', 1.7]], def:'deffire'},
  water:{pose:'water', orb:'water_orb', proj:'water_orb2',  hit:[['water_pillar', 1.7], ['water_orb2', 2.0]], def:'defwater'},
  air  :{pose:'air',   orb:'air_orb',   proj:'air_swirl2',  hit:[['air_swirl', 1.8], ['air_ring', 1.8]], def:'defair'},
  earth:{pose:'earth', orb:'earth_orb', proj:'boulder',     hit:[['earth_big', 1.6], ['rocks', 1.5]], def:'defearth'},
};
const T = {x:517, y:330};                        // alvo no chefe (coordenadas do design 1024x1536)
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
const atk = {1:'atk1', 2:'atk2', 3:'atk3'};

// ---------- animações (funções das opções: {color}) ----------
const ANIMS = {
  melee:o => ({dur:1100, poses:[[0,'idle4'],[.14,'atk2'],[.32,'atk3'],[.62,'atk3'],[.82,'idle4']],
    keys:[[0,{}],[.14,{lean:-7,squash:.04}],[.32,{lean:10,rise:10}],[.6,{lean:4,rise:4}],[1,{}]],
    ev:[[.3, m => { m.proj('atk_orb', 420, 90, 1.0, 2); }], [.68, m => m.pop('star2', 0, 0, .4, 1.4, 320, 'T')]]}),
  cast:o => { const e = EL[ELEM[(o.color || '').toLowerCase()]];
    if (!e) return {dur:1800, poses:[[0,'idle4'],[.1,'atk1'],[.28,'atk2'],[.44,'atk3'],[.8,'atk3'],[.95,'idle4']],
      keys:[[0,{}],[.2,{lean:-6,glow:.6}],[.44,{lean:-8,rise:8,glow:1.4}],[.55,{lean:10,rise:6,glow:1.8}],[1,{}]],
      ev:[[.08, m => { m.pop('rune', 0, 0, .25, 1.0, 1000, 'feet', 'back', 1.4); m.sparks(8); }], [.46, m => m.proj('atk_orb', 480, 120, 1.5, 3)],
          [.7, m => { m.pop('burst', 0, 0, .25, .75, 520, 'T'); m.pop('star', 0, 0, .3, 1.6, 360, 'T'); }]]};
    return {dur:1900, poses:[[0,'idle4'],[.12,e.pose],[.84,e.pose],[.96,'idle4']],
      keys:[[0,{}],[.2,{lean:-5,glow:0}],[.45,{lean:-9,rise:6}],[.55,{lean:9,rise:4}],[1,{}]],
      ev:[[.14, m => m.hold(e.orb, .4, 1.1, 750)], [.5, m => m.proj(e.proj, 480, 120, 1.0, 3, e.orb)],
          [.76, m => { e.hit.forEach(([n, s], i) => m.pop(n, 0, i ? 10 : -10, .5, s, 900, 'T')); }]]}; },
  heavy:o => ({dur:2300, poses:[[0,'idle4'],[.08,'atk1'],[.26,'atk2'],[.42,'atk3'],[.78,'atk3'],[.94,'idle4']],
    keys:[[0,{}],[.2,{lean:-8,rise:8,glow:.8}],[.42,{lean:-14,rise:20,glow:1.6,tip:8}],[.55,{lean:14,rise:6,glow:2}],[1,{}]],
    ev:[[.08, m => m.pop('rune', 0, 0, .3, 1.3, 1600, 'feet', 'back', 1.9)], [.2, m => m.sparks(16)], [.5, m => m.proj('atk_orb', 460, 140, 2.2, 4)],
        [.7, m => { m.pop('column', 0, 0, .6, 1.0, 800, 'T'); m.pop('burst', 0, 0, .3, 1.1, 650, 'T'); m.pop('star2', 0, 0, .3, 2.2, 450, 'T'); }]]}),
  ult:o => ({dur:4200, poses:[[0,'idle4'],[.05,'bh1'],[.18,'bh2'],[.4,'bh4'],[.82,'bh2'],[.94,'idle4']],
    keys:[[0,{}],[.15,{lean:-6,squash:.05}],[.4,{rise:18,lean:-4,glow:1.5}],[.7,{rise:22,lean:6}],[1,{}]],
    ev:[[.04, m => m.pop('rune', 0, 0, .2, 1.9, 3200, 'feet', 'back', 2.8)], [.14, m => { for (let i = 0; i < 6; i++) m.proj('bh_orb', rnd(700, 1000), rnd(40, 160), rnd(.6, 1), 0, null, {ox:rnd(-90, 90), oy:rnd(-130, 20), w:i * .12}); }],
        [.36, m => { m.flash(); m.pop('bh_hole', 0, 0, .15, 1.15, 2500, 'T', 'front', 0, 9, true); }],
        [.44, m => m.pop('bh_hole2', 0, 0, .2, .75, 2000, 'T', 'front', 0, -12, true)], 
        [.55, m => m.pop('star2', 0, 0, .4, 3, 800, 'T')]]}),
  guard:o => { const e = EL[ELEM[(o.color || '').toLowerCase()]], p = e ? e.def : 'defbubble';
    return {dur:1800, poses:[[0,'idle4'],[.1,p],[.84,p],[.96,'idle4']], keys:[[0,{}],[.15,{squash:.03}],[.5,{squash:.02}],[1,{}]],
      ev:[[.08, m => m.pop('star2', 0, -60, .5, 1.6, 500, 'self')]]}; },
  dodge:o => ({dur:950, poses:[[0,'idle4'],[.08,'dodge1'],[.26,'dodge2'],[.46,'dodge3'],[.64,'dodge4'],[.9,'idle4']],
    keys:[[0,{}],[.2,{dx:-20}],[.4,{dx:-52,lean:-8}],[.7,{dx:-30}],[1,{}]], ghost:true, ev:[[.2, m => m.pop('wisp', 0, 0, .5, 1.0, 600, 'self')]]}),
  hurt:o => ({dur:700, poses:[[0,'idle4'],[.1,'walk2'],[.6,'walk2'],[.8,'idle4']],
    keys:[[0,{}],[.12,{lean:-12,rise:-6,squash:.06,tint:1,dx:-8}],[.3,{lean:-7,tint:.7,dx:6}],[.5,{lean:-3,tint:.3,dx:-2}],[1,{}]],
    ev:[[.04, m => m.pop('star2', 0, 20, .3, 1.1, 300, 'self')]]}),
  pass:o => ({dur:1500, poses:[[0,'idle4'],[.25,'idle2'],[.75,'idle2'],[.95,'idle4']], keys:[[0,{}],[.4,{squash:.07,lean:-5,tip:-8}],[.7,{squash:.07,lean:-5,tip:-8}],[1,{}]],
    ev:[[.3, m => m.pop('wisp', 40, -90, .5, 1.1, 1000, 'self')]]}),
  victory:o => ({dur:2600, poses:[[0,'idle4'],[.12,'atk1'],[.3,'atk3'],[.62,'atk3'],[.8,'atk1'],[.95,'idle4']],
    keys:[[0,{}],[.1,{squash:.07}],[.25,{rise:44,lean:-4,glow:1.2}],[.4,{squash:.05}],[.55,{rise:56,lean:4,glow:1.6,tip:8}],[.7,{squash:.04}],[.85,{rise:12,glow:1}],[1,{}]],
    ev:[[.2, m => { m.sparks(22); m.pop('star2', -50, -60, .5, 1.2, 700, 'self'); }], [.5, m => { m.sparks(30); m.pop('burst', 0, 0, .4, .7, 900, 'self'); m.pop('star2', 50, -90, .5, 1.4, 800, 'self'); }]]}),
};
ANIMS.holy = ANIMS.cast; ANIMS.super = ANIMS.heavy; ANIMS.aoe = ANIMS.heavy;
const IDLES = [
  {dur:2600, keys:[[0,{}],[.4,{tip:14,lean:3,rise:2}],[.7,{tip:-10,lean:-2}],[1,{}]]},
  {dur:2400, keys:[[0,{}],[.35,{glow:1.8,rise:3}],[1,{}]], ev:[[.15, m => { m.sparks(9); m.pop('star', 0, 0, .5, 1.5, 900, 'orb'); }]]},
  {dur:3000, keys:[[0,{}],[.3,{dx:-7,lean:-4,squash:.02}],[.7,{dx:5,lean:3}],[1,{}]], ev:[[.2, m => m.pop('wisp', -30, -110, .5, 1.0, 1300, 'self')]]},
  {dur:2800, keys:[[0,{}],[.5,{sx:.03,rise:4,glow:1.2}],[1,{}]], ev:[[.1, m => m.pop('ring', 0, 0, .2, .9, 2200, 'feet', 'back', 0, .6)]]},
];
const IDLE_CYCLE = [['idle4', 1700], ['idle2', 850], ['idle4', 1700], ['idle1', 850]];

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, back = layers.back, front = layers.front, bc = back.getContext('2d'), fc = front.getContext('2d');
  const cw = cv.width, ch = cv.height;
  const fx = {}, fxm = {}, pimg = {}, cell = {}; let pm = null;
  FX_NAMES.forEach(n => { const i = new Image(); i.src = 'fx/' + n + '.png'; fx[n] = i; });
  fetch('mage/meta.json').then(r => r.json()).then(j => { pm = j; }).catch(() => {});
  fetch('fx/meta.json').then(r => r.json()).then(j => { Object.assign(fxm, j); }).catch(() => {});
  POSES.forEach(n => { const i = new Image(); i.src = 'mage/' + n + '.png'; pimg[n] = i; });
  let parts = [], cur = null, flashT = 0, dead = 0, deadTarget = 0, last = 0, t0 = clk(), running = false, dirty = false;
  let pose = 'idle4', prevPose = null, pStart = 0, pDur = 120;

  function getCell(n){                                          // pose já posicionada no canvas da Maga (pés alinhados)
    const i = pimg[n]; if (!pm || !i || !i.complete || !i.naturalWidth) return null;
    if (cell[n]) return cell[n];
    const m = pm.poses[n], k = document.createElement('canvas'); k.width = cw; k.height = ch;
    const x = Math.round(Px + W / 2 - m.cx), y = Math.round(Py + Hh - m.h + 2);
    k.getContext('2d').drawImage(i, x, y);
    return cell[n] = {k, x, y, m};
  }
  function setPose(n, fade){ if (n === pose) return; prevPose = pose; pose = n; pStart = clk(); pDur = fade || 130; }
  const poseAlpha = now => clamp((now - pStart) / pDur);

  function deform(tm, p){
    const br = Math.sin(tm / 1100) * .5 + .5, sw = Math.sin(tm / 1700 + 1), sw2 = Math.sin(tm / 930);
    const lean = (p.lean || 0) + sw * 1.2, rise = (p.rise || 0) + br * 1.8, squash = p.squash || 0, tip = (p.tip || 0) + Math.sin(tm / 1300 + 2) * 2.6 + Math.sin(tm / 520) * 1;
    const sx = 1 + (p.sx || 0) + br * .012;
    return y => {                                               // y relativo ao topo da Maga (negativo = acima do chapéu)
      const h = clamp(y / Hh, 0, 1), up = 1 - h;
      const dx = (p.dx || 0) + lean * Math.pow(up, 1.7) + sw2 * 1.4 * h * h + sw * 1.2 * h * h * h + (h < .2 ? tip * Math.pow(1 - h / .2, 2) : 0);
      const dy = -rise * (.3 + .7 * up) + squash * 48 * Math.pow(up, .8);
      return {dx, dy, s: sx + (h > .3 && h < .8 ? br * .01 : 0) + squash * .08 * (1 - Math.abs(h - .55) * 2)};
    };
  }
  function anchorOf(poseName, fxName){                          // posição (coords do design) de um efeito preso a uma pose
    const cl = getCell(poseName), m = fxm[fxName]; if (!cl || !m) return null;
    const k = cl.m.k || pm.S, x = cl.x + (m[0] + m[2] / 2 - cl.m.ox) * k, y = cl.y + (m[1] + m[3] / 2 - cl.m.oy) * k;
    return {x: world.x - Px + x, y: world.y - Py + y};
  }
  function spawn(o){ parts.push({t0: clk(), ...o}); }
  const api = {
    flash(){ flashT = clk(); },
    sparks(n){ for (let i = 0; i < n; i++) spawn({img:'star', at:'orb', ox:rnd(-14,14), oy:rnd(-14,14), vx:rnd(-30,30), vy:rnd(-90,-30), s0:rnd(.25,.6), s1:0, d:rnd(500,1100), layer:'front', w:rnd(0,.25)}); },
    pop(name, ox, oy, s0, s1, d, at, layer = 'front', rot0 = 0, rot1 = 0, hold = false){ spawn({img:name, at, ox, oy, s0, s1, d, layer, rot0, rot1, pop:!hold, hold}); },
    hold(name, s0, s1, d){ spawn({img:name, at:'anchor', anchor:name, s0, s1, d, layer:'front', hold:true, k2:true}); },
    proj(img, d, arc, size, trail, anchorFx, o = {}){ spawn({img, at:anchorFx ? 'anchor' : 'orb', anchor:anchorFx, fly:true, d, arc, s0:size * .6, s1:size, layer:'front', trail:trail ? trail : 0, k2:FX_NAMES.indexOf(img) > 9, ...o}); },
  };
  function pos(p){
    const base = p.at === 'T' ? T : p.at === 'orb' ? host.orbWorld : p.at === 'anchor' ? (anchorOf(p.poseAt || pose, p.anchor) || host.orbWorld)
               : p.at === 'feet' ? {x: world.x + W / 2, y: world.y + Hh - 12} : {x: world.x + W / 2, y: world.y + Hh / 2};
    return {x: base.x + (p.ox || 0), y: base.y + (p.oy || 0)};
  }
  function drawPart(ctx, p, now){
    const u = (now - p.t0 - (p.w || 0) * 1000) / p.d; if (u < 0) return true; if (u >= 1) return false;
    const im = fx[p.img]; if (!im.complete || !im.naturalWidth) return true;
    if (p.at === 'anchor' && !p.poseAt) p.poseAt = pose;
    let {x, y} = pos(p), a = 1, s = lerp(p.s0, p.s1, ease(u)) * (FX_NAMES.indexOf(p.img) >= 10 ? FXK2 : (FXK[p.img] || 1)), rot = lerp(p.rot0 || 0, p.rot1 || 0, u);
    if (p.fly) {
      const o = p.o0 || (p.o0 = {...pos({...p, fly:false})}), e2 = Math.pow(u, 1.5);
      x = lerp(o.x, T.x, e2); y = lerp(o.y, T.y, e2) - Math.sin(u * Math.PI) * p.arc; a = u > .93 ? (1 - u) / .07 : Math.min(1, u * 8); rot = p.img === 'proj' ? u * 9 : (p.img === 'air_swirl2' || p.img === 'boulder' ? u * 12 : 0);
      if (p.trail && Math.random() < .8) spawn({img:'star', at:'abs', ax:x, ay:y, s0:rnd(.2,.5), s1:0, d:rnd(250,520), layer:'front'});
    } else if (p.vx != null) { x += p.vx * u; y += p.vy * u; a = Math.sin(u * Math.PI); }
    else if (p.hold) a = u < .15 ? u / .15 : u > .85 ? (1 - u) / .15 : 1;
    else a = p.pop ? (u < .15 ? u / .15 : 1 - Math.pow((u - .15) / .85, 1.6)) : 1 - u;
    if (p.at === 'abs') { x = p.ax; y = p.ay; a = 1 - u; }
    const w = im.naturalWidth * s, h = im.naturalHeight * s, groundFlat = p.layer === 'back' && (p.img === 'rune' || p.img === 'ring');
    ctx.save(); ctx.globalAlpha = clamp(a) * (groundFlat ? .9 : 1); ctx.translate(x, y);
    if (groundFlat) ctx.scale(1, .34);
    ctx.rotate(rot); ctx.globalCompositeOperation = NORM.has(p.img) ? 'source-over' : 'lighter'; ctx.drawImage(im, -w / 2, -h / 2, w, h);
    if (p.pop && s > 1 && !NORM.has(p.img)) ctx.drawImage(im, -w / 2, -h / 2, w, h);
    ctx.restore(); return true;
  }
  function idlePose(tm){
    let t = tm % IDLE_CYCLE.reduce((a, b) => a + b[1], 0);
    for (const [n, d] of IDLE_CYCLE) { if (t < d) return n; t -= d; } return 'idle4';
  }

  function frame(){
    if (!running) return;
    requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 30) return; last = now;
    const tm = now - t0;
    let p = {}, pe = 0;
    if (cur) {
      pe = (now - cur.start) / cur.a.dur;
      const ev = cur.a.ev || [];
      while (cur.fired < ev.length && pe >= ev[cur.fired][0]) ev[cur.fired++][1](api);
      p = kf(clamp(pe), cur.a.keys);
      if (cur.a.poses) { let pn = cur.a.poses[0][1]; for (const [t, n] of cur.a.poses) if (pe >= t) pn = n; setPose(pn, 110); } else setPose(idlePose(tm), 260);
      if (pe >= 1) { const d = cur; cur = null; d.done(); }
    } else setPose(idlePose(tm), 260);
    dead += (deadTarget - dead) * .12;
    const f0 = deform(tm, p), fall = dead;
    // ---- corpo
    c.clearRect(0, 0, cw, ch); c.save(); c.translate(Px - host.P, Py - host.P); host.shadow(c); c.restore(); c.imageSmoothingEnabled = false;
    const A = getCell(pose), B = prevPose ? getCell(prevPose) : null, t = poseAlpha(now);
    const body = (cl, alpha, offx) => {
      if (!cl || alpha <= 0) return;
      c.globalAlpha = alpha;
      for (let y = 0; y < ch; y++) {
        const d = f0(y - Py), yy = y - Py, sy = fall * .55, ty = Py + Hh - (Py + Hh - y) * (1 - sy);
        c.drawImage(cl.k, 0, y, cw, 1, Math.round(cw / 2 + (0 - cw / 2) * d.s + d.dx + offx), Math.round(ty + d.dy * (1 - fall)), Math.round(cw * d.s), 2);
      }
      c.globalAlpha = 1;
    };
    const ghost = cur && cur.a.ghost ? clamp(Math.sin(clamp(pe) * Math.PI) * .5) : 0;
    if (ghost) { body(A, .28 * ghost * 2, 38 * ghost * 2); body(A, .18 * ghost * 2, 76 * ghost * 2); }
    if (B && t < 1) body(B, 1, 0);
    body(A, t < 1 && B ? t : 1, 0);
    if (t >= 1) prevPose = null;
    if (p.tint) { c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,50,40,${.55 * p.tint})`; c.fillRect(0, 0, cw, ch); c.restore(); }
    // ---- orbe do cajado (pose atual)
    const pc = getCell(pose), om = pm && pm.poses[pose] && pm.poses[pose].orb;
    if (pc && om) {
      const oy = pc.y + om[1], d = f0(oy - Py), ox = pc.x + om[0] + d.dx, oyy = oy + d.dy;
      host.orbWorld = {x: world.x - Px + ox, y: world.y - Py + oyy};
      if (fall < .5) {
        const g = clamp((p.glow || 0) * .5 + .3 + Math.sin(tm / 400) * .07, 0, 1.4), r = 20 + (p.glow || 0) * 14;
        c.save(); c.globalCompositeOperation = 'lighter';
        const gr = c.createRadialGradient(ox, oyy, 1, ox, oyy, r); gr.addColorStop(0, `rgba(120,190,255,${.5 * g})`); gr.addColorStop(.5, `rgba(40,110,255,${.2 * g})`); gr.addColorStop(1, 'rgba(0,40,255,0)');
        c.fillStyle = gr; c.fillRect(ox - r, oyy - r, 2 * r, 2 * r);
        const st = fx.star; if (st.complete && st.naturalWidth) { const s = (.5 + (p.glow || 0) * .35) * (.8 + .2 * Math.sin(tm / 260)); c.globalAlpha = clamp(.5 + (p.glow || 0) * .3); c.drawImage(st, ox - st.naturalWidth * s / 2, oyy - st.naturalHeight * s / 2, st.naturalWidth * s, st.naturalHeight * s); }
        c.restore();
      }
    }
    // ---- efeitos globais
    if (parts.length || dirty) {
      bc.clearRect(0, 0, back.width, back.height); fc.clearRect(0, 0, front.width, front.height); dirty = parts.length > 0;
      parts = parts.filter(q => drawPart(q.layer === 'back' ? bc : fc, q, now));
      if (flashT) { const u = (now - flashT) / 450; if (u < 1) { fc.save(); fc.fillStyle = `rgba(150,200,255,${.55 * (1 - u)})`; fc.fillRect(0, 0, front.width, front.height); fc.restore(); dirty = true; } else flashT = 0; }
    }
  }
  const run = a => new Promise(res => { if (cur) cur.done(false); cur = {a, start: clk(), done: ok => res(ok !== false), fired: 0}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){ const f = ANIMS[name]; if (!f || dead > .05) return Promise.resolve(false); return run(f(o || {})); },
    idle(){ if (cur) return Promise.resolve(false); return run(IDLES[Math.floor(Math.random() * IDLES.length)]); },
    has: n => !!ANIMS[n],
    setDead(d){ deadTarget = d ? 1 : 0; if (d) { if (cur) cur.done(false); cur = null; api.pop('wisp', 0, 0, .5, 1.2, 1200, 'self'); } else { api.flash(); api.sparks(24); api.pop('burst', 0, 0, .3, .8, 900, 'self'); } },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } parts = []; deadTarget = 0; dead = 0; dirty = true; },
    busy: () => !!cur, dead: () => deadTarget > 0,
  };
}
window.MageRig = {make};
})();
