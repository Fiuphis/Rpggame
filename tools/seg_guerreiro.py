# Segmenta automaticamente as folhas do GUERREIRO (fundo xadrez): acha cada corpo (pixels escuros azul-marinho) e atribui
# cada pixel de primeiro plano ao corpo mais próximo (Voronoi) -> caixa + máscara por pose. Saída: /tmp/kn/seg.json + lab_K*.npy
import numpy as np, json, os, sys
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
U = '/root/.claude/uploads/3a96d84d-702c-52a6-9324-e85ba38ea593/'
SHEETS = {'K1':U+'5268c5ef-image.png', 'K2':U+'cb8132ea-image.png', 'K3':U+'78759ffb-image.png'}
S8 = ndi.generate_binary_structure(2, 2)
def load(n): return np.asarray(Image.open(SHEETS[n]).convert('RGB')).astype(np.float32)
def fgmask(c):
    mn = c.min(2); sat = c.max(2) - mn; fg = ~((mn >= 214) & (sat < 20))
    navy = (c[..., 2] > c[..., 0] + 5) & (c.max(2) < 95)
    lab, k = ndi.label(ndi.binary_dilation(navy, S8, iterations=1))
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
        if w > 110 and h < 75: fg[sl] &= ~ndi.binary_dilation(lab[sl] == i, S8, iterations=2)
    return ndi.binary_opening(fg, iterations=1)
def bodies(c, fg):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]; mn = c.min(2)
    dark = fg & (mn < 105) & (b >= r + 8) & (b > g)
    dark = ndi.binary_opening(dark, S8)
    lab, k = ndi.label(ndi.binary_dilation(dark, S8, iterations=3) & fg)
    sz = ndi.sum(dark, lab, range(1, k + 1)); keep = [i + 1 for i, v in enumerate(sz) if v >= 1400]
    out = np.zeros_like(lab)
    for j, i in enumerate(keep, 1): out[(lab == i) & dark] = j
    return out, len(keep)
def run():
    res = {}
    for n in SHEETS:
        c = load(n); fg = fgmask(c); bl, k = bodies(c, fg)
        d, idx = ndi.distance_transform_edt(bl == 0, return_indices=True)
        near = bl[idx[0], idx[1]]
        lab = np.where(fg & (d < 150), near, 0)
        np.save(f'/tmp/kn/lab_{n}.npy', lab.astype(np.int16))
        im = Image.open(SHEETS[n]).convert('RGB'); dr = ImageDraw.Draw(im); out = []
        for i, sl in enumerate(ndi.find_objects(lab), 1):
            if sl is None: continue
            m = lab[sl] == i; ys, xs = np.where(m)
            if m.sum() < 1200: continue
            box = [int(sl[1].start), int(sl[0].start), int(sl[1].stop), int(sl[0].stop)]
            out.append({'id':i, 'box':box, 'area':int(m.sum())}); dr.rectangle(box, outline=(255, 0, 0), width=2); dr.text((box[0] + 3, box[1] + 3), f'{n}_{i}', fill=(255, 0, 255))
        res[n] = out; im.save(f'/tmp/kn/{n}_seg.png'); print(n, len(out))
    json.dump(res, open('/tmp/kn/seg.json', 'w'))
if __name__ == '__main__': os.makedirs('/tmp/kn', exist_ok=True); run()
