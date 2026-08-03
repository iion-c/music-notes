import { Renderer, Stave, StaveNote, Accidental, Dot, Beam, Voice, Formatter, Barline } from 'vexflow';
import type { MeasureData, StaveBlock } from '../types/music';

export interface RenderOptions {
  activeNotePos?: { measureIndex: number; noteIndex: number } | null;
  interactive?: boolean;
  width?: number;
  scale?: number;
}

export function renderStaveToContainer(
  container: HTMLDivElement,
  staveBlock: StaveBlock,
  options: RenderOptions = {}
): void {
  // Limpiar el contenedor SVG
  container.innerHTML = '';

  const scale = options.scale || 1.0;
  const containerWidth = container.clientWidth || 800;

  // Filtrar compases según el rango configurado (custom o todos)
  let measuresToRender: MeasureData[] = staveBlock.measures;
  if (
    staveBlock.displayRange.mode === 'custom' &&
    staveBlock.displayRange.startMeasure &&
    staveBlock.displayRange.endMeasure
  ) {
    const start = Math.max(0, staveBlock.displayRange.startMeasure - 1);
    const end = Math.min(staveBlock.measures.length, staveBlock.displayRange.endMeasure);
    measuresToRender = staveBlock.measures.slice(start, end);
  }

  if (measuresToRender.length === 0) {
    container.innerHTML = '<div class="p-4 text-slate-400 text-center italic">No hay compases seleccionados para desplegar</div>';
    return;
  }

  // Calcular dimensiones de compases
  const numMeasures = measuresToRender.length;
  const measureWidth = Math.max(220, Math.floor((containerWidth - 40) / Math.min(numMeasures, 4)));
  
  // Calcular cuántos compases entran por línea
  const measuresPerLine = Math.max(1, Math.floor(containerWidth / measureWidth));
  const totalLines = Math.ceil(numMeasures / measuresPerLine);

  const staveHeight = 160;
  const rendererWidth = Math.min(containerWidth, measuresPerLine * measureWidth + 30);
  const rendererHeight = totalLines * staveHeight + 20;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(rendererWidth * scale, rendererHeight * scale);
  const context = renderer.getContext();
  context.scale(scale, scale);

  let currentX = 15;
  let currentY = 10;

  for (let idx = 0; idx < numMeasures; idx++) {
    const measure = measuresToRender[idx];
    const isFirstInLine = idx % measuresPerLine === 0;
    
    if (idx > 0 && isFirstInLine) {
      currentX = 15;
      currentY += staveHeight;
    }

    const currentMeasureWidth = (idx === numMeasures - 1 && isFirstInLine) ? 300 : measureWidth;

    const stave = new Stave(currentX, currentY, currentMeasureWidth);

    // Agregar clave, métrica y armadura en el primer compás de cada línea o si cambia
    if (isFirstInLine) {
      const clef = measure.clef || staveBlock.clef || 'treble';
      stave.addClef(clef);

      const keySig = measure.keySignature || staveBlock.keySignature || 'C';
      stave.addKeySignature(keySig);

      const timeSig = measure.timeSignature || staveBlock.timeSignature || '4/4';
      stave.addTimeSignature(timeSig);
    }

    // Dibujar barra final en el último compás
    if (idx === numMeasures - 1) {
      stave.setEndBarType(Barline.type.END);
    }

    stave.setContext(context).draw();

    // Renderizar notas del compás
    if (measure.notes && measure.notes.length > 0) {
      try {
        const vexNotes: StaveNote[] = [];

        measure.notes.forEach((n, noteIndex) => {
          const keys = n.isRest 
            ? (staveBlock.clef === 'bass' ? ['f/3'] : ['b/4'])
            : (n.keys && n.keys.length > 0 ? n.keys : ['c/4']);

          const durationStr = n.isRest ? `${n.duration}r` : n.duration;

          const staveNote = new StaveNote({
            clef: measure.clef || staveBlock.clef || 'treble',
            keys: keys,
            duration: durationStr
          });

          // Agregar alteraciones
          if (!n.isRest && n.accidental) {
            const accSymbol = n.accidental === 'n' ? 'n' : n.accidental;
            keys.forEach((_, kIdx) => {
              staveNote.addModifier(new Accidental(accSymbol), kIdx);
            });
          }

          // Puntillos
          if (n.isDotted) {
            Dot.buildAndAttach([staveNote]);
          }

          // Resaltado visual de nota activa durante reproducción
          const isNoteActive = options.activeNotePos && 
            options.activeNotePos.measureIndex === (measure.measureNumber - 1) && 
            options.activeNotePos.noteIndex === noteIndex;

          if (isNoteActive) {
            staveNote.setStyle({ fillStyle: '#38bdf8', strokeStyle: '#38bdf8' });
          }

          vexNotes.push(staveNote);
        });

        // Generar Beams (barras de corcheas y semicorcheas)
        const beams = Beam.generateBeams(vexNotes);

        const timeSigParts = (staveBlock.timeSignature || '4/4').split('/');
        const voice = new Voice({
          numBeats: parseInt(timeSigParts[0], 10) || 4,
          beatValue: parseInt(timeSigParts[1], 10) || 4
        });
        voice.setStrict(false);
        voice.addTickables(vexNotes);

        new Formatter().joinVoices([voice]).format([voice], currentMeasureWidth - (isFirstInLine ? 80 : 30));

        voice.draw(context, stave);
        beams.forEach((beam: any) => beam.setContext(context).draw());

      } catch (err) {
        console.warn(`Error al formatear compás ${measure.measureNumber}:`, err);
      }
    }

    // Dibujar Análisis Armónico debajo del compás (Cifrado Romanos / Bajo cifrado)
    if (measure.harmonicAnalysis) {
      const ha = measure.harmonicAnalysis;
      const textX = currentX + (currentMeasureWidth / 2) - 15;
      const textY = currentY + 135;

      if (ha.romanNumeral) {
        context.save();
        context.setFont("Outfit, Inter, sans-serif", 13, "bold");
        context.setFillStyle("#38bdf8"); // Cyan resplandeciente
        context.fillText(ha.romanNumeral, textX, textY);
        context.restore();
      }

      if (ha.figuredBass) {
        context.save();
        context.setFont("Outfit, Inter, sans-serif", 10, "normal");
        context.setFillStyle("#94a3b8");
        context.fillText(ha.figuredBass, textX + 18, textY);
        context.restore();
      }

      if (ha.chordName) {
        context.save();
        context.setFont("Outfit, Inter, sans-serif", 11, "bold");
        context.setFillStyle("#a78bfa"); // Púrpura suave
        context.fillText(ha.chordName, currentX + 20, currentY - 5);
        context.restore();
      }
    }

    currentX += currentMeasureWidth;
  }
}
