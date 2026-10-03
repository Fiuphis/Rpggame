/* Banco de Dados I — RPG · Guerreiro (v71)
   Poses de COSTAS recortadas das 3 folhas novas (knight/*.png, tools/cut_knight.py): mesma escala, ancoradas pelos pés, borda fina.
   Habilidades: ataque normal (espada), ataque pesado (1,5x), passar a vez, defesa (escudo), esquiva, berserk (ult) + modo berserk e modo exausto.
   Cada uso sorteia uma variação diferente da anterior (sacola embaralhada). O dano só entra quando o golpe acerta (fireHit). */
(() => {
'use strict';
const T = {x:517, y:340};                 // ponto de impacto no boss
const BASE = 262, SZ = 1, XOFF = 0;       // pés (y) e escala (o Guerreiro é o 2º maior: Tanque 314 > Guerreiro 256 > Maga/Clériga 225)
const BLUE = '120,180,255', ICE = '190,230,255', GOLD = '255,205,120', RED = '255,60,50', DUST = '230,205,170';
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3);
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));
const S = (d, steps, ev = [], o = {}) => ({dur:d, steps, ev, ...o});
const FXS = ['rock1','rock2','rock3','rock4'], FXK = ['slash','ice','rocksA'].concat(FXS);

// ---- animações (passos [t, pose, {dx,dy,rot,sc}], eventos [t, 'nome:arg']) ----
const ACT = {
  // estilos da onda de corte (swing:k:tipo:estilo): slash (arco azul reto), drop (cai do alto), ground (rente ao chão), twin (dupla), arc (curva), red (berserk)
  melee:[
    S(2100, [[0,'K1_2'],[.1,'K1_8'],[.24,'K1_6',{dx:-6}],[.36,'K1_11',{dx:6}],[.58,'K1_11',{dx:4}],[.74,'K1_7'],[.92,'K1_2']], [[.2,'wind'],[.34,'swing:1:cutA:slash']]),
    S(2300, [[0,'K2_3'],[.1,'K2_7'],[.26,'K2_8',{dy:-2}],[.38,'K2_6',{dx:4}],[.58,'K2_6'],[.72,'K2_9'],[.93,'K2_4']], [[.2,'wind'],[.36,'swing:1:cutB:drop']]),
    S(2300, [[0,'K3_5'],[.1,'K3_8'],[.26,'K3_7',{dx:-4}],[.4,'K3_9',{dx:6}],[.6,'K3_10',{dx:4}],[.78,'K3_10'],[.93,'K3_5']], [[.2,'wind'],[.38,'swing:1:cutC:arc']]),
    S(2500, [[0,'K3_3'],[.1,'K3_33',{dx:-6}],[.24,'K3_35',{dx:-2}],[.36,'K3_34',{dx:8}],[.5,'K3_36',{dx:12}],[.72,'K3_36',{dx:6}],[.9,'K3_4']], [[.18,'wind'],[.3,'swing:1:cutA:slash:twin']]),
    S(2400, [[0,'K1_1'],[.1,'K1_5'],[.26,'K1_4',{dy:-2}],[.4,'K1_11',{dx:4}],[.6,'K1_9'],[.78,'K1_9'],[.93,'K1_1']], [[.2,'wind'],[.38,'swing:1:rockS:ground']]),
    S(2300, [[0,'K2_4'],[.12,'K2_10'],[.3,'K2_11',{dx:4}],[.46,'K2_9'],[.62,'K2_6',{dx:4}],[.8,'K2_6'],[.94,'K2_3']], [[.2,'wind'],[.34,'swing:1:cutC:slash'],[.5,'swing:1:cutB:arc']]),
    S(2500, [[0,'K3_4'],[.1,'K2_8'],[.26,'K3_31',{dy:-2}],[.4,'K3_6',{dy:-2}],[.56,'K3_10',{dx:4}],[.8,'K3_10'],[.94,'K3_5']], [[.2,'wind'],[.38,'swing:2:iceS:drop:twin']]),
  ],
  heavy:[   // pesado (1,5x): espada no alto → impacto com espinhos / rochas / cruz / onda de choque
    S(3200, [[0,'K1_2'],[.08,'K1_5'],[.22,'K1_4',{dy:-3}],[.34,'K1_4',{dy:-5}],[.46,'K1_10',{dy:2}],[.64,'K1_10'],[.78,'K1_9'],[.94,'K1_2']], [[.16,'wind'],[.32,'wind'],[.44,'swing:3:bigIce:drop']]),
    S(3400, [[0,'K3_5'],[.08,'K3_2'],[.2,'K3_2',{dy:-3}],[.34,'K3_6',{dy:-4}],[.48,'K3_1',{dy:2}],[.66,'K3_1'],[.8,'K3_11'],[.94,'K3_5']], [[.16,'wind'],[.34,'wind'],[.46,'swing:3:bigRock:drop']]),
    S(3400, [[0,'K3_4'],[.08,'K3_31'],[.22,'K3_31',{dy:-4}],[.36,'K3_30',{dy:-14}],[.48,'K3_32',{dy:2}],[.68,'K3_32'],[.82,'K3_31'],[.95,'K3_5']], [[.16,'wind'],[.34,'wind'],[.46,'swing:3:bigCross:drop:twin']]),
    S(3200, [[0,'K2_3'],[.1,'K2_8'],[.28,'K2_8',{dy:-3}],[.44,'K2_2',{dy:1}],[.66,'K2_2'],[.8,'K2_9'],[.94,'K2_4']], [[.18,'wind'],[.34,'wind'],[.42,'swing:3:bigIce:ground']]),
    S(3400, [[0,'K3_3'],[.08,'K3_8'],[.24,'K3_7',{dx:-4}],[.4,'K3_38',{dy:1}],[.56,'K3_37',{dy:1}],[.76,'K3_37'],[.92,'K3_40'],[.97,'K3_5']], [[.18,'wind'],[.32,'wind'],[.42,'swing:3:bigShock:ground']]),
    S(3500, [[0,'K1_1'],[.08,'K1_5'],[.24,'K1_4',{dy:-4}],[.38,'K1_4',{dy:-5}],[.5,'K1_37',{dy:1}],[.68,'K1_37'],[.84,'K1_9'],[.95,'K1_2']], [[.16,'wind'],[.34,'wind'],[.46,'swing:3:bigRock:slash:twin']]),
  ],
  guard:[   // defesa com escudo (cada uma com barreira/brilho diferente)
    S(1900, [[0,'K1_2'],[.12,'K1_15'],[.28,'K1_14'],[.4,'K1_13'],[.88,'K1_13'],[.98,'K1_2']], [[.26,'shield:b1']]),
    S(1900, [[0,'K2_3'],[.12,'K2_16'],[.3,'K2_14'],[.42,'K2_15'],[.88,'K2_15'],[.98,'K2_4']], [[.26,'shield:b2']]),
    S(1900, [[0,'K3_5'],[.12,'K3_18'],[.28,'K3_15'],[.4,'K3_13'],[.88,'K3_13'],[.98,'K3_5']], [[.26,'shield:b3']]),
    S(2000, [[0,'K3_3'],[.12,'K3_12'],[.3,'K3_39'],[.5,'K3_40'],[.88,'K3_40'],[.98,'K3_4']], [[.26,'shield:g4']]),
    S(2000, [[0,'K2_4'],[.12,'K2_41'],[.3,'K2_38'],[.5,'K2_39'],[.88,'K2_39'],[.98,'K2_3']], [[.26,'shield:b5']]),
    S(2000, [[0,'K3_4'],[.12,'K3_18'],[.3,'K3_41'],[.55,'K3_42'],[.88,'K3_42'],[.98,'K3_5']], [[.26,'shield:g6']]),
    S(2000, [[0,'K1_1'],[.12,'K1_42'],[.3,'K1_41'],[.88,'K1_41'],[.98,'K1_2']], [[.26,'shield:b7']]),
  ],
  dodge:[   // esquiva: rolamentos/desvios das folhas, com rastro
    S(1300, [[0,'K2_3'],[.1,'K2_20',{dx:-8}],[.28,'K2_21',{dx:-48}],[.5,'K2_22',{dx:-66}],[.72,'K2_20',{dx:-40}],[.88,'K2_3',{dx:-8}],[.98,'K2_4']], [[.28,'dust:-1']], {ghost:true}),
    S(1350, [[0,'K3_5'],[.1,'K3_20',{dx:8}],[.26,'K3_21',{dx:44}],[.46,'K3_22',{dx:64}],[.66,'K3_23',{dx:50}],[.86,'K3_20',{dx:10}],[.98,'K3_5']], [[.26,'dust:1']], {ghost:true, gdir:-1}),
    S(1300, [[0,'K1_2'],[.1,'K1_20',{dx:-8}],[.28,'K1_22',{dx:-46}],[.5,'K1_21',{dx:-66}],[.72,'K1_22',{dx:-36}],[.88,'K1_19'],[.98,'K1_2']], [[.28,'dust:-1']], {ghost:true}),
    S(1250, [[0,'K3_3'],[.1,'K3_44',{dx:6}],[.28,'K3_45',{dx:52,dy:-4}],[.5,'K3_47',{dx:70,dy:-6}],[.72,'K3_44',{dx:40}],[.88,'K3_3',{dx:6}],[.98,'K3_4']], [[.26,'dust:1']], {ghost:true, gdir:-1}),
    S(1350, [[0,'K2_4'],[.1,'K2_46',{dx:-6}],[.3,'K2_43',{dx:-50,dy:-6}],[.5,'K2_45',{dx:-68,dy:-4}],[.74,'K2_43',{dx:-38}],[.9,'K2_42'],[.98,'K2_3']], [[.28,'dust:-1']], {ghost:true}),
    S(1300, [[0,'K1_1'],[.1,'K3_20',{dx:8}],[.28,'K1_20',{dx:40}],[.5,'K3_22',{dx:64}],[.72,'K1_21',{dx:42}],[.88,'K1_45',{dx:8}],[.98,'K1_2']], [[.28,'dust:1']], {ghost:true, gdir:-1}),
  ],
  pass:[    // passar a vez: aponta para o aliado (runas / cruz)
    S(2200, [[0,'K2_3'],[.14,'K2_17'],[.3,'K2_13'],[.82,'K2_13'],[.97,'K2_4']], [[.28,'rune:1']]),
    S(2200, [[0,'K3_5'],[.14,'K3_16'],[.3,'K3_17'],[.82,'K3_17'],[.97,'K3_5']], [[.28,'rune:2']]),
    S(2300, [[0,'K3_3'],[.14,'K3_14'],[.3,'K3_14',{dy:-2}],[.84,'K3_14'],[.97,'K3_4']], [[.28,'rune:3']]),
    S(2300, [[0,'K1_2'],[.14,'K1_32'],[.3,'K1_32'],[.46,'K1_35'],[.84,'K1_35'],[.97,'K1_1']], [[.28,'rune:4'],[.46,'rune:1']]),
    S(2300, [[0,'K2_4'],[.14,'K2_19'],[.3,'K2_19'],[.5,'K2_18'],[.84,'K2_18'],[.97,'K2_3']], [[.26,'rune:5'],[.5,'rune:3']]),
  ],
  hurt:[
    S(850, [[0,'K2_3'],[.1,'K2_42',{dx:-8,rot:-3}],[.34,'K2_42',{dx:3}],[.62,'K2_42'],[.92,'K2_4']], [], {tint:true}),
    S(900, [[0,'K3_5'],[.1,'K3_46',{dx:-6,dy:2}],[.36,'K3_46',{dx:2}],[.66,'K3_23'],[.92,'K3_5']], [], {tint:true}),
    S(900, [[0,'K1_2'],[.1,'K1_46',{dx:-8,rot:-4}],[.36,'K1_46',{dx:3}],[.64,'K1_46'],[.92,'K1_1']], [], {tint:true}),
    S(850, [[0,'K3_4'],[.1,'K1_49',{dx:-6,dy:2}],[.36,'K1_49',{dx:2}],[.64,'K3_46'],[.92,'K3_3']], [], {tint:true}),
    S(900, [[0,'K1_1'],[.1,'K3_48',{dx:-8,rot:-3}],[.36,'K3_48',{dx:3}],[.64,'K2_42'],[.92,'K2_3']], [], {tint:true}),
  ],
  victory:[
    S(3000, [[0,'K2_3'],[.12,'K3_43'],[.3,'K3_31',{dy:-2}],[.5,'K3_31',{dy:-4}],[.8,'K3_31',{dy:-2}],[.96,'K3_5']], [[.3,'cheer'],[.52,'cheer:rise'],[.8,'cheer']]),
    S(3200, [[0,'K3_5'],[.14,'K1_5'],[.34,'K1_4',{dy:-3}],[.6,'K1_4',{dy:-5}],[.82,'K1_4',{dy:-3}],[.96,'K1_2']], [[.36,'cheer:rise'],[.6,'cheer'],[.82,'cheer:rise']]),
    S(3200, [[0,'K1_1'],[.14,'K3_2',{dy:-2}],[.4,'K3_2',{dy:-4}],[.6,'K3_6',{dy:-3}],[.84,'K3_10',{dy:-2}],[.96,'K2_3']], [[.4,'cheer'],[.6,'cheer:rise'],[.84,'cheer']]),
    S(3000, [[0,'K2_4'],[.14,'K3_14'],[.4,'K3_14',{dy:-3}],[.7,'K3_14',{dy:-2}],[.96,'K3_4']], [[.38,'cheer'],[.56,'cheer:rise'],[.78,'cheer']]),
    S(3200, [[0,'K3_4'],[.12,'K2_8'],[.3,'K3_30',{dy:-10}],[.46,'K3_32',{dy:2}],[.7,'K3_31',{dy:-3}],[.88,'K3_31',{dy:-2}],[.97,'K3_5']], [[.34,'cheer'],[.5,'cheer:rise'],[.74,'cheer'],[.9,'cheer:rise']]),
  ],
  ult:[     // berserk: aura vermelha, rugido e explosão de energia
    S(3600, [[0,'K1_44'],[.12,'K1_27'],[.3,'K1_26',{dy:-2}],[.52,'K1_30'],[.72,'K1_29'],[.94,'K1_26']], [[.12,'wind'],[.3,'rage:1'],[.5,'rage:2'],[.68,'rage:3']]),
    S(3800, [[0,'K2_44'],[.12,'K2_32'],[.3,'K2_37',{dy:-3}],[.5,'K2_33',{dy:-2}],[.7,'K2_35'],[.94,'K2_25']], [[.12,'wind'],[.28,'rage:2'],[.48,'rage:1'],[.7,'rage:3']]),
    S(3800, [[0,'K3_5'],[.12,'K3_26'],[.3,'K3_24'],[.5,'K3_25',{dy:-2}],[.68,'K3_28'],[.94,'K3_27']], [[.12,'wind'],[.3,'rage:1'],[.5,'rage:2'],[.7,'rage:3']]),
    S(4000, [[0,'K2_3'],[.1,'K2_26'],[.26,'K1_24'],[.44,'K2_28'],[.62,'K1_25',{dy:-2}],[.84,'K1_28'],[.96,'K2_32']], [[.12,'wind'],[.26,'rage:2'],[.46,'rage:1'],[.64,'rage:3']]),
  ],
};
// modo BERSERK: golpes vermelhos (as poses já trazem a aura)
const BACT = {
  melee:[
    S(2000, [[0,'K2_25'],[.1,'K2_23'],[.26,'K2_24',{dx:-4}],[.4,'K1_25',{dx:6}],[.6,'K2_26'],[.78,'K2_25'],[.94,'K2_25']], [[.2,'wind:r'],[.36,'swing:1:redA:slash:red']]),
    S(2100, [[0,'K1_26'],[.1,'K1_24'],[.26,'K3_25'],[.42,'K3_28',{dx:6}],[.62,'K1_29'],[.82,'K1_26']], [[.2,'wind:r'],[.38,'swing:1:redB:drop:red']]),
    S(2100, [[0,'K3_26'],[.1,'K3_24'],[.26,'K2_34',{dx:-2}],[.4,'K1_28',{dx:6}],[.62,'K3_27'],[.84,'K3_26']], [[.2,'wind:r'],[.36,'swing:1:redC:arc:red']]),
    S(2300, [[0,'K2_32'],[.1,'K2_28'],[.24,'K1_28',{dx:-3}],[.36,'K1_23',{dx:6}],[.52,'K2_34',{dx:8}],[.74,'K1_23'],[.9,'K2_32']], [[.18,'wind:r'],[.32,'swing:1:redA:slash:red:twin']]),
  ],
  heavy:[
    S(3200, [[0,'K3_26'],[.1,'K1_24'],[.28,'K3_25',{dy:-3}],[.42,'K3_28',{dx:4}],[.62,'K1_30'],[.84,'K3_26']], [[.16,'wind:r'],[.32,'wind:r'],[.42,'swing:3:bigRed:drop:red']]),
    S(3400, [[0,'K2_32'],[.1,'K2_37',{dy:-3}],[.3,'K2_37',{dy:-5}],[.46,'K2_33',{dy:1}],[.66,'K2_35'],[.86,'K2_25']], [[.16,'wind:r'],[.34,'wind:r'],[.44,'swing:3:bigRedB:ground:red']]),
    S(3400, [[0,'K1_26'],[.1,'K2_34'],[.28,'K1_25',{dy:-2}],[.46,'K3_29',{dy:2}],[.66,'K3_29'],[.84,'K1_29'],[.95,'K1_26']], [[.16,'wind:r'],[.34,'wind:r'],[.46,'swing:3:bigRed:slash:red:twin']]),
  ],
};
const IDLES = [
  S(4200, [[0,'K1_2'],[.25,'K2_3'],[.55,'K2_3'],[.8,'K1_2'],[.98,'K1_2']]),
  S(3600, [[0,'K1_2'],[.25,'K3_5'],[.6,'K3_5'],[.85,'K1_2'],[.98,'K1_2']]),
  S(3600, [[0,'K1_2'],[.25,'K2_4'],[.6,'K3_3'],[.85,'K1_1'],[.98,'K1_2']]),
  S(3800, [[0,'K1_2'],[.25,'K3_4'],[.7,'K3_4'],[.9,'K1_2'],[.98,'K1_2']]),
  S(3200, [[0,'K1_2'],[.3,'K1_1'],[.75,'K1_1'],[.98,'K1_2']]),
  S(3600, [[0,'K1_2'],[.25,'K2_5'],[.7,'K2_5'],[.9,'K1_2'],[.98,'K1_2']]),
];
IDLES.forEach(a => { a.dur = Math.round(a.dur * 1.5); });
const IDLES_B = [   // respira dentro da aura do berserk
  S(3200, [[0,'K2_25'],[.3,'K1_26'],[.65,'K2_32'],[.9,'K2_25'],[.98,'K2_25']]),
  S(3000, [[0,'K2_25'],[.3,'K1_27'],[.7,'K3_26'],[.92,'K2_25'],[.98,'K2_25']]),
];
const IDLES_T = [   // exausto: ofegante
  S(3200, [[0,'K1_31'],[.4,'K2_30'],[.75,'K1_31'],[.98,'K1_31']]),
  S(3200, [[0,'K2_29'],[.4,'K1_31'],[.75,'K2_29'],[.98,'K2_29']]),
];
const BASE_POSE = {n:'K1_2', bers:'K2_25', tired:'K1_31'};
const bags = new WeakMap();
const variant = v => { if (!Array.isArray(v)) return v; if (window.__vi != null) return v[window.__vi % v.length]; let b = bags.get(v); if (!b || !b.l.length) { const l = v.map((_, i) => i); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } if (b && l.length > 1 && l[0] === b.last) [l[0], l[l.length - 1]] = [l[l.length - 1], l[0]]; b = {l, last:b ? b.last : -1}; bags.set(v, b); } const i = b.l.shift(); b.last = i; return v[i]; };
const DEATH = [[0,'K2_42'],[.26,'K1_46'],[.52,'K1_49'],[.76,'K3_46'],[.92,'K3_48']];     // cai aos poucos: cambaleia → agacha → de joelhos
const REVIVE = [[0,'K3_48'],[.18,'K3_46'],[.4,'K1_49'],[.64,'K1_46'],[.84,'K2_42'],[.98,'K1_2']];   // levanta na ordem inversa
const POSES = (() => { const s = new Set(); const add = a => (a.steps || a).forEach(p => s.add(p[1]));
  [ACT, BACT].forEach(o => Object.values(o).forEach(v => v.forEach(add))); [IDLES, IDLES_B, IDLES_T].forEach(l => l.forEach(add)); add(DEATH); add(REVIVE); Object.values(BASE_POSE).forEach(p => s.add(p)); return [...s]; })();

