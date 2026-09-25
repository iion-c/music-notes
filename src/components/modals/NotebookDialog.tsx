import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Notebook } from '../../types/notes';
import { useStore } from '../../store';
import { NOTEBOOK_COLORS } from '../../lib/paper';
import { Modal } from '../ui/primitives';

const ICONS = ['🎼', '🎹', '🎻', '🎸', '🎺', '🥁', '🎤', '🎧', '📓', '📚', '🏛️', '✍️'];

interface Props {
  open: boolean;
  notebook?: Notebook;
  onClose: () => void;
}

export function NotebookDialog({ open, notebook, onClose }: Props) {
  const { createNotebook, updateNotebook, deleteNotebook, pages, setView } = useStore();
  const [form, setForm] = useState({ name: '', professor: '', semester: '', schedule: '', color: NOTEBOOK_COLORS[0], icon: ICONS[0] });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: notebook?.name || '',
      professor: notebook?.professor || '',
      semester: notebook?.semester || '',
      schedule: notebook?.schedule || '',
      color: notebook?.color || NOTEBOOK_COLORS[Math.floor(Math.random() * NOTEBOOK_COLORS.length)],
      icon: notebook?.icon || ICONS[0],
    });
  }, [open, notebook]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const data = { ...form, name, professor: form.professor.trim() || undefined, semester: form.semester.trim() || undefined, schedule: form.schedule.trim() || undefined };
    if (notebook) updateNotebook(notebook.id, data);
    else setView({ name: 'notebook', notebookId: createNotebook(data).id });
    onClose();
  };

  const count = notebook ? pages.filter((p) => p.notebookId === notebook.id).length : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={notebook ? 'Editar cuaderno' : 'Nuevo cuaderno'}
      subtitle="Un cuaderno por asignatura, como en la mochila"
      footer={
        <>
          {notebook && (
            <button
              type="button"
              className="btn btn-danger mr-auto"
              onClick={() => {
                if (window.confirm(`¿Eliminar «${notebook.name}» y sus ${count} hojas? No se puede deshacer.`)) {
                  deleteNotebook(notebook.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={15} /> Eliminar
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="nb-form" className="btn btn-primary" disabled={!form.name.trim()}>
            {notebook ? 'Guardar' : 'Crear cuaderno'}
          </button>
        </>
      }
    >
      <form id="nb-form" onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-[1fr_150px]">
        <div className="space-y-3">
          <label className="block">
            <span className="label">Asignatura</span>
            <input className="field" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Armonía I, Contrapunto, Historia de la música…" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Profesor/a</span>
              <input className="field" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Semestre</span>
              <input className="field" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="2026-2" />
            </label>
          </div>
          <label className="block">
            <span className="label">Horario / salón</span>
            <input className="field" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Lun y Mié 8:00 · Aula 204" />
          </label>
          <div>
            <span className="label">Color de la tapa</span>
            <div className="flex flex-wrap gap-2">
              {NOTEBOOK_COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className="h-8 w-8 rounded-full" style={{ background: c, boxShadow: form.color === c ? '0 0 0 2px var(--raised), 0 0 0 4px var(--accent)' : undefined }} aria-label={`Color ${c}`} aria-pressed={form.color === c} />
              ))}
            </div>
          </div>
          <div>
            <span className="label">Icono</span>
            <div className="flex flex-wrap gap-1">
              {ICONS.map((i) => (
                <button type="button" key={i} onClick={() => setForm({ ...form, icon: i })} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: form.icon === i ? 'var(--accent-soft)' : 'transparent' }} aria-pressed={form.icon === i}>
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-r-lg rounded-l-sm shadow-paper" style={{ background: form.color }}>
            <span className="absolute inset-y-0 left-0 w-2.5" style={{ background: 'rgba(0,0,0,.18)' }} />
            <span className="mx-3 mt-8 rounded-sm bg-[#fbf8f0] px-2 py-1.5">
              <span className="block truncate font-print text-base leading-tight text-[#2a2620]">{form.name || 'Asignatura'}</span>
              <span className="block truncate text-[10px] text-[#6b665c]">{form.professor || ' '}</span>
            </span>
            <span className="mt-auto p-3 text-lg">{form.icon}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
