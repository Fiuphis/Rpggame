# Extrai os efeitos azuis da folha da Maga (fundo branco -> alpha) para fx/*.png
import numpy as np, sys
from PIL import Image
SRC = sys.argv[1]
im = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
BOXES = {
 'rune':(1278,436,1392,544), 'ring':(1438,300,1512,382), 'proj':(1464,383,1516,440),
 'crystal':(1392,424,1422,524), 'column':(1326,540,1380,732), 'burst':(1418,556,1512,724),
 'flame':(1314,314,1356,382), 'star':(1362,322,1392,352), 'spark':(1224,372,1270,420),
 'wisp':(1368,368,1398,432), 'star2':(1420,376,1452,428),
}
for k,(x0,y0,x1,y1) in BOXES.items():
    c = im[y0:y1, x0:x1]
    m = c.min(2)
    a = np.clip((250 - m)/ (250-120), 0, 1)           # branco -> 0, azul saturado -> 1
    a = a**0.8
    col = np.clip((c - 255*(1-a[...,None]))/np.maximum(a[...,None],.05), 0, 255)
    out = np.dstack([col, a*255]).astype(np.uint8)
    ys, xs = np.where(a > .04)
    if not len(ys): print('vazio', k); continue
    out = out[ys.min():ys.max()+1, xs.min():xs.max()+1]
    Image.fromarray(out,'RGBA').save(f'fx/{k}.png'); print(k, out.shape[1], out.shape[0])
