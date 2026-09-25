import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Hand,
  Minus,
  MousePointer2,
  PenLine,
  Play,
  Plus,
  Redo2,
  Settings2,
  Square,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { ClefType, DurationType, PitchAccidental, StaveBlock } from '../../types/music';
import { CLEF_NAMES, DURATION_NAMES, KEY_SIGNATURES, TIME_SIGNATURES } from '../../types/music';
import {
  buildKey,
  capacityOf,
  contentOf,
  countNotes,
  deleteLastNote,
  deleteNoteAt,
  durationTo16ths,
  globalIdxFromRef,
  insertNote,
  keyLabel,
  lastMeasureIsEmpty,
  measureCount,
  noteAt,
  rebuildMeasure,
  refFromGlobalIdx,
  reflow,
  setMeasureCount,
  staffClefs,
  staveToMusicXml,
  updateNoteAt,
  type NoteRef,
  type StaffId,
} from '../../lib/score';
import { editorOsmdHtml } from '../../services/webviewTemplates';
import { audioSynth } from '../../services/audioSynth';
import { useStore } from '../../store';
import { EditorKeyboard } from './EditorKeyboard';
import { Popover, Segmented } from '../ui/primitives';

interface Props {
  open: boolean;
  initial: StaveBlock;
  onClose: () => void;
  onSave: (block: StaveBlock) => void;
}

const KEY_TO_DURATION: Record<string, DurationType> = { '1': '16', '2': '8', '3': 'q', '4': 'h', '5': 'w' };

/**
 * Editor de partituras con el motor de ArmonIA: lápiz táctil sobre el pentagrama
 * (algoritmo pitchFromUnitY), teclado de notas y atajos de PC.
 */
export function ArmoniaScoreEditorModal({ open, initial, onClose, onSave }: Props) {
  if (!open) return null;
  return createPortal(<EditorBody initial={initial} onClose={onClose} onSave={onSave} />, document.body);
}

