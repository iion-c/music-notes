import React, { useState } from 'react';
import { 
  BookOpen, Music, Volume2, Plus, Star, Menu, X, HelpCircle
} from 'lucide-react';
import type { Notebook, NotePage } from '../../types/music';
import { MusicNotebook } from '../editor/MusicNotebook';
import { audioSynth } from '../../services/audioSynth';

interface Props {
  notebooks: Notebook[];
  pages: NotePage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (notebookId?: string) => void;
  onUpdatePage: (page: NotePage) => void;
  onDeletePage: (id: string) => void;
  onOpenTutorial: () => void;
}

export const MobileLayout: React.FC<Props> = ({
  notebooks,
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onOpenTutorial
}) => {
  const [activeTab, setActiveTab] = useState<'notebooks' | 'notes' | 'audio'>('notes');
  const [showDrawer, setShowDrawer] = useState(false);
  const [bpm, setBpm] = useState(100);

  const activePage = pages.find(p => p.id === activePageId) || pages[0];

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    audioSynth.bpm = newBpm;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f7f4eb] text-slate-800 font-sans overflow-hidden">
      {/* Top Header Móvil */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f8f5ee] border-b border-amber-200/80 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="p-2 rounded-xl bg-amber-100/80 text-amber-900 font-bold"
          >
            {showDrawer ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div>
            <h1 className="font-extrabold text-sm text-slate-900 leading-tight">Music Notes</h1>
            <p className="text-[10px] text-amber-800 font-semibold truncate max-w-[140px]">{activePage?.title || 'Mis Apuntes'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenTutorial}
            className="p-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs"
            title="Ver Tutorial"
          >
            <HelpCircle size={16} />
          </button>

          <button
            onClick={() => onCreatePage()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/20"
          >
            <Plus size={14} />
            <span>Nota</span>
          </button>
        </div>
      </div>

      {/* Drawer Lateral Móvil */}
      {showDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex">
          <div className="w-4/5 max-w-xs bg-[#fdfbf7] h-full p-4 flex flex-col space-y-4 overflow-y-auto border-r border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <span className="font-bold text-sm text-slate-900">Lista de Notas</span>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              {pages.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPage(p.id);
                    setShowDrawer(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between ${
                    p.id === activePage?.id ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' : 'bg-amber-50/50 text-slate-700'
                  }`}
                >
                  <span className="text-xs truncate">{p.title}</span>
                  {p.isFavorite && <Star size={12} className="text-amber-500 fill-amber-500" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowDrawer(false)} />
        </div>
      )}

      {/* Cuerpo Principal del Apunte */}
      <div className="flex-1 overflow-y-auto pb-16">
        {activeTab === 'notes' && activePage && (
          <div className="px-2">
            <MusicNotebook
              page={activePage}
              onUpdatePage={onUpdatePage}
              onDeletePage={() => onDeletePage(activePage.id)}
            />
          </div>
        )}

        {activeTab === 'notebooks' && (
          <div className="p-4 space-y-3">
            <h2 className="font-bold text-base text-slate-900">Tus Cuadernos Musicales</h2>
            {notebooks.map(nb => (
              <div key={nb.id} className="p-4 rounded-2xl bg-[#fdfbf7] border border-amber-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{nb.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{nb.name}</h3>
                    <p className="text-xs text-slate-600">{nb.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="p-4 space-y-4">
            <h2 className="font-bold text-base text-slate-900">Configuración del Sintetizador Móvil</h2>
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

      {/* Navegación Inferior Táctil */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-[#f8f5ee] border-t border-amber-200/80 flex items-center justify-around z-40">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
            activeTab === 'notes' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <Music size={18} />
          <span>Apuntes</span>
        </button>

        <button
          onClick={() => setActiveTab('notebooks')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
            activeTab === 'notebooks' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <BookOpen size={18} />
          <span>Cuadernos</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
            activeTab === 'audio' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <Volume2 size={18} />
          <span>Sintetizador</span>
        </button>
      </div>
    </div>
  );
};
