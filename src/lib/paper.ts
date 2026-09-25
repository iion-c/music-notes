import type { CSSProperties } from 'react';
import type { AppSettings, Notebook, NotePage, PaperFont, PaperPattern, PaperStyle, PaperTone, PageWidth } from '../types/notes';

export const DEFAULT_PAPER: PaperStyle = {
  pattern: 'ruled',
  tone: 'cream',
  font: 'print',
  ink: '#1f3a93',
  rule: 32,
  textScale: 1,
  marginLine: true,
  cueWidth: 28,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  paper: DEFAULT_PAPER,
  defaultLayout: 'cornell',
  pageWidth: 'letter',
  bpm: 90,
  instrument: 'piano',
  previewSound: true,
  methodHints: true,
};

export const PAPER_PATTERNS: { id: PaperPattern; name: string; hint: string }[] = [
  { id: 'ruled', name: 'Rayado', hint: 'Renglones como un cuaderno universitario' },
  { id: 'grid', name: 'Cuadriculado', hint: 'Para esquemas, tablas y dibujos' },
  { id: 'dots', name: 'Punteado', hint: 'Guía discreta, estilo bullet journal' },
  { id: 'staff', name: 'Pautado', hint: 'Papel de pentagramas para dictados y bocetos' },
  { id: 'blank', name: 'Liso', hint: 'Sin guías' },
];

interface ToneDef {
  name: string;
  paper: string;
  line: string;
  lineSoft: string;
  margin: string;
  inkSoft: string;
  dark: boolean;
}

export const PAPER_TONES: Record<PaperTone, ToneDef> = {
  white: { name: 'Blanco', paper: '#fefefc', line: '#c3d3ea', lineSoft: '#e4ebf5', margin: '#e59a9a', inkSoft: '#6a7280', dark: false },
  cream: { name: 'Marfil', paper: '#fbf6e9', line: '#d9cba8', lineSoft: '#ece2ca', margin: '#dc9a86', inkSoft: '#766b58', dark: false },
  recycled: { name: 'Reciclado', paper: '#eee7d8', line: '#cbbfa6', lineSoft: '#ddd3be', margin: '#c69580', inkSoft: '#6f6552', dark: false },
  night: { name: 'Nocturno', paper: '#23262c', line: '#3d434d', lineSoft: '#2f343c', margin: '#7d4f4f', inkSoft: '#9aa0aa', dark: true },
};

export const INKS: { id: string; name: string; light: string; dark: string }[] = [
  { id: 'azul', name: 'Azul bolígrafo', light: '#1f3a93', dark: '#a3bcff' },
  { id: 'negro', name: 'Negro', light: '#1f2328', dark: '#ebe8e1' },
  { id: 'grafito', name: 'Grafito', light: '#51565e', dark: '#bfc3ca' },
  { id: 'verde', name: 'Verde', light: '#1d6b4c', dark: '#86d4ad' },
  { id: 'morado', name: 'Morado', light: '#5a3d9a', dark: '#c5aefc' },
  { id: 'rojo', name: 'Rojo', light: '#b3261e', dark: '#ff9a90' },
];

interface FontDef {
  name: string;
  family: string;
  /** Tamaño relativo al renglón. */
  size: number;
  /** Dónde cae la línea dentro del renglón para que la letra "se apoye" en ella. */
  linePos: number;
  hand: boolean;
}

export const PAPER_FONTS: Record<PaperFont, FontDef> = {
  hand: { name: 'Manuscrita', family: "Caveat, cursive, 'Noto Music'", size: 0.76, linePos: 0.77, hand: true },
  print: { name: 'Script legible', family: "'Patrick Hand', cursive, 'Noto Music'", size: 0.6, linePos: 0.76, hand: true },
  serif: { name: 'Libro (serif)', family: "Literata, Georgia, serif, 'Noto Music'", size: 0.5, linePos: 0.74, hand: false },
  sans: { name: 'Moderna (sans)', family: "Inter, system-ui, sans-serif, 'Noto Music'", size: 0.47, linePos: 0.72, hand: false },
};

export const PAGE_WIDTHS: Record<PageWidth, { name: string; px: number }> = {
  letter: { name: 'Carta', px: 816 },
  a4: { name: 'A4', px: 794 },
  wide: { name: 'Ancha', px: 1040 },
};

export const NOTEBOOK_COLORS = ['#a8481f', '#1f3a93', '#1d6b4c', '#5a3d9a', '#b8860b', '#8a2846', '#2f5d62', '#3f3f46'];

/** Tapa del cuaderno: acepta hex o los gradientes de Tailwind de versiones antiguas. */
export function notebookColor(nb?: Notebook): string {
  if (!nb) return NOTEBOOK_COLORS[0];
  return /^#[0-9a-f]{3,8}$/i.test(nb.color) ? nb.color : NOTEBOOK_COLORS[0];
}

export function resolvePaper(settings: AppSettings, notebook?: Notebook, page?: NotePage): PaperStyle {
  return { ...DEFAULT_PAPER, ...settings.paper, ...(notebook?.paper || {}), ...(page?.paper || {}) };
}

/** Tinta legible según el tono: si el papel es oscuro se usa la variante clara de la misma tinta. */
export function effectiveInk(style: PaperStyle): string {
  const tone = PAPER_TONES[style.tone];
  const match = INKS.find((i) => i.light.toLowerCase() === style.ink.toLowerCase() || i.dark.toLowerCase() === style.ink.toLowerCase());
  if (match) return tone.dark ? match.dark : match.light;
  return style.ink;
}

export function paperVars(style: PaperStyle): CSSProperties {
  const tone = PAPER_TONES[style.tone];
  const font = PAPER_FONTS[style.font];
  const rule = Math.max(24, Math.min(48, style.rule));
  return {
    '--paper': tone.paper,
    '--paper-line': tone.line,
    '--paper-line-soft': tone.lineSoft,
    '--paper-margin': tone.margin,
    '--ink': effectiveInk(style),
    '--ink-soft': tone.inkSoft,
    '--rule': `${rule}px`,
    '--line-pos': String(font.linePos),
    '--paper-font': font.family,
    '--paper-size': `${Math.round(rule * font.size * style.textScale * 10) / 10}px`,
    '--cue-w': `${style.cueWidth}%`,
    '--margin-x': `${Math.round(rule * 2.2)}px`,
  } as CSSProperties;
}

export function patternClass(pattern: PaperPattern): string {
  return pattern === 'blank' ? '' : `pattern-${pattern}`;
}
