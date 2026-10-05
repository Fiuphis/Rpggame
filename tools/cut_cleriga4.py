#!/usr/bin/env python3
"""Recorta as folhas de fundo BRANCO da Clériga (v248) -> cleriga4/ (poses normalizadas + meta.json com o ponto da estrela do cajado).
Uso: python3 tools/cut_cleriga4.py PASTA_FOLHAS [PASTA_SAIDA=cleriga4]   (K = grade de pixel por env, padrao 2)
Folhas: C1 ociosa, C2 ataque, C3 sagrado, C4 defesa (+ C4_p1_fix, C4_p8 avulsas), C5/C5b dano e esquiva, C6 ultimate, C7 queda e vitoria.
Escala: i1 (em guarda, de costas) tem BODY_H px de altura; cada folha e ajustada pela area da estola vermelha (mesmo tamanho real), mais um ajuste fino por pose (MULT).
Depois pixeliza (grade K) com borda azul-marinho, como tools/cut_guerreiro4.py."""
import numpy as np, json, sys, os, shutil
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'cleriga4'
K = int(os.environ.get('K', 2)); BODY_H = float(os.environ.get('BODY_H', 282))
# nome: (arquivo, indice 1-based em ordem de leitura (0 = imagem unica), espelhar)
POSES = {
 'i1':('C1',1,0),'i2':('C1',2,0),'i3':('C1',3,0),'i4':('C1',4,0),'i5':('C1',5,0),'i6':('C1',6,0),'i7':('C1',7,0),'i8':('C1',8,0),
 'a1':('C2',1,0),'a2':('C2',2,0),'a3':('C2',3,0),'a4':('C2',4,0),'a5':('C2',5,0),'a6':('C2',6,0),'a7':('C2',7,0),'a8':('C2',8,0),
 'h1':('C3',1,0),'h2':('C3',2,0),'h3':('C3',3,0),'h5':('C3',5,0),'h6':('C3',6,0),'h7':('C3',7,0),'h8':('C3',8,0),
 's1':('C4_p1_fix',0,0),'s2':('C4',2,0),'s3':('C4',3,0),'s4':('C4',4,0),'s5':('C4',5,0),'s6':('C4',6,0),'s7':('C4',7,0),'s8':('C4_p8',0,1),
 'e1':('C5',1,0),'e2':('C5',2,0),'e3':('C5',3,0),'e5':('C5',5,0),'e6':('C5b',1,0),'e7':('C5b',2,0),'e8':('C5b',4,0),
 'u1':('C6',1,0),'u2':('C6',2,0),'u3':('C6',3,0),'u4':('C6',4,0),'u5':('C6',5,0),'u6':('C6',6,0),'u7':('C6',7,0),'u8':('C6',8,0),
 'e4':('C8',1,0),'h4':('C8',2,0),'e9':('C8',3,0),'f6':('C8',4,0),
 'f1':('C7',1,0),'f2':('C7',2,0),'f3':('C7',3,0),'f4':('C7',4,0),'f5':('C7',5,0),'v1':('C7',6,0),'v3':('C7',8,0),
}
# fator por arquivo (area da estola vermelha: folhas ~76; C5b ~108; avulsas ~277) e ajuste fino por pose
FS = {'C1':1.03,'C2':1.07,'C3':.97,'C4':.97,'C5':.98,'C5b':.71,'C8':.71,'C6':1.03,'C7':1.0,'C4_p1_fix':.275,'C4_p8':.272}
MULT = {}
ERASE = {'h7': (.84, .74, 1., 1.)}                        # caixas (fracoes x0,y0,x1,y1 do sprite) com po pintado na folha
MULT.update(json.loads(os.environ.get('MULT', '{}')))

def comps(path):
    a = np.array(Image.open(path).convert('RGB')); m = a.min(2) < 235
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=3)); out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        if (lab[s] == i + 1).sum() > 1500: out.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
    h = a.shape[0]; r1 = sorted([b for b in out if (b[1] + b[3]) / 2 < h / 2], key=lambda b: b[0]); r2 = sorted([b for b in out if (b[1] + b[3]) / 2 >= h / 2], key=lambda b: b[0])
    return a, r1 + r2

