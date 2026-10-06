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
  {n:'dragao', pts:[[154,382],[182,386]], c:'rgba(255,215,90,1)', r:20},
  {n:'gelo',   pts:[[273,476],[290,474]], c:'rgba(150,225,255,1)', r:20},
  {n:'dama',   pts:[[101,639],[123,637]], c:'rgba(170,255,225,1)', r:13},
  {n:'kraken', pts:[[730,421],[764,422]], c:'rgba(255,90,220,1)', r:24},
  {n:'lorde',  pts:[[494,581],[515,582]], c:'rgba(255,60,40,1)', r:22},
  {n:'golem',  pts:[[873,594]], c:'rgba(255,190,70,1)', r:42}
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
{ const V='v274', b = $('#upd'); b.textContent = '↻ ATUALIZAR · ' + V;
  b.onclick = async () => { b.disabled = true; b.textContent = 'ATUALIZANDO…';
    try { if ('serviceWorker' in navigator) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); }
      if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
      const t = await (await fetch('sw.js', {cache:'reload'})).text(), m = t.match(/const CACHE='([^']+)'/);
      const fs = [...new Set((t.match(/'\.\/[^']+\.(?:html|js|css|json|webmanifest)'/g) || []).map(s => s.slice(1, -1)))].concat(['./', './sw.js']);
      await Promise.all(fs.map(f => fetch(f, {cache:'reload'}).catch(() => 0)));
      b.textContent = 'OK · ' + (m ? m[1].replace('bd1-rpg-', '') : ''); } catch (e) { b.textContent = 'ERRO · TENTE DE NOVO'; }
    setTimeout(() => location.replace(location.pathname + location.search), 500); }; }

