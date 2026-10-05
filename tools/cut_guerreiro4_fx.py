#!/usr/bin/env python3
"""Recorta os efeitos do Guerreiro (folhas F1-F3, fundo PRETO) -> guerreiro4/fx_*.png: brilho vira transparencia (uso aditivo).
Uso: cut_guerreiro4_fx.py PASTA_FOLHAS [PASTA_SAIDA=guerreiro4]. Cortes que apontam para a esquerda sao espelhados (ponta/convexo para a direita = sentido do voo)."""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'guerreiro4'
# nome: (folha, indice, largura alvo, espelhar, modo)
FX = {'sl1':('F1',1,360,0),'sl2':('F1',2,300,0),'sl3':('F1',3,340,1),'sl4':('F1',4,380,0),'sl5':('F1',5,300,0),'sl6':('F1',6,220,1),'sl7':('F1',7,320,1),'spk':('F1',8,300,0),
 'bur':('F2',1,360,0),'rng':('F2',2,420,0),'dust':('F2',3,420,0,'solid'),'crk':('F2',4,440,0),'fls':('F2',5,300,0),'dome':('F2',6,300,0),'str':('F2',7,360,0),'rn2':('F2',8,420,0),
 'rcol':('F3',1,220,0),'rbase':('F3',2,400,0),'rbolt':('F3',3,340,0),'rring':('F3',4,420,0),'rspk':('F3',5,320,0),'rsl':('F3',6,340,1),'rsmk':('F3',7,260,0),'rfl':('F3',8,300,0)}
def comps(path):                                              # grade fixa 4x2 (os efeitos ficam centrados nas celulas, com folga)
    a = np.array(Image.open(path).convert('RGB')); h, w = a.shape[:2]
    return a, [(c * w // 4, r * h // 2, (c + 1) * w // 4, (r + 1) * h // 2) for r in range(2) for c in range(4)]
cache = {}; os.makedirs(OUT, exist_ok=True)
mp = os.path.join(OUT, 'meta.json'); meta = json.load(open(mp)) if os.path.exists(mp) else {'poses': {}}; meta['fx'] = {}
for n, (sh, idx, tw, mir, *mo) in FX.items():
    mode = mo[0] if mo else 'add'
    if sh not in cache: cache[sh] = comps(f'{SRC}/{sh}.png'); print(sh, len(cache[sh][1]))
    a, boxes = cache[sh]; x0, y0, x1, y1 = boxes[idx - 1]; c = a[y0:y1, x0:x1].astype(np.float32)
    if mode == 'solid':
        mk = ndi.binary_fill_holes(ndi.binary_closing(c.max(2) > 26, iterations=3)); al = ndi.gaussian_filter(mk.astype(np.float32), .7); col = c
    else:
        al = np.clip((c.max(2) - 18) / 70, 0, 1) ** .8; col = np.clip(c * (1 / np.maximum(al[..., None], .25)), 0, 255)
    im = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8)); im = im.crop(im.getbbox())
    if mir: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    f = tw / im.width; im = im.resize((tw, max(1, round(im.height * f))), Image.LANCZOS); im.save(f'{OUT}/fx_{n}.png'); meta['fx'][n] = {'w': im.width, 'h': im.height}
json.dump(meta, open(mp, 'w')); print('fx', len(FX))
