/* Efeitos de ataque suaves: o sprite do efeito é desenhado borrado, mais translúcido e aditivo (brilha) — parece poder, não objeto sólido. */
(() => {
const cache = new WeakMap();
function blur(im, k){ const w = im.naturalWidth, h = im.naturalHeight, sw = Math.max(2, Math.round(w / k)), sh = Math.max(2, Math.round(h / k));
  const a = document.createElement('canvas'); a.width = sw; a.height = sh; const ac = a.getContext('2d'); ac.imageSmoothingQuality = 'high'; ac.drawImage(im, 0, 0, sw, sh);
  const b = document.createElement('canvas'); b.width = w; b.height = h; const bc = b.getContext('2d'); bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high'; bc.drawImage(a, 0, 0, w, h); return b; }
function get(im){ let c = cache.get(im); if (!c) { c = {a:blur(im, 2.6), b:blur(im, 6)}; cache.set(im, c); } return c; }
window.FXSoft = {
  draw(g, im, x, y, w, h, alpha){
    const c = get(im), op = g.globalCompositeOperation; g.imageSmoothingEnabled = true; g.globalCompositeOperation = 'lighter';
    const al = g.globalAlpha; g.globalAlpha = al * .5 * alpha; g.drawImage(c.a, x, y, w, h);            // corpo do efeito, borrado
    g.globalAlpha = al * .5 * alpha; g.drawImage(c.a, x, y, w, h);                                       // soma de novo = mais brilho
    g.globalAlpha = al * .38 * alpha; g.drawImage(c.b, x - w * .06, y - h * .06, w * 1.12, h * 1.12);     // halo
    g.globalAlpha = al; g.globalCompositeOperation = op;
  }
};
})();
