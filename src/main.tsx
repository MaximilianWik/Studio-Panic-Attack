import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import UnderConstruction from './components/UnderConstruction/UnderConstruction';
import './styles/global.css';

/**
 * Path-based router lite. The site is single-page, but the nav menu
 * links to routes that don't exist as content yet. Rather than
 * pulling in react-router for five placeholder pages, we read
 * window.location.pathname once at boot and pick which root
 * component to mount.
 *
 * Vercel rewrites in vercel.json already serve index.html for all
 * paths so deep-links work on hard reload.
 *
 * Listed under-construction routes match the LINKS array in
 * NavHeader.tsx (minus '/' which is the real site).
 */
const UNDER_CONSTRUCTION_PATHS = new Set([
  '/projects',
  '/highlights',
  '/vocabulary',
  '/about',
  '/contact',
]);

function pickRoot() {
  // Normalise: strip trailing slash, lowercase.
  const raw = window.location.pathname || '/';
  const path = (raw.replace(/\/+$/, '') || '/').toLowerCase();
  if (path === '/' || path === '') return <App />;
  if (UNDER_CONSTRUCTION_PATHS.has(path)) return <UnderConstruction path={path} />;
  // Anything else also gets the under-construction screen so
  // typos / stale links don't 404.
  return <UnderConstruction path={path} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{pickRoot()}</StrictMode>,
);
