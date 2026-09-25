import { createContext, useContext } from 'react';
import type { Notebook } from './types/notes';

export interface UIActions {
  openTemplatePicker: (opts?: { notebookId?: string; section?: string }) => void;
  openNotebookDialog: (notebook?: Notebook) => void;
  openSettings: () => void;
  openGuide: () => void;
  openAuth: () => void;
  openWelcome: () => void;
  closeSidebar: () => void;
}

export const UIContext = createContext<UIActions | null>(null);

export function useUI(): UIActions {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI fuera de <UIContext.Provider>');
  return ctx;
}
