# Animações por sprite sheet

O jogo toca **quadros desenhados por você** (Aseprite, etc.). Sem sheet, o personagem fica parado (`spr_*.webp`). Nada é animado por código.

## Como fazer, por personagem
1. Abra `gabaritos/<personagem>_gabarito.png` no Aseprite (cada quadro precisa ter **exatamente** o tamanho da célula):

| Personagem | `<personagem>` / id no manifest | Célula (px) |
|---|---|---|
| Maga | `maga` / `mage` | 329 × 404 |
| Guerreiro | `guerreiro` / `knight` | 330 × 382 |
| Tanque | `tanque` / `tank` | 364 × 384 |
| Clériga | `cleriga` / `assassin` | 316 × 402 |
| Lorde das Trevas | `boss` / `boss` | 968 × 709 |

   - Amarelo = limite da célula · ciano = onde o sprite fica parado · vermelho = linha dos pés · branco = centro.
   - `<personagem>_base.png` é o sprite atual já na célula: use como quadro 1 e desenhe os demais por cima.
2. Exporte cada quadro como PNG (fundo transparente) em uma pasta, nomeados em ordem (`maga_melee_01.png`, `_02`...).
3. Monte a folha: `python3 tools/montar_sheet.py <pasta> mage melee 12` → gera `anim/mage_melee.png` e imprime a linha para colar em `anim/manifest.json`.
4. Suba a pasta `anim/` inteira. O jogo carrega sozinho (cache atualiza em segundo plano).

## Nomes das animações
Heróis (`heroes.<id>.<nome>`): 
- `idle` — **até 3 variações** (lista); sorteadas enquanto parado (8–16 quadros, 8–10 fps, em loop curto).
- `melee` (ataque físico) · `heavy` (golpe forte/ultimate físico; se faltar usa `melee`) · `cast` (magia; se faltar usa `melee`) · `holy` (cura/ataque sagrado; se faltar usa `cast`).
- `guard` (defesa) · `dodge` (esquiva) · `hurt` (levou dano) · `pass` (passa a vez) · `ult` (ultimate) · `victory`.
- `death` (cai e **fica no último quadro**) · `revive` (levanta).

Boss: `idle`, `attack`, `aoe` (Onda Sombria), `enrage`, `hurt`, `die`, `laugh`. 
*Atenção:* o boss está desenhado dentro do cenário. A folha dele é desenhada **por cima**, então o boss precisa cobrir a silhueta atual (ou eu preciso de um cenário sem o boss).

## Manifest (`anim/manifest.json`)
```json
{"pad":60,"heroes":{
  "mage":{
    "idle":[{"src":"anim/mage_idle1.png","frames":10,"fps":8},{"src":"anim/mage_idle2.png","frames":12,"fps":8}],
    "melee":{"src":"anim/mage_melee.png","frames":6,"fps":12}
  }
}}
```
`frames` = quantidade de quadros na folha (horizontal). Se a folha tiver várias linhas, informe `"cols"`.
Quanto mais quadros e fps mais fluido; a arte fica no seu nível porque é a sua arte. Sugestão: 6–8 quadros para ataques, 8–12 para idle.
