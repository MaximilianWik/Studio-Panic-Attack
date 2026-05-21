# Changelog

All notable changes to Studio Panic Attack are tracked here.

## [0.3.1] - sculpture placement fix

- CategorySection: 3D sculpture now lives at the SAME horizontal anchor
  as the body text, pushed back to z = -2 so it acts as a backdrop
  behind the DOM card. Previously sculptures were on the opposite
  side of the text (heroX = +-2.4 vs htmlX = +-1.6) so they often
  appeared too far from their associated category content.
- Visibility now controlled by world-space distance from camera Y
  on the parent group (dy < 6 units) - reliable across any scroll
  formula. Per-sculpture useSectionVisibility checks no longer
  force-hide meshes; they only skip simulation work when far away.
- Fixes: only 2 of 4 sculptures showing up; sculptures appearing in
  unexpected positions far from their category text.
## [0.3.0] — interactive sculptures + carousel gallery + iteration storm

### Categories — each now has a UNIQUE interactive 3D sculpture

- **01 Graphic Design — rippling canvas:** subdivided plane with vertex
  shader. Cursor position drives wave ripples emanating from that point
  in real time. Background slow noise undulation + scan-line shader for
  print feel. Click toggles calm/stormy intensity.
- **02 3D Art — iridescent shattering icosahedron:** noise-displaced
  high-poly icosahedron with iridescent fresnel + red rim glow.
  Drag-rotate via PresentationControls. Hover grows spikes outward
  (vertex amplitude boost). Click triggers a 1.2 s shatter animation
  (vertices fly out then snap back).
- **03 AI Art — magnetic particle swarm:** 3000 GPU particles (1500
  low-power) flock toward the cursor with smooth lag, friction, and
  per-particle noise jitter. Color shifts paper → blood-red based on
  particle speed. Click triggers an explosion impulse — particles fly
  outward radially, then re-attract to cursor.
- **04 UX Design — floating geometric tower:** vertical column of 7
  wireframe primitives (cube, octahedron, tetrahedron, dodecahedron,
  icosahedron) each rotating on a unique axis at different speeds.
  Hover scatters them outward radially; pointer-leave snaps them back.
  Click shuffles which shapes appear in which positions.
- Removed previous mockup-shader UI planes (UX) and torus-knot lens
  (Graphic) in favor of the above.

### Categories — layout & visibility iterations

- Several rounds of visibility-gating experiments: progress-based →
  trapezoid window → world-space distance from camera → finally
  back to no gating, since drei `<Html transform={false}>` projects
  off-screen positions correctly when the scroll formula is right.
- Final scroll-translation formula hardcoded:
  `group.y = 3.0 + scroll.offset * 64.5` — maps offset 0..1 to
  hero center → highlights center in world Y. Replaces the buggy
  `(pages-1) * 10` formula that left later sections unreachable.
- Section lengths rebalanced multiple times. Final v3 layout:
  hero 0.6, gallery 1.5, graphic 0.9, threeD 0.9, ai 0.9, ux 0.9,
  vocabulary 0.7, highlights 0.7. Total 7.1 pages.
- Category visual reduced to elegant essentials: massive blood-stroked
  outlined number (clamp 240–560 px), italic serif title (clamp 42–84 px),
  body in glass-morph backdrop with red accent bar. Removed eyebrow,
  toolkit chips, file index strip, entrance animations.
- Body text gets a shaped transparent backdrop (rgba ink + 8 px blur,
  asymmetric border-radius, blood accent bar at top) for readability
  over 3D content.

### Gallery — infinite carousel rewrite

- Replaced the U-shape framed gallery with an **infinite horizontal
  carousel**: frames slide right-to-left continuously and wrap.
- **Slot-based rotating image pool with no-duplicate guarantee:** N
  visible slots cycle through the full deduped image pool. When a slot
  recycles, it picks the next image not currently assigned to any
  other slot — guarantees zero duplicate images on screen at any time.
- Slot count tuned: 12 → 22 → 28. Carousel belt width 24 → 44 → 36 to
  maintain density per slot.
- Frame size variety: per-slot stable random multiplier (0.63–1.26)
  with base widths landscape 1.54 / portrait 1.05. Caps prevent
  oversized portraits.
