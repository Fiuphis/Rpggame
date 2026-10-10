#!/usr/bin/env python3
"""Recorta as folhas de fundo BRANCO do Guerreiro (v242) -> assets/characters/guerreiro/ (poses normalizadas + meta.json).
Uso: python3 tools/cut_guerreiro4.py PASTA_FOLHAS [PASTA_SAIDA=guerreiro4]   (K = grade de pixel por env, padrao 2)
Escala: a pose i1 (em guarda, de costas) tem BODY_H px de altura; as demais usam o mesmo fator da folha (GS), com ajuste fino por pose (MULT).
Depois pixeliza (grade K) com borda azul-marinho, como tools/cut_tank4.py."""
import numpy as np, json, sys, os, shutil
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'assets/characters/guerreiro'
K = int(os.environ.get('K', 2)); BODY_H = float(os.environ.get('BODY_H', 258))
# nome: (arquivo, indice 1-based (0 = imagem unica), espelhar)
POSES = {
 'i1':('G1',1,0),'i2':('G1',2,0),'i3':('G1',3,0),'i4':('G1',4,0),'i5':('G1',5,0),'i6':('G1_p6',0,0),'i7':('G1',7,1),'i8':('G1_p8',0,0),
 'a1':('G2',1,0),'a2':('G2',2,0),'a3':('G2',3,0),'a4':('G2',4,0),'a5':('G2',5,0),'a6':('G2',8,1),'a7':('G2',7,0),'a8':('G2',8,0),
 'h1':('G3',1,0),'h2':('G3',2,0),'h3':('G3',3,0),'h4':('G3_p4',0,1),'h5':('G3',5,0),'h6':('G3',6,0),'h8':('G3',8,0),
 's1':('G4',1,0),'s3':('G4',3,0),'s4':('G4',4,0),'s5':('G4',5,1),'s6':('G4',6,0),'s7':('G4',7,0),'s8':('G4',8,0),
 'e1':('G5',1,0),'e2':('G5',2,0),'e3':('G5',3,0),'e4':('G5',4,0),'e5':('G5',5,0),'e6':('G5',6,0),'e7':('G5',7,0),'e8':('G5',8,0),
 'b1':('G6',1,0),'b2':('G6',2,0),'b3':('G6',3,0),'b4':('G6',4,0),'b5':('G6',5,0),'b6':('G6',6,0),'b7':('G6',7,0),'b8':('G6',8,0),
 'x1':('G7_p123',3,0),'f1':('G7',4,0),'f2':('G7',5,0),'v1':('G7',6,0),'v2':('G7',7,0),'v3':('G7',8,0),
}
# fator de escala por arquivo (folhas = 1; imagens unicas sao maiores) e ajuste fino por pose
FS = {'G1':1,'G2':1,'G3':1,'G4':1,'G5':1,'G6':1,'G7':1,'G7_p123':1,'G1_p6':.353,'G1_p8':.353,'G3_p4':.30}
# ajuste por pose: cabeca com o mesmo tamanho em todas (medida pelo cabelo marrom; as folhas G2-G7 saiam ~10-25% menores que a G1)
MULT = {'i3':1,'i7':.95,'a1':1.22,'a2':1.16,'a3':1.2,'a4':1.22,'a5':1.2,'a6':1.12,'a7':1.25,'a8':1.22,
 'h1':1.05,'h2':1.15,'h3':1.25,'h4':1.0,'h5':1.12,'h6':1.0,'h8':1.12,
 's1':1.06,'s3':1.12,'s4':1.12,'s5':1.12,'s6':1.15,'s7':1.15,'s8':1.08,
 'e1':1.08,'e2':1.08,'e3':1.0,'e4':1.2,'e5':1.08,'e6':1.0,'e7':1.08,'e8':.8,
 'b1':1.2,'b2':1.0,'b3':1.1,'b4':1.2,'b5':1.2,'b6':1.25,'b7':1.25,'b8':1.3,
 'x1':.9,'f1':1.1,'f2':1.1,'v1':1.25,'v2':1.1,'v3':1.06}
MULT.update(json.loads(os.environ.get('MULT', '{}')))

