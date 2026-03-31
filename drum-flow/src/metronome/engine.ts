import { TimeSignature, SoundPreset } from '../exercises/types';
import { playSound, preloadSounds, SOUND_PRESETS } from './sounds';
import { RhythmPattern, DEFAULT_PATTERN } from './patterns';

export type BeatCallback = (beat: number, isAccent: boolean, subTick: number) => void;

export interface MetronomeState {
  bpm: number;
  timeSignature: TimeSignature;
  currentBeat: number;
  currentSubTick: number;
  isPlaying: boolean;
  soundPreset: SoundPreset;
  accentVolume: number;
  normalVolume: number;
  beatPatterns: RhythmPattern[];
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
  private expectedDelay: number = 0;

  constructor() {
    this.state = {
      bpm: 80,
      timeSignature: [4, 4],
      currentBeat: 0,
      currentSubTick: 0,
      isPlaying: false,
      soundPreset: SOUND_PRESETS[0],
      accentVolume: 1.0,
      normalVolume: 0.8,
      beatPatterns: [DEFAULT_PATTERN, DEFAULT_PATTERN, DEFAULT_PATTERN, DEFAULT_PATTERN],
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
    this.state.currentSubTick = 0;
    // Resize beatPatterns to match new beat count
    const [beats] = ts;
    const old = this.state.beatPatterns;
    if (old.length < beats) {
      this.state.beatPatterns = [
        ...old,
        ...Array(beats - old.length).fill(DEFAULT_PATTERN),
      ];
    } else if (old.length > beats) {
      this.state.beatPatterns = old.slice(0, beats);
    }
  }

  setBeatPatterns(patterns: RhythmPattern[]): void {
    this.state.beatPatterns = patterns;
  }

  setBeatPattern(beatIndex: number, pattern: RhythmPattern): void {
    if (beatIndex >= 0 && beatIndex < this.state.beatPatterns.length) {
      this.state.beatPatterns = [...this.state.beatPatterns];
      this.state.beatPatterns[beatIndex] = pattern;
    }
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
    this.state.currentSubTick = 0;
    this.lastTickTime = Date.now();
    this.expectedDelay = 0;
    this.tick();
  }

  stop(): void {
    this.state.isPlaying = false;
    this.state.currentBeat = 0;
    this.state.currentSubTick = 0;
    this.muted = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private get beatMs(): number {
    return 60000 / this.state.bpm;
  }

  private tick(): void {
    if (!this.state.isPlaying) return;

    const [beats] = this.state.timeSignature;
    const beat = this.state.currentBeat;
    const subTick = this.state.currentSubTick;
    const pattern = this.state.beatPatterns[beat] ?? DEFAULT_PATTERN;
    const subTicks = pattern.subTicks;
    const currentSub = subTicks[subTick];

    const isAccent = beat === 0 && subTick === 0;
    const preset = this.state.soundPreset;

    // Play sound if not muted and not a rest
    if (!this.muted && currentSub && !currentSub.isRest) {
      const soundKey = isAccent ? preset.accentSound : preset.normalSound;
      const volume = isAccent ? this.state.accentVolume : this.state.normalVolume;
      playSound(soundKey, volume);
    }

    this.onBeat?.(beat, isAccent, subTick);

    // Advance to next sub-tick or next beat
    const nextSubTick = subTick + 1;
    let delay: number;

    if (nextSubTick < subTicks.length) {
      // Next sub-tick within same beat
      this.state.currentSubTick = nextSubTick;
      const currentOffset = subTicks[subTick].offset;
      const nextOffset = subTicks[nextSubTick].offset;
      delay = this.beatMs * (nextOffset - currentOffset);
    } else {
      // Move to next beat
      this.state.currentBeat = (beat + 1) % beats;
      this.state.currentSubTick = 0;
      const lastOffset = subTicks[subTick].offset;
      const remainingBeat = 1.0 - lastOffset;

      // Next beat's first sub-tick offset
      const nextBeat = this.state.currentBeat;
      const nextPattern = this.state.beatPatterns[nextBeat] ?? DEFAULT_PATTERN;
      const nextFirstOffset = nextPattern.subTicks[0]?.offset ?? 0;

      delay = this.beatMs * (remainingBeat + nextFirstOffset);
    }

    // Drift-corrected scheduling
    const now = Date.now();
    const elapsed = now - this.lastTickTime;
    const drift = elapsed - this.expectedDelay;
    const nextDelay = Math.max(1, delay - drift);
    this.lastTickTime = now;
    this.expectedDelay = delay;

    this.timerId = setTimeout(() => this.tick(), nextDelay);
  }
}
