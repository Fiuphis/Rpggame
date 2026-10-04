from PIL import Image, ImageDraw
import random
random.seed(11)
G=(176,138,60,255); GL=(240,206,120,255); GD=(104,76,28,255); IRON=(7,5,14,255)
def new(w,h): return Image.new('RGBA',(w,h),(0,0,0,0))
def px(im,x,y,c):
    if 0<=x<im.width and 0<=y<im.height: im.putpixel((x,y),c)
def gem(im,x,y,c,l):   # gema 3x3 com brilho
    for dx in (-1,0,1):
        for dy in (-1,0,1): px(im,x+dx,y+dy,c)
    px(im,x-1,y-1,l); px(im,x,y-1,l)
    for dx,dy in((-2,0),(2,0),(0,-2),(0,2)): px(im,x+dx,y+dy,GD)
def diamond(im,cx,cy,r,fill,edge):
    for y in range(-r,r+1):
        for x in range(-r,r+1):
            d=abs(x)+abs(y)
            if d<=r: px(im,cx+x,cy+y,edge if d==r else fill)
# ---------- PAINEL ----------
def panel(name,W=136,H=62):
    im=new(W,H); m=7  # margem para os enfeites que saem da borda
    x0,y0,x1,y1=m,5,W-1-m,H-1-4
    def inside(x,y):
        if not(x0<=x<=x1 and y0<=y<=y1): return False
        cx=min(x-x0,x1-x); cy=min(y-y0,y1-y)
        return not(cx+cy<5 and cx<5 and cy<5) # canto chanfrado
    for y in range(H):
        for x in range(W):
            if not inside(x,y): continue
            edge=not(inside(x-1,y) and inside(x+1,y) and inside(x,y-1) and inside(x,y+1))
            if edge: px(im,x,y,IRON); continue
            t=(y-y0)/(y1-y0)
            base=(int(24-12*t),int(18-9*t),int(40-20*t),255)
            if random.random()<.10: base=(base[0]+6,base[1]+5,base[2]+12,255)   # granulado de pedra
            px(im,x,y,base)
    # filete dourado interno em 2 tons (luz em cima/esquerda, sombra embaixo/direita)
    for x in range(x0+4,x1-3):
        if inside(x,y0+2): px(im,x,y0+2,GL if x%9 else G)
        px(im,x,y1-2,GD)
    for y in range(y0+4,y1-3): px(im,x0+2,y,G); px(im,x1-2,y,GD)
    # cantoneiras douradas em L
    for (sx,sy,dx,dy) in[(x0+2,y0+2,1,1),(x1-2,y0+2,-1,1),(x0+2,y1-2,1,-1),(x1-2,y1-2,-1,-1)]:
        for k in range(0,7): px(im,sx+dx*k,sy,GL if k<4 else G); px(im,sx,sy+dy*k,G)
        px(im,sx+dx,sy+dy,GL)
    # borda externa de ferro reforçada
    for x in range(x0+3,x1-2):
        if inside(x,y0): px(im,x,y0-1,(60,48,84,255)) if not inside(x,y0-1) else None
    # crista central superior (losango com gema vermelha) + pontas laterais
    cx=W//2
    for k in range(-14,15):
        if abs(k)>4: px(im,cx+k,y0-1,G) if abs(k)<13 else None
    diamond(im,cx,y0-1,5,(30,20,50,255),G); gem(im,cx,y0-1,(200,40,60,255),(255,150,150,255)); px(im,cx,y0-6,GL)
    diamond(im,cx,y1+1,3,(30,20,50,255),G)
    for sx,dirn in((x0-1,-1),(x1+1,1)):
        cy=(y0+y1)//2
        diamond(im,sx+dirn*2,cy,4,(30,20,50,255),G); px(im,sx+dirn*2,cy,(80,140,255,255)); px(im,sx+dirn*2,cy-1,(180,210,255,255))
    im.save(name); return im
# ---------- BOTAO ----------
def button(name,mid,hi,lo,frame,frame_hi,frame_lo,gemc,W=60,H=22,glow=False,pt=7):
    im=new(W,H)   # pontas em seta
    def inside(x,y):
        if not(0<=x<W and 0<=y<H): return False
        cy=abs(y-(H-1)/2)  # distancia ao centro vertical
        lim=int(cy*pt/((H-1)/2)+.5)  # centro avanca (ponta de seta), topo/base recuam
        return lim<=x<=W-1-lim
    for y in range(H):
        for x in range(W):
            if not inside(x,y): continue
            edge=not(inside(x-1,y) and inside(x+1,y) and inside(x,y-1) and inside(x,y+1))
            if edge: px(im,x,y,IRON); continue
            inner=all(inside(x+a,y+b) for a in(-1,0,1) for b in(-1,0,1))
            ring=not all(inside(x+a,y+b) for a in(-2,2,0) for b in(-2,2,0))
            if ring or not inner: px(im,x,y,frame_hi if y<H/2 else frame_lo); continue
            px(im,x,y,frame if (x+y)%7 else frame_hi); 
    # miolo esmaltado (2px dentro da moldura)
    def core(x,y): return all(inside(x+a,y+b) for a in(-4,4,0) for b in(-4,4,0))
    for y in range(H):
        for x in range(W):
            if core(x,y):
                t=(y-3)/(H-7)
                c=hi if t<.22 else (lo if t>.78 else mid)
                if 0.35<t<0.6 and random.random()<.07: c=hi
                px(im,x,y,c)
    for x in range(W):
        if core(x,3): px(im,x,3,hi)
        if core(x,H-4): px(im,x,H-4,lo)
    # gemas nas pontas
    gem(im,5,H//2,gemc[0],gemc[1]); gem(im,W-6,H//2,gemc[0],gemc[1])
    im.save(name); return im
panel('enter_panel.png')
button('enter_btn.png',(112,22,38,255),(168,44,60,255),(66,12,24,255),(176,138,60,255),(240,206,120,255),(104,76,28,255),((70,140,255,255),(190,220,255,255)))
button('enter_btn_on.png',(150,34,48,255),(232,84,72,255),(96,18,30,255),(226,184,90,255),(255,236,160,255),(150,110,44,255),((120,255,170,255),(220,255,230,255)))
button('enter_btn_off.png',(52,48,66,255),(78,72,96,255),(34,30,44,255),(96,88,112,255),(140,132,158,255),(60,54,76,255),((70,66,86,255),(110,104,130,255)))

# botao largo da selecao de classe (ESCOLHA UMA CLASSE / CONFIRMAR)
button('pick_btn_on.png',(150,34,48,255),(232,84,72,255),(96,18,30,255),(226,184,90,255),(255,236,160,255),(150,110,44,255),((120,255,170,255),(220,255,230,255)),W=118,H=16,pt=6)
button('pick_btn_off.png',(52,48,66,255),(78,72,96,255),(34,30,44,255),(96,88,112,255),(140,132,158,255),(60,54,76,255),((70,66,86,255),(110,104,130,255)),W=118,H=16,pt=6)
