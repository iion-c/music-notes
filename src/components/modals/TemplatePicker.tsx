import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store';
import { TEMPLATES, type PageTemplate } from '../../lib/pageModel';
import { Modal } from '../ui/primitives';

function TemplateGlyph({ t }: { t: PageTemplate }) {
  const line = 'var(--border-strong)';
  const acc = 'var(--accent)';
  const rows = (x1: number, x2: number, from: number, to: number, step = 7) =>
    Array.from({ length: Math.floor((to - from) / step) + 1 }).map((_, i) => <line key={`${x1}-${i}`} x1={x1} x2={x2} y1={from + i * step} y2={from + i * step} stroke={line} />);
  const staff = (y: number) => [0, 1, 2, 3, 4].map((i) => <line key={`s${y}-${i}`} x1="8" x2="72" y1={y + i * 2.4} y2={y + i * 2.4} stroke="var(--text)" opacity=".55" strokeWidth=".8" />);
  return (
    <svg viewBox="0 0 80 96" className="h-24 w-20 shrink-0 rounded-md" style={{ background: 'var(--raised)', boxShadow: 'inset 0 0 0 1px var(--border)' }} aria-hidden>
      <line x1="6" x2="50" y1="10" y2="10" stroke="var(--text)" strokeWidth="2" opacity=".7" />
      {t.layout === 'cornell' && (
        <>
          <line x1="24" y1="16" x2="24" y2="78" stroke={acc} strokeWidth="1.3" />
          <line x1="0" y1="78" x2="80" y2="78" stroke={acc} strokeWidth="1.3" />
          {t.id === 'armonia' ? (
            <>
              {rows(28, 74, 22, 28)}
              {staff(36)}
              {staff(50)}
              {rows(28, 74, 64, 72)}
            </>
          ) : t.id === 'analisis' ? (
            <>
              {rows(28, 74, 22, 36)}
              {staff(44)}
              {rows(28, 74, 60, 72)}
            </>
          ) : (
            rows(28, 74, 22, 72)
          )}
          <line x1="4" x2="18" y1="24" y2="24" stroke="var(--text)" opacity=".6" />
          <line x1="4" x2="18" y1="45" y2="45" stroke="var(--text)" opacity=".6" />
          {rows(6, 70, 85, 90, 5)}
        </>
      )}
      {t.id === 'dictado' && (
        <>
          {staff(22)}
          {staff(40)}
          {staff(58)}
          {staff(76)}
        </>
      )}
      {t.id === 'esquema' &&
        [
          [8, 22],
          [14, 30],
          [14, 38],
          [20, 46],
          [8, 58],
          [14, 66],
          [14, 74],
        ].map(([x, y]) => (
          <g key={y}>
            <circle cx={x} cy={y} r="1.4" fill="var(--text)" opacity=".7" />
            <line x1={x + 4} x2="72" y1={y} y2={y} stroke={line} />
          </g>
        ))}
      {t.id === 'comparativa' && (
        <>
          <rect x="8" y="22" width="64" height="48" fill="none" stroke="var(--text)" opacity=".6" />
          {[38, 54].map((x) => (
            <line key={x} x1={x - 8} x2={x - 8} y1="22" y2="70" stroke="var(--text)" opacity=".5" />
          ))}
          {[30, 42, 54].map((y) => (
            <line key={y} x1="8" x2="72" y1={y} y2={y} stroke="var(--text)" opacity=".4" />
          ))}
        </>
      )}
      {t.id === 'estudio' && (
        <>
          {[22, 30, 38].map((y) => (
            <g key={y}>
              <rect x="8" y={y - 3} width="5" height="5" fill="none" stroke="var(--text)" opacity=".7" />
              <line x1="17" x2="60" y1={y} y2={y} stroke={line} />
            </g>
          ))}
          <rect x="8" y="50" width="64" height="30" fill="none" stroke="var(--text)" opacity=".5" />
          <line x1="8" x2="72" y1="58" y2="58" stroke="var(--text)" opacity=".4" />
        </>
      )}
      {t.id === 'libre' && (
        <>
          <line x1="14" y1="0" x2="14" y2="96" stroke={acc} opacity=".7" />
          {rows(18, 74, 22, 88)}
        </>
      )}
    </svg>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  notebookId?: string;
  section?: string;
}

export function TemplatePicker({ open, onClose, notebookId, section }: Props) {
  const { notebooks, pages, createPage } = useStore();
  const [nbId, setNbId] = useState(notebookId || notebooks[0]?.id || '');
  const [sec, setSec] = useState(section || '');
  const [newNb, setNewNb] = useState('');

  useEffect(() => {
    if (!open) return;
    setNbId(notebookId || notebooks[0]?.id || '');
    setSec(section || '');
    setNewNb('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notebookId, section]);

  const sections = useMemo(() => [...new Set(pages.filter((p) => p.notebookId === nbId).map((p) => p.meta?.section).filter(Boolean) as string[])], [pages, nbId]);
  const { createNotebook } = useStore();

  const pick = (t: PageTemplate) => {
    let target = nbId;
    if (!notebooks.length || nbId === '__new') target = createNotebook({ name: newNb.trim() || 'General' }).id;
    createPage(t.id, target, sec.trim() || undefined);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva hoja" subtitle="Elige cómo quieres organizar la información en el papel" width={760}>
      <div className="grid gap-3 border-b border-line px-5 py-4 sm:grid-cols-2">
        <label>
          <span className="label">Cuaderno</span>
          {notebooks.length ? (
            <select className="field" value={nbId} onChange={(e) => setNbId(e.target.value)}>
              {notebooks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.icon} {n.name}
                </option>
              ))}
              <option value="__new">+ Nuevo cuaderno…</option>
            </select>
          ) : null}
          {(!notebooks.length || nbId === '__new') && (
            <input className="field mt-1.5" value={newNb} onChange={(e) => setNewNb(e.target.value)} placeholder="Nombre de la asignatura (p. ej. Armonía I)" autoFocus />
          )}
        </label>
        <label>
          <span className="label">Unidad / tema (opcional)</span>
          <input className="field" list="tpl-sections" value={sec} onChange={(e) => setSec(e.target.value)} placeholder="p. ej. Unidad 2 · Cadencias" />
          <datalist id="tpl-sections">
            {sections.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => pick(t)} className="flex gap-3 rounded-xl border border-line bg-raised p-3 text-left transition-colors hover:border-[var(--accent)]">
            <TemplateGlyph t={t} />
            <span className="min-w-0">
              <span className="block font-semibold">{t.name}</span>
              <span className="block text-[11px] font-medium text-accent">{t.method}</span>
              <span className="mt-1 block text-xs leading-snug text-muted">{t.description}</span>
              <span className="mt-1 block text-xs leading-snug text-muted">
                <b className="font-medium text-ink">Úsala en:</b> {t.when}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
