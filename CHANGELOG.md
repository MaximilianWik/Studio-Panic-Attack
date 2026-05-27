# Changelog

All notable changes to Studio Panic Attack are tracked here.

## [1.2.17] -- projects: structured editorial content per board (project type, date, location, body paragraphs)

- `src/config/projects.ts`: extended `ProjectMeta` with optional `projectType`, `date`, `location`, `body: string[]` fields. The existing `description` is preserved as a fallback (still used for Events).
- Filled body content for 15 projects (everything except Events): graphic-design, 3d, imt, product-and-brand, typography, ai, digital-art, marketing-campaigns, motion, ux-ui, holistic-art-magazine, photography, sims-cc, projection-vj-lights, experimental. `imt`, `holistic-art-magazine`, `projection-vj-lights` also carry `date` + `location`.
- `src/pages/ProjectsBoard.tsx` header: when a project has a `body` array, render a structured block (`<dl>` with Project type / Date / Location rows + stacked `<p>` paragraphs) instead of the single-line description. Events still render `EVENTS_INTRO`.
- `src/styles/whiteboard-pages.css`: new `.spa-pb__head-rich`, `.spa-pb__head-meta` (mono caps labels), `.spa-pb__head-body` styles. Sits in column 2 of the head grid, max-width `60ch`.

## [1.2.16] -- category sections: Alagard for numbers, Quiet-Attempt for titles

- `src/styles/global.css`: added `@font-face` declarations for `Alagard` (`/font/alagard.ttf`) and `Quiet-Attempt` (`/font/Quiet-Attempt.otf`).
- `.spa-cat-elegant__number`: switched from `var(--font-display)` italic to `"Alagard"`. Removed `font-style: italic` (no italic variant). `letter-spacing` changed from `-0.07em` → `0.03em` (pixel fonts need positive/neutral tracking).
- `.spa-cat-elegant__title`: switched from `var(--font-display)` italic to `"Quiet-Attempt"`. Removed `font-style: italic`. `letter-spacing` changed from `-0.02em` → `0.02em`.

## [1.2.15] -- homepage whiteboard: swiss-knife SVG 50% larger, shifted up

- `HeroOverlay.tsx`: SwissKnifeTextPath width changed from `clamp(320px,78vw,940px)` → `clamp(480px,90vmin,1410px)` (×1.5 across the board; `vmin` used as the fluid unit since the SVG is nearly square, so it scales sensibly on both landscape and portrait viewports). `maxWidth` eased to `97vw`.
- Added `transform: translateY(-5vh)` to nudge the composition up slightly within the centred flex container.

## [1.2.14] -- homepage whiteboard: animated swiss-knife textPath replaces the centered black logo

- New `src/components/Hero/SwissKnifeTextPath.tsx` — self-contained SVG component that animates a single sentence ("Chaotic space of creativity & multidisciplinary ideas exploring the limits of the human curiosity.") in red Cormorant Garamond around the silhouette of a swiss-army knife, with `LogoText.png` overlaid in the centre. Two `<textPath>` runs share a synced `<animate>` (second begins at `lap.begin`) for a continuous double-sided crawl. Replicates the spec from `swiss-knife-textpath-2026-05-20-14-46-44.json`.
- New `src/components/Hero/swissKnifeOutlineD.ts` — the 16k-char path d-string extracted out of the JSX so the component stays readable.
- New asset `public/logo/SwissKnifeLogoText.png` (48 KB) — the centre logo overlay, decoded from the export's inlined data URL.
- `src/components/Hero/HeroOverlay.tsx`: when the active palette is the whiteboard one, render `<SwissKnifeTextPath>` instead of the static `PanicAttackLogoBlack.png` `<img>`. Mesh palettes still get the white `PanicAttackLogo.png`. Wrapper sized via `clamp(320px, 78vw, 940px)` with the export's native 662:636 aspect ratio so the silhouette never distorts.
- Cormorant Garamond 500-normal is loaded inline via a single `@font-face` rule pointing at the existing jsDelivr `@fontsource` CDN URL (same CDN the LoadingScreen already uses for italic-500). No `index.html` changes needed.

## [1.2.13] -- homepage grid: responsive cell count (no squishing on narrow viewports)

- Removed fixed `NUM_COLS`, `NUM_ROWS`, `MAX_COLS` constants. Replaced with a single `TARGET_CELL = 120` (px) tunable.
- Each frame, `numCols = round(VPx / TARGET_CELL)` and `numRows = round(span * ROW_EXPO / TARGET_CELL)` are computed from the live viewport size. Narrow viewports get fewer columns/rows rather than compressed cells.
- `maxCols` (fan-out cap) scales with `numCols * 4` so the edge fill stays proportional.
- To change the overall cell size: edit the single `TARGET_CELL` constant.

## [1.2.12] -- homepage grid: larger cells (NUM_COLS 11→6, NUM_ROWS 28→14)

- Halved column count and row count so each cell is ~2× bigger in each dimension.
- `MAX_COLS` reduced from 38 → 22 to match the sparser grid.

## [1.2.11] -- homepage grid: square cells at bottom (ROW_EXPO 0.68 → 1.60)

- `ROW_EXPO` raised from `0.68` to `1.60`. Values below 1 compress rows toward the bottom (derivative < 1 near t=1), making grid cells flat wide rectangles. Values above 1 spread rows further apart near the viewer so the cell aspect ratio is approximately 1:1 on a 16:9 screen.
- `NUM_ROWS` raised from `22` to `28` to compensate for the wider near-viewer spacing and keep the grid dense enough to fill the screen.

## [1.2.10] -- highlights: update intro copy

- Replaced "A scrolling cork-board of recent pieces…" with "Some of my favourite pieces that I've created so far, as a multidisciplinary artist".

## [1.2.9] -- projects: every asset goes in the scatter; overflow grid removed

- `src/config/projects.ts`: drop `SCATTER_CAP` and the `Project.overflow` field. All assets per folder go through `scatter()` with bounds widened to `x: 8–88%`, `y: 3–97%` and `tries: 140` so dense folders (3D — 64 pieces, Digital Art — 21, Graphic Design — 20) still find non-overlapping slots.
- `ProjectsBoard.tsx`: remove the `<div class="spa-pb__overflow">` block and the events-board's `concat(overflow)`. The board now contains exactly one scrollable scatter container per category.
- `.spa-pb__scatter` gets an inline `min-height: max(calc(100vh - 280px), N*80px)` driven by the asset count — viewport-tall for small folders, several screens tall for dense ones. The "More from <category>" header + `.spa-pb__overflow-*` CSS is now unused but left in `whiteboard-pages.css` for now (harmless dead rules; can prune in a later pass).



- `.spa-nav__brandmark` height: 28px → 56px (desktop), 22px → 44px (mobile).
- Nav padding reduced from 14px → 8px (desktop) and 12px → 8px (mobile) to keep the bar compact with the larger logo.
- Projects breadcrumb `top` updated: 78px → 82px (desktop), 70px → 66px (mobile) to stay clear of the resized nav bar.

## [1.2.7] -- navbar: replace "Ema Stoyanova" text with PanicAttackLogoBlack.png

- `NavHeader` brand section: removed the small `PanicAttackLogo.png` icon + `<span>Ema Stoyanova</span>` text. Replaced with `<img class="spa-nav__brandmark" src="/logo/PanicAttackLogoBlack.png">`.
- Dark theme (default): `filter: invert(1) brightness(10)` turns the black logo white. Whiteboard/light theme: `filter: none` so the black logo shows naturally against the light background.
- Mobile: `height: 22px` (desktop: `28px`).

## [1.2.6] -- video thumbnails captured client-side from the first frame

- **`useVideoThumbnail` hook.** When a `<Vid>` enters viewport, a hidden `<video>` element loads metadata, seeks to ~10% of duration (or 0.5s, whichever is smaller — avoids the black opening frames), draws the frame to a canvas, and reads it back as a JPEG data-URL. The data-URL is set as the visible `<video poster>` and (for MOV where autoplay is disabled) painted as an overlay `<img>` on top of the inert video so the polaroid shows a real preview.
- **Bandwidth gated by IntersectionObserver.** Thumbnail capture only fires when the wrapper is within 300 px of the viewport — boards offscreen never request anything. Each capture runs on its own throwaway `<video>` element with an 8s safety timeout so a stuck decode doesn't hang the page.
- **Fallback flow:** if the codec can't be decoded (HEVC MOV in Chrome/Windows, etc.), the seek/error/timeout paths all set `tried=true` and the placeholder reads "click to play" instead of the loading spinner.
- **Play indicator.** When a captured thumbnail is shown for a MOV polaroid, a small dark circle with a white play triangle appears in the bottom-right corner so the user knows the tile is interactive.
- Same-origin assets in `/public` decode cleanly without `crossOrigin` since the canvas isn't tainted; tainted-canvas exceptions are still caught and treated as "no thumb".

## [1.2.5] -- MOV files: click-to-play in lightbox + film placeholder

- **MOV files restored to manifest.** Re-added `.mov` to `VID_EXT` so all 8 Projection Mapping clips show up again — but as click-to-play tiles, not autoplay previews.
- **`<Vid>` skips IO/autoplay/preload for `.mov`.** Detects `.mov` by URL and short-circuits the IntersectionObserver + autoplay + `preload="metadata"`. Saves on bandwidth (these are 4–52 MB files, mostly HEVC) and stops them looking like broken black boxes. Polaroid shows the film-strip placeholder with the label "click to play".
- **Lightbox now handles videos.** When the URL ends in `.mp4 / .webm / .mov / .m4v / .ogv`, the lightbox renders `<video controls autoPlay playsInline>` instead of `<img>`. If the browser refuses the codec (HEVC MOV on Chrome/Windows), an `onError` listener swaps in a "can't play" panel with an explanation and a download link.
- **Polaroid click-handlers** dropped the `a.type === 'image' &&` filter — both images and videos open the lightbox now (scatter, events grid, overflow grid).

