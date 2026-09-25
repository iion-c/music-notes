import React, { useRef } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { CalloutBlock, ChecklistBlock, DividerBlock, HeadingBlock, TableBlock } from '../../../types/notes';
import { CALLOUTS } from '../../../lib/pageModel';
import { uid } from '../../../lib/uid';
import { TextEditor } from './TextEditor';
import { useAutoGrow } from '../paperHooks';

export interface CommonBlockProps {
  active: boolean;
  autoFocus: boolean;
  hints: boolean;
  onSlash: (anchor: HTMLElement) => void;
  onBackspaceEmpty: () => void;
  onIndent: (delta: number) => void;
}

/* ── Título ─────────────────────────────────────────────── */

const HEADING_STYLE: Record<HeadingBlock['level'], React.CSSProperties> = {
  h1: { fontSize: 'calc(var(--paper-size) * 1.55)', lineHeight: 'calc(var(--rule) * 2)', fontWeight: 700 },
  h2: { fontSize: 'calc(var(--paper-size) * 1.28)', lineHeight: 'var(--rule)', fontWeight: 700 },
  h3: { fontSize: 'calc(var(--paper-size) * 1.08)', lineHeight: 'var(--rule)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '4px' },
};

export function HeadingView({ block, onChange, ...p }: CommonBlockProps & { block: HeadingBlock; onChange: (b: HeadingBlock) => void }) {
  const ref = useAutoGrow(block.text);
  const placeholder = block.level === 'h1' ? 'Tema principal' : block.level === 'h2' ? 'Subtítulo' : 'Subtema';
  return (
    <textarea
      ref={ref}
      rows={1}
      autoFocus={p.autoFocus}
      value={block.text}
      placeholder={p.active || !block.text ? placeholder : ''}
      aria-label="Título"
      onChange={(e) => onChange({ ...block, text: e.target.value.replace(/\n/g, ' ') })}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
        if (e.key === 'Backspace' && block.text === '') {
          e.preventDefault();
          p.onBackspaceEmpty();
        }
        if (e.key === '/' && block.text === '') {
          e.preventDefault();
          p.onSlash(e.currentTarget);
        }
      }}
      className="hand-input paper-text block overflow-hidden"
      style={{ ...HEADING_STYLE[block.level], color: block.color || 'var(--ink)' }}
    />
  );
}

/* ── Recuadro (definición, regla…) ──────────────────────── */

export function CalloutView({ block, onChange, ...p }: CommonBlockProps & { block: CalloutBlock; onChange: (b: CalloutBlock) => void }) {
  const info = CALLOUTS[block.kind] || CALLOUTS.importante;
  return (
    <div className="callout my-0 pl-3 pr-2" style={{ '--c': info.color } as React.CSSProperties}>
      <div className="callout-label flex items-center gap-1.5" style={{ height: 'var(--rule)', lineHeight: 'var(--rule)' }}>
        <span aria-hidden>{info.icon}</span>
        {info.name}
      </div>
      <TextEditor
        value={block.content}
        onChange={(content) => onChange({ ...block, content })}
        placeholder={info.hint}
        showPlaceholder={p.hints || p.active}
        autoFocus={p.autoFocus}
        onSlash={p.onSlash}
        onBackspaceEmpty={p.onBackspaceEmpty}
        ariaLabel={info.name}
      />
    </div>
  );
}

/* ── Lista de tareas ────────────────────────────────────── */

