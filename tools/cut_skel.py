"""Recorta o esqueleto do usuário (skel_user_src.png, fundo cinza) em skel/skel_*.png com fundo transparente."""
from PIL import Image, ImageFilter
import numpy as np, os, collections
D=os.path.dirname(__file__); src=Image.open(os.path.join(D,'skel_user_src.png')).convert('RGBA')
a=np.array(src).astype(int); h,w,_=a.shape; bg=a[2,2,:3]
dist=np.abs(a[:,:,:3]-bg).sum(axis=2)
seen=np.zeros((h,w),bool); q=collections.deque()
for x in range(w):
    for y in (0,h-1): q.append((y,x))
for y in range(h):
    for x in (0,w-1): q.append((y,x))
while q:
    y,x=q.popleft()
    if y<0 or x<0 or y>=h or x>=w or seen[y,x] or dist[y,x]>42: continue
    seen[y,x]=True
    q.extend(((y+1,x),(y-1,x),(y,x+1),(y,x-1)))
alpha=np.where(seen|(dist<=16),0,255).astype(np.uint8)
m=Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
out=src.copy(); out.putalpha(m)
bb=out.getbbox(); out=out.crop(bb); W,H=out.size; out=out.crop((0,0,W,H-4)); W,H=out.size   # tira a linha de chão
O=os.path.join(D,'..','skel'); os.makedirs(O,exist_ok=True)
def sv(img,n): img.save(os.path.join(O,n))
sv(out,'skel_1.png')                                   # corpo inteiro
print(out.size)
