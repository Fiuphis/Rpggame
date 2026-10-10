#!/usr/bin/env python3
"""Recorta a interface de gelo (fundo branco -> transparente): caixa de fala, painel de inventario/mercador e botao.
Uso: cut_ice_ui.py CAIXA.png PAINEL.png BOTAO.png  -> assets/ui/ice_cap.png, assets/ui/ice_panel.png, assets/ui/ice_button.png"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
def cut(src, dst, thr=238):
    a = np.array(Image.open(src).convert('RGB')).astype(int)
    m = a.min(2) >= thr
    lab, k = ndi.label(m); edge = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1]); edge.discard(0)
    bg = np.isin(lab, list(edge))
    # franja clara na borda do objeto (halo de antialias): remove pixels quase brancos encostados no fundo
    for _ in range(2):
        near = ndi.binary_dilation(bg, iterations=1) & ~bg & (a.min(2) >= 215) & ((a.max(2) - a.min(2)) <= 30)
        bg = bg | near
    al = (~bg).astype(np.float32); al = ndi.gaussian_filter(al, .6); al = np.clip((al - .35) / .5, 0, 1)
    im = Image.fromarray(np.dstack([a.clip(0, 255).astype(np.uint8), (al * 255).astype(np.uint8)]), 'RGBA')
    im = im.crop(im.getbbox()); im.save(dst); print(dst, im.size)
if __name__ == '__main__':
    for s, d in zip(sys.argv[1:4], ['assets/ui/ice_cap.png', 'assets/ui/ice_panel.png', 'assets/ui/ice_button.png']): cut(s, d)
