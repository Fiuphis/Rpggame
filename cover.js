// Capa do jogo: arte 941x1672 com camadas animadas por cima (fogo, fumaça, olhos, espada, cajados, bandeiras, raios),
// painel "Como jogar" e transição do JOGAR (zoom nos heróis -> a cena se desfaz em pixels -> seleção de classe se reconstrói).
(() => {
const AW = 941, AH = 1672, $ = s => document.querySelector(s), cv = $('#cv'), world = $('#world'), fxd = $('#fxd');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const pl = (x, y, w, h) => `left:${x / AW * 100}%;top:${y / AH * 100}%;width:${w / AW * 100}%;height:${h / AH * 100}%`;
const mk = (cls, css, html) => { const d = document.createElement('div'); d.className = cls; d.style.cssText = css; if (html) d.innerHTML = html; fxd.appendChild(d); return d; };
const glow = (x, y, r, c, cls, css = '') => mk('gw ' + cls, pl(x - r, y - r, r * 2, r * 2) + `;--c:${c};${css}`);

// ---------- ícones em pixel art ----------
const pix = (rows, pal) => { const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } })); return c.toDataURL(); };
const BOOK = pix([".kkkk.kkkk.", "kpttpkpttpk", "kppppkppppk", "kpttpkpttpk", "kppppkppppk", "kpttpkpttpk", "kppppkppppk", ".kkkkkkkkk."], {k:'#1a0c06', p:'#f4e2b0', t:'#b8893a'});
const GEM = pix(["....k....", "...kbk...", "..kbwbk..", ".kbbwbbk.", "kbbbwbbbk", ".kbbbbbk.", "..kbbbk..", "...kbk...", "....k...."], {k:'#0a1030', b:'#3a7bff', w:'#cfe6ff'});
document.querySelectorAll('.ic-book').forEach(e => e.style.backgroundImage = `url(${BOOK})`);
document.querySelectorAll('.ic-gem').forEach(e => e.style.backgroundImage = `url(${GEM})`);

// ---------- camadas de brilho (DOM) ----------
// fogo da cidade: manchas laranja que tremulam em ritmos diferentes
[[150,1090,90],[240,1030,80],[330,1100,95],[420,1060,100],[500,1010,95],[560,1100,100],[640,1060,90],[720,1100,95],[800,1050,80],[390,975,70],[610,985,70],[470,1160,110],[300,1170,90],[650,1170,90],[200,1160,80],[760,1170,80]]
  .forEach(([x, y, r], i) => glow(x, y, r, i % 3 ? 'rgba(255,120,30,.85)' : 'rgba(255,200,70,.8)', 'fire', `--d:${rnd(.9, 2.2).toFixed(2)}s;--l:-${rnd(0, 2).toFixed(2)}s`));
