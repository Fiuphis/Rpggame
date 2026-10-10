/* Tela de salas: lista salas públicas, cria sala (pública ou privada) e entra por código. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const G = [['mage', 'MAGO', '#4da3ff'], ['guerreiro', 'GUERREIRO', '#ff5a4d'], ['tank', 'TANQUE', '#cfd8ff'], ['cleriga', 'CLÉRIGA', '#ffd24d']], MAXG = 7;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let leaving = false, rooms = [], loading = false, timer = 0, toastT = 0, made = null;

function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function netState(s, t) { const e = $('#net'); e.dataset.s = s; e.querySelector('b').textContent = t; }

// ---------- lista ----------
function card(r) {
  const c = r.counts || {}, tot = r.players || 0, full = G.every(([k]) => (c[k] || 0) >= MAXG);
  const nm = r.name ? esc(r.name) : 'SALA ' + esc(String(r.id).replace(/-/g, '').slice(0, 4).toUpperCase());
  const rows = G.map(([k, , col]) => { const n = Math.min(MAXG, c[k] || 0);
    return `<div class="gr${n >= MAXG ? ' full' : ''}" style="--c:${col}"><img class="gi" src="salas/ic_${k}.png" alt=""><span class="pips">${Array.from({ length: MAXG }, (_, i) => `<i${i < n ? ' class="on"' : ''}></i>`).join('')}</span><span class="n">${n}/${MAXG}</span></div>`; }).join('');
  const bt = r.status === 'battle';
  return `<div class="rm${full ? ' full' : ''}" role="listitem" data-id="${esc(r.id)}">
    <div class="r1"><img class="ico" src="salas/ic_unlock.png" alt=""><span class="nm">${nm}</span><span class="bd${bt ? ' bt' : ''}">${bt ? 'EM BATALHA' : 'AGUARDANDO'}</span></div>
    <div class="grs">${rows}</div>
    <div class="r3"><span class="inf">GUARDIÃO <b>${(r.boss_idx || 0) + 1}/6</b><br><b>${tot}</b> ${tot === 1 ? 'JOGADOR' : 'JOGADORES'}</span><button class="chip blue go" type="button"${full ? ' disabled' : ''}>${full ? 'CHEIA' : 'ENTRAR'}</button></div>
  </div>`;
}
function paint() {
  const ls = $('#ls');
  if (!rooms.length) { ls.innerHTML = `<div class="empty"><b>NENHUMA SALA ABERTA</b>Ninguém criou uma sala pública agora.<br>Crie a primeira e chame a turma.</div>`; return; }
  ls.innerHTML = rooms.map(card).join('');
}
async function load(manual) {
  if (loading) return; loading = true; const rf = $('#rf'); if (manual) rf.disabled = true;
  try { await NET.ready(); rooms = await NET.listRooms(); netState(NET.MOCK ? 'mock' : 'on', NET.MOCK ? 'SIMULADO' : 'ONLINE'); paint(); }
  catch (e) { netState('off', 'SEM SERVIDOR'); if (!rooms.length) $('#ls').innerHTML = `<div class="empty"><b>SEM CONEXÃO</b>${esc(NET.msg(e))}<br>Você ainda pode jogar sem sala.<button id="retry" class="chip blue" type="button">TENTAR DE NOVO</button></div>`; if (manual) toast(NET.msg(e)); }
  finally { loading = false; rf.disabled = false; }
}
$('#ls').addEventListener('click', e => {
  if (e.target.id === 'retry') { netState('con', 'CONECTANDO'); load(true); return; }
  const b = e.target.closest('.go'); if (!b || b.disabled) return; const id = b.closest('.rm').dataset.id; b.disabled = true;
  NET.joinRoom(id).then(r => { try { localStorage.removeItem('bd1_auto'); } catch (e) {} enter(r); }, err => { b.disabled = false; toast(NET.msg(err)); load(); });
});
$('#rf').onclick = () => load(true);
function poll() { clearInterval(timer); timer = setInterval(() => { if (!document.hidden && !leaving && $('#ov-mk').hidden && $('#ov-cd').hidden) load(); }, 6000); }

// ---------- janelas ----------
function open(id) { const o = $(id); o.hidden = false; const f = o.querySelector('input'); if (f) setTimeout(() => f.focus(), 50); }
function close(id) { $(id).hidden = true; }
let pub = true;
function setPub(v) { pub = v; document.querySelectorAll('#seg .chip').forEach(b => b.classList.toggle('on', (b.dataset.pub === '1') === v)); $('#mk-h').textContent = v ? 'Aparece na lista para qualquer jogador entrar.' : 'Fica escondida da lista. Só entra quem tiver o código.'; }
$('#seg').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) setPub(b.dataset.pub === '1'); });
$('#mk').onclick = () => { setPub(true); setTest(false); setTm('normal'); $('#nm').value = ''; $('#mk-e').textContent = ''; made = null; open('#ov-mk'); };
$('#mk-no').onclick = () => close('#ov-mk');
let tmode = 'normal';
const TM = { fast: ['RÁPIDO', 'Tempo rápido: 70% do normal (17 s no rank C, 32 s no SS).'], normal: ['NORMAL', 'Tempo normal: de 25 s (rank C) a 45 s (rank SS).'], long: ['LONGO', 'Tempo longo: 150% do normal (38 s no rank C, 68 s no SS).'] };
function setTm(v) { tmode = v; document.querySelectorAll('#seg-tm .chip').forEach(b => b.classList.toggle('on', b.dataset.tm === v)); $('#tm-h').textContent = TM[v][1]; }
$('#seg-tm').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) setTm(b.dataset.tm); });
let testOn = false;
function setTest(v) { testOn = v; const b = $('#tt'); b.classList.toggle('on', v); b.setAttribute('aria-pressed', v); b.textContent = 'MODO TESTE: ' + (v ? 'LIGADO' : 'DESLIGADO'); }
$('#tt').onclick = () => setTest(!testOn);
$('#mk-ok').onclick = async () => {
  const b = $('#mk-ok'); b.disabled = true; $('#mk-e').textContent = '';
  try { await NET.ready(); made = await NET.createRoom(pub, $('#nm').value.trim());
    if (tmode !== 'normal' && !NET.MOCK) { try { await NET.rpc('set_room_config', { p_room: made.id, p_time: tmode }); } catch (e) { toast(NET.msg(e)); } }
    made.tmode = tmode;
    try { testOn ? localStorage.setItem('bd1_auto', '1') : localStorage.removeItem('bd1_auto'); } catch (e) {}   // o modo teste é uma regra da sala, definida só por quem a cria
    close('#ov-mk'); lobby(made, true); }
  catch (e) { $('#mk-e').textContent = NET.msg(e); }
  finally { b.disabled = false; }
};
$('#cd').onclick = () => { $('#cdv').value = ''; $('#cd-e').textContent = ''; open('#ov-cd'); };
$('#cd-no').onclick = () => close('#ov-cd');
$('#cdv').addEventListener('input', e => { e.target.value = NET.norm(e.target.value); $('#cd-e').textContent = ''; });
async function byCode() {
  const code = NET.norm($('#cdv').value); if (code.length !== 6) { $('#cd-e').textContent = 'Digite os 6 caracteres do código.'; return; }
  const b = $('#cd-ok'); b.disabled = true;
  try { await NET.ready(); const r = await NET.joinRoom(null, code); try { localStorage.removeItem('bd1_auto'); } catch (e) {} enter(r); } catch (e) { $('#cd-e').textContent = NET.msg(e); } finally { b.disabled = false; }
}
$('#cd-ok').onclick = byCode; $('#cdv').addEventListener('keydown', e => { if (e.key === 'Enter') byCode(); });
document.querySelectorAll('.ov').forEach(o => o.addEventListener('pointerdown', e => { if (e.target === o && o.id !== 'ov-mk' && o.id !== 'ov-lb') o.hidden = true; }));

// ---------- saídas ----------
// voltar para uma partida em andamento (sinal perdido, aba fechada): o grupo continua sem a pessoa e ela volta ao mesmo ponto
async function resume(r) {
  try {
    if (NET.MOCK || !r || !r.id || !window.MATCH) return false;
    const s = await MATCH.state(r.id);
    if (!(s.match && s.match.status === 'playing' && s.me)) return false;
    const key = 'bd1_player_id'; let id = localStorage.getItem(key); if (!id) { id = 'p' + Math.random().toString(36).slice(2, 10); localStorage.setItem(key, id); }
    const d = { mage: [], guerreiro: [], tank: [], cleriga: [] }; d[s.me] = [id];
    localStorage.setItem('bd1_lobby', JSON.stringify(d)); localStorage.setItem('bd1_lobby_seeded', '1');
    sessionStorage.setItem('bd1_boss', String(s.match.boss || 0)); sessionStorage.setItem('bd1_gate', '1');
    leaving = true; clearInterval(timer); document.querySelectorAll('.ov').forEach(o => o.hidden = true);
    const go = () => { location.href = 'game.html' + location.search.replace(/^\?$/, ''); };
    if (window.Gate && !reduce()) Gate.close().then(go); else go();
    return true;
  } catch (e) { return false; }
}
// sala online: a mesma tela mostra quantas pessoas estão dentro; o criador decide quando seguir para a escolha de classe
let lbT = 0, lbRoom = null, lbOwner = false;
function lobby(r, owner) {
  lbRoom = r; lbOwner = !!owner; clearInterval(timer);
  $('#lb-t').textContent = r.name ? r.name : 'SALA'; $('#lb-c').textContent = r.code || '------';
  $('#lb-h').textContent = r.is_public === false || r.pub === false ? 'Sala privada. Passe o código para os colegas entrarem.' : 'Sala pública. O código também serve para chamar amigos.';
  $('#lb-n').textContent = '1 JOGADOR'; $('#lb-l').innerHTML = '';
  if (r.tmode && r.tmode !== 'normal') $('#lb-h').textContent += ' Tempo ' + TM[r.tmode][0].toLowerCase() + '.'; $('#lb-go').hidden = !lbOwner; $('#lb-go').disabled = false; $('#lb-m').textContent = lbOwner ? 'Quando todos entrarem, toque em continuar. Depois disso ninguém mais entra.' : 'Aguardando o criador continuar.';
  document.querySelectorAll('.ov').forEach(o => o.hidden = true); open('#ov-lb');
  const tick = async () => {
    if (leaving) return;
    try { const l = await MATCH.lobby(r.id); if (leaving) return;
      if (lbOwner !== !!l.owner) { lbOwner = !!l.owner; $('#lb-go').hidden = !lbOwner; }
      $('#lb-n').textContent = l.total + (l.total === 1 ? ' JOGADOR' : ' JOGADORES');
      $('#lb-l').innerHTML = (l.members || []).map((m, i) => `<div class="lbp${m.me ? ' me' : ''}"><i></i><span>${m.name ? esc(m.name) : 'JOGADOR ' + (i + 1)}</span>${m.owner ? '<u>CRIADOR</u>' : ''}</div>`).join('');
      if (l.stage !== 'gather') { proceed(l); return; } } catch (e) { $('#lb-m').textContent = NET.msg(e); }
  };
  tick(); lbT = setInterval(tick, 1500);
}
function proceed(l) {
  if (leaving) return; leaving = true; clearInterval(lbT);
  try { sessionStorage.setItem('bd1_gate', '1'); sessionStorage.setItem('bd1_cover', '1'); } catch (e) {}
  const dest = 'index.html';
  if (false) { try { const id = localStorage.getItem('bd1_player_id') || ('p' + Math.random().toString(36).slice(2, 10)); localStorage.setItem('bd1_player_id', id); const d = { mage: [], guerreiro: [], tank: [], cleriga: [] }; d[l.me] = [id]; localStorage.setItem('bd1_lobby', JSON.stringify(d)); localStorage.setItem('bd1_lobby_seeded', '1'); } catch (e) {} }
  const go = () => { location.href = dest + location.search; };
  if (window.Gate && !reduce()) Gate.close().then(go); else go();
}
$('#lb-go').onclick = async () => { const b = $('#lb-go'); b.disabled = true; try { await MATCH.stage(lbRoom.id, 'pick'); proceed({ stage: 'pick', me: null }); } catch (e) { b.disabled = false; $('#lb-m').textContent = NET.msg(e); } };
$('#lb-cp').onclick = async () => { const c = lbRoom && lbRoom.code; if (!c) return; try { await navigator.clipboard.writeText(c); toast('Código copiado.'); } catch { toast('Anote o código: ' + c); } };
$('#lb-out').onclick = () => { clearInterval(lbT); const id = lbRoom && lbRoom.id; lbRoom = null; if (id) NET.leave(id); $('#ov-lb').hidden = true; load(); poll(); };
async function enter(r) {
  if (leaving || !r) return;
  if (r.id && await resume(r)) return;
  if (leaving) return;
  if (r.id && !NET.MOCK && window.MATCH) { lobby(r, !!(r.created_by && false) || r === made); return; }
  leaving = true; clearInterval(timer);
  document.querySelectorAll('.ov').forEach(o => o.hidden = true);
  try { sessionStorage.setItem('bd1_gate', '1'); sessionStorage.setItem('bd1_cover', '1'); } catch (e) {}
  if (window.Gate && !reduce()) Gate.close().then(() => { location.href = 'index.html'; }); else location.href = 'index.html';
}
$('#solo').onclick = () => { try { localStorage.removeItem('bd1_auto'); } catch (e) {} NET.setRoom(null); enter({}); };
$('#home').onclick = () => {
  if (leaving) return; leaving = true;
  try { sessionStorage.setItem('bd1_cover_back', '1'); sessionStorage.removeItem('bd1_rebuild'); } catch (e) {}
  let acc = false; try { acc = !!sessionStorage.getItem('bd1_acc'); } catch (e) {}
  if (acc) { try { sessionStorage.setItem('bd1_rebuild', '1'); sessionStorage.removeItem('bd1_cover_back'); } catch (e) {} }
  const go = () => { location.href = acc ? 'saves.html' : 'cover.html'; };
  if (window.PxT && !reduce()) PxT.conceal(.5, .2).then(go); else go();
};
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
try { const lr = sessionStorage.getItem('bd1_leave_room'); sessionStorage.removeItem('bd1_leave_room'); const cur = NET.room();
  if (lr || cur) { const id = lr || cur.id; NET.leave(id); } } catch (e) {}
try { if (sessionStorage.getItem('bd1_acc')) $('#home').innerHTML = '&#9666; SAVES'; } catch (e) {}
// botão voltar do aparelho = botão do canto (SAVES ou INÍCIO)
try { history.pushState({ sl: 1 }, ''); } catch (e) {}
addEventListener('popstate', () => { if (leaving) { try { history.pushState({ sl: 1 }, ''); } catch (e) {} return; } $('#home').click(); });
if (window.Gate) Gate.arrive();
load(); poll();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }));
})();
