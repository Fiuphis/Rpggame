# Animações (arte 2.0)

Toda a arte animada do jogo é pixel art em **sprite sheets** (faixas horizontais, um quadro ao lado do outro) com a duração de cada quadro.

## Heróis
- Folhas em `anim/<heroi>_<animacao>.png`, descritas em `data/anim_manifest.json` (`heroes.<id>`: `{src, frames, durs}` por animação, `_cell` = tamanho da célula, `_feet` = ponto dos pés na célula).
- Ids: `mage`, `guerreiro`, `tank`, `cleriga`. Animações: `idle` (lista de variações), `melee`, `heavy`, `cast`, `holy`, `guard`, `cover`, `dodge`, `hurt`, `pass`, `right`, `wrong`, `victory`, `ult`, `death`, `revive`.
- `js/game/anim.js` toca os quadros; sem folha carregada o herói fica vazio até ela chegar.

## Chefes
- **Malgorath:** `js/game/boss.js` desenha por quadros as folhas de `assets/bosses/lorde/anim/` (`manifest.json`: célula 320×256, pés em 160,250, escala 3). Ações: `idle`, `slashH`, `slashV`, `thrust`, `summon`, `aoe`, `enrage`, `phase2`, `prep`, `laugh`, `hurt`, `hurtLight`, `die`, `tpOut`, `tpIn`, `gagLook`, `gagDismiss` (+ `attack`, `tpBack`, `fireIn`, `gagCast`, `awaken` montadas a partir delas). Os efeitos disparam pelo índice do quadro; o fogo da espada e da mão é animado em código (fogo vivo).
- **Rei Gelado (Hrimgar):** ainda na arte anterior (`js/game/hrimgar.js`, `assets/bosses/hrimgar/`).

## Efeitos
- Pixel art do PixelLab (vfx_workbench) em `assets/fx/<nome>.png`, descritos em `data/vfx_manifest.json` (`{src, w, h, ax, ay, frames, durs}`).
- `js/game/vfx.js`: `VFX.play(nome, {x, y, scale, rot, loop, back, to})`. Camadas: `back` (z 2, atrás de chefe e heróis) e frente (z 7); as barras de vida/mana (z 8) ficam sempre por cima.

## Offline (service worker)
Todo arquivo novo usado pelo jogo entra em `ASSETS` no `sw.js`; depois rode `node tools/swrev.mjs` e suba a versão (`CACHE` no `sw.js` e `V` em `js/pages/cover.js`).
