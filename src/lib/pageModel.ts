import type {
  BlockType,
  CalloutKind,
  ContentBlock,
  Notebook,
  NotePage,
  PageLayout,
  PaperStyle,
} from '../types/notes';
import { newStave, normalizeStave } from './score';
import { NOTEBOOK_COLORS } from './paper';
import { initialReview } from './review';
import { todayISO, uid } from './uid';

/* ── Tipos de bloque ─────────────────────────────────────── */

export const CALLOUTS: Record<CalloutKind, { name: string; color: string; icon: string; hint: string }> = {
  definicion: { name: 'Definición', color: '#2f6fdf', icon: '📘', hint: 'Término: explicación con tus palabras…' },
  regla: { name: 'Regla', color: '#b4542d', icon: '📏', hint: 'Ej.: evitar quintas y octavas paralelas entre voces extremas…' },
  ejemplo: { name: 'Ejemplo', color: '#1f8a55', icon: '🎵', hint: 'Obra, compás o situación donde se aplica…' },
  importante: { name: 'Importante', color: '#c28a00', icon: '⭐', hint: 'Lo que el profesor repitió o dijo que entra en el examen…' },
  pregunta: { name: 'Pregunta', color: '#7a4fd0', icon: '❓', hint: 'Duda para preguntar en clase o investigar…' },
  excepcion: { name: 'Excepción', color: '#c0392b', icon: '⚠️', hint: 'Cuándo NO se cumple la regla…' },
};

export interface BlockTypeInfo {
  type: BlockType | `callout:${CalloutKind}` | 'heading:h1' | 'heading:h3';
  name: string;
  hint: string;
  keywords: string;
}

export const BLOCK_MENU: BlockTypeInfo[] = [
  { type: 'text', name: 'Texto', hint: 'Escribe en los renglones', keywords: 'texto parrafo nota' },
  { type: 'heading', name: 'Subtítulo', hint: 'Divide la clase en temas', keywords: 'titulo encabezado seccion h2' },
  { type: 'heading:h1', name: 'Título grande', hint: 'Tema principal', keywords: 'titulo h1' },
  { type: 'heading:h3', name: 'Subtítulo pequeño', hint: 'Subtema', keywords: 'titulo h3' },
  { type: 'stave', name: 'Pentagrama', hint: 'Editor ArmonIA con lápiz', keywords: 'pentagrama partitura musica notas armonia' },
  { type: 'sketch', name: 'Dibujo a mano', hint: 'Lápiz, marcador y borrador', keywords: 'dibujo mano lapiz boceto esquema' },
  { type: 'callout:definicion', name: 'Definición', hint: CALLOUTS.definicion.hint, keywords: 'definicion concepto' },
  { type: 'callout:regla', name: 'Regla', hint: 'Reglas de conducción, normas', keywords: 'regla norma' },
  { type: 'callout:ejemplo', name: 'Ejemplo', hint: 'Caso concreto', keywords: 'ejemplo obra' },
  { type: 'callout:importante', name: 'Importante', hint: 'Para el examen', keywords: 'importante examen estrella' },
  { type: 'callout:pregunta', name: 'Pregunta / duda', hint: 'Para preguntar o investigar', keywords: 'pregunta duda' },
  { type: 'callout:excepcion', name: 'Excepción', hint: 'Cuándo no aplica', keywords: 'excepcion cuidado' },
  { type: 'checklist', name: 'Lista de tareas', hint: 'Tareas, ejercicios, lecturas', keywords: 'tareas checklist lista pendientes' },
  { type: 'table', name: 'Tabla comparativa', hint: 'Método de cuadros (charting)', keywords: 'tabla comparar cuadro charting' },
  { type: 'image', name: 'Imagen o foto', hint: 'Foto de la pizarra o partitura', keywords: 'imagen foto pizarra' },
  { type: 'divider', name: 'Separador', hint: 'Línea para cambiar de tema', keywords: 'separador linea' },
];

export function createBlock(kind: BlockTypeInfo['type'], extra: Partial<ContentBlock> = {}): ContentBlock {
  const id = uid('b');
  if (kind.startsWith('callout:')) {
    return { id, type: 'callout', kind: kind.split(':')[1] as CalloutKind, content: '', ...extra } as ContentBlock;
  }
  if (kind.startsWith('heading')) {
    const level = kind === 'heading:h1' ? 'h1' : kind === 'heading:h3' ? 'h3' : 'h2';
    return { id, type: 'heading', text: '', level, ...extra } as ContentBlock;
  }
  switch (kind) {
    case 'text':
      return { id, type: 'text', content: '', ...extra } as ContentBlock;
    case 'checklist':
      return { id, type: 'checklist', items: [{ id: uid('i'), text: '', done: false }], ...extra } as ContentBlock;
    case 'table':
      return { id, type: 'table', rows: [['Concepto', 'Características', 'Ejemplo'], ['', '', ''], ['', '', '']], ...extra } as ContentBlock;
    case 'sketch':
      return { id, type: 'sketch', strokes: [], rows: 8, ...extra } as ContentBlock;
    case 'divider':
      return { id, type: 'divider', ...extra } as ContentBlock;
    case 'stave':
      return { id, type: 'stave', data: newStave({ count: 4 }), ...extra } as ContentBlock;
    case 'image':
      return { id, type: 'image', src: '', caption: '', alignment: 'center', widthPct: 80, timestamp: Date.now(), ...extra } as ContentBlock;
    default:
      return { id, type: 'text', content: '', ...extra } as ContentBlock;
  }
}

