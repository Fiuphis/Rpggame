# Recorta as folhas de fundo BRANCO da Clériga -> clr/*.png + clr/meta.json (poses de costas na mesma escala, ancoradas no chão)
import numpy as np, json, os, sys, shutil
from PIL import Image
from scipy import ndimage as ndi
UP = '/root/.claude/uploads/3a96d84d-702c-52a6-9324-e85ba38ea593/'
OUT = 'clr'; BODY_H = 265.0
SHEETS = {'a':'630d9581', 'b':'34562ee6', 'c':'a4df0f43'}
REF = {'a':('a', 152), 'b':('b', 33), 'c':('c', 159)}      # pose neutra de cada folha (capuz→barra = BODY_H)
POSES = {   # nome: (folha, [ids], staff?)
 'at1':('a',[144],1), 'at2':('a',[155],0), 'at3':('a',[142],1), 'hat1':('a',[147],1), 'hat2':('a',[158],1),
 'dn1':('a',[146],1), 'dn2':('a',[153],0), 'dn3':('a',[150],0), 'ds1':('a',[149],0),
 'dg1':('a',[156],0), 'dg2':('a',[154],1), 'dg3':('a',[157],0),
 'idle1':('a',[152],0), 'stf':('a',[145],1), 'pr1':('a',[290],0), 'pr2':('a',[288],0), 'ex1':('a',[291],0),
 'v1':('a',[278],1), 'v2':('a',[279],0), 'd1':('a',[285],0), 'd2':('a',[310],0), 'd3':('a',[307],0), 'd4':('a',[321],0),
 'ult1':('a',[179],1), 'ult2':('a',[180],1),
 'bt1':('b',[12],0), 'bt2':('b',[13],0), 'bt3':('b',[14],0), 'bt4':('b',[9],0),
 'bp1':('b',[11],0), 'bp2':('b',[10],0), 'bp3':('b',[8],0),
 'br1':('b',[29],0), 'br2':('b',[30],0), 'br3':('b',[32],0), 'br4':('b',[35],0), 'br5':('b',[31],0), 'br6':('b',[28],0),
 'bg1':('b',[33],0), 'bg2':('b',[34],0), 'bg3':('b',[36],0), 'bg4':('b',[37],0),
}
FX = {'star1':('a',[261]), 'star2':('a',[346]), 'star3':('a',[305]), 'ring1':('a',[263]), 'ring2':('a',[299]), 'ring3':('a',[341]), 'pillar':('a',[281]), 'lotus':('a',[326]),
      'burst':('a',[257]), 'aura':('a',[183]), 'streak1':('a',[184]), 'streak2':('a',[236]), 'streak3':('a',[240]), 'sunstar':('a',[178]), 'star4':('a',[237]), 'pillar2':('a',[166]), 'cross1':('a',[193])}

class Sheet:
    def __init__(s, k):
        s.a = np.asarray(Image.open(f'{UP}{SHEETS[k]}-image.png').convert('RGB')).astype(np.float32)
        nw = s.a.min(2) < 225; s.lab, s.n = ndi.label(ndi.binary_dilation(nw, iterations=2)); s.sl = ndi.find_objects(s.lab)
    def crop(s, ids, pad=4):
        m = np.isin(s.lab, ids); ys, xs = np.where(m); y0, y1, x0, x1 = ys.min() - pad, ys.max() + 1 + pad, xs.min() - pad, xs.max() + 1 + pad
        c = s.a[y0:y1, x0:x1].copy(); mm = ndi.binary_dilation(m[y0:y1, x0:x1], iterations=1); c[~mm] = 255; return c
def matte(c):
    mn = c.min(2); sat = c.max(2) - mn
    nearw = mn >= 238; lab, n = ndi.label(nearw); ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(ids))
    solid = (mn < 205) | (sat > 110)
    solid = ndi.binary_opening(solid, iterations=1) | ndi.binary_dilation(solid & (mn < 150), iterations=1)
    core = ndi.binary_fill_holes(ndi.binary_closing(solid, iterations=3))
    l, k = ndi.label(core)
    if k: sz = ndi.sum(core, l, range(1, k + 1)); core = np.isin(l, [i + 1 for i, v in enumerate(sz) if v >= .2 * sz.max()])
    aw = np.clip((250 - mn) / (250 - 185), 0, 1); alpha = aw.copy(); alpha[core & ~bg] = 1.0
    return alpha, core & ~bg
def rgba(c, al):
    rgb = np.clip((c - 255 * (1 - al[..., None])) / np.maximum(al[..., None], .12), 0, 255); return np.dstack([rgb, al * 255]).astype(np.uint8)
