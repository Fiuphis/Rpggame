/* Banco de Dados I — RPG · efeitos extras dos heróis (camada própria, independente dos rigs)
   Revive (coluna de luz), cura/proteção recebida, combo de acertos, acerto/erro de resposta, entrada em cena e pouca vida.
   Tudo procedural (brilho, anéis e estrelas de 4 pontas), sem imagens. Anim.js chama: Extras.fx(heroi, tipo, opções). */
(() => {
'use strict';
const PAL = {mage:'120,180,255', guerreiro:'130,170,255', tank:'255,190,100', cleriga:'255,214,120'};
const GOLD = '255,222,140', RED = '255,70,60';
let cv = null, g = null, list = [], low = {}, feetOf = () => null, lastT = 0, running = false;
const clk = () => performance.now() * (window.__ts == null ? 1 : window.__ts);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
const eo = u => 1 - Math.pow(1 - u, 3), sn = u => Math.sin(Math.PI * clamp(u));
const add = (d, f, delay = 0) => { list.push({t0: clk() + delay, d, f}); start(); };

function glow(x, y, r, col, a){
  if (a <= .005 || r <= 1) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,250,235,${clamp(a * .6)})`); gr.addColorStop(.16, `rgba(${col},${clamp(a)})`); gr.addColorStop(.5, `rgba(${col},${clamp(a * .3)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function star(x, y, s, col, a, rot = 0){       // estrela de 4 pontas, aditiva
  if (a <= .01 || s < .5) return; g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.rotate(rot); g.fillStyle = `rgba(${col},${clamp(a)})`;
  g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * .22 : s, an = i * Math.PI / 4; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill();
  g.fillStyle = `rgba(255,255,255,${clamp(a * .8)})`; g.beginPath(); g.arc(0, 0, s * .16, 0, 7); g.fill(); g.restore();
}
function ring(x, y, rx, ry, col, a, w = 3){
  if (a <= .01) return; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${col},${clamp(a)})`; g.lineWidth = w; g.shadowColor = `rgba(${col},${clamp(a)})`; g.shadowBlur = 12;
  g.beginPath(); g.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), 0, 0, 7); g.stroke(); g.restore();
}
function column(x, yb, w, h, col, a){          // coluna de luz com base no chão
  if (a <= .01) return; const gr = g.createLinearGradient(0, yb, 0, yb - h);
  gr.addColorStop(0, `rgba(255,252,240,${clamp(a)})`); gr.addColorStop(.45, `rgba(${col},${clamp(a * .55)})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - w / 2, yb - h, w, h);
  const gx = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gx.addColorStop(0, 'rgba(0,0,0,.9)'); gx.addColorStop(.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,.9)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.globalAlpha = .55; g.fillRect(x - w / 2, yb - h, w, h); g.restore();
}
function puff(x, y, s, a, col = '200,190,170'){   // fumaça/poeira (normal, não aditiva)
  if (a <= .01) return; g.save(); const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, `rgba(${col},${clamp(a)})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); g.restore();
}

const FX = {
  revive(f, w){      // coluna de luz, anéis no chão e estrelas subindo enquanto o herói se levanta
    const col = PAL[w] || GOLD;
    add(1700, u => { column(f.x, f.y, lerp(26, 46, eo(u)), lerp(60, 300, eo(Math.min(1, u * 2))), GOLD, .5 * sn(u)); glow(f.x, f.y - 90, lerp(60, 190, eo(u)), GOLD, .7 * sn(u)); });
    for (let i = 0; i < 3; i++) add(1100, u => ring(f.x, f.y - 2, lerp(10, 120, eo(u)), lerp(4, 36, eo(u)), GOLD, .9 * (1 - u)), i * 260);
    for (let i = 0; i < 12; i++) { const ox = rnd(-46, 46), dl = rnd(0, 900), sp = rnd(.8, 1.2), sz = rnd(7, 12); add(1100, u => star(f.x + ox + Math.sin(u * 6 + i) * 8, f.y - 10 - 240 * eo(u) * sp, sz * (1 - u * .4), i % 2 ? GOLD : col, sn(u), u * 3), dl); }
  },
  heal(f, w){        // luz que cura: anel + estrelas subindo (também a defesa recebida da Clériga)
    add(1300, u => { glow(f.x, f.y - 100, lerp(50, 140, eo(u)), '170,255,190', .55 * sn(u)); ring(f.x, f.y - 2, lerp(20, 80, eo(u)), lerp(7, 24, eo(u)), '170,255,200', .8 * (1 - u)); });
    for (let i = 0; i < 9; i++) { const ox = rnd(-40, 40), dl = rnd(0, 700); add(1000, u => star(f.x + ox, f.y - 20 - 170 * eo(u), 9 * (1 - u * .3), i % 2 ? '190,255,210' : GOLD, sn(u), u * 2), dl); }
  },
  combo(f, w, o){    // sequência de acertos: aura que cresce com o combo
    const n = (o && o.n) || 3, col = PAL[w] || GOLD, big = n >= 5;
    add(1100, u => { glow(f.x, f.y - 110, lerp(70, big ? 230 : 170, eo(u)), col, .55 * sn(u)); ring(f.x, f.y - 2, lerp(16, big ? 150 : 110, eo(u)), lerp(6, big ? 44 : 32, eo(u)), GOLD, .9 * (1 - u), big ? 4 : 3); });
    if (big) add(1300, u => { column(f.x, f.y, 46, lerp(40, 300, eo(Math.min(1, u * 2))), col, .6 * sn(u)); ring(f.x, f.y - 2, lerp(10, 100, eo(u)), lerp(4, 30, eo(u)), '255,255,255', .8 * (1 - u)); }, 120);
    const k = big ? 14 : 8; for (let i = 0; i < k; i++) { const an = i / k * 6.28, dl = rnd(0, 400); add(900, u => star(f.x + Math.cos(an) * 70 * eo(u), f.y - 50 - 120 * eo(u) + Math.sin(an) * 22, 9 * (1 - u * .4), i % 2 ? GOLD : col, sn(u), u * 3), dl); }
  },
  right(f, w, o){    // resposta certa: faíscas curtas acima da cabeça
    const col = PAL[w] || GOLD, top = f.y - ((o && o.h) || 250);
    for (let i = 0; i < 6; i++) { const ox = rnd(-46, 46), dl = rnd(0, 360), oy = rnd(-14, 24); add(800, u => star(f.x + ox * (.6 + u * .4), top + oy - 30 * eo(u), 8 * (1 - u * .4), i % 2 ? GOLD : col, sn(u), u * 2.4), dl); }
    add(700, u => glow(f.x, f.y - 120, lerp(60, 120, eo(u)), col, .28 * sn(u)));
  },
  wrong(f, w, o){    // resposta errada: vermelho curto no chão e pó de impacto
    add(650, u => { glow(f.x, f.y - 8, lerp(50, 110, eo(u)), RED, .32 * sn(u)); });
    for (let i = 0; i < 4; i++) { const sd = i % 2 ? 1 : -1, dl = i * 50; add(700, u => puff(f.x + sd * (20 + 40 * eo(u)), f.y - 6 - 12 * u, lerp(10, 26, u), .38 * (1 - u)), dl); }
  },
  enter(f, w){       // entrada em cena: poeira nos pés e um brilho curto
    const col = PAL[w] || GOLD;
    for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, dl = i * 60; add(800, u => puff(f.x + sd * (14 + 46 * eo(u)) * (1 + i * .1), f.y - 4 - 14 * u, lerp(12, 34, u), .45 * (1 - u)), dl); }
    add(900, u => { glow(f.x, f.y - 100, lerp(60, 130, eo(u)), col, .35 * sn(u)); ring(f.x, f.y - 2, lerp(10, 70, eo(u)), lerp(4, 20, eo(u)), col, .6 * (1 - u), 2); });
  },
  guard(f, w){       // cobertura do Tanque / escudo recebido
    add(900, u => { ring(f.x, f.y - 2, lerp(14, 70, eo(u)), lerp(5, 20, eo(u)), '255,200,120', .8 * (1 - u)); glow(f.x, f.y - 100, 100, '255,200,120', .3 * sn(u)); });
  },
};

function frame(){
  if (!running) return; const now = clk();
  g.clearRect(0, 0, cv.width, cv.height);
  list = list.filter(e => { const u = (now - e.t0) / e.d; if (u < 0) return true; if (u >= 1) return false; e.f(u); return true; });
  Object.keys(low).forEach(w => {      // pouca vida: pulso vermelho fraco e lento no chão
    if (!low[w]) return; const f = feetOf(w); if (!f) return; const p = .5 + .5 * Math.sin(now / 520 + w.length);
    glow(f.x, f.y - 6, 70 + 14 * p, RED, .12 + .1 * p);
  });
  if (!list.length && !Object.values(low).some(Boolean)) { running = false; return; }
  requestAnimationFrame(frame);
}
function start(){ if (!running && cv) { running = true; requestAnimationFrame(frame); } }

window.Extras = {
  init(el, feet){ if (cv) return; cv = document.createElement('canvas'); cv.className = 'fxl front'; cv.width = 1024; cv.height = 1536; el.append(cv); g = cv.getContext('2d'); feetOf = feet; },
  fx(w, kind, o){ if (!cv || !FX[kind]) return; const f = feetOf(w); if (f) FX[kind](f, w, o || {}); },
  low(w, on){ if (!cv) return; if (!!low[w] === !!on) return; low[w] = !!on; if (on) start(); },
  clear(){ list = []; Object.keys(low).forEach(k => low[k] = false); if (g) g.clearRect(0, 0, cv.width, cv.height); },
};
})();
