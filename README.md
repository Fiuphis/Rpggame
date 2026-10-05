# Banco de Dados I — RPG (Netlify / PWA)

Esta versão usa a arte original `game.png` como camada visual principal e coloca os controles por cima dela.

## Tela "Selecione sua classe" (novo design)
- `index.html` reproduz o design enviado (`select_bg.webp`): MAGA, GUERREIRO, TANQUE e CLÉRIGA, cada uma com grupo de até 7 jogadores;
- tocar numa classe seleciona: o card dá uma "saltada", fica mais claro e com borda colorida; tocar de novo desfaz a seleção (com outra saltada);
- a contagem "n/7" da classe escolhida sobe +1 em verde só na sua tela; só conta de verdade ao confirmar (botão "CONFIRMAR: CLASSE" no rodapé, sem botões A/B);
- classe com 7 jogadores fica escura com "7/7" em vermelho e não pode ser escolhida;
- internamente as chaves continuam `mage`, `knight`, `tank`, `assassin` (Guerreiro = antigo Cavaleiro, Clériga = antigo Assassino); a arte da batalha ainda é a antiga.

## Etapa 6 — Novo combate (regras e barras)
Rodada: pergunta → cada grupo vota na alternativa → rodada dos heróis (ataque básico, defesa ou esquiva) → resolução herói por herói.
- perguntas têm rank C/B/A/S/SS (`DIFFICULTY`: dano 18/28/38/50/64, moedas 1-5, tempo 25-45s); S e SS são as "difíceis" (carregam o especial);
- acertou + ataque = ataca (14 de dano no boss); errou + ataque = falha e o boss contra-ataca;
- errou + defesa = leva metade do dano; errou + esquiva = não leva dano, fúria +1, esquiva em recarga na pergunta seguinte;
- acertou + defesa/esquiva = não defende/esquiva nada e a fúria sobe +5 (enche a barra);
- fúria 5/5: na próxima rodada o boss manda pergunta difícil e a fúria zera;
- acertar pergunta difícil marca a ultimate do herói como carregada (`state.ultReady`); o ícone colorido e a votação no Mercador vêm na próxima etapa;
- barras de vida/mana dos heróis, vida do boss e fúria são dinâmicas; poção de HP cura o herói do seu grupo;
- vitória (boss a 0) e derrota (todos caídos) com botão "JOGAR DE NOVO";
- cronômetros: 15s para a pergunta, 10s para a ação; sem voto = pergunta errada / herói sem ação;
- os outros grupos são simulados (acertam ~60% e agem aleatoriamente) porque ainda não há backend; os votos escondidos entre grupos vêm com o Supabase.
- números para ajustar no topo do `app.js`: `BOSS_MAX_HP`, `HERO_MAX_HP`, `ATTACK_DAMAGE`, `DEFEND_REDUCTION`, `RAGE_*`, `DIFFICULTY`.

## Etapa 5 — Fase de ataque dos heróis
- depois da pergunta do boss, cada herói tem a vez (Maga → Cavaleiro → Tanque → Assassino), marcada por um anel dourado no chão;
- no herói do SEU grupo aparece o painel com 3 habilidades (a, b, c) para o grupo votar, com contador por opção e cronômetro de 10s;
- regras: maioria (metade + 1) decide na hora; se todos votaram, vence a mais votada; empate entre as mais votadas = sorteio; ninguém votou = o herói perde a vez;
- depois do voto o herói dispara um ataque na cor dele no boss (impacto, tremor e número de dano) e passa para o próximo; no fim o boss ataca de novo;
- habilidades provisórias: edite `SKILLS` no topo do `app.js` (nome e dano de cada uma);
- escolha dos outros grupos é sorteada por enquanto (precisa de backend para enxergar o voto deles);
- a barra de vida do boss ainda é da imagem: o dano é calculado em `state.bossHp`, mas não aparece na barra.

## Etapa 4 — Tela limpa do boss + pergunta como ataque
- novo fundo `game_clean.png` (boss sem pergunta); o jogo começa com a tela limpa;
- o boss "carrega" o ataque (brilho + tremor) e a pergunta aparece numa moldura própria (`question_panel.png`);
- acertou: +moedas, ninguém sofre dano; errou: heróis perdem 15 de HP (flash vermelho + tremor);
- depois de responder a pergunta some, a tela fica limpa ~3s e o boss ataca de novo (provisório: no lugar entra a fase de ataque dos heróis com as habilidades a/b/c);
- removidos: sprites antigos dos heróis (não combinavam com o novo fundo) e alvos de toque invisíveis das alternativas;
- as barras de HP/mana ainda são da imagem; o HP já é calculado, mas só ficará visível quando as barras forem dinâmicas.

## Etapa 3 — Votação por tamanho do grupo + prévia no lobby
- maioria = metade do grupo + 1 (1 pessoa: 1 voto; 2: precisa dos 2; 3: precisa de 2; ...);
- a votação encerra assim que a maioria é atingida ou quando todos votaram; com número par pode **empatar** (nada é comprado);
- cronômetro de 10s no Mercador: no fim vale o lado com mais votos; empate ou ninguém votou = nada comprado;
- no lobby, selecionar um grupo mostra +1 em verde (quadradinho e número) só na sua tela; só conta de verdade ao confirmar;
- retratos recortados com segmentação (sem perder partes escuras dos personagens).

## Etapa 2 — Lobby de grupos (retratos + confirmação)
- página inicial (`index.html`) sem título, com os 4 retratos (Mago, Cavaleiro, Tanque, Assassino) e a contagem x/7 de cada grupo;
- tocar num card só **seleciona**: borda dourada e fundo do retrato fica branco; o botão "CONFIRMAR" só então entra no jogo;
- grupo com 7 jogadores aparece "CHEIO" e não pode ser selecionado;
- o botão "◀ GRUPOS" no jogo libera a vaga e volta ao lobby;
- moedas, inventário e votos são do grupo; o Mercador é o mesmo para todos.
- **Modo teste:** botão no rodapé do lobby liga/desliga jogadores simulados nos grupos (Cavaleiro lotado) e votos automáticos no Mercador.
- **Limitação:** a contagem usa `localStorage` (só um aparelho). Contar gente de verdade entre celulares precisa de backend (adaptador `LOBBY` em `lobby.js`).

## Etapa 1 — Mercador
- Mercador parado mostra só "Mercador:"; clicar numa poção abre a votação SIM/NÃO com contadores (maioria de 4 em 7);
- SIM gasta as moedas do grupo e põe a poção na mochila; contador de moedas do topo atualiza;
- sem destaque azul de toque; botões selecionados ficam com borda dourada; todos começam com vida e mana cheias.

## Testar
No rodapé do lobby, toque em "MODO TESTE" para ligar/desligar os jogadores simulados. Alternativas por URL: `?teste=1`, `?teste=0`, `?reset=1`.

## Importante sobre votação multiplayer real
O Netlify sozinho serve o front-end, mas `localStorage` não sincroniza votos entre celulares. O código já deixa um adaptador (`BancoDadosGame.setVoteProvider`) preparado para ligar Supabase/Firebase/Netlify Functions depois. Para votos realmente compartilhados em tempo real entre jogadores, essa camada precisa de um backend/realtime.

## Publicar no Netlify
Suba o conteúdo desta pasta como site estático, ou arraste o ZIP descompactado para o deploy manual do Netlify.

## v11 — Seleção de classe em camadas
Só o personagem recortado (char_*.webp) salta; a borda brilhante fica atrás dele (nunca corta cabeça/chapéu/cajado); painel (panel_*.webp) e contador ficam fixos. Fundo limpo: select_plate.webp.

## v12 — Heróis da batalha
Cenário de batalha atualizado: 4º herói agora é a Clériga (ícone dourado), Guerreiro mantido. game_clean.png recomposto (faixa dos heróis).

## v13 — Recorte refeito
Máscaras refeitas com GrabCut + correções manuais (orbe e chapéu do Mago, cajado da Clériga, corpo do Tanque, cabelo do Guerreiro).

## v14 — Novas artes dos personagens
Mago, Guerreiro, Tanque e Clériga trocados pelas novas versões (fundo preto → recorte limpo). Cenário de cada card refeito sem os personagens antigos.

## v15 — Partes escuras incluídas
Recorte refeito considerando só o fundo preto externo como transparente (cabelo, capas e roupas escuras agora aparecem). Texto do subtítulo restaurado.

