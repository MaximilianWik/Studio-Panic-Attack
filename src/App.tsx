import { Canvas } from '@react-three/fiber';
import { ScrollControls, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { TOTAL_PAGES } from './config/sections';
import Layout from './components/Layout';
import PostFx from './components/PostFx';
import Cursor from './components/Cursor';
import ErrorBoundary from './components/ErrorBoundary';
import HeroOverlay from './components/Hero/HeroOverlay';
import LoadingScreen from './components/Loading/LoadingScreen';
import NavHeader from './components/NavHeader';
import ScrollBridge from './components/ScrollBridge';
import Lightbox from './components/Lightbox';
import { useDeviceProfile } from './helpers/useDeviceProfile';
import { assets } from './helpers/useImageAssets';
import { usePreloadGate } from './helpers/usePreloadGate';
import { useIsWhiteboard } from './helpers/paletteStore';

/**
 * Track viewport aspect with a resize listener so the camera can pick a
 * wider FOV on portrait/narrow devices. Without this, fixed fov=42° crops
 * the section content on phone-shaped viewports.
 */
function useViewportAspect() {
  const [aspect, setAspect] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.6,
  );
  useEffect(() => {
    const onResize = () => setAspect(window.innerWidth / window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return aspect;
}

function chooseFov(aspect: number): number {
  if (aspect < 0.7) return 70;   // tall phone
  if (aspect < 1.0) return 60;   // portrait tablet
  if (aspect < 1.3) return 52;   // square-ish
  return 42;                     // landscape default
}

export function App() {
  const profile = useDeviceProfile();
  const aspect = useViewportAspect();
  const fov = chooseFov(aspect);
  const dpr: [number, number] = profile.isLowPower ? [0.85, 1.1] : [1, 1.6];

  // Sync whiteboard palette state to a body data attribute so all
  // DOM components can theme themselves with pure CSS selectors.
  const isWhiteboard = useIsWhiteboard();
  useEffect(() => {
    document.body.dataset.spaTheme = isWhiteboard ? 'whiteboard' : '';
  }, [isWhiteboard]);

  // Pre-warm the first batch of gallery textures so the carousel is
  // populated by the time the user scrolls past the hero. Limited to the
  // first 8 gallery URLs — enough to cover what's visible on entry.
  const preloadUrls = useMemo(
    () =>
      assets
        .filter((a) => a.affinity === 'gallery' && a.kind === 'image')
        .slice(0, 8)
        .map((a) => a.url),
    [],
  );
  const { ready: gateReady, progress: gateProgress } = usePreloadGate(preloadUrls);

  // Loader runs for a deliberate minimum of 2.5 s regardless of how
  // fast the network finishes — the entry experience is part of the
  // brand, not just a stall while we wait for bytes. `timeProgress`
  // is the share of that 2.5 s elapsed; combined with `gateProgress`
  // it drives the percentage counter so the bar fills smoothly even
  // when the cache hits instantly.
  const MIN_LOADER_MS = 2500;
  const [timeProgress, setTimeProgress] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / MIN_LOADER_MS);
      setTimeProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ready = gateReady && timeProgress >= 1;
  // Average the two signals so the bar tracks the slower of the
  // network or the minimum-display clock — neither alone can race
  // the counter to 100 %.
  const progress = (gateProgress + timeProgress) / 2;

  return (
    <ErrorBoundary>
      <HeroOverlay ready={ready} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
        <Canvas
          dpr={dpr}
          gl={{ antialias: !profile.isLowPower, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true, premultipliedAlpha: true }}
          camera={{ position: [0, 0, 6], fov, near: 0.1, far: 100 }}
        >
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <ScrollControls pages={TOTAL_PAGES} damping={0.18} distance={1} maxSpeed={1.2}>
            <ScrollBridge />
            <Suspense fallback={null}>
              <Layout />
            </Suspense>
            <PostFx />
          </ScrollControls>
        </Canvas>
      </div>
      <NavHeader />
      <Cursor />
      <Lightbox />
      <LoadingScreen progress={progress} ready={ready} />
    </ErrorBoundary>
  );
}

export default App;
