/* Banco de Dados I — RPG · animações, falas e sons
   Camadas recortadas do fundo (spr_*.webp) animadas por Web Animations; sons 8-bit sintetizados (WebAudio).
   API: Anim.play(quem, nome, opts) · Anim.say / sayRandom · Anim.sfx(nome) · Anim.setDead / setAura · Anim.reset()
   quem: mage | knight | tank | assassin | boss.
   Para trocar por sprite sheets desenhados: Anim.useSheet('knight','melee',{src:'knight_melee.webp', frames:6, fps:12}) (ver README). */
(() => {
'use strict';
const META = {"mage":{"x":13,"y":805,"w":243,"h":235},"knight":{"x":255,"y":811,"w":236,"h":229},"tank":{"x":514,"y":810,"w":236,"h":230},"assassin":{"x":799,"y":809,"w":187,"h":231},"boss":{"x":44,"y":95,"w":946,"h":601}};
const HEROES = ['mage','knight','tank','assassin'];
const WHO = [...HEROES, 'boss'];
const COLOR = {mage:'#4d8dff', knight:'#d9e6ff', tank:'#ff9d3d', assassin:'#ffd86b', boss:'#ff2d4d'};
const NAME = {mage:'Maga', knight:'Guerreiro', tank:'Tanque', assassin:'Clériga', boss:'Lorde das Trevas'};
// pontos de efeito (coordenadas do jogo 1024x1536)
const PT = {
  mage:{orb:[228,838], front:[170,900]}, knight:{blade:[466,905], front:[420,900]},
  tank:{hammer:[765,975], front:[640,900]}, assassin:{staff:[948,835], front:[880,900]},
  boss:{eyes:[470,205], sword:[150,560], claw:[790,500], chest:[512,305], center:[512,380]}
};
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const X = x => x / 1024 * 100, Y = y => y / 1536 * 100;

// ===== Sons 8-bit =====
let ac = null, muted = false, unlocked = false;
try { muted = localStorage.getItem('bd1_mute') === '1'; } catch {}
function ctx(){ if (!unlocked) return null; if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; }
function tone(f, d, type = 'square', vol = .07, slide = 0, delay = 0){
  const c = ctx(); if (!c || muted) return; const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02);
}
function noise(d, vol = .08, f = 1800, type = 'lowpass', slide = 0, delay = 0){
  const c = ctx(); if (!c || muted) return; const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * d)), c.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = buf; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t);
  if (slide) fl.frequency.exponentialRampToValueAtTime(Math.max(60, f + slide), t + d);
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl).connect(g).connect(c.destination); s.start(t);
}
const SFX = {
  slash(){ noise(.16, .09, 3500, 'bandpass', -2500); tone(520, .1, 'sawtooth', .04, -300); },
  heavy(){ noise(.3, .13, 900, 'lowpass', -600); tone(140, .3, 'square', .1, -90); tone(70, .35, 'triangle', .12, -30, .05); },
  cast(){ [440, 587, 784, 988].forEach((f, i) => tone(f, .13, 'square', .045, 0, i * .05)); noise(.25, .03, 5000, 'highpass'); },
  holy(){ [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .22, 'triangle', .06, 0, i * .06)); },
  shield(){ tone(220, .12, 'square', .08, 60); tone(330, .2, 'triangle', .07, 0, .05); noise(.08, .05, 2500, 'bandpass'); },
  dodge(){ noise(.28, .07, 800, 'bandpass', 3500); },
  hurt(){ tone(300, .2, 'sawtooth', .08, -220); noise(.12, .07, 1500); },
  bossAtk(){ tone(90, .5, 'sawtooth', .1, -40); tone(60, .6, 'square', .08, -20, .1); noise(.5, .08, 600, 'lowpass', 400); },
  bossRoar(){ for (let i = 0; i < 4; i++) tone(80 + i * 6, .25, 'sawtooth', .09, -25, i * .16); noise(.8, .07, 500, 'lowpass', 300); },
  bossHurt(){ tone(180, .22, 'sawtooth', .07, -110); noise(.1, .06, 1200); },
  aoe(){ tone(120, .7, 'sawtooth', .09, 260); noise(.7, .07, 400, 'lowpass', 2500); },
  heal(){ [392, 494, 587, 784].forEach((f, i) => tone(f, .16, 'triangle', .06, 0, i * .07)); },
  ult(){ tone(200, .6, 'square', .07, 900); tone(400, .6, 'sawtooth', .04, 1200, .05); },
  die(){ tone(300, .6, 'sawtooth', .08, -250); },
  bossDie(){ for (let i = 0; i < 5; i++) tone(200 - i * 25, .4, 'sawtooth', .09, -80, i * .2); noise(1.2, .09, 700, 'lowpass', -400); },
  win(){ [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .18, 'square', .06, 0, i * .12)); },
  lose(){ [392, 330, 262, 196].forEach((f, i) => tone(f, .35, 'triangle', .08, 0, i * .25)); },
  right(){ tone(660, .1, 'square', .05); tone(880, .16, 'square', .05, 0, .09); },
  wrong(){ tone(220, .18, 'square', .05, -60); tone(165, .24, 'square', .05, -40, .12); }
};
const sfx = n => { try { SFX[n] && SFX[n](); } catch {} };