// ---------- saves ----------
{ const sv = $('#sv'), body = $('#sv-body'), note = $('#sv-msg'), act = $('#sv-act'); let mode = {}, nt = 0;
  const say = t => { note.textContent = t; clearTimeout(nt); nt = setTimeout(() => { note.textContent = ''; }, 3600); };
  const two = n => String(n).padStart(2, '0');
  const when = ts => { const d = new Date(ts); return two(d.getDate()) + '/' + two(d.getMonth() + 1) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes()); };
  const GUARD = Saves.ORDER;
  const pips = done => { const nx = GUARD.find(b => !done.includes(b)); return GUARD.map(b => `<i class="pip ${done.includes(b) ? 'd' : b === nx ? 'n' : ''}"></i>`).join(''); };
  const btn = (n, a, t, c = '') => `<button type="button" class="chip ${c}" data-n="${n}" data-a="${a}">${t}</button>`;
  function card(n, s, active){
    const m = mode[n], on = n === active;
    if (!s) return `<div class="sc empty" data-n="${n}"><div class="sc-top"><b class="sc-name">SAVE ${n}</b></div><div class="sc-empty">COMPARTIMENTO VAZIO</div><div class="sc-btns">${btn(n, 'new', 'NOVO JOGO', 'go')}${btn(n, 'save', 'SALVAR AQUI')}</div></div>`;
    const top = m === 'ren' ? `<input class="sc-in" maxlength="12" value="${s.name}" aria-label="Nome do save">` : `<div class="sc-top"><b class="sc-name">${s.name}</b>${on ? '<em class="sc-tag">EM USO</em>' : ''}</div>`;
    let btns;
    if (m === 'ren') btns = btn(n, 'ok-ren', 'SALVAR NOME', 'go') + btn(n, 'no', 'CANCELAR');
    else if (m) { const q = {del:on ? 'REINICIAR ESTE SAVE? O PROGRESSO SERÁ PERDIDO' : 'APAGAR ESTE SAVE?', save:'SUBSTITUIR ESTE SAVE PELO JOGO EM USO?', new:'COMEÇAR DO ZERO NESTE SAVE?', load:''}[m]; btns = `<div class="sc-ask">${q}</div>` + btn(n, 'ok-' + m, 'SIM', 'bad') + btn(n, 'no', 'NÃO'); }
    else btns = (on ? '' : btn(n, 'load', 'CARREGAR', 'go') + btn(n, 'save', 'SALVAR AQUI')) + btn(n, 'ren', 'RENOMEAR') + btn(n, 'del', on ? 'REINICIAR' : 'APAGAR', 'bad');
    return `<div class="sc${on ? ' on' : ''}" data-n="${n}">${top}<div class="sc-pips">${pips(s.done)}</div><div class="sc-info"><span><b>${Math.min(s.done.length, 6)}/6</b> GUARDIÕES</span><span><b>${s.gold}</b> MOEDAS</span><span><b>${s.items}</b> ITENS</span></div><div class="sc-date">SALVO EM ${when(s.ts)}</div><div class="sc-btns">${btns}</div></div>`;
  }
  function render(){ const st = Saves.state(); body.innerHTML = st.slots.map((s, i) => card(i + 1, s, st.active)).join(''); act.textContent = Saves.activeName(); }
  body.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const n = +b.dataset.n, a = b.dataset.a;
    if (a === 'load') { Saves.load(n); mode = {}; say(Saves.activeName() + ' carregado.'); }
    else if (a === 'new' || a === 'save' || a === 'del' || a === 'ren') {
      const st = Saves.state(), s = st.slots[n - 1];
      if (a === 'new' && !s) { Saves.newGame(n); Saves.load(n); say('Novo jogo iniciado em ' + Saves.activeName() + '.'); }
      else if (a === 'save' && !s) { Saves.saveTo(n); say('Jogo salvo em SAVE ' + n + '.'); }
      else mode[n] = a;
    }
    else if (a === 'no') delete mode[n];
    else if (a === 'ok-del') { Saves.remove(n); delete mode[n]; say('Save apagado.'); }
    else if (a === 'ok-save') { Saves.saveTo(n); delete mode[n]; say('Jogo salvo em ' + Saves.state().slots[n - 1].name + '.'); }
    else if (a === 'ok-new') { Saves.newGame(n); delete mode[n]; say('Save reiniciado.'); }
    else if (a === 'ok-ren') { const v = body.querySelector(`.sc[data-n="${n}"] .sc-in`); if (v && Saves.rename(n, v.value)) say('Nome alterado.'); else say('Digite um nome.'); delete mode[n]; }
    render();
  });
  $('#sv-btn').onclick = () => { mode = {}; note.textContent = ''; render(); sv.hidden = false; };
  $('#sv-close').onclick = () => { sv.hidden = true; };
  sv.addEventListener('click', e => { if (e.target === sv) sv.hidden = true; });
  addEventListener('keydown', e => { if (e.key === 'Escape') sv.hidden = true; });
  const ta = $('#sv-ta'), box = $('#sv-code'), ap = $('#sv-apply');
  $('#sv-exp').onclick = async () => { ta.value = Saves.exportCode(); box.hidden = false; ap.hidden = true; ta.select(); let ok = false; try { await navigator.clipboard.writeText(ta.value); ok = true; } catch {} say(ok ? 'Código copiado. Guarde em lugar seguro.' : 'Copie o código abaixo e guarde.'); };
  $('#sv-imp').onclick = () => { ta.value = ''; box.hidden = false; ap.hidden = false; ta.focus(); say('Cole o código. Isso substitui todos os saves.'); };
  ap.onclick = () => { if (Saves.importCode(ta.value)) { box.hidden = true; mode = {}; render(); say('Saves importados.'); } else say('Código inválido.'); };
  Saves.ready.then(() => { act.textContent = (Saves.state(), Saves.activeName()); }); }

// ---------- modo teste (os outros heróis jogam perfeito) ----------
{ const b = $('#auto'), KEY = 'bd1_auto';
  const get = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
  const paint = () => { const on = get(); b.firstElementChild.textContent = on ? 'TESTE LIGADO' : 'TESTE DESLIGADO'; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); };
  b.onclick = () => { try { if (get()) localStorage.removeItem(KEY); else localStorage.setItem(KEY, '1'); } catch {} paint(); window.__autoMsg = get() ? 'Modo teste ligado: os outros heróis acertam tudo, usam itens e habilidades certos para vencer, e a resposta certa aparece em verde.' : 'Modo teste desligado: os outros heróis voltam a jogar como no jogo normal.'; flashMsg(window.__autoMsg); };
  paint(); window.__autoPaint = paint; }

