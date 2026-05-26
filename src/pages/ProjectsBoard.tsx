import { useEffect, useRef, useState } from 'react';
import PageShell from '../components/PageShell/PageShell';
import { Img, Vid } from '../helpers/media';
import FolderTile from '../components/PageShell/FolderTile';
import { Sticker } from '../components/PageShell/Stickers';
import { PROJECTS, type Project } from '../config/projects';
import { EVENTS_HTML, EVENTS_INTRO, EVENTS_TITLE } from '../generated/eventsText.html';
import { openLightbox } from '../helpers/lightbox';

interface ProjectsBoardProps {
  /** Slug from the URL — null for /projects with no slug → defaults to first. */
  initialSlug: string | null;
}

/**
 * Projects — horizontally scrolling Miro-style whiteboard. One full-viewport
 * "board" per category; scroll-snap glues the scroll position to the
 * nearest board. Per-board polaroid scatter + overflow grid is laid out
 * by config/projects.ts.
 *
 * Performance notes
 * -----------------
 * - 16 boards × ~10 polaroids of large originals = a lot of bytes if we
 *   render everything up-front. We virtualise: only the active board and
 *   its immediate neighbours mount full content. Boards further away
 *   render a lightweight skeleton (head + count + arrows) so the snap
 *   geometry stays correct. As soon as the user scrolls the active index
 *   moves and the next board hydrates.
 * - All <img> are loading="lazy" and the cover-image fill on folder tiles
 *   is removed so the mini-grid doesn't kick off 16 fetches per board.
 */

/** How many boards on each side of the active one to fully mount. */
const HYDRATE_RADIUS = 1;

