import React, { useRef, useState } from 'react';
import { TextAlignCenter as AlignCenter, TextAlignStart as AlignLeft, TextAlignEnd as AlignRight, Camera, ImagePlus, LoaderCircle as Loader2 } from 'lucide-react';
import type { ImageBlock } from '../../../types/notes';
import { compressImage } from '../../../lib/image';
import { useStore } from '../../../store';

export function ImageView({ block, onChange, active }: { block: ImageBlock; onChange: (b: ImageBlock) => void; active: boolean }) {
  const { toast } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const width = block.widthPct ?? (block.alignment === 'full' ? 100 : 80);
  const align = block.alignment === 'left' ? 'flex-start' : block.alignment === 'right' ? 'flex-end' : 'center';

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Ese archivo no es una imagen', 'error');
    setBusy(true);
    try {
      onChange({ ...block, src: await compressImage(file), timestamp: Date.now() });
    } catch {
      toast('No se pudo leer la imagen', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!block.src) {
    return (
      <div
        className="no-print flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed font-ui text-sm"
        style={{ minHeight: 'calc(var(--rule) * 4)', borderColor: 'var(--paper-line)', color: 'var(--ink-soft)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFile(e.dataTransfer.files?.[0]);
        }}
      >
        {busy ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="btn btn-outline" onClick={() => input.current?.click()}>
                <ImagePlus size={16} /> Elegir imagen
              </button>
              <label className="btn btn-outline cursor-pointer sm:hidden">
                <Camera size={16} /> Foto de la pizarra
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
              </label>
            </div>
            <span className="text-xs">o arrástrala aquí · también puedes pegarla con Ctrl+V</span>
          </>
        )}
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <figure className="m-0 flex flex-col" style={{ alignItems: align }}>
      <img src={block.src} alt={block.caption || 'Imagen del apunte'} className="block rounded-sm" style={{ width: `${width}%`, maxWidth: '100%', boxShadow: '0 1px 4px rgba(0,0,0,.18)' }} />
      <figcaption className="w-full" style={{ width: `${width}%` }}>
        <input
          value={block.caption}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder={active ? 'Pie de foto…' : ''}
          className="hand-input paper-text text-center"
          style={{ fontSize: 'calc(var(--paper-size) * 0.85)', color: 'var(--ink-soft)' }}
        />
      </figcaption>
      {active && (
        <div className="no-print popover mt-1 flex items-center gap-1 self-center p-1 font-ui">
          {([
            ['left', AlignLeft],
            ['center', AlignCenter],
            ['right', AlignRight],
          ] as const).map(([a, Icon]) => (
            <button key={a} className="icon-btn !h-8 !w-8" aria-pressed={(block.alignment || 'center') === a} onClick={() => onChange({ ...block, alignment: a })} aria-label={`Alinear ${a}`}>
              <Icon size={15} />
            </button>
          ))}
          <input
            type="range"
            min={25}
            max={100}
            step={5}
            value={width}
            onChange={(e) => onChange({ ...block, widthPct: parseInt(e.target.value, 10) })}
            className="mx-2 w-28"
            style={{ accentColor: 'var(--accent)' }}
            aria-label="Tamaño de la imagen"
          />
          <button className="btn btn-ghost !min-h-[32px] text-xs" onClick={() => input.current?.click()}>
            Cambiar
          </button>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
      )}
    </figure>
  );
}