/* ── Plantillas (cada una responde a un método de apuntes) ─ */

export interface PageTemplate {
  id: string;
  name: string;
  method: string;
  description: string;
  when: string;
  layout: PageLayout;
  paper?: Partial<PaperStyle>;
  title: string;
  blocks: () => ContentBlock[];
}

const text = (content = '', cue?: string): ContentBlock => ({ id: uid('b'), type: 'text', content, cue });
const heading = (t: string, level: 'h1' | 'h2' | 'h3' = 'h2'): ContentBlock => ({ id: uid('b'), type: 'heading', text: t, level });

export const TEMPLATES: PageTemplate[] = [
  {
    id: 'cornell',
    name: 'Clase (Cornell)',
    method: 'Método Cornell — W. Pauk',
    description: 'Notas a la derecha, preguntas clave a la izquierda y un resumen abajo.',
    when: 'Clases teóricas: historia, análisis, armonía teórica.',
    layout: 'cornell',
    title: '',
    blocks: () => [text()],
  },
  {
    id: 'armonia',
    name: 'Ejercicio de armonía',
    method: 'Cornell + pentagrama doble',
    description: 'Sistema de piano (Sol + Fa) para 4 voces, reglas y análisis con grados.',
    when: 'Armonía tradicional, bajo cifrado, corales.',
    layout: 'cornell',
    title: '',
    blocks: () => [
      heading('Enunciado'),
      text(),
      { id: uid('b'), type: 'stave', data: newStave({ staffMode: 'grand', count: 4, exerciseType: 'harmony' }), cue: '¿Qué grados usé?' },
      { id: uid('b'), type: 'callout', kind: 'regla', content: '', cue: 'Reglas a revisar' },
      text('', 'Errores frecuentes'),
    ],
  },
  {
    id: 'dictado',
    name: 'Dictado / solfeo',
    method: 'Papel pautado',
    description: 'Pentagramas listos para transcribir lo que escuchas.',
    when: 'Dictado melódico o rítmico, entrenamiento auditivo.',
    layout: 'free',
    paper: { pattern: 'staff' },
    title: '',
    blocks: () => [
      text('Tonalidad:  ·  Compás:  ·  Nº de escuchas:'),
      { id: uid('b'), type: 'stave', data: newStave({ count: 8, exerciseType: 'dictation' }) },
      { id: uid('b'), type: 'stave', data: newStave({ count: 8, exerciseType: 'dictation' }) },
      { id: uid('b'), type: 'callout', kind: 'pregunta', content: '' },
    ],
  },
  {
    id: 'analisis',
    name: 'Análisis de obra',
    method: 'Cornell + secciones guía',
    description: 'Contexto, forma, armonía, textura y conclusiones.',
    when: 'Análisis musical, historia de la música, audiciones.',
    layout: 'cornell',
    title: '',
    blocks: () => [
      heading('Contexto'),
      text('Compositor · año · género · plantilla', 'Autor y época'),
      heading('Forma'),
      text('', 'Secciones'),
      heading('Armonía'),
      { id: uid('b'), type: 'stave', data: newStave({ count: 4, exerciseType: 'free' }), cue: 'Fragmento clave' },
      text('', 'Cadencias'),
      heading('Textura y timbre'),
      text(),
    ],
  },
  {
    id: 'esquema',
    name: 'Esquema',
    method: 'Método de esquema (outline)',
    description: 'Ideas jerarquizadas con sangría (Tab / Shift+Tab).',
    when: 'Clases muy estructuradas o lecturas con capítulos.',
    layout: 'outline',
    title: '',
    blocks: () => [heading('Tema'), text(), text('', undefined)].map((b, i) => (i === 2 ? { ...b, indent: 1 } : b)),
  },
  {
    id: 'comparativa',
    name: 'Tabla comparativa',
    method: 'Método de cuadros (charting)',
    description: 'Compara conceptos por características en una tabla.',
    when: 'Periodos históricos, tipos de cadencia, formas musicales.',
    layout: 'free',
    paper: { pattern: 'grid' },
    title: '',
    blocks: () => [heading('¿Qué estoy comparando?'), createBlock('table'), text()],
  },
  {
    id: 'estudio',
    name: 'Bitácora de estudio',
    method: 'Práctica deliberada',
    description: 'Objetivos del día, registro de tempo y observaciones.',
    when: 'Práctica de instrumento o canto.',
    layout: 'free',
    title: '',
    blocks: () => [
      heading('Objetivos de hoy'),
      { id: uid('b'), type: 'checklist', items: ['Escalas', 'Estudio técnico', 'Obra'].map((t) => ({ id: uid('i'), text: t, done: false })) },
      heading('Registro'),
      { id: uid('b'), type: 'table', rows: [['Pasaje', 'Tempo (BPM)', 'Observaciones'], ['', '', ''], ['', '', '']] },
    ],
  },
  {
    id: 'libre',
    name: 'Hoja libre',
    method: 'Sin estructura',
    description: 'Papel en blanco con margen. Tú decides.',
    when: 'Ideas sueltas, bocetos, composición.',
    layout: 'free',
    title: '',
    blocks: () => [text()],
  },
];

