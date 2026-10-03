/* Banco de Dados I — RPG · Tanque (v61)
   Poses de COSTAS recortadas da folha nova (tank/*.png, tools/cut_tank.py): mesma escala, ancoradas pelo centro dos pés, borda fina.
   Habilidades: ataque normal (martelo), ataque super pesado, proteção específica (escudo sobre o aliado), defesa, esquiva, provocação (ult).
   Cada uso sorteia uma variação diferente da anterior (sacola embaralhada). O dano só entra quando o golpe acerta (fireHit). */
(() => {
'use strict';
const POSES = ['n1','n2','n3','a_i1','a_i2','a_hh','a_sw','a_rd','a_cr','a_lo','a_s1','a_s2','a_bub','a_swl','a_rl1','a_rl2','a_dust','p1','tA','tB','tC','v1','v2','v3','v4','d_i1','d_i2','d_i3','d_a1','d_a2','d_a3','d_a4','d_h1','d_h2','d_h3','d_h4','d_u1','d_u2','d_p1','d_p3','d_f1','d_f2','d_f3','d_e1','d_e2','d_e3','d_e4','d_m1','d_m2','d_m3','d_m4'];
const FXS = ['rock1','rock2','rock3','rock4'], FXD = ['bring','bspike','earth','rockburst'];
const T = {x:517, y:340};                 // ponto de impacto no boss
const BASE = 262, SZ = 1.2, XOFF = -18;
const PM = {n1:1.2,n2:1.13,n3:1.16,p1:1.07,a_hh:1.05,a_sw:1.11,a_rd:1.18,a_cr:1.06,a_lo:1.09,a_s1:1.12,a_s2:1.12,a_bub:1.1,a_swl:1.12,a_rl1:1.12,a_rl2:1.12,a_dust:1.13,tA:0.93,tC:0.93,v4:0.93,d_i2:1.06,d_a2:1.1,d_a3:1.18,d_a4:1.12,d_h1:1.19,d_h4:1.16,d_u2:1.1,d_p3:1.19,d_f1:1.13,d_f2:1.15,d_f3:1.16,d_e1:1.07,d_e2:1.18,d_e3:1.13,d_e4:1.16,d_m1:1.15,d_m2:1.15,d_m3:1.15,d_m4:1.15};   // ajuste por pose: todas do mesmo tamanho do corpo (tools/ajuste_escala)
     // SZ: o Tanque é o maior dos heróis     // pés (y) e escala do corpo
const GOLD = '255,200,110', FIRE = '255,150,60', BLUE = '120,180,255';
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3);
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));
const S = (d, steps, ev = [], o = {}) => ({dur:d, steps, ev, ...o});

