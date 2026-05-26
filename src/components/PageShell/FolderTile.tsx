/**
 * Closed→open folder hover tile used in the projects mini-grid.
 *
 * Default state: closed manila folder with the project number on the tab.
 * Hover state (.is-open or :hover via CSS): the lid rotates up, two image
 * frames pop out and rotate slightly.
 *
 * Pure CSS transitions drive the state change. The component just renders
 * the SVG geometry — animation lives in global.css under `.spa-folder-tile`.
 */

interface FolderTileProps {
  /** Number to print on the tab (e.g. "01"). */
  num: string;
  /** Title overlaid below. */
  title: string;
  /** Optional cover image URL — fills the topmost "page" peeking out. */
  cover?: string;
  /** Additional className. */
  className?: string;
  /** Whether the tile is the currently selected board. */
  active?: boolean;
}

export function FolderTile({ num, title, cover, className, active }: FolderTileProps) {
  return (
    <div className={'spa-folder-tile ' + (active ? 'is-active ' : '') + (className ?? '')}>
      <svg className="spa-folder-tile__svg" viewBox="0 0 120 90" aria-hidden>
        {/* Back of the folder */}
        <path className="spa-folder-tile__back" d="M6 28 L46 28 L52 22 L114 22 L114 84 L6 84 Z" />
        {/* Tab number */}
        <text className="spa-folder-tile__num" x="64" y="33" textAnchor="middle">{num}</text>
        {/* Page peeking out — gets the cover image as a pattern */}
        <g className="spa-folder-tile__pageA">
          <rect x="20" y="30" width="80" height="50" rx="1" />
          {cover ? (
            <>
              <defs>
                <pattern id={'cov-' + num} patternUnits="userSpaceOnUse" x="20" y="30" width="80" height="50">
                  <image href={cover} x="0" y="0" width="80" height="50" preserveAspectRatio="xMidYMid slice" />
                </pattern>
              </defs>
              <rect x="20" y="30" width="80" height="50" rx="1" fill={'url(#cov-' + num + ')'} />
            </>
          ) : null}
        </g>
        <g className="spa-folder-tile__pageB">
          <rect x="14" y="36" width="80" height="46" rx="1" />
        </g>
        {/* Front lid — animates open on hover */}
        <g className="spa-folder-tile__lid">
          <path d="M6 32 L114 32 L114 84 L6 84 Z" />
        </g>
      </svg>
      <div className="spa-folder-tile__label" title={title}>{title}</div>
    </div>
  );
}

export default FolderTile;
