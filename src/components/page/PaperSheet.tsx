import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, EllipsisVertical, Eye, ListIndentDecrease, ListIndentIncrease, Plus, Trash2 } from 'lucide-react';
import type { CalloutKind, ContentBlock, HighlightColor, Notebook, NotePage, PaperStyle } from '../../types/notes';
import type { StaveBlock } from '../../types/music';
import { PAPER_FONTS, PAPER_TONES, INKS, effectiveInk, paperVars, patternClass } from '../../lib/paper';
import { CALLOUTS, type BlockTypeInfo } from '../../lib/pageModel';
import { formatDate } from '../../lib/uid';
import { reviewLabel } from '../../lib/review';
import { useSnapToRule } from './paperHooks';
import { TextEditor } from './blocks/TextEditor';
import { CalloutView, ChecklistView, DividerView, HeadingView, TableView } from './blocks/SimpleBlocks';
import { ImageView } from './blocks/ImageView';
import { SketchView } from './blocks/SketchView';
import { StaveView } from './blocks/StaveView';
import { InsertMenu } from './InsertMenu';
import { Popover } from '../ui/primitives';

const HIGHLIGHTS: { id: HighlightColor; color: string; name: string }[] = [
  { id: 'yellow', color: '#ffd83d', name: 'Amarillo' },
  { id: 'green', color: '#7ee0a0', name: 'Verde' },
  { id: 'blue', color: '#7cc4ff', name: 'Azul' },
  { id: 'pink', color: '#ff9ecb', name: 'Rosa' },
  { id: 'orange', color: '#ffb266', name: 'Naranja' },
];

const CUE_HINTS = ['¿Qué pregunta responde esto?', 'Palabra clave', '¿Por qué importa?', '¿Cómo lo explicarías?'];

export interface SheetController {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  focusId: string | null;
  focus: (id: string) => void;
  insertAfter: (afterId: string | null, type: BlockTypeInfo['type'], opts?: { replace?: boolean }) => void;
  openStaveEditor: (blockId: string) => void;
}

interface Props {
  page: NotePage;
  notebook?: Notebook;
  notebooks: Notebook[];
  sections: string[];
  paper: PaperStyle;
  width: number;
  hints: boolean;
  review: boolean;
  onChange: (fn: (p: NotePage) => NotePage) => void;
  ctl: SheetController;
}

