/* Caixas do mapa (título, rosa dos ventos, legenda, frase) ACIMA das nuvens: aparecem depois que o mapa carrega e as nuvens densas saem. */
(() => {
const M = {title: [4, 10, 326, 232], legend: [16, 1088, 304, 176], quote: [900, 1106, 304, 138], compass: [1040, 2, 180, 180]}, W = 1224, H = 1285;
const map = document.getElementById('map'); if (!map) return;
const hud = document.createElement('div'); hud.className = 'hud'; hud.setAttribute('aria-hidden', 'false');
for (const k in M) { const [x, y, w, h] = M[k], i = document.createElement('img'); i.src = `map/ui_${k}.webp`; i.alt = ''; i.draggable = false; i.className = 'hud-' + k; i.style.cssText = `left:${x / W * 100}%;top:${y / H * 100}%;width:${w / W * 100}%;height:${h / H * 100}%`; hud.appendChild(i); }
const q = document.getElementById('quote'); if (q) hud.appendChild(q);
document.body.appendChild(hud);
const place = () => { const r = map.getBoundingClientRect(); hud.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; };
let on = false;
window.HUD = { show() { place(); on = true; hud.classList.add('on'); }, hide() { on = false; hud.classList.remove('on'); } };
addEventListener('resize', () => { if (on) place(); });
})();
