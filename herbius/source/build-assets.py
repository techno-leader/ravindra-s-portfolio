# Builds herbius/assets/ from herbius/source/. Re-runnable.
import os, json
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
S = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(S, '..', 'assets')
os.makedirs(os.path.join(A, 'ads'), exist_ok=True)
os.makedirs(os.path.join(A, 'lp'), exist_ok=True)

def save(im, path, w=None, q=82):
    im = im.convert('RGB')
    if w and im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(path, quality=q, optimize=True, progressive=True)
    return im.size

sizes = {}
# --- ads: every creative the page shows, by Ad Library order ---
ADS = ['a-017-028', 'a-026-046', 'a-033-060',            # energy
       'a-036-066', 'a-035-064',                          # menopause
       'a-077-169', 'a-072-147',                          # bone
       'a-030-055', 'a-013-021', 'a-032-058',             # libido EN
       'a-010-014',                                       # male
       'a-004-002', 'a-007-009',                          # "zero desire" IT / NL
       'a-007-008', 'a-014-022',                          # roommates IT / NL
       'a-064-120']                                       # Shilajit, women 50+
for a in ADS:
    sizes['ads/' + a] = save(Image.open(f'{S}/ads/{a}.jpg'), f'{A}/ads/{a}.jpg', 720)

# --- product gallery ---
CAR = {'ashwa-studio': 'c-002-000', 'shilajit-studio': 'c-011-047', 'tastiest-en': 'c-002-001',
       'tastiest-it': 'c-006-017', 'tastiest-nl': 'c-008-025', 'ashwa-jar': 'c-003-006',
       'shilajit-jar': 'c-012-048', 'coa-shilajit': 'c-011-043'}
for k, v in CAR.items():
    sizes[k] = save(Image.open(f'{S}/carousel/{v}.jpg'), f'{A}/{k}.jpg', 900)

# --- ebooks ---
EB = {'eb-spark-en': 'e-003-000', 'eb-spark-it': 'e-006-018', 'eb-spark-nl': 'e-007-024',
      'eb-bone-en': 'e-009-025', 'eb-bone-it': 'e-011-037', 'eb-bone-nl': 'e-012-043',
      'eb-90-en': 'e-014-049', 'eb-90-it': 'e-015-050',
      'eb-spark-quiz': 'e-003-002', 'eb-bone-does': 'e-009-026', 'eb-90-pillars': 'e-015-052'}
for k, v in EB.items():
    sizes[k] = save(Image.open(f'{S}/ebooks/{v}.jpg'), f'{A}/{k}.jpg', 800)

# --- packaging photos from the press visit ---
WA = {'ayuttva-sheet': 'WhatsApp Image 2026-10-13 at 11.27.04 PM.jpeg',
      'cartons-table': 'WhatsApp Image 2026-10-13 at 11.29.02 PM (1).jpeg',
      'dieline-signed': 'WhatsApp Image 2026-10-13 at 11.29.02 PM.jpeg'}
for k, v in WA.items():
    sizes[k] = save(Image.open(f'{S}/press/{v}'), f'{A}/{k}.jpg', 1200)

# --- the US lp2 for the phone walk-through: 600px wide (2x a 300px phone), LP body only ---
lp = Image.open(f'{S}/lp/us-lp2-stitched.png')
END = 27450 * 2                                   # css 27450 = end of the disclaimer, before the site footer
lp = lp.crop((0, 0, lp.width, END))
lp = lp.resize((600, round(lp.height * 600 / lp.width)), Image.LANCZOS)
n = 4; step = -(-lp.height // n)
for i in range(n):
    part = lp.crop((0, i * step, 600, min(lp.height, (i + 1) * step)))
    sizes[f'lp/us-lp2-{i+1}'] = save(part, f'{A}/lp/us-lp2-{i+1}.jpg', q=74)

# --- first screen of the same page in four markets ---
for loc in ['us', 'uk', 'it', 'nl']:
    src = f'{S}/lp/us-lp2-slices/000.png' if loc == 'us' else f'{S}/lp/{loc}-lp2.png'
    im = Image.open(src)
    im = im.crop((0, 0, im.width, min(im.height, 1500)))   # 750 css px
    sizes[f'lp/hero-{loc}'] = save(im, f'{A}/lp/hero-{loc}.jpg', 600)

json.dump(sizes, open(f'{A}/_sizes.json', 'w'), indent=0)
print(json.dumps(sizes))
