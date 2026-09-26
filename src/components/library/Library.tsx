import React, { useMemo } from 'react';
import { Brain, Menu, Music2, PenLine, Plus, Star } from 'lucide-react';
import type { Notebook, NotePage } from '../../types/notes';
import { useStore } from '../../store';
import { useUI } from '../../ui';
import { notebookColor, PAPER_TONES, resolvePaper, paperVars, patternClass } from '../../lib/paper';
import { isDue, reviewLabel } from '../../lib/review';
import { blockPlainText, pageSearchText } from '../../lib/pageModel';
import { formatDate } from '../../lib/uid';

export function NotebookCover({ nb, count, onClick }: { nb: Notebook; count: number; onClick: () => void }) {
  const color = notebookColor(nb);
  return (
    <button onClick={onClick} className="group relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-r-lg rounded-l-sm text-left shadow-paper transition-transform hover:-translate-y-0.5" style={{ background: color }}>
      {/* Lomo */}
      <span className="absolute inset-y-0 left-0 w-3" style={{ background: 'rgba(0,0,0,.18)' }} />
      <span className="absolute inset-y-0 left-3 w-px" style={{ background: 'rgba(255,255,255,.18)' }} />
      {/* Etiqueta */}
      <span className="mx-5 mt-[22%] rounded-sm bg-[#fbf8f0] px-3 py-2.5 shadow-sm">
        <span className="block truncate font-print text-lg leading-tight text-[#2a2620]">{nb.name}</span>
        {(nb.professor || nb.semester) && <span className="mt-0.5 block truncate text-[11px] text-[#6b665c]">{[nb.professor, nb.semester].filter(Boolean).join(' · ')}</span>}
      </span>
      <span className="mt-auto flex items-center justify-between px-5 pb-3 text-xs font-medium text-white/85">
        <span className="text-xl">{nb.icon}</span>
        <span>{count} {count === 1 ? 'hoja' : 'hojas'}</span>
      </span>
    </button>
  );
}

