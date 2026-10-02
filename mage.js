/* Banco de Dados I — RPG · rig da Maga (v39)
   Usa a arte do spr_mage.webp deformada por linhas (respiração, balanço do manto, ponta do chapéu)
   + efeitos azuis extraídos da folha de referência (fx/*.png), desenhados em camadas globais.
   Só a Maga usa isso; os outros continuam como imagem/sheets. */
(() => {
'use strict';
const FX_NAMES = ['rune','ring','proj','crystal','column','burst','flame','star','wisp','star2'];
const FXK = {rune:2.4, ring:2.4, proj:2.4, crystal:2, column:2.2, burst:2.4, flame:2, star:1.5, wisp:1.8, star2:2};
const T = {x:517, y:330};                       // ponto de impacto no chefe (coordenadas do design 1024x1536)
const ORB = {x:193, y:47};                       // orbe do cajado dentro do sprite 209x284
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);

function kf(t, keys){                            // keyframes [[t,{k:v}]...] com suavização
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, a] = keys[i-1], [t1, b] = keys[i], u = ease((t - t0) / (t1 - t0)), o = {};
    for (const k in {...a, ...b}) o[k] = lerp(a[k] || 0, b[k] || 0, u); return o;
  }
  return keys[keys.length-1][1];
}

// poses (deltas somados ao idle). lean>0 = inclina pra frente(direita), rise>0 = sobe, squash>0 = agacha
const ANIMS = {
  melee:{dur:900, keys:[[0,{}],[.18,{lean:-9,squash:.05,rise:-4}],[.34,{lean:14,rise:22,sx:.04}],[.5,{lean:5,rise:8}],[1,{}]],
    ev:[[.3, m => { m.proj(.0, 330, 80, .55); m.pop('star', 0, 0, .3, 1.1, 260, 'T'); }], [.42, m => m.pop('star2', 0, 0, .4, 1.4, 360, 'T')]]},
  cast:{dur:1500, keys:[[0,{}],[.25,{lean:-6,rise:6,glow:.6}],[.5,{lean:-12,rise:16,glow:1.2,tip:5}],[.62,{lean:10,rise:4,glow:1.6}],[1,{}]],
    ev:[[.15, m => m.pop('rune', 0, 0, .25, 1.0, 900, 'feet', 'back', 1.4)], [.2, m => m.sparks(10)], [.62, m => m.proj(0, 520, 110, 1)], [.82, m => { m.pop('burst', 0, 0, .25, .75, 520, 'T'); m.pop('star', 0, 0, .3, 1.6, 360, 'T'); }]]},
  holy:{dur:1500, keys:[[0,{}],[.3,{rise:12,glow:1,lean:-4}],[.6,{rise:16,glow:1.5}],[1,{}]],
    ev:[[.1, m => m.pop('rune', 0, 0, .25, 1.2, 1100, 'feet', 'back', 1.6)], [.3, m => m.sparks(14)], [.45, m => m.pop('column', 0, 0, .6, .9, 900, 'self')]]},
  heavy:{dur:2100, keys:[[0,{}],[.2,{lean:-8,rise:10,squash:.04,glow:.8}],[.45,{lean:-14,rise:26,glow:1.6,tip:8}],[.58,{lean:16,rise:6,glow:2}],[.7,{lean:8,rise:12}],[1,{}]],
    ev:[[.1, m => m.pop('rune', 0, 0, .3, 1.3, 1500, 'feet', 'back', 1.9)], [.25, m => m.sparks(18)], [.57, m => m.proj(0, 480, 130, 1.5)],
        [.77, m => { m.pop('column', 0, 0, .6, 1.0, 800, 'T'); m.pop('burst', 0, 0, .3, 1.1, 650, 'T'); m.pop('star2', 0, 0, .3, 2.2, 450, 'T'); }]]},
  ult:{dur:3400, keys:[[0,{}],[.12,{lean:-6,squash:.06}],[.35,{rise:46,lean:-6,glow:2,tip:10,sx:.02}],[.6,{rise:56,lean:-2,glow:2.6,tip:12}],[.72,{rise:40,lean:18,glow:3}],[.85,{rise:20,lean:8}],[1,{}]],
    ev:[[.05, m => m.pop('rune', 0, 0, .2, 1.9, 2700, 'feet', 'back', 2.8)], [.1, m => m.pop('ring', 0, 0, .2, 1.3, 2400, 'feet', 'back', 1.8, 1)],
        [.2, m => m.sparks(26)], [.4, m => m.sparks(26)],
        [.5, m => m.pop('burst', -120, 0, .3, .8, 1300, 'self')], [.54, m => m.pop('burst', 120, 0, .3, .8, 1300, 'self')],
        [.7, m => m.proj(0, 600, 220, 2.4)],
        [.84, m => { m.pop('column', -90, 0, .5, 1.1, 1200, 'T'); m.pop('column', 90, 0, .5, 1.1, 1200, 'T'); m.pop('column', 0, 0, .6, 1.4, 1200, 'T'); }],
        [.86, m => { m.pop('burst', 0, 0, .4, 2.4, 1000, 'T'); m.pop('rune', 0, 0, .4, 2.2, 1100, 'T', 'front', 1.4, 1); m.flash(); }], [.9, m => m.pop('star2', 0, 0, .4, 3.4, 700, 'T')]]},
  guard:{dur:1700, keys:[[0,{}],[.2,{squash:.1,lean:-5}],[.8,{squash:.1,lean:-5,glow:.8}],[1,{}]],
    ev:[[.05, m => m.pop('ring', 0, -150, .3, 1.5, 1500, 'self', 'front', 0, 1)], [.1, m => m.pop('rune', 0, -150, .3, .9, 1400, 'self', 'front', 0, -1)]]},
  dodge:{dur:800, keys:[[0,{}],[.25,{dx:-46,lean:-12,squash:.04}],[.65,{dx:-46,lean:-10}],[1,{}]], ghost:true,
    ev:[[.1, m => m.pop('wisp', 0, 0, .5, 1.0, 600, 'self')]]},
  hurt:{dur:650, keys:[[0,{}],[.12,{lean:-14,rise:-8,squash:.07,tint:1,dx:-8}],[.3,{lean:-8,tint:.7,dx:8}],[.5,{lean:-4,tint:.3,dx:-3}],[1,{}]],
    ev:[[.04, m => m.pop('star2', 0, 20, .3, 1.1, 300, 'self')]]},
  pass:{dur:1400, keys:[[0,{}],[.4,{squash:.07,lean:-5,tip:-8}],[.7,{squash:.07,lean:-5,tip:-8}],[1,{}]], ev:[[.3, m => m.pop('wisp', 40, -90, .5, 1.1, 1000, 'self')]]},
  victory:{dur:2300, keys:[[0,{}],[.1,{squash:.07}],[.25,{rise:48,lean:-4,glow:1.2}],[.4,{squash:.05}],[.55,{rise:60,lean:4,glow:1.6,tip:8}],[.7,{squash:.04}],[.85,{rise:14,glow:1}],[1,{}]],
    ev:[[.2, m => { m.sparks(22); m.pop('star2', -50, -60, .5, 1.2, 700, 'self'); }], [.5, m => { m.sparks(30); m.pop('burst', 0, 0, .4, .7, 900, 'self'); m.pop('star2', 50, -90, .5, 1.4, 800, 'self'); }]]},
};
ANIMS.super = ANIMS.heavy; ANIMS.aoe = ANIMS.heavy;
// idles (aleatórios, além do balanço contínuo)
const IDLES = [
  {dur:2600, keys:[[0,{}],[.4,{tip:14,lean:3,rise:4}],[.7,{tip:-10,lean:-2}],[1,{}]]},                                         // ponta do chapéu balança
  {dur:2400, keys:[[0,{}],[.35,{glow:1.8,rise:6}],[1,{}]], ev:[[.15, m => { m.sparks(9); m.pop('star', 0, 0, .5, 1.5, 900, 'orb'); }]]},      // orbe brilha
  {dur:3000, keys:[[0,{}],[.3,{dx:-7,lean:-4,squash:.02}],[.7,{dx:5,lean:3}],[1,{}]], ev:[[.2, m => m.pop('wisp', -30, -110, .5, 1.0, 1300, 'self')]]}, // troca o peso
  {dur:2800, keys:[[0,{}],[.5,{sx:.03,rise:7,glow:1.2}],[1,{}]], ev:[[.1, m => m.pop('ring', 0, 0, .2, .9, 2200, 'feet', 'back', 0, .6)]]},   // anel arcano no chão
];

