#!/usr/bin/env python3
"""Recorta as folhas de fundo BRANCO da Maga (v229) -> assets/characters/mage/ (poses normalizadas + meta.json).
Uso: python3 tools/cut_maga4.py PASTA_FOLHAS [PASTA_SAIDA=mage4]
Escala: o diametro da gema do cajado (redonda, nao deforma com a pose) iguala o da pose idle1 antiga (mage3/idle1.png)."""
import numpy as np, json, sys, os, shutil
from PIL import Image, ImageOps
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'assets/characters/mage'
REF_GEM = float(os.environ.get('REF_GEM', 0)) or None

# nome: (folha, indice 1-based em ordem de leitura, espelhar)
POSES = {
 'idle1':('M1',1,0),'idle2':('M1',2,0),'idle3':('M1',3,0),'idle4':('M1',4,0),
 'look':('S10',1,0),'skirt':('S10',2,1),'side':('S10',3,1),'tired':('S10',4,1),
 'hip':('S1',2,0),'stars':('S1',3,0),'raise':('S1',1,0),'glance':('S2',1,0),'wave':('S2',2,0),'scroll':('S2',3,0),'potion':('S2',4,1),
 'atk1':('M3',1,0),'atk2':('M3',2,0),'atk3':('M3',3,0),'swingl':('M3',4,0),'swingf':('M3',5,0),'swingr':('S3',2,0),
 'fire':('S4',1,0),'air':('S4',2,0),'water':('S4',3,0),'earth':('S4',4,0),
 'castdef':('S6',2,0),'defmana':('MX',3,0),'deffire':('S9',1,0),'defwater':('S6',1,0),'defair':('S6',3,0),'defearth':('MX',4,0),
 'spin1':('M5',3,0),'spinwide':('M5',6,0),'bh1':('M5',2,0),'bh2':('BH',1,0),'open':('M5',4,0),'reach':('M5',5,0),'kneel':('M5',1,0),
 'dodge1':('M7',4,0),'dodge2':('M7',1,0),'dodge3':('M7',3,0),'dodge4':('M7',5,0),'dodge5':('S8',3,0),'dodge6':('S8',2,1),
 'hurt1':('S5',1,0),'hurt2':('S5',2,0),'fall':('S5',3,0),'down':('S5',4,0),
}
# ajuste fino por pose (o diametro da gema nao basta: o ChatGPT desenha cajado/corpo em proporcoes diferentes entre folhas). Calibrado olhando a largura do chapeu.
MULT = {'atk1':1.25,'atk2':1.3,'atk3':1.35,'swingl':1.3,'swingf':1.3,'swingr':1.2,'fire':1.1,'air':1.1,'water':1.1,'earth':1.0,
 'castdef':1.2,'defmana':1.2,'defwater':1.2,'defair':1.15,'defearth':1.15,'deffire':1.15,'spin1':1.15,'spinwide':1.6,'bh1':1.2,'bh2':1.0,'open':1.0,'reach':1.1,'kneel':1.25,
 'dodge1':1.1,'dodge2':1.1,'dodge3':1.1,'dodge4':1.1,'dodge5':1.15,'dodge6':1.05,
 'wave':.95,'scroll':1.1,'potion':1.15,'glance':1.1,'side':1.05,'tired':1.05}
OVERRIDE = {('S3',1):'S3_p1_fix.png', ('S3',4):'S3_p4_fix.png'}

def components(path):
    a = np.array(Image.open(path).convert('RGB')); m = a.min(2) < 235
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=5)); out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        if (lab[s] == i + 1).sum() > 3000: out.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
    cy = sorted(out, key=lambda b: (b[1] + b[3]) / 2); rows = [[cy[0]]]
    for b in cy[1:]:
        if (b[1] + b[3]) / 2 - np.mean([(r[1] + r[3]) / 2 for r in rows[-1]]) > 140: rows.append([b])
        else: rows[-1].append(b)
    return a, [b for r in rows for b in sorted(r, key=lambda b: b[0])]

def alpha_white(c, lo=196., hi=250., g=.85):
    mn = c.min(2); a = np.clip((hi - mn) / (hi - lo), 0, 1) ** g
    col = np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255)
    return np.dstack([col, a * 255]).astype(np.uint8), a

