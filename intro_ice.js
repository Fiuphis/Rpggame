/* Banco de Dados I — RPG · abertura cinematográfica do Hrimgar (chefe de gelo)
   Escuro e nevasca → Hrimgar selado no pilar de gelo (close) → o gelo racha e ele abre os olhos (impacto + zoom nos olhos) →
   a câmera recua até a nave da catedral (fusão com a imagem aberta) → rachaduras brilhantes sobem pelo pilar → o pilar estilhaça →
   nevasca branca engole a tela → o jogo aparece. Mesmo contrato da abertura do Malgorath: IntroIce.play({voters, need, bots, onReveal}) → Promise.
   Imagens: intro/ice_close.webp (selado), intro/ice_crack.webp (rachando, olhos abertos; mesmo enquadramento do close), intro/ice_far.webp (nave). */
(() => {
'use strict';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, eo = t => 1 - Math.pow(1 - t, 3), ei = t => t * t * t;
const lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a);
const IMG = {close:'intro/ice_close.webp', crack:'intro/ice_crack.webp', far:'intro/ice_far.webp'};
const EYES = [[.471, .294], [.523, .293]], EYEC = [.497, .293];                   // olhos do Hrimgar na imagem do close (fração da imagem)
const PIL = {x:.5, y:.52, x0:.455, x1:.545, y0:.335, y1:.645};                     // pilar na imagem da nave
// falas: tempo de cada uma = digitação (30 ms/letra) + pausa de leitura (1,2 s + 45 ms/letra)
const TXT = ['Quem rompeu o meu sono?', 'Séculos de gelo... e vocês ainda respiram.', 'Muito bem.', 'Vou congelar a resposta na garganta de vocês.'];
let _c = 2600; const LINES = TXT.map(s => { const a = _c, b = a + s.length * 30 + 1200 + s.length * 45; _c = b + 250; return [a, b, s]; });
const L1 = LINES[0][1], L4 = LINES[3][1];
const T = {fadeIn:[800, 2200], crack:L1 - 1000, open:L1, punch:[L1 + 200, L1 + 1200], pull:[L1 + 1700, L1 + 5200], closeOut:[L1 + 2000, L1 + 3600], farIn:[L1 + 2400, L1 + 4000],
  cracks:[L1 + 3600, L4 - 1100], shatter:L4 - 1100, white:[L4 - 500, L4 + 700], reveal:L4 + 700, end:L4 + 2000};

function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function genCracks(){ const r = mulberry(11), out = [];
  for (let i = 0; i < 13; i++) { let x = PIL.x + (r() - .5) * .03, y = PIL.y - .05 + (r() - .3) * .1, a = i / 13 * 6.283 + r() * .6; const pts = [[x, y]], n = 10 + (r() * 9 | 0);
    for (let k = 0; k < n; k++) { a += (r() - .5) * 1.1; const l = .007 + r() * .012; x = clamp(x + Math.cos(a) * l * .8, PIL.x0, PIL.x1); y = clamp(y + Math.sin(a) * l * 1.25, PIL.y0, PIL.y1); pts.push([x, y]); }
    out.push({pts, delay:r() * .4}); }
  return out; }

function load(src){ return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }

function build(){
  const root = document.createElement('div'); root.className = 'intro ice'; root.id = 'intro-ice';
  root.innerHTML = `<div class="ic-stage"><div class="ic-view">
    <div class="ic-layer ic-face"><img class="ic-close" alt=""><img class="ic-crack" alt=""><i class="ic-eye"></i><i class="ic-eye"></i><i class="ic-flare"></i></div>
    <div class="ic-layer ic-far"><img class="ic-farimg" alt=""><canvas class="ic-cr"></canvas></div></div>
    <canvas class="ic-fx"></canvas><div class="ic-vig"></div><div class="ic-flash"></div><div class="ic-bar t"></div><div class="ic-bar b"></div>
    <div class="in-cap" hidden><i>HRIMGAR</i><span></span></div></div>
    <button class="in-skip" type="button" hidden>PULAR · <b>0/1</b></button>`;
  document.body.append(root); return root;
}

function play({voters = 1, need = 1, bots = false, onReveal = () => {}} = {}){
  return new Promise(async resolve => {
    const root = build(), $ = s => root.querySelector(s);
    const stage = $('.ic-stage'), view = $('.ic-view'), face = $('.ic-face'), far = $('.ic-far'), iClose = $('.ic-close'), iCrack = $('.ic-crack'), iFar = $('.ic-farimg'),
      eyes = [...root.querySelectorAll('.ic-eye')], flare = $('.ic-flare'), crc = $('.ic-cr'), fx = $('.ic-fx'), vig = $('.ic-vig'), flash = $('.ic-flash'), bars = [...root.querySelectorAll('.ic-bar')],
      cap = $('.in-cap'), capTxt = cap.querySelector('span'), btn = $('.in-skip'), cnt = btn.querySelector('b');
    const imgs = await Promise.all([load(IMG.close), load(IMG.crack), load(IMG.far)]);
    [iClose.src, iCrack.src, iFar.src] = [IMG.close, IMG.crack, IMG.far];
    const ctx = fx.getContext('2d'), cc = crc.getContext('2d'), CR = genCracks();
    let yes = 0, mine = false, skipped = false, revealed = false, done = false, t0 = performance.now(), lastNow = t0, W = 0, H = 0, snow = [], shards = [], mist = [], shk = [], evs = [], shake = {a:0, t:0, d:1};
    const paintBtn = () => { cnt.textContent = `${yes}/${need}`; btn.classList.toggle('selected', mine); };
    btn.onclick = () => { if (done || revealed) return; mine = !mine; yes += mine ? 1 : -1; paintBtn(); if (yes >= need) skip(); };
    paintBtn();
    if (bots) for (let i = 0; i < voters - 1; i++) setTimeout(() => { if (done || revealed || skipped || Math.random() > .5) return; yes++; paintBtn(); if (yes >= need) skip(); }, 1500 + i * 900);
    function skip(){ if (skipped) return; skipped = true; const t = performance.now() - t0; if (t < T.white[0]) t0 -= (T.white[0] - t); }
    window.__introSkip = skip; window.__introSeek = ms => { t0 = performance.now() - ms; };

    // ---- layout: cada camada tem o tamanho da imagem "cover" dentro da janela (as sobreposições usam fração da imagem) ----
    function fit(){
      const r = view.getBoundingClientRect(); W = r.width; H = r.height;
      [[face, imgs[0]], [far, imgs[2]]].forEach(([el, im]) => { if (!im) return; const s = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
        el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.left = (W - w) / 2 + 'px'; el.style.top = (H - h) / 2 + 'px'; });
      const sr = stage.getBoundingClientRect(); fx.width = Math.round(sr.width); fx.height = Math.round(sr.height);
      if (imgs[2]) { crc.width = Math.round(imgs[2].naturalWidth / 5); crc.height = Math.round(imgs[2].naturalHeight / 5); }
    }
    fit(); window.addEventListener('resize', fit);
    const pt = (el, f) => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return [r.left - s.left + r.width * f[0], r.top - s.top + r.height * f[1]]; };
    const setShake = (a, d) => { shake = {a, t:performance.now(), d}; };
    const ev = (t, fn) => evs.push({t, fn, done:false});
    // ---- partículas ----
    const spawnSnow = n => { for (let i = 0; i < n; i++) snow.push({x:rnd(-40, fx.width + 40), y:rnd(-20, fx.height), z:Math.random(), ph:rnd(0, 6.28)}); };
    spawnSnow(110);
    for (let i = 0; i < 7; i++) mist.push({x:rnd(0, 1), y:rnd(.72, .98), r:rnd(.25, .5), v:rnd(.004, .012) * (Math.random() < .5 ? -1 : 1), a:rnd(.05, .11)});
    function burst(x, y, n, sp, life = 1300){ for (let i = 0; i < n; i++) { const an = rnd(0, 6.283), v = rnd(.3, 1) * sp; shards.push({x, y, vx:Math.cos(an) * v, vy:Math.sin(an) * v * .8 - sp * .1, s:rnd(3, 11), rot:rnd(0, 6.28), vr:rnd(-6, 6), born:performance.now(), life:life * rnd(.7, 1.2), z:Math.random()}); } }
    ev(T.crack, () => { setShake(2, 350); }); ev(T.crack + 380, () => setShake(3, 380)); ev(T.crack + 760, () => setShake(4, 420));
    ev(T.open, () => { setShake(11, 900); const [x, y] = pt(face, EYEC); burst(x, y, 40, 560, 1500); flashA = 1; });
    ev(T.punch[1], () => setShake(3, 600));
    ev(T.pull[0] + 400, () => { burst(fx.width / 2, fx.height / 2, 24, 420, 1800); setShake(5, 700); });
    ev(T.shatter, () => { setShake(14, 1100); const [ax, ay] = pt(far, [PIL.x0, PIL.y0]), [bx, by] = pt(far, [PIL.x1, PIL.y1]), pw = bx - ax; for (let i = 0; i < 80; i++) { const x = ax + Math.random() * pw, y = ay + Math.random() * (by - ay), dx = (x - (ax + bx) / 2) / pw; shards.push({x, y, vx:dx * pw * 2.2 + rnd(-.4, .4) * pw, vy:rnd(-.6, .3) * pw * 1.6, s:rnd(.05, .16) * pw, rot:rnd(0, 6.28), vr:rnd(-6, 6), born:performance.now(), life:rnd(900, 1900), z:Math.random()}); } flashA = .9; });   // estilhaços nascem dentro do pilar e ficam na escala dele
    let flashA = 0, whiteMax = 0;

    function frame(now){
      if (done) return; const t = now - t0, dt = Math.min(50, now - lastNow); lastNow = now;
      evs.forEach(e => { if (!e.done && t >= e.t) { e.done = true; e.fn(); } });
      // ---- câmera (face = close/rachando; far = nave) ----
      const flick = t < T.fadeIn[1] + 400 ? (Math.sin(t * .04) * Math.sin(t * .013) > .12 ? 1 : .4) : 1;
      let sF = t < T.punch[0] ? lerp(1.06, 1.24, eio(seg(t, T.fadeIn[0], T.open))) : t < T.pull[0] ? lerp(1.24, 1.58, eo(seg(t, ...T.punch))) : lerp(1.58, .95, eio(seg(t, ...T.pull)));
      const dx = Math.sin(t * .0007) * 5, dy = Math.cos(t * .0009) * 4;
      const fOp = (t < T.fadeIn[0] ? 0 : eio(seg(t, ...T.fadeIn))) * (t < T.fadeIn[1] + 400 ? flick : 1) * (1 - eio(seg(t, ...T.closeOut)));
      face.style.opacity = fOp; face.style.transformOrigin = `${EYEC[0] * 100}% ${EYEC[1] * 100}%`; face.style.transform = `translate(${dx}px,${dy}px) scale(${sF})`;
      const crackA = eio(seg(t, T.open - 60, T.open + 260)); iCrack.style.opacity = crackA;
      // olhos: brilho leve durante as rachaduras, explosão ao abrir, depois pulsa
      const hint = seg(t, T.crack + 200, T.open) * .3, burstE = t >= T.open ? Math.max(0, 1 - seg(t, T.open, T.open + 900)) : 0, settle = t >= T.open ? (.55 + .25 * Math.sin(t * .01)) * seg(t, T.open, T.open + 400) : 0;
      const eA = clamp(hint + burstE + settle);
      eyes.forEach((e, i) => { e.style.left = EYES[i][0] * 100 + '%'; e.style.top = EYES[i][1] * 100 + '%'; e.style.opacity = eA; e.style.transform = `translate(-50%,-50%) scale(${1 + burstE * 1.6})`; });
      flare.style.left = EYEC[0] * 100 + '%'; flare.style.top = EYEC[1] * 100 + '%'; flare.style.opacity = burstE * .95; flare.style.transform = `translate(-50%,-50%) scaleX(${.3 + eo(seg(t, T.open, T.open + 500)) * 1.2})`;
      iClose.style.filter = `brightness(${(1 + .35 * Math.max(0, Math.sin(Math.PI * seg(t, T.crack, T.open))) * (Math.sin(t * .05) > 0 ? 1 : .3)).toFixed(3)})`;
      const sFar = lerp(2.7, 1, eio(seg(t, ...T.pull))) + .05 * seg(t, T.pull[1], T.shatter), farOp = eio(seg(t, ...T.farIn)) * (1 - seg(t, T.white[0] + 200, T.white[1]));
      far.style.opacity = farOp; far.style.transformOrigin = `${PIL.x * 100}% ${PIL.y * 100}%`; far.style.transform = `scale(${sFar})`;
      far.style.filter = `brightness(${(.92 + .08 * Math.sin(t * .02) * Math.sin(t * .0071) + .5 * seg(t, T.shatter - 600, T.shatter)).toFixed(3)})`;
      // ---- rachaduras e brilho do pilar (canvas pequeno, pixelado) ----
      if (farOp > .01) { cc.clearRect(0, 0, crc.width, crc.height); const p = eo(seg(t, ...T.cracks)), cw = crc.width, ch = crc.height, pulse = .6 + .4 * Math.sin(t * .006);
        cc.lineCap = 'round'; cc.lineJoin = 'round';
        CR.forEach(c => { const q = clamp((p - c.delay) / (1 - c.delay)); if (q <= 0) return; const n = q * (c.pts.length - 1), full = Math.floor(n), fr = n - full;
          const path = () => { cc.beginPath(); cc.moveTo(c.pts[0][0] * cw, c.pts[0][1] * ch); for (let i = 1; i <= full; i++) cc.lineTo(c.pts[i][0] * cw, c.pts[i][1] * ch);
            if (full < c.pts.length - 1) { const a = c.pts[full], b = c.pts[full + 1]; cc.lineTo((a[0] + (b[0] - a[0]) * fr) * cw, (a[1] + (b[1] - a[1]) * fr) * ch); } };
          path(); cc.strokeStyle = `rgba(110,200,255,${.55 * pulse})`; cc.lineWidth = 3; cc.stroke(); path(); cc.strokeStyle = 'rgba(235,250,255,.95)'; cc.lineWidth = 1; cc.stroke(); });
        const g = cc.createRadialGradient(PIL.x * cw, PIL.y * ch, 0, PIL.x * cw, PIL.y * ch, cw * .16); g.addColorStop(0, `rgba(200,240,255,${(.1 + .55 * p) * pulse})`); g.addColorStop(1, 'rgba(120,200,255,0)'); cc.fillStyle = g; cc.fillRect(0, 0, cw, ch); }
      // ---- legenda ----
      const L = LINES.find(l => t >= l[0] && t < l[1]);
      if (L) { const n = Math.min(L[2].length, Math.floor((t - L[0]) / 30) + 1); cap.hidden = false; capTxt.textContent = L[2].slice(0, n); cap.classList.toggle('done', n >= L[2].length); cap.style.opacity = Math.min(1, seg(t, L[0], L[0] + 200)) * (1 - seg(t, L[1] - 250, L[1])); } else cap.hidden = true;
      btn.hidden = !(t > 500 && t < T.shatter && !skipped);
      // ---- tarjas de cinema, vinheta, flash, tremor ----
      const bh = lerp(0, 1, eio(seg(t, 200, 1400))); bars.forEach(b => { b.style.transform = `scaleY(${bh})`; });
      vig.style.opacity = .75 + .25 * Math.sin(t * .003);
      flashA = Math.max(0, flashA - dt / 520); const wh = eio(seg(t, ...T.white)) * (1 - eio(seg(t, T.reveal, T.end)) ); whiteMax = Math.max(wh, 0); flash.style.opacity = Math.max(flashA * .85, wh);
      const sk = shake.a * Math.max(0, 1 - (performance.now() - shake.t) / shake.d); stage.style.transform = sk > .05 ? `translate(${(Math.random() - .5) * 2 * sk}px,${(Math.random() - .5) * 2 * sk}px)` : '';
      // ---- efeitos de tela: névoa, neve, estilhaços, feixe de luz ----
      ctx.clearRect(0, 0, fx.width, fx.height);
      const blizz = eio(seg(t, T.shatter - 200, T.white[1])), gust = Math.max(0, 1 - Math.abs(t - T.open - 300) / 900);
      while (snow.length < 110 + blizz * 420) snow.push({x:-30, y:rnd(0, fx.height), z:Math.random(), ph:rnd(0, 6.28)});
      mist.forEach(m => { m.x += m.v * dt / 1000; if (m.x < -.3) m.x = 1.3; if (m.x > 1.3) m.x = -.3; const g = ctx.createRadialGradient(m.x * fx.width, m.y * fx.height, 0, m.x * fx.width, m.y * fx.height, m.r * fx.width); const a = m.a * (.6 + seg(t, T.farIn[0], T.farIn[1]) * .8 + blizz * 1.5); g.addColorStop(0, `rgba(190,225,255,${Math.min(.5, a)})`); g.addColorStop(1, 'rgba(190,225,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, m.y * fx.height - m.r * fx.width, fx.width, m.r * fx.width * 2); });
      const pa = seg(t, T.cracks[0], T.shatter) * (1 - seg(t, T.shatter, T.shatter + 300)) * farOp;
      if (pa > .01) { const [px, py] = pt(far, [PIL.x, PIL.y0]); const g = ctx.createLinearGradient(0, py, 0, py - fx.height * .6); g.addColorStop(0, 'rgba(190,235,255,0)'); g.addColorStop(.14, `rgba(190,235,255,${.35 * pa})`); g.addColorStop(1, 'rgba(190,235,255,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; const [bxa] = pt(far, [PIL.x0, 0]), [bxb] = pt(far, [PIL.x1, 0]), bw = (bxb - bxa) * (1 + .25 * pa); for (let k = 0; k < 8; k++) { const w = bw * (1 - k * .115); ctx.globalAlpha = .22; ctx.fillRect(px - w / 2, py - fx.height * .6, w, fx.height * .6); } ctx.restore(); }
      ctx.fillStyle = '#fff';
      snow = snow.filter(s => { const sp = .35 + s.z * .9; s.y += (28 + 60 * sp) * dt / 1000 * (1 + blizz * 3.5); s.x += (14 + 70 * sp * (.6 + gust * 3 + blizz * 7)) * dt / 1000 + Math.sin(t * .001 + s.ph) * .25; return s.y < fx.height + 10 && s.x < fx.width + 60; });
      snow.forEach(s => { const z = Math.round(1 + s.z * 2.4); ctx.globalAlpha = .35 + .6 * s.z; ctx.fillRect(Math.round(s.x), Math.round(s.y), z, z); }); ctx.globalAlpha = 1;
      const nowP = performance.now();
      shards = shards.filter(sh => { const u = (nowP - sh.born) / sh.life; if (u >= 1) return false; const k = u * sh.life / 1000, x = sh.x + sh.vx * k * (1 - u * .35), y = sh.y + sh.vy * k + 260 * k * k * .5, r = sh.rot + sh.vr * k;
        ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.globalAlpha = (1 - u) * (.55 + .45 * sh.z); const s = sh.s * (1 - u * .4); ctx.fillStyle = 'rgba(170,225,255,.9)'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .55, s * .7); ctx.lineTo(-s * .5, s * .5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); return true; });
      ctx.globalAlpha = 1;
      // ---- jogo aparece ----
      if (!revealed && t >= T.reveal) { revealed = true; onReveal(); }
      if (t >= T.reveal) root.style.opacity = 1 - eio(seg(t, T.reveal, T.end));
      if (t >= T.end) { done = true; window.removeEventListener('resize', fit); root.remove(); stage.style.transform = ''; btn.onclick = null; resolve(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
window.IntroIce = {play, T, LINES};
})();
