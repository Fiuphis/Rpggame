/* Relatório final: individual (seu grupo), coletivo (as quatro classes e a sala) e a lista de perguntas da partida.
   Dados: o servidor (match_report) + o que este aparelho guardou ao fim da batalha (bd1_report). Botões: jogar de novo / mapa. */
(() => {
'use strict';
const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const G = { mage: ['MAGO', '#4da3ff'], guerreiro: ['GUERREIRO', '#ff5a4d'], tank: ['TANQUE', '#cfd8ff'], cleriga: ['CLÉRIGA', '#ffd24d'] }, ORDER = ['mage', 'guerreiro', 'tank', 'cleriga'];
const RK = ['C', 'B', 'A', 'S', 'SS'], BOSS = { 0: 'Malgorath, Lorde das Trevas', 1: 'Hrimgar, o Rei Gelado' };
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let loc = null; try { loc = JSON.parse(sessionStorage.getItem('bd1_report')); } catch (e) {}
const room = NET.room(); let leaving = false, rep = null;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const sum = st => { let r = 0, w = 0; if (st && st.rank) Object.values(st.rank).forEach(v => { r += v[0]; w += v[1]; }); return [r, w]; };

function head() {
  const win = loc ? !!loc.win : rep && rep.match && rep.match.status === 'won', st = rep && rep.match && rep.match.status;
  const h = $('#hd'); h.classList.toggle('win', win && st !== 'aborted'); h.classList.toggle('lose', !win);
  $('#rs').textContent = st === 'aborted' ? 'ENCERRADA' : win ? 'VITÓRIA' : 'DERROTA';
  const m = rep && rep.match, boss = m ? (BOSS[m.boss] || '') : (loc && loc.bossName) || '';
  let dur = ''; if (m && m.started_at && m.ended_at) { const s = Math.max(0, Math.round((new Date(m.ended_at) - new Date(m.started_at)) / 1000)); dur = ' · ' + Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s'; }
  const n = rep ? rep.rounds.length : (loc && loc.rounds) || 0;
  $('#rb').textContent = (boss ? boss + ' · ' : '') + n + (n === 1 ? ' pergunta' : ' perguntas') + dur;
}
function mine() {
  const el = $('#me'), pl = rep && rep.players.find(p => p.me), st = pl ? pl.stats : (loc && loc.stats);
  if (!st) { el.hidden = true; return; }
  el.hidden = false; const [r, w] = sum(st), n = r + w, hero = G[st.hero || (loc && loc.hero)] || ['', '#fff'];
  el.innerHTML = `<h2 class="rt">SEU DESEMPENHO<small>${esc(hero[0])}</small></h2>
  <div class="kv"><div><span>ACERTOS</span><b>${r}/${n}</b></div><div><span>APROVEITAMENTO</span><b>${pct(r, n)}%</b></div>
  <div><span>MOEDAS GANHAS</span><b>${st.gained || 0}</b></div><div><span>MOEDAS GASTAS</span><b>${st.spent || 0}</b></div>
  <div><span>ITENS USADOS</span><b>${st.used || 0}</b></div><div><span>VIDA DO BOSS</span><b>${st.win ? '0%' : (st.boss_pct == null ? '-' : st.boss_pct + '%')}</b></div></div>
  <div class="rk">${RK.map((k, i) => { const v = (st.rank && st.rank[i + 1]) || [0, 0]; return `<div>${k}<b>${v[0]}/${v[0] + v[1]}</b></div>`; }).join('')}</div>`;
}
function groups() {
  const el = $('#gr'), rs = rep ? rep.rounds : [];
  if (!rs.length) { el.hidden = true; return; }
  el.hidden = false;
  const rows = ORDER.map(k => { let r = 0, n = 0, sim = 0; rs.forEach(x => { const g = x.groups && x.groups[k]; if (!g) return; n++; if (g.correct) r++; if (g.sim) sim++; });
    return { k, r, n, sim }; });
  const tot = rows.reduce((a, x) => [a[0] + x.r, a[1] + x.n], [0, 0]);
  el.innerHTML = `<h2 class="rt">AS CLASSES<small>acerto por grupo · sala ${pct(tot[0], tot[1])}%</small></h2><div class="bars">` +
    rows.map(x => `<div class="br" style="--c:${G[x.k][1]}"><em>${G[x.k][0]}</em><i><s style="width:${pct(x.r, x.n)}%"></s></i><span>${x.r}/${x.n}${x.sim ? ' *' : ''}</span></div>`).join('') +
    `</div>${rows.some(x => x.sim) ? '<div class="empty" style="padding:0">* inclui rodadas em que o grupo estava vazio e foi simulado pelo servidor</div>' : ''}`;
}
function players() {
  const el = $('#pl'), ps = rep ? rep.players : [];
  if (!ps.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<h2 class="rt">JOGADORES<small>${ps.length}</small></h2><div class="pt"><div class="pr h"><span>NOME</span><span>CLASSE</span><span>ACERTO</span><span>ITENS</span></div>` +
    ps.map((p, i) => { const [r, w] = sum(p.stats), g = G[p.grp] || ['-', '#fff']; return `<div class="pr"><span class="n${p.me ? ' me' : ''}">${esc(p.name || 'JOGADOR ' + (i + 1))}${p.me ? ' (VOCÊ)' : ''}</span><span class="g" style="--c:${g[1]}">${g[0]}</span><span>${pct(r, r + w)}%</span><span>${(p.stats && p.stats.used) || 0}</span></div>`; }).join('') + '</div>';
}
function hardest() {
  const el = $('#hq'), rs = rep ? rep.rounds : [];
  const list = rs.map(x => { const gs = Object.values(x.groups || {}).filter(g => !g.sim); return { x, miss: gs.filter(g => !g.correct).length, n: gs.length }; }).filter(o => o.n && o.miss).sort((a, b) => b.miss / b.n - a.miss / a.n || b.x.rank - a.x.rank).slice(0, 3);
  if (!list.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<h2 class="rt">MAIS ERRADAS<small>para estudar</small></h2><div class="hq">` + list.map(o => qItem(o.x)).join('') + '</div>';
}
function qItem(x) {
  const cs = ORDER.map(k => { const g = x.groups && x.groups[k]; if (!g) return ''; return `<span class="${g.correct ? 'ok' : 'no'}">${G[k][0]}${g.sim ? ' (SIM)' : ''}</span>`; }).join('');
  const ok = x.correct != null && x.options ? x.options[x.correct] : '';
  return `<div class="qi"><div class="qh"><b>Q${x.n}</b><span>RANK ${RK[(x.rank || 1) - 1] || ''}</span></div><div class="qx">${esc(x.text)}</div><div class="qa">Resposta: ${esc(ok)}</div><div class="cs">${cs}</div></div>`;
}
function questions() {
  const el = $('#qs'), rs = rep ? rep.rounds : [];
  if (!rs.length) { el.hidden = false; el.innerHTML = '<div class="empty">Sem perguntas registradas nesta partida.</div>'; return; }
  el.hidden = false; el.innerHTML = `<h2 class="rt">TODAS AS PERGUNTAS<small>${rs.length}</small></h2><div class="ql">` + rs.map(qItem).join('') + '</div>';
}
function paint() { head(); mine(); groups(); players(); hardest(); questions(); }

async function load() {
  paint();
  try {
    await NET.ready();
    let id = loc && loc.match;
    if (!id && room) { const s = await MATCH.state(room.id); id = s.match && s.match.id; }
    if (!id) return;
    for (let i = 0; i < 6 && !leaving; i++) {   // as estatisticas dos outros chegam quando cada aparelho termina a batalha
      rep = await MATCH.report(id); paint();
      if (rep.match && rep.match.status !== 'playing' && (i >= 2 || rep.players.length >= ((loc && loc.members) || 1))) break;
      await new Promise(r => setTimeout(r, 2500));
    }
  } catch (e) { if (!rep) $('#rb').textContent = 'Sem conexão: mostrando só o seu resumo'; }
}
function go(page, flags) {
  if (leaving) return; leaving = true;
  try { sessionStorage.setItem('bd1_gate', '1'); (flags || []).forEach(f => sessionStorage.setItem(f, '1')); } catch (e) {}
  const nav = () => { location.href = page + location.search; };
  if (window.Gate && !reduce()) Gate.close().then(nav); else nav();
}
$('#again').onclick = () => go(room ? 'map.html' : 'index.html', room ? ['bd1_fog'] : []);
$('#map').onclick = () => go('map.html', ['bd1_fog']);
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
try { history.pushState({ rp: 1 }, ''); } catch (e) {}
addEventListener('popstate', () => { if (leaving) { try { history.pushState({ rp: 1 }, ''); } catch (e) {} return; } $('#map').click(); });
if (window.Gate) Gate.arrive();
load();
})();
