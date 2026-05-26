import PageShell from '../components/PageShell/PageShell';
import { Img } from '../helpers/media';
import { ABOUT_ASSETS } from '../generated/mediaManifest';

/**
 * About page — two-column whiteboard layout with handwritten "Hi I'm Ema",
 * portrait circle, paper-tape contact card, and a CSS film strip below.
 *
 * Portrait selection: prefers IMG_5800-min.PNG (per spec) and falls back to
 * any available about asset. Strip thumbnails use the remaining about
 * images plus a couple of project covers for variety.
 */

const PORTRAIT = ABOUT_ASSETS.find((a) => a.file.includes('5800')) ?? ABOUT_ASSETS[0];
const STRIP = ABOUT_ASSETS.filter((a) => a !== PORTRAIT);

export function About() {
  return (
    <PageShell routeName="About" className="spa-about">
      <main className="spa-about__main">
        <div className="spa-about__col spa-about__col--text">
          <svg className="spa-about__hi" viewBox="0 0 360 100" aria-label="Hi! I'm Ema :)">
            <text x="0" y="72" className="spa-about__hi-text">Hi! I&rsquo;m Ema :)</text>
          </svg>
          <h1 className="spa-about__title">ABOUT</h1>
          <h2 className="spa-about__sub">Welcome to my universe</h2>
          <p className="spa-about__lede">
            I&rsquo;m a Stockholm-based designer working across events, graphic design,
            3D, interactive media and the occasional weird experiment that
            doesn&rsquo;t fit anywhere else. Studio Panic Attack is the umbrella for
            it all &mdash; a playground for visual systems, immersive nights and
            things that get people talking to each other.
          </p>
          <p className="spa-about__body">
            I like working hands-on, from concept and 3D to wiring up sensors,
            running projection mapping or printing posters. I care about how
            an idea actually feels in a room, not just on a screen.
          </p>

          <div className="spa-about__card" aria-label="Contact card">
            <div className="spa-about__card-tape" aria-hidden />
            <div className="spa-about__card-name">Ema Stoyanova</div>
            <a className="spa-about__card-line" href="mailto:panicoattaki@gmail.com">panicoattaki@gmail.com</a>
            <div className="spa-about__card-icons">
              <a href="https://instagram.com/" aria-label="Instagram" rel="me noreferrer noopener" target="_blank">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" />
                </svg>
              </a>
              <a href="https://facebook.com/" aria-label="Facebook" rel="me noreferrer noopener" target="_blank">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M14 9h3V6h-3c-1.66 0-3 1.34-3 3v2H8v3h3v7h3v-7h2.5l.5-3H14V9z" />
                </svg>
              </a>
              <a href="https://linkedin.com/" aria-label="LinkedIn" rel="me noreferrer noopener" target="_blank">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.1c.5-1 1.9-2 3.9-2 4.1 0 4.9 2.7 4.9 6.2V21h-4v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="spa-about__col spa-about__col--portrait">
          <div className="spa-about__portrait">
            {PORTRAIT ? (
              <Img src={PORTRAIT.url} alt="Portrait of Ema" eager className="spa-about__portrait-img" />
            ) : null}
            <div className="spa-about__portrait-ring" aria-hidden />
          </div>
        </div>
      </main>

      <section className="spa-about__strip" aria-label="Film strip of recent work">
        <div className="spa-about__strip-frames">
          {STRIP.concat(STRIP).slice(0, 8).map((a, i) => (
            <div className="spa-about__strip-frame" key={i}>
              <Img src={a.url} alt="" />
              <span className="spa-about__strip-num">{String(i + 1).padStart(2, '0')}A</span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export default About;
