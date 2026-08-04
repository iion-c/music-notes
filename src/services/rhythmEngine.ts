import { ScoreData, ScoreMeasure, ScoreNote } from './musicxml';

export const getMeasureCapacity = (scoreData: ScoreData): number => {
  if (!scoreData.timeSignature) return 16; // Por defecto 4/4 (4 beats * 4 semicorcheas = 16)
  const { beats, beatType } = scoreData.timeSignature;
  return (beats / beatType) * 16; 
};

export const getMeasureCapacityIn16ths = (timeSignature: string = '4/4'): number => {
  const parts = timeSignature.split('/');
  const beats = parseInt(parts[0] || '4', 10);
  const beatType = parseInt(parts[1] || '4', 10);
  return (beats / beatType) * 16;
};

export const getRestTypeForCapacity = (capacity: number): { xmlType: string, dotted?: boolean } => {
  switch(capacity) {
    case 16: return { xmlType: 'whole' };
    case 12: return { xmlType: 'whole' };
    case 8: return { xmlType: 'whole' };
    case 6: return { xmlType: 'quarter', dotted: true };
    case 4: return { xmlType: 'quarter' };
    case 2: return { xmlType: 'eighth' };
    case 24: return { xmlType: 'whole', dotted: true };
    default: return { xmlType: 'whole' };
  }
};

export interface FlatNote extends ScoreNote {
  absoluteStartBeat: number;
  isChord?: boolean;
}

export const getNoteVisuals = (duration: number): { xmlType: string, dotted?: boolean } => {
  switch (duration) {
    case 32: return { xmlType: 'breve' };
    case 24: return { xmlType: 'whole', dotted: true };
    case 16: return { xmlType: 'whole' };
    case 12: return { xmlType: 'half', dotted: true };
    case 8:  return { xmlType: 'half' };
    case 6:  return { xmlType: 'quarter', dotted: true };
    case 4:  return { xmlType: 'quarter' };
    case 3:  return { xmlType: 'eighth', dotted: true };
    case 2:  return { xmlType: 'eighth' };
    case 1:  return { xmlType: '16th' };
    default:
      if (duration >= 32) return { xmlType: 'breve' };
      if (duration >= 24) return { xmlType: 'whole', dotted: true };
      if (duration >= 16) return { xmlType: 'whole' };
      if (duration >= 12) return { xmlType: 'half', dotted: true };
      if (duration >= 8)  return { xmlType: 'half' };
      if (duration >= 6)  return { xmlType: 'quarter', dotted: true };
      if (duration >= 4)  return { xmlType: 'quarter' };
      if (duration >= 3)  return { xmlType: 'eighth', dotted: true };
      if (duration >= 2)  return { xmlType: 'eighth' };
      return { xmlType: '16th' };
  }
};

function getRestSubdivisions(offsetInMeasure: number, duration: number, timeSignature?: { beats: number, beatType: number }): number[] {
  const beats = timeSignature?.beats ?? 4;
  const beatType = timeSignature?.beatType ?? 4;
  const measureCapacity = (beats / beatType) * 16;

  if (offsetInMeasure === 0 && duration >= measureCapacity) {
    return [measureCapacity];
  }

  const chunks: number[] = [];
  let currentOffset = offsetInMeasure;
  let remaining = duration;

  while (remaining > 0) {
    let bestChunk = 1;
    const candidates = [16, 8, 4, 2, 1];
    for (const d of candidates) {
      if (d <= remaining) {
        let isValid = false;
        if (d === 16 && currentOffset === 0) isValid = true;
        else if (d === 8 && (currentOffset === 0 || currentOffset === 8)) isValid = true;
        else if (d === 4 && currentOffset % 4 === 0) isValid = true;
        else if (d === 2 && currentOffset % 2 === 0) isValid = true;
        else if (d === 1) isValid = true;

        if (isValid) { bestChunk = d; break; }
      }
    }

    chunks.push(bestChunk);
    currentOffset += bestChunk;
    remaining -= dBest(bestChunk);
  }

  return chunks;
}

function dBest(val: number) { return val; }

export function overwriteDuration(
  scoreData: ScoreData, 
  partIndex: number,
  globalNoteIndex: number, 
  newPitch: string, 
  newDurationValue: number
): { scoreData: ScoreData, nextIndex: number } {
  const targetPart = scoreData.parts[partIndex];
  let flatNotes: FlatNote[] = [];
  let currentBeat = 0;

  targetPart.measures.forEach(measure => {
    measure.notes.forEach(note => {
      flatNotes.push({ ...note, absoluteStartBeat: currentBeat });
      if (!note.isChord) currentBeat += note.duration;
    });
  });

  if (globalNoteIndex < 0 || globalNoteIndex >= flatNotes.length) {
    return appendNote(scoreData, partIndex, newPitch, newDurationValue);
  }

  const targetNote = flatNotes[globalNoteIndex];
  targetNote.pitch = newPitch;
  targetNote.duration = newDurationValue;
  targetNote.type = newPitch === 'R' ? 'rest' : 'note';
  targetNote.xmlType = getNoteVisuals(newDurationValue).xmlType;

  return { scoreData, nextIndex: globalNoteIndex + 1 };
}

export function appendNote(
  scoreData: ScoreData, 
  partIndex: number, 
  newPitch: string, 
  newDurationValue: number
): { scoreData: ScoreData, nextIndex: number } {
  const targetPart = scoreData.parts[partIndex];
  const firstRestIndex = targetPart.measures.flatMap(m => m.notes).findIndex(n => n.type === 'rest');
  
  if (firstRestIndex !== -1) {
    return overwriteDuration(scoreData, partIndex, firstRestIndex, newPitch, newDurationValue);
  }

  return { scoreData, nextIndex: 0 };
}
