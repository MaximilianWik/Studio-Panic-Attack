import { MeshGradient } from '@paper-design/shaders-react';

export function HeroOverlay() {
  return (
    <>
      {/* Red mesh-gradient backdrop — ALWAYS visible (entire site bg) */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: '#050505',
        }}
      >
        <MeshGradient
          style={{ width: '100%', height: '100%' }}
          colors={['#050505', '#0a0a0a', '#1a0606', '#3a0a04', '#d30000']}
          distortion={0.85}
          swirl={0.42}
          speed={0.3}
          offsetX={0}
          offsetY={0}
          scale={1}
          maxPixelCount={1280 * 720}
          minPixelRatio={0.6}
        />
      </div>

      {/* Hero content — logo + scroll prompt, fades out as you scroll */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '32px',
          pointerEvents: 'none',
          opacity: 'var(--spa-hero, 1)',
          transition: 'opacity 0.05s linear',
        }}
      >
        <img
          src="/logo/PanicAttackLogo.png"
          alt="Studio Panic Attack"
          decoding="sync"
          fetchPriority="high"
          style={{
            width: 'clamp(220px, 70vw, 840px)',
            maxWidth: '92vw',
            height: 'auto',
            filter: 'drop-shadow(0 6px 28px rgba(10,10,10,0.55)) drop-shadow(0 1px 0 rgba(211,0,0,0.4))',
          }}
        />
        <div className="spa-scroll-prompt">scroll to enter</div>
      </div>
    </>
  );
}

export default HeroOverlay;