def alpha_white(c, lo=232., hi=252.):
    """fundo = branco quase puro (conectado a borda, ou areas grandes fechadas); tudo dentro da figura e opaco (o manto e branco!).
    So a franja de 1-2 px usa transparencia suave para nao ficar halo branco."""
    mn = c.min(2); spread = c.max(2) - mn
    # o fundo e branco NEUTRO (R=G=B); o tecido branco tem um leve tom (rosado/dourado): neutro e claro = fundo, mesmo nos vaos fechados entre braco e cajado
    lab, n = ndi.label(mn >= 247); sizes = np.bincount(lab.ravel(), minlength=n + 1)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sp = ndi.mean(spread, lab, index=np.arange(n + 1))                    # tom medio de cada regiao clara: fundo ~0.5, tecido >= 1.5
    bg = np.zeros(mn.shape, bool)
    for i in range(1, n + 1):
        if sizes[i] >= 18 and (sp[i] <= 1.0 or (i in edge and sizes[i] > 60 and sp[i] <= 1.4)): bg |= lab == i
    bg = ndi.binary_closing(bg, iterations=1) | bg
    halo = ndi.binary_dilation(bg, iterations=2) & (mn >= 238); bg = bg | halo
    fg = ~bg; fg = ndi.binary_opening(fg, iterations=1) | ndi.binary_erosion(fg, iterations=1)
    near = ndi.binary_dilation(bg, iterations=2) & fg                       # franja junto ao fundo
    a = fg.astype(np.float32)
    soft = np.clip((hi - mn) / (hi - lo), 0, 1)
    a = np.where(near, np.minimum(a, np.maximum(soft, .0)), a)
    col = np.clip(c, 0, 255)
    return np.dstack([col, a * 255]).astype(np.uint8), a

from skimage.feature import match_template
def gold(c):                                           # mapa 0..1 do dourado/laranja vivo (cabeca do cajado)
    r, g, b = c[..., 0].astype(np.float32), c[..., 1].astype(np.float32), c[..., 2].astype(np.float32)
    return np.clip(((r - b) - 70) / 110, 0, 1) * (g > 90)
_TPL = {}
def tpl_set(c1):                                       # molde: cabeca do cajado da C1 pose 1 (estrela em ~ (111, 67) do recorte), girado e em escalas
    import cv2
    gm = gold(c1); cx, cy, R = 117, 73, 46
    base = gm[cy - R:cy + R, cx - R:cx + R]
    for sc in (.85, 1.0, 1.15):
        for ang in range(0, 360, 15):
            M = cv2.getRotationMatrix2D((R, R), ang, sc); _TPL[(sc, ang)] = cv2.warpAffine(base, M, (2 * R, 2 * R))[R - 34:R + 34, R - 34:R + 34]
def orb_pt(c):                                         # estrela do cajado por casamento de molde (x, y) em px do recorte, ou None
    gm = gold(c); pad = 40; g2 = np.pad(gm, pad); best = (0, None)
    for k, tp in _TPL.items():
        if tp.sum() < 20: continue
        r = match_template(g2, tp, pad_input=False); y, x = np.unravel_index(np.argmax(r), r.shape)
        if r[y, x] > best[0]: best = (r[y, x], (x + tp.shape[1] / 2 - pad, y + tp.shape[0] / 2 - pad))
    return best[1] if best[0] > .45 else None

