# Crônicas do Saber — Banco de Dados I (RPG de perguntas)

Jogo de RPG para celular em que turmas respondem perguntas de **Banco de Dados** para derrotar chefes. Quatro classes (Maga, Guerreiro, Tanque, Clériga), até 7 jogadores por classe, até 28 por sala. Funciona como site estático (GitHub Pages / PWA) e usa o **Supabase** só para salas, contas, saves e partida online.

- Tela inicial: `cover.html` (o app abre pelo `shell.html`, que o coloca em tela cheia).
- Histórico de versões: [docs/CHANGELOG.md](docs/CHANGELOG.md). Banco de dados: [supabase/README.md](supabase/README.md). Animações: [docs/ANIMACOES.md](docs/ANIMACOES.md).

## Mapa das pastas

```
raiz/                 páginas (.html) e arquivos que precisam ficar na raiz
  shell.html            moldura: carrega a página atual num iframe e cuida da tela cheia
  cover.html            capa (JOGAR, SAVES, PERFIL, como jogar)
  salas.html            lista/criação de salas, entrada por código, sala de espera
  index.html            seleção de classe (lobby de grupos)
  map.html              Jornada dos Heróis (mapa; escolhe o próximo chefe)
  game.html             a batalha
  relatorio.html        relatório final da partida
  saves.html            saves + perfil (janela dentro da capa)
  conta.html            entrar / criar conta / trocar senha
  editor.html           editor de perguntas (só a conta fiuphis)
  intro_malg.html, intro_ice.html   pré-visualização das aberturas dos chefes
  sw.js                 service worker (cache offline); precisa ficar na raiz
  manifest.webmanifest  dados do PWA
js/
  core/                 peças comuns: tela cheia, transições, efeitos, frases
  online/               tudo que fala com o servidor
  game/                 a batalha: regras, cenário, chefes, aberturas, HUD
  characters/           animação e habilidades de cada herói
  pages/                um arquivo por tela (cover, salas, saves, conta, map, relatorio, lobby)
  vendor/               biblioteca de terceiros (supabase.js)
css/                    um .css por tela (style.css é o da batalha)
data/                   perguntas.json, hud_meta.json, select_assets.json, anim_manifest.json
assets/
  characters/           sprites dos heróis (mage, guerreiro, tank, cleriga), poses e efeitos
  bosses/               lorde (Malgorath) e hrimgar (Rei Gelado)
  map/ fog/ intro/ salas/ skel/   arte do mapa, nuvens, aberturas, ícones das salas, esqueleto
  backgrounds/          fundos da batalha, capa e placa de seleção
  class-select/         retratos e painéis da seleção de classe e do menu de alvo
  hud/ items/ sprites/ ui/        molduras do HUD, itens/poções/baú, sprites parados, botões e painéis
  fonts/                fontes
supabase/               banco de dados (migrations/, local/) e seu README
tools/                  scripts para gerar/recortar a arte (Python) e o servidor local de teste (localsrv/)
docs/                   CHANGELOG.md, ANIMACOES.md
```

## Como o jogo flui

```
cover -> JOGAR -> salas -> (criar/entrar na sala) -> sala de espera -> index (escolher classe)
      -> map (escolher chefe) -> game (batalha) -> relatorio -> map ...
cover -> JOGAR SEM SALA (salas) -> index -> map -> game        (modo solo, sem servidor)
cover -> SAVES / PERFIL / conta                                  (janela sobre a capa)
```

Voltar: `salas -> cover`, `index -> salas`, `map -> index`, `relatorio -> map`, `editor -> cover`; na batalha o botão GRUPOS sai da partida. O botão voltar do aparelho segue o mesmo grafo e fecha janelas abertas antes de sair da tela.

Transições entre telas (cada saída tem a entrada correspondente):
- **Portões** (`js/core/gate.js`): salas <-> index, salas -> jogo (partida em andamento), jogo -> relatório, relatório -> map/index. As portas fecham na tela que sai e abrem na que chega; a bandeira `bd1_gate` no `sessionStorage` liga o par.
- **Nuvens** (`js/core/fog.js`): index <-> map e map -> jogo.
- **Blocos de brasa** (`js/core/rebuild.js`, `PxT`): capa <-> salas/saves/conta.
- Sair do editor de perguntas não tem transição (de propósito).

## Como cada parte funciona

