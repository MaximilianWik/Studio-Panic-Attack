import { Canvas } from '@react-three/fiber';
import { ScrollControls, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { Suspense } from 'react';

import { TOTAL_PAGES } from './config/sections';
import Layout from './components/Layout';
import PostFx from './components/PostFx';
import Cursor from './components/Cursor';
import ErrorBoundary from './components/ErrorBoundary';
import HeroOverlay from './components/Hero/HeroOverlay';
import NavHeader from './components/NavHeader';
import ScrollBridge from './components/ScrollBridge';
import Lightbox from './components/Lightbox';
import { useDeviceProfile } from './helpers/useDeviceProfile';

export function App() {
  const profile = useDeviceProfile();
  const dpr: [number, number] = profile.isLowPower ? [0.85, 1.1] : [1, 1.6];

  return (
    <ErrorBoundary>
      <HeroOverlay />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
        <Canvas
          dpr={dpr}
          gl={{ antialias: !profile.isLowPower, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true, premultipliedAlpha: true }}
          camera={{ position: [0, 0, 6], fov: 42, near: 0.1, far: 100 }}
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
    </ErrorBoundary>
  );
}

export default App;
