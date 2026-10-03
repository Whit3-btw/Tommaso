import random, math, base64
R = random.Random(11)
FONT = '/usr/local/lib/python3.11/dist-packages/font_fredoka_one/files/FredokaOne-Regular.ttf'
font64 = base64.b64encode(open(FONT,'rb').read()).decode()

W, H = 1920, 1080
HORIZON = 650
svg = []
A = svg.append

# ---------- defs ----------
A(f'''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#060a3a"/><stop offset=".38" stop-color="#0d2f86"/>
  <stop offset=".72" stop-color="#1583c4"/><stop offset="1" stop-color="#45d4cf"/></linearGradient>
<linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0b5a4a"/><stop offset=".45" stop-color="#16923f"/><stop offset="1" stop-color="#3fcf55"/></linearGradient>
<linearGradient id="pathg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#f6e2a8"/><stop offset="1" stop-color="#d9b06a"/></linearGradient>
<linearGradient id="hillF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f5f94"/><stop offset="1" stop-color="#0a3d6e"/></linearGradient>
<linearGradient id="hillN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c6a63"/><stop offset="1" stop-color="#0a4a4a"/></linearGradient>
<linearGradient id="glassIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbffc6"/><stop offset="1" stop-color="#a6ec4c"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffa8a"/><stop offset=".55" stop-color="#b8ff2e"/><stop offset="1" stop-color="#4fe03a"/></linearGradient>
<linearGradient id="white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe6ff"/></linearGradient>
<linearGradient id="lid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fa3ad"/><stop offset=".4" stop-color="#e6eef2"/><stop offset="1" stop-color="#6f8590"/></linearGradient>
<radialGradient id="orb"><stop offset="0" stop-color="#ffffe0" stop-opacity="1"/><stop offset=".18" stop-color="#eaff6a" stop-opacity=".95"/><stop offset=".45" stop-color="#a6ff3a" stop-opacity=".35"/><stop offset="1" stop-color="#6bff2a" stop-opacity="0"/></radialGradient>
<radialGradient id="warm"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".85"/><stop offset=".5" stop-color="#ff5a1a" stop-opacity=".32"/><stop offset="1" stop-color="#ff3a00" stop-opacity="0"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#d8ff70" stop-opacity=".75"/><stop offset=".6" stop-color="#8dff3a" stop-opacity=".2"/><stop offset="1" stop-color="#6bff2a" stop-opacity="0"/></radialGradient>
<radialGradient id="abd"><stop offset="0" stop-color="#ffffe6"/><stop offset=".6" stop-color="#e2ff47"/><stop offset="1" stop-color="#9be21f"/></radialGradient>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
<filter id="b3"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="heroGlow" x="-30%" y="-30%" width="160%" height="160%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="26" result="b"/>
  <feColorMatrix in="b" type="matrix" values="0 0 0 0 1  0 0 0 0 .42  0 0 0 0 .06  0 0 0 1.5 0" result="g"/>
  <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="7"/></filter>
<g id="ff">
  <circle cx="16" cy="6" r="96" fill="url(#halo)"/><circle cx="18" cy="8" r="46" fill="url(#orb)"/>
  <ellipse cx="-14" cy="-20" rx="26" ry="11" transform="rotate(-28 -14 -20)" fill="#fff" fill-opacity=".6" stroke="#fff" stroke-opacity=".9" stroke-width="2"/>
  <ellipse cx="12" cy="-22" rx="26" ry="11" transform="rotate(24 12 -22)" fill="#fff" fill-opacity=".5" stroke="#fff" stroke-opacity=".9" stroke-width="2"/>
  <path d="M-36 -2 Q-48 -22 -58 -26 M-34 -4 Q-40 -26 -46 -36" stroke="#2c1d10" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="-12" cy="4" rx="16" ry="12" fill="#4a331d" stroke="#1d1209" stroke-width="3"/>
  <circle cx="-32" cy="4" r="11" fill="#4a331d" stroke="#1d1209" stroke-width="3"/>
  <circle cx="-35" cy="1" r="4.5" fill="#fff"/><circle cx="-34" cy="1.5" r="2.2" fill="#111"/>
  <circle cx="-26" cy="0" r="4" fill="#fff"/><circle cx="-25" cy="0.5" r="2" fill="#111"/>
  <ellipse cx="18" cy="8" rx="26" ry="18" fill="url(#abd)" stroke="#6aa012" stroke-width="2.5"/>
  <ellipse cx="14" cy="2" rx="12" ry="6" fill="#fff" fill-opacity=".55"/>
</g>
</defs>''')

