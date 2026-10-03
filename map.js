/* Jornada dos Heróis: mapa de progresso. Concluído = verde, próximo = azul (selecionável por voto), o resto cinza com cadeado. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const GROUPS = {mage:'MAGA', knight:'GUERREIRO', tank:'TANQUE', assassin:'CLÉRIGA'};
const P = new URLSearchParams(location.search), TEST = LOBBY.testMode;
const grp = (TEST && GROUPS[P.get('grupo')]) ? P.get('grupo') : LOBBY.myGroup();
if (!grp) { location.replace('index.html'); return; }
const BOSSES = {   // ordem da jornada: 0 → 1 → 2 → 5 → 4 → 3 (ids = regiões na arte)
  0:{name:'CASTELO DO LORDE DAS TREVAS', play:true,  sub:'Lorde das Trevas · o primeiro guardião'},
  1:{name:'TÚMULO DO REI GELADO',        play:false, sub:'Em breve'},
  2:{name:'COVIL DO DRAGÃO VERMELHO',    play:false, sub:'Em breve'},
  5:{name:'ABISMO CELESTIAL',            play:false, sub:'Em breve'},
  4:{name:'TEMPLO DOS ANTIGOS',          play:false, sub:'Em breve'},
  3:{name:'PÂNTANO DA RAINHA ESPECTRAL', play:false, sub:'Em breve'}};
const ORDER = [0, 1, 2, 5, 4, 3], KEY = 'bd1_progress';
const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.done)) return d.done; } catch {} return []; };
if (P.get('resetmapa')) localStorage.removeItem(KEY);
let done = load();
const stateOf = (done, id) => done.includes(id) ? 'done' : (ORDER.find(b => !done.includes(b)) === id ? 'next' : 'locked');
let meta = null, selected = null, yes = 0, mine = false, bots = [];
const pct = (v, t) => (v / t * 100) + '%';

fetch('map/meta.json').then(r => r.json()).then(m => { meta = m; build(); });
function build(){
  const W = meta.w, H = meta.h, g = $('#grays'), n = $('#nodes');
  for (const id in meta.regions) { const [x0, y0, x1, y1] = meta.regions[id]; const im = new Image(); im.className = 'gray'; im.id = 'gray' + id; im.src = `map/gray${id}.webp`; im.alt = '';
    im.style.cssText = `left:${pct(x0, W)};top:${pct(y0, H)};width:${pct(x1 - x0, W)};height:${pct(y1 - y0, H)}`; g.appendChild(im); }
  const S = meta.sz, HL = meta.halo;
  for (const id in meta.nodes) {
    const {x, y} = meta.nodes[id];
    if (id === '0' || id === '1') { const h = new Image(); h.className = 'halo'; h.id = 'halo' + id; h.alt = ''; h.src = id === '0' ? 'map/halo0_blue.webp' : 'map/halo1_green.webp';
      h.style.cssText = `left:${pct(x, W)};top:${pct(y, H)};width:${pct(HL, W)};opacity:0`; n.appendChild(h); }
    const ic = new Image(); ic.className = 'ic'; ic.id = 'ic' + id; ic.alt = ''; ic.style.cssText = `left:${pct(x, W)};top:${pct(y, H)};width:${pct(S, W)}`; n.appendChild(ic);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'node'; b.id = 'nd' + id; b.setAttribute('aria-label', BOSSES[id].name);
    b.style.cssText = `left:${pct(x, W)};top:${pct(y, H)};width:${pct(S * 1.5, W)};aspect-ratio:1`; b.onclick = () => select(+id); n.appendChild(b);
  }
  // se acabou de vencer um boss: mostra o estado anterior e anima a virada
  const won = sessionStorage.getItem('bd1_justwon'); sessionStorage.removeItem('bd1_justwon');
  const before = won !== null && done.includes(+won) ? done.filter(d => d !== +won) : done;
  paint(before, true);
  $('#map').classList.add('intro');
  requestAnimationFrame(() => requestAnimationFrame(() => $('#veil').classList.add('out')));
  if (before !== done) setTimeout(() => paint(done, false), 3000);
}
function paint(dn, instant){
  for (const id in meta.nodes) {
    const st = stateOf(dn, +id), ic = $('#ic' + id), gr = $('#gray' + id), nd = $('#nd' + id);
    ic.src = st === 'done' ? 'map/ic_done.webp' : st === 'next' ? 'map/ic_next.webp' : 'map/ic_lock.webp'; ic.className = 'ic ' + st;
    gr.classList.toggle('off', st !== 'locked');
    nd.classList.toggle('ok', (st === 'next' || st === 'done') && BOSSES[id].play);
    const h = $('#halo' + id); if (h) h.style.opacity = (id === '0' && st === 'next') || (id === '1' && st === 'done') ? 1 : 0;
    if (instant) { gr.style.transition = 'none'; void gr.offsetWidth; gr.style.transition = ''; }
  }
}
// reiniciar progresso (botão perto da bússola)
$('#reset').onclick = () => { $('#confirm').hidden = false; };
$('#c-no').onclick = () => { $('#confirm').hidden = true; };
$('#c-yes').onclick = () => { localStorage.removeItem(KEY); sessionStorage.removeItem('bd1_justwon'); done = []; $('#confirm').hidden = true; deselect(); paint(done, false); };
// voltar = trocar de grupo (o progresso fica salvo no aparelho)
$('#back').addEventListener('click', () => { LOBBY.leave(); });
function voters(){ return Math.max(1, LOBBY.counts()[grp] || 0); }
function deselect(){ selected = null; bots.forEach(clearTimeout); bots = []; yes = 0; mine = false; $('#panel').hidden = true; document.querySelectorAll('.node').forEach(e => e.classList.remove('sel')); }
function select(id){
  if (selected === id) return deselect();   // tocar de novo tira a seleção
  const st = stateOf(done, id), B = BOSSES[id];
  selected = id; bots.forEach(clearTimeout); bots = []; yes = 0; mine = false;
  document.querySelectorAll('.node').forEach(e => e.classList.toggle('sel', e.id === 'nd' + id));
  $('#panel').hidden = false; $('#p-title').textContent = B.name;
  const go = $('#p-go'); const n = voters(), need = Math.floor(n / 2) + 1;
  if ((st === 'next' || st === 'done') && B.play) {
    const again = st === 'done'; $('#p-sub').textContent = (again ? 'Concluído · jogar de novo com outro grupo ou o mesmo' : B.sub) + ' · o grupo vota para entrar'; go.disabled = false; go.className = 'p-go'; go.innerHTML = `${again ? 'REJOGAR' : 'ENTRAR'} <b>0/${need}</b>`;
    go.onclick = () => { mine = !mine; yes += mine ? 1 : -1; upd(need); if (yes >= need) enter(); };
    if (TEST) for (let i = 0; i < n - 1; i++) bots.push(setTimeout(() => { if (selected !== id) return; if (Math.random() < .6) { yes++; upd(need); if (yes >= need) enter(); } }, 1200 + i * 800));
  } else { $('#p-sub').textContent = st === 'done' ? 'Concluído · este guardião já foi derrotado' : st === 'next' ? 'Em breve' : 'Bloqueado · derrote o guardião anterior'; go.disabled = true; go.innerHTML = 'INDISPONÍVEL'; go.onclick = null; }
}
function upd(need){ const go = $('#p-go'); go.innerHTML = `${stateOf(done, selected) === 'done' ? 'REJOGAR' : 'ENTRAR'} <b>${yes}/${need}</b>`; go.classList.toggle('selected', mine); }
function enter(){
  bots.forEach(clearTimeout); const v = $('#veil'); v.classList.remove('out'); $('#map').style.transition = 'transform 1.2s ease-in'; $('#map').style.transform = 'scale(1.5)';
  setTimeout(() => { location.href = 'game.html' + location.search; }, 1300);
}
})();