## [1.2.4] -- Projection: remove unplayable MOV files + video placeholder

- **`.MOV` files excluded from manifest.** QuickTime `.MOV` containers (all from the Projection Mapping folder — 8 files, up to 52 MB each) are typically HEVC/H.265 encoded from iPhone. Chrome on Windows cannot play them without a separate codec pack; they render as solid black. Removed `.mov` from `VID_EXT` in the manifest builder. Projection board now shows its 2 PNG images cleanly. To restore: convert the MOV files to H.264 MP4 (e.g. `ffmpeg -i IMG_2765.MOV -c:v libx264 -c:a aac IMG_2765.mp4`) then re-run `npm run gen:manifest`.
- **`<Vid>` now shows a film-strip placeholder** when video data hasn't loaded. Wraps `<video>` in a `.spa-vid-wrap` div; before `onLoadedData`/`onCanPlay` fires, a centred play-triangle + "video" label is overlaid so unsupported formats produce a clear indicator rather than solid black.
- CSS: `.spa-vid-wrap` + `.spa-vid-wrap__placeholder` added; all container selectors (`spa-polaroid__inner`, `spa-hl__photo`, `spa-pb__overflow-tile-inner`) updated to include `.spa-vid-wrap`.

## [1.2.3] -- fix broken images (URL encoding) + breadcrumb overflow + MOV mime type

- **URL encoding root cause fixed.** The manifest builder was using `encodeURIComponent` which over-encodes `& + ,` into `%26 %2B %2C`. These are valid characters in URI path segments (RFC 3986). Some browsers — particularly on the HTML parser side — re-interpret `%26` in a `src` attribute as a literal `&` BEFORE forming the HTTP request, then re-encode inconsistently, causing the request to differ from what the server expects. Switched to a minimal path encoder that only encodes the characters that genuinely break URL parsing: space (`%20`), `#` (`%23`), `?` (`%3F`), and existing `%` literals (`%25` to prevent double-encoding). Manifest regenerated — `&`, `+`, `,` are now literal in all paths. Fixes broken images in: Product Design & Brand Identity, AI (Firefly file with commas), Holistic Art Magazine (filenames with &), Projection Mapping + VJ + Lights, Vocabulary letter A (Firefly file with commas).
- **Navbar breadcrumb no longer clips projects.** Text labels (`span.spa-pb__crumb-label`) are hidden below 1100 px — each crumb shows only its two-digit number, which fits all 16 within the pill. `flex-shrink: 0` + `white-space: nowrap` + `flex-wrap: nowrap` ensure the pill itself stays single-row and scrolls rather than wrapping.
- **`.MOV` MIME type fixed.** `<Vid>` was emitting `type="video/mp4"` for `.mov` files. Corrected to `type="video/quicktime"` so the browser correctly identifies the Projection Mapping videos.

## [1.2.2] -- projects: show every asset + virtualised boards + perf pass

- **Every project asset is now reachable.** Drop `slice(0, 12)` cap in `src/config/projects.ts`. The first 8 assets per project still get the seeded scatter (visual chaos at the top); everything beyond is rendered in a clean `auto-fill minmax(180px, 1fr)` overflow grid below the scatter, with a "More from <category>" header showing the total count. Scrolling the board reveals the rest -- 3D's full 64 pieces, Digital Art's 21, etc. all show up.
- **Board virtualisation.** Only the active board and its immediate neighbours (radius = 1) mount full content (mini-grid, scatter, overflow grid, stickers, arrows). Boards further away render a lightweight skeleton -- preserves the horizontal scroll-snap geometry without paying the DOM/image cost. As the user scrolls horizontally, neighbours hydrate just-in-time. Eliminates the up-front cost of mounting ~16 × N polaroids and 16 × 16 folder thumbnails.
- **Folder mini-grid: cover thumbnails removed.** `FolderTile` no longer accepts a `cover` prop. The previous `<image href={cover}>` inside an SVG `<pattern>` was kicking off 16 large image fetches for every board (and we render 16 boards), so 256 large fetches per page load. Mini-grid tiles are now pure SVG -- folder lid + tab number + label, opens on hover via CSS transforms. Visually as charming, ~zero network cost.
- **Broken-image icon suppression.** `<Img>` now sets `data-failed="1"` on the element when its onError fires (and logs the URL once); CSS replaces the broken-image glyph with a neutral diagonal-stripe pattern so any one missing file doesn't pepper the page with OS glyphs. Doesn't fix the underlying 404, but stops the visual breakage.



- **`<Img>` no longer wraps in `<picture>`**: the `<source srcSet="*.webp">` was being selected by all webp-supporting browsers (i.e. all of them), and when the .webp 404s the browser shows the broken-image icon — `<picture>` does NOT fall back to the `<img>` child on a 404 source. Reverted to a plain `<img>`. Once `npm run optimize` has actually produced sibling .webp files we can reintroduce `<picture>` gated by a manifest of optimised URLs.
- Same gotcha applied to `<Vid>`: the auto-derived `.webm` `<source>` is now only emitted when explicitly passed via the `webm` prop.
- **Projects boards now scroll vertically**: `.spa-pb__board` switched from `overflow: hidden` to `overflow-y: auto`. Each board is its own scroll container; the horizontal snap track still moves between boards.
- Events board: dropped the inner `.spa-pb__events-doc { overflow-y: auto }` scroller — now the whole board scrolls so all the long-form event copy is reachable.
- Scatter boards: `.spa-pb__scatter` switched from absolute `inset` to relative + `min-height: calc(100vh - 280px)` so the polaroid scatter has somewhere to scroll into when there are more than a screenful of items.
- `.spa-pb__count` repositioned to `position: fixed` (bottom-right pill, glass-blur) and gated to the active board so 16 stacked pills don't overlap. `.spa-pb__arrow` got a glass-blur background so it stays legible against scattered photos and a clamp-based top so it never sits behind the head when scrolled.

## [1.2.1] -- whiteboard pages: fix broken images + scrollable boards

- **`<Img>` no longer wraps in `<picture>`**: the `<source srcSet="*.webp">` was being selected by all webp-supporting browsers (i.e. all of them), and when the .webp 404s the browser shows the broken-image icon - `<picture>` does NOT fall back to the `<img>` child on a 404 source. Reverted to a plain `<img>`. Once `npm run optimize` has actually produced sibling .webp files we can reintroduce `<picture>` gated by a manifest of optimised URLs.
- Same gotcha applied to `<Vid>`: the auto-derived `.webm` `<source>` is now only emitted when explicitly passed via the `webm` prop.
- **Projects boards now scroll vertically**: `.spa-pb__board` switched from `overflow: hidden` to `overflow-y: auto`. Each board is its own scroll container; the horizontal snap track still moves between boards.
- Events board: dropped the inner `.spa-pb__events-doc { overflow-y: auto }` scroller - now the whole board scrolls so all the long-form event copy is reachable.
- Scatter boards: `.spa-pb__scatter` switched from absolute `inset` to relative + `min-height: calc(100vh - 280px)` so the polaroid scatter has somewhere to scroll into when there are more than a screenful of items.
- `.spa-pb__count` repositioned to `position: fixed` (bottom-right pill, glass-blur) and gated to the active board so 16 stacked pills don't overlap. `.spa-pb__arrow` got a glass-blur background so it stays legible against scattered photos and a clamp-based top so it never sits behind the head when scrolled.

## [1.2.0] -- whiteboard pages: about, vocabulary, highlights, contact, projects board

### New routes (no more under-construction)
- `/about` -- two-column whiteboard layout with handwritten "Hi! I'm Ema :)", bold ABOUT headline, lede + body, paper-tape contact card (email + IG/FB/LinkedIn icons), circular vignette portrait. Bottom-of-page CSS film strip with sprocket-hole rows + Kodak-style frame numbers, scrollable horizontally.
- `/vocabulary` -- "Glossary" intro + 3 alternating-side entries (A Aesthetic, B Bloom, C Curiosity). Each entry has a giant ghost letter behind the image, original copy. Click image opens the existing site lightbox.
- `/highlights` -- 2-column polaroid grid with seeded micro-tilt per tile. Click image -> lightbox; videos auto-play muted on viewport entry via the new `<Vid>` helper.
- `/contact` -- sticky-note styled form (name / email / subject / message) submitting to Web3Forms; mailto: fallback when the access key is empty or the request fails. `Layer 1 star.png` scattered as decoration.
- `/projects` and `/projects/<slug>` -- horizontally-scrolling Miro-style whiteboard with one full-viewport "board" per category (16 boards). Scroll-snap, hand-drawn arrows at the edges (prev / next labels), keyboard ArrowLeft/Right, breadcrumb pill at the top to jump anywhere. URL stays in sync via `history.replaceState`.
  - Per-board content: title + description + decorative stickers (printer / folder / paperclip SVGs) + polaroid scatter laid out by a deterministic seed (Mulberry32 + collision avoidance).
  - **Folder hover micro-interaction**: each board has a 4-wide mini-grid of all 16 categories rendered as closed manila folders. On hover (or `is-active`) the lid rotates up and two pages slide out -- pure CSS transform transitions.
  - **Events board** is special-cased: pulls hand-cleaned HTML from `EventText.docx` (extracted via a one-off PowerShell script and stored in `src/generated/eventsText.html.ts`). Renders the long-form copy in the left column with project photos in the right.

