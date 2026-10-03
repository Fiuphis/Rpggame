"""Gera map/ a partir da arte 'Jornada dos Heróis' (tools/jornada_src.png): mapa base, overlays cinza por região, ícones e halos."""
import numpy as np, os, json
from PIL import Image, ImageDraw, ImageFilter
D=os.path.dirname(__file__); O=os.path.join(D,'..','map'); os.makedirs(O,exist_ok=True)
src=Image.open(os.path.join(D,'jornada_src.png')).convert('RGB'); W,H=src.size
src.save(os.path.join(O,'base.webp'),quality=90,method=6)
g=np.array(src).astype(float); lum=(g*[.3,.59,.11]).sum(axis=2)
gray=np.clip((lum-18)*.82+14,0,255); gimg=Image.fromarray(np.stack([gray*.97,gray,gray*1.03],axis=2).clip(0,255).astype(np.uint8))
REG={ # polígonos (coordenadas da arte)
 0:[(15,225),(235,95),(420,95),(455,330),(475,420),(455,525),(330,595),(150,545),(55,470),(15,380)],
 1:[(480,55),(705,55),(835,260),(835,420),(785,565),(640,575),(520,545),(465,420),(478,200)],
 2:[(805,140),(1095,135),(1135,330),(1224,415),(1224,640),(1100,705),(900,705),(820,600),(790,330)],
 3:[(35,615),(300,605),(425,700),(425,900),(405,1005),(300,1105),(125,1055),(25,900),(25,720)],
 4:[(420,615),(705,615),(785,780),(855,900),(855,1005),(700,1105),(500,1135),(400,1005),(400,820)],
 5:[(815,635),(1075,625),(1105,760),(1135,900),(1135,1065),(985,1115),(845,1075),(805,900)]}
meta={'w':W,'h':H,'regions':{},'nodes':{}}
for k,poly in REG.items():
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).polygon(poly,fill=255); m=m.filter(ImageFilter.GaussianBlur(14))
    xs=[p[0] for p in poly]; ys=[p[1] for p in poly]; bb=(max(0,min(xs)-40),max(0,min(ys)-40),min(W,max(xs)+40),min(H,max(ys)+40))
    o=gimg.convert('RGBA'); o.putalpha(m); o=o.crop(bb); o.save(os.path.join(O,f'gray{k}.webp'),quality=88,method=6)
    meta['regions'][k]=bb
CEN={0:(282,419),1:(626,406),2:(1004,488),3:(261,960),4:(627,968),5:(993,979)}
R=47
def diamond(c,name,r=R,gray_=False):
    cx,cy=c; sz=2*R+6; k=sz/2-(r+3)+2; m=Image.new('L',(sz,sz),0); ImageDraw.Draw(m).polygon([(sz/2,k),(sz-k,sz/2),(sz/2,sz-k),(k,sz/2)],fill=255); m=m.filter(ImageFilter.GaussianBlur(1.2))
    im=src.crop((cx-sz//2,cy-sz//2,cx-sz//2+sz,cy-sz//2+sz)).convert('RGBA')
    if gray_:
        a=np.array(im.convert('RGB')).astype(float); l=(a*[.3,.59,.11]).sum(axis=2); im=Image.fromarray(np.stack([l,l,l*1.03],axis=2).clip(0,255).astype(np.uint8)).convert('RGBA')
    im.putalpha(m); im.save(os.path.join(O,name),quality=95,method=6)
    return sz
sz=diamond(CEN[0],'ic_done.webp'); diamond(CEN[1],'ic_next.webp'); diamond(CEN[2],'ic_lock.webp',43,True)
# halos recoloridos (círculo com borda suave) p/ nós 0 e 1
import colorsys
def halo(c,name,shift,r=74):
    cx,cy=c; s=2*r; im=src.crop((cx-r,cy-r,cx+r,cy+r)).convert('RGB')
    a=np.array(im).astype(float)/255; hsv=np.array([colorsys.rgb_to_hsv(*p) for p in a.reshape(-1,3)]).reshape(a.shape)
    sel=(hsv[...,1]>.35)&(hsv[...,2]>.3)&(((hsv[...,0]>.22)&(hsv[...,0]<.5))|((hsv[...,0]>.52)&(hsv[...,0]<.72)))  # só verdes/azuis do brilho
    hsv[...,0]=np.where(sel,(hsv[...,0]+shift)%1,hsv[...,0])
    out=np.array([colorsys.hsv_to_rgb(*p) for p in hsv.reshape(-1,3)]).reshape(a.shape)
    img=Image.fromarray((out*255).astype(np.uint8)).convert('RGBA')
    m=Image.new('L',(s,s),0); ImageDraw.Draw(m).ellipse((6,6,s-6,s-6),fill=255); img.putalpha(m.filter(ImageFilter.GaussianBlur(9))); img.save(os.path.join(O,name),quality=92,method=6)
halo(CEN[0],'halo0_blue.webp',(220-130)/360)     # verde → azul
halo(CEN[1],'halo1_green.webp',(130-220)/360)    # azul → verde
meta['nodes']={k:{'x':c[0],'y':c[1]} for k,c in CEN.items()}; meta['sz']=sz; meta['halo']=148
json.dump(meta,open(os.path.join(O,'meta.json'),'w'))
print(meta['regions'])
