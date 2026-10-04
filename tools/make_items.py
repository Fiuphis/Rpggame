# Gera os ícones de itens do Mercador (46x68, pixel art desenhado em 23x34 e ampliado 2x).
from PIL import Image, ImageDraw
import numpy as np, sys
W, H = 23, 34
OL = (22, 12, 22, 255)
def new(): 
    im = Image.new('RGBA', (W, H), (0,0,0,0)); return im, ImageDraw.Draw(im)
def finish(im, name):
    a = np.array(im); m = a[:,:,3] > 0
    d = np.zeros_like(m)
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            if dx or dy: d |= np.roll(np.roll(m,dx,1),dy,0)
    ring = d & ~m; a[ring] = OL
    out = Image.fromarray(a).resize((46,68), Image.NEAREST)
    out.save(f'item_{name}.png'); return out
def P(d, pts, c): d.point(pts, c)
def px(d, x, y, c): d.point((x,y), c)
S1=(206,214,228,255); S2=(146,158,182,255); S3=(86,98,126,255); S4=(48,56,78,255)
G1=(255,224,120,255); G2=(224,164,50,255); G3=(150,98,24,255)
R1=(236,70,60,255); R2=(170,34,40,255); R3=(104,18,30,255)
sprites = {}
# 1 escudo de ferro
def shield():
    im,d=new()
    d.polygon([(4,4),(18,4),(18,18),(11,30),(4,18)], fill=S3)
    d.polygon([(5,5),(17,5),(17,17),(11,27),(5,17)], fill=S2)
    d.polygon([(6,6),(16,6),(16,16),(11,24),(6,16)], fill=S1)
    d.line([(11,6),(11,24)], fill=R2); d.line([(6,12),(16,12)], fill=R2)
    d.rectangle([10,11,12,13], fill=G1); px(d,11,12,G3)
    d.line([(5,5),(17,5)], fill=(255,255,255,255))
    for x,y in ((6,7),(16,7)): px(d,x,y,S4)
    return im
# 2 amuleto de pedra
def amulet():
    im,d=new()
    d.arc([3,0,19,20], 200, 340, fill=G2); d.arc([4,1,18,19], 200, 340, fill=G1)
    d.ellipse([5,12,17,28], fill=S4); d.ellipse([6,13,16,27], fill=S3); d.ellipse([7,14,15,26], fill=S2)
    d.ellipse([8,15,12,19], fill=S1)
    d.line([(11,17),(11,24)], fill=(120,220,255,255)); d.line([(8,20),(14,20)], fill=(120,220,255,255)); d.line([(9,18),(13,23)], fill=(60,150,220,255))
    d.rectangle([10,10,12,12], fill=G2); px(d,11,11,G1)
    return im
# 3 elmo reforçado
def helm():
    im,d=new()
    d.pieslice([3,6,19,26], 180, 360, fill=S3); d.rectangle([3,16,19,28], fill=S3)
    d.pieslice([4,7,18,25], 180, 360, fill=S2); d.rectangle([4,16,18,27], fill=S2)
    d.rectangle([6,10,8,16], fill=S1); d.line([(5,13),(5,10)], fill=S1)
    d.rectangle([5,17,17,19], fill=S4); d.rectangle([10,19,12,27], fill=S4)
    d.line([(11,5),(11,15)], fill=S1); d.polygon([(10,4),(12,4),(14,0),(8,0)], fill=R1); d.line([(9,0),(13,0)], fill=R3)
    d.rectangle([4,26,18,28], fill=S3); d.line([(4,26),(18,26)], fill=S1)
    return im
# 4 elixir de grupo
def elixir():
    im,d=new(); G=(70,200,110,255); Gd=(30,130,70,255); Gl=(170,255,190,255)
    d.rectangle([9,2,13,4], fill=(150,98,50,255)); d.rectangle([9,5,13,8], fill=S1)
    d.polygon([(9,9),(13,9),(19,17),(19,25),(16,29),(6,29),(3,25),(3,17)], fill=Gd)
    d.polygon([(10,10),(12,10),(18,17),(18,25),(15,28),(7,28),(4,25),(4,17)], fill=G)
    d.rectangle([10,16,12,26], fill=(255,255,255,255)); d.rectangle([7,19,15,23], fill=(255,255,255,255))
    d.line([(6,16),(8,13)], fill=Gl)
    return im
