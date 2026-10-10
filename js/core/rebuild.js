// Transição de blocos de brasa entre a capa e a seleção de classe.
//   PxT.reveal(ox, oy): a tela escura se desfaz em pixels a partir do ponto (0..1) e mostra a página
//   PxT.conceal(ox, oy): o caminho inverso, blocos de brasa cobrem a página a partir do ponto
// Na seleção de classe: se veio da capa, revela com blocos e deixa o botão voltar do celular refazer o caminho (sem zoom).
(() => {
const de = document.documentElement, BS = 14, rnd = (a, b) => a + Math.random() * (b - a), EMB = ['#ffe08a', '#ffb347', '#ff7a1a', '#c8381e'];
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function layer(ox, oy, fn) {
  const vw = innerWidth, vh = innerHeight, c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = vw; c.height = vh; c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9999;pointer-events:auto;image-rendering:pixelated;touch-action:none';
  document.body.appendChild(c);
  const cols = Math.ceil(vw / BS), rows = Math.ceil(vh / BS), cx = vw * ox, cy = vh * oy, maxd = Math.hypot(vw, vh) * .8, blocks = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const bx = i * BS, by = j * BS, d = Math.hypot(bx + BS / 2 - cx, (by + BS / 2 - cy) * 1.25) / maxd; blocks.push({bx, by, del:d * 1300 + rnd(0, 380), dur:rnd(420, 760), j:rnd(-1, 1), col:EMB[Math.floor(rnd(0, 4))]}); }
  const total = Math.max(...blocks.map(b => b.del + b.dur));
  return {c, x, blocks, total, vw, vh};
}
const VEIL = '#050308';
window.PxT = {
  reveal(ox = .5, oy = .78) {   // escuro -> página
    return new Promise(done => { const L = layer(ox, oy), {c, x, blocks, total, vw, vh} = L; let T0 = 0, shown = false;
      const draw = now => { const t = now - T0; x.clearRect(0, 0, vw, vh);
        blocks.forEach(b => { const p = (t - b.del) / b.dur; if (p >= 1) return;
          if (p <= 0) { x.globalAlpha = 1; x.fillStyle = VEIL; x.fillRect(b.bx, b.by, BS, BS); return; }
          const s = 1 - p * p * .9, y = b.by + BS * (1 - s) / 2 - p * 26 * (.4 + b.j * .4); x.globalAlpha = p < .4 ? .95 : 1 - p; x.fillStyle = p < .35 ? b.col : VEIL; x.fillRect(b.bx + BS * (1 - s) / 2, y, BS * s, BS * s); });
        x.globalAlpha = 1; if (t < total) requestAnimationFrame(draw); else { c.remove(); done(); } };
      requestAnimationFrame(now => { T0 = now + 150; draw(now); de.classList.remove('rb'); });   // o véu escuro da página some só depois do 1º quadro de blocos
      setTimeout(() => { de.classList.remove('rb'); c.remove(); done(); }, 7000); });   // trava de segurança
  },
  conceal(ox = .5, oy = .78) {  // página -> escuro
    return new Promise(done => { const L = layer(ox, oy), {c, x, blocks, total, vw, vh} = L; let T0 = 0;
      const draw = now => { const t = now - T0; x.clearRect(0, 0, vw, vh);
        blocks.forEach(b => { const p = (t - b.del) / b.dur; if (p <= 0) return;
          if (p >= 1) { x.globalAlpha = 1; x.fillStyle = VEIL; x.fillRect(b.bx, b.by, BS, BS); return; }
          const s = .5 + p * .5; x.globalAlpha = Math.min(1, p * 2); x.fillStyle = p < .6 ? b.col : VEIL; x.fillRect(b.bx + BS * (1 - s) / 2, b.by + BS * (1 - s) / 2, BS * s, BS * s); });
        x.globalAlpha = 1; if (t < total) requestAnimationFrame(draw); else done(); };
      requestAnimationFrame(now => { T0 = now; draw(now); });
      setTimeout(done, 5000); });
  }
};
// ----- seleção de classe -----
if (!document.getElementById('stage') && !document.body.hasAttribute('data-pxt')) return;
let on = false; try { on = !!sessionStorage.getItem('bd1_rebuild'); sessionStorage.removeItem('bd1_rebuild'); } catch (e) {}
if (on) { if (!document.body.hasAttribute('data-pxt')) try { history.pushState({sel:1}, ''); } catch (e) {}
  if (reduce()) de.classList.remove('rb');
  else { const go = () => setTimeout(() => PxT.reveal(.5, .78), 120); if (document.readyState === 'complete') go(); else addEventListener('load', go); } }
else de.classList.remove('rb');
// botão voltar do celular: os blocos de brasa cobrem a seleção e a capa se reconstrói (sem zoom)
if (history.state && history.state.sel && !document.body.hasAttribute('data-pxt')) { let leaving = false;
  addEventListener('popstate', () => { if (leaving) return; leaving = true;
    try { sessionStorage.setItem('bd1_cover_back', '1'); } catch (e) {}
    const back = () => { if (history.length > 1) history.go(-1); else location.replace('cover.html'); };
    if (reduce()) back(); else PxT.conceal(.5, .78).then(back); }); }
})();