### New helpers / scaffolding
- `src/components/PageShell/PageShell.tsx` -- common chrome (NavHeader + Cursor + Lightbox + ErrorBoundary) for every whiteboard page. Forces GRID palette so `data-spa-theme="whiteboard"` is set on `<body>`.
- `src/components/PageShell/Stickers.tsx` -- three original inline-SVG stickers (printer with paper curl, manila folder with peeking pages, stack of paperclips).
- `src/components/PageShell/FolderTile.tsx` -- the folder mini-tile with hover-open animation hook points (`.spa-folder-tile__lid` / `__pageA` / `__pageB`).
- `src/helpers/media.tsx` -- `<Img>` (lazy + `<picture>` with auto `.webp` fallback) and `<Vid>` (muted/loop/autoplay-on-visible via IntersectionObserver, auto poster + webm derivation).
- `src/helpers/seedScatter.ts` -- Mulberry32 + FNV-1a seed hash + collision-avoiding scatter with configurable bounds, size range, max rotation. Used to lay out polaroids deterministically per project slug.
- `src/config/projects.ts` -- per-folder metadata (slug, title, kind, description, sticker accent), wraps the auto-generated manifest into `Project[]` with seeded scatter applied. Edit this file to override copy / descriptions / future inline notes.
- `src/generated/mediaManifest.ts` -- AUTO-GENERATED. Source of truth for what's in `public/2. Projects/*`, `public/3. Highlights`, `4. Vocabulary`, `5. About`, `6. Contact`, `landing/`. Re-generate via `npm run gen:manifest`.
- `src/generated/eventsText.html.ts` -- hand-cleaned HTML copy of `EventText.docx`.

### Build pipeline
- `scripts/build-media-manifest.mjs` -- scans `public/` and emits `mediaManifest.ts` with properly percent-encoded URLs (handles spaces, backticks, special chars in folder names like `11. UX\`UI`).
- `scripts/optimize-public-assets.mjs` -- best-effort `sharp` -> `.webp` + 8x12 LQIP for images >= 200 KB; `ffmpeg` -> `.webm` + `.poster.jpg` for `.mp4`. Soft-skips quietly when libs are missing -- the site still works on raw assets.
- `package.json` -- new `gen:manifest` and `optimize` scripts.

### Routing
- `src/main.tsx` rewritten: previous "list of paths -> UnderConstruction" replaced with concrete component routing. `/projects/<slug>` is parsed via regex; everything unknown still falls through to `UnderConstruction`.

### Styles
- New `src/styles/whiteboard-pages.css` (~800 lines) imported from `main.tsx`. Sections: page shell + bg cross-grid, polaroid + post-it primitives, sticker base, About (incl. film strip), Vocabulary (alternating sides + ghost letter), Highlights (2-col polaroid grid), Contact (sticky-note form + scattered stars), Projects (horizontal snap-track + breadcrumb pill + folder mini-grid + hand-drawn arrows + events grid).

### Known follow-ups
- `WEB3FORMS_KEY` in `Contact.tsx` is empty -- set it to the real access key from web3forms.com to switch off the mailto: fallback.
- Run `npm install sharp` (and have `ffmpeg` on PATH) before `npm run optimize` to actually produce the WebP/WebM/LQIP assets. Until then the site ships raw originals and `<Img>`/`<Vid>` silently fall back via `<picture>`/`<source>`.
- Seeded scatter positions are decent but not pixel-perfect -- `src/config/projects.ts` is the place to hand-tune `assets[].x/y/rot/w` per board, or to add `notes: [{x,y,text,color}]`.

## [1.1.5] -- transparent headline text + scale-pop hover

- GraphicDesign: 'DESIGN BEYOND THE TRADITIONAL FORMAT' gets `fillOpacity={0}` when whiteboard (invisible behind the torus knot lens).
- CarouselSlot hover revamped: removed the rim glow plane entirely. Replaced with a smooth scale-pop (1.0 -> 1.05 lerped at 8x dt) + 15%% brightness boost. The 3D box physically grows toward the viewer on hover -- cleaner interaction signal that works with the thick box geometry. No extra meshes, no additive blending.

## [1.1.4] -- gallery: larger fading disc + shadows visible from below

- Ambient disc radius doubled (24 -> 48); added `alphaMap={floorAlphaMap}` so edges dissolve radially instead of a hard cutoff.
- ContactShadows gets a `ref={shadowRef}`; a `useEffect` traverses the group and sets `material.side = THREE.DoubleSide` on the internal mesh, making the shadow texture visible from below when scrolling past.

## [1.1.3] -- gallery: fix shadow cursor-dependence + underside visibility

- Moved `<ContactShadows>` + ambient disc OUTSIDE `stageRef` (into `groupRef` directly). The stage tilts/pans with the pointer for parallax, but the shadow plane now stays fixed — shadows no longer drift with cursor movement.
- Added a DoubleSide ambient disc (r=24, black, opacity 0.08) at y=-1.32 — provides a soft ground indicator visible from below when scrolling past the gallery.
- ContactShadows position converted from stageRef-local [0,-0.8,0] to groupRef-space [0,-1.3,-2].

## [1.1.2] -- whiteboard: visual tuning pass

- ContactShadows opacity 0.5 -> 0.75 (more visible).
- Slot boxDepth doubled: 0.35 -> 0.7 (canvas-wrap depth clearly visible).
- WhiteboardBackground VP_Y_FRAC 0.38 -> 0.18 (grid now covers ~82%% of viewport, was ~62%%).
- CSS: `.spa-cat-elegant__title` in whiteboard: white (`#ffffff`) with heavy black shadows (matches Featured Pieces treatment).
- CSS: `.spa-cat-elegant__body-wrap` opacity reduced to 0.55 (semi-transparent, grid visible behind).
- GraphicDesign: subtitle 'A LIVING CANVAS, REFRACTED' stays blood red on all palettes (was being forced to black in whiteboard).

## [1.1.1] -- gallery: image-wrapped 3D slots + ContactShadows fix

### Slots revamped
- Removed multi-mesh frame architecture (outer dark box + inner frame + separate drei Image). Replaced with a single thick box (depth 0.35) that uses the loaded texture directly via `meshBasicMaterial map={texture}`. The image now wraps around all faces of the box — front shows the full image, sides show a canvas-wrap continuation.
- Hover: box brightens slightly (depthFactor * 1.12); additive rim glow behind the box uses `#2563eb` (blue) when whiteboard or `#d30000` (red) on dark palettes.
- Thicker geometry (0.05 -> 0.35) eliminates the sub-pixel AA artifacts at corners that occurred with ultra-thin boxes.
- `useTexture(currentUrl)` replaces drei `<Image>`. Per-slot `<Suspense>` still handles loading gracefully.

### ContactShadows
- Brought back `<ContactShadows>` for whiteboard floor (replaced the ambient disc).
- Shadow plane lowered to y=-0.8 so objects have clearance for visible shadow spread. `blur=3`, `opacity=0.5`, `frames=Infinity` (continuous for animated carousel), `scale=60`.

## [1.1.0] -- whiteboard gallery: ambient shadow disc replaces ContactShadows

- Removed `<ContactShadows>` (shadows only visible at edges, invisible on center slots, single-sided). Replaced with a simple ambient shadow disc: `circleGeometry [22,64]`, black at 7% opacity, uses the existing radial `floorAlphaMap` for soft center-to-edge fade, `side: DoubleSide` so it's visible from below when scrolling past. Much cleaner grounding for the carousel against the perspective grid.

## [1.0.9] -- whiteboard: contact shadows + revert red numbers

- Gallery floor: when whiteboard active, the full reflective pedestal (reflector + backface + mist + floor text) is hidden. In its place, drei `<ContactShadows>` renders soft drop-shadows below the carousel frames (opacity 0.35, scale 50, blur 2.5, far 12). Normal palettes keep the full dark reflector unchanged.
- Category numbers (01-04): removed the whiteboard-specific `[data-spa-theme=whiteboard] .spa-cat-elegant__number` CSS override entirely — numbers now keep their default red stroke + red glow on ALL palettes including GRID.

## [1.0.8] -- whiteboard: stronger number shadow + black logo shadow

- `spa-cat-elegant__number`: drop-shadow values increased (0.18/0.13 -> 0.38/0.28, blur 20/5 -> 40/10) so they're actually visible.
- `HeroOverlay`: logo filter is now conditional -- whiteboard drops the red `rgba(211,0,0,0.4)` second shadow, dark-only in its place.

## [1.0.7] -- whiteboard: number shadow outside outline

- `spa-cat-elegant__number`: replaced `text-shadow` (renders behind fill, bleeds through transparent interior) with `filter: drop-shadow()` which operates on composited pixels — shadow falls outside the stroke, not inside it.

## [1.0.6] -- whiteboard: number shadows + nav monochrome

- `spa-cat-elegant__number` shadow strengthened: `0 0 60px rgba(0,0,0,0.08)` (invisible) replaced with `0 8px 32px / 0 2px 8px rgba(0,0,0,0.18/0.14)` so the giant numbers lift off the light background.
- Nav bar in whiteboard: light glass bg (`rgba(248,248,248,0.92)`), dark text, dark borders. Covers: nav base, brand name, item number prefixes, hover/active states, underline, Debug Tools label, palette/perf/debug/hamburger buttons, --forced/--on states, mobile overlay and its items.

## [1.0.5] -- whiteboard: monochrome site theme

- `paletteStore.ts`: exported `useIsWhiteboard()` hook; placed after `usePalette` declaration.
- `App.tsx`: syncs `useIsWhiteboard()` to `document.body.dataset.spaTheme` via `useEffect`.
- `HeroOverlay.tsx`: logo switches to `PanicAttackLogoBlack.png` when whiteboard active.
- `GraphicDesign.tsx`: headline + subtitle switch paper/blood to `#0a0a0a` when whiteboard.
- `Gallery.tsx`: 'STUDIO PANIC ATTACK' floor text -> `#ffffff`, `fillOpacity 0.5` when whiteboard.
- `global.css`: `[data-spa-theme=whiteboard]` block -- category numbers (black stroke), titles (dark), body-wrap (light bg, black accent bar), highlights (all text black except .spa-title), loading screen (white bg, black bar/labels/stroke, dark scanlines).

## [1.0.4] â€” whiteboard: full-width grid + lighter fog

