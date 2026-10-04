"""Gera fonts/openc.woff2: so os glifos C c Ç ç, em pixel art com a abertura bem visivel (o C das fontes ficava parecido com O/0).
Uso (raiz do repo): python3 tools/make_openc.py   — depois usar @font-face 'OpenC' com unicode-range e por primeiro nas pilhas de fontes."""
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
U = 110
CAP = ['.###', '#...', '#...', '#...', '#...', '.###']
LOW = ['.###', '#...', '#...', '.###']
def glyph(rows, x0, base, extra=()):
    pen = TTGlyphPen(None)
    cells = [(x, base + len(rows) - 1 - y) for y, r in enumerate(rows) for x, ch in enumerate(r) if ch == '#'] + list(extra)
    for x, y in cells:
        X, Y = (x0 + x) * U + 30, y * U
        pen.moveTo((X, Y)); pen.lineTo((X, Y + U)); pen.lineTo((X + U, Y + U)); pen.lineTo((X + U, Y)); pen.closePath()
    return pen.glyph()
g = {'.notdef': TTGlyphPen(None).glyph(), 'C': glyph(CAP, 0, 0), 'c': glyph(LOW, 0, 0),
     'Ccedilla': glyph(CAP, 0, 0, [(3, -1), (2, -2)]), 'ccedilla': glyph(LOW, 0, 0, [(3, -1), (2, -2)])}
def build(fam, names, cmap, out):
    gg = {'.notdef': TTGlyphPen(None).glyph()}; gg.update({n: g[n] for n in names})
    fb = FontBuilder(1000, isTTF=True); order = list(gg)
    fb.setupGlyphOrder(order); fb.setupCharacterMap(cmap); fb.setupGlyf(gg)
    fb.setupHorizontalMetrics({n: (520, 0) for n in order}); fb.setupHorizontalHeader(ascent=900, descent=-250)
    fb.setupNameTable({'familyName': fam, 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=900, sTypoDescender=-250, usWinAscent=900, usWinDescent=250); fb.setupPost()
    fb.font.flavor = 'woff2'; fb.save(out); print(out)
build('OpenC', ['C', 'Ccedilla'], {0x43: 'C', 0xC7: 'Ccedilla'}, 'fonts/openc.woff2')      # maiusculas: servem para qualquer pilha
build('OpenCl', ['c', 'ccedilla'], {0x63: 'c', 0xE7: 'ccedilla'}, 'fonts/opencl.woff2')   # minusculas: so nas pilhas com Pixelify Sans (x-height pixel)

# ---- digitos 0-9 (5x7): o 2 e o 5 da Pixelify Sans lembravam S ----
DIG = {
 '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
 '1': ['..#..', '.##..', '#.#..', '..#..', '..#..', '..#..', '#####'],
 '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
 '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
 '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
 '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
 '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
 '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
 '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
 '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
}
names = {}
U = 92
for d, rows in DIG.items():
    n = 'd' + d; names[n] = glyph(rows, 0, 0); g[n] = names[n]
def build_d():
    gg = {'.notdef': TTGlyphPen(None).glyph()}; gg.update(names)
    fb = FontBuilder(1000, isTTF=True); order = list(gg)
    fb.setupGlyphOrder(order); fb.setupCharacterMap({0x30 + int(k): 'd' + k for k in DIG}); fb.setupGlyf(gg)
    fb.setupHorizontalMetrics({n: (590, 0) for n in order}); fb.setupHorizontalHeader(ascent=900, descent=-250)
    fb.setupNameTable({'familyName': 'OpenD', 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=900, sTypoDescender=-250, usWinAscent=900, usWinDescent=250); fb.setupPost()
    fb.font.flavor = 'woff2'; fb.save('fonts/opend.woff2'); print('fonts/opend.woff2')
build_d()
