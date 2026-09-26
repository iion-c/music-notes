import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Baseline, Bold, Highlighter, Italic, List } from 'lucide-react';
import { renderMarkdownLite } from '../../../lib/markdown';
import { insertAtCursor, stripColor, useAutoGrow, wrapLines, wrapSelection } from '../paperHooks';
import { INKS } from '../../../lib/paper';

const SYMBOLS = ['♯', '♭', '♮', '°', 'ø', '→', '𝄞', '𝄢', '½'];

export interface TextEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Muestra el placeholder aunque no se esté editando. */
  showPlaceholder?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onSlash?: (anchor: HTMLElement) => void;
  onBackspaceEmpty?: () => void;
  onIndent?: (delta: number) => void;
  onEditingChange?: (editing: boolean) => void;
  /** Sin barra de formato (p. ej. columna de claves). */
  plain?: boolean;
  ariaLabel?: string;
}

/**
 * Texto que se escribe directamente sobre los renglones. Al salir se muestra con formato
 * (negrita, resaltado, viñetas, ♯/♭…); al tocarlo vuelve a ser editable.
 */
export function TextEditor({
  value,
  onChange,
  placeholder,
  autoFocus,
  showPlaceholder,
  className = '',
  style,
  onSlash,
  onBackspaceEmpty,
  onIndent,
  onEditingChange,
  plain,
  ariaLabel,
}: TextEditorProps) {
  const [editing, setEditing] = useState(!!autoFocus);
  const ref = useAutoGrow(value, editing);
  const [showColors, setShowColors] = useState(false);
  const [lastColor, setLastColor] = useState('rojo');
  const html = useMemo(() => renderMarkdownLite(value), [value]);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) setEditing(true);
  }, [autoFocus]);

  useEffect(() => {
    onEditingChange?.(editing);
    if (!editing) setShowColors(false);
    if (editing && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const apply = (next: string) => onChange(next);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      apply(wrapSelection(el, '**'));
    } else if (mod && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      apply(wrapSelection(el, '*'));
    } else if (mod && e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      apply(wrapSelection(el, '=='));
    } else if (e.key === 'Tab' && onIndent) {
      e.preventDefault();
      onIndent(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      el.blur();
    } else if (e.key === 'Backspace' && value === '' && onBackspaceEmpty) {
      e.preventDefault();
      onBackspaceEmpty();
    } else if (e.key === '/' && value === '' && onSlash) {
      e.preventDefault();
      onSlash(el);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Continúa las viñetas y listas numeradas automáticamente.
      const before = value.slice(0, el.selectionStart);
      const line = before.split('\n').pop() || '';
      const m = line.match(/^(\s*)([-*•]|\d+[.)])\s+(\[[ xX]\]\s+)?(.*)$/);
      if (m) {
        e.preventDefault();
        if (!m[4]) {
          // Viñeta vacía: terminar la lista
          const start = el.selectionStart - line.length;
          apply(value.slice(0, start) + value.slice(el.selectionStart));
          requestAnimationFrame(() => el.setSelectionRange(start, start));
          return;
        }
        const marker = /\d/.test(m[2]) ? `${parseInt(m[2], 10) + 1}${m[2].slice(-1)}` : m[2];
        apply(insertAtCursor(el, `\n${m[1]}${marker} ${m[3] ? '[ ] ' : ''}`));
      }
    }
  };

  if (!editing) {
    const empty = value.trim() === '';
    return (
      <div
        className={`md paper-text cursor-text whitespace-pre-wrap break-words ${className}`}
        style={style}
        onClick={() => setEditing(true)}
        onFocus={() => setEditing(true)}
        tabIndex={0}
        role="textbox"
        aria-label={ariaLabel}
      >
        {empty ? (
          <div style={{ color: 'var(--ink-soft)', opacity: showPlaceholder ? 0.55 : 0 }}>{placeholder || ' '}</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {!plain && (
        <div
          ref={barRef}
          className="no-print popover absolute bottom-full left-0 z-20 mb-1.5 flex flex-col gap-1 p-1 font-ui animate-pop"
          onPointerDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-0.5">
            <button className="icon-btn !h-8 !w-8" title="Negrita (Ctrl+B)" onClick={() => ref.current && apply(wrapSelection(ref.current, '**'))}>
              <Bold size={15} />
            </button>
            <button className="icon-btn !h-8 !w-8" title="Cursiva (Ctrl+I)" onClick={() => ref.current && apply(wrapSelection(ref.current, '*'))}>
              <Italic size={15} />
            </button>
            <button className="icon-btn !h-8 !w-8" title="Resaltar (Ctrl+Shift+H)" onClick={() => ref.current && apply(wrapSelection(ref.current, '=='))}>
              <Highlighter size={15} />
            </button>
            <button
              className="icon-btn !h-8 !w-8"
              title="Color del texto seleccionado"
              aria-pressed={showColors}
              aria-label="Color del texto"
              onClick={() => setShowColors((v) => !v)}
            >
              <Baseline size={16} style={{ color: `var(--ink-${lastColor})` }} />
            </button>
            <button className="icon-btn !h-8 !w-8" title="Viñeta" onClick={() => ref.current && apply(insertAtCursor(ref.current, value && !value.endsWith('\n') ? '\n- ' : '- '))}>
              <List size={15} />
            </button>
            <span className="mx-1 h-5 w-px bg-line" />
            {SYMBOLS.map((s) => (
              <button
                key={s}
                className="icon-btn !h-8 !w-7 font-music text-[15px]"
                title={`Insertar ${s}`}
                onClick={() => ref.current && apply(insertAtCursor(ref.current, s))}
              >
                {s}
              </button>
            ))}
          </div>
          {showColors && (
            <div className="flex items-center gap-1 border-t border-line px-1 pt-1" role="group" aria-label="Colores de texto">
              {INKS.map((ink) => (
                <button
                  key={ink.id}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]"
                  title={ink.name}
                  aria-label={`Texto ${ink.name.toLowerCase()}`}
                  onClick={() => {
                    if (!ref.current) return;
                    setLastColor(ink.id);
                    setShowColors(false);
                    apply(wrapLines(ref.current, `{${ink.id}}`, '{/}'));
                  }}
                >
                  <span className="block h-5 w-5 rounded-full" style={{ background: `var(--ink-${ink.id})`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }} />
                </button>
              ))}
              <button
                className="btn btn-ghost !min-h-[32px] !px-2 text-xs"
                title="Quitar el color de la selección (o de la línea)"
                onClick={() => {
                  if (!ref.current) return;
                  setShowColors(false);
                  apply(stripColor(ref.current));
                }}
              >
                Sin color
              </button>
            </div>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        rows={1}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => apply(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setEditing(false)}
        spellCheck
        className={`hand-input paper-text block overflow-hidden ${className}`}
        style={style}
      />
    </div>
  );
}
