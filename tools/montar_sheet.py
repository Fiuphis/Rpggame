"""Junta quadros PNG (todos do tamanho da célula) numa folha horizontal e imprime a linha do manifest.
Uso: python3 tools/montar_sheet.py <pasta_dos_quadros> <heroi> <animacao> [fps]
Os quadros são ordenados pelo nome (ex.: maga_melee_01.png ... _06.png). Saída: anim/<heroi>_<animacao>.png"""
import sys, glob, json, os
from PIL import Image
pasta,heroi,anim=sys.argv[1:4]; fps=int(sys.argv[4]) if len(sys.argv)>4 else 12
META={"mage":(237,276),"knight":(236,286),"tank":(276,280),"assassin":(247,307),"boss":(946,601)}
mw,mh=META[heroi]; cw,ch=mw+120,mh+120
fr=sorted(glob.glob(os.path.join(pasta,'*.png')))
if not fr: sys.exit('nenhum PNG em '+pasta)
sheet=Image.new('RGBA',(cw*len(fr),ch),(0,0,0,0))
for i,f in enumerate(fr):
    im=Image.open(f).convert('RGBA')
    if im.size!=(cw,ch): sys.exit(f'{f}: tamanho {im.size}, esperado {(cw,ch)}')
    sheet.alpha_composite(im,(i*cw,0))
os.makedirs('anim',exist_ok=True); out=f'anim/{heroi}_{anim}.png'; sheet.save(out)
print(f'salvo {out} ({len(fr)} quadros). Cole no anim/manifest.json em heroes.{heroi}:')
print(json.dumps({anim:{"src":out,"frames":len(fr),"fps":fps}},ensure_ascii=False))
