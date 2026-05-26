import { useEffect, useState } from 'react';
import { closeLightbox, subscribeLightbox } from '../helpers/lightbox';

/**
 * Lightbox — renders the currently-open lightbox URL as either an image or
 * a video. Detected from the URL extension. Videos render with native
 * <video controls> and autoplay muted; an `onError` listener swaps in a
 * "can't play" panel with a download link if the browser refuses the codec
 * (typical on Chrome/Windows for HEVC `.mov` files).
 */
const VID_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function isVideoUrl(url: string): boolean {
  return VID_RE.test(url);
}

export function Lightbox() {
  const [url, setUrl] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    return subscribeLightbox((u) => {
      setUrl(u);
      setVideoFailed(false); // reset on every open
    });
  }, []);

  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url]);

  if (!url) return null;

  const filename = url.split('/').pop() ?? '';
  const caption = decodeURIComponent(filename.replace(/\.[a-z0-9]+$/i, ''));
  const isVideo = isVideoUrl(url);

  return (
    <div
      className="spa-lightbox"
      onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
    >
      {isVideo ? (
        videoFailed ? (
          <div className="spa-lightbox__error">
            <p>Sorry — your browser can&rsquo;t play this video format.</p>
            <p className="spa-lightbox__error-sub">It&rsquo;s likely a HEVC-encoded QuickTime file. Download it to view in QuickTime / VLC.</p>
            <a className="spa-lightbox__dl" href={url} download>Download {decodeURIComponent(filename)}</a>
          </div>
        ) : (
          <video
            className="spa-lightbox__vid"
            src={url}
            controls
            autoPlay
            playsInline
            onError={() => setVideoFailed(true)}
          />
        )
      ) : (
        <img className="spa-lightbox__img" src={url} alt="" decoding="async" fetchPriority="high" />
      )}
      <button className="spa-lightbox__close" onClick={closeLightbox} aria-label="Close">×</button>
      <div className="spa-lightbox__caption">{caption}</div>
    </div>
  );
}

export default Lightbox;
