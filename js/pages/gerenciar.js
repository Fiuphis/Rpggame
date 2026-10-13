/* Gerenciar sala (criador e adm): ajustes da sala, expulsar com bloqueio, perdoar, passar o comando. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const Q = new URLSearchParams(location.search), room = Q.get('room') || '', from = Q.get('from') === 'espectar' ? 'espectar.html' : 'salas.html';
const rest = (() => { const p = new URLSearchParams(location.search); p.delete('room'); p.delete('from'); return p.toString(); })();
const NM = { mage: 'MAGA', guerreiro: 'GUERREIRO', tank: 'TANQUE', cleriga: 'CLÉRIGA' }, TM = { fast: 'RÁPIDO', normal: 'NORMAL', long: 'LONGO' };
let info = null, timer = 0, toastT = 0, armed = '', armT = 0, typing = false, leaving = false;
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function net(s, t) { const e = $('#net'); e.dataset.s = s; e.querySelector('b').textContent = t; }
$('#back').onclick = () => { if (leaving) return; leaving = true; clearInterval(timer); location.href = from + (rest ? '?' + rest : ''); };
function paint() {
  if (!info) return; const gm = $('#gm'), own = !!info.owner;
  if (typing) return;   // nao redesenha enquanto o criador digita o nome
  const pls = (info.members || []).filter(m => !m.me).map(m => `<div class="pl${m.active ? '' : ' off'}" data-pid="${esc(m.pid)}"><div class="nm"><i></i><span>${m.name ? esc(m.name.toUpperCase()) : 'JOGADOR'}${m.grp ? ' · ' + (NM[m.grp] || '') : ''}</span>${m.owner ? '<u>CRIADOR</u>' : ''}</div><div class="ac"><button type="button" class="chip red" data-a="kick">EXPULSAR</button>${own ? '<button type="button" class="chip" data-a="transfer">PASSAR COMANDO</button>' : ''}</div></div>`).join('');
  const bans = (info.bans || []).map(b => `<div class="pl" data-pid="${esc(b.pid)}"><div class="nm"><span>${b.name ? esc(b.name.toUpperCase()) : 'JOGADOR'}</span></div><div class="ac"><button type="button" class="chip" data-a="forgive">PERDOAR</button></div></div>`).join('');
  gm.innerHTML = (own ? `<div class="bx"><h2>SALA</h2>
    <div class="row"><div class="fld"><input id="nm" maxlength="24" placeholder="NOME DA SALA" value="${esc(info.name || '')}" autocomplete="off" autocapitalize="characters" spellcheck="false"></div><button type="button" class="chip blue" data-a="rename">SALVAR</button></div>
    <div class="row"><button type="button" class="chip wide${info.locked ? ' on' : ''}" data-a="lock" style="flex:1">${info.locked ? 'TRANCADA: TOQUE PARA ABRIR' : 'TRANCAR A SALA'}</button></div>
    <p class="hint">Trancada: ninguém novo entra, mesmo com o código. Quem já está dentro pode voltar.</p>
    <div class="row"><button type="button" class="chip wide${info.public ? ' on' : ''}" data-a="public" style="flex:1">${info.public ? 'PÚBLICA: TOQUE PARA TORNAR PRIVADA' : 'PRIVADA: TOQUE PARA TORNAR PÚBLICA'}</button></div>
    <h2>TEMPO PARA RESPONDER</h2>
    <div class="seg3">${['fast', 'normal', 'long'].map(k => `<button type="button" class="chip${info.time_mode === k ? ' on' : ''}" data-a="time" data-m="${k}"${info.playing ? ' disabled' : ''}>${TM[k]}</button>`).join('')}</div>
    ${info.playing ? '<p class="hint">Só dá para mudar o tempo entre partidas.</p>' : ''}</div>` : '')
    + `<div class="bx"><h2>JOGADORES</h2>${pls || '<div class="empty">Só você na sala.</div>'}</div>`
    + `<div class="bx"><h2>EXPULSOS</h2>${bans || '<div class="empty">Ninguém foi expulso.</div>'}<p class="hint">Quem é expulso não volta a esta sala até ser perdoado.</p></div>`;
  const nm = $('#nm'); if (nm) { nm.onfocus = () => { typing = true; }; nm.onblur = () => { typing = false; }; }
}
async function load(manual) {
  try { await NET.ready(); info = await NET.rpc('owner_room_info', { p_room: room }); net('on', 'ONLINE'); $('#sub').textContent = info.name ? info.name : 'Ajustes e jogadores da sala'; paint(); }
  catch (e) { net('off', 'SEM SERVIDOR'); if (manual || !info) toast(NET.msg(e)); }
}
$('#gm').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return; const a = b.dataset.a, pid = b.closest('.pl') && b.closest('.pl').dataset.pid;
  if (a === 'kick' || a === 'transfer') { const key = a + pid; if (armed !== key || Date.now() - armT > 4000) { armed = key; armT = Date.now(); const o = b.textContent; b.classList.add('sure'); b.textContent = 'CONFIRMAR?'; setTimeout(() => { b.textContent = o; b.classList.remove('sure'); }, 4000); return; } armed = ''; }
  let arg = {}; if (pid) arg.pid = pid;
  if (a === 'rename') arg = { name: ($('#nm').value || '').trim() };
  else if (a === 'lock') arg = { on: !info.locked };
  else if (a === 'public') arg = { on: !info.public };
  else if (a === 'time') arg = { mode: b.dataset.m };
  b.disabled = true;
  try {
    if (!info.owner && (a === 'kick' || a === 'forgive')) await NET.rpc('admin_act', { p_room: room, p_action: a, p_arg: arg });
    else await NET.rpc('owner_power', { p_room: room, p_action: a, p_arg: arg });
    typing = false; if (a === 'rename') toast('Nome salvo.'); if (a === 'transfer') toast('Comando passado.');
    await load(); if (a === 'transfer') { leaving = true; location.href = from + (rest ? '?' + rest : ''); }
  } catch (x) { toast(NET.msg(x)); }
  b.disabled = false;
});
(async () => { if (!room) { location.replace(from); return; } await load(true); timer = setInterval(() => { if (!document.hidden) load(); }, 3000); })();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }));
})();
