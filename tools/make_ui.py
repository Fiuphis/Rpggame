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

# ---- chips Tipo/Atributo (azul = tipo, roxo = demoniaco, cinza = normal) + icones 9x9 ----
frame('ui_chip_blue.png', 24, 16, 2, (22, 40, 78), (10, 18, 44), (120, 190, 255, 255), (36, 84, 150, 255))
def icon(name, rows, pal):
    im = Image.new('RGBA', (len(rows[0]), len(rows)), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in pal: im.putpixel((x, y), pal[ch])
    im.save(name); print(name, im.size)
ICON_SWORD = ['.......WW', '......WWS', '.....WWS.', '....WWS..', 'Y..WWS...', '.YWWS....', '..YY.....', '.BYY.....', 'B........']
icon('icon_chip_sword.png', ICON_SWORD, {'W': (244, 241, 255, 255), 'S': (154, 163, 194, 255), 'Y': (255, 197, 78, 255), 'B': (122, 74, 34, 255)})
FL = ['....R....', '...RR....', '...RRR.R.', '..RRORR..', '.RRRORRR.', '.RROYORR.', '.RROYORR.', '..RROORR.', '...RRRR..']
icon('icon_chip_demon.png', FL, {'R': (170, 60, 255, 255), 'O': (214, 130, 255, 255), 'Y': (250, 220, 255, 255)})
DM = ['....W....', '...WSW...', '..WSSSW..', '.WSSSSSW.', 'WSSSSSSSW', '.WSSSSSW.', '..WSSSW..', '...WSW...', '....W....']
icon('icon_chip_normal.png', DM, {'W': (244, 241, 255, 255), 'S': (154, 149, 184, 255)})
ST = ['....Y....', '....Y....', '...YWY...', 'YYYYWYYYY', '.YYWWWYY.', '..YWWWY..', '..YWYWY..', '.YY...YY.', '.Y.....Y.']
icon('icon_chip_elem.png', ST, {'Y': (255, 170, 60, 255), 'W': (255, 240, 190, 255)})

# ---- chip do tempo (verde) + ampulheta 7x9 ----
HG = ['WWWWWWW', '.TTTTT.', '..TTT..', '...T...', '...T...', '..T.T..', '.T.TT..', 'TTTTTTT', 'WWWWWWW']
icon('icon_chip_hourglass.png', HG, {'W': (120, 240, 205, 255), 'T': (61, 224, 176, 255)})
icon('icon_chip_hourglass_red.png', HG, {'W': (255, 140, 150, 255), 'T': (255, 83, 107, 255)})

# ---- molduras compactas (12x8, borda de 2 px: ferro + filete) para chips pequenos; usar com border-image-slice:2 ----
def cs(name, top, bot, line):
    W, H = 12, 8
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for y in range(H):
        for x in range(W):
            if (x in (0, W - 1)) and (y in (0, H - 1)): continue      # cantos chanfrados
            e = min(x, W - 1 - x, y, H - 1 - y)
            if e == 0: c = IRON
            elif e == 1: c = line
            else:
                t = (y - 2) / max(1, H - 5); c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,)
            im.putpixel((x, y), c)
    im.save(name); print(name)
cs('ui_cs_blue.png', (22, 40, 78), (10, 18, 44), (86, 150, 230, 255))
cs('ui_cs_purple.png', (52, 22, 84), (24, 10, 46), (170, 100, 235, 255))
cs('ui_cs_grey.png', (44, 42, 60), (22, 20, 34), (150, 146, 180, 255))
cs('ui_cs_green.png', (14, 52, 50), (6, 24, 28), (70, 210, 170, 255))
cs('ui_cs_red.png', (60, 14, 28), (30, 8, 16), (214, 70, 90, 255))
cs('ui_cs_gold.png', (50, 38, 18), (26, 18, 8), (214, 170, 70, 255))

FLM = ['....R....', '...RR....', '...RRR.R.', '..RRORR..', '.RRRORRR.', '.RROYORR.', '.RROYORR.', '..RROORR.', '...RRRR..']
icon('icon_chip_flame.png', FLM, {'R': (255, 110, 40, 255), 'O': (255, 180, 60, 255), 'Y': (255, 240, 170, 255)})
