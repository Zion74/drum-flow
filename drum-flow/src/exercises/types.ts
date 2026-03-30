export type ExerciseCategory = 'pad' | 'kit' | 'musicality';
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';
export type MetronomeMode = 'normal' | 'accel' | 'silent';
export type TimeSignature = [number, number];

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  level: ExerciseLevel;
  description: string;
  defaultBpm: number;
  defaultTimeSignature: TimeSignature;
  tags: string[];
  mediaUrl?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoundPreset {
  id: string;
  name: string;
  accentSound: string;
  normalSound: string;
}

export interface AccelModeConfig {
  startBpm: number;
  targetBpm: number;
  intervalSeconds: 15 | 30 | 60;
  incrementBpm: number;
}

export interface SilentModeConfig {
  playBars: number;
  silentBars: 1 | 2;
  silentFrequency: number;
}