// ---------- mensagens ----------
const MSGS = [
  'Os seis senhores despertaram. Agora, o mundo repousa sobre a coragem de quatro heróis. E a esperança... está em suas mãos.',
  'Quatro heróis. Uma única resposta certa. Votem juntos e vençam juntos.',
  'Malgorath, Lorde das Trevas, ainda ri. Quanto tempo até a primeira resposta errada?',
  'O conhecimento é a única arma que nunca quebra.',
  'A Maga queima, o Guerreiro corta, o Tanque resiste e a Clériga cura. Falta o seu grupo decidir.',
  'Ranks S e SS rendem o poder máximo, mas um erro desperta a fúria do inimigo.',
  'Cada moeda guardada hoje é uma poção salva amanhã. O Mercador não perdoa os indecisos.',
  'Dizem que existem relógios lendários nas sombras. Quem achar um ganha tempo, o bem mais raro do reino.'
];
const msg = $('#msg'); let mi = 0;
const showMsg = () => { msg.classList.remove('on'); setTimeout(() => { msg.textContent = MSGS[mi]; msg.classList.add('on'); mi = (mi + 1) % MSGS.length; }, 560); };
let msgHold = 0;
function flashMsg(t){ msgHold = Date.now() + 9000; msg.classList.remove('on'); setTimeout(() => { msg.textContent = t; msg.classList.add('on'); }, 300); }
showMsg(); setInterval(() => { if (!document.hidden && !cv.classList.contains('go') && Date.now() > msgHold) showMsg(); }, 6200);

