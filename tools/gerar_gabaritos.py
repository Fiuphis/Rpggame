"""Gera tools/gabaritos/<heroi>_gabarito.png (guias) e <heroi>_base.png (sprite atual na célula) para desenhar os quadros."""
from PIL import Image, ImageDraw
META={"mage":(209,284),"guerreiro":(210,262),"tank":(244,264),"cleriga":(196,282),"boss":(848,589)}
NOME={"mage":"maga","guerreiro":"guerreiro","tank":"tanque","cleriga":"cleriga","boss":"boss"}
PAD=60
import os; os.makedirs('tools/gabaritos',exist_ok=True)
for w,(mw,mh) in META.items():
    cw,ch=mw+2*PAD,mh+2*PAD
    base=Image.new('RGBA',(cw,ch),(0,0,0,0))
    if w!='boss':
        sp=Image.open(f'assets/sprites/spr_{w}.webp').convert('RGBA'); base.alpha_composite(sp,(PAD,PAD))
    else:
        sp=Image.open('assets/sprites/spr_boss.webp').convert('RGBA'); base.alpha_composite(sp,(PAD,PAD))
    base.save(f'tools/gabaritos/{NOME[w]}_base.png')
    g=Image.new('RGBA',(cw,ch),(40,40,60,255)); gh=base.copy(); gh.putalpha(gh.getchannel('A').point(lambda a:int(a*.45))); g.alpha_composite(gh)
    d=ImageDraw.Draw(g)
    d.rectangle([0,0,cw-1,ch-1],outline=(255,255,0,255))                      # limite da célula
    d.rectangle([PAD,PAD,PAD+mw-1,PAD+mh-1],outline=(0,255,255,160))          # área do sprite parado
    d.line([(cw//2,0),(cw//2,ch)],fill=(255,255,255,70)); d.line([(0,PAD+mh),(cw,PAD+mh)],fill=(255,80,80,200))   # centro e linha dos pés
    g.save(f'tools/gabaritos/{NOME[w]}_gabarito.png')
    print(w,'célula',cw,'x',ch)
