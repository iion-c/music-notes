import React from 'react';
import type { DurationType, PitchAccidental } from '../../types/music';
import { DURATION_NAMES } from '../../types/music';
import { Delete, Undo, Redo, Plus } from 'lucide-react';

interface Props {
  selectedDuration: DurationType;
  setSelectedDuration: (d: DurationType) => void;
  isDotted: boolean;
  setIsDotted: (v: boolean) => void;
  selectedAccidental: PitchAccidental;
  setSelectedAccidental: (a: PitchAccidental) => void;
  selectedOctave: number;
  setSelectedOctave: (fn: (prev: number) => number) => void;
  onAddNote: (pitch: string) => void;
  onDeleteLastNote: () => void;
}

export const EditorKeyboard: React.FC<Props> = ({
  selectedDuration,
  setSelectedDuration,
  isDotted,
  setIsDotted,
  selectedAccidental,
  setSelectedAccidental,
  selectedOctave,
  setSelectedOctave,
  onAddNote,
  onDeleteLastNote
}) => {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  return (
    <div className="bg-[#f8f5ee] border-t border-amber-200 p-2 sm:p-3 rounded-2xl shadow-inner space-y-2.5 select-none text-xs">
      {/* 1. Barra superior: Duraciones (Figuras), Puntillo, Alteraciones, Octava */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {/* Duraciones */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 shadow-sm shrink-0">
          {Object.entries(DURATION_NAMES).map(([durKey, info]) => (
            <button
              key={durKey}
              onClick={() => setSelectedDuration(durKey as DurationType)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold text-xs transition-all ${
                selectedDuration === durKey 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-amber-50/50 text-slate-800 hover:bg-amber-100'
              }`}
            >
              <span className="text-base leading-none">{info.symbol}</span>
            </button>
          ))}
        </div>

        {/* Puntillo */}
        <button
          onClick={() => setIsDotted(!isDotted)}
          className={`w-9 h-9 rounded-xl font-extrabold text-lg flex items-center justify-center transition-all border shrink-0 ${
            isDotted ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-800 border-amber-200'
          }`}
          title="Agregar puntillo"
        >
          .
        </button>

        {/* Alteraciones */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 shadow-sm shrink-0">
          {(['', '#', 'b', 'n'] as PitchAccidental[]).map(acc => (
            <button
              key={acc || 'nat'}
              onClick={() => setSelectedAccidental(selectedAccidental === acc ? '' : acc)}
              className={`w-8 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                selectedAccidental === acc 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-amber-50/50 text-slate-800 hover:bg-amber-100'
              }`}
            >
              {acc === '' ? '♮' : acc === '#' ? '♯' : acc === 'b' ? '♭' : '♮'}
            </button>
          ))}
        </div>

        {/* Control de Octava */}
        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-amber-200 shadow-sm shrink-0 font-bold">
          <button 
            onClick={() => setSelectedOctave(o => Math.max(1, o - 1))}
            className="w-6 h-6 rounded bg-amber-100 text-amber-900 flex items-center justify-center hover:bg-amber-200"
          >
            -
          </button>
          <span className="text-slate-900 font-mono text-xs px-1">Oct {selectedOctave}</span>
          <button 
            onClick={() => setSelectedOctave(o => Math.min(7, o + 1))}
            className="w-6 h-6 rounded bg-amber-100 text-amber-900 flex items-center justify-center hover:bg-amber-200"
          >
            +
          </button>
        </div>
      </div>

      {/* 2. Teclado Musical de Notas (C D E F G A B + R) y Botón de Borrado */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <div className="flex-1 flex items-center gap-1">
          {notes.map(note => {
            const pitchStr = `${note.toLowerCase()}${selectedAccidental}/${selectedOctave}`;
            return (
              <button
                key={note}
                onClick={() => onAddNote(pitchStr)}
                className="flex-1 min-w-[38px] h-14 bg-white hover:bg-amber-100/80 active:bg-amber-200 border-2 border-slate-300 hover:border-amber-400 rounded-xl flex flex-col items-center justify-end pb-1.5 shadow-sm transition-all text-slate-900 font-extrabold"
              >
                <span className="text-xs">{note}</span>
                <span className="text-[10px] text-amber-800 font-mono font-medium">{selectedAccidental}{selectedOctave}</span>
              </button>
            );
          })}

          {/* Silencio */}
          <button
            onClick={() => onAddNote('R')}
            className="min-w-[44px] h-14 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 rounded-xl flex flex-col items-center justify-center shadow-sm transition-all text-amber-900 font-extrabold"
            title="Insertar Silencio"
          >
            <span className="text-sm">𝄽</span>
            <span className="text-[10px]">Rest</span>
          </button>
        </div>

        {/* Botón Borrar */}
        <button
          onClick={onDeleteLastNote}
          className="w-12 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-rose-600/20 font-bold transition-all shrink-0"
          title="Borrar última nota"
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
};
