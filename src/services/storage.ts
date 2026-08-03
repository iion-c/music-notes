import { Notebook, NotePage, StaveBlock } from '../types/music';

const STORAGE_KEY_NOTEBOOKS = 'music_notes_notebooks_v1';
const STORAGE_KEY_PAGES = 'music_notes_pages_v1';

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-armonia',
    name: 'Armonía Tradicional',
    description: 'Apuntes de acordes, conducción de voces, enlaces y cadencias armónicas.',
    color: 'from-blue-600 to-cyan-500',
    icon: '🎵',
    pageIds: ['page-armonia-1'],
    createdAt: Date.now()
  },
  {
    id: 'nb-contrapunto',
    name: 'Contrapunto Estricto (Fux)',
    description: 'Ejercicios de 1ª a 5ª especie con Cantus Firmus y reglas de consonancia.',
    color: 'from-purple-600 to-indigo-500',
    icon: '🎼',
    pageIds: ['page-contrapunto-1'],
    createdAt: Date.now() - 1000
  },
  {
    id: 'nb-solfeo',
    name: 'Solfeo y Dictado Rítmico',
    description: 'Apuntes de lectura, rítmica en 4/4, 6/8 y 4/2 con entrenamiento auditivo.',
    color: 'from-emerald-600 to-teal-500',
    icon: '🎹',
    pageIds: ['page-solfeo-1'],
    createdAt: Date.now() - 2000
  }
];

export const INITIAL_STAVE_EXAMPLE_1: StaveBlock = {
  id: 'stave-ex-1',
  title: 'Progresión Armónica Fundamental I - IV - V7 - I',
  description: 'Ejemplo de enlace armónico a 4 voces en Do Mayor',
  isCollapsed: false,
  clef: 'treble',
  keySignature: 'C',
  timeSignature: '4/4',
  exerciseType: 'harmony',
  displayRange: { mode: 'all' },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  measures: [
    {
      id: 'm1',
      measureNumber: 1,
      notes: [
        { id: 'n1-1', keys: ['c/4', 'e/4', 'g/4', 'c/5'], duration: 'w', isRest: false }
      ],
      harmonicAnalysis: { measureNumber: 1, romanNumeral: 'I', chordName: 'C', figuredBass: '5/3', comments: 'Tónica en estado fundamental' }
    },
    {
      id: 'm2',
      measureNumber: 2,
      notes: [
        { id: 'n2-1', keys: ['c/4', 'f/4', 'a/4', 'c/5'], duration: 'w', isRest: false }
      ],
      harmonicAnalysis: { measureNumber: 2, romanNumeral: 'IV', chordName: 'F', figuredBass: '5/3', comments: 'Subdominante con nota común Do' }
    },
    {
      id: 'm3',
      measureNumber: 3,
      notes: [
        { id: 'n3-1', keys: ['b/3', 'f/4', 'g/4', 'd/5'], duration: 'w', isRest: false }
      ],
      harmonicAnalysis: { measureNumber: 3, romanNumeral: 'V7', chordName: 'G7', figuredBass: '6/5', comments: 'Dominante con 7ma en el soprano' }
    },
    {
      id: 'm4',
      measureNumber: 4,
      notes: [
        { id: 'n4-1', keys: ['c/4', 'e/4', 'g/4', 'c/5'], duration: 'w', isRest: false }
      ],
      harmonicAnalysis: { measureNumber: 4, romanNumeral: 'I', chordName: 'C', figuredBass: '5/3', comments: 'Resolución cadencial perfecta' }
    }
  ]
};

