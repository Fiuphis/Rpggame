/* v138: frases que rodam no quadro do canto inferior direito do mapa (estilo da arte original) */
(() => {
const Q = [
  ['O verdadeiro poder não está em derrotar os monstros, mas em continuar, mesmo depois de tudo.', '???'],
  ['Quem ousa invadir o meu castelo? Só os tolos chegam até aqui.', 'Lorde das Trevas'],
  ['Cada pergunta errada é uma porta que se fecha. Pense antes de responder.', 'Escriba do Reino'],
  ['Dica: o grupo decide tudo por votação. Combinem a resposta antes que o tempo acabe.', 'Escriba do Reino'],
  ['Já vi heróis melhores que vocês virarem pó. Mas nunca vi ninguém desistir tão tarde.', 'Mercador Errante'],
  ['Dica: o Mercador também funciona por votos. Nada é comprado sem o grupo concordar.', 'Mercador Errante'],
  ['Um banco de dados bem pensado é como um castelo: cada tabela, uma muralha.', 'Cartógrafa Anciã'],
  ['Dica: Maga, Guerreiro, Tanque e Clériga se completam. Troque de grupo e veja outro estilo de jogo.', 'Bardo Cego'],
  ['As trevas não temem a força. Elas temem quem estudou a lição.', 'Guarda do Portão'],
  ['Dica: nem toda lenda está aberta. Derrote o primeiro guardião para liberar o próximo caminho.', 'Cartógrafa Anciã'],
  ['Diz a lenda que o Lorde das Trevas já foi um aluno que nunca revisou a matéria.', 'Bardo Cego'],
  ['Errar faz parte da jornada. O que importa é quem ainda está de pé no fim.', 'Guarda do Portão'],
  ['Dica: SELECT escolhe, INSERT acrescenta, UPDATE muda e DELETE apaga. Não confunda.', 'Escriba do Reino'],
  ['Seis caminhos, seis lendas, um só destino. Qual deles será o seu?', '???']
];
const t = document.getElementById('q-t'), a = document.getElementById('q-a'), box = document.getElementById('quote');
if (!t) return;
let i = 0, tm = 0;
// reduz a letra até caber inteira na caixa (nunca corta)
const fit = () => { let fs = 1.3; box.style.setProperty('--fs', fs + 'cqw'); while (box.scrollHeight > box.clientHeight + 0.5 && fs > 0.8) { fs -= 0.04; box.style.setProperty('--fs', fs.toFixed(2) + 'cqw'); } };
const set = n => { t.textContent = '“' + Q[n][0] + '”'; a.textContent = '— ' + Q[n][1]; fit(); };
const show = n => { i = n; box.classList.add('out'); setTimeout(() => { set(i); box.classList.remove('out'); }, 420); };
const next = () => { let n; do n = Math.floor(Math.random() * Q.length); while (n === i); show(n); };
const loop = () => { clearInterval(tm); tm = setInterval(next, 9000); };
set(0); addEventListener('resize', () => set(i));
box.addEventListener('click', () => { next(); loop(); });
loop();
})();
