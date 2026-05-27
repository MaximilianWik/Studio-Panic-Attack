import { useEffect, useState } from 'react';
import { closeLightbox, subscribeLightbox, type LightboxState } from '../helpers/lightbox';
import { projectFromUrl, type ProjectLink } from '../helpers/projectFromUrl';

/**
 * Lightbox — renders the currently-open lightbox URL as either an image or
 * a video. Detected from the URL extension. Videos render with native
 * <video controls> and autoplay muted; an `onError` listener swaps in a
 * "can't play" panel with a download link if the browser refuses the codec
 * (typical on Chrome/Windows for HEVC `.mov` files).
 *
 * The "View project" pill is rendered when the open URL maps to a known
 * project. Resolution order:
 *   1. Explicit caller-supplied `meta.projectSlug` (used for /landing/*
 *      home-page imagery whose project affiliation lives in code).
 *   2. URL-based fallback via `projectFromUrl()` (used for /2. Projects/...
 *      assets that already encode their folder in the path).
 */
const VID_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function isVideoUrl(url: string): boolean {
  return VID_RE.test(url);
}

export function Lightbox() {
  const [state, setState] = useState<LightboxState | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    return subscribeLightbox((s) => {
      setState(s);
      setVideoFailed(false); // reset on every open
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  if (!state) return null;
  const { url, meta } = state;

  const filename = url.split('/').pop() ?? '';
  const caption = decodeURIComponent(filename.replace(/\.[a-z0-9]+$/i, ''));
  const isVideo = isVideoUrl(url);

  // Resolve project link. Caller-supplied meta takes precedence; URL
  // fallback covers the common case (everything under /2. Projects/...).
  let projLink: ProjectLink | null = null;
  if (meta.projectSlug) {
    projLink = {
      slug: meta.projectSlug,
      title: meta.projectTitle ?? meta.projectSlug,
      href: '/projects/' + meta.projectSlug,
    };
  } else {
    projLink = projectFromUrl(url);
  }

  // If we're already on the matching project page, the "View project" link
  // would be a no-op — hide it. Otherwise it's always shown when the URL
  // maps to a project, regardless of which page we're viewed from.
  const onMatchingProjectPage =
    projLink !== null &&
    typeof window !== 'undefined' &&
    window.location.pathname === projLink.href;

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
      <div className="spa-lightbox__caption">
        <span className="spa-lightbox__caption-text">{caption}</span>
        {projLink && !onMatchingProjectPage ? (
          <a
            className="spa-lightbox__project"
            href={projLink.href}
            // Stop the backdrop click handler from closing the lightbox
            // before navigation actually happens.
            onClick={(e) => e.stopPropagation()}
            aria-label={'View project: ' + projLink.title}
          >
            <span className="spa-lightbox__project-label">View project</span>
            <span className="spa-lightbox__project-title">{projLink.title}</span>
            <span className="spa-lightbox__project-arrow" aria-hidden>→</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default Lightbox;
