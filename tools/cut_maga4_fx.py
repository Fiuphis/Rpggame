#!/usr/bin/env python3
"""Recorta os efeitos (folhas de fundo PRETO) da Maga -> assets/characters/mage/fx_*.png (v229). Brilho vira transparencia (efeitos aditivos);
os de terra (add:false no jogo) usam mascara dura. Uso: python3 tools/cut_maga4_fx.py PASTA_FOLHAS [PASTA_SAIDA=mage4]"""
import numpy as np, json, sys, os
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'assets/characters/mage'
# nome: (folha, indice, tamanho alvo (maior lado, px), modo 'add'|'solid', rotacao antihoraria em graus)
FX = {
 'orbb':('ME1',1,120,'add',0), 'orb_red':('ME1',2,190,'add',0), 'orb_blue':('ME1',3,130,'add',0), 'whirl':('ME1',4,244,'add',0), 'orb_orange':('ME1',5,170,'add',0),
 'comet':('ME1',6,300,'add',-90),
 'cross':('ME2',1,200,'add',0), 'fire_burst':('ME2',2,230,'add',0), 'water_burst':('ME2',3,230,'add',0), 'air_burst':('ME2',4,230,'add',0), 'rocks':('ME2',5,351,'solid',0), 'star_big':('ME2',6,205,'add',0),
 'sh_mana':('ME3',1,330,'add',0), 'sh_fire':('ME3',2,330,'add',0), 'sh_water':('ME3',3,330,'add',0), 'sh_air':('ME3',4,330,'add',0), 'sh_earth':('ME3',5,330,'add',0), 'ring_floor':('ME3',6,300,'add',0),
 'bh_seed':('ME4',1,110,'add',0), 'bh_small':('ME4',2,300,'add',0), 'bh_big':('ME4',3,400,'add',0), 'bh_big2':('ME4',4,400,'add',0), 'bh_spikes':('ME4',5,380,'add',0), 'bh_smoke':('ME4',6,360,'add',0),
 'fire_fall':('ME5',1,349,'add',37), 'water_pillar':('ME5',2,353,'add',0), 'earth_spikes':('ME5',3,324,'solid',0), 'air_swirl':('ME5',4,347,'add',0), 'bolt':('ME5',5,230,'add',0), 'mana_aura':('ME5',6,274,'add',0),
 'crystal':('ME5',2,189,'add',0), 'rock':('ME1',5,120,'solid',0),
}
def comps(path):
    a = np.array(Image.open(path).convert('RGB')); m = a.max(2) > 40
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=9)); out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        if (lab[s] == i + 1).sum() > 6500: out.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
    cy = sorted(out, key=lambda b: (b[1] + b[3]) / 2); rows = [[cy[0]]]
    for b in cy[1:]:
        if (b[1] + b[3]) / 2 - np.mean([(r[1] + r[3]) / 2 for r in rows[-1]]) > 150: rows.append([b])
        else: rows[-1].append(b)
    return a, [b for r in rows for b in sorted(r, key=lambda b: b[0])]
cache = {}; meta = json.load(open(f'{OUT}/meta.json')); meta['fx'] = {}
for name, (sheet, idx, target, mode, rot) in FX.items():
    if sheet not in cache: cache[sheet] = comps(f'{SRC}/{sheet}.png')
    a, boxes = cache[sheet]; x0, y0, x1, y1 = boxes[idx - 1]; c = a[y0:y1, x0:x1].astype(np.float32)
    mx = c.max(2)
    if mode == 'add':
        al = np.clip((mx / 255.) ** .75 * 1.25, 0, 1); col = np.clip(c / np.maximum(mx[..., None], 1) * 255 * np.minimum(1, mx[..., None] / 60 + .55), 0, 255)
        col = np.where(mx[..., None] > 12, c / np.maximum(mx[..., None] / 255., .06), 0).clip(0, 255)
        al[mx < 14] = 0
    else:
        m = ndi.binary_fill_holes(ndi.binary_closing(mx > 16, iterations=2)); al = ndi.gaussian_filter(m.astype(np.float32), .7); al[mx < 6] *= .0; al = np.clip(al * 1.2, 0, 1); col = c
    im = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA')
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    bb = im.getbbox(); im = im.crop(bb); k = target / max(im.size); im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    im.save(f'{OUT}/fx_{name}.png'); meta['fx'][name] = {'w': im.width, 'h': im.height}
# fagulha pequena (4 pontas) gerada por codigo
N = 64; yy, xx = np.mgrid[:N, :N].astype(float); dx, dy = xx - 31.5, yy - 31.5
v = np.clip(1 - (np.abs(dx) / 30 + np.abs(dy) * 4 / 30), 0, 1) ** 1.6 + np.clip(1 - (np.abs(dy) / 30 + np.abs(dx) * 4 / 30), 0, 1) ** 1.6 + np.clip(1 - np.hypot(dx, dy) / 7, 0, 1)
v = np.clip(v, 0, 1); rgb = np.dstack([180 + 75 * v, 215 + 40 * v, np.full_like(v, 255)])
Image.fromarray(np.dstack([rgb, v * 255]).astype(np.uint8), 'RGBA').save(f'{OUT}/fx_star_small.png'); meta['fx']['star_small'] = {'w': N, 'h': N}
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print(len(meta['fx']), 'efeitos')
