# Recorta a folha de fundo BRANCO da Maga -> mage3/ (poses normalizadas + efeitos) + mage3/meta.json
import numpy as np, json, sys, os, shutil
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'mage3'
TARGET_H = 190.0                                    # altura do corpo (topo do chapéu → barra) no jogo, igual ao sprite parado
im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32); H, W = im.shape[:2]
nw = im.min(2) < 228
lab, n = ndi.label(ndi.binary_dilation(nw, iterations=2))
ids_all = np.arange(1, n + 1)

def alpha_white(c, lo=196., hi=250., g=.85):
    m = c.min(2); a = np.clip((hi - m) / (hi - lo), 0, 1) ** g
    col = np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255)
    return np.dstack([col, a * 255]).astype(np.uint8), a

def item(ids, xr=None, pad=2):
    m = np.isin(lab, ids)
    if xr: m[:, :xr[0]] = False; m[:, xr[1]:] = False
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min() - pad, ys.max() + 1 + pad, xs.min() - pad, xs.max() + 1 + pad
    c = im[y0:y1, x0:x1].copy(); mm = m[y0:y1, x0:x1]
    mm = ndi.binary_dilation(mm, iterations=1)
    c[~mm] = 255
    rgba, a = alpha_white(c)
    return rgba, (x0, y0, x1, y1), c

def navy_blob(c, a):
    lum = c.mean(2); sat = c.max(2) - c.min(2)
    nv = (a > .5) & (lum < 105) & (c[..., 2] >= c[..., 0] - 10) & (sat > 25) & (c[..., 2] < 200)
    nv = ndi.binary_closing(ndi.binary_opening(nv, iterations=1), iterations=3)
    l, k = ndi.label(nv)
    if k == 0: return None
    s = ndi.sum(nv, l, range(1, k + 1)); b = l == (np.argmax(s) + 1)
    ys, xs = np.where(b); return ys.min(), ys.max(), xs.min(), xs.max(), b

