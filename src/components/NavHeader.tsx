import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { id: 'hero', num: '01', label: 'Home', offset: 0.0 },
  { id: 'projects', num: '02', label: 'Projects', offset: 0.12 },
  { id: 'highlights', num: '03', label: 'Highlights', offset: 0.86 },
  { id: 'vocabulary', num: '04', label: 'Vocabulary', offset: 0.74 },
  { id: 'about', num: '05', label: 'About', offset: 0.50 },
  { id: 'contact', num: '06', label: 'Contact', offset: 0.97 },
] as const;

export function NavHeader() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spa-scroll'));
      const off = isFinite(v) ? v : 0;
      let cur = 'hero';
      if (off > 0.86) cur = 'highlights';
      else if (off > 0.74) cur = 'vocabulary';
      else if (off > 0.50) cur = 'about';
      else if (off > 0.12) cur = 'projects';
      if (cur !== active) setActive(cur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const scrollTo = (offset: number) => {
    const el = window.__spaScrollEl;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: max * offset, behavior: 'smooth' });
  };

  return (
    <nav className="spa-nav" aria-label="Primary">
      <a href="#" className="spa-nav__brand" onClick={(e) => { e.preventDefault(); scrollTo(0); }}>
        <img className="spa-nav__logo" src="/logo/PanicAttackLogo.png" alt="" />
        <span className="spa-nav__name">Ema Stoyanova</span>
      </a>
      <ul className="spa-nav__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <a
              href={'#' + item.id}
              className={'spa-nav__item' + (active === item.id ? ' spa-nav__item--active' : '')}
              data-num={item.num}
              onClick={(e) => { e.preventDefault(); scrollTo(item.offset); }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <a href="#contact" className="spa-nav__cta" onClick={(e) => { e.preventDefault(); scrollTo(0.97); }}>
        Get in touch
      </a>
    </nav>
  );
}

export default NavHeader;