# 5 pena de fênix
def feather():
    im,d=new()
    d.polygon([(18,2),(21,8),(19,16),(13,24),(8,31),(7,30),(8,22),(10,13),(14,6)], fill=R2)
    d.polygon([(18,3),(19,9),(17,16),(12,23),(8,29),(9,21),(11,13),(15,7)], fill=R1)
    d.polygon([(18,4),(18,9),(16,15),(12,21),(10,16),(13,10)], fill=(255,150,50,255))
    d.polygon([(17,6),(17,10),(15,14),(13,13),(15,9)], fill=G1)
    d.line([(18,3),(8,30)], fill=G2)
    for x,y in ((20,4),(5,26),(3,20)): px(d,x,y,G1)
    return im
# 6 erva cicatrizante
def herb():
    im,d=new(); L1=(90,200,80,255); L2=(50,140,60,255); L3=(150,240,120,255)
    for (ang,x0) in ((-1,6),(0,11),(1,16)):
        pass
    d.polygon([(11,3),(15,9),(14,17),(11,22),(8,17),(7,9)], fill=L2); d.polygon([(11,4),(14,9),(13,16),(11,20),(9,16),(8,9)], fill=L1); d.line([(11,5),(11,21)], fill=L3)
    d.polygon([(4,9),(9,13),(9,20),(6,22),(3,17)], fill=L2); d.polygon([(5,11),(8,14),(8,19),(6,20),(4,16)], fill=L1)
    d.polygon([(18,9),(13,13),(13,20),(16,22),(19,17)], fill=L2); d.polygon([(17,11),(14,14),(14,19),(16,20),(18,16)], fill=L1)
    d.rectangle([9,21,13,29], fill=(120,80,40,255)); d.rectangle([8,23,14,25], fill=R1); d.rectangle([8,24,14,24], fill=R2)
    d.line([(11,26),(11,31)], fill=(90,60,30,255))
    px(d,4,6,(255,120,160,255)); px(d,18,6,(255,120,160,255)); px(d,11,1,(255,120,160,255))
    return im
# 7 lente do caçador
def lens():
    im,d=new()
    d.ellipse([2,2,18,18], fill=G3); d.ellipse([3,3,17,17], fill=G2); d.ellipse([4,4,16,16], fill=G1)
    d.ellipse([5,5,15,15], fill=(110,190,235,255)); d.ellipse([6,6,13,12], fill=(170,225,250,255)); d.ellipse([7,7,9,9], fill=(255,255,255,255))
    d.line([(10,10),(10,10)], fill=R1); d.line([(5,10),(15,10)], fill=(60,120,190,255)); d.line([(10,5),(10,15)], fill=(60,120,190,255))
    d.polygon([(15,16),(18,19),(20,31),(17,32),(14,21)], fill=(120,76,40,255)); d.line([(16,19),(18,30)], fill=(170,116,64,255))
    d.rectangle([13,16,17,18], fill=G2)
    return im
# 8 dado viciado
def dice():
    im,d=new(); Wt=(240,236,226,255); Ws=(200,194,182,255); Wd=(150,144,134,255)
    d.polygon([(11,3),(20,8),(11,13),(2,8)], fill=Wt)
    d.polygon([(2,9),(11,14),(11,29),(2,23)], fill=Ws)
    d.polygon([(12,14),(20,9),(20,23),(12,29)], fill=Wd)
    for (x,y) in ((11,8),): d.rectangle([x-1,y-1,x,y], fill=R2)
    for (x,y) in ((4,15),(8,21),(4,20),(8,26)): px(d,x,y,R3)
    for (x,y) in ((14,16),(17,13),(14,22),(17,19)): px(d,x,y,(60,50,50,255))
    px(d,11,8,R1)
    d.line([(2,8),(11,3)], fill=(255,255,255,255))
    px(d,1,3,G1); px(d,21,4,G1)
    return im
