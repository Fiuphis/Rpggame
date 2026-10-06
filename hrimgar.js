/* Banco de Dados I — RPG · Hrimgar, o Rei Gelado
   Poses recortadas das folhas (hrimgar/*.png, tools/cut_hrimgar.py) + efeitos de gelo em sprites (hrimgar/fx_*.png) e canvas.
   Fase 1: armadura (espada longa) · fase 2: a armadura se despedaça e ele luta com dois sabres.
   Mesma API do BossRig (boss.js): play/idle/has/fx/setMode/nextHit/reset. O dano só entra quando o golpe chega no alvo (fireHit).
   Alvo do golpe: opts {tx, ty} (coords do mundo 1024x1536). */
(() => {
'use strict';
const BASE = 589, SZ = .655, XOFF = 0;
const ICE = '110,190,255', FRO = '190,228,255', WHT = '235,248,255', DEEP = '50,100,230', ORG = '255,150,50', RED = '255,60,60';
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3), ei = u => u * u * u;
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));
const S = (d, steps, ev = [], o = {}) => ({dur:d, steps, ev, ...o});
const TK = ['dx','dy','rot','sc','al','px','py'];
const PS = {p1:1.07,p2:1.07,p3:1.07,p4:1.07,p5:1.07,p6:1.07,v1:1.07,v2:1.07,v3:1.07,v4:1.07,v5:1.07,v6:1.07};   // a folha de armadura 2 e 3 sai ~7% menor
const GEMP = {p1:1, p2:1, a1:1, a6:1, n1:1, n2:1, n6:1};      // poses de frente, com a joia do elmo visível
const DIR = {v3:1, w4:1};                                      // lado para onde a pose aponta (espelha se o alvo estiver do outro lado)
const FXN = ['pillar','pillar2','pillarb','shards','shards2','frost','sh1','sh2','sh3','flake','seal','blood','sl1','sl2','sl3','slx','sl4','slline'];

