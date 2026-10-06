/* Tela cheia (Crônicas do Saber). window.FS: ok(), on(), enter(), exit(), toggle().
   O navegador sai da tela cheia ao trocar de página (cover.html <-> game.html): se o jogador escolheu tela cheia, ela é pedida de novo no primeiro toque da página seguinte. */
(() => {
'use strict';
// O navegador sai da tela cheia quando a página navega. Por isso o jogo roda dentro de shell.html, que nunca navega: as telas (cover, index, map, game) trocam dentro do quadro e a tela cheia é do shell.
if (window === window.top && !/[?&]noshell/.test(location.search)) {
  const f = location.pathname.split('/').pop() || 'index.html';
  if (/^[\w-]+\.html$/.test(f) && f !== 'shell.html') { location.replace('shell.html#' + f + location.search); return; }
}
const T = (() => { try { return window.top.document ? window.top : window; } catch { return window; } })(), TD = T.document;
const KEY = 'bd1_fs', de = TD.documentElement;
const AC = new AbortController(); addEventListener('pagehide', () => AC.abort());
const get = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };
const set = v => { try { sessionStorage.setItem(KEY, v ? '1' : '0'); } catch {} };
const req = () => { const f = de.requestFullscreen || de.webkitRequestFullscreen; if (!f) return Promise.reject(); try { const r = f.call(de, {navigationUI:'hide'}); return r && r.then ? r : Promise.resolve(); } catch (e) { return Promise.reject(e); } };
const cur = () => !!(TD.fullscreenElement || TD.webkitFullscreenElement);
const standalone = () => { try { return (!cur() && matchMedia('(display-mode: fullscreen)').matches) || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };
let leaving = false; addEventListener('pagehide', () => { leaving = true; }); addEventListener('beforeunload', () => { leaving = true; });
const lockPortrait = () => { try { const o = T.screen.orientation; if (o && o.lock) o.lock('portrait').catch(() => {}); } catch (e) {} };
const hooks = [], fire = () => hooks.forEach(f => { try { f(cur()); } catch {} });
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => TD.addEventListener(ev, () => { if (!cur() && !leaving) set(false); fire(); }, {signal: AC.signal}));
// o navegador só aceita tela cheia dentro de um gesto do usuário: no toque, isso vale a partir do fim do toque (pointerup/click)
const regain = () => { if (!get() || cur()) return; req().then(() => { ['pointerup', 'click', 'touchend'].forEach(t => removeEventListener(t, regain, true)); }).catch(() => {}); };
['pointerup', 'click', 'touchend'].forEach(t => addEventListener(t, regain, true));
window.FS = {
  wanted: get,
  ok: () => !!(de.requestFullscreen || de.webkitRequestFullscreen) && !standalone(),
  on: cur, onChange: f => hooks.push(f),
  enter: () => { set(true); return req().then(() => lockPortrait()).catch(() => { set(false); }); },
  exit: () => { set(false); const x = TD.exitFullscreen || TD.webkitExitFullscreen; if (x && cur()) try { x.call(TD); } catch {} },
  toggle: () => cur() ? window.FS.exit() : window.FS.enter()
};

// ---- botão flutuante (só ícone), em todas as páginas ----
const PKEY = 'bd1_fs_pos';
function floatBtn(){
  if (!window.FS.ok() || document.getElementById('fs-float')) return;
  const st = document.createElement('style');
  st.textContent = `#fs-float{position:fixed;z-index:2147483000;left:0;top:0;width:clamp(38px,11vw,54px);height:clamp(38px,11vw,54px);padding:0;margin:0;border:solid transparent;border-width:7px;border-image:url(ui_chip.png) 6 fill/7px stretch;background:transparent;image-rendering:pixelated;touch-action:none;-webkit-tap-highlight-color:transparent;cursor:pointer;opacity:.55;transition:opacity 2.2s ease;user-select:none;-webkit-user-select:none;outline:none}
#fs-float.hot{opacity:1;transition:opacity .15s ease}
#fs-float.on{border-image-source:url(ui_chip_blue.png)}
#fs-float i{position:absolute;inset:0;display:block;background:url(fs_icon.png) center/62% 62% no-repeat;image-rendering:pixelated;pointer-events:none}
#fs-float.on i{background-image:url(fs_icon_in.png)}
#fs-float:active{filter:brightness(1.25)}`;
  document.head.appendChild(st);
  const b = document.createElement('button'); b.id = 'fs-float'; b.type = 'button'; b.setAttribute('aria-label', 'Tela cheia'); b.innerHTML = '<i></i>';
  document.body.appendChild(b);
  const size = () => b.getBoundingClientRect().width || 44;
  let pos = null; try { pos = JSON.parse(sessionStorage.getItem(PKEY)); } catch {}
  if (!pos || typeof pos.x !== 'number') pos = {x:1, y:.46};           // padrão: encostado à direita, no meio da altura (frações do espaço livre)
  const place = () => { const w = size(), mx = Math.max(0, innerWidth - w), my = Math.max(0, innerHeight - w); b.style.left = Math.min(mx, Math.max(0, pos.x * mx)) + 'px'; b.style.top = Math.min(my, Math.max(0, pos.y * my)) + 'px'; };
  const save = () => { try { sessionStorage.setItem(PKEY, JSON.stringify(pos)); } catch {} };
  const paint = () => { b.classList.toggle('on', cur()); b.setAttribute('aria-label', cur() ? 'Sair da tela cheia' : 'Tela cheia'); };
  let hotT = 0; const heat = ms => { b.classList.add('hot'); clearTimeout(hotT); hotT = setTimeout(() => b.classList.remove('hot'), typeof ms === 'number' ? ms : 2600); };   // aceso ao tocar/arrastar; ao abrir cada página fica aceso 10 s para a pessoa achar e depois esmaece devagar (nunca some)
  let drag = null;
  b.addEventListener('pointerdown', e => { e.stopPropagation(); const r = b.getBoundingClientRect(); drag = {id:e.pointerId, ox:e.clientX - r.left, oy:e.clientY - r.top, sx:e.clientX, sy:e.clientY, moved:false}; try { b.setPointerCapture(e.pointerId); } catch {} heat(); });
  b.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; e.stopPropagation(); if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 7) return; drag.moved = true; heat();
    const w = size(), mx = Math.max(1, innerWidth - w), my = Math.max(1, innerHeight - w), l = Math.min(mx, Math.max(0, e.clientX - drag.ox)), t = Math.min(my, Math.max(0, e.clientY - drag.oy)); pos = {x:l / mx, y:t / my}; place(); });
  const end = e => { if (!drag || e.pointerId !== drag.id) return; e.stopPropagation(); const moved = drag.moved; drag = null; try { b.releasePointerCapture(e.pointerId); } catch {} heat(); if (moved) save(); };
  b.addEventListener('pointerup', e => { const was = drag && !drag.moved; end(e); if (was) { cur() ? window.FS.exit() : window.FS.enter(); setTimeout(paint, 250); setTimeout(paint, 900); } });
  b.addEventListener('pointercancel', e => { drag = null; });
  b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); });
  ['touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(t => b.addEventListener(t, e => e.stopPropagation()));
  window.FS.onChange(() => { paint(); heat(); });
  addEventListener('resize', place); addEventListener('orientationchange', () => setTimeout(place, 200));
  place(); paint(); heat(10000);
  // nunca sai da tela: se algo remover o botão (troca de conteúdo da página), ele volta
  new MutationObserver(() => { if (!document.body.contains(b)) document.body.appendChild(b); }).observe(document.body, {childList:true});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', floatBtn); else floatBtn();

// ---- orientação: o jogo é só vertical ----
// 1) trava a orientação sempre que o navegador permite (tela cheia ou app instalado); 2) onde não permite (aba comum),
// um aviso em pixel art cobre a tela enquanto o aparelho estiver deitado.
(function orient(){
  const touch = (() => { try { return matchMedia('(pointer:coarse)').matches; } catch { return false; } })();
  const tryLock = () => { try { const o = T.screen.orientation; if (o && o.lock) o.lock('portrait').catch(() => {}); } catch (e) {} };
  tryLock(); document.addEventListener('visibilitychange', tryLock); addEventListener('pageshow', tryLock);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => TD.addEventListener(ev, () => setTimeout(tryLock, 50)));
  if (!touch) return;
  let ov = null;
  const build = () => {
    const st = document.createElement('style');
    st.textContent = `#rot-ov{position:fixed;inset:0;z-index:2147483600;display:none;align-items:center;justify-content:center;flex-direction:column;gap:18px;background:#050711;color:#ffd978;font:700 18px/1.3 OpenC,'Pixelify Sans',monospace;letter-spacing:2px;text-align:center;text-transform:uppercase;padding:24px}
#rot-ov.on{display:flex}
#rot-ov svg{width:96px;height:96px;image-rendering:pixelated;animation:rotHint 2.4s ease-in-out infinite}
#rot-ov small{display:block;margin-top:8px;font-size:12px;color:#bfae86;letter-spacing:1px}
@keyframes rotHint{0%,35%{transform:rotate(-90deg)}65%,100%{transform:rotate(0)}}`;
    document.head.appendChild(st);
    ov = document.createElement('div'); ov.id = 'rot-ov'; ov.setAttribute('role', 'alert');
    ov.innerHTML = `<svg viewBox="0 0 12 16" shape-rendering="crispEdges" aria-hidden="true"><path fill="#3a1a06" d="M2 1h9v1h1v13h-1v1H2v-1H1V2h1z"/><path fill="#ffd978" d="M1 0h9v1h1v13h-1v1H1v-1H0V1h1z"/><path fill="#0b1633" d="M2 2h7v10H2z"/><path fill="#7fc8ff" d="M3 3h5v1H3zM3 5h5v1H3zM3 7h3v1H3z"/><path fill="#ffd978" d="M4 13h3v1H4z"/></svg><div>GIRE O APARELHO<small>O JOGO É JOGADO NA VERTICAL</small></div>`;
    document.body.appendChild(ov);
  };
  const check = () => { if (!document.body) return; if (!ov) build(); const land = innerWidth > innerHeight * 1.05; ov.classList.toggle('on', land); };
  addEventListener('resize', check); addEventListener('orientationchange', () => setTimeout(check, 150));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
})();
})();
