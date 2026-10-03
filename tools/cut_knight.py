# Recorta as poses do GUERREIRO (3 folhas, fundo xadrez) usando a segmentação de seg_knight.py -> knight/*.png + knight/meta.json
# Corpo (silhueta azul-marinho) em escala única (pose idle de referência = BODY_H), pés ancorados, borda fina escura (RING px) só no corpo.
import numpy as np, json, os, sys, shutil, cv2
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
import seg_knight as SK
import fxsoft
OUTD = os.environ.get('OUTD', 'knight'); BODY_H = float(os.environ.get('BODY_H', 256)); RING = 2
NAVY = np.array([22, 14, 30], np.float32)
S4 = ndi.generate_binary_structure(2, 1); S8 = ndi.generate_binary_structure(2, 2)
SEG = json.load(open('/tmp/kn/seg.json'))
IM = {n: SK.load(n) for n in SK.SHEETS}; FG = {n: SK.fgmask(IM[n]) for n in SK.SHEETS}; LAB = {n: np.load(f'/tmp/kn/lab_{n}.npy') for n in SK.SHEETS}
REF = {'K1': 'K1_2', 'K2': 'K2_3', 'K3': 'K3_4'}
AURA = set()
def region(name):
    sh, i = name.split('_'); i = int(i)
    for r in SEG[sh]:
        if r['id'] == i: return sh, i, r['box']
def process(name, pad=6):
    sh, i, (x0, y0, x1, y1) = region(name)
    x0 = max(0, x0 - pad); y0 = max(0, y0 - pad); x1 += pad; y1 += pad
    c = IM[sh][y0:y1, x0:x1].copy(); lab = LAB[sh][y0:y1, x0:x1]
    mask = ndi.binary_dilation(lab == i, S8, iterations=2) & (lab == i) | (lab == i)
    mn = c.min(2); mx = c.max(2); sat = mx - mn; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    fg = FG[sh][y0:y1, x0:x1] & mask
    dark = fg & (mn < 110) & ~(r > b + 30)
    dark = ndi.binary_opening(dark, S4)
    l2, k = ndi.label(ndi.binary_dilation(dark, S8, iterations=2) & fg)
    sz = ndi.sum(dark, l2, range(1, k + 1)); main = l2 == (int(np.argmax(sz)) + 1)
    core = ndi.binary_fill_holes(ndi.binary_closing(main & dark, S8, iterations=2)) & fg
    core = ndi.binary_opening(core, S4)
    reg = fg
    a = np.clip((250 - mn) / 65.0, 0, 1) * reg
    lt = reg & (mn >= 140)
    a_sat = np.clip((sat - 26) / 105.0, 0, 1)
    a = np.where(lt, np.maximum(a_sat, a * np.clip((sat - 42) / 14.0, 0, 1)), a)
    fxm = lt & (a > 0.02)
    a[reg & ~core & (sat < 40) & (mn >= 170)] = 0
    a[core] = 1.0
    fr = ndi.binary_dilation(core, S8, iterations=2) & ~core
    a[fr & (sat < 28) & (mn > 200)] = 0
    rgb = np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255)
    rgb[fxm & ~core] = np.clip(c[fxm & ~core] * (255.0 / np.maximum(mx[fxm & ~core], 1))[..., None], 0, 255)
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
    col = np.clip(r[..., :3] / np.maximum(al[..., None], .03), 0, 255)
    cm = cv2.resize(core.astype(np.float32), (nw, nh), interpolation=cv2.INTER_LINEAR) > .5
    return col, al, cm
def outline(col, al, cm):
    ring = ndi.binary_dilation(cm, S8, iterations=RING) & (al < .9)
    col = col.copy(); al = al.copy(); col[ring] = NAVY; al[ring] = 1.0
    edge = cm & ~ndi.binary_erosion(cm, S8, iterations=1); soft = edge & (al < 1)
    col[soft] = NAVY * .5 + col[soft] * .5; al[soft] = 1
    return col, al
