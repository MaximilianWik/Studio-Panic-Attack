/**
 * Closed→open folder hover tile used in the projects mini-grid.
 *
 * Default state: closed manila folder with the project number on the tab.
 * Hover state (.is-open or :hover via CSS): the lid rotates up, two image
 * frames pop out and rotate slightly. When `coverUrl` is provided the front
 * page (pageA) shows a thumbnail of the project's first image — but only
 * while the tile is hovered or active, so we never fetch 16 covers up-front.
 *
 * Pure CSS transitions drive the open/close geometry. The component just
 * renders the SVG geometry and lazily mounts the `<image>` overlay — the
 * animation lives in global.css under `.spa-folder-tile`.
 */

import { useState } from 'react';

interface FolderTileProps {
  /** Number to print on the tab (e.g. "01"). */
  num: string;
  /** Title overlaid below. */
  title: string;
  /** Additional className. */
  className?: string;
  /** Whether the tile is the currently selected board. */
  active?: boolean;
  /**
   * Thumbnail URL — typically the smallest WebP variant of the project's
   * first image. Only fetched when the tile is hovered or active so the
   * 16-tile grid still costs nothing on initial render.
   */
  coverUrl?: string;
}

export function FolderTile({ num, title, className, active, coverUrl }: FolderTileProps) {
  const [hovered, setHovered] = useState(false);
  // Lid is only open when hovered or active — outside that window the cover
  // would be invisible behind the closed lid, so don't bother fetching it.
  const showCover = (active || hovered) && !!coverUrl;

  return (
    <div
      className={'spa-folder-tile ' + (active ? 'is-active ' : '') + (className ?? '')}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <svg className="spa-folder-tile__svg" viewBox="0 0 120 90" aria-hidden>
        {/* Back of the folder */}
        <path className="spa-folder-tile__back" d="M6 28 L46 28 L52 22 L114 22 L114 84 L6 84 Z" />
        {/* Tab number */}
        <text className="spa-folder-tile__num" x="64" y="33" textAnchor="middle">{num}</text>
        {/* Page peeking out — pageA is the front sheet, gets the thumbnail */}
        <g className="spa-folder-tile__pageA">
          <rect x="20" y="30" width="80" height="50" rx="1" />
          {showCover ? (
            <image
              href={coverUrl}
              x="20"
              y="30"
              width="80"
              height="50"
              // SVG <image> creates its own viewport and clips to it, so
              // slice gives a clean cover-fit without a separate clipPath.
              preserveAspectRatio="xMidYMid slice"
            />
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
