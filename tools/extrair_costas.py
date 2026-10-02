# Recorta as poses de costas da Maga e os efeitos (folha 2) -> mage/*.png, mage/meta.json, fx/*.png
import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]
im = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
nonwhite = im.min(2) < 232
S = 2.25
MULT = {'fire':1.3,'water':1.3,'air':1.3,'earth':1.3,'def':1.2}   # poses desenhadas menores na folha
BOXES = {'atk1':(8,606,82,785),'atk2':(82,606,160,785),'atk3':(160,624,252,785),'fire':(328,684,404,785),'water':(466,682,540,785),'air':(602,686,656,785),'earth':(734,692,788,785),'def':(878,640,948,785),'defbubble':(954,605,1080,790)}
POSES = {  # nome: (seed x,y)
 'idle1':(50,540),'idle2':(130,540),'idle3':(220,540),'idle4':(300,537),
 'walk1':(415,525),'walk2':(495,510),'walk3':(560,525),'walk4':(630,525),'walk5':(700,525),
 'run1':(798,535),'run2':(883,525),'run3':(963,520),'run4':(1068,525),
 'dodge1':(1183,535),'dodge2':(1298,525),'dodge3':(1383,525),'dodge4':(1473,525),
 'atk1':(45,725),'atk2':(120,730),'atk3':(200,725),
 'fire':(365,740),'water':(495,735),'air':(625,735),'earth':(760,735),
 'def':(918,715),'defbubble':(1013,740),'deffire':(1138,740),'defwater':(1243,740),'defair':(1353,740),'defearth':(1468,735),
 'bh1':(50,945),'bh2':(140,950),'bh4':(300,945),
}
def alpha_rgba(c, lo=207, hi=252, soft=False):
    m = c.min(2); a = np.clip((hi - m)/(hi - lo), 0, 1)
    col = np.clip((c - 255*(1-a[...,None]))/np.maximum(a[...,None], .08), 0, 255)
    return np.dstack([col, a*255]).astype(np.uint8), a
def clean(arr):                                    # remove brilho branco das bordas por unpremultiply (já feito) e corta
    ys, xs = np.where(arr[...,3] > 8); return arr[ys.min():ys.max()+1, xs.min():xs.max()+1], (xs.min(), ys.min())
d = ndi.binary_dilation(nonwhite, iterations=2)
lab, n = ndi.label(d)
meta = {}
for name, (sx, sy) in POSES.items():
    if name in BOXES:
        bx0, by0, bx1, by1 = BOXES[name]; box = np.zeros_like(nonwhite); box[by0:by1, bx0:bx1] = True
        mask = box & ndi.binary_dilation(nonwhite, iterations=1)
        ys, xs = np.where(mask); x0, x1, y0, y1 = xs.min(), xs.max()+1, ys.min(), ys.max()+1
        c = im[y0:y1, x0:x1].copy(); c[~mask[y0:y1, x0:x1]] = 255
        rgba, a = alpha_rgba(c)
        ys2, xs2 = np.where(a > .03); ax = int(xs2.min()), int(ys2.min()), int(xs2.max())+1, int(ys2.max())+1
        rgba = rgba[ax[1]:ax[3], ax[0]:ax[2]]; a = a[ax[1]:ax[3], ax[0]:ax[2]]
        h, w = a.shape; low = a[int(h*.6):]; cxs = (low.sum(0) * np.arange(w)).sum() / max(low.sum(), 1)
        meta[name] = {'ox': int(x0 + ax[0]), 'oy': int(y0 + ax[1]), 'w': w, 'h': h, 'cx': float(cxs)}
        k = S * MULT.get(name, 1); img = Image.fromarray(rgba, 'RGBA').resize((round(w*k), round(h*k)), Image.LANCZOS); img.save(f'mage/{name}.png'); meta[name].update(w=img.width, h=img.height, cx=cxs*k, k=k)
        continue
    l = lab[sy-3:sy+4, sx-3:sx+4]; l = l[l > 0]
    if not len(l): print('sem componente', name); continue
    l = np.bincount(l).argmax(); mask = ndi.binary_dilation(lab == l, iterations=2)
    ys, xs = np.where(mask); x0, x1, y0, y1 = xs.min(), xs.max()+1, ys.min(), ys.max()+1
    c = im[y0:y1, x0:x1].copy(); c[~mask[y0:y1, x0:x1]] = 255
    rgba, a = alpha_rgba(c)
    ys2, xs2 = np.where(a > .03); ax = int(xs2.min()), int(ys2.min()), int(xs2.max())+1, int(ys2.max())+1
    rgba = rgba[ax[1]:ax[3], ax[0]:ax[2]]; a = a[ax[1]:ax[3], ax[0]:ax[2]]
    h, w = a.shape
    low = a[int(h*.6):]; cxs = (low.sum(0) * np.arange(w)).sum() / max(low.sum(), 1)    # centro da barra
    # topo-esquerda do recorte na folha (para posicionar efeitos): guardado
    meta[name] = {'ox': int(x0 + ax[0]), 'oy': int(y0 + ax[1]), 'w': w, 'h': h, 'cx': float(cxs)}
    img = Image.fromarray(rgba, 'RGBA'); img = img.resize((round(w*S), round(h*S)), Image.LANCZOS)
    img.save(f'mage/{name}.png'); meta[name].update(w=img.width, h=img.height, cx=cxs*S, k=S)
