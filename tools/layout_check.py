#!/usr/bin/env python3
"""Trava de seguranca de layout: abre as telas do jogo em varios formatos de celular e confere que
 (1) o que fica DENTRO do quadro 2:3 tem a mesma posicao relativa em qualquer celular;
 (2) o que fica preso a janela (painel do boss, botoes de canto) nunca sai da tela nem se sobrepoe;
 (3) nao ha rolagem horizontal.
Uso: python3 tools/layout_check.py [--shots pasta]   (sai com codigo 1 se algo estiver fora do lugar)"""
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8791
PHONES = [('360x640',360,640),('360x740',360,740),('375x667',375,667),('390x844',390,844),('412x915',412,915),('430x932',430,932),('360x800',360,800)]
TABLET = ('768x1024',768,1024)
SHOTS = sys.argv[sys.argv.index('--shots')+1] if '--shots' in sys.argv else None
TOL = 0.006   # 0,6% do tamanho do quadro
Q = """(sel)=>{const e=document.querySelector(sel.el),s=document.querySelector(sel.ref);if(!e||!s)return null;const a=e.getBoundingClientRect(),b=s.getBoundingClientRect();
 return [(a.left-b.left)/b.width,(a.top-b.top)/b.height,a.width/b.width,a.height/b.height]}"""
INNER = {   # pagina -> (quadro, [elementos dentro do quadro])
 'index': ('#stage', ['#confirm','.ab-title']),
 'map':   ('#map',   ['#quote','#grays']),
 'game':  ('#game',  ['.bag','#bag','.shop.s0','.shop.s3','.hero.mage','.hero.knight','.hero.tank','.hero.assassin','.hud-hero[data-hero=mage]','.hud-hero[data-hero=assassin]','.ult-icon[data-hero=tank]','.hero-chips']),
}
fails = []
def fail(m): fails.append(m); print('  FALHA:', m)
srv = subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
ref = {}
try:
  with sync_playwright() as p:
    b = p.chromium.launch()
    for name,w,h in PHONES+[TABLET]:
        phone = (name,w,h) != TABLET
        print(f'[{name}]')
        ctx = b.new_context(viewport={'width':w,'height':h}); pg = ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        def snap(tag):
            if SHOTS: os.makedirs(SHOTS,exist_ok=True); pg.screenshot(path=f'{SHOTS}/{name}_{tag}.png')
        def inner(page,tag):
            frame,els = INNER[page]
            for el in els:
                r = pg.evaluate(Q,{'el':el,'ref':frame})
                if r is None: continue
                key=(page,el)
                if phone:
                    if key not in ref: ref[key]=r
                    elif any(abs(a-c)>TOL for a,c in zip(r,ref[key])): fail(f'{page} {el} em {name}: {[round(x,3) for x in r]} != referencia {[round(x,3) for x in ref[key]]}')
        def common(page):
            if pg.evaluate("document.documentElement.scrollWidth>innerWidth+1"): fail(f'{page} em {name}: rolagem horizontal')
        pg.goto(f'http://localhost:{PORT}/index.html'); pg.wait_for_timeout(2200)
        inner('index',''); common('index'); snap('index')
        pg.goto(f'http://localhost:{PORT}/map.html?grupo=mage&teste=1'); pg.wait_for_timeout(4500)
        pg.evaluate("document.querySelector('.node:not(.locked)').click()"); pg.wait_for_timeout(600)
        inner('map',''); common('map')
        m = pg.evaluate("""()=>{const r=s=>{const e=document.querySelector(s).getBoundingClientRect();return [e.left,e.top,e.right,e.bottom]};return {map:r('#map'),panel:r('#panel'),back:r('#back'),reset:r('#reset'),h:innerHeight,w:innerWidth}}""")
        pl,pt,pr,pb = m['panel']
        if pl<0 or pr>m['w'] or pt<0 or pb>m['h']+1: fail(f'map em {name}: painel do boss fora da tela {m["panel"]}')
        if abs((pl+pr)/2-m['w']/2)>2: fail(f'map em {name}: painel do boss fora do centro')
        if pt < m['map'][3]-0.2*(m['map'][3]-m['map'][1]) : fail(f'map em {name}: painel cobre o mapa (topo {pt:.0f} < base do mapa {m["map"][3]:.0f})')
        if pt < m['reset'][3] or pt < m['back'][3]: fail(f'map em {name}: painel sobe ate os botoes de canto')
        snap('map')
        pg.route('**/app.js',lambda rt:rt.fulfill(body=open(ROOT+'/app.js').read().replace('\nbeginBattle(1500);','\n//noauto'),content_type='application/javascript'))
        pg.goto(f'http://localhost:{PORT}/game.html?grupo=mage&teste=1'); pg.wait_for_timeout(3500)
        pg.evaluate("()=>{const S=BancoDadosGame.state;S.gold=100;S.shop.slots=['amulet','phoenix','hp','lens'];renderShop();setBag(true)}"); pg.wait_for_timeout(700)
        inner('game',''); common('game')
        g = pg.evaluate("()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]};return {game:q('#game'),scroll:q('.scroll'),h:innerHeight,w:innerWidth}}")
        if phone and g['game'][1] > 1: fail(f'game em {name}: quadro nao esta colado ao topo ({g["game"][1]:.0f}px)')
        if phone and abs(g['game'][2]-g['game'][0]-w) > 1: fail(f'game em {name}: quadro nao ocupa a largura toda')
        if g['scroll'] and g['scroll'][2]-g['scroll'][0]>0 and g['scroll'][3] > g['h']+1: fail(f'game em {name}: papiro passa do fim da tela')
        # papiro: conteudo (relatorio final e escolha de alvo) tem que caber dentro do papiro em qualquer altura
        PAP = """()=>{const sc=document.querySelector('#scroll');if(!sc||!document.documentElement.classList.contains('paper'))return null;const r=sc.getBoundingClientRect();let bad=[];
          document.querySelectorAll('#sc-ui *').forEach(e=>{const b=e.getBoundingClientRect();if(b.width&&(b.bottom>r.bottom-10||b.top<r.top+8||b.right>r.right-4||b.left<r.left+4))bad.push((e.className||e.tagName)+'')});return bad.slice(0,4)}"""
        pg.evaluate("()=>{const S=BancoDadosGame.state;S.inventory.length=0;S.inventory.push('hp');S.heroes.mage.hp=40;useInventory(0)}"); pg.wait_for_timeout(600)
        bad = pg.evaluate(PAP)
        if bad: fail(f'game em {name}: escolha de alvo nao cabe no papiro: {bad}')
        pg.evaluate("closeTargetPick()"); pg.wait_for_timeout(200)
        pg.evaluate("endGame(true)"); pg.wait_for_timeout(800)
        bad = pg.evaluate(PAP)
        if bad: fail(f'game em {name}: relatorio final nao cabe no papiro: {bad}')
        snap('end')
        snap('game')
        if errs: fail(f'{name}: erros de JS {errs[:2]}')
        ctx.close()
finally:
    srv.kill()
print(f'{len(ref)} elementos comparados entre os formatos'); print('\nOK: tudo no lugar em todos os formatos.' if not fails else f'\n{len(fails)} problema(s) encontrado(s).')
sys.exit(1 if fails else 0)
