/**
 * Three hand-drawn-feeling sticker SVGs used as decoration on the whiteboard
 * pages. Pure inline SVGs (no external assets) — original artwork.
 *
 * Each sticker accepts a className so the page can position it absolutely.
 */

interface StickerProps {
  className?: string;
  style?: React.CSSProperties;
  /** Rotation in degrees (default 0). */
  rot?: number;
  /** Width in px (default 96). */
  size?: number;
  'aria-hidden'?: boolean;
}

function wrap(rot: number, size: number, style?: React.CSSProperties): React.CSSProperties {
  return {
    width: size,
    height: size,
    transform: 'rotate(' + rot + 'deg)',
    transformOrigin: '50% 50%',
    ...style,
  };
}

/** Tiny dot-matrix printer with a curl of paper coming out the top. */
export function StickerPrinter({ className, style, rot = 0, size = 96, ...rest }: StickerProps) {
  return (
    <svg
      className={'spa-sticker spa-sticker--printer ' + (className ?? '')}
      viewBox="0 0 100 100"
      style={wrap(rot, size, style)}
      fill="none"
      stroke="#0a0a0a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {/* paper curl */}
      <path d="M30 10 Q30 6 36 6 L66 6 Q72 6 72 12 L72 36" fill="#fff" />
      <path d="M36 14 L66 14 M36 20 L60 20 M36 26 L64 26" stroke="#0a0a0a" strokeOpacity="0.5" />
      {/* printer body */}
      <path d="M22 36 L78 36 L82 70 L18 70 Z" fill="#fafafa" />
      {/* paper slit */}
      <rect x="32" y="40" width="36" height="3" fill="#0a0a0a" />
      {/* control panel */}
      <circle cx="68" cy="52" r="3" fill="#d30000" stroke="none" />
      <rect x="30" y="50" width="22" height="4" rx="1" fill="#0a0a0a" fillOpacity="0.15" />
      {/* base */}
      <rect x="22" y="70" width="56" height="8" rx="2" fill="#fafafa" />
      <line x1="28" y1="78" x2="28" y2="84" />
      <line x1="72" y1="78" x2="72" y2="84" />
    </svg>
  );
}

/** Manila folder, slightly open with two pages peeking. */
export function StickerFolder({ className, style, rot = 0, size = 96, ...rest }: StickerProps) {
  return (
    <svg
      className={'spa-sticker spa-sticker--folder ' + (className ?? '')}
      viewBox="0 0 100 100"
      style={wrap(rot, size, style)}
      fill="none"
      stroke="#0a0a0a"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      {...rest}
    >
      {/* tab */}
      <path d="M14 30 L42 30 L46 24 L80 24 L80 32" fill="#e8d8a8" />
      {/* folder back */}
      <path d="M14 30 L86 30 L86 80 L14 80 Z" fill="#e8d8a8" />
      {/* sticking-out pages */}
      <rect x="22" y="36" width="56" height="34" fill="#fafafa" transform="rotate(-2 50 53)" />
      <rect x="26" y="40" width="50" height="32" fill="#fafafa" transform="rotate(3 50 56)" />
      {/* lines on top page */}
      <line x1="32" y1="50" x2="68" y2="50" strokeOpacity="0.5" />
      <line x1="32" y1="56" x2="62" y2="56" strokeOpacity="0.5" />
      <line x1="32" y1="62" x2="66" y2="62" strokeOpacity="0.5" />
      {/* folder front overlap */}
      <path d="M14 38 L86 38 L86 80 L14 80 Z" fill="#d4be88" fillOpacity="0.8" />
    </svg>
  );
}

/** Stack of three paperclips at an angle. */
export function StickerPaperclip({ className, style, rot = 0, size = 96, ...rest }: StickerProps) {
  const clip = (offsetX: number, offsetY: number, rotIn: number, color: string) => (
    <g transform={'translate(' + offsetX + ' ' + offsetY + ') rotate(' + rotIn + ' 50 50)'}>
      <path
        d="M30 70 L30 35 Q30 22 42 22 Q54 22 54 35 L54 65 Q54 73 46 73 Q38 73 38 65 L38 38 Q38 32 42 32 Q46 32 46 38 L46 60"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
  return (
    <svg
      className={'spa-sticker spa-sticker--paperclip ' + (className ?? '')}
      viewBox="0 0 100 100"
      style={wrap(rot, size, style)}
      {...rest}
    >
      {clip(-6, 4, -22, '#7a7a7a')}
      {clip(2, 0, -8, '#3a3a3a')}
      {clip(8, -4, 14, '#0a0a0a')}
    </svg>
  );
}

/** Picks one of the three by name. */
export function Sticker({ kind, ...rest }: StickerProps & { kind: 'printer' | 'folder' | 'paperclip' }) {
  if (kind === 'printer') return <StickerPrinter {...rest} />;
  if (kind === 'folder') return <StickerFolder {...rest} />;
  return <StickerPaperclip {...rest} />;
}
