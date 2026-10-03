/* Abertura da batalha: escuro → boss no trono (olhos acendem) → zoom para trás até o salão → fumaça engole o trono →
   o jogo aparece e o boss se materializa em fumaça no campo. O grupo pode votar para PULAR (maioria). */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, eo = t => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const T = {fadeIn:[900, 2000], push:[2000, 8700], pull:[8700, 12500], crossA:[8900, 10900], hold:12500, smoke:26000, black:[26800, 27600], reveal:27600, end:28600};
// falas do boss: [início, fim, texto]
const LINES = [[2600, 8700, 'Quem ousa invadir o meu castelo?'], [9000, 15600, 'Estes insetos estão com interesse em morrer, huh?!'], [15900, 21300, 'Muito bem...'], [21600, 27600, 'Espero que consigam me entreter!']];   // cada fala: digitando + ~5 s parada
const BOSS_CLOSE = [.5, .47], BOSS_FAR = [.5, .31], EYES = [.50, .295];   // posições (fração da imagem)

function load(src){ return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }

function play({voters = 1, need = 1, bots = false, onReveal = () => {}} = {}){
  const root = $('#intro'); if (!root) { onReveal(); return Promise.resolve(); }
  return new Promise(async resolve => {
    root.hidden = false; root.style.opacity = 1; root.classList.remove('out');
    const stage = root.querySelector('.in-stage'), close = root.querySelector('.in-close'), far = root.querySelector('.in-far'),
          eyes = root.querySelector('.in-eyes'), cv = root.querySelector('.in-smoke'), cap = root.querySelector('.in-cap'), capTxt = cap.querySelector('span'), btn = root.querySelector('.in-skip'), cnt = btn.querySelector('b');
    await Promise.race([Promise.all([load(close.src), load(far.src)]), new Promise(r => setTimeout(r, 2500))]);
    let yes = 0, mine = false, skipped = false, revealed = false, done = false, t0 = performance.now(), parts = [], lastT = 0;
    const paintBtn = () => { cnt.textContent = `${yes}/${need}`; btn.classList.toggle('selected', mine); };
    btn.onclick = () => { if (done || revealed) return; mine = !mine; yes += mine ? 1 : -1; paintBtn(); if (yes >= need) skip(); };
    btn.hidden = true; paintBtn();
    if (bots) for (let i = 0; i < voters - 1; i++) setTimeout(() => { if (done || revealed || skipped || Math.random() > .5) return; yes++; paintBtn(); if (yes >= need) skip(); }, 1500 + i * 900);   // modo teste: o resto do grupo vota sozinho
    function skip(){ if (skipped) return; skipped = true; const t = performance.now() - t0; if (t < T.black[0]) t0 -= (T.black[0] - t); }
    window.__introSkip = skip;
    const ctx = cv.getContext('2d'); const fit = () => { cv.width = stage.clientWidth; cv.height = stage.clientHeight; }; fit();
    // fumaça (violeta escuro) em volta de um ponto da tela
    function puff(cx, cy, scale){
      for (let i = 0; i < 64; i++) parts.push({x:cx + (Math.random() - .5) * 150 * scale, y:cy + (Math.random() - .5) * 210 * scale,
        vx:(Math.random() - .5) * 26 * scale, vy:-(10 + Math.random() * 36) * scale, r0:(14 + Math.random() * 26) * scale, r1:(42 + Math.random() * 62) * scale,
        born:performance.now() + Math.random() * 260, life:1200 + Math.random() * 600});
    }
    const bossPx = (img, [fx, fy]) => { const r = img.getBoundingClientRect(), s = stage.getBoundingClientRect(); return [r.left - s.left + r.width * fx, r.top - s.top + r.height * fy, r.width]; };
    let puffed = false;
    function frame(now){
      if (done) return; const t = now - t0;
      // ---- câmera ----
      const flick = t < T.fadeIn[1] + 500 ? (Math.sin(t * .04) * Math.sin(t * .013) > .15 ? 1 : .35) : 1;
      const aClose = (t < T.fadeIn[0] ? 0 : eio(seg(t, ...T.fadeIn))) * flick * (1 - eio(seg(t, ...T.crossA)));
      const sClose = t < T.pull[0] ? lerp(1.1, 1.22, seg(t, T.fadeIn[0], T.push[1])) : lerp(1.22, .8, eio(seg(t, ...T.pull)));
      close.style.opacity = aClose; close.style.transformOrigin = `${BOSS_CLOSE[0] * 100}% ${BOSS_CLOSE[1] * 100}%`; close.style.transform = `scale(${sClose})`;
      const aFar = eio(seg(t, T.crossA[0] + 200, T.crossA[1] + 100)) * (1 - eio(seg(t, T.black[0], T.black[1])));
      const sFar = lerp(3, 1, eio(seg(t, ...T.pull))) + .05 * seg(t, T.hold, T.smoke);   // depois do zoom, deriva bem devagar
      far.style.opacity = aFar; far.style.transformOrigin = `${BOSS_FAR[0] * 100}% ${BOSS_FAR[1] * 100}%`; far.style.transform = `scale(${sFar})`;
      far.style.filter = `brightness(${(.9 + .1 * Math.sin(t * .02) * Math.sin(t * .0071)).toFixed(3)})`;
      // olhos vermelhos pulsando
      const eyeA = seg(t, 2600, 3400) * (1 - seg(t, T.crossA[0], T.crossA[1])) * (.65 + .35 * Math.sin(t * .012));
      eyes.style.opacity = eyeA; eyes.style.left = EYES[0] * 100 + '%'; eyes.style.top = EYES[1] * 100 + '%';
      eyes.style.transform = `translate(-50%,-50%) scale(${sClose})`;   // acompanha o zoom da imagem de perto
      const eo_ = close.getBoundingClientRect(), so = stage.getBoundingClientRect();
      eyes.style.left = (eo_.left - so.left + eo_.width * EYES[0]) + 'px'; eyes.style.top = (eo_.top - so.top + eo_.height * EYES[1]) + 'px';
      // ---- fala do boss (digitando) ----
      const L = LINES.find(l => t >= l[0] && t < l[1]);
      if (L) { const n = Math.min(L[2].length, Math.floor((t - L[0]) / 32) + 1); cap.hidden = false; capTxt.textContent = L[2].slice(0, n); cap.classList.toggle('done', n >= L[2].length);
        cap.style.opacity = Math.min(1, seg(t, L[0], L[0] + 200)) * (1 - seg(t, L[1] - 250, L[1])); } else cap.hidden = true;
      // ---- botão de pular ----
      btn.hidden = !(t > 500 && t < T.smoke + 400 && !skipped);
      // ---- fumaça no trono ----
      if (!puffed && t >= T.smoke && !skipped) { puffed = true; const [x, y, w] = bossPx(far, BOSS_FAR); puff(x, y, w / 420); }
      // ---- revelar o jogo ----
      if (!revealed && t >= T.reveal) { revealed = true; parts = []; onReveal(); }
      // ---- desenha fumaça ----
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of parts) { const u = (now - p.born) / p.life; if (u < 0 || u > 1) continue;
        const r = lerp(p.r0, p.r1, eo(u)), a = Math.sin(Math.PI * Math.pow(u, .7)) * .85, x = p.x + p.vx * u * 2, y = p.y + p.vy * u * 2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(46,10,64,${a * .8})`); g.addColorStop(.45, `rgba(26,5,38,${a * .45})`); g.addColorStop(1, 'rgba(10,0,16,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
      // ---- sai da frente ----
      if (t >= T.reveal) { const k = seg(t, T.reveal, T.end); root.style.opacity = 1 - eio(k); }
      if (t >= T.end) { done = true; root.hidden = true; root.style.opacity = 1; btn.onclick = null; resolve(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
window.Intro = {play};
})();
