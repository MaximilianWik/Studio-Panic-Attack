/**
 * UnderConstruction — placeholder page for nav routes that don't
 * have real content yet (/projects, /highlights, /vocabulary,
 * /about, /contact). Renders codingCat.gif and a friendly note.
 *
 * Routing is path-based via window.location in main.tsx — this
 * component receives the current path so it can label the route
 * the visitor was trying to reach.
 */

interface UnderConstructionProps {
  path: string;
}

// URL-encoded so the space in the folder name doesn't trip up
// any HTTP intermediary that's stricter than the browser.
const GIF_URL = '/Under%20construction/codingCat.gif';

export function UnderConstruction({ path }: UnderConstructionProps) {
  // Strip leading slash + lowercase for display.
  const route = path.replace(/^\//, '').toLowerCase() || 'unknown';

  return (
    <>
      <div className="spa-uc__bg" aria-hidden />
      <div className="spa-uc">
        <div className="spa-uc__route">/{route}</div>
        <img
          className="spa-uc__gif"
          src={GIF_URL}
          alt="A pixel cat coding furiously"
          decoding="async"
        />
        <h1 className="spa-uc__title">Under construction :3</h1>
        <p className="spa-uc__sub">— this corner of the studio is still being wired up</p>
        <a className="spa-uc__back" href="/">← back to studio</a>
      </div>
    </>
  );
}

export default UnderConstruction;