def comps(path):
    a = np.array(Image.open(path).convert('RGB')); m = a.min(2) < 235
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=2)); out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        if (lab[s] == i + 1).sum() > 1500: out.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
    h = a.shape[0]; r1 = sorted([b for b in out if (b[1] + b[3]) / 2 < h / 2], key=lambda b: b[0]); r2 = sorted([b for b in out if (b[1] + b[3]) / 2 >= h / 2], key=lambda b: b[0])
    return a, r1 + r2

def alpha_white(c, lo=196., hi=250., g=.85):
    mn = c.min(2); a = np.clip((hi - mn) / (hi - lo), 0, 1) ** g
    col = np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255)
    return np.dstack([col, a * 255]).astype(np.uint8), a

cache = {}
def pose_crop(name):
    f, idx, mir = POSES[name]
    if idx == 0 or f == 'G7_p123' and False:
        c = np.array(Image.open(f'{SRC}/{f}.png').convert('RGB')).astype(np.float32); m = c.min(2) < 235
        ys, xs = np.where(m); c = c[max(0, ys.min() - 4):ys.max() + 5, max(0, xs.min() - 4):xs.max() + 5]
    else:
        if f not in cache: cache[f] = comps(f'{SRC}/{f}.png')
        a, boxes = cache[f]; x0, y0, x1, y1 = boxes[idx - 1]; pad = 6
        c = a[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad].astype(np.float32)
        lab, _ = ndi.label(ndi.binary_dilation(c.min(2) < 235, iterations=5)); cen = lab[lab.shape[0] // 2, lab.shape[1] // 2]
        if not cen: cen = np.bincount(lab[lab > 0]).argmax()
        c[lab != cen] = 255
    if mir: c = c[:, ::-1].copy()
    return c

crops = {n: pose_crop(n) for n in POSES}
x = crops['i1']; ys0 = np.where((x.min(2) < 235).any(1))[0]
F0 = BODY_H / (ys0.max() - ys0.min() + 1)                          # i1 com BODY_H px de altura
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT); meta = {'poses': {}, 'k': K}
NAVY = np.array([22, 16, 52])
for n in POSES:
    c = crops[n]; f = F0 * FS[POSES[n][0]] * MULT.get(n, 1.0)
    rgba, _ = alpha_white(c); im = Image.fromarray(rgba).resize((max(1, round(c.shape[1] * f)), max(1, round(c.shape[0] * f))), Image.LANCZOS)
    w0, h0 = im.size; w, hh = -(-w0 // K) * K, -(-h0 // K) * K           # multiplo de K: grade uniforme
    pad = Image.new('RGBA', (w, hh), (0, 0, 0, 0)); pad.paste(im, (0, 0)); im = pad; sw, sh = w // K, hh // K
    arr = np.array(im).astype(np.float32); arr[..., :3] *= arr[..., 3:4] / 255
    sm = np.array(Image.fromarray(arr.astype(np.uint8)).resize((sw, sh), Image.BOX)).astype(np.float32); al = sm[..., 3]
    A = al > 110; out = np.zeros((sh, sw, 4), np.uint8)
    out[..., :3] = np.clip(sm[..., :3] * 255 / np.maximum(al[..., None], 1), 0, 255); out[..., 3] = np.where(A, 255, 0)
    ring = A & ~ndi.binary_erosion(A); out[ring, :3] = (out[ring, :3] * .3 + NAVY * .7).astype(np.uint8)
    o = ndi.binary_dilation(A) & ~A; out[o] = (*NAVY, 255)
    fin = Image.fromarray(out).resize((sw * K, sh * K), Image.NEAREST); W, H = fin.size
    a2 = np.array(fin)[..., 3] > 0; ys, xs = np.where(a2); bot = ys.max(); band = a2[max(0, bot - int(H * .12)):bot + 1]; bx = np.where(band.any(0))[0]
    cx = (bx.min() + bx.max()) / 2; fin.save(f'{OUT}/{n}.png'); meta['poses'][n] = {'w': W, 'h': H, 'cx': float(cx), 'gy': float(bot + 1)}
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print('ok', len(meta['poses']), 'F0', round(F0, 3))
