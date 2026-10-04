"""Gera menu_target.png (moldura da escolha de alvo, derivada de menu_elem.png) e tp_<heroi>.png (retratos).
Uso: python3 tools/make_target.py   (rodar na raiz do repo)"""
from PIL import Image
import random
random.seed(5)
BG = (3, 4, 15, 252)
im = Image.open('menu_elem.png').convert('RGBA')
W, H = im.size   # 1280x757

def fill(box, col=BG):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            im.putpixel((x, y), col)

def tile(box, src):
    sx0, sy0, sx1, sy1 = src
    sw, sh = sx1 - sx0, sy1 - sy0
    x0, y0, x1, y1 = box
    base = im.copy()
    for y in range(y0, y1):
        for x in range(x0, x1):
            im.putpixel((x, y), base.getpixel((sx0 + (x - x0) % sw, sy0 + (y - y0) % sh)))

# --- barra do titulo: apaga "Escolha um elemento" e as caixas roxas (fica so a ampulheta)
tile((135, 141, 1076, 204), (490, 146, 630, 199))

# --- cartoes: [x, y, w, h]
C = {'fire': (110, 234, 524, 135), 'water': (651, 234, 532, 135),
     'air': (110, 385, 524, 133), 'earth': (651, 385, 532, 133), 'back': (110, 532, 524, 134)}

def clean(c):
    x, y, w, h = c
    fill((x + 132, y + 16, x + w - 16, y + h - 16))                    # texto
    fill((x + 41, y + 22, x + 106, y + 113))                           # icone (faixa central)
    fill((x + 25, y + 33, x + 122, y + 100))                           # icone (laterais, sem os cantos)
for c in C.values(): clean(c)

def crop(c): return im.crop((c[0], c[1], c[0] + c[2], c[1] + c[3]))
cards = {k: crop(v) for k, v in C.items()}

# --- nova ordem (2x2): Maga azul, Guerreiro laranja, Tanque dourado, Claeriga prata
def put(img, c):
    x, y, w, h = c
    im.paste(img.resize((w, h), Image.NEAREST) if img.size != (w, h) else img, (x, y))
put(cards['water'], C['fire'])      # topo-esq  = azul
put(cards['fire'], C['water'])      # topo-dir  = laranja
put(cards['earth'], C['air'])       # meio-esq  = dourado
put(cards['back'], C['earth'])      # meio-dir  = prata

# --- linha 3: cartao largo (nota) a partir do cartao verde-agua: metade esquerda + espelho
teal = cards['air']
x0, y0, tw, th = 110, 532, 1073, 134
tw_l = 262
left = teal.crop((0, 0, tw_l, teal.height)).resize((tw_l, th), Image.NEAREST)
wide = Image.new('RGBA', (tw, th))
wide.paste(left, (0, 0))
wide.paste(left.transpose(Image.FLIP_LEFT_RIGHT), (tw - tw_l, 0))
col = left.crop((tw_l - 1, 0, tw_l, th))
for x in range(tw_l, tw - tw_l): wide.paste(col, (x, 0))
im.paste(wide, (x0, y0))
fill((1052, 543, 1166, 655))   # apaga o icone espelhado da direita
im.save('menu_target.png', optimize=True)
print('menu_target.png', im.size)

# --- retratos (caixas quadradas em torno do rosto)
BOX = {'mage': (240, 290, 940, 990), 'knight': (230, 110, 930, 810),
       'tank': (230, 190, 930, 890), 'assassin': (210, 20, 970, 780)}
for k, b in BOX.items():
    p = Image.open(f'char_{k}.webp').convert('RGBA')
    bg = Image.new('RGBA', p.size, (7, 8, 20, 255)); bg.alpha_composite(p)
    f = bg.crop(b).convert('RGB').resize((64, 64), Image.BOX)
    f = f.quantize(40, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGBA')
    f.save(f'tp_{k}.png', optimize=True)
print('retratos ok')