**Online (`js/online/`)**
- `net.js`: cliente do Supabase. Login anônimo, contas (nome + senha), `rpc()` para as funções do banco. Sem servidor, ou com `?mock=1`, usa uma camada simulada.
- `match.js`: chamadas da partida e acompanhamento do estado da sala (`MATCH.watch`, consulta a cada 1,5 s; 3 s com a aba escondida).
- `online.js`: partida em *lockstep*. O servidor decide as entradas de cada rodada (pergunta, acertos, ações, itens, semente) e cada aparelho roda o mesmo combate.

**Batalha (`js/game/`)**
- `app.js`: o núcleo: regras de rodada (pergunta -> votação -> ações dos heróis -> boss), dano, fúria, Mercador, inventário, HUD. Números de balanceamento no topo: `BOSS_MAX_HP`, `HERO_MAX_HP`, `DIFFICULTY`, `SKILLS`.
- `stage.js`: qual chefe/fase está ativa (`?boss=N` ou `bd1_boss`): nomes, fraquezas, cenário.
- `boss.js` (Malgorath) e `hrimgar.js` (Rei Gelado): poses, golpes e efeitos de cada chefe.
- `intro*.js`, `cine.js`: aberturas e revelação do chefe. `ambient*.js`: cenário vivo (fogo, neve, neblina).
- `anim.js`: toca sprite sheets conforme `data/anim_manifest.json`. `extras.js`: efeitos extras dos heróis. `hud.js`, `menu_meta.js`: HUD e posições do menu.

**Heróis (`js/characters/`)**: `mage.js`, `guerreiro.js`, `tank.js`, `cleric.js`; cada um carrega as poses de `assets/characters/<classe>/` e implementa as habilidades.

**Telas (`js/pages/`)**: `cover.js` (capa e transição do JOGAR), `salas.js` (salas), `lobby.js` (grupos da seleção de classe), `map.js` e `mapfx.js` (mapa e água viva), `relatorio.js`, `saves.js`/`savesui.js` (saves), `conta.js` (conta).

**Comuns (`js/core/`)**: `fs.js` (tela cheia, teclado virtual, bloqueios de gesto), `gate.js`, `fog.js`, `rebuild.js` (transições), `pxfx.js` e `fxsoft.js` (efeitos), `paper.js` (papiro do rodapé), `quotes.js` (frases do mapa).

**Perguntas**: `data/perguntas.json` é a cópia de referência; nas salas online valem as do servidor (tabela `questions`). Edição: `editor.html`, só para a conta `fiuphis` (a checagem é no servidor).

**Saves e progresso**: guardados no aparelho (`localStorage`) e, com conta, copiados para a tabela `saves` (até 4 por conta). Cada save pode ser exportado/importado como código.

**Regras de sala** (impostas pelo banco): 3 salas por criador, 7 jogadores por classe, 28 por sala, presença ativa de 45 s, partida abandonada por 3 h é encerrada.

## Rodar e testar

Site: basta servir a raiz como estático (GitHub Pages usa a raiz; `.nojekyll` desliga o Jekyll). Abra `shell.html` (ou `cover.html?noshell` para ver a página sozinha).

Servidor local com banco de teste (mesmas funções SQL do Supabase, em memória):
```
cd tools/localsrv && npm install && node server.mjs 8787
# abrir: http://localhost:8787/shell.html#cover.html?sb=http://localhost:8787
node test_sql.mjs        # testes das funções SQL (salas, limites, partida)
```
Parâmetros úteis na URL: `?mock=1` (rede simulada), `?sb=<url local>` (aponta para o servidor de teste; só aceita localhost), `?teste=1` (modo de teste do jogo), `?noshell` (sem moldura), `?nocover`.

## Ao publicar uma versão
1. Aumentar `CACHE` em `sw.js` (ex.: `bd1-rpg-v310`) e `V` em `js/pages/cover.js`.
2. Se criou arquivo que deve funcionar offline, incluí-lo na lista `ASSETS` de `sw.js`.
3. Registrar a mudança em `docs/CHANGELOG.md`.
4. Commit direto na `main` (o GitHub Pages publica sozinho).

## Convenções
- Textos do jogo em português, sem emojis.
- Pastas de arte por assunto; um `.js` por tela em `js/pages/`. Caminhos de arte sempre a partir da raiz (`assets/...`), porque o código roda dentro das páginas da raiz; só os `.css` usam `../assets/...`.
- Scripts em `tools/` geram a arte a partir de folhas-fonte e escrevem direto em `assets/`; não são necessários para rodar o jogo.
