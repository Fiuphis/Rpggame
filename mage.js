/* Banco de Dados I — RPG · Maga (v43)
   Poses de COSTAS recortadas da folha de fundo branco (mage4/*.png), todas na mesma escala e ancoradas no chão pelo mesmo ponto,
   trocadas com transição suave + movimento (deslocar, inclinar, respirar) e os efeitos originais da folha (mage4/fx_*.png).
   Só a Maga usa isto; os outros personagens continuam como imagem/sprite sheets. */
(() => {
'use strict';
const POSES = ['idle1','idle2','idle3','idle4','look','skirt','side','hip','stars','raise','glance','wave','scroll','potion','atk1','atk2','atk3','swingl','swingf','swingr','fire','air','water','earth','castdef','defmana','deffire','defwater','defair','defearth','spin1','spinwide','bh1','bh2','open','reach','kneel','dodge1','dodge2','dodge3','dodge4','dodge5','dodge6','hurt1','hurt2','fall','down'];
const FXS = ['comet','orbb','fire_fall','water_pillar','air_swirl','earth_spikes','rock','bh_seed','bh_small','bh_spikes','bh_big','bh_big2','bh_smoke','bolt','cross','crystal','whirl','mana_aura','orb_red','orb_orange','orb_blue','star_big','star_small','rocks','fire_burst','water_burst','air_burst','ring_floor','sh_mana','sh_fire','sh_water','sh_air','sh_earth'];
const T = {x:517, y:340};                                    // alvo no chefe (design 1024x1536)
const BASE = 258, MSZ = 0.91;                                  // Maga e Clériga: as duas menores (Cavaleiro 261, Tanque 314), mesmo tamanho
const PS = {fire:.93,air:.92,water:.9,earth:.95,atk2:.95,atk3:.93,spin1:.93,open:.93,defair:.9,dodge2:.93,swingr:.95,defmana:.95,castdef:.95,dodge3:.86,dodge4:.9,defwater:.88,kneel:.92,deffire:.94,spinwide:.9,dodge1:.95,defearth:.95};   // escala de cada pose ja embutida nos PNGs de mage4 (tools/cut_maga4.py)
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3), ei = u => u * u * u;
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));