export function PaperSheet({ page, notebook, notebooks, sections, paper, width, hints, review, onChange, ctl }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState('');
  const layout = page.layout || 'free';
  const cornell = layout === 'cornell' && !compact;
  const vars = useMemo(() => paperVars(paper), [paper]);
  const tone = PAPER_TONES[paper.tone];
  const ink = effectiveInk(paper);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCompact(el.clientWidth < 560));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => setRevealed(new Set()), [review, page.id]);

  const setBlock = (id: string, next: ContentBlock) => onChange((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === id ? next : b)) }));
  const patchBlock = (id: string, patch: Partial<ContentBlock>) =>
    onChange((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)) }));

  const removeBlock = (id: string, focusPrev = false) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    onChange((p) => {
      const blocks = p.blocks.filter((b) => b.id !== id);
      return { ...p, blocks };
    });
    if (focusPrev) ctl.setActiveId(page.blocks[idx - 1]?.id || null);
  };

  const move = (id: string, delta: number) =>
    onChange((p) => {
      const blocks = [...p.blocks];
      const i = blocks.findIndex((b) => b.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= blocks.length) return p;
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...p, blocks };
    });

  const duplicate = (id: string) =>
    onChange((p) => {
      const i = p.blocks.findIndex((b) => b.id === id);
      if (i < 0) return p;
      const copy = { ...structuredClone(p.blocks[i]), id: `${p.blocks[i].id}-c${Date.now().toString(36)}` } as ContentBlock;
      if (copy.type === 'stave') copy.data = { ...copy.data, id: `stave-${Date.now().toString(36)}` };
      const blocks = [...p.blocks];
      blocks.splice(i + 1, 0, copy);
      return { ...p, blocks };
    });

  const addEndText = () => {
    const last = page.blocks[page.blocks.length - 1];
    if (last && last.type === 'text' && !last.content) return ctl.focus(last.id);
    ctl.insertAfter(last?.id ?? null, 'text');
  };

  const titleRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [page.title, paper, width]);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !page.tags.includes(t)) onChange((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };

  const fontIsHand = PAPER_FONTS[paper.font].hand;
  const padX = compact ? 14 : Math.round(paper.rule * 0.9);
  const contentLeft = cornell ? 0 : paper.marginLine && !compact ? Math.round(paper.rule * 2.2) + 14 : padX;

  return (
    <div
      ref={sheetRef}
      className={`paper print-root mx-auto ${fontIsHand ? 'paper-hand' : ''}`}
      style={{ ...vars, maxWidth: width, width: '100%' }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) ctl.setActiveId(null);
      }}
    >
      {/* ── Encabezado de la hoja ── */}
      <header className="relative" style={{ padding: `${Math.round(paper.rule * 1.1)}px ${padX}px ${Math.round(paper.rule * 0.5)}px ${cornell ? padX : contentLeft}px` }}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-ui text-[12px]" style={{ color: 'var(--ink-soft)' }}>
          <label className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wide">Fecha</span>
            <input
              type="date"
              value={page.meta?.date || ''}
              onChange={(e) => onChange((p) => ({ ...p, meta: { ...p.meta, date: e.target.value } }))}
              className="hand-input paper-text !w-auto"
              style={{ fontSize: 'calc(var(--paper-size) * 0.8)', lineHeight: '1.6', colorScheme: tone.dark ? 'dark' : 'light' }}
            />
          </label>
          <label className="flex min-w-0 items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wide">Asignatura</span>
            <select
              value={page.notebookId}
              onChange={(e) => onChange((p) => ({ ...p, notebookId: e.target.value }))}
              className="hand-input paper-text !w-auto max-w-[220px] cursor-pointer truncate"
              style={{ fontSize: 'calc(var(--paper-size) * 0.8)', lineHeight: '1.6' }}
            >
              {notebooks.map((n) => (
                <option key={n.id} value={n.id} style={{ color: '#222', fontFamily: 'Inter' }}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wide">Prof.</span>
            <input
              value={page.meta?.professor ?? ''}
              placeholder={notebook?.professor || '—'}
              onChange={(e) => onChange((p) => ({ ...p, meta: { ...p.meta, professor: e.target.value } }))}
              className="hand-input paper-text !w-[140px]"
              style={{ fontSize: 'calc(var(--paper-size) * 0.8)', lineHeight: '1.6' }}
            />
          </label>
          <label className="flex min-w-0 items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wide">Unidad</span>
            <input
              list={`sections-${page.id}`}
              value={page.meta?.section ?? ''}
              placeholder="—"
              onChange={(e) => onChange((p) => ({ ...p, meta: { ...p.meta, section: e.target.value } }))}
              className="hand-input paper-text !w-[130px]"
              style={{ fontSize: 'calc(var(--paper-size) * 0.8)', lineHeight: '1.6' }}
            />
            <datalist id={`sections-${page.id}`}>
              {sections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>

        <textarea
          ref={titleRef}
          value={page.title}
          rows={1}
          onChange={(e) => onChange((p) => ({ ...p, title: e.target.value.replace(/\n/g, ' ') }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const first = page.blocks[0];
              if (first) ctl.focus(first.id);
            }
          }}
          placeholder="Tema de la clase"
          aria-label="Título de la hoja"
          className="hand-input paper-text mt-2 block overflow-hidden"
          style={{ fontSize: 'calc(var(--paper-size) * 1.7)', lineHeight: 1.25, fontWeight: fontIsHand ? 400 : 700 }}
        />

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-ui text-xs">
          {page.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: 'color-mix(in srgb, var(--ink) 8%, transparent)', color: 'var(--ink)' }}>
              #{t}
              <button className="no-print opacity-50 hover:opacity-100" onClick={() => onChange((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }))} aria-label={`Quitar etiqueta ${t}`}>
                ×
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="+ etiqueta"
            className="no-print hand-input !w-28 font-ui text-xs"
            aria-label="Añadir etiqueta"
          />
          {page.review?.nextReview && (
            <span className="ml-auto rounded-full px-2 py-0.5" style={{ color: 'var(--ink-soft)' }}>
              {reviewLabel(page)}
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0" style={{ borderBottom: `3px double color-mix(in srgb, var(--ink-soft) 60%, transparent)` }} />
      </header>

      {/* ── Cuerpo rayado ── */}
      <div
        className={`relative ${patternClass(paper.pattern)} ${cornell ? 'cornell-rule' : paper.marginLine && !compact ? 'paper-margin-line' : ''}`}
        style={{ paddingBottom: 0 }}
      >
        {cornell && (
          <div className="grid font-ui text-[11px] font-bold uppercase tracking-wider" style={{ gridTemplateColumns: 'var(--cue-w) 1fr', height: 'var(--rule)', lineHeight: 'var(--rule)', color: 'var(--ink-soft)' }}>
            <span style={{ paddingLeft: padX }}>Claves y preguntas</span>
            <span style={{ paddingLeft: padX }}>Notas de clase</span>
          </div>
        )}

        {page.blocks.map((block, idx) => (
          <BlockRow
            key={block.id}
            block={block}
            index={idx}
            total={page.blocks.length}
            cornell={cornell}
            compact={compact}
            showCues={layout === 'cornell'}
            outline={layout === 'outline'}
            padX={padX}
            contentLeft={contentLeft}
            paper={paper}
            ink={ink}
            darkPaper={tone.dark}
            hints={hints}
            review={review}
            revealed={revealed.has(block.id)}
            onReveal={() => setRevealed((s) => new Set(s).add(block.id))}
            ctl={ctl}
            onChange={(b) => setBlock(block.id, b)}
            onPatch={(patch) => patchBlock(block.id, patch)}
            onRemove={(focusPrev) => removeBlock(block.id, focusPrev)}
            onMove={(d) => move(block.id, d)}
            onDuplicate={() => duplicate(block.id)}
          />
        ))}

        {!review && (
          <button
            className="no-print group block w-full text-left"
            style={{ height: `calc(var(--rule) * ${page.blocks.length ? 3 : 6})`, paddingLeft: cornell ? `calc(var(--cue-w) + ${padX}px)` : contentLeft }}
            onClick={addEndText}
          >
            <span className="paper-text block opacity-0 transition-opacity group-hover:opacity-50" style={{ color: 'var(--ink-soft)' }}>
              Sigue escribiendo… (escribe / para insertar pentagrama, tabla, dibujo…)
            </span>
          </button>
        )}
      </div>

      {/* ── Resumen (Cornell) ── */}
      {(layout === 'cornell' || page.summary) && (
        <section className={`relative ${patternClass(paper.pattern)}`} style={{ borderTop: `2px solid var(--paper-margin)` }}>
          <div className="font-ui text-[11px] font-bold uppercase tracking-wider" style={{ height: 'var(--rule)', lineHeight: 'var(--rule)', paddingLeft: padX, color: 'var(--ink-soft)' }}>
            Resumen
          </div>
          <div className="relative" style={{ padding: `0 ${padX}px`, minHeight: 'calc(var(--rule) * 3)' }}>
            <TextEditor
              value={page.summary || ''}
              onChange={(summary) => onChange((p) => ({ ...p, summary }))}
              placeholder={hints ? 'Resume la hoja en 2–3 frases, con tus propias palabras. ¿Qué es lo esencial?' : ''}
              showPlaceholder
              ariaLabel="Resumen"
            />
            {review && !revealed.has('__summary') && (
              <button className="recite-cover font-ui text-sm" style={{ color: 'var(--ink-soft)' }} onClick={() => setRevealed((s) => new Set(s).add('__summary'))}>
                <Eye size={15} className="mr-1.5" /> ¿Puedes resumir la hoja de memoria? Toca para ver
              </button>
            )}
          </div>
          <div style={{ height: 'var(--rule)' }} />
        </section>
      )}

      <footer className="flex items-center justify-between font-ui text-[10px]" style={{ padding: `6px ${padX}px 10px`, color: 'var(--ink-soft)' }}>
        <span>{notebook?.name}</span>
        <span>{formatDate(page.meta?.date || page.createdAt)}</span>
      </footer>
    </div>
  );
}

/* ── Fila de bloque ─────────────────────────────────────── */

interface RowProps {
  block: ContentBlock;
  index: number;
  total: number;
  cornell: boolean;
  compact: boolean;
  showCues: boolean;
  outline: boolean;
  padX: number;
  contentLeft: number;
  paper: PaperStyle;
  ink: string;
  darkPaper: boolean;
  hints: boolean;
  review: boolean;
  revealed: boolean;
  onReveal: () => void;
  ctl: SheetController;
  onChange: (b: ContentBlock) => void;
  onPatch: (patch: Partial<ContentBlock>) => void;
  onRemove: (focusPrev: boolean) => void;
  onMove: (delta: number) => void;
  onDuplicate: () => void;
}

const TEXTUAL = ['text', 'callout', 'heading'];

function BlockRow(p: RowProps) {
  const { block, ctl } = p;
  const { outer, inner } = useSnapToRule<HTMLDivElement>();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [insertAnchor, setInsertAnchor] = useState<{ el: HTMLElement; replace: boolean } | null>(null);
  const active = ctl.activeId === block.id;
  const autoFocus = ctl.focusId === block.id;
  const indent = Math.max(0, Math.min(4, block.indent || 0));
  const coverable = p.review && !p.revealed && !['heading', 'divider'].includes(block.type);

  const common = {
    active,
    autoFocus,
    hints: p.hints,
    onSlash: (el: HTMLElement) => setInsertAnchor({ el, replace: true }),
    onBackspaceEmpty: () => p.onRemove(true),
    onIndent: (d: number) => p.onPatch({ indent: Math.max(0, Math.min(4, indent + d)) }),
  };

  let content: React.ReactNode = null;
  switch (block.type) {
    case 'text':
      content = (
        <div className="flex">
          {p.outline && (
            <span className="paper-text w-[1.2em] shrink-0 select-none" style={{ color: 'var(--ink-soft)' }} aria-hidden>
              {['•', '◦', '▪', '–', '·'][indent]}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <TextEditor
              value={block.content}
              onChange={(content) => p.onChange({ ...block, content })}
              placeholder={p.index === 0 ? 'Empieza a escribir… (escribe / para insertar un pentagrama, una regla, un dibujo…)' : 'Escribe…'}
              showPlaceholder={p.total === 1 || active}
              autoFocus={autoFocus}
              onSlash={common.onSlash}
              onBackspaceEmpty={common.onBackspaceEmpty}
              onIndent={common.onIndent}
              onEditingChange={(e) => e && ctl.setActiveId(block.id)}
              ariaLabel="Texto"
            />
          </div>
        </div>
      );
      break;
    case 'heading':
      content = <HeadingView block={block} onChange={p.onChange} {...common} />;
      break;
    case 'callout':
      content = <CalloutView block={block} onChange={p.onChange} {...common} />;
      break;
    case 'checklist':
      content = <ChecklistView block={block} onChange={p.onChange} {...common} />;
      break;
    case 'table':
      content = <TableView block={block} onChange={p.onChange} {...common} />;
      break;
    case 'divider':
      content = <DividerView block={block} />;
      break;
    case 'image':
      content = <ImageView block={block} onChange={p.onChange} active={active} />;
      break;
    case 'sketch':
      content = <SketchView block={block} onChange={p.onChange} active={active} autoFocus={autoFocus} darkPaper={p.darkPaper} inkColor={p.paper.ink} />;
      break;
    case 'stave':
      content = (
        <StaveView
          stave={block.data}
          onChange={(data: StaveBlock) => p.onChange({ ...block, data })}
          onOpenEditor={() => ctl.openStaveEditor(block.id)}
          active={active}
          ink={p.ink}
          paperColor={PAPER_TONES[p.paper.tone].paper}
        />
      );
      break;
  }

  const cueEditor = p.showCues && (
    <TextEditor
      value={block.cue || ''}
      onChange={(cue) => p.onPatch({ cue: cue || undefined })}
      placeholder={p.hints ? CUE_HINTS[p.index % CUE_HINTS.length] : ''}
      showPlaceholder={active}
      plain
      className="!text-[0.92em]"
      style={{ color: 'var(--ink)', opacity: 0.9 }}
      ariaLabel="Clave o pregunta"
    />
  );

  return (
    <div
      ref={outer}
      className="group/row relative"
      onPointerDownCapture={() => {
        if (!active) ctl.setActiveId(block.id);
      }}
      data-block={block.type}
      data-block-id={block.id}
    >
      <div ref={inner} className={p.cornell ? 'grid' : ''} style={p.cornell ? { gridTemplateColumns: 'var(--cue-w) 1fr' } : undefined}>
        {p.cornell && <div style={{ padding: `0 ${p.padX}px` }}>{cueEditor}</div>}
        <div
          className="relative min-w-0"
          style={{
            paddingLeft: (p.cornell ? p.padX : p.contentLeft) + indent * Math.round(p.paper.rule * 1.1),
            paddingRight: p.padX + (p.compact ? 14 : 4),
          }}
        >
          {!p.cornell && p.showCues && (block.cue || active) && (
            <div className="flex items-baseline gap-1" style={{ color: 'var(--ink-soft)' }}>
              <span className="font-ui text-[11px] font-bold uppercase">Clave:</span>
              <div className="min-w-0 flex-1">{cueEditor}</div>
            </div>
          )}
          <div className={block.highlight ? `block-hl block-hl-${block.highlight}` : ''}>{content}</div>
          {coverable && (
            <button className="recite-cover font-ui text-sm" style={{ color: 'var(--ink-soft)' }} onClick={p.onReveal}>
              <Eye size={15} className="mr-1.5" />
              {block.cue ? 'Responde la clave en voz alta y toca para comprobar' : '¿Qué recuerdas de aquí? Toca para ver'}
            </button>
          )}
        </div>
      </div>

      {/* Controles de la fila */}
      {!p.review && (
        <div
          className={`no-print absolute right-0.5 top-0 z-10 flex flex-col items-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}
        >
          <div className="flex flex-col items-center rounded-md" style={{ background: 'color-mix(in srgb, var(--paper) 85%, transparent)' }}>
            <button className="icon-btn !h-6 !w-6" style={{ color: 'var(--ink-soft)' }} onClick={(e) => setInsertAnchor({ el: e.currentTarget, replace: false })} aria-label="Insertar bloque debajo" title="Insertar debajo">
              <Plus size={15} />
            </button>
            <button className="icon-btn !h-6 !w-6" style={{ color: 'var(--ink-soft)' }} onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Opciones del bloque" title="Opciones">
              <EllipsisVertical size={15} />
            </button>
          </div>
        </div>
      )}

      <InsertMenu
        anchor={insertAnchor?.el || null}
        open={!!insertAnchor}
        onClose={() => setInsertAnchor(null)}
        onPick={(t) => ctl.insertAfter(block.id, t, { replace: insertAnchor?.replace })}
      />

      <Popover anchor={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)} align="end" width={250}>
        <BlockMenu {...p} indent={indent} close={() => setMenuAnchor(null)} />
      </Popover>
    </div>
  );
}

function BlockMenu(p: RowProps & { indent: number; close: () => void }) {
  const { block } = p;
  const textual = TEXTUAL.includes(block.type);
  const text = block.type === 'text' || block.type === 'callout' ? block.content : block.type === 'heading' ? block.text : '';
  const convert = (target: string) => {
    const base = { id: block.id, cue: block.cue, indent: block.indent, highlight: block.highlight };
    if (target === 'text') p.onChange({ ...base, type: 'text', content: text });
    else if (target.startsWith('heading')) p.onChange({ ...base, type: 'heading', text: text.replace(/\n/g, ' '), level: target === 'heading:h1' ? 'h1' : target === 'heading:h3' ? 'h3' : 'h2' });
    else p.onChange({ ...base, type: 'callout', kind: target.split(':')[1] as CalloutKind, content: text });
    p.close();
  };

  return (
    <div className="text-sm">
      {textual && (
        <>
          <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Convertir en</div>
          <div className="grid grid-cols-2 gap-0.5">
            {[
              ['text', 'Texto'],
              ['heading', 'Subtítulo'],
              ...Object.entries(CALLOUTS).map(([k, v]) => [`callout:${k}`, v.name]),
            ].map(([k, name]) => (
              <button key={k} className="menu-item !min-h-[32px] text-[13px]" onClick={() => convert(k)}>
                {name}
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-line" />
        </>
      )}

      <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Marcatextos</div>
      <div className="flex items-center gap-1 px-2 pb-1.5">
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]" onClick={() => p.onPatch({ highlight: undefined })} aria-label="Sin resaltado">
          ∅
        </button>
        {HIGHLIGHTS.map((h) => (
          <button key={h.id} className="flex h-8 w-8 items-center justify-center" onClick={() => p.onPatch({ highlight: h.id })} aria-label={h.name} aria-pressed={block.highlight === h.id}>
            <span className="block h-5 w-5 rounded-full" style={{ background: h.color, boxShadow: block.highlight === h.id ? '0 0 0 2px var(--raised), 0 0 0 4px var(--accent)' : undefined }} />
          </button>
        ))}
      </div>

      {block.type === 'heading' && (
        <>
          <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Color del título</div>
          <div className="flex items-center gap-1 px-2 pb-1.5">
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted" onClick={() => p.onChange({ ...block, color: undefined })} aria-label="Color de la tinta">
              ∅
            </button>
            {INKS.map((i) => (
              <button key={i.id} className="flex h-8 w-8 items-center justify-center" onClick={() => p.onChange({ ...block, color: p.darkPaper ? i.dark : i.light })} aria-label={i.name}>
                <span className="block h-5 w-5 rounded-full" style={{ background: p.darkPaper ? i.dark : i.light }} />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="my-1 h-px bg-line" />
      <div className="flex items-center gap-0.5 px-1">
        <button className="icon-btn" disabled={p.index === 0} onClick={() => p.onMove(-1)} aria-label="Subir" title="Subir">
          <ArrowUp size={16} />
        </button>
        <button className="icon-btn" disabled={p.index === p.total - 1} onClick={() => p.onMove(1)} aria-label="Bajar" title="Bajar">
          <ArrowDown size={16} />
        </button>
        <button className="icon-btn" disabled={p.indent === 0} onClick={() => p.onPatch({ indent: p.indent - 1 })} aria-label="Reducir sangría" title="Reducir sangría (Shift+Tab)">
          <ListIndentDecrease size={16} />
        </button>
        <button className="icon-btn" disabled={p.indent >= 4} onClick={() => p.onPatch({ indent: p.indent + 1 })} aria-label="Aumentar sangría" title="Aumentar sangría (Tab)">
          <ListIndentIncrease size={16} />
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            p.onDuplicate();
            p.close();
          }}
          aria-label="Duplicar"
          title="Duplicar"
        >
          <Copy size={16} />
        </button>
        <button
          className="icon-btn ml-auto"
          style={{ color: 'var(--danger)' }}
          onClick={() => {
            p.close();
            const hasContent = block.type === 'stave' || block.type === 'sketch' || block.type === 'image' || !!(block as { content?: string }).content;
            if (!hasContent || window.confirm('¿Eliminar este bloque?')) p.onRemove(false);
          }}
          aria-label="Eliminar bloque"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

