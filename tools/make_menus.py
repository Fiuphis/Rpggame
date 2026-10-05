# Gera os quadros dos menus (menu_*.png) e do painel de pergunta (question_panel.png) a partir das artes enviadas.
# Apaga só o que é dinâmico (título, caixa TIPO, tempo, contadores); o resto da arte fica como veio.
import sys, json
from PIL import Image, ImageDraw
import numpy as np
U = '/root/.claude/uploads/3a96d84d-702c-52a6-9324-e85ba38ea593/'
OUT = '/home/claude/rpggame/'
W_OUT = 1280
META = {}
# nome: (arquivo, título[x0,y0,x1,y1], tipo, tempo, contadores[(x,y)], cartões(cols x, rows y), extras a apagar)
CFG = {
 'cleriga': dict(f='3dfd042c', title=(235,185,720,285), tipo=(905,212,1088,276), time=(1415,225,1488,270),
    cnt=[(780,360),(1440,360),(780,528),(1442,530),(780,720),(1442,722)],
    cols=[(195,818),(843,1483)], rows=[(320,478),(495,662),(682,850)]),
 'mage': dict(f='f627950f', title=(195,180,650,275), tipo=(862,198,1043,262), time=(1380,205,1455,252),
    cnt=[(763,362),(1424,362),(764,548),(1427,550),(766,762),(1424,764)],
    cols=[(158,802),(822,1462)], rows=[(320,488),(503,705),(720,900)]),
 'guerreiro': dict(f='6ea52175', title=(210,160,745,255), tipo=(893,178,1058,245), time=(1405,190,1478,238),
    cnt=[(763,337),(1433,337),(763,532),(1431,531),(761,725),(1433,725)],
    cols=[(147,803),(828,1475)], rows=[(297,468),(490,660),(683,848)]),
 'tank': dict(f='478aefaa', title=(235,180,660,270), tipo=(917,195,1083,262), time=(1405,205,1470,255),
    cnt=[(768,354),(1410,354),(768,545),(1410,545),(768,734),(1410,734)],
    cols=[(172,805),(823,1447)], rows=[(315,488),(507,675),(697,855)]),
 'elem': dict(f='4eceb104', title=None, tipo=(945,197,1100,256), time=(1425,205,1490,250),
    cnt=[(758,350),(1443,350),(758,538),(1443,538),(760,713)],
    cols=[(152,802),(822,1482)], rows=[(303,470),(490,655),(672,838)],
    extra=[(328,395,508,450)]),
}
def fill(a, box, pad=3):
    x0,y0,x1,y1 = box
    ring = np.concatenate([a[y0-pad:y0,x0:x1].reshape(-1,4), a[y1:y1+pad,x0:x1].reshape(-1,4),
                           a[y0:y1,x0-pad:x0].reshape(-1,4), a[y0:y1,x1:x1+pad].reshape(-1,4)])
    c = np.median(ring, axis=0).astype(np.uint8); c[3] = 255
    a[y0:y1,x0:x1] = c
def build(name, c, debug=False):
    im = Image.open(U + c['f'] + '-image.png').convert('RGBA'); a = np.array(im)
    boxes = [] if debug else []
    if not debug:
        if c['title']: fill(a, c['title'])
        fill(a, c['tipo']); fill(a, c['time'])
        for (x,y) in c['cnt']: fill(a, (x-22,y-22,x+22,y+22))
        for b in c.get('extra', []): fill(a, b)
    im = Image.fromarray(a)
    if name == 'guerreiro':   # "Dano hormal." -> "Dano normal."
        from PIL import ImageFont
        fill(a, (1015,364,1395,392)); im = Image.fromarray(a); d = ImageDraw.Draw(im)
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 23)
        d.text((1020,365), 'Golpe de espada. Dano normal.', font=f, fill=(112,150,236,255))
    bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if debug:
        d = ImageDraw.Draw(im)
        for x0,x1 in c['cols']:
            for y0,y1 in c['rows']: d.rectangle((x0,y0,x1,y1), outline=(255,0,255,255), width=2)
        for k in ('title','tipo','time'):
            if c[k]: d.rectangle(c[k], outline=(0,255,0,255), width=2)
        for (x,y) in c['cnt']: d.rectangle((x-22,y-22,x+22,y+22), outline=(255,255,0,255), width=2)
        im.save(f'/tmp/dbg_{name}.png'); return
    im = im.crop(bb); sx = W_OUT / im.width
    meta = dict(bbox=bb, w=im.width, h=im.height)
    def rel(x,y): return ((x-bb[0])/im.width*100, (y-bb[1])/im.height*100)
    im = im.resize((W_OUT, round(im.height*sx)), Image.LANCZOS)
    im.quantize(256, method=Image.FASTOCTREE, dither=Image.NONE).save(OUT + f'menu_{name}.png', optimize=True)
    def pr(b): x0,y0,x1,y1 = b; return [round((x0-bb[0])/meta['w']*100,2), round((y0-bb[1])/meta['h']*100,2), round((x1-x0)/meta['w']*100,2), round((y1-y0)/meta['h']*100,2)]
    m = dict(ratio=round(meta['w']/meta['h'],4),
      title=pr(c['title']) if c['title'] else None, tipo=pr(c['tipo']), time=pr(c['time']),
      cnt=[pr((x-22,y-22,x+22,y+22)) for x,y in c['cnt']],
      cards=[[pr((x0,y0,x1,y1)) for x0,x1 in c['cols']] for y0,y1 in c['rows']])
    META[name] = m
    return im.size
if __name__ == '__main__':
    dbg = len(sys.argv) > 1 and sys.argv[1] == 'debug'
    for n,c in CFG.items(): print(n, build(n,c,dbg))
    if not dbg:
        # painel de pergunta (arte nova): apaga moeda, tempo e contadores
        im = Image.open(U + '1656b6a3-image.png').convert('RGBA'); a = np.array(im)
        for b in [(355,247,386,279),(1742,155,1814,212),(1722,242,1802,294)] + [(1700,y-27,1775,y+27) for y in (396,496,598,700)]: fill(a, b)
        im = Image.fromarray(a); bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox(); im = im.crop(bb)
        w,h = im.size
        def pr(b): x0,y0,x1,y1 = b; return [round((x0-bb[0])/w*100,2), round((y0-bb[1])/h*100,2), round((x1-x0)/w*100,2), round((y1-y0)/h*100,2)]
        META['question'] = dict(ratio=round(w/h,4), tipo=pr((237,184,518,221)), attr=pr((237,273,518,300)), title=pr((535,145,1575,318)),
            coin=pr((1742,155,1814,212)), time=pr((1722,242,1802,294)), dot=pr((358,251,382,275)),
            rows=[pr((130,y0,1850,y1)) for y0,y1 in ((355,437),(455,538),(558,640),(660,745))],
            lab=[pr((315,y0,1650,y1)) for y0,y1 in ((355,437),(455,538),(558,640),(660,745))],
            cnt=[pr((1700,y-27,1775,y+27)) for y in (396,496,598,700)])
        im.resize((1280, round(h*1280/w)), Image.LANCZOS).quantize(256, method=Image.FASTOCTREE, dither=Image.NONE).save(OUT + 'question_panel.png', optimize=True)
        open(OUT + 'menu_meta.js','w').write('const MENU_META=' + json.dumps(META, separators=(',',':')) + ';\n')