cache = {}
def pose_crop(name):
    f, idx, mir = POSES[name]
    if idx == 0:
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
tpl_set(crops['i1'])
x = crops['i1']; ys0 = np.where((x.min(2) < 235).any(1))[0]
F0 = BODY_H / (ys0.max() - ys0.min() + 1)                          # i1 com BODY_H px de altura (cajado incluido)
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT); meta = {'poses': {}, 'k': K}
NAVY = np.array([22, 16, 52])
for n in POSES:
    c = crops[n]; f = F0 * FS[POSES[n][0]] * MULT.get(n, 1.0)
    ob = orb_pt(c)
    # recorte justo (a pose inteira com margem 0): o orb e medido relativo ao recorte justo
    mk = c.min(2) < 235; ys, xs = np.where(mk); cy0, cx0 = ys.min(), xs.min(); c = c[cy0:ys.max() + 1, cx0:xs.max() + 1]
    if ob: ob = (ob[0] - cx0, ob[1] - cy0)
    rgba, _ = alpha_white(c); im = Image.fromarray(rgba).resize((max(1, round(c.shape[1] * f)), max(1, round(c.shape[0] * f))), Image.LANCZOS)
    w0, h0 = im.size; w, hh = -(-w0 // K) * K, -(-h0 // K) * K           # multiplo de K: grade uniforme
    pad = Image.new('RGBA', (w, hh), (0, 0, 0, 0)); pad.paste(im, (0, 0)); im = pad; sw, sh = w // K, hh // K
    arr = np.array(im).astype(np.float32); arr[..., :3] *= arr[..., 3:4] / 255
    sm = np.array(Image.fromarray(arr.astype(np.uint8)).resize((sw, sh), Image.BOX)).astype(np.float32); al = sm[..., 3]
    A = al > 110
    hl, hn = ndi.label(~A)                                                  # buracos pequenos dentro da figura (brilhos do manto) viram tecido
    hs = np.bincount(hl.ravel(), minlength=hn + 1); hedge = set(np.unique(np.concatenate([hl[0], hl[-1], hl[:, 0], hl[:, -1]])))
    for i in range(1, hn + 1):
        if i not in hedge and hs[i] <= 45: A |= hl == i
    colr = np.clip(sm[..., :3] * 255 / np.maximum(al[..., None], 1), 0, 255)                  # franja clara/neutra rente a borda = sobra do fundo branco
    for _ in range(2):
        edz = A & ~ndi.binary_erosion(A, iterations=2)
        light = (colr.min(2) >= 244) & ((colr.max(2) - colr.min(2)) <= 3)
        A = A & ~(edz & light)
    cl, cn = ndi.label(A, structure=np.ones((3, 3))); cs = np.bincount(cl.ravel(), minlength=cn + 1)
    for i in range(1, cn + 1):
        if cs[i] < 70: A &= cl != i                                          # po/respingos soltos pintados na folha
    if n in ERASE:
        x0e, y0e, x1e, y1e = ERASE[n]; A[int(y0e * sh):int(y1e * sh) + 1, int(x0e * sw):int(x1e * sw) + 1] = False
    out = np.zeros((sh, sw, 4), np.uint8)
    out[..., :3] = np.clip(sm[..., :3] * 255 / np.maximum(al[..., None], 1), 0, 255); out[..., 3] = np.where(A, 255, 0)
    ring = A & ~ndi.binary_erosion(A); out[ring, :3] = (out[ring, :3] * .3 + NAVY * .7).astype(np.uint8)
    o = ndi.binary_dilation(A) & ~A; out[o] = (*NAVY, 255)
    fin = Image.fromarray(out).resize((sw * K, sh * K), Image.NEAREST); W, H = fin.size
    a2 = np.array(fin)[..., 3] > 0; ys, xs = np.where(a2); bot = ys.max(); band = a2[max(0, bot - int(H * .12)):bot + 1]; bx = np.where(band.any(0))[0]
    cx = (bx.min() + bx.max()) / 2; fin.save(f'{OUT}/{n}.png'); e = {'w': W, 'h': H, 'cx': float(cx), 'gy': float(bot + 1)}
    if ob: e['orb'] = [round(ob[0] * f, 1), round(ob[1] * f, 1)]
    meta['poses'][n] = e
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print('ok', len(meta['poses']), 'F0', round(F0, 3), 'sem orb:', [n for n, e in meta['poses'].items() if 'orb' not in e])
