# Efeitos de gelo do Hrimgar (folhas de fundo preto 3x2) -> assets/bosses/hrimgar/fx_*.png com alpha pelo brilho
import sys, numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]
NAMES = {11:['pillar','pillar2','pillarb','shards','shards2','frost'], 12:['sh1','sh2','sh3','flake','seal','blood'], 13:['sl1','sl2','sl3','slx','sl4','slline']}
meta = {}
for sn, names in NAMES.items():
    im = np.array(Image.open(f'{SRC}/s{sn}.png').convert('RGB')).astype(np.float32); H, W = im.shape[:2]; cw, ch = W // 3, H // 2
    for i, n in enumerate(names):
        r, c = divmod(i, 3); cell = im[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
        mx = cell.max(2); a = np.clip((mx - 18) / 60., 0, 1)
        m = a > .05; lab, k = ndi.label(ndi.binary_dilation(m, iterations=3))
        if k == 0: continue
        sz = ndi.sum(m, lab, range(1, k + 1)); keep = np.isin(lab, [j + 1 for j, s in enumerate(sz) if s > 25])
        a = a * ndi.binary_dilation(keep, iterations=2)
        ys, xs = np.where(a > .05); y0, y1, x0, x1 = max(0, ys.min() - 2), ys.max() + 3, max(0, xs.min() - 2), xs.max() + 3
        col = np.clip(cell / np.maximum(a[..., None], .08), 0, 255)
        out = np.dstack([col, a * 255]).astype(np.uint8)[y0:y1, x0:x1]
        Image.fromarray(out, 'RGBA').save(f'assets/bosses/hrimgar/fx_{n}.png'); meta[n] = [int(out.shape[1]), int(out.shape[0])]
json.dump(meta, open('assets/bosses/hrimgar/fx.json', 'w')); print(meta)
