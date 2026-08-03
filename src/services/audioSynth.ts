import { MusicNoteItem, StaveBlock, DurationType } from '../types/music';

// Convierte nota VexFlow ("c/4", "f#/5", "bb/3") a frecuencia en Hz
export function vexKeyToFreq(vexKey: string): number {
  const parts = vexKey.split('/');
  if (parts.length < 2) return 440;
  
  let noteStr = parts[0].toLowerCase();
  const octave = parseInt(parts[1], 10) || 4;

  const noteMap: Record<string, number> = {
    'c': 0, 'c#': 1, 'db': 1,
    'd': 2, 'd#': 3, 'eb': 3,
    'e': 4,
    'f': 5, 'f#': 6, 'gb': 6,
    'g': 7, 'g#': 8, 'ab': 8,
    'a': 9, 'a#': 10, 'bb': 10,
    'b': 11
  };

  const semitone = noteMap[noteStr] ?? 0;
  // MIDI note number for C0 is 12, C4 is 60 (A4 is 69 = 440Hz)
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Duración en segundos dada la figura y el BPM (basado en 4/4)
export function getDurationInSeconds(duration: DurationType, isDotted: boolean = false, bpm: number = 120): number {
  const beatSec = 60 / bpm; // Tiempo de una negra en segundos
  let beats = 1;
  switch (duration) {
    case 'w': beats = 4; break;
    case 'h': beats = 2; break;
    case 'q': beats = 1; break;
    case '8': beats = 0.5; break;
    case '16': beats = 0.25; break;
    case '32': beats = 0.125; break;
  }
  if (isDotted) beats *= 1.5;
  return beats * beatSec;
}

export type InstrumentType = 'piano' | 'synth' | 'organ' | 'flute';

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTimeout: number | null = null;
  public bpm: number = 100;
  public instrument: InstrumentType = 'piano';

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playTone(freq: number, durationSec: number, volume: number = 0.3): void {
    if (freq <= 0) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (this.instrument === 'piano') {
      osc.type = 'triangle';
    } else if (this.instrument === 'synth') {
      osc.type = 'sawtooth';
    } else if (this.instrument === 'organ') {
      osc.type = 'square';
    } else {
      osc.type = 'sine';
    }

    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envolvente ADSR suave para evitar clics de audio
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02); // Attack
    gain.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.1); // Decay
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec); // Release

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  public playNote(note: MusicNoteItem, bpm?: number): void {
    if (note.isRest) return;
    const currentBpm = bpm || this.bpm;
    const durationSec = getDurationInSeconds(note.duration, note.isDotted, currentBpm);
    note.keys.forEach(key => {
      const freq = vexKeyToFreq(key);
      this.playTone(freq, durationSec, 0.35);
    });
  }

  public playClick(high: boolean = false): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(high ? 1000 : 600, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  public async playStaveBlock(
    stave: StaveBlock, 
    onNoteActive?: (measureIndex: number, noteIndex: number | null) => void,
    onFinish?: () => void
  ): Promise<void> {
    this.stopPlayback();
    this.isPlaying = true;

    // Determinar compases a reproducir según el rango de despliegue
    let measuresToPlay = stave.measures;
    if (stave.displayRange.mode === 'custom' && stave.displayRange.startMeasure && stave.displayRange.endMeasure) {
      const start = Math.max(0, stave.displayRange.startMeasure - 1);
      const end = Math.min(stave.measures.length, stave.displayRange.endMeasure);
      measuresToPlay = stave.measures.slice(start, end);
    }

    let delayAccumulator = 0;

    for (let mIdx = 0; mIdx < measuresToPlay.length; mIdx++) {
      const measure = measuresToPlay[mIdx];
      const actualMeasureIndex = measure.measureNumber - 1;

      for (let nIdx = 0; nIdx < measure.notes.length; nIdx++) {
        if (!this.isPlaying) return;
        const note = measure.notes[nIdx];
        const durationSec = getDurationInSeconds(note.duration, note.isDotted, this.bpm);

        const currentDelay = delayAccumulator;

        // Programar resaltado visual y reproducción
        this.currentTimeout = window.setTimeout(() => {
          if (!this.isPlaying) return;
          if (onNoteActive) onNoteActive(actualMeasureIndex, nIdx);
          this.playNote(note, this.bpm);
        }, currentDelay * 1000);

        delayAccumulator += durationSec;
      }
    }

    // Programar finalización
    this.currentTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      if (onNoteActive) onNoteActive(-1, null);
      if (onFinish) onFinish();
    }, delayAccumulator * 1000);
  }

  public stopPlayback(): void {
    this.isPlaying = false;
    if (this.currentTimeout !== null) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioSynth = new AudioSynthService();
