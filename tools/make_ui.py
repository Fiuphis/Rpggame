"""Gera molduras pixel-art 9-slice para os botoes/caixas simples do jogo.
ui_box.png, ui_chip.png, ui_chip_hi.png, ui_chip_red.png  (usar com border-image + image-rendering:pixelated)
Uso: python3 tools/make_ui.py   (raiz do repo)"""
from PIL import Image
import random
random.seed(21)
IRON = (7, 5, 14, 255); IRON2 = (58, 46, 82, 255)
G = (176, 138, 60, 255); GL = (240, 206, 120, 255); GD = (104, 76, 28, 255)

def frame(name, W, H, cut, top, bot, hl, sh, brackets=False, grain=0.0):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    def inside(x, y, m=0):
        if not (m <= x < W - m and m <= y < H - m): return False
        cx = min(x - m, W - 1 - m - x); cy = min(y - m, H - 1 - m - y)
        return not (cx + cy < cut and cx < cut and cy < cut)
    for y in range(H):
        for x in range(W):
            if not inside(x, y): continue
            if not inside(x, y, 1):                      # contorno de ferro
                im.putpixel((x, y), IRON); continue
            if not inside(x, y, 2):                      # ferro claro
                im.putpixel((x, y), IRON2); continue
            if not inside(x, y, 3):                      # filete dourado: luz em cima/esquerda, sombra embaixo/direita
                im.putpixel((x, y), hl if (y <= H // 2 and (x <= W // 2 or y < 4)) else sh); continue
            if not inside(x, y, 4):                      # sulco escuro
                im.putpixel((x, y), IRON); continue
            t = (y - 4) / max(1, H - 9)
            c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,)
            if grain and random.random() < grain: c = (c[0] + 5, c[1] + 4, c[2] + 10, 255)
            im.putpixel((x, y), c)
    if brackets:                                          # cantoneiras em L
        for (sx, sy, dx, dy) in [(5, 5, 1, 1), (W - 6, 5, -1, 1), (5, H - 6, 1, -1), (W - 6, H - 6, -1, -1)]:
            for k in range(0, 5):
                im.putpixel((sx + dx * k, sy), GL if k < 3 else G); im.putpixel((sx, sy + dy * k), G)
    im.save(name); print(name, im.size)

DARK = ((26, 20, 44), (11, 8, 22))
frame('ui_box.png', 32, 32, 4, *DARK, GL, GD, brackets=True, grain=.08)
frame('ui_chip.png', 24, 16, 3, (30, 24, 50), (13, 10, 26), G, GD)
frame('ui_chip_hi.png', 24, 16, 3, (66, 48, 24), (34, 22, 10), GL, G)
frame('ui_chip_red.png', 24, 16, 3, (72, 18, 32), (36, 8, 18), (214, 86, 96, 255), (126, 36, 52, 255))
