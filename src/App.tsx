import React, { useState, useEffect } from 'react';
import type { Notebook, NotePage } from './types/music';
import { getStoredNotebooks, saveNotebooks, getStoredPages, savePages, hasSeenTutorial, setTutorialSeen } from './services/storage';
import { 
  initAuth, syncCloudNotebooks, syncCloudPages, 
  saveCloudPage, saveCloudNotebook, deleteCloudPage 
} from './services/firebase';
import { DesktopLayout } from './components/desktop/DesktopLayout';
import { MobileLayout } from './components/mobile/MobileLayout';
import { WelcomeTutorialModal } from './components/onboarding/WelcomeTutorialModal';
import { Monitor, Smartphone, HelpCircle, CloudCheck, Cloud } from 'lucide-react';
import type { User } from 'firebase/auth';

export function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => getStoredNotebooks());
  const [pages, setPages] = useState<NotePage[]>(() => getStoredPages());
  const [activePageId, setActivePageId] = useState<string | null>(() => pages[0]?.id || null);

  // Estado del usuario en la Nube (Firebase)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Tutorial animado
  const [showTutorial, setShowTutorial] = useState<boolean>(() => !hasSeenTutorial());

  // Detección de dispositivo (Móvil vs Escritorio)
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768);
  const [forceViewMode, setForceViewMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inicializar Firebase Auth & Firestore Sync
  useEffect(() => {
    const unsubscribeAuth = initAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSynced(true);
        // Suscribirse a cambios en Firestore
        const unsubNB = syncCloudNotebooks(user.uid, (cloudNotebooks) => {
          if (cloudNotebooks.length > 0) {
            setNotebooks(cloudNotebooks);
          }
        });

        const unsubPages = syncCloudPages(user.uid, (cloudPages) => {
          if (cloudPages.length > 0) {
            setPages(cloudPages);
            if (!activePageId) setActivePageId(cloudPages[0]?.id || null);
          }
        });

        return () => {
          unsubNB();
          unsubPages();
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Persistir cuadernos localmente
  useEffect(() => {
    saveNotebooks(notebooks);
  }, [notebooks]);

  // Persistir páginas localmente
  useEffect(() => {
    savePages(pages);
  }, [pages]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setTutorialSeen(true);
  };

  // Crear nueva nota musical
  const handleCreatePage = (notebookId?: string) => {
    const targetNotebookId = notebookId || notebooks[0]?.id || 'nb-armonia';
    const newPage: NotePage = {
      id: `page-${Date.now()}`,
      notebookId: targetNotebookId,
      title: 'Nueva Nota Musical',
      category: 'Armonía',
      tags: ['Apunte'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blocks: [
        {
          id: `tb-${Date.now()}`,
          type: 'text',
          content: '<p>Empieza a escribir tus observaciones musicales o añade un pentagrama...</p>'
        }
      ]
    };

    setPages(prev => [newPage, ...prev]);
    setActivePageId(newPage.id);

    // Sincronizar en la Nube
    if (currentUser) {
      saveCloudPage(currentUser.uid, newPage);
    }
  };

  // Crear nuevo cuaderno
  const handleCreateNotebook = (name: string, description: string) => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      name,
      description,
      color: 'from-amber-600 to-yellow-500',
      icon: '🎼',
      pageIds: [],
      createdAt: Date.now()
    };
    setNotebooks(prev => [...prev, newNb]);

    if (currentUser) {
      saveCloudNotebook(currentUser.uid, newNb);
    }
  };

  // Actualizar página
  const handleUpdatePage = (updatedPage: NotePage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));

    if (currentUser) {
      saveCloudPage(currentUser.uid, updatedPage);
    }
  };

  // Eliminar página
  const handleDeletePage = (id: string) => {
    const remaining = pages.filter(p => p.id !== id);
    setPages(remaining);
    if (activePageId === id) {
      setActivePageId(remaining[0]?.id || null);
    }

    if (currentUser) {
      deleteCloudPage(currentUser.uid, id);
    }
  };

  // Exportar todas las notas en JSON
  const handleExportAllData = () => {
    const data = {
      notebooks,
      pages,
      version: '1.0',
      exportDate: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `music-notes-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importar JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.notebooks && parsed.pages) {
          setNotebooks(parsed.notebooks);
          setPages(parsed.pages);
          if (parsed.pages.length > 0) {
            setActivePageId(parsed.pages[0].id);
          }
          alert('¡Copia de seguridad importada con éxito!');
        }
      } catch (err) {
        alert('El archivo no es un JSON válido de Music Notes');
      }
    };
    reader.readAsText(file);
  };

  const activeMode = forceViewMode === 'auto' ? (isMobile ? 'mobile' : 'desktop') : forceViewMode;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Indicator de sincronización con la Nube (Firebase) & Header de testing */}
      <div className="fixed top-2 right-4 z-40 flex items-center gap-1.5 bg-[#fdfbf7] border border-amber-200 p-1 rounded-full shadow-lg text-[11px]">
        <div 
          className="px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-amber-900 bg-amber-100 border border-amber-200 text-[10px]"
          title="Sincronización en tiempo real activa con Firebase Firestore"
        >
          <CloudCheck size={12} className="text-amber-700" />
          <span className="hidden md:inline">Firebase Conectado</span>
        </div>

        <button
          onClick={() => setForceViewMode('desktop')}
          className={`px-2 py-1 rounded-full flex items-center gap-1 font-bold transition-colors ${
            activeMode === 'desktop' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Vista Web Desktop"
        >
          <Monitor size={12} />
          <span className="hidden sm:inline">Modo Web</span>
        </button>

        <button
          onClick={() => setForceViewMode('mobile')}
          className={`px-2 py-1 rounded-full flex items-center gap-1 font-bold transition-colors ${
            activeMode === 'mobile' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Vista Mobile Dedicated"
        >
          <Smartphone size={12} />
          <span className="hidden sm:inline">Modo Mobile</span>
        </button>

        <button
          onClick={() => setShowTutorial(true)}
          className="px-2 py-1 rounded-full text-amber-900 font-bold hover:bg-amber-100 transition-colors"
          title="Ver Guía / Tutorial"
        >
          <HelpCircle size={13} />
        </button>
      </div>

      {/* Tutorial Animado Modal */}
      <WelcomeTutorialModal
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
      />

      {activeMode === 'mobile' ? (
        <MobileLayout
          notebooks={notebooks}
          pages={pages}
          activePageId={activePageId}
          onSelectPage={(id) => setActivePageId(id)}
          onCreatePage={handleCreatePage}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
          onOpenTutorial={() => setShowTutorial(true)}
        />
      ) : (
        <DesktopLayout
          notebooks={notebooks}
          pages={pages}
          activePageId={activePageId}
          onSelectPage={(id) => setActivePageId(id)}
          onCreatePage={handleCreatePage}
          onCreateNotebook={handleCreateNotebook}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
          onExportAllData={handleExportAllData}
          onImportData={handleImportData}
          onOpenTutorial={() => setShowTutorial(true)}
        />
      )}
    </div>
  );
}
export default App;
