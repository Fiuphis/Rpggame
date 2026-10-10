"""Remove potions/prices baked into assets/ui/ice_panel.png shop slots (the game draws them): flat fill with the slot's dark colour."""
import cv2, numpy as np
im = cv2.imread('assets/ui/ice_panel.png', cv2.IMREAD_UNCHANGED); bgr = im[:,:,:3].copy()
def fill(x0, y0, x1, y1, ref):
    col = np.median(bgr[ref[1]:ref[3], ref[0]:ref[2]].reshape(-1,3), axis=0)
    bgr[y0:y1, x0:x1] = col
for x0, x1 in [(1058,1166),(1268,1376),(1478,1586),(1676,1786)]:
    fill(x0+3, 416, x1-6, 534, (x0+14, 428, x0+30, 444))   # potion
    fill(x0-12, 566, x1-6, 616, (x0+60, 598, x0+70, 606))     # coin + price
cv2.imwrite('assets/ui/ice_panel.png', np.dstack([bgr, im[:,:,3]]))
