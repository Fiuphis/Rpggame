/* Tela de saves: lista unica de saves genericos da conta (ate 4). O save guarda a classe escolhida e o progresso de todas; escolher um volta para o inicio. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const G = [['mage', 'MAGA', '#4da3ff'], ['guerreiro', 'GUERREIRO', '#ff5a4d'], ['tank', 'TANQUE', '#cfd8ff'], ['cleriga', 'CLÉRIGA', '#ffd24d']], MAXS = 4, DEF = 2;
const EMB = /[?&]embed/.test(location.search), reduce = () => EMB || matchMedia('(prefers-reduced-motion: reduce)').matches;
const SS = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} } };
let saves = [], busy = false, leaving = false, toastT = 0, editing = null, loaded = false;

function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function go(url, flag) {
  if (leaving) return; leaving = true; if (flag && !EMB) SS.set(flag, '1');
  const nav = () => { if (EMB) { if (url === 'cover.html') parent.postMessage({ bd1: flag === 'bd1_cover_back' && SS.get('bd1_save') ? 'chosen' : 'close', popped: !!window.__popped }, location.origin); else parent.postMessage({ bd1: 'nav', url: url + location.search }, location.origin); } else location.href = url; };
  if (window.PxT && !reduce()) PxT.conceal(.5, .2).then(nav); else nav();
}
function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'agora há pouco'; const m = s / 60; if (m < 60) return 'há ' + Math.round(m) + ' min';
  const h = m / 60; if (h < 24) return 'há ' + Math.round(h) + ' h'; const d = h / 24; if (d < 30) return 'há ' + Math.round(d) + (Math.round(d) === 1 ? ' dia' : ' dias');
  return 'há mais de um mês';
}
const col = k => (G.find(g => g[0] === k) || G[0])[2], nme = k => (G.find(g => g[0] === k) || G[0])[1];

function meta(s) {
  const r = s.resumo || {}; const parts = [];
  if (s.rev === 0) parts.push('<b>NOVO</b> · ainda não jogado'); else { if (r.fase != null) parts.push('<b>GUARDIÕES ' + esc(r.fase) + '/6</b>'); if (!parts.length) parts.push('<b>EM ANDAMENTO</b>'); parts.push('salvo ' + ago(s.updated_at)); }
  let h = parts.join(' · ');
  if (s.rev !== 0 && r.her) {   // status por herói: moedas e itens guardados
    const row = G.filter(g => r.her[g[0]]).map(([k, n, c]) => `<span class="hs" style="--c:${c}"><img src="assets/salas/ic_${k}.png" alt="${n}"><b>${esc(r.her[k].o)}</b><i>${esc(r.her[k].i)} it.</i></span>`).join('');
    if (row) h += `<span class="hrow">${row}</span>`;
  }
  return h;
}
function cur() { try { return JSON.parse(SS.get('bd1_save')); } catch (e) { return null; } }
function list() {
  const mine = saves.slice().sort((a, b) => a.slot - b.slot || a.class.localeCompare(b.class)), c = '#7fc8ff', on = cur();
  $('#th').textContent = 'SEUS SAVES'; $('#th').style.color = c; $('#tc').textContent = mine.length + '/' + MAXS;
  let h = mine.map(s => { const sel = on && on.id === s.id; return `<div class="sv${sel ? ' sel' : ''}" style="--c:${c}" data-id="${esc(s.id)}"><div class="tx"><span class="nm">${esc(s.name)}${sel ? ' · EM USO' : ''}</span><span class="mt">${meta(s)}</span></div><div class="bt"><button class="chip blue play" type="button">ESCOLHER</button><button class="chip ed" type="button">EDITAR</button></div></div>`; }).join('');
  const orb = (t, sub) => `<button class="sv new" type="button" style="--c:${c}"><span class="orbw"><i></i><i></i><i></i><img src="assets/salas/orb.png" alt=""></span><span class="lb"><b>${t}</b><i>${sub}</i></span></button>`;
  for (let i = mine.length; i < DEF; i++) h += orb('NOVO SAVE', 'Toque para criar');
  if (mine.length >= DEF && mine.length < MAXS) h += orb('CRIAR OUTRO SAVE', 'Até ' + MAXS + ' saves');
  $('#sl').innerHTML = h;
  $('#sl').querySelectorAll('.sv[data-id]').forEach(el => {
    const s = mine.find(x => x.id === el.dataset.id);
    el.querySelector('.play').onclick = () => play(s);
    el.querySelector('.ed').onclick = () => openEdit(s);
  });
  $('#sl').querySelectorAll('.sv.new').forEach(el => el.onclick = () => { el.classList.add('pop'); setTimeout(() => openNew(), reduce() ? 0 : 180); });
}
async function play(s) {
  if (busy || leaving) return; busy = true;
  try {
    const full = await NET.readSave(s.id);   // dados e revisão mais recentes
    // primeira vez com conta: o progresso que já estava neste aparelho fica guardado nos saves locais
    if (!localStorage.getItem('bd1_acc_applied')) { try { window.Saves && Saves.state(); } catch (e) {} localStorage.setItem('bd1_acc_applied', '1'); }
    const k = NET.SV.apply(full.data);
    SS.set('bd1_save', JSON.stringify({ id: s.id, name: s.name, rev: full.rev, cls: k }));
    busy = false; go('cover.html', 'bd1_cover_back');   // escolhido: volta para o início, onde se toca em JOGAR
  } catch (e) { busy = false; toast(NET.msg(e)); }
}

// ---------- novo save ----------
function openNew() { $('#nw-h').textContent = 'NOVO SAVE'; $('#nw-n').value = ''; $('#nw-e').textContent = ''; $('#ov-new').hidden = false; }
$('#nw-no').onclick = () => { $('#ov-new').hidden = true; list(); };
$('#nw-ok').onclick = async () => {
  if (busy) return; busy = true; $('#nw-ok').disabled = true; $('#nw-e').textContent = '';
  try { const r = await NET.createSave($('#nw-n').value.trim()); saves.push({ id: r.id, class: r.class, slot: r.slot, name: r.name, rev: r.rev || 0, updated_at: r.updated_at || new Date().toISOString(), resumo: null }); $('#ov-new').hidden = true; list(); }
  catch (e) { $('#nw-e').textContent = NET.msg(e); }
  busy = false; $('#nw-ok').disabled = false;
};

// ---------- exportar / importar código do save ----------
const enc = o => 'BD1S:' + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = c => { c = String(c || '').trim(); if (!c.startsWith('BD1S:')) return null; try { const o = JSON.parse(decodeURIComponent(escape(atob(c.slice(5))))); return o && (o.v === 1 || o.v === 2) ? o : null; } catch (e) { return null; } };
$('#ed-exp').onclick = async () => {
  if (busy || !editing) return; busy = true;
  try { const full = await NET.readSave(editing.id); const code = enc(full.data && full.data.v ? full.data : { v: 2, cls: null, prog: null, saves: {}, resumo: { fase: 0, moedas: 0, her: {} } }); $('#ed-code').value = code; $('#ed-code').hidden = false; $('#ed-codeap').hidden = true; try { await navigator.clipboard.writeText(code); $('#ed-e').textContent = 'Código copiado. Guarde em lugar seguro.'; } catch (e) { $('#ed-e').textContent = 'Copie o código abaixo e guarde.'; } $('#ed-code').select(); }
  catch (e) { $('#ed-e').textContent = NET.msg(e); } busy = false;
};
$('#ed-imp').onclick = () => { $('#ed-code').value = ''; $('#ed-code').hidden = false; $('#ed-codeap').hidden = false; $('#ed-e').textContent = 'Cole o código. Isso substitui o progresso deste save.'; $('#ed-code').focus(); };
$('#ed-codeap').onclick = async () => {
  if (busy || !editing) return; const d = dec($('#ed-code').value); if (!d) { $('#ed-e').textContent = 'Código inválido.'; return; }
  busy = true;
  try { const full = await NET.readSave(editing.id); const rev = await NET.writeSave(editing.id, d, full.rev); editing.rev = rev; editing.resumo = d.resumo || null; const c = cur(); if (c && c.id === editing.id) { NET.SV.apply(d); SS.set('bd1_save', JSON.stringify({ id: editing.id, name: editing.name, rev, cls: d.cls || d.class || null })); }
    $('#ov-ed').hidden = true; list(); toast('Save importado.'); }
  catch (e) { $('#ed-e').textContent = NET.msg(e); } busy = false;
};

// ---------- editar ----------
function openEdit(s) { editing = s; $('#ed-n').value = s.name; $('#ed-e').textContent = ''; $('#ed-code').hidden = true; $('#ed-codeap').hidden = true; $('#ed-main').hidden = false; $('#ed-conf').hidden = true; $('#ov-ed').hidden = false; }
$('#ed-no').onclick = () => { $('#ov-ed').hidden = true; };
$('#ed-ok').onclick = async () => {
  if (busy || !editing) return; const n = $('#ed-n').value.trim(); if (!n) { $('#ed-e').textContent = 'Dê um nome de 1 a 20 letras.'; return; }
  busy = true; try { await NET.renameSave(editing.id, n); editing.name = n; $('#ov-ed').hidden = true; list(); toast('Nome atualizado.'); } catch (e) { $('#ed-e').textContent = NET.msg(e); } busy = false;
};
$('#ed-del').onclick = () => { $('#ed-ct').textContent = '"' + editing.name + '" e todo o progresso dele serão apagados. Esta ação não pode ser desfeita.'; $('#ed-main').hidden = true; $('#ed-conf').hidden = false; };
$('#ed-back').onclick = () => { $('#ed-conf').hidden = true; $('#ed-main').hidden = false; };
$('#ed-yes').onclick = async () => {
  if (busy || !editing) return; busy = true;
  try { await NET.deleteSave(editing.id); saves = saves.filter(x => x.id !== editing.id); const cu = cur(); if (cu && cu.id === editing.id) SS.set('bd1_save', null); $('#ov-ed').hidden = true; list(); toast('Save apagado.'); }
  catch (e) { $('#ed-ct').textContent = NET.msg(e); } busy = false;
};

// ---------- abas PERFIL / SAVES ----------
let account = null;
function tab(t) {
  document.querySelectorAll('#tabs .tab').forEach(b => { const on = b.dataset.t === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('#sec-saves').hidden = t !== 'saves'; $('#sec-perfil').hidden = t !== 'perfil'; SS.set('bd1_perfil_tab', t);
}
document.querySelectorAll('#tabs .tab').forEach(b => b.onclick = () => tab(b.dataset.t));
$('#pf-chg').onclick = () => { ['#pw-o', '#pw-n', '#pw-n2'].forEach(i => $(i).value = ''); $('#pw-e').textContent = ''; $('#ov-pw').hidden = false; };
$('#pw-no').onclick = () => { $('#ov-pw').hidden = true; };
$('#pw-ok').onclick = async () => {
  if (busy || !account) return; const o = $('#pw-o').value, n = $('#pw-n').value, e = $('#pw-e'); e.textContent = '';
  if (n.length < 6) { e.textContent = 'A nova senha precisa de pelo menos 6 caracteres.'; return; }
  if (n !== $('#pw-n2').value) { e.textContent = 'As senhas novas não são iguais.'; return; }
  busy = true; $('#pw-ok').disabled = true;
  try { await NET.changePassword(account, o, n); $('#ov-pw').hidden = true; toast('Senha alterada.'); } catch (x) { e.textContent = NET.msg(x); }
  busy = false; $('#pw-ok').disabled = false;
};

// ---------- saídas ----------
$('#home').onclick = () => { if (leaving) return; if (!EMB) { SS.set('bd1_cover_back', '1'); SS.set('bd1_rebuild', null); } go('cover.html'); };
$('#out').onclick = async () => {
  if (leaving || busy) return; busy = true;
  try { await NET.SV.sync(true); } catch (e) {}                               // guarda o que estava em jogo
  try { await NET.signOut(); } catch (e) {}
  try {
    if (localStorage.getItem('bd1_acc_applied')) {   // lê o save local direto (sem sincronizar, para não misturar com os dados da conta)
      const d = JSON.parse(localStorage.getItem('bd1_slots')), sl = d && d.list && d.list[d.active], dt = sl && sl.data;
      if (dt) { ['mage', 'guerreiro', 'tank', 'cleriga'].forEach(g => { const v = dt.saves && dt.saves[g]; v != null ? localStorage.setItem('bd1_save_' + g, v) : localStorage.removeItem('bd1_save_' + g); }); dt.prog != null ? localStorage.setItem('bd1_progress', dt.prog) : localStorage.removeItem('bd1_progress'); }
    }
    localStorage.removeItem('bd1_acc_applied');
  } catch (e) {}   // devolve ao aparelho o progresso de antes da conta
  SS.set('bd1_save', null); SS.set('bd1_pref_class', null); SS.set('bd1_acc', null);
  busy = false; go('conta.html', 'bd1_rebuild');
};
if (!EMB) try { history.pushState({ sv: 1 }, ''); } catch (e) {}
function backOv(map) { const ovs = [...document.querySelectorAll('.ov')].filter(o => !o.hidden); if (!ovs.length) return false; const o = ovs[ovs.length - 1]; const b = map[o.id]; if (typeof b === 'function') b(); else if (b) { const el = document.querySelector(b); if (el && !el.hidden) el.click(); else o.hidden = true; } return true; }
const onBack = () => { if (leaving) return; if (backOv({ 'ov-new': '#nw-no', 'ov-pw': '#pw-no', 'ov-ed': () => { if (!$('#ed-conf').hidden) $('#ed-back').click(); else $('#ed-no').click(); } })) { if (EMB) parent.postMessage({ bd1: 'rep' }, location.origin); else { try { history.pushState({ sv: 1 }, ''); } catch (e) {} } return; } window.__popped = true; $('#home').click(); };
addEventListener('popstate', () => { if (leaving) { try { history.pushState({ sv: 1 }, ''); } catch (e) {} return; } if (!EMB) onBack(); });
addEventListener('message', e => { if (EMB && e.origin === location.origin && e.data && e.data.bd1 === 'back') onBack(); });
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

(async () => {
  $('#sl').innerHTML = '<div class="empty">CARREGANDO...</div>';
  try {
    const a = await NET.account(); if (!a) { location.replace('conta.html' + location.search); return; }
    SS.set('bd1_acc', a.username); account = a.username; $('#pf-u').textContent = a.username.toUpperCase(); $('#who').textContent = 'Conta: ' + a.username.toUpperCase();
    saves = await NET.listSaves(); loaded = true;
    list(); tab('perfil');
  } catch (e) { $('#sl').innerHTML = `<div class="empty">NÃO FOI POSSÍVEL CARREGAR OS SAVES<br>${esc(NET.msg(e))}<br><br><button id="rt" class="chip blue" type="button" style="margin:0 auto;min-width:40cqw;height:11cqw">TENTAR DE NOVO</button></div>`; $('#rt').onclick = () => location.reload(); }
})();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }));
})();