// eclipse
mk('gw eclipse', pl(400, 405, 144, 116));
// olhos dos senhores (brilham em momentos diferentes) + runa do golem
const EYES = [
  {n:'dragao', pts:[[152,381],[175,381]], c:'rgba(255,215,90,1)', r:20},
  {n:'gelo',   pts:[[272,472],[292,472]], c:'rgba(150,225,255,1)', r:20},
  {n:'dama',   pts:[[107,655],[125,657]], c:'rgba(170,255,225,1)', r:24},
  {n:'kraken', pts:[[730,421],[764,422]], c:'rgba(255,90,220,1)', r:24},
  {n:'lorde',  pts:[[488,583],[510,583]], c:'rgba(255,60,40,1)', r:22},
  {n:'golem',  pts:[[875,580]], c:'rgba(255,190,70,1)', r:42}
];
EYES.forEach(b => { b.els = b.pts.map(([x, y]) => glow(x, y, b.r, b.c, 'eyeg')); });
const flash = (b, strong) => b.els.forEach(e => { e.classList.remove('eye'); void e.offsetWidth; e.classList.add('eye'); if (strong) e.style.transform = ''; });
EYES.forEach(b => { const loop = () => { flash(b); setTimeout(loop, rnd(2600, 8200)); }; setTimeout(loop, rnd(900, 5200)); });
setInterval(() => EYES.forEach((b, i) => setTimeout(() => flash(b, true), i * 140)), 17000);   // de vez em quando todos acendem juntos
// espada do Lorde: brilho vermelho que pulsa e um reflexo que corre pela lâmina
{ const x0 = 197, y0 = 928, x1 = 350, y1 = 740, L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  const s = mk('sword', `left:${x0 / AW * 100}%;top:${(y0 - 11) / AH * 100}%;width:${L / AW * 100}%;height:${22 / AH * 100}%;transform:rotate(${a}deg)`, '<i></i>'); }
// orbes dos cajados (maga e clériga) oscilando
glow(145, 1070, 38, 'rgba(110,170,255,1)', 'orb'); glow(145, 1070, 14, 'rgba(255,255,255,1)', 'orb', 'animation-delay:-.7s');
glow(735, 1148, 38, 'rgba(255,200,90,1)', 'orb', 'animation-delay:-.4s'); glow(735, 1148, 14, 'rgba(255,255,255,1)', 'orb', 'animation-delay:-1.1s');
// bandeiras: recortes da própria arte balançando
[[26,905,92,330,5.2,0],[868,948,73,300,4.4,-1.2],[800,1090,76,170,3.8,-.6]].forEach(([x, y, w, h, d, l]) => {
  const e = mk('ban', pl(x, y, w, h) + `;background-image:url(cover_bg.webp);background-size:${AW / w * 100}% ${AH / h * 100}%;background-position:${x / (AW - w) * 100}% ${y / (AH - h) * 100}%;--d:${d}s;--l:${l}s`); });
// título: reflexo que passa + estrelinhas nas joias
mk('gloss', pl(180, 70, 580, 260));
[[471,62,40,2.8,0],[190,190,34,3.4,-1.3],[738,190,34,3.1,-.6],[471,298,28,3.7,-2],[428,98,22,4,-1.8],[514,98,22,4.2,-.2]].forEach(([x, y, s, d, l]) => mk('star', pl(x - s / 2, y - s / 2, s, s) + `;--d:${d}s;--l:${l}s`));

// ---------- partículas (canvas): brasas, fumaça, faíscas dos cajados e raios ----------
const fx = $('#fx'), ctx = fx.getContext('2d'), DPR = Math.min(2, devicePixelRatio || 1);
let K = 1, boost = 1;
const size = () => { fx.width = Math.round(cv.clientWidth * DPR); fx.height = Math.round(cv.clientHeight * DPR); K = fx.width / AW; };
size(); addEventListener('resize', size);
const sprite = (r, stops) => { const c = document.createElement('canvas'); c.width = c.height = r * 2; const x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c; };
const SMK = sprite(32, [[0, 'rgba(70,52,78,.5)'], [.55, 'rgba(50,36,58,.22)'], [1, 'rgba(40,28,48,0)']]);
const TOWERS = [[210,990],[265,962],[330,985],[392,948],[487,904],[545,880],[590,955],[665,985],[700,1000],[780,1000],[130,1010]];
const smoke = [], embers = [], sparks = [], bolts = [];
const LOW = innerWidth < 380 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
const NSM = LOW ? 14 : 26, NEM = LOW ? 50 : 100;
const newSmoke = (age0) => { const [x, y] = pick(TOWERS); return {x:x + rnd(-14, 14), y:y + rnd(-6, 6), vx:rnd(3, 12), vy:-rnd(12, 26), r:rnd(16, 26), life:rnd(7, 12), age:age0 || 0, a:rnd(.55, 1)}; };
const newEmber = (age0) => { const low = Math.random() < .35; return {x:rnd(60, 880), y:low ? rnd(1320, 1650) : rnd(960, 1290), vx:rnd(-8, 12), vy:-rnd(low ? 14 : 26, low ? 40 : 70), s:rnd(1.4, 3.6), life:rnd(2.6, 6), age:age0 || 0, ph:rnd(0, 6.28), c:pick(['#ffb347', '#ff7a1a', '#ffd86b', '#ff5a2a'])}; };
for (let i = 0; i < NSM; i++) smoke.push(newSmoke(rnd(0, 10)));
for (let i = 0; i < NEM; i++) embers.push(newEmber(rnd(0, 5)));
const ORBS = [[145, 1070, '#9fc8ff'], [735, 1148, '#ffd98a']];
ORBS.forEach(([x, y, c]) => { for (let i = 0; i < 6; i++) sparks.push({x, y, c, r:rnd(14, 30), a:rnd(0, 6.28), w:rnd(-2.2, 2.2) || 1, s:rnd(1.2, 2.4), ph:rnd(0, 6.28)}); });
const REG = [   // regiões de onde saem raios: [x0,y0,x1,y1, cor, onde cai]
  [[600, 330, 790, 330], [620, 600, 780, 620], '#e2b8ff'], [[840, 540, 941, 560], [850, 800, 930, 840], '#ffd27a'],
  [[215, 620, 245, 640], [215, 740, 245, 760], '#9fd0ff'], [[300, 420, 480, 420], [380, 560, 470, 600], '#ff7a6a'], [[0, 520, 60, 520], [20, 700, 90, 760], '#ff9a3a']];
