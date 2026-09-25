import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Download,
  Ellipsis,
  HardDrive,
  Heading2,
  Music2,
  PenLine,
  Plus,
  Printer,
  SlidersHorizontal,
  Star,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import type { NotePage } from '../../types/notes';
import type { StaveBlock } from '../../types/music';
import { useStore } from '../../store';
import { PAGE_WIDTHS, resolvePaper, notebookColor } from '../../lib/paper';
import { createBlock, type BlockTypeInfo } from '../../lib/pageModel';
import { completeReview, REVIEW_INTERVALS } from '../../lib/review';
import { countNotes } from '../../lib/score';
import { compressImage, downloadBlob } from '../../lib/image';
import { formatDate } from '../../lib/uid';
import { PaperSheet, type SheetController } from './PaperSheet';
import { CustomizePanel } from './CustomizePanel';
import { InsertMenu } from './InsertMenu';
import { ArmoniaScoreEditorModal } from '../stave/ArmoniaScoreEditorModal';
import { Popover, Segmented } from '../ui/primitives';

interface Props {
  page: NotePage;
  startInReview?: boolean;
  onOpenSidebar: () => void;
}

export function PageView({ page, startInReview, onOpenSidebar }: Props) {
  const { notebooks, pages, settings, user, updatePage, deletePage, duplicatePage, setView, toast } = useStore();
  const notebook = notebooks.find((n) => n.id === page.notebookId);
  const paper = resolvePaper(settings, notebook, page);
  const width = PAGE_WIDTHS[settings.pageWidth].px;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [customize, setCustomize] = useState(false);
  const [review, setReview] = useState(!!startInReview);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [editing, setEditing] = useState<{ blockId: string; isNew: boolean } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReview(!!startInReview);
    setActiveId(null);
    scroller.current?.scrollTo({ top: 0 });
  }, [page.id, startInReview]);

  useEffect(() => {
    if (!focusId) return;
    const t = setTimeout(() => setFocusId(null), 400);
    return () => clearTimeout(t);
  }, [focusId]);

  const change = useCallback((fn: (p: NotePage) => NotePage) => updatePage(page.id, fn), [updatePage, page.id]);

  const sections = useMemo(
    () => [...new Set(pages.filter((p) => p.notebookId === page.notebookId).map((p) => p.meta?.section).filter(Boolean) as string[])],
    [pages, page.notebookId],
  );

  const insertAfter = useCallback(
    (afterId: string | null, type: BlockTypeInfo['type'], opts: { replace?: boolean } = {}) => {
      const block = createBlock(type);
      change((p) => {
        const blocks = [...p.blocks];
        const idx = afterId ? blocks.findIndex((b) => b.id === afterId) : -1;
        if (opts.replace && idx >= 0) {
          const old = blocks[idx];
          blocks[idx] = { ...block, cue: old.cue, indent: old.indent } as typeof block;
        } else {
          blocks.splice(idx >= 0 ? idx + 1 : blocks.length, 0, block);
        }
        return { ...p, blocks };
      });
      setActiveId(block.id);
      setFocusId(block.id);
      if (block.type === 'stave') setEditing({ blockId: block.id, isNew: true });
      requestAnimationFrame(() => document.querySelector(`[data-block-id="${block.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    },
    [change],
  );

  const ctl: SheetController = {
    activeId,
    setActiveId,
    focusId,
    focus: (id) => {
      setActiveId(id);
      setFocusId(id);
    },
    insertAfter,
    openStaveEditor: (blockId) => setEditing({ blockId, isNew: false }),
  };

  // Pegar una imagen (captura, foto) crea un bloque de imagen.
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      const src = await compressImage(file);
      const block = { ...createBlock('image'), src } as ReturnType<typeof createBlock>;
      change((p) => {
        const blocks = [...p.blocks];
        const idx = activeId ? blocks.findIndex((b) => b.id === activeId) : -1;
        blocks.splice(idx >= 0 ? idx + 1 : blocks.length, 0, block);
        return { ...p, blocks };
      });
      setActiveId(block.id);
      toast('Imagen pegada en la hoja');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [activeId, change, toast]);

  const editingBlock = editing ? page.blocks.find((b) => b.id === editing.blockId) : undefined;
  const editingStave = editingBlock?.type === 'stave' ? editingBlock.data : undefined;

  const closeEditor = () => {
    // Un pentagrama nuevo que se cierra sin escribir nada no deja rastro en la hoja.
    if (editing?.isNew && editingStave && countNotes(editingStave) === 0 && !editingStave.title) {
      const id = editing.blockId;
      change((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }));
    }
    setEditing(null);
  };

  const saveStave = (data: StaveBlock) => {
    if (!editing) return;
    const id = editing.blockId;
    change((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === id && b.type === 'stave' ? { ...b, data } : b)) }));
    setEditing(null);
  };

  const finishReview = () => {
    const next = completeReview(page);
    change((p) => ({ ...p, review: next }));
    setReview(false);
    toast(`¡Repaso hecho! El próximo será el ${formatDate(next.nextReview)}.`);
  };

  const exportPage = () => {
    const data = { notebooks: notebook ? [notebook] : [], pages: [page], version: '3', exportDate: new Date().toISOString() };
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${(page.title || 'hoja').replace(/[^\wáéíóúñ-]+/gi, '-')}.json`);
  };

  const dockAfter = activeId && page.blocks.some((b) => b.id === activeId) ? activeId : page.blocks[page.blocks.length - 1]?.id ?? null;
  const stage = page.review?.stage || 0;

  return (
    <div className="print-root flex h-full min-w-0 flex-1">
      <div className="print-root relative flex min-w-0 flex-1 flex-col">
        {/* Barra superior */}
        <div className="no-print flex items-center gap-1 border-b border-line bg-desk/90 px-2 py-1.5 backdrop-blur sm:px-3">
          <button className="icon-btn lg:hidden" onClick={onOpenSidebar} aria-label="Abrir cuadernos">
            <ArrowLeft size={18} />
          </button>
          <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="Ruta">
            {notebook && (
              <button className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-muted hover:text-ink" onClick={() => setView({ name: 'notebook', notebookId: notebook.id })}>
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: notebookColor(notebook) }} />
                <span className="truncate">{notebook.name}</span>
              </button>
            )}
            {page.meta?.section && (
              <>
                <ChevronRight size={14} className="shrink-0 text-muted" />
                <span className="hidden truncate text-muted sm:inline">{page.meta.section}</span>
              </>
            )}
            <ChevronRight size={14} className="hidden shrink-0 text-muted sm:block" />
            <span className="hidden truncate font-medium sm:inline">{page.title || 'Sin título'}</span>
          </nav>

          <span className="ml-2 hidden items-center gap-1 text-xs text-muted md:flex" title={user ? 'Se guarda en tu cuenta y funciona sin conexión' : 'Se guarda en este navegador'}>
            {user ? <Cloud size={13} /> : <HardDrive size={13} />}
            {user ? 'Sincronizado' : 'En este dispositivo'}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden md:block">
              <Segmented
                value={page.layout || 'free'}
                onChange={(layout) => change((p) => ({ ...p, layout }))}
                label="Diseño de la hoja"
                options={[
                  { value: 'cornell', label: 'Cornell', title: 'Claves, notas y resumen' },
                  { value: 'outline', label: 'Esquema', title: 'Ideas con sangría' },
                  { value: 'free', label: 'Libre', title: 'Una columna' },
                ]}
              />
            </div>
            <button className="btn btn-ghost" onClick={() => (review ? setReview(false) : setReview(true))} aria-pressed={review} title="Autoevaluarte tapando las notas (recitar)">
              <Brain size={16} /> <span className="hidden sm:inline">{review ? 'Salir del repaso' : 'Repasar'}</span>
            </button>
            <button className="icon-btn" onClick={() => setCustomize((c) => !c)} aria-pressed={customize} title="Personalizar papel y letra" aria-label="Personalizar">
              <SlidersHorizontal size={17} />
            </button>
            <button className="icon-btn" onClick={() => change((p) => ({ ...p, isFavorite: !p.isFavorite }))} aria-pressed={!!page.isFavorite} title="Favorita" aria-label="Marcar como favorita">
              <Star size={17} className={page.isFavorite ? 'fill-current' : ''} />
            </button>
            <button className="icon-btn" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Más opciones">
              <Ellipsis size={18} />
            </button>
          </div>
        </div>

        {review && (
          <div className="no-print flex flex-wrap items-center gap-2 border-b border-line bg-accent-soft px-4 py-2 text-sm">
            <Brain size={16} className="text-accent" />
            <span className="min-w-0 flex-1">
              <b>Modo repaso.</b> Lee cada clave, responde en voz alta y luego destapa para comprobar. Repaso {stage + 1} · el siguiente será en {REVIEW_INTERVALS[Math.min(stage + 1, REVIEW_INTERVALS.length - 1)]} días.
            </span>
            <button className="btn btn-primary !min-h-[32px]" onClick={finishReview}>
              <Check size={15} /> Terminé el repaso
            </button>
            <button className="icon-btn" onClick={() => setReview(false)} aria-label="Salir del repaso">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Escritorio con la hoja */}
        <div ref={scroller} className="print-root flex-1 overflow-y-auto overflow-x-hidden px-0 pb-28 pt-0 sm:px-6 sm:pt-6" onPointerDown={(e) => e.target === e.currentTarget && setActiveId(null)}>
          <PaperSheet
            page={page}
            notebook={notebook}
            notebooks={notebooks}
            sections={sections}
            paper={paper}
            width={width}
            hints={settings.methodHints}
            review={review}
            onChange={change}
            ctl={ctl}
          />
        </div>

        {/* Barra flotante para añadir bloques */}
        {!review && (
          <div className="no-print pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]">
            <div className="popover pointer-events-auto flex items-center gap-0.5 rounded-full p-1">
              {([
                ['text', Type, 'Texto'],
                ['heading', Heading2, 'Título'],
                ['stave', Music2, 'Pentagrama'],
                ['sketch', PenLine, 'Dibujo'],
              ] as const).map(([t, Icon, label]) => (
                <button key={t} className="btn btn-ghost !rounded-full !px-3" onClick={() => insertAfter(dockAfter, t)} title={`Añadir ${label.toLowerCase()}`}>
                  <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
              <button className="btn btn-primary !rounded-full !px-3" onClick={(e) => setMoreAnchor(e.currentTarget)} title="Más bloques">
                <Plus size={16} /> <span className="hidden sm:inline">Más</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel de personalización */}
      {customize && (
        <>
          <div className="no-print hidden w-[340px] shrink-0 border-l border-line lg:block">
            <CustomizePanel page={page} notebook={notebook} onClose={() => setCustomize(false)} onChangePage={change} />
          </div>
          <div className="no-print fixed inset-0 z-50 flex items-end bg-black/30 lg:hidden" onPointerDown={(e) => e.target === e.currentTarget && setCustomize(false)}>
            <div className="h-[78dvh] w-full overflow-hidden rounded-t-2xl shadow-pop animate-pop">
              <CustomizePanel page={page} notebook={notebook} onClose={() => setCustomize(false)} onChangePage={change} />
            </div>
          </div>
        </>
      )}

      <InsertMenu anchor={moreAnchor} open={!!moreAnchor} onClose={() => setMoreAnchor(null)} onPick={(t) => insertAfter(dockAfter, t)} />

      <Popover anchor={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)} align="end" width={230}>
        <button
          className="menu-item"
          onClick={() => {
            setMenuAnchor(null);
            duplicatePage(page.id);
          }}
        >
          <Copy size={15} /> Duplicar hoja
        </button>
        <button
          className="menu-item"
          onClick={() => {
            setMenuAnchor(null);
            setActiveId(null);
            setTimeout(() => window.print(), 50);
          }}
        >
          <Printer size={15} /> Imprimir / guardar PDF
        </button>
        <button
          className="menu-item"
          onClick={() => {
            setMenuAnchor(null);
            exportPage();
          }}
        >
          <Download size={15} /> Exportar hoja (JSON)
        </button>
        <div className="my-1 h-px bg-line" />
        <button
          className="menu-item"
          style={{ color: 'var(--danger)' }}
          onClick={() => {
            setMenuAnchor(null);
            if (window.confirm(`¿Eliminar la hoja «${page.title || 'Sin título'}»? No se puede deshacer.`)) deletePage(page.id);
          }}
        >
          <Trash2 size={15} /> Eliminar hoja
        </button>
      </Popover>

      {editingStave && <ArmoniaScoreEditorModal open initial={editingStave} onClose={closeEditor} onSave={saveStave} />}
    </div>
  );
}
