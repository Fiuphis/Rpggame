#!/usr/bin/env python3
"""Recorta os efeitos do Tanque (folhas de fundo PRETO) -> tank4/fx_*.png: brilho vira transparencia (uso aditivo). Uso: cut_tank4_fx.py PASTA_FOLHAS [PASTA_SAIDA=tank4]
E1: ondas de choque (3 douradas + 3 azuis), espelhadas para a ponta apontar para a direita (sentido do voo)."""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'tank4'
# nome: (folha, indice, largura alvo, espelhar)
FX = {'tsh1':('E3',1,250,0,'add'),'tsh2':('E3',2,250,0,'add'),'tsh3':('E3',3,300,0,'add'),'tsh4':('E3',4,250,0,'add'),'tsh5':('E3',5,250,0,'add'),'tsh6':('E3',6,260,0,'add'),
 'tbur':('E2',1,420,0,'solid'),'tspk':('E2',2,420,0,'solid'),'tdust':('E2',3,460,0,'solid'),'tcrk':('E2',4,440,0,'solid'),'tstar':('E2',5,380,0,'add'),'trocks':('E2',6,420,0,'solid'),
 'wg1':('E1',1,300,1),'wg2':('E1',2,300,1),'wg3':('E1',3,300,1),'wb1':('E1',4,300,1),'wb2':('E1',5,300,1),'wb3':('E1',6,300,1)}
GRID = {'E3'}                                            # folhas onde as pecas se encostam: recorta pela grade 3x2
def comps(path):
    if os.path.basename(path)[:-4] in GRID:
        a = np.array(Image.open(path).convert('RGB')); h, w = a.shape[:2]
        return a, [(c * w // 3, r * h // 2, (c + 1) * w // 3, (r + 1) * h // 2) for r in range(2) for c in range(3)]
    a = np.array(Image.open(path).convert('RGB')); m = a.max(2) > 40
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=9)); out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        if (lab[s] == i + 1).sum() > 30000: out.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
    cy = sorted(out, key=lambda b: (b[1] + b[3]) / 2); rows = [[cy[0]]]
    for b in cy[1:]:
        if (b[1] + b[3]) / 2 - np.mean([(r[1] + r[3]) / 2 for r in rows[-1]]) > 150: rows.append([b])
        else: rows[-1].append(b)
    return a, [b for r in rows for b in sorted(r, key=lambda b: b[0])]
cache = {}; os.makedirs(OUT, exist_ok=True)
mp = os.path.join(OUT, 'meta.json'); meta = json.load(open(mp)) if os.path.exists(mp) else {'poses': {}}; meta.setdefault('fx', {})
for n, (sh, idx, tw, mir, *mo) in FX.items():
    mode = mo[0] if mo else 'add'
    if sh not in cache: cache[sh] = comps(f'{SRC}/{sh}.png')
    a, boxes = cache[sh]; x0, y0, x1, y1 = boxes[idx - 1]; c = a[y0:y1, x0:x1].astype(np.float32)
    if mode == 'solid':                                   # pedras/terra escuras: mascara dura (o brilho nao serve de transparencia)
        mk = ndi.binary_fill_holes(ndi.binary_closing(c.max(2) > 26, iterations=3)); al = ndi.gaussian_filter(mk.astype(np.float32), .7); col = c
    else:
        al = np.clip((c.max(2) - 18) / 70, 0, 1); al = al ** .8; col = None
    if col is None: col = np.clip(c * (1 / np.maximum(al[..., None], .25)), 0, 255)
    im = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8)); bb = im.getbbox(); im = im.crop(bb)
    if mir: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    f = tw / im.width; im = im.resize((tw, max(1, round(im.height * f))), Image.LANCZOS); im.save(f'{OUT}/fx_{n}.png'); meta['fx'][n] = {'w': im.width, 'h': im.height}
json.dump(meta, open(mp, 'w')); print('fx', len(FX))