- Image zoom corrected from 1.5–2.1 (cropped artwork) to 0.94–1.00
  (full artwork visible). Plane aspect already matches image aspect
  so zoom = 1.0 = perfect fit.
- Reflective floor strengthened: `mixStrength: 80`, `resolution: 512`,
  `blur: [300, 100]`, `metalness: 0.5`. Strong, visible reflections.
- Floor text added: "Have a peek inside my brain" (italic),
  "STUDIO PANIC ATTACK" (large faint red), "PROJECTS · GALLERY ·
  2024 — 2026", and "EMA STOYANOVA" rotated on the side.
- Camera-pan effect on pointer: stage translates + rotates with
  cursor for parallax.
- Slower carousel speed (0.35 → 0.15 units/sec). Per-frame Z-depth
  variation (-1 to +4 world units) for parallax depth.
- Click any frame opens the lightbox.

### Gallery — false starts (now reverted)

- Tried Victorian gold ornate frames + transparent floor + godrays
  — reverted, didn't fit the aesthetic.
- Tried independent per-frame rotation/drift — folded into the
  current carousel motion.

### Hero

- Logo permanent prominent feature: `clamp(380px, 56vw, 840px)`.
- Removed "by Ema Stoyanova" signature (name lives in the nav).
- Red `MeshGradient` backdrop is now PERSISTENT across the entire
  page (no `--spa-hero` opacity fade) — site-wide background.
- All 3D-particle effects in the hero scene removed; r3f hero is
  an empty group.

### Highlights

- 2 × 2 grid covering ~88vh of the viewport (was 4 × 1 small).
- Card aspect-ratio constraint dropped — cards fill grid cells.
- "Let's build something loud." headline removed; only the
  contact strip remains.
- Quote text relocated above-right of "Featured pieces": *"There
  may be no better way to communicate what we do than through
  images. As you browse my site, take a few moments to let your
  eyes linger here, and see if you can get a feel for my signature
  touch."* — italic Cormorant Garamond, right-aligned with vertical
  blood accent bar.

### Scattered images

- Source switched to **`public/Scatter/` folder** (22 images).
- Random shuffle on each load — placement varies between visits.
- Count up to 14 / 8 (high / low power). Heights 2.6–4.4 world units.
- Each item gets a random shader from the 5-shader rotation
  (halftone, dither, paper, flute, liquid).
- Hover ramps `uIntensity → 0` so the bare image is revealed.
- Click opens the lightbox.

### Nav

- Active-state highlighting on scroll REMOVED. Links are plain
  `<a href="/route">` to future separate pages (`/projects`,
  `/highlights`, etc.). Only Home links to `/`.
- "Get in touch" CTA pill removed.

### Vocabulary section

- Animated 3D quote "There may be no better way..." was here in
  one iteration, now lives in Highlights.

### Performance

- AI Art particles further reduced: 9000 → 4500 (high), 3000 → 1800
  (low) — and again to 3000 / 1500 with the swarm rewrite.
- Reflector floor resolution kept at 256–512 depending on iteration
  (currently 512).
- `<Environment frames={1}>` (rendered once) at resolution 32.
- AdaptiveDpr range `[1, 1.6]` (high) / `[0.85, 1.1]` (low).
- Removed external font URLs from drei `<Text>` (Google Fonts gstatic
  was blocked by Zscaler corporate proxy and crashed the entire
  render tree). Drei `<Text>` falls back to bundled Roboto.

### Bug fixes along the way

- Merge-conflict markers in source files after a bad rebase —
  resolved by force-pushing a clean working state to `main`.
- `FONT_URL` was referenced after deletion → ReferenceError that
  crashed the canvas. Removed all stale references.
- Duplicate quote rendering in two places (Vocabulary + Layout) —
  consolidated into Highlights.
- Stale `useFrame` import remained after CategorySection rewrite —
  cleaned up.
- Layout scroll formula mismatch with section world-Y placement
  caused later sections (02–04, vocab, highlights) to be unreachable
  by the camera — now correctly travels first→last section center.

## [0.2.0] â€” dark editorial pass + interactivity

### Visual

- Hero: logo image replaces "EMA STOYANOVA" wordmark. Red MeshGradient
  backdrop kept. MeshGradient perf-capped (maxPixelCount, minPixelRatio).
  No particles in hero â€” zero GPU cost from r3f in that section.
