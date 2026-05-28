import { useMemo } from 'react';
import PageShell from '../components/PageShell/PageShell';
import { ABOUT_ASSETS } from '../generated/mediaManifest';
import DispersingText from '../components/About/DispersingText';
import type { TextBlock } from '../components/About/DispersingText';
import GlowParticles from '../components/About/GlowParticles';

/**
 * About page — dark theme with Background.PNG, DispersingText for all copy,
 * interactive glow particles, ImageStrip.webp + under-image-strip.
 */

const BACKGROUND = ABOUT_ASSETS.find((a) => a.file.toLowerCase().startsWith('background'));
const HI_EMA = ABOUT_ASSETS.find((a) => a.file.toLowerCase().startsWith('hi im ema'));
const STRIP = ABOUT_ASSETS.find((a) => a.file.toLowerCase() === 'imagestrip.webp');
const UNDER_STRIP = ABOUT_ASSETS.find((a) => a.file.toLowerCase().startsWith('under image strip'));

export function About() {
  const textBlocks = useMemo<TextBlock[]>(() => [
    { text: 'ABOUT', tag: 'h1', className: 'spa-about__title' },
    { text: 'Welcome to my universe', tag: 'h2', className: 'spa-about__sub' },
    {
      text: "I\u2019m a Stockholm-based designer working across events, graphic design, 3D, interactive media and the occasional weird experiment that doesn\u2019t fit anywhere else. Studio Panic Attack is the umbrella for it all \u2014 a playground for visual systems, immersive nights and things that get people talking to each other.",
      tag: 'p',
      className: 'spa-about__lede',
    },
    {
      text: "I like working hands-on, from concept and 3D to wiring up sensors, running projection mapping or printing posters. I care about how an idea actually feels in a room, not just on a screen.",
      tag: 'p',
      className: 'spa-about__body',
    },
  ], []);

  return (
    <PageShell routeName="About" className="spa-about">
      {BACKGROUND ? (
        <div
          className="spa-about__bg"
          style={{ backgroundImage: `url("${BACKGROUND.url}")` }}
          aria-hidden
        />
      ) : null}

      <GlowParticles
        count={90}
        attractRadius={180}
        hue={265}
        hueSpread={50}
        className="spa-about__particles"
      />

      <main className="spa-about__main">
        <div className="spa-about__col spa-about__col--text">
          {HI_EMA ? (
            <img
              className="spa-about__hi-img"
              src={HI_EMA.url}
              alt="Hi I'm Ema"
              loading="eager"
            />
          ) : null}

          <DispersingText
            blocks={textBlocks}
            radius={110}
            maxDisplace={50}
            spring={0.06}
            friction={0.88}
            className="spa-about__dispersing"
          />

          <div className="spa-about__card" aria-label="Contact card">
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
      </main>

      {STRIP ? (
        <section className="spa-about__strip-wrap" aria-label="Strip of recent work">
          <img
            className="spa-about__strip-img"
            src={STRIP.url}
            alt="Strip of recent work"
            loading="lazy"
          />
        </section>
      ) : null}

      {UNDER_STRIP ? (
        <section className="spa-about__understrip-wrap" aria-hidden>
          <img
            className="spa-about__understrip-img"
            src={UNDER_STRIP.url}
            alt=""
            loading="lazy"
          />
        </section>
      ) : null}
    </PageShell>
  );
}

export default About;
