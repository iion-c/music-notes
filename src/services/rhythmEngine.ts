import type { ScoreData, ScoreMeasure, ScoreNote, DurationType } from '../types/music';

export interface FlatNote extends ScoreNoteItem {
  absoluteStartBeat: number;
  isChord?: boolean;
}

export interface ScoreNoteItem {
  id: string;
  keys: string[];
  duration: number; // en semicorcheas (1 = 16th, 2 = 8th, 4 = quarter, 8 = half, 16 = whole, 32 = breve)
  type: 'note' | 'rest';
  xmlType?: string;
  dotted?: boolean;
  accidental?: string;
  dynamic?: string;
}

export const getMeasureCapacityIn16ths = (timeSignature: string = '4/4'): number => {
  const parts = timeSignature.split('/');
  const beats = parseInt(parts[0], 10) || 4;
  const beatType = parseInt(parts[1], 10) || 4;
  return (beats / beatType) * 16;
};

export const getNoteVisuals = (duration16ths: number): { durationType: DurationType; xmlType: string; dotted: boolean } => {
  switch (duration16ths) {
    case 32: return { durationType: 'w', xmlType: 'breve', dotted: false };
    case 24: return { durationType: 'w', xmlType: 'whole', dotted: true };
    case 16: return { durationType: 'w', xmlType: 'whole', dotted: false };
    case 12: return { durationType: 'h', xmlType: 'half', dotted: true };
    case 8:  return { durationType: 'h', xmlType: 'half', dotted: false };
    case 6:  return { durationType: 'q', xmlType: 'quarter', dotted: true };
    case 4:  return { durationType: 'q', xmlType: 'quarter', dotted: false };
    case 3:  return { durationType: '8', xmlType: 'eighth', dotted: true };
    case 2:  return { durationType: '8', xmlType: 'eighth', dotted: false };
    case 1:  return { durationType: '16', xmlType: '16th', dotted: false };
    default:
      if (duration16ths >= 16) return { durationType: 'w', xmlType: 'whole', dotted: false };
      if (duration16ths >= 8)  return { durationType: 'h', xmlType: 'half', dotted: false };
      if (duration16ths >= 4)  return { durationType: 'q', xmlType: 'quarter', dotted: false };
      if (duration16ths >= 2)  return { durationType: '8', xmlType: 'eighth', dotted: false };
      return { durationType: '16', xmlType: '16th', dotted: false };
  }
};

export function getRestSubdivisions(offsetInMeasure: number, duration: number, timeSignature: string = '4/4'): number[] {
  const parts = timeSignature.split('/');
  const beats = parseInt(parts[0], 10) || 4;
  const beatType = parseInt(parts[1], 10) || 4;
  const measureCapacity = (beats / beatType) * 16;

  if (offsetInMeasure === 0 && duration >= measureCapacity) {
    return [measureCapacity];
  }

  const chunks: number[] = [];
  let currentOffset = offsetInMeasure;
  let remaining = duration;

  while (remaining > 0) {
    let bestChunk = 1;
    const candidates = [16, 12, 8, 6, 4, 3, 2, 1];
    for (const d of candidates) {
      if (d <= remaining) {
        let isValid = false;
        if (d === 16 && currentOffset === 0) isValid = true;
        else if (d === 8 && currentOffset % 8 === 0) isValid = true;
        else if (d === 4 && currentOffset % 4 === 0) isValid = true;
        else if (d === 2 && currentOffset % 2 === 0) isValid = true;
        else if (d === 1) isValid = true;

        if (isValid) {
          bestChunk = d;
          break;
        }
      }
    }

    chunks.push(bestChunk);
    currentOffset += bestChunk;
    remaining -= bestChunk;
  }

  return chunks;
}