## v16 — Tanque e Guerreiro
Recorte reconstruído varrendo cada coluna a partir do topo (tudo abaixo do primeiro pixel da figura é personagem): armadura, capa e sombras escuras agora completas.

## v17 — Etapa B: Ultimate
Ícone de classe ao lado das barras fica cinza até o herói acertar pergunta difícil; aí acende (colorido, pulsando). Na rodada dos heróis o Mercador pergunta "Usar ULTIMATE?" (SIM/NÃO, votação do grupo, 10s). Se SIM: causa 45 de dano no boss e não sofre contra-ataque naquela rodada; o ultimate é gasto. Se NÃO/empate/tempo: continua guardado. Outros grupos simulados usam 50% das vezes. Ajuste em ULT_DAMAGE / ULT_NAME (app.js).

## v18 — Combate, etapa 1: painel de ataque + menu de habilidades
- Painel da pergunta mostra TIPO (físico/sombrio/místico, dano demoníaco) e ATRIBUTO (fogo/água/ar/terra/trevas), sorteado a cada pergunta (SKILLS/ELEMENTS em app.js).
- Menu de habilidades em cartas por classe (ataque vermelho, defesa azul, esquiva verde, tática dourada) com custo de mana, recarga em perguntas e multiplicador. Maga escolhe o elemento num segundo voto.
- Ativos: custos de mana, recargas, mana +8 por pergunta, multiplicadores (pesado 1,5x, super pesado 2x, sagrado 1,5x, elemental 1,3x), defesas com % diferente.
- Etapa 2 (pendente): marcas/reações elementais, fraqueza ao atributo, Passar a Vez, Proteção Específica, ultimates novos (Buraco Negro, Berserk, Provocação, Luz Sagrada).

## v19 — Atributos corrigidos, marcador da vez e menu em pixel art
- Boss: TIPO físico, ATRIBUTO demoníaco. Atributos de herói só para Maga (mana/elemental) e Clériga (sagrado); Guerreiro e Tanque são só físicos. Cartas mostram tags de tipo/atributo.
- Marcador da vez: seta pixelada flutuante, moldura dourada piscando no HUD, anel pixelado no chão e feixe de luz (gerados em código, sem imagens).
- Cartas de habilidade com ícones pixel art (SPR em app.js).

## v20 — Combate, etapa 2
- Marcas elementais da Maga: elementos diferentes no boss reagem (Explosão, Vapor, Lama, Tempestade de Areia, Magma, Gelo — REACTIONS em app.js). Marcas aparecem sob a barra de fúria.
- Ultimates agora são buffs que o grupo vota no Mercador e depois age normalmente: Buraco Negro (dano x2, 1 pergunta), Berserk (2 perguntas atacando mesmo errando e -50% de dano; depois 1 pergunta de Exausto +50%), Provocação (2 perguntas: todo dano vai pro Tanque, -50%), Luz Sagrada (revive com 50 ou cura +40, alvo votado).
- Passar a Vez (aliado ganha ataque extra 1,5x se acertou) e Proteção Específica (dano do protegido vai pro Tanque com -40%), com voto de alvo.
- Status ativos aparecem abaixo da barra de cada herói.

## v21
- Boss: fraco a FOGO e SAGRADO (1,5x, `BOSS = {weak:['holy','fire'], immune:['water','air','earth']}` em app.js). Água, ar e terra: a Maga faz o ataque só pelo efeito (dano 0, IMUNE!). Sem marcas/reações.
- Escudo com bônus só contra o elemento certo: Defesa Sagrada da Clériga corta 75%; Escudo Elemental da Maga corta só 50% neste boss.
- Balanceamento (simulação Monte Carlo): boss 450 HP, contra-ataque 18/32/50, Onda Sombria (dano em área por rodada) 3/5/9. Jogo misto ~50-60% vitória com 50-60% de acerto.
- Mana cheia no início; menu de habilidades fecha assim que a escolha é decidida.

## v22 — balanceamento das habilidades especiais
Contribuição de cada ultimate na vitória (simulação, +pontos de % de vitória): Clériga +28, Maga +9, Tanque +4, Guerreiro ~0 → ajustado para ~+18, +9, +9, +11.
- Luz Sagrada: cura +25 (era 40), revive com 35 (era 50).
- Berserk: ataques com 1,5x de dano durante o efeito (além de atacar errando e -50% de dano recebido).
- Provocação: durante o efeito, a Onda Sombria causa só metade do dano nos aliados do Tanque.
- Buraco Negro: mantido (x2, 1 pergunta).

## v23
- Pergunta difícil garantida a cada 5 perguntas (`HARD_EVERY`), além da fúria cheia, para os ultimates aparecerem com regularidade. Simulação: sem mudança relevante na taxa de vitória.

## v24
- Menu de habilidades some por completo logo após a escolha (todos os heróis) e é garantido fechado antes da resolução.
- Service worker agora é "rede primeiro": o celular pega a versão nova ao reabrir (antes o cache antigo podia mostrar a versão anterior).

## v25
- Menu de elementos da Maga tem card VOLTAR (o grupo vota nele): volta ao menu de habilidades.
- Ultimate do grupo ativo não é mais perguntado sozinho ao carregar: aparece como card ESPECIAL no topo do menu de habilidades (ou toque no ícone do herói). O efeito começa a contar na hora em que é usado; depois o menu reabre para a ação normal.
- Barra de mana com a mesma largura da de vida (faltava um pedaço).

## v27
- Service worker: imagens em cache primeiro (o jogo abre instantâneo ao escolher o grupo); HTML/JS/CSS pela rede (sempre a versão nova).
- Barra de mana alinhada ao encaixe da moldura (mesma altura/posição do slot, antes começava mais alta).

## v28
- Tudo em cache (abre instantâneo, funciona offline). Em segundo plano o service worker revalida na rede; se algo mudou, atualiza o cache e avisa a página: no menu recarrega sozinho, no jogo aparece o botão "NOVA VERSÃO · TOQUE PARA ATUALIZAR" (não interrompe a partida).

## v29
- Todos os grupos começam com 0 moedas (antes 10). Saves antigos são descartados (formato v:2).

## v30 — animações, falas e sons (anim.js)
- Heróis e boss foram recortados do fundo (segmentação + ajuste manual) em `spr_*.webp` e ficam sobre o fundo original, no mesmo lugar. Por isso os movimentos são pequenos (escala/inclinação a partir dos pés); movimentos grandes deixam um "rastro" do desenho de fundo.
- 3 ociosos sorteados por personagem (respirar, balançar e um gesto próprio: orbe da Maga, espada do Guerreiro, ombros do Tanque, oração da Clériga; boss: respirar, capa, chama dos olhos/espada).
- Ações: ataque corpo a corpo, pesado, magia, sagrado, passar a vez, defesa (escudo colorido por tipo), esquiva (com rastro), dano, queda (cinza com caveira), reviver, especial, vitória; boss: ataque, fúria, onda sombria, risada, derrota.
- Falas em balão pixel-art (sorteadas, ~30-60% das ações) e sons 8-bit sintetizados (botão 🔊 no canto esquerdo; preferência salva).
- Para trocar por quadros desenhados: `Anim.useSheet('knight','melee',{src:'knight_melee.webp',frames:6,fps:12})` (sprite sheet horizontal com o mesmo enquadramento do `spr_knight.webp`).

## v31–v34 — sem áudio, piso reconstruído e protótipo "puppet"
- Áudio removido por completo.
- `game_clean.png` agora é um cenário **sem heróis** (piso reconstruído); todos os heróis são camadas de sprite → acabaram as figuras duplicadas.
- `puppet.js`: motor de animação em canvas (12 fps, pixel art por código) com corpo recortado em `rig/`. Protótipo para **Maga** (cajado girando no ar, orbe, runas, cast, escudo, esquiva, ultimate) e **Clériga** (Bíblia que abre/lê/fecha, halo, oração, magia sagrada, escudo, ultimate).
- Guerreiro, Tanque e Boss ainda usam o sistema antigo (`anim.js`), aguardando aprovação do estilo.

