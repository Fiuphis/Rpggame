# Cenario do Hrimgar: recorta/escala a arte (941x1672) para 1024x1536, cola a placa do boss (nome + caixa de moedas) vinda do cenario do Malgorath em tons de gelo
import sys, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
SRC, NOHUD, CLEAN, TOP = sys.argv[1], 'assets/backgrounds/game_nohud.png', 'assets/backgrounds/game_clean.png', int(sys.argv[2]) if len(sys.argv) > 2 else 110
sc = Image.open(SRC).convert('RGB'); s = 1024 / sc.width
big = sc.resize((1024, round(sc.height * s)), Image.LANCZOS).crop((0, TOP, 1024, TOP + 1536))
NAME = 'HRIMGAR, O REI GELADO'
def make(base_path, out):
    base = np.array(Image.open(base_path).convert('RGB')).astype(int); ice = np.array(big).astype(int)
    for (x0, y0, x1, y1) in [(205, 56, 825, 104), (872, 26, 1000, 84)]:
        reg = base[y0:y1, x0:x1].copy(); R, G, B = reg[..., 0], reg[..., 1], reg[..., 2]
        m = ((R > B - 6) | (reg.max(2) < 38)) & ~((reg.min(2) > 150) & (np.abs(R - B) < 25))   # placa (sem o texto antigo claro)
        m = ndi.binary_closing(m, iterations=3); m = ndi.binary_fill_holes(m); m = ndi.binary_dilation(m, iterations=1)
        sw = reg.copy(); red = (R > B + 35); sw[..., 0] = np.where(red, B * .8 + 20, R); sw[..., 2] = np.where(red, np.minimum(255, R * 1.0 + 30), B)  # vermelho -> azul gelo
        sw[..., 1] = np.where(red, np.minimum(255, G + 60), G)
        a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), .8)[..., None]
        ice[y0:y1, x0:x1] = (sw * a + ice[y0:y1, x0:x1] * (1 - a)).astype(int)
    im = Image.fromarray(np.clip(ice, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    size = 21; ft = ImageFont.truetype('/tmp/tc2/pix700.ttf', size); w = d.textlength(NAME, font=ft)
    while w > 300: size -= 1; ft = ImageFont.truetype('/tmp/tc2/pix700.ttf', size); w = d.textlength(NAME, font=ft)
    x = 512 - w / 2; y = 36
    for dx in (-2, -1, 0, 1, 2):
        for dy in (-2, -1, 0, 1, 2):
            if dx or dy: d.text((x + dx, y + dy), NAME, font=ft, fill=(8, 18, 44))
    d.text((x, y), NAME, font=ft, fill=(214, 232, 255)); im.save(out); return im
a = make(NOHUD, 'assets/backgrounds/game_nohud_ice.png'); make(CLEAN, 'assets/backgrounds/game_clean_ice.png'); print('ok')
