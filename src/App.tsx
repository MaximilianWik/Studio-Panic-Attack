import { Canvas } from '@react-three/fiber';
import {
  ScrollControls,
  AdaptiveDpr,
  AdaptiveEvents,
} from '@react-three/drei';
import { useEffect, useState } from 'react';
import { Layout, totalPages } from './components/Layout';
import { PostFx } from './components/PostFx';
import { Cursor } from './components/Cursor';
import { useDeviceProfile } from './helpers/useMobile';
import { theme } from './config/theme';

/**
 * Application root.
 *
 * NOTE: drei <Environment> with a CDN preset is intentionally NOT used.
 * In some corporate networks the preset HDRI fails to load, leaving the
 * Suspense in a permanent pending state and producing a blank canvas.
 * Lighting is fully provided by the explicit lights below — iridescent
 * materials lose a little punch without an envmap, but the page works.
 */
export default function App() {
  const profile = useDeviceProfile();
  const [ready, setReady] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') ?? c.getContext('webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  return (
    <>
      <div className={`app-loading${ready ? ' hidden' : ''}`} aria-hidden={ready}>
        <div className="app-loading-mark" />
        <div className="app-loading-label">Studio Panic Attack</div>
      </div>

      {!hasWebGL && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            textAlign: 'center',
            color: '#1a1814',
            background: '#f5efe4',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.3em', marginBottom: 12 }}>
              STUDIO PANIC ATTACK
            </div>
            <div style={{ maxWidth: 360, fontSize: 14, color: '#5a5450' }}>
              This portfolio uses WebGL, which is disabled or unavailable in this
              browser. Try Chrome, Firefox, or Safari with hardware acceleration on.
            </div>
          </div>
        </div>
      )}

      <Canvas
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          preserveDrawingBuffer: false,
        }}
        dpr={[1, profile.isLowPower ? 1.5 : 2]}
        camera={{ position: [0, 0, 8], fov: 35, near: 0.1, far: 100 }}
        eventSource={document.body}
        eventPrefix="client"
        frameloop="always"
        onCreated={({ gl }) => {
          gl.setClearColor(theme.bg, 1);
          // Wait two frames so the scene actually paints before the loader fades.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setReady(true)),
          );
        }}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: theme.bg,
        }}
      >
        <color attach="background" args={[theme.bg]} />
        <fog attach="fog" args={[theme.bg, 22, 55]} />

        {/* Lighting (always rendered, no async deps). */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 8]} intensity={1.1} />
        <directionalLight position={[-6, -3, 2]} intensity={0.45} color="#ffd9b8" />
        <directionalLight position={[0, -4, 4]} intensity={0.3} color="#a0b4d6" />

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
      </Canvas>

      <Cursor />
    </>
  );
}
