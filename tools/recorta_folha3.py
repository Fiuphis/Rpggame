# Recorta quadros de uma folha com fundo em degradê: separa personagem+efeitos do fundo (matte por diferença)
import numpy as np, cv2, sys, json
from scipy import ndimage as ndi
from PIL import Image

def estimate_bg(F, body=None, iters=3):
    lum = F.mean(2)
    gx = cv2.Sobel(lum, cv2.CV_32F, 1, 0); gy = cv2.Sobel(lum, cv2.CV_32F, 0, 1); g = np.hypot(gx, gy)
    fg = ndi.binary_dilation(g > 60, iterations=5)
    for _ in range(iters):
        w = (~fg).astype(np.float32)
        num = cv2.GaussianBlur(F * w[..., None], (0, 0), 22); den = cv2.GaussianBlur(w, (0, 0), 22)[..., None]
        bg = num / np.maximum(den, 1e-3)
        d = np.abs(F - bg).max(2)
        fg = ndi.binary_dilation(d > 26, iterations=3)
    return bg, d

def body_mask(F, d, thr=28, seal=3):
    """região do personagem = área fechada pelo contorno escuro (barreira engrossada p/ fechar frestas)"""
    lum = F.mean(2)
    dark = lum < thr
    barrier = ndi.binary_dilation(dark, iterations=seal)
    free = ~barrier; lab, n = ndi.label(free)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
    reach = np.isin(lab, edge)
    inside = ~reach
    inside = ndi.binary_fill_holes(inside)
    grown = ndi.binary_dilation(inside, iterations=seal)
    body = inside | (grown & (lum < 45))
    body = ndi.binary_opening(body, iterations=1)
    body = ndi.binary_fill_holes(ndi.binary_closing(body, iterations=4))
    lab2, n2 = ndi.label(body)
    if n2:
        sz = ndi.sum(body, lab2, range(1, n2 + 1)); keep = [i + 1 for i, v in enumerate(sz) if v > 700]
        body = np.isin(lab2, keep)
    return body

def matte(F, bg, body, soft=38.):
    d = np.abs(F - bg).max(2)
    a = np.clip((d - 12) / soft, 0, 1)
    a = np.maximum(a, body.astype(np.float32))
    col = np.clip((F - (1 - a[..., None]) * bg) / np.maximum(a[..., None], .05), 0, 255)
    out = np.dstack([col, a * 255]).astype(np.uint8)
    return out


ROWS = [(55, 218), (262, 424), (468, 640), (682, 810), (848, 1018)]
def split_row(im, y0, y1, gap=7, minarea=60):
    F = im[y0:y1]; bg, d = estimate_bg(F); body = body_mask(F, d); out = matte(F, bg, body)
    a = out[..., 3] > 40
    lab, n = ndi.label(ndi.binary_dilation(a, iterations=gap))
    boxes = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        area = (a[sl] & (lab[sl] == i + 1)).sum()
        if area >= minarea: boxes.append([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop, int(area)])
    boxes.sort(key=lambda b: b[0])
    return out, boxes


def frames_of_row(im, y0, y1, R=70, fxmin=120):
    """devolve (bodies, fxs): bodies = [(x,y,RGBA)] personagem + efeitos mais próximos; fxs = efeitos soltos"""
    F = im[y0:y1]; bg, d = estimate_bg(F); body = body_mask(F, d); out = matte(F, bg, body)
    A = out[..., 3] > 28
    lab, n = ndi.label(body)
    sizes = ndi.sum(body, lab, range(1, n + 1)); ids = [i + 1 for i, s in enumerate(sizes) if s > 1500]
    ids.sort(key=lambda i: ndi.center_of_mass(lab == i)[1])
    if not ids: return [], []
    dist = np.full(body.shape, 1e9, np.float32); owner = np.zeros(body.shape, np.int32)
    for k, i in enumerate(ids):
        dk = ndi.distance_transform_edt(lab != i).astype(np.float32); m = dk < dist; dist[m] = dk[m]; owner[m] = k + 1
    near = A & (dist <= R) & ~body | (body & np.isin(lab, ids))
    bodies = []
    for k, i in enumerate(ids):
        mk = ((owner == k + 1) & A & (dist <= R)) | (lab == i)
        ys, xs = np.where(mk); x0, x1, yy0, yy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        o = out[yy0:yy1, x0:x1].copy(); o[~mk[yy0:yy1, x0:x1]] = 0
        bodies.append((int(x0), int(yy0 + y0), o))
    rest = A & ~(dist <= R) & ~body
    l2, n2 = ndi.label(ndi.binary_dilation(rest, iterations=4))
    fxs = []
    for j, sl in enumerate(ndi.find_objects(l2)):
        m = rest & (l2 == j + 1)
        if m.sum() < fxmin: continue
        ys, xs = np.where(m); x0, x1, yy0, yy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        o = out[yy0:yy1, x0:x1].copy(); o[~m[yy0:yy1, x0:x1]] = 0
        fxs.append((int(x0), int(yy0 + y0), o))
    fxs.sort(key=lambda t: t[0])
    return bodies, fxs


