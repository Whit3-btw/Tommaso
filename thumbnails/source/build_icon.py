import random, base64
R = random.Random(5)
svg = ['''<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07123f"/><stop offset=".55" stop-color="#0d3a8c"/><stop offset="1" stop-color="#127a8f"/></linearGradient>
<radialGradient id="warm"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".9"/><stop offset=".5" stop-color="#ff5a1a" stop-opacity=".35"/><stop offset="1" stop-color="#ff3a00" stop-opacity="0"/></radialGradient>
<radialGradient id="orb"><stop offset="0" stop-color="#ffffe0"/><stop offset=".18" stop-color="#eaff6a" stop-opacity=".95"/><stop offset=".45" stop-color="#a6ff3a" stop-opacity=".35"/><stop offset="1" stop-color="#6bff2a" stop-opacity="0"/></radialGradient>
<filter id="heroGlow" x="-30%" y="-30%" width="160%" height="160%">
 <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="b"/>
 <feColorMatrix in="b" type="matrix" values="0 0 0 0 1  0 0 0 0 .42  0 0 0 0 .06  0 0 0 1.5 0" result="g"/>
 <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>''']
A = svg.append
A('<rect x="100" y="240" width="900" height="900" fill="url(#bg)"/>')
for _ in range(30):
    A(f'<circle cx="{R.uniform(150,910):.0f}" cy="{R.uniform(290,700):.0f}" r="{R.choice([1.5,2,3])*1.6}" fill="#fff" fill-opacity="{R.uniform(.4,.9):.2f}"/>')
A('<ellipse cx="520" cy="1000" rx="520" ry="150" fill="#3fcf55" fill-opacity=".55"/>')
for x, y, r in [(250, 430, 22), (800, 520, 28), (200, 900, 26), (840, 880, 20), (330, 340, 14), (690, 360, 16), (560, 980, 24)]:
    A(f'<circle cx="{x}" cy="{y}" r="{r*3.6}" fill="url(#orb)"/><circle cx="{x}" cy="{y}" r="{r*.5}" fill="#fff"/>')
A('<ellipse cx="480" cy="760" rx="440" ry="480" fill="url(#warm)" style="mix-blend-mode:screen"/>')
A('<image href="fly_outline.png" width="1080" height="1287" filter="url(#heroGlow)"/><image href="fly_cut_sharp.png" width="1080" height="1287"/>')
for x, y, s in [(205, 372, 1.4), (850, 420, 1.3), (860, 770, 1.1)]:
    A(f'<g transform="translate({x},{y}) scale({s*2})"><path d="M0 -16 Q2 -3 16 0 Q2 3 0 16 Q-2 3 -16 0 Q-2 -3 0 -16Z" fill="#fff"/></g>')
A('<rect x="100" y="240" width="900" height="900" fill="none"/>')
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;width:512px;height:512px;overflow:hidden;background:#000}} svg{{display:block}}</style></head>
<body><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="150 290 760 760">{''.join(svg)}</svg></body></html>'''
open('build/icon.html', 'w').write(html)
