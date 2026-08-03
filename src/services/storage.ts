import type { Notebook, NotePage } from '../types/music';

const STORAGE_KEY_NOTEBOOKS = 'music_notes_notebooks_v2';
const STORAGE_KEY_PAGES = 'music_notes_pages_v2';
const STORAGE_KEY_TUTORIAL_SEEN = 'music_notes_tutorial_seen_v1';

export function getStoredNotebooks(): Notebook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar cuadernos:', e);
    return [];
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
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar páginas:', e);
    return [];
  }
}

export function savePages(pages: NotePage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(pages));
  } catch (e) {
    console.error('Error al guardar páginas:', e);
  }
}

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_TUTORIAL_SEEN) === 'true';
  } catch (e) {
    return false;
  }
}

export function setTutorialSeen(seen: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_KEY_TUTORIAL_SEEN, seen ? 'true' : 'false');
  } catch (e) {
    console.error('Error al guardar tutorial seen:', e);
  }
}
