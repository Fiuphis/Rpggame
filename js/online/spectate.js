'use strict';
/* Painel do espectador (so adm): barra no topo com a classe/jogador vistos, o que ele marcou e o gabarito; bloqueia toques no jogo (so leitura). */
(() => {
  const SP = window.MATCH && MATCH.spec; if (!SP || !window.ONL || !ONL.on) return;
  const NM = { mage: 'MAGA', guerreiro: 'GUERREIRO', tank: 'TANQUE', cleriga: 'CLÉRIGA' }, L = 'ABCDEFGH';
  const st = document.createElement('style');
  st.textContent = '#spec-block{position:fixed;inset:0;z-index:99990;background:transparent;touch-action:none}'
    + '#spec-bar{position:fixed;left:0;right:0;top:0;z-index:99999;font:700 12px/1.3 OpenC,OpenD,monospace;color:#fff1c8;background:rgba(10,8,22,.92);border-bottom:2px solid #c9a24a;padding:6px 8px}'
    + '#spec-bar .r{display:flex;align-items:center;gap:6px}#spec-bar .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.5px}'
    + '#spec-bar button{font:inherit;color:#e8c46a;background:#1d1636;border:1px solid #c9a24a;padding:5px 8px;cursor:pointer}'
    + '#spec-bar .d{margin-top:5px;display:grid;gap:3px;font-weight:400;font-size:11px;word-break:break-word}#spec-bar .d b{color:#e8c46a}#spec-bar .ok{color:#5dff9a}#spec-bar .no{color:#ff7a8a}';
  document.head.appendChild(st);
  const MINI = !!SP.mini;
  if (MINI) st.textContent += '#spec-bar{font-size:22px;padding:8px 10px}#spec-bar .d{font-size:21px;gap:2px}#spec-bar button{display:none}';
  const blk = document.createElement('div'); blk.id = 'spec-block';
  const bar = document.createElement('div'); bar.id = 'spec-bar';
  bar.innerHTML = '<div class="r"><span class="t"></span><button type="button" id="spec-k">GABARITO</button><button type="button" id="spec-x">SAIR</button></div><div class="d" hidden></div>';
  document.body.append(blk, bar);
  const t = bar.querySelector('.t'), d = bar.querySelector('.d'); let open = true;
  bar.querySelector('#spec-x').onclick = () => { ONL.stop(); location.href = 'espectar.html' + location.search; };
  bar.querySelector('#spec-k').onclick = () => { open = !open; draw(); };
  const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const opt = (q, i) => i == null || !q || !q.options || q.options[i] == null ? '-' : L[i] + ') ' + esc(q.options[i]);
  function draw() {
    const s = ONL.s, r = s && s.round, q = r && r.question, mem = (s && s.members || []).find(m => m.grp === SP.grp);
    t.textContent = 'ESPECTANDO: ' + (NM[SP.grp] || SP.grp) + (mem && mem.name ? ' · ' + mem.name.toUpperCase() : '') + (r ? ' · RODADA ' + r.n : '');
    d.hidden = !open; if (!open) return;
    if (MINI) { const v0 = r && r.my_vote, a0 = r && r.my_act, ky = r && r.key; d.innerHTML = !r ? '' : r.kind === 'chest' ? '<div><b>ARCA</b></div>' : '<div><b>GAB</b> <span class="ok">' + (ky == null ? '-' : L[ky]) + '</span> · <b>MARCOU</b> <span class="' + (v0 && v0.option != null && ky === v0.option ? 'ok' : 'no') + '">' + (v0 && v0.option != null ? L[v0.option] : '-') + '</span> · <b>ATQ</b> ' + (a0 && a0.skill && a0.skill !== 'none' ? esc(String(a0.skill).toUpperCase()) : '-') + '</div>'; return; }
    if (!r) { d.innerHTML = 'Sem rodada no momento.'; return; }
    const v = r.my_vote, a = r.my_act, g = r.groups && r.groups[SP.grp] || {}, rows = [];
    if (r.kind === 'chest') rows.push('<div><b>ARCA</b> · jogador: ' + (g.chosen == null ? 'ainda sem escolha' : g.chosen === 0 ? 'ABRIR' : 'IGNORAR') + '</div>');
    else {
      rows.push('<div><b>PERGUNTA</b> · ' + esc(q && q.text) + '</div>');
      rows.push('<div><b>GABARITO</b> · <span class="ok">' + opt(q, r.key) + '</span></div>');
      const ch = v && v.option != null ? v.option : null, fin = g.chosen != null ? g.chosen : null;
      rows.push('<div><b>MARCOU</b> · ' + (ch == null ? 'nada ainda' : '<span class="' + (r.key != null && ch === r.key ? 'ok' : 'no') + '">' + opt(q, ch) + '</span>' + (v.confirmed ? ' (confirmada)' : '')) + (fin != null && fin !== ch ? ' · valeu: ' + opt(q, fin) : '') + '</div>');
    }
    if (a && a.skill && a.skill !== 'none') rows.push('<div><b>ATAQUE</b> · ' + esc(String(a.skill).toUpperCase()) + (a.element ? ' · ' + esc(String(a.element).toUpperCase()) : '') + (a.target ? ' · alvo ' + esc(NM[a.target] || a.target) : '') + (a.ult ? ' · ESPECIAL' : '') + (a.confirmed ? ' (confirmado)' : '') + '</div>');
    else if (r.status === 'acting') rows.push('<div><b>ATAQUE</b> · ainda sem escolha</div>');
    if (g.sim || g.act_sim) rows.push('<div>Classe sem jogador ativo: jogada simulada pelo servidor.</div>');
    d.innerHTML = rows.join('');
  }
  setInterval(draw, 500); draw();
})();
