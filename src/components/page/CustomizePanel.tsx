import React, { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import type { Notebook, NotePage, PageLayout, PaperFont, PaperStyle, PaperTone } from '../../types/notes';
import { INKS, PAPER_FONTS, PAPER_PATTERNS, PAPER_TONES, effectiveInk, paperVars, patternClass, resolvePaper } from '../../lib/paper';
import { useStore } from '../../store';
import { Segmented } from '../ui/primitives';

type Scope = 'page' | 'notebook' | 'global';

const LAYOUTS: { id: PageLayout; name: string; hint: string }[] = [
  { id: 'cornell', name: 'Cornell', hint: 'Claves a la izquierda, notas a la derecha y resumen abajo (Pauk). Ideal para repasar.' },
  { id: 'outline', name: 'Esquema', hint: 'Ideas jerarquizadas con sangría (Tab). Rápido en clases muy estructuradas.' },
  { id: 'free', name: 'Libre', hint: 'Una sola columna con margen, como un cuaderno normal.' },
];

function LayoutGlyph({ id }: { id: PageLayout }) {
  const stroke = 'currentColor';
  return (
    <svg width="44" height="54" viewBox="0 0 44 54" aria-hidden>
      <rect x="1" y="1" width="42" height="52" rx="3" fill="none" stroke={stroke} opacity=".5" />
      {id === 'cornell' && (
        <>
          <line x1="14" y1="8" x2="14" y2="40" stroke="var(--accent)" strokeWidth="1.5" />
          <line x1="1" y1="40" x2="43" y2="40" stroke="var(--accent)" strokeWidth="1.5" />
          {[14, 20, 26, 32].map((y) => (
            <line key={y} x1="17" y1={y} x2="39" y2={y} stroke={stroke} opacity=".45" />
          ))}
          <line x1="4" y1="14" x2="11" y2="14" stroke={stroke} opacity=".7" />
          <line x1="4" y1="26" x2="11" y2="26" stroke={stroke} opacity=".7" />
          <line x1="5" y1="46" x2="36" y2="46" stroke={stroke} opacity=".45" />
        </>
      )}
      {id === 'outline' &&
        [
          [6, 12],
          [11, 18],
          [11, 24],
          [16, 30],
          [6, 38],
          [11, 44],
        ].map(([x, y]) => (
          <g key={y}>
            <circle cx={x} cy={y} r="1.3" fill={stroke} opacity=".7" />
            <line x1={x + 4} y1={y} x2="38" y2={y} stroke={stroke} opacity=".45" />
          </g>
        ))}
      {id === 'free' && (
        <>
          <line x1="9" y1="1" x2="9" y2="53" stroke="var(--accent)" strokeWidth="1" opacity=".8" />
          {[10, 16, 22, 28, 34, 40, 46].map((y) => (
            <line key={y} x1="12" y1={y} x2="39" y2={y} stroke={stroke} opacity=".45" />
          ))}
        </>
      )}
    </svg>
  );
}

interface Props {
  page: NotePage;
  notebook?: Notebook;
  onClose: () => void;
  onChangePage: (fn: (p: NotePage) => NotePage) => void;
}

export function CustomizePanel({ page, notebook, onClose, onChangePage }: Props) {
  const { settings, updateSettings, updateNotebook } = useStore();
  const [scope, setScope] = useState<Scope>('page');
  const style = resolvePaper(settings, notebook, page);

  const set = (patch: Partial<PaperStyle>) => {
    if (scope === 'page') onChangePage((p) => ({ ...p, paper: { ...(p.paper || {}), ...patch } }));
    else if (scope === 'notebook' && notebook) {
      updateNotebook(notebook.id, { paper: { ...(notebook.paper || {}), ...patch } });
      // Que la hoja actual no tape lo elegido para el cuaderno
      onChangePage((p) => ({ ...p, paper: stripKeys(p.paper, patch) }));
    } else {
      updateSettings({ paper: { ...settings.paper, ...patch } });
      onChangePage((p) => ({ ...p, paper: stripKeys(p.paper, patch) }));
      if (notebook?.paper) updateNotebook(notebook.id, { paper: stripKeys(notebook.paper, patch) });
    }
  };

  const reset = () => {
    onChangePage((p) => ({ ...p, paper: undefined }));
    if (scope !== 'page' && notebook) updateNotebook(notebook.id, { paper: undefined });
  };

  const dark = PAPER_TONES[style.tone].dark;

  return (
    <aside className="no-print flex h-full w-full flex-col bg-panel" aria-label="Personalizar hoja">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Personalizar</h2>
          <p className="text-xs text-muted">Los cambios se ven al instante en el papel</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar panel">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section>
          <h3 className="label">Método / diseño de la hoja</h3>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => onChangePage((p) => ({ ...p, layout: l.id }))}
                className="flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition-colors"
                style={{ borderColor: (page.layout || 'free') === l.id ? 'var(--accent)' : 'var(--border)', background: 'var(--raised)', color: (page.layout || 'free') === l.id ? 'var(--accent)' : 'var(--text)' }}
                aria-pressed={(page.layout || 'free') === l.id}
              >
                <LayoutGlyph id={l.id} />
                {l.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{LAYOUTS.find((l) => l.id === (page.layout || 'free'))?.hint}</p>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="label !mb-0">Aplicar el papel a</h3>
          </div>
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: 'page', label: 'Esta hoja' },
              { value: 'notebook', label: 'Cuaderno', title: notebook ? `Todas las hojas de ${notebook.name}` : undefined },
              { value: 'global', label: 'Todo' },
            ]}
          />
        </section>

        <section>
          <h3 className="label">Tipo de papel</h3>
          <div className="grid grid-cols-5 gap-1.5">
            {PAPER_PATTERNS.map((pt) => (
              <button key={pt.id} onClick={() => set({ pattern: pt.id })} title={pt.hint} className="flex flex-col items-center gap-1 text-[11px]" aria-pressed={style.pattern === pt.id}>
                <span
                  className={`block h-14 w-full rounded-md ${patternClass(pt.id)}`}
                  style={{
                    ...paperVars({ ...style, rule: 14 }),
                    background: undefined,
                    backgroundColor: PAPER_TONES[style.tone].paper,
                    boxShadow: style.pattern === pt.id ? '0 0 0 2px var(--accent)' : 'inset 0 0 0 1px var(--border)',
                  }}
                />
                <span className={style.pattern === pt.id ? 'font-semibold text-accent' : 'text-muted'}>{pt.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="label">Color del papel</h3>
          <div className="flex gap-2">
            {(Object.keys(PAPER_TONES) as PaperTone[]).map((t) => (
              <button key={t} onClick={() => set({ tone: t })} className="flex flex-1 flex-col items-center gap-1 text-[11px]" aria-pressed={style.tone === t}>
                <span className="block h-9 w-full rounded-md" style={{ background: PAPER_TONES[t].paper, boxShadow: style.tone === t ? '0 0 0 2px var(--accent)' : 'inset 0 0 0 1px var(--border)' }} />
                <span className={style.tone === t ? 'font-semibold text-accent' : 'text-muted'}>{PAPER_TONES[t].name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="label">Letra</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PAPER_FONTS) as PaperFont[]).map((f) => (
              <button
                key={f}
                onClick={() => set({ font: f })}
                className="rounded-lg border px-3 py-2 text-left"
                style={{ borderColor: style.font === f ? 'var(--accent)' : 'var(--border)', background: 'var(--raised)' }}
                aria-pressed={style.font === f}
              >
                <span className="block text-[19px] leading-tight" style={{ fontFamily: PAPER_FONTS[f].family, color: effectiveInk({ ...style, tone: 'white' }) }}>
                  Do Re Mi ♯ ♭
                </span>
                <span className="text-[11px] text-muted">{PAPER_FONTS[f].name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="label">Tinta</h3>
          <div className="flex flex-wrap gap-2">
            {INKS.map((i) => {
              const selected = style.ink.toLowerCase() === i.light.toLowerCase() || style.ink.toLowerCase() === i.dark.toLowerCase();
              return (
                <button key={i.id} onClick={() => set({ ink: i.light })} className="flex flex-col items-center gap-1 text-[10px]" aria-pressed={selected} title={i.name}>
                  <span className="block h-8 w-8 rounded-full" style={{ background: dark ? i.dark : i.light, boxShadow: selected ? '0 0 0 2px var(--panel), 0 0 0 4px var(--accent)' : undefined }} />
                  <span className={selected ? 'font-semibold text-accent' : 'text-muted'}>{i.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <label className="block">
            <span className="label flex justify-between">
              Tamaño de letra <span>{Math.round(style.textScale * 100)}%</span>
            </span>
            <input type="range" min={0.8} max={1.25} step={0.05} value={style.textScale} onChange={(e) => set({ textScale: parseFloat(e.target.value) })} className="w-full" style={{ accentColor: 'var(--accent)' }} />
          </label>
          <label className="block">
            <span className="label flex justify-between">
              Interlineado (alto del renglón) <span>{style.rule}px</span>
            </span>
            <input type="range" min={26} max={44} step={1} value={style.rule} onChange={(e) => set({ rule: parseInt(e.target.value, 10) })} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            <span className="mt-1 flex justify-between text-[10px] text-muted">
              <span>Compacto</span>
              <span>Universitario</span>
              <span>Amplio</span>
            </span>
          </label>
          {page.layout === 'cornell' && (
            <label className="block">
              <span className="label flex justify-between">
                Ancho de la columna de claves <span>{style.cueWidth}%</span>
              </span>
              <input type="range" min={20} max={38} step={1} value={style.cueWidth} onChange={(e) => set({ cueWidth: parseInt(e.target.value, 10) })} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </label>
          )}
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Línea de margen</span>
            <input type="checkbox" checked={style.marginLine} onChange={(e) => set({ marginLine: e.target.checked })} className="h-5 w-5" style={{ accentColor: 'var(--accent)' }} />
          </label>
        </section>

        <button className="btn btn-ghost w-full text-muted" onClick={reset}>
          <RotateCcw size={14} /> Restablecer {scope === 'page' ? 'esta hoja' : 'hoja y cuaderno'}
        </button>
      </div>
    </aside>
  );
}

function stripKeys<T extends object>(obj: T | undefined, patch: object): T | undefined {
  if (!obj) return obj;
  const out = { ...obj } as Record<string, unknown>;
  for (const k of Object.keys(patch)) delete out[k];
  return Object.keys(out).length ? (out as T) : undefined;
}
