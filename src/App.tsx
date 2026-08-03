import React, { useState, useEffect } from 'react';
import type { Notebook, NotePage } from './types/music';
import { getStoredNotebooks, saveNotebooks, getStoredPages, savePages } from './services/storage';
import { DesktopLayout } from './components/desktop/DesktopLayout';
import { MobileLayout } from './components/mobile/MobileLayout';
import { Monitor, Smartphone } from 'lucide-react';

export function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => getStoredNotebooks());
  const [pages, setPages] = useState<NotePage[]>(() => getStoredPages());
  const [activePageId, setActivePageId] = useState<string | null>(() => pages[0]?.id || null);

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

  // Persistir cuadernos
  useEffect(() => {
    saveNotebooks(notebooks);
  }, [notebooks]);

  // Persistir páginas
  useEffect(() => {
    savePages(pages);
  }, [pages]);

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
  };

  // Crear nuevo cuaderno
  const handleCreateNotebook = (name: string, description: string) => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      name,
      description,
      color: 'from-cyan-600 to-blue-500',
      icon: '🎼',
      pageIds: [],
      createdAt: Date.now()
    };
    setNotebooks(prev => [...prev, newNb]);
  };

  // Actualizar página
  const handleUpdatePage = (updatedPage: NotePage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
  };

  // Eliminar página
  const handleDeletePage = (id: string) => {
    const remaining = pages.filter(p => p.id !== id);
    setPages(remaining);
    if (activePageId === id) {
      setActivePageId(remaining[0]?.id || null);
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
      {/* Botón de cambio rápido de modo Web vs Mobile (Header de testing) */}
      <div className="fixed top-2 right-4 z-50 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-full shadow-lg backdrop-blur-md text-[11px]">
        <button
          onClick={() => setForceViewMode('desktop')}
          className={`px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
            activeMode === 'desktop' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Vista Web Desktop"
        >
          <Monitor size={12} />
          <span className="hidden sm:inline">Modo Web</span>
        </button>

        <button
          onClick={() => setForceViewMode('mobile')}
          className={`px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
            activeMode === 'mobile' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Vista Mobile Dedicated"
        >
          <Smartphone size={12} />
          <span className="hidden sm:inline">Modo Mobile</span>
        </button>
      </div>

      {activeMode === 'mobile' ? (
        <MobileLayout
          notebooks={notebooks}
          pages={pages}
          activePageId={activePageId}
          onSelectPage={(id) => setActivePageId(id)}
          onCreatePage={handleCreatePage}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
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
        />
      )}
    </div>
  );
}
export default App;
