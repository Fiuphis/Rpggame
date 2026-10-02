# Banco de Dados I — RPG (PWA)

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

## Rodar localmente
```
python -m http.server 8000
```
Abra http://localhost:8000

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e suba **o conteúdo desta pasta na raiz** (o `index.html` precisa ficar na raiz do repositório).
2. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
3. Em ~1 minuto o jogo fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Todos os caminhos são relativos (`./`), então funciona no subcaminho do GitHub Pages. O arquivo `.nojekyll` evita processamento do Jekyll.

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
