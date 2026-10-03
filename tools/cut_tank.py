# Recorta as poses do TANQUE (folha c, fundo xadrez branco/cinza) -> tank/*.png + tank/meta.json
# mesma escala (corpo da pose neutra = BODY_H), ancoradas pelo centro dos pés, borda fina escura (OUT px) só no corpo (efeitos ficam sem borda).
import numpy as np, json, os, sys, shutil, cv2
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
import boxes_tank as B
SRC = '/root/.claude/uploads/3a96d84d-702c-52a6-9324-e85ba38ea593/e49fa76c-image.png'
OUTD = 'tank'; BODY_H = float(os.environ.get('BODY_H', 262)); RING = 2
NAVY = np.array([22, 14, 30], np.float32)
BOX = {**B.C, **B.C2}
BOX['t1'] = (3, 558, 148, 732); BOX['t2'] = (148, 560, 356, 742)
BOX['n2'] = (457, 84, 598, 252); BOX['n3'] = (498, 60, 702, 252); BOX['h3'] = (1040, 50, 1162, 276); BOX['n4'] = (673, 90, 826, 252)
MASK = {'t3':[(356, 520, 505, 572)], 'n2':[(500, 60, 600, 120)], 'n3':[(497, 125, 598, 252), (672, 85, 720, 140)]}
S4 = ndi.generate_binary_structure(2, 1); S8 = ndi.generate_binary_structure(2, 2)
IM = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)

def process(name):
    x0, y0, x1, y1 = BOX[name]; c = IM[y0:y1, x0:x1].copy(); h, w = c.shape[:2]
    mn = c.min(2); mx = c.max(2); sat = mx - mn
    bgm = (mn >= 224) & (sat < 16)
    fg = ~bgm
    for (a, b, cc, d) in MASK.get(name, []):
        fg[max(0, b - y0):max(0, d - y0), max(0, a - x0):max(0, cc - x0)] = False
    fg = ndi.binary_opening(fg, S4) | (fg & (mn < 120))
    dark = fg & (mn < 150)
    lab, k = ndi.label(ndi.binary_dilation(dark, S8, iterations=2) & fg)
    sz = ndi.sum(dark, lab, range(1, k + 1)); main = lab == (int(np.argmax(sz)) + 1)
    core = ndi.binary_fill_holes(ndi.binary_closing(main & dark, S8, iterations=2)) & ~bgm & fg
    core = ndi.binary_opening(core, S4)
    g, kg = ndi.label(ndi.binary_dilation(fg, S8, iterations=3))
    near = ndi.binary_dilation(core, S8, iterations=10)
    keep = np.zeros(kg + 1, bool)
    for i in range(1, kg + 1):
        m = g == i; ar = int((m & fg).sum()); edge = m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()
        if (m & near).any() or (ar >= 40 and not edge): keep[i] = True
    reg = keep[g] & fg
    a = np.clip((250 - mn) / 65.0, 0, 1) * reg
    a[core] = 1.0
    # franja clara na beirada do corpo
    fr = ndi.binary_dilation(core, S8, iterations=2) & ~core
    a[fr & (sat < 28) & (mn > 200)] = 0
    rgb = np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255)
    rgb[a < .02] = 0
    return rgb, a, core

def feet_stats(a, core):
    ys, xs = np.where(core); gy = ys.max() + 1; top = ys.min()
    band = core[int(max(top, gy - .16 * (gy - top))):gy]; bx = np.where(band)[1]
    return float(bx.mean()), float(gy), float(top)

def scale_img(rgb, a, core, s):
    h, w = a.shape; nw, nh = max(1, round(w * s)), max(1, round(h * s))
    pm = np.dstack([rgb * a[..., None], a * 255]).astype(np.float32)
    r = cv2.resize(pm, (nw, nh), interpolation=cv2.INTER_LANCZOS4 if s < 1 else cv2.INTER_CUBIC)
    al = np.clip(r[..., 3], 0, 255) / 255.0
    col = np.clip(r[..., :3] / np.maximum(al[..., None] * 1.0, .03) * 1.0 / 1.0, 0, 255)
    col = np.clip(r[..., :3] / np.maximum(al[..., None], .03), 0, 255)
    cm = cv2.resize(core.astype(np.float32), (nw, nh), interpolation=cv2.INTER_LINEAR) > .5
    return col, al, cm

def outline(col, al, cm):
    body = cm | (al > .97)
    body = ndi.binary_opening(cm, S4) if False else cm
    ring = ndi.binary_dilation(body, S8, iterations=RING) & ~ndi.binary_dilation(body, S8, iterations=0) & (al < .9)
    ring &= ndi.binary_dilation(body, S8, iterations=RING)
    col = col.copy(); al = al.copy()
    col[ring] = NAVY; al[ring] = np.maximum(al[ring], 1.0)
    # anti-serrilhado do contorno externo: pixel de borda semi-transparente do corpo fica escuro
    edge = body & ~ndi.binary_erosion(body, S8, iterations=1)
    soft = edge & (al < 1)
    col[soft] = NAVY * .5 + col[soft] * .5; al[soft] = 1
    return col, al

def main(only=None):
    ref = process('i1'); cx, gy, top = feet_stats(ref[1], ref[2]); s0 = BODY_H / (gy - top); print('escala', s0, 'corpo ref', gy - top)
    if os.path.isdir(OUTD) and not only: shutil.rmtree(OUTD)
    os.makedirs(OUTD, exist_ok=True)
    meta = {'poses':{}, 'body_h':BODY_H}
    for name in BOX:
        if only and name not in only: continue
        rgb, a, core = process(name); cx, gy, top = feet_stats(a, core)
        col, al, cm = scale_img(rgb, a, core, s0); col, al = outline(col, al, cm)
        pad = RING + 2
        im = np.dstack([col, al * 255]).astype(np.uint8); im = np.pad(im, ((pad, pad), (pad, pad), (0, 0)))
        Image.fromarray(im, 'RGBA').save(f'{OUTD}/{name}.png')
        meta['poses'][name] = {'w':im.shape[1], 'h':im.shape[0], 'cx':cx * s0 + pad, 'gy':gy * s0 + pad, 'top':top * s0 + pad}
    p = f'{OUTD}/meta.json'
    if only and os.path.exists(p): old = json.load(open(p)); old['poses'].update(meta['poses']); meta = old
    json.dump(meta, open(p, 'w')); print(len(meta['poses']), 'poses')
if __name__ == '__main__': main(sys.argv[1:] or None)
