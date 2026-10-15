# Ports the launch-system bench (bench-system.html's parts) into the case page:
# CSS namespaced under .sys, markup from the bench's stage, script wrapped so its names stay private.
import os, re
from build_bench import script as bench_script, rd

def _prefix(css):
    """prefix every selector with .sys, leaving @keyframes bodies alone"""
    out, i = [], 0
    while i < len(css):
        if css[i].isspace(): out.append(css[i]); i += 1; continue
        if css.startswith('@keyframes', i):
            depth, j = 0, css.index('{', i)
            k = j
            while True:
                if css[k] == '{': depth += 1
                elif css[k] == '}':
                    depth -= 1
                    if depth == 0: break
                k += 1
            out.append(css[i:k + 1]); i = k + 1; continue
        if css.startswith('@media', i):
            j = css.index('{', i); out.append(css[i:j + 1]); i = j + 1; continue
        if css[i] == '}': out.append('}'); i += 1; continue
        j = css.find('{', i)
        if j < 0: out.append(css[i:]); break
        sel = css[i:j]
        lead = sel[:len(sel) - len(sel.lstrip())]
        parts = [p.strip() for p in sel.split(',')]
        if parts and parts[0] and not parts[0].startswith('/*'):
            sel = lead + ','.join('.sys ' + p for p in parts)
        else:
            # a comment before the selector: keep it, prefix what follows it
            m = re.match(r'(\s*(?:/\*.*?\*/\s*)+)(.*)$', sel, re.S)
            if m: sel = m.group(1) + ','.join('.sys ' + p.strip() for p in m.group(2).split(','))
        k = css.index('}', j)
        out.append(sel + css[j:k + 1]); i = k + 1
    return ''.join(out)

def parts():
    head = rd('_iso-head.html')
    style = head[head.index('<style>') + 7:head.index('</style>')]
    # keep only the illustration's own rules; the page chrome above them belongs to the bench
    style = style[style.index('  /* ---------- the turning stage'):]
    css = '''
  /* ================= The System: the isometric launch line, ported from bench-system.html =================
     Everything below is scoped to .sys so it cannot reach the rest of the page. */
  .sys{--face-l:#f3f3f3;--face-r:#e6e6e6;--grid:#f1f1f1;--idle:#bdbdbd;--ease:cubic-bezier(.22,1,.36,1);margin-top:44px;}
  .sys button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;}
  .sys button:disabled{opacity:.35;cursor:default;}
  .sys h2{max-width:none;margin:8px 0 0;}
  .sys p{margin:0;max-width:none;}
''' + _prefix(style)
    css = css.replace('.sys .stage{margin-top:40px;', '.sys .stage{margin-top:0;')
    html = head[head.index('<div class="stage" id="stage">'):head.rindex('</div>\n</div>')]
    html = html.strip() + '\n'
    html = '      <div class="sys rv">\n' + '\n'.join('        ' + l if l.strip() else l for l in html.split('\n')) + '      </div>\n'
    js = bench_script()
    body = js[js.index('<script>') + 8:js.rindex('</script>')]
    # play only while the line is on screen; the bench plays from load
    body = body.replace("set(0);\nREDUCED ? stopAuto() : startAuto();",
        "set(0);\nstopAuto();\nif(!REDUCED){ new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting && !stage.classList.contains('flipped')) startAuto(); else if(!e.isIntersecting) stopAuto(); }), {threshold:.35}).observe(stage); }")
    assert 'IntersectionObserver' in body
    js = '<script>\n/* The System: isometric launch line. Wrapped so its names stay out of the page scope. */\n(() => {\n' + body + '\n})();\n</script>'
    return css, html, js
