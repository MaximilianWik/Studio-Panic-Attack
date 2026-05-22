# Changelog

All notable changes to Studio Panic Attack are tracked here.

## [0.8.8] — palette cycler in the debug cluster

- New `helpers/paletteStore.ts`: zustand store with a list of
  named 5-stop palettes (`BLOOD`, `OCEAN`, `AMBER`, `MOSS`,
  `VIOLET`, `BUBBLEGUM`, `CYAN`, `INK`) plus `idx` / `set` /
  `cycle` / `current()`. Persists to
  `localStorage['spa-palette']`.
- All palettes follow the original five-stop format
  (`ink → smoke → muted accent → mid accent → bright accent`)
  so the page edges stay grounded and only the dominant hue
  changes.
- `HeroOverlay.tsx`: subscribes to the palette index and feeds
  the current colour list straight into `<MeshGradient colors=…/>`.
- `NavHeader.tsx`: new `.spa-nav__palette` button as the first
  control in the Debug Tools cluster (left of the perf button).
  Two-part layout — a 16 px circular swatch using the active
  palette's accent + mid colours via CSS `radial-gradient`,
  next to the palette ID in mono. Click cycles to the next
  palette. Hover lights the border + adds a soft glow in the
  current accent (via `color-mix`), so you can see what you're
  about to switch to.
- New CSS: `.spa-nav__palette`, `.spa-nav__palette-swatch`,
  `.spa-nav__palette-id`. Uses CSS custom properties
  (`--palette-accent`, `--palette-mid`) inlined per render.

## [0.8.7] — nav: "Debug Tools" label next to the action cluster

- `NavHeader.tsx`: small `<span class="spa-nav__actions-label">
  Debug Tools</span>` inserted as the first child of
  `.spa-nav__actions`, sitting just before the perf button.
- CSS: mono 9 px, 0.32 em letter-spacing, dimmed cream
  (`rgba(246,243,238,0.45)`), uppercase — same vocabulary as
  the rest of the small mono labels in the nav. Hidden below
  1100 px viewport width so the nav doesn't crowd on smaller
  screens.

## [0.8.6] — nav: keep perf + debug + hamburger on one row

The nav uses `grid-template-columns: auto 1fr auto` (3 columns:
brand / links / actions). Adding the perf button alongside the
existing debug-grid and hamburger meant 5 children for 3 columns,
so the 4th and 5th wrapped onto a new row.

Wrapped the three action buttons in a single `.spa-nav__actions`
flex container so they share the third grid column. `display:
inline-flex; gap: 8px; justify-self: end`.

## [0.8.5] — gallery floor: stop despawning when viewed from below

- The reflective gallery floor is a `MeshReflectorMaterial` plane,
  which is `FrontSide` only. As scroll lifts the scene group
  upward, the camera ends up *below* the floor's world Y; with
  the back face culled, the floor visually disappears in one frame
  — read as a glitch.
- Added a second `<mesh>` at the same position with a
  `meshBasicMaterial` set to `side: THREE.BackSide`,
  `color: '#050505'`, `opacity: 0.55`, `transparent`,
  `depthWrite: false`. Only the back face renders, so the new
  plane is invisible while the camera is above the floor (no
  z-fighting with the reflective top) and only kicks in once the
  camera passes underneath. Semi-transparent so the brand
  backdrop bleeds through — reads as a ghost of the floor instead
  of a hard black wall.

## [0.8.4] — perf-tier override in nav

The performance-tier system already worked end-to-end —
`detect-gpu` returns 0–3, `useDeviceProfile` derives
`isLowPower = tier <= 1 || mobile`, and that flag drives the DPR,
antialias, postprocessing, MeshReflector blur, Hedgehog spike
count, Lens material choice, and ScatteredImages count. There
was just no way to *force* a tier from a beefy desktop to verify
the low-power code paths.

Added a manual override:

- New `helpers/perfOverride.ts`: zustand store with `value`
  (`'auto' | 0 | 1 | 2 | 3`), `set`, and `cycle`. Persists to
  `localStorage['spa-perf-override']`.
- `useDeviceProfile` now consults the override. When set to a
  specific tier, returns `{ tier, mobile, isLowPower: tier <= 1,
  ready: true, overridden: true }` instead of the detected
  result. Mobile flag is preserved from real detection so coarse-
  pointer / touch fallbacks stay correct.