const newBolt = () => { const r = pick(REG), a = r[0], b = r[1], x0 = rnd(a[0], a[2]), y0 = rnd(a[1], a[3]), x1 = rnd(b[0], b[2]), y1 = rnd(b[1], b[3]), pts = [[x0, y0]], n = 8;
  for (let i = 1; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + rnd(-16, 16), y0 + (y1 - y0) * t + rnd(-10, 10)]); } pts.push([x1, y1]);
  bolts.push({pts, c:r[2], age:0, life:rnd(.2, .34)}); if (Math.random() < .45) setTimeout(() => bolts.push({pts:pts.map(p => [p[0] + rnd(-3, 3), p[1] + rnd(-3, 3)]), c:r[2], age:0, life:.16}), 130); };
(function boltLoop() { newBolt(); setTimeout(boltLoop, rnd(1100, 3200)); })();
let last = performance.now(), run = true;
const frame = now => {
  if (!run) return; const dt = Math.min(.05, (now - last) / 1000) * (RM ? 0 : 1); last = now; const t = now / 1000;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fx.width, fx.height); ctx.setTransform(K, 0, 0, K, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  smoke.forEach((p, i) => { p.age += dt; if (p.age > p.life) { smoke[i] = newSmoke(); return; } p.x += p.vx * dt; p.y += p.vy * dt; const k = p.age / p.life, r = p.r * (1 + k * 2.6), al = Math.sin(Math.PI * k) * p.a;
    ctx.globalAlpha = al; ctx.drawImage(SMK, p.x - r, p.y - r, r * 2, r * 2); });
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
  embers.forEach((p, i) => { p.age += dt * boost; if (p.age > p.life) { embers[i] = newEmber(); return; } p.x += (p.vx + Math.sin(t * 2 + p.ph) * 9) * dt * boost; p.y += p.vy * dt * boost; const k = p.age / p.life; ctx.globalAlpha = Math.min(1, k * 6) * (1 - k);
    ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
  sparks.forEach(p => { p.a += p.w * dt; const x = p.x + Math.cos(p.a) * p.r, y = p.y + Math.sin(p.a) * p.r * .8, tw = .5 + .5 * Math.sin(t * 5 + p.ph); ctx.globalAlpha = .35 + .65 * tw; ctx.fillStyle = p.c; ctx.fillRect(Math.round(x), Math.round(y), p.s, p.s); });
  bolts.forEach((b, i) => { b.age += RM ? 0 : dt; if (b.age > b.life) { bolts.splice(i, 1); return; } const al = 1 - b.age / b.life; ctx.globalAlpha = al * (Math.random() < .25 ? .35 : 1);
    ctx.strokeStyle = b.c; ctx.lineWidth = 2.6; ctx.shadowColor = b.c; ctx.shadowBlur = 12 * K; ctx.lineJoin = 'round'; ctx.beginPath(); b.pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.stroke(); });
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => { if (document.hidden) run = false; else if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } });

// ---------- atualizar (versão do jogo) ----------
{ const V = 'v223', b = $('#upd'); b.textContent = '↻ ATUALIZAR · ' + V;
  b.onclick = async () => { b.disabled = true; b.textContent = 'ATUALIZANDO…';
    try { if ('serviceWorker' in navigator) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); }
      if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
      const t = await (await fetch('sw.js', {cache:'reload'})).text(), m = t.match(/const CACHE='([^']+)'/);
      const fs = [...new Set((t.match(/'\.\/[^']+\.(?:html|js|css|json|webmanifest)'/g) || []).map(s => s.slice(1, -1)))].concat(['./', './sw.js']);
      await Promise.all(fs.map(f => fetch(f, {cache:'reload'}).catch(() => 0)));
      b.textContent = 'OK · ' + (m ? m[1].replace('bd1-rpg-', '') : ''); } catch (e) { b.textContent = 'ERRO · TENTE DE NOVO'; }
    setTimeout(() => location.replace(location.pathname + location.search), 500); }; }

// ---------- mensagens ----------
const MSGS = [
  'Os seis senhores despertaram. Agora, o mundo repousa sobre a coragem de quatro heróis. E a esperança... está em suas mãos.',
  'Quatro heróis. Uma única resposta certa. Votem juntos e vençam juntos.',
  'O Lorde das Trevas ainda ri. Quanto tempo até a primeira resposta errada?',
  'O conhecimento é a única arma que nunca quebra.',
  'A Maga queima, o Guerreiro corta, o Tanque resiste e a Clériga cura. Falta o seu grupo decidir.',
  'Ranks S e SS rendem o poder máximo, mas um erro desperta a fúria do boss.',
  'Cada moeda guardada hoje é uma poção salva amanhã. O Mercador não perdoa os indecisos.',
  'Dizem que existem relógios lendários nas sombras. Quem achar um ganha tempo, o bem mais raro do reino.'
];
const msg = $('#msg'); let mi = 0;
const showMsg = () => { msg.classList.remove('on'); setTimeout(() => { msg.textContent = MSGS[mi]; msg.classList.add('on'); mi = (mi + 1) % MSGS.length; }, 560); };
showMsg(); setInterval(() => { if (!document.hidden && !cv.classList.contains('go')) showMsg(); }, 6200);

// ---------- Como jogar ----------
const PAGES = [
  {t:'OBJETIVO', h:'Derrote o Lorde das Trevas', b:`<p>O Lorde das Trevas tem 650 de vida. Derrubem o boss antes que os quatro heróis caiam.</p><p>Cada classe (Maga, Guerreiro, Tanque e Clériga) é um grupo de até 7 jogadores. Dentro do grupo, a maioria dos votos decide tudo. Moedas, itens e votos são do grupo.</p>`},
  {t:'PERGUNTAS', h:'Perguntas e votação', b:`<p>Toda rodada começa com uma pergunta de Banco de Dados. O grupo vota em uma alternativa antes do relógio zerar.</p><ul><li><b>RANK C</b>25s para responder, 1 moeda</li><li><b>RANK B</b>30s, 2 moedas</li><li><b>RANK A</b>35s, 3 moedas</li><li><b class="g">RANK S</b>40s, 5 moedas</li><li><b class="g">RANK SS</b>45s, 8 moedas</li></ul><p>Acertar rende moedas. Acertar um rank S ou SS carrega o poder especial do herói. Errar nesses ranks enfurece o boss.</p>`},
  {t:'HERÓIS', h:'Os quatro heróis', b:`<p>Depois da pergunta, o seu grupo escolhe a ação do herói: atacar, defender, esquivar ou usar uma habilidade. A escolha também é por votação.</p><ul><li><b>MAGA</b>Ataques de mana e de elementos. O boss é fraco a fogo. Especial: Buraco Negro.</li><li><b class="r">GUERREIRO</b>O maior dano. Pode passar a vez para dar um ataque extra a um aliado. Especial: Berserk.</li><li><b class="g">TANQUE</b>A melhor defesa. Protege aliados e desnorteia o boss. Especial: Provocação.</li><li><b class="v">CLÉRIGA</b>Ataque sagrado e defesa sagrada. Especial: Luz Sagrada, que cura ou revive.</li></ul>`},
  {t:'ITENS', h:'Mercador, mochila e arcas', b:`<p>Entre as perguntas o Mercador vende itens pelas moedas do grupo. A mochila tem 6 espaços e itens iguais empilham até 3.</p><ul><li><b>TOQUE</b>Toque rápido num item da mochila para usar</li><li><b>SEGURAR</b>Segure o dedo num item para ler os detalhes</li><li><b class="p">RARO</b>Itens poderosos que aparecem pouco</li><li><b class="g">LENDÁRIO</b>Os relógios dão tempo extra na pergunta e quase nunca aparecem</li></ul><p>Às vezes surge uma arca misteriosa. Ela pode trazer um item... ou uma armadilha.</p>`},
  {t:'BOSS', h:'O Lorde das Trevas', b:`<p>O boss ataca a cada rodada. A Onda Sombria acerta todo mundo e fica mais forte nos ranks altos.</p><ul><li><b class="r">FÚRIA</b>Sobe com os erros e, ao encher, ele se enfurece</li><li><b class="r">FASE 2</b>Com metade da vida o boss desperta, com raios e golpes mais fortes</li><li><b>TELEPORTE</b>Ele some e surge atrás de alguém: use Esquiva</li><li><b>PREPARANDO</b>O golpe seguinte vem mais forte: defendam</li></ul>`},
  {t:'DICAS', h:'Dicas de sobrevivência', b:`<ul><li><b>TEMPO</b>Respondam rápido: quando o relógio zera, o voto não conta</li><li><b>MANA</b>Habilidades fortes gastam mana e têm recarga</li><li><b>DEFESA</b>Defender e esquivar também enchem a fúria... para o seu lado</li><li><b>EQUIPE</b>Quatro grupos jogam juntos. Cuidem uns dos outros</li><li><b class="g">ESPECIAL</b>Acertem perguntas difíceis para liberar os poderes</li></ul>`}
];
const how = $('#how'), tabs = $('#tabs'), hb = $('#hbody'); let pi = 0;
PAGES.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = p.t; b.onclick = () => go(i); tabs.appendChild(b); });
function go(i) { pi = Math.max(0, Math.min(PAGES.length - 1, i)); const p = PAGES[pi]; hb.innerHTML = `<h3>${p.h}</h3>${p.b}`; hb.scrollTop = 0;
  [...tabs.children].forEach((b, j) => b.classList.toggle('on', j === pi)); $('#pg').textContent = `${pi + 1}/${PAGES.length}`; $('#prev').disabled = pi === 0; $('#next').disabled = pi === PAGES.length - 1; }