// ---------- Como jogar ----------
const GUARDS = [
  {n:'MALGORATH', h:'Castelo de Malgorath', b:`<p>O primeiro guardião: um demônio vampiro com 650 de vida. Todo o dano dele é demoníaco.</p>
<h4>FRAQUEZAS</h4><ul><li><b class="r">FOGO</b>A Maga causa 1,5x de dano e ainda queima o boss por 2 perguntas</li><li><b class="g">SAGRADO</b>O Ataque Sagrado da Clériga causa 2x e a Defesa Sagrada corta 80% do dano</li><li><b>IMUNE</b>Água, ar e terra não causam dano (só efeito visual). Não gastem mana nisso</li></ul>
<h4>ATAQUES</h4><ul><li><b>FÍSICO</b>Golpe comum, o mais fraco</li><li><b class="p">DEMONÍACO</b>Mais forte e rouba vida: ele cura parte do que vocês perderem</li><li><b class="r">ELEMENTAL</b>O mais forte e o que mais rouba vida. Aparece mais nos ranks altos</li><li><b>ONDA SOMBRIA</b>Fere os quatro heróis de uma vez, mais forte nos ranks altos</li></ul>
<h4>HABILIDADES</h4><ul><li><b>PREPARANDO</b>Aviso na tela: a rodada seguinte tem golpes 50% mais fortes. Defendam</li><li><b>TELEPORTE</b>Depois da 4ª pergunta ele some e ataca o herói mais fraco. Esquivar anula e deixa o boss atordoado (+25% de dano nele)</li><li><b>ESTOCADA</b>Fura Provocação e Proteção Específica. Só aparece quando uma delas está ativa</li></ul>
<h4>FÚRIA E FASE 2</h4><ul><li><b class="r">FÚRIA</b>Cada herói que erra rank S ou SS enche a barra. Acertar e defender ou esquivar à toa enche tudo de uma vez. Cheia, a Onda Sombria bate mais forte</li><li><b class="r">FASE 2</b>Com metade da vida o boss desperta: raios, Onda Sombria mais forte até o fim</li></ul>`},
  {n:'HRIMGAR', h:'Túmulo do Rei Gelado', b:`<p>O segundo guardião: Hrimgar, o Rei Gelado, um duelista com 600 de vida. Ele não rouba vida: faz muitos golpes pequenos em cada herói, e o dano vem por acúmulo (Frio e sangramento).</p>
<h4>FRAQUEZAS</h4><ul><li><b class="r">FOGO</b>A Maga causa 1,5x, queima o boss por 2 perguntas, ignora a Armadura de Gelo e descongela os aliados</li><li><b>IMUNE</b>Água não causa dano (só efeito visual). Ar e terra causam dano normal. O sagrado também é normal: a Clériga vira suporte</li></ul>
<h4>FASE 1: A ARMADURA</h4><ul><li><b>ARMADURA DE GELO</b>Corta 15% do dano que ele recebe (o fogo ignora). Cada herói leva 1 golpe por rodada</li></ul>
<h4>GOLPES E EFEITOS</h4><ul><li><b>CORTE</b>Dano puro</li><li><b class="p">GÉLIDO</b>Dano e +1 de Frio. Com 4 de Frio o herói congela: não age (ainda vota e responde) e leva +25% de dano. Congelado dura 1 pergunta na fase 1 e 2 na fase 2; depois ele fica 1 rodada imune. O Frio cai 1 por rodada sem golpe gélido</li><li><b class="r">SANGRENTO</b>Dano e sangramento (5 por acúmulo, até 3, por 3 rodadas, ignora defesa)</li><li><b>CRÍTICO</b>1,5x de dano, com aviso na tela</li><li><b>DEFESA</b>Vale por golpe: o Elmo Reforçado fica ótimo e o Escudo de Ferro só bloqueia um golpe</li></ul>
<h4>COMO LIMPAR</h4><ul><li><b>MAGA</b>Ataque de fogo no boss descongela todos e tira 1 de Frio dos aliados</li><li><b>CLÉRIGA</b>Luz Sagrada descongela e limpa o sangramento do herói escolhido. A Defesa Sagrada limpa o sangramento de quem usa. Erva e Elixir também limpam</li></ul>
<h4>HABILIDADES</h4><ul><li><b>PASSO GÉLIDO</b>Aviso no início da rodada: o ataque físico do Guerreiro e do Tanque erra muito. Magia, cajado e Buraco Negro sempre acertam. O Guerreiro pode defender ou Passar a Vez</li><li><b>MARCA DO DUELISTA</b>Marca um herói: na rodada seguinte quase todos os golpes vão nele. Provocação, Proteção Específica ou Esquiva</li><li><b>CONTRA-ATAQUE</b>Quem atacar com físico leva um golpe de volta. Ataquem com magia ou defendam</li><li><b>CORTE CONGELANTE</b>Onda de gelo em 2 heróis (+2 de Frio). O Escudo de Fogo da Maga ou a Esquiva anulam</li><li><b>TEMPESTADE DE QUATRO LÂMINAS</b>Só na fase 2, avisada uma rodada antes: 4 golpes em cada herói. Esquiva anula e atordoa o boss, Defesa do Tanque corta 75%, Provocação divide</li></ul>
<h4>ÍMPETO E FASE 2</h4><ul><li><b class="r">ÍMPETO</b>Mesmas regras da fúria: erros em rank S ou SS enchem a barra, acertar e defender ou esquivar à toa enche tudo. Cheia, ele entra em Frenesi: +1 golpe em cada herói e +15% de crítico na rodada</li><li><b class="r">FASE 2</b>Com metade da vida a armadura se despedaça: 2 golpes por herói, crítico e Passo Gélido mais frequentes, e ele perde a Armadura de Gelo</li></ul>`},
  {n:'DRAGÃO', lock:'COVIL DO DRAGÃO VERMELHO'},
  {n:'ABISMO', lock:'ABISMO CELESTIAL'},
  {n:'TEMPLO', lock:'TEMPLO DOS ANTIGOS'},
  {n:'RAINHA', lock:'PÂNTANO DA RAINHA ESPECTRAL'}
];
let gi = 0;
function renderBoss(el) {
  const g = GUARDS[gi];
  const row = GUARDS.map((x, i) => `<button type="button" class="chip gt${i === gi ? ' on' : ''}${x.lock ? ' lk' : ''}" data-i="${i}">${x.lock ? '? ' : ''}${x.n}</button>`).join('');
  const body = g.lock
    ? `<h3>${g.lock}</h3><div class="lockbox"><p><b class="r">BLOQUEADO</b></p><p>Derrote o guardião anterior na Jornada dos Heróis para descobrir as fraquezas, os ataques e as habilidades deste inimigo. Cada guardião luta de um jeito, então o que funciona contra um pode não funcionar contra o outro.</p></div>`
    : `<h3>${g.h}</h3>${g.b}`;
  el.innerHTML = `<div class="gtabs">${row}</div>${body}`;
  el.querySelectorAll('.gt').forEach(b => b.onclick = () => { gi = +b.dataset.i; renderBoss(el); el.scrollTop = 0; });
}
const PAGES = [
  {t:'OBJETIVO', h:'A Jornada dos Heróis', b:`<p>Seis guardiões dominam o reino, cada um com seus próprios ataques, fraquezas e habilidades. Vocês enfrentam um por vez, seguindo o mapa. Por enquanto estão liberados Malgorath, Lorde das Trevas, e Hrimgar, o Rei Gelado.</p><p>Cada classe (Maga, Guerreiro, Tanque e Clériga) é um grupo de até 7 jogadores. Dentro do grupo, a maioria dos votos decide tudo. Moedas, itens e votos são do grupo.</p><p>Derrubem o guardião antes que os quatro heróis caiam.</p>`},
  {t:'PERGUNTAS', h:'Perguntas e votação', b:`<p>Toda rodada começa com uma pergunta de Banco de Dados. O grupo vota em uma alternativa antes do relógio zerar.</p><ul><li><b>RANK C</b>25s para responder, 1 moeda</li><li><b>RANK B</b>30s, 2 moedas</li><li><b>RANK A</b>35s, 3 moedas</li><li><b class="g">RANK S</b>40s, 5 moedas</li><li><b class="g">RANK SS</b>45s, 8 moedas</li></ul><p>Acertar rende moedas. Acertar um rank S ou SS carrega o poder especial do herói. Errar nesses ranks enche a fúria do inimigo e deixa o ataque dele mais forte.</p>`},
  {t:'HERÓIS', h:'Os quatro heróis', b:`<p>Depois da pergunta, o grupo escolhe a ação do herói: atacar, defender, esquivar ou usar uma habilidade. A escolha também é por votação. Acertou a pergunta, o ataque acerta. Errou, o herói fica exposto.</p><ul><li><b>MAGA</b>Ataques de mana e de elementos: fogo, água, ar e terra. Cada inimigo tem fraqueza a um elemento diferente. Especial: Buraco Negro, dano direto enorme.</li><li><b class="r">GUERREIRO</b>O maior dano base. Pode passar a vez para dar um ataque extra a um aliado. Especial: Berserk, ataca até errando.</li><li><b class="g">TANQUE</b>A melhor defesa (corta 75%). Protege um aliado e deixa o inimigo desnorteado. Especial: Provocação, todo o dano vai nele.</li><li><b class="v">CLÉRIGA</b>Dano baixo, mas o Sagrado vale em dobro contra quem é fraco a ele. Especial: Luz Sagrada, que cura ou revive.</li></ul><p>Defender ou esquivar depois de acertar a pergunta desperdiça o ataque e enche a fúria do inimigo.</p>`},
  {t:'ITENS', h:'Mercador, mochila e arcas', b:`<p>Entre as perguntas o Mercador vende itens pelas moedas do grupo. A mochila tem 6 espaços e itens iguais empilham até 3. Toda batalha começa com a mochila vazia.</p><ul><li><b>TOQUE</b>Toque rápido num item da mochila para usar</li><li><b>SEGURAR</b>Segure o dedo num item para ler os detalhes</li><li><b class="p">RARO</b>Itens poderosos e permanentes que aparecem pouco</li><li><b class="g">LENDÁRIO</b>Os relógios dão tempo extra na pergunta (+5s ou +10s) e quase nunca aparecem</li></ul><p>Às vezes surge uma arca misteriosa. Ela pode trazer um item... ou uma armadilha.</p>`},
  {t:'GUARDIÕES', h:'Os seis guardiões', render: renderBoss},
  {t:'DICAS', h:'Dicas de sobrevivência', b:`<ul><li><b>TEMPO</b>Se o relógio zerar, o voto não conta. Combinem antes de votar</li><li><b>FRAQUEZA</b>Leiam o aviso do inimigo e usem o elemento certo. Dano errado é mana jogada fora</li><li><b>MANA</b>Habilidades fortes gastam mana e têm recarga. Ataque normal e defesa normal são de graça</li><li><b>DEFESA</b>Defendam na rodada de Preparando e esquivem do Teleporte. Fora disso, ataquem</li><li><b>CURA</b>Quem vampiriza cura mais quando vocês sofrem mais dano. Defesa e esquiva também negam a cura dele</li><li><b>ESPECIAL</b>Acertem perguntas S e SS para liberar os poderes, mas lembrem que errar nelas dói</li><li><b>EQUIPE</b>Quatro grupos jogam juntos. Cuidem uns dos outros</li></ul>`}
];
const how = $('#how'), tabs = $('#tabs'), hb = $('#hbody'); let pi = 0;
PAGES.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = p.t; b.onclick = () => go(i); tabs.appendChild(b); });
function go(i) { pi = Math.max(0, Math.min(PAGES.length - 1, i)); const p = PAGES[pi]; if (p.render) { gi = 0; p.render(hb); } else hb.innerHTML = `<h3>${p.h}</h3>${p.b}`; hb.scrollTop = 0;
  [...tabs.children].forEach((b, j) => b.classList.toggle('on', j === pi)); $('#pg').textContent = `${pi + 1}/${PAGES.length}`; $('#prev').disabled = pi === 0; $('#next').disabled = pi === PAGES.length - 1; }
