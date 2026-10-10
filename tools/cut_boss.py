# Recorta as 12 poses do BOSS da folha 3 (fundo xadrez falso) -> assets/bosses/lorde/B_1..B_12.png + assets/bosses/lorde/meta.json (escala 2x, pés ancorados)
import numpy as np, json, os, cv2, glob
from PIL import Image
from scipy import ndimage as ndi
SRC = '/root/.claude/uploads/3a96d84d-702c-52a6-9324-e85ba38ea593/ffa7b21f-image.png'
OUT = 'assets/bosses/lorde'; SC = 2.0
S8 = ndi.generate_binary_structure(2, 2)
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(OUT + '/B_*.png'): os.remove(f)
im = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W = im.shape[:2]; cw, chh = W // 4, H // 3
meta = {'poses': {}}
for idx in range(12):
    r, c = divmod(idx, 4); x0, y0 = c * cw, r * chh
    cell = im[y0:y0 + chh, x0:x0 + cw].copy()
    mn = cell.min(2); mx = cell.max(2); sat = mx - mn
    a = np.where(mn < 150, 1.0, np.clip((sat - 24) / 90.0, 0, 1))
    a = np.where((mn >= 150) & (mn < 215) & (sat < 24), np.clip((215 - mn) / 65.0, 0, 1) * .0, a)
    fg = a > .05
    lab, n = ndi.label(ndi.binary_dilation(fg, S8, iterations=3))
    if n == 0: continue
    sz = ndi.sum(fg, lab, range(1, n + 1)); main = np.argmax(sz) + 1
    keep = ndi.binary_dilation(lab == main, S8, iterations=4) & fg
    # buracos pequenos dentro da silhueta: preenche
    filled = ndi.binary_fill_holes(ndi.binary_closing(keep, S8, iterations=2))
    holes = filled & ~keep; hl, hn = ndi.label(holes)
    for k in range(1, hn + 1):
        m = hl == k
        if m.sum() < 500 and (cell[m].min(1) < 200).mean() > .9: a[m] = 1.0; keep |= m
    a = a * keep
    dark = keep & (mn < 110) & (cell[..., 0] < 140)
    ys, xs = np.where(a > .5); ya, xa = np.where(keep)
    bx0, bx1, by0, by1 = xa.min(), xa.max() + 1, ya.min(), ya.max() + 1
    pad = 4; bx0 = max(0, bx0 - pad); by0 = max(0, by0 - pad); bx1 = min(cw, bx1 + pad); by1 = min(chh, by1 + pad)
    rgb = cell[by0:by1, bx0:bx1]; al = a[by0:by1, bx0:bx1]
    # cor desmultiplicada contra branco
    rgbu = np.clip((rgb - 255 * (1 - al[..., None])) / np.maximum(al[..., None], .1), 0, 255)
    pm = np.dstack([rgbu * al[..., None], al * 255]).astype(np.float32)
    nw, nh = round((bx1 - bx0) * SC), round((by1 - by0) * SC)
    rs = cv2.resize(pm, (nw, nh), interpolation=cv2.INTER_CUBIC)
    A = np.clip(rs[..., 3], 0, 255) / 255.
    col = np.clip(rs[..., :3] / np.maximum(A[..., None], .02), 0, 255)
    out = np.dstack([col, A * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(f'{OUT}/B_{idx + 1}.png')
    # âncora: corpo escuro (armadura) na metade inferior
    dd = dark[by0:by1, bx0:bx1]; yy, xx = np.where(dd)
    gy = (np.percentile(yy, 99.5) + 1) * SC
    low = yy > np.percentile(yy, 55)
    cx = float(np.median(xx[low])) * SC
    top = float(np.percentile(yy, .3)) * SC
    meta['poses'][f'B_{idx + 1}'] = {'w': nw, 'h': nh, 'cx': cx, 'gy': float(gy), 'top': top}
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
# contato
sheet = Image.new('RGBA', (4 * 520, 3 * 640), (70, 70, 80, 255))
for i in range(12):
    p = Image.open(f'{OUT}/B_{i + 1}.png'); m = meta['poses'][f'B_{i + 1}']
    ox = (i % 4) * 520 + 260 - int(m['cx']); oy = (i // 4) * 640 + 600 - int(m['gy'])
    sheet.alpha_composite(p, (max(0, ox), max(0, oy)))
sheet.convert('RGB').resize((1040, 960)).save('/tmp/claude-0/-home-claude-rpggame/3a96d84d-702c-52a6-9324-e85ba38ea593/scratchpad/boss_contact.png')
print({k: (v['w'], v['h'], round(v['gy'] - v['top'])) for k, v in meta['poses'].items()})
