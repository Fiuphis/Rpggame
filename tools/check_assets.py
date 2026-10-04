#!/usr/bin/env python3
"""Confere que todo arquivo citado em HTML/CSS/JS existe e esta na lista de cache offline (sw.js), e que a lista nao cita arquivos inexistentes."""
import re, os, glob, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sw = open('sw.js').read(); assets = set(re.findall(r"'\./([^']+)'", sw))
bad = [f'sw.js cita arquivo inexistente: {a}' for a in sorted(assets) if a and not os.path.exists(a)]
refs = set()
for f in glob.glob('*.html') + glob.glob('*.css') + glob.glob('*.js'):
    if f == 'sw.js': continue
    for m in re.findall(r"""(?:url\(['"]?|src=['"]|href=['"]|['"`])([A-Za-z0-9_\-/\.]+\.(?:png|webp|jpg|json|woff2|js|css))""", open(f, errors='ignore').read()):
        if not m.startswith(('http', '//')): refs.add(m.lstrip('./'))
for r in sorted(refs):
    if not os.path.exists(r): bad.append(f'referenciado e inexistente: {r}')
    elif r not in assets and r != 'sw.js': bad.append(f'fora do cache offline: {r}')
print('\n'.join(bad) if bad else 'OK: arquivos e cache offline consistentes'); sys.exit(1 if bad else 0)
