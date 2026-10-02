import numpy as np, cv2, json
from PIL import Image, ImageDraw
def poly_mask(shape, polys):
    m = Image.new('L', (shape[1], shape[0]), 0); d = ImageDraw.Draw(m)
    for p in polys: d.polygon([tuple(q) for q in p], fill=255)
    return np.array(m) > 0
CH = {
 'mage': dict(
   parts = {
     'hat':  dict(poly=[[[66,0],[170,0],[170,42],[152,57],[124,64],[96,64],[74,55],[66,42]]], pivot=[112,60],
                  env=[[[84,52],[150,52],[160,72],[100,72],[84,66]]]),
     'arm':  dict(poly=[[[150,90],[160,92],[176,98],[186,98],[186,124],[196,126],[196,142],[164,142],[148,128]]], pivot=[154,94],
                  env=[[[136,86],[172,86],[176,142],[140,142]]]),
     'hand': dict(poly=[[[186,96],[209,96],[209,126],[186,126]]], pivot=[190,112], env=[]),
   },
   kill=[[[176,125],[212,125],[212,146],[176,146]]],
   order=['hand','arm','hat']),
 'cleric': dict(
   parts = {
     'hood': dict(poly=[[[96,18],[164,18],[168,58],[160,72],[142,78],[120,78],[104,72],[96,55]]], pivot=[130,76],
                  env=[[[104,66],[160,66],[164,92],[100,92]]]),
     'armR': dict(poly=[[[172,6],[242,6],[242,66],[216,72],[212,76],[208,96],[218,130],[226,150],[238,200],[224,206],[210,200],[198,150],[196,136],[184,136],[183,190],[191,190],[192,138],[176,134],[166,126],[164,104],[176,94],[190,80],[196,70],[172,66]]], pivot=[178,98],
                  env=[[[168,98],[200,98],[206,140],[190,140],[168,128]]]),
     'handR': dict(poly=[[[193,76],[210,76],[210,98],[193,98]]], pivot=[200,92], env=[]),
     'armL': dict(poly=[[[80,112],[102,112],[114,140],[114,178],[106,206],[96,210],[88,176],[80,168],[66,152],[66,180],[80,184],[82,150]]], pivot=[96,114],
                  env=[[[100,112],[114,112],[118,180],[108,208],[100,180]]]),
     'handL': dict(poly=[[[64,150],[82,150],[82,180],[64,180]]], pivot=[74,160], env=[]),
   },
   order=['handR','handL','armR','armL','hood']),
}
out={}
for n,cfg in CH.items():
    src = np.array(Image.open(f'tools/rig_src/{n}_body.png').convert('RGBA'))
    h,w = src.shape[:2]
    for kp in cfg.get('kill',[]):
        km = poly_mask((h,w),[kp]); src[km] = [0,0,0,0]
    alpha = src[...,3] > 8
    taken = np.zeros((h,w),bool); masks={}
    for k in cfg['order']:
        m = poly_mask((h,w), cfg['parts'][k]['poly']) & alpha & ~taken
        masks[k]=m; taken |= m
    # hand/arm: arm has hand carved out already by order
    base = src.copy(); hole = taken.copy()
    env = np.zeros((h,w),bool)
    for k in cfg['order']:
        if cfg['parts'][k]['env']: env |= poly_mask((h,w), cfg['parts'][k]['env'])
    # inpaint hole within env (RGB), keeping alpha only where hole∩env
    fill = hole & env
    PATCH = {'mage':{'hat':(86,70,150,74),'arm':(132,100,146,130)},'cleric':{'hood':(112,78,150,88),'armR':(158,106,166,128),'armL':(112,120,132,200)}}
    rng = np.random.default_rng(1)
    rgb = cv2.cvtColor(src[...,:3], cv2.COLOR_RGB2BGR)
    inp = cv2.inpaint(rgb, (hole).astype(np.uint8)*255, 4, cv2.INPAINT_TELEA)
    inp = cv2.cvtColor(inp, cv2.COLOR_BGR2RGB)
    base[hole] = [0,0,0,0]
    for k in cfg['order']:
        if not cfg['parts'][k]['env']: continue
        pe = poly_mask((h,w), cfg['parts'][k]['env']) & masks[k]
        x0,y0,x1,y1 = PATCH[n][k]; pt = src[y0:y1,x0:x1].reshape(-1,4); pt = pt[pt[:,3]>200]
        if (n,k)==('cleric','armL'):
            sel = (pt[:,:3].max(1).astype(int)-pt[:,:3].min(1)<45)&(pt[:,:3].mean(1)>150); pt = pt[sel] if sel.sum()>5 else pt
        ys,xs = np.nonzero(pe)
        med = np.median(pt[:,:3],axis=0); d = np.abs(pt[:,:3].astype(int)-med).sum(1); pt = pt[d <= np.percentile(d,60)]
        cache={}
        for y,x in zip(ys,xs):
            key=(y//3,x//3)
            if key not in cache: cache[key]=pt[rng.integers(len(pt))]
            base[y,x] = cache[key]
    Image.fromarray(base).save(f'rig/{n}_base.png')
    for k,m in masks.items():
        im = np.zeros_like(src); im[m] = src[m]
        Image.fromarray(im).save(f'rig/{n}_{k}.png')
    out[n] = {k: dict(pivot=cfg['parts'][k]['pivot']) for k in cfg['order']}
    # preview
    prev = Image.new('RGBA',(w,h),(70,70,90,255)); prev.alpha_composite(Image.fromarray(base))
    for k in cfg['order']: prev.alpha_composite(Image.open(f'rig/{n}_{k}.png'))
    prev.resize((w*3,h*3),Image.NEAREST).save(f'/tmp/{n}_recomp.png')
    prev2 = Image.new('RGBA',(w,h),(70,70,90,255)); prev2.alpha_composite(Image.fromarray(base)); prev2.resize((w*3,h*3),Image.NEAREST).save(f'/tmp/{n}_baseonly.png')
