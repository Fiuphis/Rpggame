# Padroniza o contorno da Maga: reduz a faixa escura externa (contorno original + halo da folha ampliada) para 2px em TODAS as poses do corpo
# e a repinta com a mesma cor (NAVY). Idempotente via flag 'thin'. Uso: python3 tools/thin_outline.py [espessura=2]
import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as ndi
D = 'mage3'; M = json.load(open(f'{D}/meta.json')); KEEP = int(sys.argv[1]) if len(sys.argv) > 1 else 2
NAVY = np.array([14, 12, 42], np.uint8)
SKIP = ('def', 'castdef', 'bh2')
for name, m in M['poses'].items():
    if m.get('thin') or name.startswith(SKIP[0]) or name in SKIP[1:]: continue
    im = np.array(Image.open(f'{D}/{name}.png').convert('RGBA')); rgb = im[..., :3].astype(int)
    solid = im[..., 3] >= 128
    grad = name in ('spin1', 'stars', 'spinwide', 'swingf', 'swingl', 'swingr')
    ringlike = solid & ((rgb.max(2) < 160) if grad else ((rgb.max(2) < 90) & ((rgb[..., 2] - rgb[..., 0]) < 50)))
    out = ~solid
    seed = ringlike & ndi.binary_dilation(out, iterations=1)
    depth = ndi.distance_transform_edt(np.pad(solid, 1))[1:-1, 1:-1]
    cap = 6 if grad else 5
    ys0 = np.where(solid.any(1))[0]; b0 = ys0.max()
    for _p in range(2 if grad else 1):
        solid = im[..., 3] >= 128; rgb = im[..., :3].astype(int)
        ringlike = solid & ((rgb.max(2) < 160) if grad else ((rgb.max(2) < 90) & ((rgb[..., 2] - rgb[..., 0]) < 50)))
        depth = ndi.distance_transform_edt(np.pad(solid, 1))[1:-1, 1:-1]
        seed = ringlike & ndi.binary_dilation(~solid, iterations=1)
        ring = ndi.binary_propagation(seed, mask=ringlike & (depth <= cap))
        D_ = np.where(ring, np.ceil(depth), 0); MD = ndi.maximum_filter(D_, size=7)
        rem = ring & (MD >= D_ + KEEP)
        im[rem] = 0
        left = ring & ~rem; im[left, :3] = NAVY
    solid2 = im[..., 3] >= 128; ys1 = np.where(solid2.any(1))[0]; b1 = ys1.max()
    m['gy'] = float(m['gy']) - (b0 - b1)
    m['thin'] = True
    Image.fromarray(im).save(f'{D}/{name}.png')
json.dump(M, open(f'{D}/meta.json', 'w'), default=float)
