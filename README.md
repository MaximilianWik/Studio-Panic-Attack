# Studio Panic Attack

- Portfolio site built for **Ema Stoyanova;** showcasing her work in art, 3D modelling, interactive media technology, product & brand design, UX/UI, photography, projection mapping, campaigns, events, and creative projects.
- Built with React, Vite, and `@react-three/fiber`. Scroll-driven 3D scenes, custom shader treatments on portfolio imagery, and editorial typography.
## **Live at:** https://studio-panic-attack-maximilian.vercel.app/


<img width="640" height="634" alt="bingus-ugly" src="https://github.com/user-attachments/assets/0e1dc33f-d1fc-442f-a525-afab8f91957a" />


## Tech stack

| Layer | Libraries |
|-------|-----------|
| Framework | Vite 6 + React 19 + TypeScript 5 |
| 3D | `@react-three/fiber` v9, `@react-three/drei` v10, Three.js r180 |
| Post-processing | `@react-three/postprocessing` v3, `postprocessing` v6 |
| Shaders | `@paper-design/shaders-react` (LiquidMetal, MeshGradient) |
| Animation | GSAP 3 (scroll-synced timelines) |
| GPU detection | `detect-gpu` v5 |
| Deployment | Vercel (static SPA) |

## Local development

```sh
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

```sh
npm run build      # type-check + production bundle to dist/
npm run preview    # serve the production bundle locally
npm run typecheck  # type-check only (no emit)
```

## Project layout

```
Studio-Panic-Attack/
├── public/
│   ├── landing/              64 portfolio source images (jpg/png/jpeg) + 3 mp4
│   ├── logo/                 PanicAttackLogo.png
│   └── Under construction/   codingCat.gif
├── scripts/
│   └── smoke.mjs             Playwright scroll smoke-test
├── src/
│   ├── main.tsx              React entry + path-based route picker
│   ├── App.tsx               Canvas + ScrollControls shell + preload gate
│   ├── components/
│   │   ├── Layout.tsx        Section ordering + scroll page count
│   │   ├── Hero/
│   │   │   ├── Hero.tsx      Mesh gradient backdrop
│   │   │   └── HeroOverlay.tsx  Logo + scroll prompt (DOM overlay)
│   │   ├── Gallery/
│   │   │   └── Gallery.tsx   Orbital 3D gallery ring + reflector floor
│   │   ├── Categories/
│   │   │   ├── CategorySection.tsx  Shared section layout (responsive)
│   │   │   ├── GraphicDesign.tsx    01 — torus-knot transmission lens
│   │   │   ├── ThreeDeeArt.tsx      02 — text-only
│   │   │   ├── AIArt.tsx            03 — Hedgehog instanced cones
│   │   │   └── UXDesign.tsx         04 — text-only
│   │   ├── Highlights/
│   │   │   └── Highlights.tsx       Featured pieces grid + floating quote
│   │   ├── ScatteredImages/
│   │   │   ├── ScatteredImages.tsx  Image planes distributed across scroll
│   │   │   └── ImageEffects.tsx     Per-image shader material
│   │   ├── Vocabulary/
│   │   │   ├── Vocabulary.tsx       Swiss-knife SVG + vocab list
│   │   │   └── knifePathD.ts        16k SVG path data
│   │   ├── Loading/
│   │   │   └── LoadingScreen.tsx    Fullscreen loader (% counter + phrases)
│   │   ├── UnderConstruction/
│   │   │   └── UnderConstruction.tsx  Placeholder for unbuilt routes
│   │   ├── Cursor.tsx         Custom red dot cursor (desktop only)
│   │   ├── ErrorBoundary.tsx  React error boundary with fallback UI
│   │   ├── Lightbox.tsx       Click-to-enlarge image modal
│   │   ├── NavHeader.tsx      Fixed glass-blur nav + mobile hamburger
│   │   ├── PostFx.tsx         Post-processing chain (bloom, CA, vignette)
│   │   └── ScrollBridge.tsx   Exposes drei scroll el to window.__spaScrollEl
│   ├── shaders/
│   │   └── imageShaders.ts   GLSL fragments (halftone, dither, paper, glass, metal)
│   ├── helpers/
│   │   ├── assetUrl.ts        CDN proxy builder (images.weserv.nl in prod)
│   │   ├── lightbox.ts        Open/close/subscribe pubsub
│   │   ├── sculptureEvents.ts Zustand store for one-shot click timestamps
│   │   ├── useDeviceProfile.ts  GPU tier detection hook
│   │   ├── useImageAssets.ts    Gallery image URL registry
│   │   ├── usePreloadGate.ts    DOM-side Image() preloader (ready + progress)
│   │   ├── useScrollSection.ts  Per-section scroll progress hook
│   │   └── useScrollVelocity.ts Smoothed scroll velocity hook
│   ├── config/
│   │   ├── sections.ts       Section registry (IDs, lengths, world-Y layout)
│   │   └── theme.ts          Colour tokens (ink, paper, bone, blood, rust, smoke)
│   └── styles/
│       └── global.css         All CSS (reset, components, responsive breakpoints)
├── index.html                 Entry HTML + font preloads + CDN image preloads
├── package.json
├── tsconfig.json              Project references (app + node)
├── tsconfig.app.json          App source config (ES2022, React JSX)
├── tsconfig.node.json         Node scripts config
├── vite.config.ts             React plugin + manual chunks + asset config
├── vercel.json                SPA catch-all rewrite
├── CHANGELOG.md
└── README.md
```

## Architecture

### Scroll system

The site uses drei `<ScrollControls>` with a configurable number of pages (currently 7.1). Each section registers its scroll range in `config/sections.ts`. The `useScrollSection(id)` hook returns a normalised 0→1 progress value for any component to animate against.

### Routing

No router dependency. `main.tsx` reads `window.location.pathname` once at boot:
- `/` → renders `<App />` (the real site)
- `/projects`, `/highlights`, `/vocabulary`, `/about`, `/contact` → `<UnderConstruction />`
- Any other path → `<UnderConstruction />` (graceful 404)

Vercel rewrites all paths to `index.html`, so deep-links and hard reloads work.

### Asset pipeline

Source images in `public/landing/` total ~221 MB raw. In production, all image URLs are rewritten through `images.weserv.nl` (free image CDN) at 2000px wide, WebP, q82. This drops per-image payload from 5–17 MB to ~150–250 KB.

The `assetUrl()` helper handles this transparently — returns local paths in dev, CDN URLs in prod.

### Loading gate

On first visit, scroll is blocked until the first 8 gallery portraits are in the browser cache. A fullscreen `LoadingScreen` displays a smoothly-lerped percentage counter and cycling phrases. Minimum display time: 2.5s (so the loader reads as intentional on fast connections).

### Performance tiers

GPU tier is detected at startup via `detect-gpu`. Tier ≤ 1 devices get:
- Particle counts halved
- Postprocessing bloom and chromatic aberration disabled
- `MeshTransmissionMaterial` swapped for cheaper transmission glass
- Custom image shaders skipped — plain textures only
- Gallery reflector resolution halved, blur disabled

### Build output

Vite produces manually-chunked output for optimal caching:
- `three` — Three.js core
- `r3f` — @react-three/fiber + drei
- `post` — postprocessing
- `shaders` — @paper-design/shaders-react

## Deployment

Deploys as a static SPA to Vercel. Build command: `npm run build`, output dir: `dist/`.

The `vercel.json` catch-all rewrite ensures client-side routing works for all paths.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | `tsc -b && vite build` — type-check then bundle |
| `npm run preview` | Serve production bundle locally |
| `npm run typecheck` | Type-check only (`tsc -b --noEmit`) |

### Smoke test

`scripts/smoke.mjs` — Playwright-based scroll smoke test. Launches headless Chromium, navigates to localhost:5173, screenshots 5 scroll positions, and logs scroll container state. Requires `playwright` installed separately.