POSES = {   # nome: (ids, split x)
 'idle1':([159],None), 'idle2':([154],None), 'idle3':([160],None), 'idle4':([158],None),
 'walk1':([165],None), 'walk2':([162],None), 'walk3':([155],None), 'walk4':([156],None), 'walk5':([151],None),
 'run1':([163],None), 'run2':([152],None), 'run3':([164],None), 'run4':([166],None),
 'dodge1':([161],None), 'dodge2':([157],None), 'dodge3':([167],None), 'dodge4':([153],None),
 'atk1':([184],None), 'atk2':([194],(79, 160)), 'atk3':([194],(160, 250)),
 'fire':([208],(329, 409)), 'water':([202],(470, 543)), 'air':([204],(604, 667)), 'earth':([211],(736, 802)),
 'castdef':([190],(882, 943)), 'defmana':([190],(943, 1080)),
 'deffire':([213],None), 'defwater':([215],None), 'defair':([212],None), 'defearth':([199],None),
 'bh1':([293],None), 'bh2':([308],None),
}
FX = {      # efeitos soltos
 'comet':([200],None), 'orbb':([219],None), 'fire_fall':([201],None), 'water_pillar':([202],(543, 592)), 'air_swirl':([204],(667, 724)),
 'earth_spikes':([211],(802, 866)), 'rock':([205],None),
 'bh_small':([255],None), 'bh_spikes':([253],None), 'bh_big':([264],None), 'bh_big2':([265],None),
 'bolt':([289],(871, 968)), 'cross':([289],(968, 1052)), 'crystal':([276],None), 'whirl':([266],None),
 'mana_aura':([322],None), 'orb_red':([325],None), 'orb_orange':([328],None), 'orb_blue':([343],None), 'star_big':([331],None), 'star_small':([290],None),
 'ring_floor':([358],None), 'rocks':([332],None),
}
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
meta = {'target_h': TARGET_H, 'poses': {}, 'fx': {}}
scales = []
S0 = TARGET_H / 100.0                               # todas as células vêm da mesma folha: escala única (idle = 100px de corpo)
for name, (ids, xr) in POSES.items():
    rgba, box, c = item(ids, xr); a = rgba[..., 3] / 255.
    lum = c.mean(2); dark = (a > .6) & (lum < 125) & (c[..., 2] >= c[..., 0] - 12)
    h, w = a.shape
    cols = np.where(dark.sum(0) > 6)[0]
    ctr = (cols.min() + cols.max()) / 2 if len(cols) else w / 2
    sel = dark[:, int(max(0, ctr - w * .25)):int(min(w, ctr + w * .25))]
    rows = np.where(sel.sum(1) > 2)[0]; ground = rows.max() + 1
    band = dark[max(0, ground - 45):ground - 14]; cc = np.where(band.sum(0) > 0)[0]
    cx = (cc.min() + cc.max()) / 2 if len(cc) else ctr
    # tira o halo claro da borda do corpo: pixels semitransparentes junto ao corpo escuro ganham a cor escura mais próxima
    d2 = ndi.binary_dilation(dark, iterations=2); fr = (rgba[..., 3] < 250) & d2 & ~dark
    if fr.any():
        idx = ndi.distance_transform_edt(~dark, return_distances=False, return_indices=True)
        near = rgba[..., :3][idx[0], idx[1]]; rgba[..., :3][fr] = near[fr]
        rgba[..., 3][fr] = np.minimum(rgba[..., 3][fr], 200)
    cc = rgba[..., :3].astype(np.float32); ll = cc.mean(2); ss = cc.max(2) - cc.min(2)
    speck = (ll > 150) & (ss < 45) & ~ndi.binary_dilation(dark, iterations=1)
    rgba[..., 3][speck] = 0
    # restos soltos minúsculos (poeira) fora do corpo
    al = rgba[..., 3] > 60; l5, k5 = ndi.label(ndi.binary_dilation(al, iterations=1))
    if k5 > 1:
        sz5 = ndi.sum(al, l5, range(1, k5 + 1)); big = np.argmax(sz5) + 1
        for q in range(1, k5 + 1):
            if q != big and sz5[q - 1] < 18: rgba[..., 3][l5 == q] = 0
    img = Image.fromarray(rgba, 'RGBA'); img = img.resize((max(1, round(img.width * S0)), max(1, round(img.height * S0))), Image.LANCZOS)
    img.save(f'{OUT}/{name}.png')
    # orbe do cajado (para sair projétil): centro do maior brilho da cor certa no terço superior
    R, G, B, A_ = [rgba[..., k].astype(int) for k in range(4)]
    cls = {'fire': (R > 225) & (G < 130), 'air': (R > 165) & (G > 200) & (B > 232), 'earth': (R > 200) & (G > 110) & (G < 190) & (B < 120)}.get(name, (B > 215) & (R < 110) & (G > 110) & (G < 235))
    mk = cls & (A_ > 150); mk[int(h * .38):] = False
    lo_, kk = ndi.label(ndi.binary_dilation(mk, iterations=2)); orb = None
    if kk:
        sz_ = ndi.sum(mk, lo_, range(1, kk + 1)); q = int(np.argmax(sz_)) + 1
        if sz_[q - 1] >= 14:
            yy, xx = np.where(mk & (lo_ == q)); orb = [float(xx.mean() * S0), float(yy.mean() * S0)]
    meta['poses'][name] = {'w': img.width, 'h': img.height, 'cx': float(cx * S0), 'gy': float(ground * S0), 'orb': orb}
    print(f'{name:10s} out={img.width}x{img.height} cx={cx*S0:.0f} gy={ground*S0:.0f}')
meta['s0'] = S0
for name, (ids, xr) in FX.items():
    rgba, box, c = item(ids, xr)
    img = Image.fromarray(rgba, 'RGBA'); img = img.resize((max(1, round(img.width * S0)), max(1, round(img.height * S0))), Image.LANCZOS); img.save(f'{OUT}/fx_{name}.png')
    meta['fx'][name] = {'w': img.width, 'h': img.height}
json.dump(meta, open(f'{OUT}/meta.json', 'w'), default=float)
print('s0', S0)
