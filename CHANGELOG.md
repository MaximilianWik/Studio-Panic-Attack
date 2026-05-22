# Changelog

All notable changes to Studio Panic Attack are tracked here.

## [0.3.2] — pull sculptures up: torus-knot to 01, Hedgehog to 03

- Torus-knot composition (Lens + headline) moved from `ThreeDeeArt.tsx`
  back to `GraphicDesign.tsx` — now appears right below the gallery.
- Hedgehog moved from `UXDesign.tsx` to `AIArt.tsx` — appears next.
- 02 (3D Art) and 04 (UX Design) are now text-only.
- Sides preserved as registered (graphic left / threeD right / ai
  left / ux right) so visual side alternation stays intact.

## [0.3.1] — pull CMYK + Latent Bloom

- 01 (Graphic Design): sculpture removed, hero is empty (text only).
- 03 (AI Art): sculpture removed, hero is empty (text only).
- 02 (3D Art) torus-knot and 04 (UX Design) Hedgehog kept and unchanged.
- `helpers/sculptureEvents.ts`: dropped now-unused `cmykSnapAt` and
  `aiGlitchAt` keys; PostFx no longer reads them.
- `helpers/usePointerVelocity.ts`: removed (was only used by Latent Bloom).

## [0.3.0] — sculpture pass: shock-value reset for 01/03/04, torus-knot reassigned to 02

### Sculptures

- 02 (3D Art) keeps the torus-knot transmission lens + "DESIGN BEYOND
  THE TRADITIONAL FORMAT" headline. The composition was previously
  authored inside `GraphicDesign.tsx` (01); it has been relocated
  verbatim into `ThreeDeeArt.tsx` so the pairing the user was already
  seeing on screen is now the canonical one. Click → `knifeSlashAt`
  event for a chromatic-aberration pulse.
- 01 (Graphic Design) replaced with **CMYK Misregistration**: three
  halftone dot screens (cyan / magenta / yellow at 15° / 75° / 0°)
  multiplied against a white backdrop. Each layer follows the cursor
  with a different drag factor → constant misregistration. Click
  springs all three offsets to zero over ~600 ms — the bold "01"
  silhouette briefly resolves crisply, then drifts apart again.
  Source image is canvas-rasterised at mount. Fires `cmykSnapAt` on
  click for a soft PostFx noise pulse. Pure CMY palette — total
  break from paper/blood.
- 03 (AI Art) replaced with **Latent Bloom**: 5000-point cloud (1800
  on tier ≤ 1) hallucinating through 7 SDF-sampled silhouettes — eye,
  hand, butterfly, key, skull, "DREAM", bloom. All seven targets
  rasterised at mount, packed into a single (N × 7) RGBA Float
  DataTexture; vertex shader morphs between two consecutive targets
  per frame. Pointer velocity multiplies morph speed (slow cursor =
  slow dream, fast cursor = manic generation). Click → freezes the
  morph for ~220 ms and fires `aiGlitchAt`. Neon vaporwave palette
  (cyan ↔ magenta) — full break from paper/blood.
- 04 (UX Design) replaced with **Hedgehog**: an InstancedMesh of 420
  cones (150 on tier ≤ 1) distributed via Fibonacci spiral on a unit
  sphere, each oriented along its outward surface normal. Per-instance
  recoil from the cursor — spikes whose direction aligns with the
  pointer collapse toward zero length, the rest stay erect. Click →
  250 ms global pulse extending every spike to 2× length, plus a
  PostFx noise burst via `hedgehogPulseAt`. Section progress drives
  ball radius growth and slow yaw. Caution-tape yellow + ink black
  palette. Conceptual inversion — a UX hero that visibly refuses to
  be touched.

### Architecture

- New `helpers/sculptureEvents.ts` — tiny zustand store of one-shot
  click timestamps (`knifeSlashAt`, `aiGlitchAt`, `hedgehogPulseAt`,
  `cmykSnapAt`) plus a `decay(at, dur)` envelope helper. Sculptures
  fire their event on click; PostFx and the sculpture itself decay
  the timestamp into transient effects.
- New `helpers/usePointerVelocity.ts` — smoothed NDC pointer-velocity
  hook with EMA (fast attack, slow decay). Used by Latent Bloom to
  modulate morph speed; reusable by future sculptures.
- `PostFx` extended: ChromaticAberration (transient — knife slash and
  AI glitch) and Noise (transient — hedgehog pulse and CMYK snap)
  effects appended to the chain. Both effects are constructed
  manually via `useMemo` and inserted as `<primitive>` so per-frame
  mutation of `offset` and `blendMode.opacity.value` bypasses the
  drei wrapper's prop diffing. Effects collapse to zero between
  events — chain looks identical to the static base when idle.
  Tier ≤ 1 still bypasses the entire chain.

### Cleanup

- `Layout.tsx`: dropped unused `VIEWPORT_HEIGHT_UNITS` import.
- `Vocabulary.tsx`: dropped unused `state` parameter from `useFrame`.

## [0.2.0] — dark editorial pass + interactivity

### Visual

- Hero: logo image replaces "EMA STOYANOVA" wordmark. Red MeshGradient
  backdrop kept. MeshGradient perf-capped (maxPixelCount, minPixelRatio).
  No particles in hero — zero GPU cost from r3f in that section.
- Categories rebuilt as a 12-column DOM card grid: ink number card,
  blood eyebrow pill, italic title card, body card, toolkit chips card,
  file index strip. Cards animate in and lift on hover. Fixes the
  "rogue 03 in section 02" overlap (Html is hidden when visibility < 0.25).
- Gallery: drei reflector pattern — 9 framed photographs in a U-formation
  around a reflective dark floor. Frame color lerps to red on hover.
  Breathing image zoom per-frame. Pointer parallax tilts the rig.
- Scattered images: reduced 18 → 6, size doubled (h 2.4–3.6 units).
  Hover ramps shader intensity to 0 (reveals bare image). Click opens
  lightbox. Pushed farther out to avoid category grid overlap.
- Vocabulary section (new): swiss-knife textpath SVG (16k outline) with
  animated textPath laps in red Cormorant Garamond, + 12-term vocab list.
- NavHeader: fixed glass-blur dark nav, 6 items with red eyebrow nums,
  brand mark, "Get in touch" CTA. Scroll-to on click via __spaScrollEl.

### Interactivity

- Click-to-enlarge lightbox: helpers/lightbox.ts pubsub + DOM Lightbox
  modal. ESC / backdrop / × close.
- Hover on scattered images removes shader treatment (uIntensity → 0).

### Performance

- PostFx stripped: no bloom, no chromatic aberration, no noise. Only
  BrightnessContrast + Vignette remain. Low-power: chain fully bypassed.
- AI Art particles halved: 18000 → 4500 (high), 4500 → 1800 (low).
- Gallery reflector resolution: 256 (was 2048 in reference), blur [120,50].
- Environment: frames=1 (static, rendered once), resolution 32.
- Hero r3f scene is empty group. MeshGradient capped at 1280×720 px.
- Sections compacted: 8.0 → 7.1 total scroll pages.
- AdaptiveDpr range [1, 1.6] (high) / [0.85, 1.1] (low).

### Architecture

- helpers/lightbox.ts: open/close/subscribe pubsub.
- ScrollBridge: publishes drei's scroll el to window.__spaScrollEl.
- Vocabulary section: knifePathD.ts (16k SVG path) + Vocabulary.tsx.
- NavHeader: reads --spa-scroll CSS var for active state detection.
- GalleryCard.tsx removed — replaced by inline Frame inside Gallery.tsx.

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
