import React, { useEffect, useMemo, useState } from 'react';
import type { Notebook } from './types/notes';
import { StoreProvider, useStore } from './store';
import { UIContext, type UIActions } from './ui';
import { hasSeenTutorial, setTutorialSeen } from './services/storage';
import { Sidebar } from './components/shell/Sidebar';
import { Library } from './components/library/Library';
import { NotebookView } from './components/library/NotebookView';
import { PageView } from './components/page/PageView';
import { TemplatePicker } from './components/modals/TemplatePicker';
import { NotebookDialog } from './components/modals/NotebookDialog';
import { SettingsModal } from './components/modals/SettingsModal';
import { MethodGuide } from './components/modals/MethodGuide';
import { WelcomeTutorialModal } from './components/onboarding/WelcomeTutorialModal';
import { AuthModal } from './components/auth/AuthModal';
import { Toasts } from './components/ui/primitives';

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setDesktop(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return desktop;
}

function useTheme(theme: 'system' | 'light' | 'dark') {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

type ModalState =
  | { kind: 'template'; notebookId?: string; section?: string }
  | { kind: 'notebook'; notebook?: Notebook }
  | { kind: 'settings' }
  | { kind: 'guide' }
  | { kind: 'auth' }
  | { kind: 'welcome' }
  | null;

function Shell() {
  const { view, pages, notebooks, settings, user, setView } = useStore();
  const desktop = useIsDesktop();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(() => (hasSeenTutorial() ? null : { kind: 'welcome' }));
  useTheme(settings.theme);

  const ui: UIActions = useMemo(
    () => ({
      openTemplatePicker: (opts) => setModal({ kind: 'template', ...opts }),
      openNotebookDialog: (notebook) => setModal({ kind: 'notebook', notebook }),
      openSettings: () => setModal({ kind: 'settings' }),
      openGuide: () => setModal({ kind: 'guide' }),
      openAuth: () => setModal({ kind: 'auth' }),
      openWelcome: () => setModal({ kind: 'welcome' }),
      closeSidebar: () => setSidebarOpen(false),
    }),
    [],
  );

  // Ctrl+K: buscar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!desktop) setSidebarOpen(true);
        setTimeout(() => document.getElementById('global-search')?.focus(), 30);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [desktop]);

  // Al buscar se muestra la biblioteca con resultados.
  useEffect(() => {
    if (query.trim() && view.name !== 'library') setView({ name: 'library' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  useEffect(() => {
    if (view.name !== 'library') setQuery('');
  }, [view]);

  const openSidebar = () => setSidebarOpen(true);

  let main: React.ReactNode;
  if (view.name === 'page') {
    const page = pages.find((p) => p.id === view.pageId);
    main = page ? <PageView page={page} startInReview={view.review} onOpenSidebar={openSidebar} /> : <Library query={query} onOpenSidebar={openSidebar} />;
  } else if (view.name === 'notebook') {
    const nb = notebooks.find((n) => n.id === view.notebookId);
    main = nb ? <NotebookView notebook={nb} onOpenSidebar={openSidebar} /> : <Library query={query} onOpenSidebar={openSidebar} />;
  } else {
    main = <Library query={query} onOpenSidebar={openSidebar} />;
  }

  return (
    <UIContext.Provider value={ui}>
      <div className="print-root flex h-[100dvh] w-full overflow-hidden bg-desk text-ink">
        {desktop ? (
          <div className="no-print h-full w-[280px] shrink-0 border-r border-line">
            <Sidebar query={query} setQuery={setQuery} mobile={false} />
          </div>
        ) : (
          sidebarOpen && (
            <div className="no-print fixed inset-0 z-50 flex animate-fade bg-black/35" onPointerDown={(e) => e.target === e.currentTarget && setSidebarOpen(false)}>
              <div className="h-full w-[86%] max-w-[320px] shadow-pop">
                <Sidebar query={query} setQuery={setQuery} mobile />
              </div>
            </div>
          )
        )}
        <main className="print-root relative h-full min-w-0 flex-1">{main}</main>
      </div>

      <TemplatePicker open={modal?.kind === 'template'} onClose={() => setModal(null)} notebookId={modal?.kind === 'template' ? modal.notebookId : undefined} section={modal?.kind === 'template' ? modal.section : undefined} />
      <NotebookDialog open={modal?.kind === 'notebook'} notebook={modal?.kind === 'notebook' ? modal.notebook : undefined} onClose={() => setModal(null)} />
      <SettingsModal open={modal?.kind === 'settings'} onClose={() => setModal(null)} />
      <MethodGuide open={modal?.kind === 'guide'} onClose={() => setModal(null)} />
      <AuthModal isOpen={modal?.kind === 'auth'} onClose={() => setModal(null)} currentUser={user} />
      <WelcomeTutorialModal
        isOpen={modal?.kind === 'welcome'}
        onClose={() => {
          setTutorialSeen(true);
          setModal(null);
        }}
      />
      <Toasts />
    </UIContext.Provider>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

export default App;