# 9 tônico de fúria
def tonic():
    im,d=new(); O1=(255,150,40,255); O2=(210,90,20,255); O3=(255,214,110,255)
    d.rectangle([10,3,12,5], fill=(150,98,50,255)); d.rectangle([9,6,13,9], fill=S1)
    d.polygon([(8,10),(14,10),(17,15),(17,26),(14,30),(8,30),(5,26),(5,15)], fill=O2)
    d.polygon([(9,11),(13,11),(16,16),(16,25),(13,29),(9,29),(6,25),(6,16)], fill=O1)
    d.polygon([(11,15),(14,21),(13,26),(11,27),(9,26),(8,21)], fill=R1); d.polygon([(11,18),(12,22),(11,25),(10,22)], fill=O3)
    d.line([(7,14),(8,12)], fill=O3)
    return im
# 10 pó de pólvora
def powder():
    im,d=new(); B1=(150,104,60,255); B2=(104,68,36,255); B3=(190,140,84,255)
    d.polygon([(7,10),(15,10),(19,18),(19,27),(15,31),(7,31),(3,27),(3,18)], fill=B2)
    d.polygon([(8,11),(14,11),(18,18),(18,26),(14,30),(8,30),(4,26),(4,18)], fill=B1)
    d.line([(6,16),(7,13)], fill=B3); d.line([(5,20),(5,24)], fill=B3)
    d.rectangle([7,8,15,11], fill=B2); d.rectangle([8,9,14,10], fill=(200,170,110,255))
    d.line([(11,8),(14,3)], fill=(120,98,60,255)); px(d,14,2,G1); px(d,13,1,(255,170,40,255)); px(d,15,1,(255,170,40,255)); px(d,14,0,(255,255,200,255))
    for (x,y) in ((9,22),(12,19),(14,24),(8,26),(12,27)): px(d,x,y,(40,30,26,255))
    return im
# 11 lâmina afiada
def blade():
    im,d=new()
    d.polygon([(19,1),(21,3),(10,22),(7,20)], fill=S2); d.polygon([(19,2),(20,3),(10,20),(8,19)], fill=S1)
    d.line([(19,2),(9,20)], fill=(255,255,255,255)); d.line([(20,3),(10,21)], fill=S3)
    d.polygon([(4,19),(9,15),(12,22),(7,25)], fill=G2); d.polygon([(5,19),(9,16),(11,21),(7,24)], fill=G1)
    d.polygon([(6,24),(9,26),(5,32),(3,30)], fill=(120,62,40,255)); d.line([(6,25),(4,30)], fill=(170,100,60,255))
    px(d,3,31,G2)
    px(d,16,6,(255,255,255,255)); px(d,13,12,(255,255,255,255)); px(d,2,4,G1); px(d,1,5,G1); px(d,3,5,G1); px(d,2,6,G1)
    return im
# 12 relógio de areia
def hourglass():
    im,d=new(); Wd1=(150,98,50,255); Wd2=(100,62,30,255); Gl=(190,225,240,255); Sd=(244,200,100,255)
    d.rectangle([3,2,19,5], fill=Wd1); d.rectangle([3,2,19,2], fill=(190,130,70,255)); d.rectangle([3,5,19,5], fill=Wd2)
    d.rectangle([3,29,19,32], fill=Wd1); d.rectangle([3,29,19,29], fill=(190,130,70,255)); d.rectangle([3,32,19,32], fill=Wd2)
    d.polygon([(5,6),(17,6),(17,9),(12,16),(12,18),(17,25),(17,28),(5,28),(5,25),(10,18),(10,16),(5,9)], fill=Gl)
    d.polygon([(7,8),(15,8),(15,10),(11,15),(7,10)], fill=Sd); d.polygon([(8,26),(14,26),(11,20)], fill=Sd); d.rectangle([7,26,15,27], fill=Sd)
    d.line([(11,15),(11,20)], fill=Sd)
    d.line([(6,7),(6,9)], fill=(255,255,255,255))
    d.line([(3,6),(3,28)], fill=Wd2); d.line([(19,6),(19,28)], fill=Wd2)
    return im
