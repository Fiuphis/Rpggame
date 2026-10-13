/* Espectar (so adm): escolhe uma sala (inclusive privada) e um jogador; abre a tela de batalha dele so para ler. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NM = { mage: 'MAGA', guerreiro: 'GUERREIRO', tank: 'TANQUE', cleriga: 'CLÉRIGA' };
let rooms = [], loading = false, leaving = false, timer = 0, toastT = 0;
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function net(s, t) { const e = $('#net'); e.dataset.s = s; e.querySelector('b').textContent = t; }
function card(r) {
  const nm = r.name ? esc(r.name) : 'SALA ' + esc(String(r.id).replace(/-/g, '').slice(0, 4).toUpperCase());
  const bt = !!r.playing, ps = r.players || [];
  const pl = ps.length ? ps.map(p => `<button type="button" class="pb${p.active ? '' : ' off'}" data-g="${esc(p.grp)}"${bt ? '' : ' disabled'}><img src="assets/salas/ic_${esc(p.grp)}.png" alt=""><span>${esc((p.name || 'SEM CONTA').toUpperCase())}</span><i></i></button>`).join('') : '<div class="meta">Sem jogadores.</div>';
  return `<div class="rm" role="listitem" data-id="${esc(r.id)}">
    <div class="r1"><img class="ico" src="assets/salas/ic_${r.public ? 'unlock' : 'lock'}.png" alt=""><span class="nm">${nm}</span><span class="bd${bt ? ' bt' : ''}">${bt ? 'EM BATALHA' : 'AGUARDANDO'}</span></div>
    <div class="meta">${r.public ? 'PÚBLICA' : 'PRIVADA'} · CÓDIGO <b>${esc(r.code || '-')}</b> · GUARDIÃO <b>${(r.boss_idx || 0) + 1}/6</b></div>
    <div class="pl">${pl}</div><div class="pl" style="margin-top:1cqw">${bt && ps.length > 1 ? '<button type="button" class="chip blue mos" style="height:9cqw">MOSAICO</button>' : ''}<button type="button" class="chip gold gmn" style="height:9cqw">GERENCIAR</button></div>${bt ? '' : '<div class="meta">Só dá para espectar quando a batalha começar.</div>'}
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
$('#ls').addEventListener('click', e => {
  const gn = e.target.closest('.gmn'); if (gn && !leaving) { leaving = true; clearInterval(timer); location.href = 'gerenciar.html?room=' + gn.closest('.rm').dataset.id + '&from=espectar' + (location.search ? '&' + location.search.replace(/^\?/, '') : ''); return; }
  const mo = e.target.closest('.mos'); if (mo && !leaving) { leaving = true; clearInterval(timer); location.href = 'mosaico.html?room=' + mo.closest('.rm').dataset.id + (location.search ? '&' + location.search.replace(/^\?/, '') : ''); return; }
  const b = e.target.closest('.pb'); if (!b || b.disabled || leaving) return;
  leaving = true; clearInterval(timer);
  try { sessionStorage.setItem('bd1_spec', JSON.stringify({ room: b.closest('.rm').dataset.id, grp: b.dataset.g })); } catch (x) {}
  location.href = 'game.html' + location.search;
});
$('#home').onclick = () => { if (leaving) return; leaving = true; try { sessionStorage.removeItem('bd1_spec'); sessionStorage.setItem('bd1_cover_back', '1'); } catch (e) {} location.href = 'cover.html' + location.search; };
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
(async () => {
  try { sessionStorage.removeItem('bd1_spec'); } catch (e) {}
  let adm = false; try { adm = await NET.isAdmin(); } catch (e) {}
  if (!adm) { location.replace('cover.html' + location.search); return; }
  load(); timer = setInterval(() => { if (!document.hidden) load(); }, 4000);
})();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }));
})();