for name in meta:
    p = np.asarray(Image.open(f'mage/{name}.png').convert('RGBA')).astype(int)
    if name.startswith('def') and name != 'def' or name in ('fire','water','air','earth'): meta[name]['orb'] = None; continue
    m = (p[...,3] > 200) & (p[...,2] > 225) & (p[...,0] < 150) & (p[...,1] > 110)
    l2, n2 = ndi.label(ndi.binary_dilation(m, iterations=3))
    if n2 == 0: meta[name]['orb'] = None; continue
    sz = ndi.sum(m, l2, range(1, n2+1)); k = int(np.argmax(sz)) + 1
    if sz[k-1] < 30: meta[name]['orb'] = None; continue
    ys, xs = np.where((l2 == k) & m); meta[name]['orb'] = [float(xs.mean()), float(ys.mean())]
json.dump({'S': S, 'poses': meta}, open('mage/meta.json', 'w'))
# ----- efeitos (caixas na folha). tipo: 'add' (brilho) ou 'norm'
FX = {
 'fire_orb':((370,640,404,674),'add'), 'fireball':((402,686,446,768),'add'), 'fire_burst':((805,895,867,967),'add'), 'fire_flame':((975,905,1032,964),'add'),
 'water_orb':((505,640,548,668+4),'add'), 'water_pillar':((540,662,588,770),'add'), 'water_orb2':((764,855,820,910),'add'),
 'air_swirl':((668,636,712,768),'add'), 'air_swirl2':((1090,824,1192,914),'add'), 'air_ring':((1100,915,1190,990),'add'),
 'earth_orb':((776,645,806,678),'norm'), 'earth_spikes':((802,708,862,778),'norm'), 'earth_big':((1293,823,1368,912),'norm'), 'rocks':((1272,916,1368,998),'norm'), 'boulder':((1203,916,1266,998),'norm'),
 'shield_blue':((1155,930,1194,996),'add'),
 'bh_hole':((1366,814,1526,996),'norm'), 'bh_hole2':((366,855,476,972),'norm'), 'bh_spike':((470,820,526,968),'norm'), 'bh_orb':((378,820,418,856),'norm'),
 'air_orb':((598,640,642,682),'add'), 'atk_orb':((242,655,275,700),'add'), 'atk_bolt':((245,630,318,776),'add'),
}
for k, ((x0, y0, x1, y1), mode) in FX.items():
    c = im[y0:y1, x0:x1]
    if mode == 'add':
        m = c.min(2); a = np.clip((250 - m)/130, 0, 1)**.8
        col = np.clip((c - 255*(1-a[...,None]))/np.maximum(a[...,None], .05), 0, 255); out = np.dstack([col, a*255])
    else:
        out, a = alpha_rgba(c, 190, 250)
    out = out.astype(np.uint8); ys, xs = np.where(out[...,3] > 10)
    if not len(ys): print('vazio', k); continue
    Image.fromarray(out[ys.min():ys.max()+1, xs.min():xs.max()+1], 'RGBA').save(f'fx/{k}.png')
    FX[k] = (FX[k][0], mode, int(x0 + xs.min()), int(y0 + ys.min()), int(xs.max()-xs.min()+1), int(ys.max()-ys.min()+1))
json.dump({k: v[2:] for k, v in FX.items() if len(v) > 2}, open('fx/meta.json', 'w'))
print('ok', len(meta), 'poses')