// ===== Camadas =====
const els = {}, S = {};
function build(){
  const game = $('#game'), ref = $('#reference'); if (!game || els.boss) return;
  WHO.forEach(w => {
    const m = META[w], d = document.createElement('div'); d.className = 'spr ' + w; d.dataset.who = w;
    d.style.cssText = `left:${X(m.x)}%;top:${Y(m.y)}%;width:${X(m.w)}%;height:${Y(m.h)}%`;
    const img = document.createElement('img'); img.src = `spr_${w}.webp`; img.alt = ''; img.draggable = false; d.appendChild(img);
    ref.after(d); els[w] = {box:d, img}; S[w] = {busy:0, dead:false, timer:null, idle:null, aura:null};
  });
  const mb = document.createElement('button'); mb.id = 'mute'; mb.type = 'button'; mb.setAttribute('aria-label', 'Som');
  const paint = () => { mb.textContent = muted ? '🔇' : '🔊'; };
  mb.onclick = () => { muted = !muted; try { localStorage.setItem('bd1_mute', muted ? '1' : '0'); } catch {} paint(); if (!muted) { unlocked = true; ctx(); sfx('right'); } };
  paint(); game.appendChild(mb);
  document.addEventListener('pointerdown', () => { unlocked = true; ctx(); }, {once:true});
  WHO.forEach(w => scheduleIdle(w, rnd(300, 1500)));
}

// ===== Efeitos soltos (divs em #game) =====
function fx(cls, xPct, yPct, w, h, frames, dur, css = '', easing = 'ease-out'){
  const d = document.createElement('div'); d.className = 'fxp ' + cls;
  d.style.cssText = `left:${xPct}%;top:${yPct}%;width:${w}%;height:${h}%;${css}`;
  $('#game').appendChild(d);
  const a = d.animate(frames, {duration:dur, easing, fill:'forwards'}); a.finished.then(() => d.remove(), () => d.remove()); return a.finished.catch(() => {});
}
const glow = (pt, color, size = 12, dur = 700, peak = .9) => fx('glow', X(pt[0]) - size / 2, Y(pt[1]) - size * 0.33, size, size * .667,
  [{opacity:0, transform:'scale(.2)'}, {opacity:peak, transform:'scale(1)', offset:.35}, {opacity:0, transform:'scale(1.5)'}], dur, `background:radial-gradient(circle,#fff 0,${color} 30%,transparent 70%)`);
const ring = (pt, color, size = 14, dur = 600) => fx('ringfx', X(pt[0]) - size / 2, Y(pt[1]) - size * .333, size, size * .667,
  [{opacity:.9, transform:'scale(.2)'}, {opacity:0, transform:'scale(1.6)'}], dur, `border:.5cqw solid ${color};border-radius:50%;box-shadow:0 0 12px ${color}`);
