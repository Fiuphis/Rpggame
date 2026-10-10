# Recorta do mapa as caixas de interface (título, rosa dos ventos, legenda, frase) com máscara suave,
# para ficarem ACIMA das nuvens (assets/map/ui_*.webp). Coordenadas no mapa 1224x1285.
from PIL import Image, ImageDraw, ImageFilter
im = Image.open('assets/map/base.webp').convert('RGBA')
B = {'title': ('rect', 4, 10, 330, 242), 'legend': ('rect', 16, 1088, 320, 1264), 'quote': ('rect', 900, 1106, 1204, 1244), 'compass': ('circ', 1130, 92, 84)}
meta = {}
for k, v in B.items():
    if v[0] == 'rect': _, x0, y0, x1, y1 = v
    else: _, cx, cy, r = v; x0, y0, x1, y1 = cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6
    w, h = x1 - x0, y1 - y0; m = Image.new('L', (w * 4, h * 4), 0); d = ImageDraw.Draw(m)
    if v[0] == 'rect': d.rounded_rectangle([6 * 4, 6 * 4, (w - 6) * 4, (h - 6) * 4], radius=5 * 4, fill=255) if False else d.rounded_rectangle([4 * 2, 4 * 2, w * 4 - 4 * 2, h * 4 - 4 * 2], radius=6 * 4, fill=255)
    if k == 'title':   # tira o brasão do Castelo (e a placa do nome) — ficam com o mapa, abaixo das nuvens
        d.ellipse([(317 - 82 - x0) * 4, (157 - 74 - y0) * 4, (317 + 82 - x0) * 4, (157 + 74 - y0) * 4], fill=0); d.rectangle([(205 - x0) * 4, (221 - y0) * 4, w * 4, h * 4], fill=0)
    if v[0] != 'rect':
        import numpy as np
        yy, xx = np.mgrid[0:h, 0:w]; dd = np.hypot(xx - w / 2 + .5, yy - h / 2 + .5); a = np.clip((88 - dd) / 14, 0, 1)
        m = Image.fromarray((a * 255).astype('uint8'))
    if v[0] == 'rect': m = m.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.6))
    c = im.crop((x0, y0, x1, y1)); c.putalpha(m); c.save(f'assets/map/ui_{k}.webp', quality=92, method=6); meta[k] = [x0, y0, w, h]
print(meta)
