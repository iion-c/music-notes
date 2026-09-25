import type { DurationType, MeasureData, StaveBlock } from '../types/music';
import { capacityOf, durationTo16ths, measureCount } from '../lib/score';

/** "c/4", "f#/5", "bb/3", "fn/4" → frecuencia en Hz (La4 = 440). */
export function vexKeyToFreq(vexKey: string): number {
  const [p, o] = vexKey.split('/');
  if (!p) return 440;
  const octave = parseInt(o, 10) || 4;
  const base: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const step = p.charAt(0).toLowerCase();
  const acc = p.slice(1).toLowerCase();
  const semitone = (base[step] ?? 0) + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export type InstrumentType = 'piano' | 'synth' | 'organ' | 'flute';

interface NoteEvent {
  at: number; // segundos desde el inicio
  dur: number;
  keys: string[];
}

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private endTimer: number | null = null;
  public bpm = 90;
  public instrument: InstrumentType = 'piano';

  private getContext(): AudioContext {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private voice(freq: number, start: number, dur: number, vol = 0.22) {
    const ctx = this.getContext();
    const out = ctx.createGain();
    out.connect(this.master!);
    const t0 = start;
    const t1 = start + Math.max(0.08, dur);

    const partials: { type: OscillatorType; mult: number; gain: number }[] =
      this.instrument === 'piano'
        ? [{ type: 'triangle', mult: 1, gain: 1 }, { type: 'sine', mult: 2, gain: 0.35 }, { type: 'sine', mult: 3, gain: 0.12 }]
        : this.instrument === 'organ'
          ? [{ type: 'sine', mult: 1, gain: 0.8 }, { type: 'sine', mult: 2, gain: 0.5 }, { type: 'sine', mult: 4, gain: 0.25 }]
          : this.instrument === 'synth'
            ? [{ type: 'sawtooth', mult: 1, gain: 0.55 }]
            : [{ type: 'sine', mult: 1, gain: 1 }];

    if (this.instrument === 'piano') {
      // Ataque rápido y caída natural, como una cuerda percutida.
      out.gain.setValueAtTime(0.0001, t0);
      out.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      out.gain.exponentialRampToValueAtTime(vol * 0.35, t0 + Math.min(0.6, dur));
      out.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.25);
    } else {
      out.gain.setValueAtTime(0.0001, t0);
      out.gain.exponentialRampToValueAtTime(vol * 0.8, t0 + 0.04);
      out.gain.setValueAtTime(vol * 0.8, Math.max(t0 + 0.05, t1 - 0.06));
      out.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.08);
    }

    let target: AudioNode = out;
    if (this.instrument === 'synth') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      lp.connect(out);
      target = lp;
    }

    for (const p of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(freq * p.mult, t0);
      if (this.instrument === 'flute') {
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = 5;
        depth.gain.value = freq * 0.006;
        lfo.connect(depth).connect(osc.frequency);
        lfo.start(t0);
        lfo.stop(t1 + 0.3);
        this.sources.push(lfo);
      }
      g.gain.value = p.gain;
      osc.connect(g).connect(target);
      osc.start(t0);
      osc.stop(t1 + 0.3);
      osc.addEventListener('ended', () => {
        const i = this.sources.indexOf(osc);
        if (i >= 0) this.sources.splice(i, 1);
      });
      this.sources.push(osc);
    }
  }

  /** Suena una nota o acorde de inmediato (al escribir en el pentagrama). */
  public preview(keys: string[], duration: DurationType = 'q', dotted = false) {
    const ctx = this.getContext();
    const dur = Math.min(1.2, (durationTo16ths(duration, dotted) / 4) * (60 / this.bpm));
    keys.forEach((k) => this.voice(vexKeyToFreq(k), ctx.currentTime + 0.005, dur, 0.2));
  }

  private eventsFor(measures: MeasureData[], cap: number, start: number, end: number): NoteEvent[] {
    const beat = 60 / this.bpm; // negra
    const events: NoteEvent[] = [];
    let t = 0;
    for (let i = start; i < end; i++) {
      const m = measures[i];
      if (!m || m.notes.length === 0) {
        t += (cap / 4) * beat;
        continue;
      }
      for (const n of m.notes) {
        const dur = (durationTo16ths(n.duration, n.isDotted) / 4) * beat;
        if (!n.isRest) events.push({ at: t, dur, keys: n.keys });
        t += dur;
      }
    }
    return events;
  }

  /** Reproduce el pentagrama (ambos pentagramas si es sistema de piano). */
  public playStave(block: StaveBlock, onFinish?: () => void): void {
    this.stop();
    const ctx = this.getContext();
    const cap = capacityOf(block.timeSignature);
    let start = 0;
    let end = measureCount(block);
    if (block.displayRange?.mode === 'custom') {
      start = Math.max(0, (block.displayRange.startMeasure || 1) - 1);
      end = Math.min(end, block.displayRange.endMeasure || end);
    }
    const all = [
      ...this.eventsFor(block.measures, cap, start, end),
      ...(block.staffMode === 'grand' ? this.eventsFor(block.lowerMeasures || [], cap, start, end) : []),
    ];
    const t0 = ctx.currentTime + 0.08;
    let total = 0;
    for (const e of all) {
      e.keys.forEach((k) => this.voice(vexKeyToFreq(k), t0 + e.at, e.dur * 0.95, all.length > 40 ? 0.16 : 0.2));
      total = Math.max(total, e.at + e.dur);
    }
    const totalBars = (end - start) * (cap / 4) * (60 / this.bpm);
    this.endTimer = window.setTimeout(() => {
      this.endTimer = null;
      onFinish?.();
    }, (Math.max(total, totalBars) + 0.3) * 1000);
  }

  public stop(): void {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* ya detenido */
      }
    }
    this.sources = [];
    if (this.endTimer !== null) {
      clearTimeout(this.endTimer);
      this.endTimer = null;
    }
  }
}

export const audioSynth = new AudioSynthService();
