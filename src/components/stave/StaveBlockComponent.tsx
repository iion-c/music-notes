import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Camera, ChevronDown, ChevronUp, Plus, Trash2, 
  Settings, Music, Sliders, Copy, Download, Tag, FileText, PenTool 
} from 'lucide-react';
import { 
  StaveBlock, MeasureData, MusicNoteItem, ClefType, 
  CLEF_NAMES, KEY_SIGNATURES, TIME_SIGNATURES, DURATION_NAMES, DurationType, PitchAccidental 
} from '../../types/music';
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
  const [showSettings, setShowSettings] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
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

  // Manejar cambio de tamaño de ventana para hacer la partitura responsiva
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
        // Opción de insertar como tarjeta
        const canvas = await import('html2canvas');
        const rendered = await canvas.default(blockCardRef.current, { scale: 2, backgroundColor: '#0f172a' });
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
  const handleAddNoteToSelectedMeasure = () => {
    const measures = [...staveBlock.measures];
    if (selectedMeasureIdx < 0 || selectedMeasureIdx >= measures.length) return;

    const measure = { ...measures[selectedMeasureIdx] };
    const newNote: MusicNoteItem = {
      id: `n-${Date.now()}`,
      keys: [currentPitch],
      duration: currentDuration,
      isRest: isRest,
      accidental: accidental || undefined
    };

    measure.notes = [...measure.notes, newNote];
    measures[selectedMeasureIdx] = measure;

    // Probar sonido al insertar nota
    if (!isRest) {
      audioSynth.playNote(newNote);
    }

    onUpdate({ ...staveBlock, measures, updatedAt: Date.now() });
  };

  // Eliminar última nota del compás seleccionado
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

  return (
    <div 
      ref={blockCardRef}
      className="my-4 rounded-xl border border-slate-700/60 bg-slate-900/90 shadow-xl backdrop-blur-md overflow-hidden transition-all duration-200"
    >
      {/* Header del Pentagrama Desplegable */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/60 gap-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title={staveBlock.isCollapsed ? 'Desplegar Pentagrama' : 'Colapsar Pentagrama'}
          >
            {staveBlock.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          
          <div>
            <input 
              type="text" 
              value={staveBlock.title}
              onChange={(e) => onUpdate({ ...staveBlock, title: e.target.value, updatedAt: Date.now() })}
              className="bg-transparent text-base font-semibold text-white focus:outline-none focus:border-b focus:border-cyan-400"
              placeholder="Título del Pentagrama..."
            />
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                {CLEF_NAMES[staveBlock.clef]}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                {staveBlock.timeSignature}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono">
                Tonalidad: {staveBlock.keySignature}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                {staveBlock.displayRange.mode === 'custom' 
                  ? `Compases ${staveBlock.displayRange.startMeasure || 1}-${staveBlock.displayRange.endMeasure || staveBlock.measures.length}`
                  : `${staveBlock.measures.length} compases`}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones principales de la cabecera */}
        <div className="flex items-center gap-1.5">
          {/* Reproductor de Audio */}
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              isPlaying 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse' 
                : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/20'
            }`}
            title={isPlaying ? 'Detener Reproducción' : 'Reproducir Pentagrama'}
          >
            {isPlaying ? <Square size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Detener' : 'Escuchar'}</span>
          </button>

          {/* Captura de Pantalla */}
          <button
            onClick={handleTakeScreenshot}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs transition-colors"
            title="Descargar captura PNG"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Capturar</span>
          </button>

          <button
            onClick={handleCopyScreenshot}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition-colors"
            title="Copiar imagen al portapapeles o insertar tarjeta"
          >
            <Copy size={14} />
          </button>

          {/* Menú de Configuración de Compases */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${showSettings ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            title="Ajustar Clave, Métrica, Compases"
          >
            <Settings size={15} />
          </button>

          {/* Editor de Notas */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${showInspector ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            title="Editor de notas y análisis armónico"
          >
            <Sliders size={15} />
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-slate-800/80 text-rose-400 hover:bg-rose-950 hover:text-rose-200 text-xs transition-colors"
              title="Eliminar Pentagrama"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Menú Desplegable de Configuración de Pentagramas y Selección de Compases */}
      {showSettings && (
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Clave Musical</label>
            <select
              value={staveBlock.clef}
              onChange={(e) => onUpdate({ ...staveBlock, clef: e.target.value as ClefType, updatedAt: Date.now() })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {Object.entries(CLEF_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Métrica (Compás)</label>
            <select
              value={staveBlock.timeSignature}
              onChange={(e) => onUpdate({ ...staveBlock, timeSignature: e.target.value, updatedAt: Date.now() })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {TIME_SIGNATURES.map(ts => (
                <option key={ts} value={ts}>{ts}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Armadura de Clave</label>
            <select
              value={staveBlock.keySignature}
              onChange={(e) => onUpdate({ ...staveBlock, keySignature: e.target.value, updatedAt: Date.now() })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {KEY_SIGNATURES.map(ks => (
                <option key={ks.code} value={ks.code}>{ks.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Selección de Compases a Desplegar</label>
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
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Ver todos los compases ({staveBlock.measures.length})</option>
              <option value="custom">Personalizar rango de compases</option>
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
                  className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center text-white"
                />
                <span className="text-slate-400">a</span>
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
                  className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center text-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cuerpo del Pentagrama SVG en VexFlow */}
      {!staveBlock.isCollapsed && (
        <div className="p-4 bg-slate-950 overflow-x-auto min-h-[170px] flex items-center justify-center">
          <div ref={containerRef} className="w-full flex justify-center" />
        </div>
      )}

      {/* Editor Interactivo de Notas y Análisis Armónico por Compás */}
      {showInspector && !staveBlock.isCollapsed && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">Editar Compás:</span>
              <select
                value={selectedMeasureIdx}
                onChange={(e) => setSelectedMeasureIdx(parseInt(e.target.value, 10))}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-cyan-400 font-bold"
              >
                {staveBlock.measures.map((m, idx) => (
                  <option key={m.id} value={idx}>Compás {m.measureNumber}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddMeasure}
              className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white font-medium transition-colors"
            >
              <Plus size={14} />
              <span>Añadir Compás</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel de notas */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div className="font-semibold text-slate-300 mb-2">Agregar Notas al Compás {selectedMeasure?.measureNumber}</div>
              
              {/* Selección de altura */}
              <div className="mb-3">
                <label className="block text-slate-400 mb-1">Altura de Nota (Pitch):</label>
                <div className="flex flex-wrap gap-1">
                  {['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5', 'e/5', 'g/5'].map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPitch(p)}
                      className={`px-2 py-1 rounded font-mono ${currentPitch === p ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alteración */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-slate-400">Alteración:</span>
                {(['', '#', 'b', 'n'] as PitchAccidental[]).map(acc => (
                  <button
                    key={acc || 'none'}
                    onClick={() => setAccidental(acc)}
                    className={`px-2 py-1 rounded font-mono ${accidental === acc ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {acc === '' ? 'Natural' : acc === '#' ? 'Sostenido ♯' : acc === 'b' ? 'Bemol ♭' : 'Becuadro ♮'}
                  </button>
                ))}
              </div>

              {/* Duración */}
              <div className="mb-3">
                <label className="block text-slate-400 mb-1">Duración (Figura):</label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(DURATION_NAMES).map(([durKey, info]) => (
                    <button
                      key={durKey}
                      onClick={() => setCurrentDuration(durKey as DurationType)}
                      className={`px-2.5 py-1 rounded flex items-center gap-1 ${currentDuration === durKey ? 'bg-emerald-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}
                    >
                      <span className="text-sm">{info.symbol}</span>
                      <span>{info.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNoteToSelectedMeasure}
                  className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus size={14} />
                  <span>Insertar Nota</span>
                </button>
                <button
                  onClick={handleRemoveLastNoteFromSelectedMeasure}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-300 rounded font-medium transition-colors"
                  title="Eliminar última nota de este compás"
                >
                  Borrar Última
                </button>
              </div>
            </div>

            {/* Panel de Análisis Armónico en los ejercicios */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <PenTool size={14} className="text-cyan-400" />
                <span>Notas en el Ejercicio / Análisis Armónico (Compás {selectedMeasure?.measureNumber})</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-0.5">Grado Romano (Análisis):</label>
                  <input
                    type="text"
                    value={selectedMeasure?.harmonicAnalysis?.romanNumeral || ''}
                    onChange={(e) => handleUpdateHarmonicAnalysis('romanNumeral', e.target.value)}
                    placeholder="Ej. I, IV, V7, ii6, vi"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Bajo Cifrado:</label>
                  <input
                    type="text"
                    value={selectedMeasure?.harmonicAnalysis?.figuredBass || ''}
                    onChange={(e) => handleUpdateHarmonicAnalysis('figuredBass', e.target.value)}
                    placeholder="Ej. 6, 6/4, 7, 6/5"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-0.5">Cifrado de Acorde (Nombre):</label>
                <input
                  type="text"
                  value={selectedMeasure?.harmonicAnalysis?.chordName || ''}
                  onChange={(e) => handleUpdateHarmonicAnalysis('chordName', e.target.value)}
                  placeholder="Ej. Cmaj7, Am, G7, F#dim"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-purple-300 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-0.5">Comentarios Teóricos / Notas del Ejercicio:</label>
                <textarea
                  value={selectedMeasure?.harmonicAnalysis?.comments || ''}
                  onChange={(e) => handleUpdateHarmonicAnalysis('comments', e.target.value)}
                  placeholder="Escribe anotaciones sobre la conducción de voces, notas de paso, bordaduras o reglas de contrapunto..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
