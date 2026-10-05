# Regrava linhas de texto desenhadas nos menus (menu_*.png) que mudaram de regra. Roda uma vez sobre os PNGs atuais.
import numpy as np
from PIL import Image, ImageDraw, ImageFont
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def patch(name, box, new, size=None, center=False, fgmin=120):
    im = Image.open(f'menu_{name}.png').convert('RGBA'); a = np.array(im)
    x0, y0, x1, y1 = box; reg = a[y0:y1, x0:x1, :3].astype(int)
    bg = np.array(np.median(np.concatenate([reg[:2].reshape(-1,3), reg[-2:].reshape(-1,3)]), axis=0), dtype=np.uint8)
    lum = reg.sum(2); fg_mask = lum > lum.min() + 200
    ys, xs = np.where(fg_mask); tx0, tx1, ty0, ty1 = xs.min() + x0, xs.max() + x0 + 1, ys.min() + y0, ys.max() + y0 + 1
    sel = reg[fg_mask]; fg = tuple(int(v) for v in np.median(sel[sel.sum(1) > np.percentile(sel.sum(1), 60)], axis=0))
    h = ty1 - ty0; old_w = tx1 - tx0
    a[y0:y1, x0:x1, :3] = bg
    im = Image.fromarray(a); d = ImageDraw.Draw(im)
    # tamanho: casa a largura por caractere do texto original (mono ~0.602*size)
    sz = size or 17
    f = ImageFont.truetype(FONT, sz)
    bb = d.textbbox((0, 0), new, font=f)
    px = (x0 + x1) // 2 - (bb[2] - bb[0]) // 2 if center else tx0
    py = (ty0 + ty1) // 2 - (bb[3] + bb[1]) // 2 + 1
    d.text((px, py), new, font=f, fill=fg + (255,))
    im.save(f'menu_{name}.png'); print(name, new, (tx0, ty0, tx1, ty1), fg, sz)
import sys
patch('mage', (262, 302, 590, 326), '4x de dano (ataque próprio)', 17)
patch('mage', (386, 346, 603, 364), 'recarga 1 difícil', 15, center=True)
patch('mage', (795, 454, 1140, 477), 'Barreira de mana. Corta 35% dano.', 17)
patch('tank', (270, 596, 620, 620), 'Ergue o escudo. Corta 65% do dano.', 16)
patch('tank', (270, 446, 600, 468), '2x o dano; desnorteia o boss.', 16)
patch('tank', (468, 490, 550, 506), 'RECARGA 3', 14, center=True)
patch('tank', (270, 596, 620, 620), 'Ergue o escudo. Corta 75% do dano.', 16)   # v94
patch('cleriga', (280, 568, 600, 592), '1,3x de defesa contra demônios.', 16)   # v94
