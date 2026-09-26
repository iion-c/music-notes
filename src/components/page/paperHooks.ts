import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/** Alto del renglón leído del CSS del papel. */
export function readRule(el: Element | null): number {
  if (!el) return 32;
  const v = parseFloat(getComputedStyle(el).getPropertyValue('--rule'));
  return Number.isFinite(v) && v > 0 ? v : 32;
}

/**
 * Hace que la altura de un elemento sea siempre múltiplo del renglón, para que
 * el bloque siguiente vuelva a empezar sobre una línea del papel (como al escribir a mano).
 */
export function useSnapToRule<T extends HTMLElement>() {
  const outer = useRef<T>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const apply = () => {
      const rule = readRule(o);
      const h = i.getBoundingClientRect().height;
      const snapped = Math.max(rule, Math.ceil((h - 0.5) / rule) * rule);
      o.style.minHeight = `${snapped}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  return { outer, inner };
}

/**
 * Textarea que crece con el contenido en múltiplos del renglón.
 * `mounted` debe cambiar cuando el textarea aparece (p. ej. al entrar a editar),
 * porque entonces hay que medirlo aunque el texto no haya cambiado.
 */
export function useAutoGrow(value: string, mounted: unknown = true) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rule = readRule(el);
    el.style.height = '0px';
    const h = Math.max(rule, Math.ceil((el.scrollHeight - 1) / rule) * rule);
    el.style.height = `${h}px`;
  }, []);
  useLayoutEffect(resize, [value, mounted, resize]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => resize());
    ro.observe(el.parentElement || el);
    // Las fuentes web cambian la altura de las líneas cuando terminan de cargar.
    document.fonts?.ready.then(resize).catch(() => {});
    return () => ro.disconnect();
  }, [mounted, resize]);
  return ref;
}

/** Envuelve cada línea seleccionada, dejando fuera las marcas de viñeta/lista para no romperlas. */
export function wrapLines(el: HTMLTextAreaElement, before: string, after: string): string {
  const { selectionStart: s, selectionEnd: e, value } = el;
  if (s === e) {
    const next = value.slice(0, s) + before + after + value.slice(e);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + before.length;
    });
    return next;
  }
  const wrapped = value
    .slice(s, e)
    .split('\n')
    .map((line) => {
      if (!line.trim()) return line;
      const m = line.match(/^(\s*(?:[-*•]|\d+[.)]|[a-z][.)])\s+(?:\[[ xX]\]\s+)?)(.*)$/);
      return m ? `${m[1]}${before}${m[2]}${after}` : `${before}${line}${after}`;
    })
    .join('\n');
  const next = value.slice(0, s) + wrapped + value.slice(e);
  requestAnimationFrame(() => {
    el.selectionStart = s;
    el.selectionEnd = s + wrapped.length;
  });
  return next;
}

/** Quita las marcas de color de la selección (o de la línea actual si no hay selección). */
export function stripColor(el: HTMLTextAreaElement): string {
  const { value } = el;
  let s = el.selectionStart;
  let e = el.selectionEnd;
  if (s === e) {
    s = value.lastIndexOf('\n', s - 1) + 1;
    const nl = value.indexOf('\n', e);
    e = nl === -1 ? value.length : nl;
  }
  const cleaned = value.slice(s, e).replace(/\{[a-z]+\}|\{\/\}/g, '');
  requestAnimationFrame(() => {
    el.selectionStart = s;
    el.selectionEnd = s + cleaned.length;
  });
  return value.slice(0, s) + cleaned + value.slice(e);
}

/** Envuelve la selección de un textarea con marcas (negrita, resaltado…). */
export function wrapSelection(el: HTMLTextAreaElement, before: string, after = before): string {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const selected = value.slice(s, e);
  const next = value.slice(0, s) + before + selected + after + value.slice(e);
  requestAnimationFrame(() => {
    el.selectionStart = s + before.length;
    el.selectionEnd = e + before.length;
  });
  return next;
}

export function insertAtCursor(el: HTMLTextAreaElement, text: string): string {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const next = value.slice(0, s) + text + value.slice(e);
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = s + text.length;
    el.focus();
  });
  return next;
}
