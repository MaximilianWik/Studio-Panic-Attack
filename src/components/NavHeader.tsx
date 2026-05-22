import { useEffect, useState } from 'react';

/**
 * NavHeader — fixed top, glass-blur, dark.
 *
 * Desktop (>900px): brand on the left, full link list centered.
 * Mobile (<=900px): brand on the left, hamburger button on the right
 * which opens a fullscreen overlay menu. Esc / link-click / close-button
 * dismisses the overlay.
 */

interface NavLink {
  num: string;
  label: string;
  href: string;
}

const LINKS: NavLink[] = [
  { num: '01', label: 'Home', href: '/' },
  { num: '02', label: 'Projects', href: '/projects' },
  { num: '03', label: 'Highlights', href: '/highlights' },
  { num: '04', label: 'Vocabulary', href: '/vocabulary' },
  { num: '05', label: 'About', href: '/about' },
  { num: '06', label: 'Contact', href: '/contact' },
];

export function NavHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav className="spa-nav" aria-label="Primary">
        <a href="/" className="spa-nav__brand">
          <img className="spa-nav__logo" src="/logo/PanicAttackLogo.png" alt="" decoding="async" />
          <span className="spa-nav__name">Ema Stoyanova</span>
        </a>
        <ul className="spa-nav__list">
          {LINKS.map((l) => (
            <li key={l.num}>
              <a href={l.href} className="spa-nav__item" data-num={l.num}>{l.label}</a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="spa-nav__hamburger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </nav>

      <div
        className={'spa-nav__overlay ' + (open ? 'spa-nav__overlay--open' : 'spa-nav__overlay--closed')}
        aria-hidden={!open}
        role="dialog"
      >
        <button
          type="button"
          className="spa-nav__overlay-close"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        <ul className="spa-nav__overlay-list">
          {LINKS.map((l) => (
            <li key={l.num}>
              <a
                className="spa-nav__overlay-item"
                data-num={l.num}
                href={l.href}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default NavHeader;
