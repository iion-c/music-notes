import React, { useState } from 'react';
import { 
  BookOpen, Plus, Search, Star, Music, Settings, Download, Upload, 
  HelpCircle, Volume2, Sliders, ChevronRight, Hash, FolderPlus, Sparkles 
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
  onCreateNotebook: (name: string, description: string) => void;
  onUpdatePage: (page: NotePage) => void;
  onDeletePage: (id: string) => void;
  onExportAllData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenTutorial: () => void;
}

export const DesktopLayout: React.FC<Props> = ({
  notebooks,
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onCreateNotebook,
  onUpdatePage,
  onDeletePage,
  onExportAllData,
  onImportData,
  onOpenTutorial
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [newNotebookName, setNewNotebookName] = useState('');
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [bpm, setBpm] = useState(100);

  const activePage = pages.find(p => p.id === activePageId) || pages[0];

  const filteredPages = pages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    audioSynth.bpm = newBpm;
  };

  const handleCreateNotebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    onCreateNotebook(newNotebookName, 'Cuaderno de apuntes musicales');
    setNewNotebookName('');
    setShowNewNotebookModal(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f4eb] text-slate-800 font-sans">
      {/* Panel Izquierdo: Árbol de Cuadernos y Búsqueda */}
      <div className="w-80 border-r border-amber-200/80 bg-[#f6f2e8] flex flex-col h-full select-none shrink-0">
        {/* Logo App Header */}
        <div className="p-4 border-b border-amber-200/80 flex items-center justify-between bg-[#f8f5ee]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20 font-bold text-lg">
              🎼
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">Music Notes</h1>
              <p className="text-[11px] text-amber-800 font-bold">Cuaderno Académico</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenTutorial}
              className="p-1.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-bold transition-colors"
              title="Ver Guía / Tutorial Animado"
            >
              <HelpCircle size={16} />
            </button>

            <button
              onClick={() => onCreatePage()}
              className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-md shadow-amber-600/20"
              title="Nueva Nota Musical"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Buscador y Categorías */}
        <div className="p-3 border-b border-amber-200/80 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar notas, ejercicios o tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#fdfbf7] border border-amber-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1 no-scrollbar">
            {['Todas', 'Armonía', 'Contrapunto', 'Solfeo', 'Composición'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-amber-600 text-white font-bold' : 'bg-amber-100/60 text-slate-700 hover:bg-amber-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Notas y Cuadernos */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            <span>Cuadernos & Apuntes</span>
            <button 
              onClick={() => setShowNewNotebookModal(true)}
              className="text-amber-700 hover:text-amber-900 font-bold"
              title="Crear Nuevo Cuaderno"
            >
              + Cuaderno
            </button>
          </div>

          {filteredPages.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              No hay notas creadas aún. ¡Haz clic en + Nueva Nota o en el Tutorial!
            </div>
          ) : (
            filteredPages.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectPage(p.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-2.5 group ${
                  p.id === activePage?.id
                    ? 'bg-[#fdfbf7] border border-amber-300 text-slate-900 shadow-md shadow-amber-950/5'
                    : 'hover:bg-amber-100/60 text-slate-700'
                }`}
              >
                <div className="mt-0.5 text-amber-600">
                  <Music size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs truncate group-hover:text-amber-700">{p.title}</h4>
                    {p.isFavorite && <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-medium">{p.category}</span>
                    <span>•</span>
                    <span>{p.blocks.filter(b => b.type === 'stave').length} pentagramas</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer: Exportar / Importar */}
        <div className="p-3 border-t border-amber-200/80 flex items-center justify-between gap-2 text-xs bg-[#f8f5ee]">
          <button
            onClick={onExportAllData}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 transition-colors"
            title="Exportar copia JSON"
          >
            <Download size={13} />
            <span>Exportar</span>
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 transition-colors cursor-pointer">
            <Upload size={13} />
            <span>Importar</span>
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Area Central: Editor de Notas Musicales */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f4eb]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activePage ? (
            <MusicNotebook
              page={activePage}
              onUpdatePage={onUpdatePage}
              onDeletePage={() => onDeletePage(activePage.id)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Music size={48} className="mb-3 text-amber-600 opacity-60" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Tu Cuaderno Musical está listo</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">Crea tu primera nota de música o abre la guía animada para ver cómo funciona.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onCreatePage()}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/20"
                >
                  + Crear Primera Nota
                </button>
                <button
                  onClick={onOpenTutorial}
                  className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300"
                >
                  ❓ Ver Tutorial
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel Derecho: Asistente Armónico y Sintetizador */}
      <div className="w-72 border-l border-amber-200/80 bg-[#f6f2e8] flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-amber-200/80 flex items-center justify-between bg-[#f8f5ee]">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <Volume2 size={16} className="text-amber-600" />
            <span>Sintetizador & Audio</span>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-5 text-xs">
          {/* Controles de Tempo (BPM) */}
          <div className="bg-[#fdfbf7] p-3 rounded-2xl border border-amber-200 space-y-2 shadow-sm">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-600">Tempo de Audio:</span>
              <span className="text-amber-700 font-mono text-sm">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Lento (40)</span>
              <span>Moderato (100)</span>
              <span>Presto (220)</span>
            </div>
          </div>

          {/* Instrumento Presets */}
          <div className="bg-[#fdfbf7] p-3 rounded-2xl border border-amber-200 space-y-2 shadow-sm">
            <span className="block text-slate-700 font-bold mb-1">Instrumento:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'piano', name: '🎹 Piano' },
                { id: 'synth', name: '🎛️ Synth' },
                { id: 'organ', name: '⛪ Órgano' },
                { id: 'flute', name: '🎵 Flauta' }
              ].map(inst => (
                <button
                  key={inst.id}
                  onClick={() => { audioSynth.instrument = inst.id as any; }}
                  className="p-2 rounded-xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200 text-left font-semibold text-slate-800 transition-colors text-xs"
                >
                  {inst.name}
                </button>
              ))}
            </div>
          </div>

          {/* Círculo de Quintas Académico */}
          <div className="bg-[#fdfbf7] p-3 rounded-2xl border border-amber-200 space-y-2 shadow-sm">
            <span className="block font-bold text-slate-900">Círculo de Quintas</span>
            <div className="text-slate-600 text-[11px] leading-relaxed">
              <p><strong>Mayores:</strong> C — G — D — A — E — B — F♯</p>
              <p className="mt-1"><strong>Menores:</strong> Am — Em — Bm — F♯m — C♯m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de nuevo cuaderno */}
      {showNewNotebookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#fdfbf7] border border-amber-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Crear Nuevo Cuaderno Musical</h3>
            <form onSubmit={handleCreateNotebookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Cuaderno:</label>
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="Ej. Armonía Tradicional, Contrapunto"
                  className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewNotebookModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-600/20"
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
