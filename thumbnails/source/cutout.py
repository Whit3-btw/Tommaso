import numpy as np, cv2
from PIL import Image

im = Image.open('fly.png').convert('RGB')
# crop region (orig coords) and 3x upscale -> crop coords == polygon coords below
x0, y0, x1, y1 = 250, 40, 610, 469
c = im.crop((x0, y0, x1, y1))
S = 3
c = c.resize((c.width*S, c.height*S), Image.LANCZOS)
bgr = cv2.cvtColor(np.array(c), cv2.COLOR_RGB2BGR)
H, W = bgr.shape[:2]

polys = {
 'body': [(300,440),(318,368),(350,425),(420,418),(490,420),(505,368),(520,432),(560,435),(600,455),
          (606,520),(606,700),(610,900),(606,1090),(590,1112),(480,1125),(350,1122),(290,1112),(270,1090),
          (270,900),(270,780),(272,700),(258,650),(258,590),(255,520),(275,505),(272,460),(285,440)],
 'larm': [(275,735),(205,745),(150,790),(120,850),(105,905),(105,930),(125,955),(160,945),(170,900),
          (170,870),(185,825),(220,790),(275,780)],
 'rarm_bat': [(600,700),(655,700),(690,665),(700,620),(700,580),(690,580),(685,560),(690,500),(700,475),
          (715,470),(745,340),(775,190),(775,100),(790,70),(800,62),(850,62),(878,95),(870,140),(835,270),
          (790,400),(755,480),(748,500),(745,570),(740,600),(740,640),(725,700),(690,740),(640,745),(600,745)],
 'lleg': [(335,1115),(372,1115),(378,1190),(400,1215),(405,1250),(395,1290),(265,1290),(275,1240),(320,1200),(330,1150)],
 'rleg': [(505,1115),(545,1115),(548,1210),(565,1235),(562,1290),(460,1290),(470,1240),(500,1215)],
}
poly = np.zeros((H, W), np.uint8)
for p in polys.values():
    cv2.fillPoly(poly, [np.array(p, np.int32)], 255)

k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r+1, 2*r+1))
outer = cv2.dilate(poly, k(16))
inner = cv2.erode(poly, k(10))

mask = np.full((H, W), cv2.GC_BGD, np.uint8)
mask[outer > 0] = cv2.GC_PR_BGD
mask[poly > 0] = cv2.GC_PR_FGD
mask[inner > 0] = cv2.GC_FGD

bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(bgr, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# clean: keep large components, close small holes, smooth edge
n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
keep = np.zeros_like(fg)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] > 1500: keep[lab == i] = 255
keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, k(5))
keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, k(2))
alpha = cv2.GaussianBlur(keep, (0, 0), 1.6)

rgba = np.dstack([cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), alpha])
Image.fromarray(rgba, 'RGBA').save('fly_cut.png')
Image.fromarray(poly).save('dbg_poly.png')

# previews: over teal and overlay of polygon on source
def over(color):
    bg = np.zeros((H, W, 3), np.float32); bg[:] = color
    a = alpha[..., None].astype(np.float32) / 255
    out = rgba[..., :3].astype(np.float32) * a + bg * (1 - a)
    return Image.fromarray(out.astype(np.uint8))
over((20, 110, 150)).save('prev_teal.png')
ov = np.array(c).copy()
cnt, _ = cv2.findContours(poly, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(ov, cnt, -1, (0, 255, 255), 2)
Image.fromarray(ov).save('prev_poly.png')
print(rgba.shape, 'fg px', int((alpha > 128).sum()))
