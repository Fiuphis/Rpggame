/* Tela cheia (Crônicas do Saber). window.FS: ok(), on(), enter(), exit(), toggle().
   O navegador sai da tela cheia ao trocar de página (cover.html <-> game.html): se o jogador escolheu tela cheia, ela é pedida de novo no primeiro toque da página seguinte. */
(() => {
'use strict';
const KEY = 'bd1_fs', de = document.documentElement;
const get = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };
const set = v => { try { sessionStorage.setItem(KEY, v ? '1' : '0'); } catch {} };
const req = () => { const f = de.requestFullscreen || de.webkitRequestFullscreen; if (!f) return Promise.reject(); try { const r = f.call(de, {navigationUI:'hide'}); return r && r.then ? r : Promise.resolve(); } catch (e) { return Promise.reject(e); } };
const cur = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
const standalone = () => { try { return matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };
let leaving = false; addEventListener('pagehide', () => { leaving = true; }); addEventListener('beforeunload', () => { leaving = true; });
const hooks = [], fire = () => hooks.forEach(f => { try { f(cur()); } catch {} });
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { if (!cur() && !leaving) set(false); fire(); }));
const once = () => { if (get() && !cur()) req().catch(() => {}); };
addEventListener('pointerdown', function h() { if (!get() || cur()) return; req().then(() => removeEventListener('pointerdown', h)).catch(() => {}); }, true);
window.FS = {
  ok: () => !!(de.requestFullscreen || de.webkitRequestFullscreen) && !standalone(),
  on: cur, onChange: f => hooks.push(f),
  enter: () => { set(true); return req().catch(() => { set(false); }); },
  exit: () => { set(false); const x = document.exitFullscreen || document.webkitExitFullscreen; if (x && cur()) try { x.call(document); } catch {} },
  toggle: () => cur() ? window.FS.exit() : window.FS.enter()
};
})();
