import { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';

const LenisContext = createContext(null);

export function LenisProvider({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const instance = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      anchors: { offset: -72 },
    });
    let raf = requestAnimationFrame(function loop(time) {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    });
    setLenis(instance);

    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext value={lenis}>{children}</LenisContext>;
}

export const useLenis = () => useContext(LenisContext);
