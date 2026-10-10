# Bau em pixel art detalhado (madeira gasta, ferro rebitado, fechadura). 4 quadros: fechado, abrindo 1, abrindo 2, aberto.
# Gera assets/items/chest_f0.png .. assets/items/chest_f3.png (48x40 ampliado 5x, sem suavizar)
from PIL import Image
import math, random
W, H, S = 48, 42, 5
def hsh(x, y, s=0):
    h = (x * 374761393 + y * 668265263 + s * 2147483647) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffff) / 65535.0
WOOD = ['#2b160a', '#4a2810', '#63391a', '#7d4a22', '#94602d', '#aa7a3c']   # escuro -> claro
IRON = ['#14121a', '#2c2a36', '#46435a', '#6b6882', '#9a97b0']
GOLD = ['#6b4a10', '#a47a1c', '#e8b83a', '#ffd966', '#fff2a8']
LINE = '#120a05'
class Cv:
    def __init__(s): s.im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); s.p = s.im.load()
    def put(s, x, y, c):
        if 0 <= x < W and 0 <= y < H: s.p[x, y] = tuple(int(c[i:i+2], 16) for i in (1, 3, 5)) + (255,)
    def rect(s, x, y, w, h, c):
        for j in range(h):
            for i in range(w): s.put(x + i, y + j, c)
