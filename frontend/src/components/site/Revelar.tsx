import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export default function Revelar({ children, atraso = 0, className = '' }: { children: ReactNode; atraso?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visivel'); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`revelar ${className}`} style={{ transitionDelay: `${atraso}ms` }}>{children}</div>;
}
