# Assembles herbius/case-herbius.html:
#   case-viewryt.html head + stylesheet (verbatim)  +  _extra.css
#   + Clarity + nav  +  _body.html  +  case-viewryt.html script (verbatim)  +  the press-loop script
import os, re
S = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(S, '..', '..')
vr = open(os.path.join(ROOT, 'case-viewryt.html')).read().split('\n')

def lines(a, b):            # 1-indexed, inclusive
    return '\n'.join(vr[a - 1:b])

head = lines(1, 501)        # doctype ... last media query of the stylesheet
assert vr[501].strip() == '</style>', vr[501]
head = head.replace('<title>ViewRyt - Case Study · Ravindra Pratap</title>',
                    '<title>Herbius - Case Study · Ravindra Pratap</title>')
head = head.replace('href="assets/brand/', 'href="../assets/brand/')
# review draft: keep it out of search until it is linked from the home page
head = head.replace('<meta name="viewport"', '<meta name="robots" content="noindex" />\n<meta name="viewport"', 1)
clarity = lines(502, 513)   # </style> ... <div class="progress">
nav = lines(514, 520).replace('href="index.html', 'href="../index.html').replace('src="assets/brand/', 'src="../assets/brand/')
script_start = vr.index('<script>', 800)
script = '\n'.join(vr[script_start:vr.index('</script>', script_start) + 1])

extra = open(os.path.join(S, '_extra.css')).read()
body = open(os.path.join(S, '_body.html')).read()
press = '''<script>
/* press-check loop: plays only while on screen, never under reduced motion
   (then the poster stays as a still) */
(() => {
  const vids = document.querySelectorAll('video.loop');
  if(!vids.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if(e.isIntersecting){ v.preload = 'auto'; v.play().catch(() => {}); }
    else v.pause();
  }), {threshold: .35});
  vids.forEach(v => io.observe(v));
})();
</script>'''

out = '\n'.join([head, extra, clarity, nav, '', body, '', script, press, '</body>', '</html>', ''])
dst = os.path.join(S, '..', 'case-herbius.html')
open(dst, 'w').write(out)
print('wrote', dst, len(out.split('\n')), 'lines')
