import { MeshGradient } from '@paper-design/shaders-react';

/**
 * Pure-DOM hero overlay. Two layers:
 *   - a paper-design `MeshGradient` filling the viewport in ink+blood
 *     tones, drifting slowly;
 *   - the brand mark + scroll prompt, fading out as scroll leaves the
 *     hero (controlled by the `--spa-hero` CSS var written by
 *     ScrollBridge each frame).
 *
 * Sits BEHIND the canvas (z-index 0). Canvas runs alpha:true so this
 * shows through. Fully painted at first frame — no skeleton, no loader.
 */

export function HeroOverlay() {
  return (
    <>
      {/* Persistent ink-toned mesh gradient backdrop. Lives at z-index 0
          for the entire scroll, slowly drifting. Visible everywhere a
          gap in the WebGL fill shows through. */}
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
          minPixelRatio={0.7}
        />
      </div>

      {/* Brand mark — DOM. Fades out as scroll passes 8%. */}
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
          gap: '36px',
          pointerEvents: 'none',
          opacity: 'var(--spa-hero, 1)',
          transition: 'opacity 0.05s linear',
        }}
      >
        <div className="spa-brand">
          <span className="spa-brand__tag">Studio · Panic · Attack</span>
          <span className="spa-brand__name">EMA STOYANOVA</span>
          <span className="spa-brand__sub">
            Interactive · Visual · Experimental
          </span>
        </div>
        <div className="spa-scroll-prompt">scroll to enter</div>
      </div>
    </>
  );
}

export default HeroOverlay;
