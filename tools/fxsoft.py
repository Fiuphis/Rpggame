# Suaviza os EFEITOS de uma pose (tudo que não é o corpo): blur, opacidade menor e mais brilho -> parece energia, não algo sólido
import numpy as np, cv2
from scipy import ndimage as ndi
S8 = ndi.generate_binary_structure(2, 2)
def soften(col, al, cm, ring=2, sigma=1.5, op=.74, bright=1.3):
    body = ndi.binary_dilation(cm, S8, iterations=ring + 2)
    sat = col.max(2) - col.min(2)
    fxs = (~body) & (al > .01) & (sat > 60)          # só o que é brilho colorido (arcos, auras, faíscas); aço da espada fica
    if fxs.sum() < 30: return col, al
    a = np.where(fxs, al, 0).astype(np.float32); pm = (col * a[..., None]).astype(np.float32)
    ab = cv2.GaussianBlur(a, (0, 0), sigma); pb = cv2.GaussianBlur(pm, (0, 0), sigma)
    ah = cv2.GaussianBlur(a, (0, 0), sigma * 3.2); ph = cv2.GaussianBlur(pm, (0, 0), sigma * 3.2)
    A = np.clip(ab * op + ah * .35, 0, 1); P = pb * op + ph * .35
    C = np.clip(P / np.maximum(A[..., None], .02) * bright, 0, 255)
    keep = body | ((~body) & (al > .01) & ~fxs)
    out_a = np.where(keep, al, A); out_c = np.where(keep[..., None], col, C)
    return out_c, out_a