# 13 pergaminho ressonante
def scroll():
    im,d=new(); Pp=(236,214,160,255); Pd=(190,160,100,255)
    d.rectangle([4,6,18,28], fill=Pp); d.rectangle([4,6,5,28], fill=Pd); d.rectangle([17,6,18,28], fill=Pd)
    d.ellipse([2,3,20,8], fill=Pd); d.ellipse([3,4,19,7], fill=Pp)
    d.ellipse([2,26,20,31], fill=Pd); d.ellipse([3,27,19,30], fill=Pp)
    for y in (11,14,17): d.line([(7,y),(15,y)], fill=(120,90,60,255))
    d.ellipse([8,18,14,25], fill=(120,50,200,255)); d.ellipse([9,19,13,24], fill=(180,110,255,255)); px(d,10,20,(255,255,255,255)); d.line([(11,21),(11,23)], fill=(90,30,160,255))
    for (x,y) in ((1,12),(21,14),(2,20),(20,22)): px(d,x,y,(190,130,255,255))
    return im
# 14 bomba de luz
def lightbomb():
    im,d=new(); Y1=(255,240,150,255); Y2=(255,200,60,255); Y3=(200,140,20,255)
    for (x,y) in ((11,1),(2,10),(20,10),(4,3),(18,3)): px(d,x,y,Y1)
    d.ellipse([3,9,19,29], fill=Y3); d.ellipse([4,10,18,28], fill=Y2); d.ellipse([5,11,15,22], fill=Y1)
    d.ellipse([6,12,9,15], fill=(255,255,255,255))
    d.rectangle([9,6,13,10], fill=S3); d.rectangle([10,6,12,9], fill=S2)
    d.line([(12,6),(14,3)], fill=(150,110,60,255)); px(d,14,2,(255,255,255,255)); px(d,13,1,Y1); px(d,15,1,Y1)
    d.line([(11,15),(11,24)], fill=Y3); d.line([(7,19),(15,19)], fill=Y3)
    return im
# 15 bomba de fumaça
def smokebomb():
    im,d=new(); K1=(86,92,108,255); K2=(52,56,70,255); K3=(130,138,158,255)
    d.ellipse([3,11,19,30], fill=K2); d.ellipse([4,12,18,29], fill=K1); d.ellipse([6,13,12,19], fill=K3); px(d,7,14,(230,235,245,255))
    d.rectangle([9,8,13,12], fill=S3); d.rectangle([10,8,12,11], fill=S2)
    d.line([(12,8),(15,5)], fill=(150,110,60,255)); px(d,15,4,G1); px(d,14,3,(255,150,40,255))
    for (x,y,r) in ((5,5,3),(10,2,3),(17,6,2)): d.ellipse([x-r,y-r,x+r,y+r], fill=(170,176,190,200)); d.ellipse([x-r+1,y-r+1,x+r-1,y+r-1], fill=(200,205,218,220))
    d.line([(7,20),(15,20)], fill=K2); d.line([(7,24),(15,24)], fill=K2)
    return im
# 16 moeda da sorte
def luckycoin():
    im,d=new()
    d.ellipse([2,6,20,28], fill=G3); d.ellipse([3,7,19,27], fill=G2); d.ellipse([4,8,18,26], fill=G1); d.ellipse([6,10,16,24], fill=G2)
    C1=(70,190,90,255); C2=(30,120,60,255)
    for (cx,cy) in ((9,14),(13,14),(9,19),(13,19)): d.ellipse([cx-2,cy-2,cx+1,cy+1], fill=C1); px(d,cx-1,cy-1,(180,255,190,255))
    d.line([(11,17),(11,24)], fill=C2); px(d,11,17,C2)
    d.line([(5,10),(8,8)], fill=(255,255,255,255))
    for (x,y) in ((20,4),(2,5),(21,12)): px(d,x,y,G1); px(d,x,y-1,G1); px(d,x,y+1,G1); px(d,x-1,y,G1); px(d,x+1,y,G1)
    return im
