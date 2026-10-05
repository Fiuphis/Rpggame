// Entrada na seleção de classe vinda da capa: a tela escura se desfaz em pixels (de dentro para fora), reconstruindo o menu
(() => {
const de = document.documentElement;
let on = false; try { on = !!sessionStorage.getItem('bd1_rebuild'); sessionStorage.removeItem('bd1_rebuild'); } catch (e) {}
if (!on) { de.classList.remove('rb'); return; }
if (matchMedia('(prefers-reduced-motion: reduce)').matches) { de.classList.remove('rb'); return; }
const BS = 14, vw = innerWidth, vh = innerHeight, c = document.createElement('canvas'), x = c.getContext('2d');
c.width = vw; c.height = vh; c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;image-rendering:pixelated';
document.body.appendChild(c);
const cols = Math.ceil(vw / BS), rows = Math.ceil(vh / BS), cx = vw / 2, cy = vh * .46, maxd = Math.hypot(vw, vh) / 2, rnd = (a, b) => a + Math.random() * (b - a);
const blocks = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const bx = i * BS, by = j * BS, d = Math.hypot(bx + BS / 2 - cx, by + BS / 2 - cy) / maxd; blocks.push({bx, by, del:d * 1000 + rnd(0, 420), dur:rnd(380, 640), j:rnd(-1, 1)}); }
const total = Math.max(...blocks.map(b => b.del + b.dur));
let T0 = 0; const draw = now => { const t = now - T0; x.clearRect(0, 0, vw, vh);
  blocks.forEach(b => { const p = (t - b.del) / b.dur; if (p >= 1) return;
    if (p <= 0) { x.fillStyle = '#050308'; x.fillRect(b.bx, b.by, BS, BS); return; }
    const s = 1 - p * p; x.globalAlpha = p < .5 ? .75 : 1 - p * .6; x.fillStyle = p < .25 ? '#ff7a1a' : p < .5 ? '#7a1a2a' : '#050308'; x.fillRect(b.bx + BS * (1 - s) / 2, b.by + BS * (1 - s) / 2 - p * 14 * b.j, BS * s, BS * s); });
  x.globalAlpha = 1; if (t < total) requestAnimationFrame(draw); else c.remove(); };
const start = () => { requestAnimationFrame(now => { T0 = now + 250; draw(now); de.classList.remove('rb'); }); };   // o véu escuro some só depois do 1º quadro de blocos
if (document.readyState === 'complete') setTimeout(start, 120); else addEventListener('load', () => setTimeout(start, 120));
setTimeout(() => { de.classList.remove('rb'); c.remove(); }, 6000);   // trava de segurança
})();