def fixedge(im, core):
    """tira franja branca na borda e põe contorno escuro de 1px"""
    a = im[..., 3].astype(int); rgb = im[..., :3].astype(int); mn = rgb.min(2)
    out = ndi.binary_dilation(a < 40, iterations=2) & (a > 0)
    white = (mn > 222) & out & ((rgb.max(2) - mn) < 40)
    im[..., 3][white] = 0
    a = im[..., 3].astype(int); body = ndi.binary_erosion(core, iterations=0) & (a > 0)
    ring = ndi.binary_dilation(a >= 150, iterations=1) & (a < 150)
    ring &= ndi.binary_dilation(core, iterations=3)
    im[..., :3][ring] = (58, 34, 38); im[..., 3][ring] = 255
    return im
def outline(I):
    """borda fina escura (1px) no corpo, já na escala final; pixels claros da beirada viram a cor da borda"""
    im = np.array(I); a = im[..., 3].astype(int); body = a >= 128
    l, k = ndi.label(a > 200)
    if k: sz = ndi.sum(a > 200, l, range(1, k + 1)); main = np.isin(l, [i + 1 for i, v in enumerate(sz) if v >= .15 * sz.max()])
    else: main = body
    rgb = im[..., :3].astype(int); light = (rgb.min(2) > 150) & ((rgb.max(2) - rgb.min(2)) < 60)
    near = ndi.binary_dilation(main, iterations=5) & ~main & (a > 0) & (rgb.min(2) > 110) & ((rgb.max(2) - rgb.min(2)) < 115)
    near |= ndi.binary_dilation(main, iterations=2) & ~main & (a < 255)
    im[..., 3][near] = 0
    light2 = (rgb.min(2) > 108) & ((rgb.max(2) - rgb.min(2)) < 85)
    inner = main & ~ndi.binary_erosion(main, iterations=3) & light2
    inner |= main & ~ndi.binary_erosion(main, iterations=1) & (im[..., 3] < 255)
    im[..., :3][inner] = (46, 28, 34)
    band = main & ~ndi.binary_erosion(main, iterations=7) & (rgb.min(2) > 232) & ((rgb.max(2) - rgb.min(2)) < 26)
    im[..., :3][band] = (206, 190, 196)
    gray2 = main & ~ndi.binary_erosion(main, iterations=2) & ((rgb.max(2) - rgb.min(2)) < 62) & (rgb.mean(2) > 70)
    im[..., :3][gray2] = (46, 28, 34)
    ring = ndi.binary_dilation(main, iterations=1) & ~main
    im[..., :3][ring] = (46, 28, 34); im[..., 3][ring] = 255
    return Image.fromarray(im)
def stats(im, core):
    a = im[..., 3]; sol = (a > 240) & core
    ys, xs = np.where(sol); gy = ys.max() + 1; top = ys.min()
    band = sol[int(gy - .18 * (gy - top)):gy]; bx = np.where(band)[1]; cx = float(bx.mean())
    return float(cx), float(gy), float(top)
if __name__ == '__main__':
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    sh = {k: Sheet(k) for k in SHEETS}; scale = {}
    for k, (sk, i) in REF.items():
        c = sh[sk].crop([i]); al, core = matte(c); im = rgba(c, al); cx, gy, top = stats(im, core); scale[k] = BODY_H / (gy - top)
    print('escalas', scale)
    meta = {'poses':{}, 'fx':{}, 'body_h':BODY_H}
    for name, (k, ids, staff) in POSES.items():
        c = sh[k].crop(ids); al, core = matte(c); im = rgba(c, al); im = fixedge(im, core); cx, gy, top = stats(im, core)
        I = Image.fromarray(im); s = scale[k] * ({'pr1':1.19,'pr2':1.19,'ex1':1.19}.get(name, 1.0)) * (0.96 if k == 'b' else 1.0); I = I.resize((max(1, round(I.width * s)), max(1, round(I.height * s))), Image.LANCZOS if s < 1 else Image.NEAREST)
        # reamostra o mesmo recorte p/ meta
        orb = None
        if staff:
            a2 = np.asarray(I)[..., 3]; ys, xs = np.where(a2 > 200); t = ys.min(); sel = ys < t + 10; orb = [float(xs[sel].mean()), float(t + 5)]
        I = outline(I); I.save(f'{OUT}/{name}.png'); meta['poses'][name] = {'w':I.width, 'h':I.height, 'cx':cx * s, 'gy':gy * s, 'orb':orb}
    for name, (k, ids) in FX.items():
        c = sh[k].crop(ids); mn = c.min(2); al = np.clip((250 - mn) / 70, 0, 1); im = rgba(c, al); I = Image.fromarray(im)
        I = I.resize((round(I.width * 2.0), round(I.height * 2.0)), Image.NEAREST); I.save(f'{OUT}/fx_{name}.png'); meta['fx'][name] = {'w':I.width, 'h':I.height}
    json.dump(meta, open(f'{OUT}/meta.json', 'w'), default=float); print(len(meta['poses']), 'poses', len(meta['fx']), 'fx')