/** Miniatura de una hoja: papel con título manuscrito y las primeras líneas. */
export function PageThumb({ page, onClick, showNotebook }: { page: NotePage; onClick: () => void; showNotebook?: boolean }) {
  const { settings, notebooks } = useStore();
  const nb = notebooks.find((n) => n.id === page.notebookId);
  const style = resolvePaper(settings, nb, page);
  const vars = paperVars({ ...style, rule: 18, textScale: 1 });
  const lines = page.blocks
    .filter((b) => b.type !== 'stave')
    .map(blockPlainText)
    .join('\n')
    .replace(/\*\*|==|~~|`/g, '')
    .replace(/\{[a-z]+\}|\{\/\}/g, '')
    .replace(/\(#\)/g, '♯')
    .replace(/\(b\)/g, '♭')
    .replace(/->/g, '→')
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, 5);
  const staves = page.blocks.filter((b) => b.type === 'stave').length;
  const due = isDue(page);

  return (
    <button onClick={onClick} className="group flex flex-col text-left">
      <div className="paper relative w-full overflow-hidden transition-transform group-hover:-translate-y-0.5" style={{ ...vars, aspectRatio: '8.5 / 9' }}>
        <div className="px-3 pb-1 pt-3" style={{ borderBottom: '2px double color-mix(in srgb, var(--ink-soft) 50%, transparent)' }}>
          <div className="paper-text truncate" style={{ fontSize: 17, lineHeight: '22px' }}>
            {page.title || 'Sin título'}
          </div>
        </div>
        <div className={`absolute inset-x-0 bottom-0 top-[40px] ${patternClass(style.pattern)}`}>
          <div className="px-3" style={{ paddingLeft: page.layout === 'cornell' ? '30%' : 12 }}>
            {lines.map((l, i) => (
              <div key={i} className="paper-text truncate" style={{ fontSize: 12.5, lineHeight: '18px' }}>
                {l}
              </div>
            ))}
          </div>
          {page.layout === 'cornell' && <span className="absolute inset-y-0 left-[27%] w-px" style={{ background: 'var(--paper-margin)' }} />}
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1">
          {staves > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
              <Music2 size={10} /> {staves}
            </span>
          )}
          {page.isFavorite && (
            <span className="rounded-full bg-black/55 p-1 text-white">
              <Star size={10} className="fill-current" />
            </span>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 px-0.5 text-xs text-muted">
        {due && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        <span className="truncate">{showNotebook && nb ? `${nb.name} · ` : ''}{formatDate(page.meta?.date || page.createdAt)}</span>
      </div>
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export function Library({ query, onOpenSidebar }: { query: string; onOpenSidebar: () => void }) {
  const { notebooks, pages, setView, openPage } = useStore();
  const ui = useUI();

  const due = useMemo(() => pages.filter((p) => isDue(p)).sort((a, b) => (a.review?.nextReview || 0) - (b.review?.nextReview || 0)), [pages]);
  const recent = useMemo(() => [...pages].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8), [pages]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if (q === '★') return pages.filter((p) => p.isFavorite);
    const terms = q.split(/\s+/);
    return pages.filter((p) => {
      const text = pageSearchText(p);
      return terms.every((t) => text.includes(t.replace(/^#/, '')));
    });
  }, [query, pages]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-8 sm:pt-8">
        <div className="mb-6 flex items-center gap-2">
          <button className="icon-btn lg:hidden" onClick={onOpenSidebar} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{results ? 'Resultados' : greeting()}</h1>
            <p className="text-sm text-muted">
              {results
                ? `${results.length} ${results.length === 1 ? 'hoja encontrada' : 'hojas encontradas'} para «${query}»`
                : new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            </p>
          </div>
          <button className="btn btn-outline hidden sm:inline-flex" onClick={() => ui.openNotebookDialog()}>
            <Plus size={16} /> Cuaderno
          </button>
          <button className="btn btn-primary" onClick={() => ui.openTemplatePicker()}>
            <PenLine size={16} /> Nueva hoja
          </button>
        </div>

        {results ? (
          <Grid>
            {results.map((p) => (
              <PageThumb key={p.id} page={p} onClick={() => openPage(p.id)} showNotebook />
            ))}
          </Grid>
        ) : (
          <>
            {pages.length === 0 && <EmptyState />}

            {due.length > 0 && (
              <section className="mb-8">
                <SectionTitle icon={<Brain size={16} />} title="Para repasar hoy" hint="Recuperar de memoria en intervalos crecientes es de lo que más ayuda a retener." />
                <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 no-scrollbar">
                  {due.map((p) => {
                    const nb = notebooks.find((n) => n.id === p.notebookId);
                    return (
                      <button
                        key={p.id}
                        onClick={() => setView({ name: 'page', pageId: p.id, review: true })}
                        className="popover flex w-60 shrink-0 flex-col gap-1 p-3 text-left transition-colors hover:border-[var(--accent)]"
                      >
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: notebookColor(nb) }} />
                          {nb?.name}
                        </span>
                        <span className="truncate font-medium">{p.title || 'Sin título'}</span>
                        <span className="text-xs font-medium text-accent">
                          {reviewLabel(p)} · repaso {(p.review?.stage || 0) + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {notebooks.length > 0 && (
              <section className="mb-8">
                <SectionTitle title="Mis cuadernos" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {notebooks.map((nb) => (
                    <NotebookCover key={nb.id} nb={nb} count={pages.filter((p) => p.notebookId === nb.id).length} onClick={() => setView({ name: 'notebook', notebookId: nb.id })} />
                  ))}
                  <button
                    onClick={() => ui.openNotebookDialog()}
                    className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong text-sm text-muted transition-colors hover:border-[var(--accent)] hover:text-accent"
                  >
                    <Plus size={22} /> Nuevo cuaderno
                  </button>
                </div>
              </section>
            )}

            {recent.length > 0 && (
              <section>
                <SectionTitle title="Recientes" />
                <Grid>
                  {recent.map((p) => (
                    <PageThumb key={p.id} page={p} onClick={() => openPage(p.id)} showNotebook />
                  ))}
                </Grid>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function SectionTitle({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted">
        {icon}
        {title}
      </h2>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function EmptyState() {
  const ui = useUI();
  const { settings } = useStore();
  const tone = PAPER_TONES[settings.paper.tone];
  return (
    <div className="popover mb-8 overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Tu cuaderno está listo</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Crea un cuaderno por asignatura (Armonía I, Contrapunto, Historia…) y dentro, una hoja por clase. Cada hoja se ve como papel real: escribe sobre los renglones, añade pentagramas que editas con el lápiz de ArmonIA, dibuja a mano y repasa con el método Cornell.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => ui.openNotebookDialog()}>
              <Plus size={16} /> Crear mi primer cuaderno
            </button>
            <button className="btn btn-outline" onClick={() => ui.openGuide()}>
              Cómo tomar buenos apuntes
            </button>
          </div>
        </div>
        <div className="hidden items-center justify-center p-6 md:flex" style={{ background: 'var(--desk)' }}>
          <div className="paper w-56 rotate-[-2deg] p-4" style={{ ...paperVars({ ...settings.paper, rule: 20 }), background: tone.paper }}>
            <div className="paper-text" style={{ fontSize: 20, lineHeight: '26px' }}>
              Cadencias
            </div>
            <div className="pattern-ruled mt-2 grid grid-cols-[30%_1fr]" style={{ height: 140 }}>
              <div className="paper-text border-r pr-1 text-[12px]" style={{ lineHeight: '20px', borderColor: 'var(--paper-margin)' }}>
                ¿Perfecta?
              </div>
              <div className="paper-text pl-2 text-[12px]" style={{ lineHeight: '20px' }}>
                V → I, ambos en estado fundamental, soprano en la tónica.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