export function ProjectsBoard({ initialSlug }: ProjectsBoardProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(() => {
    if (!initialSlug) return 0;
    const i = PROJECTS.findIndex((p) => p.slug === initialSlug);
    return i >= 0 ? i : 0;
  });

  // Scroll into the right board on first mount.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[activeIdx] as HTMLElement | undefined;
    if (child) {
      track.scrollTo({ left: child.offsetLeft, behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL when active board changes (replaceState — don't pollute history).
  useEffect(() => {
    const slug = PROJECTS[activeIdx]?.slug;
    if (!slug) return;
    const target = '/projects/' + slug;
    if (window.location.pathname !== target) {
      window.history.replaceState({ slug }, '', target);
    }
  }, [activeIdx]);

  // Listen to horizontal scroll → update activeIdx.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = track.clientWidth;
        const idx = Math.round(track.scrollLeft / w);
        if (idx !== activeIdx && idx >= 0 && idx < PROJECTS.length) {
          setActiveIdx(idx);
        }
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [activeIdx]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') goTo(activeIdx + 1);
      else if (e.key === 'ArrowLeft') goTo(activeIdx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Browser back/forward integration.
  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/projects(?:\/([a-z0-9-]+))?$/);
      const slug = m?.[1];
      if (!slug) { goTo(0); return; }
      const i = PROJECTS.findIndex((p) => p.slug === slug);
      if (i >= 0) goTo(i);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goTo(idx: number) {
    const clamped = Math.max(0, Math.min(PROJECTS.length - 1, idx));
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[clamped] as HTMLElement | undefined;
    if (child) {
      track.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
    }
    setActiveIdx(clamped);
  }

  const active = PROJECTS[activeIdx];

  return (
    <PageShell routeName={'Projects \u2014 ' + (active?.title ?? '')} className="spa-pb">
      {/* Top breadcrumb pill — quick jump between boards */}
      <nav className="spa-pb__breadcrumb" aria-label="Project categories">
        {PROJECTS.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            className={'spa-pb__crumb ' + (i === activeIdx ? 'is-active' : '')}
            onClick={() => goTo(i)}
            title={p.title}
          >
            <span className="spa-pb__crumb-num">{String(p.num).padStart(2, '0')}</span>
            <span className="spa-pb__crumb-label">{p.title}</span>
          </button>
        ))}
      </nav>

      <div className="spa-pb__track" ref={trackRef}>
        {PROJECTS.map((p, i) => (
          <Board
            key={p.slug}
            project={p}
            index={i}
            total={PROJECTS.length}
            onPrev={() => goTo(i - 1)}
            onNext={() => goTo(i + 1)}
            onJumpTo={goTo}
            active={i === activeIdx}
            hydrated={Math.abs(i - activeIdx) <= HYDRATE_RADIUS}
          />
        ))}
      </div>
    </PageShell>
  );
}

interface BoardProps {
  project: Project;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onJumpTo: (i: number) => void;
  active: boolean;
  /** When true, render the full content (mini-grid, scatter, overflow). */
  hydrated: boolean;
}

function Board({ project, index, total, onPrev, onNext, onJumpTo, active, hydrated }: BoardProps) {
  const prev = PROJECTS[index - 1];
  const next = PROJECTS[index + 1];

  return (
    <section
      className={'spa-pb__board ' + (active ? 'is-active' : '')}
      aria-label={project.title}
      data-slug={project.slug}
    >
      {/* Hand-drawn arrow back — only on hydrated neighbours */}
      {prev && hydrated ? (
        <button type="button" className="spa-pb__arrow spa-pb__arrow--prev" onClick={onPrev} aria-label={'Previous: ' + prev.title}>
          <span className="spa-pb__arrow-line" aria-hidden>
            <svg viewBox="0 0 80 30" width="80" height="30">
              <path d="M78 15 Q60 5 40 15 T2 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 15 L12 9 M2 15 L12 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="spa-pb__arrow-label">{prev.title}</span>
        </button>
      ) : null}
      {next && hydrated ? (
        <button type="button" className="spa-pb__arrow spa-pb__arrow--next" onClick={onNext} aria-label={'Next: ' + next.title}>
          <span className="spa-pb__arrow-label">{next.title}</span>
          <span className="spa-pb__arrow-line" aria-hidden>
            <svg viewBox="0 0 80 30" width="80" height="30">
              <path d="M2 15 Q20 5 40 15 T78 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M78 15 L68 9 M78 15 L68 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      ) : null}

      <header className="spa-pb__head">
        <div className="spa-pb__head-num">{String(project.num).padStart(2, '0')}</div>
        <h1 className="spa-pb__head-title">{project.kind === 'events' ? EVENTS_TITLE : project.title}</h1>
        <p className="spa-pb__head-desc">
          {project.kind === 'events' ? EVENTS_INTRO : project.description}
        </p>
      </header>

      {hydrated ? (
        <>
          {/* Mini-grid of all 16 categories — folder tiles, click to jump.
              Cover thumbnails removed for perf; tiles are pure SVG. */}
          <div className="spa-pb__mini" aria-label="All projects">
            {PROJECTS.map((p, i) => (
              <button
                type="button"
                key={p.slug}
                className="spa-pb__mini-btn"
                onClick={() => onJumpTo(i)}
                aria-label={'Open ' + p.title}
              >
                <FolderTile
                  num={String(p.num).padStart(2, '0')}
                  title={p.title}
                  active={p.slug === project.slug}
                />
              </button>
            ))}
          </div>

          {/* Decorative stickers */}
          <Sticker kind={project.sticker} className="spa-pb__sticker spa-pb__sticker--a" rot={-12} size={110} />
          <Sticker kind={project.sticker === 'folder' ? 'paperclip' : 'folder'} className="spa-pb__sticker spa-pb__sticker--b" rot={18} size={90} />

          {project.kind === 'events' ? (
            <div className="spa-pb__events">
              <article
                className="spa-pb__events-doc"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: EVENTS_HTML }}
              />
              <div className="spa-pb__events-photos">
                {project.assets.concat(project.overflow).map((a) => (
                  <button
                    key={a.url}
                    className="spa-polaroid spa-polaroid--ev"
                    style={{ ['--rot' as string]: a.rot + 'deg' }}
                    onClick={() => openLightbox(a.url)}
                    type="button"
                    aria-label={'View ' + a.file}
                  >
                    <span className="spa-polaroid__inner">
                      {a.type === 'video' ? <Vid src={a.url} /> : <Img src={a.url} alt="" />}
                    </span>
                    <span className="spa-polaroid__cap">{a.file.replace(/\.[a-zA-Z0-9]+$/, '')}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="spa-pb__scatter">
                {project.assets.map((a) => (
                  <button
                    key={a.url}
                    type="button"
                    className="spa-polaroid"
                    style={{
                      left: a.x + '%',
                      top: a.y + '%',
                      width: a.w + '%',
                      ['--rot' as string]: a.rot + 'deg',
                      zIndex: a.z + 10,
                    }}
                    onClick={() => openLightbox(a.url)}
                    aria-label={'View ' + a.file}
                  >
                    <span className="spa-polaroid__inner">
                      {a.type === 'video' ? <Vid src={a.url} /> : <Img src={a.url} alt="" />}
                    </span>
                    <span className="spa-polaroid__cap">{a.file.replace(/\.[a-zA-Z0-9]+$/, '')}</span>
                  </button>
                ))}
                {project.notes?.map((n, i) => (
                  <div
                    key={i}
                    className={'spa-note spa-note--' + n.color + ' spa-pb__note'}
                    style={{ left: n.x + '%', top: n.y + '%' }}
                  >
                    <span className="spa-note__pin" aria-hidden />
                    {n.text}
                  </div>
                ))}
              </div>

              {/* Overflow grid — every other asset in the folder, in a clean
                  scrollable grid below the scatter. Lazy <img> means bytes
                  only flow when the user actually scrolls down. */}
              {project.overflow.length > 0 ? (
                <div className="spa-pb__overflow">
                  <div className="spa-pb__overflow-hd">
                    <span className="spa-pb__overflow-label">More from {project.title}</span>
                    <span className="spa-pb__overflow-count">
                      {project.assets.length + project.overflow.length} pieces total
                    </span>
                  </div>
                  <div className="spa-pb__overflow-grid">
                    {project.overflow.map((a) => (
                      <button
                        key={a.url}
                        type="button"
                        className="spa-pb__overflow-tile"
                        onClick={() => openLightbox(a.url)}
                        aria-label={'View ' + a.file}
                      >
                        <span className="spa-pb__overflow-tile-inner">
                          {a.type === 'video' ? <Vid src={a.url} /> : <Img src={a.url} alt="" />}
                        </span>
                        <span className="spa-pb__overflow-tile-cap">
                          {a.file.replace(/\.[a-zA-Z0-9]+$/, '')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : (
        // Skeleton — preserves snap geometry without rendering any images.
        <div className="spa-pb__skeleton" aria-hidden>
          <div className="spa-pb__skeleton-hint">{project.title}</div>
        </div>
      )}

      {/* Index counter — only the active board's instance is visible (CSS) */}
      <div className="spa-pb__count" aria-hidden>
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </section>
  );
}

export default ProjectsBoard;
