import { useEffect, useRef } from 'react';

/**
 * CustomCursor — Magnetic editorial cursor with dot + outline ring.
 * Changes size on hoverable elements (buttons, links, cards).
 * Shows a "PLAY" label on video cards.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const outlineRef = useRef(null);

  // Detect touch-only devices — skip custom cursor entirely
  const isTouchDevice = () =>
    window.matchMedia('(pointer: coarse)').matches ||
    !window.matchMedia('(pointer: fine)').matches;

  useEffect(() => {
    const dot = dotRef.current;
    const outline = outlineRef.current;
    if (!dot || !outline || isTouchDevice()) return;

    let mouseX = 0, mouseY = 0;
    let outlineX = 0, outlineY = 0;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
    };

    const lerp = (a, b, n) => a + (b - a) * n;

    let raf;
    const animate = () => {
      outlineX = lerp(outlineX, mouseX, 0.12);
      outlineY = lerp(outlineY, mouseY, 0.12);
      outline.style.transform = `translate(${outlineX - 18}px, ${outlineY - 18}px)`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onHoverIn = (e) => {
      const el = e.currentTarget;
      if (el.dataset.cursorType === 'video') {
        outline.classList.add('cursor-video');
      } else {
        outline.classList.add('cursor-hover');
      }
    };
    const onHoverOut = () => {
      outline.classList.remove('cursor-hover', 'cursor-video');
    };

    document.addEventListener('mousemove', onMouseMove);

    // Force cursor:none on all interactive elements so system cursor never shows
    const styleTag = document.createElement('style');
    styleTag.id = 'custom-cursor-suppress';
    styleTag.textContent = 'a, button, input, textarea, select, label, [role="button"], .project-card, [data-cursor-hover], [data-cursor-type] { cursor: none !important; }';
    document.head.appendChild(styleTag);

    // Attach hover listeners
    const hoverEls = document.querySelectorAll(
      'a, button, [data-cursor-hover], .project-card, [data-cursor-type]'
    );
    hoverEls.forEach((el) => {
      el.addEventListener('mouseenter', onHoverIn);
      el.addEventListener('mouseleave', onHoverOut);
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMouseMove);
      hoverEls.forEach((el) => {
        el.removeEventListener('mouseenter', onHoverIn);
        el.removeEventListener('mouseleave', onHoverOut);
      });
      document.getElementById('custom-cursor-suppress')?.remove();
    };
  }, []);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && isTouchDevice()) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={outlineRef} className="cursor-outline" />
    </>
  );
}