# 17 relogio de bolso (+5s na pergunta)
CR=(252,246,222,255); CR2=(222,208,170,255); INK=(40,26,30,255)
def watch_s():
    im,d=new()
    d.ellipse([8,2,14,8], outline=G3); d.ellipse([9,3,13,7], outline=G1)   # argola
    d.rectangle([10,3,12,5], fill=G3); d.rectangle([10,2,12,3], fill=G1); px(d,11,2,(255,255,255,255))   # coroa
    d.ellipse([2,7,20,29], fill=G3); d.ellipse([3,8,19,28], fill=G2); d.ellipse([4,9,18,27], fill=G1)
    d.ellipse([5,10,17,26], fill=G3)
    d.ellipse([6,11,16,25], fill=CR2); d.ellipse([6,11,16,24], fill=CR)
    for x,y in ((11,12),(11,24),(7,18),(15,18)): d.rectangle([x,y,x,y+1] if x==11 else [x,y,x+1 if x==15 else x,y], fill=INK)
    for x,y in ((14,13),(8,13),(14,23),(8,23)): px(d,x,y,S3)
    d.line([(11,18),(11,13)], fill=INK); d.line([(11,18),(14,20)], fill=INK); px(d,12,19,INK)   # ponteiros
    d.line([(11,18),(8,22)], fill=R1); px(d,11,18,R2)
    d.line([(5,10),(8,9)], fill=(255,255,255,255)); d.line([(4,12),(4,15)], fill=(255,246,190,255))
    d.rectangle([2,18,3,19], fill=G3)
    return im
# 18 relogio grande (+10s): despertador ornamentado de duas campainhas
B1=(88,150,230,255); B2=(46,96,176,255); B3=(24,52,110,255)
def watch_l():
    im,d=new()
    d.ellipse([1,1,9,8], fill=G3); d.ellipse([2,1,8,7], fill=G2); d.ellipse([3,2,6,4], fill=G1)      # campainha esq
    d.ellipse([13,1,21,8], fill=G3); d.ellipse([14,1,20,7], fill=G2); d.ellipse([15,2,18,4], fill=G1) # campainha dir
    d.line([(5,8),(7,10)], fill=G3, width=2); d.line([(17,8),(15,10)], fill=G3, width=2)
    d.rectangle([10,1,12,4], fill=S3); d.rectangle([10,1,12,1], fill=S1); d.line([(11,4),(11,9)], fill=S3)  # martelo
    d.ellipse([10,0,12,2], fill=R1)
    d.ellipse([0,6,22,29], fill=B3); d.ellipse([1,7,21,28], fill=B2); d.ellipse([2,8,20,27], fill=B1)
    d.ellipse([3,9,19,26], fill=G3); d.ellipse([4,10,18,25], fill=G1); d.ellipse([5,11,17,24], fill=G2)
    d.ellipse([6,12,16,23], fill=CR2); d.ellipse([6,12,16,22], fill=CR)
    import math
    for k in range(12):
        a=math.radians(k*30-90); x=round(11+5.2*math.cos(a)); y=round(17+4.6*math.sin(a))
        px(d,x,y,INK if k%3==0 else S3)
    d.line([(11,17),(11,13)], fill=INK); d.line([(11,17),(14,19)], fill=INK); d.line([(11,17),(8,20)], fill=R1); px(d,11,17,R2)
    d.line([(6,10),(9,9)], fill=(255,255,255,255)); d.line([(3,13),(3,17)], fill=(190,225,255,255))
    d.rectangle([10,27,12,28], fill=G3)
    d.polygon([(3,27),(6,27),(4,31),(1,31)], fill=G3); d.polygon([(19,27),(16,27),(18,31),(21,31)], fill=G3)   # pes
    d.line([(2,31),(3,31)], fill=G1); d.line([(19,31),(20,31)], fill=G1)
    for (x,y) in ((21,10),(1,13)): px(d,x,y,(255,255,255,255)); px(d,x,y-1,(190,225,255,255)); px(d,x,y+1,(190,225,255,255))
    return im
FUN = dict(iron_shield=shield, amulet=amulet, helm=helm, elixir=elixir, phoenix=feather, herb=herb, lens=lens, dice=dice,
           tonic=tonic, powder=powder, blade=blade, hourglass=hourglass, scroll=scroll, lightbomb=lightbomb, smokebomb=smokebomb, luckycoin=luckycoin, watch_s=watch_s, watch_l=watch_l)
if __name__ == '__main__':
    outs = [(n, finish(f(), n)) for n, f in FUN.items()]
    sheet = Image.new('RGBA', (46*9, 68*2), (3,6,13,255))
    for i,(n,o) in enumerate(outs): sheet.paste(o, ((i%9)*46, (i//9)*68), o)
    sheet.resize((sheet.width*2, sheet.height*2), Image.NEAREST).save('/tmp/items_sheet.png')
