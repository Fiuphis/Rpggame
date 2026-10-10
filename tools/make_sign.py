# Gera assets/ui/shop_sign.png: placa "FECHADO" gasta, em pixel art (64x40), pendurada por cordas.
import random
from PIL import Image, ImageDraw
random.seed(7)
W, H = 64, 40
G = {'F':["11111","10000","10000","11110","10000","10000","10000"],'E':["11111","10000","10000","11110","10000","10000","11111"],
'C':["01111","10000","10000","10000","10000","10000","01111"],'H':["10001","10001","10001","11111","10001","10001","10001"],
'A':["01110","10001","10001","11111","10001","10001","10001"],'D':["11110","10001","10001","10001","10001","10001","11110"],
'O':["01110","10001","10001","10001","10001","10001","01110"]}
img = Image.new('RGBA', (W, H), (0,0,0,0)); px = img.load()
OUT=(20,10,6); DK=(70,42,22); MD=(110,70,36); LT=(142,94,50); HL=(172,122,70); DIRT=(58,40,26); MOSS=(70,84,40)
ROPE=(176,148,92); ROPEd=(112,88,52)
def put(x,y,c):
    if 0<=x<W and 0<=y<H: px[x,y]=c+(255,) if len(c)==3 else c
# cordas com nó
for x0 in (13, 49):
    for y in range(0,8):
        put(x0,y,ROPE if y%2==0 else ROPEd); put(x0+1,y,ROPEd if y%2==0 else ROPE)
    put(x0-1,7,ROPEd); put(x0+2,7,ROPEd)
# corpo (cantos cortados, com lasca no canto inferior direito)
top, bot, L, R = 8, H-2, 2, W-3
def inside(x,y):
    if x<L or x>R or y<top or y>bot: return False
    if (x in (L,R)) and (y in (top,bot)): return False          # cantos
    if x>=R-4 and y>=bot-3 and (x-(R-4))+(y-(bot-3))>=5 and (x-(R-4))>= (y-(bot-3))-1: return False  # lasca
    if x<=L+2 and y<=top+1 and x+y<L+top+3 and (x,y)!=(L+2,top+1): return False
    return True
plank_edges=(top+10, top+21)    # emendas horizontais das tábuas
for y in range(top,bot+1):
    for x in range(L,R+1):
        if not inside(x,y): continue
        edge = any(not inside(x+dx,y+dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
        if edge: put(x,y,OUT); continue
        base = LT
        if y in plank_edges: base = DK
        elif y in (plank_edges[0]+1, plank_edges[1]+1): base = HL
        elif y==top+1: base = HL
        elif y==bot-1: base = DK
        # veios: ruído horizontal
        r = random.random()
        if base==LT:
            if r<.16: base=MD
            elif r<.22: base=HL
        put(x,y,base)
# veios compridos
for (x1,y1,x2) in ((6,top+4,22),(34,top+3,52),(10,top+14,26),(40,top+16,58),(5,top+26,18),(28,top+27,48)):
    for x in range(x1,x2):
        if inside(x,y1): put(x,y1,MD if random.random()<.8 else DK)
# nós de madeira
for (cx,cy) in ((51,top+6),(12,top+17),(53,top+26)):
    for (dx,dy,c) in ((0,0,DK),(1,0,MD),(-1,0,MD),(0,1,MD),(0,-1,MD)): put(cx+dx,cy+dy,c)
# rachaduras
for (x,y,dy) in ((9,top+11,1),(9,top+12,1),(10,top+13,1),(10,top+14,1)): put(x,y,OUT)
for (x,y) in ((46,top+22),(46,top+23),(47,top+24),(47,top+25),(48,top+26)): put(x,y,OUT)
# pregos enferrujados com escorrido
for (nx,ny) in ((6,top+4),(W-7,top+4),(6,bot-5),(W-7,bot-5)):
    put(nx,ny,(46,38,34)); put(nx+1,ny,(120,76,44)); put(nx,ny+1,(96,60,34))
    for k in range(2,4+random.randint(0,2)): put(nx,ny+k,(86,56,34))
# sujeira/musgo nos cantos de baixo
for _ in range(34):
    x=random.randint(L+1,R-1); y=random.randint(bot-6,bot-1)
    if inside(x,y) and px[x,y][:3]!=OUT: put(x,y,DIRT if random.random()<.7 else MOSS)
for _ in range(10):
    x=random.randint(L+1,L+8); y=random.randint(top+1,top+6)
    if inside(x,y) and px[x,y][:3]!=OUT: put(x,y,MOSS)
# texto: tinta desbotada (creme) com sombra e falhas
PAINT=(238,214,160); PAINTd=(176,150,104); SH=(40,18,8)
tw=7*6-1; x0=(W-tw)//2; y0=top+12
cells=[]
for i,ch in enumerate("FECHADO"):
    for r,row in enumerate(G[ch]):
        for c,v in enumerate(row):
            if v=='1': cells.append((x0+i*6+c, y0+r))
for (x,y) in cells: put(x+1,y+1,SH)
for (x,y) in cells:
    r=random.random()
    if r<.06: continue                       # tinta descascada (falha)
    put(x,y,PAINTd if r<.32 else PAINT)
# luz no topo e escurecimento nas bordas
img.save('assets/ui/shop_sign.png')
img.resize((W*8,H*8),Image.NEAREST).save('/tmp/sign.png')
