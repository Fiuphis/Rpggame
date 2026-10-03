/* Banco de Dados I — RPG · Clériga (v47)
   Poses de COSTAS recortadas das folhas de fundo branco (clr/*.png): mesma escala, ancoradas no chão pelo mesmo ponto,
   trocadas com transição suave e brilhos dourados. Habilidades dela: ataque normal (cajado), ataque sagrado, defesa normal/sagrada, esquiva, Luz Sagrada.
   Ociosa: lê a Bíblia, toca no livro, reza — sorteado, sem ficar se mexendo o tempo todo. */
(() => {
'use strict';
const POSES = ['at1','at3','stf','ult1','ult2','bp1','bp2','bp3','bg1','bg2','bg3','bg4','br1','br2','br3','br4','br5','br6','bt1','bt2','bt3','bt4','d1','d2','d3','d4'];
const FXS = ['star1','star2','star3','ring1','ring2','ring3','pillar','lotus','burst','aura','streak1','streak2','streak3','sunstar','star4','pillar2','cross1'];
const T = {x:517, y:340};
const BASE = 292, SZ = 0.82, XOFF = -46;      // Maga e Clériga: as duas menores (Cavaleiro 261, Tanque 314), mesmo tamanho
const PS = {ult1:1.12,ult2:1.1,at1:1.04,bp3:0.96,at2:1.13,hat2:1.13,dn2:1.11,dn3:1.14,dg2:1.1,dg3:1.1,v1:1.1,d1:1.1,d2:1.1,d3:1.1,d4:1.1,bg4:1.1};   // poses cuja escala na folha destoa das demais      // pés mais para a frente (baixo) e um pouco maior
const GOLD = '255,214,120';
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3), ei = u => u * u * u;
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));
const S = (d, steps, ev = [], o = {}) => ({dur:d, steps, ev, ...o});

