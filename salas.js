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
  NET.joinRoom(id).then(enter, err => { b.disabled = false; toast(NET.msg(err)); load(); });
});
$('#rf').onclick = () => load(true);
function poll() { clearInterval(timer); timer = setInterval(() => { if (!document.hidden && !leaving && $('#ov-mk').hidden && $('#ov-cd').hidden) load(); }, 6000); }

// ---------- janelas ----------
function open(id) { const o = $(id); o.hidden = false; const f = o.querySelector('input'); if (f) setTimeout(() => f.focus(), 50); }
function close(id) { $(id).hidden = true; }
let pub = true;
function setPub(v) { pub = v; document.querySelectorAll('#seg .chip').forEach(b => b.classList.toggle('on', (b.dataset.pub === '1') === v)); $('#mk-h').textContent = v ? 'Aparece na lista para qualquer jogador entrar.' : 'Fica escondida da lista. Só entra quem tiver o código.'; }
$('#seg').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) setPub(b.dataset.pub === '1'); });
$('#mk').onclick = () => { setPub(true); $('#nm').value = ''; $('#mk-e').textContent = ''; $('#mk-form').hidden = false; $('#mk-done').hidden = true; made = null; open('#ov-mk'); };
$('#mk-no').onclick = () => close('#ov-mk');
$('#mk-ok').onclick = async () => {
  const b = $('#mk-ok'); b.disabled = true; $('#mk-e').textContent = '';
  try { await NET.ready(); made = await NET.createRoom(pub, $('#nm').value.trim());
    $('#dn-c').textContent = made.code; $('#dn-t').textContent = pub ? 'Sala pública criada. O código serve para chamar amigos.' : 'Sala privada criada. Passe este código para os colegas entrarem.';
    $('#mk-form').hidden = true; $('#mk-done').hidden = false; }
  catch (e) { $('#mk-e').textContent = NET.msg(e); }
  finally { b.disabled = false; }
};
$('#dn-cp').onclick = async () => { const c = made && made.code; if (!c) return; try { await navigator.clipboard.writeText(c); toast('Código copiado.'); } catch { toast('Anote o código: ' + c); } };
$('#dn-go').onclick = () => enter(made);
$('#cd').onclick = () => { $('#cdv').value = ''; $('#cd-e').textContent = ''; open('#ov-cd'); };
$('#cd-no').onclick = () => close('#ov-cd');
$('#cdv').addEventListener('input', e => { e.target.value = NET.norm(e.target.value); $('#cd-e').textContent = ''; });
async function byCode() {
  const code = NET.norm($('#cdv').value); if (code.length !== 6) { $('#cd-e').textContent = 'Digite os 6 caracteres do código.'; return; }
  const b = $('#cd-ok'); b.disabled = true;
  try { await NET.ready(); enter(await NET.joinRoom(null, code)); } catch (e) { $('#cd-e').textContent = NET.msg(e); } finally { b.disabled = false; }
}
$('#cd-ok').onclick = byCode; $('#cdv').addEventListener('keydown', e => { if (e.key === 'Enter') byCode(); });
document.querySelectorAll('.ov').forEach(o => o.addEventListener('pointerdown', e => { if (e.target === o && o.id !== 'ov-mk') o.hidden = true; }));

// ---------- saídas ----------
function enter(r) {
  if (leaving || !r) return; leaving = true; clearInterval(timer);
  document.querySelectorAll('.ov').forEach(o => o.hidden = true);
  try { sessionStorage.setItem('bd1_gate', '1'); sessionStorage.setItem('bd1_cover', '1'); } catch (e) {}
  if (window.Gate && !reduce()) Gate.close().then(() => { location.href = 'index.html'; }); else location.href = 'index.html';
}
$('#solo').onclick = () => { NET.setRoom(null); enter({}); };
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
