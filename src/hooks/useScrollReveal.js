import { useEffect, useRef } from 'react';

/**
 * useScrollReveal — Adds 'in-view' class to elements with 'reveal-up' or 'reveal-left'
 * when they enter the viewport. Uses IntersectionObserver for performance.
 */
export function useScrollReveal(selector = '.reveal-up, .reveal-left', threshold = 0.15) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add delay based on data-delay attribute if present
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
              entry.target.classList.add('in-view');
            }, Number(delay));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selector, threshold]);
}

/**
 * useCountUp — Animates a number from 0 to the target value
 * when the element enters the viewport.
 */
export function useCountUp(targetValue, decimals = 0, duration = 2000) {
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = Date.now();
          const step = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = eased * targetValue;
            el.textContent = decimals > 0
              ? current.toFixed(decimals)
              : Math.round(current).toString();
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetValue, decimals, duration]);

  return ref;
}
