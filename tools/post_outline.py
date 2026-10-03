# Pós-processa mage3/*.png (poses): remove pontos brancos, pinta franjas claras de azul-escuro e adiciona contorno escuro de 1-2px.
import numpy as np, json, glob, os
from PIL import Image
from scipy import ndimage as ndi
D = 'mage3'; M = json.load(open(f'{D}/meta.json')); P = 3
NAVY = np.array([14, 12, 42], np.uint8)
for name, m in M['poses'].items():
    if m.get('outlined'): continue
    im = np.array(Image.open(f'{D}/{name}.png').convert('RGBA'))
    im = np.pad(im, ((P, P), (P, P), (0, 0)))
    a = im[..., 3].astype(int); rgb = im[..., :3].astype(int)
    near_orb = np.zeros(a.shape, bool)
    if m.get('orb'):
        ox, oy = m['orb'][0] + P, m['orb'][1] + P; yy, xx = np.mgrid[:a.shape[0], :a.shape[1]]; near_orb = (xx - ox) ** 2 + (yy - oy) ** 2 < 26 ** 2
    mn = rgb.min(2); sat = rgb.max(2) - mn; whitish = (mn > 140) & (sat < 70)
    solid = a >= 110
    # 1) componentes soltos pequenos
    l, k = ndi.label(a > 20)
    if k:
        ar = ndi.sum(np.ones_like(l), l, range(1, k + 1))
        for i in np.where(ar < 40)[0]:
            r = l == i + 1
            if not (r & near_orb).any(): im[r] = 0
        a = im[..., 3].astype(int)
    # 2) franja clara na borda (até 3px do fundo) e semitransparentes claros → azul-escuro
    lum = rgb.mean(2); fxpix = (rgb[..., 2] > 150) & (lum > 95) | (rgb[..., 0] > 200) & (rgb[..., 1] < 140)
    bodym = ndi.binary_opening((a >= 90) & (lum < 125) & ~fxpix, iterations=1)
    lb, kb = ndi.label(bodym)
    if kb: sb = ndi.sum(bodym, lb, range(1, kb + 1)); bodym = np.isin(lb, np.where(sb > 150)[0] + 1)
    nb = ndi.binary_dilation(bodym, iterations=4)
    semi = (a < 250) & (a > 0) & (lum < 100) & ~fxpix & ~near_orb
    im[..., 3][semi] = 0; a = im[..., 3].astype(int)
    gl = (sat < 30) & (lum < 100) & ~near_orb | (a == 0)
    lg, kg = ndi.label(gl); edgeids = set(np.unique(np.concatenate([lg[0], lg[-1], lg[:, 0], lg[:, -1]]))) - {0}
    flat = np.isin(lg, list(edgeids)) & (a > 0)
    im[..., 3][flat] = 0; a = im[..., 3].astype(int)
    gray = (a < 255) & (a > 0) & (sat < 38) & ~bodym & ~near_orb
    im[..., 3][gray] = 0; a = im[..., 3].astype(int)
    outside = a < 30; edge = ndi.binary_dilation(outside, iterations=3) & (a > 0) & nb
    e2 = ndi.binary_dilation(im[..., 3] < 200, iterations=3) & (a > 0) & nb
    pale = (((mn > 100) & (sat < 115) & (lum > 105)) | ((sat < 62) & (lum > 72))) & e2 & ~near_orb
    fr = (edge & whitish & ~near_orb) | pale
    # 3) pontos brancos internos pequenos (não do orbe)
    lw, kw = ndi.label(whitish & (a > 60))
    if kw:
        sz = ndi.sum(np.ones_like(lw), lw, range(1, kw + 1))
        for i in np.where(sz < 14)[0]:
            r = lw == i + 1
            if not (r & near_orb).any(): fr |= r
    im[..., :3][fr] = np.where(a[fr][:, None] > 0, np.array([24, 22, 66], np.uint8), 0)
    im[..., 3][fr & (a < 255) & (a > 0)] = np.maximum(a[fr & (a < 255) & (a > 0)], 200)
    # 4) contorno escuro (2px) fora do corpo, exceto junto ao orbe (brilho)
    body = bodym; solidall = im[..., 3] >= 90
    ring = ndi.binary_dilation(body, iterations=2) & ~solidall
    ring &= ~near_orb
    im[..., :3][ring] = NAVY; im[..., 3][ring] = 255
    # contorno suave externo (alpha parcial)
    ring2 = ndi.binary_dilation(body | ring, iterations=1) & ~solidall & ~ring & ~near_orb
    im[..., :3][ring2] = NAVY; im[..., 3][ring2] = 120
    Image.fromarray(im).save(f'{D}/{name}.png')
    m['w'] += 2 * P; m['h'] += 2 * P; m['cx'] += P; m['gy'] += P
    if m.get('orb'): m['orb'] = [m['orb'][0] + P, m['orb'][1] + P]
    m['outlined'] = True
json.dump(M, open(f'{D}/meta.json', 'w'), default=float)
