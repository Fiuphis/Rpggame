/* v138: frases que rodam no quadro do canto inferior direito do mapa (estilo da arte original) */
(() => {
const Q = [   // até 2 linhas de frase + o nome (como a do Guarda do Portão): folga igual em cima, embaixo e nos lados
  ['Poder é continuar, mesmo depois de tudo.', '???'],
  ['Quem ousa invadir o meu castelo?', 'Malgorath, Lorde das Trevas'],
  ['Cada resposta errada fecha uma porta.', 'Escriba do Reino'],
  ['Dica: o grupo decide tudo por votação.', 'Escriba do Reino'],
  ['Já vi heróis melhores virarem pó.', 'Mercador Errante'],
  ['Dica: no Mercador, quem decide é o voto.', 'Mercador Errante'],
  ['Todo banco de dados é um castelo de tabelas.', 'Cartógrafa Anciã'],
  ['Dica: cada classe joga de um jeito. Experimente todas.', 'Bardo Cego'],
  ['As trevas não temem a força. Elas temem quem estudou a lição.', 'Guarda do Portão'],
  ['Dica: vença um guardião para abrir o próximo caminho.', 'Cartógrafa Anciã'],
  ['Malgorath, Lorde das Trevas, nunca revisou a matéria.', 'Bardo Cego'],
  ['Errar faz parte. Desistir, não.', 'Guarda do Portão'],
  ['Dica: SELECT consulta, UPDATE altera, DELETE apaga.', 'Escriba do Reino'],
  ['Seis caminhos, seis lendas, um só destino.', '???']
];
const t = document.getElementById('q-t'), a = document.getElementById('q-a'), box = document.getElementById('quote');
if (!t) return;
let i = 0, tm = 0;
// reduz a letra até caber inteira na caixa (nunca corta)
const fit = () => { let fs = 1.3; box.style.setProperty('--fs', fs + 'cqw'); const lines = () => Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)); while ((box.scrollHeight > box.clientHeight + 0.5 || lines() > 2) && fs > 0.8) { fs -= 0.04; box.style.setProperty('--fs', fs.toFixed(2) + 'cqw'); } };
const set = n => { t.textContent = '“' + Q[n][0] + '”'; a.textContent = '— ' + Q[n][1]; fit(); };
const show = n => { i = n; box.classList.add('out'); setTimeout(() => { set(i); box.classList.remove('out'); }, 420); };
const next = () => { let n; do n = Math.floor(Math.random() * Q.length); while (n === i); show(n); };
const loop = () => { clearInterval(tm); tm = setInterval(next, 9000); };
set(0); addEventListener('resize', () => set(i));
box.addEventListener('click', () => { next(); loop(); });
loop();
})();
