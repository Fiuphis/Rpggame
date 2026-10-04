# Gera tip_frame.png: moldura 9-slice (32x32, borda de 8px) para o cartao de descricao de item.
from PIL import Image
W=H=32;B=8
im=Image.new('RGBA',(W,H),(0,0,0,0))
OUT=(7,4,15,255);PUR=(52,36,84,255);GL=(244,214,138,255);GM=(200,150,70,255);GD=(120,82,34,255);IN=(58,40,24,255)
def fill(x,y):
    t=y/(H-1);return (int(26-8*t),int(18-8*t),int(44-14*t),255)
for y in range(H):
    for x in range(W):
        d=min(x,y,W-1-x,H-1-y)
        # chanfro dos cantos (em degraus)
        cx=min(x,W-1-x);cy=min(y,H-1-y)
        if (cx==0 and cy<3) or (cy==0 and cx<3) or (cx==1 and cy==1): continue
        if d==0: c=OUT
        elif d==1: c=PUR
        elif d in (2,3):
            lit=(x+y)<(W+H)/2
            c=(GL if d==2 else GM) if lit else (GM if d==2 else GD)
        elif d==4: c=IN
        else: c=fill(x,y)
        im.putpixel((x,y),c)
# rebites/losangos dourados nos cantos
def dia(cx,cy):
    for dy in range(-2,3):
        for dx in range(-2,3):
            a=abs(dx)+abs(dy)
            if a<=2: im.putpixel((cx+dx,cy+dy),OUT if a==2 else (GL if a==0 else GM))
for (cx,cy) in [(4,4),(W-5,4),(4,H-5),(W-5,H-5)]: dia(cx,cy)
im.save('tip_frame.png')
