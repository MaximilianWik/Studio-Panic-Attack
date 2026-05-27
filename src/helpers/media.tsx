import { useEffect, useRef, useState } from 'react';

/**
 * Tiny media helpers shared by the whiteboard pages.
 *
 * <Img>  — responsive lazy image. Accepts manifest-derived `webpSrcset`,
 *          `avifSrcset`, and `lqip` to render a real <picture> with srcset,
 *          a tiny blurred LQIP painted as background, and an
 *          IntersectionObserver gate that prevents the heavy decode
 *          until the image is near the viewport. Falls through to a plain
 *          <img> when no optimized siblings exist (e.g. before the asset
 *          optimizer has been run).
 *
 * <Vid>   — autoplay-on-visible muted-loop video. Uses an IntersectionObserver
 *          so we only stream bytes when the user actually scrolls onto it.
 *          Shows a film-strip placeholder until the video has loaded data,
 *          so unsupported formats (e.g. MOV on Chrome/Windows) show a clear
 *          "video" indicator instead of a solid black box.
 */

/**
 * Hint to the runtime about how aggressive we should be about loading.
 *  - 'active'    : on the currently-active board → load now, fetchpriority auto.
 *  - 'neighbour' : adjacent (hydrated) board     → IO-gated, low priority,
 *                                                  bigger margin so it's ready
 *                                                  by the time the user snaps.
 *  - 'idle'      : everything else → IO-gated, low priority, conservative margin.
 */
export type LoadPriority = 'active' | 'neighbour' | 'idle';

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  /** Force eager load (above-the-fold hero images). */
  eager?: boolean;
  /** Comma-separated WebP srcset like "url 480w, url 1080w". */
  webpSrcset?: string;
  /** Comma-separated AVIF srcset (typically a single 1080w entry). */
  avifSrcset?: string;
  /** Tiny base64 data-URL placeholder shown until the real image decodes. */
  lqip?: string;
  /** Standard <img sizes> attribute. */
  sizes?: string;
  /** How aggressive to be about loading. Defaults to 'active'. */
  priority?: LoadPriority;
}

const DEFAULT_SIZES = '(max-width: 600px) 50vw, 25vw';

function rootMarginFor(priority: LoadPriority): string {
  switch (priority) {
    case 'active':    return '600px 0px';
    case 'neighbour': return '300px 0px';
    case 'idle':      return '100px 0px';
  }
}

function fetchPriorityFor(priority: LoadPriority): 'auto' | 'low' {
  return priority === 'active' ? 'auto' : 'low';
}

export function Img({
  src,
  alt = '',
  eager,
  webpSrcset,
  avifSrcset,
  lqip,
  sizes = DEFAULT_SIZES,
  priority = 'active',
  className,
  style,
  onError,
  onLoad,
  ...rest
}: ImgProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  // Eager bypass: skip IO entirely for above-the-fold heroes.
  const [inView, setInView] = useState<boolean>(eager === true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (eager) return;
    if (inView) return;
    const el = wrapRef.current;
    if (!el) return;
    // Older Safari fallback — IO has been universal for years but cheap to guard.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: rootMarginFor(priority), threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, priority, inView]);

  const hasOptimized = Boolean(webpSrcset || avifSrcset);

  // Compose wrapper style with LQIP background + crossfade.
  const wrapStyle: React.CSSProperties = {
    ...(style || {}),
    ...(lqip
      ? {
          backgroundImage: `url("${lqip}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : null),
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.dataset.failed = '1';
    // eslint-disable-next-line no-console
    console.warn('[Img] failed:', src);
    onError?.(e);
  };

  // The actual <img> markup — shared between the optimized and fallback paths.
  // Until inView, render a 1x1 transparent gif so the browser doesn't fetch
  // the original. The wrapper still paints the LQIP background.
  const TRANSPARENT =
    'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  const imgEl = (
    <img
      src={inView ? src : TRANSPARENT}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      // @ts-expect-error fetchpriority is valid HTML, types lag.
      fetchpriority={fetchPriorityFor(priority)}
      className={
        'spa-img__el' +
        (loaded ? ' is-loaded' : '') +
        (className ? ' ' + className : '')
      }
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );

  return (
    <span
      ref={wrapRef}
      className={'spa-img' + (loaded ? ' is-loaded' : '') + (lqip ? ' has-lqip' : '')}
      style={wrapStyle}
    >
      {hasOptimized && inView ? (
        <picture>
          {avifSrcset ? (
            <source type="image/avif" srcSet={avifSrcset} sizes={sizes} />
          ) : null}
          {webpSrcset ? (
            <source type="image/webp" srcSet={webpSrcset} sizes={sizes} />
          ) : null}
          {imgEl}
        </picture>
      ) : (
        imgEl
      )}
    </span>
  );
}

interface VidProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  /** Optional poster (defaults to swapping ext for .poster.jpg). */
  poster?: string;
  /** Optional .webm sibling — only emitted as <source> when explicitly passed. */
  webm?: string;
  /** Loading priority — neighbour boards skip preload entirely. */
  priority?: LoadPriority;
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

export function Vid({ src, poster, webm, className, style, priority = 'active', ...rest }: VidProps) {
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

  // Capture thumbnail when the wrapper enters viewport AND the board is
  // active or a neighbour. Off-board (priority='idle') we skip the thumbnail
  // altogether — the placeholder is shown instead until the user snaps to
  // the board.
  const thumbEnabled = visible && priority !== 'idle';
  const { thumb, tried } = useVideoThumbnail(src, thumbEnabled);

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

  // preload strategy:
  //   active   — 'metadata' so the video is ready to play when scrolled in
  //   neighbour— 'metadata' too: user is one snap away
  //   idle     — 'none': don't speculatively fetch range-0 of off-screen videos
  //   MOV      — always 'none' (auto-decode is unreliable)
  const preloadStrategy: 'none' | 'metadata' =
    isMov || priority === 'idle' ? 'none' : 'metadata';

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
        preload={preloadStrategy}
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