const ACT = {   // só poses de COSTAS (bp, bg, br, bt) — base: bp1
  melee:[   // cajado (at1/at3/stf) e Bíblia (bt/bg)
    S(1300, [[0,'bp1'],[.14,'at1',{dx:-3}],[.34,'at1',{dx:-5}],[.54,'at3',{dx:4,dy:-4}],[.82,'at3',{dx:2}],[.96,'bp1']], [[.2,'charge'],[.5,'shot:streak1:.9:'],[.76,'hit:small']]),
    S(1400, [[0,'bp1'],[.12,'stf',{dx:-2}],[.34,'at1',{dx:-4}],[.54,'at3',{dx:4,dy:-4}],[.82,'at3',{dx:2}],[.96,'bp1']], [[.3,'charge'],[.54,'shot:streak2:.9:flat'],[.78,'hit:small2']]),
    S(1500, [[0,'bp1'],[.14,'at1',{dx:-3}],[.32,'stf',{dx:-6}],[.52,'at3',{dx:6,dy:-5}],[.84,'at3',{dx:2}],[.96,'bp1']], [[.22,'charge'],[.56,'shot:streak3:1:zig'],[.8,'hit:small3']]),
    S(1400, [[0,'bp1'],[.14,'bg3',{dx:-3}],[.34,'bt1',{dx:-5}],[.54,'bt2',{dx:3,dy:-3}],[.82,'bt2',{dx:2}],[.96,'bp1']], [[.2,'charge'],[.5,'shot:star4:.9:twin'],[.76,'hit:small4']]),
    S(1500, [[0,'bp1'],[.12,'br2'],[.3,'br1',{dx:-3}],[.52,'bt1',{dx:4,dy:-3}],[.84,'bt3',{dx:2}],[.96,'bp1']], [[.26,'charge'],[.54,'shot:cross1:.9:flat'],[.8,'hit:small3']]),
    S(1500, [[0,'bp1'],[.12,'stf',{dx:-2}],[.3,'at1',{dx:-4}],[.5,'at3',{dx:5,dy:-4}],[.82,'at3',{dx:2}],[.96,'bp1']], [[.2,'charge'],[.52,'shot:sunstar:.9:twin'],[.78,'hit:small4']]),
    S(1500, [[0,'bp1'],[.12,'bg3'],[.3,'bt1',{dx:-4}],[.5,'bt4',{dy:-4}],[.82,'bt4',{dx:2}],[.96,'bp1']], [[.24,'charge'],[.54,'shot:star4:1:zig'],[.8,'hit:small']]),
  ],
  holy:[
    S(2300, [[0,'bp1'],[.1,'at1',{dx:-3}],[.3,'ult1',{dy:-2}],[.5,'ult2',{dy:-6}],[.8,'ult2',{dy:-4}],[.97,'bp1']], [[.14,'charge'],[.3,'charge'],[.52,'shot:sunstar:1.3:'],[.8,'hit:holy']]),
    S(2500, [[0,'bp1'],[.1,'stf',{dx:-2}],[.28,'at3',{dy:-3}],[.48,'ult1',{dy:-3}],[.66,'ult2',{dy:-6}],[.84,'ult2',{dy:-4}],[.97,'bp1']], [[.14,'charge'],[.32,'charge'],[.5,'charge'],[.7,'shot:cross1:1.3:flat'],[.92,'hit:holy2']]),
    S(2100, [[0,'bp1'],[.1,'bp3',{dx:-3}],[.3,'bt1',{dy:-3}],[.5,'bt4',{dy:-4}],[.78,'bt4',{dx:2}],[.97,'bp1']], [[.14,'charge'],[.3,'charge'],[.52,'shot:star4:1.2:twin'],[.8,'hit:holy3']]),
    S(2400, [[0,'bp1'],[.1,'br2'],[.3,'br1',{dy:-2}],[.5,'bt2',{dx:-3}],[.64,'bt4',{dy:-4}],[.8,'bt4',{dx:3}],[.97,'bp1']], [[.14,'charge'],[.32,'charge'],[.5,'charge'],[.68,'shot:cross1:1.3:zig'],[.9,'hit:holy4']]),
    S(2600, [[0,'bp1'],[.08,'bp3'],[.2,'bt1'],[.3,'bt2'],[.4,'bt3'],[.5,'bt4',{dy:-2}],[.62,'bt4',{dy:-4}],[.78,'bt4',{dx:3}],[.97,'bp1']], [[.2,'charge'],[.36,'charge'],[.5,'charge'],[.66,'shot:sunstar:1.4:twin'],[.9,'hit:holy5']]),
    S(2600, [[0,'bp1'],[.08,'br4'],[.2,'br5'],[.34,'br3'],[.5,'bg3'],[.62,'bt1',{dy:-3}],[.76,'bt4',{dy:-4}],[.97,'bp1']], [[.2,'charge'],[.4,'charge'],[.58,'charge'],[.72,'shot:sunstar:1.5:flat'],[.92,'hit:holy3']]),
  ],
  guard_n:[
    S(1900, [[0,'bp1'],[.14,'br1'],[.34,'br3'],[.6,'br3'],[.9,'br3'],[.98,'bp1']], [[.3,'shield']]),
    S(1900, [[0,'bp1'],[.14,'bp2'],[.34,'br2'],[.6,'br2',{dy:-2}],[.9,'br2'],[.98,'bp1']], [[.3,'shield:n2']]),
    S(1900, [[0,'bp1'],[.14,'bg2'],[.34,'br1'],[.6,'br1',{dy:-2}],[.9,'br1'],[.98,'bp1']], [[.3,'shield:n3']]),
    S(1900, [[0,'bp1'],[.14,'stf'],[.34,'at1'],[.6,'at1',{dy:-2}],[.9,'at1'],[.98,'bp1']], [[.3,'shield:n2']]),
  ],
  guard_h:[
    S(1900, [[0,'bp1'],[.14,'bp3'],[.3,'bt4'],[.9,'bt4',{dy:-2}],[.98,'bp1']], [[.26,'shield:holy']]),
    S(1900, [[0,'bp1'],[.12,'br2'],[.3,'bt2'],[.9,'bt2',{dy:-2}],[.98,'bp1']], [[.26,'shield:holy2']]),
    S(1900, [[0,'bp1'],[.12,'bg3'],[.3,'bt1'],[.9,'bt1',{dy:-2}],[.98,'bp1']], [[.26,'shield:holy3']]),
    S(1900, [[0,'bp1'],[.12,'at1'],[.3,'ult1'],[.9,'ult1',{dy:-2}],[.98,'bp1']], [[.26,'shield:holy2']]),
  ],
  ult:[
    S(5200, [[0,'bp1'],[.08,'br1'],[.16,'bp3'],[.26,'bt1',{dy:-2}],[.42,'bt4',{dy:-6}],[.82,'bt4',{dy:-4}],[.96,'bp1']], [[.3,'lightup'],[.46,'lightpillar'],[.62,'lightpillar2'],[.78,'lightend']]),
    S(5200, [[0,'bp1'],[.08,'br2'],[.16,'br1'],[.26,'bt2',{dy:-2}],[.42,'bt4',{dy:-6}],[.82,'bt4',{dy:-4}],[.96,'bp1']], [[.3,'lightup'],[.46,'lightpillar2'],[.62,'lightpillar'],[.78,'lightend']]),
    S(5200, [[0,'bp1'],[.08,'stf'],[.16,'at1'],[.26,'ult1',{dy:-2}],[.42,'ult2',{dy:-6}],[.82,'ult2',{dy:-4}],[.96,'bp1']], [[.3,'lightup'],[.46,'lightpillar'],[.62,'lightpillar2'],[.78,'lightend']]),
    S(5400, [[0,'bp1'],[.08,'bg3'],[.16,'br1'],[.26,'bt3',{dy:-2}],[.42,'bt4',{dy:-6}],[.82,'bt4',{dy:-4}],[.96,'bp1']], [[.3,'lightup2'],[.46,'lightpillar2'],[.62,'lightpillar'],[.78,'lightend2']]),
    S(5400, [[0,'bp1'],[.08,'br2'],[.16,'at1'],[.26,'ult1',{dy:-2}],[.42,'bt4',{dy:-6}],[.82,'bt4',{dy:-4}],[.96,'bp1']], [[.3,'lightup'],[.46,'lightpillar'],[.62,'lightpillar'],[.78,'lightend2']]),
    S(5600, [[0,'bp1'],[.08,'stf'],[.16,'br1'],[.26,'bt1',{dy:-2}],[.42,'ult2',{dy:-6}],[.82,'ult2',{dy:-4}],[.96,'bp1']], [[.3,'lightup2'],[.46,'lightpillar2'],[.62,'lightpillar2'],[.78,'lightend']]),
    S(5600, [[0,'bp1'],[.08,'bp3'],[.16,'bt2'],[.26,'bt3',{dy:-2}],[.42,'bt4',{dy:-6}],[.82,'bt4',{dy:-4}],[.96,'bp1']], [[.3,'lightup2'],[.46,'lightpillar'],[.62,'lightpillar2'],[.78,'lightend2']]),
  ],
  dodge:[
    S(1050, [[0,'bp1'],[.1,'bg1',{dx:-6}],[.3,'bg2',{dx:-34,dy:-2}],[.52,'bg2',{dx:-50}],[.72,'bg1',{dx:-30}],[.9,'bp1']], [], {ghost:true}),
    S(1050, [[0,'bp1'],[.1,'bg1',{dx:6}],[.3,'bg4',{dx:30,dy:-2}],[.52,'bg4',{dx:44}],[.72,'bg2',{dx:26}],[.9,'bp1']], [], {ghost:true, gdir:-1}),
    S(1050, [[0,'bp1'],[.1,'bp2',{dx:-4}],[.3,'bg4',{dx:-24,dy:-8}],[.5,'bg4',{dx:-40,dy:-2}],[.72,'bp2',{dx:-20}],[.9,'bp1']], [], {ghost:true}),
  ],
  hurt:[
    S(800, [[0,'bp1'],[.1,'bp2',{dx:-8,rot:-4}],[.34,'bp2',{dx:4,rot:-2}],[.6,'bp2',{dx:-2}],[.92,'bp1']], [], {tint:true}),
    S(800, [[0,'bp1'],[.12,'bg2',{dx:-8,rot:-6}],[.36,'bg2',{dx:4,rot:-2}],[.62,'bg2'],[.92,'bp1']], [], {tint:true}),
    S(800, [[0,'bp1'],[.12,'bg4',{dx:-6,dy:2,rot:-5}],[.36,'bg4',{dx:3,rot:-2}],[.62,'bg4'],[.92,'bp1']], [], {tint:true}),
  ],
  victory:[
    S(2800, [[0,'bp1'],[.12,'at1',{dy:-2}],[.34,'ult1',{dy:-4}],[.56,'ult2',{dy:-6}],[.8,'ult2',{dy:-5}],[.96,'bp1']], [[.14,'cheer'],[.36,'cheer:cross'],[.6,'cheer'],[.82,'cheer:rise']]),
    S(2800, [[0,'bp1'],[.12,'bp3',{dy:-2}],[.34,'bt4',{dy:-6}],[.56,'bt1',{dy:-4}],[.8,'bt4',{dy:-6}],[.96,'bp1']], [[.14,'cheer'],[.36,'cheer:cross'],[.6,'cheer'],[.82,'cheer:cross']]),
    S(3000, [[0,'bp1'],[.14,'br2'],[.3,'br1',{dy:-4}],[.5,'bt2',{dy:-4}],[.7,'bt4',{dy:-6}],[.96,'bp1']], [[.3,'cheer'],[.52,'cheer:rise'],[.72,'cheer:cross']]),
    S(3000, [[0,'bp1'],[.14,'bg3'],[.3,'bt3',{dy:-3}],[.5,'bt4',{dy:-6}],[.74,'bt4',{dy:-5}],[.96,'bp1']], [[.3,'cheer:rise'],[.52,'cheer'],[.76,'cheer:cross']]),
  ],
};
const BIBLE = [[0,'bp1'],[.05,'bp2'],[.1,'bg3'],[.15,'bt1'],[.21,'br1'],[.27,'br2'],[.33,'br3'],[.4,'br4'],[.5,'br5'],[.62,'br6'],[.72,'br5'],[.78,'bg1'],[.84,'bg2'],[.9,'bg3'],[.95,'bg4'],[.98,'bp1']];
const IDLES = [   // ociosa: sorteada, com pausas longas entre uma e outra
  S(7500, BIBLE),
  S(7000, [[0,'bp1'],[.08,'bp2'],[.16,'br1'],[.28,'br3'],[.42,'br4'],[.58,'br5'],[.7,'br6'],[.82,'br2'],[.92,'bg4'],[.98,'bp1']]),
  S(3600, [[0,'bp1'],[.1,'bp2'],[.2,'bg3'],[.3,'bt1'],[.45,'bt2'],[.6,'bt3'],[.75,'bt4'],[.88,'bg2'],[.97,'bp1']], [[.3,'sparkle'],[.62,'sparkle']]),
  S(3200, [[0,'bp1'],[.18,'bp3'],[.4,'bt4'],[.8,'bt1'],[.97,'bp1']], [[.4,'sparkle']]),
  S(2800, [[0,'bp1'],[.2,'bg1'],[.5,'bg2'],[.75,'bg1'],[.97,'bp1']]),
  S(2600, [[0,'bp1'],[.2,'bg4'],[.7,'bg4'],[.97,'bp1']]),
];
const ORB = {at1:[125,40], at3:[85,35], stf:[165,35], ult1:[90,60], ult2:[45,70], bt1:[155,72], bt2:[140,50], bt3:[130,80], bt4:[127,35], bp3:[120,100], bg3:[120,90], br1:[120,55], br2:[20,40]};   // ponto de luz (cruz/estrela) em cada pose
IDLES.forEach(a => { a.dur = Math.round(a.dur * 1.7); });      // movimentos de ociosa mais lentos
const bags = new WeakMap();
const variant = v => { if (!Array.isArray(v)) return v; if (window.__vi != null) return v[window.__vi % v.length]; let b = bags.get(v); if (!b || !b.l.length) { const l = v.map((_, i) => i); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } if (b && l.length > 1 && l[0] === b.last) [l[0], l[l.length - 1]] = [l[l.length - 1], l[0]]; b = {l, last:b ? b.last : -1}; bags.set(v, b); } const i = b.l.shift(); b.last = i; return v[i]; };   // sacola embaralhada: nunca repete a mesma variação em seguida, e usa todas antes de repetir
const DEATH = [[0,'d1'],[.3,'d2'],[.58,'d3'],[.82,'d4']];

