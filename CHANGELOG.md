# Changelog

All notable changes to Studio Panic Attack are tracked here.

## [0.5.0] — image-CDN proxy + first-paint loading gate

### perf(assets): route /landing/ images through images.weserv.nl

- 64 source files in `public/landing/` total **221 MB** — many PNGs are
  5–17 MB raw exports (e.g. `img_1034.png` 17.9 MB, `cemetery-scene1.png`
  15.4 MB). On a cold load this took *minutes* on a typical broadband
  connection and never finished on 4G.
- Local image-processing tooling (sharp, ImageMagick, cwebp) is blocked
  on the corp laptop, so we resize+transcode at request time via the
  free `images.weserv.nl` image CDN. First request is slow; every
  subsequent request is hot from their edge cache.
- New helper `src/helpers/assetUrl.ts` rewrites any `/landing/*` path
  into `https://images.weserv.nl/?url=max-wik.com/landing/...&w=2000&output=webp&q=82&we=1`
  in production, returns the path unchanged in dev. URLs are built
  by hand (not via `URLSearchParams`) so the runtime-generated URL is
  byte-identical to the hand-written `<link rel="preload">` tags in
  `index.html` — same string = same browser-cache entry.
- All callsites updated:
  - `helpers/useImageAssets.ts` — every entry routed via `assetUrl()`
    inside the existing `L()` builder.
  - `components/ScatteredImages/ScatteredImages.tsx` — `.map(assetUrl)`
    over the SCATTER_IMAGES list.
  - `components/Highlights/Highlights.tsx` — 4 hard-coded `media:`
    paths wrapped in `assetUrl()`.
  - `index.html` — 4 preload links rewritten as full weserv URLs with
    `crossorigin="anonymous"` (matching three.js TextureLoader's
    default crossOrigin so the preload bytes are reusable).
- Expected post-CDN payload per image: ~150–250 KB instead of
  5–17 MB. ≈ 30–40× smaller; cold load drops from minutes to seconds.

### feat(loading): gate scroll on first-batch preload + progress line

- The hero used to mount everything at once and let the carousel
  pop-in over several seconds while CDN-cached textures arrived.
  Now scroll is blocked until the first 8 gallery portraits are in
  the browser's HTTP cache, so the gallery is fully populated the
  moment the user scrolls past the hero.
- New hook `helpers/usePreloadGate.ts` — DOM-side preloader that
  fires `new Image()` per URL with `crossOrigin = 'anonymous'`
  (so the cache entry is shared with three.js' subsequent GPU
  upload). Returns `{ ready, progress }`. Counts both `onload` and
  `onerror` as "done" so a single broken URL can't deadlock the
  gate. 8 s failsafe timeout — never blocks the user indefinitely
  on a stalled network.
- `App.tsx` — `useMemo`s the first 8 gallery URLs, passes them to
  `usePreloadGate`, then attaches capture-phase `wheel` /
  `touchmove` / `keydown` listeners that `preventDefault()` until
  ready. Capture phase runs before drei `<ScrollControls>`'s own
  handlers so this also stops the canvas from advancing.
- `HeroOverlay.tsx` — accepts `{ ready, progress }`, renders a thin
  220 px red progress line below the logo while loading, fades it
  out and reveals the "scroll to enter" prompt once ready. Single
  fixed-height slot (`.spa-hero__cta`) so the logo stays vertically
  centered through the transition.
- New CSS in `global.css`: `.spa-hero__cta`, `.spa-load-bar`,
  `.spa-load-bar__fill`, `.spa-load-bar--done`,
  `.spa-scroll-prompt--ready`. Drift animation is now only applied
  in the `--ready` state so it can't override the hidden opacity.
- On a fast connection the whole gate is over in <500 ms — feels
  deliberate, not annoying. On slow connections the user gets a
  truthful progress signal instead of a broken-feeling site.

### Notes / non-goals

- Logo PNG (62 KB, transparent) stays as a local PNG — already
  tiny, transparency matters, and weserv would lose nothing.
- 3 MP4 files in `/landing/` (totalling ~10 MB) are NOT referenced
  anywhere in code; left in place for now. Can be removed in a
  follow-up if you want the git size back.
- Lightbox uses the same 2000 px webp as the gallery thumbnail
  (instead of a higher-res variant). Acceptable for now; can be
  bumped to a separate `assetUrl(url, { width: 2400 })` call later.
- weserv is a free third-party service; if it ever goes down, all
  /landing/ images break. Worth keeping an eye on; if it becomes a
  reliability concern we can move to a hosted service or run sharp
  on Vercel's build infra (laptop never installs it).

## [0.4.2] — Vercel deploy: logo case fix

- `public/Logo/` → `public/logo/`. The folder was tracked in git with
  a capital `L` but every code reference (`/logo/PanicAttackLogo.png`
  in `index.html`, `HeroOverlay.tsx`, `NavHeader.tsx`) used lowercase.
  Windows is case-insensitive so it worked locally; Vercel runs on
  Linux which is case-sensitive, so the logo 404'd in production and
  the browser showed a broken-image icon with the alt text.

## [0.4.1] — perf pass + scroll-blank bugfix

### Bugfix: scene blanked for one frame when scrolling

