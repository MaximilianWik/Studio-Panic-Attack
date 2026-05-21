import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { useScrollVelocity } from '../helpers/useScrollVelocity';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    __spaScrollEl?: HTMLDivElement;
    __spaScrollPages?: number;
  }
}

export function ScrollBridge() {
  const scroll = useScroll();
  const tickVel = useScrollVelocity();
  const last = useRef({ s: -1, v: -1 });

  useEffect(() => {
    window.__spaScrollEl = scroll.el as HTMLDivElement;
    window.__spaScrollPages = scroll.pages;
    return () => { delete window.__spaScrollEl; delete window.__spaScrollPages; };
  }, [scroll]);

  useFrame((_, dt) => {
    const root = document.documentElement;
    const s = scroll.offset;
    const v = tickVel(dt);
    if (Math.abs(s - last.current.s) > 0.0005) {
      root.style.setProperty('--spa-scroll', s.toFixed(4));
      const heroFade = Math.max(0, 1 - s / 0.08);
      root.style.setProperty('--spa-hero', heroFade.toFixed(4));
      last.current.s = s;
    }
    if (Math.abs(v - last.current.v) > 0.001) {
      root.style.setProperty('--spa-vel', Math.min(v, 4).toFixed(3));
      last.current.v = v;
    }
  });

  return null;
}

export default ScrollBridge;
