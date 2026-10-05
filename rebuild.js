// Entrada na seleção de classe vinda da capa: o menu se reconstrói de baixo para cima (dos heróis), com brasas na frente da onda
(() => {
const de = document.documentElement;
let on = false, mode = ''; try { mode = sessionStorage.getItem('bd1_rebuild') || ''; on = !!mode; sessionStorage.removeItem('bd1_rebuild'); } catch (e) {}
if (!on || matchMedia('(prefers-reduced-motion: reduce)').matches) { de.classList.remove('rb'); return; }
if (mode === 'book') {   // continua a página do livro: o capítulo "A ESCOLHA" se dissolve revelando o menu
  const ov = document.createElement('div'), u = Math.min(innerWidth, 560) / 100;
  ov.style.cssText = `position:fixed;inset:0;z-index:9999;pointer-events:none;background:radial-gradient(ellipse at 50% 42%,#4a3019 0,#2a190c 55%,#150a05 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${u * 3.2}px;font-family:OpenC,OpenCl,OpenD,'Pixelify Sans',monospace;font-weight:700;text-align:center;color:#e8d3a0`;
  ov.innerHTML = `<div style="position:absolute;left:${(innerWidth - Math.min(innerWidth, 560)) / 2 + Math.min(innerWidth, 560) * .035}px;right:${(innerWidth - Math.min(innerWidth, 560)) / 2 + Math.min(innerWidth, 560) * .035}px;top:3.5%;bottom:3.5%;border:${u * .9}px solid #b8893a;box-shadow:inset 0 0 0 ${u}px #2a190c,inset 0 0 0 ${u * 1.7}px #8a6a2a;background:rgba(10,4,2,.22)"></div>
    <small style="position:relative;font-size:${u * 3}px;letter-spacing:${u}px;color:#a98a52">CAPÍTULO I</small><b style="position:relative;font-size:${u * 7.6}px;letter-spacing:${u * .8}px;color:#ffd978;text-shadow:0 ${u * .7}px 0 #3a1a06,0 0 ${u * 3}px rgba(255,190,80,.5)">A ESCOLHA</b>
    <span style="position:relative;width:${u * 34}px;height:${u * .7}px;background:linear-gradient(90deg,transparent,#c8902c,transparent)"></span><small style="position:relative;font-size:${u * 2.8}px;letter-spacing:${u * .4}px;color:#bfa570;line-height:1.5">quatro heróis, uma só chance</small>`;
  document.body.appendChild(ov);
  const st2 = document.createElement('style'); st2.textContent = '@keyframes rbIn{from{transform:scale(1.05);filter:brightness(.5)}to{transform:none;filter:none}}#stage,#above{animation:rbIn 1.6s cubic-bezier(.2,.6,.2,1) both}'; document.head.appendChild(st2);
  const go = () => { de.classList.remove('rb'); ov.animate([{opacity:1, filter:'blur(0px)'}, {opacity:0, filter:'blur(6px)'}], {duration:1100, easing:'ease-in', delay:350, fill:'forwards'}).onfinish = () => { ov.remove(); st2.remove(); }; };
  if (document.readyState === 'complete') setTimeout(go, 150); else addEventListener('load', () => setTimeout(go, 150));
  setTimeout(() => { de.classList.remove('rb'); ov.remove(); st2.remove(); }, 7000);
  return;
}
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
