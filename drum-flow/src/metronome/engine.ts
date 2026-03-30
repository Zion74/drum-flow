import { TimeSignature, SoundPreset } from '../exercises/types';
import { playSound, preloadSounds, SOUND_PRESETS } from './sounds';

export type BeatCallback = (beat: number, isAccent: boolean) => void;

export interface MetronomeState {
  bpm: number;
  timeSignature: TimeSignature;
  currentBeat: number;
  isPlaying: boolean;
  soundPreset: SoundPreset;
  accentVolume: number;
  normalVolume: number;
}

const BPM_MIN = 40;
const BPM_MAX = 208;

export function clampBpm(bpm: number): number {
  return Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(bpm)));
}

export class MetronomeEngine {
  private state: MetronomeState;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private onBeat: BeatCallback | null = null;
  private lastTickTime: number = 0;
  private muted: boolean = false;

  constructor() {
    this.state = {
      bpm: 80,
      timeSignature: [4, 4],
      currentBeat: 0,
      isPlaying: false,
      soundPreset: SOUND_PRESETS[0],
      accentVolume: 1.0,
      normalVolume: 0.8,
    };
  }

  getState(): Readonly<MetronomeState> {
    return { ...this.state };
  }

  setBpm(bpm: number): void {
    this.state.bpm = clampBpm(bpm);
  }

  setTimeSignature(ts: TimeSignature): void {
    this.state.timeSignature = ts;
    this.state.currentBeat = 0;
  }

  async setSoundPreset(preset: SoundPreset): Promise<void> {
    this.state.soundPreset = preset;
    await preloadSounds(preset);
  }

  setVolumes(accent: number, normal: number): void {
    this.state.accentVolume = Math.max(0, Math.min(1, accent));
    this.state.normalVolume = Math.max(0, Math.min(1, normal));
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  setOnBeat(callback: BeatCallback | null): void {
    this.onBeat = callback;
  }

  async start(): Promise<void> {
    if (this.state.isPlaying) return;
    await preloadSounds(this.state.soundPreset);
    this.state.isPlaying = true;
    this.state.currentBeat = 0;
    this.lastTickTime = Date.now();
    this.tick();
  }

  stop(): void {
    this.state.isPlaying = false;
    this.state.currentBeat = 0;
    this.muted = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private get intervalMs(): number {
    return 60000 / this.state.bpm;
  }

  private tick(): void {
    if (!this.state.isPlaying) return;

    const [beats] = this.state.timeSignature;
    const isAccent = this.state.currentBeat === 0;
    const preset = this.state.soundPreset;

    if (!this.muted) {
      const soundKey = isAccent ? preset.accentSound : preset.normalSound;
      const volume = isAccent ? this.state.accentVolume : this.state.normalVolume;
      playSound(soundKey, volume);
    }

    this.onBeat?.(this.state.currentBeat, isAccent);
    this.state.currentBeat = (this.state.currentBeat + 1) % beats;

    // Drift-corrected scheduling
    const now = Date.now();
    const elapsed = now - this.lastTickTime;
    const drift = elapsed - this.intervalMs;
    const nextDelay = Math.max(1, this.intervalMs - drift);
    this.lastTickTime = now;

    this.timerId = setTimeout(() => this.tick(), nextDelay);
  }
}
