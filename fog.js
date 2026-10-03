/* Nuvens entre as páginas (seleção de grupo ↔ mapa). As MESMAS nuvens são o enfeite parado das bordas e a transição:
   Fog.rest(el)  → em repouso, cobrindo as faixas acima/abaixo de `el` (com um pouco de sobreposição) e à deriva
   Fog.close(el) → vão das bordas até o meio da tela     Fog.open(el) → o caminho inverso, voltando exatamente ao repouso */
(() => {
const REST = .48;
const banks = () => [document.getElementById('fogT'), document.getElementById('fogB')];
const edge = el => { const [t] = banks(), bh = t.getBoundingClientRect().height || innerHeight * .54, top = Math.max(0, (innerHeight - el.offsetHeight) / 2); return -(bh - top - bh * .01); };
const cancel = () => banks().forEach(x => x.getAnimations().forEach(a => a.cancel()));
const put = (el, e, op) => { const [t, b] = banks(); t.style.display = b.style.display = 'block'; t.style.transform = `translateY(${e}px)`; b.style.transform = `translateY(${-e}px)`; t.style.opacity = b.style.opacity = op; };
const run = (el, from, to, ms, ease) => { const e = edge(el), [t, b] = banks(); t.style.display = b.style.display = 'block'; cancel();
  const kf = s => [{transform:`translateY(${s * e * from}px)`, opacity:from ? REST : 1}, {transform:`translateY(${s * e * to}px)`, opacity:to ? REST : 1}];
  const o = {duration:ms, easing:ease, fill:'forwards'}; t.animate(kf(1), o); b.animate(kf(-1), o); return new Promise(r => setTimeout(r, ms + 30)); };
window.Fog = {
  rest(el){ cancel(); put(el, edge(el), REST); banks().forEach(x => x.classList.add('drift')); document.documentElement.classList.remove('fogin'); },
  close(el, ms = 1000){ banks().forEach(x => x.classList.add('drift')); return run(el, 1, 0, ms, 'cubic-bezier(.4,0,.2,1)'); },
  open(el, ms = 2600){ return run(el, 0, 1, ms, 'cubic-bezier(.45,0,.2,1)').then(() => Fog.rest(el)); }
};
})();
