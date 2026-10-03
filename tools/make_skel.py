"""Gera esqueletos em pixel art (desenho próprio, procedural) -> skel/skel_*.png. Uso: python3 tools/make_skel.py"""
from PIL import Image, ImageDraw
import math, os
OUT=os.path.join(os.path.dirname(__file__),'..','skel'); S=6
HI=(236,228,206,255); MID=(190,178,150,255); LO=(122,112,92,255); LINE=(22,19,16,255); EYE=(6,6,10,255)
W,H=40,48
def new(): return Image.new('RGBA',(W,H),(0,0,0,0))
def shade(im,cx,top,bot):
    """sombreia ossos (pixels HI) por posição: luz do alto-esquerda"""
    px=im.load()
    for y in range(H):
        for x in range(W):
            if px[x,y]==HI:
                d=(x-cx)*0.6+(y-top)*0.35
                if d>4.2: px[x,y]=LO
                elif d>1.6: px[x,y]=MID
def outline(im):
    px=im.load(); o=im.copy(); op=o.load()
    for y in range(H):
        for x in range(W):
            if px[x,y][3]==0:
                for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                    xx,yy=x+dx,y+dy
                    if 0<=xx<W and 0<=yy<H and px[xx,yy][3] and px[xx,yy]!=LINE: op[x,y]=LINE;break
    return o
def ell(d,cx,cy,rx,ry,c):
    for y in range(int(cy-ry)-1,int(cy+ry)+2):
        for x in range(int(cx-rx)-1,int(cx+rx)+2):
            if ((x-cx)/rx)**2+((y-cy)/ry)**2<=1: d.point((x,y),c)
def line(d,a,b,c,w=2):
    n=int(max(abs(a[0]-b[0]),abs(a[1]-b[1])))+1
    for i in range(n+1):
        t=i/max(n,1); x=round(a[0]+(b[0]-a[0])*t); y=round(a[1]+(b[1]-a[1])*t)
        d.rectangle((x,y,x+w-1,y+w-1),fill=c)
def skull(im,cx,cy,tilt=0,look=0):
    d=ImageDraw.Draw(im)
    ell(d,cx,cy,8.5,7.5,HI)                       # crânio
    d.rectangle((cx-5,cy+4,cx+5,cy+9),fill=HI)    # mandíbula
    d.point((cx-5,cy+9),fill=(0,0,0,0)); d.point((cx+5,cy+9),fill=(0,0,0,0))
    ex=3.6; ey=cy+1.2
    for s in(-1,1):
        ell(d,cx+s*ex+look,ey,2.4,2.9,EYE)         # órbitas
    d.polygon([(cx+look,cy+4),(cx-1+look,cy+6),(cx+1+look,cy+6)],fill=EYE)   # nariz
    for i in range(-4,5):                          # dentes
        if i%2==0: d.line((cx+i,cy+8,cx+i,cy+9),fill=LINE)
    d.line((cx-5,cy+7,cx+5,cy+7),fill=MID)
def ribs(im,cx,y0,n=3,w=9):
    d=ImageDraw.Draw(im)
    d.rectangle((cx-1,y0-1,cx,y0+n*3+3),fill=HI)   # coluna
    line(d,(cx-7,y0-1),(cx+6,y0-1),HI,2)           # clavículas
    for i in range(n):
        ww=w-i*1.2; y=y0+2+i*3
        d.rectangle((int(cx-ww/2),y,int(cx+ww/2),y+1),fill=HI)
        d.point((cx-1,y),fill=EYE); d.point((cx,y),fill=EYE) if False else None
        # vãos entre costelas
        d.point((int(cx-ww/2)+2,y),fill=(0,0,0,0)); d.point((int(cx+ww/2)-2,y),fill=(0,0,0,0))
def arm(im,sh,el,hd):
    d=ImageDraw.Draw(im); line(d,sh,el,HI,2); line(d,el,hd,HI,2)
    ell(d,hd[0]+.5,hd[1]+.5,2.2,2.2,HI)
    for k in(-2,0,2):
        d.point((hd[0]+k,hd[1]+3),fill=HI)
def hand(im,x,y,up=True,spread=1):
    d=ImageDraw.Draw(im); ell(d,x,y,3.2,2.6,HI)
    for k,l in((-3,4),(-1,5),(1,5),(3,4)):
        d.rectangle((x+k*spread+(0 if k<0 else 0),y-l if up else y+1,x+k*spread,y-1 if up else y+l),fill=HI)
    d.rectangle((x-5,y,x-4,y+2),fill=HI)
def finish(im,name,cx,top):
    shade(im,cx,top,H); im=outline(im)
    im=im.resize((W*S,H*S),Image.NEAREST); im.save(os.path.join(OUT,name))
os.makedirs(OUT,exist_ok=True)
# 1 só a caveira
im=new(); skull(im,20,18); finish(im,'skel_1.png',20,10)
# 2 busto
im=new(); skull(im,20,13); ribs(im,20,23,3,10)
d=ImageDraw.Draw(im); line(d,(14,24),(10,31),HI,2); line(d,(26,24),(30,31),HI,2); finish(im,'skel_2.png',20,6)
# 3 busto com braço erguido
im=new(); skull(im,19,15,look=1); ribs(im,19,25,3,10)
arm(im,(25,26),(32,21),(33,13)); d=ImageDraw.Draw(im); line(d,(13,26),(9,34),HI,2); finish(im,'skel_3.png',19,8)
# 4 duas mãos agarrando (sem corpo)
im=new(); hand(im,12,30,True,1); hand(im,28,28,True,1)
d=ImageDraw.Draw(im); d.rectangle((9,31,13,46),fill=HI); d.rectangle((26,29,30,46),fill=HI); finish(im,'skel_4.png',20,20)
# 5 caveira + mão apoiada
im=new(); skull(im,22,16,look=-1); hand(im,9,36,True,1); d=ImageDraw.Draw(im); d.rectangle((6,37,10,47),fill=HI); finish(im,'skel_5.png',22,8)
# 6 corpo maior até o quadril, braços abertos
im=new(); skull(im,20,11); ribs(im,20,21,4,11)
d=ImageDraw.Draw(im); arm(im,(14,22),(7,26),(4,33)); arm(im,(26,22),(33,26),(36,33))
d.rectangle((15,35,25,38),fill=HI); finish(im,'skel_6.png',20,4)
print('ok')