function sparks(pt, color, n = 8, spread = 6, dur = 600){
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(spread * .4, spread);
    fx('spark', X(pt[0]), Y(pt[1]), .9, .6, [{opacity:1, transform:'translate(0,0)'}, {opacity:0, transform:`translate(${Math.cos(a) * r}cqw,${Math.sin(a) * r * 1.1}cqw)`}], dur * rnd(.7, 1.2), `background:${color};box-shadow:0 0 6px ${color}`);
  }
}
const slash = (pt, color = '#fff', rot = -35, size = 16) => fx('slashfx', X(pt[0]) - size / 2, Y(pt[1]) - 2, size, 3.2,
  [{opacity:0, transform:`rotate(${rot}deg) scaleX(.1)`}, {opacity:1, transform:`rotate(${rot}deg) scaleX(1)`, offset:.4}, {opacity:0, transform:`rotate(${rot}deg) scaleX(1.2)`}], 340,
  `background:linear-gradient(90deg,transparent,${color},transparent);border-radius:50%;filter:drop-shadow(0 0 8px ${color})`);
const beam = (pt, color, dur = 700) => fx('beamfx', X(pt[0]) - 5, 0, 10, Y(pt[1]) + 4,
  [{opacity:0, transform:'scaleX(.2)'}, {opacity:.85, transform:'scaleX(1)', offset:.3}, {opacity:0, transform:'scaleX(1.4)'}], dur, `background:linear-gradient(180deg,transparent,${color} 60%,#fff);mix-blend-mode:screen`);
function shake(px = 4, dur = 300){ const g = $('#game'); g.animate([{transform:'translate(0,0)'}, {transform:`translate(${-px}px,${px / 2}px)`}, {transform:`translate(${px}px,${-px / 2}px)`}, {transform:`translate(${-px / 2}px,0)`}, {transform:'translate(0,0)'}], {duration:dur}); }

// ===== Primitivas de movimento =====
const dirOf = w => w === 'boss' ? 0 : (HERO_X[w] < 50 ? 1 : -1);
const HERO_X = {mage:12.2, knight:36.1, tank:63.3, assassin:87.4};
function run(w, frames, dur, easing = 'ease-in-out'){
  const e = els[w]; if (!e) return Promise.resolve();
  const a = e.img.animate(frames, {duration:dur, easing}); S[w].cur = a; return a.finished.catch(() => {});
}
const T = (t, extra = {}) => ({transform:t, ...extra});

// ===== Ociosos (3 por personagem, sorteados) =====
const IDLE = {
  breath: w => run(w, [T('scale(1,1)'), T('scale(1.007,1.016)'), T('scale(1,1)')], rnd(2600, 3400), 'ease-in-out'),
  sway:   w => run(w, [T('rotate(0) translateX(0)'), T('rotate(.8deg) translateX(1px)'), T('rotate(-.8deg) translateX(-1px)'), T('rotate(0)')], rnd(3200, 4200), 'ease-in-out'),
  mage_orb:  w => { glow(PT.mage.orb, '#4d8dff', 13, 1500, .95); sparks(PT.mage.orb, '#9fd0ff', 5, 4, 1200); return run(w, [T('rotate(0)'), T('rotate(-1.4deg) translateY(-2px)'), T('rotate(0)')], 1500); },
  knight_shift: w => { if (Math.random() < .7) glow(PT.knight.blade, '#ffffff', 5, 700, .8); return run(w, [T('scale(1)'), T('scale(.984,1.004) rotate(-1.3deg)'), T('scale(.984,1.004) rotate(-1.3deg)', {offset:.7}), T('scale(1)')], 2400); },
  tank_shrug: w => run(w, [T('translateY(0) scale(1)'), T('translateY(-3px) scale(1.012,1.01)'), T('translateY(0) scale(1)'), T('translateY(-2px) scale(1.008)'), T('translateY(0) scale(1)')], 1900),
  cleric_pray: w => { glow(PT.assassin.staff, '#ffe08a', 11, 1800, .9); return run(w, [T('translateY(0)'), T('translateY(-3px) scale(1.004)'), T('translateY(0)')], 1900); },
  boss_breathe: w => run(w, [T('scale(1,1)'), T('scale(1.012,1.018)'), T('scale(1,1)')], 3400),
  boss_cape: w => run(w, [T('skewX(0) scale(1)'), T('skewX(.6deg) scale(1.004)', {filter:'brightness(1.06)'}), T('skewX(-.6deg) scale(1.004)'), T('skewX(0) scale(1)')], 4200),
  boss_flare: w => { glow(PT.boss.eyes, '#ff2d2d', 9, 1500, .9); glow(PT.boss.sword, '#ff3a3a', 18, 1700, .7); return run(w, [T('scale(1)', {filter:'brightness(1)'}), T('scale(1.02) translateY(-2px)', {filter:'brightness(1.18) saturate(1.2)'}), T('scale(1)', {filter:'brightness(1)'})], 2000); }
};
const IDLES = {
  mage:['breath','sway','mage_orb'], knight:['breath','sway','knight_shift'], tank:['breath','sway','tank_shrug'], assassin:['breath','sway','cleric_pray'],
  boss:['boss_breathe','boss_cape','boss_flare']
};
function scheduleIdle(w, delay){
  clearTimeout(S[w].timer);
  S[w].timer = setTimeout(async () => {
    if (S[w].busy || S[w].dead || document.hidden) return scheduleIdle(w, rnd(800, 1800));
    const name = pick(IDLES[w]); S[w].idle = name; await IDLE[name](w); S[w].idle = null;
    scheduleIdle(w, rnd(w === 'boss' ? 400 : 700, w === 'boss' ? 1800 : 2800));
  }, delay);
}

