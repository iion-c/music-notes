export type PitchAccidental = '#' | 'b' | 'n' | '';
export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor';
export type DurationType = 'w' | 'h' | 'q' | '8' | '16' | '32';

export interface MusicNoteItem {
  id: string;
  /** Formato "paso[alteración]/octava", p. ej. "c/4", "f#/5", "bb/3". Varias = acorde. */
  keys: string[];
  duration: DurationType;
  isRest: boolean;
  isDotted?: boolean;
  /** Alteración elegida explícitamente (se conserva para compatibilidad; la altura real está en keys). */
  accidental?: PitchAccidental;
  dynamic?: string;
  /** Cifrado / grado escrito debajo de la nota (p. ej. "V7", "I6/4"). */
  annotation?: string;
  /** Silencio de relleno generado automáticamente para completar el compás. */
  auto?: boolean;
}

export interface MeasureHarmonicAnalysis {
  measureNumber: number;
  romanNumeral?: string;
  figuredBass?: string;
  chordName?: string;
  comments?: string;
}

export interface MeasureData {
  id: string;
  measureNumber: number;
  notes: MusicNoteItem[];
  clef?: ClefType;
  keySignature?: string;
  timeSignature?: string;
  harmonicAnalysis?: MeasureHarmonicAnalysis;
}

export interface StaveBlock {
  id: string;
  title: string;
  description?: string;
  isCollapsed: boolean;
  clef: ClefType;
  keySignature: string;
  timeSignature: string;
  /** Pentagrama superior (o único). */
  measures: MeasureData[];
  /** 'grand' = sistema de piano (Sol + Fa), ideal para armonía a 4 voces. */
  staffMode?: 'single' | 'grand';
  /** Pentagrama inferior cuando staffMode === 'grand'. */
  lowerMeasures?: MeasureData[];
  lowerClef?: ClefType;
  displayRange: {
    mode: 'all' | 'custom';
    startMeasure?: number;
    endMeasure?: number;
  };
  exerciseType?: 'harmony' | 'counterpoint' | 'dictation' | 'free';
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export const CLEF_NAMES: Record<ClefType, string> = {
  treble: 'Clave de Sol',
  bass: 'Clave de Fa',
  alto: 'Clave de Do en 3ª',
  tenor: 'Clave de Do en 4ª',
};

export const DURATION_NAMES: Record<DurationType, { name: string; symbol: string; sixteenths: number }> = {
  w: { name: 'Redonda', symbol: '𝅝', sixteenths: 16 },
  h: { name: 'Blanca', symbol: '𝅗𝅥', sixteenths: 8 },
  q: { name: 'Negra', symbol: '𝅘𝅥', sixteenths: 4 },
  '8': { name: 'Corchea', symbol: '𝅘𝅥𝅮', sixteenths: 2 },
  '16': { name: 'Semicorchea', symbol: '𝅘𝅥𝅯', sixteenths: 1 },
  '32': { name: 'Fusa', symbol: '𝅘𝅥𝅰', sixteenths: 0.5 },
};

/** Figuras disponibles en el editor (la fusa no cabe en la resolución de semicorcheas del motor). */
export const EDITOR_DURATIONS: DurationType[] = ['w', 'h', 'q', '8', '16'];

export const KEY_SIGNATURES: { code: string; fifths: number; name: string }[] = [
  { code: 'Cb', fifths: -7, name: 'Do♭ M / La♭ m (7♭)' },
  { code: 'Gb', fifths: -6, name: 'Sol♭ M / Mi♭ m (6♭)' },
  { code: 'Db', fifths: -5, name: 'Re♭ M / Si♭ m (5♭)' },
  { code: 'Ab', fifths: -4, name: 'La♭ M / Fa m (4♭)' },
  { code: 'Eb', fifths: -3, name: 'Mi♭ M / Do m (3♭)' },
  { code: 'Bb', fifths: -2, name: 'Si♭ M / Sol m (2♭)' },
  { code: 'F', fifths: -1, name: 'Fa M / Re m (1♭)' },
  { code: 'C', fifths: 0, name: 'Do M / La m (sin alteraciones)' },
  { code: 'G', fifths: 1, name: 'Sol M / Mi m (1♯)' },
  { code: 'D', fifths: 2, name: 'Re M / Si m (2♯)' },
  { code: 'A', fifths: 3, name: 'La M / Fa♯ m (3♯)' },
  { code: 'E', fifths: 4, name: 'Mi M / Do♯ m (4♯)' },
  { code: 'B', fifths: 5, name: 'Si M / Sol♯ m (5♯)' },
  { code: 'F#', fifths: 6, name: 'Fa♯ M / Re♯ m (6♯)' },
  { code: 'C#', fifths: 7, name: 'Do♯ M / La♯ m (7♯)' },
];

export const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '2/2', '6/8', '3/8', '9/8', '12/8', '3/2', '4/2'];
