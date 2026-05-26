import { useEffect, useRef, useState } from 'react';

/**
 * Tiny media helpers shared by the whiteboard pages.
 *
 * <Img>  — lazy <img> wrapper with sensible defaults (decoding=async,
 *          loading=lazy, draggable=false). Adds eager preload for
 *          above-the-fold use via the `eager` prop.
 *
 *          NOTE: an earlier version emitted <picture><source srcSet=*.webp>
 *          but browsers do NOT fall back to the <img> child if the picked
 *          <source> 404s — they just show the broken-image icon. Until the
 *          asset-optimization pass actually produces sibling .webp files,
 *          we ship a plain <img>. Reintroduce <picture> later by reading
 *          a manifest of known-optimized URLs.
 *
 * <Vid>   — autoplay-on-visible muted-loop video. Uses an IntersectionObserver
 *          so we only stream bytes when the user actually scrolls onto it.
 *          Shows a film-strip placeholder until the video has loaded data,
 *          so unsupported formats (e.g. MOV on Chrome/Windows) show a clear
 *          "video" indicator instead of a solid black box.
 */

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  /** Force eager load (above-the-fold hero images). */
  eager?: boolean;
}

export function Img({ src, alt = '', eager, onError, ...rest }: ImgProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={(e) => {
        const img = e.currentTarget;
        img.dataset.failed = '1';
        // eslint-disable-next-line no-console
        console.warn('[Img] failed:', src);
        if (onError) onError(e);
      }}
      {...rest}
    />
  );
}

interface VidProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  /** Optional poster (defaults to swapping ext for .poster.jpg). */
  poster?: string;
  /** Optional .webm sibling — only emitted as <source> when explicitly passed. */
  webm?: string;
}

function derivePoster(src: string): string {
  return src.replace(/\.[a-zA-Z0-9]+(?=\?|#|$)/, '.poster.jpg');
}

export function Vid({ src, poster, webm, className, style, ...rest }: VidProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [hasData, setHasData] = useState(false);
  const posterUrl = poster ?? derivePoster(src);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setVisible(e.isIntersecting);
      },
      { rootMargin: '200px 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (visible) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [visible]);

  return (
    <div className={'spa-vid-wrap' + (className ? ' ' + className : '')} style={style}>
      {!hasData && (
        <div className="spa-vid-wrap__placeholder" aria-hidden>
          <svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="10" width="40" height="28" rx="2" />
            <rect x="4" y="10" width="6" height="7" />
            <rect x="4" y="31" width="6" height="7" />
            <rect x="38" y="10" width="6" height="7" />
            <rect x="38" y="31" width="6" height="7" />
            <polygon points="20,17 20,31 34,24" fill="currentColor" stroke="none" />
          </svg>
          <span>video</span>
        </div>
      )}
      <video
        ref={ref}
        poster={posterUrl}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setHasData(true)}
        onCanPlay={() => setHasData(true)}
        {...rest}
      >
        {webm ? <source src={webm} type="video/webm" /> : null}
        <source src={src} type={
          src.toLowerCase().endsWith('.webm') ? 'video/webm' :
          src.toLowerCase().endsWith('.mov') ? 'video/quicktime' :
          'video/mp4'
        } />
      </video>
    </div>
  );
}
