import { MeshGradient } from '@paper-design/shaders-react';

import { PALETTES, usePalette } from '../../helpers/paletteStore';
import { SwissKnifeTextPath } from './SwissKnifeTextPath';
import { WhiteboardBackground } from './WhiteboardBackground';

interface HeroOverlayProps {
  /** True once the first-batch gallery textures are preloaded.
      LoadingScreen renders on top while false; logo + scroll prompt
      fade in once true. */
  ready: boolean;
}

export function HeroOverlay({ ready }: HeroOverlayProps) {
  // Subscribe to the palette index so the backdrop re-renders when
  // the user cycles palettes from the nav debug cluster.
  const paletteIdx = usePalette((s) => s.idx);
  const palette = PALETTES[paletteIdx];
  const isWhiteboard = palette.type === 'whiteboard';

  return (
    <>
      {/* Backdrop — ALWAYS visible (entire site bg).
          Whiteboard: animated canvas perspective grid.
          Mesh palettes: animated MeshGradient shader. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: isWhiteboard ? '#fafafa' : '#050505',
        }}
      >
        {isWhiteboard
          ? <WhiteboardBackground />
          : (
            <MeshGradient
              style={{ width: '100%', height: '100%' }}
              colors={palette.colors}
              distortion={0.85}
              swirl={0.42}
              speed={0.3}
              offsetX={0}
              offsetY={0}
              scale={1}
              maxPixelCount={1280 * 720}
              minPixelRatio={0.6}
            />
          )
        }
      </div>

      {/* Hero content — logo + scroll prompt, fades out as you scroll.
          Hidden until preload completes; LoadingScreen renders on top
          while !ready and fades out to reveal these. */}
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
          opacity: ready ? 'var(--spa-hero, 1)' : 0,
          transition: 'opacity 0.6s ease 0.15s',
        }}
      >
        {isWhiteboard ? (
          <SwissKnifeTextPath
            style={{
              width: 'clamp(480px, 90vmin, 1410px)',
              maxWidth: '97vw',
              aspectRatio: '662 / 636',
              height: 'auto',
              transform: 'translateY(-5vh)',
            }}
          />
        ) : (
          <img
            src="/logo/PanicAttackLogo.png"
            alt="Studio Panic Attack"
            decoding="sync"
            fetchPriority="high"
            style={{
              width: 'clamp(220px, 70vw, 840px)',
              maxWidth: '92vw',
              height: 'auto',
              filter:
                'drop-shadow(0 6px 28px rgba(10,10,10,0.55)) drop-shadow(0 1px 0 rgba(211,0,0,0.4))',
            }}
          />
        )}
        <div className={'spa-scroll-prompt' + (ready ? ' spa-scroll-prompt--ready' : '')}>
          scroll to enter
        </div>
      </div>
    </>
  );
}

export default HeroOverlay;