## v35 — esqueleto (rig) completo da Maga e da Clériga
- Corpo dividido em partes (`rig/*_base/arm/hat/hood...png`, geradas por `tools/segmenta_rig.py` a partir de `tools/rig_src`): chapéu/capuz, braços, tronco e saia/capa como **malha deformável** (respiração, balanço da barra, capa ao vento, inclinação do tronco, passos dos pés).
- Mãos desenhadas em pixel art por código, com **dedos independentes** e polegar (agarrar, abrir, batucar, virar página).
- Maga: giro do cajado no ar, orbe, runas, tocar a aba do chapéu; Clériga: Bíblia, oração, cajado no chão, olhar ao redor, bênção. Ações: ataque, defesa, esquiva, dano, ultimate, vitória.

## v36 — tudo estático
Animações, falas e o rig da Maga/Clériga removidos a pedido: o jogo volta ao visual estático (cenário original com os heróis). Histórico das animações fica no git (v30–v35).

## v37 — moedas sempre começam em 0 a cada início de jogo (o inventário continua salvo).

## v38 — tocador de sprite sheets
Animações por código removidas de vez. `anim.js` toca sprite sheets desenhados (veja ANIMACOES.md, `gabaritos/`, `tools/`). Sem sheets, os heróis ficam parados (cenário sem heróis + sprites `spr_*.webp`).

## v39 — novo cenário, personagens em camadas e Maga animada
- Cenário novo (sala do trono) sem personagens no fundo; HUD e painel inferior nos mesmos pixels. Heróis e Lorde das Trevas são camadas separadas (`spr_*.webp`) com sombra no chão.
- **Maga animada** (`mage.js`): corpo deformado por linhas (respiração, manto, ponta do chapéu, inclinação, salto) + efeitos azuis **extraídos da folha de referência** (`fx/*.png`, gerados por `tools/extrair_fx.py`): círculo rúnico, anel arcano, projétil, cristal, coluna, explosão, chama, estrelas, fios de energia.
- Animações: 4 idles aleatórios, ataque, magia, sagrado, pesado, ultimate, defesa (anel), esquiva (rastro), dano, passar, vitória, morte/reviver.
- Os outros personagens seguem estáticos (ou com sheets, como em v38).

## v42 — Maga refeita com a folha de fundo branco
- `tools/cut_white.py` recorta a folha branca (poses de costas + efeitos) em `mage3/`: todas as poses na **mesma escala** (corpo = 190 px) e ancoradas pelo mesmo ponto no chão; borda limpa, sem halo.
- `mage.js` anima por interpolação (deslocar, inclinar, respirar, rastro na esquiva) com cross-fade curto entre quadros reais; efeitos originais da folha (cometa, fogo caindo, pilar de água, redemoinho, espinhos e pedras, Buraco Negro). Nenhuma partícula desenhada por código.

## v43
- Cena da habilidade especial agora termina antes de reabrir o menu de habilidades (todos os grupos).
- Maga no mesmo tamanho dos outros heróis; golpes de cajado (frontal, lateral), giros no ar, corrida + golpe, esquivas variadas, idles extras e vitórias — variantes sorteadas sem repetir a anterior.

## v44
- Poses da Maga com contorno escuro e sem pontos brancos (tools/post_outline.py, roda depois de cut_white/bake_grad).
- Projéteis viraram luz suave com rastro e fagulhas; brilho pulsante no cajado; poses de carregamento (castdef, bolha de mana, mãos elementais).
- Sem andar/correr; mais variantes de ataque, mágica e golpe forte; idle calmo, movimentos extras raros e aleatórios.

## v45
- Poses de giro/balanço do cajado reescaladas (estavam ~20% menores) — Maga mantém o mesmo tamanho em todas as animações.
- Borda branca/cinza removida: post_outline.py agora limpa franjas claras, halos cinza e fundo plano antes do contorno escuro.

## v46
- Maga só tem as animações das habilidades dela: ataque de mana, elemental (4 elementos × 4 variações), escudos, esquiva, dano, vitória, ult e golpe extra. Removidos "passar a vez" e "ataque pesado" (são do Guerreiro/Tanque).
- Defesa: o escudo da Maga não é mais cortado pela pose de dano quando o golpe do boss é defendido.

## v47 — Clériga renovada
- Novo rig `cleric.js` + poses de costas recortadas das folhas brancas (`tools/cut_cleric.py` → `clr/`), mesma escala e ancoradas no chão, manto branco preservado, contorno escuro.
- Habilidades dela: Ataque Normal (cajado, 3 variações), Ataque Sagrado (3 variações, uma lendo/tocando a Bíblia), Defesa Normal e Sagrada (escudo de luz atrás dela), Esquiva (2), Luz Sagrada (pilar de luz), dano, vitória e morte (cai no chão).
- Ociosa: sorteia ler a Bíblia, tocar no livro, rezar ou erguer o cajado, com pausas longas.

## v48
- Borda escura fina na Clériga (1px, `outline()` em tools/cut_cleric.py) e borda da Maga reduzida de ~3px para 1px (tools/post_outline.py); franjas claras removidas em ambas.

## v49
- Clériga mais à frente (pés ~16px mais baixos, 5% maior) e ociosa bem mais calma: movimentos extras a cada 11–22 s (9–16 s após uma ação) e 1,7x mais lentos.

## v50
- Clériga ~46px mais perto do Tanque; limpeza extra de pixels claros na borda (cut_cleric.py: faixa de 3px, brancos puros e cinzas viram a cor do contorno).

## v51
- Borda escura agora entra 2px para dentro do corpo (Clériga e Maga), cobrindo as franjas brancas; contorno externo de 1px mantido.

## v52
- Maga: borda voltou à versão fina (1px por fora). Clériga: removida a linha clara que ficava entre o corpo e o contorno (pixels claros até 6px da beirada viram a cor do contorno).

## v53
- Clériga centralizada no círculo da vez (HERO_X.assassin 81%, anel um pouco mais baixo).

## v54
- Heróis na mesma linha (pés em y=1098) e espaçamento igual (~247px); anel/feixe/seta seguem HERO_X novo.
- Corrigido deslocamento horizontal do #game (overflow:clip) que empurrava os heróis para a esquerda após cliques.
- Clériga: só poses de costas (bp/bg/br/bt), 3-4 variações de efeito por habilidade (golpe, sagrado, defesa, esquiva, dano, vitória, Luz Sagrada).

## v55
- Maga: variações igualadas às da Clériga — Escudo 3, Buraco Negro 2, Esquiva 3, Dano 3, Vitória 3 (ataques já tinham 7 normais, 5 de mana e 4 por elemento).

## v56
- Variações em "sacola embaralhada": a mesma habilidade nunca repete a variação em seguida (Maga e Clériga).
- Clériga volta a usar o cajado (at1/at3/stf/ult1/ult2, de costas) além da Bíblia; mais variações com cajado em ataque, sagrado, defesa, Luz Sagrada e vitória.
- Dano ao boss só entra no impacto do efeito (evento hit/elemento) para Maga e Clériga; removida a bola de projétil antiga delas.
- Luz Sagrada: escolhe o alvo ANTES; os efeitos (círculo, pilar, luz) caem no alvo e a vida só muda quando a luz chega. Sem escolha no tempo = não usa e continua disponível.

## v57
- Mana não regenera mais: só sobe com Poção de Mana.
- Cenário trocado (salão do trono novo); HUD (boss, moedas, cartões dos heróis, painel) preservado.
- Tremor do cenário reduzido a quase nada (±1px).

## v58
- Maga: contorno padronizado e fino (2px) em todas as poses do corpo (tools/thin_outline.py); poses das folhas ampliadas (giros/golpes) e idle3/dodge3 estavam com contorno de 5-8px.

## v59
- Maga: recorte refeito nas 6 poses da folha em degradê (giro, estrelas, golpes laterais/frontal) com tools/retrace.py — o contorno escuro original delimita o personagem, o halo azul de sobra é descartado e efeitos (arcos, orbe) ficam intactos; borda fina refeita por cima.

## v60 — recorte da Maga refeito direto da folha original
- Causa do "sobra": o recorte antigo (`recorta_folha3.body_mask`) engrossava a máscara com a sombra escura do fundo (tom parecido com o manto). Agora a máscara é só a área fechada pelo contorno escuro do personagem (contorno relativo ao fundo local); sem engrossar com a sombra. `bake_grad.py` → `retrace.py` (borda fina nova).
- Corrigido o agrupamento: a pose "swingl" trazia o mago em pé junto (duas figuras na mesma imagem); agora cada pose tem só uma figura (a do mago em pé foi separada e não é usada).
- Clériga: Luz Sagrada não brilha mais nela (sem carga/brilho do orbe e sem flash de tela quando há alvo); a luz fica só no alvo escolhido.

