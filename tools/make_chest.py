# Gera chest_closed.png e chest_open.png (pixel art 32x26, ampliado 4x sem suavizar)
from PIL import Image, ImageDraw
def px(d,x,y,w,h,c): d.rectangle([x,y,x+w-1,y+h-1],fill=c)
WD='#7a4a22';WL='#9c6330';WK='#4a2a12';GD='#e8b83a';GK='#a47a1c';OL='#1a0e06'
def base(d):
    px(d,3,12,26,13,OL);px(d,4,13,24,11,WD)
    for x in (9,15,21): px(d,x,13,1,11,WK)
    px(d,4,13,24,2,WL);px(d,3,12,26,1,OL)
    px(d,6,12,3,13,GD);px(d,23,12,3,13,GD);px(d,6,12,1,13,GK);px(d,23,12,1,13,GK)
def closed():
    im=Image.new('RGBA',(32,26),(0,0,0,0));d=ImageDraw.Draw(im)
    base(d)
    px(d,3,3,26,10,OL);px(d,4,4,24,8,WD);px(d,4,4,24,2,WL)
    for x in (9,15,21): px(d,x,4,1,8,WK)
    px(d,6,3,3,10,GD);px(d,23,3,3,10,GD);px(d,6,3,1,10,GK);px(d,23,3,1,10,GK)
    px(d,14,10,4,5,OL);px(d,15,11,2,3,GD);px(d,16,13,1,1,OL)
    return im
def opened():
    im=Image.new('RGBA',(32,26),(0,0,0,0));d=ImageDraw.Draw(im)
    px(d,4,0,24,6,OL);px(d,5,1,22,4,WD);px(d,5,1,22,1,WL)   # tampa aberta atras
    px(d,7,0,3,6,GD);px(d,22,0,3,6,GD)
    base(d)
    px(d,5,10,22,3,'#fff2a8');px(d,7,9,18,1,'#ffd34d');px(d,9,8,3,1,'#ffd34d');px(d,18,8,4,1,'#fff2a8')   # brilho/ouro
    px(d,10,10,2,2,GD);px(d,15,9,2,2,GD);px(d,20,10,2,2,GD)
    return im
for n,f in (('chest_closed',closed),('chest_open',opened)):
    f().resize((128,104),Image.NEAREST).save(n+'.png')
