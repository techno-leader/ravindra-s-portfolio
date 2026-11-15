/* window-light-styles.js - saved looks for window-light.js, kept for the
   style switcher. Not loaded by any page yet. Each entry is a settings object
   for window.windowLightConfig; anything left out falls back to the engine's
   defaults, so "time" is the visitor's own clock unless a style sets it.

   Use:  window.windowLightConfig = WindowLightStyles['mono-canopy'];
         then load window-light.js with data-mount. */
window.WindowLightStyles = {
  // the engine's own defaults: window frame and leaves swaying outside, mostly lit,
  // on the visitor's clock - the first look, from the screen recording
  'window-leaves': {},
  // dappled morning canopy in grey light, with shafts, grain and a little rainbow fringe
  'mono-canopy': {
    pattern: 'canopy', hour: 9.25, palette: 'mono', sun: '#fff6e8',
    depth: .55, tint: .82, soft: .4, size: 1.45, turn: -7, x: .49, y: .58,
    wind: .7, leaves: .15, density: .39, slats: 11,
    arch: 'flat', jw: .265, jh: .57, rise: .32, cusps: 2, cusp: .042, frame: .032, openings: 3, gap: .055,
    jali: 'hex', lattice: 1.35, hole: 1.1, jrot: 15,
    glass: 'rainbow', sat: .79, hue: .01, band: 1.25, glassC: '#e8336f',
    disp: .16, bloom: .25, shafts: .52, shaftLen: 1.65, grain: .41, grainScale: 106, warp: .48, flicker: .24
  },
  // a dense, windy canopy through stained glass, colour split at the edges
  'stained-canopy': {
    pattern: 'canopy', hour: 9.25, palette: 'custom', sun: '#fff6e8',
    depth: .38, tint: .76, soft: .36, size: 1.35, turn: -18, x: .28, y: .21,
    wind: 1.75, leaves: .02, density: .87, slats: 26,
    arch: 'flat', jw: .265, jh: .57, rise: .32, cusps: 2, cusp: .042, frame: .032, openings: 3, gap: .055,
    jali: 'hex', lattice: 1.35, hole: 1.1, jrot: 15,
    glass: 'stained', sat: .91, hue: .43, glassC: '#2fbf71',
    disp: .38, bloom: .23, shafts: .16, shaftLen: 1.2, grain: .11, grainScale: 91, warp: .3, flicker: .25
  },
  // two round, cusped arches over a turned hex jali, faint and soft, leaves moving outside
  'hex-jharokha': {
    pattern: 'jharokha', hour: 9.25, palette: 'custom', sun: '#fff6e8', shade: '#9a9a9a',
    depth: .18, tint: .52, soft: .92, size: 1.2, turn: -14, x: .4, y: .47,
    wind: 1.9, leaves: .5, density: .87, slats: 26,
    arch: 'round', jw: .215, jh: .37, rise: .51, cusps: 3, cusp: .042, frame: .015, openings: 2, gap: .095,
    jali: 'hex', lattice: 2.55, hole: 1.02, jrot: 33,
    sat: .79, hue: .42, glassC: '#2fbf71',
    disp: .43, bloom: .23, shafts: .1, shaftLen: 1.25, grain: .03, grainScale: 53, warp: .04, flicker: .3
  }
};
