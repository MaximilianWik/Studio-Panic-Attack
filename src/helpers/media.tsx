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

/**
 * Pull a single frame out of a video as a jpeg data-URL.
 *
 * Strategy: load a hidden <video> at preload="metadata", seek to the early
 * portion (avoid black opening frames), draw the frame to a canvas, read it
 * back as a data-URL. Only kicks off when `enabled` is true so we can gate
 * the network cost behind an IntersectionObserver.
 *
 * Bails out gracefully when:
 * - the codec can't be decoded (HEVC MOV in Chrome/Windows)
 * - the canvas is tainted (cross-origin without CORS)
 * - the video doesn't reach the seeked state within 8 seconds
 *
 * Same-origin assets in /public are decoded without CORS issues; the
 * canvas isn't tainted so toDataURL works.
 */
function useVideoThumbnail(src: string, enabled: boolean): { thumb: string | null; tried: boolean } {
  const [thumb, setThumb] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (thumb) return;
    let cancelled = false;
    let cleanedUp = false;
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      try {
        video.removeAttribute('src');
        video.load();
      } catch { /* ignore */ }
    };

    const captureFrame = () => {
      if (cancelled || cleanedUp) return;
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) { cleanup(); setTried(true); return; }
        const scale = Math.min(1, 480 / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { cleanup(); setTried(true); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setThumb(dataUrl);
      } catch {
        // codec / tainted canvas
      }
      setTried(true);
      cleanup();
    };

    video.addEventListener('loadedmetadata', () => {
      if (cancelled || cleanedUp) return;
      const target = Math.min(0.5, (video.duration || 0) * 0.1);
      try {
        video.currentTime = Number.isFinite(target) ? target : 0;
      } catch {
        captureFrame();
      }
    });
    video.addEventListener('seeked', captureFrame);
    video.addEventListener('error', () => {
      if (!cancelled) setTried(true);
      cleanup();
    });

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setTried(true);
      cleanup();
    }, 8000);

    video.src = src;

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cleanup();
    };
    // We deliberately want this to run when src/enabled change, but
    // not when `thumb` updates (we'd loop). Lint exhaustive-deps is
    // ok with that since `thumb` is read but not in deps array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, enabled]);

  return { thumb, tried };
}

export function Vid({ src, poster, webm, className, style, ...rest }: VidProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hasData, setHasData] = useState(false);

  // .mov files (QuickTime/HEVC) usually can't auto-decode in Chrome on
  // Windows. Skip autoplay + metadata preload for the visible video, but
  // still attempt thumbnail capture so the polaroid shows a real frame
  // when possible. The user clicks the polaroid to open the Lightbox
  // with a real <video controls> element.
  const isMov = /\.mov(\?|#|$)/i.test(src);

  // IntersectionObserver: on the wrapper so we can fire it for MOV too
  // (without having to give the inert <video> an IO observer).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setVisible(e.isIntersecting);
      },
      { rootMargin: '300px 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Capture thumbnail when the wrapper enters viewport.
  const { thumb, tried } = useVideoThumbnail(src, visible);

  // Autoplay only for non-MOV when visible.
  useEffect(() => {
    if (isMov) return;
    const v = ref.current;
    if (!v) return;
    if (visible) void v.play().catch(() => {});
    else v.pause();
  }, [visible, isMov]);

  // The visible video gets the captured thumbnail as its poster (if we
  // got one), falling back to the .poster.jpg sibling if none. Once the
  // video itself has data, the browser swaps the poster out automatically.
  const posterUrl = thumb ?? poster ?? derivePoster(src);

  // Show placeholder if neither the video nor the thumbnail has produced
  // visible content. For MOV we trust the thumbnail or fall back to the
  // film-strip placeholder.
  const showPlaceholder = !hasData && !thumb;

  return (
    <div ref={wrapRef} className={'spa-vid-wrap' + (className ? ' ' + className : '')} style={style}>
      {showPlaceholder && (
        <div className="spa-vid-wrap__placeholder" aria-hidden>
          <svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="10" width="40" height="28" rx="2" />
            <rect x="4" y="10" width="6" height="7" />
            <rect x="4" y="31" width="6" height="7" />
            <rect x="38" y="10" width="6" height="7" />
            <rect x="38" y="31" width="6" height="7" />
            <polygon points="20,17 20,31 34,24" fill="currentColor" stroke="none" />
          </svg>
          <span>{isMov ? (tried ? 'click to play' : 'loading…') : 'video'}</span>
        </div>
      )}
      {/* When we have a thumbnail and the video isn't auto-playing
          (MOV case), render the thumb as an <img> overlay — much faster
          than waiting for the <video> to render its poster. */}
      {thumb && isMov && (
        <img
          className="spa-vid-wrap__thumb"
          src={thumb}
          alt=""
          aria-hidden
          decoding="async"
        />
      )}
      <video
        ref={ref}
        poster={posterUrl}
        muted
        loop
        playsInline
        preload={isMov ? 'none' : 'metadata'}
        onLoadedData={() => setHasData(true)}
        onCanPlay={() => setHasData(true)}
        {...rest}
      >
        {webm ? <source src={webm} type="video/webm" /> : null}
        <source src={src} type={
          src.toLowerCase().endsWith('.webm') ? 'video/webm' :
          isMov ? 'video/quicktime' :
          'video/mp4'
        } />
      </video>
    </div>
  );
}