// ===== Ações =====
const ACT = {
  // ataques
  melee: async (w) => { const d = dirOf(w), p = PT[w] || PT.knight; sfx('slash');
    const a = run(w, [T('none'), T(`rotate(${-3 * d}deg) scale(.97,1) translateY(2px)`, {offset:.3}), T(`rotate(${4 * d}deg) scale(1.08,1.06) translateY(-9px)`, {offset:.55}), T('none')], 560, 'cubic-bezier(.3,.7,.4,1)');
    await wait(260); slash([HERO_X[w] * 10.24 + d * 40, 880], '#fff', d > 0 ? -40 : 40); sparks([HERO_X[w] * 10.24 + d * 70, 870], '#ffd9a0', 7, 5); await a; },
  heavy: async (w) => { const d = dirOf(w); sfx('heavy');
    const a = run(w, [T('none'), T(`rotate(${-6 * d}deg) scale(.94,.96) translateY(6px)`, {offset:.4}), T(`rotate(${6 * d}deg) scale(1.12,1.1) translateY(-14px)`, {offset:.62}), T('scale(1.02,.97)', {offset:.8}), T('none')], 820, 'cubic-bezier(.3,.7,.4,1)');
    await wait(500); shake(5, 260); ring([HERO_X[w] * 10.24, 1010], '#ffb066', 18, 500); sparks([HERO_X[w] * 10.24, 1000], '#ffb066', 10, 7); await a; },
  cast: async (w) => { const p = w === 'mage' ? PT.mage.orb : PT.assassin.staff, c = COLOR[w]; sfx('cast');
    const a = run(w, [T('none'), T('translateY(-8px) scale(1.02,1.05)', {offset:.4}), T('translateY(-8px) scale(1.02,1.05)', {offset:.65}), T('scale(1.04) translateY(-3px)', {offset:.82}), T('none')], 700);
    glow(p, c, 16, 650, 1); await wait(300); ring(p, c, 14, 500); sparks(p, c, 10, 6); await a; },
  holy: async (w) => { sfx('holy');
    const a = run(w, [T('none'), T('translateY(-10px) scale(1.03,1.07)', {offset:.4}), T('translateY(-10px) scale(1.03,1.07)', {offset:.7}), T('scale(1.04)', {offset:.85}), T('none')], 820, 'ease-in-out');
    glow(PT.assassin.staff, '#ffe08a', 18, 800, 1); beam(PT.assassin.staff, '#ffe08a', 800); await wait(350); ring(PT.assassin.staff, '#fff3b0', 16, 500); sparks(PT.assassin.staff, '#ffe08a', 12, 7); await a; },
  pass: async (w) => { sfx('dodge'); await run(w, [T('none'), T(`translateX(${dirOf(w) * 12}px) rotate(${dirOf(w) * 5}deg)`, {offset:.5}), T('none')], 560); },
  // defesas
  guard: async (w, o = {}) => { const c = o.color || '#4da3ff', ctr = [HERO_X[w] * 10.24, 880]; sfx('shield');
    const a = run(w, [T('none'), T('scale(1.03,.94) translateY(4px)', {offset:.25}), T('scale(1.03,.94) translateY(4px)', {offset:.75}), T('none')], 760);
    fx('shieldfx', X(ctr[0]) - 9, Y(ctr[1]) - 6.5, 18, 13, [{opacity:0, transform:'scale(.3)'}, {opacity:.95, transform:'scale(1)', offset:.25}, {opacity:.95, transform:'scale(1)', offset:.75}, {opacity:0, transform:'scale(1.15)'}], 760,
      `border:.7cqw solid ${c};border-radius:50% 50% 45% 45%;background:radial-gradient(circle,${c}33,${c}66);box-shadow:0 0 18px ${c},inset 0 0 14px ${c}`);
    sparks(ctr, c, 6, 5); await a; },
  dodge: async (w) => { const d = dirOf(w) || 1, dx = d * -1 * 11; sfx('dodge');
    const e = els[w], ghost = e.img.cloneNode(); ghost.className = 'ghost'; e.box.appendChild(ghost);
    ghost.animate([{opacity:.55, transform:'translateX(0)'}, {opacity:0, transform:`translateX(${dx * .6}%)`}], {duration:520, easing:'ease-out'}).finished.then(() => ghost.remove(), () => ghost.remove());
    await run(w, [T('none'), T(`translateX(${dx}%) skewX(${-dx * .5}deg)`, {offset:.3, opacity:.85}), T(`translateX(${dx}%) skewX(${-dx * .5}deg)`, {offset:.6, opacity:.85}), T('none')], 640); },
  // reações
  hurt: async (w, o = {}) => { sfx(w === 'boss' ? 'bossHurt' : 'hurt'); const f = 'brightness(2) sepia(1) hue-rotate(-40deg) saturate(3)'; const d = dirOf(w) * -1;
    await run(w, [T('none', {filter:'none'}), T(`translateX(${6 * d}px) rotate(${-2 * d}deg)`, {filter:f, offset:.2}), T(`translateX(${-3 * d}px)`, {filter:'none', offset:.4}), T(`translateX(${4 * d}px)`, {filter:f, offset:.6}), T('none', {filter:'none'})], o.light ? 300 : 440, 'linear'); },
  ult: async (w) => { const c = COLOR[w], ctr = [HERO_X[w] * 10.24, 900]; sfx('ult');
    const a = run(w, [T('none', {filter:'none'}), T('scale(1.1) translateY(-8px)', {filter:'brightness(1.7)', offset:.5}), T('none', {filter:'none'})], 1100);
    ring(ctr, c, 24, 900); glow(ctr, c, 30, 1000, .9); sparks(ctr, c, 16, 10, 900); beam(ctr, c, 900); await a; },
  victory: async (w) => { await wait(rnd(0, 250)); await run(w, [T('none'), T('translateY(-18px) scale(1.03,.98)', {offset:.25}), T('scale(1.04,.95)', {offset:.45}), T('translateY(-18px) scale(1.03,.98)', {offset:.7}), T('none')], 1000); },
  revive: async (w) => { const ctr = [HERO_X[w] * 10.24, 900]; sfx('heal'); glow(ctr, '#ffe08a', 24, 900); beam(ctr, '#ffe08a', 900); await run(w, [T('translateY(10px)', {filter:'brightness(2)'}), T('none', {filter:'none'})], 700); },
  // boss
  attack: async () => { sfx('bossAtk');
    const a = run('boss', [T('none'), T('scale(.97) translateY(-4px)', {filter:'brightness(.9)', offset:.35}), T('scale(1.09) translateY(16px)', {filter:'brightness(1.5) saturate(1.3)', offset:.55}), T('scale(1.02)', {offset:.8}), T('none', {filter:'none'})], 1000, 'cubic-bezier(.3,.7,.4,1)');
    glow(PT.boss.sword, '#ff3a3a', 22, 800, 1); await wait(450); slash([300, 640], '#ff5a5a', -25, 38); slash([700, 640], '#ff5a5a', 25, 38); shake(4, 260); await a; },
  enrage: async () => { sfx('bossRoar'); const a = run('boss', [T('none', {filter:'none'}), T('scale(1.05) translateX(-4px)', {filter:'brightness(1.5) saturate(1.5)', offset:.15}), T('scale(1.06) translateX(4px)', {offset:.3}), T('scale(1.05) translateX(-4px)', {offset:.45}), T('scale(1.06) translateX(4px)', {offset:.6}), T('scale(1.03)', {filter:'brightness(1.3)', offset:.85}), T('none', {filter:'none'})], 1300, 'linear');
    glow(PT.boss.eyes, '#ff1a1a', 16, 1200, 1); ring(PT.boss.center, '#ff2d4d', 40, 1100); shake(5, 800); await a; },
  aoe: async () => { sfx('aoe'); const a = run('boss', [T('none', {filter:'none'}), T('scale(1.07) translateY(-6px)', {filter:'brightness(1.4) hue-rotate(40deg)', offset:.5}), T('none', {filter:'none'})], 1000);
    ring(PT.boss.center, '#b36bff', 50, 1000); ring([512, 560], '#b36bff', 90, 1200); glow(PT.boss.chest, '#b36bff', 26, 1000, 1); await a; },
  laugh: async () => { await run('boss', [T('none'), T('translateY(-4px) scale(1.01)', {offset:.15}), T('none', {offset:.3}), T('translateY(-4px) scale(1.01)', {offset:.45}), T('none', {offset:.6}), T('translateY(-4px) scale(1.01)', {offset:.75}), T('none')], 1400); },
  die: async () => { sfx('bossDie'); S.boss.dead = true;
    await run('boss', [T('translateX(0)'), T('translateX(-5px)', {offset:.1, filter:'brightness(1.8)'}), T('translateX(5px)', {offset:.2}), T('translateX(-5px)', {offset:.3}), T('translateX(5px)', {offset:.4}), T('translateX(0) scale(1.02)', {offset:.6, opacity:.8, filter:'brightness(2.2)'}), T('scale(1.04)', {opacity:0, filter:'brightness(3)'})], 2200, 'linear');
    els.boss.box.style.opacity = '0'; }
};
const ATTACKS = {melee:1, heavy:1, cast:1, holy:1, pass:1};

