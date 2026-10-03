"""Gera map/water.png (204x214, branco = água) a partir de map/base.webp, para os efeitos vivos do mapa (mapfx.js)."""
import numpy as np, cv2, os
from PIL import Image
D=os.path.dirname(__file__); O=os.path.join(D,'..','map')
a=np.array(Image.open(os.path.join(O,'base.webp')).convert('RGB')); H0,W0=a.shape[:2]
hsv=cv2.cvtColor(a,cv2.COLOR_RGB2HSV).astype(int); H,S,V=hsv[:,:,0],hsv[:,:,1],hsv[:,:,2]
w=((H>=96)&(H<=120)&(S>=170)&(V>=26)&(V<=120)).astype(np.uint8)*255
for (x0,y0,x1,y1) in [(0,55,255,170),(0,1070,250,1285),(1100,40,1224,215),(900,1100,1224,1285)]: w[y0:y1,x0:x1]=0   # painéis
w=cv2.morphologyEx(w,cv2.MORPH_OPEN,np.ones((9,9),np.uint8)); w=cv2.morphologyEx(w,cv2.MORPH_CLOSE,np.ones((13,13),np.uint8))
n,lab,st,_=cv2.connectedComponentsWithStats(w); keep=np.zeros_like(w)
for i in range(1,n):
    if st[i,4]>3000: keep[lab==i]=255
keep=cv2.erode(keep,np.ones((7,7),np.uint8))
small=cv2.resize(keep,(W0//6,H0//6),interpolation=cv2.INTER_AREA)
small=((small>200)*255).astype(np.uint8)
cv2.imwrite(os.path.join(O,'water.png'),small); print(small.shape,(small>0).mean())
