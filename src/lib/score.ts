/**
 * Lógica musical del motor ArmonIA: relleno secuencial de compases, silencios
 * automáticos, armadura, acordes y conversión a MusicXML para OSMD.
 */
import type { ClefType, DurationType, MeasureData, MusicNoteItem, PitchAccidental, StaveBlock } from '../types/music';
import { KEY_SIGNATURES } from '../types/music';
import { convertJsonToMusicXML, type ScoreData, type ScoreNote } from '../services/musicxml';
import { getMeasureCapacityIn16ths } from '../services/rhythmEngine';
import { uid } from './uid';

export type StaffId = 'upper' | 'lower';

const XML_TYPES: Record<DurationType, string> = { w: 'whole', h: 'half', q: 'quarter', '8': 'eighth', '16': '16th', '32': '32nd' };
const BASE_16THS: Record<DurationType, number> = { w: 16, h: 8, q: 4, '8': 2, '16': 1, '32': 0.5 };

export function durationTo16ths(d: DurationType, dotted = false): number {
  const base = BASE_16THS[d] ?? 4;
  return dotted ? base * 1.5 : base;
}

export const capacityOf = (timeSig?: string) => getMeasureCapacityIn16ths(timeSig || '4/4');

export function isCompound(timeSig: string): boolean {
  const [n, d] = timeSig.split('/').map((x) => parseInt(x, 10));
  return d === 8 && n % 3 === 0 && n > 3;
}

export function keyFifths(code: string): number {
  return KEY_SIGNATURES.find((k) => k.code === code)?.fifths ?? 0;
}

const SHARP_ORDER = ['f', 'c', 'g', 'd', 'a', 'e', 'b'];
const FLAT_ORDER = ['b', 'e', 'a', 'd', 'g', 'c', 'f'];

/** Alteración implícita de un paso según la armadura. */
export function keyAccidental(step: string, keyCode: string): '' | '#' | 'b' {
  const f = keyFifths(keyCode);
  const s = step.toLowerCase();
  if (f > 0 && SHARP_ORDER.slice(0, f).includes(s)) return '#';
  if (f < 0 && FLAT_ORDER.slice(0, -f).includes(s)) return 'b';
  return '';
}

/**
 * Construye la clave "paso[alt]/octava". Sin alteración elegida se respeta la armadura
 * (como en cualquier editor de partituras); '♮' fuerza la nota natural.
 */
export function buildKey(step: string, octave: number, chosen: PitchAccidental, keyCode: string): string {
  const s = step.toLowerCase();
  const acc = chosen === 'n' ? '' : chosen === '' ? keyAccidental(s, keyCode) : chosen;
  return `${s}${acc}/${octave}`;
}

export function keyLabel(key: string): string {
  const [p, o] = key.split('/');
  const step = p.charAt(0).toUpperCase();
  const acc = p.slice(1).replace('#', '♯').replace('b', '♭').replace('n', '');
  return `${step}${acc}${o ?? ''}`;
}

/* ── Compases ─────────────────────────────────────────────── */

export const contentOf = (m: MeasureData) => m.notes.filter((n) => !n.auto);

export function usedOf(m: MeasureData): number {
  return contentOf(m).reduce((acc, n) => acc + durationTo16ths(n.duration, n.isDotted), 0);
}

function restFromValue(v: number): { duration: DurationType; dotted: boolean } {
  switch (v) {
    case 24: return { duration: 'w', dotted: true };
    case 16: return { duration: 'w', dotted: false };
    case 12: return { duration: 'h', dotted: true };
    case 8: return { duration: 'h', dotted: false };
    case 6: return { duration: 'q', dotted: true };
    case 4: return { duration: 'q', dotted: false };
    case 3: return { duration: '8', dotted: true };
    case 2: return { duration: '8', dotted: false };
    default: return { duration: '16', dotted: false };
  }
}

