/* Mosaico (so adm): as telas de batalha dos jogadores de uma sala lado a lado, so leitura. Tocar numa tela abre ela inteira. */
(() => {
'use strict';
const $ = s => document.querySelector(s), NM = { mage: 'MAGA', guerreiro: 'GUERREIRO', tank: 'TANQUE', cleriga: 'CLÉRIGA' };
const Q = new URLSearchParams(location.search), room = Q.get('room') || '';
const rest = (() => { const p = new URLSearchParams(location.search); p.delete('room'); const s = p.toString(); return s; })();
const say = t => { const m = $('#msg'); m.textContent = t; m.hidden = !t; };
$('#x').onclick = () => { location.href = 'espectar.html' + (rest ? '?' + rest : ''); };
let cells = [];
function layout() {
  const W = innerWidth, H = innerHeight - 40, n = cells.length; if (!n) return;
  const cols = n === 1 ? 1 : 2, rows = Math.ceil(n / cols), g = 4;
  const s = Math.min((W - g * (cols - 1)) / cols / 390, (H - g * (rows - 1)) / rows / 780);
  cells.forEach(c => { c.style.width = 390 * s + 'px'; c.style.height = 780 * s + 'px'; c.firstChild.style.transform = 'scale(' + s + ')'; });
}
addEventListener('resize', layout);
(async () => {
  let rooms = [];
  try { await NET.ready(); if (!(await NET.isAdmin())) { location.replace('cover.html' + (rest ? '?' + rest : '')); return; } rooms = await NET.rpc('admin_rooms'); }
  catch (e) { say(NET.msg(e)); return; }
  const r = (rooms || []).find(x => x.id === room);
  if (!r) { say('Sala não encontrada ou encerrada.'); return; }
  $('#t').textContent = 'MOSAICO · ' + (r.name ? r.name.toUpperCase() : 'SALA');
  if (!r.playing) { say('Essa sala não está em batalha agora.'); return; }
  const ps = (r.players || []).filter(p => p.grp);
  const gr = $('#gr');
  ps.forEach(p => {
    const c = document.createElement('div'); c.className = 'c';
    const f = document.createElement('iframe'); f.title = NM[p.grp] || p.grp; f.dataset.src = 'game.html?' + (rest ? rest + '&' : '') + 'spec=' + room + ':' + p.grp + '&mini=1';
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Abrir tela de ' + (NM[p.grp] || p.grp));
    b.onclick = () => { if (window.__mgo) return; window.__mgo = 1; stopAll(); try { sessionStorage.setItem('bd1_spec', JSON.stringify({ room, grp: p.grp })); sessionStorage.setItem('bd1_gate', '1'); } catch (e) {} const go = () => { location.href = 'game.html' + (rest ? '?' + rest : ''); }; if (window.Gate && !matchMedia('(prefers-reduced-motion: reduce)').matches) Gate.close().then(go); else go(); };   // v339: portoes (a volta da batalha espectada tambem usa portoes)
    c.append(f, b); gr.appendChild(c); cells.push(c);
  });
  layout();
  // v340: as telas carregam uma de cada vez (antes todas juntas travavam a pagina por alguns segundos)
  let k = 0; const next = () => { const c = cells[k++]; if (!c || window.__mgo) return; const f = c.firstChild; let done = false; const go = () => { if (done) return; done = true; setTimeout(next, 700); };
    f.addEventListener('load', go, { once: true }); setTimeout(go, 8000); f.src = f.dataset.src; };
  next();
})();
// ao abrir uma tela inteira, as pequenas param antes dos portoes fecharem (a animacao das portas fica lisa)
function stopAll() { cells.forEach(c => { const f = c.firstChild; if (f && f.tagName === 'IFRAME') f.src = 'about:blank'; }); }
})();
