/* Banco de Dados I — RPG · fase atual (qual guardiao). 0 = Malgorath · 1 = Hrimgar.
   Vem de ?boss=N ou sessionStorage 'bd1_boss' (o mapa grava ao entrar). Tudo que muda por boss fica aqui: nomes, fraquezas, textos, cenario. */
(() => {
const P = new URLSearchParams(location.search); let id = P.get('boss'); if (id == null) { try { id = sessionStorage.getItem('bd1_boss'); } catch (e) {} }
id = +id === 1 ? 1 : 0;
const MALG = {id:0, ice:false, name:'Malgorath, Lorde das Trevas', mapName:'CASTELO DE MALGORATH', aoe:'Onda Sombria', thrust:'Estocada', tele:'Teleporte', famName:'DEMONÍACO', famAdj:'demoníaco', famLeech:true,
  weak:['holy','fire'], immune:['water','air','earth'], burnEl:'fire',
  elemTxt:'fogo causa 1,5x e queima por 2 perguntas; água, ar e terra não causam dano (só efeito)', elemDef:'fogo', holyAtk:'é', holyDef:'é',
  p2Title:'FASE 2', p2Txt:n => `Malgorath, Lorde das Trevas, despertou: Onda Sombria +${n} até o fim`, p2Wait:3000, gag:true,
  win:'Malgorath, Lorde das Trevas, foi derrotado.', scene:'assets/backgrounds/game_nohud.png', clean:'assets/backgrounds/game_clean.png'};
const HRIM = {id:1, ice:true, name:'Hrimgar, o Rei Gelado', mapName:'TÚMULO DO REI GELADO', aoe:'Onda Glacial', thrust:'Estocada Glacial', tele:'Passo Gélido', famName:'GÉLIDO', famAdj:'gélido', famLeech:true,
  weak:['fire'], immune:['water'], burnEl:'fire',
  elemTxt:'fogo causa 1,5x, queima por 2 perguntas e ignora a Armadura de Gelo (e descongela os aliados); água não causa dano (só efeito); ar e terra causam dano normal', elemDef:'fogo', holyAtk:'não é fraco: dano normal', holyDef:'não é fraco: corta 50% e limpa o sangramento de quem usa',
  p2Title:'FASE 2', p2Txt:n => `A armadura de Hrimgar se despedaçou: Onda Glacial +${n} até o fim`, p2Wait:5400, gag:false,
  win:'Hrimgar, o Rei Gelado, foi derrotado.', scene:'assets/backgrounds/game_nohud_ice.png', clean:'assets/backgrounds/game_clean_ice.png'};
const S = window.STAGE = id === 1 ? HRIM : MALG;
const ref = document.getElementById('reference'), game = document.getElementById('game');
if (S.ice) {
  if (ref) ref.src = S.scene; if (game) game.classList.add('theme-ice');
  const st = document.createElement('style'); st.textContent = `.ult-icon{background-image:url(${S.clean}) !important}`; document.head.appendChild(st);
}
})();