/** Silencios que completan un compás desde `offset` (convención: agrupar por pulso). */
export function fillRests(offset: number, remaining: number, timeSig: string): MusicNoteItem[] {
  const out: MusicNoteItem[] = [];
  const candidates = isCompound(timeSig) ? [12, 6, 2, 1] : [16, 8, 4, 2, 1];
  let pos = offset;
  let left = remaining;
  while (left > 0) {
    // El silencio más largo que quepa y empiece alineado con su propio valor.
    const chosen = candidates.find((c) => c <= left && pos % c === 0) ?? 1;
    const r = restFromValue(chosen);
    out.push({ id: uid('fill'), keys: ['b/4'], duration: r.duration, isDotted: r.dotted, isRest: true, auto: true });
    pos += chosen;
    left -= chosen;
  }
  return out;
}

export function rebuildMeasure(m: MeasureData, content: MusicNoteItem[], timeSig: string): MeasureData {
  const cap = capacityOf(timeSig);
  const used = content.reduce((acc, n) => acc + durationTo16ths(n.duration, n.isDotted), 0);
  // Un compás sin contenido se dibuja como silencio de compás completo.
  const notes = used === 0 ? [] : used < cap ? [...content, ...fillRests(used, cap - used, timeSig)] : content;
  return { ...m, notes };
}

export function emptyMeasure(num: number): MeasureData {
  return { id: uid('m'), measureNumber: num, notes: [], harmonicAnalysis: { measureNumber: num } };
}

export function getStaff(block: StaveBlock, staff: StaffId): MeasureData[] {
  return staff === 'lower' ? block.lowerMeasures || [] : block.measures;
}

function withStaff(block: StaveBlock, staff: StaffId, measures: MeasureData[]): StaveBlock {
  return staff === 'lower' ? { ...block, lowerMeasures: measures } : { ...block, measures };
}

const renumber = (ms: MeasureData[]) => ms.map((m, i) => (m.measureNumber === i + 1 ? m : { ...m, measureNumber: i + 1 }));

/** Mantiene ambos pentagramas del sistema con el mismo número de compases. */
export function setMeasureCount(block: StaveBlock, count: number): StaveBlock {
  const n = Math.max(1, count);
  const adjust = (ms: MeasureData[]) => {
    const out = ms.slice(0, n);
    while (out.length < n) out.push(emptyMeasure(out.length + 1));
    return renumber(out);
  };
  const next: StaveBlock = { ...block, measures: adjust(block.measures) };
  if (block.staffMode === 'grand') next.lowerMeasures = adjust(block.lowerMeasures || []);
  return next;
}

export function measureCount(block: StaveBlock): number {
  return Math.max(block.measures.length, block.staffMode === 'grand' ? block.lowerMeasures?.length || 0 : 0);
}

/** ¿Se puede quitar el último compás sin perder notas? */
export function lastMeasureIsEmpty(block: StaveBlock): boolean {
  const n = measureCount(block);
  if (n <= 1) return false;
  const up = block.measures[n - 1];
  const lo = block.lowerMeasures?.[n - 1];
  return (!up || contentOf(up).length === 0) && (!lo || contentOf(lo).length === 0);
}

export interface InsertResult {
  block: StaveBlock;
  noteId?: string;
  error?: string;
}

/**
 * Inserción secuencial: la nota va justo después de la última nota escrita del pentagrama.
 * Si no cabe en ese compás pasa al siguiente (creándolo si hace falta) y los huecos se
 * rellenan con silencios automáticos.
 */
