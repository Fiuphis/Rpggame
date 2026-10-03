# Banco de Dados I — RPG (Netlify / PWA)

Esta versão usa a arte original `game.png` como camada visual principal e coloca os controles por cima dela.

## Tela "Selecione sua classe" (novo design)
- `index.html` reproduz o design enviado (`select_bg.webp`): MAGO, GUERREIRO, TANQUE e CLÉRIGA, cada uma com grupo de até 7 jogadores;
- tocar numa classe seleciona: o card dá uma "saltada", fica mais claro e com borda colorida; tocar de novo desfaz a seleção (com outra saltada);
- a contagem "n/7" da classe escolhida sobe +1 em verde só na sua tela; só conta de verdade ao confirmar (botão "CONFIRMAR: CLASSE" no rodapé, sem botões A/B);
- classe com 7 jogadores fica escura com "7/7" em vermelho e não pode ser escolhida;
- internamente as chaves continuam `mage`, `knight`, `tank`, `assassin` (Guerreiro = antigo Cavaleiro, Clériga = antigo Assassino); a arte da batalha ainda é a antiga.

## Etapa 6 — Novo combate (regras e barras)
Rodada: pergunta → cada grupo vota na alternativa → rodada dos heróis (ataque básico, defesa ou esquiva) → resolução herói por herói.
- perguntas têm dificuldade (fácil/média/difícil); o dano do contra-ataque do boss vem de `DIFFICULTY` (10/20/35);
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
- depois da pergunta do boss, cada herói tem a vez (Mago → Cavaleiro → Tanque → Assassino), marcada por um anel dourado no chão;
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
- Boss imune a elementos: só o SAGRADO o afeta (`BOSS = {weak:['holy'], immune:[fogo,água,ar,terra]}` em app.js). Ataque elemental da Maga causa 0 (IMUNE) e não gera marcas/reações.
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
