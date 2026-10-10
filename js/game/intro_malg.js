/* Banco de Dados I — RPG · abertura cinematográfica do Malgorath (boss 1) — "O Salão Acende"
   Escuro → manopla no braço do trono (brasas) → close do elmo: uma tocha acende e os olhos explodem em vermelho → recuo até o salão,
   as tochas acendem em cadeia revelando o tamanho do lugar → zoom no trono que pega fogo → flash → Malgorath de pé, capa aberta → flash → o jogo aparece.
   Mesmo contrato das outras aberturas: IntroMalg.play({voters, need, bots, onReveal}) → Promise.
   Imagens: assets/intro/malg_hand.webp, assets/intro/malg_face.webp, assets/intro/throne_far.webp (salão), assets/intro/malg_stand.webp. */
(() => {
'use strict';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, eo = t => 1 - Math.pow(1 - t, 3), ei = t => t * t * t;
const lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a);
const IMG = {hand:'assets/intro/malg_hand.webp', face:'assets/intro/malg_face.webp', far:'assets/intro/throne_far.webp', stand:'assets/intro/malg_stand.webp'};
const EYES = [[.441, .331], [.541, .328]], EYEC = [.491, .33];          // olhos na imagem do rosto (fração)
const TORCH_FACE = [.035, .1];                                          // tocha acesa à esquerda do rosto
const BOSS_FAR = [.5, .31];                                             // trono no salão (fração)
const TORCHES = [[.04,.575],[.956,.576],[.04,.69],[.953,.69],[.143,.69],[.857,.69],[.252,.575],[.74,.58],[.066,.432],[.929,.432],[.248,.424],[.745,.422],[.128,.366],[.862,.364],[.349,.281],[.636,.283],[.236,.271],[.76,.27],[.205,.19],[.29,.175],[.697,.178]]
  .map(([x, y], i) => [x, y]).sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0] - .5) - Math.abs(b[0] - .5)));   // de baixo (perto) para cima (longe)
// falas: digitação (30 ms/letra) + leitura (1,1 s + 40 ms/letra)
const TXT = ['Faz séculos que ninguém cruza aquelas portas.', 'Cada tocha deste salão foi acesa por alguém que falhou.', 'Quatro... Vão queimar bem.', 'Venham. Quero ver até onde chegam.'];
let _c = 4400; const LINES = TXT.map(s => { const a = _c, b = a + s.length * 30 + 1100 + s.length * 40; _c = b + 250; return [a, b, s]; });
const L1 = LINES[0][1], L2 = LINES[1][1], L4 = LINES[3][1];
const T = {handIn:[500, 1900], faceIn:[2900, 4000], torch:3350, ignite:4150,
  farIn:[L1 + 100, L1 + 2300], pull:[L1 + 100, L1 + 3800], chain:[L1 + 900, L1 + 4300], zoom:[L2 - 1900, L2], flash:L2, stand:[L2 - 150, L2 + 250],
  white:[L4 - 500, L4 + 600], reveal:L4 + 600, end:L4 + 1800};

function load(src){ return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }

function build(){
  const root = document.createElement('div'); root.className = 'intro mal'; root.id = 'intro-mal';
  root.innerHTML = `<div class="ic-stage"><div class="ic-view">
    <div class="ic-layer mg-hand"><img alt=""></div>
    <div class="ic-layer mg-face"><img alt=""><i class="mg-eye"></i><i class="mg-eye"></i><i class="mg-flare"></i></div>
    <div class="ic-layer mg-far"><img alt=""><canvas class="mg-dark"></canvas></div>
    <div class="ic-layer mg-stand"><img alt=""></div></div>
    <canvas class="ic-fx"></canvas><div class="ic-vig mg-vig"></div><div class="ic-flash mg-flash"></div><div class="ic-bar t"></div><div class="ic-bar b"></div>
    <div class="in-cap" hidden><i>MALGORATH</i><span></span></div></div>
    <button class="in-skip" type="button" hidden>PULAR · <b>0/1</b></button>`;
  document.body.append(root); return root;
}

