/* Tela de conta: entrar, criar conta (nome + senha) e trocar a senha com o código de recuperação. */
(() => {
'use strict';
const EMB = /[?&]embed/.test(location.search), $ = s => document.querySelector(s), reduce = () => EMB || matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode = 'in', busy = false, leaving = false, toastT = 0;
const SS = { set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} } };
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function netState(s, t) { const e = $('#net'); e.dataset.s = s; e.querySelector('b').textContent = t; }
const clean = v => v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);

// vai para outra tela com os blocos de brasa (a próxima tela os desfaz)
function go(url, flag) {
  if (leaving) return; leaving = true;
  if (flag && !EMB) SS.set(flag, '1');
  const nav = () => { if (EMB) { if (url === 'cover.html' || url === 'salas.html') parent.postMessage({ bd1: 'close', popped: !!window.__popped }, location.origin); else parent.postMessage({ bd1: 'nav', url: url + location.search }, location.origin); } else location.href = url; };
  if (window.PxT && !reduce()) PxT.conceal(.5, .2).then(nav); else nav();
}
const toSaves = () => go('saves.html', 'bd1_rebuild');

function setMode(m) {
  mode = m; $('#er').textContent = '';
  document.querySelectorAll('#mode .chip').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $('#rp-w').hidden = m !== 'up'; $('#go').textContent = m === 'up' ? 'CRIAR CONTA' : 'ENTRAR';
  $('#pw').autocomplete = m === 'up' ? 'new-password' : 'current-password';
  $('#hn').textContent = m === 'up' ? 'Use de 3 a 16 letras, números ou _. A senha precisa de 6 ou mais caracteres.' : 'Use o mesmo nome e senha em qualquer aparelho.';
  $('#fg').hidden = m === 'up';
}
document.querySelectorAll('#mode .chip').forEach(b => b.onclick = () => setMode(b.dataset.m));
$('#us').addEventListener('input', e => { const v = clean(e.target.value); if (v !== e.target.value) e.target.value = v; });
$('#ru').addEventListener('input', e => { const v = clean(e.target.value); if (v !== e.target.value) e.target.value = v; });

function showCode(code, then) {
  $('#cd-v').textContent = code; $('#ov-code').hidden = false;
  $('#cd-cp').onclick = async () => { try { await navigator.clipboard.writeText(code); toast('Código copiado.'); } catch (e) { toast('Anote o código na tela.'); } };
  $('#cd-ok').onclick = () => { $('#ov-code').hidden = true; then(); };
}

$('#fm').addEventListener('submit', async e => {
  e.preventDefault(); if (busy || leaving) return;
  const u = clean($('#us').value), p = $('#pw').value, er = $('#er'); er.textContent = '';
  if (u.length < 3) { er.textContent = 'O usuário precisa de 3 a 16 letras, números ou _.'; return; }
  if (p.length < 6) { er.textContent = 'A senha precisa de pelo menos 6 caracteres.'; return; }
  if (mode === 'up' && p !== $('#pw2').value) { er.textContent = 'As senhas não são iguais.'; return; }
  busy = true; const b = $('#go'); b.disabled = true;
  try {
    if (mode === 'up') { const code = await NET.signUp(u, p); SS.set('bd1_acc', u); busy = false; b.disabled = false; showCode(code, toSaves); return; }
    await NET.signIn(u, p); SS.set('bd1_acc', u); toSaves();
  } catch (x) { er.textContent = NET.msg(x); }
  busy = false; b.disabled = false;
});

$('#fg').onclick = () => { $('#ru').value = clean($('#us').value); $('#rc').value = ''; $('#rp').value = ''; $('#re').textContent = ''; $('#ov-rec').hidden = false; };
$('#rec-no').onclick = () => { $('#ov-rec').hidden = true; };
$('#rc').addEventListener('input', e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); e.target.value = v.replace(/(.{4})(?=.)/g, '$1-'); });
$('#rec-ok').onclick = async () => {
  if (busy) return; const u = clean($('#ru').value), c = $('#rc').value, p = $('#rp').value, er = $('#re'); er.textContent = '';
  if (u.length < 3) { er.textContent = 'Informe o usuário.'; return; }
  if (c.replace(/-/g, '').length < 12) { er.textContent = 'O código tem 12 letras e números.'; return; }
  if (p.length < 6) { er.textContent = 'A senha precisa de pelo menos 6 caracteres.'; return; }
  busy = true; $('#rec-ok').disabled = true;
  try { const nc = await NET.recover(u, c, p); await NET.signIn(u, p); SS.set('bd1_acc', u); $('#ov-rec').hidden = true; $('#cd-h').textContent = 'NOVO CÓDIGO'; showCode(nc, toSaves); }
  catch (x) { er.textContent = NET.msg(x); }
  busy = false; $('#rec-ok').disabled = false;
};

$('#solo').onclick = () => go('salas.html', 'bd1_rebuild');
$('#home').onclick = () => { if (leaving) return; if (!EMB) { try { sessionStorage.setItem('bd1_cover_back', '1'); sessionStorage.removeItem('bd1_rebuild'); } catch (e) {} } leaving = false; go('cover.html'); };
if (!EMB) try { history.pushState({ ct: 1 }, ''); } catch (e) {}
function backOv(map) { const ovs = [...document.querySelectorAll('.ov')].filter(o => !o.hidden); if (!ovs.length) return false; const o = ovs[ovs.length - 1]; const b = map[o.id]; if (typeof b === 'function') b(); else if (b) { const el = document.querySelector(b); if (el && !el.hidden) el.click(); else o.hidden = true; } return true; }
const onBack = () => { if (leaving) return; if (backOv({ 'ov-rec': '#rec-no', 'ov-code': () => {} })) { if (EMB) parent.postMessage({ bd1: 'rep' }, location.origin); else { try { history.pushState({ ct: 1 }, ''); } catch (e) {} } return; } window.__popped = true; $('#home').click(); };
addEventListener('popstate', () => { if (leaving) { try { history.pushState({ ct: 1 }, ''); } catch (e) {} return; } if (!EMB) onBack(); });
addEventListener('message', e => { if (EMB && e.origin === location.origin && e.data && e.data.bd1 === 'back') onBack(); });
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

(async () => {
  try { await NET.ready(); netState(NET.MOCK ? 'mock' : 'on', NET.MOCK ? 'SIMULADO' : 'ONLINE'); } catch (e) { netState('off', 'SEM SERVIDOR'); }
  try { const a = await NET.account(); if (a) { SS.set('bd1_acc', a.username); location.replace('saves.html' + location.search); } } catch (e) {}
})();
setMode(/[?&]m=up/.test(location.search) ? 'up' : 'in');
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }));
})();
