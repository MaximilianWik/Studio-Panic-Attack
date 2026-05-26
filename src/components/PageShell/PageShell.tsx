import { useEffect } from 'react';
import NavHeader from '../NavHeader';
import Cursor from '../Cursor';
import Lightbox from '../Lightbox';
import ErrorBoundary from '../ErrorBoundary';

interface PageShellProps {
  /** Used in the route label corner + as document.title. */
  routeName: string;
  /** Optional className appended to the page-shell root. */
  className?: string;
  children: React.ReactNode;
}

/**
 * Common chrome for every whiteboard-themed page (/projects, /highlights,
 * /vocabulary, /about, /contact). Sets `body[data-spa-theme="whiteboard"]`
 * directly on mount so the page is light-themed regardless of which palette
 * the user picked on the home page — without overwriting their stored
 * palette preference.
 *
 * Owns no Canvas — these pages are pure DOM. NavHeader / Cursor / Lightbox
 * are mounted here so each page component just renders its own content.
 */
export function PageShell({ routeName, className, children }: PageShellProps) {
  useEffect(() => {
    const prevTheme = document.body.dataset.spaTheme;
    document.body.dataset.spaTheme = 'whiteboard';
    document.body.dataset.spaPage = 'whiteboard';
    return () => {
      // Restore whatever the home page's theme was; clear page marker so
      // body overflow rules revert.
      if (prevTheme) document.body.dataset.spaTheme = prevTheme;
      else delete document.body.dataset.spaTheme;
      delete document.body.dataset.spaPage;
    };
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Studio Panic Attack — ' + routeName;
    return () => { document.title = prev; };
  }, [routeName]);

  return (
    <ErrorBoundary>
      <div className={'spa-page' + (className ? ' ' + className : '')}>
        <div className="spa-page__bg" aria-hidden />
        {children}
      </div>
      <NavHeader />
      <Cursor />
      <Lightbox />
    </ErrorBoundary>
  );
}

export default PageShell;