- Horizontal lines now span `0 â†’ Wl` (full viewport width) instead of clipping to `projX(Â±NUM_COLS, t)`.
- Added `MAX_COLS = 38`. Vertical lines drawn for all `j âˆˆ [âˆ’38, 38]`; those with `j > NUM_COLS` land off-screen at the bottom but their upper portion fans into the viewport, filling the sides near the horizon. Canvas clips naturally.
- Cross `jMax` is now dynamic per row: `min(MAX_COLS, ceil(NUM_COLS / tExpo))`. Near-horizon rows get many small crosses covering full width; deep rows get fewer large ones â€” always matching the actual grid intersections.
- `projX` now accepts a pre-computed `tExpo` instead of recomputing `Math.pow(t, ROW_EXPO)` per call. `Row` type carries `tExpo`.
- Depth fog reduced: `span Ã— 0.16 â†’ 0.12`, solid stop `0.6 â†’ 0.4`.


## [1.0.3] -- debug: whiteboard perspective grid revamp



- Replaced CSS SVG-tile whiteboard (crosses at cell centres, not intersections) with `WhiteboardBackground.tsx` â€” a `<canvas>`-based animated perspective grid.
- Single vanishing point at 38 % of viewport height, centre-x. Vertical lines radiate from VP to viewport edge. Horizontal lines scroll toward the viewer at 0.55 rows/s.
- `+` crosses drawn at every mathematically computed row Ã— column intersection (perspective-projected), so they are precisely at grid-line meetings at every depth.
- Depth-based weight: near horizon = faint/tiny; approaching viewer = thicker lines, larger crosses (arm 1.5 â†’ 8 px). Horizon fog gradient prevents a hard cutoff.
- HiDPI-aware: canvas sized in physical pixels, all drawing in logical pixels via `ctx.setTransform`.
- `HeroOverlay`: removed `WHITEBOARD_TILE` CSS constant; now mounts `<WhiteboardBackground />` for the `'whiteboard'` palette type.

## [1.0.2] â€” debug: whiteboard grid background

- Added `type?: 'mesh' | 'whiteboard'` discriminator to the `Palette` interface in `paletteStore.ts`.
- Added `GRID` palette (type `'whiteboard'`) as index 0 â€” now the default background. All existing mesh-gradient palettes (BLOOD â†’ INK) shift to indices 1â€“8 and remain accessible via the cycle button.
- `HeroOverlay`: branches on `palette.type`. When `'whiteboard'`, renders a CSS cross-grid (48 px tiled SVG: faint `#d4d4d4` grid lines + `#a8a8a8` `+` crosses at every intersection, `#fafafa` base). When `'mesh'`, renders `<MeshGradient>` as before.
- No changes to NavHeader â€” the swatch uses `palette.colors[3]/[4]` which are set to grey tones for the GRID entry.

## [1.0.1] â€” gallery: spawn gap 5.5 â†’ 4.5

- `MIN_SPAWN_GAP` 5.5 â†’ 4.5.

## [1.0.0] â€” gallery: spawn gap for doubled tilt + drag hint

### Spawn gap widened for doubled tilt

With pointer tilt at `0.20` rad, a slot of average width ~5 units
has a corner X-projection of `cos(0.20) Ã— 2.5 â‰ˆ 2.45`. Two
adjacent slots require centre-to-centre offset spacing of
`2 Ã— 2.45 â‰ˆ 4.9` to avoid geometry clipping. `MIN_SPAWN_GAP` is
raised from 3.8 â†’ **5.5** to cover this with a comfortable margin.

Side effect: with 18 slots Ã— 5.5 > `CAROUSEL_WIDTH`, slots spread
more loosely through the belt. The visible window holds ~6-8 slots
at once â€” more gallery-like, less packed.

### Drag visual cue

Added a `<Html>` drag-hint below the carousel that tells users they
can interact:

- `dragHinted` state (default false). Flips to true on the first
  pointer drag (`isDrag` crossing the 5 px threshold) *or* after
  6 s via a `setTimeout` â€” whichever comes first.
- `<Html transform={false}>` inside `groupRef` but outside
  `stageRef` so stage camera-pan doesn't shift the hint off-centre.
- Content: small left/right arrow SVG + mono "drag" label.
- CSS class `.spa-drag-hint`: mono 9 px, letter-spaced, cream 70 %
  opacity, `spa-drag-hint-sway` keyframe (Â±5 px left/right over
  2.4 s) to draw attention. `.spa-drag-hint--done` fades it to
  transparent in 0.6 s.

## [0.9.9] â€” gallery: 5s glide, slower drag, faster auto, double tilt

- `CAROUSEL_SPEED` 0.28 â†’ **0.38**.
- `DRAG_SENSITIVITY` 0.02 â†’ **0.006** â€” carousel no longer follows
  the mouse 1:1; it responds like a weighted object. A 300 px drag
  moves ~1.8 offset units.
- useFrame drag block:
  - Applies only **35 %** of `pendingDelta` per frame; the rest
    carries over. The carousel eases into input rather than snapping
    to it.
  - `smoothVelocity` EMA changed from 70/30 â†’ **80/20** history/
    current weighting. A brief pause before release doesn't zero
    out momentum â€” the rolling average is more stable.
  - `smoothVelocity *= 0.9` (was 0.75) when no input arrives this
    frame, giving gentler idle decay.
  - Post-release momentum: `smoothVelocity Ã— 30` (was Ã—60) for a
    proportional initial glide velocity.
  - Decay `0.82^(60dt)` â†’ **`0.990^(60dt)`**: ~5 s exponential
    glide (after 5 s â‰ˆ 5 % of initial momentum remains).
- Pointer tilt `state.pointer.x Ã— 0.10` â†’ **Ã—0.20** (doubled).

## [0.9.8] â€” gallery: faster auto-speed + smooth drag momentum

- `CAROUSEL_SPEED` 0.15 â†’ **0.28** (~87 % faster).
- Drag rework:
  - `onMove` now **accumulates** pixel deltas into `pendingDelta`
    instead of applying them directly to slot offsets. `useFrame`
    applies the batch each render tick so motion is always frame-rate
    synced and never jitters from irregular pointer-event intervals.
  - A `smoothVelocity` EMA (70 % history + 30 % current frame)
    tracks the rolling drag speed. If the hand pauses mid-drag the
    EMA decays (Ã—0.75 per frame) so a stationary hold doesn't build
    phantom momentum.
  - `onUp` sets `momentum = smoothVelocity Ã— 60` â€” drawn from the
    rolling average rather than the last single delta, so release
    always feels proportional to how fast the user was dragging.
  - Post-release decay changed from `0.88^(60dt)` â†’ `0.82^(60dt)`
    (~1 s half-life vs 0.8 s): glide lasts a touch longer.

## [0.9.7] â€” gallery: wider gaps, stronger parallax, click-and-drag

### Spawn gap widened

`MIN_SPAWN_GAP` 2.2 â†’ **3.8**. Slots that re-enter after wrapping
are pushed rightward until they are 3.8 offset units from every
neighbour. Gives more breathing room between images and a less
packed, more browseable feel.

### Stronger speed variation

Speed-factor formula updated in two places:

| | before | now |
|---|---|---|
| exponent | `pow(minDist/dist, 0.55)` | `pow(minDist/dist, 0.70)` |
| jitter range | 0.8 â€¦ 1.2 | **0.65 â€¦ 1.35** |

Front/back ratio now ~2.2Ã— (was ~1.8Ã—). Jitter span doubled
from Â±20 % to Â±35 %. The parallax between adjacent slots is now
visibly distinct on any screen.

### Click-and-drag to spin

New `drag` ref + window-level pointer listener inside `Gallery`.

- `pointerdown` â€” arm the drag, remember `startX`.
- `pointermove` â€” after a 5 px threshold (distinguishes from
  slot-open clicks), apply `Î”x Ã— DRAG_SENSITIVITY` directly to
  every slot's offset each frame.  Dragging left accelerates the
  carousel; dragging right decelerates or reverses it.
- `pointerup` â€” carry the last-frame delta as momentum
  (`lastDelta Ã— 55 units/s`). In `useFrame`, the momentum is
  applied to all slot offsets and decays at `0.88^(60Ã—dt)` per
  second (~0.8 s half-life).
- `DRAG_SENSITIVITY = 0.02` (300 px drag â‰ˆ 6 offset units).
- Event listeners cleaned up on unmount.

## [0.9.6] â€” gallery: density 18 + spawn-gap safeguard

- `SLOT_COUNT` 26 â†’ **18**.
- New `MIN_SPAWN_GAP = 2.2`. When a slot wraps and re-enters on the
  right side, a cascade loop checks every other slot: if the new
  offset is within `MIN_SPAWN_GAP` of any neighbour, the slot is
  pushed rightward and the check repeats (up to `SLOT_COUNT`
  iterations) until it finds a clear berth. Prevents the
  parallax-speed drift from bunching slots together over successive
  laps, which was causing the pointer-tilt to clip adjacent
  geometry.

## [0.9.5] â€” gallery: density 36 â†’ 26

- `SLOT_COUNT` 36 â†’ 26.

## [0.9.4] â€” gallery: density down, parallax up, slots fully behind text

- **Density** â€” `SLOT_COUNT` 44 â†’ **36**. The 44-slot carousel was
  visually crowded, especially with the wider size variation; 36
  fills the deeper Z range without packing slots on top of each
  other.
- **Parallax bumped ~20 %** â€” speedFactor formula reworked:
  - Anchor changed from `pow(4/dist, 0.4)` to
    `pow(minDist/dist, 0.55)` where `minDist =
    STAGE_TO_CAMERA - SLOT_Z_FRONT` (= 10 with the new front cap).
    A slot at the front cap now gets a clean `1.0Ã—` baseline
    instead of being capped at ~0.6 because nothing was at the
    reference distance.
  - Random jitter widened from `0.85..1.15` (Â±15 %) to
    `0.8..1.2` (Â±20 %).
  - Resulting per-slot speed range with the new exponent:
    front â‰ˆ 1.0Ã—, back â‰ˆ 0.56Ã— (was 1.0Ã— / ~0.55Ã— nominally but
    with a much smaller usable spread once jitter compounded).
    Real-feeling layered drift now.
