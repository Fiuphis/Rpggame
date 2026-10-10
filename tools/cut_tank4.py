#!/usr/bin/env python3
"""Recorta as folhas de fundo BRANCO do Tanque (v233) -> assets/characters/tank/ (poses normalizadas + meta.json).
Uso: python3 tools/cut_tank4.py PASTA_FOLHAS [PASTA_SAIDA=tank4]
Escala: o diametro da cabeca careca (redonda, nao deforma com a pose) iguala o da pose idle1; idle1 tem a altura do corpo do tanque antigo (262 px).
Depois pixeliza (grade K) com borda azul-marinho, como tools/pixel_maga4.py."""
import numpy as np, json, sys, os, shutil
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'assets/characters/tank'
K = float(os.environ.get('K', 1)); BODY_H = 262.0
# nome: (arquivo, indice 1-based em ordem de leitura (0 = imagem unica), espelhar)
POSES = {
 'i1':('T1',1,0),'i2':('T1',2,0),'i3':('T1',3,0),'i4':('T1',4,0),'i5':('T1_p5',0,0),'i6':('T1',6,0),
 'a1':('T2',1,0),'a2':('T2',2,0),'a3':('T2',3,0),'a4':('T2',4,0),'a5':('T2',5,0),'a6':('T2',6,0),
 'h1':('T3',1,0),'h2':('T3',2,0),'h3':('T3_p3',0,0),'h4':('T3',4,0),'h5':('T3',5,0),'h6':('T3',6,0),
 's1':('T4',1,0),'s2':('T4',2,0),'s3':('T4',3,0),'s4':('T4',4,1),'s6':('T4',6,0),
 'e1':('T5',1,0),'e2':('T5',2,0),'e3':('T5',3,0),'e4':('T5',4,0),'e5':('T5',5,0),'e6':('T5',6,0),
 'u1':('T6',1,0),'u2':('T6',2,0),'k1':('T6',3,0),'k2':('T6',4,0),'fl':('T6',5,0),'dn':('T6',6,0),
 'v1':('T7',1,0),'v2':('T7_p2',0,0),'v3':('T7',3,0),'v4':('T7',4,0),'v5':('T7',5,0),'v6':('T7',6,1),
}
# poses sem cabeca visivel (ou muito deformada): escala por altura relativa ao idle1 (ajuste manual)
MULT = {'i5':.88,'v2':1.12}
NOHEAD = {'e3':1.0,'fl':1.0,'dn':1.0}

def components(path):
    a = np.array(Image.open(path).convert('RGB')); m = a.min(2) < 235
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=2)); out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        if (lab[s] == i + 1).sum() > 6000: out.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
    cy = sorted(out, key=lambda b: (b[1] + b[3]) / 2); rows = [[cy[0]]]
    for b in cy[1:]:
        if (b[1] + b[3]) / 2 - np.mean([(r[1] + r[3]) / 2 for r in rows[-1]]) > 140: rows.append([b])
        else: rows[-1].append(b)
    return a, [b for r in rows for b in sorted(r, key=lambda b: b[0])]

def head(c):                                          # diametro (px) da cabeca careca: componente marrom-avermelhada lisa, redonda e mais alta
    r, g, b = c[..., 0].astype(int), c[..., 1].astype(int), c[..., 2].astype(int)
    m = (r > 45) & (r < 200) & (r > g * 1.9) & (r < g * 2.8) & (g > b * 1.1) & (g < b * 1.9)
    m = ndi.binary_opening(ndi.binary_closing(m, iterations=2), iterations=3); lab, n = ndi.label(m); best = None
    for i, s in enumerate(ndi.find_objects(lab)):
        mk = lab[s] == i + 1; ar = mk.sum(); h, w = mk.shape
        if ar < 350 or max(h, w) / max(1, min(h, w)) > 1.45 or ar / (h * w) < .62: continue
        d = 2 * np.sqrt(ar / np.pi)
        if best is None or s[0].start < best[0] - 15 or (abs(s[0].start - best[0]) <= 15 and ar > best[2]): best = (s[0].start, s[1].start, ar, d, s)
    return best