- `Gallery.tsx`: every time a carousel slot wrapped to a new image,
  drei's `<Image>` re-mounted with a fresh `useTexture(url)` call
  that **suspended** while the network fetch resolved. Because the
  only Suspense boundary in the tree was the top-level one in
  `App.tsx` wrapping `<Layout/>`, that local suspension blanked the
  entire 3D scene for one frame on every wrap — the symptom users
  reported as "everything except the background disappears for a
  split second when scrolling". Aggravated by 5–17 MB source PNGs
  in `/landing/` that took multiple frames to decode.
  - **Per-slot Suspense**: each carousel slot is now wrapped in its
    own `<Suspense fallback={null}>` so a still-loading texture only
    nulls *that one slot* for a frame, never the whole layout.
  - **Eager preload**: `useTexture.preload(url)` is fired for every
    gallery image on mount, so by the time any slot wraps to a fresh
    URL the texture is already resident in `THREE.Cache` and the
    render resolves synchronously — no fallback at all in practice.

### Perf

- **Removed `/public/Scatter/`** (92 MB, 22 images that were verbatim
  duplicates of files in `/public/landing/`). `ScatteredImages.tsx`
  now points at the same `/landing/*` URLs the gallery uses, so the
  browser caches a single texture per asset across both surfaces.
  Build artifact is ~92 MB lighter; cold-load network bytes drop
  proportionally for any user who scrolls past hero into categories.
- `Gallery.tsx`: `MeshReflectorMaterial` resolution dropped from
  `512` to `256` (high tier) and `128` (low tier); blur disabled
  entirely on low tier. Reflector render-target cost is the single
  most expensive thing in the gallery — this reclaims real GPU.
- `GraphicDesign.tsx` (Lens): replaced four per-frame `new
  THREE.Vector3()` calls + a `.clone()` with module-scope scratch
  vectors (`_orbit`, `_pointer`, `_diff`, `_target`). Eliminates GC
  pressure during the most pointer-active section.
- `AIArt.tsx` (Hedgehog): replaced per-frame `matrixWorld.clone()`
  with a reused scratch `Matrix4` on the existing `scratch` object;
  removed the per-frame object spread `{ ...scratch, ...data }` that
  allocated a fresh object every render.

### Loading time

- `index.html`: added `<link rel="preload" as="image">` hints for the
  hero logo and the four lightest gallery hero portraits, plus
  `fetchpriority="high"` on the logo so it composes on first paint.
- `<img>` decoding hints across the site: `decoding="async"` +
  `fetchPriority="low"` on Highlights cards (below-the-fold lazy),
  `fetchPriority="high"` on the hero logo and lightbox image.
- `theme-color` meta colour corrected from cream `#f5efe4` to ink
  `#050505` so the mobile chrome bar matches the actual page bg.

### Repo cleanup

- Removed `index.html.bak`, `preview.log`, `preview.err.log`.

## [0.4.0] — responsive design pass

### Mobile / touch UX

- New mobile hamburger menu in `NavHeader.tsx`. On `<=900px` the
  desktop link list collapses, a hamburger button replaces it; tap
  opens a fullscreen overlay with the same six links + a close
  button. Esc / link-tap / close-button all dismiss the overlay.
  Brand mark stays anchored on the left.
- `Cursor.tsx`: matches `(hover: none) | (pointer: coarse)` and
  returns null on coarse-pointer devices so the red dot + outer ring
  do not render. Combined with CSS overrides the native cursor is
  fully restored on phones / tablets.
- CSS `@media (hover: none), (pointer: coarse)` block restores
  `cursor: auto` on `<html>` and resets `cursor: none` on every
  element that overrides it (cards, nav items, lightbox close, etc.)
  to `cursor: pointer`.

### Adaptive 3D framing

- `App.tsx`: camera FOV now derives from viewport aspect — 70° on
  tall phones, 60° on portrait tablets, 52° square-ish, 42° default
  landscape. Resize listener updates live. Wider FOV on narrow
  aspects keeps section content from cropping horizontally.
- `GraphicDesign.tsx` and `AIArt.tsx`: the torus-knot and Hedgehog
  groups are wrapped in viewport-aware scale groups — `min(1,
  viewport.width / 6.4)` clamped to `>=0.55`. Sculptures shrink with
  the canvas so orbit reach + headline width fit narrow framings.

### Layout / typography

- `HeroOverlay.tsx`: logo width `clamp(220px, 70vw, 840px)` plus
  `maxWidth: 92vw` (was `clamp(380px, 56vw, 840px)` — overflowed
  phones <420px).
- `CategorySection.tsx`: now reads `useThree().viewport`. On
  portrait (`viewport.width / viewport.height < 1`), text and hero
  stack vertically — hero at local y=+1.1, text at y=−1.6, both
  x-centered. On landscape it keeps the historic side-by-side
  alternation. HTML body width also raised from `min(760px, 56vw)`
  to `min(760px, 86vw)` so mobile body copy uses the full available
  width (desktop unchanged via 760px cap).
- New CSS responsive blocks in `global.css`:
  - `<=760px`: `.spa-cat-elegant__number` font-size shrinks to
    `clamp(120px, 32vw, 240px)`; title/body/body-wrap tightened.
  - `<=800px`: `.spa-vocab` collapses to single column with the
    SVG centered and capped at 320px max-width; vocabulary list
    stays 2-col but justifies items center.
  - `<=900px` and `<=600px`: highlights cards lose
    fixed `min-height: 280px` (down to 220 then 180); footer row
    becomes vertical stack on phones; lightbox close button
    smaller.

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
