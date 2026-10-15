# Assembles bench-system.html from _iso-head.html + _iso-line.js + icon/logo data.
# Non-ASCII in the script is written as \u escapes so the file reads right with or without a charset.
import os, re
S = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(S, f)).read()
def script():
    s = rd('_iso-line.js').replace('__ICONS_FILL__', rd('_icons-fill.json')).replace('__LOGOS__', rd('_logos.json')).replace('__ICONS__', rd('_icons.json'))
    return ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in s)
if __name__ == '__main__':
    out = rd('_iso-head.html') + script()
    open(os.path.join(S, '..', 'bench-system.html'), 'w').write(out)
    print('bench ok, non-ascii:', set(re.findall('[^\x00-\x7f]', out)))