// ---- animações (passos [t, pose, {dx,dy,rot,sc}], eventos [t, 'nome:arg']) ----
const ACT = {
  // Todas as poses seguram o martelo (ou mostram só o escudo). Cada variação usa poses de golpe e efeitos diferentes:
  // onda dourada (a_sw/n3) ou azul (d_a3/d_m1); estilos da onda: reta, drop (cai do alto), ground (pelo chão), twin (dupla)
  melee:[
    S(2100, [[0,'a_i1'],[.1,'a_rd',{dx:-3}],[.24,'a_hh',{dx:-4}],[.31,'a_hh',{dx:-6,dy:-2}],[.38,'a_sw',{dx:8}],[.62,'a_sw',{dx:4}],[.74,'a_lo'],[.92,'a_i1']], [[.2,'wind'],[.33,'swing:1:small']]),
    S(2200, [[0,'d_i1'],[.1,'d_a2',{dx:-3}],[.26,'d_a1',{dx:-4}],[.36,'d_a3',{dx:6}],[.62,'d_a3',{dx:4}],[.78,'d_a2'],[.93,'d_i2']], [[.2,'wind'],[.36,'swing:2:small2:blue']]),
    S(2300, [[0,'d_i2'],[.1,'d_a2'],[.24,'d_m1',{dx:4}],[.4,'d_m1',{dx:8}],[.52,'d_a4',{dx:2,dy:2}],[.74,'d_a4'],[.88,'d_a2'],[.95,'d_i1']], [[.2,'wind'],[.34,'swing:2:small3:blue'],[.5,'spike']]),
    S(2300, [[0,'d_i3'],[.1,'d_a2'],[.22,'d_m3',{dx:-2,dy:-2}],[.32,'d_m3',{dx:-4,dy:-4}],[.42,'d_a3',{dx:6}],[.62,'d_a3',{dx:4}],[.76,'d_m4'],[.93,'d_i1']], [[.2,'wind'],[.36,'swing:1:small3:blue:twin']]),
    S(2200, [[0,'a_i2'],[.1,'a_cr',{dx:-4}],[.24,'a_lo',{dx:-6}],[.36,'a_sw',{dx:6,dy:2}],[.62,'a_sw',{dx:4}],[.76,'a_lo'],[.92,'a_i2']], [[.2,'wind'],[.34,'swing:2:small4:ground']]),
    S(2400, [[0,'d_i1'],[.1,'d_a2'],[.22,'d_h2',{dx:-2,dy:-2}],[.34,'d_h2',{dy:-4}],[.44,'d_a4',{dy:3}],[.66,'d_a4',{dy:2}],[.8,'d_a2'],[.94,'d_i2']], [[.18,'wind'],[.4,'swing:2:small2:drop'],[.46,'quake']]),
    S(2300, [[0,'a_i1'],[.1,'d_a2'],[.22,'d_a1',{dx:-3}],[.34,'a_sw',{dx:8}],[.5,'d_m2',{dx:4}],[.68,'d_m2',{dx:2}],[.8,'a_rd'],[.93,'a_i1']], [[.2,'wind'],[.34,'swing:1:small4:twin']]),
    S(2500, [[0,'d_i2'],[.1,'d_a2'],[.2,'d_m3',{dx:-3,dy:-2}],[.3,'d_m1',{dx:6}],[.44,'d_m1',{dx:8}],[.52,'d_a3',{dx:8}],[.66,'d_a3',{dx:4}],[.8,'d_m4'],[.94,'d_i3']], [[.18,'wind'],[.3,'swing:1:small:blue'],[.5,'swing:2:small2:blue:drop']]),
    S(2400, [[0,'d_i3'],[.1,'d_a2'],[.24,'d_a1',{dx:-4}],[.34,'d_a3',{dx:6}],[.5,'d_a3'],[.58,'d_a4',{dx:2,dy:2}],[.78,'d_a4'],[.9,'d_a2'],[.95,'d_i1']], [[.2,'wind'],[.34,'swing:2:small3:blue'],[.56,'swing:3:small2:blue:drop'],[.6,'spike']]),
    S(2200, [[0,'a_i2'],[.1,'a_lo'],[.24,'n1'],[.32,'n2',{dx:-6}],[.4,'n3',{dx:6}],[.64,'n3',{dx:4}],[.78,'a_rd'],[.93,'a_i1']], [[.2,'wind'],[.35,'swing:3:small:drop']]),
  ],
  heavy:[   // super pesado (2x): marreta no alto → explosão de pedras (poses da folha nova), cada uma com impacto diferente
    S(3200, [[0,'d_i1'],[.08,'d_h1',{dx:-3}],[.2,'d_h2',{dy:-2}],[.32,'d_h2',{dy:-5}],[.44,'d_h3',{dy:2}],[.6,'d_h3'],[.74,'d_h4'],[.88,'d_a2'],[.95,'d_i1']], [[.18,'wind'],[.32,'wind'],[.42,'swing:4:big'],[.5,'burst']]),
    S(3300, [[0,'d_i2'],[.08,'d_h1'],[.2,'d_h2',{dy:-3}],[.34,'d_h2',{dy:-5}],[.44,'d_h3'],[.58,'d_a4',{dy:2}],[.76,'d_a4'],[.88,'d_a2'],[.95,'d_i1']], [[.18,'wind'],[.32,'wind'],[.43,'swing:4:big2:blue'],[.52,'spike'],[.58,'quake']]),
    S(3300, [[0,'a_i1'],[.08,'a_rd'],[.2,'d_h2',{dy:-3}],[.34,'d_h2',{dy:-5}],[.46,'d_h3',{dy:2}],[.62,'d_h4'],[.78,'d_h4'],[.9,'d_h1'],[.95,'d_i2']], [[.18,'wind'],[.34,'wind'],[.45,'swing:4:big3:drop'],[.52,'burst']]),
    S(3400, [[0,'d_i3'],[.08,'d_a2'],[.18,'d_a1',{dy:-2}],[.3,'d_m3',{dy:-4}],[.4,'d_h2',{dy:-5}],[.5,'d_h3'],[.66,'d_h4'],[.84,'d_a2'],[.95,'d_i1']], [[.16,'wind'],[.34,'wind'],[.47,'swing:4:big:twin'],[.56,'quake']]),
    S(3300, [[0,'d_i1'],[.08,'d_a2'],[.2,'d_m1',{dx:2}],[.32,'d_h2',{dy:-5}],[.44,'d_h3'],[.6,'d_h3'],[.76,'d_h4'],[.9,'d_h1'],[.95,'d_i2']], [[.18,'wind'],[.34,'wind'],[.45,'swing:4:big4:blue:drop'],[.52,'burst'],[.54,'spike']]),
    S(3500, [[0,'a_i2'],[.08,'a_hh',{dy:-2}],[.2,'d_h2',{dy:-4}],[.32,'d_h2',{dy:-5}],[.44,'d_h3'],[.58,'d_h4'],[.7,'d_a1'],[.82,'a_sw',{dx:6}],[.92,'a_rd'],[.96,'a_i1']], [[.16,'wind'],[.32,'wind'],[.42,'swing:4:big2'],[.5,'burst'],[.74,'swing:3:small2:twin']]),
    S(3400, [[0,'d_i2'],[.08,'d_a2'],[.2,'d_m3',{dy:-3}],[.32,'d_h2',{dy:-5}],[.44,'d_h3'],[.56,'d_a4',{dy:2}],[.72,'d_a4'],[.86,'d_h1'],[.95,'d_i3']], [[.16,'wind'],[.34,'wind'],[.44,'swing:4:big3:ground'],[.52,'quake'],[.6,'spike']]),
  ],
  guard_p:[ // proteção específica (escudo sobre o aliado)
    S(2000, [[0,'d_i1'],[.14,'d_p1'],[.34,'d_p3',{dy:-1}],[.8,'d_p3'],[.96,'d_i2']], [[.3,'shield:p1']]),
    S(2000, [[0,'a_i2'],[.14,'d_p1'],[.34,'a_s1',{dy:-1}],[.8,'a_s1'],[.96,'a_i1']], [[.3,'shield:p2']]),
    S(2100, [[0,'d_i3'],[.12,'d_p1'],[.3,'a_s2'],[.8,'a_s2'],[.96,'d_i1']], [[.28,'shield:p3']]),
    S(2100, [[0,'a_i1'],[.14,'p1'],[.3,'a_bub'],[.8,'a_bub'],[.96,'d_i2']], [[.3,'shield:p4']]),
    S(2100, [[0,'d_i2'],[.12,'d_p1'],[.3,'a_s1'],[.5,'d_p3'],[.82,'d_p3'],[.96,'a_i1']], [[.28,'shield:p2'],[.5,'shield:p4']]),
    S(2000, [[0,'d_i1'],[.12,'d_p3'],[.3,'d_p1'],[.5,'a_s2'],[.82,'a_s2'],[.96,'d_i3']], [[.28,'shield:p1'],[.5,'shield:p3']]),
  ],
  guard_d:[ // defesa com escudo
    S(1900, [[0,'d_i1'],[.12,'d_f1'],[.3,'d_f2'],[.88,'d_f2'],[.98,'d_i2']], [[.26,'shield:d1']]),
    S(1900, [[0,'d_i2'],[.12,'d_f1'],[.3,'d_f3'],[.88,'d_f3'],[.98,'d_i1']], [[.26,'shield:d2']]),
    S(1900, [[0,'d_i3'],[.12,'d_f3'],[.3,'d_f2'],[.88,'d_f2'],[.98,'d_i1']], [[.26,'shield:d3']]),
    S(1900, [[0,'a_i1'],[.12,'a_rd'],[.3,'a_s2'],[.88,'a_s2'],[.98,'a_i1']], [[.26,'shield:d4']]),
    S(2000, [[0,'d_i1'],[.12,'d_f1'],[.3,'d_f3'],[.6,'a_swl'],[.88,'a_swl'],[.98,'d_i2']], [[.26,'shield:d2'],[.58,'shield:d4']]),
    S(2000, [[0,'a_i2'],[.12,'d_f1'],[.3,'a_s1'],[.6,'d_f2'],[.88,'d_f2'],[.98,'a_i1']], [[.26,'shield:d3'],[.58,'shield:d1']]),
  ],
  dodge:[   // esquiva: rolamento da folha nova, com vento e poeira
    S(1300, [[0,'d_i1'],[.1,'d_e1',{dx:-6}],[.26,'d_e2',{dx:-44,dy:-2}],[.48,'d_e3',{dx:-66}],[.7,'d_e4',{dx:-44}],[.86,'d_e1',{dx:-10}],[.98,'d_i1']], [], {ghost:true}),
    S(1300, [[0,'d_i2'],[.1,'d_e1',{dx:6}],[.26,'d_e2',{dx:44}],[.48,'d_e3',{dx:66}],[.7,'d_e4',{dx:44}],[.86,'d_e1',{dx:8}],[.98,'d_i1']], [], {ghost:true, gdir:-1}),
    S(1250, [[0,'a_i1'],[.1,'a_rd',{dx:-6}],[.26,'a_rl1',{dx:-44,dy:-2}],[.48,'a_rl2',{dx:-66}],[.7,'a_dust',{dx:-44}],[.86,'a_rd',{dx:-10}],[.98,'a_i1']], [], {ghost:true}),
    S(1300, [[0,'d_i3'],[.1,'d_e1',{dx:-6}],[.28,'d_e4',{dx:-40,dy:-2}],[.52,'d_e3',{dx:-62}],[.74,'d_e2',{dx:-34}],[.88,'d_e1'],[.98,'d_i1']], [], {ghost:true}),
    S(1250, [[0,'a_i2'],[.1,'a_cr',{dx:6}],[.26,'a_rl2',{dx:44}],[.48,'a_rl1',{dx:64,dy:-2}],[.7,'a_dust',{dx:40}],[.86,'a_rd',{dx:8}],[.98,'a_i1']], [], {ghost:true, gdir:-1}),
    S(1250, [[0,'d_i1'],[.1,'d_e1',{dx:4}],[.28,'d_e2',{dx:40,dy:-8}],[.5,'d_e4',{dx:64,dy:-4}],[.72,'d_e3',{dx:36}],[.88,'d_e1',{dx:6}],[.98,'d_i2']], [], {ghost:true, gdir:-1}),
  ],
  hurt:[
    S(850, [[0,'a_i1'],[.1,'d_f1',{dx:-8,rot:-3}],[.34,'d_f1',{dx:3}],[.62,'d_f1'],[.92,'d_i1']], [], {tint:true}),
    S(850, [[0,'d_i2'],[.1,'a_rd',{dx:-8,rot:-4}],[.34,'a_rd',{dx:3}],[.62,'a_cr'],[.92,'a_i1']], [], {tint:true}),
    S(900, [[0,'a_i1'],[.12,'d_e1',{dx:-6,dy:2}],[.4,'d_e1',{dx:2}],[.66,'d_f1'],[.92,'d_i3']], [], {tint:true}),
    S(850, [[0,'d_i3'],[.1,'a_lo',{dx:-8,rot:-3}],[.34,'a_lo',{dx:3}],[.62,'d_h1'],[.92,'d_i1']], [], {tint:true}),
    S(850, [[0,'d_i1'],[.1,'d_h1',{dx:-8,rot:-4}],[.34,'d_h1',{dx:3}],[.62,'d_f3'],[.92,'a_i2']], [], {tint:true}),
  ],
  victory:[
    S(3000, [[0,'d_i1'],[.12,'d_a2'],[.28,'d_a1',{dy:-2}],[.5,'d_u1',{dy:-3}],[.8,'d_u1',{dy:-2}],[.96,'d_i2']], [[.3,'cheer'],[.52,'cheer:rise'],[.8,'cheer']]),
    S(3200, [[0,'d_i2'],[.14,'d_m3'],[.38,'d_u1'],[.62,'d_u2'],[.82,'d_u2'],[.96,'d_i1']], [[.36,'cheer:rise'],[.6,'cheer'],[.82,'cheer:rise']]),
    S(3000, [[0,'d_i3'],[.14,'d_h2',{dy:-3}],[.4,'d_h2',{dy:-5}],[.58,'d_u1'],[.84,'d_u2'],[.96,'d_i1']], [[.4,'cheer'],[.6,'cheer:rise'],[.84,'cheer']]),
    S(3000, [[0,'a_i1'],[.14,'a_hh',{dy:-3}],[.4,'tB',{dy:-3}],[.62,'tC'],[.84,'tC'],[.96,'a_i2']], [[.4,'cheer'],[.6,'cheer:rise'],[.84,'cheer']]),
    S(3200, [[0,'d_i1'],[.12,'d_m3'],[.3,'d_h2',{dy:-4}],[.5,'d_u1',{dy:-2}],[.7,'tA'],[.88,'d_u2'],[.96,'d_i2']], [[.32,'cheer'],[.52,'cheer:rise'],[.72,'cheer'],[.88,'cheer:rise']]),
  ],
  ult:[     // provocação: martelo no alto + aura dourada e pedras voando
    S(3800, [[0,'d_i1'],[.08,'d_a2'],[.2,'d_a1',{dy:-3}],[.34,'d_u1',{dy:-3}],[.56,'d_u2',{dy:-3}],[.82,'d_u1',{dy:-2}],[.95,'d_i2']], [[.12,'wind'],[.3,'taunt'],[.46,'taunt:2'],[.62,'taunt:3']]),
    S(3800, [[0,'d_i2'],[.1,'d_p1'],[.22,'tA'],[.4,'tB'],[.62,'tC'],[.82,'tB'],[.95,'d_i1']], [[.12,'wind'],[.26,'taunt'],[.44,'taunt:2'],[.64,'taunt:3']]),
    S(3800, [[0,'d_i3'],[.1,'d_m3',{dx:-3}],[.24,'d_u1',{dy:-3}],[.42,'tA'],[.62,'d_u2',{dy:-2}],[.84,'tC'],[.95,'d_i1']], [[.12,'wind'],[.28,'taunt'],[.46,'taunt:2'],[.66,'taunt:3']]),
    S(4000, [[0,'a_i2'],[.08,'a_cr'],[.2,'a_hh',{dy:-3}],[.34,'tA'],[.5,'tC',{dy:-4}],[.7,'tB',{dy:-3}],[.86,'tC'],[.95,'a_i1']], [[.12,'wind'],[.3,'taunt'],[.44,'taunt:4'],[.6,'taunt:2'],[.76,'taunt:3']]),
    S(4000, [[0,'d_i1'],[.08,'d_h1'],[.2,'d_h2',{dy:-3}],[.34,'d_u1',{dy:-3}],[.5,'d_u2'],[.7,'d_u1',{dy:-2}],[.88,'tC'],[.95,'d_i2']], [[.12,'wind'],[.28,'taunt:2'],[.44,'taunt:4'],[.6,'taunt'],[.78,'taunt:3']]),
    S(4200, [[0,'d_i2'],[.08,'d_a2'],[.18,'d_a1',{dy:-3}],[.3,'d_m3',{dx:-4,dy:-6}],[.44,'tA'],[.6,'d_u1',{dy:-3}],[.76,'tC',{dy:-4}],[.9,'d_u2'],[.95,'d_i1']], [[.12,'wind'],[.3,'taunt:4'],[.46,'taunt:2'],[.62,'taunt:4'],[.8,'taunt:3']]),
  ],
};
const IDLES = [   // ociosa: sorteada, com pausas longas entre uma e outra
  S(4200, [[0,'a_i1'],[.2,'a_i2'],[.5,'a_i2'],[.8,'a_i1'],[.98,'a_i1']]),
  S(3600, [[0,'a_i1'],[.25,'a_rd'],[.6,'a_rd'],[.85,'a_i1'],[.98,'a_i1']]),
  S(3600, [[0,'a_i1'],[.25,'a_lo'],[.6,'a_cr'],[.85,'a_lo'],[.98,'a_i1']]),
  S(3200, [[0,'a_i1'],[.3,'d_i2'],[.75,'d_i2'],[.98,'a_i1']]),
  S(3000, [[0,'a_i1'],[.25,'a_i2'],[.75,'a_i2'],[.98,'a_i1']]),
];
IDLES.push(S(4200, [[0,'d_i1'],[.2,'d_i2'],[.5,'d_i2'],[.8,'d_i1'],[.98,'d_i1']]), S(4200, [[0,'d_i1'],[.2,'d_i3'],[.55,'d_i3'],[.82,'d_i1'],[.98,'d_i1']]), S(3800, [[0,'d_i1'],[.2,'d_h1'],[.6,'d_h1'],[.84,'d_i1'],[.98,'d_i1']]));
IDLES.forEach(a => { a.dur = Math.round(a.dur * 1.5); });
const bags = new WeakMap();
const variant = v => { if (!Array.isArray(v)) return v; if (window.__vi != null) return v[window.__vi % v.length]; let b = bags.get(v); if (!b || !b.l.length) { const l = v.map((_, i) => i); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } if (b && l.length > 1 && l[0] === b.last) [l[0], l[l.length - 1]] = [l[l.length - 1], l[0]]; b = {l, last:b ? b.last : -1}; bags.set(v, b); } const i = b.l.shift(); b.last = i; return v[i]; };
const DEATH = [[0,'v1'],[.3,'v2'],[.62,'v3'],[.88,'v4']];      // cai aos poucos: meio caído → um joelho → dois joelhos
const REVIVE = [[0,'v4'],[.2,'v3'],[.5,'v2'],[.82,'v1']];     // levanta na ordem inversa