export const INITIAL_PAGES: NotePage[] = [
  {
    id: 'page-armonia-1',
    notebookId: 'nb-armonia',
    title: 'Lección 1: Las Cadencias Armónicas Principales',
    category: 'Armonía',
    tags: ['Cadencia', 'Grados Romanos', '4 Voces'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
    blocks: [
      {
        id: 'tb-1',
        type: 'text',
        content: `<h3><strong>Conceptos Clave de Cadencias</strong></h3><p>La <strong>cadencia auténtica perfecta</strong> consiste en el paso del acorde de Dominante (V o V7) al acorde de Tónica (I), con ambas tónicas en el bajo y la tónica en la voz superior del último acorde.</p><p>A continuación se ilustra la progresión en Do Mayor con su análisis armónico en grados romanos y bajo cifrado:</p>`
      },
      {
        id: 'sb-1',
        type: 'stave',
        data: INITIAL_STAVE_EXAMPLE_1
      },
      {
        id: 'tb-2',
        type: 'text',
        content: `<blockquote><strong>Regla de oro:</strong> Mantener la nota común entre acordes adyacentes y mover las voces restantes por el camino más corto (conducción de voces estricta).</blockquote>`
      }
    ]
  },
  {
    id: 'page-contrapunto-1',
    notebookId: 'nb-contrapunto',
    title: 'Fux 1ª Especie: Nota contra Nota en Modo Jónico',
    category: 'Contrapunto',
    tags: ['Fux', '1ª Especie', 'Cantus Firmus'],
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
    blocks: [
      {
        id: 'tb-cp-1',
        type: 'text',
        content: `<h3><strong>Reglas de la 1ª Especie de Fux</strong></h3><ul><li>Solo consonancias simples: 3ª, 5ª, 6ª, 8ª y unísono al inicio/final.</li><li>Prohibidas las 5ªs y 8ªs paralelas o consecutivas.</li><li>Preferir movimiento contrario u oblicuo.</li></ul>`
      },
      {
        id: 'sb-cp-1',
        type: 'stave',
        data: {
          id: 'stave-cp-ex',
          title: 'Ejercicio 1: Cantus Firmus e Historial de Consonancias',
          description: 'Línea de Cantus Firmus en Do Mayor',
          isCollapsed: false,
          clef: 'treble',
          keySignature: 'C',
          timeSignature: '4/4',
          exerciseType: 'counterpoint',
          displayRange: { mode: 'all' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          measures: [
            { id: 'cm1', measureNumber: 1, notes: [{ id: 'cn1', keys: ['c/4'], duration: 'w', isRest: false }], harmonicAnalysis: { measureNumber: 1, romanNumeral: '8va', comments: 'Unísono de inicio' } },
            { id: 'cm2', measureNumber: 2, notes: [{ id: 'cn2', keys: ['d/4'], duration: 'w', isRest: false }], harmonicAnalysis: { measureNumber: 2, romanNumeral: '3ra', comments: 'Movimiento contrario' } },
            { id: 'cm3', measureNumber: 3, notes: [{ id: 'cn3', keys: ['e/4'], duration: 'w', isRest: false }], harmonicAnalysis: { measureNumber: 3, romanNumeral: '6ta', comments: 'Consonancia imperfecta' } },
            { id: 'cm4', measureNumber: 4, notes: [{ id: 'cn4', keys: ['c/4'], duration: 'w', isRest: false }], harmonicAnalysis: { measureNumber: 4, romanNumeral: '8va', comments: 'Cadencia final' } }
          ]
        }
      }
    ]
  },
  {
    id: 'page-solfeo-1',
    notebookId: 'nb-solfeo',
    title: 'Patrones Rítmicos en Métrica Compuesta 6/8',
    category: 'Solfeo',
    tags: ['6/8', 'Métrica Compuesta', 'Ritmo'],
    createdAt: Date.now() - 2000,
    updatedAt: Date.now() - 2000,
    blocks: [
      {
        id: 'tb-sol-1',
        type: 'text',
        content: `<p>En la métrica 6/8 hay 2 pulsos principales por compás, donde cada pulso equivale a 1 negra con puntillo (3 corcheas).</p>`
      }
    ]
  }
];

export function getStoredNotebooks(): Notebook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);
    if (!raw) {
      saveNotebooks(INITIAL_NOTEBOOKS);
      return INITIAL_NOTEBOOKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar cuadernos:', e);
    return INITIAL_NOTEBOOKS;
  }
}

export function saveNotebooks(notebooks: Notebook[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(notebooks));
  } catch (e) {
    console.error('Error al guardar cuadernos:', e);
  }
}

export function getStoredPages(): NotePage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAGES);
    if (!raw) {
      savePages(INITIAL_PAGES);
      return INITIAL_PAGES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar páginas:', e);
    return INITIAL_PAGES;
  }
}

export function savePages(pages: NotePage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(pages));
  } catch (e) {
    console.error('Error al guardar páginas:', e);
  }
}
