# Poses de balançar/girar o cajado (folha em degradê) com seus efeitos, na mesma escala das poses da folha branca -> mage3/
import sys, json, shutil, numpy as np
sys.path.insert(0, 'tools')
from recorta_folha3 import extract_all
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; S = 1.95; TMP = '/tmp/g1'
shutil.rmtree(TMP, ignore_errors=True)
m = extract_all(SRC, TMP, S=S)
PICK = {'spin1':'p_3_4', 'stars':'p_3_5', 'spinwide':'p_3_6', 'swingf':'p_3_7', 'swingl':'p_3_8', 'swingr':'p_3_9'}
meta = json.load(open('mage3/meta.json'))
for name, pid in PICK.items():
    p = m['poses'][pid]; body = Image.open(f'{TMP}/{pid}.png')
    fx = [(k, v) for k, v in m['fx'].items() if v['owner'] == pid]
    # canvas = união (coordenadas da folha * S)
    boxes = [(0, 0, body.width, body.height)]
    for k, v in fx:
        ox = (v['sx'] - p['sx']) * S; oy = (v['sy'] - p['sy']) * S; boxes.append((ox, oy, ox + v['w'], oy + v['h']))
    x0 = int(min(b[0] for b in boxes)); y0 = int(min(b[1] for b in boxes)); x1 = int(max(b[2] for b in boxes)) + 1; y1 = int(max(b[3] for b in boxes)) + 1
    cv = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
    for k, v in fx:
        im = Image.open(f'{TMP}/{k}.png'); lay = Image.new('RGBA', cv.size, (0, 0, 0, 0)); lay.paste(im, (int((v['sx'] - p['sx']) * S - x0), int((v['sy'] - p['sy']) * S - y0))); cv = Image.alpha_composite(cv, lay)
    cv.alpha_composite(body, (-x0, -y0))
    cv.save(f'mage3/{name}.png')
    a = np.asarray(cv).astype(int); R, G, B, A = [a[..., i] for i in range(4)]
    mk = (B > 215) & (R < 110) & (G > 110) & (G < 235) & (A > 150); mk[int(cv.height * .5):] = False
    lo, kk = ndi.label(ndi.binary_dilation(mk, iterations=2)); orb = None
    if kk:
        sz = ndi.sum(mk, lo, range(1, kk + 1)); q = int(np.argmax(sz)) + 1
        if sz[q - 1] >= 14: yy, xx = np.where(mk & (lo == q)); orb = [float(xx.mean()), float(yy.mean())]
    meta['poses'][name] = {'w': cv.width, 'h': cv.height, 'cx': float(p['cx'] - x0), 'gy': float(p['cyb'] - y0), 'orb': orb}
    print(name, cv.size, meta['poses'][name]['cx'], meta['poses'][name]['gy'], orb, [k for k, _ in fx])
json.dump(meta, open('mage3/meta.json', 'w'), default=float)
