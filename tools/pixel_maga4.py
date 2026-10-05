#!/usr/bin/env python3
"""Pixeliza as poses da Maga (mesmo aspecto dos outros herois): reduz por K (caixa) e amplia sem suavizar, alfa binario. Uso: pixel_maga4.py PASTA_ORIGEM PASTA_DESTINO [K]. A borda azul-marinho ja e feita aqui (outline_maga4.py serve so para PNGs nao pixelados)."""
import sys, glob, os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
SRC, DST = sys.argv[1], sys.argv[2]; K = float(sys.argv[3]) if len(sys.argv) > 3 else 3
os.makedirs(DST, exist_ok=True); SIZES = {}
for p in glob.glob(SRC + '/*.png'):
    n = os.path.basename(p)
    im = Image.open(p).convert('RGBA')
    if n.startswith('fx_'): im.save(DST + '/' + n); continue
    w0, h0 = im.size; K = int(K); w, h = -(-w0 // K) * K, -(-h0 // K) * K   # completa ate multiplo de K (direita/baixo): grade uniforme
    if (w, h) != (w0, h0):
        pad = Image.new('RGBA', (w, h), (0, 0, 0, 0)); pad.paste(im, (0, 0)); im = pad
    sw, sh = w // K, h // K
    SIZES[n[:-4]] = (w, h)
    pm = im.copy(); pm.putdata([(r*a//255, g*a//255, b*a//255, a) for r, g, b, a in pm.getdata()])   # alfa pre-multiplicado p/ nao sujar a borda
    sm = pm.resize((sw, sh), Image.BOX); px = []
    for r, g, b, a in sm.getdata():
        px.append((min(255, r*255//a), min(255, g*255//a), min(255, b*255//a), 255) if a > 110 else (0, 0, 0, 0))
    sm.putdata(px); a = np.array(sm); A = a[..., 3] > 0
    ring = A & ~ndi.binary_erosion(A); a[ring, :3] = (a[ring, :3] * .3 + np.array([22, 16, 52]) * .7).astype('uint8')   # borda de 1 pixel da grade: tampa a linha branca
    out = ndi.binary_dilation(A) & ~A; a[out] = (22, 16, 52, 255)
    Image.fromarray(a).resize((w, h), Image.NEAREST).save(DST + '/' + n)

import json
mp = DST + '/meta.json'
if os.path.exists(mp):
    M = json.load(open(mp))
    for k, (w, h) in SIZES.items():
        if k in M['poses']: M['poses'][k]['w'], M['poses'][k]['h'] = w, h
    json.dump(M, open(mp, 'w'))
