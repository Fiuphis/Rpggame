#!/usr/bin/env python3
"""Borda fina azul-marinho nas poses da Maga (assets/characters/mage/*.png, sem fx_*): cobre a linha branca residual do recorte. Rodar uma vez apos cut_maga4.py."""
import sys, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
D = sys.argv[1] if len(sys.argv) > 1 else 'assets/characters/mage'
NAVY = np.array([22, 16, 52], float)
for p in glob.glob(D + '/*.png'):
    if os.path.basename(p).startswith('fx_'): continue
    a = np.array(Image.open(p).convert('RGBA')).astype(float)
    A = a[..., 3] > 40
    inner = ndi.binary_erosion(A, iterations=2)
    ring = A & ~inner
    a[ring, :3] = a[ring, :3] * .25 + NAVY * .75
    a[ring, 3] = 255
    out = ndi.binary_dilation(A, iterations=1) & ~A
    a[out, :3] = NAVY; a[out, 3] = 255
    Image.fromarray(a.astype('uint8')).save(p)
