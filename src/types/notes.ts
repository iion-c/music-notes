import type { StaveBlock } from './music';

/* ── Papel y apariencia ───────────────────────────────────── */

export type PaperPattern = 'ruled' | 'grid' | 'dots' | 'staff' | 'blank';
export type PaperTone = 'white' | 'cream' | 'recycled' | 'night';
export type PaperFont = 'hand' | 'print' | 'serif' | 'sans';
export type PageLayout = 'cornell' | 'outline' | 'free';
export type PageWidth = 'letter' | 'a4' | 'wide';

export interface PaperStyle {
  pattern: PaperPattern;
  tone: PaperTone;
  font: PaperFont;
  /** Color de la tinta (hex). */
  ink: string;
  /** Alto del renglón en px (28–44). Todo el texto se alinea a esta retícula. */
  rule: number;
  /** Multiplicador del tamaño de letra respecto al renglón (0.85–1.2). */
  textScale: number;
  /** Mostrar la línea de margen. */
  marginLine: boolean;
  /** Ancho de la columna de claves de Cornell en % (20–38). */
  cueWidth: number;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

/* ── Bloques de contenido ─────────────────────────────────── */

interface BlockBase {
  id: string;
  /** Columna de claves (Cornell): pregunta o palabra clave alineada con este bloque. */
  cue?: string;
  /** Nivel de sangría (método de esquema), 0–4. */
  indent?: number;
  /** Marcatextos sobre todo el bloque. */
  highlight?: HighlightColor;
}

export interface HeadingBlock extends BlockBase {
  type: 'heading';
  text: string;
  level: 'h1' | 'h2' | 'h3';
  color?: string;
}

export interface TextBlock extends BlockBase {
  type: 'text';
  content: string;
  /** Formato antiguo (v2); se migra a CalloutBlock al cargar. */
  styleVariant?: 'normal' | 'callout-yellow' | 'callout-blue' | 'callout-green';
}

export type CalloutKind = 'definicion' | 'regla' | 'ejemplo' | 'importante' | 'pregunta' | 'excepcion';

export interface CalloutBlock extends BlockBase {
  type: 'callout';
  kind: CalloutKind;
  content: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistBlock extends BlockBase {
  type: 'checklist';
  items: ChecklistItem[];
}

export interface ImageBlock extends BlockBase {
  type: 'image';
  src: string;
  caption: string;
  alignment?: 'left' | 'center' | 'right' | 'full';
  widthPx?: number;
  /** Ancho relativo al renglón de notas, 30–100 %. */
  widthPct?: number;
  timestamp: number;
}

export interface StaveContentBlock extends BlockBase {
  type: 'stave';
  data: StaveBlock;
}

export interface Stroke {
  tool: 'pen' | 'marker';
  color: string;
  width: number;
  /** Puntos aplanados: x0, y0, x1, y1… en unidades lógicas (ancho = 1000). */
  points: number[];
}

export interface SketchBlock extends BlockBase {
  type: 'sketch';
  strokes: Stroke[];
  /** Alto en renglones. */
  rows: number;
}

export interface TableBlock extends BlockBase {
  type: 'table';
  /** La primera fila es el encabezado. */
  rows: string[][];
}

export interface DividerBlock extends BlockBase {
  type: 'divider';
}

export type ContentBlock =
  | HeadingBlock
  | TextBlock
  | CalloutBlock
  | ChecklistBlock
  | ImageBlock
  | StaveContentBlock
  | SketchBlock
  | TableBlock
  | DividerBlock;

export type BlockType = ContentBlock['type'];

/* ── Hojas y cuadernos ────────────────────────────────────── */

export interface PageMeta {
  /** Fecha de la clase (AAAA-MM-DD). */
  date?: string;
  professor?: string;
  /** Unidad / separador del cuaderno. */
  section?: string;
}

export interface ReviewState {
  /** Cuántos repasos se han completado. */
  stage: number;
  lastReviewed?: number;
  nextReview?: number;
}

export interface NotePage {
  id: string;
  notebookId: string;
  title: string;
  category: string;
  tags: string[];
  blocks: ContentBlock[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  layout?: PageLayout;
  meta?: PageMeta;
  /** Resumen de Cornell (franja inferior). */
  summary?: string;
  /** Ajustes de papel propios de esta hoja (sobrescriben los del cuaderno/globales). */
  paper?: Partial<PaperStyle>;
  review?: ReviewState;
}

export interface Notebook {
  id: string;
  name: string;
  description: string;
  /** Color de la tapa (hex). Versiones antiguas guardaban clases de Tailwind. */
  color: string;
  icon: string;
  pageIds: string[];
  createdAt: number;
  updatedAt?: number;
  professor?: string;
  semester?: string;
  schedule?: string;
  /** Papel por defecto de las hojas nuevas de este cuaderno. */
  paper?: Partial<PaperStyle>;
  archived?: boolean;
}

/* ── Preferencias globales ───────────────────────────────── */

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  paper: PaperStyle;
  defaultLayout: PageLayout;
  pageWidth: PageWidth;
  bpm: number;
  instrument: 'piano' | 'synth' | 'organ' | 'flute';
  /** Sonar la nota al escribirla en el pentagrama. */
  previewSound: boolean;
  /** Mostrar ayudas de método (placeholders con preguntas guía). */
  methodHints: boolean;
}