export function insertNote(
  block: StaveBlock,
  staff: StaffId,
  input: { key: string | null; duration: DurationType; dotted: boolean },
  chordWith?: string | null,
): InsertResult {
  const ts = block.timeSignature || '4/4';
  const cap = capacityOf(ts);
  let measures = [...getStaff(block, staff)];

  // Modo acorde: añadir la altura a la última nota escrita.
  if (chordWith && input.key) {
    for (let mi = measures.length - 1; mi >= 0; mi--) {
      const idx = measures[mi].notes.findIndex((n) => n.id === chordWith);
      if (idx === -1) continue;
      const target = measures[mi].notes[idx];
      if (target.isRest) break;
      if (target.keys.includes(input.key)) return { block, noteId: target.id };
      const notes = [...measures[mi].notes];
      notes[idx] = { ...target, keys: [...target.keys, input.key] };
      measures[mi] = { ...measures[mi], notes };
      return { block: { ...withStaff(block, staff, measures), updatedAt: Date.now() }, noteId: target.id };
    }
  }

  const value = durationTo16ths(input.duration, input.dotted);
  if (value > cap) return { block, error: 'Esa figura no cabe en un compás de ' + ts };
  if (!Number.isInteger(value)) return { block, error: 'Figura no disponible con puntillo' };

  let last = -1;
  measures.forEach((m, i) => {
    if (contentOf(m).length > 0) last = i;
  });
  let target = last === -1 ? 0 : last;
  if (last !== -1 && usedOf(measures[last]) + value > cap) target = last + 1;

  let grown = block;
  if (target >= measures.length) {
    grown = setMeasureCount(block, target + 1);
    measures = [...getStaff(grown, staff)];
  }

  const note: MusicNoteItem = {
    id: uid('n'),
    keys: input.key ? [input.key] : ['b/4'],
    duration: input.duration,
    isRest: !input.key,
    isDotted: input.dotted || undefined,
  };
  const m = measures[target];
  measures[target] = rebuildMeasure(m, [...contentOf(m), note], ts);
  return { block: { ...withStaff(grown, staff, measures), updatedAt: Date.now() }, noteId: note.id };
}

export function deleteLastNote(block: StaveBlock, staff: StaffId): StaveBlock {
  const measures = [...getStaff(block, staff)];
  for (let i = measures.length - 1; i >= 0; i--) {
    const content = contentOf(measures[i]);
    if (content.length === 0) continue;
    measures[i] = rebuildMeasure(measures[i], content.slice(0, -1), block.timeSignature);
    return { ...withStaff(block, staff, measures), updatedAt: Date.now() };
  }
  return block;
}

export interface NoteRef {
  staff: StaffId;
  measureIdx: number;
  noteIdx: number;
}

/** Traduce el índice de nota gráfica de OSMD (una por cabeza de nota) a nuestra nota. */
export function refFromGlobalIdx(block: StaveBlock, partIndex: number, globalIdx: number): NoteRef | null {
  const staff: StaffId = partIndex === 1 ? 'lower' : 'upper';
  const measures = getStaff(block, staff);
  let count = 0;
  for (let mi = 0; mi < measures.length; mi++) {
    const m = measures[mi];
    if (m.notes.length === 0) {
      if (count === globalIdx) return null; // silencio de compás completo
      count += 1;
      continue;
    }
    for (let ni = 0; ni < m.notes.length; ni++) {
      const n = m.notes[ni];
      const heads = n.isRest ? 1 : Math.max(1, n.keys.length);
      if (globalIdx < count + heads) return n.auto ? null : { staff, measureIdx: mi, noteIdx: ni };
      count += heads;
    }
  }
  return null;
}

export function globalIdxFromRef(block: StaveBlock, ref: NoteRef): number {
  const measures = getStaff(block, ref.staff);
  let count = 0;
  for (let mi = 0; mi < measures.length; mi++) {
    const m = measures[mi];
    if (m.notes.length === 0) {
      count += 1;
      continue;
    }
    for (let ni = 0; ni < m.notes.length; ni++) {
      if (mi === ref.measureIdx && ni === ref.noteIdx) return count;
      const n = m.notes[ni];
      count += n.isRest ? 1 : Math.max(1, n.keys.length);
    }
  }
  return -1;
}

