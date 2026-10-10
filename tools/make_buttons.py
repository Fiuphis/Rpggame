from PIL import Image, ImageDraw
import random
def btn(name, base, light, dark, edge, studs, w=48, h=16, seal=False):
    random.seed(7)
    im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    def P(x,y,c):
        if 0<=x<w and 0<=y<h: im.putpixel((x,y),c)
    # chamfered silhouette: corners cut by 2 stepped pixels
    def inside(x,y):
        cx=min(x,w-1-x); cy=min(y,h-1-y)
        return not ((cx==0 and cy<3) or (cy==0 and cx<3) or (cx==1 and cy==1))
    for y in range(h):
        for x in range(w):
            if not inside(x,y): continue
            border = (x in (0,w-1) or y in (0,h-1) or not inside(x-1,y) or not inside(x+1,y) or not inside(x,y-1) or not inside(x,y+1))
            if border: P(x,y,edge); continue
            c=base
            if y<=2: c=light
            elif y>=h-3: c=dark
            elif (x<9 or x>w-10) and (y+x//7)%4==0 and random.random()<.55: c=dark   # veios so nas pontas, centro liso p/ ler o texto
            elif (x<9 or x>w-10) and random.random()<.06: c=light
            P(x,y,c)
    # moldura interna dourada fina
    gold=(214,164,80,255); g2=(246,214,138,255)
    for x in range(4,w-4): P(x,3,gold); P(x,h-4,(110,74,30,255))
    for y in range(4,h-4): P(3,y,gold); P(w-4,y,(110,74,30,255))
    # rebites de ferro nos cantos
    for (sx,sy) in [(3,3),(w-4,3),(3,h-4),(w-4,h-4)]:
        P(sx,sy,studs[0]);P(sx-1,sy,studs[1]) if False else None
    for (sx,sy) in [(2,2),(w-3,2),(2,h-3),(w-3,h-3)]:
        P(sx,sy,studs[1]);P(sx+1,sy,studs[0]);P(sx,sy+1,studs[0])
    im=im.resize((w*6,h*6),Image.NEAREST); im.save(name)
    return im
btn('assets/ui/btn_wood.png',(122,82,44,255),(168,120,66,255),(84,54,28,255),(26,16,8,255),((60,60,76,255),(150,150,170,255)))
btn('assets/ui/btn_dark.png',(70,60,84,255),(104,92,122,255),(44,36,56,255),(18,12,26,255),((200,160,80,255),(250,222,150,255)))
btn('assets/ui/btn_gold.png',(176,126,40,255),(232,186,84,255),(120,82,24,255),(40,24,6,255),((60,40,14,255),(255,236,160,255)))
