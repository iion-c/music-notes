import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Camera, ChevronDown, ChevronUp, Plus, Trash2, 
  Settings, Music, Sliders, Copy, PenTool, MousePointerClick
} from 'lucide-react';
import type { 
  StaveBlock, MeasureData, MusicNoteItem, ClefType, 
  DurationType, PitchAccidental 
} from '../../types/music';
import { CLEF_NAMES, KEY_SIGNATURES, TIME_SIGNATURES, DURATION_NAMES } from '../../types/music';
import { renderStaveToContainer } from '../../services/vexRender';
import { audioSynth } from '../../services/audioSynth';
import { downloadElementScreenshot, copyElementToClipboard } from '../../services/screenshot';

interface Props {
  staveBlock: StaveBlock;
  onUpdate: (updatedBlock: StaveBlock) => void;
  onDelete?: () => void;
  onInsertSnapshotCard?: (dataUrl: string) => void;
}

export const StaveBlockComponent: React.FC<Props> = ({ 
  staveBlock, 
  onUpdate, 
  onDelete,
  onInsertSnapshotCard 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockCardRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNotePos, setActiveNotePos] = useState<{ measureIndex: number; noteIndex: number } | null>(null);

  // Menús desplegables (Dropdowns)
  const [activeDropdown, setActiveDropdown] = useState<'settings' | 'notes' | 'analysis' | null>(null);
  const [selectedMeasureIdx, setSelectedMeasureIdx] = useState<number>(0);

  // Estado temporal para edición de nota
  const [currentPitch, setCurrentPitch] = useState<string>('c/4');
  const [currentDuration, setCurrentDuration] = useState<DurationType>('q');
  const [isRest, setIsRest] = useState<boolean>(false);
  const [accidental, setAccidental] = useState<PitchAccidental>('');

  // Re-renderizar pentagrama en SVG cada vez que el bloque cambia o la nota activa cambia
  useEffect(() => {
    if (containerRef.current && !staveBlock.isCollapsed) {
      renderStaveToContainer(containerRef.current, staveBlock, {
        activeNotePos,
        interactive: true
      });
    }
  }, [staveBlock, activeNotePos]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && !staveBlock.isCollapsed) {
        renderStaveToContainer(containerRef.current, staveBlock, { activeNotePos });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [staveBlock, activeNotePos]);

  // Reproducción de audio
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioSynth.stopPlayback();
      setIsPlaying(false);
      setActiveNotePos(null);
    } else {
      setIsPlaying(true);
      audioSynth.playStaveBlock(
        staveBlock,
        (measureIndex, noteIndex) => {
          if (measureIndex === -1 || noteIndex === null) {
            setActiveNotePos(null);
          } else {
            setActiveNotePos({ measureIndex, noteIndex });
          }
        },
        () => {
          setIsPlaying(false);
          setActiveNotePos(null);
        }
      );
    }
  };

  // Captura de pantalla PNG
  const handleTakeScreenshot = async () => {
    if (blockCardRef.current) {
      await downloadElementScreenshot(blockCardRef.current, `${staveBlock.title.toLowerCase().replace(/\s+/g, '-')}.png`);
    }
  };

  const handleCopyScreenshot = async () => {
    if (blockCardRef.current) {
      const ok = await copyElementToClipboard(blockCardRef.current);
      if (ok && onInsertSnapshotCard) {
        const canvas = await import('html2canvas');
        const rendered = await canvas.default(blockCardRef.current, { scale: 2, backgroundColor: '#fdfbf7' });
        onInsertSnapshotCard(rendered.toDataURL('image/png'));
      }
    }
  };

  // Alternar colapso/despliegue
  const toggleCollapse = () => {
    onUpdate({ ...staveBlock, isCollapsed: !staveBlock.isCollapsed, updatedAt: Date.now() });
  };

  // Añadir un compás
  const handleAddMeasure = () => {
    const newMeasureNum = staveBlock.measures.length + 1;
    const newMeasure: MeasureData = {
      id: `m-${Date.now()}-${newMeasureNum}`,
      measureNumber: newMeasureNum,
      notes: [
        { id: `n-${Date.now()}-1`, keys: ['c/4'], duration: 'q', isRest: false },
        { id: `n-${Date.now()}-2`, keys: ['e/4'], duration: 'q', isRest: false },
        { id: `n-${Date.now()}-3`, keys: ['g/4'], duration: 'q', isRest: false },
        { id: `n-${Date.now()}-4`, keys: ['c/5'], duration: 'q', isRest: false }
      ],
      harmonicAnalysis: { measureNumber: newMeasureNum, romanNumeral: 'I', figuredBass: '5/3' }
    };
    onUpdate({
      ...staveBlock,
      measures: [...staveBlock.measures, newMeasure],
      updatedAt: Date.now()
    });
  };

  // Añadir nota al compás seleccionado
  const handleAddNoteToSelectedMeasure = (pitchToAdd?: string) => {
    const measures = [...staveBlock.measures];
    if (selectedMeasureIdx < 0 || selectedMeasureIdx >= measures.length) return;

    const targetPitch = pitchToAdd || currentPitch;

    const measure = { ...measures[selectedMeasureIdx] };
    const newNote: MusicNoteItem = {
      id: `n-${Date.now()}`,
      keys: [targetPitch],
      duration: currentDuration,
      isRest: isRest,
      accidental: accidental || undefined
    };

    measure.notes = [...measure.notes, newNote];
    measures[selectedMeasureIdx] = measure;

    if (!isRest) {
      audioSynth.playNote(newNote);
    }

    onUpdate({ ...staveBlock, measures, updatedAt: Date.now() });
  };

  // Click interactivo en el canvas SVG para insertar nota
  const handleStaveCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Calcular altura estimada según la posición Y vertical
    const pitchScale = ['g/5', 'f/5', 'e/5', 'd/5', 'c/5', 'b/4', 'a/4', 'g/4', 'f/4', 'e/4', 'd/4', 'c/4', 'b/3', 'a/3'];
    const idx = Math.max(0, Math.min(pitchScale.length - 1, Math.floor(y / 11)));
    const clickedPitch = pitchScale[idx];

    setCurrentPitch(clickedPitch);
    handleAddNoteToSelectedMeasure(clickedPitch);
  };

  // Eliminar última nota
  const handleRemoveLastNoteFromSelectedMeasure = () => {
    const measures = [...staveBlock.measures];
    if (selectedMeasureIdx < 0 || selectedMeasureIdx >= measures.length) return;

    const measure = { ...measures[selectedMeasureIdx] };
    if (measure.notes.length > 0) {
      measure.notes = measure.notes.slice(0, -1);
      measures[selectedMeasureIdx] = measure;
      onUpdate({ ...staveBlock, measures, updatedAt: Date.now() });
    }
  };

  // Actualizar Análisis Armónico
  const handleUpdateHarmonicAnalysis = (field: 'romanNumeral' | 'figuredBass' | 'chordName' | 'comments', val: string) => {
    const measures = [...staveBlock.measures];
    if (selectedMeasureIdx < 0 || selectedMeasureIdx >= measures.length) return;

    const measure = { ...measures[selectedMeasureIdx] };
    const ha = { ...(measure.harmonicAnalysis || { measureNumber: measure.measureNumber }), [field]: val };
    measure.harmonicAnalysis = ha;
    measures[selectedMeasureIdx] = measure;
    onUpdate({ ...staveBlock, measures, updatedAt: Date.now() });
  };

  const selectedMeasure = staveBlock.measures[selectedMeasureIdx];

  const toggleDropdown = (dropdown: 'settings' | 'notes' | 'analysis') => {
    setActiveDropdown(prev => prev === dropdown ? null : dropdown);
  };

  return (
    <div 
      ref={blockCardRef}
      className="my-5 rounded-2xl border border-amber-200/90 bg-[#fdfbf7] shadow-lg shadow-amber-950/5 overflow-hidden transition-all duration-200"
    >
      {/* Cabecera Responsiva Móvil/Desktop */}
      <div className="flex flex-wrap items-center justify-between p-3 sm:p-4 bg-[#f8f5ee] border-b border-amber-200/60 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full">
          <button 
            onClick={toggleCollapse}
            className="p-2 rounded-xl bg-amber-100/80 text-amber-900 hover:bg-amber-200 transition-colors shrink-0"
            title={staveBlock.isCollapsed ? 'Desplegar Pentagrama' : 'Colapsar Pentagrama'}
          >
            {staveBlock.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          
          <div className="min-w-0 flex-1">
            <input 
              type="text" 
              value={staveBlock.title}
              onChange={(e) => onUpdate({ ...staveBlock, title: e.target.value, updatedAt: Date.now() })}
              className="bg-transparent text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:border-b-2 focus:border-amber-500 w-full truncate"
              placeholder="Título del Pentagrama..."
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {CLEF_NAMES[staveBlock.clef]}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                {staveBlock.timeSignature}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold border border-sky-200">
                {staveBlock.keySignature}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                {staveBlock.displayRange.mode === 'custom' 
                  ? `Compases ${staveBlock.displayRange.startMeasure || 1}-${staveBlock.displayRange.endMeasure || staveBlock.measures.length}`
                  : `${staveBlock.measures.length} compases`}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones principales de la cabecera */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              isPlaying 
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse' 
                : 'bg-amber-600 text-white hover:bg-amber-500 shadow-md shadow-amber-600/20'
            }`}
            title={isPlaying ? 'Detener' : 'Escuchar Pentagrama'}
          >
            {isPlaying ? <Square size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Detener' : 'Escuchar'}</span>
          </button>

          <button
            onClick={handleTakeScreenshot}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100/80 text-amber-900 hover:bg-amber-200 text-xs font-bold transition-colors"
            title="Descargar captura PNG"
          >
            <Camera size={14} />
            <span className="hidden md:inline">Capturar</span>
          </button>

          <button
            onClick={handleCopyScreenshot}
            className="p-1.5 rounded-xl bg-amber-100/80 text-amber-900 hover:bg-amber-200 text-xs transition-colors"
            title="Copiar imagen al portapapeles"
          >
            <Copy size={14} />
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs transition-colors border border-rose-200"
              title="Eliminar Pentagrama"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Menús Desplegables Contextuales (Dropdown Buttons Toolbar) */}
      {!staveBlock.isCollapsed && (
        <div className="px-3 py-2 bg-[#f6f2e8] border-b border-amber-200/60 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => toggleDropdown('settings')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeDropdown === 'settings' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-[#fdfbf7] text-slate-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Settings size={14} />
            <span>Clave & Compases ▾</span>
          </button>

          <button
            onClick={() => toggleDropdown('notes')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeDropdown === 'notes' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-[#fdfbf7] text-slate-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Music size={14} />
            <span>Mini-Editor Notas ▾</span>
          </button>

          <button
            onClick={() => toggleDropdown('analysis')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeDropdown === 'analysis' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-[#fdfbf7] text-slate-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <PenTool size={14} />
            <span>Análisis Armónico ▾</span>
          </button>
        </div>
      )}

      {/* Desplegable 1: Configuración de Clave, Métrica y Rango de Compases */}
      {activeDropdown === 'settings' && !staveBlock.isCollapsed && (
        <div className="p-4 bg-amber-50/90 border-b border-amber-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-fade-in">
          <div>
            <label className="block text-slate-800 mb-1 font-bold">Clave Musical</label>
            <select
              value={staveBlock.clef}
              onChange={(e) => onUpdate({ ...staveBlock, clef: e.target.value as ClefType, updatedAt: Date.now() })}
              className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
            >
              {Object.entries(CLEF_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-800 mb-1 font-bold">Métrica (Compás)</label>
            <select
              value={staveBlock.timeSignature}
              onChange={(e) => onUpdate({ ...staveBlock, timeSignature: e.target.value, updatedAt: Date.now() })}
              className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
            >
              {TIME_SIGNATURES.map(ts => (
                <option key={ts} value={ts}>{ts}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-800 mb-1 font-bold">Armadura de Clave</label>
            <select
              value={staveBlock.keySignature}
              onChange={(e) => onUpdate({ ...staveBlock, keySignature: e.target.value, updatedAt: Date.now() })}
              className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
            >
              {KEY_SIGNATURES.map(ks => (
                <option key={ks.code} value={ks.code}>{ks.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-800 mb-1 font-bold">Selección de Compases</label>
            <select
              value={staveBlock.displayRange.mode}
              onChange={(e) => onUpdate({ 
                ...staveBlock, 
                displayRange: { 
                  mode: e.target.value as 'all' | 'custom',
                  startMeasure: 1,
                  endMeasure: staveBlock.measures.length
                },
                updatedAt: Date.now() 
              })}
              className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
            >
              <option value="all">Ver todos ({staveBlock.measures.length})</option>
              <option value="custom">Personalizar rango</option>
            </select>

            {staveBlock.displayRange.mode === 'custom' && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  max={staveBlock.measures.length}
                  value={staveBlock.displayRange.startMeasure || 1}
                  onChange={(e) => onUpdate({
                    ...staveBlock,
                    displayRange: {
                      ...staveBlock.displayRange,
                      startMeasure: parseInt(e.target.value, 10) || 1
                    }
                  })}
                  className="w-16 bg-white border border-amber-300 rounded-lg p-1 text-center font-bold text-slate-900"
                />
                <span className="text-slate-600 font-bold">a</span>
                <input
                  type="number"
                  min={1}
                  max={staveBlock.measures.length}
                  value={staveBlock.displayRange.endMeasure || staveBlock.measures.length}
                  onChange={(e) => onUpdate({
                    ...staveBlock,
                    displayRange: {
                      ...staveBlock.displayRange,
                      endMeasure: parseInt(e.target.value, 10) || staveBlock.measures.length
                    }
                  })}
                  className="w-16 bg-white border border-amber-300 rounded-lg p-1 text-center font-bold text-slate-900"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desplegable 2: Mini-Editor Interactivo de Notas */}
      {activeDropdown === 'notes' && !staveBlock.isCollapsed && (
        <div className="p-4 bg-amber-50/90 border-b border-amber-200 text-xs space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Compás:</span>
              <select
                value={selectedMeasureIdx}
                onChange={(e) => setSelectedMeasureIdx(parseInt(e.target.value, 10))}
                className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-amber-900 font-bold shadow-sm"
              >
                {staveBlock.measures.map((m, idx) => (
                  <option key={m.id} value={idx}>Compás {m.measureNumber}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddMeasure}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>+ Compás</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Notas (Pitches):</label>
              <div className="flex flex-wrap gap-1">
                {['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5', 'e/5', 'g/5'].map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setCurrentPitch(p);
                      handleAddNoteToSelectedMeasure(p);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                      currentPitch === p ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Duración (Figura):</label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(DURATION_NAMES).map(([durKey, info]) => (
                  <button
                    key={durKey}
                    onClick={() => setCurrentDuration(durKey as DurationType)}
                    className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-all ${
                      currentDuration === durKey ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>{info.symbol}</span>
                    <span>{info.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => handleAddNoteToSelectedMeasure()}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 shadow-md shadow-amber-600/20 transition-all"
              >
                <Plus size={14} />
                <span>Insertar Nota</span>
              </button>
              <button
                onClick={handleRemoveLastNoteFromSelectedMeasure}
                className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold border border-rose-300 transition-colors"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desplegable 3: Análisis Armónico */}
      {activeDropdown === 'analysis' && !staveBlock.isCollapsed && (
        <div className="p-4 bg-amber-50/90 border-b border-amber-200 text-xs space-y-3 animate-fade-in">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <PenTool size={14} className="text-amber-600" />
            <span>Análisis Armónico (Compás {selectedMeasure?.measureNumber})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-0.5">Grado Romano:</label>
              <input
                type="text"
                value={selectedMeasure?.harmonicAnalysis?.romanNumeral || ''}
                onChange={(e) => handleUpdateHarmonicAnalysis('romanNumeral', e.target.value)}
                placeholder="Ej. I, IV, V7, ii6, vi"
                className="w-full bg-white border border-amber-300 rounded-xl p-2 text-sky-800 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-0.5">Bajo Cifrado:</label>
              <input
                type="text"
                value={selectedMeasure?.harmonicAnalysis?.figuredBass || ''}
                onChange={(e) => handleUpdateHarmonicAnalysis('figuredBass', e.target.value)}
                placeholder="Ej. 6, 6/4, 7, 6/5"
                className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-800 font-semibold focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-0.5">Cifrado de Acorde:</label>
              <input
                type="text"
                value={selectedMeasure?.harmonicAnalysis?.chordName || ''}
                onChange={(e) => handleUpdateHarmonicAnalysis('chordName', e.target.value)}
                placeholder="Ej. Cmaj7, Am, G7"
                className="w-full bg-white border border-amber-300 rounded-xl p-2 text-purple-900 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-0.5">Notas & Observaciones del Ejercicio:</label>
            <textarea
              value={selectedMeasure?.harmonicAnalysis?.comments || ''}
              onChange={(e) => handleUpdateHarmonicAnalysis('comments', e.target.value)}
              placeholder="Escribe comentarios teóricos sobre la conducción de voces, especies de contrapunto o notas de paso..."
              rows={2}
              className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>
      )}

      {/* Cuerpo del Pentagrama SVG interactivo en VexFlow */}
      {!staveBlock.isCollapsed && (
        <div 
          onClick={handleStaveCanvasClick}
          className="p-4 bg-[#fdfbf7] overflow-x-auto min-h-[170px] flex flex-col items-center justify-center cursor-pointer relative group"
          title="Haz clic sobre el pentagrama para agregar notas directamente"
        >
          <div className="absolute top-2 right-3 text-[10px] text-amber-800/60 font-semibold flex items-center gap-1 pointer-events-none">
            <MousePointerClick size={12} />
            <span>Clic directo en pentagrama para colocar nota</span>
          </div>

          <div ref={containerRef} className="w-full flex justify-center" />
        </div>
      )}
    </div>
  );
};
