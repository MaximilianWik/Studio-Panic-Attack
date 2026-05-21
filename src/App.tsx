import { Canvas } from '@react-three/fiber';
import {
  ScrollControls,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
  Environment,
} from '@react-three/drei';
import { Suspense } from 'react';
import { Layout, totalPages } from './components/Layout';
import { PostFx } from './components/PostFx';
import { Cursor } from './components/Cursor';
import { useDeviceProfile } from './helpers/useMobile';
import { theme } from './config/theme';

/**
 * Application root.
 *
 * Renders a single full-viewport <Canvas>, wraps it in <ScrollControls>
 * with a damped scroll buffer matching the section registry, and overlays
 * a custom DOM cursor.
 *
 * <Environment> sits in its own Suspense boundary so a CDN failure
 * degrades to plain directional lighting instead of blanking the page.
 */
export default function App() {
  const profile = useDeviceProfile();

  return (
    <>
      <Canvas
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, profile.isLowPower ? 1.5 : 2]}
        camera={{ position: [0, 0, 8], fov: 35, near: 0.1, far: 100 }}
        eventSource={document.body}
        eventPrefix="client"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: theme.bgDeep,
        }}
      >
        <fog attach="fog" args={[theme.bgDeep, 18, 45]} />
        <color attach="background" args={[theme.bgDeep]} />

        {/* Lighting fallback — always present so the scene is not pitch
            black if the HDRI environment fails to load from drei's CDN. */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 6, 8]} intensity={0.9} />
        <directionalLight position={[-6, -3, 2]} intensity={0.35} color="#7a8aff" />

        {/* Optional HDRI on its own Suspense — degrades gracefully. */}
        <Suspense fallback={null}>
          <Environment preset="warehouse" environmentIntensity={0.5} />
        </Suspense>

        <ScrollControls
          pages={totalPages}
          damping={0.18}
          distance={1.0}
          maxSpeed={0.6}
        >
          <Layout reducedEffects={profile.reduceEffects} />
          <PostFx reduced={profile.reduceEffects} />
        </ScrollControls>

        <AdaptiveDpr pixelated={false} />
        <AdaptiveEvents />
        <Preload all />
      </Canvas>

      <Cursor />
    </>
  );
}
