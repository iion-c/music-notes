import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useStore } from '../../store';

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onOutside();
    document.addEventListener('pointerdown', handler, true);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', handler, true);
      document.removeEventListener('keydown', esc);
    };
  }, [ref, onOutside, active]);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
  /** En móvil se abre como hoja inferior a pantalla casi completa. */
  sheet?: boolean;
}

export function Modal({ open, onClose, title, subtitle, children, width = 520, footer, sheet = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex ${sheet ? 'items-end sm:items-center' : 'items-center'} justify-center bg-black/40 backdrop-blur-[2px] animate-fade`}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`popover animate-pop flex max-h-[92dvh] w-full flex-col overflow-hidden ${sheet ? 'rounded-b-none sm:rounded-b-xl' : 'mx-4'}`}
        style={{ maxWidth: width }}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>
            <button className="icon-btn -mr-2 -mt-1 shrink-0" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface PopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'start' | 'end';
  width?: number;
}

/** Menú flotante anclado a un elemento; se reubica para no salirse de la pantalla. */
export function Popover({ anchor, open, onClose, children, align = 'start', width = 260 }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useClickOutside(ref, onClose, open);

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const h = ref.current?.offsetHeight || 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let left = align === 'end' ? r.right - width : r.left;
      left = Math.max(8, Math.min(left, vw - width - 8));
      let top = r.bottom + 6;
      if (top + h > vh - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
      setPos({ top: Math.max(8, top), left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor, align, width]);

  if (!open || !anchor) return null;
  return createPortal(
    <div
      ref={ref}
      className="popover animate-pop fixed z-[70] max-h-[70dvh] overflow-y-auto p-1.5"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width }}
      role="menu"
    >
      {children}
    </div>,
    document.body,
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return createPortal(
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="popover animate-pop pointer-events-auto max-w-md px-4 py-2.5 text-sm"
          style={t.tone === 'error' ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} title={o.title} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
