import { Canvas } from '@react-three/fiber';
import {
  ScrollControls,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
  Environment,
} from '@react-three/drei';
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
 * `eventSource` is bound to the document body so pointer events from the
 * HTML overlays (drei <Html />) still drive the scene's interactive
 * components. `eventPrefix="client"` keeps coordinates relative to the
 * viewport rather than the (transformed) canvas.
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
        <color attach="background" args={[theme.bgDeep]} />
        <fog attach="fog" args={[theme.bgDeep, 14, 40]} />

        {/* Lighting + environment for the iridescent / metal materials */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 8]} intensity={0.6} />
        <directionalLight position={[-6, -3, 2]} intensity={0.25} color="#7a8aff" />
        <Environment preset="warehouse" environmentIntensity={0.5} />

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