export function noteAt(block: StaveBlock, ref: NoteRef): MusicNoteItem | undefined {
  return getStaff(block, ref.staff)[ref.measureIdx]?.notes[ref.noteIdx];
}

export function updateNoteAt(block: StaveBlock, ref: NoteRef, patch: Partial<MusicNoteItem>): StaveBlock {
  const measures = [...getStaff(block, ref.staff)];
  const m = measures[ref.measureIdx];
  if (!m) return block;
  const notes = [...m.notes];
  notes[ref.noteIdx] = { ...notes[ref.noteIdx], ...patch };
  measures[ref.measureIdx] = { ...m, notes };
  return { ...withStaff(block, ref.staff, measures), updatedAt: Date.now() };
}

export function deleteNoteAt(block: StaveBlock, ref: NoteRef): StaveBlock {
  const measures = [...getStaff(block, ref.staff)];
  const m = measures[ref.measureIdx];
  if (!m) return block;
  const target = m.notes[ref.noteIdx];
  const content = contentOf(m).filter((n) => n.id !== target?.id);
  measures[ref.measureIdx] = rebuildMeasure(m, content, block.timeSignature);
  return { ...withStaff(block, ref.staff, measures), updatedAt: Date.now() };
}

/** Re-distribuye todas las notas tras cambiar el compás (p. ej. de 4/4 a 3/4). */
export function reflow(block: StaveBlock, newTimeSig: string): StaveBlock {
  const cap = capacityOf(newTimeSig);
  const flowStaff = (ms: MeasureData[]) => {
    const all = ms.flatMap(contentOf).filter((n) => durationTo16ths(n.duration, n.isDotted) <= cap);
    const out: MeasureData[] = [];
    let current: MusicNoteItem[] = [];
    let used = 0;
    const flush = () => {
      out.push(rebuildMeasure(emptyMeasure(out.length + 1), current, newTimeSig));
      current = [];
      used = 0;
    };
    for (const n of all) {
      const v = durationTo16ths(n.duration, n.isDotted);
      if (used + v > cap) flush();
      current.push(n);
      used += v;
    }
    if (current.length) flush();
    return out;
  };
  let next: StaveBlock = { ...block, timeSignature: newTimeSig, measures: flowStaff(block.measures) };
  if (block.staffMode === 'grand') next.lowerMeasures = flowStaff(block.lowerMeasures || []);
  next = setMeasureCount(next, Math.max(measureCount(next), measureCount(block), 1));
  return { ...next, updatedAt: Date.now() };
}

/* ── Normalización de datos antiguos ─────────────────────── */

export function normalizeStave(raw: StaveBlock): StaveBlock {
  const ts = raw.timeSignature || '4/4';
  const fixStaff = (ms: MeasureData[] = []) =>
    renumber(
      ms.map((m) => {
        const notes = (m.notes || []).map((n) =>
          n.isRest && n.auto === undefined && String(n.id).startsWith('rest-') ? { ...n, auto: true } : n,
        );
        const content = notes.filter((n) => !n.auto);
        return rebuildMeasure({ ...m, notes }, content, ts);
      }),
    );
  const block: StaveBlock = {
    ...raw,
    title: raw.title ?? '',
    clef: raw.clef || 'treble',
    keySignature: raw.keySignature || 'C',
    timeSignature: ts,
    displayRange: raw.displayRange || { mode: 'all' },
    staffMode: raw.staffMode || 'single',
    measures: fixStaff(raw.measures),
  };
  if (block.staffMode === 'grand') {
    block.lowerMeasures = fixStaff(raw.lowerMeasures);
    block.lowerClef = raw.lowerClef || 'bass';
  }
  return block.measures.length === 0 ? setMeasureCount(block, 1) : setMeasureCount(block, measureCount(block));
}