- Added `overridden: boolean` to `DeviceProfile` so consumers
  can opt into showing the override state if they want.
- `NavHeader` gains a `.spa-nav__perf` mono-text button next to
  the debug grid icon. Cycles `AUTO → T0 → T1 → T2 → T3 → AUTO`
  on click. Label shows current effective tier:
  `AUTO·T<n>` when on auto-detect, `T<n>` when forced. Lights up
  blood-red with a glow when a manual tier is in effect — same
  treatment as the debug toggle.
- Title attribute spells out the full state for hover inspection
  (e.g. "Perf: forced T0 (isLowPower=true). Click to cycle.").

What flips when you force a low tier:

- Canvas `dpr` drops from `[1, 1.6]` → `[0.85, 1.1]`, antialias off.
- `PostFx` returns `null` (bloom / chromatic aberration / vignette
  / noise all disabled).
- `Gallery` reflector blur `[300, 100] → [0, 0]`, resolution
  `256 → 128`, mixStrength `80 → 40`.
- `GraphicDesign` Lens swaps `MeshTransmissionMaterial` for
  cheap transmission glass.
- `AIArt` Hedgehog drops from `420 → 150` spikes; idle breathing
  disabled.
- `ScatteredImages` count `18 → 10`; shader effects all swap to
  `'plain'`.

## [0.8.3] — readable titles + bigger body text in categories

- `.spa-cat-elegant__title` (01 Graphic Design / 02 3D Art /
  03 AI Art / 04 UX Design) and `.spa-title` (Highlights →
  "Featured pieces"): added a layered black text-shadow stack —
  a tight `0 2px 12px / 0.85`, a soft `0 0 28px / 0.55` halo,
  and a 1 px hard drop. Stays readable now that scattered images
  can sit directly behind these titles.
- `.spa-cat-elegant__body` body copy: `15 px → 18 px`, line-height
  `1.65 → 1.60`, colour from `rgba(...,0.82)` to `0.86` for a
  hair more contrast. Mobile breakpoint override (`max-width: 700px`)
  bumped from `13.5 px → 16 px`.

## [0.8.2] — sculptures down 3 + fix the early-despawn bug

### fix(visibility): sculptures vanished when scrolling slightly past

`useSectionVisibility` ramps up over a window centred on the
section's scroll range. With sculptures lifted to `section_Y + 10`
in v0.8.1, they entered the camera ~10 world-units (~0.155 scroll
units) **earlier** than the visibility window opened — but the
sculpture's own `useFrame` short-circuits with
`if (v < 0.005) mesh.visible = false`. So the sculpture was on
screen but mesh-hidden until the section's own visibility ramp
caught up — the "appears too late" symptom. Same in reverse on
exit: window closed before the sculpture had finished scrolling
out of frame, so it popped out a beat early.

Added an optional `worldYOffset` parameter to `useSectionVisibility`
that converts the offset to scroll-units (`worldYOffset / 64.5`,
since Layout.tsx travels 64.5 world units per scroll unit) and
shifts the visibility window backwards by that amount.

- `GraphicDesign.tsx`: `useSectionVisibility('graphic', 7)` (Knot
  is at section centre + 7).
- `AIArt.tsx`: `useSectionVisibility('ai', 7)` (Hedgehog same).
- Other call sites (`Gallery`, `Vocabulary`) pass no offset —
  default `0` keeps current behaviour.

### move: sculptures + scattered down 3 (current value − 3)

- `CategorySection.heroPos.y`: `+10` → `+7`.
- `ScatteredImages.worldY` bias: `+10` → `+7`.
- DebugLabel `worldY` arguments in `GraphicDesign` and `AIArt`
  updated to match (`getSectionWorldY(id) + 7`).

Resulting world Y for the affected entities:

| entity | v0.8.1 | now |
|---|---:|---:|
| Knot (01)      | -20.5 | **-23.5** |
| Hedgehog (03)  | -33.5 | **-36.5** |
| Scatter (graphic affinity) | ~-20 | **~-23** |
| Scatter (threeD) | ~-26 | **~-29** |
| Scatter (ai)     | ~-33 | **~-36** |
| Scatter (ux)     | ~-42 | **~-45** |

