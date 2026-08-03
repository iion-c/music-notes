export type PitchAccidental = '#' | 'b' | 'n' | '';
export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor';
export type DurationType = 'w' | 'h' | 'q' | '8' | '16' | '32'; // whole, half, quarter, 8th, 16th, 32nd
export type DynamicMark = 'p' | 'mp' | 'mf' | 'f' | 'ff';

export interface MusicNoteItem {
  id: string;
  keys: string[]; // e.g. ["c/4"], ["e/4", "g/4", "b/4"] for chords
  duration: DurationType;
  isRest: boolean;
  isDotted?: boolean;
  accidental?: PitchAccidental;
  dynamic?: DynamicMark;
  tieStart?: boolean;
  tieStop?: boolean;
  annotation?: string; // e.g. "Paso", "Bordadura", "Síncopa"
}

export interface MeasureHarmonicAnalysis {
  measureNumber: number;
  romanNumeral?: string; // e.g. "I", "IV", "V7", "ii6", "vi", "Cadencia Auténtica"
  figuredBass?: string;  // e.g. "6", "6/4", "7", "6/5"
  chordName?: string;    // e.g. "Cmaj7", "G7", "Am"
  comments?: string;     // Text notes for this measure
}

export interface MeasureData {
  id: string;
  measureNumber: number;
  notes: MusicNoteItem[];
  clef?: ClefType;
  keySignature?: string; // e.g. "C", "G", "D", "F", "Bb", "Am", "Em"
  timeSignature?: string; // e.g. "4/4", "3/4", "6/8", "2/4", "4/2"
  harmonicAnalysis?: MeasureHarmonicAnalysis;
}

export interface StaveBlock {
  id: string;
  title: string;
  description?: string;
  isCollapsed: boolean;
  clef: ClefType;
  keySignature: string; // "C", "G", "D", "A", "E", "F", "Bb", "Eb"
  timeSignature: string; // "4/4", "3/4", "6/8", "2/4", "4/2"
  measures: MeasureData[];
  displayRange: {
    mode: 'all' | 'custom';
    startMeasure?: number; // 1-indexed
    endMeasure?: number;   // 1-indexed
  };
  exerciseType?: 'harmony' | 'counterpoint' | 'dictation' | 'free';
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TextBlock {
  id: string;
  type: 'text';
  content: string; // HTML/Markdown formatted theory note text
}

export interface ImageBlock {
  id: string;
  type: 'image';
  src: string;
  caption: string;
  timestamp: number;
}

export type ContentBlock = 
  | { id: string; type: 'stave'; data: StaveBlock }
  | TextBlock
  | ImageBlock;

export interface NotePage {
  id: string;
  notebookId: string;
  title: string;
  category: string; // 'Armonía', 'Contrapunto', 'Solfeo', 'Composición', 'General'
  tags: string[];
  blocks: ContentBlock[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

export interface Notebook {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  pageIds: string[];
  createdAt: number;
}

export const CLEF_NAMES: Record<ClefType, string> = {
  treble: 'Clave de Sol (2ª)',
  bass: 'Clave de Fa (4ª)',
  alto: 'Clave de Do (3ª)',
  tenor: 'Clave de Do (4ª)'
};

export const DURATION_NAMES: Record<DurationType, { name: string; beats44: number; symbol: string }> = {
  w: { name: 'Redonda', beats44: 4, symbol: '𝅝' },
  h: { name: 'Blanca', beats44: 2, symbol: '𝅗𝅥' },
  q: { name: 'Negra', beats44: 1, symbol: '𝅘𝅥' },
  '8': { name: 'Corchea', beats44: 0.5, symbol: '𝅘𝅥𝅮' },
  '16': { name: 'Semicorchea', beats44: 0.25, symbol: '𝅘𝅥𝅯' },
  '32': { name: 'Fusa', beats44: 0.125, symbol: '𝅘𝅥𝅰' }
};

export const KEY_SIGNATURES = [
  { code: 'C', name: 'Do Mayor / La menor (0 ♯/♭)' },
  { code: 'G', name: 'Sol Mayor / Mi menor (1 ♯)' },
  { code: 'D', name: 'Re Mayor / Si menor (2 ♯)' },
  { code: 'A', name: 'La Mayor / Fa♯ menor (3 ♯)' },
  { code: 'E', name: 'Mi Mayor / Do♯ menor (4 ♯)' },
  { code: 'F', name: 'Fa Mayor / Re menor (1 ♭)' },
  { code: 'Bb', name: 'Sib Mayor / Sol menor (2 ♭)' },
  { code: 'Eb', name: 'Mib Mayor / Do menor (3 ♭)' },
  { code: 'Ab', name: 'Lab Mayor / Fa menor (4 ♭)' }
];

export const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '4/2', '3/2', '12/8', '2/2'];
