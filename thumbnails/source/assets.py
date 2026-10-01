import numpy as np, cv2
from PIL import Image, ImageFilter
im = Image.open('fly_cut.png').convert('RGBA')
rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2.2, percent=130, threshold=2))
a = im.split()[3]
arr = np.array(rgb).astype(np.float32)/255
bp = np.array([0.20, 0.06, 0.0]); gm = np.array([1.15, 1.25, 1.3])
arr = (np.clip((arr-bp)/(1-bp), 0, 1) ** gm * 255).astype(np.uint8)
rgb = Image.fromarray(arr, 'RGB')
sharp = rgb.copy(); sharp.putalpha(a); sharp.save('build/fly_cut_sharp.png')
al = np.array(a)
b = (al > 40).astype(np.uint8) * 255
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*13+1, 2*13+1))
d = cv2.dilate(b, k)
d = cv2.GaussianBlur(d, (0, 0), 1.8)
out = np.zeros(al.shape + (4,), np.uint8); out[..., :3] = (255, 252, 240); out[..., 3] = d
Image.fromarray(out, 'RGBA').save('build/fly_outline.png')
print('ok', im.size)
