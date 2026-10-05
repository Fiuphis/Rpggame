# Efeitos soltos do guerreiro (arco de corte, espinhos de gelo, rochas) -> guerreiro/fx_*.png, sem borda, mesma escala do corpo
import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import cut_guerreiro as CK
FX = {'fx_slash':'K2_1', 'fx_ice':'K1_12', 'fx_spike':'K2_12', 'fx_rocksA':'K1_36', 'fx_rocksB':'K1_40', 'fx_slash2':'K2_11'}
os.makedirs('guerreiro', exist_ok=True)
for out, name in FX.items():
    rgb, a, core = CK.process(name); sh = name.split('_')[0]
    # efeito puro: sem 'núcleo' sólido, alpha só por saturação/escuridão
    mn = rgb.min(2)
    s = 1.9; import cv2
    pm = np.dstack([rgb * a[..., None], a * 255]).astype(np.float32)
    h, w = a.shape; r = cv2.resize(pm, (round(w * s), round(h * s)), interpolation=cv2.INTER_CUBIC)
    al = np.clip(r[..., 3], 0, 255) / 255.; col = np.clip(r[..., :3] / np.maximum(al[..., None], .03), 0, 255)
    ys, xs = np.where(al > .05)
    if len(ys) == 0: print('vazio', out); continue
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    im = np.dstack([col, al * 255]).astype(np.uint8)[y0:y1, x0:x1]
    Image.fromarray(im, 'RGBA').save(f'guerreiro/{out}.png'); print(out, im.shape)
