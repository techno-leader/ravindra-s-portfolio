from PIL import Image, ImageDraw, ImageFilter, ImageChops
def flat(path):
    im=Image.open(path)
    if im.mode in ('RGBA','LA','P'):
        im=im.convert('RGBA'); bg=Image.new('RGBA',im.size,'white'); bg.alpha_composite(im); return bg.convert('RGB')
    return im.convert('RGB')
def cutout(im, th=238):
    g=im.convert('L'); ff=g.point(lambda p:255 if p>=th else 0)
    W,H=ff.size
    for seed in [(0,0),(W-1,0),(0,H-1),(W-1,H-1),(W//2,0),(W//2,H-1),(0,H//2),(W-1,H//2)]:
        if ff.getpixel(seed)==255: ImageDraw.floodfill(ff,seed,128)
    alpha=ImageChops.invert(ff.point(lambda p:255 if p==128 else 0)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out=im.convert('RGBA'); out.putalpha(alpha)
    return out.crop(alpha.point(lambda p:255 if p>40 else 0).getbbox())
SPECS={'kapiva':('img/shopkapiva-0.png',None,238),'betteralt':('img/betteralt-1.jpg',(0,430,650,1100),238),
       'mars':('img/mars-10.jpg',None,212),'cymbiotika':('img/cymbiotika-0.png',None,238),'mountaindrop':('img/mountaindrop-1.avif',None,238)}
if __name__=='__main__':
    for k,(p,c,th) in SPECS.items():
        im=flat(p)
        if c: im=im.crop(c)
        o=cutout(im,th); o.save(f'cut/{k}.png')
        g=Image.new('RGBA',o.size,(150,150,150,255)); g.alpha_composite(o); d=ImageDraw.Draw(g)
        for x in range(0,o.width,100): d.line((x,0,x,o.height),fill=(255,0,0,255)); d.text((x+2,2),str(x),fill=(255,0,0,255))
        for y in range(0,o.height,100): d.line((0,y,o.width,y),fill=(0,0,255,255)); d.text((2,y+2),str(y),fill=(0,0,255,255))
        g.convert('RGB').save(f'cut/{k}-grid.jpg',quality=80); print(k,o.size)