function EditorBody({ initial, onClose, onSave }: Omit<Props, 'open'>) {
  const { settings, toast } = useStore();
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  const [block, setBlock] = useState<StaveBlock>(initial);
  const [past, setPast] = useState<StaveBlock[]>([]);
  const [future, setFuture] = useState<StaveBlock[]>([]);
  const [step, setStep] = useState<'setup' | 'workspace'>(() => (countNotes(initial) === 0 && !initial.title ? 'setup' : 'workspace'));

  const [mode, setMode] = useState<'pencil' | 'select'>('pencil');
  const [duration, setDuration] = useState<DurationType>('q');
  const [dotted, setDotted] = useState(false);
  const [accidental, setAccidental] = useState<PitchAccidental>('');
  const [octave, setOctave] = useState(4);
  const [chord, setChord] = useState(false);
  const [activeStaff, setActiveStaff] = useState<StaffId>('upper');
  const [lastNote, setLastNote] = useState<Record<StaffId, string | null>>({ upper: null, lower: null });
  const [selection, setSelection] = useState<NoteRef | null>(null);
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const dirty = block !== initial;
  const blockRef = useRef(block);
  blockRef.current = block;

  const commit = useCallback((next: StaveBlock) => {
    const prev = blockRef.current;
    if (prev === next) return;
    setPast((p) => [...p.slice(-99), prev]);
    setFuture([]);
    blockRef.current = next;
    setBlock(next);
  }, []);

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture((f) => [blockRef.current, ...f]);
    setPast((p) => p.slice(0, -1));
    setBlock(past[past.length - 1]);
    setSelection(null);
  }, [past]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast((p) => [...p, blockRef.current]);
    setFuture((f) => f.slice(1));
    setBlock(future[0]);
  }, [future]);

  /* ── Comunicación con el motor OSMD ───────────────────── */
  const post = useCallback((msg: object) => frame.current?.contentWindow?.postMessage(JSON.stringify(msg), '*'), []);
  const xml = useMemo(() => staveToMusicXml(block), [block]);

  useEffect(() => {
    if (ready && step === 'workspace') post({ type: 'LOAD_FILE', data: xml, clefs: staffClefs(block) });
  }, [ready, xml, step, post, block]);

  useEffect(() => {
    if (ready) post({ type: 'SET_EDIT_MODE', mode });
  }, [ready, mode, post]);

  const zoomTouched = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (!zoomTouched.current && zoom === 1) return;
    zoomTouched.current = true;
    post({ type: 'SET_ZOOM', zoom });
  }, [ready, zoom, post]);

  const highlightSelection = useCallback(() => {
    if (!selection) return post({ type: 'CLEAR_HIGHLIGHT' });
    const idx = globalIdxFromRef(block, selection);
    if (idx >= 0) post({ type: 'HIGHLIGHT', globalIdx: idx, partIndex: selection.staff === 'lower' ? 1 : 0 });
  }, [selection, block, post]);

  useEffect(highlightSelection, [selection]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Acciones de notas ────────────────────────────────── */
  const addNote = useCallback(
    (key: string | null, staff: StaffId) => {
      const res = insertNote(block, staff, { key, duration, dotted }, chord && key ? lastNote[staff] : null);
      if (res.error) return toast(res.error, 'error');
      commit(res.block);
      if (res.noteId) setLastNote((l) => ({ ...l, [staff]: res.noteId! }));
      if (key && settings.previewSound) audioSynth.preview([key], duration, dotted);
    },
    [block, duration, dotted, chord, lastNote, commit, toast, settings.previewSound],
  );

  const addFromStep = (s: string, staff: StaffId = activeStaff) => addNote(buildKey(s, octave, accidental, block.keySignature), staff);

  const deleteNote = useCallback(() => {
    if (selection) {
      commit(deleteNoteAt(block, selection));
      setSelection(null);
      return;
    }
    commit(deleteLastNote(block, activeStaff));
  }, [selection, block, activeStaff, commit]);

  const changeSelectedDuration = () => {
    if (!selection) return;
    const measures = selection.staff === 'lower' ? block.lowerMeasures || [] : block.measures;
    const m = measures[selection.measureIdx];
    const target = noteAt(block, selection);
    if (!m || !target) return;
    const content = contentOf(m).map((n) => (n.id === target.id ? { ...n, duration, isDotted: dotted || undefined } : n));
    const used = content.reduce((a, n) => a + durationTo16ths(n.duration, n.isDotted), 0);
    if (used > capacityOf(block.timeSignature)) return toast('No cabe en el compás: borra o acorta otra nota primero', 'error');
    const rebuilt = rebuildMeasure(m, content, block.timeSignature);
    const nextMeasures = [...measures];
    nextMeasures[selection.measureIdx] = rebuilt;
    commit({ ...(selection.staff === 'lower' ? { ...block, lowerMeasures: nextMeasures } : { ...block, measures: nextMeasures }), updatedAt: Date.now() });
    setSelection({ ...selection, noteIdx: rebuilt.notes.findIndex((n) => n.id === target.id) });
  };

  const togglePlay = () => {
    if (playing) {
      audioSynth.stop();
      setPlaying(false);
    } else {
      setPlaying(true);
      audioSynth.playStave({ ...block, displayRange: { mode: 'all' } }, () => setPlaying(false));
    }
  };

  useEffect(() => () => audioSynth.stop(), []);

  /* ── Teclado físico (también reenviado desde el iframe) ─ */
  const handleKey = useCallback(
    (k: { key: string; ctrl: boolean; shift: boolean }) => {
      if (step !== 'workspace') return false;
      const key = k.key;
      if (k.ctrl && key.toLowerCase() === 'z') {
        if (k.shift) redo();
        else undo();
        return true;
      }
      if (k.ctrl && key.toLowerCase() === 'y') return redo(), true;
      if (k.ctrl) return false;
      if (KEY_TO_DURATION[key]) {
        setDuration(KEY_TO_DURATION[key]);
        if (key === '1') setDotted(false);
        return true;
      }
      switch (key) {
        case '.':
          setDotted((d) => !d);
          return true;
        case '#':
          setAccidental((a) => (a === '#' ? '' : '#'));
          return true;
        case 'b':
        case 'B':
          setAccidental((a) => (a === 'b' ? '' : 'b'));
          return true;
        case 'n':
        case 'N':
          setAccidental((a) => (a === 'n' ? '' : 'n'));
          return true;
        case 'a':
        case 'A':
          setChord((c) => !c);
          return true;
        case 'r':
        case 'R':
          addNote(null, activeStaff);
          return true;
        case 'p':
        case 'P':
          setMode('pencil');
          return true;
        case 's':
        case 'S':
          setMode('select');
          return true;
        case 'ArrowUp':
          setOctave((o) => Math.min(7, o + 1));
          return true;
        case 'ArrowDown':
          setOctave((o) => Math.max(1, o - 1));
          return true;
        case 'Backspace':
        case 'Delete':
          deleteNote();
          return true;
        case 'Escape':
          setSelection(null);
          return true;
      }
      return false;
    },
    [step, undo, redo, addNote, activeStaff, deleteNote],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName)) return;
      if (handleKey({ key: e.key, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey })) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey]);

  // Mensajes del iframe (lápiz, selección, teclado)
  const handlers = useRef({ addNote, handleKey, block, accidental, highlightSelection });
  handlers.current = { addNote, handleKey, block, accidental, highlightSelection };
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      let msg: { type: string; data?: Record<string, unknown> };
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const h = handlers.current;
      switch (msg.type) {
        case 'WV_READY':
          setReady(true);
          break;
        case 'LOAD_COMPLETE':
          h.highlightSelection();
          break;
        case 'PENCIL_COMMIT': {
          const d = msg.data as { step: string; octave: number; partIndex: number };
          if (!d?.step) break;
          const staff: StaffId = d.partIndex === 1 && h.block.staffMode === 'grand' ? 'lower' : 'upper';
          setActiveStaff(staff);
          setOctave(d.octave);
          h.addNote(buildKey(d.step, d.octave, h.accidental, h.block.keySignature), staff);
          break;
        }
        case 'NOTE_SELECTED': {
          const d = msg.data as { globalIdx: number; partIndex: number };
          setSelection(refFromGlobalIdx(h.block, d.partIndex, d.globalIdx));
          break;
        }
        case 'KEY':
          h.handleKey(msg.data as { key: string; ctrl: boolean; shift: boolean });
          break;
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const close = () => {
    if (dirty && !window.confirm('¿Salir sin guardar los cambios del pentagrama?')) return;
    onClose();
  };

  const save = () => {
    const total = measureCount(block);
    const range = block.displayRange;
    const fixed =
      range.mode === 'custom'
        ? {
            mode: 'custom' as const,
            startMeasure: Math.min(Math.max(1, range.startMeasure || 1), total),
            endMeasure: Math.min(Math.max(range.startMeasure || 1, range.endMeasure || total), total),
          }
        : { mode: 'all' as const };
    // onSave se encarga de cerrar el editor (así no se confunde con "cancelar").
    onSave({ ...block, displayRange: fixed, updatedAt: Date.now() });
  };

  const selectedNote = selection ? noteAt(block, selection) : undefined;
  const total = measureCount(block);

  return (
    <div className="fixed inset-0 z-[65] flex items-stretch justify-center bg-black/45 sm:p-4 animate-fade" onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })} onMouseLeave={() => setMouse(null)}>
      {/* Cursor con la figura activa (PC) */}
      {mouse && step === 'workspace' && mode === 'pencil' && (
        <div
          className="pointer-events-none fixed z-[90] hidden -translate-x-1/2 -translate-y-12 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold shadow md:flex"
          style={{ left: mouse.x, top: mouse.y, background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          <span className="font-music text-base leading-none">{DURATION_NAMES[duration].symbol}</span>
          {dotted && '·'}
          {accidental === '#' ? '♯' : accidental === 'b' ? '♭' : accidental === 'n' ? '♮' : ''}
          {chord && ' acorde'}
        </div>
      )}

      <div className="flex w-full max-w-6xl flex-col overflow-hidden bg-panel shadow-pop sm:rounded-xl" role="dialog" aria-modal="true" aria-label="Editor de pentagrama">
        {/* Encabezado */}
        <div className="flex items-center gap-2 border-b border-line bg-raised px-3 py-2">
          <button className="icon-btn" onClick={close} aria-label="Cerrar editor">
            <X size={18} />
          </button>
          <input
            value={block.title}
            onChange={(e) => setBlock({ ...block, title: e.target.value })}
            placeholder="Título del ejemplo"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted"
          />
          {step === 'workspace' && (
            <>
              <button className="icon-btn" onClick={undo} disabled={!past.length} title="Deshacer (Ctrl+Z)" aria-label="Deshacer">
                <Undo2 size={17} />
              </button>
              <button className="icon-btn" onClick={redo} disabled={!future.length} title="Rehacer (Ctrl+Y)" aria-label="Rehacer">
                <Redo2 size={17} />
              </button>
              <button className="icon-btn" onClick={togglePlay} disabled={countNotes(block) === 0} title="Escuchar" aria-label="Escuchar">
                {playing ? <Square size={16} /> : <Play size={17} />}
              </button>
              <button className="icon-btn" onClick={(e) => setSettingsAnchor(e.currentTarget)} title="Clave, compás y armadura" aria-label="Ajustes del pentagrama">
                <Settings2 size={17} />
              </button>
              <button className="btn btn-primary ml-1" onClick={save}>
                <Check size={16} /> <span className="hidden sm:inline">Guardar en la hoja</span>
                <span className="sm:hidden">Guardar</span>
              </button>
            </>
          )}
        </div>

        {step === 'setup' ? (
          <SetupStep
            block={block}
            onStart={(b) => {
              setBlock(b);
              setStep('workspace');
            }}
          />
        ) : (
          <>
            {/* Barra de herramientas */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
              <Segmented
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  if (m === 'pencil') setSelection(null);
                }}
                label="Modo"
                options={[
                  { value: 'pencil', label: <><PenLine size={14} /> Lápiz</>, title: 'Escribir tocando el pentagrama (P)' },
                  { value: 'select', label: <><MousePointer2 size={14} /> Seleccionar</>, title: 'Tocar una nota para editarla (S)' },
                ]}
              />
              {block.staffMode === 'grand' && (
                <Segmented
                  value={activeStaff}
                  onChange={setActiveStaff}
                  label="Pentagrama del teclado"
                  options={[
                    { value: 'upper', label: 'Sol', title: 'El teclado escribe en el pentagrama superior' },
                    { value: 'lower', label: 'Fa', title: 'El teclado escribe en el pentagrama inferior' },
                  ]}
                />
              )}
              <div className="flex items-center gap-0.5">
                <button className="icon-btn" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))} aria-label="Alejar">
                  <ZoomOut size={17} />
                </button>
                <button className="icon-btn" onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))} aria-label="Acercar">
                  <ZoomIn size={17} />
                </button>
              </div>
              <div className="ml-auto flex items-center gap-1 text-xs text-muted">
                <span>{total} compases</span>
                <button className="icon-btn !h-8 !w-8" disabled={!lastMeasureIsEmpty(block)} onClick={() => commit(setMeasureCount(block, total - 1))} title="Quitar el último compás vacío" aria-label="Quitar compás">
                  <Minus size={15} />
                </button>
                <button className="btn btn-outline !min-h-[32px] text-xs" onClick={() => commit(setMeasureCount(block, total + 1))}>
                  <Plus size={14} /> Compás
                </button>
              </div>
            </div>

            {/* Partitura */}
            <div className="relative min-h-[220px] flex-1 bg-white">
              <iframe
                ref={frame}
                srcDoc={editorOsmdHtml}
                title="Motor de partituras ArmonIA"
                className="absolute inset-0 h-full w-full border-0"
                style={{ cursor: mode === 'pencil' ? 'crosshair' : 'pointer', colorScheme: 'light' }}
                sandbox="allow-scripts"
              />
              {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">Cargando motor de partituras…</div>}
              <div className="pointer-events-none absolute right-3 top-2 rounded-md bg-white/85 px-2 py-1 text-[11px] font-medium text-neutral-600 shadow-sm">
                {mode === 'pencil' ? (
                  <>
                    <PenLine size={11} className="mr-1 inline" /> Arrastra sobre el pentagrama y suelta para escribir
                  </>
                ) : (
                  <>
                    <Hand size={11} className="mr-1 inline" /> Toca una nota para seleccionarla
                  </>
                )}
              </div>
            </div>

            {/* Nota seleccionada */}
            {selectedNote && selection && (
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-accent-soft px-3 py-2 text-sm">
                <span className="font-semibold">
                  {selectedNote.isRest ? 'Silencio' : selectedNote.keys.map(keyLabel).join(' · ')} — {DURATION_NAMES[selectedNote.duration].name}
                  {selectedNote.isDotted ? ' con puntillo' : ''}
                </span>
                <input
                  value={selectedNote.annotation || ''}
                  onChange={(e) => setBlock(updateNoteAt(block, selection, { annotation: e.target.value || undefined }))}
                  placeholder="Grado / cifrado (p. ej. V7, I6/4)"
                  className="field !min-h-[34px] max-w-[220px] flex-1"
                  aria-label="Grado o cifrado bajo la nota"
                />
                <button className="btn btn-outline !min-h-[34px] text-xs" onClick={changeSelectedDuration}>
                  Aplicar figura {DURATION_NAMES[duration].symbol}
                  {dotted ? '·' : ''}
                </button>
                <button className="btn btn-danger !min-h-[34px] text-xs" onClick={deleteNote}>
                  <Trash2 size={14} /> Eliminar
                </button>
                <button className="icon-btn ml-auto" onClick={() => setSelection(null)} aria-label="Quitar selección">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Teclado */}
            <div className="border-t border-line bg-raised px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
              <EditorKeyboard
                duration={duration}
                setDuration={setDuration}
                dotted={dotted}
                setDotted={setDotted}
                accidental={accidental}
                setAccidental={setAccidental}
                octave={octave}
                setOctave={setOctave}
                chord={chord}
                setChord={setChord}
                onNote={(s) => addFromStep(s)}
                onRest={() => addNote(null, activeStaff)}
                onDelete={deleteNote}
              />
              <p className="mt-2 hidden text-[11px] text-muted lg:block">
                Atajos: 1–5 figura (semicorchea → redonda) · . puntillo · # ♯ · B ♭ · N ♮ · A acorde · R silencio · ↑↓ octava · Retroceso borrar · Ctrl+Z deshacer · P lápiz · S seleccionar
              </p>
            </div>
          </>
        )}
      </div>

      <Popover anchor={settingsAnchor} open={!!settingsAnchor} onClose={() => setSettingsAnchor(null)} align="end" width={300}>
        <StaveSettings block={block} onChange={(b) => commit(b)} />
      </Popover>
    </div>
  );
}

