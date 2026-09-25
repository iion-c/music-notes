import React from 'react';
import { Delete } from 'lucide-react';
import type { DurationType, PitchAccidental } from '../../types/music';
import { DURATION_NAMES, EDITOR_DURATIONS } from '../../types/music';

interface Props {
  duration: DurationType;
  setDuration: (d: DurationType) => void;
  dotted: boolean;
  setDotted: (v: boolean) => void;
  accidental: PitchAccidental;
  setAccidental: (a: PitchAccidental) => void;
  octave: number;
  setOctave: (o: number) => void;
  chord: boolean;
  setChord: (v: boolean) => void;
  onNote: (step: string) => void;
  onRest: () => void;
  onDelete: () => void;
}

const STEPS = [
  { step: 'C', solfa: 'Do' },
  { step: 'D', solfa: 'Re' },
  { step: 'E', solfa: 'Mi' },
  { step: 'F', solfa: 'Fa' },
  { step: 'G', solfa: 'Sol' },
  { step: 'A', solfa: 'La' },
  { step: 'B', solfa: 'Si' },
];

const SHORTCUT: Record<string, string> = { w: '5', h: '4', q: '3', '8': '2', '16': '1' };

/** Teclado de notación de ArmonIA: figura, puntillo, alteración, octava y notas. */
export function EditorKeyboard(p: Props) {
  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <div className="segmented shrink-0" role="group" aria-label="Figura">
          {EDITOR_DURATIONS.map((d) => (
            <button
              key={d}
              aria-pressed={p.duration === d}
              onClick={() => {
                p.setDuration(d);
                if (d === '16') p.setDotted(false);
              }}
              title={`${DURATION_NAMES[d].name} (tecla ${SHORTCUT[d]})`}
              className="!min-h-[40px] !px-2.5"
            >
              <span className="font-music text-[22px] leading-none">{DURATION_NAMES[d].symbol}</span>
            </button>
          ))}
        </div>
        <div className="segmented shrink-0">
          <button aria-pressed={p.dotted} onClick={() => p.setDotted(!p.dotted)} disabled={p.duration === '16'} title="Puntillo (tecla .)" className="!min-h-[40px] !px-3.5 !text-2xl font-bold leading-none">
            ·
          </button>
          <button aria-pressed={p.chord} onClick={() => p.setChord(!p.chord)} title="Acorde: apilar notas (tecla A)" className="!min-h-[40px]">
            Acorde
          </button>
        </div>
        <div className="segmented shrink-0" role="group" aria-label="Alteración">
          {([
            ['', 'Armadura', 'Según la armadura'],
            ['#', '♯', 'Sostenido (tecla #)'],
            ['b', '♭', 'Bemol (tecla B)'],
            ['n', '♮', 'Becuadro (tecla N)'],
          ] as [PitchAccidental, string, string][]).map(([a, label, title]) => (
            <button key={a || 'key'} aria-pressed={p.accidental === a} onClick={() => p.setAccidental(p.accidental === a ? '' : a)} title={title} className={`!min-h-[40px] ${a ? '!px-3 !text-lg' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="segmented shrink-0 items-center" role="group" aria-label="Octava">
          <button onClick={() => p.setOctave(Math.max(1, p.octave - 1))} title="Bajar octava (↓)" className="!min-h-[40px] !px-3">
            −
          </button>
          <span className="px-1.5 text-xs font-semibold text-muted">8ª {p.octave}</span>
          <button onClick={() => p.setOctave(Math.min(7, p.octave + 1))} title="Subir octava (↑)" className="!min-h-[40px] !px-3">
            +
          </button>
        </div>
      </div>

      <div className="flex items-stretch gap-1.5">
        {STEPS.map(({ step, solfa }) => (
          <button
            key={step}
            onClick={() => p.onNote(step)}
            className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-line bg-raised py-1.5 text-ink transition-colors hover:border-accent active:bg-accent-soft"
            style={{ minHeight: 52 }}
          >
            <span className="text-sm font-semibold">{solfa}</span>
            <span className="text-[10px] text-muted">
              {step}
              {p.accidental === '#' ? '♯' : p.accidental === 'b' ? '♭' : ''}
              {p.octave}
            </span>
          </button>
        ))}
        <button onClick={p.onRest} className="flex w-14 flex-col items-center justify-center rounded-lg border border-line bg-panel text-ink hover:border-accent" title="Silencio (tecla R)">
          <span className="font-music text-xl leading-none">𝄽</span>
          <span className="text-[10px] text-muted">Silencio</span>
        </button>
        <button onClick={p.onDelete} className="flex w-14 items-center justify-center rounded-lg text-white" style={{ background: 'var(--danger)' }} title="Borrar (Retroceso)" aria-label="Borrar nota">
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}
