import { MeshGradient } from '@paper-design/shaders-react';

interface HeroOverlayProps {
  /** True once the first-batch gallery textures are preloaded. */
  ready: boolean;
  /** Preload progress 0..1 — drives the loading bar width. */
  progress: number;
}

export function HeroOverlay({ ready, progress }: HeroOverlayProps) {
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

        {/* Below the logo: either a thin progress line (preloading) or
            the scroll prompt (ready). Single fixed-height slot so the
            logo stays vertically centered through the transition. */}
        <div className="spa-hero__cta">
          <div
            className={'spa-load-bar' + (ready ? ' spa-load-bar--done' : '')}
            aria-hidden
          >
            <div
              className="spa-load-bar__fill"
              style={{ transform: 'scaleX(' + progress.toFixed(3) + ')' }}
            />
          </div>
          <div
            className={'spa-scroll-prompt' + (ready ? ' spa-scroll-prompt--ready' : '')}
          >
            scroll to enter
          </div>
        </div>
      </div>
    </>
  );
}

export default HeroOverlay;
