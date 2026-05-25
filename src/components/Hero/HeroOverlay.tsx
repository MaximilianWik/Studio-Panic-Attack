import { MeshGradient } from '@paper-design/shaders-react';

import { PALETTES, usePalette } from '../../helpers/paletteStore';

interface HeroOverlayProps {
  /** True once the first-batch gallery textures are preloaded.
      LoadingScreen renders on top while false; logo + scroll prompt
      fade in once true. */
  ready: boolean;
}

/**
 * SVG tile for the whiteboard cross-grid background.
 * 48×48 px: faint grid lines at the top/left edges, a `+` cross
 * at the centre. Tiles seamlessly to produce the classic online-
 * whiteboard / design-tool grid pattern.
 */
const WHITEBOARD_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E" +
  "%3Cline x1='0' y1='0' x2='48' y2='0' stroke='%23d4d4d4' stroke-width='0.5'/%3E" +
  "%3Cline x1='0' y1='0' x2='0' y2='48' stroke='%23d4d4d4' stroke-width='0.5'/%3E" +
  "%3Cline x1='24' y1='16' x2='24' y2='32' stroke='%23a8a8a8' stroke-width='1.5'/%3E" +
  "%3Cline x1='16' y1='24' x2='32' y2='24' stroke='%23a8a8a8' stroke-width='1.5'/%3E" +
  "%3C/svg%3E\")";

export function HeroOverlay({ ready }: HeroOverlayProps) {
  // Subscribe to the palette index so the backdrop re-renders when
  // the user cycles palettes from the nav debug cluster.
  const paletteIdx = usePalette((s) => s.idx);
  const palette = PALETTES[paletteIdx];
  const isWhiteboard = palette.type === 'whiteboard';

  return (
    <>
      {/* Backdrop — ALWAYS visible (entire site bg).
          Whiteboard: CSS cross-grid on a light field.
          Mesh palettes: animated MeshGradient shader. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: isWhiteboard ? '#fafafa' : '#050505',
          ...(isWhiteboard
            ? { backgroundImage: WHITEBOARD_TILE, backgroundSize: '48px 48px' }
            : {}),
        }}
      >
        {!isWhiteboard && (
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
        )}
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
        <div className={'spa-scroll-prompt' + (ready ? ' spa-scroll-prompt--ready' : '')}>
          scroll to enter
        </div>
      </div>
    </>
  );
}

export default HeroOverlay;
