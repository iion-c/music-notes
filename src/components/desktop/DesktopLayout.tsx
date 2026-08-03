import React, { useState } from 'react';
import { 
  BookOpen, Plus, Search, Star, Music, Settings, Download, Upload, 
  HelpCircle, Volume2, Sliders, ChevronRight, Hash, FolderPlus
} from 'lucide-react';
import { Notebook, NotePage } from '../../types/music';
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
  onImportData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [showRightPanel, setShowRightPanel] = useState(true);
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Panel Izquierdo: Árbol de Cuadernos y Búsqueda */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/90 flex flex-col h-full select-none shrink-0">
        {/* Logo App Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 font-bold">
              🎼
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">Music Notes</h1>
              <p className="text-[11px] text-cyan-400 font-medium">Apuntes & Pentagramas</p>
            </div>
          </div>

          <button
            onClick={() => onCreatePage()}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-md shadow-cyan-600/30"
            title="Nueva Nota Musical"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Buscador y Categorías */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar notas, ejercicios o tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1 no-scrollbar">
            {['Todas', 'Armonía', 'Contrapunto', 'Solfeo', 'Composición'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Notas y Cuadernos */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Cuadernos & Notas</span>
            <button 
              onClick={() => setShowNewNotebookModal(true)}
              className="text-cyan-400 hover:text-cyan-300"
              title="Crear Nuevo Cuaderno"
            >
              + Cuaderno
            </button>
          </div>

          {filteredPages.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectPage(p.id)}
              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 group ${
                p.id === activePage?.id
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-800/90 border border-cyan-500/40 text-white shadow-md'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="mt-0.5 text-cyan-400">
                <Music size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs truncate group-hover:text-cyan-300">{p.title}</h4>
                  {p.isFavorite && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800">{p.category}</span>
                  <span>•</span>
                  <span>{p.blocks.filter(b => b.type === 'stave').length} pentagramas</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer: Exportar / Importar */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs bg-slate-950/60">
          <button
            onClick={onExportAllData}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Exportar copia de seguridad JSON"
          >
            <Download size={13} />
            <span>Exportar</span>
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer">
            <Upload size={13} />
            <span>Importar</span>
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Area Central: Editor de Notas Musicales */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activePage ? (
            <MusicNotebook
              page={activePage}
              onUpdatePage={onUpdatePage}
              onDeletePage={() => onDeletePage(activePage.id)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Music size={48} className="mb-2 text-slate-600" />
              <p>Selecciona o crea una nota musical para empezar a escribir</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel Derecho: Asistente Armónico y Reproductor de Audio Synthesizer */}
      <div className="w-72 border-l border-slate-800 bg-slate-900/90 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
            <Volume2 size={16} className="text-cyan-400" />
            <span>Sintetizador & Audio</span>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-6 text-xs">
          {/* Controles de Tempo (BPM) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-400">Tempo de Reproducción:</span>
              <span className="text-cyan-400 font-mono font-bold text-sm">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Lento (40)</span>
              <span>Moderato (100)</span>
              <span>Presto (220)</span>
            </div>
          </div>

          {/* Instrumento Presets */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="block text-slate-400 font-medium mb-1">Timbre de Instrumento:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'piano', name: '🎹 Piano Grand' },
                { id: 'synth', name: '🎛️ Synth Lead' },
                { id: 'organ', name: '⛪ Órgano' },
                { id: 'flute', name: '🎵 Flauta' }
              ].map(inst => (
                <button
                  key={inst.id}
                  onClick={() => { audioSynth.instrument = inst.id as any; }}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {inst.name}
                </button>
              ))}
            </div>
          </div>

          {/* Asistente Armónico de Círculo de Quintas */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="block font-semibold text-slate-200">Círculo de Quintas Rápido</span>
            <div className="text-slate-400 text-[11px] leading-relaxed">
              <p><strong>Mayores:</strong> C — G — D — A — E — B — F♯ — C♯</p>
              <p className="mt-1"><strong>Relativos menores:</strong> Am — Em — Bm — F♯m — C♯m</p>
            </div>
          </div>

          {/* Atajos de teclado rápidos */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px]">
            <span className="block font-semibold text-slate-300 mb-1">Atajos de Edición:</span>
            <p className="text-slate-400"><kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-400">Ctrl + S</kbd> Guardar cambios</p>
            <p className="text-slate-400"><kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-400">Espacio</kbd> Play / Detener audio</p>
          </div>
        </div>
      </div>

      {/* Modal de nuevo cuaderno */}
      {showNewNotebookModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Crear Nuevo Cuaderno Musical</h3>
            <form onSubmit={handleCreateNotebookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Cuaderno:</label>
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="Ej. Armonía Avanzada, Composición II"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewNotebookModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
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