/* ── Configuración inicial ───────────────────────────────── */

function SetupStep({ block, onStart }: { block: StaveBlock; onStart: (b: StaveBlock) => void }) {
  const [draft, setDraft] = useState<StaveBlock>(block);
  const [count, setCount] = useState(Math.max(4, measureCount(block)));

  const start = (n: number) => {
    let b = { ...draft };
    if (b.staffMode === 'grand') b = { ...b, clef: 'treble', lowerClef: 'bass', lowerMeasures: b.lowerMeasures || [] };
    onStart(setMeasureCount(b, n));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-xl space-y-5 p-5 sm:p-8">
        <div>
          <h3 className="text-lg font-semibold text-ink">Nuevo pentagrama</h3>
          <p className="text-sm text-muted">Configúralo como lo harías en el papel antes de empezar a escribir.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {([
            ['single', 'Pentagrama simple', 'Melodía, dictado, una voz'],
            ['grand', 'Sistema de piano', 'Armonía a 4 voces (Sol + Fa)'],
          ] as const).map(([mode, name, hint]) => (
            <button
              key={mode}
              onClick={() => setDraft({ ...draft, staffMode: mode })}
              className="rounded-xl border-2 p-3 text-left transition-colors"
              style={{ borderColor: draft.staffMode === mode ? 'var(--accent)' : 'var(--border)', background: 'var(--raised)' }}
            >
              <StaffIcon grand={mode === 'grand'} />
              <div className="mt-2 text-sm font-semibold text-ink">{name}</div>
              <div className="text-xs text-muted">{hint}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {draft.staffMode !== 'grand' && (
            <label>
              <span className="label">Clave</span>
              <select className="field" value={draft.clef} onChange={(e) => setDraft({ ...draft, clef: e.target.value as ClefType })}>
                {Object.entries(CLEF_NAMES).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className="label">Compás</span>
            <select className="field" value={draft.timeSignature} onChange={(e) => setDraft({ ...draft, timeSignature: e.target.value })}>
              {TIME_SIGNATURES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Armadura</span>
            <select className="field" value={draft.keySignature} onChange={(e) => setDraft({ ...draft, keySignature: e.target.value })}>
              {KEY_SIGNATURES.map((k) => (
                <option key={k.code} value={k.code}>
                  {k.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="label">¿Cuántos compases necesitas?</span>
          <div className="grid grid-cols-4 gap-2">
            {[4, 8, 12, 16].map((n) => (
              <button key={n} className="btn btn-outline !min-h-[48px] text-base" onClick={() => start(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input type="number" min={1} max={64} value={count} onChange={(e) => setCount(Math.min(64, Math.max(1, parseInt(e.target.value, 10) || 1)))} className="field !w-24 text-center" aria-label="Número de compases" />
            <button className="btn btn-primary flex-1" onClick={() => start(count)}>
              Empezar con {count} compases
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">Si te quedas corto, se añaden compases solos al escribir.</p>
        </div>
      </div>
    </div>
  );
}

function StaffIcon({ grand }: { grand: boolean }) {
  const staff = (y: number) => [0, 1, 2, 3, 4].map((i) => <line key={`${y}-${i}`} x1="4" x2="76" y1={y + i * 4} y2={y + i * 4} stroke="currentColor" strokeWidth="1" />);
  return (
    <svg width="80" height={grand ? 46 : 22} className="text-muted" aria-hidden>
      {grand && <path d="M3 3 C0 12 6 16 1 23 C6 30 0 34 3 43" fill="none" stroke="currentColor" strokeWidth="1.4" />}
      {staff(3)}
      {grand && staff(27)}
    </svg>
  );
}

/* ── Ajustes durante la edición ─────────────────────────── */

function StaveSettings({ block, onChange }: { block: StaveBlock; onChange: (b: StaveBlock) => void }) {
  const total = measureCount(block);
  const range = block.displayRange;
  return (
    <div className="space-y-3 p-2 text-sm">
      <Segmented
        value={block.staffMode || 'single'}
        onChange={(m) =>
          onChange(
            m === 'grand'
              ? setMeasureCount({ ...block, staffMode: 'grand', clef: 'treble', lowerClef: 'bass', lowerMeasures: block.lowerMeasures || [] }, total)
              : { ...block, staffMode: 'single' },
          )
        }
        options={[
          { value: 'single', label: 'Simple' },
          { value: 'grand', label: 'Sistema de piano' },
        ]}
      />
      {block.staffMode !== 'grand' && (
        <label className="block">
          <span className="label">Clave</span>
          <select className="field" value={block.clef} onChange={(e) => onChange({ ...block, clef: e.target.value as ClefType })}>
            {Object.entries(CLEF_NAMES).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block">
        <span className="label">Compás (redistribuye las notas)</span>
        <select className="field" value={block.timeSignature} onChange={(e) => onChange(reflow(block, e.target.value))}>
          {TIME_SIGNATURES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Armadura</span>
        <select className="field" value={block.keySignature} onChange={(e) => onChange({ ...block, keySignature: e.target.value })}>
          {KEY_SIGNATURES.map((k) => (
            <option key={k.code} value={k.code}>
              {k.name}
            </option>
          ))}
        </select>
      </label>
      <div>
        <span className="label">Mostrar en la hoja</span>
        <Segmented
          value={range.mode}
          onChange={(mode) => onChange({ ...block, displayRange: mode === 'all' ? { mode } : { mode, startMeasure: range.startMeasure || 1, endMeasure: range.endMeasure || total } })}
          options={[
            { value: 'all', label: 'Todos los compases' },
            { value: 'custom', label: 'Un rango' },
          ]}
        />
        {range.mode === 'custom' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            del
            <input type="number" min={1} max={total} value={range.startMeasure || 1} onChange={(e) => onChange({ ...block, displayRange: { ...range, startMeasure: parseInt(e.target.value, 10) || 1 } })} className="field !w-16 text-center" />
            al
            <input type="number" min={1} max={total} value={range.endMeasure || total} onChange={(e) => onChange({ ...block, displayRange: { ...range, endMeasure: parseInt(e.target.value, 10) || total } })} className="field !w-16 text-center" />
          </div>
        )}
      </div>
    </div>
  );
}