$('#how-btn').onclick = () => { go(0); how.hidden = false; };
$('#hclose').onclick = () => { how.hidden = true; };
$('#prev').onclick = () => go(pi - 1); $('#next').onclick = () => go(pi + 1);
how.addEventListener('click', e => { if (e.target === how) how.hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape') how.hidden = true; });

// ---------- JOGAR: zoom nos heróis -> clarão -> a cena vira cinzas de pixels -> seleção reconstrói ----------
let busy = false;
const BS = 14;   // tamanho do "pixel" da dissolução (px da tela)
const MODE = new URLSearchParams(location.search).get('trans') || 'book';   // ?trans=ash usa a transicao de cinzas
const PAGE_BG = 'radial-gradient(ellipse at 50% 42%,#4a3019 0,#2a190c 55%,#150a05 100%)';
$('#play').onclick = async () => {
  if (busy) return; busy = true; try { sessionStorage.setItem('bd1_cover', '1'); } catch (e) {}
  const leave = () => { try { sessionStorage.setItem('bd1_rebuild', MODE === 'ash' ? '1' : 'book'); } catch (e) {} location.href = 'index.html'; };
  if (RM) { cv.classList.add('go'); setTimeout(leave, 300); return; }
  if (MODE === 'book') return playBook(leave);
  how.hidden = true; cv.classList.add('go'); boost = 3.2;
  const ox = .5, oy = .755, S = 3, ZMS = 1700, org = `${ox * 100}% ${oy * 100}%`;
  const vig = document.createElement('div'), fl = document.createElement('div');
  vig.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;background:radial-gradient(ellipse 62% 58% at 50% 75.5%,transparent 25%,rgba(3,0,6,.92) 100%);opacity:0';
  fl.style.cssText = `position:absolute;left:${ox * 100 - 40}%;top:${oy * 100 - 22}%;width:80%;height:44%;z-index:5;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(ellipse at center,rgba(255,236,170,.95) 0,rgba(255,150,60,.55) 32%,transparent 68%);opacity:0`;
  cv.appendChild(vig); cv.appendChild(fl);
  world.style.animation = 'none';
  const an = world.animate([{transform:'scale(1)', transformOrigin:org}, {transform:`scale(${S})`, transformOrigin:org}], {duration:ZMS, easing:'cubic-bezier(.5,.02,.7,.25)', fill:'forwards'});
  vig.animate([{opacity:0}, {opacity:1}], {duration:ZMS, easing:'ease-in', fill:'forwards'});
  fl.animate([{opacity:0, transform:'scale(.4)'}, {opacity:.35, transform:'scale(.8)', offset:.55}, {opacity:1, transform:'scale(1.15)'}], {duration:ZMS, easing:'ease-in', fill:'forwards'});
  await an.finished.catch(() => {});
  // quadro congelado do zoom final (com vinheta e clarão) -> blocos
  const r = cv.getBoundingClientRect(), cw = Math.round(r.width), ch = Math.round(r.height), px = $('#px');
  px.width = cw; px.height = ch; px.style.cssText = `display:block;left:${r.left}px;top:${r.top}px;width:${cw}px;height:${ch}px;image-rendering:pixelated`;
  const snap = document.createElement('canvas'); snap.width = cw; snap.height = ch; const sc = snap.getContext('2d');
  const dx = cw * ox - S * cw * ox, dy = ch * oy - S * ch * oy;
  sc.drawImage($('#art'), dx, dy, cw * S, ch * S); sc.drawImage(fx, dx, dy, cw * S, ch * S);
  let g = sc.createRadialGradient(cw * ox, ch * oy, cw * .12, cw * ox, ch * oy, cw * .85); g.addColorStop(0, 'rgba(3,0,6,0)'); g.addColorStop(1, 'rgba(3,0,6,.92)'); sc.fillStyle = g; sc.fillRect(0, 0, cw, ch);
  sc.globalCompositeOperation = 'lighter'; g = sc.createRadialGradient(cw * ox, ch * oy, 0, cw * ox, ch * oy, cw * .5); g.addColorStop(0, 'rgba(255,236,170,.95)'); g.addColorStop(.32, 'rgba(255,150,60,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); sc.fillStyle = g; sc.fillRect(0, 0, cw, ch);
  world.style.visibility = 'hidden'; vig.remove(); fl.remove(); $('#ui').style.visibility = 'hidden';
  const pc = px.getContext('2d'), cols = Math.ceil(cw / BS), rows = Math.ceil(ch / BS), blocks = [], cx = cw * ox, cy = ch * oy, maxd = Math.hypot(cw, ch) * .75;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const bx = i * BS, by = j * BS, d = Math.hypot(bx + BS / 2 - cx, by + BS / 2 - cy) / maxd;
    blocks.push({bx, by, del:d * 1250 + rnd(0, 380), dur:rnd(700, 1150), up:rnd(60, 230), sx:rnd(-120, -20), rot:rnd(-2.4, 2.4), col:pick(['#ffe08a', '#ffb347', '#ff7a1a', '#ff5a2a'])}); }
  const total = Math.max(...blocks.map(b => b.del + b.dur)), T0 = performance.now(); let navigated = false;
  await new Promise(done => { const step = now => { const t = now - T0; pc.clearRect(0, 0, cw, ch);
    blocks.forEach(b => { const p = (t - b.del) / b.dur; if (p >= 1) return; if (p <= 0) { pc.drawImage(snap, b.bx, b.by, BS, BS, b.bx, b.by, BS, BS); return; }
      const e = p * p, s = 1 - e * .6, x = b.bx + b.sx * e + Math.sin(p * 7 + b.bx) * 4 * p, y = b.by - b.up * e;
      pc.save(); pc.translate(x + BS / 2, y + BS / 2); pc.rotate(b.rot * e); pc.globalAlpha = Math.pow(1 - p, 1.4);
      pc.drawImage(snap, b.bx, b.by, BS, BS, -BS * s / 2, -BS * s / 2, BS * s, BS * s);
      if (p < .5) { pc.globalAlpha = (.5 - p) * 1.6; pc.fillStyle = p < .18 ? '#fff0b8' : b.col; pc.fillRect(-BS * s / 2, -BS * s / 2, BS * s, BS * s); } pc.restore(); });
    pc.globalAlpha = 1;
    if (!navigated && t > total - 380) { navigated = true; leave(); }
    if (t < total) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
};

// ---------- transição do livro: a capa é a página de um livro que se abre e revela o capítulo seguinte ----------
async function playBook(leave) {
  how.hidden = true; cv.classList.add('go'); boost = 1.6;
  await new Promise(r => setTimeout(r, 450));
  const under = document.createElement('div');   // a página de baixo (capítulo I)
  under.style.cssText = `position:absolute;inset:0;z-index:3;background:${PAGE_BG};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3.2cqw;font-family:var(--F);font-weight:700;text-align:center;color:#e8d3a0;overflow:hidden`;
  under.innerHTML = `<div style="position:absolute;inset:3.5%;border:.9cqw solid #b8893a;box-shadow:inset 0 0 0 1cqw #2a190c,inset 0 0 0 1.7cqw #8a6a2a,0 0 3cqw rgba(0,0,0,.6);background:rgba(10,4,2,.22)"></div>
    <small style="position:relative;font-size:3cqw;letter-spacing:1cqw;color:#a98a52">CAPÍTULO I</small>
    <b style="position:relative;font-size:7.6cqw;letter-spacing:.8cqw;color:#ffd978;text-shadow:0 .7cqw 0 #3a1a06,0 0 3cqw rgba(255,190,80,.5)">A ESCOLHA</b>
    <span style="position:relative;width:34cqw;height:.7cqw;background:linear-gradient(90deg,transparent,#c8902c,transparent)"></span>
    <small style="position:relative;font-size:2.8cqw;letter-spacing:.4cqw;color:#bfa570;line-height:1.5">quatro heróis, uma só chance</small>`;
  const page = document.createElement('div');   // a capa: leva o cenário vivo junto
  page.style.cssText = 'position:absolute;inset:0;z-index:4;transform-origin:0 50%;transform-style:preserve-3d;backface-visibility:hidden;will-change:transform;overflow:hidden';
  const shade = document.createElement('div'); shade.style.cssText = 'position:absolute;inset:0;z-index:9;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.8));opacity:0';
  const cast = document.createElement('div'); cast.style.cssText = 'position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.65),rgba(0,0,0,0) 55%);opacity:0';
  const wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;inset:0;perspective:1500px;perspective-origin:100% 50%;z-index:3;overflow:hidden';
  cv.insertBefore(wrap, $('#ui')); wrap.appendChild(under); under.appendChild(cast); wrap.appendChild(page); page.appendChild(world); page.appendChild(shade);
  world.style.animation = 'none';
  const MS = 1700, ease = 'cubic-bezier(.55,.05,.35,1)';
  page.animate([{transform:'rotateY(0deg)'}, {transform:'rotateY(-24deg)', offset:.22}, {transform:'rotateY(-112deg)'}], {duration:MS, easing:ease, fill:'forwards'});
  shade.animate([{opacity:0}, {opacity:.35, offset:.4}, {opacity:1}], {duration:MS, easing:'linear', fill:'forwards'});
  cast.animate([{opacity:0}, {opacity:.2, offset:.2}, {opacity:1}], {duration:MS, easing:'linear', fill:'forwards'});
  under.animate([{transform:'scale(1.06)', filter:'brightness(.55)'}, {transform:'scale(1)', filter:'none'}], {duration:MS, easing:'ease-out', fill:'forwards'});
  await new Promise(r => setTimeout(r, MS + 350)); leave();
}
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}));
window.__cover = {EYES, flash};
})();