export function newStave(opts: Partial<StaveBlock> & { count?: number } = {}): StaveBlock {
  const now = Date.now();
  const { count = 4, ...rest } = opts;
  const base: StaveBlock = {
    id: uid('stave'),
    title: '',
    isCollapsed: false,
    clef: 'treble',
    keySignature: 'C',
    timeSignature: '4/4',
    staffMode: 'single',
    measures: [],
    displayRange: { mode: 'all' },
    createdAt: now,
    updatedAt: now,
    ...rest,
  };
  if (base.staffMode === 'grand') {
    base.lowerClef = base.lowerClef || 'bass';
    base.lowerMeasures = [];
  }
  return setMeasureCount(base, count);
}

/* ── MusicXML ─────────────────────────────────────────────── */

function keyToPitch(key: string): string {
  const [p, o] = key.split('/');
  const step = p.charAt(0).toUpperCase();
  const acc = p.slice(1, 2); // '#', 'b' o 'n'
  return `${step}${acc === 'n' ? '' : acc}${o || '4'}`;
}

function measureToNotes(m: MeasureData, cap: number): ScoreNote[] {
  if (m.notes.length === 0) {
    return [{ id: `mr-${m.id}`, pitch: 'R', type: 'rest', duration: cap, measureRest: true }];
  }
  const out: ScoreNote[] = [];
  const firstRoman = m.harmonicAnalysis?.romanNumeral;
  m.notes.forEach((n, ni) => {
    const dur = durationTo16ths(n.duration, n.isDotted);
    const lyric = n.annotation || (ni === 0 && firstRoman ? firstRoman : undefined);
    if (n.isRest) {
      out.push({ id: n.id, pitch: 'R', type: 'rest', duration: dur, xmlType: XML_TYPES[n.duration], dotted: n.isDotted, lyric });
      return;
    }
    n.keys.forEach((k, ki) => {
      out.push({
        id: `${n.id}-${ki}`,
        pitch: keyToPitch(k),
        type: 'note',
        duration: dur,
        xmlType: XML_TYPES[n.duration],
        dotted: n.isDotted,
        isChord: ki > 0,
        lyric: ki === 0 ? lyric : undefined,
      });
    });
  });
  return out;
}

export function staveToMusicXml(block: StaveBlock, opts: { applyRange?: boolean } = {}): string {
  const cap = capacityOf(block.timeSignature);
  const [beats, beatType] = (block.timeSignature || '4/4').split('/').map((x) => parseInt(x, 10));
  let start = 0;
  let end = measureCount(block);
  if (opts.applyRange && block.displayRange?.mode === 'custom') {
    start = Math.max(0, (block.displayRange.startMeasure || 1) - 1);
    end = Math.min(end, Math.max(start + 1, block.displayRange.endMeasure || end));
  }
  const toPart = (id: string, clef: ClefType, ms: MeasureData[]) => ({
    id,
    name: '',
    clef,
    measures: ms.slice(start, end).map((m) => ({
      number: m.measureNumber,
      notes: measureToNotes(m, cap),
      words: m.harmonicAnalysis?.chordName || undefined,
    })),
  });
  const parts = [toPart('P1', block.clef, block.measures)];
  if (block.staffMode === 'grand') parts.push(toPart('P2', block.lowerClef || 'bass', block.lowerMeasures || []));
  const data: ScoreData = {
    title: block.title || 'Ejercicio',
    composer: '',
    divisions: 4,
    parts,
    keySignature: keyFifths(block.keySignature),
    timeSignature: { beats: beats || 4, beatType: beatType || 4 },
  };
  return convertJsonToMusicXML(data);
}

export function staffClefs(block: StaveBlock): ClefType[] {
  return block.staffMode === 'grand' ? [block.clef, block.lowerClef || 'bass'] : [block.clef];
}

export function countNotes(block: StaveBlock): number {
  const count = (ms: MeasureData[] = []) => ms.reduce((a, m) => a + contentOf(m).filter((n) => !n.isRest).length, 0);
  return count(block.measures) + (block.staffMode === 'grand' ? count(block.lowerMeasures) : 0);
}