async function play(w, name, o){
  const st = S[w], fn = ACT[name]; if (!st || !fn) return;
  if (st.dead && name !== 'revive') return;
  st.busy++; clearTimeout(st.timer); try { st.cur && st.cur.cancel(); } catch {}
  try { await fn(w, o || {}); } catch (e) { console.warn(e); }
  st.busy--; if (!st.busy) scheduleIdle(w, rnd(400, 1200));
}

// ===== Estados persistentes =====
function setDead(w, dead){
  const st = S[w]; if (!st || w === 'boss' || st.dead === dead) return;
  st.dead = dead; const b = els[w].box; b.classList.toggle('dead', dead);
  let sk = b.querySelector('.skull'); if (dead && !sk) { sk = document.createElement('i'); sk.className = 'skull'; sk.textContent = '☠'; b.appendChild(sk); }
  if (!dead && sk) sk.remove();
  if (dead) { sfx('die'); } else { st.dead = false; play(w, 'revive'); }
}
function setAura(w, kind){ // kind: red | blue | orange | gold | null
  const b = els[w] && els[w].box; if (!b) return;
  ['red', 'blue', 'orange', 'gold', 'purple'].forEach(c => b.classList.toggle('aura-' + c, c === kind));
}
function reset(){
  WHO.forEach(w => { if (!els[w]) return; S[w].dead = false; els[w].box.classList.remove('dead'); els[w].box.style.opacity = ''; const sk = els[w].box.querySelector('.skull'); if (sk) sk.remove(); setAura(w, null); scheduleIdle(w, 400); });
}

