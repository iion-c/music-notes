import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { StaveBlock } from '../../types/music';
import { staveToMusicXml } from '../../lib/score';
import { scorePreviewHtml } from '../../services/webviewTemplates';

export interface ScorePreviewHandle {
  exportSvg: () => Promise<{ svg: string; width: number; height: number } | null>;
}

interface Props {
  block: StaveBlock;
  color: string;
  zoom?: number;
}

/** Partitura de solo lectura dibujada por OSMD sobre el papel (fondo transparente). */
export const ScorePreview = forwardRef<ScorePreviewHandle, Props>(function ScorePreview({ block, color, zoom }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(120);
  const svgWaiter = useRef<((v: { svg: string; width: number; height: number } | null) => void) | null>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      try {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (msg.type === 'WV_READY') setReady(true);
        else if (msg.type === 'SIZE' && msg.data?.height) setHeight(Math.max(60, msg.data.height));
        else if (msg.type === 'SVG') {
          svgWaiter.current?.(msg.data);
          svgWaiter.current = null;
        }
      } catch {
        /* mensajes ajenos */
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const xml = React.useMemo(() => staveToMusicXml(block, { applyRange: true }), [block]);

  useEffect(() => {
    if (!ready) return;
    frame.current?.contentWindow?.postMessage(JSON.stringify({ type: 'LOAD_FILE', data: xml, color, zoom }), '*');
  }, [ready, xml, color, zoom]);

  useImperativeHandle(ref, () => ({
    exportSvg: () =>
      new Promise((resolve) => {
        svgWaiter.current = resolve;
        frame.current?.contentWindow?.postMessage(JSON.stringify({ type: 'EXPORT_SVG' }), '*');
        setTimeout(() => {
          if (svgWaiter.current === resolve) {
            svgWaiter.current = null;
            resolve(null);
          }
        }, 3000);
      }),
  }));

  return (
    <div className="relative w-full">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center font-ui text-xs" style={{ color: 'var(--ink-soft)' }}>
          Cargando pentagrama…
        </div>
      )}
      <iframe
        ref={frame}
        srcDoc={scorePreviewHtml}
        title="Pentagrama"
        className="block w-full border-0"
        style={{ height, background: 'transparent', colorScheme: 'normal' }}
        sandbox="allow-scripts"
        tabIndex={-1}
      />
    </div>
  );
});