## v61 — Tanque novo (de costas o tempo todo)
- Personagem trocado pelas folhas novas: `tools/cut_tank.py` (poses, escala única, ancoradas nos pés, borda fina só no corpo) + `tools/cut_tank_fx.py` (pedras) → `tank/*.png`; caixas de recorte em `tools/boxes_tank.py`.
- Novo rig `tank.js`: ataque normal (5 variações), super pesado (4), proteção específica (4), defesa (4), esquiva (4), dor (3), vitória (4), provocação/ult (3), ociosa (5). Sacola embaralhada: nunca repete a mesma variação em seguida.
- Brilho nos golpes: onda dourada sai do martelo até o boss; o dano só entra quando ela acerta (fireHit), com clarão, pedras e anéis no impacto (`RIG_HERO` inclui o tanque).

## v62 — Tanque refeito: 1 martelo + 1 escudo
- Removidas as poses com martelo/escudo duplicado ou bugado (i3, p3, x2, t2/t4–t6, u*, e*, s*, b2, b3, n4). Ataques usam martelo na cabeça → golpe em sequência fluida (folhas a/b).
- Queda em 3 poses (meio caído → um joelho → dois joelhos) e levantar na ordem inversa (1,1 s).
- Provocação com as pedras voando (tA/tB/tC); sem a versão de dois escudos.

## v63 — mais variações
- Tanque: ataque 5→8, super pesado 4→7, proteção 4→6, defesa 4→6, esquiva 3→5, dor 3→4, vitória 4→5, provocação 3→6 (nova chuva de pedras `taunt:4`, golpes `small4`/`big4`).
- Especiais: Maga 2→6 (buraco negro com variantes `bhopen2/bhbig2/bhend2`), Clériga 3→7 (`lightup2`/`lightend2`), Tanque 3→6. Só poses e efeitos reais recombinados.

## v64 — ataques do Tanque realmente diferentes
- Antes as variações mudavam só a preparação; o golpe era sempre a mesma pose (a_sw). Agora cada variação usa pose de golpe própria (reto, diagonal n2/n3, marreta no chão a_bi, duplo) e um estilo de onda: reta, `drop` (cai do alto sobre o boss), `ground` (zigue-zague pelo chão com pedras subindo), `twin` (duas ondas). Normal 8 e super pesado 7.

## v65 — Tanque com as poses da folha nova (d)
- `tools/cut_tank.py` ganhou a folha d (poses `d_*`) e `tools/cut_tank_fx_d.py` recorta os efeitos extras (`fx_bring`, `fx_bspike`, `fx_earth`, `fx_rockburst`).
- Sem mais martelo largado no chão: removidas a_bi, h3/h4 (folha c), x1 e as poses de folha c que não seguravam o martelo. Super pesado = d_h1→d_h2 (martelo no alto)→d_h3/d_h4 (explosão de pedras).
- Ataque normal 10, super pesado 7, proteção 6, defesa 6, esquiva 6, dor 5, vitória 5, provocação 6; ondas azuis (d_a3/d_m1) e douradas (a_sw/n3); novos impactos `spike`, `quake`, `burst`.

## v66 — Tanque maior
- Escala única de todas as poses do Tanque (`SZ = 1.2` em tank.js): corpo ~314px, contra 262–284 dos outros heróis; sombra e ponto de saída da onda acompanham a escala.

## v68 — Maga e Clériga: tamanho padronizado + variações com efeitos distintos
- Tamanho: Maga e Clériga com a mesma altura (~225, menores que o Cavaleiro 261 e o Tanque 314). Poses destoantes corrigidas (Maga: castdef/fogo/água/ar/terra ×1,2; Clériga: ult1/ult2/at1/bp3).
- Maga: projéteis (orbe, cometa, raio, estrela dupla, cristal, redemoinho, cruz) com trajetórias (arco, reto, zigue-zague, duplo) e impactos próprios (raio, cristais, cruz, redemoinho, cometa, estrelas). Elementos: 4 variações cada com efeitos diferentes (3 colunas/chuva/meteoro de fogo; colunas/onda/anéis de água; ciclones duplos/ascendente; espinhos triplos/varredura/chuva de pedras).
- Clériga: ataque normal 7, sagrado 6 — projéteis (raios, estrela, cruz, sol) em arco/reto/zigue-zague/duplo e impactos novos (small4, holy4 lótus+anéis, holy5 três pilares).

## v69 — Boss fraco a fogo
- Ataque elemental da Maga: fogo agora fere o boss (1,5x sobre o 1,3x do ataque); água/ar/terra continuam a mostrar o ataque no boss com dano 0 (IMUNE!). Menu de elementos mostra "BOSS FRACO 1,5x" no fogo e "BOSS IMUNE" nos outros.

## v70 — Queimadura do fogo
- Fogo da Maga acertando o boss: dano 1,5x e marca QUEIMANDO por 2 perguntas — no fim de cada pergunta o boss leva 0,25x do ataque normal (`BURN_TURNS`, `BURN_MULT` em app.js). Indicador "QUEIMANDO n" no HUD e brilho laranja no boss; acertar fogo de novo renova a duração.

