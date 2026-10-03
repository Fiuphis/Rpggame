/* Nuvens de transição entre as páginas (seleção de grupo ↔ mapa).
   Fog.close(el, ms): as nuvens vêm das bordas da tela até se encontrarem no meio. Fog.open(el, ms): saem do meio e param nas bordas de `el`. */
(() => {
const banks = () => [document.getElementById('fogT'), document.getElementById('fogB')];
const endPx = el => { const bh = banks()[0].getBoundingClientRect().height, top = Math.max(0, el.getBoundingClientRect().top); return -(bh - top - bh * .12); };
const anim = (b, k, kf, ms, ease) => b.animate(kf, {duration:ms, easing:ease, fill:'forwards'});
window.Fog = {
  close(el, ms = 1000){
    const [t, b] = banks(); t.style.display = b.style.display = 'block'; t.getAnimations().forEach(a => a.cancel()); b.getAnimations().forEach(a => a.cancel()); const e = endPx(el);
    anim(t, 0, [{transform:`translateY(${e}px)`, opacity:0}, {transform:'translateY(0)', opacity:1}], ms, 'cubic-bezier(.4,0,.2,1)');
    anim(b, 0, [{transform:`translateY(${-e}px)`, opacity:0}, {transform:'translateY(0)', opacity:1}], ms, 'cubic-bezier(.4,0,.2,1)');
    return new Promise(r => setTimeout(r, ms));
  },
  open(el, ms = 2600){
    const e = endPx(el), [t, b] = banks(); t.style.display = b.style.display = 'block';
    const kf = s => [{transform:'translateY(0)', opacity:1}, {transform:`translateY(${s * e * .55}px)`, opacity:1, offset:.55}, {transform:`translateY(${s * e}px)`, opacity:0}];
    anim(t, 0, kf(1), ms, 'cubic-bezier(.45,0,.2,1)'); anim(b, 0, kf(-1), ms, 'cubic-bezier(.45,0,.2,1)');
    return new Promise(r => setTimeout(() => { [t, b].forEach(x => { x.getAnimations().forEach(a => a.cancel()); x.style.display = 'none'; }); document.documentElement.classList.remove('fogin'); r(); }, ms + 50));
  }
};
})();
