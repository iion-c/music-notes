import type { AppSettings, Notebook, NotePage } from '../types/notes';
import { DEFAULT_PAPER, DEFAULT_SETTINGS } from '../lib/paper';

const STORAGE_KEY_NOTEBOOKS = 'music_notes_notebooks_v2';
const STORAGE_KEY_PAGES = 'music_notes_pages_v2';
const STORAGE_KEY_TUTORIAL_SEEN = 'music_notes_tutorial_seen_v1';
const STORAGE_KEY_SETTINGS = 'music_notes_settings_v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Devuelve false si el navegador rechazó el guardado (p. ej. cuota llena por imágenes). */
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`No se pudo guardar ${key}:`, e);
    return false;
  }
}

export const getStoredNotebooks = () => read<Notebook[]>(STORAGE_KEY_NOTEBOOKS, []);
export const saveNotebooks = (notebooks: Notebook[]) => write(STORAGE_KEY_NOTEBOOKS, notebooks);
export const getStoredPages = () => read<NotePage[]>(STORAGE_KEY_PAGES, []);
export const savePages = (pages: NotePage[]) => write(STORAGE_KEY_PAGES, pages);

export const hasSeenTutorial = () => read<boolean | string>(STORAGE_KEY_TUTORIAL_SEEN, false) === true;
export const setTutorialSeen = (seen = true) => write(STORAGE_KEY_TUTORIAL_SEEN, seen);

export function getStoredSettings(): AppSettings {
  const s = read<Partial<AppSettings>>(STORAGE_KEY_SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...s, paper: { ...DEFAULT_PAPER, ...(s.paper || {}) } };
}
export const saveSettings = (settings: AppSettings) => write(STORAGE_KEY_SETTINGS, settings);
