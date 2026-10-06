/* Tela de saves: abas por herói (MAGO, GUERREIRO, TANQUE, CLÉRIGA), até 4 saves por herói, guardados na conta. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const G = [['mage', 'MAGA', '#4da3ff'], ['guerreiro', 'GUERREIRO', '#ff5a4d'], ['tank', 'TANQUE', '#cfd8ff'], ['cleriga', 'CLÉRIGA', '#ffd24d']], MAXS = 4, DEF = 2;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const SS = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} } };
let cls = SS.get('bd1_saves_tab') || 'mage', saves = [], busy = false, leaving = false, toastT = 0, editing = null, loaded = false;
if (!G.some(g => g[0] === cls)) cls = 'mage';

function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); }
function go(url, flag) {
  if (leaving) return; leaving = true; if (flag) SS.set(flag, '1');
  const nav = () => { location.href = url; };
  if (window.PxT && !reduce()) PxT.conceal(.5, .2).then(nav); else nav();
}
function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'agora há pouco'; const m = s / 60; if (m < 60) return 'há ' + Math.round(m) + ' min';
  const h = m / 60; if (h < 24) return 'há ' + Math.round(h) + ' h'; const d = h / 24; if (d < 30) return 'há ' + Math.round(d) + (Math.round(d) === 1 ? ' dia' : ' dias');
  return 'há mais de um mês';
}
const col = k => (G.find(g => g[0] === k) || G[0])[2], nme = k => (G.find(g => g[0] === k) || G[0])[1];

function tabs() {
  $('#tabs').innerHTML = G.map(([k, n, c]) => `<button class="tab${k === cls ? ' on' : ''}" type="button" role="tab" aria-selected="${k === cls}" data-k="${k}" style="--c:${c}"><img src="salas/ic_${k}.png" alt="">${n}</button>`).join('');
  $('#tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => { if (cls === b.dataset.k) return; cls = b.dataset.k; SS.set('bd1_saves_tab', cls); tabs(); list(); });
}
function meta(s) {
  const r = s.resumo || {}; const parts = [];
  if (s.rev === 0) parts.push('<b>NOVO</b> · ainda não jogado'); else { if (r.fase != null) parts.push('<b>FASE ' + esc(r.fase) + '</b>'); if (r.moedas != null) parts.push(esc(r.moedas) + ' moedas'); if (!parts.length) parts.push('<b>EM ANDAMENTO</b>'); parts.push('salvo ' + ago(s.updated_at)); }
  return parts.join(' · ');
}
function list() {
  const mine = saves.filter(s => s.class === cls).sort((a, b) => a.slot - b.slot), c = col(cls);
  $('#th').textContent = nme(cls); $('#th').style.color = c; $('#tc').textContent = mine.length + '/' + MAXS;
  let h = mine.map(s => `<div class="sv" style="--c:${c}" data-id="${esc(s.id)}"><div class="tx"><span class="nm">${esc(s.name)}</span><span class="mt">${meta(s)}</span></div><div class="bt"><button class="chip blue play" type="button">JOGAR</button><button class="chip ed" type="button">EDITAR</button></div></div>`).join('');
  const orb = (t, sub) => `<button class="sv new" type="button" style="--c:${c}"><span class="orbw"><i></i><i></i><i></i><img src="salas/orb.png" alt=""></span><span class="lb"><b>${t}</b><i>${sub}</i></span></button>`;
  for (let i = mine.length; i < DEF; i++) h += orb('NOVO SAVE', 'Toque para criar');
  if (mine.length >= DEF && mine.length < MAXS) h += orb('CRIAR OUTRO SAVE', 'Até ' + MAXS + ' por herói');
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
    // primeira vez com conta: o progresso que já estava neste aparelho fica guardado nos saves locais (botão SAVES da capa)
    if (!localStorage.getItem('bd1_acc_applied')) { try { window.Saves && Saves.state(); } catch (e) {} localStorage.setItem('bd1_acc_applied', '1'); }
    NET.SV.apply(s.class, full.data);
    SS.set('bd1_save', JSON.stringify({ id: s.id, class: s.class, name: s.name, rev: full.rev })); SS.set('bd1_pref_class', s.class);
    busy = false; go('salas.html', 'bd1_rebuild');
  } catch (e) { busy = false; toast(NET.msg(e)); }
}

// ---------- novo save ----------
function openNew() { $('#nw-h').textContent = 'NOVO SAVE: ' + nme(cls); $('#nw-n').value = ''; $('#nw-e').textContent = ''; $('#ov-new').hidden = false; }
$('#nw-no').onclick = () => { $('#ov-new').hidden = true; list(); };
$('#nw-ok').onclick = async () => {
  if (busy) return; busy = true; $('#nw-ok').disabled = true; $('#nw-e').textContent = '';
  try { const r = await NET.createSave(cls, $('#nw-n').value.trim()); saves.push({ id: r.id, class: r.class || cls, slot: r.slot, name: r.name, rev: r.rev || 0, updated_at: r.updated_at || new Date().toISOString(), resumo: null }); $('#ov-new').hidden = true; list(); }
  catch (e) { $('#nw-e').textContent = NET.msg(e); }
  busy = false; $('#nw-ok').disabled = false;
};

// ---------- editar ----------
function openEdit(s) { editing = s; $('#ed-n').value = s.name; $('#ed-e').textContent = ''; $('#ed-main').hidden = false; $('#ed-conf').hidden = true; $('#ov-ed').hidden = false; }
$('#ed-no').onclick = () => { $('#ov-ed').hidden = true; };
$('#ed-ok').onclick = async () => {
  if (busy || !editing) return; const n = $('#ed-n').value.trim(); if (!n) { $('#ed-e').textContent = 'Dê um nome de 1 a 20 letras.'; return; }
  busy = true; try { await NET.renameSave(editing.id, n); editing.name = n; $('#ov-ed').hidden = true; list(); toast('Nome atualizado.'); } catch (e) { $('#ed-e').textContent = NET.msg(e); } busy = false;
};
$('#ed-del').onclick = () => { $('#ed-ct').textContent = '"' + editing.name + '" e todo o progresso dele serão apagados. Esta ação não pode ser desfeita.'; $('#ed-main').hidden = true; $('#ed-conf').hidden = false; };
$('#ed-back').onclick = () => { $('#ed-conf').hidden = true; $('#ed-main').hidden = false; };
$('#ed-yes').onclick = async () => {
  if (busy || !editing) return; busy = true;
  try { await NET.deleteSave(editing.id); saves = saves.filter(x => x.id !== editing.id); const cur = (() => { try { return JSON.parse(SS.get('bd1_save')); } catch (e) { return null; } })(); if (cur && cur.id === editing.id) SS.set('bd1_save', null); $('#ov-ed').hidden = true; list(); toast('Save apagado.'); }
  catch (e) { $('#ed-ct').textContent = NET.msg(e); } busy = false;
};

// ---------- saídas ----------
$('#home').onclick = () => { if (leaving) return; SS.set('bd1_cover_back', '1'); SS.set('bd1_rebuild', null); go('cover.html'); };
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
  SS.set('bd1_save', null); SS.set('bd1_pref_class', null);
  busy = false; go('conta.html', 'bd1_rebuild');
};
try { history.pushState({ sv: 1 }, ''); } catch (e) {}
addEventListener('popstate', () => { if (leaving) { try { history.pushState({ sv: 1 }, ''); } catch (e) {} return; } $('#home').click(); });
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

(async () => {
  tabs(); $('#sl').innerHTML = '<div class="empty">CARREGANDO...</div>';
  try {
    const a = await NET.account(); if (!a) { location.replace('conta.html'); return; }
    SS.set('bd1_acc', a.username); $('#who').textContent = 'Conta: ' + a.username.toUpperCase();
    saves = await NET.listSaves(); loaded = true;
    if (!SS.get('bd1_saves_tab') && saves.length) cls = saves.slice().sort((x, y) => new Date(y.updated_at) - new Date(x.updated_at))[0].class;
    tabs(); list();
  } catch (e) { $('#sl').innerHTML = `<div class="empty">NÃO FOI POSSÍVEL CARREGAR OS SAVES<br>${esc(NET.msg(e))}<br><br><button id="rt" class="chip blue" type="button" style="margin:0 auto;min-width:40cqw;height:11cqw">TENTAR DE NOVO</button></div>`; $('#rt').onclick = () => location.reload(); }
})();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }));
})();