# padronização de tamanho: as folhas desenham as poses em escalas diferentes.
# UPRIGHT (em pé): altura do corpo = BODY_H; ROLL (rolamentos/agachados): escala base; demais (ação): pela área do corpo (limite 1.0–1.3)
UPRIGHT = set('K1_1 K1_2 K1_44 K1_45 K1_13 K1_14 K1_15 K1_32 K1_35 K2_3 K2_4 K2_5 K2_13 K2_14 K2_15 K2_16 K2_17 K2_18 K2_19 K2_44 K3_3 K3_4 K3_5 K3_12 K3_13 K3_14 K3_15 K3_16 K3_17 K3_18 K3_39 K3_40 K3_41 K3_42 K3_43'.split())
ROLL = set('K1_20 K1_21 K1_22 K1_46 K1_49 K2_20 K2_21 K2_22 K2_42 K2_43 K2_45 K2_46 K3_20 K3_21 K3_22 K3_23 K3_44 K3_45 K3_46 K3_47 K3_48'.split())
# correção visual (altura incluindo cabelo, medida contra a idle da folha 1): fator final por pose + padrão por folha
SHEETFIX = {'K1': 1.0, 'K2': 1.03, 'K3': 1.10}
POSEFIX = {'K3_12':1.35,'K3_13':1.15,'K3_14':1.25,'K3_15':1.10,'K3_16':1.10,'K3_17':1.08,'K3_18':1.12,'K3_39':1.16,'K3_40':1.14,'K3_41':1.2,'K3_42':1.2,'K3_43':1.05,
 'K3_3':1.12,'K3_4':1.12,'K3_5':1.12,'K1_13':1.2,'K1_14':1.25,'K1_15':1.02,'K1_32':1.15,'K1_35':1.15,'K2_13':1.1,'K2_16':1.12,'K2_17':1.05,'K2_18':1.05,'K2_19':1.06,
 'K2_44':1.05,'K1_44':1.03,'K1_45':1.05,'K2_38':1.16,'K2_39':1.16,'K2_3':1.04,'K2_4':1.04,'K2_5':1.04}
# poses do BERSERK/aura: ajuste fino pela altura visível (cabelo→pés) comparada à idle (~290)
BFIX = {'K1_27':0.92,'K1_26':0.966,'K1_30':0.927,'K1_29':1.04,'K2_32':1.082,'K2_37':1.07,'K2_33':1.08,'K2_35':1.166,'K2_25':1.188,'K3_26':1.03,'K3_24':1.06,'K3_25':1.124,
 'K3_28':1.06,'K3_27':1.144,'K1_24':1.03,'K1_28':1.05,'K1_25':1.144,'K2_23':1.21,'K2_24':1.134,'K2_28':1.144,'K2_26':1.166}
def mult(name, core, REFS):
    return _mult(name, core, REFS) * POSEFIX.get(name, SHEETFIX[name.split('_')[0]]) * BFIX.get(name, 1.0)
def _mult(name, core, REFS):
    sh = name.split('_')[0]; rh, ra = REFS[sh]; ys = np.where(core.any(1))[0]; h = ys.max() - ys.min() + 1
    if name in ROLL: return float(np.clip(np.sqrt(1.25 * ra / max(core.sum(), 1)), 1.0, 2.3))
    if name in UPRIGHT: return rh / h
    return float(np.clip(np.sqrt(ra / max(core.sum(), 1)), 1.0, 1.3))
def main(only=None):
    SC0 = {}
    for sh, rn in REF.items():
        ref = process(rn); cx, gy, top = feet_stats(ref[1], ref[2]); SC0[sh] = BODY_H / (gy - top); print('escala', sh, round(SC0[sh], 3), 'corpo ref', gy - top)
    REFS = {}
    for sh, rn in REF.items():
        rc = process(rn)[2]; ys = np.where(rc.any(1))[0]; REFS[sh] = (ys.max() - ys.min() + 1, rc.sum())
    if os.path.isdir(OUTD) and not only: shutil.rmtree(OUTD)
    os.makedirs(OUTD, exist_ok=True); meta = {'poses': {}, 'body_h': BODY_H}
    for sh in SEG:
        for r in SEG[sh]:
            name = f"{sh}_{r['id']}"
            if only and name not in only: continue
            try: rgb, a, core = process(name)
            except Exception as e: print('falhou', name, e); continue
            if core.sum() < 800: print('sem corpo', name); continue
            cx, gy, top = feet_stats(a, core); s0 = SC0[sh] * mult(name, core, REFS)
            col, al, cm = scale_img(rgb, a, core, s0); col, al = outline(col, al, cm); col, al = fxsoft.soften(col, al, cm, RING, sigma=2.3 * s0 / 1.8)
            pad = RING + 2; im = np.dstack([col, al * 255]).astype(np.uint8); im = np.pad(im, ((pad, pad), (pad, pad), (0, 0)))
            Image.fromarray(im, 'RGBA').quantize(256, method=Image.FASTOCTREE, dither=Image.NONE).save(f'{OUTD}/{name}.png', optimize=True)
            meta['poses'][name] = {'w': im.shape[1], 'h': im.shape[0], 'cx': cx * s0 + pad, 'gy': gy * s0 + pad, 'top': top * s0 + pad}
    json.dump(meta, open(f'{OUTD}/meta.json', 'w')); print(len(meta['poses']), 'poses')
if __name__ == '__main__': main(sys.argv[1:] or None)
