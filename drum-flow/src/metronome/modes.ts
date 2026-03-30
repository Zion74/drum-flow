import { AccelModeConfig, SilentModeConfig } from '../exercises/types';
import { MetronomeEngine, clampBpm } from './engine';

// ===== Accelerating Mode =====
export class AccelMode {
  private engine: MetronomeEngine;
  private config: AccelModeConfig;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private onBpmChange: ((bpm: number) => void) | null = null;
  private onComplete: (() => void) | null = null;

  constructor(engine: MetronomeEngine, config: AccelModeConfig) {
    if (config.startBpm >= config.targetBpm) {
      throw new Error('startBpm must be less than targetBpm');
    }
    this.engine = engine;
    this.config = config;
  }

  setOnBpmChange(cb: (bpm: number) => void): void { this.onBpmChange = cb; }
  setOnComplete(cb: () => void): void { this.onComplete = cb; }

  start(): void {
    this.engine.setBpm(this.config.startBpm);
    this.timerId = setInterval(() => {
      const current = this.engine.getState().bpm;
      const next = clampBpm(current + this.config.incrementBpm);
      if (next >= this.config.targetBpm) {
        this.engine.setBpm(this.config.targetBpm);
        this.onBpmChange?.(this.config.targetBpm);
        this.stop();
        this.onComplete?.();
      } else {
        this.engine.setBpm(next);
        this.onBpmChange?.(next);
      }
    }, this.config.intervalSeconds * 1000);
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

// ===== Silent Test Mode =====
export class SilentMode {
  private engine: MetronomeEngine;
  private config: SilentModeConfig;
  private barCount: number = 0;
  private isSilent: boolean = false;
  private silentBarsRemaining: number = 0;
  private onSilentChange: ((isSilent: boolean) => void) | null = null;

  constructor(engine: MetronomeEngine, config: SilentModeConfig) {
    this.engine = engine;
    this.config = config;
  }

  setOnSilentChange(cb: (isSilent: boolean) => void): void {
    this.onSilentChange = cb;
  }

  // Call on every beat === 0 (start of bar)
  onBarStart(): void {
    if (this.isSilent) {
      this.silentBarsRemaining--;
      if (this.silentBarsRemaining <= 0) {
        this.isSilent = false;
        this.barCount = 0;
        this.engine.setMuted(false);
        this.onSilentChange?.(false);
      }
      return;
    }

    this.barCount++;
    if (this.barCount >= this.config.playBars) {
      if (Math.random() < this.config.silentFrequency) {
        this.isSilent = true;
        this.silentBarsRemaining = this.config.silentBars;
        this.barCount = 0;
        this.engine.setMuted(true);
        this.onSilentChange?.(true);
      } else {
        this.barCount = 0;
      }
    }
  }

  reset(): void {
    this.barCount = 0;
    this.isSilent = false;
    this.silentBarsRemaining = 0;
    this.engine.setMuted(false);
  }
}