export function createPageFromTemplate(templateId: string, notebookId: string, opts: { section?: string; category?: string } = {}): NotePage {
  const t = TEMPLATES.find((x) => x.id === templateId) || TEMPLATES[0];
  const now = Date.now();
  return {
    id: uid('page'),
    notebookId,
    title: t.title,
    category: opts.category || 'General',
    tags: [],
    blocks: t.blocks(),
    createdAt: now,
    updatedAt: now,
    layout: t.layout,
    meta: { date: todayISO(), section: opts.section || undefined },
    summary: '',
    paper: t.paper,
    review: initialReview(now),
  };
}

/* ── Migración de datos antiguos (v2) ─────────────────────── */

const LEGACY_PLACEHOLDERS = [
  'Empieza a escribir tus observaciones musicales o añade un pentagrama...',
  'Escribe aquí tus apuntes teóricos o reglas de conducción de voces...',
  'Nueva Nota Musical',
];

export function normalizeBlock(b: ContentBlock): ContentBlock {
  if (b.type === 'text') {
    const content = LEGACY_PLACEHOLDERS.includes(b.content) ? '' : b.content ?? '';
    if (b.styleVariant && b.styleVariant !== 'normal') {
      const kind: CalloutKind = b.styleVariant === 'callout-blue' ? 'definicion' : b.styleVariant === 'callout-green' ? 'ejemplo' : 'importante';
      return { id: b.id, type: 'callout', kind, content, cue: b.cue, indent: b.indent, highlight: b.highlight };
    }
    const { styleVariant: _legacy, ...rest } = b;
    return { ...rest, content };
  }
  if (b.type === 'stave') return { ...b, data: normalizeStave(b.data) };
  if (b.type === 'heading') return { ...b, text: b.text ?? '' };
  return b;
}

export function normalizePage(p: NotePage): NotePage {
  return {
    ...p,
    title: p.title === 'Nueva Nota Musical' ? '' : p.title ?? '',
    tags: p.tags || [],
    category: p.category || 'General',
    blocks: (p.blocks || []).map(normalizeBlock),
    layout: p.layout || 'free',
    meta: p.meta || { date: todayISO(new Date(p.createdAt || Date.now())) },
    review: p.review || initialReview(p.createdAt || Date.now()),
  };
}

export function normalizeNotebook(n: Notebook, index = 0): Notebook {
  return {
    ...n,
    color: /^#[0-9a-f]{3,8}$/i.test(n.color || '') ? n.color : NOTEBOOK_COLORS[index % NOTEBOOK_COLORS.length],
    icon: n.icon || '🎼',
    pageIds: n.pageIds || [],
    description: n.description || '',
  };
}

export function createNotebook(data: Partial<Notebook> & { name: string }): Notebook {
  return {
    id: uid('nb'),
    description: '',
    color: NOTEBOOK_COLORS[0],
    icon: '🎼',
    pageIds: [],
    createdAt: Date.now(),
    ...data,
  };
}

export function blockPlainText(b: ContentBlock): string {
  switch (b.type) {
    case 'text':
    case 'callout':
      return b.content;
    case 'heading':
      return b.text;
    case 'checklist':
      return b.items.map((i) => i.text).join(' ');
    case 'table':
      return b.rows.flat().join(' ');
    case 'image':
      return b.caption;
    case 'stave':
      return b.data.title;
    default:
      return '';
  }
}

export function pageSearchText(p: NotePage): string {
  return [p.title, p.summary, p.tags.join(' '), p.meta?.section, ...p.blocks.map((b) => `${b.cue || ''} ${blockPlainText(b)}`)]
    .join(' ')
    .toLowerCase();
}
