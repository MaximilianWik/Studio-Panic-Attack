/*
 * SwissKnifeTextPath
 * ------------------
 * Animated SVG centerpiece for the whiteboard hero. A single sentence
 * crawls around the silhouette of a swiss-army-knife in red Cormorant
 * Garamond italic, with the LogoText.png raster overlaid in the middle.
 *
 * Spec source: swiss-knife-textpath-2026-05-20-14-46-44.json (exported
 * from the Swiss-Knife-TextPath SVG project). The path data lives in
 * `swissKnifeOutlineD.ts` so the JSX stays readable.
 *
 * Replaces the static PanicAttackLogoBlack.png on the whiteboard
 * palette only — mesh palettes still get the white logo via the
 * caller in HeroOverlay.
 */

import { SWISS_KNIFE_OUTLINE_D } from './swissKnifeOutlineD';

const SENTENCE =
  'Chaotic space of creativity & multidisciplinary ideas exploring the limits of the human curiosity.';

// Constants from the export. PATH_SCALE shrinks the silhouette inside
// the viewBox; font-size and letter-spacing must be divided by it so
// the outer scale multiplies them back to the user-facing values.
const LAP_DURATION_SEC = 35;
const PAD = 60;
const CANVAS_W = 662;
const CANVAS_H = 636;
const PATH_SCALE = 0.67;

const TEXT_FONT =
  '"Cormorant Garamond", "EB Garamond", Georgia, "Times New Roman", serif';
const USER_FONT_SIZE = 13;
const USER_LETTER_SPACING = 0.3;

const INNER_FONT_SIZE = USER_FONT_SIZE / PATH_SCALE;
const INNER_LETTER_SPACING = USER_LETTER_SPACING / PATH_SCALE;

// Where to drop the path inside the scaled <g>. Matches `path.translate`
// in the export so the silhouette sits centered.
const OUTLINE_OFFSET = { x: 646.625, y: 38.1875 };

// Logo overlay — sits on top of the spinning text at its native size.
const LOGO = {
  width: 235,
  height: 102.31,
  x: 213.5,
  y: 266.84,
};

const LOGO_HREF = '/logo/SwissKnifeLogoText.png';

// Cormorant Garamond is already loaded as italic-500 via the
// LoadingScreen <style> tag (jsDelivr @fontsource CDN). We add the
// upright 500 weight here from the same CDN so the textpath has the
// face it expects on first paint.
const FONT_FACE_CSS =
  '@font-face{font-family:"Cormorant Garamond";font-style:normal;' +
  'font-weight:500;font-display:swap;' +
  'src:url(https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@5.0.0/files/cormorant-garamond-latin-500-normal.woff2) format("woff2"),' +
  'url(https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@5.0.0/files/cormorant-garamond-latin-500-normal.woff) format("woff");}';

export interface SwissKnifeTextPathProps {
  /** Optional className for sizing the wrapper (the SVG fills it). */
  className?: string;
  /** Optional inline styles for the wrapper. */
  style?: React.CSSProperties;
}

export function SwissKnifeTextPath({ className, style }: SwissKnifeTextPathProps) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const scaleTransform =
    `translate(${cx} ${cy}) scale(${PATH_SCALE}) translate(${-cx} ${-cy})`;

  const textStyle: React.CSSProperties = {
    fontFamily: TEXT_FONT,
    fontSize: INNER_FONT_SIZE,
    fontWeight: 500,
    fill: '#d30000',
    letterSpacing: INNER_LETTER_SPACING,
  };

  return (
    <div className={className} style={style}>
      <style>{FONT_FACE_CSS}</style>
      <svg
        viewBox={`-${PAD} -${PAD} ${CANVAS_W + PAD * 2} ${CANVAS_H + PAD * 2}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Studio Panic Attack — chaotic space of creativity"
      >
        <defs>
          <path id="knife-outline" d={SWISS_KNIFE_OUTLINE_D} />
        </defs>

        <g transform={scaleTransform}>
          <g transform={`translate(${OUTLINE_OFFSET.x}, ${OUTLINE_OFFSET.y})`}>
            <text style={textStyle}>
              <textPath href="#knife-outline" startOffset="100%">
                <animate
                  id="lap"
                  attributeName="startOffset"
                  from="100%"
                  to="0%"
                  dur={`${LAP_DURATION_SEC}s`}
                  repeatCount="indefinite"
                />
                {SENTENCE}
              </textPath>
            </text>

            <text style={textStyle}>
              <textPath href="#knife-outline" startOffset="0%">
                <animate
                  attributeName="startOffset"
                  from="0%"
                  to="-100%"
                  dur={`${LAP_DURATION_SEC}s`}
                  repeatCount="indefinite"
                  begin="lap.begin"
                />
                {SENTENCE}
              </textPath>
            </text>
          </g>
        </g>

        <image
          href={LOGO_HREF}
          x={LOGO.x}
          y={LOGO.y}
          width={LOGO.width}
          height={LOGO.height}
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
}

export default SwissKnifeTextPath;
