import { useEffect, useRef, useState } from 'react';

/**
 * LoadingScreen — fullscreen entry experience.
 *
 * Shown over the gradient backdrop while the first batch of gallery
 * textures preloads. Composition:
 *   - Big italic Cormorant Garamond percentage counter at center.
 *     The displayed value smoothly lerps toward `progress * 100` so
 *     the discrete onload/onerror bumps from usePreloadGate don't
 *     feel jumpy.
 *   - Below: a single full-width-ish red hairline that grows L→R.
 *   - Below that: a cycling cassette of mono uppercase phrases that
 *     swap every ~1.1 s — gives the loader personality.
 *   - Top label: STUDIO · PANIC · ATTACK
 *   - Bottom corners: signature + version label.
 *   - A faint repeating scan-line overlay on top of everything for
 *     the CRT/film vibe (CSS gradient, no JS animation).
 *
 * On `ready === true` the whole thing fades out (opacity 0, 700 ms)
 * and the underlying HeroOverlay (logo + scroll prompt) takes over.
 */

const PHRASES = [
  'rendering brain',
  'tuning dread',
  'parsing portraits',
  'calibrating chaos',
  'warming neurons',
  'assembling mood',
  'buffering memories',
  'sharpening edges',
  'composing panic',
];

const FONT_ITALIC =
  'https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@5.0.0/files/cormorant-garamond-latin-500-italic.woff';

interface LoadingScreenProps {
  /** 0..1 — fraction of preload URLs settled. */
  progress: number;
  /** True once the gate is open. Triggers fade-out. */
  ready: boolean;
}

export function LoadingScreen({ progress, ready }: LoadingScreenProps) {
  const [displayed, setDisplayed] = useState(0); // 0..100 smoothed
  const [phraseIdx, setPhraseIdx] = useState(0);
  const rafRef = useRef(0);

  // Smoothly lerp the displayed pct toward target so jumps from
  // ~12.5% per image don't tick visibly. Snap straight to 100 when
  // ready flips so the loader doesn't fade out mid-lerp at 97%.
  useEffect(() => {
    if (ready) {
      setDisplayed(100);
      return;
    }
    const tick = () => {
      setDisplayed((prev) => {
        const target = progress * 100;
        const diff = target - prev;
        if (Math.abs(diff) < 0.04) return target;
        return prev + diff * 0.14;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [progress, ready]);

  // Cycle the status phrase regardless of progress — feels alive.
  useEffect(() => {
    if (ready) return;
    const id = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, [ready]);

  // Preload the italic webfont so the percentage counter doesn't
  // FOIT for the brief moment it's on screen. Uses CSS Font Loading API.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.load) return;
    document.fonts.load('italic 500 64px "CormorantGaramondLoader"').catch(() => {});
  }, []);

  const pctInt = Math.floor(Math.max(0, Math.min(100, displayed)));

  return (
    <div
      className={'spa-loader' + (ready ? ' spa-loader--done' : '')}
      aria-hidden={ready}
      role="progressbar"
      aria-valuenow={pctInt}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <style>{
        '@font-face{font-family:"CormorantGaramondLoader";font-style:italic;font-weight:500;font-display:block;src:url(' +
        FONT_ITALIC +
        ') format("woff");}'
      }</style>

      <div className="spa-loader__scanlines" aria-hidden />

      <div className="spa-loader__corner spa-loader__corner--tl">
        — STUDIO · PANIC · ATTACK
      </div>
      <div className="spa-loader__corner spa-loader__corner--tr">
        <span className="spa-loader__blink">●</span> LOADING
      </div>

      <div className="spa-loader__center">
        <div className="spa-loader__pct">
          <span className="spa-loader__pct-num">{pctInt.toString().padStart(2, '0')}</span>
          <span className="spa-loader__pct-sym">%</span>
        </div>

        <div className="spa-loader__bar">
          <div
            className="spa-loader__bar-fill"
            style={{ transform: 'scaleX(' + (displayed / 100).toFixed(3) + ')' }}
          />
          <div
            className="spa-loader__bar-tip"
            style={{ left: 'calc(' + displayed.toFixed(2) + '% - 1px)' }}
          />
        </div>

        <div className="spa-loader__phrase">
          {PHRASES.map((p, i) => (
            <span
              key={p}
              className={
                'spa-loader__phrase-item' +
                (phraseIdx === i ? ' is-active' : '')
              }
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="spa-loader__corner spa-loader__corner--bl">
        EMA STOYANOVA
      </div>
      <div className="spa-loader__corner spa-loader__corner--br">
        2026 / v0.5
      </div>
    </div>
  );
}

export default LoadingScreen;
