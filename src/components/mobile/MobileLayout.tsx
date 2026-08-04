import React, { useState } from 'react';
import { 
  BookOpen, Music, Volume2, Plus, Star, Menu, X, HelpCircle, 
  User as UserIcon, FolderPlus, Download, Upload, Layers
} from 'lucide-react';
import type { Notebook, NotePage } from '../../types/music';
import { MusicNotebook } from '../editor/MusicNotebook';
import { audioSynth } from '../../services/audioSynth';
import type { User } from 'firebase/auth';

interface Props {
  notebooks: Notebook[];
  pages: NotePage[];
  activePageId: string | null;
  currentUser: User | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (notebookId?: string) => void;
  onCreateNotebook: (name: string, description: string) => void;
  onUpdatePage: (page: NotePage) => void;
  onDeletePage: (id: string) => void;
  onOpenTutorial: () => void;
  onOpenAuthModal: () => void;
}

export const MobileLayout: React.FC<Props> = ({
  notebooks,
  pages,
  activePageId,
  currentUser,
  onSelectPage,
  onCreatePage,
  onCreateNotebook,
  onUpdatePage,
  onDeletePage,
  onOpenTutorial,
  onOpenAuthModal
}) => {
  const [activeTab, setActiveTab] = useState<'notebooks' | 'notes' | 'audio'>('notes');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(() => notebooks[0]?.id || null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [bpm, setBpm] = useState(100);

  // Páginas pertenecientes al cuaderno seleccionado actualmente
  const activeNotebook = notebooks.find(n => n.id === selectedNotebookId) || notebooks[0];
  const notebookPages = pages.filter(p => p.notebookId === activeNotebook?.id || !p.notebookId);

  const activePage = pages.find(p => p.id === activePageId) || notebookPages[0] || pages[0];

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    audioSynth.bpm = newBpm;
  };

  const handleCreateNotebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    onCreateNotebook(newNotebookName.trim(), 'Cuaderno de apuntes musicales');
    setNewNotebookName('');
    setShowNewNotebookModal(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f7f4eb] text-slate-800 font-sans overflow-hidden">
      {/* Top Header Móvil (Limpio y Responsivo para Android) */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#f8f5ee] border-b border-amber-200/80 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowDrawer(true)}
            className="p-2 rounded-xl bg-amber-100/80 text-amber-900 font-bold shrink-0"
            title="Abrir menú de cuadernos"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">Music Notes</h1>
            <p className="text-[10px] text-amber-800 font-bold truncate max-w-[120px]">
              {activeNotebook ? activeNotebook.name : 'Mis Cuadernos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenAuthModal}
            className="px-2 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1"
            title="Cuenta / Iniciar Sesión"
          >
            <UserIcon size={14} />
            <span className="text-[10px] hidden sm:inline">{currentUser ? (currentUser.email?.split('@')[0] || 'Cuenta') : 'Entrar'}</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="p-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs"
            title="Ver Tutorial"
          >
            <HelpCircle size={15} />
          </button>

          <button
            onClick={() => {
              onCreatePage(activeNotebook?.id);
              setActiveTab('notes');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/20"
          >
            <Plus size={14} />
            <span>+ Hoja</span>
          </button>
        </div>
      </div>

      {/* Drawer Lateral de Cuadernos & Hojas en Android */}
      {showDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex">
          <div className="w-4/5 max-w-xs bg-[#fdfbf7] h-full p-4 flex flex-col space-y-4 overflow-y-auto border-r border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <BookOpen size={16} className="text-amber-600" />
                <span>Cuadernos & Hojas</span>
              </span>
              <button onClick={() => setShowDrawer(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <button
              onClick={() => {
                setShowDrawer(false);
                setShowNewNotebookModal(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <FolderPlus size={15} />
              <span>+ Nuevo Cuaderno</span>
            </button>

            {/* Lista de Cuadernos */}
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-amber-900 uppercase">Seleccionar Materia:</span>
              {notebooks.map(nb => (
                <button
                  key={nb.id}
                  onClick={() => {
                    setSelectedNotebookId(nb.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    nb.id === activeNotebook?.id ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300' : 'bg-amber-50/50 text-slate-700'
                  }`}
                >
                  <span className="text-lg">{nb.icon}</span>
                  <span className="text-xs flex-1 truncate">{nb.name}</span>
                </button>
              ))}
            </div>

            {/* Hojas del Cuaderno Activo */}
            <div className="space-y-1 pt-2 border-t border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-900 uppercase">Hojas de Apuntes:</span>
                <button
                  onClick={() => {
                    onCreatePage(activeNotebook?.id);
                    setShowDrawer(false);
                    setActiveTab('notes');
                  }}
                  className="text-amber-700 text-[11px] font-bold"
                >
                  + Nueva Hoja
                </button>
              </div>

              {notebookPages.length === 0 ? (
                <p className="text-slate-400 text-xs italic p-2">Este cuaderno no tiene hojas todavía.</p>
              ) : (
                notebookPages.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPage(p.id);
                      setShowDrawer(false);
                      setActiveTab('notes');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
                      p.id === activePage?.id ? 'bg-amber-600 text-white font-bold shadow-sm' : 'bg-white text-slate-800 border border-amber-200'
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    {p.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowDrawer(false)} />
        </div>
      )}

      {/* Selector Rápido de Cuadernos en vista móvil */}
      <div className="bg-[#f6f2e8] border-b border-amber-200/80 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {notebooks.map(nb => (
          <button
            key={nb.id}
            onClick={() => setSelectedNotebookId(nb.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
              nb.id === activeNotebook?.id ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-amber-200'
            }`}
          >
            <span>{nb.icon}</span>
            <span>{nb.name}</span>
          </button>
        ))}
        <button
          onClick={() => setShowNewNotebookModal(true)}
          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap"
        >
          + Cuaderno
        </button>
      </div>

      {/* Cuerpo Principal del Apunte Móvil */}
      <div className="flex-1 overflow-y-auto pb-16">
        {activeTab === 'notes' && activePage ? (
          <div className="px-2">
            <MusicNotebook
              page={activePage}
              onUpdatePage={onUpdatePage}
              onDeletePage={() => onDeletePage(activePage.id)}
            />
          </div>
        ) : activeTab === 'notes' ? (
          <div className="p-8 text-center space-y-3">
            <Layers size={40} className="mx-auto text-amber-600 opacity-60" />
            <h3 className="font-extrabold text-base text-slate-900">No hay hojas en este cuaderno</h3>
            <button
              onClick={() => onCreatePage(activeNotebook?.id)}
              className="px-4 py-2 rounded-2xl bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/20"
            >
              + Crear Primera Hoja
            </button>
          </div>
        ) : null}

        {activeTab === 'notebooks' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-slate-900">Tus Cuadernos de Materias</h2>
              <button
                onClick={() => setShowNewNotebookModal(true)}
                className="px-3 py-1.5 bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-sm"
              >
                + Crear Cuaderno
              </button>
            </div>

            {notebooks.map(nb => {
              const pagesCount = pages.filter(p => p.notebookId === nb.id).length;
              return (
                <div
                  key={nb.id}
                  onClick={() => {
                    setSelectedNotebookId(nb.id);
                    setActiveTab('notes');
                  }}
                  className="p-4 rounded-2xl bg-[#fdfbf7] border border-amber-200 shadow-sm cursor-pointer space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{nb.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-extrabold text-sm text-slate-900">{nb.name}</h3>
                      <p className="text-xs text-slate-600">{nb.description}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
                      {pagesCount} hojas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="p-4 space-y-4">
            <h2 className="font-extrabold text-base text-slate-900">Configuración del Sintetizador Móvil</h2>
            <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-amber-200 space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">Tempo de Audio:</span>
                <span className="text-amber-700 font-mono">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min={40}
                max={220}
                value={bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navegación Inferior Táctil Android */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-[#f8f5ee] border-t border-amber-200/80 flex items-center justify-around z-40">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors ${
            activeTab === 'notes' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <Music size={18} />
          <span>Hoja de Apuntes</span>
        </button>

        <button
          onClick={() => setActiveTab('notebooks')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors ${
            activeTab === 'notebooks' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <BookOpen size={18} />
          <span>Cuadernos</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors ${
            activeTab === 'audio' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <Volume2 size={18} />
          <span>Sintetizador</span>
        </button>
      </div>

      {/* Modal Crear Nuevo Cuaderno */}
      {showNewNotebookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#fdfbf7] border border-amber-200 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Crear Nuevo Cuaderno de Materia</h3>
            <form onSubmit={handleCreateNotebookSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Materia:</label>
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="Ej. Armonía I, Contrapunto, Solfeo"
                  className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewNotebookModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20"
                >
                  Crear Cuaderno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