function glow(g, x, y, r, col, a){
  if (a <= 0.005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,250,235,${clamp(a * .6)})`); gr.addColorStop(.16, `rgba(${col},${clamp(a)})`); gr.addColorStop(.5, `rgba(${col},${clamp(a * .32)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, front = layers.front, fc = front.getContext('2d'), back = layers.back, bc = back.getContext('2d');
  let backUsed = false;
  const cw = cv.width, ch = cv.height, OX = world.x - Px, OY = world.y - Py;
  let M = null; const img = {};
  const load = (k, src) => img[k] || (img[k] = Object.assign(new Image(), {src}));
  fetch('clr/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => load(n, `clr/${n}.png`)); FXS.forEach(n => load('fx_' + n, `clr/fx_${n}.png`)); }).catch(() => {});
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); }; let chargeT = -9999, orbVis = 0, fxl = [], cur = null, shakeT = 0, flashT = 0, last = 0, t0 = clk(), running = false;
  let dead = 0, deadTarget = 0, deadT = 0, prev = null, curPose = null, orbW = {x:world.x + 150, y:world.y + 40}, lastT = {dx:0, dy:0, rot:0, sc:1}, cur_t = 0, fade = 240;
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), add: o.add !== false, bk: !!o.back});
  const orbPos = () => ({...orbW});
  const dir = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const feet = () => ({x:world.x + W / 2 + XOFF, y:world.y + BASE});
  let tgt = null; const tf = () => tgt ? {x:tgt.x, y:feet().y} : feet();   // alvo da Luz Sagrada

  function shot(name, size, style = '', ko = null){      // estilos: arco (padrão), flat (reto e rápido), zig (zigue-zague), twin (dois)
    if (style === 'twin' && ko == null) { shot(name, size * .85, '', -38); shot(name, size * .85, '', 38); return; }
    const a = orbPos(), b = T, dist = Math.hypot(b.x - a.x, b.y - a.y), flat = style === 'flat', zig = style === 'zig', d = (flat ? 380 : zig ? 620 : 560) + dist * (flat ? .35 : .55), ang = dir(a, b), k = ko != null ? ko : rnd(-1, 1) * 24, lift = flat ? 6 : 46;
    const path = u => { const e = Math.pow(u, flat ? 1.2 : 1.8), w = Math.sin(Math.PI * u); return {x:lerp(a.x, b.x, e) + k * w + Math.sin(u * 11) * 6 * w + (zig ? Math.sin(u * 22) * 46 * w : 0), y:lerp(a.y, b.y, e) - w * lift}; };
    const fade = u => u < .1 ? u / .1 : u > .94 ? (1 - u) / .06 : 1, streak = /^streak/.test(name);
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:(70 + 22 * Math.sin(u * 28)) * size * (.6 + .6 * u), c:GOLD, a:.85 * fade(u)}; });
    E('fx_' + name, d, u => { const p = path(u), q = path(Math.min(1, u + .04)); return {x:p.x, y:p.y, s:size * (streak ? 1.1 : 1.0) * (.6 + .5 * Math.sin(Math.min(1, u * 1.3) * 1.57)), rot:streak ? Math.atan2(q.y - p.y, q.x - p.x) + 3.14 : name === 'star4' ? u * 7 : Math.sin(u * 6) * .3, a:fade(u) * .95}; });
    for (let i = 1; i <= 11; i++) { const ut = i / 12, p = path(ut); E('glow', 520, v => ({x:p.x + Math.sin(i * 3) * 6 * v, y:p.y - 12 * v, r:(54 * size) * (1 - v * .6), c:GOLD, a:.5 * (1 - v)}), {delay:ut * d}); }
    for (let i = 0; i < 9; i++) { const ut = (i + .5) / 9 * .95, p = path(ut), ox = rnd(-18, 18), oy = rnd(-18, 18); E('fx_star' + (1 + i % 3), 600, v => ({x:p.x + ox * v, y:p.y + oy * v - 16 * v, s:.45 * (1 - v), rot:v * 2, a:1 - v}), {delay:ut * d}); }
  }
  function hit(kind){
    const bl = (r, col, a, dl = 0, d = 650) => E('glow', d, u => ({...T, r:r * (.4 + eo(u) * .9), c:col, a:a * (1 - u) * (u < .08 ? u / .08 : 1)}), {delay:dl});
    if (kind === 'small2') { bl(110, GOLD, .9); bl(70, '255,255,255', .8, 0, 420); E('fx_cross1', 640, u => ({...T, s:lerp(.35, .8, eo(u)), a:(u < .1 ? u / .1 : 1 - seg(u, .1, 1)) * .9})); E('fx_star4', 520, u => ({...T, s:lerp(.2, .55, eo(u)), rot:u * 1.2, a:1 - u})); }
    else if (kind === 'small3') { bl(120, GOLD, .85); E('fx_ring3', 620, u => ({x:T.x, y:T.y + 40, s:lerp(.3, 1, eo(u)), sy:.6, a:(1 - u) * .8})); for (let i = 0; i < 5; i++) { const an = i * 1.26; E('fx_star' + (1 + i % 3), 600, u => ({x:T.x + Math.cos(an) * 70 * eo(u), y:T.y + Math.sin(an) * 60 * eo(u), s:.45 * (1 - u), a:1 - u})); } }
    else if (kind === 'holy2') { bl(260, GOLD, 1, 0, 1000); bl(150, '255,255,255', .9, 0, 520); E('fx_cross1', 900, u => ({...T, s:lerp(.6, 1.7, eo(u)), a:(u < .08 ? u / .08 : 1 - seg(u, .1, 1)) * .95})); E('fx_pillar', 1000, u => ({x:T.x, y:T.y + 100, s:1.3, sy:lerp(.2, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .3, 1)}), {delay:60}); shakeT = clk(); }
    else if (kind === 'holy3') { bl(280, GOLD, 1, 0, 1000); bl(160, '255,255,255', .9, 0, 520); E('fx_burst', 1000, u => ({x:T.x, y:T.y + 100, s:1.5, sy:lerp(.3, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .3, 1)})); E('fx_ring2', 900, u => ({x:T.x, y:T.y + 80, s:lerp(.4, 1.9, eo(u)), sy:.5, a:(1 - u) * .85})); E('fx_star4', 800, u => ({...T, s:lerp(.4, 1.3, eo(u)), rot:u * 1.6, a:(1 - u) * .9})); shakeT = clk(); }
    else if (kind === 'small4') { bl(125, GOLD, .9); E('fx_ring1', 640, u => ({x:T.x, y:T.y + 50, s:lerp(.3, 1.1, eo(u)), sy:.5, a:(1 - u) * .9})); E('fx_star4', 640, u => ({...T, s:lerp(.2, .8, eo(u)), rot:-u * 2, a:1 - u})); E('fx_pillar2', 620, u => ({x:T.x, y:T.y + 70, s:.7, sy:lerp(.2, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .3, 1)})); }
    else if (kind === 'holy4') { bl(270, GOLD, 1, 0, 1000); bl(150, '255,255,255', .9, 0, 520); E('fx_lotus', 1100, u => ({x:T.x, y:T.y + 90, s:lerp(.6, 2.2, eo(Math.min(1, u * 1.5))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .4, 1)})); E('fx_ring2', 900, u => ({x:T.x, y:T.y + 80, s:lerp(.4, 2.2, eo(u)), sy:.5, a:(1 - u) * .85})); E('fx_ring2', 800, u => ({x:T.x, y:T.y + 80, s:lerp(.3, 1.5, eo(u)), sy:.5, a:(1 - u) * .8}), {delay:160}); for (let i = 0; i < 8; i++) { const an = i * .785; E('fx_star' + (1 + i % 3), 900, u => ({x:T.x + Math.cos(an) * 140 * eo(u), y:T.y + 20 + Math.sin(an) * 70 * eo(u) - 60 * u, s:.55 * (1 - u * .4), a:Math.sin(Math.PI * u)}), {delay:80}); } shakeT = clk(); }
    else if (kind === 'holy5') { bl(290, GOLD, 1, 0, 1000); bl(170, '255,255,255', .9, 0, 520); for (let i = 0; i < 3; i++) E('fx_pillar', 1000, u => ({x:T.x + (i - 1) * 90, y:T.y + 100, s:1.0, sy:lerp(.2, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .3, 1)}), {delay:i * 120}); E('fx_sunstar', 900, u => ({...T, s:lerp(.5, 2, eo(u)), rot:u, a:(u < .08 ? u / .08 : 1 - seg(u, .08, 1)) * .9}), {delay:200}); E('fx_cross1', 900, u => ({x:T.x, y:T.y - 40, s:lerp(.5, 1.6, eo(u)), a:(1 - u) * .9}), {delay:300}); shakeT = clk(); }
    else if (kind === 'small') { bl(120, GOLD, .9); E('fx_sunstar', 560, u => ({...T, s:lerp(.4, .9, eo(u)), a:(u < .1 ? u / .1 : 1 - seg(u, .1, 1)) * .85})); }
    else { bl(260, GOLD, 1, 0, 1000); bl(150, '255,255,255', .9, 0, 520); E('fx_sunstar', 800, u => ({...T, s:lerp(.5, 1.7, eo(u)), a:(u < .08 ? u / .08 : 1 - seg(u, .08, 1)) * .9})); E('fx_pillar2', 900, u => ({x:T.x, y:T.y + 80, s:1.1, sy:lerp(.2, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .3, 1)}), {delay:60}); E('fx_ring1', 800, u => ({x:T.x, y:T.y + 60, s:lerp(.5, 1.8, eo(u)), sy:.45, a:(1 - u) * .8})); shakeT = clk(); }
  }
  const EV = {
    charge(){ chargeT = clk(); E('glow', 1000, u => ({...orbPos(), r:lerp(30, 115, eo(u)), c:GOLD, a:.9 * Math.sin(Math.PI * Math.min(1, u * 1.15))}));
      E('fx_ring3', 1100, u => ({x:feet().x, y:feet().y - 4, s:lerp(.6, .9, u), sy:.3, a:.5 * Math.sin(Math.PI * u)}));
      for (let i = 0; i < 8; i++) { const an = i * .79 + rnd(0, .5); E('fx_star' + (1 + i % 3), 760, u => { const r = 100 * (1 - eo(u)) + 8, o = orbPos(); return {x:o.x + Math.cos(an + u * 2) * r, y:o.y + Math.sin(an + u * 2) * r * .8, s:.4 * (.5 + u * .5), rot:u * 3, a:Math.sin(Math.PI * u)}; }, {delay:i * 70}); } },
    sparkle(){ const o = orbPos(), f = feet(); for (let i = 0; i < 6; i++) { const an = rnd(0, 6.28); E('fx_star' + (1 + i % 3), 900, u => ({x:f.x + Math.cos(an) * 40 * eo(u), y:f.y - 110 - 40 * u + Math.sin(an) * 30 * eo(u), s:.4 * (1 - u * .5), a:Math.sin(Math.PI * u)}), {delay:i * 120}); } },
    cheer(k){ const f = feet(); if (k === 'cross') { E('fx_cross1', 900, u => ({x:f.x, y:f.y - 250 - 20 * u, s:lerp(.4, .8, eo(u)), a:Math.sin(Math.PI * u)})); E('glow', 800, u => ({x:f.x, y:f.y - 250, r:lerp(40, 120, eo(u)), c:GOLD, a:.6 * (1 - u)})); return; } if (k === 'rise') { E('fx_pillar', 1200, u => ({x:f.x, y:f.y + 4, s:1, sy:lerp(.3, 1, eo(Math.min(1, u * 2))), anchorB:1, a:.7 * Math.sin(Math.PI * u)}), {back:true}); return; } E('glow', 700, u => ({x:f.x, y:f.y - 120, r:lerp(40, 140, eo(u)), c:GOLD, a:.6 * (1 - u)})); for (let i = 0; i < 5; i++) { const an = i * 1.3; E('fx_star' + (1 + i % 3), 800, u => ({x:f.x + Math.cos(an) * 70 * eo(u), y:f.y - 130 + Math.sin(an) * 50 * eo(u) - 24 * u, s:.5 * (1 - u), a:1 - u}), {delay:i * 90}); } },
    shield(k){ const f = feet(), h = /^holy/.test(k || '');
      if (k === 'n2') { for (let i = 0; i < 3; i++) E('fx_ring1', 1500, u => ({x:f.x, y:f.y - 6 - 60 * i * u, s:lerp(.5, 1, eo(u)), sy:.3, a:.5 * Math.sin(Math.PI * u)}), {delay:i * 260}); E('glow', 1700, u => ({x:f.x, y:f.y - 100, r:130, c:'255,236,190', a:.3 * Math.sin(Math.PI * u)}), {back:true}); return; }
      if (k === 'n3') { E('fx_pillar', 1700, u => ({x:f.x, y:f.y + 4, s:1.1, sy:1, anchorB:1, a:.35 * Math.sin(Math.PI * u)}), {back:true}); for (let i = 0; i < 6; i++) { const an = i * 1.05; E('fx_star' + (1 + i % 3), 1200, u => ({x:f.x + Math.cos(an) * 60, y:f.y - 30 - 160 * u, s:.4, a:Math.sin(Math.PI * u)}), {delay:i * 160}); } return; }
      if (k === 'holy2') { E('fx_lotus', 1700, u => ({x:f.x, y:f.y + 6, s:lerp(.5, .8, eo(u)), anchorB:1, a:.8 * Math.sin(Math.PI * u)})); E('fx_aura', 1700, u => ({x:f.x, y:f.y - 120, s:.95, a:.5 * Math.sin(Math.PI * u)}), {back:true}); E('glow', 1700, u => ({x:f.x, y:f.y - 115, r:170, c:GOLD, a:.5 * Math.sin(Math.PI * u)}), {back:true}); return; }
      if (k === 'holy3') { E('fx_cross1', 1700, u => ({x:f.x, y:f.y - 250, s:.6, a:.9 * Math.sin(Math.PI * u)})); E('fx_ring2', 1600, u => ({x:f.x, y:f.y - 6, s:lerp(.5, 1.2, eo(u)), sy:.3, a:.8 * Math.sin(Math.PI * u)})); E('fx_aura', 1700, u => ({x:f.x, y:f.y - 120, s:1, a:.45 * Math.sin(Math.PI * u)}), {back:true}); for (let i = 0; i < 8; i++) { const an = i * .8; E('fx_star' + (1 + i % 3), 1100, u => ({x:f.x + Math.cos(an) * 75, y:f.y - 30 - 170 * u, s:.45, a:Math.sin(Math.PI * u)}), {delay:i * 150}); } return; }
      E('glow', 1700, u => ({x:f.x, y:f.y - 115, r:h ? 175 : 140, c:h ? GOLD : '255,236,190', a:(h ? .55 : .38) * Math.sin(Math.PI * u)}), {back:true});
      E('fx_aura', 1700, u => ({x:f.x, y:f.y - 120, s:lerp(.75, .95, eo(u)), a:(u < .12 ? u / .12 : u > .8 ? (1 - u) / .2 : 1) * (h ? .55 : .3)}), {back:true});
      E('fx_ring1', 1500, u => ({x:f.x, y:f.y - 6, s:lerp(.6, 1.1, eo(u)), sy:.3, a:(h ? .8 : .45) * Math.sin(Math.PI * u)}));
      for (let i = 0; i < (h ? 7 : 4); i++) { const an = i * .9; E('fx_star' + (1 + i % 3), 1100, u => ({x:f.x + Math.cos(an) * 70, y:f.y - 40 - 150 * u + Math.sin(an) * 20, s:.4, a:Math.sin(Math.PI * u)}), {delay:i * 180}); } },
    lightup(){ const f = tf(); if (!tgt) flashT = clk(); E('fx_ring2', 2600, u => ({x:f.x, y:f.y - 4, s:lerp(.5, 1.3, eo(u)), sy:.32, rot:0, a:u < .1 ? u / .1 : 1 - seg(u, .6, 1)})); E('fx_lotus', 2400, u => ({x:f.x, y:f.y + 6, s:lerp(.5, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .12 ? u / .12 : 1 - seg(u, .55, 1)})); },
    lightpillar(){ const f = tf(); E('fx_pillar', 2400, u => ({x:f.x, y:f.y + 4, s:1.5, sy:lerp(.2, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .5, 1)}), {back:true}); E('glow', 2400, u => ({x:f.x, y:f.y - 140, r:lerp(60, 230, eo(Math.min(1, u * 1.6))), c:GOLD, a:.8 * Math.sin(Math.PI * u)})); },
    lightpillar2(){ const f = tf(); E('fx_burst', 1800, u => ({x:f.x, y:f.y + 4, s:1.7, sy:lerp(.3, 1, eo(Math.min(1, u * 2))), anchorB:1, a:u < .1 ? u / .1 : 1 - seg(u, .4, 1)}), {back:true}); for (let i = 0; i < 10; i++) { const an = i * .63; E('fx_star' + (1 + i % 3), 1400, u => ({x:f.x + Math.cos(an) * 80 * eo(u), y:f.y - 60 - 160 * u + Math.sin(an) * 30, s:.5 * (1 - u * .4), a:Math.sin(Math.PI * u)}), {delay:i * 110}); } },
    lightup2(){ const f = tf(); if (!tgt) flashT = clk(); E('fx_ring2', 2600, u => ({x:f.x, y:f.y - 4, s:lerp(1.3, .6, eo(u)), sy:.32, a:u < .1 ? u / .1 : 1 - seg(u, .6, 1)})); E('fx_ring1', 2200, u => ({x:f.x, y:f.y - 4, s:lerp(.4, 1.2, eo(u)), sy:.3, a:.8 * Math.sin(Math.PI * u)})); for (let i = 0; i < 8; i++) { const an = i * .78; E('fx_star' + (1 + i % 3), 1500, u => ({x:f.x + Math.cos(an) * 90 * (1 - u * .5), y:f.y - 20 - 150 * u + Math.sin(an) * 20, s:.45, a:Math.sin(Math.PI * u)}), {delay:i * 160}); } },
    lightend2(){ const f = tf(); E('glow', 900, u => ({x:f.x, y:f.y - 140, r:lerp(80, 360, eo(u)), c:GOLD, a:.9 * (1 - u)})); E('fx_sunstar', 800, u => ({x:f.x, y:f.y - 140, s:lerp(.4, 2.3, eo(u)), rot:u * 2, a:1 - u})); E('fx_cross1', 900, u => ({x:f.x, y:f.y - 200 - 40 * u, s:lerp(.4, 1, eo(u)), a:Math.sin(Math.PI * u)})); if (!tgt) flashT = clk(); },
    lightend(){ const f = tf(); E('glow', 900, u => ({x:f.x, y:f.y - 140, r:lerp(100, 320, eo(u)), c:'255,240,200', a:.9 * (1 - u)})); E('fx_sunstar', 800, u => ({x:f.x, y:f.y - 140, s:lerp(.6, 2, eo(u)), a:1 - u})); if (!tgt) flashT = clk(); },
  };
  function runEv(e){ if (typeof e === 'function') return e(); const [k, a, b] = e.split(':'); if (k === 'shot') shot(a, +b, e.split(':')[3]); else if (k === 'hit') { hit(a); fireHit(); } else if (EV[k]) EV[k](a); }

  function poseAt(a, pe){
    const st = a.steps; let i = 0; while (i < st.length - 1 && pe >= st[i + 1][0]) i++;
    const A = st[i], B = st[Math.min(i + 1, st.length - 1)], u = A === B ? 1 : ease(clamp((pe - A[0]) / (B[0] - A[0])));
    const ta = A[2] || {}, tb = B[2] || {};
    return {pose:A[1], dx:lerp(ta.dx || 0, tb.dx || 0, u), dy:lerp(ta.dy || 0, tb.dy || 0, u), rot:lerp(ta.rot || 0, tb.rot || 0, u), sc:1};
  }
  function drawPose(name, dx, dy, rot, alpha, tm, tint, sc = 1, br0 = 1){
    const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return null;
    const br = Math.sin(tm / 1000 * 2.2) * br0, fx = Px + W / 2 + XOFF + dx, fy = Py + BASE + dy;
    c.save(); c.globalAlpha = alpha; c.translate(fx, fy); c.rotate(rot * Math.PI / 180); c.scale(SZ * (PS[name] || 1) * sc * (1 - .004 * br), SZ * (PS[name] || 1) * sc * (1 + .008 * br));
    c.drawImage(im, -m.cx, -m.gy);
    if (tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,40,40,${tint})`; c.fillRect(-m.cx, -m.gy, m.w, m.h); }
    c.restore();
    const orbp = ORB[name]; if (orbp) { const k = Math.cos(rot * Math.PI / 180), s = Math.sin(rot * Math.PI / 180), ox = (orbp[0] - m.cx) * SZ * (PS[name] || 1), oy = (orbp[1] - m.gy) * SZ * (PS[name] || 1); return {x:OX + fx + ox * k - oy * s, y:OY + fy + ox * s + oy * k}; }
    return null;
  }
  function frame(){
    if (!running) return; requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 16) return; last = now;
    if (!M) return;
    const tm = now - t0; let st, a = cur && cur.a, pe = 0;
    if (deadTarget) { const k = clamp((now - deadT) / 900); st = poseAt({steps:DEATH, dur:900}, k); }
    else if (cur) {
      pe = (now - cur.start) / a.dur; st = poseAt(a, clamp(pe));
      const ev = a.ev || []; while (cur.fired < ev.length && pe >= ev[cur.fired][0]) runEv(ev[cur.fired++][1]);
      if (pe >= 1) { const d = cur; cur = null; d.done(); }
    } else st = {pose:'bp1', dx:0, dy:0, rot:0, sc:1};
    if (st.pose !== curPose) { prev = curPose ? {pose:curPose, dx:lastT.dx, dy:lastT.dy, rot:lastT.rot, sc:lastT.sc || 1} : null; curPose = st.pose; cur_t = now; fade = cur || deadTarget ? 110 : 240; }
    lastT = st;
    const f = clamp((now - cur_t) / fade);
    c.clearRect(0, 0, cw, ch); if (!deadTarget) { c.save(); c.translate(Px - host.P + XOFF, Py - host.P + (BASE - 276)); host.shadow(c); c.restore(); } c.imageSmoothingEnabled = false;
    const tint = a && a.tint ? Math.sin(clamp(pe) * Math.PI) * .55 : 0;
    if (a && a.ghost) { const g = Math.sin(clamp(pe) * Math.PI), gd = a.gdir || 1; drawPose(st.pose, st.dx + 46 * g * gd, st.dy, st.rot, .18 * g, tm, 0, st.sc, 0); drawPose(st.pose, st.dx + 90 * g * gd, st.dy, st.rot, .10 * g, tm, 0, st.sc, 0); }
    if (prev && f < 1) drawPose(prev.pose, prev.dx, prev.dy, prev.rot, 1, tm, tint, prev.sc, deadTarget ? 0 : 1);
    const o = drawPose(st.pose, st.dx, st.dy, st.rot, prev && f < 1 ? f : 1, tm, tint, st.sc || 1, deadTarget ? 0 : 1);
    if (o) orbW = o; orbVis += ((o && !deadTarget ? 1 : 0) - orbVis) * .18;
    fc.clearRect(0, 0, front.width, front.height);
    if (orbVis > .02 && !(cur && cur.noGlow)) { const cb = Math.max(0, 1 - (now - chargeT) / 1100), pulse = .5 + .5 * Math.sin(tm / 330);
      glow(fc, orbW.x, orbW.y, (22 + 6 * pulse + 40 * cb) * (cur ? 1.15 : 1), GOLD, orbVis * (.3 + .15 * pulse + .35 * cb)); }
    if (backUsed) { bc.clearRect(0, 0, back.width, back.height); backUsed = false; }
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), im = img[e.name], fc = e.bk ? bc : front.getContext('2d'); if (e.bk) backUsed = true;
      if (e.name === 'glow') { if (!s) return true; glow(fc, s.x, s.y, s.r, s.c, s.a); return true; }
      if (!ready(e.name) || !s) return true;
      const w = im.naturalWidth * (s.s || 1) * (s.sx || 1), h = im.naturalHeight * (s.s || 1) * (s.sy || 1);
      fc.save(); fc.globalAlpha = clamp(s.a == null ? 1 : s.a); fc.globalCompositeOperation = e.add ? 'lighter' : 'source-over'; fc.translate(s.x, s.y); if (s.rot) fc.rotate(s.rot);
      FXSoft.draw(fc, im, -w / 2, s.anchorB ? -h : -h / 2, w, h, 1); fc.restore(); return true;
    });
    if (flashT && now >= flashT) { const u = (now - flashT) / 420; if (u < 1) { fc.save(); fc.fillStyle = `rgba(255,236,170,${.45 * (1 - u)})`; fc.fillRect(0, 0, front.width, front.height); fc.restore(); } else flashT = 0; }
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 1 * (1 - u)}px,${Math.cos(u * 50) * .8 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); cur = {a, start: clk(), fired: 0, done: ok => res(ok !== false), ...extra}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (deadTarget) return Promise.resolve(false);
      tgt = name === 'ult' && o.tx != null ? {x:o.tx} : null;
      if (name === 'guard') return run(variant(/ffe08a/i.test(o.color || '') ? ACT.guard_h : ACT.guard_n));
      if (name === 'cast') name = 'holy';
      const a = variant(ACT[name]); if (!a) return Promise.resolve(false); const p = run(a, name === 'ult' ? {noGlow:true} : undefined); p.then(fireHit); return p;
    },
    nextHit(){ return new Promise(r => hitW.push(r)); },
    idle(){ if (cur || deadTarget) return Promise.resolve(false); return run(variant(IDLES)); },
    has: n => !!ACT[n] || n === 'guard' || n === 'cast',
    setDead(d){ if (d) { if (cur) cur.done(false); cur = null; deadTarget = 1; deadT = clk(); } else { deadTarget = 0; flashT = clk(); } },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } fxl = []; deadTarget = 0; dead = 0; },
  };
}
window.ClericRig = {make};
})();
