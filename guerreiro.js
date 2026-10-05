/* Banco de Dados I — RPG · Guerreiro (v242)
   Poses de COSTAS recortadas das folhas G1-G7 (guerreiro4/*.png, tools/cut_guerreiro4.py): mesma escala, ancoradas pelos pés, borda fina.
   Habilidades: ataque normal (espada), ataque pesado (1,5x), passar a vez, defesa (escudo), esquiva, berserk (ult) + modo berserk e modo exausto.
   Cada uso sorteia uma variação diferente da anterior (sacola embaralhada). O dano só entra quando o golpe acerta (fireHit). */
(() => {
'use strict';
const T = {x:517, y:340};                 // ponto de impacto no boss
const BASE = 262, SZ = 1.03, XOFF = 0;
const BLUE = '120,180,255', ICE = '190,230,255', GOLD = '255,205,120', RED = '255,60,50', DUST = '230,205,170';
let _c = 0, _p = performance.now();
const clk = () => { const n = performance.now(); _c += (n - _p) * (window.__ts == null ? 1 : window.__ts); _p = n; return _c; };
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2, eo = u => 1 - Math.pow(1 - u, 3);
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const seg = (u, a, b) => clamp((u - a) / (b - a));
const S = (d, steps, ev = [], o = {}) => ({dur:d, steps, ev, ...o});
const FXS = ['rock1','rock2','rock3','rock4'], FXN = ['sl1','sl2','sl3','sl4','sl5','sl6','sl7','spk','bur','rng','dust','crk','fls','dome','str','rn2','rcol','rbase','rbolt','rring','rspk','rsl','rsmk','rfl'], FXK = FXN.concat(FXS);

// ---- animações (passos [t, pose, {dx,dy,rot,sc}], eventos [t, 'nome:arg']); '~' no fim do nome espelha a pose ----
// poses: i = ociosas, a = ataque, h = golpe pesado, s = defesa, e = esquiva/dano, b = berserk, x = ajoelhado, f = queda, v = vitória
const ACT = {
  // estilos da onda de corte (swing:k:tipo:estilo): slash (reto), drop (cai do alto), ground (rente ao chão), twin (dupla), arc (curva), red (berserk)
  melee:[
    S(2100, [[0,'i1'],[.1,'a1'],[.24,'a2'],[.36,'a3',{dx:6}],[.5,'a4',{dx:8}],[.72,'a8'],[.92,'i1']], [[.2,'wind'],[.34,'swing:1:cutA:slash']]),
    S(2300, [[0,'i2'],[.1,'a1'],[.26,'a5',{dy:-2}],[.38,'a3',{dx:4}],[.52,'a4',{dx:6}],[.74,'a8'],[.93,'i2']], [[.2,'wind'],[.36,'swing:1:cutB:drop']]),
    S(2300, [[0,'i1'],[.1,'a2'],[.26,'a3',{dx:-4}],[.4,'a4',{dx:8}],[.6,'a4',{dx:6}],[.78,'a8'],[.93,'i1']], [[.2,'wind'],[.38,'swing:1:cutC:arc']]),
    S(2500, [[0,'i2'],[.1,'a8'],[.24,'a2',{dx:-2}],[.36,'a7',{dx:8}],[.5,'a7',{dx:12}],[.72,'a7',{dx:6}],[.9,'i2']], [[.18,'wind'],[.3,'swing:1:cutA:slash:twin']]),
    S(2400, [[0,'i1'],[.1,'a1'],[.26,'a5',{dy:-2}],[.4,'a4',{dx:4}],[.6,'a3'],[.78,'a8'],[.93,'i1']], [[.2,'wind'],[.38,'swing:1:crashS:ground']]),
    S(2300, [[0,'i2'],[.12,'a6'],[.3,'a2',{dx:4}],[.46,'a3'],[.62,'a4',{dx:4}],[.8,'a8'],[.94,'i1']], [[.2,'wind'],[.34,'swing:1:cutC:slash'],[.5,'swing:1:cutB:arc']]),
    S(2500, [[0,'i1'],[.1,'a1'],[.26,'a5',{dy:-2}],[.4,'a7',{dy:-2}],[.56,'a4',{dx:4}],[.8,'a8'],[.94,'i1']], [[.2,'wind'],[.38,'swing:2:cutD:drop:twin']]),
  ],
  heavy:[   // pesado (1,5x): salta com a espada nas duas mãos → impacto
    S(3400, [[0,'i1'],[.08,'h1'],[.22,'h2',{dy:-2}],[.34,'h3',{dy:-10}],[.42,'h4',{dy:-8}],[.52,'h5'],[.62,'h6'],[.72,'i6'],[.86,'h8'],[.95,'i1']], [[.16,'wind'],[.32,'wind'],[.5,'swing:3:bigX:drop']]),
    S(3200, [[0,'i2'],[.1,'h1'],[.26,'h2'],[.4,'h4',{dy:-10}],[.5,'h5'],[.64,'h6'],[.8,'h8'],[.94,'i2']], [[.16,'wind'],[.34,'wind'],[.48,'swing:3:bigCrash:drop']]),
    S(3400, [[0,'i1'],[.1,'h1'],[.24,'h2'],[.38,'h3',{dy:-14}],[.48,'h5',{dy:2}],[.62,'h6'],[.78,'i6'],[.9,'h8'],[.97,'i1']], [[.16,'wind'],[.34,'wind'],[.48,'swing:3:bigShock:ground']]),
    S(3200, [[0,'i2'],[.1,'a1'],[.28,'h2',{dy:-3}],[.44,'h5',{dy:1}],[.66,'h6'],[.8,'h8'],[.94,'i1']], [[.18,'wind'],[.34,'wind'],[.46,'swing:3:bigX:slash:twin']]),
    S(3500, [[0,'i1'],[.08,'h1'],[.24,'h2'],[.38,'h4',{dy:-10}],[.5,'h5'],[.62,'h6'],[.8,'i6'],[.94,'h8']], [[.16,'wind'],[.34,'wind'],[.5,'swing:3:bigCrash:ground']]),
  ],
  guard:[   // defesa com escudo (cada uma com barreira/brilho diferente)
    S(1900, [[0,'i1'],[.14,'s1'],[.88,'s1'],[.98,'i1']], [[.26,'shield:b1']]),
    S(1900, [[0,'i2'],[.12,'s3'],[.3,'s4'],[.44,'s3'],[.88,'s3'],[.98,'i2']], [[.26,'shield:b2']]),
    S(2000, [[0,'i1'],[.12,'s1'],[.3,'s4'],[.5,'s5'],[.88,'s5'],[.98,'i1']], [[.26,'shield:g3']]),
    S(2000, [[0,'i2'],[.12,'s3'],[.3,'s8'],[.5,'s1'],[.88,'s1'],[.98,'i2']], [[.26,'shield:b4']]),
    S(2000, [[0,'i1'],[.12,'s3'],[.3,'s3',{dx:-3}],[.5,'s4'],[.88,'s4'],[.98,'i1']], [[.26,'shield:g5']]),
  ],
  dodge:[   // esquiva: inclina, salta de lado, rola e pousa, com rastro
    S(1300, [[0,'i1'],[.1,'e1',{dx:-8}],[.28,'e2',{dx:-48}],[.5,'e3',{dx:-66}],[.72,'e4',{dx:-40}],[.88,'i1',{dx:-8}],[.98,'i1']], [[.28,'dust:-1']], {ghost:true}),
    S(1350, [[0,'i2'],[.1,'e1~',{dx:8}],[.26,'e2~',{dx:44}],[.46,'e3',{dx:64}],[.66,'e4~',{dx:50}],[.86,'i2',{dx:10}],[.98,'i2']], [[.26,'dust:1']], {ghost:true, gdir:-1}),
    S(1300, [[0,'i1'],[.1,'e5',{dx:-6}],[.28,'e3',{dx:-46}],[.5,'e4',{dx:-60}],[.72,'e5',{dx:-30}],[.88,'i1'],[.98,'i1']], [[.28,'dust:-1']], {ghost:true}),
    S(1250, [[0,'i2'],[.1,'e5~',{dx:6}],[.28,'e2~',{dx:52,dy:-4}],[.5,'e4~',{dx:66,dy:-2}],[.72,'e5~',{dx:36}],[.88,'i2'],[.98,'i2']], [[.26,'dust:1']], {ghost:true, gdir:-1}),
    S(1350, [[0,'i2'],[.1,'e1'],[.28,'e5',{dx:-40}],[.5,'e2',{dx:-62,dy:-4}],[.74,'e4',{dx:-36}],[.9,'i2']], [[.28,'dust:-1']], {ghost:true}),
  ],
  pass:[    // passar a vez: baixa a guarda e aponta para o aliado (runas / cruz)
    S(2200, [[0,'i1'],[.14,'s6'],[.3,'s7'],[.82,'s7'],[.97,'i1']], [[.28,'rune:1']]),
    S(2200, [[0,'i2'],[.14,'i8'],[.3,'i8'],[.82,'i8'],[.97,'i2']], [[.28,'rune:2']]),
    S(2300, [[0,'i1'],[.14,'s7'],[.3,'s6',{dy:-2}],[.84,'s6'],[.97,'i1']], [[.28,'rune:3']]),
    S(2300, [[0,'i2'],[.14,'s6'],[.3,'i6'],[.46,'i6'],[.84,'i6'],[.97,'i2']], [[.28,'rune:4'],[.46,'rune:1']]),
    S(2300, [[0,'i1'],[.14,'i7'],[.3,'i7'],[.5,'i8'],[.84,'i8'],[.97,'i1']], [[.26,'rune:5'],[.5,'rune:3']]),
  ],
  hurt:[
    S(850, [[0,'i1'],[.1,'e6',{dx:-8,rot:-3}],[.34,'e6',{dx:3}],[.62,'e7'],[.92,'i1']], [], {tint:true}),
    S(900, [[0,'i2'],[.1,'e6',{dx:-6,dy:2}],[.36,'e6',{dx:2}],[.66,'e7'],[.92,'i2']], [], {tint:true}),
    S(900, [[0,'i1'],[.1,'e7',{dx:-8,rot:-4}],[.36,'e7',{dx:3}],[.64,'e8'],[.92,'i1']], [], {tint:true}),
    S(850, [[0,'i2'],[.1,'e6',{dx:-6,dy:2}],[.36,'e7',{dx:2}],[.64,'e8'],[.92,'i2']], [], {tint:true}),
    S(900, [[0,'i1'],[.1,'e6',{dx:-8,rot:-3}],[.36,'e6',{dx:3}],[.64,'e8'],[.92,'i1']], [], {tint:true}),
  ],
  victory:[
    S(3000, [[0,'i1'],[.12,'v1'],[.3,'v1',{dy:-2}],[.5,'v1',{dy:-4}],[.8,'v1',{dy:-2}],[.96,'i1']], [[.3,'cheer'],[.52,'cheer:rise'],[.8,'cheer']]),
    S(3200, [[0,'i2'],[.14,'v2'],[.34,'v2',{dy:-3}],[.6,'v2',{dy:-5}],[.82,'v2',{dy:-3}],[.96,'i1']], [[.36,'cheer:rise'],[.6,'cheer'],[.82,'cheer:rise']]),
    S(3200, [[0,'i1'],[.14,'v3'],[.4,'v3'],[.7,'v3'],[.96,'i1']], [[.4,'cheer'],[.6,'cheer:rise'],[.84,'cheer']]),
    S(3000, [[0,'i2'],[.12,'v1'],[.3,'v2'],[.5,'v1'],[.7,'v2'],[.96,'i1']], [[.3,'cheer'],[.52,'cheer:rise'],[.74,'cheer']]),
  ],
  ult:[     // berserk: aura vermelha, rugido e explosão de energia
    S(3600, [[0,'i1'],[.1,'b1'],[.26,'b2'],[.4,'b2',{dy:-2}],[.56,'b3'],[.74,'b4'],[.94,'b4']], [[.12,'wind'],[.3,'rage:1'],[.5,'rage:2'],[.68,'rage:3']]),
    S(3800, [[0,'i2'],[.1,'b1'],[.26,'b2'],[.44,'b3',{dy:-2}],[.62,'b4'],[.84,'b8'],[.96,'b4']], [[.12,'wind'],[.28,'rage:2'],[.48,'rage:1'],[.7,'rage:3']]),
    S(3800, [[0,'i1'],[.1,'b1'],[.3,'b2',{dy:-2}],[.5,'b3'],[.7,'b4'],[.94,'b8']], [[.12,'wind'],[.3,'rage:1'],[.5,'rage:2'],[.7,'rage:3']]),
  ],
};
// modo BERSERK: golpes vermelhos (as poses já trazem a aura)
const BACT = {
  melee:[
    S(2000, [[0,'b4'],[.1,'b8'],[.26,'b5',{dx:-4}],[.4,'b5',{dx:6}],[.6,'b4'],[.78,'b4']], [[.2,'wind:r'],[.36,'swing:1:redA:slash:red']]),
    S(2100, [[0,'b4'],[.1,'b8'],[.26,'b6'],[.42,'b6',{dx:6}],[.62,'b4']], [[.2,'wind:r'],[.38,'swing:1:redB:drop:red']]),
    S(2100, [[0,'b4'],[.1,'b3'],[.26,'b7',{dx:-2}],[.4,'b7',{dx:6}],[.62,'b4']], [[.2,'wind:r'],[.36,'swing:1:redC:arc:red']]),
    S(2300, [[0,'b4'],[.12,'b8'],[.24,'b5',{dx:-3}],[.36,'b6',{dx:6}],[.52,'b7',{dx:8}],[.74,'b4']], [[.18,'wind:r'],[.32,'swing:1:redA:slash:red:twin']]),
  ],
  heavy:[
    S(3200, [[0,'b4'],[.1,'b8'],[.28,'b3',{dy:-3}],[.42,'b5',{dx:4}],[.62,'b6'],[.84,'b4']], [[.16,'wind:r'],[.32,'wind:r'],[.42,'swing:3:bigRed:drop:red']]),
    S(3400, [[0,'b4'],[.1,'b1'],[.3,'b2',{dy:-3}],[.46,'b7',{dy:1}],[.66,'b7'],[.86,'b4']], [[.16,'wind:r'],[.34,'wind:r'],[.44,'swing:3:bigRedB:ground:red']]),
    S(3400, [[0,'b4'],[.1,'b8'],[.28,'b6',{dy:-2}],[.46,'b5',{dy:2}],[.66,'b5'],[.84,'b4']], [[.16,'wind:r'],[.34,'wind:r'],[.46,'swing:3:bigRed:slash:red:twin']]),
  ],
};
const IDLES = [
  S(4200, [[0,'i1'],[.25,'i2'],[.55,'i2'],[.8,'i1'],[.98,'i1']]),
  S(3600, [[0,'i1'],[.25,'i3'],[.55,'i3'],[.8,'i1'],[.98,'i1']]),
  S(3600, [[0,'i1'],[.25,'i4'],[.55,'i4'],[.8,'i1'],[.98,'i1']]),
  S(3800, [[0,'i1'],[.25,'i5'],[.7,'i5'],[.9,'i1'],[.98,'i1']]),
  S(3200, [[0,'i1'],[.3,'i6'],[.75,'i6'],[.98,'i1']]),
  S(3600, [[0,'i1'],[.25,'i7'],[.7,'i7'],[.9,'i1'],[.98,'i1']]),
  S(3600, [[0,'i1'],[.25,'i8'],[.7,'i8'],[.9,'i1'],[.98,'i1']]),
];
IDLES.forEach(a => { a.dur = Math.round(a.dur * 1.5); });
const IDLES_B = [   // respira dentro da aura do berserk
  S(3200, [[0,'b4'],[.3,'b8'],[.65,'b1'],[.9,'b4'],[.98,'b4']]),
  S(3000, [[0,'b4'],[.3,'b8'],[.7,'b3'],[.92,'b4'],[.98,'b4']]),
];
const IDLES_T = [   // exausto: ofegante
  S(3200, [[0,'i6'],[.4,'e7'],[.75,'i6'],[.98,'i6']]),
  S(3200, [[0,'e7'],[.4,'x1'],[.75,'e7'],[.98,'e7']]),
];
const BASE_POSE = {n:'i1', bers:'b4', tired:'i6'};
const bags = new WeakMap();
const variant = v => { if (!Array.isArray(v)) return v; if (window.__vi != null) return v[window.__vi % v.length]; let b = bags.get(v); if (!b || !b.l.length) { const l = v.map((_, i) => i); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } if (b && l.length > 1 && l[0] === b.last) [l[0], l[l.length - 1]] = [l[l.length - 1], l[0]]; b = {l, last:b ? b.last : -1}; bags.set(v, b); } const i = b.l.shift(); b.last = i; return v[i]; };
const DEATH = [[0,'e6'],[.22,'e7'],[.46,'e8'],[.7,'x1'],[.86,'f1'],[.95,'f2']];     // cai aos poucos: cambaleia → agacha → ajoelha → tomba
const REVIVE = [[0,'f2'],[.18,'f1'],[.38,'x1'],[.6,'e8'],[.78,'e7'],[.92,'e6'],[.99,'i1']];   // levanta na ordem inversa
const POSES = (() => { const s = new Set(); const add = a => (a.steps || a).forEach(p => s.add(p[1].replace('~', '')));
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
  let backUsed = false, bodyDX = 0;
  const cw = cv.width, ch = cv.height;
  let M = null; const img = {};
  const load = (k, src) => img[k] || (img[k] = Object.assign(new Image(), {src}));
  fetch('guerreiro4/meta.json').then(r => r.json()).then(j => { M = j; POSES.forEach(n => load(n, `guerreiro4/${n}.png`)); FXK.forEach(n => load('fx_' + n, `guerreiro4/fx_${n}.png`)); }).catch(() => {});
  let hitW = []; const fireHit = () => { hitW.splice(0).forEach(f => f()); };
  let fxl = [], cur = null, shakeT = 0, last = 0, t0 = clk(), running = false, mode = null;
  let deadTarget = 0, deadT = 0, reviveT = 0, prev = null, curPose = null, lastT = {dx:0, dy:0, rot:0, sc:1}, cur_t = 0, fade = 240;
  const ready = n => img[n] && img[n].complete && img[n].naturalWidth;
  const E = (name, d, f, o = {}) => fxl.push({name, d, f, t0: clk() + (o.delay || 0), add: o.add !== false, bk: !!o.back, bot: !!o.bot});
  const pick = a => a[Math.floor(Math.random() * a.length)];
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
    { const WV = red ? ['rsl'] : drop ? ['sl2', 'sl6'] : arc ? ['sl3', 'sl7'] : ground ? ['sl1', 'sl5'] : ['sl1', 'sl4', 'sl7'], wv = pick(WV);
      for (let g = 0; g < (k === 1 ? 1 : 2); g++) E('fx_' + wv, d, u => { const uu = Math.max(0, u - g * .06), p = path(uu), q = path(Math.min(1, uu + .04)); return {x:p.x, y:p.y, s:sz * (.5 + .4 * Math.sin(Math.min(1, uu * 1.3) * 1.57)) * (1 - g * .18), rot:Math.atan2(q.y - p.y, q.x - p.x) + (drop && wv !== 'sl2' ? 0 : 0), a:fd(u) * (.9 - g * .4)}; }, {delay}); }
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
    const SP = (n, s0, s1, dy, d, dl = 0, a0 = 1, rot = 0) => E('fx_' + n, d, u => ({x:T.x, y:T.y + dy, s:lerp(s0, s1, eo(Math.min(1, u * 1.6))), rot, a:a0 * (u < .08 ? u / .08 : 1 - seg(u, .5, 1))}), {delay:dl});
    const SOL = (n, s0, s1, dy, d, dl = 0) => E('fx_' + n, d, u => ({x:T.x, y:T.y + dy, s:lerp(s0, s1, eo(Math.min(1, u * 1.6))), a:u < .08 ? u / .08 : 1 - seg(u, .55, 1)}), {delay:dl, add:false});
    if (kind === 'cutA') { bl(120, BLUE, .9); SP('sl5', .35, .6, 0, 520); cut(-.7, 200, ICE); ring(90, 520, BLUE, .8); sparks(6, 110, ICE); }
    else if (kind === 'cutB') { bl(130, ICE, .9); SP('sl2', .5, .8, 0, 560); SP('spk', .4, .7, 10, 650, 40); sparks(8, 120, ICE); ring(100, 520, ICE, .7, 60); }
    else if (kind === 'cutC') { bl(110, BLUE, .9); SP('rng', .3, .6, 50, 650); ring(80, 480, BLUE, .9); ring(130, 620, ICE, .7, 90); sparks(10, 150, BLUE); }
    else if (kind === 'cutD') { bl(120, BLUE, .9); SP('sl5', .4, .7, 0, 560); SP('str', .5, .85, 0, 800); sparks(8, 120, GOLD); ring(100, 520, BLUE, .7); }
    else if (kind === 'crashS') { bl(110, DUST, .8); SOL('dust', .3, .55, 50, 800); rocks(4, 100, 70); ring(100, 520, DUST, .8); }
    else if (kind === 'redA') { bl(125, RED, .9); SP('rsl', .4, .65, 0, 560); cut(.7, 220, RED, .9, 40); ring(95, 520, RED, .8); sparks(8, 110, RED); }
    else if (kind === 'redB') { bl(135, RED, .95); SP('rbolt', .4, .75, 0, 650); sparks(12, 140, RED); ring(105, 520, RED, .8, 50); }
    else if (kind === 'redC') { bl(120, RED, .9); SP('rspk', .5, .8, 0, 700); ring(85, 480, RED, .9); ring(135, 620, '255,140,110', .7, 90); sparks(10, 160, RED); }
    else if (kind === 'bigX') { bl(270, BLUE, 1, 0, 1000); bl(160, '255,255,255', .9, 0, 520); SP('sl5', .6, 1.15, 0, 700); SP('bur', .45, 1, 20, 900); SP('rng', .4, .9, 50, 900, 80); sparks(14, 190, ICE); ring(200, 800, BLUE, .9); ring(120, 600, ICE, .8, 110); shakeT = clk(); }
    else if (kind === 'bigCrash') { bl(250, DUST, 1, 0, 950); bl(150, '255,255,255', .9, 0, 520); SOL('dust', .55, 1.1, 70, 1000); SP('crk', .5, 1.1, 60, 1000, 60); rocks(8, 210, 130, true); ring(210, 800, DUST, .9); ring(120, 600, GOLD, .7, 100); shakeT = clk(); }
    else if (kind === 'bigShock') { bl(260, BLUE, 1, 0, 1000); bl(150, '255,255,255', .8, 0, 520); SP('rn2', .5, 1.1, 50, 900); SP('rng', .35, .9, 50, 900, 110); SP('fls', .5, 1, 0, 600); ring(230, 900, BLUE, .9); ring(150, 700, ICE, .8, 110); rocks(8, 190, 120, true); shakeT = clk(); }
    else if (kind === 'bigRed') { bl(280, RED, 1, 0, 1000); bl(160, '255,220,200', .9, 0, 520); SP('rfl', .7, 1.3, 0, 800); SP('rbolt', .6, 1.1, 0, 800, 60); SP('rspk', .6, 1.1, 0, 900, 120); sparks(16, 200, RED); ring(210, 800, RED, .9); ring(120, 600, '255,140,110', .8, 100); shakeT = clk(); }
    else { bl(270, RED, 1, 0, 1000); bl(160, '255,220,200', .9, 0, 520); SP('rring', .5, 1, 50, 900); SP('rbase', .6, 1.1, 60, 900, 60); SP('rsmk', .6, 1, -40, 1000, 100); ring(230, 900, RED, .9); ring(150, 700, '255,140,110', .8, 110); sparks(14, 190, RED); rocks(6, 180, 110, true); shakeT = clk(); }
  }
  const EV = {
    wind(k){ const f = feet(), cc = k === 'r' ? RED : DUST; for (let i = 0; i < 6; i++) { const an = rnd(0, 6.28); E('glow', 700, u => ({x:f.x + Math.cos(an) * 60 * eo(u), y:f.y - 10 + Math.sin(an) * 10, r:32 * (1 - u * .4), c:cc, a:.28 * Math.sin(Math.PI * u)}), {delay:i * 60}); }
      E('ring', 800, u => ({x:f.x, y:f.y - 4, r:lerp(40, 110, eo(u)), c:k === 'r' ? RED : BLUE, a:.5 * Math.sin(Math.PI * u)}));
      if (k === 'r') E('fx_rring', 800, u => ({x:f.x, y:f.y - 2, s:lerp(.25, .45, eo(u)), a:.45 * Math.sin(Math.PI * u)})); },
    cheer(k){ const f = feet(); if (k === 'rise') { E('glow', 1200, u => ({x:f.x, y:f.y - 140, r:lerp(60, 180, eo(u)), c:GOLD, a:.5 * Math.sin(Math.PI * u)}), {back:true}); return; }
      E('fx_str', 900, u => ({x:f.x, y:f.y - 170, s:lerp(.4, .8, eo(u)), a:.8 * Math.sin(Math.PI * u)})); E('glow', 700, u => ({x:f.x, y:f.y - 150, r:lerp(40, 160, eo(u)), c:GOLD, a:.55 * (1 - u)})); E('ring', 800, u => ({x:f.x, y:f.y - 4, r:lerp(40, 120, eo(u)), c:GOLD, a:.6 * (1 - u)})); },
    rage(k){ const f = feet(), n = +k || 1;
      E('ring', 1100, u => ({x:f.x, y:f.y - 6, r:lerp(50, 150 + 40 * n, eo(u)), c:RED, a:.85 * (1 - u)}));
      E('fx_rcol', 1300, u => ({x:f.x, y:f.y - 90 - 20 * u, s:lerp(.45, .75 + .08 * n, eo(Math.min(1, u * 1.4))), a:.6 * Math.sin(Math.PI * u)}));
      E('fx_rbase', 1200, u => ({x:f.x, y:f.y - 14, s:lerp(.3, .55 + .06 * n, eo(u)), a:.6 * Math.sin(Math.PI * u)}));
      E('glow', 1300, u => ({x:f.x, y:f.y - 140, r:lerp(70, 200 + 30 * n, eo(u)), c:RED, a:.6 * Math.sin(Math.PI * u)}), {back:true});
      for (let i = 0; i < 8; i++) { const ox = rnd(-70, 70); E('glow', 900, u => ({x:f.x + ox, y:f.y - 20 - 260 * eo(u), r:16, c:'255,90,60', a:.8 * Math.sin(Math.PI * u)}), {delay:i * 70}); }
      if (n === 3) { E('glow', 900, u => ({x:f.x, y:f.y - 150, r:lerp(100, 340, eo(u)), c:'255,200,180', a:.7 * (1 - u)})); E('fx_rfl', 900, u => ({x:f.x, y:f.y - 140, s:lerp(.5, 1.6, eo(u)), a:.8 * (1 - u)})); E('fx_rspk', 1100, u => ({x:f.x, y:f.y - 150, s:lerp(.6, 1.4, eo(u)), a:.8 * (1 - u)})); shakeT = clk(); } },
    shield(k){ const f = feet(), gold = /^g/.test(k || ''), cc = gold ? GOLD : BLUE, wide = /5|4|7/.test(k || '');
      E('glow', 1700, u => ({x:f.x, y:f.y - 130, r:wide ? 200 : 160, c:cc, a:.45 * Math.sin(Math.PI * u)}), {back:true});
      if (gold) { E('fx_rn2', 1500, u => ({x:f.x, y:f.y - 4, s:lerp(.25, wide ? .5 : .42, eo(u)), a:.7 * Math.sin(Math.PI * u)})); E('fx_fls', 700, u => ({x:f.x - 50, y:f.y - 130, s:lerp(.22, .45, eo(Math.min(1, u * 1.5))), a:.9 * (1 - u)}), {delay:200}); }
      else { [1, -1].forEach(fy => E('fx_dome', 1600, u => ({x:feet().x + bodyDX, y:f.y - 126, fy, sy:.78, cr:.84, s:lerp(.75, wide ? 1.5 : 1.3, eo(Math.min(1, u * 1.6))), a:.7 * Math.sin(Math.PI * u)}), {bot:true, back:true})); E('fx_fls', 700, u => ({x:f.x - 50, y:f.y - 130, s:lerp(.22, .45, eo(Math.min(1, u * 1.5))), a:.9 * (1 - u)}), {delay:200}); }
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
  const CEN = {};  // centro de massa horizontal (px do sprite) de cada pose: a cupula centra no corpo, nao nos pes
  function centroid(name, im){
    if (CEN[name] != null) return CEN[name];
    const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, cv.width, cv.height).data, col = new Array(cv.width).fill(0); let n = 0;
    for (let j = 0; j < cv.height; j++) for (let i = 0; i < cv.width; i++) if (d[(j * cv.width + i) * 4 + 3] > 100) { col[i]++; n++; }
    let acc = 0, med = M.poses[name].cx; for (let i = 0; i < col.length; i++) { acc += col[i]; if (acc >= n / 2) { med = i; break; } }   // mediana: espada/escudo esticados nao puxam o centro
    return CEN[name] = med;
  }
  function drawPose(name, dx, dy, rot, alpha, tm, tint, sc = 1, br0 = 1){
    const fl = name.endsWith('~'); if (fl) name = name.slice(0, -1);
    const m = M.poses[name], im = img[name]; if (!m || !ready(name)) return;
    const br = Math.sin(tm / 1000 * 2.0) * br0, fx = Px + W / 2 + XOFF + dx, fy = Py + BASE + dy;
    c.save(); c.globalAlpha = alpha; c.translate(fx, fy); c.rotate(rot * Math.PI / 180); c.scale((fl ? -1 : 1) * SZ * sc * (1 - .004 * br), SZ * sc * (1 + .008 * br));
    if (br0 && alpha >= .99) bodyDX = dx + (centroid(name, im) - m.cx) * SZ * sc * (fl ? -1 : 1);
    c.drawImage(im, -m.cx, -m.gy);
    if (tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,40,40,${tint})`; c.fillRect(-m.cx, -m.gy, m.w, m.h); }
    c.restore();
  }
  // anel no chao em perspectiva: meio arco de tras na camada de tras (as pernas cobrem), meio arco da frente na camada da frente
  const drawRing = s => { backUsed = true; [[bc, 3.1416, 6.2832], [fc, 0, 3.1416]].forEach(([g, a0, a1]) => { g.save(); g.translate(s.x, s.y); g.scale(1, .3); g.globalCompositeOperation = 'lighter'; g.lineWidth = 10; g.strokeStyle = `rgba(${s.c},${clamp(s.a * .7)})`; g.shadowColor = `rgba(${s.c},.9)`; g.shadowBlur = 30; g.beginPath(); g.arc(0, 0, s.r, a0, a1); g.stroke(); g.restore(); }); };
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
    if (mode === 'bers' && !deadTarget) { const ft = feet(); glow(bc, ft.x, ft.y - 120, 190 + 14 * Math.sin(tm / 260), RED, .28 + .08 * Math.sin(tm / 200)); backUsed = true;
      const fb = img.fx_rbase; if (ready('fx_rbase')) { const sc2 = .4 + .03 * Math.sin(tm / 180), w2 = fb.naturalWidth * sc2, h2 = fb.naturalHeight * sc2; bc.save(); bc.globalAlpha = .4 + .12 * Math.sin(tm / 150); FXSoft.draw(bc, fb, ft.x - w2 / 2, ft.y - h2 + 10, w2, h2, 1); bc.restore(); } }
    fxl = fxl.filter(e => {
      const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false;
      const s = e.f(u), im = img[e.name], g = e.bk ? bc : fc; if (e.bk) backUsed = true;
      if (!s) return true;
      if (e.name === 'glow') { glow(g, s.x, s.y, s.r, s.c, s.a); return true; }
      if (e.name === 'streak') { streak(g, s.x, s.y, s.ang, s.len, s.th, s.c, s.a); return true; }
      if (e.name === 'ring') { drawRing(s); return true; }
      if (!ready(e.name)) return true;
      const cr = s.cr || 1, w = im.naturalWidth * (s.s || 1), h = im.naturalHeight * cr * (s.s || 1) * (s.sy || 1), bot = !!e.bot;
      g.save(); g.globalAlpha = clamp(s.a == null ? 1 : s.a); g.translate(s.x, s.y); if (s.fy) g.scale(1, s.fy); if (s.rot) g.rotate(s.rot);
      if (cr < 1) { g.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight * cr, -w / 2, bot ? -h : -h / 2, w, h); } else if (e.add === false) { g.imageSmoothingEnabled = false; g.drawImage(im, -w / 2, bot ? -h : -h / 2, w, h); } else FXSoft.draw(g, im, -w / 2, bot ? -h : -h / 2, w, h, 1);
      g.restore(); return true;
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
window.GuerreiroRig = {make};
})();
