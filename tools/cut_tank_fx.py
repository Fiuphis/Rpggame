# Efeitos soltos do Tanque extraídos da folha c: arcos dourados de golpe, pedras, coluna de luz -> tank/fx_*.png
import numpy as np, json, os, sys, cv2
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
SRC = '/root/.claude/uploads/3a96d84d-702c-52a6-9324-e85ba38ea593/e49fa76c-image.png'
IM = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32); S8 = ndi.generate_binary_structure(2, 2)
SC = float(os.environ.get('FXS', 1.67))
def save(name, rgb, a, scale=SC):
    ys, xs = np.where(a > .04); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pm = np.dstack([rgb * a[..., None], a * 255])[y0:y1, x0:x1].astype(np.float32)
    h, w = pm.shape[:2]; r = cv2.resize(pm, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_CUBIC)
    al = np.clip(r[..., 3], 0, 255) / 255.; col = np.clip(r[..., :3] / np.maximum(al[..., None], .03), 0, 255)
    Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA').save(f'tank/fx_{name}.png'); print(name, r.shape[:2][::-1])
def arc(name, box):
    x0, y0, x1, y1 = box; c = IM[y0:y1, x0:x1]; mn = c.min(2); mx = c.max(2); sat = mx - mn
    m = (mn > 105) & (sat > 55) & (c[..., 0] >= c[..., 1]) & (c[..., 1] >= c[..., 2]) & (mn < 244)
    m = ndi.binary_opening(m, structure=S8) | (m & (sat > 110))
    lab, k = ndi.label(ndi.binary_dilation(m, S8, iterations=2) & m)
    sz = ndi.sum(m, lab, range(1, k + 1)); m = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v >= 150])
    a = np.clip((250 - mn) / 65, 0, 1) * m
    save(name, np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255), a)
def rocks(box, prefix, nmax=6):
    x0, y0, x1, y1 = box; c = IM[y0:y1, x0:x1]; mn = c.min(2); sat = c.max(2) - mn
    m = (mn < 150) & ~((mn >= 224) & (sat < 16)); lab, k = ndi.label(m, S8); sz = ndi.sum(m, lab, range(1, k + 1)); sl = ndi.find_objects(lab)
    ids = [i for i in np.argsort(sz)[::-1] if 90 <= sz[i] <= 900][:nmax]
    for j, i in enumerate(ids):
        mm = ndi.binary_fill_holes(lab == i + 1); a = ndi.binary_dilation(mm, S8) * 1.0
        pad = np.zeros_like(a); s = sl[i]; yy, xx = s
        sub = (slice(max(0, yy.start - 2), yy.stop + 2), slice(max(0, xx.start - 2), xx.stop + 2))
        save(f'{prefix}{j + 1}', c[sub], a[sub] * 1.0, scale=SC * 1.2)
def pillar(box):
    x0, y0, x1, y1 = box; c = IM[y0:y1, x0:x1].copy(); mn = c.min(2); sat = c.max(2) - mn
    bgm = (mn >= 224) & (sat < 16); a = np.clip((250 - mn) / 65, 0, 1) * ~bgm
    d = (mn < 120) & ~bgm; lab, k = ndi.label(ndi.binary_dilation(d, S8, iterations=2) & d)
    if k:
        sz = ndi.sum(d, lab, range(1, k + 1)); body = ndi.binary_dilation(lab == (int(np.argmax(sz)) + 1), S8, iterations=3)
        gold = np.array([255, 214, 120], np.float32); c[body] = gold; a[body] = .65
    a[0:2] = 0; a[-2:] = 0; a[:, :2] = 0; a[:, -2:] = 0
    save('pillar', np.clip((c - 255 * (1 - a[..., None])) / np.maximum(a[..., None], .08), 0, 255), a)
if __name__ == '__main__':
    rocks((640, 790, 985, 995), 'rock')   # só pedras (os arcos e a luz já vêm nas poses)