// ---- ações: steps [t, pose, {dx,dy,rot}] (interpolados) · ev [t, 'nome'|fn]
const S = (d, steps, ev = [], o = {}) => ({dur:d, steps, ev, ...o});
const EL = {fire:{shot:'orb_red:.9', col:'255,110,40'}, water:{shot:'orb_blue:.9', col:'70,170,255'}, air:{shot:'orbb:1', col:'150,230,210'}, earth:{shot:'orb_orange:.9', col:'230,170,70'}};
const ELV = {fire:['', 'tri', 'rain', 'meteor'], water:['', 'tri', 'wave', 'ring'], air:['', 'twin', 'rise', 'tri'], earth:['', 'tri', 'sweep', 'rain']};
const elemV = e => { const {shot, col} = EL[e], o = {col}, V = ELV[e]; return [   // 4 variações: invocação direta · projétil + 3 efeitos · projétil duplo + chuva/onda · projétil reto + o efeito maior
  S(1900, [[0,'idle1'],[.1,e,{dx:-4}],[.8,e,{dx:2}],[.97,'idle1']], [[.2,'charge'],[.45,e+':'+V[0]]], o),
  S(2200, [[0,'idle1'],[.1,'atk1',{dx:-4}],[.28,e,{dy:-3}],[.5,e,{dy:-6}],[.62,'swingf',{dx:6}],[.88,'swingf',{dx:8}],[.98,'idle1']], [[.14,'charge'],[.3,'charge'],[.6,'shot:'+shot],[.74,e+':'+V[1]]], o),
  S(2300, [[0,'idle1'],[.1,'castdef'],[.34,'castdef',{dy:-4}],[.5,e,{dy:-4}],[.74,e,{dy:-2}],[.98,'idle1']], [[.12,'charge'],[.3,'charge'],[.5,'shot:'+shot+':twin'],[.66,e+':'+V[2]]], o),
  S(2400, [[0,'idle1'],[.1,'atk2',{dx:-8,rot:-3}],[.3,'stars',{dy:-6}],[.46,e,{dy:-4}],[.76,e],[.98,'idle1']], [[.16,'charge'],[.34,'cheer'],[.5,'shot:'+shot+':flat'],[.62,e+':'+V[3]]], o),
]; };
const ACT = {
  melee:[
    S(1050, [[0,'idle1'],[.12,'atk1',{dx:-4,rot:-2}],[.3,'atk2',{dx:-8,rot:-4}],[.48,'atk3',{dx:6,dy:-6,rot:3}],[.8,'atk3',{dx:2,rot:1}],[.96,'idle1']], [[.2,'charge'],[.47,'shot:orbb:1:'],[.78,'hit:small']]),
    S(1300, [[0,'idle1'],[.14,'atk1',{dx:-6}],[.36,'swingf',{dx:-2}],[.52,'swingf',{dx:10}],[.8,'swingf',{dx:6}],[.96,'idle1']], [[.3,'charge'],[.4,'shot:comet:1:flat'],[.66,'hit:comet']]),
    S(1600, [[0,'idle1'],[.1,'atk1',{dx:-4}],[.26,'swingr',{dx:-4,rot:-2}],[.46,'swingl',{dx:4,rot:2}],[.72,'swingl',{dx:6}],[.96,'idle1']], [[.3,'shot:bolt:1:zig'],[.72,'hit:bolt']]),
    S(1600, [[0,'idle1'],[.12,'atk1',{dx:-4}],[.3,'spin1',{dy:-6}],[.48,'spinwide',{dy:-12,rot:3}],[.66,'stars',{dy:-4}],[.82,'stars'],[.96,'idle1']], [[.32,'cheer'],[.56,'shot:star_big:1:twin'],[.78,'hit:star']]),
    S(1500, [[0,'idle1'],[.14,'air',{dx:-4}],[.34,'swingf',{dx:4}],[.62,'swingf',{dx:8}],[.96,'idle1']], [[.14,'charge'],[.38,'shot:crystal:1:'],[.64,'hit:crystal']]),
    S(1600, [[0,'idle1'],[.12,'atk2',{dx:-8,rot:-4}],[.3,'swingr',{dx:-2}],[.5,'atk3',{dx:6,dy:-6,rot:3}],[.8,'atk3',{dx:2}],[.96,'idle1']], [[.32,'cheer'],[.52,'shot:whirl:1:flat'],[.76,'hit:whirl']]),
    S(1500, [[0,'idle1'],[.14,'earth',{dx:-4}],[.34,'swingl',{dx:2}],[.58,'swingl',{dx:8}],[.96,'idle1']], [[.16,'charge'],[.4,'shot:cross:1:'],[.64,'hit:cross']]),
  ],
  cast:[
    S(1700, [[0,'idle1'],[.1,'atk1',{dx:-4}],[.3,'atk2',{dx:-10,rot:-4}],[.52,'atk3',{dx:6,dy:-8,rot:3}],[.82,'atk3'],[.97,'idle1']], [[.22,'charge'],[.52,'shot:orbb:1.5:'],[.8,'hit:mana']], {col:'110,170,255'}),
    S(2000, [[0,'idle1'],[.1,'atk1',{dx:-6}],[.3,'stars',{dy:-6}],[.5,'spin1',{dy:-10}],[.68,'swingf',{dx:6}],[.9,'swingf',{dx:8}],[.98,'idle1']], [[.18,'charge'],[.34,'charge'],[.68,'shot:comet:1.2:flat'],[.86,'hit:comet']], {col:'110,170,255'}),
    S(2100, [[0,'idle1'],[.1,'castdef',{dx:-2}],[.3,'castdef',{dy:-4}],[.5,'castdef',{dy:-8}],[.62,'atk3',{dx:6,dy:-8,rot:3}],[.86,'atk3'],[.98,'idle1']], [[.12,'charge'],[.3,'charge'],[.5,'charge'],[.64,'shot:star_big:1.1:twin'],[.86,'hit:star']], {col:'110,170,255'}),
    S(2300, [[0,'idle1'],[.1,'castdef'],[.26,'defmana',{dy:-4}],[.56,'defmana',{dy:-8}],[.68,'atk3',{dx:6,dy:-8,rot:3}],[.88,'atk3'],[.98,'idle1']], [[.14,'charge'],[.3,'charge'],[.5,'charge'],[.7,'shot:cross:1.2:'],[.9,'hit:cross']], {col:'120,170,255'}),
    S(1900, [[0,'idle1'],[.1,'water',{dx:-4}],[.45,'water',{dy:-5}],[.58,'atk3',{dx:6,dy:-8,rot:3}],[.86,'atk3'],[.98,'idle1']], [[.12,'charge'],[.34,'charge'],[.6,'shot:crystal:1.3:zig'],[.84,'hit:crystal']], {col:'70,170,255'}),
  ],
  fire:elemV('fire'),
  water:elemV('water'),
  air:elemV('air'),
  earth:elemV('earth'),
  ult:[
    S(5200, [[0,'idle1'],[.06,'atk1',{dx:-4}],[.14,'stars',{dy:-6}],[.22,'reach',{dy:-4}],[.3,'bh1',{dy:-8,rot:-2}],[.38,'bh2',{dy:-12,rot:2}],[.84,'bh2',{dy:-8}],[.95,'idle1']], [[.06,'charge'],[.16,'charge'],[.3,'bhopen'],[.5,'bhbig'],[.76,'bhend']]),
    S(5200, [[0,'idle1'],[.06,'atk2',{dx:-6}],[.14,'castdef',{dy:-4}],[.22,'open',{dy:-4}],[.3,'bh1',{dy:-8,rot:2}],[.38,'bh2',{dy:-12,rot:-2}],[.84,'bh2',{dy:-8}],[.95,'idle1']], [[.06,'charge'],[.14,'cheer'],[.22,'charge'],[.3,'bhopen'],[.5,'bhbig'],[.76,'bhend']]),
    S(5400, [[0,'idle1'],[.06,'atk2',{dx:-6}],[.14,'spinwide',{dy:-12,rot:3}],[.22,'swingl',{dx:2}],[.3,'bh1',{dy:-8,rot:-2}],[.38,'bh2',{dy:-12,rot:2}],[.84,'bh2',{dy:-8}],[.95,'idle1']], [[.06,'charge'],[.16,'cheer'],[.28,'charge'],[.3,'bhopen2'],[.5,'bhbig'],[.76,'bhend2']]),
    S(5400, [[0,'idle1'],[.05,'castdef'],[.12,'defmana',{dy:-4}],[.22,'stars',{dy:-8}],[.3,'bh1',{dy:-8,rot:2}],[.38,'bh2',{dy:-12,rot:-2}],[.84,'bh2',{dy:-8}],[.95,'idle1']], [[.05,'charge'],[.14,'charge'],[.24,'cheer'],[.3,'bhopen'],[.5,'bhbig2'],[.76,'bhend']]),
    S(5600, [[0,'idle1'],[.06,'atk1',{dx:-4}],[.14,'swingr',{dx:-2}],[.22,'swingl',{dx:4}],[.3,'bh1',{dy:-8}],[.38,'bh2',{dy:-12,rot:-2}],[.84,'bh2',{dy:-8}],[.95,'idle1']], [[.06,'charge'],[.16,'charge'],[.24,'cheer'],[.3,'bhopen2'],[.5,'bhbig2'],[.76,'bhend2']]),
    S(5600, [[0,'idle1'],[.06,'atk2',{dx:-6}],[.14,'spin1',{dy:-8}],[.22,'swingf',{dx:6}],[.3,'bh1',{dy:-8,rot:-2}],[.38,'bh2',{dy:-12,rot:2}],[.84,'bh2',{dy:-8}],[.95,'idle1']], [[.06,'charge'],[.14,'charge'],[.22,'charge'],[.3,'bhopen'],[.5,'bhbig2'],[.76,'bhend2']]),
  ],
  dodge:[
    S(1050, [[0,'idle1'],[.08,'dodge1',{dx:-6}],[.26,'dodge2',{dx:-40,dy:-4}],[.46,'dodge3',{dx:-56,dy:2}],[.66,'dodge4',{dx:-30}],[.88,'idle1']], [], {ghost:true}),
    S(1050, [[0,'idle1'],[.08,'dodge1~',{dx:6}],[.26,'dodge2~',{dx:40,dy:-4}],[.46,'dodge3~',{dx:56,dy:2}],[.66,'dodge4~',{dx:30}],[.88,'idle1']], [], {ghost:true, gdir:-1}),
    S(1100, [[0,'idle1'],[.08,'dodge1',{dx:-4}],[.26,'dodge5',{dx:-24,dy:-8}],[.5,'dodge6',{dx:-44,dy:-4}],[.7,'dodge4',{dx:-22,dy:-2}],[.9,'idle1']], [[.3,'cheer']], {ghost:true}),
  ],
  hurt:[
    S(750, [[0,'idle1'],[.1,'hurt1',{dx:-10,rot:-4}],[.32,'hurt1',{dx:4,rot:-2}],[.55,'hurt1',{dx:-2}],[.9,'idle1']], [], {tint:true}),
    S(800, [[0,'idle1'],[.1,'hurt2',{dx:-9,dy:2,rot:-4}],[.34,'hurt2',{dx:4,rot:-1}],[.6,'hurt2',{dx:-2}],[.9,'idle1']], [], {tint:true}),
    S(850, [[0,'idle1'],[.12,'hurt1',{dx:-12,rot:-6}],[.34,'hurt2',{dx:4,rot:-2}],[.6,'kneel',{dx:-2}],[.92,'idle1']], [], {tint:true}),
  ],
  victory:[
    S(2800, [[0,'idle1'],[.1,'raise'],[.26,'atk3',{dy:-12,rot:2}],[.4,'wave',{dy:-3}],[.56,'raise',{dy:-8,rot:-2}],[.8,'atk3',{dy:-4}],[.96,'idle1']], [[.28,'cheer'],[.58,'cheer']]),
    S(3200, [[0,'idle1'],[.1,'atk1'],[.22,'spin1',{dy:-6}],[.36,'spinwide',{dy:-14,rot:3}],[.5,'stars',{dy:-8}],[.66,'swingr',{dy:-6}],[.8,'atk3',{dy:-10}],[.96,'idle1']], [[.24,'cheer'],[.4,'cheer'],[.56,'cheer'],[.8,'cheer']]),
    S(3000, [[0,'idle1'],[.1,'atk2'],[.28,'stars',{dy:-10}],[.46,'swingl',{dy:-4}],[.64,'spin1',{dy:-8}],[.82,'atk3',{dy:-8}],[.96,'idle1']], [[.3,'cheer'],[.5,'charge'],[.66,'cheer'],[.84,'cheer']]),
  ],
  guard:[S(1900, [], []), S(1900, [], [[.1,'charge'],[.5,'cheer']]), S(1900, [], [[.08,'cheer'],[.45,'charge']])],
};
ACT.holy = ACT.cast;
const bags = new WeakMap();
const variant = v => { if (!Array.isArray(v)) return v; if (window.__vi != null) return v[window.__vi % v.length]; let b = bags.get(v); if (!b || !b.l.length) { const l = v.map((_, i) => i); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } if (b && l.length > 1 && l[0] === b.last) [l[0], l[l.length - 1]] = [l[l.length - 1], l[0]]; b = {l, last:b ? b.last : -1}; bags.set(v, b); } const i = b.l.shift(); b.last = i; return v[i]; };   // sacola embaralhada: nunca repete a mesma variação em seguida, e usa todas antes de repetir
const ELEM = {'#ff7a2e':'fire', '#3db4ff':'water', '#9fe8d0':'air', '#c19a52':'earth'};
const GUARD = {fire:'deffire', water:'defwater', air:'defair', earth:'defearth', mana:'defmana'};
const IDLE_CYCLE = [['idle1', 1000]];
const IDLES = [   // idles extras ocasionais
  S(2600, [[0,'idle1'],[.2,'idle4',{dx:3}],[.7,'idle4',{dx:3}],[.95,'idle1']]),
  S(3000, [[0,'idle1'],[.2,'idle3',{dx:-6,rot:-1.5}],[.55,'idle3',{dx:-6,rot:-1.5}],[.8,'idle2'],[.96,'idle1']]),
  S(2800, [[0,'idle1'],[.18,'atk1',{dx:-3}],[.4,'stars',{dy:-3}],[.7,'stars'],[.9,'atk1'],[.97,'idle1']], [[.4,'cheer']]),
  S(2600, [[0,'idle1'],[.2,'swingr',{dx:-2}],[.6,'swingr',{dx:2}],[.88,'atk1'],[.97,'idle1']]),
  S(2800, [[0,'idle1'],[.18,'look'],[.7,'look'],[.9,'glance'],[.97,'idle1']]),
  S(2800, [[0,'idle1'],[.18,'scroll'],[.75,'scroll'],[.97,'idle1']]),
  S(2400, [[0,'idle1'],[.2,'hip'],[.75,'hip'],[.97,'idle1']]),
  S(2600, [[0,'idle1'],[.2,'side'],[.5,'skirt'],[.8,'side'],[.97,'idle1']]),
  S(2600, [[0,'idle1'],[.2,'potion'],[.75,'potion'],[.97,'idle1']]),
  S(2400, [[0,'idle1'],[.2,'wave'],[.75,'wave'],[.97,'idle1']]),
  S(3200, [[0,'idle1'],[.15,'idle2'],[.35,'idle4',{dx:4}],[.6,'idle3',{dx:-4}],[.85,'idle2'],[.97,'idle1']]),
  S(2900, [[0,'idle1'],[.2,'atk1'],[.38,'spin1',{dy:-4}],[.62,'stars',{dy:-4}],[.85,'atk1'],[.97,'idle1']], [[.3,'charge']]),
];

