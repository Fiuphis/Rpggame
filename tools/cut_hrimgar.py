# Recorta as poses do Hrimgar das folhas de fundo branco (3x2 por folha) -> assets/bosses/hrimgar/<id>.png + assets/bosses/hrimgar/meta.json
# uso: python3 tools/cut_hrimgar.py <pasta com s1.png..s13.png>
import sys, os, json, glob
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; OUT = 'assets/bosses/hrimgar'; SC = 2.0
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(OUT + '/*.png'): os.remove(f)
# folha -> prefixo, grade (colunas, linhas)
SHEETS = {1:'a', 2:'n', 3:'p', 4:'s', 6:'w', 8:'v', 10:'x'}
GRID = {4:(1, 1)}
S8 = ndi.generate_binary_structure(2, 2)
meta = {'poses': {}}
def cut(cell, name):
    c = cell.astype(np.float32); mn = c.min(2); mx = c.max(2); sat = mx - mn
    near = (mn >= 232) & (sat < 22)
    lab, n = ndi.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # buracos de fundo branco puro cercados pelo corpo (entre braço e tronco, dentro do X das espadas)
    pure = (mn >= 243) & (sat < 14); lp, kp = ndi.label(pure)
    for q in range(1, kp + 1):
        mm = lp == q
        if mm.sum() > 90: bg |= mm
    hole = bg.copy()
    fg = ~bg
    # só o maior componente (+ pedaços grandes) para tirar lixo
    l2, k = ndi.label(ndi.binary_dilation(fg, S8, iterations=2))
    if k == 0: return None
    sz = ndi.sum(fg, l2, range(1, k + 1)); keep = np.isin(l2, [i + 1 for i, s in enumerate(sz) if s > max(60, sz.max() * .004)])
    fg = fg & ndi.binary_dilation(keep, S8, iterations=1)
    fg = ndi.binary_fill_holes(ndi.binary_closing(fg, S8, iterations=1)) & ~(bg & ~ndi.binary_dilation(fg, S8, iterations=0))
    fg = fg & ~hole
    # suaviza a borda (1 px) para não ficar serrilhada em branco
    a = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), .7); a = np.clip((a - .35) / .4, 0, 1)
    ys, xs = np.where(fg); y0, y1, x0, x1 = ys.min() - 2, ys.max() + 3, xs.min() - 2, xs.max() + 3
    y0 = max(0, y0); x0 = max(0, x0); y1 = min(cell.shape[0], y1); x1 = min(cell.shape[1], x1)
    rgb = c[y0:y1, x0:x1]; al = a[y0:y1, x0:x1]
    col = np.clip((rgb - 255 * (1 - al[..., None])) / np.maximum(al[..., None], .2), 0, 255)
    pm = np.dstack([col * al[..., None], al * 255]).astype(np.float32)
    rs = cv2.resize(pm, (round(pm.shape[1] * SC), round(pm.shape[0] * SC)), interpolation=cv2.INTER_CUBIC)
    A2 = np.clip(rs[..., 3], 0, 255) / 255.; col2 = np.clip(rs[..., :3] / np.maximum(A2[..., None], .02), 0, 255)
    out = np.dstack([col2, A2 * 255]).astype(np.uint8)
    f = cv2.resize(fg[y0:y1, x0:x1].astype(np.uint8), (out.shape[1], out.shape[0]), interpolation=cv2.INTER_NEAREST) > 0
    lowy = np.where(f.any(1))[0]; gy = lowy.max() + 1
    band = f[max(0, gy - 80):gy]; yy, xx = np.where(band); cx = float(np.median(xx))
    # centro horizontal do corpo: mediana das colunas ocupadas na faixa dos pés
    return out, {'w': int(out.shape[1]), 'h': int(out.shape[0]), 'cx': cx, 'gy': float(gy), 'top': 0.0}
for sn, pre in SHEETS.items():
    im = np.array(Image.open(f'{SRC}/s{sn}.png').convert('RGB'))
    cols, rows = GRID.get(sn, (3, 2)); H, W = im.shape[:2]; cw, ch = W // cols, H // rows
    for i in range(cols * rows):
        r, cc = divmod(i, cols); cell = im[r * ch:(r + 1) * ch, cc * cw:(cc + 1) * cw]
        res = cut(cell, f'{pre}{i + 1}')
        if not res: continue
        out, m = res; name = f'{pre}{i + 1}'
        Image.fromarray(out, 'RGBA').save(f'{OUT}/{name}.png'); meta['poses'][name] = m
# joia da testa (brilho do elmo): cluster claro/ciano perto do centro da cabeca (topo do corpo, ignora pontas de espada)
for n, m in meta['poses'].items():
    a = np.array(Image.open(f'{OUT}/{n}.png')).astype(int); R, G, B, A = [a[..., i] for i in range(4)]
    op = A > 200; rows = op.sum(1); H = op.shape[0]
    ht = next((y for y in range(H) if rows[y] >= 70), 0)
    band = op[ht + int(.04 * H): ht + int(.14 * H)]
    if band.sum() < 50: continue
    hx = np.where(band)[1].mean(); m['gem'] = [float(hx), float(ht + .05 * H)]; m['hy'] = float(ht)
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
names = sorted(meta['poses'])
tw, th = 300, 360; cols = 7; rows = (len(names) + cols - 1) // cols
sheet = Image.new('RGBA', (cols * tw, rows * th), (70, 70, 90, 255))
from PIL import ImageDraw
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    p = Image.open(f'{OUT}/{n}.png'); m = meta['poses'][n]; sc = min((th - 30) / m['h'], (tw - 10) / m['w'])
    p2 = p.resize((max(1, int(p.width * sc)), max(1, int(p.height * sc)))); sheet.alpha_composite(p2, ((i % cols) * tw + (tw - p2.width) // 2, (i // cols) * th + th - 8 - p2.height)); d.text(((i % cols) * tw + 6, (i // cols) * th + 4), f"{n} {m['w']}x{m['h']}", fill=(255, 255, 0))
sheet.convert('RGB').save(sys.argv[2] if len(sys.argv) > 2 else '/tmp/hr_contact.png'); print(len(names), 'poses')