- **Front cap pushed back** â€” `SLOT_Z_FRONT` `+0.5` â†’ `-2`. With
  the gallery floor text at z=3, a 5-unit Z gap between the
  closest possible slot and the text is enough headroom for the
  arc curve, the size compensation, and any rotation jitter â€” no
  slot can visually pass in front of "Have a peek inside my
  brain" anymore.
- Size caps lifted again (`6/7` â†’ `8/9`) since the further-back
  cap means depth-size compensation produces slightly larger
  worst-case dimensions.
- Depth-dim curve mapped onto `[-28, -2]` (was `[-28, +0.5]`) to
  match the new front cap.

## [0.9.3] â€” gallery: deeper depth, exponential size, parallax speeds

Restructured the carousel's spatial layout for real depth and
visual variety, and prevented slots from clipping the floor text.

### Depth range pushed way back

| | before | now |
|---|---:|---:|
| Slot Z range (stage local) | -1 â€¦ +4 | **-20 â€¦ +0.5** |
| Front cap | +4 | **+0.5** |
| Back cap | -1 | **-20** |

`SLOT_Z_FRONT = +0.5` keeps every slot behind the gallery floor's
"Have a peek inside my brain" text (which sits at floor z=3) â€” the
text is now always in front of every slot, never occluded. The
back cap pushes the carousel into a 20-unit Z corridor instead
of a 5-unit slab.

### Distance-driven size compensation

A back-row slot at world distance ~30 from the camera would shrink
to a speck without compensation. New `depthSizeFactor`:

```
depthSizeFactor = pow(distance / 4, 0.72)
```

(`distance = STAGE_TO_CAMERA - slot.depth`, with
`STAGE_TO_CAMERA = 8`.) Resulting world sizes:

| slot.depth | distance | depthSizeFactor |
|---:|---:|---:|
| +0.5 (front) | 4   | 0.92 |
| -1           | 9   | 1.81 |
| -10          | 18  | 2.95 |
| -20 (back)   | 28  | 4.13 |

Back slots are physically ~4Ã— a front slot, but appear at a
similar visual size on the camera with subtle "further away"
diminishing. Per-slot `sizeMultiplier` widened from
`0.63 .. 1.26` â†’ **`0.55 .. 1.65`** so adjacent slots vary more
in apparent size on top of distance compensation.

`clampedW / clampedH` caps lifted from `2.52 / 2.94` â†’ **`6 / 7`**
so the depth-driven sizing isn't clipped.

### Per-slot parallax speeds

`SlotState` gains a `speedFactor` field. Set once at init from:

```
speedFactor = pow(4 / distance, 0.4) Ã— jitter(0.85..1.15)
```

So a front slot drifts ~1.0Ã— and a back slot ~0.55Ã— the base
`CAROUSEL_SPEED`, with each slot getting its own Â±15 % twist on
top so they don't drift in lockstep. Stronger sense of real
depth as the carousel moves; spacing drifts over time but the
per-slot wrap logic keeps everything looping.

### Density: 28 â†’ 44 slots, carousel 36 â†’ 44 wide

Bumped `SLOT_COUNT` from 28 â†’ 44 and `CAROUSEL_WIDTH` from
36 â†’ 44 to fill the deeper Z corridor â€” without more slots the
back rows would read as empty. Spacing stays at 1.0 stage units
between slot anchors.

### Depth-dim curve retuned

The E (depth dimming) lerp range was tuned for the old shallow
Z. Updated to map `[-28, +0.5]` onto `[0.45, 1.0]` so the
darkest back-row slot still has 45 % of full brightness.

## [0.9.2] â€” gallery polish: arc, depth, rim glow, mist, slot tilt

Five overlapping enhancements to the gallery, all in `Gallery.tsx`:

### I â€” curved carousel arc
Slots no longer travel along a straight line in stage X. Each
slot's `offset` is treated as arc-length along a circle of radius
`ARC_R = 30`, so:
- `position.x = sin(angle) * R`
- `position.z = (cos(angle) - 1) * R + s.depth`
- `rotation.y = -angle` (slots face the centre of the arc)

Net result: edge slots curve gently away in Z (~5 units back at
the carousel ends) and turn to face inward. Reads as a real 3D
stage rather than a parallax slideshow. No change to the wrap or
pool-cursor logic â€” `s.offset` math is identical, only the
position projection moved.

### K â€” pointer tilt
Each slot's Y rotation now adds `state.pointer.x * 0.10` (~5.7Â°
range) on top of the arc-facing rotation. The carousel "watches"
the cursor without breaking the curve. Direct write per frame,
no lerp â€” pointer already moves smoothly enough.

### E â€” depth dimming
Per-slot brightness scales with the slot's final `position.z`.
Mapped onto `[0.45, 1.0]` via `clamp(0.55 + (z + 4) * 0.06, â€¦)`.
Applied to:
- the drei `<Image>` material's `color` uniform â†’ image tints
  darker the further it sits;
- the existing frame-colour lerp target â†’ frames dim alongside
  their image.

Combined with the arc, edge slots are noticeably dimmer than
centre slots â€” atmospheric perspective without a real DOF /
fog pass.

### F â€” rim glow on hover
Added a `<mesh ref={rimRef}>` plane just behind each image at
`z=0.65, scale=[1.08, 1.08, 1]`, additively blended blood red.
Opacity ramps `0 â†’ 0.6` over ~250 ms when the slot is hovered,
back to 0 on leave. The mesh sets `visible = false` once opacity
drops below 0.01 so the 27 idle slots aren't all eating draw
calls when nothing is hovered.

### H â€” ground mist
Two soft-noise circles just above the floor at `y = 0.06` and
`y = 0.32`, generated from a new `makeMistTexture(seed)` helper
(per-pixel random luminance â†’ two-pass `filter: blur(10px)` â†’
`CanvasTexture` with repeat-wrap). Each layer drifts its UV
`offset` in opposite directions on X with a small Y wobble, so
the carousel feels like it's emerging from low fog. Both layers
are `depthWrite: false` so they don't break the slot frame
depth, and the entire mist stack is gated behind
`!profile.isLowPower` (skipped on tiers â‰¤ 1).

Both mist textures are disposed via a `useEffect` cleanup; same
for `floorAlphaMap`.

## [0.9.1] â€” gallery floor: circular pedestal with radial alpha fade

Replaced the hard-edged 60Ã—60 reflective square with the
"infinity stage" treatment.

- `Gallery.tsx`: geometry swapped from `planeGeometry [60, 60]`
  to `circleGeometry [32, 96]` â€” a 64-unit-diameter disc with
  smooth 96-segment perimeter. Covers the carousel content
  (slots span Â±18) plus a soft margin. Same change applied to
  the underside back-face mesh so the silhouette is consistent
  from above and below.
- New `floorAlphaMap` â€” a 512Ã—512 `CanvasTexture` painted with a
  radial gradient (`#ffffff` 0 % â†’ `#dddddd` 55 % â†’ `#444444`
  85 % â†’ `#000000` 100 %). Mounted on both materials with
  `transparent: true`. The reflective top fades to nothing at
  the rim, so the reflection itself dissolves rather than
  cutting off at a hard edge. Disposed on unmount via the same
  effect that owns the canvas.
- `MeshReflectorMaterial` keeps every other prop the same â€” the
  alpha mask is a pure visual upgrade, no perf delta.

The disc reads as a deliberate stage / pedestal instead of an
arbitrary slice, and the soft rim blends into the brand
backdrop so the floor never announces "this is where 3D ends".

## [0.9.0] â€” portrait fix: text clipping + UXâ†”Highlights overlap

Two real-world bugs surfaced on iPhone:

1. **Body text clipped on the left** â€” in v0.8.x's Option B layout
   the text Html anchor sat at `(side === 'left' ? -1.6 : 1.6) *
   xFit` even on portrait. With xFit â‰ˆ 0.6 the anchor projects to
   ~25 % from left of screen; with `Html center=true` and a 62 vw
   wide box the left edge ended up ~45 px off-screen, clipping the
   first letter of every line.
2. **04 UX Design overlapping "Featured pieces"** â€” text was
   dropped âˆ’10 world units everywhere. UX text at `âˆ’52.5 âˆ’ 10 =
   âˆ’62.5`; Highlights anchor at `âˆ’67.5`. Only 5 world units apart.
   On a portrait viewport (~8.4 world units tall at FOV 70Â°)
   that's well within one viewport, so both render on screen at
   the same scroll.

Fix: per-orientation positioning in `CategorySection.tsx`. Landscape
unchanged; portrait gets a tighter, centred layout:

| | landscape (unchanged) | portrait (new) |
|---|---|---|
| `heroPos` | `[Â±2.4 Â· xFit, +7, 0]` | `[0, +4, 0]` |
| `htmlPos` | `[âˆ“1.6 Â· xFit, âˆ’10, 0]` | `[0, âˆ’4, 0]` |
| Html width | `min(760 px, 86 vw)` | `min(440 px, 78 vw)` |

Portrait policy now: centre both halves on X (text overlays
sculpture, layered/editorial â€” the Option B trade-off we already
accepted), and use small Y offsets so adjacent sections never
share screen space at the same scroll. UX text at section_Y âˆ’ 4
= âˆ’56.5 vs Highlights at âˆ’67.5 â†’ 11 world units apart, larger
than the ~8.4-unit portrait viewport, so they exit/enter cleanly.

Caveat: this means per-element worldY differs between portrait
and landscape, breaking strict v0.8.0 "same Y on every viewport".
Still consistent within each orientation though, and the
overlap/clip bugs were a much worse experience than that
abstraction was worth.

## [0.8.9] â€” fix: weserv proxy on the live Vercel deploy