function glow(g, x, y, r, col, a){
  if (a <= 0.005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,248,225,${clamp(a * .6)})`); gr.addColorStop(.16, `rgba(${col},${clamp(a)})`); gr.addColorStop(.5, `rgba(${col},${clamp(a * .3)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function streak(g, x, y, ang, len, th, col, a){      // brilho esticado na direção do golpe (onda de impacto)
  if (a <= .005) return; g.save(); g.translate(x, y); g.rotate(ang); g.scale(len / th, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, th); gr.addColorStop(0, `rgba(255,248,225,${clamp(a * .7)})`); gr.addColorStop(.3, `rgba(${col},${clamp(a)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-th, -th, th * 2, th * 2); g.restore();
}
const hex2rgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return null; const n = parseInt(m[1], 16); return `${n >> 16},${n >> 8 & 255},${n & 255}`; };

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, front = layers.front, fc = front.getContext('2d'), back = layers.back, bc = back.getContext('2d');
  let backUsed = false;
  const cw = cv.width, ch = cv.height, OX = world.x - Px, OY = world.y - Py;
  let M = null; const img = {};
  const load = (k, src) => img[k] || (img[k] = Object.assign(new Image(), {src}));
  fetch('tank/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => load(n, `tank/${n}.png`)); FXS.forEach(n => load('fx_' + n, `knight/fx_${n}.png`)); FXD.forEach(n => load('fx_' + n, `tank/fx_${n}.png`)); }).catch(() => {});
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); };
  let fxl = [], cur = null, shakeT = 0, flashT = 0, last = 0, t0 = clk(), running = false;
  let deadTarget = 0, deadT = 0, reviveT = 0, prev = null, curPose = null, lastT = {dx:0, dy:0, rot:0, sc:1}, cur_t = 0, fade = 240, col = null;
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), add: o.add !== false, bk: !!o.back});
  const feet = () => ({x:world.x + W / 2 + XOFF, y:world.y + BASE});
  const hand = () => { const f = feet(); return {x:f.x + 60 * SZ, y:f.y - 170 * SZ}; };

  function swing(k, style, side = 0, delay = 0){      // onda de impacto: sai do martelo e voa até o boss (devolve a duração do voo)
    const h0 = hand(), b = T, sz = k === 4 ? 1.4 : k === 3 ? 1.1 : 1;
    style = style || ''; const drop = style.includes('drop'), ground = style.includes('ground'), blue = style.includes('blue');
    const a = drop ? {x:T.x + rnd(-50, 50), y:T.y - 330} : h0;
    const dist = Math.hypot(b.x - a.x, b.y - a.y), d = drop ? 520 : 420 + dist * .35, ang = Math.atan2(b.y - a.y, b.x - a.x);
    const kk = side ? side * 55 : ground ? rnd(-1, 1) * 70 : rnd(-1, 1) * 18, lift = drop ? 0 : ground ? 6 : 30, pw = drop ? 2.2 : 1.6;
    const path = u => { const e = Math.pow(u, pw), w = Math.sin(Math.PI * u); return {x:lerp(a.x, b.x, e) + kk * w * (ground ? Math.sin(u * 9) : 1), y:lerp(a.y, b.y, e) - w * lift}; };
    const fd = u => u < .1 ? u / .1 : u > .92 ? (1 - u) / .08 : 1;
    const col = blue ? BLUE : ground ? FIRE : GOLD;
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:(54 + 14 * Math.sin(u * 22)) * sz * (.6 + .5 * u), c:col, a:.8 * fd(u)}; }, {delay});
    E('streak', d, u => { const p = path(u), q = path(Math.min(1, u + .04)); return {x:p.x, y:p.y, ang:Math.atan2(q.y - p.y, q.x - p.x), len:(drop ? 160 : 120) * sz, th:26 * sz, c:blue ? BLUE : FIRE, a:.8 * fd(u)}; }, {delay});
    for (let i = 1; i <= 9; i++) { const ut = i / 10, p = path(ut), rr = FXS[(i + (style ? 2 : 0)) % FXS.length], up = ground ? -40 : 0; E('glow', 480, v => ({x:p.x, y:p.y + 10 * v, r:46 * sz * (1 - v * .6), c:FIRE, a:.45 * (1 - v)}), {delay:delay + ut * d});
      E('fx_' + rr, 640, v => ({x:p.x + Math.sin(i * 3) * 24 * v, y:p.y + 10 + 60 * v * v - (26 + (ground ? 50 : 0)) * v, s:(.55 + (ground ? .15 : 0)) * (1 - v * .3), rot:v * 5 * (i % 2 ? 1 : -1), a:1 - seg(v, .55, 1)}), {delay:delay + ut * d * .9}); }
    return d + delay;
  }
  function swingHit(k, kind, style){
    let d;
    style = style || ''; if (style.includes('twin')) { const st = style.replace('twin', ''); swing(k, st, -1); d = swing(k, st, 1, 170); } else d = swing(k, style);
    setTimeout(() => { hit(kind); fireHit(); }, d / (window.__ts == null ? 1 : window.__ts));
  }
  function hit(kind){
    const bl = (r, col, a, dl = 0, d = 650) => E('glow', d, u => ({...T, r:r * (.4 + eo(u) * .9), c:col, a:a * (1 - u) * (u < .08 ? u / .08 : 1)}), {delay:dl});
    const rocks = (n, spread, up, big) => { for (let i = 0; i < n; i++) { const an = -Math.PI / 2 + rnd(-1.25, 1.25), sp = rnd(.5, 1) * spread, rr = FXS[i % FXS.length], rot = rnd(-6, 6);
      E('fx_' + rr, 900, u => ({x:T.x + Math.cos(an) * sp * u, y:T.y + Math.sin(an) * sp * u + 260 * u * u - up * Math.sin(Math.PI * Math.min(1, u * 1.1)), s:big ? .9 : .65, rot:rot * u, a:1 - seg(u, .7, 1)}), {delay:i * 15}); } };
    const ring = (r, d, col, a, dl = 0) => E('ring', d, u => ({x:T.x, y:T.y + 50, r:lerp(r * .3, r, eo(u)), c:col, a:a * (1 - u)}), {delay:dl});
    if (kind === 'small') { bl(120, GOLD, .9); bl(70, '255,255,255', .8, 0, 380); rocks(4, 90, 60); ring(90, 520, GOLD, .8); }
    else if (kind === 'small2') { bl(130, FIRE, .9); bl(80, '255,255,255', .8, 0, 380); rocks(5, 110, 70); ring(110, 560, FIRE, .8); }
    else if (kind === 'small3') { bl(125, GOLD, .9); rocks(4, 100, 80); ring(100, 520, GOLD, .8); ring(60, 420, '255,255,255', .6, 80); }
    else if (kind === 'small4') { bl(125, FIRE, .9); bl(75, '255,255,255', .8, 0, 380); rocks(6, 120, 90); ring(95, 520, GOLD, .8); ring(130, 600, FIRE, .6, 100); }
    else if (kind === 'big4') { bl(270, GOLD, 1, 0, 1000); bl(160, '255,255,255', .9, 0, 520); bl(120, FIRE, .8, 260, 700); rocks(14, 230, 140, true); ring(210, 800, GOLD, .9); ring(130, 600, FIRE, .8, 110); ring(70, 440, '255,255,255', .7, 200); shakeT = clk(); }
    else if (kind === 'big') { bl(260, FIRE, 1, 0, 950); bl(150, '255,255,255', .9, 0, 520); rocks(10, 180, 110, true); ring(190, 760, FIRE, .9); ring(110, 560, GOLD, .8, 100); shakeT = clk(); }
    else if (kind === 'big2') { bl(280, GOLD, 1, 0, 1000); bl(160, '255,255,255', .9, 0, 520); rocks(12, 210, 130, true); ring(220, 820, GOLD, .9); ring(130, 600, FIRE, .8, 120); shakeT = clk(); }
    else { bl(270, FIRE, 1, 0, 1000); bl(170, '255,255,255', .9, 0, 520); rocks(11, 200, 120, true); ring(200, 800, FIRE, .9); ring(120, 600, GOLD, .8, 90); ring(70, 440, '255,255,255', .7, 160); shakeT = clk(); }
  }
  const EV = {
    wind(){ const f = feet(); for (let i = 0; i < 6; i++) { const an = rnd(0, 6.28); E('glow', 700, u => ({x:f.x + Math.cos(an) * 60 * eo(u), y:f.y - 10 + Math.sin(an) * 10, r:34 * (1 - u * .4), c:'255,230,190', a:.28 * Math.sin(Math.PI * u)}), {delay:i * 60}); }
      E('ring', 800, u => ({x:f.x, y:f.y - 4, r:lerp(40, 110, eo(u)), c:GOLD, a:.5 * Math.sin(Math.PI * u)})); },
    cheer(k){ const f = feet(); if (k === 'rise') { E('glow', 1200, u => ({x:f.x, y:f.y - 130, r:lerp(60, 170, eo(u)), c:GOLD, a:.5 * Math.sin(Math.PI * u)}), {back:true}); return; }
      E('glow', 700, u => ({x:f.x, y:f.y - 140, r:lerp(40, 150, eo(u)), c:GOLD, a:.55 * (1 - u)})); E('ring', 800, u => ({x:f.x, y:f.y - 4, r:lerp(40, 120, eo(u)), c:GOLD, a:.6 * (1 - u)})); },
    taunt(k){ const f = feet(), n = +k || 1;
      E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(50, 150 + 40 * n, eo(u)), c:n === 2 ? FIRE : GOLD, a:.85 * (1 - u)}));
      E('glow', 1300, u => ({x:f.x, y:f.y - 130, r:lerp(70, 190 + 30 * n, eo(u)), c:GOLD, a:.55 * Math.sin(Math.PI * u)}), {back:true});
      if (n === 3) { E('glow', 900, u => ({x:f.x, y:f.y - 140, r:lerp(100, 320, eo(u)), c:'255,236,200', a:.7 * (1 - u)})); shakeT = clk(); } },
    spike(){ E('glow', 700, u => ({...T, r:lerp(60, 200, eo(u)), c:BLUE, a:.8 * (1 - u)})); E('fx_bspike', 900, u => ({x:T.x, y:T.y - 20 - 40 * eo(u), s:lerp(.5, 1.4, eo(Math.min(1, u * 1.6))), a:u < .1 ? u / .1 : 1 - seg(u, .5, 1)}));
      E('fx_bring', 1000, u => ({x:T.x, y:T.y + 50, s:lerp(.5, 1.5, eo(u)), a:1 - seg(u, .4, 1)})); },
    quake(){ E('fx_earth', 1000, u => ({x:T.x, y:T.y + 20 - 30 * eo(Math.min(1, u * 2)), s:lerp(.4, 1.5, eo(Math.min(1, u * 1.8))), a:u < .08 ? u / .08 : 1 - seg(u, .55, 1)})); E('glow', 600, u => ({...T, r:lerp(60, 170, eo(u)), c:FIRE, a:.6 * (1 - u)})); shakeT = clk(); },
    burst(){ E('fx_rockburst', 1000, u => ({x:T.x, y:T.y + 10, s:lerp(.4, 1.6, eo(Math.min(1, u * 1.6))), a:u < .08 ? u / .08 : 1 - seg(u, .5, 1)})); E('glow', 700, u => ({...T, r:lerp(80, 240, eo(u)), c:GOLD, a:.8 * (1 - u)})); E('fx_bring', 1000, u => ({x:T.x, y:T.y + 50, s:lerp(.6, 1.8, eo(u)), a:.9 * (1 - u)})); shakeT = clk(); },
    taunt4(){ const f = feet(); E('ring', 1000, u => ({x:f.x, y:f.y - 6, r:lerp(50, 210, eo(u)), c:FIRE, a:.8 * (1 - u)}));
      for (let i = 0; i < 9; i++) { const ox = (i - 4) * 38 + rnd(-10, 10), rr = FXS[i % FXS.length], dl = i * 90; E('fx_' + rr, 900, u => ({x:f.x + ox, y:lerp(f.y - 330, f.y - 20, u * u), s:.6, rot:u * 4 * (i % 2 ? 1 : -1), a:u < .1 ? u / .1 : 1 - seg(u, .8, 1)}), {delay:dl}); E('glow', 360, u => ({x:f.x + ox, y:f.y - 14, r:lerp(20, 60, u), c:FIRE, a:.5 * (1 - u)}), {delay:dl + 760}); }
      shakeT = clk() + 700; },
    shield(k){ const f = feet(), cs = hex2rgb(col), p = /^p/.test(k || ''), cc = cs || (p ? '255,170,80' : '120,180,255');
      E('glow', 1700, u => ({x:f.x, y:f.y - 125, r:p ? 190 : 160, c:cc, a:(p ? .5 : .4) * Math.sin(Math.PI * u)}), {back:true});
      E('ring', 1500, u => ({x:f.x, y:f.y - 6, r:lerp(50, p ? 150 : 120, eo(u)), c:cc, a:.7 * Math.sin(Math.PI * u)}));
      if (k === 'p2' || k === 'p4' || k === 'd2' || k === 'd4') E('ring', 1500, u => ({x:f.x, y:f.y - 6 - 60 * u, r:lerp(40, 100, eo(u)), c:cc, a:.5 * Math.sin(Math.PI * u)}), {delay:260});
      for (let i = 0; i < (p ? 6 : 3); i++) { const an = i * 1.1; E('glow', 1000, u => ({x:f.x + Math.cos(an) * 70, y:f.y - 30 - 150 * u, r:16, c:cc, a:.7 * Math.sin(Math.PI * u)}), {delay:i * 170}); } },
  };
  function runEv(e){ const [k, a, b, ...c2] = e.split(':'); if (k === 'swing') swingHit(+a, b || 'small', c2.join(':')); else if (k === 'hit') { hit(a); fireHit(); } else if (k === 'taunt' && a === '4') EV.taunt4(); else if (EV[k]) EV[k](a); }

  function poseAt(a, pe){
    const st = a.steps; let i = 0; while (i < st.length - 1 && pe >= st[i + 1][0]) i++;
    const A = st[i], B = st[Math.min(i + 1, st.length - 1)], u = A === B ? 1 : ease(clamp((pe - A[0]) / (B[0] - A[0])));
    const ta = A[2] || {}, tb = B[2] || {};
    return {pose:A[1], dx:lerp(ta.dx || 0, tb.dx || 0, u), dy:lerp(ta.dy || 0, tb.dy || 0, u), rot:lerp(ta.rot || 0, tb.rot || 0, u), sc:1};
  }
  function drawPose(name, dx, dy, rot, alpha, tm, tint, sc = 1, br0 = 1){
    const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return;
    const br = Math.sin(tm / 1000 * 2.0) * br0, fx = Px + W / 2 + XOFF + dx, fy = Py + BASE + dy;
    c.save(); c.globalAlpha = alpha; c.translate(fx, fy); c.rotate(rot * Math.PI / 180); c.scale(SZ * (PM[name] || 1) * sc * (1 - .004 * br), SZ * (PM[name] || 1) * sc * (1 + .008 * br));
    c.drawImage(im, -m.cx, -m.gy);
    if (tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,40,40,${tint})`; c.fillRect(-m.cx, -m.gy, m.w, m.h); }
    c.restore();
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
    } else if (reviveT) { const k = clamp((now - reviveT) / 1100); st = poseAt({steps:REVIVE, dur:1100}, k); if (k >= 1) reviveT = 0; }
    else st = {pose:'a_i1', dx:0, dy:0, rot:0, sc:1};
    if (st.pose !== curPose) { prev = curPose ? {pose:curPose, dx:lastT.dx, dy:lastT.dy, rot:lastT.rot, sc:lastT.sc || 1} : null; curPose = st.pose; cur_t = now; fade = cur || deadTarget ? 110 : 240; }
    lastT = st;
    const f = clamp((now - cur_t) / fade);
    c.clearRect(0, 0, cw, ch); if (!deadTarget) { c.save(); c.translate(Px - host.P, Py - host.P + (BASE - 266)); c.translate(host.P + W / 2 + XOFF, 0); c.scale(SZ, 1); c.translate(-(host.P + W / 2 + XOFF), 0); host.shadow(c); c.restore(); } c.imageSmoothingEnabled = true;
    const tint = a && a.tint ? Math.sin(clamp(pe) * Math.PI) * .55 * (cur && cur.light ? .6 : 1) : 0;
    if (a && a.ghost) { const g = Math.sin(clamp(pe) * Math.PI), gd = a.gdir || 1; drawPose(st.pose, st.dx + 46 * g * gd, st.dy, st.rot, .18 * g, tm, 0, st.sc, 0); drawPose(st.pose, st.dx + 90 * g * gd, st.dy, st.rot, .10 * g, tm, 0, st.sc, 0); }
    if (prev && f < 1) drawPose(prev.pose, prev.dx, prev.dy, prev.rot, 1, tm, tint, prev.sc, deadTarget ? 0 : 1);
    drawPose(st.pose, st.dx, st.dy, st.rot, prev && f < 1 ? f : 1, tm, tint, st.sc || 1, deadTarget ? 0 : 1);
    fc.clearRect(0, 0, front.width, front.height);
    if (backUsed) { bc.clearRect(0, 0, back.width, back.height); backUsed = false; }
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), im = img[e.name], g = e.bk ? bc : fc; if (e.bk) backUsed = true;
      if (!s) return true;
      if (e.name === 'glow') { glow(g, s.x, s.y, s.r, s.c, s.a); return true; }
      if (e.name === 'streak') { streak(g, s.x, s.y, s.ang, s.len, s.th, s.c, s.a); return true; }
      if (e.name === 'ring') { g.save(); g.translate(s.x, s.y); g.scale(1, .3); g.globalCompositeOperation = 'lighter'; g.lineWidth = 10; g.strokeStyle = `rgba(${s.c},${clamp(s.a * .7)})`; g.shadowColor = `rgba(${s.c},.9)`; g.shadowBlur = 30; g.beginPath(); g.arc(0, 0, s.r, 0, 6.2832); g.stroke(); g.restore(); return true; }
      if (!ready(e.name)) return true;
      const w = im.naturalWidth * (s.s || 1), h = im.naturalHeight * (s.s || 1);
      g.save(); g.globalAlpha = clamp(s.a == null ? 1 : s.a); g.translate(s.x, s.y); if (s.rot) g.rotate(s.rot); FXSoft.draw(g, im, -w / 2, -h / 2, w, h, 1); g.restore(); return true;
    });
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 1 * (1 - u)}px,${Math.cos(u * 50) * .8 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); cur = {a, start: clk(), fired: 0, done: ok => res(ok !== false), ...extra}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (deadTarget) return Promise.resolve(false);
      col = o.color || null;
      if (name === 'guard') { const prot = /ff9d3d/i.test(o.color || ''); return run(variant(prot ? ACT.guard_p : ACT.guard_d)); }
      if (name === 'cast') name = 'melee';
      const a = variant(ACT[name]); if (!a) return Promise.resolve(false); const p = run(a, {light:!!o.light}); p.then(fireHit); return p;
    },
    nextHit(){ return new Promise(r => hitW.push(r)); },
    idle(){ if (cur || deadTarget) return Promise.resolve(false); return run(variant(IDLES)); },
    has: n => !!ACT[n] || n === 'guard' || n === 'cast',
    setDead(d){ if (d) { if (cur) cur.done(false); cur = null; reviveT = 0; deadTarget = 1; deadT = clk(); } else if (deadTarget) { deadTarget = 0; reviveT = clk(); } },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } fxl = []; deadTarget = 0; reviveT = 0; },
  };
}
window.TankRig = {make};
})();
