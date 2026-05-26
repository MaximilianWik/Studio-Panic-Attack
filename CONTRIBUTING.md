# Contributing

Thanks for your interest in Studio Panic Attack! This is a personal portfolio/art project, so contributions are handled a bit differently than a typical open-source library.

## Getting Started

```bash
npm install
npm run dev
```

Runs on Vite 6 + React 19 + React Three Fiber v9. Requires Node 18+.

## Project Structure

```
src/
├── components/
│   ├── Hero/            # Landing: mesh-gradient backdrop, logo, whiteboard grid
│   ├── Gallery/         # 3D carousel with wrapped-image box slots
│   ├── Categories/      # 01–04 sections (sculptures + text)
│   ├── Highlights/      # Featured pieces card grid
│   ├── ScatteredImages/ # Floating shader-treated images
│   ├── Loading/         # Full-screen loading experience
│   ├── Debug/           # WorldY overlay + debug labels
│   └── ...
├── config/              # Section registry, theme tokens
├── helpers/             # Zustand stores, hooks, utilities
└── styles/              # Single global.css (no CSS modules)
```

## Guidelines

### Code Style

- **No CSS modules / Tailwind** — all styles live in `src/styles/global.css`.
- **Zustand** for shared state (palette, debug, perf-override, sculpture events).
- **drei** for 3D utilities — check what's available before rolling your own.
- **No comments** unless logic is genuinely non-obvious.
- Follow existing naming: `camelCase` functions, `PascalCase` components, `UPPER_SNAKE` constants.

### Performance

- Gate expensive work (shadows, reflectors, post-fx) behind `useDeviceProfile().isLowPower`.
- Use `useSectionVisibility` to skip computation for off-screen sections.
- Avoid per-frame allocations — use module-scope scratch vectors (see `GraphicDesign.tsx`).

### Palette / Theme System

The site supports multiple background palettes (mesh-gradient colourways + a whiteboard grid mode). When adding visual elements:

- Use `useIsWhiteboard()` for 3D color decisions.
- Use `[data-spa-theme="whiteboard"]` CSS selectors for DOM styling.
- Test your changes on both GRID (whiteboard) and BLOOD (dark) palettes.

### Commits

Short imperative subject line. Body bullets if multiple things changed.

```
feat(gallery): add carousel drag-to-scroll

- Capture pointermove delta when isDrag threshold crossed
- Apply 35% of accumulated delta per frame for eased feel
```

## Pull Requests

1. Fork → branch off `main` → make changes → PR back.
2. Run `npm run build` (includes `tsc -b`) — must pass with zero errors.
3. Test on both desktop and a mobile viewport (Chrome DevTools is fine).
4. Describe what changed and why. Screenshots/recordings appreciated for visual changes.

## Issues

Use GitHub Issues for:
- Bug reports (include browser, viewport size, which palette was active)
- Feature suggestions
- Questions about the architecture

## License

This is a personal portfolio project. Contributions are welcome but the work remains under the project owner's copyright. By submitting a PR you agree your contribution is licensed under the same terms as the project.
