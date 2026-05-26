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
 *          Falls back to a poster image when the video is paused.
 */

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  /** Force eager load (above-the-fold hero images). */
  eager?: boolean;
}

export function Img({ src, alt = '', eager, ...rest }: ImgProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
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
  // Poster: only used if the file actually exists. We pass it as a hint;
  // browsers handle a missing poster gracefully (just skip it).
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
      // Best-effort autoplay; ignored if browser blocks. muted attr is set.
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [visible]);

  return (
    <video
      ref={ref}
      className={className}
      style={style}
      poster={posterUrl}
      muted
      loop
      playsInline
      preload="metadata"
      {...rest}
    >
      {/* Only emit a <source> for an alt format if it was explicitly
          provided — same 404-fallback gotcha as <picture> applies. */}
      {webm ? <source src={webm} type="video/webm" /> : null}
      <source src={src} type={src.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
    </video>
  );
}