- Categories rebuilt as a 12-column DOM card grid: ink number card,
  blood eyebrow pill, italic title card, body card, toolkit chips card,
  file index strip. Cards animate in and lift on hover. Fixes the
  "rogue 03 in section 02" overlap (Html is hidden when visibility < 0.25).
- Gallery: drei reflector pattern â€” 9 framed photographs in a U-formation
  around a reflective dark floor. Frame color lerps to red on hover.
  Breathing image zoom per-frame. Pointer parallax tilts the rig.
- Scattered images: reduced 18 â†’ 6, size doubled (h 2.4â€“3.6 units).
  Hover ramps shader intensity to 0 (reveals bare image). Click opens
  lightbox. Pushed farther out to avoid category grid overlap.
- Vocabulary section (new): swiss-knife textpath SVG (16k outline) with
  animated textPath laps in red Cormorant Garamond, + 12-term vocab list.
- NavHeader: fixed glass-blur dark nav, 6 items with red eyebrow nums,
  brand mark, "Get in touch" CTA. Scroll-to on click via __spaScrollEl.

### Interactivity

- Click-to-enlarge lightbox: helpers/lightbox.ts pubsub + DOM Lightbox
  modal. ESC / backdrop / Ã— close.
- Hover on scattered images removes shader treatment (uIntensity â†’ 0).

### Performance

- PostFx stripped: no bloom, no chromatic aberration, no noise. Only
  BrightnessContrast + Vignette remain. Low-power: chain fully bypassed.
- AI Art particles halved: 18000 â†’ 4500 (high), 4500 â†’ 1800 (low).
- Gallery reflector resolution: 256 (was 2048 in reference), blur [120,50].
- Environment: frames=1 (static, rendered once), resolution 32.
- Hero r3f scene is empty group. MeshGradient capped at 1280Ã—720 px.
- Sections compacted: 8.0 â†’ 7.1 total scroll pages.
- AdaptiveDpr range [1, 1.6] (high) / [0.85, 1.1] (low).

### Architecture

- helpers/lightbox.ts: open/close/subscribe pubsub.
- ScrollBridge: publishes drei's scroll el to window.__spaScrollEl.
- Vocabulary section: knifePathD.ts (16k SVG path) + Vocabulary.tsx.
- NavHeader: reads --spa-scroll CSS var for active state detection.
- GalleryCard.tsx removed â€” replaced by inline Frame inside Gallery.tsx.

## [0.1.0] â€” initial build

### Phase 1 â€” scaffold

- Vite 6 + React 19 + TypeScript project scaffold
- `@react-three/fiber` v9 + drei v10 + postprocessing v3 wiring
- `@paper-design/shaders-react` for 2D shader overlays
- Vercel SPA deployment config (`vercel.json`)
- Dark theme + global CSS reset, custom DOM cursor
- Section registry (`config/sections.ts`) + world-Y layout system
- `useScrollSection` + `useScrollVelocity` + `useDeviceProfile` hooks
- Postprocessing pipeline (bloom + chromatic aberration + vignette + noise)

### Phase 2 â€” hero + gallery

- Hero: animated dark-noise gradient backdrop (custom GLSL), centered logo
  plane that fades in then dissolves out as scroll progresses, drifting
  "S C R O L L" prompt below
- Gallery: 14-card orbital ring around the camera, secondary BG ring at half
  speed for depth, scroll velocity feeds rotation speed, focal-pop scaling
  for cards passing through the front, pointer parallax tilt on the whole
  rig, per-card jitter (tilt + height) seeded for stable layout

### Phase 3 â€” scattered images + custom shaders

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

### Phase 4 â€” categories

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

### Phase 5 â€” highlights + polish

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

- Detected GPU tier â‰¤ 1 collapses the visual budget: scattered images use
  plain texture pass-through, particle morph drops to 4.5K points, lens
  glass swaps to cheap `MeshPhysicalMaterial` transmission, post chain
  drops bloom + chromatic aberration

### Known caveats

- Headless Chromium can hit WebGL context lost on intensive r3f scenes â€”
  the production deploy on real hardware is unaffected
- HDRI loads from drei's CDN at runtime; first paint can be ~300ms slower
  on cold cache
