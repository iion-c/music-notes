import React, { useEffect, useRef, useState } from 'react';
import type { StaveBlock } from '../../types/music';
import { convertJsonToMusicXML, ScoreData } from '../../services/musicxml';
import { editorOsmdHtml } from '../../services/webviewTemplates';

interface Props {
  staveBlock: StaveBlock;
  onUpdateStave?: (updated: StaveBlock) => void;
}

export const OsmdWebViewEditor: React.FC<Props> = ({ staveBlock, onUpdateStave }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Convertir StaveBlock a ScoreData para MusicXML 3.1
  const buildScoreData = (block: StaveBlock): ScoreData => {
    return {
      title: block.title || 'Ejercicio',
      composer: 'Music Notes',
      divisions: 4,
      parts: [
        {
          id: 'P1',
          name: 'Partitura',
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
      ]
    };
  };

  // Transmitir partitura MusicXML al iframe cuando el iframe o el bloque cambia
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const xmlString = convertJsonToMusicXML(buildScoreData(staveBlock));
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'LOAD_FILE', data: xmlString }),
        '*'
      );
    }
  }, [staveBlock, isLoaded]);

  // Escuchar mensajes provenientes del iframe OSMD
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg.type === 'WV_READY' || msg.type === 'LOAD_COMPLETE') {
          setIsLoaded(true);
        }
      } catch (e) {
        // ignora otros mensajes de extensiones
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="w-full bg-[#fdfbf7] rounded-2xl border border-amber-200 shadow-inner overflow-hidden min-h-[220px] flex flex-col items-center justify-center">
      <iframe
        ref={iframeRef}
        srcDoc={editorOsmdHtml}
        title="OpenSheetMusicDisplay Engine WebView"
        className="w-full h-[260px] border-none"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};