export function ChecklistView({ block, onChange, ...p }: CommonBlockProps & { block: ChecklistBlock; onChange: (b: ChecklistBlock) => void }) {
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const setItems = (items: ChecklistBlock['items']) => onChange({ ...block, items });
  const focus = (id: string) => requestAnimationFrame(() => refs.current[id]?.focus());
  const done = block.items.filter((i) => i.done).length;

  return (
    <div className="paper-text">
      {block.items.map((item, idx) => (
        <label key={item.id} className="group/item flex items-center gap-2.5" style={{ height: 'var(--rule)' }}>
          <input
            type="checkbox"
            checked={item.done}
            onChange={(e) => setItems(block.items.map((i) => (i.id === item.id ? { ...i, done: e.target.checked } : i)))}
            className="h-[18px] w-[18px] shrink-0 cursor-pointer"
            style={{ accentColor: 'var(--ink)' }}
            aria-label={item.text || 'Tarea'}
          />
          <input
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            autoFocus={p.autoFocus && idx === 0}
            value={item.text}
            placeholder={p.active ? 'Nueva tarea…' : ''}
            onChange={(e) => setItems(block.items.map((i) => (i.id === item.id ? { ...i, text: e.target.value } : i)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const n = { id: uid('i'), text: '', done: false };
                const items = [...block.items];
                items.splice(idx + 1, 0, n);
                setItems(items);
                focus(n.id);
              } else if (e.key === 'Backspace' && item.text === '') {
                e.preventDefault();
                if (block.items.length === 1) return p.onBackspaceEmpty();
                setItems(block.items.filter((i) => i.id !== item.id));
                focus(block.items[Math.max(0, idx - 1)].id);
              }
            }}
            className="hand-input flex-1"
            style={{ lineHeight: 'var(--rule)', textDecoration: item.done ? 'line-through' : undefined, opacity: item.done ? 0.55 : 1 }}
          />
          {p.active && (
            <button
              className="no-print icon-btn !h-7 !w-7 opacity-0 group-hover/item:opacity-60"
              onClick={(e) => {
                e.preventDefault();
                if (block.items.length === 1) return p.onBackspaceEmpty();
                setItems(block.items.filter((i) => i.id !== item.id));
              }}
              aria-label="Quitar tarea"
            >
              <X size={14} />
            </button>
          )}
        </label>
      ))}
      {block.items.length > 1 && (
        <div className="font-ui text-[11px] font-semibold" style={{ height: 'var(--rule)', lineHeight: 'var(--rule)', color: 'var(--ink-soft)' }}>
          {done}/{block.items.length} completadas
        </div>
      )}
    </div>
  );
}

/* ── Tabla (método de cuadros) ──────────────────────────── */

function Cell({ value, onChange, header }: { value: string; onChange: (v: string) => void; header: boolean }) {
  const ref = useAutoGrow(value);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="hand-input paper-text block overflow-hidden px-2"
      style={{ fontWeight: header ? 700 : undefined }}
      aria-label={header ? 'Encabezado' : 'Celda'}
    />
  );
}

export function TableView({ block, onChange, active }: CommonBlockProps & { block: TableBlock; onChange: (b: TableBlock) => void }) {
  const cols = Math.max(1, ...block.rows.map((r) => r.length));
  const setCell = (r: number, c: number, v: string) =>
    onChange({ ...block, rows: block.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)) });
  const line = 'color-mix(in srgb, var(--ink) 55%, transparent)';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ boxShadow: `inset 1px 1px 0 ${line}` }}>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} style={ri === 0 ? { background: 'color-mix(in srgb, var(--ink) 6%, transparent)' } : undefined}>
                {Array.from({ length: cols }).map((_, ci) => (
                  <td key={ci} className="min-w-[90px] align-top p-0" style={{ boxShadow: `inset -1px -1px 0 ${line}` }}>
                    <Cell value={row[ci] ?? ''} header={ri === 0} onChange={(v) => setCell(ri, ci, v)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {active && (
        <div className="no-print flex flex-wrap gap-1 font-ui" style={{ minHeight: 'var(--rule)', paddingTop: 4 }}>
          <button className="btn btn-ghost !min-h-[28px] !px-2 text-xs" onClick={() => onChange({ ...block, rows: [...block.rows, Array(cols).fill('')] })}>
            <Plus size={13} /> Fila
          </button>
          <button className="btn btn-ghost !min-h-[28px] !px-2 text-xs" onClick={() => onChange({ ...block, rows: block.rows.map((r) => [...r, '']) })}>
            <Plus size={13} /> Columna
          </button>
          {block.rows.length > 2 && (
            <button className="btn btn-ghost !min-h-[28px] !px-2 text-xs" onClick={() => onChange({ ...block, rows: block.rows.slice(0, -1) })}>
              <Trash2 size={13} /> Última fila
            </button>
          )}
          {cols > 1 && (
            <button className="btn btn-ghost !min-h-[28px] !px-2 text-xs" onClick={() => onChange({ ...block, rows: block.rows.map((r) => r.slice(0, cols - 1)) })}>
              <Trash2 size={13} /> Última columna
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Separador ──────────────────────────────────────────── */

export function DividerView(_: { block: DividerBlock }) {
  return (
    <div className="flex items-center" style={{ height: 'var(--rule)' }} role="separator">
      <svg width="100%" height="10" preserveAspectRatio="none" viewBox="0 0 400 10" aria-hidden>
        <path d="M0 5 Q 10 1 20 5 T 40 5 T 60 5 T 80 5 T 100 5 T 120 5 T 140 5 T 160 5 T 180 5 T 200 5 T 220 5 T 240 5 T 260 5 T 280 5 T 300 5 T 320 5 T 340 5 T 360 5 T 380 5 T 400 5" fill="none" stroke="var(--ink-soft)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
