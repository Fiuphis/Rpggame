"""Recorta rostos dos heróis das folhas de personagem (fundo claro) -> intro/f_*.webp com alfa limpo (3x, suavizado).
Uso: python3 tools/cut_heads.py <pasta com as folhas>   (nomes dos arquivos conforme SHEETS)"""
import numpy as np, sys, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
UP=3
def cut(rgb, tol=34):
    a=rgb.astype(int); h,w,_=a.shape
    bg=np.median(np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]),axis=0)
    near=np.abs(a-bg).sum(axis=2)<=tol
    lab,n=ndi.label(near); border=set(lab[0])|set(lab[-1])|set(lab[:,0])|set(lab[:,-1]); border.discard(0)
    outside=np.isin(lab,list(border))
    fg=~outside
    l2,n2=ndi.label(fg)
    if n2>1: fg=l2==(1+int(np.argmax(ndi.sum(fg,l2,range(1,n2+1)))))
    fg=ndi.binary_fill_holes(fg)
    core=ndi.binary_erosion(fg,iterations=1)          # tira o halo claro da borda
    # cor das bordas = cor do vizinho interno mais próximo (defringe)
    idx=ndi.distance_transform_edt(~core,return_distances=False,return_indices=True)
    col=rgb[idx[0],idx[1]]
    ys,xs=np.where(core)
    y0,y1,x0,x1=max(0,ys.min()-2),ys.max()+3,max(0,xs.min()-2),xs.max()+3
    img=Image.fromarray(col[y0:y1,x0:x1]).convert('RGBA'); al=Image.fromarray((core[y0:y1,x0:x1]*255).astype(np.uint8))
    img=img.resize((img.width*UP,img.height*UP),Image.LANCZOS); al=al.resize(img.size,Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.1))
    al=al.point(lambda v:0 if v<40 else min(255,int((v-40)*1.35)))
    img.putalpha(al); return img
def region(path,box): return np.array(Image.open(path).convert('RGB').crop(box))
def grid(path,box,cols,rows,pick,prefix,out,inset=2):
    r=region(path,box); H,W,_=r.shape; cw,ch=W/cols,H/rows
    for k in pick:
        rr,cc=divmod(k,cols); cell=r[int(rr*ch)+inset:int((rr+1)*ch)-inset,int(cc*cw)+inset:int((cc+1)*cw)-inset]
        cut(cell).save(os.path.join(out,f'f_{prefix}_{k}.webp'),quality=94,method=6)
def boxes(path,box,pick,prefix,out,pad=4):
    r=region(path,box); a=r.astype(int); bg=np.median(np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]),axis=0)
    m=ndi.binary_dilation(np.abs(a-bg).sum(axis=2)>60,iterations=3); lab,n=ndi.label(m); items=[]
    for i,sl in enumerate(ndi.find_objects(lab)):
        h=sl[0].stop-sl[0].start; w=sl[1].stop-sl[1].start
        if 45<=h<200 and 45<=w<200: items.append(sl)
    items.sort(key=lambda s:(round((s[0].start+s[0].stop)/100),s[1].start))
    for k in pick:
        s=items[k]; sub=r[max(0,s[0].start-pad):s[0].stop+pad,max(0,s[1].start-pad):s[1].stop+pad]
        cut(sub).save(os.path.join(out,f'f_{prefix}_{k}.webp'),quality=94,method=6)
if __name__=='__main__':
    D=sys.argv[1]; O=os.path.join(os.path.dirname(__file__),'..','intro')
    grid(f'{D}/3378679f-image.png',(8,24,395,270),5,3,[0,2,1,4],'maga',O)
    grid(f'{D}/810fb40d-image.png',(10,34,375,360),5,4,[3,5,8,13],'cler',O)
    boxes(f'{D}/d66c2130-image.png',(395,45,625,130),[0,1,2],'knight',O)
    boxes(f'{D}/8f4bd8f3-image.png',(1185,40,1340,180),[0,1],'tank',O)
    boxes(f'{D}/8f4bd8f3-image.png',(965,235,1180,305),[0,1],'tankx',O)
