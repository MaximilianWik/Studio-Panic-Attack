# Studio Panic Attack

- **[Studio Panic Attack](https://studio-panic-attack-maximilian.vercel.app/)** - Portfolio site built for **Ema Stoyanova;** showcasing her work in art, 3D modelling, interactive media technology, product & brand design, UX/UI, photography, projection mapping, campaigns, events, and creative projects.
- Built with React, Vite, and `@react-three/fiber`. Scroll-driven 3D scenes, custom shader treatments on portfolio imagery, and editorial typography.
## **Live at:** https://studio-panic-attack-maximilian.vercel.app/

## Tech stack

- Vite 6 + React 19 + TypeScript
- `@react-three/fiber` + `@react-three/drei` (ScrollControls, MeshTransmissionMaterial, Image)
- `@react-three/postprocessing` (bloom, chromatic aberration, vignette, noise)
- `@paper-design/shaders-react` (LiquidMetal, MeshGradient)
- GSAP for scroll-synced timelines
- Three.js

## Local development

```sh
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

```sh
npm run build      # type-check + production bundle to dist/
npm run preview    # serve the production bundle locally
npm run typecheck  # type-check only
```

## Project layout

```
src/
  App.tsx                      Canvas + ScrollControls shell
  main.tsx                     React entry
  components/
    Layout.tsx                 Section ordering + scroll page count
    Hero/                      Logo + scroll prompt + dark mesh gradient
    Gallery/                   Orbital 3D gallery ring
    Categories/                01 Graphic / 02 3D / 03 AI / 04 UX
    Highlights/                Featured pieces grid
    ScatteredImages/           Pool of imagery distributed across scroll
  shaders/                     GLSL fragment shaders (halftone, dither, paper, flute glass)
  helpers/                     Hooks (useScrollSection, useMobile, useImageAssets)
  config/                      Section metadata and theme
public/
  landing/                     Portfolio source imagery
  logo/                        Studio Panic Attack logo
```

## Deployment

Deploys as a static SPA to Vercel. `vercel.json` rewrites all paths to `index.html`. Build command `npm run build`, output `dist/`.

## Performance

Mobile and low-power devices get a reduced visual pipeline:

- Particle counts halved
- Postprocessing bloom and chromatic aberration disabled
- `MeshTransmissionMaterial` swapped for cheaper transmission glass
- Custom image shaders skipped — plain textures only

GPU tier is detected at startup via `detect-gpu`.
