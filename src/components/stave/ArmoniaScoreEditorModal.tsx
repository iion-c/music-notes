import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, Music, Plus, Settings, HelpCircle, Undo, Redo, 
  Trash2, ChevronDown, PenTool, Sparkles, Layers, Sliders
} from 'lucide-react';
import type { StaveBlock, DurationType, PitchAccidental, MeasureData, MusicNoteItem } from '../../types/music';
import { CLEF_NAMES, TIME_SIGNATURES, KEY_SIGNATURES } from '../../types/music';
import { ScoreData, convertJsonToMusicXML } from '../../services/musicxml';
import { editorOsmdHtml } from '../../services/webviewTemplates';
import { EditorKeyboard } from './EditorKeyboard';
import { getMeasureCapacityIn16ths } from '../../services/rhythmEngine';

interface Props {
  isOpen: boolean;
  initialBlock: StaveBlock;
  onClose: () => void;
  onSave: (finalBlock: StaveBlock) => void;
}

export const ArmoniaScoreEditorModal: React.FC<Props> = ({
  isOpen,
  initialBlock,
  onClose,
  onSave
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentBlock, setCurrentBlock] = useState<StaveBlock>(initialBlock);
  const [editMode, setEditMode] = useState<'pencil' | 'select'>('pencil');

  // Pasos del modal: 'initial-measures' (Elección inicial) | 'workspace' (Edición ArmonIA) | 'export-select' (Elegir compases)
  const [step, setStep] = useState<'initial-measures' | 'workspace' | 'export-select'>('initial-measures');
  const [initialMeasureCount, setInitialMeasureCount] = useState<number>(4);

  // Teclado ArmonIA & Shortcuts PC
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('q');
  const [isDotted, setIsDotted] = useState<boolean>(false);
  const [selectedAccidental, setSelectedAccidental] = useState<PitchAccidental>('');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);

  // Posición del cursor del ratón en PC
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const [exportMode, setExportMode] = useState<'all' | 'custom'>('all');
  const [startMeasure, setStartMeasure] = useState<number>(1);
  const [endMeasure, setEndMeasure] = useState<number>(initialBlock.measures.length || 1);

  if (!isOpen) return null;

  // Mapa de atajos de teclado para PC (1: 16th, 2: 8th, 3: quarter, 4: half, 5: whole)
  useEffect(() => {
    if (step !== 'workspace') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case '1': setSelectedDuration('16'); break;
        case '2': setSelectedDuration('8'); break;
        case '3': setSelectedDuration('q'); break;
        case '4': setSelectedDuration('h'); break;
        case '5': setSelectedDuration('w'); break;
        case '.': setIsDotted(prev => !prev); break;
        case '#': setSelectedAccidental(prev => prev === '#' ? '' : '#'); break;
        case 'b': case 'B': setSelectedAccidental(prev => prev === 'b' ? '' : 'b'); break;
        case 'Backspace': case 'Delete': handleRemoveLastNote(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, currentBlock]);

  // Confirmar cantidad de compases iniciales
  const handleStartWithMeasures = (count: number) => {
    const newMeasures: MeasureData[] = [];
    for (let i = 1; i <= count; i++) {
      newMeasures.push({
        id: `m-${Date.now()}-${i}`,
        measureNumber: i,
        notes: [
          { id: `rest-${Date.now()}-${i}`, keys: ['b/4'], duration: 'w', isRest: true }
        ],
        harmonicAnalysis: { measureNumber: i }
      });
    }
    setCurrentBlock({
      ...currentBlock,
      measures: newMeasures,
      updatedAt: Date.now()
    });
    setStep('workspace');
  };

  // Botón "+ Poner más compases"
  const handleAddMoreMeasures = () => {
    const newMeasureNum = currentBlock.measures.length + 1;
    const autoMeasure: MeasureData = {
      id: `m-${Date.now()}-${newMeasureNum}`,
      measureNumber: newMeasureNum,
      notes: [
        { id: `rest-${Date.now()}-${newMeasureNum}`, keys: ['b/4'], duration: 'w', isRest: true }
      ],
      harmonicAnalysis: { measureNumber: newMeasureNum }
    };
    setCurrentBlock({
      ...currentBlock,
      measures: [...currentBlock.measures, autoMeasure],
      updatedAt: Date.now()
    });
  };

  const buildScoreData = (block: StaveBlock): ScoreData => {
    return {
      title: block.title || 'Ejercicio de Armonía',
      composer: 'ArmonIA Engine',
      divisions: 4,
      parts: [
        {
          id: 'P1',
          name: 'Voz Activa',
          clef: block.clef,
          measures: block.measures.map(m => ({
            number: m.measureNumber,
            notes: m.notes.length > 0 ? m.notes.map(n => ({
              id: n.id,
              pitch: n.isRest ? 'R' : (n.keys[0] ? n.keys[0].replace('/', '').toUpperCase() : 'C4'),
              type: n.isRest ? 'rest' : 'note',
              duration: n.duration === 'w' ? 16 : n.duration === 'h' ? 8 : n.duration === 'q' ? 4 : n.duration === '8' ? 2 : 1,
              dotted: n.isDotted
            })) : [{ id: `rest-${m.measureNumber}`, pitch: 'R', type: 'rest', duration: 16, xmlType: 'whole' }]
          }))
        }
      ],
      timeSignature: {
        beats: parseInt(block.timeSignature.split('/')[0] || '4', 10),
        beatType: parseInt(block.timeSignature.split('/')[1] || '4', 10)
      }
    };
  };

  const sendXmlToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const xmlString = convertJsonToMusicXML(buildScoreData(currentBlock));
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'LOAD_FILE', data: xmlString, clef: currentBlock.clef }),
        '*'
      );
    }
  };

  useEffect(() => {
    if (step === 'workspace') sendXmlToIframe();
  }, [currentBlock, step]);

  // Escuchar PENCIL_COMMIT oficial de ArmonIA-App
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg.type === 'PENCIL_COMMIT' && msg.data?.step && msg.data?.octave !== undefined) {
          const pitchStr = `${msg.data.step.toLowerCase()}/${msg.data.octave}`;
          handleAddNoteToExistingMeasures(pitchStr);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentBlock, selectedDuration, isDotted, selectedAccidental]);

  const handleToggleEditMode = (mode: 'pencil' | 'select') => {
    setEditMode(mode);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'SET_EDIT_MODE', mode }),
        '*'
      );
    }
  };

  const durationTo16ths = (dur: DurationType, dotted: boolean = false): number => {
    let base = 4;
    switch (dur) {
      case 'w': base = 16; break;
      case 'h': base = 8; break;
      case 'q': base = 4; break;
      case '8': base = 2; break;
      case '16': base = 1; break;
    }
    return dotted ? base * 1.5 : base;
  };

  // Inserción secuencial ordenada reemplazando silencios
  const handleAddNoteToExistingMeasures = (pitch: string) => {
    const measures = [...currentBlock.measures];
    if (measures.length === 0) return;

    const capacity16ths = getMeasureCapacityIn16ths(currentBlock.timeSignature || '4/4');
    const note16ths = durationTo16ths(selectedDuration, isDotted);
    const isRest = pitch === 'R';

    const newNote: MusicNoteItem = {
      id: `n-${Date.now()}`,
      keys: isRest ? ['b/4'] : [pitch],
      duration: selectedDuration,
      isRest: isRest,
      isDotted: isDotted,
      accidental: isRest ? undefined : (selectedAccidental || undefined)
    };

    // 1. Buscar el PRIMER compás desde el inicio que contenga silencios o espacio libre
    let targetIdx = measures.findIndex(m => {
      const realNotes = m.notes.filter(n => !n.isRest);
      const totalRealDur = realNotes.reduce((acc, n) => acc + durationTo16ths(n.duration as any, n.isDotted), 0);
      return totalRealDur + note16ths <= capacity16ths;
    });

    if (targetIdx !== -1) {
      const realNotes = measures[targetIdx].notes.filter(n => !n.isRest);
      const newRealNotes = [...realNotes, newNote];
      const totalDur = newRealNotes.reduce((acc, n) => acc + durationTo16ths(n.duration as any, n.isDotted), 0);
      const remaining16ths = capacity16ths - totalDur;

      const finalNotes: MusicNoteItem[] = [...newRealNotes];
      if (remaining16ths > 0) {
        let restDur: DurationType = 'q';
        if (remaining16ths >= 16) restDur = 'w';
        else if (remaining16ths >= 8) restDur = 'h';
        else if (remaining16ths >= 4) restDur = 'q';
        else if (remaining16ths >= 2) restDur = '8';
        else restDur = '16';

        finalNotes.push({
          id: `rest-${Date.now()}`,
          keys: ['b/4'],
          duration: restDur,
          isRest: true
        });
      }

      measures[targetIdx] = {
        ...measures[targetIdx],
        notes: finalNotes
      };
    } else {
      // 2. Si todos los compases están al 100% de notas reales, crear uno nuevo
      const newMeasureNum = measures.length + 1;
      measures.push({
        id: `m-${Date.now()}-${newMeasureNum}`,
        measureNumber: newMeasureNum,
        notes: [newNote],
        harmonicAnalysis: { measureNumber: newMeasureNum }
      });
    }

    setCurrentBlock({ ...currentBlock, measures, updatedAt: Date.now() });
  };

  // Eliminar última nota
  const handleRemoveLastNote = () => {
    const measures = [...currentBlock.measures];
    if (measures.length === 0) return;

    const lastFilledIdx = [...measures].reverse().findIndex(m => m.notes.some(n => !n.isRest));
    if (lastFilledIdx !== -1) {
      const actualIdx = measures.length - 1 - lastFilledIdx;
      const measure = { ...measures[actualIdx] };
      const realNotes = measure.notes.filter(n => !n.isRest).slice(0, -1);
      
      const capacity16ths = getMeasureCapacityIn16ths(currentBlock.timeSignature || '4/4');
      const totalDur = realNotes.reduce((acc, n) => acc + durationTo16ths(n.duration as any, n.isDotted), 0);
      const remaining16ths = capacity16ths - totalDur;

      const finalNotes: MusicNoteItem[] = [...realNotes];
      if (remaining16ths > 0) {
        finalNotes.push({
          id: `rest-${Date.now()}`,
          keys: ['b/4'],
          duration: 'w',
          isRest: true
        });
      }

      measures[actualIdx] = { ...measure, notes: finalNotes };
      setCurrentBlock({ ...currentBlock, measures, updatedAt: Date.now() });
    }
  };

  const handleFinishEditing = () => {
    setEndMeasure(currentBlock.measures.length || 1);
    setStep('export-select');
  };

  const handleConfirmSave = () => {
    const finalBlock: StaveBlock = {
      ...currentBlock,
      displayRange: {
        mode: exportMode,
        startMeasure: exportMode === 'custom' ? startMeasure : 1,
        endMeasure: exportMode === 'custom' ? endMeasure : currentBlock.measures.length
      },
      updatedAt: Date.now()
    };
    onSave(finalBlock);
    onClose();
  };

  const getDurationIcon = (dur: DurationType) => {
    switch (dur) {
      case 'w': return '𝅝';
      case 'h': return '𝅗𝅥';
      case 'q': return '𝅘𝅥';
      case '8': return '𝅘𝅥𝅮';
      case '16': return '𝅘𝅥𝅯';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fade-in"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Cursor Flotante en PC mostrando la figura seleccionada */}
      {mousePos && (
        <div 
          className="fixed pointer-events-none z-[10000] hidden md:flex items-center gap-1 bg-amber-600 text-white px-2 py-1 rounded-lg text-xs font-black shadow-lg transform -translate-x-1/2 -translate-y-10 transition-transform"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <span className="text-base">{getDurationIcon(selectedDuration)}</span>
          <span>{isDotted ? '.' : ''}{selectedAccidental}</span>
        </div>
      )}

      <div className="bg-[#fdfbf7] border border-amber-200 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabecera del Editor ArmonIA App */}
        <div className="p-3 sm:p-4 bg-[#14141e] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-amber-600/30">
              🎼
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-tight">Editor ArmonIA App</h3>
              <p className="text-[10px] text-amber-400 font-bold">Atajos PC: 1-5 (Figuras) · . (Puntillo) · Backspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'workspace' ? (
              <button
                onClick={handleFinishEditing}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all"
              >
                <Check size={16} />
                <span>Terminar & Exportar</span>
              </button>
            ) : (
              <button
                onClick={() => setStep('workspace')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs"
              >
                Volver
              </button>
            )}

            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo Principal del Editor */}
        <div className="flex-1 overflow-y-auto bg-[#fdfbf7] flex flex-col justify-between p-2 sm:p-4 space-y-3">
          {step === 'initial-measures' ? (
            /* Diálogo Inicial: ¿Cuántos compases necesitas? */
            <div className="p-6 max-w-md mx-auto space-y-5 text-center my-auto animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
                <Music size={28} />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900 mb-1">¿Cuántos compases necesitas?</h4>
                <p className="text-xs text-slate-600">Configura los compases para comenzar a trabajar en tu ejercicio.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
                {[4, 8, 12, 16].map(num => (
                  <button
                    key={num}
                    onClick={() => handleStartWithMeasures(num)}
                    className="p-3.5 rounded-2xl bg-white border-2 border-amber-200 hover:border-amber-600 text-slate-800 hover:bg-amber-50 shadow-sm transition-all"
                  >
                    <span className="text-base block">{num} Compases</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Otro número:</span>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={initialMeasureCount}
                  onChange={(e) => setInitialMeasureCount(parseInt(e.target.value, 10) || 4)}
                  className="w-20 p-2 bg-white border border-amber-300 rounded-xl text-center font-bold text-slate-900 shadow-sm"
                />
                <button
                  onClick={() => handleStartWithMeasures(initialMeasureCount)}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20"
                >
                  Comenzar ({initialMeasureCount})
                </button>
              </div>
            </div>
          ) : step === 'workspace' ? (
            <>
              {/* Barra de Ajustes Rápidos & Botón + Poner más compases */}
              <div className="p-2.5 bg-[#f8f5ee] border border-amber-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex rounded-xl bg-white p-1 border border-amber-200 font-bold">
                  <button
                    onClick={() => handleToggleEditMode('pencil')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      editMode === 'pencil' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700'
                    }`}
                  >
                    ✏️ Lápiz (Táctil)
                  </button>
                  <button
                    onClick={() => handleToggleEditMode('select')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      editMode === 'select' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700'
                    }`}
                  >
                    ✋ Mover
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddMoreMeasures}
                    className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Plus size={13} />
                    <span>Poner más compases</span>
                  </button>

                  <select
                    value={currentBlock.clef}
                    onChange={(e) => setCurrentBlock({ ...currentBlock, clef: e.target.value as any })}
                    className="bg-white border border-amber-300 rounded-xl px-2 py-1 font-bold text-slate-900 shadow-sm"
                  >
                    {Object.entries(CLEF_NAMES).map(([k, name]) => (
                      <option key={k} value={k}>{name}</option>
                    ))}
                  </select>

                  <select
                    value={currentBlock.timeSignature}
                    onChange={(e) => setCurrentBlock({ ...currentBlock, timeSignature: e.target.value })}
                    className="bg-white border border-amber-300 rounded-xl px-2 py-1 font-bold text-slate-900 shadow-sm"
                  >
                    {TIME_SIGNATURES.map(ts => (
                      <option key={ts} value={ts}>{ts}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pantalla del Pentagrama (Con iframe OSMD oficial de ArmonIA-App) */}
              <div className="flex-1 min-h-[260px] bg-white rounded-2xl border border-amber-200/90 shadow-inner overflow-hidden relative cursor-crosshair">
                <iframe
                  ref={iframeRef}
                  srcDoc={editorOsmdHtml}
                  onLoad={sendXmlToIframe}
                  title="ArmonIA OSMD Engine"
                  className="w-full h-full min-h-[260px] border-none"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Teclado Flotante de Notación Rítmica ArmonIA */}
              <EditorKeyboard
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                isDotted={isDotted}
                setIsDotted={setIsDotted}
                selectedAccidental={selectedAccidental}
                setSelectedAccidental={setSelectedAccidental}
                selectedOctave={selectedOctave}
                setSelectedOctave={setSelectedOctave}
                onAddNote={(pitch) => handleAddNoteToExistingMeasures(pitch)}
                onDeleteLastNote={handleRemoveLastNote}
              />
            </>
          ) : (
            /* Diálogo de Confirmación: Exportar compases */
            <div className="p-6 max-w-md mx-auto space-y-5 text-center my-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
                <Layers size={28} />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900 mb-1">¿Qué compases deseas exportar?</h4>
                <p className="text-xs text-slate-600">Elige qué compases se verán previsualizados en la hoja de tu cuaderno.</p>
              </div>

              <div className="space-y-3 text-xs text-left">
                <label 
                  onClick={() => setExportMode('all')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    exportMode === 'all' ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold shadow-sm' : 'bg-white border-amber-200 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-extrabold block text-sm">Ver Todos los Compases</span>
                    <span className="text-[11px] opacity-80 font-normal">Exporta los {currentBlock.measures.length} compases del ejercicio.</span>
                  </div>
                  <input type="radio" checked={exportMode === 'all'} onChange={() => setExportMode('all')} className="accent-amber-600" />
                </label>

                <label 
                  onClick={() => setExportMode('custom')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer block transition-all ${
                    exportMode === 'custom' ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold shadow-sm' : 'bg-[#fdfbf7] border-amber-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm">Personalizar Rango de Compases</span>
                    <input type="radio" checked={exportMode === 'custom'} onChange={() => setExportMode('custom')} className="accent-amber-600" />
                  </div>

                  {exportMode === 'custom' && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-amber-200/80">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">Desde compás:</span>
                        <input
                          type="number"
                          min={1}
                          max={currentBlock.measures.length}
                          value={startMeasure}
                          onChange={(e) => setStartMeasure(parseInt(e.target.value, 10) || 1)}
                          className="w-16 p-1.5 bg-white border border-amber-300 rounded-xl text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">hasta:</span>
                        <input
                          type="number"
                          min={1}
                          max={currentBlock.measures.length}
                          value={endMeasure}
                          onChange={(e) => setEndMeasure(parseInt(e.target.value, 10) || currentBlock.measures.length)}
                          className="w-16 p-1.5 bg-white border border-amber-300 rounded-xl text-center font-bold"
                        />
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <button
                onClick={handleConfirmSave}
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} />
                <span>Exportar & Guardar en la Hoja</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
