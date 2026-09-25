import React, { useEffect, useRef, useState } from 'react';
import { Download, PenLine, Play, Square } from 'lucide-react';
import type { StaveBlock } from '../../../types/music';
import { CLEF_NAMES, KEY_SIGNATURES } from '../../../types/music';
import { ScorePreview, type ScorePreviewHandle } from '../../stave/ScorePreview';
import { audioSynth } from '../../../services/audioSynth';
import { countNotes, measureCount } from '../../../lib/score';
import { downloadBlob, svgToPngBlob } from '../../../lib/image';
import { useStore } from '../../../store';

interface Props {
  stave: StaveBlock;
  onChange: (s: StaveBlock) => void;
  onOpenEditor: () => void;
  active: boolean;
  ink: string;
  paperColor: string;
}

export function StaveView({ stave, onChange, onOpenEditor, active, ink, paperColor }: Props) {
  const { toast } = useStore();
  const preview = useRef<ScorePreviewHandle>(null);
  const [playing, setPlaying] = useState(false);
  const notes = countNotes(stave);
  const total = measureCount(stave);

  useEffect(() => () => audioSynth.stop(), []);

  const togglePlay = () => {
    if (playing) {
      audioSynth.stop();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    audioSynth.playStave(stave, () => setPlaying(false));
  };

  const download = async (kind: 'png' | 'svg') => {
    const res = await preview.current?.exportSvg();
    if (!res) return toast('No se pudo exportar el pentagrama', 'error');
    const name = (stave.title || 'pentagrama').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-');
    if (kind === 'svg') downloadBlob(new Blob([res.svg], { type: 'image/svg+xml' }), `${name}.svg`);
    else downloadBlob(await svgToPngBlob(res.svg, res.width, res.height, paperColor), `${name}.png`);
  };

  const key = KEY_SIGNATURES.find((k) => k.code === stave.keySignature);

  return (
    <div>
      <div className="flex items-center gap-2" style={{ minHeight: 'var(--rule)' }}>
        <input
          value={stave.title}
          onChange={(e) => onChange({ ...stave, title: e.target.value, updatedAt: Date.now() })}
          placeholder={active ? 'Título del ejemplo (p. ej. Cadencia perfecta en Re M)' : ''}
          className="hand-input paper-text min-w-0 flex-1"
          style={{ fontWeight: 600 }}
          aria-label="Título del pentagrama"
        />
        <span className="hidden shrink-0 font-ui text-[11px] sm:inline" style={{ color: 'var(--ink-soft)' }}>
          {stave.staffMode === 'grand' ? 'Sistema de piano' : CLEF_NAMES[stave.clef]} · {stave.timeSignature} · {key?.name.split(' (')[0] || stave.keySignature}
        </span>
      </div>

      <div className="group/score relative">
        <ScorePreview ref={preview} block={stave} color={ink} />
        {/* La partitura está en un iframe: esta capa captura el toque para abrir el editor. */}
        <button
          className="absolute inset-0 cursor-pointer rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
          onClick={onOpenEditor}
          aria-label="Editar pentagrama con el lápiz"
        >
          {notes === 0 && (
            <span className="no-print font-ui absolute right-1 top-0 rounded-full px-3 py-1 text-xs font-semibold opacity-90" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              Toca para escribir notas
            </span>
          )}
        </button>
      </div>

      {active && (
        <div className="no-print flex flex-wrap items-center gap-1 pt-1 font-ui">
          <button className="btn btn-primary !min-h-[32px] text-xs" onClick={onOpenEditor}>
            <PenLine size={14} /> Editar con lápiz
          </button>
          <button className="btn btn-outline !min-h-[32px] text-xs" onClick={togglePlay} disabled={notes === 0}>
            {playing ? <Square size={13} /> : <Play size={13} />} {playing ? 'Detener' : 'Escuchar'}
          </button>
          <button className="btn btn-ghost !min-h-[32px] text-xs" onClick={() => void download('png')}>
            <Download size={13} /> PNG
          </button>
          <button className="btn btn-ghost !min-h-[32px] text-xs" onClick={() => void download('svg')}>
            SVG
          </button>
          <span className="ml-auto text-[11px]" style={{ color: 'var(--ink-soft)' }}>
            {total} compases{stave.displayRange.mode === 'custom' ? ` · mostrando ${stave.displayRange.startMeasure}–${stave.displayRange.endMeasure}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
