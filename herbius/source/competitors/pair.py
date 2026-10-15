# Both finished cartons in one 4:5 frame: Ashwa Resin front-left, Shilajit back-right
from PIL import Image, ImageDraw, ImageFilter, ImageChops
def cut(path, tol):
    im=Image.open(path).convert('RGB'); W,H=im.size; bg=im.getpixel((2,2))
    near=ImageChops.difference(im,Image.new('RGB',im.size,bg)).convert('L').point(lambda p:255 if p<=tol else 0)
    for s in [(0,0),(W-1,0),(0,H-1),(W-1,H-1),(W//2,0),(0,H//2),(W-1,H//2)]:
        if near.getpixel(s)==255: ImageDraw.floodfill(near,s,128)
    a=ImageChops.invert(near.point(lambda p:255 if p==128 else 0)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    o=im.convert('RGBA'); o.putalpha(a); return o.crop(a.point(lambda p:255 if p>40 else 0).getbbox())
C='/home/my-computer/portfolio/herbius/source/carousel/'
ash=cut(C+'c-003-006.jpg',14); shi=cut(C+'c-012-048.jpg',10)
print(ash.size, shi.size)
W,H=1200,1500; cv=Image.new('RGBA',(W,H),(244,243,241,255))
def place(o,w,x,base):
    o=o.resize((w,round(o.height*w/o.width)),Image.LANCZOS)
    sh=Image.new('L',(o.width,60),0); ImageDraw.Draw(sh).ellipse((o.width*.1,22,o.width*.9,42),fill=80); sh=sh.filter(ImageFilter.GaussianBlur(14))
    s=Image.new('RGBA',sh.size,(40,36,30,0)); s.putalpha(sh); cv.alpha_composite(s,(x,base-34))
    cv.alpha_composite(o,(x,base-o.height))
place(shi,700,430,935)     # back, higher baseline
place(ash,760,40,1145)      # front
cv.convert('RGB').save('/home/my-computer/portfolio/herbius/assets/cartons-pair.jpg',quality=84,optimize=True,progressive=True)
# preview: cv.convert('RGB').resize((400,500)).save('/tmp/pair-check.jpg')