function glow(g, x, y, r, col, a){
  if (a <= 0.005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,255,255,${clamp(a * .6)})`); gr.addColorStop(.16, `rgba(${col},${clamp(a)})`); gr.addColorStop(.5, `rgba(${col},${clamp(a * .32)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
const GLOW = {orbb:'120,180,255', orb_red:'255,110,40', orb_blue:'70,170,255', orb_orange:'255,170,60', comet:'170,140,255', bolt:'255,240,120', crystal:'150,230,255', whirl:'150,235,210', cross:'255,230,160', star_big:'255,225,170'};

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, front = layers.front, fc = front.getContext('2d');
  const cw = cv.width, ch = cv.height, OX = world.x - Px, OY = world.y - Py;      // canvas da Maga → coordenadas do design
  let M = null; const img = {}, fxm = {};
  const load = (k, src) => img[k] || (img[k] = Object.assign(new Image(), {src}));
  fetch('mage4/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => load(n, `mage4/${n}.png`)); FXS.forEach(n => load('fx_' + n, `mage4/fx_${n}.png`)); }).catch(() => {});
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); }; let chargeT = -9999, orbVis = 0, fxl = [], cur = null, shakeT = 0, flashT = 0, last = 0, t0 = clk(), running = false;
  let dead = 0, deadTarget = 0, prev = null, curPose = null, orbW = {x:world.x + 150, y:world.y + 60};
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;

  // ---- efeitos: E(nome, duração, u => estado)
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), add: o.add !== false});
  const orbPos = () => ({...orbW});
  const dir = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  function shot(name, size, style = '', ko = null){                    // projétil de mana: núcleo de luz, camadas translúcidas giratórias, rastro que se desfaz e fagulhas em espiral. estilos: arco (padrão), flat (reto e rápido), zig (zigue-zague), twin (dois)
    if (style === 'twin' && ko == null) { shot(name, size * .85, '', -38); shot(name, size * .85, '', 38); return; }
    const a = orbPos(), b = T, dist = Math.hypot(b.x - a.x, b.y - a.y), flat = style === 'flat', zig = style === 'zig', d = (flat ? 380 : zig ? 620 : 560) + dist * (flat ? .35 : .55), ang = dir(a, b), col = GLOW[name] || '120,180,255', k = ko != null ? ko : rnd(-1, 1) * 26, lift = flat ? 6 : 46;
    const path = u => { const e = Math.pow(u, flat ? 1.2 : 1.8), w = Math.sin(Math.PI * u); return {x:lerp(a.x, b.x, e) + k * w + Math.sin(u * 11) * 6 * w + (zig ? Math.sin(u * 22) * 46 * w : 0), y:lerp(a.y, b.y, e) - w * lift}; };
    const fade = u => u < .1 ? u / .1 : u > .94 ? (1 - u) / .06 : 1, grow = u => .55 + .55 * Math.sin(Math.min(1, u * 1.3) * 1.57);
    const hd = u => { const p = path(u), q = path(Math.min(1, u + .03)); return Math.atan2(q.y - p.y, q.x - p.x); };
    const pulse = u => 1 + .14 * Math.sin(u * 40);
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:(78 + 24 * Math.sin(u * 28)) * size * grow(u), c:col, a:.62 * fade(u)}; });
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:26 * size * grow(u) * pulse(u), c:'255,255,255', a:.55 * fade(u)}; });
    const sprite = name !== 'orbb' && name !== 'orb_red';                    // orbb (esfera de mana) é desenhada só com luz e símbolos girando, sem bloco de imagem
    const rotOf = (n, u) => n === 'comet' ? hd(u) + 1.57 : n === 'bolt' ? hd(u) : n === 'orb_red' ? hd(u) + Math.PI + .93 : n === 'whirl' ? u * 14 : n === 'star_big' ? u * 6 : Math.sin(u * 6) * .35;
    if (sprite) for (let i = 0; i < 3; i++) { const lag = i * .035; E('fx_' + name, d, u => { const uu = Math.max(0, u - lag), p = path(uu); return {x:p.x, y:p.y, s:size * (name === 'comet' ? 1.5 : 1.0) * grow(uu) * (1 - i * .12) * pulse(u), rot:rotOf(name, uu), a:fade(u) * (.62 - i * .2)}; }); }
    else if (name === 'orbb') { E('fx_cross', d, u => { const p = path(u); return {x:p.x, y:p.y, s:.34 * size * grow(u) * pulse(u), rot:u * 16, a:fade(u) * .6}; }); E('fx_star_big', d, u => { const p = path(u); return {x:p.x, y:p.y, s:.3 * size * grow(u), rot:-u * 11, a:fade(u) * .5}; }); E('fx_star_small', d, u => { const p = path(u); return {x:p.x, y:p.y, s:1.1 * size * grow(u), rot:u * 9, a:fade(u)}; }); }
    else { E('fx_orb_red', d, u => { const p = path(u); return {x:p.x, y:p.y, s:size * grow(u) * pulse(u), rot:rotOf('orb_red', u), a:fade(u) * .72}; }); E('fx_orb_red', d, u => { const uu = Math.max(0, u - .05), p = path(uu); return {x:p.x, y:p.y, s:size * grow(uu) * .8, rot:rotOf('orb_red', uu), a:fade(u) * .35}; }); }
    for (let i = 1; i <= 16; i++) { const ut = i / 17, p = path(ut); E('glow', 640, v => ({x:p.x + Math.sin(i * 3) * 8 * v, y:p.y - 16 * v, r:(48 * size) * (1 - v * .65), c:col, a:.32 * (1 - v)}), {delay:ut * d}); }
    for (let i = 0; i < 22; i++) { const ut = (i + .5) / 22 * .95, p = path(ut), ph = i * 1.9, rr = rnd(10, 26); E('fx_star_small', 760, v => ({x:p.x + Math.cos(ph + v * 5) * rr * (.4 + v), y:p.y + Math.sin(ph + v * 5) * rr * (.4 + v) - 18 * v, s:.5 * (1 - v) * (.7 + .5 * Math.sin(v * 24)), rot:v * 3, a:(1 - v) * .9}), {delay:ut * d}); }
  }
  function mist(p, n, col){ for (let i = 0; i < n; i++) { const an = i / n * 6.28 + rnd(0, .4), r = rnd(50, 130), dl = rnd(0, 120); E('fx_star_small', 800, u => ({x:p.x + Math.cos(an) * r * eo(u), y:p.y + Math.sin(an) * r * .7 * eo(u) - 24 * u, s:.8 * (1 - u * .6) * (.7 + .5 * Math.sin(u * 22)), rot:u * 4, a:1 - u}), {delay:dl}); } E('glow', 700, u => ({...p, r:lerp(40, 150, eo(u)), c:col, a:.5 * (1 - u)})); }
  function hit(kind){
    const bl = (r, c, a, dl = 0, d = 650) => E('glow', d, u => ({...T, r:r * (.4 + eo(u) * .9), c, a:a * (1 - u) * (u < .08 ? u / .08 : 1)}), {delay:dl});
    if (kind === 'small') { bl(120, '140,190,255', .9); E('fx_star_big', 560, u => ({...T, s:lerp(.4, .95, eo(u)), a:(u < .1 ? u / .1 : 1 - seg(u, .1, 1)) * .55, rot:u * 3})); mist(T, 12, '140,190,255'); }
    else if (kind === 'bolt') { bl(150, '255,240,120', .95, 0, 700); bl(90, '255,255,255', .9, 0, 380); for (let i = 0; i < 4; i++) E('fx_bolt', 360, u => ({x:T.x + (i - 1.5) * 26, y:T.y - 10 + (i % 2) * 18, s:lerp(.6, 1.5, eo(u)), rot:-.9 + i * .6, a:1 - u}), {delay:i * 70}); flashT = clk(); }
    else if (kind === 'crystal') { bl(160, '150,230,255', .95, 0, 800); for (let i = 0; i < 5; i++) E('fx_crystal', 700, u => ({x:T.x + (i - 2) * 36, y:T.y + 30 - 20 * eo(u) + Math.abs(i - 2) * 8, s:lerp(.3, 1.2 - Math.abs(i - 2) * .12, eo(Math.min(1, u * 2))), rot:(i - 2) * .22, a:1 - seg(u, .5, 1)}), {delay:i * 50}); }
    else if (kind === 'cross') { bl(170, '255,230,160', .95, 0, 800); bl(100, '255,255,255', .85, 0, 420); E('fx_cross', 720, u => ({...T, s:lerp(.4, 1.7, eo(u)), a:(1 - u) * .95})); E('fx_ring_floor', 800, u => ({x:T.x, y:T.y + 60, s:lerp(.5, 2.4, eo(u)), a:(1 - u) * .9})); }
    else if (kind === 'whirl') { bl(150, '150,235,210', .9, 0, 800); E('fx_whirl', 800, u => ({...T, s:lerp(.4, 1.5, eo(u)), rot:u * 8, a:(1 - seg(u, .3, 1)) * .95})); E('fx_whirl', 700, u => ({...T, s:lerp(.3, 1.1, eo(u)), rot:-u * 6, a:(1 - seg(u, .3, 1)) * .8}), {delay:100}); }
    else if (kind === 'comet') { bl(170, '170,140,255', .95, 0, 800); E('fx_comet', 520, u => ({x:T.x - 60 + 60 * u, y:lerp(T.y - 340, T.y, u * u), s:1.1, rot:.2, a:u > .93 ? (1 - u) / .07 : 1})); E('fx_star_big', 560, u => ({...T, s:lerp(.4, 1.4, eo(u)), a:1 - u}), {delay:500}); shakeT = clk() + 480; }
    else if (kind === 'star') { bl(160, '255,225,170', .95, 0, 800); E('fx_star_big', 700, u => ({...T, s:lerp(.3, 1.6, eo(u)), rot:u * 2, a:1 - u})); E('fx_star_big', 600, u => ({...T, s:lerp(.2, 1.1, eo(u)), rot:-u * 3, a:1 - u}), {delay:120}); for (let i = 0; i < 8; i++) { const an = i * .785; E('fx_star_small', 700, u => ({x:T.x + Math.cos(an) * 120 * eo(u), y:T.y + Math.sin(an) * 90 * eo(u), s:.7 * (1 - u * .5), a:1 - u}), {delay:60}); } }
    else if (kind === 'mana') { bl(170, '120,180,255', .8, 0, 900); bl(100, '255,255,255', .6, 0, 450); E('fx_ring_floor', 900, u => ({x:T.x, y:T.y + 50, s:lerp(.3, 2.2, eo(u)), a:(1 - u) * .55})); E('fx_star_big', 800, u => ({...T, s:lerp(.3, 1.3, eo(u)), rot:u * 2.5, a:(u < .1 ? u / .1 : 1 - seg(u, .1, 1)) * .5})); E('fx_orb_blue', 800, u => ({...T, s:lerp(.4, 1.5, eo(u)), rot:u * 4, a:(1 - u) * .45})); E('fx_cross', 700, u => ({...T, s:lerp(.3, 1.2, eo(u)), rot:-u * 2, a:(1 - u) * .5})); mist(T, 18, '150,200,255'); }
    else { bl(280, '170,140,255', 1, 0, 1000); bl(160, '255,255,255', .9, 0, 520); bl(220, '120,180,255', .7, 120, 900); E('fx_star_big', 900, u => ({...T, s:lerp(.5, 2.1, eo(u)), a:(u < .08 ? u / .08 : 1 - seg(u, .08, 1)) * .85})); E('fx_mana_aura', 800, u => ({...T, s:lerp(.4, 2, eo(u)), a:(1 - u) * .7})); E('fx_cross', 650, u => ({...T, s:lerp(.4, 1.9, eo(u)), a:(1 - u) * .8})); E('fx_crystal', 550, u => ({x:T.x, y:T.y - 20, s:lerp(.5, 1.7, eo(u)), a:(1 - u) * .8}), {delay:80}); shakeT = clk(); }
  }
  const EV = {
    charge(){
      chargeT = clk(); const col = (cur && cur.a.col) || '120,180,255';
      E('glow', 1000, u => ({...orbPos(), r:lerp(30, 120, eo(u)), c:col, a:.9 * Math.sin(Math.PI * Math.min(1, u * 1.15))}));
      E('fx_mana_aura', 1100, u => ({x:world.x + W / 2, y:world.y + BASE - 4, s:lerp(.6, .9, u), sy:.4, a:.6 * Math.sin(Math.PI * u)})); E('fx_ring_floor', 1100, u => ({x:world.x + W / 2, y:world.y + BASE - 2, s:lerp(.4, .85, eo(u)), a:.5 * Math.sin(Math.PI * u)}));
      for (let i = 0; i < 14; i++) { const an = i * .79 + rnd(0, .5); E('fx_star_small', 900, u => { const r = 100 * (1 - eo(u)) + 8, o = orbPos(); return {x:o.x + Math.cos(an + u * 2) * r, y:o.y + Math.sin(an + u * 2) * r * .8, s:.6 * (.5 + u * .5), rot:u * 3, a:Math.sin(Math.PI * u)}; }, {delay:i * 55}); }
    },
    cheer(){ E('fx_star_big', 700, u => ({...orbPos(), s:lerp(.3, 1.2, eo(u)), a:1 - u})); E('fx_cross', 600, u => ({...orbPos(), s:lerp(.3, 1, eo(u)), a:1 - u})); for (let i = 0; i < 4; i++) E('fx_star_small', 800, u => ({x:orbPos().x + Math.cos(i * 1.7) * 50 * eo(u), y:orbPos().y + Math.sin(i * 1.7) * 40 * eo(u) - 20 * u, s:.7 * (1 - u), a:1 - u}), {delay:i * 90}); },
    fire(k){ const fall = (x, dl, sc = 1) => { E('fx_fire_fall', 760, u => ({x:T.x + x, y:lerp(T.y - 360, T.y + 30, ei(u)), s:lerp(1.1, 1.5, u) * sc, a:u > .94 ? (1 - u) / .06 : 1}), {delay:dl}); E('fx_fire_burst', 700, u => ({x:T.x + x, y:T.y + 20, s:lerp(.4, 1.5, eo(u)) * sc, a:1 - u}), {delay:dl + 700}); E('fx_fire_burst', 600, u => ({x:T.x + x, y:T.y + 20, s:lerp(.4, 1.5, eo(u)) * sc, a:1 - u}), {delay:dl + 720}); };
      if (k === 'tri') { fall(-90, 0, .8); fall(90, 140, .8); fall(0, 280, 1); shakeT = clk() + 980; }
      else if (k === 'rain') { for (let i = 0; i < 6; i++) fall(-130 + i * 52 + rnd(-10, 10), i * 130, .6); shakeT = clk() + 1300; }
      else if (k === 'meteor') { E('fx_fire_fall', 1100, u => ({x:T.x, y:lerp(T.y - 520, T.y + 30, ei(u)), s:lerp(1.6, 2.6, u), a:u > .96 ? (1 - u) / .04 : 1})); E('glow', 800, u => ({...T, r:lerp(120, 380, eo(u)), c:'255,120,40', a:.95 * (1 - u)}), {delay:1050}); E('fx_fire_burst', 900, u => ({x:T.x, y:T.y + 20, s:lerp(.6, 2.6, eo(u)), a:1 - u}), {delay:1050}); E('fx_fire_burst', 800, u => ({x:T.x, y:T.y + 20, s:lerp(.5, 2.2, eo(u)), a:1 - u}), {delay:1070}); shakeT = clk() + 1050; }
      else { fall(0, 0); shakeT = clk() + 700; } },
    water(k){ const pil = (x, dl, sc = 1) => { E('fx_water_pillar', 1100, u => ({x:T.x + x, y:T.y + 90, s:1.4 * sc, sy:lerp(.15, 1, eo(Math.min(1, u * 2.2))), anchorB:1, a:u < .1 ? u / .1 : u > .7 ? (1 - u) / .3 : 1}), {delay:dl}); E('fx_water_burst', 700, u => ({x:T.x + x, y:T.y - 20, s:lerp(.4, 2, eo(u)) * sc, a:1 - u}), {delay:dl + 350}); };
      if (k === 'tri') { pil(-95, 0, .85); pil(95, 120, .85); pil(0, 240, 1.1); }
      else if (k === 'wave') { for (let i = 0; i < 6; i++) pil(-150 + i * 60, i * 110, .7); }
      else if (k === 'ring') { pil(0, 0, 1.2); E('fx_ring_floor', 1000, u => ({x:T.x, y:T.y + 70, s:lerp(.5, 3.2, eo(u)), a:(1 - u) * .9}), {delay:250}); E('fx_ring_floor', 900, u => ({x:T.x, y:T.y + 70, s:lerp(.4, 2.2, eo(u)), a:(1 - u) * .8}), {delay:450}); E('glow', 800, u => ({...T, r:lerp(80, 300, eo(u)), c:'70,170,255', a:.8 * (1 - u)}), {delay:350}); }
      else pil(0, 0); },
    air(k){ const sw = (x, y, dl, sc = 1, dir = 1) => { E('fx_air_swirl', 1300, u => ({x:T.x + x, y:T.y + y, s:lerp(.6, 2.1, eo(Math.min(1, u * 1.5))) * sc, rot:u * 7 * dir, a:u < .1 ? u / .1 : u > .65 ? (1 - u) / .35 : 1}), {delay:dl}); E('fx_air_burst', 1200, u => ({x:T.x + x, y:T.y + y, s:lerp(.5, 1.6, eo(u)) * sc, rot:-u * 6 * dir, a:(u < .15 ? u / .15 : 1 - seg(u, .15, 1)) * .8}), {delay:dl + 100}); };
      if (k === 'twin') { sw(-90, 10, 0, .75, 1); sw(90, -10, 150, .75, -1); }
      else if (k === 'rise') { for (let i = 0; i < 3; i++) E('fx_air_burst', 1100, u => ({x:T.x, y:lerp(T.y + 120, T.y - 120, eo(u)), s:lerp(.6, 1.7, eo(u)), rot:u * 9 * (i % 2 ? -1 : 1), a:(u < .15 ? u / .15 : 1 - seg(u, .5, 1)) * .85}), {delay:i * 160}); sw(0, 0, 420, 1, 1); }
      else if (k === 'tri') { sw(-110, 20, 0, .6); sw(110, 20, 130, .6, -1); sw(0, -20, 260, .9); }
      else sw(0, 0, 0); },
    earth(k){ const sp = (x, dl, sc = 1, y = 0) => { E('fx_earth_spikes', 1100, u => ({x:T.x + x, y:T.y + 90 + y, s:1.6 * sc, sy:lerp(.1, 1, eo(Math.min(1, u * 2.6))), anchorB:1, a:u > .72 ? (1 - u) / .28 : 1}), {add:false, delay:dl}); };
      if (k === 'tri') { sp(-100, 0, .8); sp(100, 140, .8); sp(0, 280, 1.1); E('fx_rocks', 900, u => ({x:T.x, y:T.y + 30, s:lerp(.7, 1.8, eo(u)), a:1 - seg(u, .2, 1)}), {add:false, delay:900}); shakeT = clk() + 500; }
      else if (k === 'sweep') { for (let i = 0; i < 5; i++) sp(0, i * 120, .5 + i * .12, 150 - i * 40); E('fx_rocks', 900, u => ({x:T.x, y:T.y + 30, s:lerp(.7, 1.7, eo(u)), a:1 - seg(u, .2, 1)}), {add:false, delay:640}); shakeT = clk() + 640; }
      else if (k === 'rain') { for (let i = 0; i < 5; i++) { const x = -130 + i * 65 + rnd(-10, 10); E('fx_rock', 700, u => ({x:T.x + x, y:lerp(T.y - 340, T.y + 10, ei(u)), s:1.3, rot:u * 5 * (i % 2 ? 1 : -1), a:u > .95 ? (1 - u) / .05 : 1}), {add:false, delay:i * 150}); E('fx_rocks', 700, u => ({x:T.x + x, y:T.y + 30, s:lerp(.4, 1.0, eo(u)), a:1 - seg(u, .2, 1)}), {add:false, delay:i * 150 + 680}); } shakeT = clk() + 800; }
      else { E('fx_earth_spikes', 1100, u => ({x:T.x, y:T.y + 90, s:1.6, sy:lerp(.1, 1, eo(Math.min(1, u * 2.6))), anchorB:1, a:u > .72 ? (1 - u) / .28 : 1}), {add:false}); E('fx_rock', 700, u => ({x:T.x + 40, y:lerp(T.y - 300, T.y, ei(u)), s:1.6, rot:u * 5, a:u > .95 ? (1 - u) / .05 : 1}), {add:false, delay:150}); E('fx_rocks', 900, u => ({x:T.x, y:T.y + 30, s:lerp(.7, 1.6, eo(u)), a:1 - seg(u, .2, 1)}), {add:false, delay:820}); shakeT = clk() + 820; } },
    bhopen(){ E('fx_bh_small', 3000, u => ({x:T.x, y:T.y, s:lerp(.12, .85, eo(Math.min(1, u * 2))), rot:u * 12, a:u < .08 ? u / .08 : u > .85 ? (1 - u) / .15 : 1})); flashT = clk(); },
    bhbig(){ fireHit(); E('fx_bh_big', 2300, u => ({x:T.x, y:T.y, s:lerp(.2, 1.05, eo(Math.min(1, u * 1.7))), rot:-u * 10, a:u < .1 ? u / .1 : u > .8 ? (1 - u) / .2 : 1})); E('fx_bh_spikes', 1500, u => ({x:T.x, y:T.y + 20, s:lerp(.3, 1.1, eo(Math.min(1, u * 2))), a:u < .12 ? u / .12 : 1 - seg(u, .5, 1)}), {delay:300}); shakeT = clk() + 300; },
    bhopen2(){ E('fx_bh_small', 3000, u => ({x:T.x, y:T.y, s:lerp(.1, 1, eo(Math.min(1, u * 1.6))), rot:-u * 14, a:u < .08 ? u / .08 : u > .85 ? (1 - u) / .15 : 1})); E('fx_orb_blue', 900, u => ({x:T.x, y:T.y, s:lerp(.3, 1.4, eo(u)), a:1 - u})); flashT = clk(); },
    bhbig2(){ fireHit(); E('fx_bh_big2', 2300, u => ({x:T.x, y:T.y, s:lerp(.2, 1.1, eo(Math.min(1, u * 1.6))), rot:u * 10, a:u < .1 ? u / .1 : u > .8 ? (1 - u) / .2 : 1})); E('fx_bh_spikes', 1300, u => ({x:T.x, y:T.y + 20, s:lerp(.3, 1.2, eo(Math.min(1, u * 2))), a:u < .12 ? u / .12 : 1 - seg(u, .5, 1)}), {delay:150}); E('fx_bh_spikes', 1100, u => ({x:T.x, y:T.y + 20, s:lerp(.2, .8, eo(Math.min(1, u * 2))), rot:.4, a:u < .12 ? u / .12 : 1 - seg(u, .5, 1)}), {delay:750}); shakeT = clk() + 150; },
    bhend2(){ fireHit(); E('fx_bh_big', 800, u => ({x:T.x, y:T.y, s:lerp(1.05, 1.6, eo(u)), rot:-u * 8, a:1 - u})); E('fx_star_big', 800, u => ({x:T.x, y:T.y, s:lerp(.5, 2.4, eo(u)), a:1 - u})); E('fx_star_big', 700, u => ({x:T.x, y:T.y, s:lerp(.3, 1.6, eo(u)), rot:u * 2, a:1 - u}), {delay:160}); flashT = clk(); shakeT = clk(); },
    bhend(){ fireHit(); E('fx_bh_big2', 800, u => ({x:T.x, y:T.y, s:lerp(1.05, 1.5, eo(u)), rot:u * 6, a:1 - u})); E('fx_star_big', 800, u => ({x:T.x, y:T.y, s:lerp(.5, 2.2, eo(u)), a:1 - u})); flashT = clk(); },
  };
  const HITD = {fire:560, water:320, air:380, earth:260}, HITX = {tri:260, rain:600, meteor:480, wave:420, ring:80, twin:150, rise:420, sweep:340};   // atraso até o efeito elemental acertar o boss
  function runEv(e){ if (typeof e === 'function') return e(); const [k, a, b] = e.split(':'); const [,, , st] = e.split(':'); if (k === 'shot') shot(a, +b, st); else if (k === 'hit') { hit(a); fireHit(); } else if (EV[k]) { EV[k](a); if (HITD[k] != null) setTimeout(fireHit, HITD[k] + (HITX[a] || 0)); } }

  // ---- mana ambiente: fagulhas ao redor do corpo, brilho no cajado e carga de mana enquanto ela espera (tempo de leitura da pergunta)
  let ambT = 0, ambN = 0, pulseT = 0;
  function ambient(now){
    if (dead > .2 || !M || now - ambT < 95) return; ambT = now; ambN++; const idle = !cur, bx = world.x + W / 2, by = world.y + BASE, o = orbPos(), col = (cur && cur.a.col) || '120,170,255';
    { const ph = rnd(0, 6.28), x0 = bx + rnd(-58, 58), y0 = by - rnd(10, 150); E('fx_star_small', rnd(1300, 1900), u => ({x:x0 + Math.sin(u * 6 + ph) * 12, y:y0 - u * 80, s:.55 * (.5 + .5 * Math.sin(u * 18 + ph)) * (1 - u * .4), rot:u * 3, a:Math.sin(Math.PI * u) * .85})); }
    if (ambN % 2 === 0 && orbVis > .3) { const ox = rnd(-14, 14), oy = rnd(-14, 14); E('fx_star_small', 650, u => ({x:o.x + ox * u, y:o.y + oy * u - 10 * u, s:.7 * (1 - u) * (.6 + .6 * Math.sin(u * 26)), rot:u * 4, a:1 - u})); }
    if (idle && orbVis > .3) { const an = rnd(0, 6.28), r0 = rnd(80, 130); E('fx_star_small', 1000, u => { const r = r0 * (1 - eo(u)) + 6; return {x:o.x + Math.cos(an + u * 4) * r, y:o.y + Math.sin(an + u * 4) * r * .8, s:.55 * (.5 + u * .5), rot:u * 5, a:Math.sin(Math.PI * Math.min(1, u * 1.05))}; }); }
    if (idle && now - pulseT > 3200) { pulseT = now; E('glow', 2200, u => ({...orbPos(), r:lerp(24, 100, Math.sin(Math.PI * u * .5)), c:col, a:.7 * Math.sin(Math.PI * u)})); E('fx_mana_aura', 2400, u => ({x:bx, y:by - 4, s:lerp(.55, .8, u), sy:.4, a:.5 * Math.sin(Math.PI * u)})); E('fx_ring_floor', 2600, u => ({x:bx, y:by - 2, s:lerp(.45, .65, u), a:.32 * Math.sin(Math.PI * u)})); }
  }

  // ---- corpo
  function poseAt(a, pe){                                              // pose + transformações no instante pe
    const st = a.steps; let i = 0; while (i < st.length - 1 && pe >= st[i + 1][0]) i++;
    const A = st[i], B = st[Math.min(i + 1, st.length - 1)], u = A === B ? 1 : ease(clamp((pe - A[0]) / (B[0] - A[0])));
    const ta = A[2] || {}, tb = B[2] || {};
    return {pose:A[1], dx:lerp(ta.dx || 0, tb.dx || 0, u), dy:lerp(ta.dy || 0, tb.dy || 0, u), rot:lerp(ta.rot || 0, tb.rot || 0, u), sc:lerp(ta.sc == null ? 1 : ta.sc, tb.sc == null ? 1 : tb.sc, u), since:(pe - A[0]) * a.dur, next:B[1], u};
  }
  function drawPose(name, dx, dy, rot, alpha, tm, tint, sc = 1){
    const fl = name.endsWith('~'); if (fl) name = name.slice(0, -1); const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return null;
    const br = Math.sin(tm / 1000 * 2.2), fx = Px + W / 2 + dx, fy = Py + BASE + dy;
    c.save(); c.globalAlpha = alpha; c.translate(fx, fy); c.rotate(rot * Math.PI / 180); c.scale((fl ? -1 : 1) * MSZ * (PS[name] || 1) * sc * (1 - .004 * br), MSZ * (PS[name] || 1) * sc * (1 + .010 * br));
    c.drawImage(im, -m.cx, -m.gy);
    if (tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,40,40,${tint})`; c.fillRect(-m.cx, -m.gy, m.w, m.h); }
    c.restore();
    if (m.orb) { const k = Math.cos(rot * Math.PI / 180), s = Math.sin(rot * Math.PI / 180), ox = (fl ? -1 : 1) * (m.orb[0] - m.cx) * MSZ * (PS[name] || 1), oy = (m.orb[1] - m.gy) * MSZ * (PS[name] || 1); return {x:OX + fx + ox * k - oy * s, y:OY + fy + ox * s + oy * k}; }
    return null;
  }
  function frame(){
    if (!running) return; requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 16) return; last = now;
    if (!M) return;
    const tm = now - t0; let st, a = cur && cur.a, pe = 0, guard = cur && cur.guard;
    if (cur) {
      pe = (now - cur.start) / a.dur;
      if (guard) { const k = pe; st = {pose:k < .16 ? (['castdef','atk1','stars'][cur.gv || 0]) : guard, dx:0, dy:0, rot:0, since:(k < .16 ? k : k - .16) * a.dur, u:1}; }
      else st = poseAt(a, clamp(pe));
      const ev = a.ev || []; while (cur.fired < ev.length && pe >= ev[cur.fired][0]) runEv(ev[cur.fired++][1]);
      if (pe >= 1) { const d = cur; cur = null; d.done(); }
    } else {
      let t = tm % IDLE_CYCLE.reduce((s, b) => s + b[1], 0), n = 'idle1'; for (const [nm, d] of IDLE_CYCLE) { if (t < d) { n = nm; break; } t -= d; }
      st = {pose:n, dx:0, dy:0, rot:0, sc:1, since:t};
    }
    if (deadTarget || dead > .02) st = {pose:dead < .5 ? 'fall' : 'down', dx:0, dy:0, rot:0, sc:1, since:0};
    // transição suave entre quadros (cross-fade curto)
    if (st.pose !== curPose) { prev = curPose ? {pose:curPose, dx:cur ? lastT.dx : 0, dy:lastT.dy, rot:lastT.rot, sc:lastT.sc || 1} : null; curPose = st.pose; cur_t = now; fade = (cur ? 90 : 240); }
    lastT = st;
    const f = clamp((now - cur_t) / fade);
    dead += (deadTarget - dead) * .1;
    c.clearRect(0, 0, cw, ch); c.save(); c.translate(Px - host.P, Py - host.P); host.shadow(c); c.restore(); c.imageSmoothingEnabled = false;
    const dRot = 0, dDy = 0, dAl = 1;
    const tint = a && a.tint ? Math.sin(clamp(pe) * Math.PI) * .6 : 0;
    if (a && a.ghost) { const g = Math.sin(clamp(pe) * Math.PI); const gd = a.gdir || 1; drawPose(st.pose, st.dx + 46 * g * gd, st.dy, st.rot, .18 * g, tm, 0, st.sc || 1); drawPose(st.pose, st.dx + 90 * g * gd, st.dy, st.rot, .10 * g, tm, 0, st.sc || 1); }
    if (prev && f < 1) drawPose(prev.pose, prev.dx, prev.dy, prev.rot, 1, tm, tint, prev.sc);
    const o = drawPose(st.pose, st.dx, st.dy + dDy, st.rot + dRot, (prev && f < 1 ? f : 1) * dAl, tm, tint, st.sc || 1);
    if (o) orbW = o; orbVis += ((o ? 1 : 0) - orbVis) * .18;
    // ---- efeitos (camada da frente, coordenadas do design)
    fc.clearRect(0, 0, front.width, front.height); ambient(now);
    if (orbVis > .02 && dead < .3) { const cb = Math.max(0, 1 - (now - chargeT) / 1100), col = (cur && cur.a.col) || '120,180,255', pulse = .5 + .5 * Math.sin(tm / 330);
      glow(fc, orbW.x, orbW.y, (30 + 7 * pulse + 40 * cb) * (cur ? 1.15 : 1), col, orbVis * (.42 + .2 * pulse + .35 * cb)); }
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), im = img[e.name];
      if (e.name === 'glow') { if (!s) return true; glow(fc, s.x, s.y, s.r, s.c, s.a); return true; }
      if (!ready(e.name) || !s) return true;
      const w = im.naturalWidth * (s.s || 1) * (s.sx || 1), h = im.naturalHeight * (s.s || 1) * (s.sy || 1);
      fc.save(); fc.globalAlpha = clamp(s.a == null ? 1 : s.a); fc.globalCompositeOperation = e.add ? 'lighter' : 'source-over'; fc.translate(s.x, s.y); if (s.rot) fc.rotate(s.rot);
      FXSoft.draw(fc, im, -w / 2, s.anchorB ? -h : -h / 2, w, h, 1); fc.restore(); return true;
    });
    if (flashT && now >= flashT) { const u = (now - flashT) / 420; if (u < 1) { fc.save(); fc.fillStyle = `rgba(150,160,255,${.5 * (1 - u)})`; fc.fillRect(0, 0, front.width, front.height); fc.restore(); } else flashT = 0; }
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 1 * (1 - u)}px,${Math.cos(u * 50) * .8 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  let lastT = {dx:0, dy:0, rot:0, sc:1}, cur_t = 0, fade = 240;
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); cur = {a, start: clk(), fired: 0, done: ok => res(ok !== false), ...extra}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (dead > .05) return Promise.resolve(false);
      if (name === 'cast' || name === 'holy') { const e = ELEM[(o.color || '').toLowerCase()]; const p = run(variant(ACT[e || 'cast'])); p.then(fireHit); return p; }
      if (name === 'guard') { const ga = variant(ACT.guard), gi = ACT.guard.indexOf(ga); return run(ga, {gv:gi, guard: GUARD[ELEM[(o.color || '').toLowerCase()] || 'mana']}); }
      const a = variant(ACT[name]); if (!a) return Promise.resolve(false); const p = run(a); p.then(fireHit); return p;
    },
    nextHit(){ return new Promise(r => hitW.push(r)); },
    idle(){ if (cur) return Promise.resolve(false); return run(variant(IDLES)); },
    has: n => !!ACT[n],
    setDead(d){ deadTarget = d ? 1 : 0; if (d) { if (cur) cur.done(false); cur = null; } else flashT = clk(); },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } fxl = []; deadTarget = 0; dead = 0; },
  };
}
window.MageRig = {make};
})();
