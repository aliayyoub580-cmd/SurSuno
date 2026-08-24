import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

export function useAnimeReveal(delay = 50) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const children = el.querySelectorAll('[data-animate]');
          if (children.length) {
            animate(children as any, {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: stagger(delay),
              duration: 600,
              ease: 'outExpo',
            });
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}

export function useAnimeHero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = ref.current.querySelectorAll('[data-hero]');
    if (targets.length) {
      animate(targets as any, {
        opacity: [0, 1],
        translateY: [30, 0],
        delay: stagger(100),
        duration: 800,
        ease: 'outExpo',
      });
    }
  }, []);

  return ref;
}