Section anchors and category text positions (`htmlPos.y = -10`)
unchanged from v0.8.1.

## [0.8.1] — manual placement: text −10, bg +10 within categories

Per direct positional spec from the design pass: split the text
half and the 3D / scattered halves of every category by 20 world
units. Section anchors in `sections.ts` are unchanged — only the
local offsets inside CategorySection (and the world-Y bias inside
ScatteredImages) shift.

`CategorySection.tsx`:

- `htmlPos.y`: `0` → `-10` (text body drops 10 units in scroll).
- `heroPos.y`: `0` → `+10` (sculpture rises 10 units; appears
  earlier in scroll than the text).

`ScatteredImages.tsx`:

- `worldY` formula gains a `+10` bias on top of the existing
  `yCenter + ySpread + jitter`. Every scattered image is now 10
  world units above where it used to sit.

Resulting per-entity world Y (section anchors unchanged at
`-30.5 / -37 / -43.5 / -52.5`):

| entity | old world Y | new world Y |
|---|---:|---:|
| Knot (01 graphic, sculpture) | -30.5 | **-20.5** |
| Hedgehog (03 ai, sculpture)  | -43.5 | **-33.5** |
| 01 graphic text body         | -30.5 | **-40.5** |
| 02 threeD text body          | -37.0 | **-47.0** |
| 03 ai text body              | -43.5 | **-53.5** |
| 04 ux text body              | -52.5 | **-62.5** |
| Scattered (graphic affinity) | ~-30 | **~-20** |
| Scattered (threeD affinity)  | ~-36 | **~-26** |
| Scattered (ai affinity)      | ~-43 | **~-33** |
| Scattered (ux affinity)      | ~-52 | **~-42** |

DebugLabel `worldY` arguments in `GraphicDesign.tsx` and
`AIArt.tsx` updated to reflect the new sculpture positions
(`getSectionWorldY(id) + 10`) so the on-screen overlay shows the
real world Y instead of the section anchor.

Heads-up: Knot (-20.5) is now only 4.5 units below the gallery
centre (-16). They may visually overlap. Toggle the debug
overlay to confirm and send the next adjustment if you want.

## [0.8.0] — Option B layout + worldY debug overlay

### feat(layout): single side-by-side layout on every viewport

- `CategorySection.tsx`: dropped the portrait/landscape branch.
  Both halves are now anchored at section centre `Y=0` regardless
  of orientation — only X scales with viewport. **Every element's
  worldY is identical on every device.**
  - `xFit = clamp(viewport.width / 6.4, 0.4, 1.0)` shrinks the
    side offsets on phones so both halves stay on screen.
  - `heroPos = [(side==='left' ? 2.4 : -2.4) * xFit, 0, 0]`
  - `htmlPos = [(side==='left' ? -1.6 : 1.6) * xFit, 0, 0]`
  - On portrait, the Html width drops from 86vw → 62vw so the
    text doesn't fully blanket the 3D sculpture.
  - Trade-off: text Html and 3D sculpture overlap visually on
    narrow phones (text on top, layered/editorial). Acceptable
    cost for fixed-Y on every device.

### feat(debug): toggleable worldY overlay for inspection

- New `helpers/debugStore.ts`: zustand store with `enabled` /
  `toggle` / `set`, persisted to `localStorage['spa-debug']` so
  refresh keeps your inspection state.
- New `components/Debug/DebugOverlay.tsx`:
  - Vertical magenta spine at `x=0, z=-2` spanning Y from +2 to
    -75 (covers every section).
  - Ruler ticks every 5 world units along the spine, each with
    a billboarded `y=<n>` label.
  - One cyan section line + label per section: `[<id>] y=<n>`
    drawn at the section's centre worldY (read from `sections.ts`,
    so adjusting the registry auto-updates the overlay).
  - Mounted inside `Layout`'s scrolling group so the ruler
    scrolls with the scene — coordinates always correspond to
    real world space.
- Exported `DebugLabel` helper from `DebugOverlay.tsx`: a
  `<Billboard><Text/></Billboard>` that auto-hides via the same
  store. Drop into any 3D component to mark a specific entity.