**Bug**: prod deploy at
`studio-panic-attack-maximilian.vercel.app` 404'd every gallery
image. `assetUrl.ts` had a hardcoded `PROD_ORIGIN =
'https://max-wik.com'` left over from copy-pasting the helper
from a different project â€” weserv was being asked to fetch
`max-wik.com/landing/artist-frame-1.png` (which doesn't exist on
that host), got a 404, and the ErrorBoundary tipped over with
"the render flatlined". Local dev worked because dev returns the
path unmodified.

**Fix**: read the source host at runtime from
`window.location.host` instead of hardcoding it. Works on:

- the canonical Vercel URL,
- any Vercel preview deploy (PR-specific URL),
- any future custom domain â€” no code change needed.

Defensive fallback: if `window.location.host` is somehow empty
(SSR / weird environment), `assetUrl` returns the raw `/landing/`
path so the image still loads (slowly) instead of 404'ing.

Also dropped the four `<link rel="preload">` weserv URLs from
`index.html` â€” they had to be byte-identical to the JS-emitted
URLs to share a browser-cache entry, which is impossible with a
runtime origin. The JS preload gate (`usePreloadGate`) already
covers the same first-batch images.

## [0.8.8] â€” palette cycler in the debug cluster

- New `helpers/paletteStore.ts`: zustand store with a list of
  named 5-stop palettes (`BLOOD`, `OCEAN`, `AMBER`, `MOSS`,
  `VIOLET`, `BUBBLEGUM`, `CYAN`, `INK`) plus `idx` / `set` /
  `cycle` / `current()`. Persists to
  `localStorage['spa-palette']`.
- All palettes follow the original five-stop format
  (`ink â†’ smoke â†’ muted accent â†’ mid accent â†’ bright accent`)
  so the page edges stay grounded and only the dominant hue
  changes.
- `HeroOverlay.tsx`: subscribes to the palette index and feeds
  the current colour list straight into `<MeshGradient colors=â€¦/>`.
- `NavHeader.tsx`: new `.spa-nav__palette` button as the first
  control in the Debug Tools cluster (left of the perf button).
  Two-part layout â€” a 16 px circular swatch using the active
  palette's accent + mid colours via CSS `radial-gradient`,
  next to the palette ID in mono. Click cycles to the next
  palette. Hover lights the border + adds a soft glow in the
  current accent (via `color-mix`), so you can see what you're
  about to switch to.
- New CSS: `.spa-nav__palette`, `.spa-nav__palette-swatch`,
  `.spa-nav__palette-id`. Uses CSS custom properties
  (`--palette-accent`, `--palette-mid`) inlined per render.

## [0.8.7] â€” nav: "Debug Tools" label next to the action cluster

- `NavHeader.tsx`: small `<span class="spa-nav__actions-label">
  Debug Tools</span>` inserted as the first child of
  `.spa-nav__actions`, sitting just before the perf button.
- CSS: mono 9 px, 0.32 em letter-spacing, dimmed cream
  (`rgba(246,243,238,0.45)`), uppercase â€” same vocabulary as
  the rest of the small mono labels in the nav. Hidden below
  1100 px viewport width so the nav doesn't crowd on smaller
  screens.

## [0.8.6] â€” nav: keep perf + debug + hamburger on one row

The nav uses `grid-template-columns: auto 1fr auto` (3 columns:
brand / links / actions). Adding the perf button alongside the
existing debug-grid and hamburger meant 5 children for 3 columns,
so the 4th and 5th wrapped onto a new row.

Wrapped the three action buttons in a single `.spa-nav__actions`
flex container so they share the third grid column. `display:
inline-flex; gap: 8px; justify-self: end`.

## [0.8.5] â€” gallery floor: stop despawning when viewed from below

- The reflective gallery floor is a `MeshReflectorMaterial` plane,
  which is `FrontSide` only. As scroll lifts the scene group
  upward, the camera ends up *below* the floor's world Y; with
  the back face culled, the floor visually disappears in one frame
  â€” read as a glitch.
- Added a second `<mesh>` at the same position with a
  `meshBasicMaterial` set to `side: THREE.BackSide`,
  `color: '#050505'`, `opacity: 0.55`, `transparent`,
  `depthWrite: false`. Only the back face renders, so the new
  plane is invisible while the camera is above the floor (no
  z-fighting with the reflective top) and only kicks in once the
  camera passes underneath. Semi-transparent so the brand
  backdrop bleeds through â€” reads as a ghost of the floor instead
  of a hard black wall.

## [0.8.4] â€” perf-tier override in nav

The performance-tier system already worked end-to-end â€”
`detect-gpu` returns 0â€“3, `useDeviceProfile` derives
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
  the debug grid icon. Cycles `AUTO â†’ T0 â†’ T1 â†’ T2 â†’ T3 â†’ AUTO`
  on click. Label shows current effective tier:
  `AUTOÂ·T<n>` when on auto-detect, `T<n>` when forced. Lights up
  blood-red with a glow when a manual tier is in effect â€” same
  treatment as the debug toggle.
- Title attribute spells out the full state for hover inspection
  (e.g. "Perf: forced T0 (isLowPower=true). Click to cycle.").

What flips when you force a low tier:

- Canvas `dpr` drops from `[1, 1.6]` â†’ `[0.85, 1.1]`, antialias off.
- `PostFx` returns `null` (bloom / chromatic aberration / vignette
  / noise all disabled).
- `Gallery` reflector blur `[300, 100] â†’ [0, 0]`, resolution
  `256 â†’ 128`, mixStrength `80 â†’ 40`.
- `GraphicDesign` Lens swaps `MeshTransmissionMaterial` for
  cheap transmission glass.
- `AIArt` Hedgehog drops from `420 â†’ 150` spikes; idle breathing
  disabled.
- `ScatteredImages` count `18 â†’ 10`; shader effects all swap to
  `'plain'`.

## [0.8.3] â€” readable titles + bigger body text in categories

- `.spa-cat-elegant__title` (01 Graphic Design / 02 3D Art /
  03 AI Art / 04 UX Design) and `.spa-title` (Highlights â†’
  "Featured pieces"): added a layered black text-shadow stack â€”
  a tight `0 2px 12px / 0.85`, a soft `0 0 28px / 0.55` halo,
  and a 1 px hard drop. Stays readable now that scattered images
  can sit directly behind these titles.
- `.spa-cat-elegant__body` body copy: `15 px â†’ 18 px`, line-height
  `1.65 â†’ 1.60`, colour from `rgba(...,0.82)` to `0.86` for a
  hair more contrast. Mobile breakpoint override (`max-width: 700px`)
  bumped from `13.5 px â†’ 16 px`.

## [0.8.2] â€” sculptures down 3 + fix the early-despawn bug

### fix(visibility): sculptures vanished when scrolling slightly past

`useSectionVisibility` ramps up over a window centred on the
section's scroll range. With sculptures lifted to `section_Y + 10`
in v0.8.1, they entered the camera ~10 world-units (~0.155 scroll
units) **earlier** than the visibility window opened â€” but the
sculpture's own `useFrame` short-circuits with
`if (v < 0.005) mesh.visible = false`. So the sculpture was on
screen but mesh-hidden until the section's own visibility ramp
caught up â€” the "appears too late" symptom. Same in reverse on
exit: window closed before the sculpture had finished scrolling
out of frame, so it popped out a beat early.

Added an optional `worldYOffset` parameter to `useSectionVisibility`
that converts the offset to scroll-units (`worldYOffset / 64.5`,
since Layout.tsx travels 64.5 world units per scroll unit) and
shifts the visibility window backwards by that amount.

- `GraphicDesign.tsx`: `useSectionVisibility('graphic', 7)` (Knot
  is at section centre + 7).
- `AIArt.tsx`: `useSectionVisibility('ai', 7)` (Hedgehog same).
- Other call sites (`Gallery`, `Vocabulary`) pass no offset â€”
  default `0` keeps current behaviour.

### move: sculptures + scattered down 3 (current value âˆ’ 3)

- `CategorySection.heroPos.y`: `+10` â†’ `+7`.
- `ScatteredImages.worldY` bias: `+10` â†’ `+7`.
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

## [0.8.1] â€” manual placement: text âˆ’10, bg +10 within categories

Per direct positional spec from the design pass: split the text
half and the 3D / scattered halves of every category by 20 world
units. Section anchors in `sections.ts` are unchanged â€” only the
local offsets inside CategorySection (and the world-Y bias inside
ScatteredImages) shift.

`CategorySection.tsx`:

- `htmlPos.y`: `0` â†’ `-10` (text body drops 10 units in scroll).
- `heroPos.y`: `0` â†’ `+10` (sculpture rises 10 units; appears
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

## [0.8.0] â€” Option B layout + worldY debug overlay

### feat(layout): single side-by-side layout on every viewport

- `CategorySection.tsx`: dropped the portrait/landscape branch.
  Both halves are now anchored at section centre `Y=0` regardless
  of orientation â€” only X scales with viewport. **Every element's
  worldY is identical on every device.**
  - `xFit = clamp(viewport.width / 6.4, 0.4, 1.0)` shrinks the
    side offsets on phones so both halves stay on screen.
  - `heroPos = [(side==='left' ? 2.4 : -2.4) * xFit, 0, 0]`
  - `htmlPos = [(side==='left' ? -1.6 : 1.6) * xFit, 0, 0]`
  - On portrait, the Html width drops from 86vw â†’ 62vw so the
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
    scrolls with the scene â€” coordinates always correspond to
    real world space.
- Exported `DebugLabel` helper from `DebugOverlay.tsx`: a
  `<Billboard><Text/></Billboard>` that auto-hides via the same
  store. Drop into any 3D component to mark a specific entity.
- Per-entity labels now wired into:
  - `GraphicDesign` â†’ `Sculpture: Knot (01 graphic)` at the section
    centre.
  - `AIArt` â†’ `Sculpture: Hedgehog (03 ai)` at the section centre.
  - `ScatteredImages` â†’ one orange label per item:
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

## [0.7.1] â€” bg density: lift scattered images into the text band

After the v6 section retune the categories felt visually sparse â€”
scattered images were trailing well below the text since they
spread Â±2.5 world units around each section centre, and the
category bodies are only ~6 units tall. Tightened + biased the
distribution so the bg images read as flanking the text instead
of orphaned beneath it.

In `ScatteredImages.tsx`:

- Item count bumped: low-power 8 â†’ 10, normal 14 â†’ 18. Gallery is
  longer now and 02 is shorter, so the category sections needed a
  bit more density to not feel empty.
- `ySpread` formula changed from `((i % 3) / 2 - 0.5) * 0.5 * 10`
  (range âˆ’2.5 / 0 / +2.5) to `((i % 3) / 2 - 0.2) * 0.3 * 10`
  (range âˆ’0.6 / +0.9 / +2.4). Tighter band, biased upward so each
  scattered image's section-local Y lands between roughly âˆ’1.1 and
  +2.9 (after the existing Â±0.5 random jitter). "Up" here = earlier
  in scroll = on screen at the same time as the category number /
  title rather than after.

Sculptures already follow their section's world Y automatically
(they're children of `<CategorySection>`'s yPos group), so no
change needed there â€” Knot moved 5 units later with 01 in v6,
Hedgehog stayed put, and both are still anchored to their section
centres.

## [0.7.0] â€” section retune: gallery breathing room, Hedgehog â†” Knot

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

| section          | length     | center â†’ worldY     | notes |
|------------------|-----------:|--------------------:|-------|
| hero             | 0.6        |  0.30 â†’ -3.0        | unchanged |
| gallery          | **2.0** (was 1.5) |  1.60 â†’ -16.0 | extra half-page so 01 doesn't crowd the carousel |
| graphic (01)     | 0.9        |  3.05 â†’ -30.5       | shifts 5 units later |
| threeD (02)      | **0.4** (was 0.9) |  3.70 â†’ -37.0 | no sculpture (relocated to 01); doesn't need a full page |
| ai (03)          | 0.9        |  4.35 â†’ -43.5       | unchanged |
| ux (04)          | 0.9        |  5.25 â†’ -52.5       | unchanged |
| vocabulary       | 0.7        |  6.05 â†’ -60.5       | unchanged |
| highlights       | 0.7        |  6.75 â†’ -67.5       | unchanged |

Net `TOTAL_PAGES` stays at **7.1** because gallery's +0.5 cancels
threeD's âˆ’0.5. So Layout.tsx's hardcoded travel range (`3.0 +
offset * 64.5`) is **still correct** â€” only its comment was
refreshed to enumerate the new section centers.

Result:
- Gallery has ~33 % more scroll length to play out before 01 hits.
- Knot â†” Hedgehog distance drops from **18 â†’ 13 world units**
  (5 units closer); 02 still has time for the user to read its
  body without a sculpture competing for attention.
- Every section after 03 is byte-for-byte at the same world Y as
  before, so the highlights handoff and the global travel math
  are unaffected.

## [0.6.4] â€” loader %: outline the symbol to match the number

- `.spa-loader__pct-sym`: dropped the filled-cream override.
  Symbol is now `color: transparent` with `-webkit-text-stroke:
  1.4px var(--blood)` â€” same red outlined treatment as the
  number, stroke scaled down for the smaller font size so the
  visual weight stays balanced.

## [0.6.3] â€” loader %: red stroke matching category numbers

- `.spa-loader__pct`: stroke colour swapped from cream to
  `var(--blood)` and a subtle red text-shadow glow added â€”
  same treatment as `.spa-cat-elegant__number` (the giant
  italic 02 / 03 numbers in the category sections). Loader now
  reads as part of the same typographic family instead of a
  separate cream-on-red afterthought.
- `.spa-loader__pct-sym`: gains `text-shadow: none` so the
  inherited red glow doesn't bleed onto the small filled `%`.

## [0.6.2] â€” loader is its own opaque screen + outlined % counter

- `.spa-loader` is now a real own-screen overlay:
  - `pointer-events: auto` â€” the loader itself catches every wheel,
    touch, and click, so drei `<ScrollControls>` (which listens on
    the canvas parent below it) literally never sees the input.
    Scroll is fully blocked during loading without a single
    capture-phase listener.
  - Opaque background: a layered radial-gradient (red center glow
    â†’ near-black) over a `#050505` base. The MeshGradient + canvas
    behind are completely hidden until fade-out reveals them.
  - `visibility` is transitioned alongside `opacity` (delay-on,
    delay-off) so the loader stops eating events the instant its
    fade-out completes.
- `.spa-loader__pct`: outlined italic typography. `color: transparent`
  + `-webkit-text-stroke: 2.5px rgba(246,243,238,0.9)` +
  `paint-order: stroke fill`. Old `text-shadow` glow dropped â€” it
  fights with the hollow stroke.
- `.spa-loader__pct-sym`: explicitly resets `-webkit-text-stroke: 0`
  so the small `%` symbol stays filled â€” editorial counterpoint to
  the hollow number.

## [0.6.1] â€” loader holds for 2.5 s, scroll-lock removed

- `App.tsx`: loader now runs for a deliberate minimum of 2.5 s
  regardless of network speed. Tracked via a `timeProgress` rAF
  loop alongside `usePreloadGate`'s `gateProgress`. The displayed
  `progress` passed to LoadingScreen is the average of the two,
  so on a hot cache the bar still fills smoothly across the full
  2.5 s instead of snapping to 100 % in 50 ms. `ready` only flips
  once both gate and timer are done.
- Removed the leftover scroll/touch/keyboard capture-phase
  listeners â€” that's the only piece of the old hairline-bar
  attempt still in the file. The new LoadingScreen sits over the
  canvas with `pointer-events: none`, and on a 2.5 s budget there
  is no realistic window for the user to scroll the canvas before
  the loader fades out.

## [0.6.0] â€” proper loading screen + under-construction routes

### feat(loading): full-screen LoadingScreen replaces the hairline bar

- The old gate was just a 220 px red line under the logo â€” read as
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
  - Corner labels: "STUDIO Â· PANIC Â· ATTACK" top-left, blinking
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
  - `/` â†’ `<App />` (the real site)
  - `/projects | /highlights | /vocabulary | /about | /contact`
    â†’ `<UnderConstruction />`
  - any other path â†’ also `<UnderConstruction />` so typos /
    stale links don't 404.
- New `components/UnderConstruction/UnderConstruction.tsx`:
  fullscreen page with `codingCat.gif` (from
  `public/Under construction/codingCat.gif`), "Under construction
  :3" in display italic, a small mono sub-line, the route label
  in the top-left corner, and a "â† back to studio" button styled
  to match the nav vocabulary.
- CSS: new `Under construction page` block â€” `.spa-uc`,
  `.spa-uc__bg`, `.spa-uc__gif`, `.spa-uc__title`, `.spa-uc__sub`,
  `.spa-uc__back`, `.spa-uc__route`. Pixelated `image-rendering`
  on the gif keeps the cat crisp at scaled sizes.
- Vercel rewrites in `vercel.json` already serve `index.html` for
  all paths, so deep-links and hard reloads work in production.

## [0.5.2] â€” Featured Pieces: float quote into 3D scene

- `Highlights.tsx`: the quote ("There may be no better way to
  communicate what we doâ€¦") was wedged into a 2-col DOM grid next
  to the "Featured pieces" h2, fighting it for space. Removed it
  from the DOM layout entirely; the title block is now a single
  left-aligned column.
- New `FloatingQuote` 3D element, rendered as drei `<Text>` inside
  the Highlights `<group>`. Sits at `[0, 4.6, -3.2]` (above and
  behind the cards, in actual world space â€” scrolls in with the
  rest of the section). Cormorant Garamond italic 500 to match the
  gallery floor. Soft cream fill at 55%, faint outline for legibility
  against the cards. `maxWidth=11`, centered, line-height 1.35 â†’
  wraps to 3 readable lines.
- Subtle motion: `useFrame` lerps a pointer-parallax offset onto
  position and adds a slow `sin` drift on top. Gives the quote
  presence without competing with the cards. No CSS animation â€”
  it's purely 3D.
- Removed `.spa-highlights-quote` CSS; no longer used.

## [0.5.1] â€” gallery floor text refresh

- `Gallery.tsx`: removed the duplicate floor texts. The italic
  "Have a peek inside my brain" at `z=-4` is gone; the small
  uppercase "PROJECTS Â· GALLERY Â· 2024 â€” 2026" at `z=5` is gone.
  In their place, a single `Have a peek inside my brain` set in
  Cormorant Garamond italic 500 at `z=3`, fontSize 0.5, cream
  on the reflective floor. Loaded from
  `cdn.jsdelivr.net/.../@fontsource/cormorant-garamond` so drei
  `<Text>` (troika-three-text) can ship the glyphs as MSDF without
  needing a bundled font file.

## [0.5.0] â€” image-CDN proxy + first-paint loading gate

### perf(assets): route /landing/ images through images.weserv.nl

- 64 source files in `public/landing/` total **221 MB** â€” many PNGs are
  5â€“17 MB raw exports (e.g. `img_1034.png` 17.9 MB, `cemetery-scene1.png`
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
  `index.html` â€” same string = same browser-cache entry.
- All callsites updated:
  - `helpers/useImageAssets.ts` â€” every entry routed via `assetUrl()`
    inside the existing `L()` builder.
  - `components/ScatteredImages/ScatteredImages.tsx` â€” `.map(assetUrl)`
    over the SCATTER_IMAGES list.
  - `components/Highlights/Highlights.tsx` â€” 4 hard-coded `media:`
    paths wrapped in `assetUrl()`.
  - `index.html` â€” 4 preload links rewritten as full weserv URLs with
    `crossorigin="anonymous"` (matching three.js TextureLoader's
    default crossOrigin so the preload bytes are reusable).
- Expected post-CDN payload per image: ~150â€“250 KB instead of
  5â€“17 MB. â‰ˆ 30â€“40Ã— smaller; cold load drops from minutes to seconds.

### feat(loading): gate scroll on first-batch preload + progress line

- The hero used to mount everything at once and let the carousel
  pop-in over several seconds while CDN-cached textures arrived.
  Now scroll is blocked until the first 8 gallery portraits are in
  the browser's HTTP cache, so the gallery is fully populated the
  moment the user scrolls past the hero.
- New hook `helpers/usePreloadGate.ts` â€” DOM-side preloader that
  fires `new Image()` per URL with `crossOrigin = 'anonymous'`
  (so the cache entry is shared with three.js' subsequent GPU
  upload). Returns `{ ready, progress }`. Counts both `onload` and
  `onerror` as "done" so a single broken URL can't deadlock the
  gate. 8 s failsafe timeout â€” never blocks the user indefinitely
  on a stalled network.
- `App.tsx` â€” `useMemo`s the first 8 gallery URLs, passes them to
  `usePreloadGate`, then attaches capture-phase `wheel` /
  `touchmove` / `keydown` listeners that `preventDefault()` until
  ready. Capture phase runs before drei `<ScrollControls>`'s own
  handlers so this also stops the canvas from advancing.
- `HeroOverlay.tsx` â€” accepts `{ ready, progress }`, renders a thin
  220 px red progress line below the logo while loading, fades it
  out and reveals the "scroll to enter" prompt once ready. Single
  fixed-height slot (`.spa-hero__cta`) so the logo stays vertically
  centered through the transition.
- New CSS in `global.css`: `.spa-hero__cta`, `.spa-load-bar`,
  `.spa-load-bar__fill`, `.spa-load-bar--done`,
  `.spa-scroll-prompt--ready`. Drift animation is now only applied
  in the `--ready` state so it can't override the hidden opacity.
- On a fast connection the whole gate is over in <500 ms â€” feels
  deliberate, not annoying. On slow connections the user gets a
  truthful progress signal instead of a broken-feeling site.

### Notes / non-goals

- Logo PNG (62 KB, transparent) stays as a local PNG â€” already
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

## [0.4.2] â€” Vercel deploy: logo case fix

- `public/Logo/` â†’ `public/logo/`. The folder was tracked in git with
  a capital `L` but every code reference (`/logo/PanicAttackLogo.png`
  in `index.html`, `HeroOverlay.tsx`, `NavHeader.tsx`) used lowercase.
  Windows is case-insensitive so it worked locally; Vercel runs on
  Linux which is case-sensitive, so the logo 404'd in production and
  the browser showed a broken-image icon with the alt text.

## [0.4.1] â€” perf pass + scroll-blank bugfix

### Bugfix: scene blanked for one frame when scrolling

- `Gallery.tsx`: every time a carousel slot wrapped to a new image,
  drei's `<Image>` re-mounted with a fresh `useTexture(url)` call
  that **suspended** while the network fetch resolved. Because the
  only Suspense boundary in the tree was the top-level one in
  `App.tsx` wrapping `<Layout/>`, that local suspension blanked the
  entire 3D scene for one frame on every wrap â€” the symptom users
  reported as "everything except the background disappears for a
  split second when scrolling". Aggravated by 5â€“17 MB source PNGs
  in `/landing/` that took multiple frames to decode.
  - **Per-slot Suspense**: each carousel slot is now wrapped in its
    own `<Suspense fallback={null}>` so a still-loading texture only
    nulls *that one slot* for a frame, never the whole layout.
  - **Eager preload**: `useTexture.preload(url)` is fired for every
    gallery image on mount, so by the time any slot wraps to a fresh
    URL the texture is already resident in `THREE.Cache` and the
    render resolves synchronously â€” no fallback at all in practice.

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
  most expensive thing in the gallery â€” this reclaims real GPU.
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

## [0.4.0] â€” responsive design pass

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

- `App.tsx`: camera FOV now derives from viewport aspect â€” 70Â° on
  tall phones, 60Â° on portrait tablets, 52Â° square-ish, 42Â° default
  landscape. Resize listener updates live. Wider FOV on narrow
  aspects keeps section content from cropping horizontally.
- `GraphicDesign.tsx` and `AIArt.tsx`: the torus-knot and Hedgehog
  groups are wrapped in viewport-aware scale groups â€” `min(1,
  viewport.width / 6.4)` clamped to `>=0.55`. Sculptures shrink with
  the canvas so orbit reach + headline width fit narrow framings.

### Layout / typography

- `HeroOverlay.tsx`: logo width `clamp(220px, 70vw, 840px)` plus
  `maxWidth: 92vw` (was `clamp(380px, 56vw, 840px)` â€” overflowed
  phones <420px).
- `CategorySection.tsx`: now reads `useThree().viewport`. On
  portrait (`viewport.width / viewport.height < 1`), text and hero
  stack vertically â€” hero at local y=+1.1, text at y=âˆ’1.6, both
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

## [0.3.2] â€” pull sculptures up: torus-knot to 01, Hedgehog to 03

- Torus-knot composition (Lens + headline) moved from `ThreeDeeArt.tsx`
  back to `GraphicDesign.tsx` â€” now appears right below the gallery.
- Hedgehog moved from `UXDesign.tsx` to `AIArt.tsx` â€” appears next.
- 02 (3D Art) and 04 (UX Design) are now text-only.
- Sides preserved as registered (graphic left / threeD right / ai
  left / ux right) so visual side alternation stays intact.

## [0.3.1] â€” pull CMYK + Latent Bloom

- 01 (Graphic Design): sculpture removed, hero is empty (text only).
- 03 (AI Art): sculpture removed, hero is empty (text only).
- 02 (3D Art) torus-knot and 04 (UX Design) Hedgehog kept and unchanged.
- `helpers/sculptureEvents.ts`: dropped now-unused `cmykSnapAt` and
  `aiGlitchAt` keys; PostFx no longer reads them.
- `helpers/usePointerVelocity.ts`: removed (was only used by Latent Bloom).

## [0.3.0] â€” sculpture pass: shock-value reset for 01/03/04, torus-knot reassigned to 02

### Sculptures

- 02 (3D Art) keeps the torus-knot transmission lens + "DESIGN BEYOND
  THE TRADITIONAL FORMAT" headline. The composition was previously
  authored inside `GraphicDesign.tsx` (01); it has been relocated
  verbatim into `ThreeDeeArt.tsx` so the pairing the user was already
  seeing on screen is now the canonical one. Click â†’ `knifeSlashAt`
  event for a chromatic-aberration pulse.
- 01 (Graphic Design) replaced with **CMYK Misregistration**: three
  halftone dot screens (cyan / magenta / yellow at 15Â° / 75Â° / 0Â°)
  multiplied against a white backdrop. Each layer follows the cursor
  with a different drag factor â†’ constant misregistration. Click
  springs all three offsets to zero over ~600 ms â€” the bold "01"
  silhouette briefly resolves crisply, then drifts apart again.
  Source image is canvas-rasterised at mount. Fires `cmykSnapAt` on
  click for a soft PostFx noise pulse. Pure CMY palette â€” total
  break from paper/blood.
- 03 (AI Art) replaced with **Latent Bloom**: 5000-point cloud (1800
  on tier â‰¤ 1) hallucinating through 7 SDF-sampled silhouettes â€” eye,
  hand, butterfly, key, skull, "DREAM", bloom. All seven targets
  rasterised at mount, packed into a single (N Ã— 7) RGBA Float
  DataTexture; vertex shader morphs between two consecutive targets
  per frame. Pointer velocity multiplies morph speed (slow cursor =
  slow dream, fast cursor = manic generation). Click â†’ freezes the
  morph for ~220 ms and fires `aiGlitchAt`. Neon vaporwave palette
  (cyan â†” magenta) â€” full break from paper/blood.
- 04 (UX Design) replaced with **Hedgehog**: an InstancedMesh of 420
  cones (150 on tier â‰¤ 1) distributed via Fibonacci spiral on a unit
  sphere, each oriented along its outward surface normal. Per-instance
  recoil from the cursor â€” spikes whose direction aligns with the
  pointer collapse toward zero length, the rest stay erect. Click â†’
  250 ms global pulse extending every spike to 2Ã— length, plus a
  PostFx noise burst via `hedgehogPulseAt`. Section progress drives
  ball radius growth and slow yaw. Caution-tape yellow + ink black
  palette. Conceptual inversion â€” a UX hero that visibly refuses to
  be touched.

### Architecture

- New `helpers/sculptureEvents.ts` â€” tiny zustand store of one-shot
  click timestamps (`knifeSlashAt`, `aiGlitchAt`, `hedgehogPulseAt`,
  `cmykSnapAt`) plus a `decay(at, dur)` envelope helper. Sculptures
  fire their event on click; PostFx and the sculpture itself decay
  the timestamp into transient effects.
- New `helpers/usePointerVelocity.ts` â€” smoothed NDC pointer-velocity
  hook with EMA (fast attack, slow decay). Used by Latent Bloom to
  modulate morph speed; reusable by future sculptures.
- `PostFx` extended: ChromaticAberration (transient â€” knife slash and
  AI glitch) and Noise (transient â€” hedgehog pulse and CMYK snap)
  effects appended to the chain. Both effects are constructed
  manually via `useMemo` and inserted as `<primitive>` so per-frame
  mutation of `offset` and `blendMode.opacity.value` bypasses the
  drei wrapper's prop diffing. Effects collapse to zero between
  events â€” chain looks identical to the static base when idle.
  Tier â‰¤ 1 still bypasses the entire chain.

### Cleanup

- `Layout.tsx`: dropped unused `VIEWPORT_HEIGHT_UNITS` import.
- `Vocabulary.tsx`: dropped unused `state` parameter from `useFrame`.

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