def extract_all(path, outdir, S=1.9):
    """personagem sozinho (mage2/p_<linha>_<i>.png) + efeitos aditivos (mage2/e_<linha>_<j>.png) ligados ao personagem mais próximo"""
    import os; os.makedirs(outdir, exist_ok=True)
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float32); meta = {'S': S, 'poses': {}, 'fx': {}}
    for r, (y0, y1) in enumerate(ROWS):
        F = im[y0:y1]; bg, d = estimate_bg(F); body = body_mask(F, d); out = matte(F, bg, body)
        lab, n = ndi.label(body); sizes = ndi.sum(body, lab, range(1, n + 1))
        ids = [i + 1 for i, s in enumerate(sizes) if s > 1500]; ids.sort(key=lambda i: ndi.center_of_mass(lab == i)[1])
        cents = []
        for k, i in enumerate(ids):
            m = lab == i; ys, xs = np.where(m); x0, x1, yy0, yy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            o = out[yy0:yy1, x0:x1].copy(); o[~m[yy0:yy1, x0:x1]] = 0
            img = Image.fromarray(o, 'RGBA'); img = img.resize((round(img.width * S), round(img.height * S)), Image.LANCZOS)
            name = f'p_{r}_{k}'; img.save(f'{outdir}/{name}.png')
            low = o[int(o.shape[0] * .6):, :, 3] > 128; cx = (low.sum(0) * np.arange(o.shape[1])).sum() / max(low.sum(), 1)
            meta['poses'][name] = {'sx': int(x0), 'sy': int(yy0 + y0), 'w': img.width, 'h': img.height, 'cx': float(cx * S), 'cyb': float((yy1 - yy0) * S)}
            cents.append(ndi.center_of_mass(m))
        # efeitos: brilho em excesso sobre o fundo, fora do corpo
        ex = np.clip(F - bg, 0, 255); mx = ex.max(2); alpha = np.clip((mx - 30) / 60., 0, 1)
        nb = ndi.binary_dilation(body, iterations=2)
        alpha = alpha * (~nb)
        if r == 2:                                    # defesas: um efeito por pose (recortado pelo meio entre vizinhos)
            xs_c = [c[1] for c in cents]; edges = [0] + [(a + b) / 2 for a, b in zip(xs_c, xs_c[1:])] + [F.shape[1]]
            for k in range(len(cents)):
                m = np.zeros(alpha.shape, bool); m[:, int(edges[k]):int(edges[k + 1])] = True; m &= alpha > .12
                if m.sum() < 90: continue
                ys, xs = np.where(m); x0, x1, yy0, yy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
                al = alpha[yy0:yy1, x0:x1, None]; col = np.clip((F[yy0:yy1, x0:x1] - (1 - al) * bg[yy0:yy1, x0:x1]) / np.maximum(al, .15), 0, 255)
                a = (alpha[yy0:yy1, x0:x1] * 255 * m[yy0:yy1, x0:x1]).astype(np.uint8)
                img = Image.fromarray(np.dstack([col.astype(np.uint8), a]), 'RGBA'); img = img.resize((round(img.width * S), round(img.height * S)), Image.LANCZOS)
                name = f'g_{r}_{k}'; img.save(f'{outdir}/{name}.png')
                meta['fx'][name] = {'sx': int(x0), 'sy': int(yy0 + y0), 'w': img.width, 'h': img.height, 'owner': f'p_{r}_{k}', 'cx': float((x0 + x1) / 2), 'cy': float((yy0 + yy1) / 2 + y0)}
            continue
        A = alpha > .12; l2, n2 = ndi.label(ndi.binary_dilation(A, iterations=5))
        for j, sl in enumerate(ndi.find_objects(l2)):
            m = A & (l2 == j + 1)
            if m.sum() < 90: continue
            ys, xs = np.where(m); x0, x1, yy0, yy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            al = alpha[yy0:yy1, x0:x1, None]; col = np.clip((F[yy0:yy1, x0:x1] - (1 - al) * bg[yy0:yy1, x0:x1]) / np.maximum(al, .15), 0, 255)
            a = (alpha[yy0:yy1, x0:x1] * 255 * (l2[yy0:yy1, x0:x1] == j + 1)).astype(np.uint8)
            img = Image.fromarray(np.dstack([col.astype(np.uint8), a]), 'RGBA'); img = img.resize((round(img.width * S), round(img.height * S)), Image.LANCZOS)
            cxm, cym = (x0 + x1) / 2, (yy0 + yy1) / 2
            owner = int(np.argmin([(c[1] - cxm) ** 2 + (c[0] - cym) ** 2 for c in cents])) if cents else -1
            name = f'e_{r}_{j}'; img.save(f'{outdir}/{name}.png')
            meta['fx'][name] = {'sx': int(x0), 'sy': int(yy0 + y0), 'w': img.width, 'h': img.height, 'owner': f'p_{r}_{owner}', 'cx': float(cxm), 'cy': float(cym + y0)}
    json.dump(meta, open(f'{outdir}/meta.json', 'w'))
    return meta