- Per-entity labels now wired into:
  - `GraphicDesign` → `Sculpture: Knot (01 graphic)` at the section
    centre.
  - `AIArt` → `Sculpture: Hedgehog (03 ai)` at the section centre.
  - `ScatteredImages` → one orange label per item:
    `Scatter[<i>] (<affinity>) y=<n>`. Added an `affinity` field
    to the `ScatteredItem` interface so each label can show which
    section the image is attached to.

### feat(nav): debug toggle button

- `NavHeader.tsx`: small 4-square grid icon button next to the
  hamburger, always visible on every viewport. Off state is muted
  cream; ON state lights up blood-red with a soft glow so the
  current overlay state is unmissable.
- `aria-pressed` + `aria-label` flip with state for screen-reader
  parity with the visual.
- New CSS: `.spa-nav__debug` / `.spa-nav__debug--on` styles in
  `global.css` matching the existing nav vocabulary.

### Notes

- `zustand` is used here as a phantom transitive dep via
  `@react-three/drei` (same pattern as the existing
  `helpers/sculptureEvents.ts`). If you decide to commit to
  zustand for app state, it should move into `package.json` as a
  direct dependency.

## [0.7.1] — bg density: lift scattered images into the text band

After the v6 section retune the categories felt visually sparse —
scattered images were trailing well below the text since they
spread ±2.5 world units around each section centre, and the
category bodies are only ~6 units tall. Tightened + biased the
distribution so the bg images read as flanking the text instead
of orphaned beneath it.

In `ScatteredImages.tsx`:

- Item count bumped: low-power 8 → 10, normal 14 → 18. Gallery is
  longer now and 02 is shorter, so the category sections needed a
  bit more density to not feel empty.
- `ySpread` formula changed from `((i % 3) / 2 - 0.5) * 0.5 * 10`
  (range −2.5 / 0 / +2.5) to `((i % 3) / 2 - 0.2) * 0.3 * 10`
  (range −0.6 / +0.9 / +2.4). Tighter band, biased upward so each
  scattered image's section-local Y lands between roughly −1.1 and
  +2.9 (after the existing ±0.5 random jitter). "Up" here = earlier
  in scroll = on screen at the same time as the category number /
  title rather than after.

Sculptures already follow their section's world Y automatically
(they're children of `<CategorySection>`'s yPos group), so no
change needed there — Knot moved 5 units later with 01 in v6,
Hedgehog stayed put, and both are still anchored to their section
centres.

## [0.7.0] — section retune: gallery breathing room, Hedgehog ↔ Knot

After the loader work, two layout problems became obvious on the
real page:

- **01 (Graphic / Knot) was reading on top of the gallery.** Gallery
  was only 1.5 pages so the user hadn't finished panning across the
  carousel before the giant outlined "01" started encroaching from
  below.
- **03 (AI / Hedgehog) felt orphaned far below 01.** The two
  sculptures (Knot in 01, Hedgehog in 03) read as a pair but were
  18 world units apart with the (sculpture-less) 02 occupying a
  full 0.9 pages between them.

Retuned `src/config/sections.ts` to v6:

| section          | length     | center → worldY     | notes |
|------------------|-----------:|--------------------:|-------|
| hero             | 0.6        |  0.30 → -3.0        | unchanged |
| gallery          | **2.0** (was 1.5) |  1.60 → -16.0 | extra half-page so 01 doesn't crowd the carousel |
| graphic (01)     | 0.9        |  3.05 → -30.5       | shifts 5 units later |
| threeD (02)      | **0.4** (was 0.9) |  3.70 → -37.0 | no sculpture (relocated to 01); doesn't need a full page |
| ai (03)          | 0.9        |  4.35 → -43.5       | unchanged |
| ux (04)          | 0.9        |  5.25 → -52.5       | unchanged |
| vocabulary       | 0.7        |  6.05 → -60.5       | unchanged |
| highlights       | 0.7        |  6.75 → -67.5       | unchanged |

Net `TOTAL_PAGES` stays at **7.1** because gallery's +0.5 cancels
threeD's −0.5. So Layout.tsx's hardcoded travel range (`3.0 +
offset * 64.5`) is **still correct** — only its comment was
refreshed to enumerate the new section centers.