def gem(c):                                           # gema azul forte (com o nucleo branco): (centro x, y, diametro)
    r, g, b = c[..., 0].astype(int), c[..., 1].astype(int), c[..., 2].astype(int)
    m = ((b > 170) & (r < 120) & (b - r > 80) & (g < 200)) | ((r > 200) & (g > 200) & (b > 200) & False)
    m = ndi.binary_fill_holes(ndi.binary_closing(m, iterations=2)); m = ndi.binary_opening(m, iterations=2); lab, n = ndi.label(m)
    if not n: return None
    sz = ndi.sum(m, lab, range(1, n + 1)); k = int(np.argmax(sz)) + 1
    if sz[k - 1] < 60: return None
    ys, xs = np.where(lab == k); return xs.mean(), ys.mean(), 2 * np.sqrt(sz[k - 1] / np.pi)

if REF_GEM is None:                                   # idle1 novo com a mesma altura total do idle1 antigo (277px) -> diametro da gema de referencia
    a0, b0 = components(f'{SRC}/M1.png'); x0, y0, x1, y1 = b0[0]; c0 = a0[y0:y1, x0:x1].astype(np.float32)
    REF_GEM = gem(c0)[2] * (277.0 / c0.shape[0])
print('gema de referencia (idle1 antigo):', round(REF_GEM, 2))
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
cache = {}; meta = {'target_h': 228.0, 'poses': {}}
for name, (sheet, idx, mir) in POSES.items():
    if sheet not in cache: cache[sheet] = components(f'{SRC}/{sheet}.png')
    a, boxes = cache[sheet]
    if (sheet, idx) in OVERRIDE:
        c = np.array(Image.open(f'{SRC}/{OVERRIDE[(sheet, idx)]}').convert('RGB')).astype(np.float32)
        m = c.min(2) < 235; ys, xs = np.where(m); c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    else:
        x0, y0, x1, y1 = boxes[idx - 1]; pad = 4
        c = a[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad].astype(np.float32)
        lab, _ = ndi.label(ndi.binary_dilation(c.min(2) < 235, iterations=5))        # so a pose desta caixa (tira vizinhas que invadem)
        cen = lab[lab.shape[0] // 2, lab.shape[1] // 2]
        if not cen: cen = np.bincount(lab[lab > 0]).argmax()
        c[ndi.binary_dilation(lab != cen, iterations=1) & (lab != cen)] = 255
        c[lab != cen] = 255
    if mir: c = c[:, ::-1].copy()
    g = gem(c); f = (REF_GEM / g[2] if g else 1.0) * MULT.get(name, 1.0)
    if not g: print('  sem gema:', name)
    h, w = c.shape[:2]; nw, nh = max(1, round(w * f)), max(1, round(h * f))
    big = np.array(Image.fromarray(c.astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float32)
    rgba, al = alpha_white(big)
    lum = big.mean(2); dark = (al > .6) & (lum < 125) & (big[..., 2] >= big[..., 0] - 12)
    # remove poeira solta
    keep = al > .25; lb, kk = ndi.label(ndi.binary_dilation(keep, iterations=2))
    if kk > 1:
        sz = ndi.sum(keep, lb, range(1, kk + 1)); big_id = np.argmax(sz) + 1
        for i in range(1, kk + 1):
            if i != big_id and sz[i - 1] < 60: rgba[(lb == i) & keep] = 0
    hh, ww = al.shape; cols = np.where(dark.sum(0) > 6)[0]; ctr = (cols.min() + cols.max()) / 2 if len(cols) else ww / 2
    sel = dark[:, int(max(0, ctr - ww * .25)):int(min(ww, ctr + ww * .25))]; rows = np.where(sel.sum(1) > 2)[0]; ground = rows.max() + 1 if len(rows) else hh
    band = dark[max(0, ground - 45):max(1, ground - 14)]; cc = np.where(band.sum(0) > 0)[0]; cx = (cc.min() + cc.max()) / 2 if len(cc) else ctr
    gg = gem(big); orb = [float(gg[0]), float(gg[1])] if gg else None
    ys = np.where(rgba[..., 3] > 20)[0]; xs = np.where(rgba[..., 3] > 20)[1]
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = rgba[y0:y1, x0:x1]; ground -= y0; cx -= x0
    if orb: orb = [orb[0] - x0, orb[1] - y0]
    Image.fromarray(rgba).save(f'{OUT}/{name}.png')
    meta['poses'][name] = {'w': int(rgba.shape[1]), 'h': int(rgba.shape[0]), 'cx': float(cx), 'gy': float(ground), 'orb': orb, 'outlined': True, 'thin': True}
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print(len(meta['poses']), 'poses ->', OUT)
