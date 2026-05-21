/**
 * NavHeader — fixed top, glass-blur, dark. Each link goes to a
 * separate page (to be built later). No active-state highlighting.
 * No CTA pill.
 */

export function NavHeader() {
  return (
    <nav className="spa-nav" aria-label="Primary">
      <a href="/" className="spa-nav__brand">
        <img className="spa-nav__logo" src="/logo/PanicAttackLogo.png" alt="" />
        <span className="spa-nav__name">Ema Stoyanova</span>
      </a>
      <ul className="spa-nav__list">
        <li><a href="/" className="spa-nav__item" data-num="01">Home</a></li>
        <li><a href="/projects" className="spa-nav__item" data-num="02">Projects</a></li>
        <li><a href="/highlights" className="spa-nav__item" data-num="03">Highlights</a></li>
        <li><a href="/vocabulary" className="spa-nav__item" data-num="04">Vocabulary</a></li>
        <li><a href="/about" className="spa-nav__item" data-num="05">About</a></li>
        <li><a href="/contact" className="spa-nav__item" data-num="06">Contact</a></li>
      </ul>
    </nav>
  );
}

export default NavHeader;
