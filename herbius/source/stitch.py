# python3 stitch.py <name>  -> lp/<name>-stitched.png (2x px)
import json, sys, glob
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
name = sys.argv[1]
d = f'lp/{name}-slices'
m = json.load(open(f'{d}/meta.json'))
files = sorted(glob.glob(f'{d}/*.png'))
s = 2
last = m['ys'][-1] + m['VH']
out = Image.new('RGB', (430 * s, last * s), 'white')
for f, y in zip(files, m['ys']):
    out.paste(Image.open(f).convert('RGB'), (0, y * s))
out.save(f'lp/{name}-stitched.png')
print(out.size)