const ACT1 = {
  attack:[S(1100, [[0,'p1'],[.22,'p6'],[.7,'p6',{dy:-3}],[.98,'p1']], [[.16,'charge']])],
  slashH:[
    S(1750, [[0,'p1'],[.14,'p3'],[.3,'v4',{dx:12}],[.5,'p4',{dx:16}],[.72,'p2'],[.95,'p1']], [[.26,'wave:h']]),
    S(1800, [[0,'p2'],[.14,'p3',{dx:-4}],[.3,'p4',{dx:12}],[.52,'p4',{dx:16}],[.74,'p1'],[.95,'p2']], [[.28,'wave:h:2']]),
  ],
  slashV:[
    S(1950, [[0,'p2'],[.12,'p6'],[.3,'p3',{dy:-6}],[.44,'p3',{dy:-9}],[.52,'p4',{dy:3}],[.74,'p2'],[.95,'p1']], [[.38,'wave:v']]),
    S(2000, [[0,'p1'],[.12,'p6'],[.3,'v6',{dy:-5}],[.46,'v6',{dy:-10}],[.54,'p4',{dy:3}],[.76,'p1'],[.95,'p2']], [[.4,'wave:v:2']]),
  ],
  summon:[S(2500, [[0,'p1'],[.16,'p5'],[.46,'p5',{dy:-4}],[.62,'p5',{dy:-2}],[.8,'p2'],[.96,'p1']], [[.14,'charge'],[.44,'pillars']])],
  thrust:[S(1700, [[0,'p1'],[.14,'p6'],[.32,'v3',{dx:14}],[.55,'v3',{dx:8}],[.78,'p2'],[.96,'p1']], [[.3,'lance']], {dir:true})],
  aoe:[S(2500, [[0,'p1'],[.14,'p6'],[.28,'p3'],[.6,'p3',{dy:-3}],[.82,'p6'],[.97,'p1']], [[.14,'charge'],[.26,'nova']])],
  enrage:[S(2800, [[0,'p1'],[.14,'p6'],[.3,'v6'],[.48,'v6',{dy:-4}],[.8,'v6'],[.96,'p6']], [[.1,'charge'],[.34,'roar'],[.55,'roar:2']])],
  prep:[S(2200, [[0,'p1'],[.2,'p6'],[.55,'p6',{dy:-3}],[.95,'p6']], [[.1,'sigil'],[.2,'charge']])],
  laugh:[S(2800, [[0,'p1'],[.12,'v6',{dy:-4}],[.24,'p1'],[.36,'v6',{dy:-4}],[.48,'p1'],[.6,'v6',{dy:-4}],[.92,'p1']], [[.1,'charge']])],
  hurt:[
    S(850, [[0,'p1'],[.12,'v5',{dx:-8}],[.5,'v5'],[.92,'p1']], [], {tint:true}),
    S(900, [[0,'p2'],[.12,'v1',{dx:-10,rot:-2}],[.5,'v1'],[.92,'p2']], [], {tint:true}),
  ],
  tpOut:[S(1300, [[0,'p1'],[.2,'p6'],[.5,'p6',{dy:-8,al:.6}],[.95,'p6',{dy:-22,al:0}]], [[.18,'snowpuff']], {hold:'gone'})],
  tpIn:[S(2000, [[0,'v4',{px:1,py:1,al:0,sc:.5}],[.16,'v4',{px:1,py:1,al:.95,sc:.54}],[.34,'p4',{px:1,py:1,al:1,sc:.58}],[.6,'p4',{px:1,py:1,al:1,sc:.58}],[.8,'v4',{px:1,py:1,al:.5,sc:.54}],[.95,'v4',{px:1,py:1,al:0,sc:.5}]], [[.02,'snowpuffT'],[.36,'strikeT'],[.82,'snowpuffT']], {hold:'gone', front:true})],
  tpBack:[S(1100, [[0,'p6',{dy:-22,al:0}],[.5,'p6',{dy:-6,al:1}],[.9,'p1']], [[.04,'snowpuff']])],
  awaken:[S(1700, [[0,'p1'],[.2,'p6',{dy:-4}],[.42,'p3',{dy:-8}],[.5,'p5',{dy:4}],[.66,'p5',{dy:-2}],[.9,'p1']], [[.12,'omen'],[.44,'slam'],[.52,'flakes']])],
  phase2:[S(5200, [[0,'a1'],[.1,'a1',{dy:-4}],[.22,'a2',{dy:-2}],[.38,'a3'],[.5,'a4'],[.62,'a5',{dx:-6}],[.78,'a6',{dy:-2}],[.9,'n1'],[1,'n1']],
    [[.04,'charge'],[.2,'crack'],[.24,'shatter'],[.38,'shatter2'],[.4,'phase'],[.62,'swordsnap'],[.8,'roar:2']])],
  die:[S(5200, [[0,'p1'],[.1,'v5',{dx:-10}],[.28,'a2'],[.4,'a3',{dy:2}],[.55,'a4'],[.66,'x2',{dy:2}],[.8,'x3',{dy:4}],[.9,'x5',{dy:6}],[1,'x5',{dy:6,al:0}]],
    [[.12,'crack'],[.28,'shatter'],[.4,'shatter2'],[.9,'icedie']], {tint:'low', hold:'gone'})],
};
const ACT2 = {
  attack:[S(1100, [[0,'n1'],[.22,'n6'],[.7,'n6',{dy:-3}],[.98,'n1']], [[.16,'charge']])],
  slashH:[
    S(1500, [[0,'n1'],[.14,'n5'],[.3,'n4',{dx:12}],[.5,'n4',{dx:16}],[.72,'n2'],[.95,'n1']], [[.26,'wave:h']]),
    S(1550, [[0,'n2'],[.14,'n4',{dx:-4}],[.3,'n5',{dx:12}],[.52,'n5',{dx:16}],[.74,'n1'],[.95,'n2']], [[.26,'wave:h:2']]),
  ],
  slashV:[
    S(1750, [[0,'n2'],[.12,'n3'],[.3,'w2',{dy:-6}],[.44,'w2',{dy:-9}],[.52,'n6',{dy:3}],[.74,'n2'],[.95,'n1']], [[.38,'wave:v']]),
    S(1800, [[0,'n1'],[.12,'n3'],[.3,'w2',{dy:-5}],[.46,'w2',{dy:-10}],[.54,'n6',{dy:3}],[.76,'n1'],[.95,'n2']], [[.4,'wave:v:2']]),
  ],
  summon:[S(2300, [[0,'n1'],[.16,'n3'],[.42,'x6',{dy:-6}],[.62,'x6',{dy:-2}],[.8,'n2'],[.96,'n1']], [[.14,'charge'],[.42,'pillars']])],
  thrust:[S(1500, [[0,'n1'],[.14,'x2'],[.32,'w4',{dx:-14}],[.55,'w4',{dx:-8}],[.78,'n2'],[.96,'n1']], [[.3,'lance']], {dir:true})],
  aoe:[S(2400, [[0,'n1'],[.14,'w3'],[.28,'w1'],[.6,'w1',{dy:-3}],[.82,'w3'],[.97,'n1']], [[.14,'charge'],[.26,'nova']])],
  enrage:[S(2700, [[0,'n1'],[.14,'n3'],[.3,'w5'],[.48,'w5',{dy:-4}],[.8,'x6'],[.96,'n3']], [[.1,'charge'],[.34,'roar'],[.55,'roar:2']])],
  prep:[S(2200, [[0,'n1'],[.2,'n6'],[.55,'n6',{dy:-3}],[.95,'n6']], [[.1,'sigil'],[.2,'charge']])],
  laugh:[S(2800, [[0,'n1'],[.12,'x6',{dy:-4}],[.24,'n1'],[.36,'x6',{dy:-4}],[.48,'n1'],[.6,'x6',{dy:-4}],[.92,'n1']], [[.1,'charge']])],
  hurt:[
    S(850, [[0,'n1'],[.12,'x1',{dx:-8}],[.5,'x1'],[.92,'n1']], [], {tint:true}),
    S(900, [[0,'n2'],[.12,'w6',{dx:-10,rot:-2}],[.5,'w6'],[.92,'n2']], [], {tint:true}),
  ],
  tpOut:[S(1300, [[0,'n1'],[.2,'w3'],[.5,'w3',{dy:-8,al:.6}],[.95,'w3',{dy:-22,al:0}]], [[.18,'snowpuff']], {hold:'gone'})],
  tpIn:[S(2000, [[0,'w4',{px:1,py:1,al:0,sc:.5}],[.16,'w4',{px:1,py:1,al:.95,sc:.54}],[.34,'n4',{px:1,py:1,al:1,sc:.58}],[.6,'n4',{px:1,py:1,al:1,sc:.58}],[.8,'w4',{px:1,py:1,al:.5,sc:.54}],[.95,'w4',{px:1,py:1,al:0,sc:.5}]], [[.02,'snowpuffT'],[.36,'strikeT'],[.82,'snowpuffT']], {hold:'gone', front:true})],
  tpBack:[S(1100, [[0,'w3',{dy:-22,al:0}],[.5,'w3',{dy:-6,al:1}],[.9,'n1']], [[.04,'snowpuff']])],
  awaken:[S(1700, [[0,'n1'],[.4,'x6',{dy:-8}],[.9,'n1']], [[.12,'omen'],[.44,'slam']])],
  die:[S(5200, [[0,'n1'],[.1,'x1',{dx:-10}],[.3,'w6'],[.46,'x2',{dy:2}],[.62,'x3',{dy:4}],[.76,'x4',{dy:4}],[.9,'x5',{dy:6}],[1,'x5',{dy:6,al:0}]],
    [[.1,'crack'],[.3,'shatter2'],[.9,'icedie']], {tint:'low', hold:'gone'})],
};
const IDLE1 = [S(4200, [[0,'p1'],[.3,'p2'],[.7,'p2'],[.95,'p1']]), S(3600, [[0,'p1'],[.3,'p6'],[.65,'p6'],[.95,'p1']]), S(3200, [[0,'p2'],[.3,'p1'],[.6,'p2'],[.95,'p1']])];
const IDLE2 = [S(4200, [[0,'n1'],[.3,'n2'],[.7,'n2'],[.95,'n1']]), S(3600, [[0,'n1'],[.3,'n6'],[.65,'n6'],[.95,'n1']]), S(3200, [[0,'n2'],[.3,'n1'],[.6,'n2'],[.95,'n1']])];
[...IDLE1, ...IDLE2].forEach(a => { a.dur = Math.round(a.dur * 1.4); });
const BASE_POSE = [{n:'p1', charge:'p6', rage:'v6', orange:'p1'}, {n:'n1', charge:'n6', rage:'x6', orange:'n1'}];
const bags = new WeakMap();
const variant = v => { if (!Array.isArray(v)) return v; if (window.__vi != null) return v[window.__vi % v.length]; let b = bags.get(v); if (!b || !b.l.length) { const l = v.map((_, i) => i); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } if (b && l.length > 1 && l[0] === b.last) l.push(l.shift()); b = {l, last:-1}; bags.set(v, b); } const i = b.l.shift(); b.last = i; return v[i]; };
const POSES = (() => { const s = new Set(); const add = a => (a.steps || a).forEach(p => s.add(p[1])); [ACT1, ACT2].forEach(T => Object.values(T).forEach(v => v.forEach(add))); [...IDLE1, ...IDLE2].forEach(add); BASE_POSE.forEach(B => Object.values(B).forEach(p => s.add(p))); return [...s]; })();

