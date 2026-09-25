import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Hand, Highlighter, Minus, PenLine, Plus, Trash2, Undo2 } from 'lucide-react';
import type { SketchBlock, Stroke } from '../../../types/notes';
import { INKS } from '../../../lib/paper';

const W = 1000;
const ROW_UNITS = 40;
const MARKERS = ['#ffd83d', '#7ee0a0', '#7cc4ff', '#ff9ecb', '#ffb266'];
const SIZES = [2.2, 4, 7];

function pathFor(points: number[]): string {
  if (points.length < 2) return '';
  if (points.length <= 4) {
    const [x, y] = points;
    return `M${x} ${y} L${points[points.length - 2] + 0.01} ${points[points.length - 1]}`;
  }
  let d = `M${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length - 2; i += 2) {
    const mx = (points[i] + points[i + 2]) / 2;
    const my = (points[i + 1] + points[i + 3]) / 2;
    d += ` Q${points[i]} ${points[i + 1]} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  d += ` L${points[points.length - 2]} ${points[points.length - 1]}`;
  return d;
}

function displayColor(color: string, dark: boolean): string {
  if (!dark) return color;
  const ink = INKS.find((i) => i.light.toLowerCase() === color.toLowerCase());
  return ink ? ink.dark : color;
}

interface Props {
  block: SketchBlock;
  onChange: (b: SketchBlock) => void;
  active: boolean;
  autoFocus: boolean;
  darkPaper: boolean;
  inkColor: string;
}

