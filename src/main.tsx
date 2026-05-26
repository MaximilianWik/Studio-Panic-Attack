import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import UnderConstruction from './components/UnderConstruction/UnderConstruction';
import About from './pages/About';
import Vocabulary from './pages/Vocabulary';
import Highlights from './pages/Highlights';
import Contact from './pages/Contact';
import ProjectsBoard from './pages/ProjectsBoard';
import './styles/global.css';
import './styles/whiteboard-pages.css';

/**
 * Path-based router lite. The site is single-page, but the nav menu links
 * to dedicated pages. Rather than pulling in react-router for what is in
 * effect five static routes, we read window.location.pathname once at boot
 * and pick which root component to mount.
 *
 * Vercel rewrites in vercel.json already serve index.html for all paths so
 * deep-links work on hard reload.
 *
 * Listed routes match the LINKS array in NavHeader.tsx (minus '/' which is
 * the real interactive home).
 */
function pickRoot() {
  const raw = window.location.pathname || '/';
  const path = (raw.replace(/\/+$/, '') || '/').toLowerCase();
  if (path === '/' || path === '') return <App />;

  // Projects can be /projects or /projects/<slug>
  const projMatch = path.match(/^\/projects(?:\/([a-z0-9-]+))?$/);
  if (projMatch) return <ProjectsBoard initialSlug={projMatch[1] ?? null} />;

  if (path === '/about') return <About />;
  if (path === '/vocabulary') return <Vocabulary />;
  if (path === '/highlights') return <Highlights />;
  if (path === '/contact') return <Contact />;

  // Anything else falls through to the under-construction screen.
  return <UnderConstruction path={path} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{pickRoot()}</StrictMode>,
);
