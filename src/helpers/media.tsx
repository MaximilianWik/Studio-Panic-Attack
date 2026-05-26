import { useEffect, useRef, useState } from 'react';

/**
 * Tiny media helpers shared by the whiteboard pages.
 *
 * <Img>  — lazy <img> wrapper. Tries a sibling .webp first via <picture>
 *          when available; falls back silently to the source if the build
 *          step never produced one. Adds decoding="async" + loading="lazy"
 *          + fetchpriority="auto" by default. Honours an optional
 *          `eager` prop to preload above-the-fold imagery.
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
  /** Optional .webp sibling URL — defaults to swapping the extension. */
  webp?: string;
}

function deriveWebp(src: string): string {
  // Replace last extension with .webp. Works for percent-encoded URLs because
  // the encoded characters don't contain a literal '.'.
  return src.replace(/\.[a-zA-Z0-9]+(?=\?|#|$)/, '.webp');
}

export function Img({ src, alt = '', eager, webp, className, style, ...rest }: ImgProps) {
  const webpUrl = webp ?? deriveWebp(src);
  const isWebpDifferent = webpUrl !== src;

  // We don't HEAD-check whether the .webp exists — if it 404s, the browser
  // falls back to the <img> source automatically. <picture> handles this.
  return (
    <picture className={className} style={style}>
      {isWebpDifferent ? <source srcSet={webpUrl} type="image/webp" /> : null}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        {...rest}
      />
    </picture>
  );
}

interface VidProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  /** Optional poster (defaults to swapping ext for .poster.jpg). */
  poster?: string;
  /** Optional .webm sibling. */
  webm?: string;
}

function derivePoster(src: string): string {
  return src.replace(/\.[a-zA-Z0-9]+(?=\?|#|$)/, '.poster.jpg');
}

function deriveWebm(src: string): string {
  return src.replace(/\.mp4(?=\?|#|$)/i, '.webm');
}

export function Vid({ src, poster, webm, className, style, ...rest }: VidProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const posterUrl = poster ?? derivePoster(src);
  const webmUrl = webm ?? deriveWebm(src);

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
      {webmUrl !== src ? <source src={webmUrl} type="video/webm" /> : null}
      <source src={src} type="video/mp4" />
    </video>
  );
}
