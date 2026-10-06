/* Revelacao cinematografica do Malgorath na luta: escuro, olhos acendem, relampagos mostram a silhueta,
   o boss desperta com impacto, cartela de titulo, barras e camera. Cine.play() -> Promise. */
(function(){
const $ = s => document.querySelector(s), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => clamp((t - a) / (b - a)), eio = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const EYES = [[.474, .095], [.505, .095]];
let root = null;
function build(){
  const g = $('#game'); root = document.createElement('div'); root.className = 'cine';
  root.innerHTML = '<div class="cn-dark"></div><div class="cn-glow"></div><i class="cn-eye"></i><i class="cn-eye"></i><div class="cn-flash"></div><div class="cn-bar t"></div><div class="cn-bar b"></div>' +
    '<div class="cn-title"><b></b><span></span><em></em></div>';
  g.append(root); return root;
}
window.Cine = {
  play(opt = {}){
    return new Promise(res => {
      const g = $('#game'), bc = document.querySelector('canvas.hero.boss'); if (!g || !bc) return res();
      const el = build(), dark = $('.cn-dark', el), glow = $('.cn-glow', el), eyes = [...el.querySelectorAll('.cn-eye')], flash = $('.cn-flash', el), bars = [...el.querySelectorAll('.cn-bar')], ti = $('.cn-title', el), tb = ti.querySelector('b'), ts = ti.querySelector('span');
      const NAME = 'MALGORATH', SUB = 'Lorde das Trevas';
      eyes.forEach((e, i) => { e.style.left = EYES[i][0] * 100 + '%'; e.style.top = EYES[i][1] * 100 + '%'; });
      tb.innerHTML = NAME.split('').map((c, i) => `<u style="--i:${i}">${c}</u>`).join(''); ts.textContent = SUB;
      bc.style.opacity = 1; bc.style.filter = 'brightness(0)';
      g.style.transformOrigin = '49% 12%';
      const A = window.Anim, FL = [1900, 2350, 2700], T0 = performance.now(), TOT = 7000; let awake = false, shook = false;
      const sc = () => +(window.__ts || 1);
      (function tick(now){
        const t = (now - T0) * sc();
        // camera: empurra devagar ate o pouso e volta no final
        const push = eio(seg(t, 0, 3400)) * .035 - eio(seg(t, 5700, 6800)) * .035;
        g.style.transform = `scale(${1 + push})`;
        // barras
        const bh = eio(seg(t, 150, 1000)) * (1 - eio(seg(t, 5900, 6700)));
        bars.forEach(b => b.style.transform = `scaleY(${bh})`);
        // escuro total, depois buraco rubro em volta da cabeca
        dark.style.opacity = 1 - eio(seg(t, 3300, 4200)) * .86 * 0 - (awake ? 0 : 0);
        const hole = 18 + eio(seg(t, 900, 3000)) * 26 + eio(seg(t, 3300, 4300)) * 120;
        const fin = 1 - eio(seg(t, 5800, 6800));
        dark.style.background = `radial-gradient(ellipse ${hole}% ${hole * 1.4}% at 49% 14%,rgba(0,0,0,0) 0,rgba(4,0,2,${.4 * fin}) 50%,rgba(0,0,0,${.93 * fin}) 100%)`;
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
        const ta = eio(seg(t, 4300, 4900)) * (1 - eio(seg(t, 5700, 6300)));
        ti.style.opacity = ta; ti.style.setProperty('--k', eio(seg(t, 4300, 5400)));
        if (t < TOT) requestAnimationFrame(tick);
        else { g.style.transform = ''; g.style.transformOrigin = ''; bc.style.filter = ''; el.remove(); res(); }
      })(T0);
    });
  },
};
})();