// ===== Falas =====
const LINES = {
  mage:{attack:['Pelo poder arcano!','Mana, atenda meu chamado!','Sinta o saber proibido!'], cast:['Elementos, obedeçam!','Que a magia flua!'], defend:['Escudo de mana!','Nada passa!'], dodge:['Tarde demais!','Um passo à frente!'], hurt:['Argh! Queimou!','Meu chapéu!'], ult:['BURACO NEGRO!','O vazio responde!'], win:['O conhecimento vence!'], pass:['Sua vez, amigo!']},
  knight:{attack:['Pela honra!','Aço contra trevas!','Toma essa!'], heavy:['Golpe pesado!'], defend:['Escudo erguido!','Firme!'], dodge:['Perdeu!','Lento demais!'], hurt:['Ugh! Ainda de pé!','Isso é tudo?'], ult:['BERSERK!!','Sem piedade!'], win:['Vitória!'], pass:['Passo a vez, acabe com ele!']},
  tank:{attack:['Meu martelo fala por mim!','Esmagar!'], heavy:['TREMAM!','Isto vai doer!'], defend:['Aqui ninguém passa!','Muralha!'], dodge:['Rolando!','Hmpf, pensou que eu era lento?'], hurt:['Nem cócegas!','Grrr!'], ult:['ME ENCARE, DEMÔNIO!','Venham todos pra mim!'], guard:['Eu cubro vocês!'], win:['Ninguém caiu hoje!']},
  assassin:{attack:['Luz, guie minha mão!','Em nome da luz!'], holy:['Que a luz o purifique!','Sagrado seja!'], defend:['A luz me protege.','Fé inabalável!'], dodge:['A luz me guia...','Não me tocará!'], hurt:['Aah... resistam!','Mantenham a fé!'], ult:['LUZ SAGRADA!','Levante-se, herói!'], win:['A luz prevaleceu!']},
  boss:{intro:['Mortais insolentes...','Suas almas serão minhas!','Ajoelhem-se, tolos!','Quem ousa me desafiar?'], attack:['SINTAM A ESCURIDÃO!','Padeçam!','Sem esperança!'], hurt:['Insetos!','Isso... dói?','Impossível!','Vocês vão pagar!'], enrage:['CHEGA!!! FÚRIA!','Vou devorar todos vocês!'], aoe:['Trevas, consumam-nos!','Nenhum de vocês escapa!'], die:['Não... meu reino...','Impossível... a luz...'], win:['Patéticos. Eram só mortais.'], laugh:['Muahaha!','Essa foi fácil!'], taunt:['Você quer morrer primeiro?']}
};
const bubbles = {};
function say(w, text, ms = 1900){
  const e = els[w]; if (!e) return; if (bubbles[w]) bubbles[w].remove();
  const m = META[w], b = document.createElement('div'); b.className = 'bubble ' + w; b.textContent = text;
  const cx = w === 'boss' ? 74 : Math.min(80, Math.max(20, HERO_X[w]));
  const top = w === 'boss' ? 19 : Y(m.y) - 6;
  b.style.cssText = `left:${cx}%;top:${top}%;--c:${COLOR[w]}`; $('#game').appendChild(b); bubbles[w] = b;
  b.animate([{opacity:0, transform:'translate(-50%,-100%) scale(.7)'}, {opacity:1, transform:'translate(-50%,-100%) scale(1)'}], {duration:160, fill:'forwards', easing:'ease-out'});
  setTimeout(() => { if (bubbles[w] !== b) return; b.animate([{opacity:1}, {opacity:0}], {duration:220, fill:'forwards'}).finished.then(() => { b.remove(); if (bubbles[w] === b) delete bubbles[w]; }); }, ms);
}
function sayRandom(w, kind, p = .6){
  if (Math.random() > p) return; const l = LINES[w] && LINES[w][kind]; if (l) say(w, pick(l));
}

// ===== API pública =====
// useSheet: troca uma animação por quadros desenhados (sprite sheet horizontal). Ex.: Anim.useSheet('knight','melee',{src:'knight_melee.webp',frames:6,fps:12})
function useSheet(w, name, {src, frames, fps = 12}){
  const prev = ACT[name];
  ACT[name] = async (who, o) => {
    if (who !== w) return prev(who, o);
    const e = els[w], img = e.img, orig = img.src; const f = document.createElement('div'); f.className = 'sheet';
    f.style.cssText = `position:absolute;inset:0;background:url(${src}) 0 0/${frames * 100}% 100% no-repeat;image-rendering:pixelated`;
    img.style.visibility = 'hidden'; e.box.appendChild(f);
    for (let i = 0; i < frames; i++) { f.style.backgroundPosition = `${i / (frames - 1) * 100}% 0`; await wait(1000 / fps); }
    f.remove(); img.style.visibility = ''; img.src = orig;
  };
}
window.Anim = {META, play, say, sayRandom, sfx, setDead, setAura, reset, useSheet, shake, fx:{glow, ring, sparks, slash, beam}, isMuted:() => muted, build};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
