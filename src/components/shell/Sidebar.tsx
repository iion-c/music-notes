import React, { useMemo, useState } from 'react';
import { BookOpen, Brain, ChevronDown, ChevronRight, CircleQuestionMark, House, Plus, Search, Settings, Star, UserRound, X } from 'lucide-react';
import { useStore } from '../../store';
import { useUI } from '../../ui';
import { notebookColor } from '../../lib/paper';
import { isDue } from '../../lib/review';
import { formatDate } from '../../lib/uid';
import type { NotePage } from '../../types/notes';

interface Props {
  query: string;
  setQuery: (q: string) => void;
  mobile: boolean;
}

export function Sidebar({ query, setQuery, mobile }: Props) {
  const { notebooks, pages, view, setView, openPage, user } = useStore();
  const ui = useUI();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const activeNotebookId =
    view.name === 'notebook' ? view.notebookId : view.name === 'page' ? pages.find((p) => p.id === view.pageId)?.notebookId : undefined;
  const activePageId = view.name === 'page' ? view.pageId : undefined;
  const dueCount = useMemo(() => pages.filter((p) => isDue(p)).length, [pages]);
  const favCount = pages.filter((p) => p.isFavorite).length;

  const go = (fn: () => void) => {
    fn();
    if (mobile) ui.closeSidebar();
  };

  const pagesOf = (nbId: string) =>
    pages
      .filter((p) => p.notebookId === nbId)
      .sort((a, b) => (b.meta?.date || '').localeCompare(a.meta?.date || '') || b.createdAt - a.createdAt);

  return (
    <aside className="no-print flex h-full w-full flex-col bg-panel" aria-label="Cuadernos">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
          <span className="font-music text-lg leading-none">𝄞</span>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-sm font-semibold">Music Notes</div>
          <div className="text-[11px] text-muted">Cuaderno universitario</div>
        </div>
        <button className="icon-btn" onClick={ui.openAuth} title={user ? (user.isAnonymous ? 'Invitado' : user.email || 'Cuenta') : 'Iniciar sesión'} aria-label="Cuenta">
          {user && !user.isAnonymous && user.email ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {user.email[0].toUpperCase()}
            </span>
          ) : (
            <UserRound size={18} />
          )}
        </button>
        {mobile && (
          <button className="icon-btn" onClick={ui.closeSidebar} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="px-3 pb-2">
        <label className="relative block">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tus apuntes…"
            className="field !pl-8 !pr-12"
            aria-label="Buscar"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1 text-[10px] text-muted md:block">Ctrl K</kbd>
        </label>
      </div>

      <nav className="space-y-0.5 px-2">
        <NavItem icon={<House size={16} />} label="Inicio" active={view.name === 'library'} onClick={() => go(() => setView({ name: 'library' }))} />
        <NavItem icon={<Brain size={16} />} label="Para repasar" badge={dueCount || undefined} onClick={() => go(() => setView({ name: 'library' }))} />
        {favCount > 0 && <NavItem icon={<Star size={16} />} label="Favoritas" badge={favCount} onClick={() => go(() => setQuery('★'))} />}
      </nav>

      <div className="mt-4 flex items-center justify-between px-4 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Cuadernos</span>
        <button className="icon-btn !h-7 !w-7" onClick={() => ui.openNotebookDialog()} title="Nuevo cuaderno" aria-label="Nuevo cuaderno">
          <Plus size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {notebooks.length === 0 && (
          <button className="menu-item text-muted" onClick={() => ui.openNotebookDialog()}>
            <Plus size={15} /> Crea tu primer cuaderno
          </button>
        )}
        {notebooks.map((nb) => {
          const list = pagesOf(nb.id);
          const open = expanded[nb.id] ?? nb.id === activeNotebookId;
          return (
            <div key={nb.id}>
              <div className={`group flex items-center rounded-md ${view.name === 'notebook' && view.notebookId === nb.id ? 'bg-[color-mix(in_srgb,var(--text)_7%,transparent)]' : ''}`}>
                <button className="icon-btn !h-8 !w-7 shrink-0 text-muted" onClick={() => setExpanded((e) => ({ ...e, [nb.id]: !open }))} aria-label={open ? 'Contraer' : 'Expandir'} aria-expanded={open}>
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <button className="flex min-h-[34px] min-w-0 flex-1 items-center gap-2 pr-2 text-left text-sm" onClick={() => go(() => setView({ name: 'notebook', notebookId: nb.id }))}>
                  <span className="h-4 w-3 shrink-0 rounded-[3px]" style={{ background: notebookColor(nb) }} />
                  <span className="truncate">{nb.name}</span>
                  <span className="ml-auto text-[11px] text-muted">{list.length}</span>
                </button>
              </div>
              {open && (
                <div className="mb-1 ml-[22px] border-l border-line pl-1.5">
                  <PageList pages={list} activePageId={activePageId} onOpen={(id) => go(() => openPage(id))} />
                  <button className="menu-item !min-h-[30px] text-[13px] text-muted" onClick={() => go(() => ui.openTemplatePicker({ notebookId: nb.id }))}>
                    <Plus size={14} /> Nueva hoja
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-line p-2">
        <NavItem icon={<BookOpen size={16} />} label="Cómo tomar buenos apuntes" onClick={() => go(ui.openGuide)} />
        <div className="flex">
          <NavItem icon={<Settings size={16} />} label="Ajustes" onClick={() => go(ui.openSettings)} />
          <button className="icon-btn shrink-0" onClick={() => go(ui.openWelcome)} title="Tutorial" aria-label="Ver tutorial">
            <CircleQuestionMark size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function PageList({ pages, activePageId, onOpen }: { pages: NotePage[]; activePageId?: string; onOpen: (id: string) => void }) {
  // Agrupar por unidad (como los separadores de un cuaderno), la más reciente primero.
  const groups = new Map<string, NotePage[]>();
  for (const p of pages.slice(0, 80)) {
    const key = p.meta?.section?.trim() || '';
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  return (
    <>
      {[...groups.entries()].map(([section, list]) => (
        <React.Fragment key={section || '__none__'}>
          {section && groups.size > 1 && <div className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{section}</div>}
          {list.map((p) => (
            <PageLink key={p.id} page={p} active={p.id === activePageId} onOpen={onOpen} />
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

function PageLink({ page: p, active, onOpen }: { page: NotePage; active: boolean; onOpen: (id: string) => void }) {
  return (
    <button
      className="flex min-h-[32px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px]"
      style={active ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 } : undefined}
      onClick={() => onOpen(p.id)}
    >
      <span className="min-w-0 flex-1 truncate">{p.title || 'Sin título'}</span>
      {isDue(p) && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} title="Toca repasar" />}
      <span className="shrink-0 text-[11px] text-muted">{formatDate(p.meta?.date || p.createdAt, true)}</span>
    </button>
  );
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick: () => void }) {
  return (
    <button className="menu-item flex-1" data-active={active} onClick={onClick}>
      <span className="text-muted">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full px-1.5 text-[11px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
          {badge}
        </span>
      )}
    </button>
  );
}