def wood_px(x, y, x0, y0, w, h, seed, worn=0.0):
    # tabuas verticais com veios, rachaduras e desgaste
    plank = (x - x0) // 6
    u = (x - x0) % 6
    base = 3 + (1 if plank % 2 else 0)
    v = hsh(x // 1, y // 3, seed + plank)
    grain = 1 if hsh(x, y // 2, seed + 5 + plank) > .72 else 0
    t = base + grain - (1 if v < .22 else 0) + (1 if v > .85 else 0)
    if u == 0: t = 1                       # fresta entre tabuas
    if u == 1: t = max(t, 4)               # brilho na borda da tabua
    # sombra no topo e luz na parte mais alta
    dy = (y - y0) / max(1, h)
    t += 1 if dy < .12 else 0
    t -= 1 if dy > .88 else 0
    # rachaduras
    if hsh(x // 2, y, seed + 40) > .985: t = 0
    # desgaste: lascas claras e manchas escuras
    r = hsh(x, y, seed + 77)
    if r < worn * .5: t = 5
    elif r > 1 - worn * .6: t = 1
    return WOOD[max(0, min(5, t))]
def band(c, x, y, w, h, rivets=True):
    c.rect(x, y, w, h, IRON[2]); c.rect(x, y, w, 1, IRON[4]); c.rect(x, y + h - 1, w, 1, IRON[0])
    c.rect(x, y + 1, 1, h - 2, IRON[3]); c.rect(x + w - 1, y + 1, 1, h - 2, IRON[1])
    for j in range(h):
        for i in range(w):
            if hsh(x + i, y + j, 9) > .93: c.put(x + i, y + j, IRON[1])           # ferrugem/riscos
            elif hsh(x + i, y + j, 13) > .96: c.put(x + i, y + j, IRON[3])
    if rivets:
        for ry in range(y + 3, y + h - 2, 5):
            c.put(x + w // 2, ry, IRON[4]); c.put(x + w // 2, ry + 1, IRON[0])
def outline_box(c, x, y, w, h):
    c.rect(x - 1, y - 1, w + 2, 1, LINE); c.rect(x - 1, y + h, w + 2, 1, LINE)
    c.rect(x - 1, y, 1, h, LINE); c.rect(x + w, y, 1, h, LINE)
def body(c, glow=False, lid_gap=0):
    bx, by, bw, bh = 5, 22, 38, 19
    outline_box(c, bx, by, bw, bh)
    for y in range(by, by + bh):
        for x in range(bx, bx + bw): c.put(x, y, wood_px(x, y, bx, by, bw, bh, 3, .10))
    # sombra do chao
    for i in range(bw + 6): c.put(bx - 3 + i, by + bh + 1, '#00000055'[:7]) if False else None
    # bandas de ferro verticais nas pontas + horizontal no meio
    band(c, bx, by, 5, bh); band(c, bx + bw - 5, by, 5, bh)
    band(c, bx, by + 7, bw, 3, rivets=False)
    for rx in range(bx + 9, bx + bw - 8, 6): c.put(rx, by + 8, IRON[4])
    # pes
    c.rect(bx - 1, by + bh, 5, 1, LINE); c.rect(bx + bw - 4, by + bh, 5, 1, LINE)
def lock(c, cx, cy, open_=False):
    c.rect(cx - 3, cy - 1, 7, 9, LINE); c.rect(cx - 2, cy, 5, 7, GOLD[2]); c.rect(cx - 2, cy, 5, 1, GOLD[4]); c.rect(cx - 2, cy + 6, 5, 1, GOLD[0])
    c.rect(cx - 2, cy, 1, 7, GOLD[3]); c.rect(cx + 2, cy, 1, 7, GOLD[1])
    c.rect(cx, cy + 2, 1, 3, LINE)                    # buraco da chave
    c.put(cx - 1, cy + 2, LINE); c.put(cx + 1, cy + 2, LINE)
def lid_front(c, top, h):
    # tampa vista de frente, arqueada; top = y do topo, h = altura da face
    bx, bw = 5, 38
    for y in range(top, top + h):
        arc = 0
        if y - top < 4: arc = int((4 - (y - top)) * 1.6)   # cantos arredondados
        for x in range(bx + arc, bx + bw - arc): c.put(x, y, wood_px(x, y, bx, top, bw, h, 8, .14))
    # contorno
    for y in range(top, top + h):
        arc = int((4 - (y - top)) * 1.6) if y - top < 4 else 0
        c.put(bx + arc - 1, y, LINE); c.put(bx + bw - arc, y, LINE)
    for x in range(bx + 6, bx + bw - 6): c.put(x, top - 1, LINE)
    for i in range(1, 7):
        c.put(bx + 6 - i, top - 1 + int(i * .5) if False else top - 1 + (i // 2), LINE) if False else None
    band(c, bx, top, 5, h); band(c, bx + bw - 5, top, 5, h)
    band(c, bx + 12, top + 1, 3, h - 1, rivets=False); band(c, bx + bw - 15, top + 1, 3, h - 1, rivets=False)
def interior(c, y0, h, glow):
    bx, bw = 7, 34
    for y in range(y0, y0 + h):
        for x in range(bx, bx + bw):
            t = '#1a0608' if (x + y) % 5 else '#220a0c'
            c.put(x, y, t)
    if glow:
        for y in range(y0, y0 + h):
            for x in range(bx, bx + bw):
                d = abs(x - 24) / 17.0
                if hsh(x, y, 5) > d * .9: c.put(x, y, GOLD[3] if hsh(x, y, 6) > .5 else GOLD[2])
def coins(c):
    random.seed(4)
    for cx, cy in [(10, 24), (15, 22), (21, 23), (27, 21), (33, 23), (38, 24), (18, 25), (30, 25), (24, 22)]:
        c.rect(cx - 2, cy, 5, 3, GOLD[2]); c.rect(cx - 2, cy, 5, 1, GOLD[4]); c.rect(cx - 2, cy + 2, 5, 1, GOLD[0]); c.put(cx, cy + 1, GOLD[0])
    # joia
    c.rect(22, 19, 3, 3, '#ff4a5e'); c.put(22, 19, '#ffc0c8'); c.put(24, 21, '#8a1226')
def frame(n):
    c = Cv()
    if n == 0:
        body(c); lid_front(c, 9, 14); lock(c, 24, 18)
        # fita de metal sobre a juncao
        c.rect(5, 22, 38, 1, LINE)
    elif n == 1:   # entreaberto: fresta escura com brilho
        body(c); interior(c, 21, 2, True)
        lid_front(c, 6, 14); lock(c, 24, 15)
        c.rect(7, 20, 34, 1, GOLD[3])
    elif n == 2:   # tampa quase em pe (encurtada) mostrando o forro
        body(c); interior(c, 19, 4, True)
        # tampa vista de cima, encurtada
        lid_front(c, 3, 9)
        c.rect(7, 12, 34, 2, '#7a1a22'); c.rect(7, 12, 34, 1, '#a82a34')   # borda do forro aparecendo
        lock(c, 24, 7)
    else:          # aberto: tampa para tras, vista por dentro
        body(c); interior(c, 18, 5, True); coins(c)
        outline_box(c, 6, 1, 36, 14)
        for y in range(1, 15):
            for x in range(6, 42):
                t = '#5a1018' if (x + y) % 4 else '#6a1620'
                if y < 3 or x < 8 or x > 39: t = wood_px(x, y, 6, 1, 36, 14, 12, .14)
                if y == 3 and 8 <= x <= 39: t = '#a82a34'
                c.put(x, y, t)
        band(c, 6, 1, 5, 14); band(c, 37, 1, 5, 14)
        # estofado com botoes dourados
        for bx_ in range(14, 36, 6):
            for by_ in (7, 11): c.put(bx_, by_, GOLD[2]); c.put(bx_ + 1, by_, GOLD[0])
    return c.im
for n in range(4):
    frame(n).resize((W * S, H * S), Image.NEAREST).save(f'chest_f{n}.png')
