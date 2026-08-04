import React, { useState } from 'react';
import { X, Check, Music, Sparkles, Layers } from 'lucide-react';
import type { StaveBlock } from '../../types/music';
import { StaveBlockComponent } from './StaveBlockComponent';

interface Props {
  isOpen: boolean;
  initialBlock: StaveBlock;
  onClose: () => void;
  onSave: (finalBlock: StaveBlock) => void;
}

export const StaveEditorModal: React.FC<Props> = ({
  isOpen,
  initialBlock,
  onClose,
  onSave
}) => {
  const [currentBlock, setCurrentBlock] = useState<StaveBlock>(initialBlock);
  const [step, setStep] = useState<'editing' | 'export-confirm'>('editing');
  const [exportMode, setExportMode] = useState<'all' | 'custom'>('all');
  const [startMeasure, setStartMeasure] = useState<number>(1);
  const [endMeasure, setEndMeasure] = useState<number>(initialBlock.measures.length || 1);

  if (!isOpen) return null;

  const handleFinishEditing = () => {
    setEndMeasure(currentBlock.measures.length || 1);
    setStep('export-confirm');
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#fdfbf7] border border-amber-200 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabecera del Editor */}
        <div className="p-4 bg-[#f8f5ee] border-b border-amber-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
              <Music size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Editor de Pentagrama</h3>
              <p className="text-[11px] text-amber-800 font-semibold">Motor Rítmico & Armónico ArmonIA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'editing' ? (
              <button
                onClick={handleFinishEditing}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all"
              >
                <Check size={15} />
                <span>Terminar Edición</span>
              </button>
            ) : (
              <button
                onClick={() => setStep('editing')}
                className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs"
              >
                Volver al Editor
              </button>
            )}

            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo Modal */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {step === 'editing' ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
                <Sparkles size={16} className="text-amber-600 shrink-0" />
                <span>Escribe notas tocando el teclado o directamente en las líneas del pentagrama. Los compases se crearán automáticamente.</span>
              </div>

              <StaveBlockComponent
                staveBlock={currentBlock}
                onUpdate={(updated) => setCurrentBlock(updated)}
              />
            </div>
          ) : (
            /* Diálogo de Confirmación: Exportar / Previsualizar compases */
            <div className="p-6 max-w-md mx-auto space-y-5 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
                <Layers size={28} />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900 mb-1">¿Qué compases deseas exportar?</h4>
                <p className="text-xs text-slate-600">Selecciona qué compases se previsualizarán en tu hoja de apuntes.</p>
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
                <span>Exportar & Insertar en la Hoja</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
