# Efeitos extras da folha d do Tanque: espinho azul (anel e coluna), espinhos de terra, explosão de pedras -> tank/fx_*.png
import numpy as np, cv2, sys, os
from PIL import Image
from scipy import ndimage as ndi
IM = np.asarray(Image.open('/root/.claude/uploads/3a96d84d-702c-52a6-9324-e85ba38ea593/d6884b1c-image.png').convert('RGB')).astype(np.float32)
S8 = ndi.generate_binary_structure(2, 2)
def fx(name, box, sc=1.45):
    x0, y0, x1, y1 = box; c = IM[y0:y1, x0:x1]; mn = c.min(2); mx = c.max(2); sat = mx - mn
    a = np.maximum(np.clip((sat - 34) / 100., 0, 1), np.clip((196 - mn) / 70., 0, 1))
    a[(mn >= 200) & (sat < 40)] = 0
    m = a > .08; lab, k = ndi.label(ndi.binary_dilation(m, S8, iterations=2) & m)
    if k: sz = ndi.sum(m, lab, range(1, k + 1)); m = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v >= 60]); a = a * m
    ys, xs = np.where(a > .05); y0b, y1b, x0b, x1b = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb = np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .1), 0, 255)
    pm = np.dstack([rgb * a[..., None], a * 255])[y0b:y1b, x0b:x1b].astype(np.float32)
    r = cv2.resize(pm, (round(pm.shape[1] * sc), round(pm.shape[0] * sc)), interpolation=cv2.INTER_CUBIC)
    al = np.clip(r[..., 3], 0, 255) / 255.; col = np.clip(r[..., :3] / np.maximum(al[..., None], .03), 0, 255)
    Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA').save(f'tank/fx_{name}.png'); print(name, r.shape[:2][::-1])
fx('bring', (685, 1040, 832, 1172)); fx('bspike', (834, 1008, 938, 1172)); fx('earth', (944, 1012, 1118, 1172)); fx('rockburst', (1118, 1018, 1306, 1178))
