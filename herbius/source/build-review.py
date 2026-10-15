# Builds the claude.ai review copy of case-herbius.html into the scratchpad dir given as argv[1]:
# no document wrapper, no Clarity, Redaction shipped as fonts/, brand art in brand/, links -> heyrav.in,
# reveals at rest, title "Herbius Case Study". Assets are copied by the caller.
import sys, re
R = sys.argv[1]
s = open('/home/my-computer/portfolio/herbius/case-herbius.html').read()
s = re.sub(r'<!DOCTYPE html>\s*<html lang="en">\s*<head>\s*', '', s)
s = s.replace('<meta charset="UTF-8" />\n', '').replace('<meta name="robots" content="noindex" />\n', '')
s = re.sub(r'<meta name="viewport"[^>]*>\n', '', s)
s = re.sub(r'<link rel="(icon|apple-touch-icon)"[^>]*>\n', '', s)
s = re.sub(r'<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>\n', '', s)
s = re.sub(r'src:url\(https://cdn\.jsdelivr\.net/fontsource/fonts/redaction-35@latest/latin-400-italic\.woff2\) format\("woff2"\),\s*url\([^)]*\) format\("woff"\);',
           'src:url(fonts/redaction-35-italic.woff2) format("woff2");', s)
assert 'fonts/redaction-35-italic.woff2' in s
s = re.sub(r'<!-- Microsoft Clarity.*?</script>\n', '', s, flags=re.S)
assert 'clarity' not in s.lower()
s = s.replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '')
s = s.replace('../assets/brand/', 'brand/')
s = s.replace('href="../index.html#', 'href="https://heyrav.in/#').replace('href="../index.html"', 'href="https://heyrav.in/"')
s = re.sub(r'href="\.\./(case-[a-z]+\.html)"', r'href="https://heyrav.in/\1"', s)
assert '../' not in s
s = s.replace('<title>Herbius - Case Study · Ravindra Pratap</title>', '<title>Herbius Case Study</title>', 1)
i = s.index('</style>')
s = s[:i] + "  /* review copy: the page shows at rest, no scroll-in reveal */\n  .rv{opacity:1;transform:none;filter:none;transition:none;}\n" + s[i:]
open(R + '/herbius-review.html', 'w').write(s)
print('review copy', len(s) // 1024, 'KB')
