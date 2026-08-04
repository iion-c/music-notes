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
import { AuthModal } from './components/auth/AuthModal';
import { HelpCircle, User as UserIcon } from 'lucide-react';
import type { User } from 'firebase/auth';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Cuadernos y Páginas Aislamiento por Cuenta
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [pages, setPages] = useState<NotePage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  // Tutorial animado
  const [showTutorial, setShowTutorial] = useState<boolean>(() => !hasSeenTutorial());

  // Detección automática de dispositivo (Móvil/Android vs Escritorio)
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inicializar Firebase Auth & Firestore Sync con Aislamiento Estricto por Usuario
  useEffect(() => {
    let unsubNB: (() => void) | null = null;
    let unsubPages: (() => void) | null = null;

    const unsubscribeAuth = initAuth((user) => {
      setCurrentUser(user);

      if (user) {
        // Limpiar datos del usuario anterior al cambiar de cuenta
        setNotebooks([]);
        setPages([]);
        setActivePageId(null);

        // Suscribirse A SUS PROPIOS cuadernos en Firestore
        unsubNB = syncCloudNotebooks(user.uid, (cloudNotebooks) => {
          setNotebooks(cloudNotebooks);
        });

        // Suscribirse A SUS PROPIAS páginas en Firestore
        unsubPages = syncCloudPages(user.uid, (cloudPages) => {
          setPages(cloudPages);
          if (cloudPages.length > 0 && !activePageId) {
            setActivePageId(cloudPages[0].id);
          }
        });
      } else {
        // Cargar almacenamiento local de invitado si no hay sesión
        const localNBs = getStoredNotebooks();
        const localPgs = getStoredPages();
        setNotebooks(localNBs);
        setPages(localPgs);
        if (localPgs.length > 0) setActivePageId(localPgs[0].id);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubNB) unsubNB();
      if (unsubPages) unsubPages();
    };
  }, []);

  // Persistir cuadernos localmente como respaldo
  useEffect(() => {
    if (!currentUser) saveNotebooks(notebooks);
  }, [notebooks, currentUser]);

  // Persistir páginas localmente como respaldo
  useEffect(() => {
    if (!currentUser) savePages(pages);
  }, [pages, currentUser]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setTutorialSeen(true);
  };

  // Crear nueva nota musical exclusiva para la cuenta activa
  const handleCreatePage = (notebookId?: string) => {
    const targetNotebookId = notebookId || notebooks[0]?.id || `nb-${Date.now()}`;
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
          content: 'Empieza a escribir tus observaciones musicales o añade un pentagrama...'
        }
      ]
    };

    setPages(prev => [newPage, ...prev]);
    setActivePageId(newPage.id);

    if (currentUser) {
      saveCloudPage(currentUser.uid, newPage);
    }
  };

  // Crear nuevo cuaderno exclusivo para la cuenta activa
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f7f4eb]">
      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
      />

      {/* Tutorial Animado Modal */}
      <WelcomeTutorialModal
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
      />

      {isMobile ? (
        <MobileLayout
          notebooks={notebooks}
          pages={pages}
          activePageId={activePageId}
          currentUser={currentUser}
          onSelectPage={(id) => setActivePageId(id)}
          onCreatePage={handleCreatePage}
          onCreateNotebook={handleCreateNotebook}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
      ) : (
        <DesktopLayout
          notebooks={notebooks}
          pages={pages}
          activePageId={activePageId}
          currentUser={currentUser}
          onSelectPage={(id) => setActivePageId(id)}
          onCreatePage={handleCreatePage}
          onCreateNotebook={handleCreateNotebook}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
          onExportAllData={handleExportAllData}
          onImportData={handleImportData}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
      )}
    </div>
  );
}
export default App;
