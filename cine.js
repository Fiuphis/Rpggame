/* Revelacao cinematografica do Malgorath na luta: escuro, olhos acendem, relampagos mostram a silhueta,
   o boss desperta com impacto, cartela de titulo, barras e camera. Cine.play() -> Promise. */
(function(){
const $ = s => document.querySelector(s), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => clamp((t - a) / (b - a)), eio = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const EYES = [[.474, .095], [.505, .095]];
let root = null;
function build(){
  const g = $('#game'); root = document.createElement('div'); root.className = 'cine';
  root.innerHTML = '<div class="cn-dark"></div><div class="cn-glow"></div><i class="cn-eye"></i><i class="cn-eye"></i><div class="cn-flash"></div><div class="cn-bar t"></div><div class="cn-bar b"></div>' +
    '<canvas class="cn-ash"></canvas><div class="cn-title"><b></b><span></span><em></em></div>';
  g.append(root); return root;
}
window.Cine = {
  play(opt = {}){
    return new Promise(res => {
      const g = $('#game'), bc = document.querySelector('canvas.hero.boss'); if (!g || !bc) return res();
      const el = build(), dark = $('.cn-dark', el), glow = $('.cn-glow', el), eyes = [...el.querySelectorAll('.cn-eye')], flash = $('.cn-flash', el), bars = [...el.querySelectorAll('.cn-bar')], ti = $('.cn-title', el), ac = $('.cn-ash', el), tb = ti.querySelector('b'), ts = ti.querySelector('span');
      const ICE = !!(window.STAGE && STAGE.ice), NAME = ICE ? 'HRIMGAR' : 'MALGORATH', SUB = ICE ? 'O Rei Gelado' : 'Lorde das Trevas'; if (ICE) el.classList.add('ice');
      eyes.forEach((e, i) => { e.style.left = EYES[i][0] * 100 + '%'; e.style.top = EYES[i][1] * 100 + '%'; });
      tb.innerHTML = NAME.split('').map((c, i) => `<u style="--i:${i}">${c}</u>`).join(''); ts.innerHTML = SUB.split('').map((ch, i) => `<u>${ch === ' ' ? '&nbsp;' : ch}</u>`).join('');
      bc.style.opacity = 1; bc.style.filter = 'brightness(0)';
      g.style.transformOrigin = '49% 12%';
      const A = window.Anim, FL = [1900, 2350, 2700], T0 = performance.now(), TOT = ICE ? 8900 : 8200, X = ICE ? 700 : 0; let awake = false, shook = false, lastScan = -1e9;
      // posicao real dos olhos: o rig do boss grava (em coordenadas do canvas) onde desenhou cada olho
      const scan = () => { const E2 = window.__bossEyes; if (!E2 || E2.length < 2) return; const r = bc.getBoundingClientRect(), gr = g.getBoundingClientRect(); E2.slice(0, 2).forEach((c, i) => { eyes[i].style.left = ((r.left + c[0] / bc.width * r.width - gr.left) / gr.width * 100) + '%'; eyes[i].style.top = ((r.top + c[1] / bc.height * r.height - gr.top) / gr.height * 100) + '%'; }); };
      const sc = () => +(window.__ts || 1);
      // titulo pega fogo, vira cinza e o vento leva
      const ls = [...tb.querySelectorAll('u'), ...ts.querySelectorAll('u')], N1 = tb.querySelectorAll('u').length, parts = []; let lt = 0, sized = false;
      const ctxA = ac.getContext('2d'), rnd = (a, b) => a + Math.random() * (b - a), mix = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));
      const B0 = 5500, STEP = 75, DUR = 1100;
      const frz = t => {   // gelo: as letras congelam, racham e viram flocos de neve levados pelo vento
        if (t < B0 - 100) return; const gr = g.getBoundingClientRect(); if (!sized) { ac.width = ac.offsetWidth; ac.height = ac.offsetHeight; sized = true; }
        const k = ac.width / gr.width, dt = Math.min(60, t - lt); lt = t;
        ls.forEach((u, i) => { const st = B0 + (i < N1 ? i : N1 + 2 + (i - N1) * .7) * STEP, p = seg(t, st, st + DUR * 1.5); if (p <= 0) return;
          const fz = eio(seg(p, 0, .32)), br = seg(p, .4, 1), wd = eio(seg(p, .42, 1)), fade = p < .5 ? 1 : 1 - eio(seg(p, .5, .95));
          u.style.color = `rgb(${mix([255, 233, 226], [195, 232, 255], fz)})`; u.style.textShadow = `0 0 ${5 + 12 * fz}px rgba(110,200,255,${.4 + .55 * fz}),0 0 2px #fff${p > .4 && p < .5 ? ',0 0 22px #fff' : ''}`;
          u.style.opacity = fade; u.style.filter = wd > 0 ? `blur(${wd * 2}px)` : '';
          const shk = p > .3 && p < .44 ? Math.sin(t / 18 + i * 3) * 1.6 : 0;
          u.style.transform = `translate(${wd * 150 + shk}px,${-wd * 40 - Math.sin(p * 8 + i) * 3 * wd}px) rotate(${wd * 70 + shk}deg) scale(${1 - wd * .6})`;
          if (!u._fz && p > .3) u._fz = 1;
          if (!u._cr && p > .44 && ac.width) { u._cr = 1; const r = u.getBoundingClientRect(), x = (r.left - gr.left + r.width / 2) * k, y = (r.top - gr.top + r.height / 2) * k;
            for (let q = 0; q < 16; q++) parts.push({x:x + rnd(-r.width, r.width) * k * .4, y:y + rnd(-r.height, r.height) * k * .4, vx:rnd(-40, 150), vy:rnd(-130, 50), life:rnd(1, 2.1), s:Math.random() < .35 ? 3 : 2, c:Math.random() < .5 ? 0 : Math.random() < .5 ? 1 : 2}); }
          if (p > .1 && p < .45 && ac.width && Math.random() < .5) { const r = u.getBoundingClientRect(), x = (r.left - gr.left + r.width * Math.random()) * k, y = (r.top - gr.top + r.height * Math.random()) * k; parts.push({x, y, vx:rnd(-6, 6), vy:rnd(-10, 6), life:rnd(.3, .6), s:2, c:0, tw:1}); }
          if (p > .46 && p < .98 && ac.width) { const r = u.getBoundingClientRect(), x = (r.left - gr.left + r.width / 2) * k, y = (r.top - gr.top + r.height / 2) * k, n = Math.round(dt / 16 * 1.6);
            for (let q = 0; q < n; q++) parts.push({x:x + rnd(-r.width, r.width) * k * .5, y:y + rnd(-r.height, r.height) * k * .4, vx:rnd(40, 120) * (1 + wd * 2), vy:rnd(-60, 10), life:rnd(.8, 1.8), s:Math.random() < .4 ? 3 : 2, c:Math.random() < .5 ? 0 : 1}); } });
        ctxA.clearRect(0, 0, ac.width, ac.height); const CC = ['#f4fbff', '#a8d8ff', '#6fb4ff'];
        for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt / 1000; if (q.life <= 0) { parts.splice(i, 1); continue; } q.vx += 110 * dt / 1000; q.x += q.vx * dt / 1000 * k; q.y += q.vy * dt / 1000 * k + Math.sin(q.x * .04) * .5; q.vy += 6 * dt / 1000;
          const a = q.tw ? Math.min(1, q.life * 3) * (Math.random() < .5 ? 1 : .3) : Math.min(1, q.life * 1.6); ctxA.globalAlpha = a; ctxA.fillStyle = CC[q.c]; const s = q.s * k; ctxA.fillRect(Math.round(q.x / s) * s, Math.round(q.y / s) * s, s, s); }
        ctxA.globalAlpha = 1; };
      const burn = t => {
        if (ICE) return frz(t);
        if (t < B0 - 100) return; const gr = g.getBoundingClientRect(); if (!sized) { ac.width = ac.offsetWidth; ac.height = ac.offsetHeight; sized = true; }
        const k = ac.width / gr.width, dt = Math.min(60, t - lt); lt = t;
        ls.forEach((u, i) => { const st = B0 + (i < N1 ? i : N1 + 2 + (i - N1) * .7) * STEP, p = seg(t, st, st + DUR); if (p <= 0) return;
          const hot = p < .4 ? mix([255, 233, 226], [255, 140, 40], p / .4) : p < .6 ? mix([255, 140, 40], [60, 34, 30], (p - .4) / .2) : [60, 34, 30];
          const fade = p < .55 ? 1 : 1 - eio(seg(p, .55, 1)), wd = eio(seg(p, .5, 1));
          u.style.color = `rgb(${hot})`; u.style.textShadow = p < .6 ? `0 0 ${6 + 14 * Math.sin(Math.PI * p / .6)}px rgba(255,${90 + 80 * p},30,.95)` : 'none';
          u.style.opacity = fade; u.style.filter = wd > 0 ? `blur(${wd * 2.5}px)` : '';
          u.style.transform = `translate(${wd * 70}px,${-wd * 26 - Math.sin(p * 9 + i) * 2 * p}px) rotate(${wd * 25}deg) scale(${1 - wd * .45},${1 - wd * .2})`;
          if (p < .95 && ac.width) { const r = u.getBoundingClientRect(), x = (r.left - gr.left + r.width / 2) * k, y = (r.top - gr.top + r.height / 2) * k, n = Math.round(dt / 16 * (p < .5 ? 1.2 : 2));
            for (let q = 0; q < n; q++) parts.push({x:x + rnd(-r.width, r.width) * k * .5, y:y + rnd(-r.height, r.height) * k * .4, vx:rnd(30, 90) * (1 + wd * 2), vy:rnd(-70, -10), life:rnd(.6, 1.4), a:1, ember:Math.random() < (p < .5 ? .7 : .25), s:Math.random() < .5 ? 2 : 3}); } });
        ctxA.clearRect(0, 0, ac.width, ac.height);
        for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt / 1000; if (q.life <= 0) { parts.splice(i, 1); continue; } q.vx += 40 * dt / 1000; q.x += q.vx * dt / 1000 * k; q.y += q.vy * dt / 1000 * k + Math.sin(q.x * .05) * .3; q.vy -= 10 * dt / 1000;
          const a = Math.min(1, q.life * 1.6); ctxA.globalAlpha = a; ctxA.fillStyle = q.ember ? (q.life > .5 ? '#ffb347' : '#ff5a20') : (q.life > .5 ? '#6b5650' : '#3a2e2b'); const s = q.s * k; ctxA.fillRect(Math.round(q.x / s) * s, Math.round(q.y / s) * s, s, s); }
        ctxA.globalAlpha = 1; };
      (function tick(now){
        const t = (now - T0) * sc();
        // camera: empurra devagar ate o pouso e volta no final
        const push = eio(seg(t, 0, 3400)) * .035 - eio(seg(t, 6500 + X, 7700 + X)) * .035;
        g.style.transform = `scale(${1 + push})`;
        // barras
        const bh = eio(seg(t, 150, 1000)) * (1 - eio(seg(t, 6700 + X, 7600 + X)));
        bars.forEach(b => b.style.transform = `scaleY(${bh})`);
        // escuro total, depois buraco rubro em volta da cabeca
        dark.style.opacity = 1 - eio(seg(t, 3300, 4200)) * .86 * 0 - (awake ? 0 : 0);
        const hole = 18 + eio(seg(t, 900, 3000)) * 26 + eio(seg(t, 3300, 4300)) * 120;
        const fin = 1 - eio(seg(t, 6700 + X, 7700 + X));
        dark.style.background = `radial-gradient(ellipse ${hole}% ${hole * 1.4}% at 49% 14%,rgba(0,0,0,0) 0,${ICE ? `rgba(0,4,14,${.4 * fin}) 50%,rgba(0,2,10,${.93 * fin}) 100%)` : `rgba(4,0,2,${.4 * fin}) 50%,rgba(0,0,0,${.93 * fin}) 100%)`}`;
        if (t - lastScan > 60) { lastScan = t; scan(); }
        // olhos
        const ea = eio(seg(t, 700, 1400)) * (1 - eio(seg(t, 3600, 4000)));
        eyes.forEach(e => { e.style.opacity = ea * (.85 + .15 * Math.sin(t / 60)); });
        glow.style.opacity = ea * .6; 
        // relampagos: mostram o boss por um instante
        let lit = 0; FL.forEach(f => { const u = (t - f) / 220; if (u > 0 && u < 1) lit = Math.max(lit, 1 - u); });
        if (t > 3300 && !awake) { awake = true; if (A) A.play('boss', 'awaken'); }
        const rev = awake ? eio(seg(t, 3300, 4300)) : lit * .85;
        bc.style.filter = rev >= .999 ? '' : `brightness(${.16 + rev * .84}) saturate(${.5 + rev * .5})`;
        flash.style.opacity = awake && !shook && t > 3750 ? (shook = true, 1) : lit * .5 + (flash.style.opacity > 0 ? flash.style.opacity * .88 : 0) * 0;
        if (shook && t < 4300) flash.style.opacity = Math.max(0, 1 - seg(t, 3750, 4200));
        // cartela
        const ta = eio(seg(t, 4300, 4900));
        ti.style.opacity = ta; ti.style.setProperty('--k', eio(seg(t, 4300, 5400)));
        burn(t);
        if (t < TOT) requestAnimationFrame(tick);
        else { g.style.transform = ''; g.style.transformOrigin = ''; bc.style.filter = ''; el.remove(); res(); }
      })(T0);
    });
  },
};
})();
