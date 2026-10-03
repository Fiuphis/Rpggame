# Refaz o recorte do corpo da Maga a partir das poses BRUTAS (cut_white/bake_grad) e desenha uma borda fina por cima.
# O contorno escuro original (bem escuro) delimita o personagem; tudo que fica fora dele junto ao corpo (halo azul da folha em
# degradê, franja branca) é descartado. Efeitos brilhantes soltos (arcos, orbe) são mantidos.
# Uso: python3 tools/retrace.py RAW_DIR OUT_DIR   (OUT_DIR = mage3 do jogo; sobrescreve só as poses listadas em POSES)
import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as ndi
RAW, OUT = sys.argv[1], sys.argv[2]; P = 3; CAP = 7
POSES = ['spin1','stars','spinwide','swingf','swingl','swingr']   # só as poses da folha em degradê têm halo; as da folha branca já saem limpas
NAVY = np.array([14, 12, 42], np.uint8)
raw = json.load(open(f'{RAW}/meta.json'))['poses']; M = json.load(open(f'{OUT}/meta.json'))
S4 = ndi.generate_binary_structure(2, 1)
for name in POSES:
    im = np.array(Image.open(f'{RAW}/{name}.png').convert('RGBA')); im = np.pad(im, ((P, P), (P, P), (0, 0)))
    rgb = im[..., :3].astype(int); a = im[..., 3]; mx = rgb.max(2); lum = rgb.mean(2); sat = mx - rgb.min(2)
    solid = a >= 60
    depth = ndi.distance_transform_edt(np.pad(a >= 60, 1) == 0, return_distances=True)  # placeholder (substituído abaixo)
    out0 = ~(a >= 60)
    depth = ndi.distance_transform_edt(~out0)           # profundidade a partir do vazio
    dl = solid & (mx < 50)                              # contorno escuro original
    cap = CAP
    lbd, kd = ndi.label(dl)
    bigd = np.isin(lbd, np.where(ndi.sum(dl, lbd, range(1, kd + 1)) >= 25)[0] + 1) if kd else dl
    near_body = ndi.distance_transform_edt(~bigd) <= cap + 4      # só perto do contorno do corpo (arcos de efeito ficam intactos)
    cand = solid & ~dl & (depth <= cap) & near_body
    seed = cand & ndi.binary_dilation(out0, structure=S4)
    halo0 = ndi.binary_propagation(seed, structure=S4, mask=cand)
    # o halo é azul claro/flat (mais claro que o contorno); mantém o que for brilhante (efeito) ou dourado/laranja
    hal = halo0 & ~((lum > 112) | (rgb[..., 0] > rgb[..., 2] + 15))
    body = solid & ~hal
    lb, kb = ndi.label(body)
    if kb:
        sz = ndi.sum(body, lb, range(1, kb + 1)); body = np.isin(lb, np.where(sz >= max(60, .02 * sz.max()))[0] + 1)
    dist = ndi.distance_transform_edt(~body)
    nb = (a > 0) & ~body
    halo = hal | (nb & (dist <= 4) & (mx < 100) & ~((lum > 112)))
    # pontinhos soltos e escuros fora do corpo
    im[halo] = 0
    fxb = (lum > 112) & ((rgb[..., 2] - rgb[..., 0]) > 30) & (rgb[..., 2] > 140)       # brilho azul = efeito
    core = body & ~fxb
    lc, kc = ndi.label(core)
    if kc: core = lc == (np.argmax(ndi.sum(core, lc, range(1, kc + 1))) + 1)
    core = ndi.binary_fill_holes(core)
    nofx = ~ndi.binary_dilation(fxb & ~core, structure=S4, iterations=2)
    im[body & (a >= 20) & core, 3] = 255
    bd = core & ~ndi.binary_erosion(core, structure=S4)
    need = bd & (mx >= 70) & nofx; im[need, :3] = NAVY
    ring = ndi.binary_dilation(core, structure=S4) & ~core & (im[..., 3] < 60) & nofx
    ring &= ndi.binary_dilation(need, structure=S4, iterations=1)
    im[ring, :3] = NAVY; im[ring, 3] = 255
    Image.fromarray(im).save(f'{OUT}/{name}.png')
    r = raw[name]; m = M['poses'][name]
    m.update({'w': r['w'] + 2 * P, 'h': r['h'] + 2 * P, 'cx': float(r['cx']) + P, 'gy': float(r['gy']) + P, 'outlined': True, 'thin': True})
    m['orb'] = [r['orb'][0] + P, r['orb'][1] + P] if r.get('orb') else None
json.dump(M, open(f'{OUT}/meta.json', 'w'), default=float)
print('ok')
