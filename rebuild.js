// Entrada na seleção de classe vinda da capa: o menu se reconstrói de baixo para cima (dos heróis), com brasas na frente da onda
(() => {
const de = document.documentElement;
let on = false; try { on = !!sessionStorage.getItem('bd1_rebuild'); sessionStorage.removeItem('bd1_rebuild'); } catch (e) {}
if (!on || matchMedia('(prefers-reduced-motion: reduce)').matches) { de.classList.remove('rb'); return; }
const st = document.createElement('style'); st.textContent = '@keyframes rbIn{from{transform:scale(1.08);filter:brightness(.35) saturate(1.5)}60%{filter:brightness(.9)}to{transform:none;filter:none}}#stage,#above{animation:rbIn 2.1s cubic-bezier(.2,.6,.2,1) both;transform-origin:50% 78%}'; document.head.appendChild(st);
const BS = 14, vw = innerWidth, vh = innerHeight, c = document.createElement('canvas'), x = c.getContext('2d');
c.width = vw; c.height = vh; c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;image-rendering:pixelated';
document.body.appendChild(c);
const cols = Math.ceil(vw / BS), rows = Math.ceil(vh / BS), cx = vw / 2, cy = vh * .78, maxd = Math.hypot(vw, vh) * .8, rnd = (a, b) => a + Math.random() * (b - a);
const blocks = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const bx = i * BS, by = j * BS, d = Math.hypot(bx + BS / 2 - cx, (by + BS / 2 - cy) * 1.25) / maxd; blocks.push({bx, by, del:d * 1300 + rnd(0, 380), dur:rnd(420, 760), j:rnd(-1, 1), col:['#ffe08a', '#ffb347', '#ff7a1a', '#c8381e'][Math.floor(rnd(0, 4))]}); }
const total = Math.max(...blocks.map(b => b.del + b.dur));
let T0 = 0; const draw = now => { const t = now - T0; x.clearRect(0, 0, vw, vh);
  blocks.forEach(b => { const p = (t - b.del) / b.dur; if (p >= 1) return;
    if (p <= 0) { x.globalAlpha = 1; x.fillStyle = '#050308'; x.fillRect(b.bx, b.by, BS, BS); return; }
    const s = 1 - p * p * .9, y = b.by + BS * (1 - s) / 2 - p * 26 * (.4 + b.j * .4); x.globalAlpha = p < .4 ? .95 : 1 - p; x.fillStyle = p < .35 ? b.col : '#050308'; x.fillRect(b.bx + BS * (1 - s) / 2, y, BS * s, BS * s); });
  x.globalAlpha = 1; if (t < total) requestAnimationFrame(draw); else { c.remove(); st.remove(); } };
const start = () => { requestAnimationFrame(now => { T0 = now + 150; draw(now); de.classList.remove('rb'); }); };   // o véu escuro some só depois do 1º quadro de blocos
if (document.readyState === 'complete') setTimeout(start, 120); else addEventListener('load', () => setTimeout(start, 120));
setTimeout(() => { de.classList.remove('rb'); c.remove(); st.remove(); }, 7000);   // trava de segurança
})();