function glow(g, x, y, r, col, a){
  if (a <= 0.005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,248,235,${clamp(a * .6)})`); gr.addColorStop(.16, `rgba(${col},${clamp(a)})`); gr.addColorStop(.5, `rgba(${col},${clamp(a * .3)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function streak(g, x, y, ang, len, th, col, a){
  if (a <= .005) return; g.save(); g.translate(x, y); g.rotate(ang); g.scale(len / th, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, th); gr.addColorStop(0, `rgba(255,248,235,${clamp(a * .7)})`); gr.addColorStop(.3, `rgba(${col},${clamp(a)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-th, -th, th * 2, th * 2); g.restore();
}

function make(host){
  const {c, cv, Px, Py, W, Hh, world, layers} = host, front = layers.front, fc = front.getContext('2d'), back = layers.back, bc = back.getContext('2d');
  let backUsed = false;
  const cw = cv.width, ch = cv.height;
  let M = null; const img = {};
  const load = (k, src) => img[k] || (img[k] = Object.assign(new Image(), {src}));
  fetch('knight/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => load(n, `knight/${n}.png`)); FXK.forEach(n => load('fx_' + n, `knight/fx_${n}.png`)); }).catch(() => {});
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); };
  let fxl = [], cur = null, shakeT = 0, last = 0, t0 = clk(), running = false, mode = null;
  let deadTarget = 0, deadT = 0, reviveT = 0, prev = null, curPose = null, lastT = {dx:0, dy:0, rot:0, sc:1}, cur_t = 0, fade = 240;
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), add: o.add !== false, bk: !!o.back});
  const feet = () => ({x:world.x + W / 2 + XOFF, y:world.y + BASE});
  const hand = () => { const f = feet(); return {x:f.x + 44, y:f.y - 190}; };
  const baseP = () => mode === 'bers' ? BASE_POSE.bers : mode === 'tired' ? BASE_POSE.tired : BASE_POSE.n;

  function swing(k, style, side = 0, delay = 0){      // onda de corte: sai da espada e voa até o boss (devolve a duração do voo)
    style = style || ''; const sz = k === 3 ? 1.35 : k === 2 ? 1.1 : 1, h0 = hand(), b = T;
    const drop = style.includes('drop'), ground = style.includes('ground'), arc = style.includes('arc'), red = style.includes('red');
    const a = drop ? {x:T.x + rnd(-60, 60), y:T.y - 340} : h0;
    const dist = Math.hypot(b.x - a.x, b.y - a.y), d = drop ? 500 : 420 + dist * .35;
    const kk = side ? side * 60 : arc ? 140 : ground ? rnd(-1, 1) * 60 : rnd(-1, 1) * 16, lift = drop ? 0 : ground ? 4 : 28, pw = drop ? 2.1 : 1.5;
    const path = u => { const e = Math.pow(u, pw), w = Math.sin(Math.PI * u); return {x:lerp(a.x, b.x, e) + kk * w * (ground ? Math.sin(u * 9) : 1), y:lerp(a.y, b.y, e) - w * lift}; };
    const fd = u => u < .1 ? u / .1 : u > .92 ? (1 - u) / .08 : 1, col = red ? RED : BLUE;
    E('glow', d, u => { const p = path(u); return {x:p.x, y:p.y, r:(48 + 12 * Math.sin(u * 22)) * sz * (.6 + .5 * u), c:col, a:.7 * fd(u)}; }, {delay});
    E('streak', d, u => { const p = path(u), q = path(Math.min(1, u + .04)); return {x:p.x, y:p.y, ang:Math.atan2(q.y - p.y, q.x - p.x), len:(drop ? 170 : 130) * sz, th:24 * sz, c:red ? '255,110,90' : ICE, a:.8 * fd(u)}; }, {delay});
    if (!red) E('fx_slash', d, u => { const p = path(u), q = path(Math.min(1, u + .04)); return {x:p.x, y:p.y, s:(.75 + .5 * u) * sz, rot:Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2 + (side ? side * .25 : 0), a:fd(u)}; }, {delay});
    for (let i = 1; i <= 7; i++) { const ut = i / 8, p = path(ut); E('glow', 420, v => ({x:p.x, y:p.y + 8 * v, r:38 * sz * (1 - v * .6), c:col, a:.4 * (1 - v)}), {delay:delay + ut * d}); }
    return d + delay;
  }
  function swingHit(k, kind, style){
    let d; style = style || '';
    if (style.includes('twin')) { const st = style.replace('twin', ''); swing(k, st, -1); d = swing(k, st, 1, 170); } else d = swing(k, style);
    setTimeout(() => { hit(kind); fireHit(); }, d / (window.__ts == null ? 1 : window.__ts));
  }
  function hit(kind){
    const bl = (r, col, a, dl = 0, d = 650) => E('glow', d, u => ({...T, r:r * (.4 + eo(u) * .9), c:col, a:a * (1 - u) * (u < .08 ? u / .08 : 1)}), {delay:dl});
    const ring = (r, d, col, a, dl = 0) => E('ring', d, u => ({x:T.x, y:T.y + 50, r:lerp(r * .3, r, eo(u)), c:col, a:a * (1 - u)}), {delay:dl});
    const cut = (ang, len, col, a = .9, dl = 0, th = 20) => E('streak', 520, u => ({...T, ang, len:len * (.5 + eo(u) * .7), th, c:col, a:a * (1 - u) * (u < .1 ? u / .1 : 1)}), {delay:dl});
    const sparks = (n, sp, col, dl = 0) => { for (let i = 0; i < n; i++) { const an = rnd(0, 6.28), s = rnd(.5, 1) * sp; E('glow', 600, u => ({x:T.x + Math.cos(an) * s * eo(u), y:T.y + Math.sin(an) * s * eo(u) + 60 * u * u, r:14 * (1 - u * .6), c:col, a:.9 * (1 - u)}), {delay:dl + i * 14}); } };
    const rocks = (n, spread, up, big) => { for (let i = 0; i < n; i++) { const an = -Math.PI / 2 + rnd(-1.25, 1.25), sp = rnd(.5, 1) * spread, rr = FXS[i % FXS.length], rot = rnd(-6, 6);
      E('fx_' + rr, 900, u => ({x:T.x + Math.cos(an) * sp * u, y:T.y + Math.sin(an) * sp * u + 260 * u * u - up * Math.sin(Math.PI * Math.min(1, u * 1.1)), s:big ? 1.7 : 1.2, rot:rot * u, a:1 - seg(u, .7, 1)}), {delay:i * 15}); } };
    const spr = (n, s0, s1, dy, d, dl = 0, fl = 1) => E('fx_' + n, d, u => ({x:T.x, y:T.y + dy, s:lerp(s0, s1, eo(Math.min(1, u * 1.6))), a:u < .08 ? u / .08 : 1 - seg(u, .5, 1), flip:fl}), {delay:dl});
    if (kind === 'cutA') { bl(120, BLUE, .9); cut(-.7, 200, ICE); cut(.7, 200, BLUE, .9, 40); ring(90, 520, BLUE, .8); }
    else if (kind === 'cutB') { bl(130, ICE, .9); cut(-.95, 280, ICE, 1, 0, 26); sparks(9, 120, ICE); ring(100, 520, ICE, .7, 60); }
    else if (kind === 'cutC') { bl(110, BLUE, .9); ring(80, 480, BLUE, .9); ring(130, 620, ICE, .7, 90); sparks(12, 150, BLUE); }
    else if (kind === 'iceS') { bl(120, BLUE, .9); spr('ice', .7, 1.05, 70, 800); sparks(6, 100, ICE); ring(100, 520, BLUE, .7); }
    else if (kind === 'rockS') { bl(110, DUST, .8); rocks(5, 100, 70); ring(100, 520, DUST, .8); spr('rocksA', .5, .75, 70, 800); }
    else if (kind === 'redA') { bl(125, RED, .9); cut(-.7, 220, '255,120,100'); cut(.7, 220, RED, .9, 40); ring(95, 520, RED, .8); sparks(8, 110, RED); }
    else if (kind === 'redB') { bl(135, RED, .95); cut(-1.0, 300, '255,140,110', 1, 0, 28); sparks(12, 140, RED); ring(105, 520, RED, .8, 50); }
    else if (kind === 'redC') { bl(120, RED, .9); ring(85, 480, RED, .9); ring(135, 620, '255,140,110', .7, 90); sparks(14, 160, RED); cut(0, 240, RED, .8, 30); }
    else if (kind === 'bigIce') { bl(270, BLUE, 1, 0, 1000); bl(160, '255,255,255', .9, 0, 520); spr('ice', 1, 1.7, 100, 1100); rocks(8, 190, 120, true); ring(200, 800, BLUE, .9); ring(120, 600, ICE, .8, 110); shakeT = clk(); }
    else if (kind === 'bigRock') { bl(250, DUST, 1, 0, 950); bl(150, '255,255,255', .9, 0, 520); spr('rocksA', .8, 1.5, 90, 1100); rocks(10, 210, 130, true); ring(210, 800, DUST, .9); ring(120, 600, BLUE, .7, 100); shakeT = clk(); }
    else if (kind === 'bigCross') { bl(280, ICE, 1, 0, 1000); bl(160, '255,255,255', .9, 0, 520); cut(-.8, 380, ICE, 1, 0, 30); cut(.8, 380, BLUE, 1, 60, 30); cut(0, 340, '255,255,255', .9, 120, 24); sparks(14, 190, ICE); ring(200, 800, BLUE, .9); shakeT = clk(); }
    else if (kind === 'bigShock') { bl(260, BLUE, 1, 0, 1000); bl(150, '255,255,255', .8, 0, 520); ring(230, 900, BLUE, .9); ring(150, 700, ICE, .8, 110); ring(80, 520, '255,255,255', .7, 200); rocks(10, 190, 120, true); shakeT = clk(); }
    else if (kind === 'bigRed') { bl(280, RED, 1, 0, 1000); bl(160, '255,220,200', .9, 0, 520); cut(-.9, 360, '255,130,100', 1, 0, 28); cut(.9, 360, RED, 1, 60, 28); sparks(18, 200, RED); ring(210, 800, RED, .9); ring(120, 600, '255,140,110', .8, 100); shakeT = clk(); }
    else { bl(270, RED, 1, 0, 1000); bl(160, '255,220,200', .9, 0, 520); ring(230, 900, RED, .9); ring(150, 700, '255,140,110', .8, 110); ring(80, 520, '255,255,255', .7, 200); sparks(16, 190, RED); rocks(8, 180, 110, true); shakeT = clk(); }
  }
  const EV = {
    wind(k){ const f = feet(), cc = k === 'r' ? RED : DUST; for (let i = 0; i < 6; i++) { const an = rnd(0, 6.28); E('glow', 700, u => ({x:f.x + Math.cos(an) * 60 * eo(u), y:f.y - 10 + Math.sin(an) * 10, r:32 * (1 - u * .4), c:cc, a:.28 * Math.sin(Math.PI * u)}), {delay:i * 60}); }
      E('ring', 800, u => ({x:f.x, y:f.y - 4, r:lerp(40, 110, eo(u)), c:k === 'r' ? RED : BLUE, a:.5 * Math.sin(Math.PI * u)})); },
    cheer(k){ const f = feet(); if (k === 'rise') { E('glow', 1200, u => ({x:f.x, y:f.y - 140, r:lerp(60, 180, eo(u)), c:GOLD, a:.5 * Math.sin(Math.PI * u)}), {back:true}); return; }
      E('glow', 700, u => ({x:f.x, y:f.y - 150, r:lerp(40, 160, eo(u)), c:GOLD, a:.55 * (1 - u)})); E('ring', 800, u => ({x:f.x, y:f.y - 4, r:lerp(40, 120, eo(u)), c:GOLD, a:.6 * (1 - u)})); },
    rage(k){ const f = feet(), n = +k || 1;
      E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(50, 150 + 40 * n, eo(u)), c:RED, a:.85 * (1 - u)}));
      E('glow', 1300, u => ({x:f.x, y:f.y - 140, r:lerp(70, 200 + 30 * n, eo(u)), c:RED, a:.6 * Math.sin(Math.PI * u)}), {back:true});
      for (let i = 0; i < 8; i++) { const ox = rnd(-70, 70); E('glow', 900, u => ({x:f.x + ox, y:f.y - 20 - 260 * eo(u), r:16, c:'255,90,60', a:.8 * Math.sin(Math.PI * u)}), {delay:i * 70}); }
      if (n === 3) { E('glow', 900, u => ({x:f.x, y:f.y - 150, r:lerp(100, 340, eo(u)), c:'255,200,180', a:.7 * (1 - u)})); shakeT = clk(); } },
    shield(k){ const f = feet(), gold = /^g/.test(k || ''), cc = gold ? GOLD : BLUE, wide = /5|4|7/.test(k || '');
      E('glow', 1700, u => ({x:f.x, y:f.y - 130, r:wide ? 200 : 160, c:cc, a:.45 * Math.sin(Math.PI * u)}), {back:true});
      E('ring', 1500, u => ({x:f.x, y:f.y - 6, r:lerp(50, wide ? 140 : 115, eo(u)), c:cc, a:.7 * Math.sin(Math.PI * u)}));
      if (/2|4|6/.test(k || '')) E('ring', 1500, u => ({x:f.x, y:f.y - 6 - 60 * u, r:lerp(40, 100, eo(u)), c:gold ? '255,240,200' : ICE, a:.5 * Math.sin(Math.PI * u)}), {delay:260});
      for (let i = 0; i < 4; i++) { const an = i * 1.3; E('glow', 1000, u => ({x:f.x + Math.cos(an) * 70, y:f.y - 30 - 150 * u, r:15, c:cc, a:.7 * Math.sin(Math.PI * u)}), {delay:i * 170}); } },
    rune(k){ const f = feet(), n = +k || 1, cc = n === 1 || n === 4 ? BLUE : n === 2 ? GOLD : ICE;
      E('glow', 1500, u => ({x:f.x + 40, y:f.y - 170, r:lerp(60, 150, eo(u)), c:cc, a:.55 * Math.sin(Math.PI * u)}), {back:true});
      E('ring', 1300, u => ({x:f.x, y:f.y - 6, r:lerp(40, 125, eo(u)), c:cc, a:.7 * Math.sin(Math.PI * u)}));
      for (let i = 0; i < 6; i++) { const an = i * 1.05; E('glow', 900, u => ({x:f.x + 40 + Math.cos(an + u * 3) * 80 * (1 - u * .3), y:f.y - 170 + Math.sin(an + u * 3) * 50, r:12, c:cc, a:.8 * Math.sin(Math.PI * u)}), {delay:i * 80}); } },
    dust(k){ const f = feet(), dr = +k || 1; for (let i = 0; i < 8; i++) { E('glow', 700, u => ({x:f.x + dr * (30 + i * 14) * eo(u), y:f.y - 6 - 8 * u, r:26 * (1 - u * .4), c:DUST, a:.4 * Math.sin(Math.PI * u)}), {delay:i * 45}); } },
  };
  function runEv(e){ const [k, a, b, ...c2] = e.split(':'); if (k === 'swing') swingHit(+a, b || 'cutA', c2.join(':')); else if (k === 'hit') { hit(a); fireHit(); } else if (EV[k]) EV[k](a); }

  function poseAt(a, pe){
    const st = a.steps; let i = 0; while (i < st.length - 1 && pe >= st[i + 1][0]) i++;
    const A = st[i], B = st[Math.min(i + 1, st.length - 1)], u = A === B ? 1 : ease(clamp((pe - A[0]) / (B[0] - A[0])));
    const ta = A[2] || {}, tb = B[2] || {};
    return {pose:A[1], dx:lerp(ta.dx || 0, tb.dx || 0, u), dy:lerp(ta.dy || 0, tb.dy || 0, u), rot:lerp(ta.rot || 0, tb.rot || 0, u), sc:1};
  }
  function drawPose(name, dx, dy, rot, alpha, tm, tint, sc = 1, br0 = 1){
    const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return;
    const br = Math.sin(tm / 1000 * 2.0) * br0, fx = Px + W / 2 + XOFF + dx, fy = Py + BASE + dy;
    c.save(); c.globalAlpha = alpha; c.translate(fx, fy); c.rotate(rot * Math.PI / 180); c.scale(SZ * sc * (1 - .004 * br), SZ * sc * (1 + .008 * br));
    c.drawImage(im, -m.cx, -m.gy);
    if (tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,40,40,${tint})`; c.fillRect(-m.cx, -m.gy, m.w, m.h); }
    c.restore();
  }
  function frame(){
    if (!running) return; requestAnimationFrame(frame); const now = clk();
    if (document.hidden || now - last < 16) return; last = now;
    if (!M) return;
    const tm = now - t0; let st, a = cur && cur.a, pe = 0;
    if (deadTarget) { const k = clamp((now - deadT) / 1100); st = poseAt({steps:DEATH, dur:1100}, k); }
    else if (cur) {
      pe = (now - cur.start) / a.dur; st = poseAt(a, clamp(pe));
      const ev = a.ev || []; while (cur.fired < ev.length && pe >= ev[cur.fired][0]) runEv(ev[cur.fired++][1]);
      if (pe >= 1) { const d = cur; cur = null; d.done(); }
    } else if (reviveT) { const k = clamp((now - reviveT) / 1300); st = poseAt({steps:REVIVE, dur:1300}, k); if (k >= 1) reviveT = 0; }
    else st = {pose:baseP(), dx:0, dy:0, rot:0, sc:1};
    if (st.pose !== curPose) { prev = curPose ? {pose:curPose, dx:lastT.dx, dy:lastT.dy, rot:lastT.rot, sc:lastT.sc || 1} : null; curPose = st.pose; cur_t = now; fade = cur || deadTarget ? 110 : 240; }
    lastT = st;
    const f = clamp((now - cur_t) / fade);
    c.clearRect(0, 0, cw, ch); if (!deadTarget) { c.save(); c.translate(Px - host.P, Py - host.P + (BASE - 266)); host.shadow(c); c.restore(); } c.imageSmoothingEnabled = true;
    const tint = a && a.tint ? Math.sin(clamp(pe) * Math.PI) * .55 * (cur && cur.light ? .6 : 1) : 0;
    if (a && a.ghost) { const g = Math.sin(clamp(pe) * Math.PI), gd = a.gdir || 1; drawPose(st.pose, st.dx + 46 * g * gd, st.dy, st.rot, .18 * g, tm, 0, st.sc, 0); drawPose(st.pose, st.dx + 90 * g * gd, st.dy, st.rot, .10 * g, tm, 0, st.sc, 0); }
    if (prev && f < 1) drawPose(prev.pose, prev.dx, prev.dy, prev.rot, 1, tm, tint, prev.sc, deadTarget ? 0 : 1);
    drawPose(st.pose, st.dx, st.dy, st.rot, prev && f < 1 ? f : 1, tm, tint, st.sc || 1, deadTarget ? 0 : 1);
    fc.clearRect(0, 0, front.width, front.height);
    if (backUsed) { bc.clearRect(0, 0, back.width, back.height); backUsed = false; }
    if (mode === 'bers' && !deadTarget) { const ft = feet(); glow(bc, ft.x, ft.y - 120, 190 + 14 * Math.sin(tm / 260), RED, .28 + .08 * Math.sin(tm / 200)); backUsed = true; }
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), im = img[e.name], g = e.bk ? bc : fc; if (e.bk) backUsed = true;
      if (!s) return true;
      if (e.name === 'glow') { glow(g, s.x, s.y, s.r, s.c, s.a); return true; }
      if (e.name === 'streak') { streak(g, s.x, s.y, s.ang, s.len, s.th, s.c, s.a); return true; }
      if (e.name === 'ring') { g.save(); g.translate(s.x, s.y); g.scale(1, .3); g.globalCompositeOperation = 'lighter'; g.lineWidth = 10; g.strokeStyle = `rgba(${s.c},${clamp(s.a * .7)})`; g.shadowColor = `rgba(${s.c},.9)`; g.shadowBlur = 30; g.beginPath(); g.arc(0, 0, s.r, 0, 6.2832); g.stroke(); g.restore(); return true; }
      if (!ready(e.name)) return true;
      const w = im.naturalWidth * (s.s || 1), h = im.naturalHeight * (s.s || 1), bot = /^fx_(ice|rocksA)$/.test(e.name);
      g.save(); g.globalAlpha = clamp(s.a == null ? 1 : s.a); g.translate(s.x, s.y); if (s.rot) g.rotate(s.rot); FXSoft.draw(g, im, -w / 2, bot ? -h : -h / 2, w, h, 1); g.restore(); return true;
    });
    if (shakeT && now >= shakeT) { const u = (now - shakeT) / 450, g = host.shakeEl; if (g) g.style.transform = u < 1 ? `translate(${Math.sin(u * 60) * 1 * (1 - u)}px,${Math.cos(u * 50) * .8 * (1 - u)}px)` : ''; if (u >= 1) shakeT = 0; }
  }
  const run = (a, extra) => new Promise(res => { if (cur) cur.done(false); cur = {a, start: clk(), fired: 0, done: ok => res(ok !== false), ...extra}; });
  return {
    start(){ if (!running) { running = true; requestAnimationFrame(frame); } },
    play(name, o = {}){
      if (deadTarget) return Promise.resolve(false);
      if (name === 'cast') name = 'melee';
      const pool = mode === 'bers' && BACT[name] ? BACT[name] : ACT[name];
      const a = variant(pool); if (!a) return Promise.resolve(false); const p = run(a, {light:!!o.light}); p.then(fireHit); return p;
    },
    nextHit(){ return new Promise(r => hitW.push(r)); },
    idle(){ if (cur || deadTarget) return Promise.resolve(false); return run(variant(mode === 'bers' ? IDLES_B : mode === 'tired' ? IDLES_T : IDLES)); },
    has: n => !!ACT[n] || n === 'cast',
    setMode(m){ mode = m || null; },
    setDead(d){ if (d) { if (cur) cur.done(false); cur = null; reviveT = 0; deadTarget = 1; deadT = clk(); } else if (deadTarget) { deadTarget = 0; reviveT = clk(); } },
    reset(){ if (cur) { const d = cur; cur = null; d.done(false); } fxl = []; deadTarget = 0; reviveT = 0; mode = null; },
  };
}
window.KnightRig = {make};
})();