# ---------- sky ----------
A(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
for _ in range(110):
    x, y = R.uniform(0, W), R.uniform(0, 470)
    r = R.choice([1.2, 1.6, 2.0, 2.6]); o = R.uniform(.35, .95) * (1 - y/560)
    A(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#fff" fill-opacity="{o:.2f}"/>')
# horizon glow
A(f'<ellipse cx="960" cy="{HORIZON}" rx="1100" ry="170" fill="#8ff5e0" fill-opacity=".35" filter="url(#b30)"/>')

# ---------- hills & trees ----------
A(f'<path d="M0 {HORIZON-70} C 260 {HORIZON-150} 520 {HORIZON-90} 820 {HORIZON-130} C 1180 {HORIZON-170} 1500 {HORIZON-80} 1920 {HORIZON-140} L1920 {HORIZON+80} L0 {HORIZON+80}Z" fill="url(#hillF)" fill-opacity=".95"/>')
def pine(x, base, h, col, op=1):
    w = h*.42
    s = f'<g fill="{col}" fill-opacity="{op}">'
    for i in range(4):
        t = i/4; yy = base - h*(.18 + t*.72); ww = w*(1-t*.62)
        s += f'<polygon points="{x-ww:.0f},{yy+h*.26:.0f} {x:.0f},{yy-h*.20:.0f} {x+ww:.0f},{yy+h*.26:.0f}"/>'
    s += f'<rect x="{x-h*.04:.0f}" y="{base-h*.2:.0f}" width="{h*.08:.0f}" height="{h*.22:.0f}"/></g>'
    return s
x = -20
while x < W+40:
    A(pine(x, HORIZON-40+R.uniform(-14, 12), R.uniform(140, 230), '#0b3f78', .9)); x += R.uniform(55, 100)
A(f'<path d="M0 {HORIZON+10} C 300 {HORIZON-50} 700 {HORIZON-10} 1000 {HORIZON-40} C 1400 {HORIZON-80} 1700 {HORIZON-10} 1920 {HORIZON-50} L1920 {HORIZON+120} L0 {HORIZON+120}Z" fill="url(#hillN)"/>')
x = -30
while x < W+40:
    A(pine(x, HORIZON+22+R.uniform(-10, 14), R.uniform(190, 330), '#052b3a', 1)); x += R.uniform(70, 150)

# ---------- ground ----------
A(f'<rect x="0" y="{HORIZON+40}" width="{W}" height="{H-HORIZON-40}" fill="url(#grass)"/>')
A(f'<ellipse cx="520" cy="760" rx="520" ry="110" fill="#d9ff6a" fill-opacity=".30" filter="url(#b30)"/>')  # light spill

# ---------- path ----------
P0, P1, P2, P3 = (520, 742), (520, 880), (980, 900), (1290, 1110)
def bez(t):
    u = 1-t
    return (u**3*P0[0]+3*u*u*t*P1[0]+3*u*t*t*P2[0]+t**3*P3[0], u**3*P0[1]+3*u*u*t*P1[1]+3*u*t*t*P2[1]+t**3*P3[1])
def dbez(t):
    u = 1-t
    return (3*u*u*(P1[0]-P0[0])+6*u*t*(P2[0]-P1[0])+3*t*t*(P3[0]-P2[0]), 3*u*u*(P1[1]-P0[1])+6*u*t*(P2[1]-P1[1])+3*t*t*(P3[1]-P2[1]))
L, Rr = [], []
for i in range(41):
    t = i/40; x, y = bez(t); dx, dy = dbez(t); n = math.hypot(dx, dy); nx, ny = -dy/n, dx/n
    w = 34 + 300*t**1.55
    L.append((x+nx*w, y+ny*w)); Rr.append((x-nx*w, y-ny*w))
pts = L + Rr[::-1]
pstr = ' '.join(f'{a:.0f},{b:.0f}' for a, b in pts)
A(f'<polygon points="{pstr}" fill="#7a5a2a" transform="translate(0,10)" opacity=".55" filter="url(#b8)"/>')
A(f'<polygon points="{pstr}" fill="url(#pathg)" stroke="#b68a4c" stroke-width="8" stroke-linejoin="round"/>')
for _ in range(60):  # pebbles
    t = R.uniform(.05, .98); x, y = bez(t); dx, dy = dbez(t); n = math.hypot(dx, dy); nx, ny = -dy/n, dx/n
    w = (34+300*t**1.55)*R.uniform(-.8, .8)
    A(f'<ellipse cx="{x+nx*w:.0f}" cy="{y+ny*w:.0f}" rx="{4+10*t:.1f}" ry="{2.5+6*t:.1f}" fill="#c59a58" fill-opacity=".7"/>')

# ---------- greenhouse ----------
gx, gy = 520, 742
g = [f'<g transform="translate({gx},{gy})">']
g.append('<ellipse cx="0" cy="-170" rx="560" ry="350" fill="url(#halo)"/>')
g.append('<ellipse cx="0" cy="10" rx="330" ry="30" fill="#000" fill-opacity=".35" filter="url(#b8)"/>')
g.append('<rect x="-250" y="-190" width="500" height="190" fill="url(#glassIn)"/>')
g.append('<polygon points="-270,-190 0,-336 270,-190" fill="url(#glassIn)"/>')
# plants inside
for px, ph, c in [(-200, 120, '#1a8a3a'), (-150, 90, '#23a847'), (-105, 140, '#1a8a3a'), (105, 130, '#23a847'), (155, 95, '#1a8a3a'), (205, 125, '#23a847')]:
    g.append(f'<path d="M{px} 0 Q{px-34} {-ph*.55} {px} {-ph} Q{px+34} {-ph*.55} {px} 0Z" fill="{c}" fill-opacity=".9"/>')
    g.append(f'<path d="M{px} 0 L{px} {-ph*.9}" stroke="#0c5a24" stroke-width="3" fill="none"/>')
for ox, oy, rr in [(-215, -150, 9), (-110, -90, 7), (130, -150, 10), (190, -60, 7), (-60, -230, 8), (70, -240, 7), (0, -170, 6)]:
    g.append(f'<circle cx="{ox}" cy="{oy}" r="{rr*4}" fill="url(#orb)"/><circle cx="{ox}" cy="{oy}" r="{rr*.45}" fill="#fff"/>')
# door
g.append('<rect x="-40" y="-128" width="80" height="128" fill="#fffde0"/>')
# frame (dark under, white over)
def line(x1, y1, x2, y2):
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#143a5e" stroke-width="13" stroke-linecap="round"/>'
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#f2fbff" stroke-width="6" stroke-linecap="round"/>')
fr = []
fr.append('<polygon points="-270,-190 0,-336 270,-190" fill="none" stroke="#143a5e" stroke-width="15" stroke-linejoin="round"/>')
fr.append('<rect x="-250" y="-190" width="500" height="190" fill="none" stroke="#143a5e" stroke-width="15" stroke-linejoin="round"/>')
for vx in (-250, -167, -83, 83, 167, 250): fr.append(line(vx, -190, vx, 0))
for vx in (-200, -130, -65, 65, 130, 200): fr.append(line(vx, -190, vx*.22, -318 + abs(vx)*.2))
fr.append(line(0, -336, 0, -190))
fr.append(line(-250, -95, -40, -95)); fr.append(line(40, -95, 250, -95))
fr.append(line(-40, -128, 40, -128)); fr.append(line(-40, -128, -40, 0)); fr.append(line(40, -128, 40, 0)); fr.append(line(0, -128, 0, 0))
fr.append('<polygon points="-270,-190 0,-336 270,-190" fill="none" stroke="#f2fbff" stroke-width="7" stroke-linejoin="round"/>')
fr.append('<rect x="-250" y="-190" width="500" height="190" fill="none" stroke="#f2fbff" stroke-width="7" stroke-linejoin="round"/>')
g += fr
g.append('<rect x="-266" y="-6" width="532" height="20" rx="6" fill="#5b6f78" stroke="#143a5e" stroke-width="5"/>')
g.append('<circle cx="0" cy="-340" r="11" fill="#ffe36a" stroke="#143a5e" stroke-width="5"/>')
g.append('<polygon points="-270,-190 0,-336 270,-190" fill="#fff" fill-opacity=".10"/>')
g.append('</g>')
A(''.join(g))

# ---------- mid-ground fireflies (with bodies) ----------
for x, y, s, rot in [(905, 470, 1.35, -12), (170, 600, 1.0, 10), (1010, 740, 1.05, -8), (660, 560, .8, 14)]:
    A(f'<use href="#ff" transform="translate({x},{y}) scale({s}) rotate({rot})"/>')

# ---------- orbs ----------
def orb(x, y, r, o=1):
    return (f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r*3.4:.0f}" fill="url(#orb)" fill-opacity="{o:.2f}"/>'
            f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{max(1.5, r*.5):.1f}" fill="#fffff0"/>')
for _ in range(46):
    x = R.uniform(0, 1250); y = R.uniform(120, 1000)
    if y < 400 and x < 1000: continue   # keep title clear
    A(orb(x, y, R.uniform(4, 10), R.uniform(.6, 1)))
# large soft bokeh foreground
A('<g filter="url(#b8)">')
for x, y, r in [(60, 920, 38), (1830, 520, 44), (1720, 930, 30), (700, 1010, 34), (1210, 240, 28), (20, 420, 40)]:
    A(f'<circle cx="{x}" cy="{y}" r="{r*2.2:.0f}" fill="url(#orb)" fill-opacity=".85"/>')
A('</g>')

# ---------- thief silhouette ----------
sil, rim = '#0a1230', '#2fd37a'
def part(x, y, w, h, rx, rot=0, cx=None, cy=None, fill=sil):
    cx = x+w/2 if cx is None else cx; cy = y+h/2 if cy is None else cy
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{rim}" stroke-width="4" '
            f'stroke-opacity=".7" transform="rotate({rot} {cx} {cy})"/>')
th = ['<g transform="translate(150,1022)">']
th.append('<ellipse cx="0" cy="6" rx="110" ry="16" fill="#000" fill-opacity=".5" filter="url(#b8)"/>')
th.append(part(-84, -238, 38, 110, 12, 16, -65, -238))
th.append('<ellipse cx="-100" cy="-112" rx="46" ry="56" fill="#4a2f17" stroke="#1d1209" stroke-width="5"/>'
          '<path d="M-116 -160 Q-100 -178 -84 -160" stroke="#1d1209" stroke-width="6" fill="none" stroke-linecap="round"/>')
th.append(part(-54, -124, 46, 126, 12, -14, -31, -124))
th.append(part(6, -124, 46, 126, 12, 16, 29, -124))
th.append(part(-62, -252, 124, 138, 14, 9, 0, -114))
th.append(part(40, -234, 108, 38, 12, -26, 46, -215))
th.append('<g transform="rotate(9 4 -260)">')
th.append(part(-40, -346, 88, 86, 18, 0))
th.append('<path d="M-44 -320 Q-44 -372 4 -372 Q52 -372 52 -320Z" fill="#c4202a" stroke="#5a0d14" stroke-width="4"/>'
          '<rect x="-46" y="-338" width="100" height="14" fill="#141414"/><circle cx="4" cy="-376" r="13" fill="#c4202a" stroke="#5a0d14" stroke-width="4"/>')
th.append('<g fill="#fff"><rect x="-18" y="-312" width="26" height="15" rx="7" transform="rotate(14 -5 -304)"/>'
          '<rect x="16" y="-312" width="26" height="15" rx="7" transform="rotate(-14 29 -304)"/></g>'
          '<path d="M-14 -284 L-6 -277 L2 -285 L10 -277 L18 -285 L26 -277 L32 -284" stroke="#fff" stroke-width="4" fill="none" stroke-linejoin="round"/>')
th.append('</g></g>')
A(''.join(th))

# ---------- jar ----------
jx, jy = 338, 1000
j = [f'<g transform="translate({jx},{jy})">']
j.append('<ellipse cx="0" cy="8" rx="120" ry="20" fill="#000" fill-opacity=".4" filter="url(#b8)"/>')
j.append('<ellipse cx="0" cy="-130" rx="230" ry="230" fill="url(#halo)"/>')
body = 'M-86 -250 L-86 -20 Q-86 0 -66 0 L66 0 Q86 0 86 -20 L86 -250 Q86 -272 64 -278 L-64 -278 Q-86 -272 -86 -250Z'
j.append(f'<path d="{body}" fill="#183a5e" stroke="#143a5e" stroke-width="22" stroke-linejoin="round"/>')
j.append(f'<path d="{body}" fill="#bff3ff" fill-opacity=".30"/>')
j.append(f'<path d="{body}" fill="url(#halo)" fill-opacity="1"/><ellipse cx="0" cy="-130" rx="80" ry="120" fill="url(#orb)"/>')
for ox, oy, rr, rot in [(-30, -190, 1, 12), (24, -120, 1.1, -10), (-26, -60, .95, 8), (30, -215, .8, -15), (-10, -140, 1.2, 0)]:
    j.append(f'<use href="#ff" transform="translate({ox},{oy}) scale({rr*.7}) rotate({rot})"/>')
j.append(f'<path d="{body}" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round" stroke-opacity=".95"/>')
j.append('<rect x="-62" y="-246" width="16" height="190" rx="8" fill="#fff" fill-opacity=".55"/>')
j.append('<rect x="-84" y="-326" width="168" height="52" rx="12" fill="url(#lid)" stroke="#143a5e" stroke-width="8"/>')
for lx in range(-66, 80, 22): j.append(f'<line x1="{lx}" y1="-320" x2="{lx}" y2="-280" stroke="#143a5e" stroke-opacity=".35" stroke-width="4"/>')
j.append('</g>')
A(''.join(j))

# ---------- hero: creature ----------
hx, hy, hs = 985, 34, 0.84
A(f'<ellipse cx="{hx+350}" cy="620" rx="430" ry="470" fill="url(#warm)" fill-opacity=".8" style="mix-blend-mode:screen"/>')
A(f'<ellipse cx="{hx+350}" cy="1040" rx="330" ry="46" fill="#000" fill-opacity=".5" filter="url(#b8)"/>')
A(f'<ellipse cx="{hx+350}" cy="1030" rx="420" ry="70" fill="url(#warm)" style="mix-blend-mode:screen"/>')
A(f'<g transform="translate({hx},{hy}) scale({hs})"><image href="fly_outline.png" width="1080" height="1287" filter="url(#heroGlow)"/><image href="fly_cut_sharp.png" width="1080" height="1287"/></g>')
# embers
for _ in range(38):
    x = R.gauss(hx+360, 260); y = R.uniform(120, 980)
    A(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{R.uniform(2,6):.1f}" fill="#ffb347" fill-opacity="{R.uniform(.5,1):.2f}" filter="url(#b3)"/>')

# ---------- foreground grass ----------
def tuft(x, y, s):
    out = ''
    for _ in range(6):
        dx = R.uniform(-26, 26)*s; h = R.uniform(46, 100)*s; w = R.uniform(5, 9)*s
        c = R.choice(['#0f7a35', '#1a9e45', '#2fc050', '#0b5f2c'])
        out += f'<polygon points="{x-w:.0f},{y:.0f} {x+w:.0f},{y:.0f} {x+dx:.0f},{y-h:.0f}" fill="{c}"/>'
    return out
for x in range(-20, W+40, 46):
    A(tuft(x+R.uniform(-12, 12), H+14+R.uniform(-6, 14), R.uniform(1.0, 1.5)))
for x in range(1080, 1700, 70):
    A(tuft(x+R.uniform(-15, 15), 1010+R.uniform(-8, 8), R.uniform(.9, 1.3)))
for x in range(1090, 1620, 38):
    A(tuft(x+R.uniform(-8, 8), 1085+R.uniform(-6, 8), R.uniform(1.2, 1.6)))
for x in range(40, 200, 55):
    A(tuft(x, 860+R.uniform(-20, 60), R.uniform(.7, 1.0)))

# ---------- sparkles ----------
def spark(x, y, s, o=1):
    return (f'<g transform="translate({x},{y}) scale({s})" opacity="{o}"><path d="M0 -16 Q2 -3 16 0 Q2 3 0 16 Q-2 3 -16 0 Q-2 -3 0 -16Z" fill="#fff"/></g>')
for x, y, s in [(930, 430, 1.1), (130, 560, .9), (1060, 700, 1), (610, 480, .8), (1790, 300, 1.3), (1700, 760, 1.0), (420, 640, .7), (260, 800, .8)]:
    A(spark(x, y, s))
# ---------- speed lines ----------
cx, cy = hx+350, 560
for i in range(46):
    a = R.uniform(0, 2*math.pi); r0 = R.uniform(700, 900); r1 = r0 + R.uniform(220, 520); wd = R.uniform(.008, .02)
    p = [(cx+r0*math.cos(a-wd), cy+r0*math.sin(a-wd)), (cx+r0*math.cos(a+wd), cy+r0*math.sin(a+wd)), (cx+r1*math.cos(a), cy+r1*math.sin(a))]
    if min(px for px, _ in p) < 1150 or max(py for _, py in p) > 880: continue
    A('<polygon points="' + ' '.join(f'{x:.0f},{y:.0f}' for x, y in p) + f'" fill="#fff" fill-opacity="{R.uniform(.14,.32):.2f}"/>')

# ---------- vignette ----------
A(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')

# ---------- "!!" marks ----------
def bang(x, y, rot, s):
    d = 'M-17 -92 Q-17 -102 -6 -102 L6 -102 Q17 -102 17 -92 L11 -26 Q10 -18 0 -18 Q-10 -18 -11 -26Z'
    dot = '<circle cx="0" cy="10" r="14"/>'
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
            f'<g fill="#3a0612" stroke="#3a0612" stroke-width="24" stroke-linejoin="round"><path d="{d}"/>{dot}</g>'
            f'<g fill="#fff" stroke="#fff" stroke-width="14" stroke-linejoin="round"><path d="{d}"/>{dot}</g>'
            f'<g fill="#ff2d2d"><path d="{d}"/>{dot}</g><path d="M-6 -90 L-4 -40" stroke="#ff9a9a" stroke-width="5" stroke-linecap="round"/></g>')
A(bang(1245, 285, -16, 1.15) + bang(1318, 272, 10, 1.45))

# ---------- title ----------
def title(txt, size, x, y, fill, glow=None, ol='#0a1240', ow=30):
    t = f'font-family="Fredoka One" font-size="{size}" text-anchor="start" x="{x}" y="{y}" '
    s = f'<text {t} fill="#000" fill-opacity=".5" transform="translate(10,16)" stroke="#000" stroke-opacity=".5" stroke-width="{ow}" stroke-linejoin="round" filter="url(#b8)">{txt}</text>'
    if glow: s += f'<text {t} fill="{glow}" stroke="{glow}" stroke-width="{ow+16}" stroke-linejoin="round" filter="url(#b18)" opacity=".9">{txt}</text>'
    s += f'<text {t} fill="{ol}" stroke="{ol}" stroke-width="{ow}" stroke-linejoin="round">{txt}</text>'
    s += f'<text {t} fill="{fill}" stroke="#fff" stroke-width="3" stroke-opacity=".0">{txt}</text>'
    return s
A('<g transform="rotate(-4 480 200)">')
A(title('CATTURA LE', 108, 66, 150, 'url(#white)', None, '#0a1240', 24))
A(title('LUCCIOLE!', 196, 58, 328, 'url(#gold)', '#b8ff2e', '#0a1240', 34))
A('</g>')

html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:'Fredoka One';src:url(data:font/ttf;base64,{font64}) format('truetype');}}
html,body{{margin:0;background:#000;width:{W}px;height:{H}px;overflow:hidden}} svg{{display:block}}
#bloom{{position:absolute;left:0;top:0;filter:blur(20px) contrast(1.7) brightness(.9);mix-blend-mode:screen;opacity:.5}} #base{{position:absolute;left:0;top:0}}
</style></head><body><div id="base"><svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
{''.join(svg)}
</svg></div><div id="bloom"><svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{''.join(svg)}</svg></div></body></html>'''
open('build/thumb.html', 'w').write(html)
print('html bytes', len(html))
