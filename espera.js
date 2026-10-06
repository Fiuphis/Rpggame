/* Sala de espera online: mostra quem entrou em cada classe; o criador da sala escolhe o guardião e inicia a partida.
   Os demais entram no jogo sozinhos assim que a partida comeca. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const G = [['mage', 'MAGO', '#4da3ff'], ['guerreiro', 'GUERREIRO', '#ff5a4d'], ['tank', 'TANQUE', '#cfd8ff'], ['cleriga', 'CLÉRIGA', '#ffd24d']], MAXG = 7;
const BOSSES = [[0, 'CASTELO DE MALGORATH'], [1, 'TÚMULO DO REI GELADO']];
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const room = NET.room();
let leaving = false, boss = 0, last = null, toastT = 0, watcher = null, starting = false, bossInit = false;

function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function netState(s, t) { const e = $('#net'); e.dataset.s = s; e.querySelector('b').textContent = t; }
if (!room) { location.replace('salas.html'); return; }

function paint(s) {
  last = s; if (!leaving) netState('on', 'ONLINE');
  const rm = s.room || {}, ms = s.members || [], me = s.me;
  $('#rn').textContent = rm.name ? rm.name : 'SALA';
  $('#rc').textContent = 'CÓDIGO ' + (rm.code || room.code || '') + ' · ' + ms.length + (ms.length === 1 ? ' JOGADOR' : ' JOGADORES');
  let n = 0;
  $('#wl').innerHTML = G.map(([k, nm, col]) => {
    const l = ms.filter(m => m.grp === k);
    const rows = l.map(m => { n++; const name = m.name ? esc(m.name) : 'JOGADOR ' + (ms.indexOf(m) + 1);
      return `<div class="pn${m.active ? '' : ' off'}${m.me ? ' me' : ''}"><i></i><span>${name}</span>${m.owner ? '<u>CRIADOR</u>' : ''}</div>`; }).join('');
    return `<div class="wc${me === k ? ' me' : ''}" style="--c:${col}"><div class="wh"><img src="salas/ic_${k}.png" alt=""><b>${nm}</b><em>${l.length}/${MAXG}</em></div><div class="pl">${rows || '<div class="pe">Ninguém ainda</div>'}</div></div>`;
  }).join('');

  const owner = !!rm.owner, done = (rm.progress && rm.progress.done) || [];
  const playing = s.match && s.match.status === 'playing';
  if (playing && me) { goGame(s.match.boss); return; }
  const bb = $('#bb'); bb.hidden = !owner;
  if (owner) {
    if (!bossInit) { bossInit = true; boss = done.includes(0) ? 1 : 0; }
    $('#bs').innerHTML = BOSSES.map(([i, t]) => `<button type="button" class="chip${i === boss ? ' on' : ''}" data-b="${i}">${t}${done.includes(i) ? '<br>CONCLUÍDO' : ''}</button>`).join('');
  }
  const go = $('#go'), msg = $('#msg');
  go.hidden = !owner;
  if (!me) { msg.textContent = playing ? 'A partida já começou. Você não escolheu classe a tempo; aguarde o fim dela.' : 'Escolha uma classe para participar.'; go.disabled = true; return; }
  if (playing) { msg.textContent = 'A partida já começou.'; go.disabled = true; return; }
  if (owner) { go.disabled = starting || n < 1; msg.textContent = n < 2 ? 'Você pode iniciar sozinho; grupos vazios serão simulados.' : 'Quando todos estiverem prontos, inicie a partida. Grupos vazios serão simulados.'; }
  else msg.textContent = 'Aguardando o criador da sala iniciar a partida.';
}
$('#bs').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; boss = +b.dataset.b; if (last) paint(last); });
$('#go').onclick = async () => {
  if (starting) return; starting = true; $('#go').disabled = true;
  try { await MATCH.start(room.id, boss); watcher && watcher.refresh(); }
  catch (e) { starting = false; $('#go').disabled = false; toast(NET.msg(e)); }
};
function goGame(b) {
  if (leaving) return; leaving = true; watcher && watcher.stop();
  try { sessionStorage.setItem('bd1_boss', String(b || 0)); sessionStorage.setItem('bd1_gate', '1'); } catch (e) {}
  document.body.classList.add('leaving');
  const go = () => { location.href = 'game.html' + location.search; };
  if (window.Gate && !reduce()) Gate.close().then(go); else go();
}
$('#back').onclick = () => {
  if (leaving) return; leaving = true; watcher && watcher.stop();
  try { sessionStorage.setItem('bd1_leave_room', room.id); } catch (e) {}
  try { sessionStorage.setItem('bd1_gate', '1'); } catch (e) {}
  const go = () => { location.href = 'salas.html'; };
  if (window.Gate && !reduce()) Gate.close().then(go); else go();
};
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
try { history.pushState({ es: 1 }, ''); } catch (e) {}
addEventListener('popstate', () => { if (leaving) { try { history.pushState({ es: 1 }, ''); } catch (e) {} return; } $('#back').click(); });
if (window.Gate) Gate.arrive();
NET.ready().then(() => {
  netState(NET.MOCK ? 'mock' : 'on', NET.MOCK ? 'SIMULADO' : 'ONLINE');
  watcher = MATCH.watch(room.id, paint, { onError: e => netState('off', 'SEM SERVIDOR') });
}).catch(() => netState('off', 'SEM SERVIDOR'));
})();
