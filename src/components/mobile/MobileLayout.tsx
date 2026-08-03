import React, { useState } from 'react';
import { 
  BookOpen, Music, Volume2, Settings, Plus, Search, Star, 
  ChevronUp, Camera, Play, Square, Sliders, Menu, X, Trash2
} from 'lucide-react';
import { Notebook, NotePage, StaveBlock, ContentBlock } from '../../types/music';
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
}

export const MobileLayout: React.FC<Props> = ({
  notebooks,
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onUpdatePage,
  onDeletePage
}) => {
  const [activeTab, setActiveTab] = useState<'notebooks' | 'notes' | 'audio' | 'settings'>('notes');
  const [showDrawer, setShowDrawer] = useState(false);
  const [bpm, setBpm] = useState(100);

  const activePage = pages.find(p => p.id === activePageId) || pages[0];

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    audioSynth.bpm = newBpm;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header Móvil */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200"
          >
            {showDrawer ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div>
            <h1 className="font-extrabold text-sm text-white leading-tight">Music Notes</h1>
            <p className="text-[10px] text-cyan-400 truncate max-w-[150px]">{activePage?.title || 'Mis Apuntes'}</p>
          </div>
        </div>

        <button
          onClick={() => onCreatePage()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-medium text-xs shadow-md shadow-cyan-600/30"
        >
          <Plus size={14} />
          <span>Nota</span>
        </button>
      </div>

      {/* Drawer Lateral Móvil */}
      {showDrawer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex">
          <div className="w-4/5 max-w-xs bg-slate-900 h-full p-4 flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">Lista de Notas</span>
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
                    p.id === activePage?.id ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800' : 'bg-slate-950/60 text-slate-300'
                  }`}
                >
                  <span className="text-xs truncate">{p.title}</span>
                  {p.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400" />}
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
            <h2 className="font-bold text-base text-white">Tus Cuadernos Musicales</h2>
            {notebooks.map(nb => (
              <div key={nb.id} className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{nb.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm text-white">{nb.name}</h3>
                    <p className="text-xs text-slate-400">{nb.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="p-4 space-y-4">
            <h2 className="font-bold text-base text-white">Configuración del Sintetizador Móvil</h2>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300">Tempo de Audio:</span>
                <span className="text-cyan-400">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min={40}
                max={220}
                value={bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navegación Inferior Táctil (Bottom Navigation Bar) */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around z-40">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'notes' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Music size={18} />
          <span>Apuntes</span>
        </button>

        <button
          onClick={() => setActiveTab('notebooks')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'notebooks' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen size={18} />
          <span>Cuadernos</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'audio' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Volume2 size={18} />
          <span>Sintetizador</span>
        </button>
      </div>
    </div>
  );
};
