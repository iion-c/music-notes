import React, { useMemo, useState } from 'react';
import { Menu, Pencil, PenLine } from 'lucide-react';
import type { Notebook } from '../../types/notes';
import { useStore } from '../../store';
import { useUI } from '../../ui';
import { notebookColor } from '../../lib/paper';
import { Grid, PageThumb } from './Library';

export function NotebookView({ notebook, onOpenSidebar }: { notebook: Notebook; onOpenSidebar: () => void }) {
  const { pages, openPage } = useStore();
  const ui = useUI();
  const [section, setSection] = useState<string | null>(null);

  const list = useMemo(
    () =>
      pages
        .filter((p) => p.notebookId === notebook.id)
        .sort((a, b) => (b.meta?.date || '').localeCompare(a.meta?.date || '') || b.createdAt - a.createdAt),
    [pages, notebook.id],
  );
  const sections = useMemo(() => [...new Set(list.map((p) => p.meta?.section?.trim()).filter(Boolean) as string[])], [list]);
  const shown = section === null ? list : list.filter((p) => (p.meta?.section?.trim() || '') === section);
  const color = notebookColor(notebook);

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative" style={{ background: color }}>
        <div className="absolute inset-y-0 left-0 w-4" style={{ background: 'rgba(0,0,0,.16)' }} />
        <div className="mx-auto flex max-w-5xl items-end gap-4 px-4 pb-5 pt-4 sm:px-8 sm:pt-10">
          <button className="icon-btn self-start text-white lg:hidden" onClick={onOpenSidebar} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1 rounded-md bg-[#fbf8f0] px-4 py-3 shadow-sm sm:max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{notebook.icon}</span>
              <h1 className="truncate font-print text-2xl leading-tight text-[#2a2620]">{notebook.name}</h1>
            </div>
            <p className="mt-0.5 truncate text-xs text-[#6b665c]">
              {[notebook.professor && `Prof. ${notebook.professor}`, notebook.semester, notebook.schedule].filter(Boolean).join(' · ') || notebook.description || 'Cuaderno de apuntes'}
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={() => ui.openNotebookDialog(notebook)}>
              <Pencil size={15} /> Editar
            </button>
            <button className="btn bg-white text-[#2a2620] hover:bg-white/90" onClick={() => ui.openTemplatePicker({ notebookId: notebook.id, section: section || undefined })}>
              <PenLine size={16} /> Nueva hoja
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-5 sm:px-8">
        <div className="mb-4 flex gap-2 sm:hidden">
          <button className="btn btn-outline flex-1" onClick={() => ui.openNotebookDialog(notebook)}>
            <Pencil size={15} /> Editar
          </button>
          <button className="btn btn-primary flex-1" onClick={() => ui.openTemplatePicker({ notebookId: notebook.id, section: section || undefined })}>
            <PenLine size={16} /> Nueva hoja
          </button>
        </div>

        {sections.length > 0 && (
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Unidades">
            {[null, ...sections].map((s) => (
              <button
                key={s ?? '__all'}
                role="tab"
                aria-selected={section === s}
                onClick={() => setSection(s)}
                className="shrink-0 rounded-t-md border-x border-t px-3 py-1.5 text-sm transition-colors"
                style={
                  section === s
                    ? { background: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)', fontWeight: 600, boxShadow: `inset 0 3px 0 ${color}` }
                    : { background: 'transparent', borderColor: 'transparent', color: 'var(--muted)' }
                }
              >
                {s ?? 'Todas'}
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <div className="popover p-8 text-center">
            <p className="text-sm text-muted">Aún no hay hojas aquí.</p>
            <button className="btn btn-primary mt-3" onClick={() => ui.openTemplatePicker({ notebookId: notebook.id, section: section || undefined })}>
              <PenLine size={16} /> Escribir la primera hoja
            </button>
          </div>
        ) : (
          <Grid>
            {shown.map((p) => (
              <PageThumb key={p.id} page={p} onClick={() => openPage(p.id)} />
            ))}
          </Grid>
        )}
      </div>
    </div>
  );
}
