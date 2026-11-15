/* case-fx.js - the case thumbnails as particle fields, shared by the home
   page cards, the Dentomate film card and the case page backgrounds.
   Needs three.js r128 loaded first. Markup is the API:
     <canvas class="fx" data-fx="eye|tooth|rooms|ads"></canvas>
   Options, all optional:
     data-mode="bg"    a page background: gathers once, holds, ignores the pointer
     data-speed=".35"  scales the illustration's own motion
     data-img="..."    another picture for the ads source
     data-turn=".006"  how far that picture sways */
/* =============================================================
   Case FX - the dithered illustrations, as particle fields.

   The three SDFs below are the same ones this page used to draw
   straight to the canvas. They now render into an offscreen target
   every frame, and each particle samples that target in its vertex
   shader, so the original motion - the eye's blink and gaze, the
   jaw opening and closing, the room blocks rising - plays through
   untouched while the field forms and disperses around it.

   Every number in P was tuned in particles.html and pasted back.
   Two deliberate departures from that export:
     - `drive`/`manualForm` are dropped. 'manual' is the bench's
       inspection mode; it pins the field at one fixed form, which
       would leave all three cards frozen. The page runs the auto
       cycle the four timings below were tuned for.
     - `bakeZoom` is per-source (SRC.zoom), since the export can
       only ever carry the one source it was captured on.
============================================================= */
(function(){
  const canvases = document.querySelectorAll('canvas.fx');
  if (!canvases.length || !window.THREE) return;

  const SIZE = 512;        /* offscreen bake resolution, square      */
  const SPAN = 2.4;        /* world units the baked frame maps onto  */
  const FOV  = 45;
  const LUMA_MAX = 0.985;  /* at or above this a sample is paper     */

  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  const P = {
    formStart: 0.905, formEnd: 1,
    formSec: 2.4, holdMode: 'one full loop', animLoops: 1,
    holdSec: 2.4, dispSec: 1.9, restSec: 0.4,
    timeSpeed: 0.94,
    grid: 384,
    pt: 0.0063, scatter: 1.9, spread: 0.21, drift: 0.74, looseBoost: 0.72,
    alphaS: 0.55, alphaInk: 0.42, edge: 0.05,
    idleMode: 'breathe', idleAmt: 0.009, idleSpeed: 2.43, idleZ: 0.89,
    lifeMix: 0.85, lifeRate: 0.7, lifeVary: 0.46,
    lifeSize: 0.5, lifeRise: 0.005,
    /* baseC is 0 on purpose: at rest the illustrations are neutral ink like
       the rest of the page. Colour arrives only under the pointer, via the
       gradient stops below. baseH is inert while baseC is 0. */
    baseL: 0.47, baseC: 0, baseH: 296,
    monoMix: 1, inkShade: 0.45, toneLevels: 5, shadeClean: 1,
    bg: '#ffffff',
    gaL: 0.855, gaC: 0.31, gaH: 229,
    gbL: 0.62,  gbC: 0.2,  gbH: 32,
    huePath: 'spectrum +', gradSrc: 'by ink',
    hoverColMix: 0.56, hoverColR: 0.53, hoverAlpha: 0.6,
    hoverMode: 'attract', hoverR: 0.59, hoverS: 0.01,
    /* Cursor follow, in seconds per stage (see the loop). Was a flat
       ease:0.35 per frame - a 39ms time constant, so the field tracked
       every twitch of the mouse and leapt back to centre on leave. */
    parallax: 1, ptrTau: 0.16, hovTau: 0.22,
    blinkAmt: 1, blinkSpeed: 0.4, blinkPow: 15,
    roomHeight: 1.9, camY: 2.3, camR: 2.9,
    lightWrap: 0.58, lightGamma: 0.64,
    lightEl: 1.1, lightAz: 0.89, lightAO: 1.07,
    faceAmt: 1, faceX: 0.52, faceZ: 0.33
  };

  const IDLE  = ['drift','jitter','breathe','orbit','flow'];
  const HOVER = ['none','repel','attract','swirl','lift'];
  const GRAD  = ['from cursor','radial','angular','by ink'];
  const HUEP  = ['short','long','spectrum +','spectrum -'];

  const HEAD = `
    precision highp float;
    uniform float t; uniform vec2 r;
    uniform float uLevels;
    float Bayer2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
    float Bayer4(vec2 a){return Bayer2(.5*a)*.25+Bayer2(a);}
    float Bayer8(vec2 a){return Bayer4(.5*a)*.25+Bayer2(a);}
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    float hash(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);}
    float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
    float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
    /* hero-matched ordered-dither quantisation: deep -> pale -> paper */
    vec3 dith(float lum,float hit){
      float grain=max(r.y/260.,1.6);
      float bay=Bayer8(gl_FragCoord.xy/grain)-.5;
      /* uLevels was a hard 5 (so /4.). Five steps, minus the top one that
         smoothsteps to white and is then dropped as paper, left about four
         usable ink levels for the whole illustration - which is why the
         shading read flat no matter how the light was aimed. Raising this
         is the actual lever on tonal range. */
      float q=clamp(floor(lum*uLevels+bay)/(uLevels-1.),0.,1.);
      vec3 col=mix(vec3(.545,.48,.93),vec3(.875,.855,.985),q);
      col=mix(col,vec3(1.),smoothstep(.92,1.,q));
      return mix(vec3(1.),col,clamp(hit,0.,1.));
    }`;

  const NORM = `
    vec3 calcN(vec3 p){
      vec2 e=vec2(.004,0.);
      return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));
    }`;

  const EYE = `
      uniform float uZoom;
      uniform vec2  uOfs;
      uniform float uBlinkSpeed,uBlinkPow,uBlinkAmt;
      float map(vec3 p){
        return length(p)-1.;
      }`+NORM+`
      void main(){
        vec2 uv=(gl_FragCoord.xy*2.-r)/min(r.x,r.y);
        /* framing only. uOfs pans the subject inside the square bake; it is
           normalised (a fraction of the frame), so it survives zoom changes.
           +y pans the view up, which moves the subject DOWN in frame. */
        uv=(uv+uOfs)*uZoom;
        float wob=.05*sin(t*.27);
        vec3 ro=vec3(0.,.08,3.05); ro.xz*=rot(wob);
        vec3 rd=normalize(vec3(uv,-3.)); rd.xz*=rot(wob);
        float dt=0.,hit=0.; vec3 pos=ro;
        for(int i=0;i<64;i++){pos=ro+rd*dt;float d=map(pos);if(d<.003){hit=1.;break;}dt+=d;if(dt>9.)break;}
        float lum=1.;
        if(hit>.5){
          vec3 n=calcN(pos);
          vec3 l=normalize(vec3(.55,.85,.7));
          float dif=clamp(dot(n,l)*.5+.5,0.,1.);
          float fres=pow(1.-max(dot(n,-rd),0.),2.6);
          lum=pow(clamp(dif*.8+fres*.34,0.,1.),.62);
          /* iris + pupil painted on the gaze axis */
          vec3 g=normalize(vec3(.16*sin(t*.33),.08*sin(t*.55+1.7),1.));
          vec3 pn=normalize(pos);
          float ang=acos(clamp(dot(pn,g),-1.,1.));
          if(ang<.62){
            vec3 u=normalize(cross(g,vec3(0.,1.,0.))),v=cross(u,g);
            vec2 q=vec2(dot(pn,u),dot(pn,v));
            float rad=ang/.55, a=atan(q.y,q.x);
            float irisL=.46+.16*sin(a*24.+rad*5.)+.09*sin(a*7.-2.)+.08*sin(rad*24.);
            irisL*=.35+.75*dif;
            irisL-=.3*smoothstep(.72,1.,rad);
            if(rad<.34) irisL=.05;
            lum=mix(lum,clamp(irisL,0.,1.),smoothstep(1.12,.98,rad));
          }
          vec3 hv=normalize(l-rd);
          lum+=pow(max(dot(n,hv),0.),70.)*1.2;
          lum=clamp(lum,0.,1.);
          /* eyelid mask - lids sweep in and blank the covered eyeball */
          float b=pow(abs(sin(t*uBlinkSpeed)),uBlinkPow)*uBlinkAmt;
          float lidY=pos.y+.16*pos.x*pos.x;
          float top=mix(1.08,-.05,b), bot=mix(-1.08,-.15,b);
          float m=clamp(smoothstep(top,top+.03,lidY)+smoothstep(bot,bot-.03,lidY),0.,1.);
          lum=mix(lum,1.,m); hit*=1.-m;
        } else {
          float tp=(-1.5-ro.y)/rd.y;
          if(tp>0.){
            vec3 sp=ro+rd*tp;
            float s=exp(-1.4*dot(sp.xz,sp.xz));
            lum=1.-.42*s; hit=smoothstep(.03,.25,s);
          }
        }
        gl_FragColor=vec4(dith(lum,hit),hit>.5?lum:1.);  /* alpha = UNDITHERED lum, for particle shading */
      }`;

  /* Dentomate's dental cast - index.html:862-926, verbatim except uZoom.
     Baked at t=0: the sway rot(.55*sin(0)) is identity so the arch faces
     front, and `open` sits at its .3 midpoint, a clean open bite. */
  const TOOTH = `
      uniform float uZoom;
      uniform vec2  uOfs;
      float jaw(vec3 p){
        float R=.78;
        float a=atan(p.x,p.z);
        float rr=length(p.xz)-R;
        float gum=length(vec2(rr,p.y-.12))-.125;
        gum+=.012*sin(a*22.)*sin(p.y*30.);
        float da=.24;
        float ai=clamp(floor(a/da+.5),-5.,5.)*da;
        float s=(a-ai)*R;
        float h=hash(vec2(ai*10.,3.7));
        float w=.055+.03*smoothstep(.3,1.2,abs(ai));
        float ht=.21+.05*h;
        float mol=smoothstep(.5,1.2,abs(ai));
        vec3 q=vec3(s,p.y+ht*.5,rr);
        q.x*=1.+.9*q.y;
        float th=sdBox(q,vec3(w,ht*.5,.048+.014*mol))-.03;
        th+=.012*mol*cos(q.x/w*3.14159);
        th-=.008*cos(q.y*16.);
        th+=.006*smoothstep(.02,.09,q.y);
        float d=smin(gum,th,.035);
        float base=max(length(p.xz)-(R+.05),abs(p.y-.28)-.08);
        d=smin(d,base,.07);
        return max(d,-(p.z+.3));
      }
      float map(vec3 p){
        p.xz*=rot(.55*sin(t*.25));
        p.yz*=rot(.5236);
        float open=.3+.05*sin(t*.6);
        vec3 pu=p; pu.y-=open;
        vec3 pl=p; pl.y=-(p.y+open);
        pl.xz*=rot(.04);
        return min(jaw(pu),jaw(pl))*.55;
      }`+NORM+`
      void main(){
        vec2 uv=(gl_FragCoord.xy*2.-r)/min(r.x,r.y);
        /* framing only. uOfs pans the subject inside the square bake; it is
           normalised (a fraction of the frame), so it survives zoom changes.
           +y pans the view up, which moves the subject DOWN in frame. */
        uv=(uv+uOfs)*uZoom;
        vec3 ro=vec3(0.,.5,3.); vec3 rd=normalize(vec3(uv.x,uv.y-.28,-3.6));
        float dt=0.,hit=0.; vec3 pos=ro;
        for(int i=0;i<90;i++){pos=ro+rd*dt;float d=map(pos);if(d<.003){hit=1.;break;}dt+=d;if(dt>9.)break;}
        float lum=1.;
        if(hit>.5){
          vec3 n=calcN(pos);
          vec3 l=normalize(vec3(.55,.9,.6));
          float dif=clamp(dot(n,l)*.5+.5,0.,1.);
          float fres=pow(1.-max(dot(n,-rd),0.),2.4);
          lum=pow(clamp(dif*.85+fres*.32,0.,1.),.6);
          float ao=clamp(map(pos+n*.22)/.22,0.,1.);
          lum*=.55+.45*ao;
          vec3 hv=normalize(l-rd);
          lum+=pow(max(dot(n,hv),0.),40.)*.9;
          lum=clamp(lum,0.,1.);
        } else {
          float tp=(-1.25-ro.y)/rd.y;
          if(tp>0.){
            vec3 sp=ro+rd*tp;
            float s=exp(-1.7*dot(sp.xz,sp.xz));
            lum=1.-.4*s; hit=smoothstep(.03,.25,s);
          }
        }
        gl_FragColor=vec4(dith(lum,hit),hit>.5?lum:1.);  /* alpha = UNDITHERED lum, for particle shading */
      }`;

  /* IRBS' isometric room grid - index.html:928-970, verbatim except uZoom.
     Baked at t=0, where the orbit angle is .55 and every block height
     bH() is frozen mid-cycle, so the grid shows a mix of occupancies. */
  const ROOMS = `
      uniform float uZoom;
      uniform vec2  uOfs;
      uniform float uHeight;
      uniform float uLightAz,uLightEl,uWrap,uGamma,uAO;
      uniform float uCamY,uCamR;
      uniform float uFaceAmt,uFaceX,uFaceZ;
      float bH(vec2 id){
        float h=hash(id);
        float occ=smoothstep(-.25,.65,sin(t*.5+h*6.2831));
        /* uHeight scales ONLY the raised term. The .06 pad is what an
           unoccupied plot collapses to when occ hits 0, so scaling the
           whole return would grow the empty plots into blocks too and
           lose the occupancy read. Pads stay flat, towers get taller. */
        return .06+.46*uHeight*occ*(.55+.45*hash(id+7.1));
      }
      float map(vec3 p){
        vec2 id=clamp(floor(p.xz/.6+.5),vec2(-2.,-1.),vec2(3.,2.));
        float h=bH(id);
        float d=sdBox(p-vec3(id.x*.6,h*.5,id.y*.6),vec3(.2,h*.5,.2))-.03;
        float fl=sdBox(p-vec3(.3,-.09,.3),vec3(2.05,.05,1.45))-.02;
        return min(d,fl)*.6;
      }`+NORM+`
      void main(){
        vec2 uv=(gl_FragCoord.xy*2.-r)/min(r.x,r.y);
        /* framing only. uOfs pans the subject inside the square bake; it is
           normalised (a fraction of the frame), so it survives zoom changes.
           +y pans the view up, which moves the subject DOWN in frame. */
        uv=(uv+uOfs)*uZoom;
        vec3 ta=vec3(.3,0.,.3);
        float orb=.55+t*.05;
        /* The original (.8 out, 3.6 up) is a 77deg near-plan view, which
           foreshortens the block height almost to nothing - taller towers
           just grow sideways and merge instead of reading as height.
           Pulling the camera down and out is what actually makes them
           read as buildings. */
        vec3 ro=ta+vec3(uCamR*cos(orb),uCamY,uCamR*sin(orb));
        vec3 f=normalize(ta-ro),rt2=normalize(cross(f,vec3(0.,1.,0.))),up=cross(rt2,f);
        vec3 rd=normalize(uv.x*rt2+uv.y*up+3.*f);
        float dt=0.,hit=0.; vec3 pos=ro;
        for(int i=0;i<80;i++){pos=ro+rd*dt;float d=map(pos);if(d<.004){hit=1.;break;}dt+=d;if(dt>12.)break;}
        float lum=1.;
        if(hit>.5){
          vec3 n=calcN(pos);
          /* Light rebuilt from azimuth/elevation instead of the fixed
             (.6,.9,.4). That vector is dominated by its y term, so the
             tops lit and all four sides landed on nearly the same value
             - which is most of why the block faces read flat. Dropping
             the elevation separates the sides. */
          float ce=cos(uLightEl);
          vec3 l=normalize(vec3(ce*cos(uLightAz),sin(uLightEl),ce*sin(uLightAz)));
          /* uWrap 0.5 is the original half-lambert, which maps a face
             pointing straight AWAY from the light to 0.5 and throws away
             half the tonal range. 1.0 is true lambert. */
          float dif=clamp(dot(n,l)*uWrap+(1.-uWrap),0.,1.);
          float fres=pow(1.-max(dot(n,-rd),0.),3.);
          float ao=clamp(map(pos+n*.18)/.18,0.,1.);
          if(pos.y>.03){
            /* uGamma <1 lifts the darks (the original .7), >1 deepens
               them. This is the second half of the flatness. */
            lum=pow(clamp(dif*.85+.12,0.,1.),uGamma);
            vec2 id=clamp(floor(pos.xz/.6+.5),vec2(-2.,-1.),vec2(3.,2.));
            float pend=step(.93,hash(id));
            lum=mix(lum,.22+.18*sin(t*3.),pend);
          } else {
            lum=pow(clamp(dif,0.,1.),.35)*.99;
          }
          /* Per-AXIS face shading. One directional light cannot reliably
             separate three mutually perpendicular faces: the top's value
             is sin(elevation) while a side's is cos(elevation)*sin(az),
             and those collide at some azimuth no matter where the sun is
             put - which is exactly why the tops and one wall were landing
             on the same tone. Weighting by |n.x| / |n.z| / n.y instead
             gives each face its own value independent of sun position,
             the way isometric illustration shades a box. The weights sum
             to ~1 on an axis-aligned box, so this picks rather than
             darkens, and the floor (n=(0,1,0)) is left untouched. */
          float face = max(n.y,0.) + abs(n.x)*uFaceX + abs(n.z)*uFaceZ;
          lum = mix(lum, lum*face, uFaceAmt);
          /* contact shading, scaled: 0 removes it, 1 is the original */
          lum*=1.-uAO*(.5-.5*ao);
          lum+=.14*fres;
          lum=clamp(lum,0.,1.);
        }
        gl_FragColor=vec4(dith(lum,hit),hit>.5?lum:1.);  /* alpha = UNDITHERED lum, for particle shading */
      }`;

  /* The fourth source is not an SDF: it is a still of the TAE Ad Studio film
     (0:51, the ring of ads) with the green backdrop cut away to paper and
     the ads graded to ink, prepared offline into ring.webp. The bake maps it
     onto a canvas-shaped target with object-fit:cover maths, then sways it a
     degree or two about the centre - the film's own ring turns, and this is
     that motion, small enough that the cover crop never shows an edge. */
  const ADS = `
      uniform sampler2D uImg;
      uniform float uZoom,uAsp,uReady,uTurn;
      void main(){
        vec2 uv=gl_FragCoord.xy/r;
        vec2 p=(uv-.5)*vec2(uAsp,1.);           /* units of bake height */
        p=rot(uTurn*sin(t*.5))*p/uZoom;
        float srcA=16./9., k=max(uAsp/srcA,1.); /* cover: source height, in bake heights */
        vec2 q=p/vec2(srcA*k,k)+.5;
        float lum=texture2D(uImg,q).r;
        if(uReady<.5||q.x<0.||q.x>1.||q.y<0.||q.y>1.) lum=1.;
        float hit=1.-step(.97,lum);
        gl_FragColor=vec4(dith(lum,hit),hit>.5?lum:1.);
      }`;

  /* Per-source framing. The originals render into wide case-card canvases,
     where uv.x spans further than uv.y; a square bake would crop them, so
     each gets its own zoom. `lid` marks the one source the eyelid blink
     applies to - the other two have no lids to sweep.

     `ofs` recentres the subject. Every one of these SDFs sits low in its
     own frame (measured ink gaps were 22-28% above vs ~3% below, so the
     illustration hung off the bottom of the card with a void over it).
     A negative y pans the view down, which lifts the subject in frame.
     The zooms are the originals scaled by 0.9, which magnifies the
     subject ~11% so it fills the box rather than floating in it. */
  const SRC = {
    eye:   {frag:EYE,   zoom:1.35, ofs:[0, -0.230], period:Math.PI/0.4},
    tooth: {frag:TOOTH, zoom:1.44, ofs:[0, -0.201], period:2*Math.PI/0.6},
    rooms: {frag:ROOMS, zoom:1.98, ofs:[0, -0.269], period:2*Math.PI/0.5},
    /* `img` marks an image source; its lattice and bake take the canvas's
       own aspect instead of the square the SDF cards share */
    ads:   {frag:ADS,   zoom:1.04, ofs:[0, 0], period:4*Math.PI, img:'assets/ad-studio/ring.webp'}
  };

  const OKLCH = `
    vec3 oklab2lrgb(vec3 lab){
      float l_ = lab.x + 0.3963377774*lab.y + 0.2158037573*lab.z;
      float m_ = lab.x - 0.1055613458*lab.y - 0.0638541728*lab.z;
      float s_ = lab.x - 0.0894841775*lab.y - 1.2914855480*lab.z;
      float l = l_*l_*l_, m = m_*m_*m_, s = s_*s_*s_;
      return vec3(
        4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
       -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
       -0.0041960863*l - 0.7034186147*m + 1.7076147010*s);
    }
    vec3 lrgb2srgb(vec3 c){
      c = max(c, vec3(0.));
      vec3 lo = c*12.92;
      vec3 hi = 1.055*pow(c, vec3(1./2.4)) - 0.055;
      return mix(lo, hi, step(vec3(0.0031308), c));
    }
    vec3 oklch2rgb(vec3 lch){
      float h = radians(lch.z);
      vec3 lab = vec3(lch.x, lch.y*cos(h), lch.y*sin(h));
      return clamp(lrgb2srgb(oklab2lrgb(lab)), 0., 1.);
    }`;

  function makeMat(){ return new THREE.ShaderMaterial({
    /* Normal alpha blending, NOT additive. The Shopify reference is
       additive because it sits on near-black; on white paper additive
       blows every particle out to white. On a light ground the dots
       have to darken, so alpha blending is the correct translation. */
    transparent:true,
    depthWrite:false,
    blending:THREE.NormalBlending,
    uniforms:{
      uForm:{value:0}, uTime:{value:0}, uDrift:{value:1},
      uBake:{value:null}, uLumaMax:{value:LUMA_MAX},
      uIdleAmt:{value:0.014}, uIdleSpeed:{value:1}, uIdleZ:{value:0.5}, uIdleMode:{value:0},
      uLifeMix:{value:0.5}, uLifeRate:{value:0.18}, uLifeVary:{value:0.6},
      uLifeSize:{value:0.5}, uLifeRise:{value:0.05},
      uSize:{value:0.0062}, uScale:{value:1},
      uPointer:{value:new THREE.Vector2()}, uPointerW:{value:new THREE.Vector2()},
      uSpread:{value:0.25}, uScatter:{value:1.7}, uLooseBoost:{value:0.9},
      uAlphaS:{value:0.55}, uAlphaInk:{value:0.42}, uEdge:{value:0.05},
      uParallax:{value:1},
      uBlinkAmt:{value:1}, uBlinkSpeed:{value:0.4}, uBlinkPow:{value:20},
      uHoverMode:{value:0}, uHoverR:{value:0.5}, uHoverS:{value:0.18},
      uMonoMix:{value:1}, uInkShade:{value:0.55}, uShadeClean:{value:1},
      uBase:{value:new THREE.Vector3(0.55,0.19,285)},
      uHoverColMix:{value:1}, uHoverColR:{value:0.6}, uHoverAlpha:{value:0.6},
      uGA:{value:new THREE.Vector3(0.62,0.20,20)},
      uGB:{value:new THREE.Vector3(0.62,0.20,20)},
      uHuePath:{value:2}, uGradSrc:{value:0}
    },
    vertexShader:`
      attribute vec3 aTarget; attribute vec2 aUV; attribute float aSeed;
      uniform sampler2D uBake; uniform float uLumaMax;
      uniform float uForm,uTime,uDrift,uSize,uScale,uSpread,uScatter,uLooseBoost;
      uniform float uIdleAmt,uIdleSpeed,uIdleZ;
      uniform float uLifeMix,uLifeRate,uLifeVary,uLifeSize,uLifeRise;
      uniform int uIdleMode;
      uniform float uAlphaS,uAlphaInk,uParallax;
      uniform float uHoverR,uHoverS;
      uniform float uMonoMix,uInkShade,uHoverColMix,uHoverColR,uHoverAlpha;
      uniform float uShadeClean;
      uniform int uHoverMode,uHuePath,uGradSrc;
      uniform vec3 uBase,uGA,uGB;
      uniform vec2 uPointer,uPointerW;
      varying vec3 vColor; varying float vAlpha;
      `+OKLCH+`
      void main(){
        /* uBake is re-rendered from the source SDF every frame, so this is
           the LIVE illustration, not a frozen still. Sampling it here is
           what keeps the mouth opening and the room blocks rising - the
           particles inherit the original animation instead of replacing
           it. Declared as locals so the colour maths below is unchanged. */
        vec4 tex = texture2D(uBake, aUV);
        float luma = dot(tex.rgb, vec3(.2126, .7152, .0722));
        vec3  aColor = tex.rgb;
        /* Shade from the UNDITHERED luminance the bake carries in alpha,
           not from the dithered rgb. Ordered dither scatters neighbouring
           pixels across tone levels on purpose - it encodes tone as dot
           DENSITY, to be averaged by the eye. One particle samples one
           pixel, so reading rgb gives it dither noise rather than shading,
           and the field averages out to a flat grey. tex.a is the smooth
           value, so lightness now tracks the actual lighting. rgb still
           drives the silhouette below, keeping the stippled edge. */
        float aInk   = 1. - mix(luma, tex.a, uShadeClean);
        /* paper carries no particle - park it off-clip. As the shape moves,
           particles switch between parked and visible, which is how the
           animation reads across a fixed lattice. */
        if(luma >= uLumaMax){
          gl_Position = vec4(2., 2., 2., 1.);
          gl_PointSize = 0.;
          return;
        }

        float e = uForm*uForm*(3.-2.*uForm);
        /* per-particle stagger so the image assembles rather than snapping */
        float s = clamp((e - aSeed*uSpread)/max(1.-uSpread, .001), 0., 1.);
        s = s*s*(3.-2.*s);
        vec3 p = mix(position*uScatter, aTarget, s);

        float loose = (1.-s)*uDrift;
        p.x += sin(uTime*.61 + aSeed*39.1)*.16*loose;
        p.y += cos(uTime*.47 + aSeed*27.3)*.16*loose;
        p.z += sin(uTime*.38 + aSeed*61.7)*.24*loose;
        p.xy += uPointer*(.06 + .26*loose)*uParallax;

        /* ---- idle motion -------------------------------------------
           The wander above is scaled by (1-s), so it dies off exactly as
           the image forms and a settled eye sits perfectly still. This
           term is scaled by s instead, so it only exists once particles
           are AT their places - it keeps the formed eye alive without
           moving anything off target. Amplitude is in world units and
           SPAN is 2.4, so useful values are small. */
        float ph = aSeed*6.2831853;
        float it = uTime*uIdleSpeed;
        vec3 idle;
        if(uIdleMode == 0){        /* drift - slow, uncorrelated wander */
          idle = vec3(sin(it*.61 + ph*6.1), cos(it*.47 + ph*4.3), sin(it*.38 + ph*9.7));
        } else if(uIdleMode == 1){ /* jitter - fast, grainy, per-particle */
          idle = vec3(sin(it*3.7 + ph*11.), cos(it*4.3 + ph*7.), sin(it*3.1 + ph*13.));
        } else if(uIdleMode == 2){ /* breathe - radial pulse from centre */
          vec2 d = aTarget.xy/max(length(aTarget.xy), 1e-4);
          idle = vec3(d*sin(it*.9 - length(aTarget.xy)*2.2), 0.);
        } else if(uIdleMode == 3){ /* orbit - each particle circles its spot */
          idle = vec3(cos(it*1.3 + ph), sin(it*1.3 + ph), 0.);
        } else {                   /* flow - neighbours move together */
          float a = sin(aTarget.x*3.1 + it*.5) + cos(aTarget.y*2.7 - it*.4);
          idle = vec3(cos(a*3.1), sin(a*2.7), sin(a));
        }
        idle.z *= uIdleZ;
        p += idle*uIdleAmt*s*uDrift;

        /* ---- birth & death -----------------------------------------
           Each particle runs its own loop: fade in, hold, fade out,
           respawn. aSeed offsets the phase and a second derived random
           varies the rate, so the field turns over continuously instead
           of pulsing in unison. At uDrift 0 (reduced motion) the whole
           envelope collapses to 1 so nothing flickers. */
        float r2 = fract(aSeed*137.13);
        float rate = uLifeRate*mix(1., .35 + 1.3*r2, uLifeVary);
        float life = fract(uTime*rate + aSeed*7.13);
        float env = smoothstep(0., .18, life)*smoothstep(1., .82, life);
        float lifeE = mix(1., env, uLifeMix*uDrift);
        /* born rising into place, dying drifting on out the other side */
        p.y += (life < .5 ? -1. : 1.)*(1. - env)*uLifeRise*uLifeMix*uDrift;

        /* hover - uPointerW is the cursor projected onto the z=0 plane in
           world units, so uHoverR is a real radius rather than a screen
           fraction and stays honest when the window is resized. */
        if(uHoverMode > 0){
          vec2 d = p.xy - uPointerW;
          float dist = length(d);
          vec2 dir = d/max(dist, 1e-4);
          float infl = 1. - smoothstep(0., uHoverR, dist);
          if(uHoverMode == 1)      p.xy += dir*infl*uHoverS;   /* repel  */
          else if(uHoverMode == 2) p.xy -= dir*infl*uHoverS;   /* attract*/
          else if(uHoverMode == 3) p.xy += vec2(-dir.y, dir.x)*infl*uHoverS; /* swirl */
          else                     p.z  += infl*uHoverS;       /* lift   */
        }

        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_Position = projectionMatrix*mv;
        /* loose particles are drawn a touch larger so the cloud reads
           as a cloud rather than dissolving into nothing */
        gl_PointSize = uSize*(1. + uLooseBoost*(1.-s))*uScale/max(-mv.z, .001)
                     * mix(1., .25 + .75*env, uLifeSize*uLifeMix*uDrift);

        /* ---- colour ------------------------------------------------
           Resting state is MONOCHROME: one picked OKLCH hue, with the
           baked ink level moving only lightness (and a little chroma) so
           the eye keeps its modelling instead of turning into a flat
           silhouette. uMonoMix crossfades back to the original dither
           ramp if you want the old look. */
        float ink = clamp(aInk, 0., 1.);
        float Le = clamp(uBase.x + uInkShade*(1.-uBase.x)*(1.-ink), 0., 1.);
        float Ce = uBase.y*mix(1. - .55*uInkShade, 1., ink);
        vec3 baseCol = mix(aColor, oklch2rgb(vec3(Le, Ce, uBase.z)), uMonoMix);

        /* ---- hover gradient ----------------------------------------
           Independent of uHoverMode, so colour can respond to the cursor
           with no displacement at all. cInfl is 1 under the cursor and
           falls to 0 at uHoverColR. */
        vec2 dc = p.xy - uPointerW;
        float dist2 = length(dc);
        float cInfl = 1. - smoothstep(0., uHoverColR, dist2);
        float g;
        if(uGradSrc == 0)      g = clamp(dist2/max(uHoverColR, 1e-4), 0., 1.);
        else if(uGradSrc == 1) g = clamp(length(aTarget.xy)/1.2, 0., 1.);
        /* atan(0,0) is undefined, and the dead-centre pixel lands exactly
           there, so nudge x off zero to keep that one particle out of NaN */
        else if(uGradSrc == 2) g = atan(aTarget.y, aTarget.x + 1e-6)/6.2831853 + .5;
        else                   g = ink;
        /* Hue path. The shortest-path form alone can never sweep more than
           180deg, which is why a 0 -> 359 pair used to travel 1deg instead
           of the whole spectrum. Adding a full turn makes the sweep reach
           360deg and beyond, so a real spectrum is now expressible. */
        float dh = mod(uGB.z - uGA.z + 540., 360.) - 180.;
        if(uHuePath == 1)      dh = dh > 0. ? dh - 360. : dh + 360.;
        else if(uHuePath == 2) dh = dh + 360.;
        else if(uHuePath == 3) dh = dh - 360.;
        vec3 grad = oklch2rgb(vec3(
          mix(uGA.x, uGB.x, g),
          mix(uGA.y, uGB.y, g),
          uGA.z + dh*g));
        vColor = mix(baseCol, grad, cInfl*uHoverColMix);

        /* ink drives opacity, so the pupil reads solid and the
           highlights stay as faint as they are in the source */
        vAlpha = mix(uAlphaS, 1., s)*mix(uAlphaInk, 1., sqrt(aInk));

        /* blink - the lid mask from index.html:842-846. Particles the lids
           sweep over fade out instead of being painted paper white, which
           lands the same way on a white ground. aLid is the sentinel 999
           for shadow/background particles, which the lids never touched in
           the original either. Scaled by s so a scattered cloud does not
           blink, and by uDrift so reduced-motion holds the eye open. */

        /* Particles are 0.42-0.55 opaque over white paper, which dilutes
           any colour toward the background. Lifting alpha under the cursor
           is what actually lets the hover gradient read as saturated. */
        vAlpha = mix(vAlpha, 1., cInfl*uHoverAlpha);

        /* life last, so a dying particle still fades even under the
           cursor's opacity lift */
        vAlpha *= lifeE;
      }`,
    fragmentShader:`
      precision highp float;
      uniform float uEdge;
      varying vec3 vColor; varying float vAlpha;
      void main(){
        vec2 c = gl_PointCoord - .5;
        float d = dot(c,c);
        if(d > .25) discard;
        gl_FragColor = vec4(vColor, smoothstep(.25, uEdge, d)*vAlpha);
      }`
  }); }

  /* ---- lattice -------------------------------------------------
     Built once and shared by all three cards: the attribute data is
     identical, only the bake each samples differs. A regular grid
     would beat against the ordered dither into moire, so every
     sample is jittered inside its own cell. */
  const G = Math.max(16, P.grid|0);
  /* A is width/height. The SDF cards share one square (A=1) lattice; the
     image source builds its own at the canvas aspect, at the same density
     per world unit, so its particles are the same size and spacing. */
  function lattice(A){
    const GX = Math.round(G*A), N = GX*G;
    const aPos  = new Float32Array(N*3), aTgt = new Float32Array(N*3);
    const aUv   = new Float32Array(N*2), aSeed = new Float32Array(N);
    for(let i=0, gy=0; gy<G; gy++){
      for(let gx=0; gx<GX; gx++, i++){
        const u = (gx+Math.random())/GX, v = (gy+Math.random())/G;
        aUv[i*2] = u; aUv[i*2+1] = v;
        aTgt[i*3] = (u-.5)*SPAN*A; aTgt[i*3+1] = (v-.5)*SPAN; aTgt[i*3+2] = 0;
        aSeed[i] = Math.random();
        /* scatter start stored as a unit ball, scaled by uScatter */
        const a = Math.random()*2-1, th = Math.random()*Math.PI*2;
        const rr = Math.cbrt(Math.random()), sq = Math.sqrt(1-a*a);
        aPos[i*3] = rr*sq*Math.cos(th)*A;
        aPos[i*3+1] = rr*sq*Math.sin(th);
        aPos[i*3+2] = rr*a*0.7;
      }
    }
    return {aPos, aTgt, aUv, aSeed};
  }
  const SQUARE = lattice(1);
  function makeGeo(L){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(L.aPos, 3));
    g.setAttribute('aTarget',  new THREE.BufferAttribute(L.aTgt, 3));
    g.setAttribute('aUV',      new THREE.BufferAttribute(L.aUv, 2));
    g.setAttribute('aSeed',    new THREE.BufferAttribute(L.aSeed, 1));
    return g;
  }

  /* How long one loop of a source's OWN animation takes. Hold is
     measured in whole loops of this, so the jaw finishes opening AND
     closing before the field is allowed to break up. */
  function animPeriod(key){
    if(key === 'eye') return Math.PI/Math.max(P.blinkSpeed, 1e-3);
    return SRC[key].period;
  }

  function cycle(o, tc){
    const a = P.formSec;
    const b = P.holdMode === 'one full loop'
            ? animPeriod(o.key)*P.animLoops : P.holdSec;
    const c = P.dispSec, d = P.restSec;
    const period = a + b + c + d;
    if(period <= 0){ o.phase = 'hold'; return 1; }
    const u = tc % period;
    if(u < a)     { o.phase = 'form';     return u/a; }
    if(u < a+b)   { o.phase = 'hold';     return 1; }
    if(u < a+b+c) { o.phase = 'disperse'; return 1 - (u-a-b)/c; }
    o.phase = 'rest'; return 0;
  }

  const halfTan = Math.tan(FOV*Math.PI/360);
  const inst = [];

  canvases.forEach(cv => {
    const key = cv.dataset.fx;
    if(!SRC[key]) return;
    /* same guard as the hero background: skip the canvas, keep the page */
    let rd; try{ rd = new THREE.WebGLRenderer({canvas:cv, antialias:false}); }
    catch(err){ cv.style.display = 'none'; return; }
    rd.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    /* data-mode="bg": a page background - formed and kept formed, slowed by
       data-speed, deaf to the pointer, cleared to the page's own colour */
    const bg = cv.dataset.mode === 'bg';
    const speed = +(cv.dataset.speed || 1);
    const clear = new THREE.Color(P.bg);
    if(bg){ const pc = getComputedStyle(document.body).backgroundColor; if(!/rgba\(.*,\s*0\)|transparent/.test(pc)) clear.setStyle(pc); }
    rd.setClearColor(clear, 1);

    /* data-img swaps the picture behind an image source (Dentomate's film
       card uses its own frame); data-turn sets how far that picture sways */
    const src = Object.assign({}, SRC[key]);
    if(src.img && cv.dataset.img) src.img = cv.dataset.img;
    const aspectOf = () => src.img ? (cv.clientWidth||900)/(cv.clientHeight||300) : 1;
    let A = aspectOf();
    const rt = new THREE.WebGLRenderTarget(Math.round(SIZE*A), SIZE);
    /* nearest, and no mipmaps: the dither must stay crisp, and a
       particle samples a single pixel rather than an average */
    rt.texture.minFilter = rt.texture.magFilter = THREE.NearestFilter;
    rt.texture.generateMipmaps = false;

    /* Sources that lack a given uniform simply never bind it, so one
       uniform block serves all three. */
    const bakeMat = new THREE.ShaderMaterial({
      uniforms:{
        t:{value:0}, r:{value:new THREE.Vector2(SIZE,SIZE)},
        uZoom:{value:SRC[key].zoom}, uLevels:{value:P.toneLevels},
        uOfs:{value:new THREE.Vector2(SRC[key].ofs[0], SRC[key].ofs[1])},
        uBlinkSpeed:{value:P.blinkSpeed}, uBlinkPow:{value:P.blinkPow},
        uBlinkAmt:{value:P.blinkAmt},
        uHeight:{value:P.roomHeight},
        uLightAz:{value:P.lightAz}, uLightEl:{value:P.lightEl},
        uWrap:{value:P.lightWrap}, uGamma:{value:P.lightGamma},
        uAO:{value:P.lightAO},
        uCamY:{value:P.camY}, uCamR:{value:P.camR},
        uFaceAmt:{value:P.faceAmt}, uFaceX:{value:P.faceX},
        uFaceZ:{value:P.faceZ},
        uImg:{value:null}, uAsp:{value:A}, uReady:{value:0},
        uTurn:{value:+(cv.dataset.turn || .026)}
      },
      vertexShader:'void main(){gl_Position=vec4(position,1.0);}',
      fragmentShader:HEAD+SRC[key].frag
    });
    const bakeScene = new THREE.Scene();
    bakeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), bakeMat));
    const bakeCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

    const mat = makeMat();
    const u = mat.uniforms;
    u.uSize.value = P.pt;             u.uScatter.value = P.scatter;
    u.uSpread.value = P.spread;       u.uLooseBoost.value = P.looseBoost;
    /* uDrift gates the wander, the idle motion and the life cycle at
       once, so reduced motion is a single switch */
    u.uDrift.value = reduce ? 0 : P.drift;
    u.uIdleAmt.value = P.idleAmt;     u.uIdleSpeed.value = P.idleSpeed;
    u.uIdleZ.value = P.idleZ;         u.uIdleMode.value = IDLE.indexOf(P.idleMode);
    u.uLifeMix.value = P.lifeMix;     u.uLifeRate.value = P.lifeRate;
    u.uLifeVary.value = P.lifeVary;   u.uLifeSize.value = P.lifeSize;
    u.uLifeRise.value = P.lifeRise;
    u.uAlphaS.value = P.alphaS;       u.uAlphaInk.value = P.alphaInk;
    u.uEdge.value = P.edge;
    u.uBlinkAmt.value = P.blinkAmt;   u.uBlinkSpeed.value = P.blinkSpeed;
    u.uBlinkPow.value = P.blinkPow;
    u.uHoverMode.value = HOVER.indexOf(P.hoverMode);
    u.uMonoMix.value = P.monoMix;     u.uInkShade.value = P.inkShade;
    u.uShadeClean.value = P.shadeClean;
    /* radii are fixed; the STRENGTH of every cursor effect starts at zero
       and is driven from o.hov in the loop. They must not start at their P
       values: uPointer rests at the centre of the field, so a non-zero
       strength paints a gradient there with no cursor present - and under
       reduced motion the loop never runs to correct it. */
    u.uHoverR.value = P.hoverR;       u.uHoverColR.value = P.hoverColR;
    u.uHoverS.value = 0;              u.uParallax.value = 0;
    u.uHoverColMix.value = 0;         u.uHoverAlpha.value = 0;
    u.uHuePath.value = HUEP.indexOf(P.huePath);
    u.uGradSrc.value = GRAD.indexOf(P.gradSrc);
    u.uBase.value.set(P.baseL, P.baseC, P.baseH);
    u.uGA.value.set(P.gaL, P.gaC, P.gaH);
    u.uGB.value.set(P.gbL, P.gbC, P.gbH);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(FOV, 4/3, .1, 100);
    const pts = new THREE.Points(makeGeo(src.img ? lattice(A) : SQUARE), mat);
    scene.add(pts);

    /* The image source is not drawable until its texture lands - before
       that it samples black, which would flash a solid ink slab. It also
       answers to the film player: once .vid opens, the field disperses
       and the loop lets it go. */
    const box = src.img ? cv.closest('.vid') : null;
    if(box) box.classList.add('fx-live');
    if(src.img){
      new THREE.TextureLoader().load(src.img, tex => {
        bakeMat.uniforms.uImg.value = tex;
        bakeMat.uniforms.uReady.value = 1;
        o.ready = true;
        if(reduce && o.on && !o.drawn){ o.drawn = true; draw(o, P.formEnd); }
      });
    }

    const o = {key, rd, rt, bakeMat, bakeScene, bakeCam, mat, scene, cam, box,
               ready:!src.img, exit:0, bg, speed, age:0,
               on:false, drawn:false, phase:'form', tAnim:0, tCycle:0,
               halfW:1, halfH:1, ptr:new THREE.Vector2(), ptrMid:new THREE.Vector2(), hovMid:0,
               /* `over` is the raw hover state, `hov` its eased 0..1 form */
               over:false, hov:0};

    function size(){
      const w = cv.clientWidth||600, h = cv.clientHeight||450;
      rd.setSize(w, h, false);
      /* the image lattice follows the canvas across the 3:1 / 2:1 step */
      if(src.img && Math.abs(aspectOf() - A) > .01){
        A = aspectOf();
        pts.geometry.dispose(); pts.geometry = makeGeo(lattice(A));
        rt.setSize(Math.round(SIZE*A), SIZE);
        bakeMat.uniforms.uAsp.value = A;
      }
      const aspect = w/h;
      cam.aspect = aspect;
      /* frame the baked square in whichever dimension is tighter */
      /* the SDF cards float with a margin; the image field is a crop and
         runs edge to edge */
      const need = SPAN*(src.img ? 0.5 : 0.54);
      cam.position.z = Math.max(need/halfTan, need/(halfTan*aspect));
      cam.updateProjectionMatrix();
      const db = new THREE.Vector2(); rd.getDrawingBufferSize(db);
      u.uScale.value = db.y/(2*halfTan);
      /* world half-extents on z=0, so uHoverR is a real radius */
      o.halfH = halfTan*cam.position.z;
      o.halfW = o.halfH*aspect;
    }
    size();
    window.addEventListener('resize', size);

    /* Pointer is per-card and rect-relative, so hovering one case does
       not tug at the other two, and it recentres on leave. */
    if(!reduce && !bg){
      const wrap = cv.parentElement;
      wrap.addEventListener('pointermove', ev => {
        const b = cv.getBoundingClientRect();
        o.over = true;
        o.ptr.set((ev.clientX-b.left)/b.width*2-1,
                 -((ev.clientY-b.top)/b.height*2-1));
      });
      wrap.addEventListener('pointerleave', () => {
        o.over = false;
        o.ptr.set(0,0);
      });
    }

    new IntersectionObserver(en => {
      o.on = en[0].isIntersecting;
      /* reduced motion never starts the loop, so draw the one settled
         frame here instead, the first time the card is on screen */
      if(reduce && o.on && o.ready && !o.drawn){ o.drawn = true; draw(o, P.formEnd); }
    }, {threshold:.05}).observe(cv);

    inst.push(o);
  });

  function draw(o, form){
    const u = o.mat.uniforms;
    u.uForm.value = form;
    u.uTime.value = o.tAnim;
    u.uPointerW.value.set(u.uPointer.value.x*o.halfW,
                          u.uPointer.value.y*o.halfH);
    /* Bake first, then draw the points: the particles must sample the
       current frame of the illustration, not the previous one. */
    o.bakeMat.uniforms.t.value = o.tAnim;
    o.bakeMat.uniforms.r.value.set(o.rt.width, o.rt.height);
    o.rd.setRenderTarget(o.rt);
    o.rd.render(o.bakeScene, o.bakeCam);
    o.rd.setRenderTarget(null);
    u.uBake.value = o.rt.texture;
    o.rd.render(o.scene, o.cam);
  }

  if(!reduce){
    let last = performance.now();
    (function loop(){
      const now = performance.now();
      /* frame-rate independent easing - a flat per-frame factor stalls
         badly on slow hardware, where the field barely moves */
      const dt = Math.min((now-last)/1000, 0.1); last = now;
      /* Two exponential stages in series = a critically damped follow:
         it starts and stops at zero velocity, so entering, crossing and
         leaving a card all ease instead of jumping. Per stage, so the
         felt settle time is about 2.5x tau. */
      const kp = 1 - Math.exp(-dt/P.ptrTau);
      const kh = 1 - Math.exp(-dt/P.hovTau);
      inst.forEach(o => {
        if(!o.on || !o.ready || o.exit >= 1) return;
        o.tAnim  += dt*P.timeSpeed*o.speed;
        o.tCycle += dt*P.timeSpeed*o.speed;
        /* the drive is a normalised 0..1 sweep; start/end decide what it
           spans. start above 0 means the field never fully scatters.
           A background gathers once, from a loose cloud, then holds. */
        let form;
        if(o.bg){
          o.age += dt;
          const k = Math.min(1, o.age/1.6);
          form = .55 + (P.formEnd - .55)*(1 - Math.pow(1 - k, 3));
        } else form = P.formStart + (P.formEnd-P.formStart)*cycle(o, o.tCycle);
        /* the film opened: scatter fully over ~0.9s while CSS fades the
           canvas, then stop drawing it for good */
        if(o.box && o.box.classList.contains('open')){
          o.exit = Math.min(1, o.exit + dt/0.9);
          form *= 1 - o.exit;
        }
        const u = o.mat.uniforms;
        o.ptrMid.lerp(o.ptr, kp);
        u.uPointer.value.lerp(o.ptrMid, kp);
        /* Gate every cursor-driven effect on actually being over the card.
           uPointer rests at (0,0), which is the CENTRE of the field, so an
           ungated hover term sits at full strength there forever - that is
           what painted a permanent rainbow blob in the middle of all three
           illustrations. Resting state has to be the monochrome base. */
        o.hovMid += ((o.over ? 1 : 0) - o.hovMid)*kh;
        o.hov    += (o.hovMid - o.hov)*kh;
        u.uHoverColMix.value = P.hoverColMix*o.hov;
        u.uHoverAlpha.value  = P.hoverAlpha*o.hov;
        u.uHoverS.value      = P.hoverS*o.hov;
        u.uParallax.value    = P.parallax*o.hov;
        draw(o, form);
      });
      requestAnimationFrame(loop);
    })();
  }
})();