function make(host){
  const {c, cv, P, W, Hh, world, layers, shadow} = host;       // c: ctx do canvas da Maga; world: {x,y} do sprite no design
  const img = host.still, back = layers.back, front = layers.front, bc = back.getContext('2d'), fc = front.getContext('2d');
  const fx = {}; FX_NAMES.forEach(n => { const i = new Image(); i.src = 'fx/' + n + '.png'; fx[n] = i; });
  let parts = [], cur = null, flashT = 0, dead = 0, deadTarget = 0, last = 0, t0 = clk(), running = false, dirty = false, busy = null;

  const state = () => cur ? cur.pose : {};
  function deform(tm, p){                                        // monta função de deformação por linha
    const br = Math.sin(tm / 1100) * .5 + .5, sw = Math.sin(tm / 1700 + 1), sw2 = Math.sin(tm / 930);
    const lean = (p.lean || 0) + sw * 1.2, rise = (p.rise || 0) + br * 2.2, squash = p.squash || 0, tip = (p.tip || 0) + Math.sin(tm / 1300 + 2) * 3.2 + Math.sin(tm / 520) * 1.2;
    const sx = 1 + (p.sx || 0) + br * .012;
    return y => {
      const h = y / Hh, up = 1 - h;
      const dx = (p.dx || 0) + lean * Math.pow(up, 1.7) + sw2 * 1.6 * h * h + sw * 1.4 * h * h * h
               + (h < .2 ? tip * Math.pow(1 - h / .2, 2) : 0);
      const dy = -rise * (.3 + .7 * up) + squash * 48 * Math.pow(up, .8);
      return {dx, dy, s: sx + (h > .3 && h < .8 ? br * .01 : 0) + squash * .08 * (1 - Math.abs(h - .55) * 2)};
    };
  }
  function orbPos(f){ const d = f(ORB.y); return {x: ORB.x + d.dx, y: ORB.y + d.dy}; }

  function spawn(o){ parts.push({t0: clk(), ...o}); }
  const api = {
    flash(){ flashT = clk(); },
    sparks(n){ for (let i = 0; i < n; i++) spawn({img:'star', at:'orb', ox:rnd(-14,14), oy:rnd(-14,14), vx:rnd(-30,30), vy:rnd(-90,-30), s0:rnd(.25,.6), s1:0, d:rnd(500,1100), layer:'front', w:rnd(0,.25)}); },
    pop(name, ox, oy, s0, s1, d, at, layer = 'front', rot0 = 0, rot1 = 0){ spawn({img:name, at, ox, oy, s0, s1, d, layer, rot0, rot1, pop:true}); },
    proj(ox, d, arc, size){ spawn({img:'proj', at:'orb', fly:true, d, arc, s0:.35 * size, s1:.55 * size, layer:'front', trail:true}); },
  };

  function pos(p, now){                                         // coordenadas do design (1024x1536) do efeito
    const orb = host.orbWorld;
    let base = p.at === 'T' ? T : p.at === 'orb' ? orb : p.at === 'feet' ? {x: world.x + W / 2, y: world.y + Hh - 12} : {x: world.x + W / 2, y: world.y + Hh / 2};
    return {x: base.x + (p.ox || 0), y: base.y + (p.oy || 0)};
  }
  function drawPart(ctx, p, now){
    const u = (now - p.t0 - (p.w || 0) * 1000) / p.d; if (u < 0) return true; if (u >= 1) return false;
    const im = fx[p.img]; if (!im.complete || !im.naturalWidth) return true;
    let {x, y} = pos(p, now), a, s = lerp(p.s0, p.s1, ease(u)) * (FXK[p.img] || 1), rot = lerp(p.rot0 || 0, p.rot1 || 0, u);
    if (p.fly) {
      const o = p.o0 || (p.o0 = {...host.orbWorld}), e = u * u * (3 - 2 * u * .6), e2 = Math.pow(u, 1.5);
      x = lerp(o.x, T.x, e2); y = lerp(o.y, T.y, e2) - Math.sin(u * Math.PI) * p.arc; a = u > .93 ? (1 - u) / .07 : 1; rot = u * 9;
      if (p.trail && Math.random() < .8) spawn({img:'star', at:'abs', ax:x, ay:y, s0:rnd(.2,.5), s1:0, d:rnd(250,520), layer:'front'});
    } else if (p.vx != null) {
      x += p.vx * u * 1; y += p.vy * u; a = Math.sin(u * Math.PI);
    } else a = p.pop ? (u < .15 ? u / .15 : 1 - Math.pow((u - .15) / .85, 1.6)) : 1 - u;
    if (p.at === 'abs') { x = p.ax; y = p.ay; a = 1 - u; }
    const k = host.scale, w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.save(); ctx.globalAlpha = clamp(a) * (p.img === 'rune' || p.img === 'ring' ? .9 : 1); ctx.translate(x * k, y * k);
    if (p.layer === 'back' && (p.img === 'rune' || p.img === 'ring')) ctx.scale(1, .34);
    ctx.rotate(rot); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(im, -w / 2 * k, -h / 2 * k, w * k, h * k);
    if (p.pop && s > 1) ctx.drawImage(im, -w / 2 * k, -h / 2 * k, w * k, h * k);       // brilho extra
    ctx.restore(); return true;
  }

  function frame(){
    if (!running) return;
    requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 30) return; last = now;
    const tm = now - t0;
    let p = {}, pe = 0;
    if (cur) {
      pe = (now - cur.start) / cur.a.dur;
      if (!cur.fired) cur.fired = 0;
      const ev = cur.a.ev || [];
      while (cur.fired < ev.length && pe >= ev[cur.fired][0]) ev[cur.fired++][1](api);
      p = kf(clamp(pe), cur.a.keys);
      if (pe >= 1) { const d = cur; cur = null; d.done(); }
    }
    // morte: afunda
    dead += (deadTarget - dead) * .12;
    const f0 = deform(tm, p), f = y => { const d = f0(y); return d; };
    host.orbWorld = (() => { const q = orbPos(f0); return {x: world.x + q.x, y: world.y + q.y}; })();
    // ---- corpo
    c.clearRect(0, 0, cv.width, cv.height); shadow(c); c.imageSmoothingEnabled = false;
    const cx = W / 2, fall = dead;
    const ghost = cur && cur.a.ghost ? clamp(Math.sin(clamp(pe) * Math.PI) * .5) : 0;
    const body = (alpha, offx) => {
      c.globalAlpha = alpha;
      for (let y = 0; y < Hh; y++) {
        const d = f0(y), sy = fall * .55, ty = Hh - (Hh - y) * (1 - sy), dw = W * d.s;
        c.drawImage(img, 0, y, W, 1, Math.round(P + cx + (0 - cx) * d.s + d.dx + offx), Math.round(P + ty + d.dy * (1 - fall)), Math.round(dw), 2);
      }
      c.globalAlpha = 1;
    };
    if (ghost) { body(.28 * ghost * 2, 38 * ghost * 2); body(.18 * ghost * 2, 76 * ghost * 2); }
    body(1, 0);
    if (p.tint) { c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,50,40,${.55 * p.tint})`; c.fillRect(0, 0, cv.width, cv.height); c.restore(); }
    // ---- brilho do orbe (dentro do canvas)
    const g = clamp((p.glow || 0) * .5 + .35 + Math.sin(tm / 400) * .08, 0, 1.4), op = orbPos(f0);
    const gx = P + op.x, gy = P + op.y - (p.rise || 0) * 0, r = 20 + (p.glow || 0) * 14;
    if (!fall || fall < .5) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(gx, gy, 1, gx, gy, r); gr.addColorStop(0, `rgba(120,190,255,${.55 * g})`); gr.addColorStop(.5, `rgba(40,110,255,${.22 * g})`); gr.addColorStop(1, 'rgba(0,40,255,0)');
      c.fillStyle = gr; c.fillRect(gx - r, gy - r, 2 * r, 2 * r);
      const st = fx.star; if (st.complete && st.naturalWidth) { const s = (.55 + (p.glow || 0) * .35) * (.8 + .2 * Math.sin(tm / 260)); c.globalAlpha = clamp(.55 + (p.glow || 0) * .3); c.drawImage(st, gx - st.naturalWidth * s / 2, gy - st.naturalHeight * s / 2, st.naturalWidth * s, st.naturalHeight * s); }
      c.restore();
    }
    // ---- efeitos globais
    if (parts.length || dirty) {
      bc.clearRect(0, 0, back.width, back.height); fc.clearRect(0, 0, front.width, front.height); dirty = parts.length > 0;
      parts = parts.filter(q => drawPart(q.layer === 'back' ? bc : fc, q, now));
      if (flashT) { const u = (now - flashT) / 450; if (u < 1) { fc.save(); fc.fillStyle = `rgba(150,200,255,${.55 * (1 - u)})`; fc.fillRect(0, 0, front.width, front.height); fc.restore(); dirty = true; } else flashT = 0; }
    }
  }
  window.__dbg = () => ({n: parts.length, cur: cur && cur.fired, pe: cur && (clk() - cur.start) / cur.a.dur, run: running, dead, deadTarget, busy: !!cur});
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name){ const a = ANIMS[name]; if (!a || dead > .05 && name !== 'revive') return Promise.resolve(false);
      if (cur) cur.done(false);
      return new Promise(res => { cur = {a, start: clk(), done: ok => res(ok !== false), fired: 0, pose: {}}; }); },
    idle(){ if (cur) return Promise.resolve(false); const a = IDLES[Math.floor(Math.random() * IDLES.length)];
      return new Promise(res => { cur = {a, start: clk(), done: ok => res(ok !== false), fired: 0, pose: {}}; }); },
    has: n => !!ANIMS[n],
    setDead(d){ deadTarget = d ? 1 : 0; if (d) { if (cur) cur.done(false); cur = null; api.pop('wisp', 0, 0, .5, 1.2, 1200, 'self'); } else { api.flash(); api.sparks(24); api.pop('burst', 0, 0, .3, .8, 900, 'self'); } },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } parts = []; deadTarget = 0; dead = 0; dirty = true; },
    busy: () => !!cur, dead: () => deadTarget > 0,
  };
}
window.MageRig = {make};
})();
