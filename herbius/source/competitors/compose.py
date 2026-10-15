from PIL import Image, ImageDraw, ImageFilter, ImageChops
from cut import flat
def cut_by_colour(im, tol=14, extra=None):
    """flood the background from the border by colour distance to the corner sample"""
    W,H=im.size; bg=im.getpixel((2,2))
    diff=ImageChops.difference(im, Image.new('RGB',im.size,bg)).convert('L')
    near=diff.point(lambda p:255 if p<=tol else 0)
    for seed in [(0,0),(W-1,0),(0,H-1),(W-1,H-1),(W//2,0),(W//2,H-1),(0,H//2),(W-1,H//2)]:
        if near.getpixel(seed)==255: ImageDraw.floodfill(near,seed,128)
    alpha=ImageChops.invert(near.point(lambda p:255 if p==128 else 0))
    if extra: alpha=ImageChops.multiply(alpha, extra(im))
    alpha=alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out=im.convert('RGBA'); out.putalpha(alpha)
    return out.crop(alpha.point(lambda p:255 if p>40 else 0).getbbox())

def no_floor(y0):
    # drop the bright floor reflection below y0 (the dark resin drip and jar stay)
    def f(im):
        g=im.convert('L'); m=Image.new('L',im.size,255)
        lo=g.crop((0,y0,im.width,im.height)).point(lambda p:0 if p>200 else 255)
        m.paste(lo,(0,y0)); return m
    return f

prods={
 'kapiva':   (flat('img/shopkapiva-0.png'), dict(tol=30, extra=no_floor(720)), 470,
              [(80,50,470,175),(615,535,795,610),(680,280,840,315),(565,255,650,410)]),
 'betteralt':(flat('img/betteralt-1.jpg').crop((0,430,652,1100)), dict(tol=26, erode=7), 300,
              [(230,310,430,352),(0,385,165,455)]),
 'mars':     (flat('img/mars-10.jpg'), dict(tol=24), 300,
              [(190,272,330,330),(705,272,845,330),(35,285,175,455),(550,285,690,455)]),
 'cymbiotika':(flat('img/cymbiotika-0.png'), dict(tol=18), 205,
              [(135,252,392,292)]),
 'mountaindrop':(flat('img/mountaindrop-1.avif'), dict(tol=18), 400,
              [(215,80,375,155),(325,345,425,412),(5,230,60,305),(405,445,505,525),(690,675,835,740),(80,385,170,440)]),
}
def blur_regions(o, boxes, off):
    rgb=o.convert('RGB'); a=o.getchannel('A')
    bl=rgb.filter(ImageFilter.GaussianBlur(16))
    m=Image.new('L',o.size,0); d=ImageDraw.Draw(m)
    for (x0,y0,x1,y1) in boxes:
        d.rounded_rectangle((x0-off[0],y0-off[1],x1-off[0],y1-off[1]),radius=14,fill=255)
    m=m.filter(ImageFilter.GaussianBlur(5))
    rgb=Image.composite(bl,rgb,m); out=rgb.convert('RGBA'); out.putalpha(a); return out

LUM={'kapiva':(0,48),'betteralt':(33,31),'mars':(90,371),'cymbiotika':(267,518),'mountaindrop':(87,92)}
order=['kapiva','betteralt','mars','cymbiotika','mountaindrop']
# offsets: recompute via a second pass that returns the bbox
def cut_with_bbox(im,**kw):
    W,H=im.size; tol=kw.get('tol',14); extra=kw.get('extra'); er=kw.get('erode',3)
    bg=im.getpixel((2,2))
    diff=ImageChops.difference(im, Image.new('RGB',im.size,bg)).convert('L')
    near=diff.point(lambda p:255 if p<=tol else 0)
    for seed in [(0,0),(W-1,0),(0,H-1),(W-1,H-1),(W//2,0),(W//2,H-1),(0,H//2),(W-1,H//2)]:
        if near.getpixel(seed)==255: ImageDraw.floodfill(near,seed,128)
    alpha=ImageChops.invert(near.point(lambda p:255 if p==128 else 0))
    if extra: alpha=ImageChops.multiply(alpha, extra(im))
    alpha=alpha.filter(ImageFilter.MinFilter(er)).filter(ImageFilter.MaxFilter(er-2 if er>3 else 1)).filter(ImageFilter.GaussianBlur(1.2))
    out=im.convert('RGBA'); out.putalpha(alpha)
    bb=alpha.point(lambda p:255 if p>40 else 0).getbbox()
    return out.crop(bb), bb

S=2  # render at 2x
GAP=64*S; PADX=72*S; TOP=56*S
pieces=[]
for k in order:
    im,kw,h,boxes=prods[k]
    o,bb=cut_with_bbox(im,**kw)
    # the grid coordinates were read off the earlier (luminance) cut; map them through that cut's bbox
    # boxes were read off the luminance cut; full-frame = box + LUM, colour-cut = full - bb
    lx,ly=LUM[k]
    o=blur_regions(o, [(x0+lx,y0+ly,x1+lx,y1+ly) for (x0,y0,x1,y1) in boxes], (bb[0],bb[1]))
    sc=h*S/o.height; o=o.resize((round(o.width*sc),round(o.height*sc)),Image.LANCZOS)
    pieces.append((k,o))
BASE=TOP+max(o.height for _,o in pieces)
W=PADX*2+sum(o.width for _,o in pieces)+GAP*(len(pieces)-1); H=BASE+56*S
canvas=Image.new('RGBA',(W,H),(244,243,241,255))
d=ImageDraw.Draw(canvas)
x=PADX
for k,o in pieces:
    # soft contact shadow under each product
    sh=Image.new('L',(o.width,40*S),0); ImageDraw.Draw(sh).ellipse((o.width*0.14,14*S,o.width*0.86,26*S),fill=70)
    sh=sh.filter(ImageFilter.GaussianBlur(9*S))
    shadow=Image.new('RGBA',sh.size,(40,36,30,0)); shadow.putalpha(sh)
    canvas.alpha_composite(shadow,(x,BASE-22*S))
    canvas.alpha_composite(o,(x,BASE-o.height))
    x+=o.width+GAP
canvas.convert('RGB').save('shelf-2x.jpg',quality=88)
small=canvas.convert('RGB'); small=small.resize((W//S*1,H//S*1),Image.LANCZOS); small.save('shelf.jpg',quality=86)
print(W//S,H//S)