Result:
- Gallery has ~33 % more scroll length to play out before 01 hits.
- Knot ↔ Hedgehog distance drops from **18 → 13 world units**
  (5 units closer); 02 still has time for the user to read its
  body without a sculpture competing for attention.
- Every section after 03 is byte-for-byte at the same world Y as
  before, so the highlights handoff and the global travel math
  are unaffected.

## [0.6.4] — loader %: outline the symbol to match the number

- `.spa-loader__pct-sym`: dropped the filled-cream override.
  Symbol is now `color: transparent` with `-webkit-text-stroke:
  1.4px var(--blood)` — same red outlined treatment as the
  number, stroke scaled down for the smaller font size so the
  visual weight stays balanced.

## [0.6.3] — loader %: red stroke matching category numbers

- `.spa-loader__pct`: stroke colour swapped from cream to
  `var(--blood)` and a subtle red text-shadow glow added —
  same treatment as `.spa-cat-elegant__number` (the giant
  italic 02 / 03 numbers in the category sections). Loader now
  reads as part of the same typographic family instead of a
  separate cream-on-red afterthought.
- `.spa-loader__pct-sym`: gains `text-shadow: none` so the
  inherited red glow doesn't bleed onto the small filled `%`.

## [0.6.2] — loader is its own opaque screen + outlined % counter

- `.spa-loader` is now a real own-screen overlay:
  - `pointer-events: auto` — the loader itself catches every wheel,
    touch, and click, so drei `<ScrollControls>` (which listens on
    the canvas parent below it) literally never sees the input.
    Scroll is fully blocked during loading without a single
    capture-phase listener.
  - Opaque background: a layered radial-gradient (red center glow
    → near-black) over a `#050505` base. The MeshGradient + canvas
    behind are completely hidden until fade-out reveals them.
  - `visibility` is transitioned alongside `opacity` (delay-on,
    delay-off) so the loader stops eating events the instant its
    fade-out completes.
- `.spa-loader__pct`: outlined italic typography. `color: transparent`
  + `-webkit-text-stroke: 2.5px rgba(246,243,238,0.9)` +
  `paint-order: stroke fill`. Old `text-shadow` glow dropped — it
  fights with the hollow stroke.
- `.spa-loader__pct-sym`: explicitly resets `-webkit-text-stroke: 0`
  so the small `%` symbol stays filled — editorial counterpoint to
  the hollow number.

## [0.6.1] — loader holds for 2.5 s, scroll-lock removed

- `App.tsx`: loader now runs for a deliberate minimum of 2.5 s
  regardless of network speed. Tracked via a `timeProgress` rAF
  loop alongside `usePreloadGate`'s `gateProgress`. The displayed
  `progress` passed to LoadingScreen is the average of the two,
  so on a hot cache the bar still fills smoothly across the full
  2.5 s instead of snapping to 100 % in 50 ms. `ready` only flips
  once both gate and timer are done.
- Removed the leftover scroll/touch/keyboard capture-phase
  listeners — that's the only piece of the old hairline-bar
  attempt still in the file. The new LoadingScreen sits over the
  canvas with `pointer-events: none`, and on a 2.5 s budget there
  is no realistic window for the user to scroll the canvas before
  the loader fades out.

## [0.6.0] — proper loading screen + under-construction routes

### feat(loading): full-screen LoadingScreen replaces the hairline bar

- The old gate was just a 220 px red line under the logo — read as
  "is this thing broken?" rather than a deliberate moment. Replaced
  with a proper fullscreen entry experience.
- New `components/Loading/LoadingScreen.tsx`:
  - Big italic Cormorant Garamond percentage counter at center
    (`clamp(120px, 22vw, 320px)`). Displayed value is `requestAnimationFrame`-
    lerped toward `progress * 100` so the discrete onload jumps
    don't tick visibly. Snaps to 100 when `ready` flips so the
    fade-out never happens mid-lerp at 97%.
  - Hairline progress bar with a small vertical glyph at the
    leading edge, both glowing red.
  - Cycling phrase ticker beneath ("rendering brain", "tuning
    dread", "parsing portraits", "calibrating chaos", "warming
    neurons", "assembling mood", "buffering memories",
    "sharpening edges", "composing panic"), cross-fading every
    1.1 s.
  - Corner labels: "STUDIO · PANIC · ATTACK" top-left, blinking
    red dot + "LOADING" top-right, signature bottom-left,
    "2026 / v0.5" bottom-right.
  - Faint repeating CRT scan-line overlay across the whole screen
    (CSS gradient + slow keyframe drift).
  - Inlines an `@font-face` for the loader's Cormorant italic so
    it doesn't FOIT during the brief moment it's on screen.
  - Fades out over 700 ms (`cubic-bezier(0.65, 0, 0.35, 1)`) once
    `ready === true`; HeroOverlay's logo + scroll prompt fade in
    underneath.