/** Dibujo a mano alzada con lápiz, marcador y borrador (ideal con stylus en tablet). */
export function SketchView({ block, onChange, active, autoFocus, darkPaper, inkColor }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const liveRef = useRef<SVGPathElement>(null);
  const [tool, setTool] = useState<'pen' | 'marker' | 'eraser' | 'hand'>(autoFocus ? 'pen' : 'hand');
  const [color, setColor] = useState(inkColor);
  const [marker, setMarker] = useState(MARKERS[0]);
  const [size, setSize] = useState(0);
  const drawing = useRef<{ points: number[]; pointerId: number } | null>(null);
  const penSeen = useRef(false);
  const strokesRef = useRef(block.strokes);
  strokesRef.current = block.strokes;

  const H = Math.max(3, block.rows) * ROW_UNITS;
  const drawMode = active && tool !== 'hand';

  // Al seleccionar el dibujo se toma el bolígrafo; al salir, se suelta para poder desplazarse.
  useEffect(() => {
    setTool(active ? 'pen' : 'hand');
  }, [active]);

  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) * W) / r.width * 10) / 10, Math.round(((e.clientY - r.top) * W) / r.width * 10) / 10];
  };

  const eraseAt = (x: number, y: number) => {
    const radius = 14;
    const keep = strokesRef.current.filter((s) => {
      for (let i = 0; i < s.points.length; i += 2) {
        if (Math.hypot(s.points[i] - x, s.points[i + 1] - y) < radius + s.width) return false;
      }
      return true;
    });
    if (keep.length !== strokesRef.current.length) {
      strokesRef.current = keep;
      onChange({ ...block, strokes: keep });
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (!drawMode) return;
    if (e.pointerType === 'pen') penSeen.current = true;
    else if (e.pointerType === 'touch' && penSeen.current) return; // rechazo de palma
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const [x, y] = toLocal(e);
    if (tool === 'eraser') {
      drawing.current = { points: [], pointerId: e.pointerId };
      eraseAt(x, y);
      return;
    }
    drawing.current = { points: [x, y], pointerId: e.pointerId };
    liveRef.current?.setAttribute('d', pathFor([x, y, x + 0.1, y]));
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drawing.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const events = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() || [e.nativeEvent];
    for (const ev of events) {
      const r = svgRef.current!.getBoundingClientRect();
      const x = Math.round(((ev.clientX - r.left) * W) / r.width * 10) / 10;
      const y = Math.round(((ev.clientY - r.top) * W) / r.width * 10) / 10;
      if (tool === 'eraser') eraseAt(x, y);
      else {
        const lx = d.points[d.points.length - 2];
        const ly = d.points[d.points.length - 1];
        if (Math.hypot(x - lx, y - ly) >= 1.2) d.points.push(x, y);
      }
    }
    if (tool !== 'eraser') liveRef.current?.setAttribute('d', pathFor(d.points));
  };

  const onUp = () => {
    const d = drawing.current;
    drawing.current = null;
    liveRef.current?.setAttribute('d', '');
    if (!d || tool === 'eraser' || d.points.length < 2) return;
    const stroke: Stroke =
      tool === 'marker'
        ? { tool: 'marker', color: marker, width: SIZES[size] * 4, points: d.points }
        : { tool: 'pen', color, width: SIZES[size], points: d.points };
    onChange({ ...block, strokes: [...strokesRef.current, stroke] });
  };

  const liveStyle =
    tool === 'marker'
      ? { stroke: marker, strokeWidth: SIZES[size] * 4, opacity: 0.45 }
      : { stroke: displayColor(color, darkPaper), strokeWidth: SIZES[size], opacity: 1 };

  return (
    <div className="relative">
      {active && (
        <div className="no-print popover mb-1 flex flex-wrap items-center gap-0.5 p-1 font-ui">
          {([
            ['hand', Hand, 'Desplazar (no dibuja)'],
            ['pen', PenLine, 'Bolígrafo'],
            ['marker', Highlighter, 'Marcatextos'],
            ['eraser', Eraser, 'Borrador de trazos'],
          ] as const).map(([t, Icon, label]) => (
            <button key={t} className="icon-btn !h-8 !w-8" aria-pressed={tool === t} title={label} aria-label={label} onClick={() => setTool(t)}>
              <Icon size={16} />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-line" />
          {(tool === 'marker' ? MARKERS : INKS.map((i) => i.light)).map((c) => {
            const selected = tool === 'marker' ? marker === c : color === c;
            return (
              <button
                key={c}
                className="flex h-8 w-7 items-center justify-center"
                onClick={() => (tool === 'marker' ? setMarker(c) : setColor(c))}
                aria-label={`Color ${c}`}
                aria-pressed={selected}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: 16,
                    height: 16,
                    background: tool === 'marker' ? c : displayColor(c, darkPaper),
                    boxShadow: selected ? '0 0 0 2px var(--raised), 0 0 0 4px var(--accent)' : 'inset 0 0 0 1px rgba(0,0,0,.15)',
                  }}
                />
              </button>
            );
          })}
          <span className="mx-1 h-5 w-px bg-line" />
          {SIZES.map((s, i) => (
            <button key={s} className="icon-btn !h-8 !w-8" aria-pressed={size === i} onClick={() => setSize(i)} aria-label={`Grosor ${i + 1}`}>
              <span className="block rounded-full bg-current" style={{ width: 3 + i * 3, height: 3 + i * 3 }} />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-line" />
          <button className="icon-btn !h-8 !w-8" title="Deshacer trazo" disabled={!block.strokes.length} onClick={() => onChange({ ...block, strokes: block.strokes.slice(0, -1) })}>
            <Undo2 size={16} />
          </button>
          <button
            className="icon-btn !h-8 !w-8"
            title="Borrar todo"
            disabled={!block.strokes.length}
            onClick={() => window.confirm('¿Borrar todo el dibujo?') && onChange({ ...block, strokes: [] })}
          >
            <Trash2 size={16} />
          </button>
          <span className="mx-1 h-5 w-px bg-line" />
          <button className="icon-btn !h-8 !w-8" title="Menos espacio" disabled={block.rows <= 3} onClick={() => onChange({ ...block, rows: block.rows - 2 })}>
            <Minus size={16} />
          </button>
          <button className="icon-btn !h-8 !w-8" title="Más espacio" disabled={block.rows >= 60} onClick={() => onChange({ ...block, rows: block.rows + 2 })}>
            <Plus size={16} />
          </button>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        style={{
          touchAction: drawMode ? 'none' : 'auto',
          cursor: drawMode ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default',
          outline: active ? '1px dashed color-mix(in srgb, var(--ink) 30%, transparent)' : 'none',
          outlineOffset: 2,
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label="Dibujo a mano"
      >
        {block.strokes.map((s, i) => (
          <path
            key={i}
            d={pathFor(s.points)}
            fill="none"
            stroke={s.tool === 'marker' ? s.color : displayColor(s.color, darkPaper)}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={s.tool === 'marker' ? 0.45 : 1}
            style={s.tool === 'marker' ? { mixBlendMode: darkPaper ? 'screen' : 'multiply' } : undefined}
          />
        ))}
        <path ref={liveRef} fill="none" strokeLinecap="round" strokeLinejoin="round" style={liveStyle} />
        {!block.strokes.length && !drawMode && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="22" fill="var(--ink-soft)" opacity="0.6" fontFamily="Inter, sans-serif">
            Toca para dibujar
          </text>
        )}
      </svg>
    </div>
  );
}
