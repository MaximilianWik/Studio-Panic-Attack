import PageShell from '../components/PageShell/PageShell';
import { Img, Vid } from '../helpers/media';
import { HIGHLIGHTS_ASSETS } from '../generated/mediaManifest';
import { openLightbox } from '../helpers/lightbox';

/**
 * Highlights — 2-column polaroid grid. Each tile is a Polaroid frame; click
 * an image to open the existing site lightbox. Videos play muted on viewport
 * entry.
 */

export function Highlights() {
  return (
    <PageShell routeName="Highlights" className="spa-hl">
      <header className="spa-hl__hd">
        <p className="spa-hl__eyebrow">— highlights —</p>
        <h1 className="spa-hl__title">Some of my work&hellip;</h1>
        <p className="spa-hl__intro">
          Some of my favourite pieces that I&rsquo;ve created so far, as a multidisciplinary artist
        </p>
      </header>

      <div className="spa-hl__grid">
        {HIGHLIGHTS_ASSETS.map((a, i) => {
          const tilt = ((i % 5) - 2) * 1.4; // -2.8°..+2.8°
          return (
            <div className="spa-hl__tile" key={a.url} style={{ ['--tilt' as string]: tilt + 'deg' }}>
              <div className="spa-hl__polaroid">
                <div className="spa-hl__photo">
                  {a.type === 'video' ? (
                    <Vid src={a.url} />
                  ) : (
                    <button
                      type="button"
                      className="spa-hl__photo-btn"
                      onClick={() => openLightbox(a.url)}
                      aria-label={'Open ' + a.file}
                    >
                      <Img
                        src={a.url}
                        alt=""
                        webpSrcset={a.webpSrcset}
                        avifSrcset={a.avifSrcset}
                        lqip={a.lqip}
                      />
                    </button>
                  )}
                </div>
                <div className="spa-hl__caption">{a.file.replace(/\.[a-zA-Z0-9]+$/, '')}</div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

export default Highlights;