$('#how-btn').onclick = () => { go(0); how.hidden = false; };
$('#hclose').onclick = () => { how.hidden = true; };
$('#prev').onclick = () => go(pi - 1); $('#next').onclick = () => go(pi + 1);
how.addEventListener('click', e => { if (e.target === how) how.hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape') how.hidden = true; });

// voltou da seleção de classe (botão voltar): a capa se reconstrói em blocos de brasa, sem zoom
{ let back = false; try { back = !!sessionStorage.getItem('bd1_cover_back'); sessionStorage.removeItem('bd1_cover_back'); } catch (e) {}
  if (back && window.PxT && !RM) PxT.reveal(.5, .78); else document.documentElement.classList.remove('rb'); }

// ---------- JOGAR: zoom nos heróis -> clarão -> a cena vira cinzas de pixels -> seleção reconstrói ----------
let busy = false;
const BS = 14;   // tamanho do "pixel" da dissolução (px da tela)
$('#play').onclick = async () => {
  if (busy) return; busy = true; try { sessionStorage.setItem('bd1_cover', '1'); } catch (e) {}
  const leave = () => { try { sessionStorage.setItem('bd1_rebuild', '1'); } catch (e) {} location.href = 'index.html'; };
  if (RM) { cv.classList.add('go'); setTimeout(leave, 300); return; }
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

addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}));
})();

// tela cheia: botão fixo na tela inicial + aviso uma única vez por aba (sessionStorage)
(() => {
  const btn = document.getElementById('fs-btn'), ask = document.getElementById('fs-ask'); if (!btn || !window.FS) return;
  const paint = () => { const on = FS.on(); btn.classList.toggle('on', on); btn.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Tela cheia'); };
  if (!FS.ok()) { btn.style.display = 'none'; return; }
  btn.onclick = () => { FS.toggle(); setTimeout(paint, 250); };
  FS.onChange(paint); paint();
  let asked = false; try { asked = sessionStorage.getItem('bd1_fs_ask') === '1'; } catch {}
  if (!asked && !FS.on()) setTimeout(() => { if (FS.on()) return; ask.hidden = false; try { sessionStorage.setItem('bd1_fs_ask', '1'); } catch {} }, 1400);
  document.getElementById('fs-yes').onclick = () => { ask.hidden = true; FS.enter().then(paint); };
  document.getElementById('fs-no').onclick = () => { ask.hidden = true; };
  ask.addEventListener('click', e => { if (e.target === ask) ask.hidden = true; });
})();