function glow(g, x, y, r, col, a){
  if (a <= 0.005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(240,250,255,${clamp(a * .6)})`); gr.addColorStop(.16, `rgba(${col},${clamp(a)})`); gr.addColorStop(.5, `rgba(${col},${clamp(a * .3)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function streak(g, x, y, ang, len, th, col, a){
  if (a <= .005) return; g.save(); g.translate(x, y); g.rotate(ang); g.scale(len / th, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, th); gr.addColorStop(0, `rgba(240,250,255,${clamp(a * .7)})`); gr.addColorStop(.3, `rgba(${col},${clamp(a)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-th, -th, th * 2, th * 2); g.restore();
}
function mistBlob(g, x, y, r, a, col){      // névoa gelada (source-over)
  if (a <= .005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${col},${clamp(a)})`); gr.addColorStop(.55, `rgba(${col},${clamp(a * .55)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, front = layers.front, fc = front.getContext('2d'), back = layers.back, bc = back.getContext('2d');
  let backUsed = false, phase = 1;
  const cw = cv.width, ch = cv.height;
  let M = null; const img = {}, fimg = {};
  fetch('hrimgar/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => { img[n] = Object.assign(new Image(), {src:`hrimgar/${n}.png`}); }); FXN.forEach(n => { fimg[n] = Object.assign(new Image(), {src:`hrimgar/fx_${n}.png`}); }); }).catch(() => {});
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); };
  let fxl = [], cur = null, shakeT = 0, last = 0, t0 = clk(), running = false, mode = null, held = null, tgt = {x:512, y:1000}, mark = null;
  let prev = null, curPose = null, lastT = {dx:0, dy:0, rot:0, sc:1, al:1}, cur_t = 0, fade = 240;
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), bk: !!o.back});
  const feet = () => ({x:world.x + W / 2 + XOFF, y:world.y + BASE});
  const sword = () => { const f = feet(), s = tgt.x < f.x ? -1 : 1; return {x:f.x + s * 150, y:f.y - 330}; };
  const baseP = () => BASE_POSE[phase - 1][mode] || BASE_POSE[phase - 1].n;
  const tsc = () => (window.__ts == null ? 1 : window.__ts);
  const GY = () => 1085;      // linha do chão dos heróis
  // sprite de efeito: {img, x, y, s, sx, sy, rot, a, ax, ay, add}
  const spr = (name, d, f, o = {}) => E('spr', d, u => { const s = f(u); if (s) s.img = name; return s; }, o);
  const flakes = (x, y, n, o = {}) => { for (let i = 0; i < n; i++) { const an = o.up ? -Math.PI / 2 + rnd(-.7, .7) : rnd(0, 6.28), sp = rnd(.4, 1) * (o.sp || 160), dl = rnd(0, o.span || 120), d = rnd(900, 1700) * (o.dur || 1), z = Math.random() < .35 ? 8 : 4, w = (o.wind == null ? 90 : o.wind) * rnd(.6, 1.2);
    E('flake', d, u => ({x:x + Math.cos(an) * sp * eo(u) + w * u * u * 2, y:y + Math.sin(an) * sp * eo(u) + (o.fall == null ? 60 : o.fall) * u * u, z, a:Math.sin(Math.PI * Math.min(1, u * 1.1)), c:Math.random() < .5 ? WHT : FRO}), {delay:dl}); } };
  const shardsOut = (x, y, n, o = {}) => { const nm = ['sh1','sh2','sh3']; for (let i = 0; i < n; i++) { const an = o.up ? -Math.PI / 2 + rnd(-1, 1) : rnd(0, 6.28), sp = rnd(.35, 1) * (o.sp || 220), d = rnd(700, 1300), im = nm[i % 3], s0 = rnd(.12, .28) * (o.s || 1), rot0 = rnd(-1, 1), vr = rnd(-4, 4), dl = rnd(0, 120);
    spr(im, d, u => ({x:x + Math.cos(an) * sp * eo(u), y:y + Math.sin(an) * sp * eo(u) + 150 * u * u, s:s0 * (1 - u * .25), rot:rot0 + vr * u, a:1 - seg(u, .6, 1), ax:.5, ay:.5}), {delay:dl}); } };

  function hitFx(x, y, big){            // impacto de gelo no alvo
    const bl = (r, col, a, dl = 0, d = 650) => E('glow', d, u => ({x, y, r:r * (.4 + eo(u) * .9), c:col, a:a * (1 - u) * (u < .08 ? u / .08 : 1)}), {delay:dl});
    bl(big ? 190 : 130, ICE, .95, 0, 800); bl(big ? 110 : 80, '240,250,255', .9, 0, 450);
    E('ring', 700, u => ({x, y:y + 90, r:lerp(40, big ? 170 : 120, eo(u)), c:ICE, a:.8 * (1 - u)}));
    spr('slx', 520, u => ({x, y, s:lerp(.25, big ? .62 : .46, eo(u)), a:1 - seg(u, .45, 1), ax:.5, ay:.5, add:true}));
    shardsOut(x, y, big ? 12 : 7, {sp:big ? 200 : 140}); flakes(x, y, big ? 16 : 9, {sp:130});
    if (big) shakeT = clk();
  }
  function fly(a, b, d, o){              // projétil de gelo de a até b; no fim: impacto + fireHit
    const path = u => ({x:lerp(a.x, b.x, u), y:lerp(a.y, b.y, u) - (o.arc || 0) * Math.sin(Math.PI * u)});
    const fd = u => u < .1 ? u / .1 : u > .94 ? (1 - u) / .06 : 1;
    const sgn = b.x < a.x ? -1 : 1;
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:(o.r || 56) * (.7 + .4 * u), c:o.col || ICE, a:.7 * fd(u)}; });
    spr(o.sp || 'sl3', d, u => { const p = path(u), q = path(Math.min(1, u + .04)); return {x:p.x, y:p.y, s:o.ss || .62, sx:sgn, rot:o.rot != null ? o.rot : Math.atan2(q.y - p.y, Math.abs(q.x - p.x)) * sgn * (sgn < 0 ? -1 : 1), a:fd(u), ax:.5, ay:.5, add:true}; });
    for (let i = 1; i <= 8; i++) { const ut = i / 9, p = path(ut); E('glow', 450, v => ({x:p.x, y:p.y + 8 * v, r:38 * (1 - v * .6), c:o.col || ICE, a:.4 * (1 - v)}), {delay:ut * d}); }
    flakes(a.x, a.y, 6, {sp:60});
    setTimeout(() => { hitFx(b.x, b.y, o.big); fireHit(); }, d / tsc());
    return d;
  }
  const EV = {
    charge(){ const f = feet(); E('ring', 1000, u => ({x:f.x, y:f.y - 6, r:lerp(60, 260, eo(u)), c:ICE, a:.8 * (1 - u)}));
      E('glow', 1200, u => ({x:f.x, y:f.y - 260, r:lerp(150, 330, eo(u)), c:ICE, a:.5 * Math.sin(Math.PI * u)}), {back:true});
      flakes(f.x, f.y - 20, 12, {up:true, sp:380, span:500, fall:-40}); },
    wave(k){ const o = sword(), b = tgt, sg = b.x < o.x ? -1 : 1;
      if (k === 'v') { const a = {x:b.x + rnd(-30, 30), y:b.y - 700}; fly(a, b, 480, {sp:'slline', ss:.9, rot:Math.PI / 2, r:70, big:false}); }
      else fly(o, b, 640, {sp:k === '2' ? 'sl1' : 'sl3', ss:k === '2' ? .5 : .62, arc:60, r:60}); },
    pillars(){ const b = tgt, g0 = GY() + 8, ph = phase === 2, N = ph ? 5 : 3;
      for (let i = 0; i < N; i++) { const off = (i - (N - 1) / 2) * (ph ? 78 : 92), dl = Math.abs(off) * 2.2 + 0, big = i === (N - 1) / 2, sc = (big ? .98 : .74) * (ph ? .95 : 1), x = b.x + off, d = 1250;
        spr('frost', 900, u => ({x, y:g0, s:lerp(.18, .5 * sc + .1, eo(u)), sy:.3, a:.9 * (1 - seg(u, .5, 1)), ax:.5, ay:.5, add:true}), {delay:dl, back:true});
        spr(i % 2 ? 'pillar2' : 'pillar', d, u => { const g1 = eo(seg(u, 0, .22)), br = seg(u, .55, .65); return {x, y:g0, s:sc, sy:lerp(.05, 1, g1), a:1 - br, ax:.5, ay:1}; }, {delay:dl});
        spr('pillarb', 700, u => ({x, y:g0, s:sc, sy:1, a:u < .1 ? u / .1 * .9 : 1 - seg(u, .15, .9), ax:.5, ay:1}), {delay:dl + d * .55});
        setTimeout(() => { shardsOut(x, g0 - 140 * sc, big ? 10 : 6, {up:true, sp:170}); flakes(x, g0 - 60, 8, {sp:110}); }, (dl + d * .5) / tsc());
        if (big) { setTimeout(() => { hitFx(b.x, b.y, true); fireHit(); }, (dl + d * .22) / tsc()); } }
      shakeT = clk() + 200; },
    lance(){ const o = sword(), b = tgt; fly({x:feet().x + (b.x < feet().x ? -120 : 120), y:feet().y - 280}, b, 380, {sp:'slline', ss:.95, r:44, rot:Math.atan2(b.y - (feet().y - 280), Math.abs(b.x - feet().x)) * (b.x < feet().x ? -1 : 1) * (b.x < feet().x ? -1 : 1)}); },
    nova(){ const f = feet(), y0 = GY() - 10, d = 520;
      E('glow', 900, u => ({x:f.x, y:f.y - 250, r:lerp(120, 420, eo(u)), c:ICE, a:.8 * (1 - u)}));
      for (let k = 0; k < 3; k++) E('ring', 1100, u => ({x:f.x, y:y0, r:lerp(60, 640, eo(u)), c:k === 1 ? FRO : ICE, a:.8 * (1 - u)}), {delay:k * 150});
      spr('frost', 1300, u => ({x:f.x, y:y0 + 6, s:lerp(.4, 2.6, eo(u)), sy:.45, a:.95 * (1 - seg(u, .5, 1)), ax:.5, ay:.5, add:true}), {back:true});
      for (let i = 0; i < 15; i++) { const x = 60 + i * 66, dl = Math.abs(x - f.x) / 640 * 330, sc = rnd(.28, .46);
        spr(i % 2 ? 'pillar' : 'pillar2', 760, u => { const g1 = eo(seg(u, 0, .35)); return {x, y:y0, s:sc, sy:lerp(.05, 1, g1), a:1 - seg(u, .55, 1), ax:.5, ay:1}; }, {delay:dl}); }
      flakes(f.x, y0 - 40, 36, {sp:520, span:300, wind:200});
      shakeT = clk(); setTimeout(fireHit, d / tsc()); },
    roar(k){ const f = feet(), n = k === '2' ? 2 : 1;
      E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(60, 200 + 90 * n, eo(u)), c:ICE, a:.85 * (1 - u)}));
      E('glow', 1300, u => ({x:f.x, y:f.y - 280, r:lerp(120, 360 + 60 * n, eo(u)), c:FRO, a:.6 * Math.sin(Math.PI * u)}));
      spr('frost', 1100, u => ({x:f.x, y:f.y - 4, s:lerp(.5, 1.5 + .3 * n, eo(u)), sy:.4, a:.9 * (1 - seg(u, .5, 1)), ax:.5, ay:.5, add:true}), {back:true});
      flakes(f.x, f.y - 200, 26, {sp:420, span:200, wind:260});
      shakeT = clk(); if (n === 2) setTimeout(fireHit, 200 / tsc()); },
    sigil(){ const f = feet(); spr('seal', 2200, u => ({x:f.x, y:f.y - 6, s:lerp(.4, 1.25, eo(Math.min(1, u * 1.6))), sy:.28, rot:u * 1.2, a:(u < .1 ? u / .1 : u > .85 ? (1 - u) / .15 : 1) * .95, ax:.5, ay:.5, add:true}), {back:true}); },
    snowpuff(){ const f = feet(); flakes(f.x, f.y - 280, 34, {sp:260, span:300, wind:160});
      for (let i = 0; i < 12; i++) { const ox = rnd(-190, 190), oy = rnd(-520, -40), sp = rnd(.6, 1.3); E('mist', 1300, u => ({x:f.x + ox * (.4 + u * .8), y:f.y + oy - 70 * u * sp, r:lerp(70, 150, eo(u)) * sp, a:.55 * Math.sin(Math.PI * Math.min(1, u * 1.05))}), {delay:i * 35}); }
      E('glow', 900, u => ({x:f.x, y:f.y - 280, r:lerp(120, 300, eo(u)), c:ICE, a:.45 * Math.sin(Math.PI * u)})); },
    snowpuffT(){ const b = tgt; flakes(b.x, b.y + 60, 26, {sp:200, span:260, wind:140});
      for (let i = 0; i < 10; i++) { const ox = rnd(-90, 90), oy = rnd(-300, 30), sp = rnd(.6, 1.2); E('mist', 1000, u => ({x:b.x + ox, y:b.y + 90 + oy - 40 * u, r:lerp(40, 90, eo(u)) * sp, a:.5 * Math.sin(Math.PI * Math.min(1, u * 1.05))}), {delay:i * 30}); } },
    strikeT(){ const b = tgt; spr('sl1', 480, u => ({x:b.x, y:b.y - 20, s:lerp(.35, .6, eo(u)), a:1 - seg(u, .4, 1), ax:.5, ay:.5, add:true}));
      spr('sl2', 480, u => ({x:b.x, y:b.y - 20, s:lerp(.3, .55, eo(u)), a:1 - seg(u, .4, 1), ax:.5, ay:.5, add:true}), {delay:40}); hitFx(b.x, b.y + 20, false); fireHit(); },
    omen(){ const f = feet(); E('glow', 760, u => ({x:f.x, y:f.y - 300, r:lerp(80, 360, eo(u)), c:ICE, a:.5 * u})); flakes(f.x, f.y - 100, 20, {sp:300, span:600, wind:220}); },
    slam(){ const f = feet();
      E('glow', 700, u => ({x:f.x, y:f.y - 40, r:lerp(100, 520, eo(u)), c:'235,248,255', a:.8 * (1 - u)}));
      for (let k = 0; k < 3; k++) E('ring', 1000, u => ({x:f.x, y:f.y - 6, r:lerp(40, 460, eo(u)), c:k === 1 ? FRO : ICE, a:.85 * (1 - u)}), {delay:k * 110});
      spr('frost', 1100, u => ({x:f.x, y:f.y - 4, s:lerp(.4, 2.2, eo(u)), sy:.4, a:.95 * (1 - seg(u, .5, 1)), ax:.5, ay:.5, add:true}), {back:true});
      shardsOut(f.x, f.y - 20, 14, {up:true, sp:340}); flakes(f.x, f.y - 20, 30, {sp:420, wind:240});
      shakeT = clk(); },
    flakes(){ const f = feet(); flakes(f.x, f.y - 300, 30, {sp:360, wind:200, span:500}); },
    crack(){ const f = feet(); E('glow', 700, u => ({x:f.x, y:f.y - 280, r:lerp(100, 300, eo(u)), c:FRO, a:.5 * Math.sin(Math.PI * u)})); shakeT = clk(); },
    shatter(){ const f = feet(); E('glow', 900, u => ({x:f.x, y:f.y - 300, r:lerp(150, 560, eo(u)), c:'235,248,255', a:.85 * (1 - u)}));
      for (let k = 0; k < 2; k++) E('ring', 1000, u => ({x:f.x, y:f.y - 6, r:lerp(60, 420, eo(u)), c:k ? FRO : ICE, a:.8 * (1 - u)}), {delay:k * 150});
      shardsOut(f.x, f.y - 300, 22, {sp:380, s:1.2}); flakes(f.x, f.y - 300, 30, {sp:400, wind:200}); shakeT = clk(); },
    shatter2(){ const f = feet(); shardsOut(f.x, f.y - 260, 20, {sp:430, s:1.3}); flakes(f.x, f.y - 280, 30, {sp:450, wind:260});
      E('glow', 800, u => ({x:f.x, y:f.y - 300, r:lerp(120, 460, eo(u)), c:ICE, a:.7 * (1 - u)})); shakeT = clk(); },
    phase(){ phase = 2; },
    swordsnap(){ const f = feet(); E('ring', 900, u => ({x:f.x, y:f.y - 6, r:lerp(60, 380, eo(u)), c:FRO, a:.85 * (1 - u)})); flakes(f.x, f.y - 120, 20, {sp:300}); shakeT = clk(); },
    icedie(){ const f = feet(); E('glow', 1100, u => ({x:f.x, y:f.y - 80, r:lerp(100, 520, eo(u)), c:'235,248,255', a:.8 * (1 - u)}));
      for (let k = 0; k < 3; k++) E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(40, 520, eo(u)), c:k === 1 ? FRO : ICE, a:.8 * (1 - u)}), {delay:k * 160});
      shardsOut(f.x, f.y - 90, 34, {sp:520, s:1.3}); flakes(f.x, f.y - 90, 60, {sp:560, wind:300, span:700, dur:1.6}); shakeT = clk(); },
  };
  function runEv(e){ const [k, a, b] = e.split(':'); if (EV[k]) EV[k](a, b); }

  function poseAt(a, pe){
    const st = a.steps; let i = 0; while (i < st.length - 1 && pe >= st[i + 1][0]) i++;
    const A = st[i], B = st[Math.min(i + 1, st.length - 1)], u = A === B ? 1 : ease(clamp((pe - A[0]) / (B[0] - A[0])));
    const ta = A[2] || {}, tb = B[2] || {}, o = {pose:A[1]};
    TK.forEach(k => { const d0 = k === 'sc' || k === 'al' ? 1 : 0; o[k] = lerp(ta[k] != null ? ta[k] : d0, tb[k] != null ? tb[k] : d0, u); });
    return o;
  }
  function drawPose(g, name, o, tm, tint, ox, oy, flipDir){
    const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return;
    const br = Math.sin(tm / 1000 * 1.8) * (o.breathe == null ? 1 : o.breathe), sc = SZ * (o.sc || 1) * (PS[name] || 1);
    const fl = DIR[name] && flipDir && flipDir * DIR[name] < 0 ? -1 : 1;
    g.save(); g.globalAlpha = clamp(o.al == null ? 1 : o.al); g.translate(ox + (o.dx || 0), oy + (o.dy || 0)); g.rotate((o.rot || 0) * Math.PI / 180); g.scale(sc * (1 - .004 * br) * fl, sc * (1 + .008 * br));
    g.drawImage(im, -m.cx, -m.gy);
    if (GEMP[name] && m.gem && !(tint && tint > 0.2)) { let r = 0; try { r = window.BD_RAGE ? clamp(window.BD_RAGE()) : 0; } catch (e) {} const p = .78 + .22 * Math.sin(tm / 1000 * (3 + r * 6)), a = (.35 + .65 * r) * p, rad = 26 + 34 * r;
      const X = m.gem[0] - m.cx, Y = m.gem[1] - m.gy; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(X, Y, 0, X, Y, rad); gr.addColorStop(0, `rgba(235,250,255,${.9 * a})`); gr.addColorStop(.35, `rgba(110,200,255,${.4 * a})`); gr.addColorStop(1, 'rgba(60,140,255,0)'); g.fillStyle = gr; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2); g.globalCompositeOperation = 'source-over';
      const M2 = g.getTransform(); window.__bossEyes = [[M2.a * X + M2.c * Y + M2.e, M2.b * X + M2.d * Y + M2.f]]; }
    if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(215,240,255,${tint})`; g.fillRect(-m.cx, -m.gy, m.w, m.h); }
    g.restore();
  }
  const drawRing = s => { backUsed = true; [[bc, 3.1416, 6.2832], [fc, 0, 3.1416]].forEach(([g, a0, a1]) => { g.save(); g.translate(s.x, s.y); g.scale(1, .3); g.globalCompositeOperation = 'lighter'; g.lineWidth = 10; g.strokeStyle = `rgba(${s.c},${clamp(s.a)})`; g.beginPath(); g.arc(0, 0, s.r, a0, a1); g.stroke(); g.restore(); }); };
  function drawSpr(g, s){
    const im = fimg[s.img]; if (!im || !im.complete || !im.naturalWidth || s.a <= .004) return;
    g.save(); g.translate(s.x, s.y); g.rotate(s.rot || 0); g.scale((s.s || 1) * (s.sx == null ? 1 : s.sx), (s.s || 1) * (s.sy == null ? 1 : s.sy)); g.globalAlpha = clamp(s.a == null ? 1 : s.a);
    if (s.add) g.globalCompositeOperation = 'lighter';
    g.imageSmoothingEnabled = false; g.drawImage(im, -im.naturalWidth * (s.ax == null ? .5 : s.ax), -im.naturalHeight * (s.ay == null ? .5 : s.ay)); g.restore();
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
      const fd = a && a.dir ? (tgt.x < ft.x ? -1 : 1) : 0;
      const ps = o2 => ({...o2, dx:(o2.dx || 0) + (o2.px || 0) * vx, dy:(o2.dy || 0) + (o2.py || 0) * vy, breathe:onFront ? 0 : 1});
      if (prev && f < 1) drawPose(g, prev.pose, ps(prev), tm, tint, bx, by, fd);
      drawPose(g, st.pose, ps({...st, al:(st.al == null ? 1 : st.al) * (prev && f < 1 ? f : 1)}), tm, tint, bx, by, fd);
    }
    if (!held || cur) {
      if (mode === 'charge') { glow(bc, ft.x, ft.y - 260, 300 + 20 * Math.sin(tm / 220), ICE, .34 + .1 * Math.sin(tm / 180)); backUsed = true; }
      else if (mode === 'rage') { glow(bc, ft.x, ft.y - 260, 340 + 24 * Math.sin(tm / 240), FRO, .4 + .1 * Math.sin(tm / 200)); backUsed = true; }
      else if (mode === 'orange') { glow(bc, ft.x, ft.y - 260, 300, ORG, .22 + .06 * Math.sin(tm / 240)); backUsed = true; }
    }
    if (mark) { const u = (now - mark.t0) / 1000, ps = .75 + .25 * Math.sin(u * 7); drawSpr(fc, {img:'seal', x:mark.x, y:mark.y, s:.7 + .05 * Math.sin(u * 5), sy:.3, rot:u * .8, a:.8 * ps, add:true}); glow(fc, mark.x, mark.y - 30, 120, ICE, .25 * ps); }
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), g = e.bk ? bc : fc; if (e.bk) backUsed = true;
      if (!s) return true;
      if (e.name === 'glow') glow(g, s.x, s.y, s.r, s.c, s.a);
      else if (e.name === 'streak') streak(g, s.x, s.y, s.ang, s.len, s.th, s.c, s.a);
      else if (e.name === 'ring') { drawRing(s); }
      else if (e.name === 'mist') mistBlob(g, s.x, s.y, s.r, s.a, '200,225,250');
      else if (e.name === 'flake') { g.save(); g.fillStyle = `rgba(${s.c},${clamp(s.a)})`; g.fillRect(Math.round(s.x / 4) * 4, Math.round(s.y / 4) * 4, s.z, s.z); g.restore(); }
      else if (e.name === 'spr') { if (e.bk) backUsed = true; drawSpr(g, s); }
      return true;
    });
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 1 * (1 - u)}px,${Math.cos(u * 50) * .8 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); held = null; cur = {a, start: clk(), fired: 0, done: ok => res(ok !== false), ...extra}; });
  const getAct = n => (phase === 2 && ACT2[n]) || ACT1[n];
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (o.tx != null) tgt = {x:o.tx, y:o.ty};
      const a = variant(getAct(name)); if (!a) return Promise.resolve(false);
      const p = run(a, {light:!!o.light}); p.then(ok => { if (ok) fireHit(); }); return p;
    },
    nextHit(){ return new Promise(r => hitW.push(r)); },
    idle(){ if (cur || held) return Promise.resolve(false); return run(variant(phase === 2 ? IDLE2 : IDLE1)); },
    has: n => !!ACT1[n],
    fx(name, o = {}){
      if (name === 'puff') { const f = {x:o.x, y:o.y}; flakes(f.x, f.y, o.n || 14, {sp:o.r || 60}); }
      else if (name === 'mark') mark = {x:o.x, y:o.y, t0:clk()}; else if (name === 'unmark') mark = null;
      else if (name === 'blood') { const f = feet(), n = o.n || 4; for (let i = 0; i < n; i++) { const sx = o.x + rnd(-30, 30), sy = (o.y || 1000) + rnd(-40, 20), dl = i * 90 + rnd(0, 60), d = 900;
          spr('blood', d, u => ({x:lerp(sx, f.x + rnd(-1, 1), eo(u)), y:lerp(sy, f.y - 330, eo(u)) - 120 * Math.sin(Math.PI * u), s:.16 * (1 - .3 * u), a:1 - seg(u, .8, 1), ax:.5, ay:.5}), {delay:dl}); } }
      else if (name === 'phase') phase = o.p || 2; },
    setMode(m){ mode = m || null; },
    setDead(){},
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } fxl = []; held = null; mark = null; mode = null; hitW = []; phase = 1; },
  };
}
window.HrimgarRig = {make};
})();
