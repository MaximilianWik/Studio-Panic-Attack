# Changelog

All notable changes to Studio Panic Attack are tracked here.

## [0.1.0] — initial build

### Phase 1 — scaffold

- Vite 6 + React 19 + TypeScript project scaffold
- `@react-three/fiber` v9 + drei v10 + postprocessing v3 wiring
- `@paper-design/shaders-react` for 2D shader overlays
- Vercel SPA deployment config (`vercel.json`)
- Dark theme + global CSS reset, custom DOM cursor
- Section registry (`config/sections.ts`) + world-Y layout system
- `useScrollSection` + `useScrollVelocity` + `useDeviceProfile` hooks
- Postprocessing pipeline (bloom + chromatic aberration + vignette + noise)

### Phase 2 — hero + gallery

- Hero: animated dark-noise gradient backdrop (custom GLSL), centered logo
  plane that fades in then dissolves out as scroll progresses, drifting
  "S C R O L L" prompt below
- Gallery: 14-card orbital ring around the camera, secondary BG ring at half
  speed for depth, scroll velocity feeds rotation speed, focal-pop scaling
  for cards passing through the front, pointer parallax tilt on the whole
  rig, per-card jitter (tilt + height) seeded for stable layout

### Phase 3 — scattered images + custom shaders

- Five custom GLSL fragment shaders shipped in `shaders/imageShaders.ts`:
  halftone, ordered Bayer dithering, paper-grain warp, ribbed flute glass,
  procedural liquid metal
- `ImageEffect` component compiles the requested shader and aspect-fits
  textures
- `ScatteredImages` distributes 18 (or 8 on low-power) image planes across
  the scroll range, clusters around the category sections, applies parallax
  + magnetic cursor pull when items are in view
- Asset filenames sanitized to ASCII-safe lowercase kebab-case to avoid
  Vite static-middleware quirks with `&`, parens, and spaces

### Phase 4 — categories

- Shared `CategorySection` layout: massive outlined liquid-metal number,
  HTML eyebrow + serif title + body, scroll-driven entrance/exit
- 01 Graphic Design: drei `MeshTransmissionMaterial` glass torus-knot
  refracting 3D headline text, pointer-driven lens position
- 02 3D Art: noise-displaced icosahedron with iridescent clearcoat metal,
  drei `PresentationControls` for bounded drag-rotate, scroll-modulated
  distortion amplitude
- 03 AI Art: 18 000-particle (4 500 reduced) GPU morph between sphere and
  torus point distributions, vertex shader handles blend + per-particle
  turbulence + pointer scatter projected to the field plane
- 04 UX Design: schematic UI mockup that assembles from offscreen during
  scroll-in then explodes apart to reveal a wireframe grid; CRT scan-line
  shader on the screen plane; magnetic pull on UI elements

### Phase 5 — highlights + polish

- Highlights: 4-card grid in `<Html>` overlay using paper-design's
  `LiquidMetal` shader as the hover treatment, gentle CSS float stagger
- HDRI environment (`warehouse` preset) added so iridescence reads correctly
- ScrollControls now wraps both Layout and PostFx so `useScroll()` is
  available to the velocity tracker that drives chromatic aberration
- Adaptive DPR + adaptive events for low-end devices
- All sections gracefully no-op when their scroll progress is far out of
  view, and the gallery / scattered ring hide entirely outside the visible
  range to save fill rate

### Performance

- Detected GPU tier ≤ 1 collapses the visual budget: scattered images use
  plain texture pass-through, particle morph drops to 4.5K points, lens
  glass swaps to cheap `MeshPhysicalMaterial` transmission, post chain
  drops bloom + chromatic aberration

### Known caveats

- Headless Chromium can hit WebGL context lost on intensive r3f scenes —
  the production deploy on real hardware is unaffected
- HDRI loads from drei's CDN at runtime; first paint can be ~300ms slower
  on cold cache
