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
  const { ready, progress } = usePreloadGate(preloadUrls);

  // Block scroll/touch/keyboard navigation until the first batch is ready.
  // Capture-phase listeners run before drei <ScrollControls>'s handlers,
  // so calling preventDefault here also stops the canvas from advancing.
  useEffect(() => {
    if (ready) return;
    const stop = (e: Event) => e.preventDefault();
    const stopKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (
        k === 'ArrowDown' ||
        k === 'ArrowUp' ||
        k === 'PageDown' ||
        k === 'PageUp' ||
        k === 'Home' ||
        k === 'End' ||
        k === ' '
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', stop, { capture: true, passive: false });
    window.addEventListener('touchmove', stop, { capture: true, passive: false });
    window.addEventListener('keydown', stopKey, { capture: true });
    return () => {
      window.removeEventListener('wheel', stop, { capture: true } as EventListenerOptions);
      window.removeEventListener('touchmove', stop, { capture: true } as EventListenerOptions);
      window.removeEventListener('keydown', stopKey, { capture: true } as EventListenerOptions);
    };
  }, [ready]);

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