- `HeroOverlay.tsx` cleaned up: removed `.spa-hero__cta` slot,
  the old `.spa-load-bar` markup, and the `progress` prop. Logo
  + scroll prompt are simply hidden (`opacity: 0`) until `ready`,
  then fade in.
- `App.tsx`: render `<LoadingScreen progress ready />` inside
  `<ErrorBoundary>`. HeroOverlay no longer needs `progress`.
- CSS: removed `.spa-hero__cta`, `.spa-load-bar*`. Added a
  `Loading screen` block with `.spa-loader` plus children. Mobile
  breakpoint shrinks the corner labels and phrase font.

### feat(routing): under-construction placeholder pages for nav links

- Nav menu links (Projects, Highlights, Vocabulary, About,
  Contact) all pointed at routes that didn't exist as content.
  Rather than pull in `react-router` for five placeholder pages,
  added a path-based root picker in `main.tsx`:
  - `/` → `<App />` (the real site)
  - `/projects | /highlights | /vocabulary | /about | /contact`
    → `<UnderConstruction />`
  - any other path → also `<UnderConstruction />` so typos /
    stale links don't 404.
- New `components/UnderConstruction/UnderConstruction.tsx`:
  fullscreen page with `codingCat.gif` (from
  `public/Under construction/codingCat.gif`), "Under construction
  :3" in display italic, a small mono sub-line, the route label
  in the top-left corner, and a "← back to studio" button styled
  to match the nav vocabulary.
- CSS: new `Under construction page` block — `.spa-uc`,
  `.spa-uc__bg`, `.spa-uc__gif`, `.spa-uc__title`, `.spa-uc__sub`,
  `.spa-uc__back`, `.spa-uc__route`. Pixelated `image-rendering`
  on the gif keeps the cat crisp at scaled sizes.
- Vercel rewrites in `vercel.json` already serve `index.html` for
  all paths, so deep-links and hard reloads work in production.

## [0.5.2] — Featured Pieces: float quote into 3D scene

- `Highlights.tsx`: the quote ("There may be no better way to
  communicate what we do…") was wedged into a 2-col DOM grid next
  to the "Featured pieces" h2, fighting it for space. Removed it
  from the DOM layout entirely; the title block is now a single
  left-aligned column.
- New `FloatingQuote` 3D element, rendered as drei `<Text>` inside
  the Highlights `<group>`. Sits at `[0, 4.6, -3.2]` (above and
  behind the cards, in actual world space — scrolls in with the
  rest of the section). Cormorant Garamond italic 500 to match the
  gallery floor. Soft cream fill at 55%, faint outline for legibility
  against the cards. `maxWidth=11`, centered, line-height 1.35 →
  wraps to 3 readable lines.
- Subtle motion: `useFrame` lerps a pointer-parallax offset onto
  position and adds a slow `sin` drift on top. Gives the quote
  presence without competing with the cards. No CSS animation —
  it's purely 3D.
- Removed `.spa-highlights-quote` CSS; no longer used.

## [0.5.1] — gallery floor text refresh

- `Gallery.tsx`: removed the duplicate floor texts. The italic
  "Have a peek inside my brain" at `z=-4` is gone; the small
  uppercase "PROJECTS · GALLERY · 2024 — 2026" at `z=5` is gone.
  In their place, a single `Have a peek inside my brain` set in
  Cormorant Garamond italic 500 at `z=3`, fontSize 0.5, cream
  on the reflective floor. Loaded from
  `cdn.jsdelivr.net/.../@fontsource/cormorant-garamond` so drei
  `<Text>` (troika-three-text) can ship the glyphs as MSDF without
  needing a bundled font file.

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
