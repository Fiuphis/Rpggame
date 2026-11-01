/* Espectar (so adm): escolhe uma sala (inclusive privada) e um jogador; abre a tela de batalha dele so para ler. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NM = { mage: 'MAGA', guerreiro: 'GUERREIRO', tank: 'TANQUE', cleriga: 'CLÉRIGA' };
let rooms = [], loading = false, leaving = false, timer = 0, toastT = 0;
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function net(s, t) { const e = $('#net'); e.dataset.s = s; e.querySelector('b').textContent = t; }
const DFN = { easy: 'FÁCIL', medium: 'MÉDIO', hard: 'DIFÍCIL' }, TMN = { fast: 'RÁPIDO', normal: 'NORMAL', long: 'LONGO' };
function dur(s) { s = Math.max(0, s | 0); return s < 60 ? s + ' s' : s < 3600 ? Math.floor(s / 60) + ' min' : Math.floor(s / 3600) + ' h ' + Math.floor(s % 3600 / 60) + ' min'; }
// saude da sala: rodada, tempo parada, ausentes, pausa, tranca, dificuldade e tempo; parada ha mais de 2 min em batalha fica em alerta
function health(r) {
  const ps = r.players || [], away = ps.filter(p => !p.active).length, stuck = r.playing && !r.paused && (r.idle || 0) > 120;
  const parts = [];
  if (r.playing) parts.push('RODADA <b>' + (r.round || 1) + '</b>');
  parts.push('ATIVIDADE HÁ <b' + (stuck ? ' style="color:#ff8a8a"' : '') + '>' + dur(r.idle || 0) + '</b>');
  if (ps.length) parts.push('AUSENTES <b' + (away ? ' style="color:#ffd34d"' : '') + '>' + away + '/' + ps.length + '</b>');
  if (r.paused) parts.push('<b style="color:#ffd34d">PAUSADA</b>');
  if (r.locked) parts.push('<b>TRANCADA</b>');
  parts.push((DFN[r.difficulty] || 'DIFÍCIL') + ' · TEMPO ' + (TMN[r.time_mode] || 'NORMAL'));
  if (r.owner) parts.push('CRIADOR <b>' + esc(String(r.owner).toUpperCase()) + '</b>');
  return '<div class="meta">' + parts.join(' · ') + (stuck ? ' · <b style="color:#ff8a8a">POSSÍVEL TRAVA</b>' : '') + '</div>';
}
function card(r) {
  const nm = r.name ? esc(r.name) : 'SALA ' + esc(String(r.id).replace(/-/g, '').slice(0, 4).toUpperCase());
  const bt = !!r.playing, ps = r.players || [];
  const pl = ps.length ? ps.map(p => `<button type="button" class="pb${p.active ? '' : ' off'}" data-g="${esc(p.grp)}"${bt ? '' : ' disabled'}><img src="assets/salas/ic_${esc(p.grp)}.png" alt=""><span>${esc((p.name || 'SEM CONTA').toUpperCase())}</span><i></i></button>`).join('') : '<div class="meta">Sem jogadores.</div>';
  return `<div class="rm" role="listitem" data-id="${esc(r.id)}">
    <div class="r1"><img class="ico" src="assets/salas/ic_${r.public ? 'unlock' : 'lock'}.png" alt=""><span class="nm">${nm}</span><span class="bd${bt ? ' bt' : ''}">${bt ? 'EM BATALHA' : 'AGUARDANDO'}</span></div>
    <div class="meta">${r.public ? 'PÚBLICA' : 'PRIVADA'} · CÓDIGO <b>${esc(r.code || '-')}</b> · GUARDIÃO <b>${(r.boss_idx || 0) + 1}/6</b></div>
    ${health(r)}
    <div class="pl">${pl}</div><div class="pl" style="margin-top:1cqw">${bt && ps.length > 1 ? '<button type="button" class="chip blue mos" style="height:9cqw">MOSAICO</button>' : ''}<button type="button" class="chip blue cht" style="height:9cqw">CHAT</button><button type="button" class="chip gold gmn" style="height:9cqw">GERENCIAR</button></div>${bt ? '' : '<div class="meta">Só dá para espectar quando a batalha começar.</div>'}
  </div>`;
}
function paint() {
  const ls = $('#ls');
  ls.innerHTML = rooms.length ? rooms.map(card).join('') : '<div class="empty"><b>NENHUMA SALA ABERTA</b>Não há salas ativas agora.</div>';
}
async function load(manual) {
  if (loading) return; loading = true; const rf = $('#rf'); if (manual) rf.disabled = true;
  try { await NET.ready(); rooms = await NET.rpc('admin_rooms'); if (!Array.isArray(rooms)) rooms = []; net('on', 'ONLINE'); paint(); }
  catch (e) { net('off', 'SEM SERVIDOR'); if (manual) toast(NET.msg(e)); }
  loading = false; rf.disabled = false;
}
$('#rf').onclick = () => load(true);
// modo manutencao: ligado, so adm cria sala; as salas abertas recebem o aviso
let mtOn = false;
async function mtLoad() { try { const m = await NET.rpc('maintenance_status'); mtOn = !!(m && m.on); $('#mtn').textContent = 'MANUTENÇÃO: ' + (mtOn ? 'LIGADA' : 'DESLIGADA'); $('#mtn').classList.toggle('red', mtOn); } catch (e) {} }
$('#mtn').onclick = async () => {
  const b = $('#mtn'); if (b.disabled) return; let msg = null;
  if (!mtOn) { msg = prompt('Ligar manutenção: ninguém mais cria sala e as salas abertas recebem o aviso.\nMensagem (até 120 letras, vazio usa a padrão):', ''); if (msg === null) return; }
  else if (!confirm('Desligar a manutenção?')) return;
  b.disabled = true;
  try { const r = await NET.rpc('admin_set_maintenance', { p_on: !mtOn, p_msg: msg }); toast(!mtOn ? 'Manutenção ligada. Aviso enviado a ' + (r.rooms || 0) + ' sala(s).' : 'Manutenção desligada.'); await mtLoad(); }
  catch (e) { toast(NET.msg(e)); }
  b.disabled = false;
};
$('#qp').onclick = () => { if (leaving) return; leaving = true; clearInterval(timer); location.href = 'perguntas.html' + location.search; };
$('#ls').addEventListener('click', e => {
  const ct = e.target.closest('.cht'); if (ct && !leaving) { const id = ct.closest('.rm').dataset.id; if (window.CHAT) { if (CHAT.room() !== id) CHAT.mount({ room: id }); CHAT.open(); } return; }
  const gn = e.target.closest('.gmn'); if (gn && !leaving) { leaving = true; clearInterval(timer); location.href = 'gerenciar.html?room=' + gn.closest('.rm').dataset.id + '&from=espectar' + (location.search ? '&' + location.search.replace(/^\?/, '') : ''); return; }
  const mo = e.target.closest('.mos'); if (mo && !leaving) { leaving = true; clearInterval(timer); location.href = 'mosaico.html?room=' + mo.closest('.rm').dataset.id + (location.search ? '&' + location.search.replace(/^\?/, '') : ''); return; }
  const b = e.target.closest('.pb'); if (!b || b.disabled || leaving) return;
  leaving = true; clearInterval(timer);
  try { sessionStorage.setItem('bd1_spec', JSON.stringify({ room: b.closest('.rm').dataset.id, grp: b.dataset.g })); sessionStorage.setItem('bd1_gate', '1'); } catch (x) {}
  // v339: portoes na ida e na volta da batalha espectada (antes: ~1 s de tela preta enquanto a batalha carregava)
  const go = () => { location.href = 'game.html' + location.search; }; if (window.Gate && !matchMedia('(prefers-reduced-motion: reduce)').matches) Gate.close().then(go); else go();
});
$('#home').onclick = () => { if (leaving) return; leaving = true; try { sessionStorage.removeItem('bd1_spec'); } catch (e) {} location.href = 'cover.html' + location.search; };   // v338: sem transicao ao sair do espectador para a tela inicial
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
(async () => {
  try { sessionStorage.removeItem('bd1_spec'); } catch (e) {}
  let adm = false; try { adm = await NET.isAdmin(); } catch (e) {}
  if (!adm) { location.replace('cover.html' + location.search); return; }
  mtLoad(); load(); timer = setInterval(() => { if (!document.hidden) load(); }, 4000);
})();
if (window.Gate) Gate.arrive();   // voltou da batalha espectada pelos portoes
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }));
})();
