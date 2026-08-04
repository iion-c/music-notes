import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, Music, Settings, HelpCircle, Undo, Redo, 
  Trash2, ChevronDown, PenTool, Sparkles, Layers, Sliders
} from 'lucide-react';
import type { StaveBlock, DurationType, PitchAccidental } from '../../types/music';
import { CLEF_NAMES, TIME_SIGNATURES, KEY_SIGNATURES } from '../../types/music';
import { ScoreData, convertJsonToMusicXML } from '../../services/musicxml';
import { editorOsmdHtml } from '../../services/webviewTemplates';
import { EditorKeyboard } from './EditorKeyboard';
import { getMeasureCapacityIn16ths } from '../../services/rhythmEngine';
import { StaveBlockComponent } from './StaveBlockComponent';

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

  // Teclado ArmonIA
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('q');
  const [isDotted, setIsDotted] = useState<boolean>(false);
  const [selectedAccidental, setSelectedAccidental] = useState<PitchAccidental>('');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);

  // Pasos del modal: 'workspace' (Edición ArmonIA) | 'export-select' (Elegir compases)
  const [step, setStep] = useState<'workspace' | 'export-select'>('workspace');
  const [exportMode, setExportMode] = useState<'all' | 'custom'>('all');
  const [startMeasure, setStartMeasure] = useState<number>(1);
  const [endMeasure, setEndMeasure] = useState<number>(initialBlock.measures.length || 1);

  if (!isOpen) return null;

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
            notes: m.notes.map(n => ({
              id: n.id,
              pitch: n.isRest ? 'R' : (n.keys[0] ? n.keys[0].replace('/', '').toUpperCase() : 'C4'),
              type: n.isRest ? 'rest' : 'note',
              duration: n.duration === 'w' ? 16 : n.duration === 'h' ? 8 : n.duration === 'q' ? 4 : n.duration === '8' ? 2 : 1,
              dotted: n.isDotted
            }))
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
        JSON.stringify({ type: 'LOAD_FILE', data: xmlString }),
        '*'
      );
    }
  };

  useEffect(() => {
    sendXmlToIframe();
  }, [currentBlock]);

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

  // Inserción de notas desde el teclado táctil de ArmonIA
  const handleAddNoteFromKeyboard = (pitch: string) => {
    const measures = [...currentBlock.measures];
    let targetIdx = measures.length - 1;
    if (targetIdx < 0) targetIdx = 0;

    const capacity16ths = getMeasureCapacityIn16ths(currentBlock.timeSignature || '4/4');
    let measure = measures[targetIdx] ? { ...measures[targetIdx] } : {
      id: `m-${Date.now()}-1`,
      measureNumber: 1,
      notes: []
    };

    const currentDurationInMeasure = measure.notes.reduce((acc, n) => {
      let d = 4;
      if (typeof n.duration === 'string') d = durationTo16ths(n.duration as any, n.isDotted);
      else if (typeof n.duration === 'number') d = n.duration;
      return acc + d;
    }, 0);

    const note16ths = durationTo16ths(selectedDuration, isDotted);
    const isRest = pitch === 'R';

    const newNote = {
      id: `n-${Date.now()}`,
      keys: isRest ? ['b/4'] : [pitch],
      duration: selectedDuration,
      isRest: isRest,
      isDotted: isDotted,
      accidental: isRest ? undefined : (selectedAccidental || undefined)
    };

    if (currentDurationInMeasure + note16ths > capacity16ths && measure.notes.length > 0) {
      const newMeasureNum = measures.length + 1;
      measures.push({
        id: `m-${Date.now()}-${newMeasureNum}`,
        measureNumber: newMeasureNum,
        notes: [newNote],
        harmonicAnalysis: { measureNumber: newMeasureNum }
      });
    } else {
      measure.notes = [...measure.notes, newNote];
      measures[targetIdx] = measure;

      if (currentDurationInMeasure + note16ths >= capacity16ths) {
        const newMeasureNum = measures.length + 1;
        measures.push({
          id: `m-${Date.now()}-${newMeasureNum}`,
          measureNumber: newMeasureNum,
          notes: [],
          harmonicAnalysis: { measureNumber: newMeasureNum }
        });
      }
    }

    setCurrentBlock({ ...currentBlock, measures, updatedAt: Date.now() });
  };

  // Eliminar última nota
  const handleRemoveLastNote = () => {
    const measures = [...currentBlock.measures];
    if (measures.length === 0) return;
    const targetIdx = measures.length - 1;
    const measure = { ...measures[targetIdx] };
    if (measure.notes.length > 0) {
      measure.notes = measure.notes.slice(0, -1);
      measures[targetIdx] = measure;
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

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#fdfbf7] border border-amber-200 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabecera del Editor ArmonIA App */}
        <div className="p-3 sm:p-4 bg-[#14141e] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-amber-600/30">
              🎼
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-tight">Editor ArmonIA App</h3>
              <p className="text-[10px] text-amber-400 font-bold">Lápiz con Cruceta a Pantalla Completa</p>
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
          {step === 'workspace' ? (
            <>
              {/* Barra de Ajustes Rápidos */}
              <div className="p-2.5 bg-[#f8f5ee] border border-amber-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex rounded-xl bg-white p-1 border border-amber-200 font-bold">
                  <button
                    onClick={() => handleToggleEditMode('pencil')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      editMode === 'pencil' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700'
                    }`}
                  >
                    ✏️ Lápiz (Cruceta)
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

              {/* Pantalla del Pentagrama (Con iframe OSMD + Cruceta Completa) */}
              <div className="flex-1 min-h-[260px] bg-white rounded-2xl border border-amber-200/90 shadow-inner overflow-hidden relative">
                <iframe
                  ref={iframeRef}
                  srcDoc={editorOsmdHtml}
                  onLoad={sendXmlToIframe}
                  title="ArmonIA OSMD Engine with Full Crosshair"
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
                onAddNote={handleAddNoteFromKeyboard}
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
                    exportMode === 'custom' ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold shadow-sm' : 'bg-white border-amber-200 text-slate-700'
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