## v71 — Guerreiro (knight.js)
Rig novo do Guerreiro com as 3 folhas novas (tools/seg_knight.py → cut_knight.py → knight/*.png, efeitos via cut_knight_fx.py). Tamanho 272 (2º maior). 7 ataques normais, 6 pesados, 7 defesas, 6 esquivas, 5 passar a vez, 5 hurt, 5 vitórias, 4 ativações de Berserk; modo Berserk (poses vermelhas, golpes vermelhos) e modo Exausto. Sacola embaralhada, dano só no impacto, queda em 3 poses. Rochas (knight/fx_rock*) também usadas pelo Tanque (os arquivos antigos não existiam).

## v72
Guerreiro menor (256) e poses padronizadas (escala por altura nas poses em pé, por área nas de ação); heróis mais afastados (META/HERO_X); barras de vida/mana trocadas pelas da imagem nova (hud_*.png + game_nohud.png, pequenas, sobre cada herói; ícone do especial logo abaixo).

## v73
Guerreiro: tamanhos das poses reajustados pela altura visível (incluindo cabelo): fator por pose e por folha em tools/cut_knight.py.

## v74
Efeitos de ataque de todos os heróis suavizados: sprites de efeito desenhados borrados/aditivos/mais translúcidos (fxsoft.js); efeitos embutidos nas poses do Guerreiro e do Tanque suavizados no recorte (tools/fxsoft.py); anéis mais macios.

## v75
Guerreiro: poses de esquiva/agachado ampliadas (escala pela área do corpo).

## v76
Guerreiro: poses de esquiva/agachado em escala igual à do corpo em pé (área do corpo ×1.25).

## v77
Guerreiro: poses do Berserk/ult padronizadas pela altura visível (cabelo→pés), conferidas lado a lado com a idle.

## v78
Guerreiro: âncora das poses trocada (centro do corpo azul + chão por percentil) para ele não 'andar' entre poses. Medido no jogo: oscilação horizontal ≤ ±8 px em todas as ativações e ataques.

## v79 — menus de habilidade e painel de pergunta novos
- Quatro quadros de habilidade (um por herói, `menu_<heroi>.png`) + quadro de elementos (`menu_elem.png`), gerados por `tools/make_menus.py` a partir das artes enviadas: só foi apagado o que é dinâmico (título, caixa TIPO, tempo, contadores); o resto da arte é a original. Coordenadas em `menu_meta.js`.
- Cartões clicáveis por cima da arte (borda dourada ao selecionar, contagem de votos ao vivo, escurecidos com motivo quando bloqueados: RECARGA n / SEM MANA / ACERTE UMA DIFÍCIL). O Especial aparece sempre e só libera após acertar uma pergunta difícil.
- TIPO sempre com a mesma espada (`icon_tipo_sword.png`). Título "VEZ DA MAGA / DO GUERREIRO / DO TANQUE / DA CLÉRIGA" desenhado por código.
- Painel de pergunta novo (`question_panel.png`): TIPO, ATRIBUTO, enunciado, moedas, tempo e alternativas a) b) c) d) com votos.
- MAGO → MAGA em todo o jogo. Ataque Super Pesado do Tanque custa 20 de mana (como no quadro). Escolha de alvo (Passar a Vez, Proteção, Luz Sagrada) segue no menu simples antigo.

## v80 — Guerreiro: rolamento/esquiva/dano menores (escala da família ROLL ~0,8x em `tools/cut_knight.py`, ancoragem mantida).

## v81 — menu menor, marcador de vez só com seta, inventário/mercador escondidos
- Menu de habilidades a 68% da largura. Marcador de vez: sem retângulo amarelo e sem círculo no chão; só a seta (menor).
- Inventário + Mercador: arte nova (`bag_panel.png`), escondida; botão com mochila + mercador no centro da borda inferior (`#bag-toggle`) abre/fecha. Abre sozinho quando começa uma votação de compra. Fundo do rodapé (`game_nohud.png`) estendido com chão.
- v82: botão do inventário/mercador usa a arte nova (`bag_button.png`).
- v83: recorte do botão refeito (tudo dentro da borda dourada preservado, fora removido).
- v84: recorte do botão inclui o contorno preto e o topo do capuz do mercador.
- v84: botão do inventário com a borda escura externa preservada.
- v85: contorno escuro do botão com espessura uniforme (7px na arte original).

## v86 — tamanhos padronizados por herói
- Alturas (cabeça→pés, escala do jogo): Tanque ~309 > Guerreiro ~250 (SZ 0,9) > Maga ≈ Clériga ~225 (MSZ 0,91 / SZ 0,82).
- Tabelas `PM` (tank.js, knight.js) e `PS` (mage.js, cleric.js): multiplicador por pose, calculado pela altura da cabeça e pela área do corpo (sem os efeitos) em relação à pose ociosa de referência (`a_i1`, `K2_3`, `idle1`, `at1`).

## v87 — Boss animado e novas habilidades
- `boss.js` (BossRig) + `boss/B_1..12.png` (tools/cut_boss.py): idle, Golpe Horizontal (fácil, 18), Golpe Vertical (média, 32), Invocação Demoníaca (difícil, 50), Estocada, Onda Sombria (AoE 3/5/9), Enfurecer, Preparando Habilidade, Teleporte, dano, morte, risada. Dano só entra quando o golpe chega (A.hit('boss')).
- Regras (app.js): Preparando Habilidade (20%/rodada; rodada de aviso sem golpe único, próxima +50%); Teleporte (>rodada 4, 1/6, 20 de dano no mais fraco; ESQUIVA anula e atordoa: +25% de dano no boss); Estocada (24, só com Provocação/Proteção ativas, ignora o redirecionamento); Enfurecer = Onda +2.
- v88: Estocada com recarga de 2 perguntas, Teleporte 1; Buraco Negro = 3x o dano base (sem duração); Super Pesado do Tanque (recarga 3) desnorteia o boss na pergunta seguinte (+25% de dano nele, sem habilidades especiais). Vida do boss 630 (tools/sim_boss.py: grupo de 60% vence ~57%, ~13 rodadas).
- v92: Buraco Negro = ataque próprio de 3,5x o dano base (49), recarga: pula a próxima pergunta difícil; tempo esgotado no menu de elementos = sem ação; vida do boss 650.
- Teste: ?teste=1&grupo=x; window.__force='prep'|'tele' força o evento.
- v93: dano base por herói (Clériga 10, Maga/Tanque 14, Guerreiro 21; Buraco Negro 4x = 56), defesa Maga 35% / Guerreiro e Clériga 50% / Tanque 65%; vida do boss 700; textos dos menus regravados (tools/patch_menu_text.py).
- v94: Defesa Sagrada 65%, Defesa do Tanque 75%.
- v95: Buraco Negro em dois estouros: 1,5x + 2,5x (= 4x).
- v97: aba de votação do mercador remedida sobre a arte (SIM/NÃO e contadores centralizados, nada encosta na moldura).
- v98: texto SIM/NÃO centralizado na vertical e botões afastados da moldura.
- v99: botões SIM/NÃO um pouco mais para baixo.
- v99: texto SIM/NÃO um pouco mais baixo.
- v100: texto SIM/NÃO meio ajuste acima.
- v101: texto SIM/NÃO mais acima (ajuste fino).
- v102: névoa branca suave animada nas áreas de degradê (lobby e jogo).
- v103: nuvens mais cheias andando esquerda→direita, só na seleção de grupo (removidas do jogo).
- v104: nuvens densas que atravessam a borda do menu de seleção (só lobby).
- v105: borda do jogo escura com esqueletos (tools/make_skel.py) emergindo da escuridão, luz falhando.
- v106: esqueletos das bordas do jogo agora usam o sprite do usuário (tools/cut_skel.py recorta o fundo).
- v107: só o esqueleto do usuário, 68 em montes sobrepostos (bordas lotadas).
- v108: 12 esqueletos em cima e 12 embaixo, menores, mais escuridão.
- v109: só rostos, maiores e mais juntos; no escuro ficam pretos (somem) e só aparecem na luz.
- v110: rostos com profundidade (perto=maior/mais claro, longe=menor/mais fraco), oclusão só por rostos acesos.
- v111: abertura da batalha (intro.js): escuro → trono → zoom para trás → fumaça → boss se materializa; grupo vota para pular. Desligada em ?teste=1 (use &intro=1).
- v112: falas do boss na abertura (legenda digitando).
- v113: reação dos 4 heróis na abertura (rostos recortados das folhas de personagem, em intro/f_*.webp), olhando em volta assustados após a 1ª fala do boss.
- v114: abertura ~16s (mais lenta), caixa de fala do boss, recortes de rosto melhores (tools/cut_heads.py), fumaça centrada no trono.
- v115: cada fala fica ~5s após digitar (abertura ~29s); removidas as reações dos heróis.
- v116: pausa de leitura de cada fala proporcional ao texto (1,5 s + 60 ms/letra); abertura ~23 s.
- v117: mapa Jornada dos Heróis (map.html/js/css, tools/build_map.py): lobby → mapa → voto para entrar → abertura; vitória marca o boss como concluído e libera o próximo. Progresso em localStorage bd1_progress (?resetmapa=1 zera).
- v118: mapa: botão REINICIAR (com confirmação) perto da bússola, nós selecionáveis (tocar de novo desmarca), rejogar boss concluído, 'trocar de grupo' sem perder progresso.
- v121: transição lobby→mapa com nuvens densas que fecham de cima/baixo até o meio e abrem (mapa com blur → nítido) até as bordas do mapa, onde ficam como as nuvens da seleção (fog.css).
- v122: nuvens ficam paradas no meio até a página abrir; mesmo efeito na volta mapa→seleção (fog.js).
- v123: as mesmas nuvens são o repouso das bordas e a transição (vão ao meio e voltam exatamente ao mesmo lugar), cobrindo toda a faixa do degradê; nuvens persistentes antigas removidas.
- v124: nuvens fechadas ficam totalmente opacas (cobrem a tela inteira, a troca não aparece).
- v125: performance — deriva das nuvens agora por transform (GPU), sem repintar ~150 gradientes+blur por frame.
- v126: nuvens viram imagens pré-renderizadas (fog/*.webp, sem blur/máscara/gradientes em tempo real); blur do mapa mais leve.
- v127: botão TROCAR DE GRUPO fica atrás das nuvens (não aparece durante a transição).
- v128: painel do boss (botão ENTRAR) e modal de reiniciar ficam acima das nuvens.
- v129: nuvens de repouso entram menos no mapa/menu (sobreposição 14%→2%, opacidade .62→.5).
- v130: brilho das nuvens não invade mais o conteúdo (sobreposição -6%, opacidade .45).
- v131: nuvens encostam na borda do menu/mapa; brilho invade só um pouco (sobreposição +1%, opacidade .48).
- v132: botão de atualizar versão saiu do jogo e foi pro canto superior direito do menu de seleção de grupo (↻ ATUALIZAR: limpa cache e recarrega).
- v133: estilo do botão ATUALIZAR vai inline no index.html (não depende do cache do lobby.css).
- v134: ATUALIZAR baixa os arquivos ignorando o cache HTTP e mostra a versão no botão.
- v135: nuvens voltam ao ajuste da v129 (sobreposição 2%, opacidade .5); no mapa opacidade .42 e blur de entrada 3px (mais nítido).
- v136: nuvens e mapa idênticos à v128 (sobreposição 14%, opacidade .62, blur de entrada 6px/1,6s).
- v137: botão voltar do celular/navegador no mapa = TROCAR DE GRUPO.
- v138: citação do canto do mapa agora roda frases (lore, dicas, falas de personagens com nome), troca a cada 9s ou ao tocar; texto original apagado da arte.
- v139: quadro de frases centralizado na moldura (mesma distância nos 4 lados) e letra se ajusta pra nunca cortar.
- v140: todas as frases reescritas curtas (até 2 linhas + nome), no padrão do Guarda do Portão.
- v141: mapa vivo (mapfx.js): água com brilhos e ondas, 3 barcos vagando, peixes pulando, pedras caindo das falésias, barbatana, serpente, tentáculos, olhos e sereia. Máscara de água em map/water.png (tools/build_water.py).
- v142: sereia removida; entram voadores: bandos de pássaros em V, morcegos e wyverns cruzando o mapa em direções aleatórias.
- v143: barcos removidos do mapa.
- v144: clima por região (calmo/vento/ondas grandes/tempestade com raios e chuva/ciclone raro, trocando sozinho) e nuvens raras passando.
- v145: interações: raio frita voadores/tentáculos/criaturas (viram pó), ciclone puxa voadores pra água, wyvern queima morcegos/pássaros, tentáculo agarra um e arrasta (os outros fogem em pânico).
- v146: peixes pulando removidos.
- v147: respingos brancos das ondas na costa removidos (onda só desliza e some).
- v148: ondas da costa com 1 pixel de espessura.
- v149: ondas da costa bem sutis (linha de 1px com 30% de opacidade, aparência de ~0,25px).
- v150: avisos do combate (banner + toast) movidos para a faixa de baixo, abaixo dos heróis, sem cobrir o boss; visual novo (cores por tipo, losangos); anti-repetição e toast de Fúria redundante removido.
- v151: avisos ficam o tempo de leitura proporcional ao tamanho do texto (0,9s + 50ms/caractere, máx. 6s); mensagens curtas idem.
- v152: cenário do boss vivo (ambient.js): chamas animadas nas tochas, luz/sombra pulsando, brasas, reflexos no chão, nuvens no céu, poeira e morcegos em perspectiva (perto→longe e no fundo).
- v153: cenário do boss: relâmpago raro, névoa no chão, raios de luar, olhos do boss brilham com a Fúria, runas no chão, estandartes balançando, teias, sombras dos heróis tremendo, tochas apagam/reacendem quando o boss ruge, corvos nos pilares.
- v154: morcegos voam só na parte de cima da sala, atrás do boss e longe dos heróis.
- v155: olhos vermelhos do boss agora desenhados dentro do sprite (acompanham cada pose); raio sem tela azul, só o relâmpago no céu.
- v156: inventário e mercador ficam na frente dos avisos (avisos curtos aparecem logo acima da aba).
- v157: relâmpago mais visível (mais grosso, com ramificações, 3 clarões) e mais frequente (a cada 10–24s).
- v158: relâmpago com clarão na sala toda (luz azulada) e brilho em volta do raio; raio continua no fundo.
- v159: corrigido bug das nuvens mais à frente no menu/mapa ao abrir direto (a posição de repouso era calculada com as nuvens ainda ocultas); agora também reajusta ao carregar, ao mudar o layout e ao voltar pelo histórico.
- v160: caixas do mapa (título, rosa dos ventos, legenda, frase) acima das nuvens, aparecendo depois que o mapa carrega e as nuvens densas saem (hud.js + map/ui_*.webp).
- v161: caixa 'Jornada dos Heróis' acima das nuvens sem o brasão do Castelo (o brasão fica com o mapa).
- v162: avisos de combate bem menores; aviso de moedas virou '+N' animado abaixo do contador (que atualiza logo depois).
- v163: avisos de combate escritos num papiro que cobre a faixa de baixo (no lugar dos esqueletos); em telas sem faixa, mantém os avisos pequenos sobre o jogo.
- v164: papiro pixelart desgastado (paper.js): bordas rasgadas e queimadas, rolos de madeira com pontas douradas, moldura ornamentada, gemas e runas brilhando, faíscas mágicas.
- v165: textos do papiro em fonte pixelart (Pixelify Sans, OFL); título não invade mais a moldura de cima.
- v166: gag cômica (1x por partida): o boss tenta invocar um Dragão Esqueleto (alerta HITKILL em todos os heróis), mas vem só um goblin; ele estranha, desinvoca e desiste.
- v167: topo todo preto (sem caveiras/luz piscando); jogo encostado no topo; papiro bem maior (cobre o rodapé do jogo) e botões de inventário/mercador mais acima; textos do papiro maiores.
- v168: dificuldade vira RANK C (azul), B (verde), A (laranja), S (roxo), SS (amarelo) em tudo; 8 perguntas novas (S e SS); selo de rank no painel; sorteio por peso e S/SS garantida a cada 5.
- v169: selo de rank um pouco mais abaixo e à direita (não toca mais na borda dourada nem no texto).
- v170: Mercador vivo — fala diferente a cada abertura e fica irritado se abrem sem comprar (6 vezes: fecha a loja por 3 perguntas, placa FECHADO em pixel art); luz da lanterna/velas mexendo; item comprado sai da prateleira e é reposto na pergunta seguinte (`SHOP_POOL`).
- v171: fala do mercador agora no cantinho dele (caixa ao lado do retrato), sem balão grande.
- v172: placa FECHADO refeita: pixel art 64x40 gasta (madeira com veios, rachaduras, pregos enferrujados, musgo, tinta descascada); gerador em tools/make_sign.py.
- v173: sem emojis nos textos do jogo (aviso do dragão, dano de fogo, botões); alerta HITKILL usa caveira em pixel art.
- v174: emoji da gag removido (resto voltou); mercador: reposição imediata a cada compra com OUTRO item, prateleira sorteada a cada partida, 6 poções (pequena/normal/grande de HP e mana), falas e perguntas se ajustam sozinhas à caixa.
- v175: 16 itens novos no mercador com efeito real (defesa: Escudo de Ferro, Amuleto, Elmo, Bomba de Fumaca; cura: Elixir, Erva; critico/dano: Lente, Tonico, Polvora, Lamina, Bomba de Luz; utilidade: Ampulheta, Moeda da Sorte; raros com brilho dourado: Pena de Fenix, Dado do Destino, Pergaminho Arcano). Tocar num item na loja mostra o que ele faz.
- v176: mercador agora aguenta 12 aberturas sem compra antes de se irritar e fechar a loja (humor sobe em 4 faixas: simpatico, impaciente, azedo, furioso).
- v177: economia equilibrada: moedas por rank C1/B2/A3/S5/SS8; pocoes de mana 4/6/10; raros 24/20/22.
- v178: afinidade de itens: Maga (Ampulheta, Pergaminho, Elixir, Moeda), Guerreiro (Lamina, Tonico, Bomba de Luz, Erva), Tanque (Escudo, Elmo, Amuleto), Assassina (Lente, Dado, Polvora, Fumaca) ganham +50% de efeito.
- v179: itens podem ser dados a aliados (pocoes, Escudo, Amuleto, Elmo, Fumaca, Erva, Elixir, Pena de Fenix revive aliado caido); buffs agora sao por heroi e a afinidade vale para quem recebe.
- v180: itens iguais empilham ate 3 por slot da mochila (numero no canto).
- v181: errar pergunta rank S ou SS deixa a Onda Sombria 50% mais forte nessa rodada e enche a furia (+1 por heroi que errou).
- v182: equilibrio (simulado): boss 650 de HP e Onda Sombria ~10% menor (A6, S8, SS11). Sem itens fica dificil; com alguns itens e ultimates bem usados e vitoria provavel.
- v183: Fase 2 do boss (50% de HP): raios no fundo, cenario piscando, boss mais forte (Onda Sombria +2, olhos sempre acesos), sem fala. Tambem aplica de fato a regra do v181: errar rank S/SS deixa a Onda Sombria 50% mais forte e enche a furia.
- v184: evento Arca do Tesouro (cerca de 1 a cada 5 rodadas, a partir da 3a): o grupo vota abrir ou ignorar; pode dar 4 a 8 moedas, uma pocao ou ser armadilha (-12 HP em todos).
- v185: mercador com memoria: apos 3 compras (desde que ele fechou a loja pela ultima vez) da 15% de desconto em tudo, e passa a comentar o que voce ja comprou (defesa, cura, ataque, utilidade).
- v186: relatorio no fim da partida: rodadas, acertos e erros por rank (C a SS), aproveitamento, moedas ganhas/gastas, itens usados e (na derrota) vida restante do boss.
- v187: banco de perguntas editavel: editor.html (adicionar, editar, apagar, filtrar por rank, importar/exportar JSON e CSV, salvar neste aparelho). O jogo le: salvo no aparelho, depois perguntas.json, depois as embutidas. Link na tela inicial.
- v188: bau novo em pixel art detalhado (madeira gasta, ferro rebitado) que abre, mostra o tesouro e fecha; se ignorado treme, pisca e vira poeira. Vitoria/derrota, relatorio e escolha de alvo de item agora aparecem no papiro.
- v188: bau em pixel art com quadros (abre, fecha, some em poeira); rodada de bau sem pergunta (voto abrir/ignorar: item da loja ou armadilha de 18 HP so para quem abriu); vitoria, derrota, relatorio, menus de habilidade e escolha de alvo agora no papiro; botoes e placas em pixel art (btn_*.png).
- v189: icones pequenos dos efeitos de item ativos (com duracao) embaixo da barra de cada heroi e selo FASE 2 ao lado da barra do boss.
- v191: barra de vida/mana de cada heroi na sua propria altura (acima da pose mais alta dele); icones de efeito de item bem menores, entre a barra e a cabeca; texto de status acima da barra.
- v192: faixa entre barra e cabeca reduzida ao minimo (34px do grid) sem cobrir os icones.
- v193: na selecao de classe, o titulo e o botao ESCOLHA UMA CLASSE ficam por cima das nuvens (camada propria; some na transicao).
- v194: so as duas caixas do topo (titulo e descricao) ficam acima das nuvens, recortadas em PNG (plaque_cut.png); o botao voltou a ficar sob as nuvens.
- v195: volta ao modo da v193 (titulo + botao acima das nuvens) e inclui as bandeiras laterais.
- v196-198: painel e botao ENTRAR em pixel art (enter_*.png); botao ESCOLHA UMA CLASSE em pixel art (pick_btn_*.png); removidos os botoes A/B desenhados na arte da selecao; painel do boss fica sob as nuvens e some ao sair do mapa (e cancela a entrada pendente).
- v199: painel de entrada no boss menor (72vw, max 336px) e de novo acima das nuvens.
- v200: painel de entrada no boss subiu ~66px.
- v202: painel do boss ancorado ao fim do mapa (nao depende da altura da tela/barra do navegador).
- v201 (inclui o cartao de descricao do item, antes v190): loja: tocar no icone do item abre um cartao de descricao em pixel art (nome, categoria, efeito, afinidade, preco); tocar nas moedas tenta comprar.

## Trava de seguranca de layout (v203)
Antes de publicar qualquer mudanca de interface rode: `python3 tools/layout_check.py --shots pasta` (leva ~1 min).
Ele abre selecao, mapa e batalha em 7 formatos de celular + tablet e confere que (1) tudo que fica dentro do quadro 2:3 tem a mesma posicao relativa em qualquer celular, (2) o painel do boss e os botoes de canto nunca saem da tela nem se sobrepoem, (3) nao ha rolagem horizontal, (4) o quadro da batalha fica colado ao topo e ocupa a largura toda. Ele compara os celulares entre si, entao detecta o que MUDA de um aparelho para outro (nao uma mudanca igual em todos). Regra: elementos novos devem ser posicionados em % do quadro (ou ancorados ao quadro por JS), nunca em `bottom`/`vh` da janela.
- v203: `100vh` -> `100dvh` no quadro da batalha em telas largas; trava de seguranca adicionada.
- v204: conteudo do papiro (relatorio, escolha de alvo, menus) se ajusta ao tamanho do papiro: modo compacto + reducao proporcional em celulares curtos (360x640); trava de layout passa a testar isso.
- v205: telas largas/curtas (tablet, celular curto) mantem o jogo no formato de celular com bordas pretas nas laterais e papiro (quadro = min(largura, (altura-140px)/1,5)); papiro com margem clara em volta do conteudo; papiro do celular curto (360x640) passou de 159 para 195px.
- v206: menu de habilidades nunca mais no papiro; so na interface propria de habilidades (arte).
- v207: abertura do boss cobre a tela desde o primeiro quadro (antes o jogo e os icones da mochila/mercador apareciam por um instante); afinidades redefinidas por papel: Maga (Ampulheta, Pergaminho Arcano, Elixir, Amuleto, Bomba de Fumaca), Guerreiro (Lente do Cacador, Tonico de Furia, Lamina Afiada, Dado do Destino, Elmo), Tanque (Escudo de Ferro, Elmo, Amuleto, Polvora Negra), Cleriga (Erva Curativa, Elixir, Bomba de Luz, Pena de Fenix, Moeda da Sorte); removidas do cache offline 4 imagens inexistentes; novo `tools/check_assets.py` (rode junto com `tools/layout_check.py`).
- v208: escolha de alvo (Luz Sagrada, Protecao Especifica, Passar a Vez) refeita na moldura de pixel-art do menu de elementos, com o retrato de cada heroi (`menu_target.png`, `tp_*.png`, `tools/make_target.py`); botoes e caixas simples (GRUPOS, TROCAR DE GRUPO, REINICIAR, ATUALIZAR, EDITOR, SIM/NAO do mercador, aviso, fim de jogo, confirmar reinicio, pular abertura) agora em pixel-art (`ui_box/ui_chip*.png`, `tools/make_ui.py`); corrigido travamento quando a Maga simulada ficava sem mana com a esquiva em recarga; texto de reviver usa o valor real (35).
- v209: Ataque Sagrado (2x) e Defesa Sagrada (corta 80%) da Claeriga so valem pela fraqueza do boss a sagrado (`BOSS.weak`); contra boss sem essa fraqueza ficam normais. Itens mais raros ficaram mais fortes: Dado (4 ataques de 1x a 3x), Pena de Fenix (100 de HP + 20 aos aliados), Lamina Afiada (agora rara, +10), Pergaminho Arcano (ultimate + 60 HP + 80 mana + 25% de dano); Elixir enfraquecido (30/30). Texto do menu da Claeriga atualizado. Simulacao no motor real do jogo (500 partidas por item): raros +12 a +22 pontos de vitoria, comuns +3 a +11.
- v211: Revisao de texto centralizado e folga nas bordas: botoes pequenos em moldura pixel-art (Grupos, Atualizar, Editor, Trocar de grupo, Reiniciar, Modo teste, Pular) ganharam mais respiro lateral; titulos e rotulo de tipo dos menus de habilidade nao ultrapassam mais a caixa em nenhum tamanho de tela.
- v211: texto do papiro (mensagens como "Tempo esgotado") agora proporcional a largura da faixa, nao da janela: antes encostava nas bordas em desktop e telas estreitas. Botoes JOGAR DE NOVO / VOLTAR AO MAPA com mais folga. Chips do seletor de alvo (Luz Sagrada / Protecao Especifica) com texto centralizado na caixa.
- v212: ataques do boss variados, sorteados a cada pergunta conforme o rank (C sempre normal; SS quase sempre demoníaco/elemental). FISICO normal (0,65x do dano, sem atributo), FISICO DEMONIACO (0,9x, vampirismo 8%) e ELEMENTAL (1,15x, sempre demoniaco, vampirismo 15%). Vampirismo: o boss recupera parte da vida que os herois realmente perdem (defesa, esquiva e itens reduzem o ganho); sobe +2% por heroi que errou, +1% por ponto de furia e +2% na fase 2; o dano demoniaco cresce +1% por ponto de furia; com a furia cheia o ataque e sempre elemental. Onda Sombria suga so 10% do normal. Chip de atributo dos menus mostra NORMAL quando nao e demoniaco. Simulacao no motor real (250 partidas por nivel de acerto do grupo): vitorias 7,6% / 34% / 77% / 95% com 50/60/70/80% de acertos (antes 13,6% / 42% / 75% / 98%); o boss recupera em media 30 a 7 de vida por partida.
- v213: atraso entre animacao e dano corrigido (especial da Maga e da Cleriga agora sincronizam por tempo fixo, sem esperar a leitura do aviso). Bau: aparece no chao a frente do boss, a tela escurece, o bau brilha em destaque e o tempo para (efeitos de paralisacao); ao se desfazer em po dourado o tempo volta ao normal. Textos: escudo elemental mostra o bonus do elemento (fogo, fraqueza do boss) e nao mais 'bonus sagrado'; revisados avisos de todos os herois; emojis removidos de avisos; menu do escudo com arte propria. Lobby/mapa: botoes e paineis somem suavemente antes das nuvens fecharem (ida e volta); os 4 paineis do mapa so aparecem destacados depois que as nuvens abrem. Chips de Tipo/Atributo refeitos em pixel art (moldura 9-slice azul/roxa/cinza + icones 9x9) nos 5 menus, na pergunta e nos cards.
- v214: relogio (ampulheta + tempo) refeito como chip pixel art proprio, com folga fixa entre borda, icone e numero, cobrindo o da arte em todos os menus de habilidades, seletor de alvo/elementos e painel de pergunta. Chips Tipo/Atributo do painel de pergunta refeitos em pixel art (icone + rotulo + valor), e nos menus os dois chips ficam na mesma altura, sem encostar no relogio. Icone do atributo (bolinha/chama/losango) centralizado na mesma altura da palavra. 'SEM EFEITO'/'BOSS IMUNE' do seletor de elementos agora sao chips de codigo identicos nos 3 cards (antes eram da arte, desalinhados e com borda falhando). Molduras compactas 12x8 (ui_cs_*.png, borda de 2 px). Fonte pixel propria so para C/Ç/c/ç (fonts/openc*.woff2, tools/make_openc.py) com abertura bem visivel, usada antes de Pixelify Sans/monospace em todas as telas.
- v215: especial da Maga: cada dano entra junto do seu estouro do buraco negro (1,5x no 1o e 2,5x no 2o), disparado pelos proprios eventos da animacao (antes o 2o dano esperava o tempo de leitura do aviso). Itens zerados a cada partida contra o boss. Marca de queimadura so com o icone de fogo, abaixo do comeco da barra de furia; rotulo FURIA refeito (pixel, contorno e chama); FASE 2 abaixo do fim da barra (nao cobre mais o 5o segmento). Personagens que caem ficam cinza quando a queda termina (a aura de Provocacao do tanque nao segura mais a cor). Rank da pergunta afastado do texto. Chips vermelhos (SEM EFEITO, BOSS IMUNE, RECARGA, SEM MANA) com o mesmo visual pixel e texto sempre dentro da borda; o da arte e coberto por inteiro. Digitos 0-9 em fonte pixel propria (fonts/opend.woff2) onde o 2 e o 5 da Pixelify Sans lembravam S.
- v216: seletor de alvo: icone do painel de informacao trocado de seta para 'i' (nao e botao de voltar); 'Passar a Vez' mostra o chip 1,5x em todos os aliados de pe; chips CAIDO/VOCE/1,5x em pixel art e sem ficarem escurecidos pelo card apagado. Itens que dao para escolher heroi: todos os herois aparecem, os que nao podem receber ficam apagados com CAIDO/VIVO. Seletor de elementos: o card de Fogo tambem vira chips (BOSS FRACO + 1,5x QUEIMA / CORTA 55%) iguais aos SEM EFEITO/BOSS IMUNE. Placa FURIA maior, a esquerda da barra (barra mais curta e mais alta), com moldura pixel e texto centralizado dentro; marca de fogo abaixo do comeco da barra e FASE 2 abaixo do fim.
- v217: barra inferior do seletor de heroi (Passar a Vez, Protecao, Luz Sagrada) virou botao VOLTAR em pixel art com seta para a esquerda, que volta ao menu de habilidades; o aviso explicativo agora aparece no papiro em vez de dentro da barra.
- v218: relogio unico por vez: ao escolher Passar a Vez, Protecao ou Luz Sagrada, o seletor de alvo continua o mesmo tempo do menu de habilidades (antes recomecava em 24s); ao voltar tambem segue o mesmo relogio.
- v219: dois itens LENDARIOS novos (tempo extra na pergunta): Relogio de Bolso (+5s, 30 moedas) e Relogio Grande (+10s, 50 moedas), icones em pixel art (tools/make_items.py). So valem durante a pergunta e so no proprio grupo (nao podem ser dados a aliados); o +Ns aparece animado dentro da caixa do cronometro. Raridade bem acima dos raros: 2,5% por reposicao da prateleira (raros: 12%) e 2% na arca (raros: 10%). Conferido: o seletor de item nao tem cronometro, entao nao havia relogio duplicado.
- v220: segurar o dedo num item da mochila abre a mesma ficha do Mercador (nome, categoria, raridade, descricao, afinidade e quantidade); toque rapido continua usando. Item vindo da arca nao aparece mais no papiro: ele surge num clarao, flutua brilhando, voa em arco ate o botao da mochila e estoura em faiscas (so entao aparece no slot). Usar o relogio tambem nao escreve mais no papiro (so a animacao +Ns).
- v221: CAPA do jogo (cover.html) antes da selecao de classe, uma vez por sessao: arte animada (fogo da cidade, fumaca, brasas, olhos dos seis senhores, brilho na espada do Lorde, orbes dos cajados, bandeiras, raios, eclipse, reflexo no titulo), botoes JOGAR e COMO JOGAR em pixel art, painel Como jogar com 6 paginas, mensagens rotativas. JOGAR faz zoom nos herois, a cena se desfaz em pixels e a selecao se reconstrói (rebuild.js). Sem audio.
- v222: selecao de classe sem os botoes ATUALIZAR, MODO TESTE e EDITOR DE PERGUNTAS (agora o editor e o ATUALIZAR (com a versao) ficam nos cantos da capa; a versao vive em cover.js). Capa: parte de baixo translucida mostrando o cenario (rochas e brasas redesenhadas sem os botoes pintados na arte). Transicao refeita: zoom nos herois com vinheta e clarao dourado, a cena vira cinzas de pixel que sobem ao vento, e a selecao se reconstroi de baixo para cima com brasas na frente da onda.
- v223: nova transicao do JOGAR em livro (padrao): a capa, com o cenario vivo, e a pagina de um livro que gira sobre a lombada e revela a pagina 'CAPITULO I - A ESCOLHA', que se dissolve em seguida revelando a selecao de classe. A transicao de cinzas continua disponivel abrindo cover.html?trans=ash.
- v224: a transicao padrao do JOGAR voltou a ser a de cinzas (v222); o livro fica em cover.html?trans=book.
- v225: limpeza de codigo: transicao do livro removida; sem uso foram retirados 7 arquivos de imagem (bag_panel, icon_attack, icon_tipo_sword, plaque_cut, ui_chip_green/grey/purple), os estilos .tp-note e .test-toggle, 15 sprites de icone nao usados, HERO_ICON e o atalho de depuracao da capa.
- v226: transicao capa -> selecao sem esticar o menu e sem perder as nuvens (removida a animacao de escala em #stage); botao voltar do celular na selecao faz os blocos de brasa cobrirem a tela e a capa se reconstroi, sem zoom.
- v227: botao do mapa (azul/verde) ganha selecao: borda dourada e icone maior ao tocar; tocar de novo desfaz.
- v228: Como jogar refeito: aba GUARDIOES com 6 guardioes (so o Lorde liberado, com fraquezas fogo e sagrado, imunidades, ataques, habilidades, furia e fase 2; os outros bloqueados); dicas reescritas; textos de habilidades e da capa deixam de generalizar a fraqueza do Lorde para todos os inimigos.
- v229: Maga refeita com as novas poses e efeitos (mage4/): 48 poses na escala correta (ajuste de cabeca/corpo por pose), hurt/queda/chao proprios, esquiva espelhada, idles novos e efeitos de fogo/agua/ar/terra/Buraco Negro das novas folhas. mage3 mantida ate a aprovacao.
- v230: Maga com borda fina azul-marinho (tools/outline_maga4.py) cobrindo a linha branca do recorte.