function play({voters = 1, need = 1, bots = false, onReveal = () => {}} = {}){
  return new Promise(async resolve => {
    const root = build(), $ = s => root.querySelector(s);
    const stage = $('.ic-stage'), view = $('.ic-view'), hand = $('.mg-hand'), face = $('.mg-face'), far = $('.mg-far'), stand = $('.mg-stand'),
      iHand = hand.querySelector('img'), iFace = face.querySelector('img'), iFar = far.querySelector('img'), iStand = stand.querySelector('img'),
      eyes = [...root.querySelectorAll('.mg-eye')], flare = $('.mg-flare'), dk = $('.mg-dark'), fx = $('.ic-fx'), vig = $('.mg-vig'), flash = $('.mg-flash'), bars = [...root.querySelectorAll('.ic-bar')],
      cap = $('.in-cap'), capTxt = cap.querySelector('span'), btn = $('.in-skip'), cnt = btn.querySelector('b');
    const imgs = await Promise.all([load(IMG.hand), load(IMG.face), load(IMG.far), load(IMG.stand)]);
    [iHand.src, iFace.src, iFar.src, iStand.src] = [IMG.hand, IMG.face, IMG.far, IMG.stand];
    const ctx = fx.getContext('2d'), dc = dk.getContext('2d');
    let yes = 0, mine = false, skipped = false, revealed = false, done = false, t0 = performance.now(), lastNow = t0, W = 0, H = 0, sparks = [], evs = [], shake = {a:0, t:0, d:1}, flashA = 0, lit = TORCHES.map(() => -1), tsim = [];
    const paintBtn = () => { cnt.textContent = `${yes}/${need}`; btn.classList.toggle('selected', mine); };
    btn.onclick = () => { if (done || revealed) return; mine = !mine; yes += mine ? 1 : -1; paintBtn(); if (yes >= need) skip(); };
    paintBtn();
    if (bots) for (let i = 0; i < voters - 1; i++) setTimeout(() => { if (done || revealed || skipped || Math.random() > .5) return; yes++; paintBtn(); if (yes >= need) skip(); }, 1500 + i * 900);
    function skip(){ if (skipped) return; skipped = true; const t = performance.now() - t0; if (t < T.white[0]) t0 -= (T.white[0] - t); }
    window.__introSkip = skip; window.__introSeek = ms => { t0 = performance.now() - ms; lit = TORCHES.map((_, i) => T.chain[0] + (T.chain[1] - T.chain[0]) * (i / (TORCHES.length - 1)) ** .9 < ms ? performance.now() - 3000 : -1); evs.forEach(e => { e.done = e.t < ms; }); };

    // cada camada tem o tamanho da imagem "cover" dentro da janela (as sobreposições usam fração da imagem)
    function fit(){
      const r = view.getBoundingClientRect(); W = r.width; H = r.height;
      [[hand, imgs[0]], [face, imgs[1]], [far, imgs[2]], [stand, imgs[3]]].forEach(([el, im]) => { if (!im) return; const s = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
        el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.left = (W - w) / 2 + 'px'; el.style.top = (H - h) / 2 + 'px'; });
      const sr = stage.getBoundingClientRect(); fx.width = Math.round(sr.width); fx.height = Math.round(sr.height);
      if (imgs[2]) { dk.width = Math.round(imgs[2].naturalWidth / 4); dk.height = Math.round(imgs[2].naturalHeight / 4); }
    }
    fit(); window.addEventListener('resize', fit);
    const pt = (el, f) => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return [r.left - s.left + r.width * f[0], r.top - s.top + r.height * f[1]]; };
    const setShake = (a, d) => { shake = {a, t:performance.now(), d}; };
    const ev = (t, fn) => evs.push({t, fn, done:false});
    function ember(x, y, n, sp = 1, spread = 0){ for (let i = 0; i < n; i++) sparks.push({x:x + rnd(-spread, spread), y:y + rnd(-spread * .3, spread * .3), vx:rnd(-14, 14) * sp, vy:-rnd(30, 120) * sp, s:Math.random() < .25 ? 3 : 2, born:performance.now(), life:rnd(900, 2400), ph:rnd(0, 6.28), hot:Math.random()}); }
    function burst(x, y, n, sp){ for (let i = 0; i < n; i++) { const an = rnd(0, 6.283), v = rnd(.3, 1) * sp; sparks.push({x, y, vx:Math.cos(an) * v, vy:Math.sin(an) * v - sp * .15, s:Math.random() < .3 ? 4 : 3, born:performance.now(), life:rnd(700, 1600), ph:0, hot:Math.random(), g:1}); } }
    // eventos
    ev(T.torch, () => setShake(1.5, 300));
    ev(T.ignite, () => { setShake(9, 800); const [x, y] = pt(face, EYEC); burst(x, y, 44, 520); flashA = .55; });
    ev(L1 + 150, () => setShake(2, 500));
    TORCHES.forEach((tc, i) => ev(T.chain[0] + (T.chain[1] - T.chain[0]) * (i / (TORCHES.length - 1)) ** .9, () => { lit[i] = performance.now(); const [x, y] = pt(far, tc); burst(x, y, 6, 160); if (i % 5 === 0) setShake(1.6, 220); }));
    ev(T.zoom[0], () => setShake(3, 1700));
    ev(T.flash, () => { setShake(16, 1300); flashA = 1; const [x, y] = [fx.width / 2, fx.height * .72]; burst(x, y, 90, 780); });
    ev(T.white[0], () => setShake(5, 900));
    ev(T.reveal, () => { setShake(9, 800); burst(fx.width / 2, fx.height * .62, 70, 700); });

    function frame(now){
      if (done) return; const t = now - t0, dt = Math.min(50, now - lastNow); lastNow = now;
      evs.forEach(e => { if (!e.done && t >= e.t) { e.done = true; e.fn(); } });
      const flick = Math.sin(t * .04) * Math.sin(t * .013) > .12 ? 1 : .55;
      // ---- 1. manopla ----
      const hOp = (t < T.handIn[0] ? 0 : eio(seg(t, ...T.handIn))) * (t < T.handIn[1] + 600 ? (.7 + .3 * flick) : 1) * (1 - eio(seg(t, T.faceIn[0], T.faceIn[1])));
      hand.style.opacity = hOp; hand.style.transformOrigin = '55% 62%'; hand.style.transform = `translate(${Math.sin(t * .0007) * 4}px,${Math.cos(t * .0009) * 3}px) scale(${lerp(1.02, 1.2, eio(seg(t, T.handIn[0], T.faceIn[1] + 400)))})`;
      iHand.style.filter = `brightness(${(.85 + .3 * (.5 + .5 * Math.sin(t * .006)) * seg(t, T.handIn[0], T.handIn[1])).toFixed(3)})`;
      // ---- 2. rosto: a tocha acende, os olhos explodem ----
      const fOp = eio(seg(t, ...T.faceIn)) * (1 - eio(seg(t, T.pull[0] + 600, T.pull[0] + 2400)));
      const sF = t < T.ignite ? lerp(1.0, 1.1, eio(seg(t, T.faceIn[0], T.ignite))) : t < L1 ? lerp(1.1, 1.18, seg(t, T.ignite, L1)) : lerp(1.18, .86, eio(seg(t, T.pull[0], T.pull[0] + 2600)));
      face.style.opacity = fOp; face.style.transformOrigin = `${EYEC[0] * 100}% ${EYEC[1] * 100}%`; face.style.transform = `translate(${Math.sin(t * .0008) * 3}px,${Math.cos(t * .001) * 2}px) scale(${sF})`;
      const lightK = seg(t, T.torch, T.torch + 500) * .45 + seg(t, T.ignite - 100, T.ignite + 350) * .55;
      iFace.style.filter = `brightness(${(.22 + .78 * lightK * (t < T.ignite ? (.82 + .18 * flick) : 1)).toFixed(3)})`;
      const burstE = t >= T.ignite ? Math.max(0, 1 - seg(t, T.ignite, T.ignite + 1000)) : 0, settle = t >= T.ignite ? (.5 + .25 * Math.sin(t * .01)) * seg(t, T.ignite, T.ignite + 400) : 0, eA = clamp(burstE + settle);
      eyes.forEach((e, i) => { e.style.left = EYES[i][0] * 100 + '%'; e.style.top = EYES[i][1] * 100 + '%'; e.style.opacity = eA; e.style.transform = `translate(-50%,-50%) scale(${1 + burstE * 1.8})`; });
      flare.style.left = EYEC[0] * 100 + '%'; flare.style.top = EYEC[1] * 100 + '%'; flare.style.opacity = burstE * .9; flare.style.transform = `translate(-50%,-50%) scaleX(${.3 + eo(seg(t, T.ignite, T.ignite + 500)) * 1.2})`;
      // ---- 3. salão: escuro; as tochas acendem em cadeia ----
      const sFar = lerp(2.5, 1, eio(seg(t, ...T.pull))) * lerp(1, 2.7, ei(seg(t, ...T.zoom))), farOp = eio(seg(t, ...T.farIn)) * (1 - seg(t, T.stand[0], T.stand[1]));
      far.style.opacity = farOp; far.style.transformOrigin = `${BOSS_FAR[0] * 100}% ${BOSS_FAR[1] * 100}%`; far.style.transform = `scale(${sFar})`;
      if (farOp > .01) {
        const cw = dk.width, ch = dk.height, nLit = lit.filter(v => v > 0).length, full = nLit / TORCHES.length;
        dc.globalCompositeOperation = 'source-over'; dc.clearRect(0, 0, cw, ch); dc.fillStyle = `rgba(3,0,8,${(.94 - .3 * full - .4 * seg(t, T.zoom[0], T.zoom[1])).toFixed(3)})`; dc.fillRect(0, 0, cw, ch);
        dc.globalCompositeOperation = 'destination-out';
        TORCHES.forEach((tc, i) => { if (lit[i] < 0) return; const u = (now - lit[i]) / 1000, r = cw * (.11 + .09 * eo(clamp(u * 1.2)) + .05 * Math.max(0, 1 - u * 3)) * (.95 + .05 * Math.sin(t * .02 + i));
          const g = dc.createRadialGradient(tc[0] * cw, tc[1] * ch, 0, tc[0] * cw, tc[1] * ch, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); dc.fillStyle = g; dc.fillRect(0, 0, cw, ch); });
        dc.globalCompositeOperation = 'source-over';
        TORCHES.forEach((tc, i) => { if (lit[i] < 0) return; const u = (now - lit[i]) / 1000, a = Math.max(0, 1 - u * 2.2) * .55; if (a <= .01) return; const r = cw * .06 * (1 + u);
          const g = dc.createRadialGradient(tc[0] * cw, tc[1] * ch, 0, tc[0] * cw, tc[1] * ch, r); g.addColorStop(0, `rgba(255,220,150,${a})`); g.addColorStop(1, 'rgba(255,120,40,0)'); dc.fillStyle = g; dc.fillRect(0, 0, cw, ch); });
      }
      // ---- 4. Malgorath de pé ----
      const stOp = eio(seg(t, T.stand[0], T.stand[1])) * (1 - seg(t, T.white[0] + 300, T.white[1] + 200));
      stand.style.opacity = stOp; stand.style.transformOrigin = '50% 38%'; stand.style.transform = `scale(${t < T.flash ? 1.3 : lerp(1.2, 1.0, eo(seg(t, T.flash, L4))) * lerp(1, .86, ei(seg(t, T.white[0], T.white[1])))})`;
      iStand.style.filter = `brightness(${(.95 + .1 * Math.sin(t * .02) * Math.sin(t * .0073) + .35 * Math.max(0, 1 - seg(t, T.flash, T.flash + 500))).toFixed(3)})`;
      // ---- legenda ----
      const L = LINES.find(l => t >= l[0] && t < l[1]);
      if (L) { const n = Math.min(L[2].length, Math.floor((t - L[0]) / 30) + 1); cap.hidden = false; capTxt.textContent = L[2].slice(0, n); cap.classList.toggle('done', n >= L[2].length); cap.style.opacity = Math.min(1, seg(t, L[0], L[0] + 200)) * (1 - seg(t, L[1] - 250, L[1])); } else cap.hidden = true;
      btn.hidden = !(t > 500 && t < T.white[0] && !skipped);
      // ---- tarjas, vinheta, flash, tremor ----
      const bh = eio(seg(t, 200, 1400)); bars.forEach(b => { b.style.transform = `scaleY(${bh})`; });
      vig.style.opacity = .8 + .2 * Math.sin(t * .003);
      flashA = Math.max(0, flashA - dt / 600); const wh = eio(seg(t, ...T.white)) * (1 - eio(seg(t, T.reveal, T.end))); flash.style.opacity = Math.max(flashA * .9, wh);
      const sk = shake.a * Math.max(0, 1 - (performance.now() - shake.t) / shake.d); stage.style.transform = sk > .05 ? `translate(${(Math.random() - .5) * 2 * sk}px,${(Math.random() - .5) * 2 * sk}px)` : '';
      // ---- brasas em tela (mais densas conforme a cena esquenta) ----
      ctx.clearRect(0, 0, fx.width, fx.height);
      // chamas pixel art nas tochas já acesas (js/core/pxfx.js): brilham por cima da escuridão do salão
      if (window.PXFX && farOp > .01) { const r = far.getBoundingClientRect(), so = stage.getBoundingClientRect(), cell = Math.max(2, Math.round(r.width * .0036));
        TORCHES.forEach((tc, i) => { if (lit[i] < 0) return; const sim = tsim[i] || (tsim[i] = PXFX.sim.make(9, 18, 'fire')), k = Math.min(1, (now - lit[i]) / 500);
          PXFX.sim.step(sim, now, x => { const xn = (x / sim.cols - .5) * 2; return 35 * Math.max(0, 1 - Math.pow(Math.abs(xn), 1.5)) * k * (.75 + .25 * Math.random()); }, 0, 1);
          ctx.save(); PXFX.sim.draw(ctx, sim, r.left - so.left + r.width * tc[0], r.top - so.top + r.height * (tc[1] + .018), cell, farOp); ctx.restore(); }); }
      const rate = t < T.faceIn[0] ? 9 : t < L1 ? 12 : t < T.zoom[0] ? 14 + 18 * seg(t, T.chain[0], T.chain[1]) : t < T.flash ? 50 : 70;
      if (Math.random() < rate * dt / 1000) ember(rnd(0, fx.width), fx.height * rnd(.72, 1), 1, 1);
      if (t > T.zoom[0] && t < L4 + 400 && Math.random() < (t < T.flash ? 70 : 110) * dt / 1000) ember(fx.width * rnd(.3, .7), fx.height * rnd(.55, .8), 1, 1.4, fx.width * .12);
      if (t > T.faceIn[0] && t < T.ignite + 400 && Math.random() < 5 * dt / 1000) { const [x, y] = pt(face, TORCH_FACE); ember(x, y, 1, .6, 6); }
      if (t > T.zoom[0] && t < T.stand[1] + 200) {   // o trono pega fogo: brilho de chamas crescente atrás do Malgorath
        const k = eo(seg(t, T.zoom[0], T.flash)), [gx, gy] = pt(far, BOSS_FAR), r = fx.width * (.12 + .5 * k), fl = .85 + .15 * Math.sin(t * .03) * Math.sin(t * .011);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(gx, gy + r * .25, 0, gx, gy + r * .25, r);
        g.addColorStop(0, `rgba(255,210,120,${.55 * k * fl})`); g.addColorStop(.35, `rgba(255,100,30,${.4 * k * fl})`); g.addColorStop(1, 'rgba(160,20,0,0)'); ctx.fillStyle = g; ctx.fillRect(gx - r, gy - r, r * 2, r * 2.4); ctx.restore();
        if (Math.random() < 90 * k * dt / 1000) ember(gx, gy + r * .3, 1, 1.6, r * .35);
      }
      const nowP = performance.now(); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      sparks = sparks.filter(s => { const u = (nowP - s.born) / s.life; if (u >= 1) return false; const k = u * s.life / 1000;
        const x = s.x + s.vx * k + Math.sin(k * 3 + s.ph) * 6, y = s.y + s.vy * k + (s.g ? 220 * k * k * .5 : 0), a = Math.sin(Math.PI * Math.pow(u, .6)) * (.55 + .45 * s.hot);
        ctx.fillStyle = s.hot > .6 ? `rgba(255,${190 + (s.hot * 50 | 0)},110,${a})` : `rgba(255,${90 + (s.hot * 90 | 0)},40,${a})`; const z = s.s * (1 - u * .5); ctx.fillRect(Math.round(x), Math.round(y), z, z); return true; });
      ctx.restore();
      // ---- jogo aparece ----
      if (!revealed && t >= T.reveal) { revealed = true; onReveal(); }
      if (t >= T.reveal) root.style.opacity = 1 - eio(seg(t, T.reveal, T.end));
      if (t >= T.end) { done = true; window.removeEventListener('resize', fit); root.remove(); stage.style.transform = ''; btn.onclick = null; resolve(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
window.IntroMalg = {play, T, LINES};
})();