def alpha_white(c, lo=196., hi=250., g=.85):
    mn = c.min(2); a = np.clip((hi - mn) / (hi - lo), 0, 1) ** g
    col = np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255)
    return np.dstack([col, a * 255]).astype(np.uint8), a

def pose_crop(name):
    f, idx, mir = POSES[name]
    if idx == 0:
        c = np.array(Image.open(f'{SRC}/{f}.png').convert('RGB')).astype(np.float32); m = c.min(2) < 235
        ys, xs = np.where(m); c = c[max(0, ys.min() - 4):ys.max() + 5, max(0, xs.min() - 4):xs.max() + 5]
    else:
        if f not in cache: cache[f] = components(f'{SRC}/{f}.png')
        a, boxes = cache[f]; x0, y0, x1, y1 = boxes[idx - 1]; pad = 6
        c = a[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad].astype(np.float32)
        lab, _ = ndi.label(ndi.binary_dilation(c.min(2) < 235, iterations=5)); cen = lab[lab.shape[0] // 2, lab.shape[1] // 2]
        if not cen: cen = np.bincount(lab[lab > 0]).argmax()
        c[lab != cen] = 255
    if mir: c = c[:, ::-1].copy()
    return c

# diametro da cabeca (px da folha original) por folha: mediana das poses onde a cabeca foi detectada; T4/T6 pelo tamanho medio das poses (relacao cabeca/area das outras folhas); imagens unicas medidas na propria imagem
HS = {'T1':40.2,'T2':29.1,'T3':29.7,'T4':32.1,'T5':29.9,'T6':28.2,'T7':30.75,'T1_p5':70.9,'T7_p2':86.9,'T3_p3':47.4}
cache = {}; crops = {n: pose_crop(n) for n in POSES}
HREF = HS['T1']; x = crops['i1']; ys0 = np.where((x.min(2) < 235).any(1))[0]
F0 = BODY_H / (ys0.max() - ys0.min() + 1)                          # idle1 com a altura do corpo do tanque antigo
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT); meta = {'poses': {}, 'k': K}
NAVY = np.array([22, 16, 52])
for n in POSES:
    c = crops[n]; f = F0 * (HREF / HS[POSES[n][0]]) * MULT.get(n, 1.0)
    rgba, _ = alpha_white(c); im = Image.fromarray(rgba).resize((max(1, round(c.shape[1] * f)), max(1, round(c.shape[0] * f))), Image.LANCZOS)
    w, hh = im.size; sw, sh = max(1, round(w / K)), max(1, round(hh / K))
    arr = np.array(im).astype(np.float32); arr[..., :3] *= arr[..., 3:4] / 255
    sm = np.array(Image.fromarray(arr.astype(np.uint8)).resize((sw, sh), Image.BOX)).astype(np.float32); al = sm[..., 3]
    A = al > 110; out = np.zeros((sh, sw, 4), np.uint8)
    out[..., :3] = np.clip(sm[..., :3] * 255 / np.maximum(al[..., None], 1), 0, 255); out[..., 3] = np.where(A, 255, 0)
    ring = A & ~ndi.binary_erosion(A); out[ring, :3] = (out[ring, :3] * .3 + NAVY * .7).astype(np.uint8)
    o = ndi.binary_dilation(A) & ~A; out[o] = (*NAVY, 255)
    fin = Image.fromarray(out).resize((sw * round(K), sh * round(K)), Image.NEAREST); W, H = fin.size
    a2 = np.array(fin)[..., 3] > 0; ys, xs = np.where(a2); bot = ys.max(); band = a2[max(0, bot - int(H * .12)):bot + 1]; bx = np.where(band.any(0))[0]
    cx = (bx.min() + bx.max()) / 2; fin.save(f'{OUT}/{n}.png'); meta['poses'][n] = {'w': W, 'h': H, 'cx': float(cx), 'gy': float(bot + 1)}
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print('ok', len(meta['poses']))
