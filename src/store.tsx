import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { AppSettings, Notebook, NotePage } from './types/notes';
import {
  getStoredNotebooks,
  getStoredPages,
  getStoredSettings,
  saveNotebooks,
  savePages,
  saveSettings,
} from './services/storage';
import {
  deleteCloudNotebook,
  deleteCloudPage,
  initAuth,
  saveCloudNotebook,
  saveCloudPage,
  syncCloudNotebooks,
  syncCloudPages,
} from './services/firebase';
import { audioSynth } from './services/audioSynth';
import { createNotebook as makeNotebook, createPageFromTemplate, normalizeNotebook, normalizePage } from './lib/pageModel';
import { uid } from './lib/uid';

export type View = { name: 'library' } | { name: 'notebook'; notebookId: string } | { name: 'page'; pageId: string; review?: boolean };

interface Toast {
  id: number;
  message: string;
  tone?: 'info' | 'error';
}

interface Store {
  user: User | null;
  authReady: boolean;
  notebooks: Notebook[];
  pages: NotePage[];
  settings: AppSettings;
  view: View;
  toasts: Toast[];
  setView: (v: View) => void;
  openPage: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  createNotebook: (data: Partial<Notebook> & { name: string }) => Notebook;
  updateNotebook: (id: string, patch: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;
  createPage: (templateId: string, notebookId?: string, section?: string) => NotePage;
  updatePage: (id: string, fn: (p: NotePage) => NotePage) => void;
  deletePage: (id: string) => void;
  duplicatePage: (id: string) => void;
  importData: (data: { notebooks: Notebook[]; pages: NotePage[] }) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fuera de <StoreProvider>');
  return ctx;
}

const SAVE_DELAY = 700;
const VIEW_KEY = 'music_notes_last_view_v1';

/** Fusiona la foto de la nube con el estado local sin pisar ediciones más recientes. */
function mergeByUpdatedAt<T extends { id: string; updatedAt?: number; createdAt?: number }>(
  local: T[],
  cloud: T[],
  pending: Set<string>,
  deleted: Set<string>,
): T[] {
  const localById = new Map(local.map((x) => [x.id, x]));
  const merged = cloud
    .filter((c) => !deleted.has(c.id))
    .map((c) => {
      const l = localById.get(c.id);
      if (!l) return c;
      const lt = l.updatedAt ?? l.createdAt ?? 0;
      const ct = c.updatedAt ?? c.createdAt ?? 0;
      return lt > ct || pending.has(c.id) ? l : c;
    });
  const cloudIds = new Set(cloud.map((c) => c.id));
  for (const l of local) if (!cloudIds.has(l.id) && pending.has(l.id)) merged.push(l);
  return merged;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [pages, setPages] = useState<NotePage[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [view, setView] = useState<View>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null') as View | null;
      return v && v.name ? { ...v, review: undefined } as View : { name: 'library' };
    } catch {
      return { name: 'library' };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(view));
    } catch {
      /* sin almacenamiento */
    }
  }, [view]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const userRef = useRef<User | null>(null);
  const pagesRef = useRef<NotePage[]>([]);
  const notebooksRef = useRef<Notebook[]>([]);
  pagesRef.current = pages;
  notebooksRef.current = notebooks;

  const timers = useRef(new Map<string, number>());
  const pending = useRef(new Set<string>());
  const deleted = useRef(new Set<string>());
  const storageWarned = useRef(false);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  /* ── Autenticación y sincronización ─────────────────────── */
  useEffect(() => {
    let unsubNB: (() => void) | null = null;
    let unsubPages: (() => void) | null = null;
    let firstAuth = true;
    const unsubAuth = initAuth((u) => {
      const wasFirst = firstAuth;
      firstAuth = false;
      unsubNB?.();
      unsubPages?.();
      unsubNB = unsubPages = null;
      userRef.current = u;
      setUser(u);
      setAuthReady(true);
      pending.current.clear();
      deleted.current.clear();
      if (u) {
        // Aislamiento por cuenta: nunca mezclar datos de otro usuario.
        setNotebooks([]);
        setPages([]);
        if (!wasFirst) setView({ name: 'library' });
        unsubNB = syncCloudNotebooks(u.uid, (cloud) =>
          setNotebooks((local) => mergeByUpdatedAt(local, cloud, pending.current, deleted.current).map(normalizeNotebook)),
        );
        unsubPages = syncCloudPages(u.uid, (cloud) =>
          setPages((local) => mergeByUpdatedAt(local, cloud.map(normalizePage), pending.current, deleted.current)),
        );
      } else {
        setNotebooks(getStoredNotebooks().map(normalizeNotebook));
        setPages(getStoredPages().map(normalizePage));
      }
    });
    return () => {
      unsubAuth();
      unsubNB?.();
      unsubPages?.();
    };
  }, []);

  // Respaldo local para invitados sin sesión.
  useEffect(() => {
    if (!authReady || user) return;
    const ok = savePages(pages) && saveNotebooks(notebooks);
    if (!ok && !storageWarned.current) {
      storageWarned.current = true;
      toast('El almacenamiento del navegador está lleno. Inicia sesión para guardar en la nube o reduce imágenes.', 'error');
    }
  }, [pages, notebooks, user, authReady, toast]);

  useEffect(() => {
    saveSettings(settings);
    audioSynth.bpm = settings.bpm;
    audioSynth.instrument = settings.instrument;
  }, [settings]);

  const scheduleCloud = useCallback((kind: 'page' | 'notebook', id: string, immediate = false) => {
    const u = userRef.current;
    if (!u) return;
    const key = `${kind}:${id}`;
    pending.current.add(id);
    const prev = timers.current.get(key);
    if (prev) clearTimeout(prev);
    const run = () => {
      timers.current.delete(key);
      const item =
        kind === 'page' ? pagesRef.current.find((p) => p.id === id) : notebooksRef.current.find((n) => n.id === id);
      const done = () => {
        if (![...timers.current.keys()].some((k) => k.endsWith(`:${id}`))) pending.current.delete(id);
      };
      if (!item) return done();
      const save = kind === 'page' ? saveCloudPage(u.uid, item as NotePage) : saveCloudNotebook(u.uid, item as Notebook);
      void save.finally(done);
    };
    if (immediate) run();
    else timers.current.set(key, window.setTimeout(run, SAVE_DELAY));
  }, []);

  // Guardar cambios pendientes antes de cerrar la pestaña.
  useEffect(() => {
    const flush = () => {
      const u = userRef.current;
      if (!u) return;
      for (const [key, t] of timers.current) {
        clearTimeout(t);
        const [kind, id] = key.split(':');
        if (kind === 'page') {
          const p = pagesRef.current.find((x) => x.id === id);
          if (p) void saveCloudPage(u.uid, p);
        } else {
          const n = notebooksRef.current.find((x) => x.id === id);
          if (n) void saveCloudNotebook(u.uid, n);
        }
      }
      timers.current.clear();
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  /* ── Acciones ───────────────────────────────────────────── */
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...patch, paper: { ...s.paper, ...(patch.paper || {}) } }));
  }, []);

  const createNotebook = useCallback(
    (data: Partial<Notebook> & { name: string }) => {
      const nb = makeNotebook(data);
      setNotebooks((list) => [...list, nb]);
      notebooksRef.current = [...notebooksRef.current, nb];
      scheduleCloud('notebook', nb.id, true);
      return nb;
    },
    [scheduleCloud],
  );

  const updateNotebook = useCallback(
    (id: string, patch: Partial<Notebook>) => {
      setNotebooks((list) => {
        const next = list.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
        notebooksRef.current = next;
        return next;
      });
      scheduleCloud('notebook', id);
    },
    [scheduleCloud],
  );

  const deletePage = useCallback((id: string) => {
    deleted.current.add(id);
    setPages((list) => list.filter((p) => p.id !== id));
    setView((v) => (v.name === 'page' && v.pageId === id ? { name: 'library' } : v));
    const u = userRef.current;
    if (u) void deleteCloudPage(u.uid, id);
  }, []);

  const deleteNotebook = useCallback(
    (id: string) => {
      const toRemove = pagesRef.current.filter((p) => p.notebookId === id).map((p) => p.id);
      toRemove.forEach(deletePage);
      deleted.current.add(id);
      setNotebooks((list) => list.filter((n) => n.id !== id));
      setView({ name: 'library' });
      const u = userRef.current;
      if (u) void deleteCloudNotebook(u.uid, id);
    },
    [deletePage],
  );

  const createPage = useCallback(
    (templateId: string, notebookId?: string, section?: string) => {
      let nbId = notebookId || notebooksRef.current[0]?.id;
      if (!nbId || !notebooksRef.current.some((n) => n.id === nbId)) {
        nbId = createNotebook({ name: 'General', icon: '📓' }).id;
      }
      const page = createPageFromTemplate(templateId, nbId, { section });
      setPages((list) => [page, ...list]);
      pagesRef.current = [page, ...pagesRef.current];
      scheduleCloud('page', page.id, true);
      setView({ name: 'page', pageId: page.id });
      return page;
    },
    [createNotebook, scheduleCloud],
  );

  const updatePage = useCallback(
    (id: string, fn: (p: NotePage) => NotePage) => {
      setPages((list) => {
        const next = list.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p));
        pagesRef.current = next;
        return next;
      });
      scheduleCloud('page', id);
    },
    [scheduleCloud],
  );

  const duplicatePage = useCallback(
    (id: string) => {
      const src = pagesRef.current.find((p) => p.id === id);
      if (!src) return;
      const now = Date.now();
      const copy: NotePage = {
        ...structuredClone(src),
        id: uid('page'),
        title: src.title ? `${src.title} (copia)` : '',
        createdAt: now,
        updatedAt: now,
      };
      setPages((list) => [copy, ...list]);
      pagesRef.current = [copy, ...pagesRef.current];
      scheduleCloud('page', copy.id, true);
      setView({ name: 'page', pageId: copy.id });
    },
    [scheduleCloud],
  );

  const importData = useCallback(
    (data: { notebooks: Notebook[]; pages: NotePage[] }) => {
      const nbs = data.notebooks.map(normalizeNotebook);
      const pgs = data.pages.map(normalizePage);
      setNotebooks((list) => [...list.filter((n) => !nbs.some((x) => x.id === n.id)), ...nbs]);
      setPages((list) => [...list.filter((p) => !pgs.some((x) => x.id === p.id)), ...pgs]);
      notebooksRef.current = [...notebooksRef.current.filter((n) => !nbs.some((x) => x.id === n.id)), ...nbs];
      pagesRef.current = [...pagesRef.current.filter((p) => !pgs.some((x) => x.id === p.id)), ...pgs];
      nbs.forEach((n) => scheduleCloud('notebook', n.id, true));
      pgs.forEach((p) => scheduleCloud('page', p.id, true));
      toast(`Importadas ${pgs.length} hojas y ${nbs.length} cuadernos`);
    },
    [scheduleCloud, toast],
  );

  const openPage = useCallback((id: string) => setView({ name: 'page', pageId: id }), []);

  const value = useMemo<Store>(
    () => ({
      user,
      authReady,
      notebooks,
      pages,
      settings,
      view,
      toasts,
      setView,
      openPage,
      updateSettings,
      createNotebook,
      updateNotebook,
      deleteNotebook,
      createPage,
      updatePage,
      deletePage,
      duplicatePage,
      importData,
      toast,
    }),
    [user, authReady, notebooks, pages, settings, view, toasts, openPage, updateSettings, createNotebook, updateNotebook, deleteNotebook, createPage, updatePage, deletePage, duplicatePage, importData, toast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
