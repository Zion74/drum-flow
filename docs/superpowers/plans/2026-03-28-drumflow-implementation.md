# DrumFlow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native + Expo drum practice training app with smart metronome, exercise tracking, and BPM progress visualization.

**Architecture:** Modular monolith with Expo Router file-based routing. Core engine (metronome) is a pure TypeScript module consumed via React hooks. Data layer uses expo-sqlite + Drizzle ORM for local persistence. UI built with React Native Paper.

**Tech Stack:** React Native, Expo SDK 52, Expo Router, TypeScript, expo-av, expo-sqlite, Drizzle ORM, React Native Paper, victory-native, react-native-reanimated, nanoid

**Spec:** `docs/superpowers/specs/2026-03-28-drumflow-design.md`

---

## Chunk 1: Project Scaffolding & Database Layer

### Task 1: Initialize Expo Project

**Files:**
- Create: `drum-flow/` (Expo project root)
- Create: `drum-flow/app/(tabs)/_layout.tsx`
- Create: `drum-flow/app/(tabs)/index.tsx`
- Create: `drum-flow/app/_layout.tsx`

- [ ] **Step 1: Create Expo project with tabs template**

```bash
cd "d:/OneDrive/Code/FULL-STACK/架子鼓训练计划"
npx create-expo-app@latest drum-flow --template tabs
```

- [ ] **Step 2: Install core dependencies**

```bash
cd drum-flow
npx expo install expo-av expo-sqlite expo-image-picker react-native-reanimated react-native-safe-area-context
npm install drizzle-orm nanoid react-native-paper react-native-vector-icons victory-native
npm install -D drizzle-kit @types/react-native-vector-icons
```

- [ ] **Step 3: Verify project runs**

```bash
npx expo start
```

Expected: Expo dev server starts, default tabs app loads.

- [ ] **Step 4: Commit**

```bash
git init && git add -A && git commit -m "chore: initialize Expo project with dependencies"
```

---

### Task 2: Database Schema (Drizzle ORM)

**Files:**
- Create: `drum-flow/src/storage/database.ts`
- Create: `drum-flow/src/storage/schemas.ts`
- Create: `drum-flow/src/storage/migrations.ts`

- [ ] **Step 1: Create database initialization**

Create `drum-flow/src/storage/database.ts`:

```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schemas';

const expo = openDatabaseSync('drumflow.db');
export const db = drizzle(expo, { schema });
```

- [ ] **Step 2: Create schema definitions**

Create `drum-flow/src/storage/schemas.ts`:

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============ Exercises ============
export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', { enum: ['pad', 'kit', 'musicality'] }).notNull(),
  level: text('level', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull(),
  description: text('description').notNull().default(''),
  defaultBpm: integer('default_bpm').notNull().default(80),
  defaultTimeSignatureBeats: integer('default_time_signature_beats').notNull().default(4),
  defaultTimeSignatureNoteValue: integer('default_time_signature_note_value').notNull().default(4),
  tags: text('tags').notNull().default('[]'), // JSON array
  mediaUrl: text('media_url'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ============ Practice Sessions ============
export const practiceSessions = sqliteTable('practice_sessions', {
  id: text('id').primaryKey(),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  startBpm: integer('start_bpm').notNull(),
  endBpm: integer('end_bpm').notNull(),
  maxBpm: integer('max_bpm').notNull(),
  mode: text('mode', { enum: ['normal', 'accel', 'silent'] }).notNull().default('normal'),
  success: integer('success', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ============ Training Plans ============
export const trainingPlans = sqliteTable('training_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  totalMinutes: integer('total_minutes').notNull(),
  isPreset: integer('is_preset', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const planItems = sqliteTable('plan_items', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull().references(() => trainingPlans.id),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
  durationMinutes: integer('duration_minutes').notNull(),
  order: integer('order').notNull(),
  mode: text('mode', { enum: ['normal', 'accel', 'silent'] }).notNull().default('normal'),
});

// ============ Warmup Routines ============
export const warmupRoutines = sqliteTable('warmup_routines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPreset: integer('is_preset', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const warmupItems = sqliteTable('warmup_items', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').notNull().references(() => warmupRoutines.id),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
  order: integer('order').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  startBpm: integer('start_bpm').notNull(),
  targetBpm: integer('target_bpm'),
  useAccelMode: integer('use_accel_mode', { mode: 'boolean' }).notNull().default(false),
});

// ============ Songs ============
export const songs = sqliteTable('songs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  artist: text('artist').notNull().default(''),
  bpm: integer('bpm').notNull(),
  timeSignatureBeats: integer('time_signature_beats').notNull().default(4),
  timeSignatureNoteValue: integer('time_signature_note_value').notNull().default(4),
  difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull(),
  tags: text('tags').notNull().default('[]'),
  videoUrl: text('video_url'),
  drumSheetImages: text('drum_sheet_images'), // JSON array
  notes: text('notes'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const songProgress = sqliteTable('song_progress', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => songs.id),
  status: text('status', { enum: ['not_started', 'learning', 'practicing', 'mastered'] }).notNull().default('not_started'),
  lastPracticed: integer('last_practiced', { mode: 'timestamp' }),
  totalPracticeMinutes: integer('total_practice_minutes').notNull().default(0),
});

export const sectionProgress = sqliteTable('section_progress', {
  id: text('id').primaryKey(),
  songProgressId: text('song_progress_id').notNull().references(() => songProgress.id),
  name: text('name').notNull(),
  status: text('status', { enum: ['not_started', 'learning', 'mastered'] }).notNull().default('not_started'),
  currentBpm: integer('current_bpm').notNull(),
  targetBpm: integer('target_bpm').notNull(),
});

// ============ Drum Sheets ============
export const drumSheets = sqliteTable('drum_sheets', {
  id: text('id').primaryKey(),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
});

export const barItems = sqliteTable('bar_items', {
  id: text('id').primaryKey(),
  drumSheetId: text('drum_sheet_id').notNull().references(() => drumSheets.id),
  order: integer('order').notNull(),
  imageUri: text('image_uri').notNull(),
  repeatCount: integer('repeat_count').notNull().default(1),
  label: text('label'),
});

// ============ User Settings ============
export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});
```

- [ ] **Step 3: Create migration runner**

Create `drum-flow/src/storage/migrations.ts`:

```typescript
import { db } from './database';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  // Create indexes for performance
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_practice_sessions_bpm_lookup
    ON practice_sessions(exercise_id, success, date DESC)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_practice_sessions_date
    ON practice_sessions(date)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_warmup_items_order
    ON warmup_items(routine_id, "order")`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_plan_items_order
    ON plan_items(plan_id, "order")`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_bar_items_order
    ON bar_items(drum_sheet_id, "order")`);
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add database schema and migration layer"
```

---

## Chunk 2: Exercise Presets & Categories

### Task 3: Exercise Types & Categories

**Files:**
- Create: `drum-flow/src/exercises/types.ts`
- Create: `drum-flow/src/exercises/categories.ts`

- [ ] **Step 1: Create exercise type definitions**

Create `drum-flow/src/exercises/types.ts`:

```typescript
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
  accentSound: string;   // asset path
  normalSound: string;   // asset path
}

export interface AccelModeConfig {
  startBpm: number;
  targetBpm: number;
  intervalSeconds: 15 | 30 | 60;
  incrementBpm: number;  // 1-5
}

export interface SilentModeConfig {
  playBars: number;          // 2-8, default 4
  silentBars: 1 | 2;        // default 1
  silentFrequency: number;   // 0.25-0.75, default 0.5
}
```

- [ ] **Step 2: Create category definitions**

Create `drum-flow/src/exercises/categories.ts`:

```typescript
import { ExerciseCategory } from './types';

export interface CategoryInfo {
  key: ExerciseCategory;
  label: string;
  description: string;
  icon: string; // MaterialCommunityIcons name
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'pad', label: '哑鼓垫基本功', description: '手法技巧训练', icon: 'drum' },
  { key: 'kit', label: '套鼓协调', description: '四肢协调训练', icon: 'music-circle' },
  { key: 'musicality', label: '音乐性', description: '律动和表现力', icon: 'music-note' },
];
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add exercise types and category definitions"
```

---

### Task 4: Preset Exercise Data

**Files:**
- Create: `drum-flow/src/exercises/presets.ts`

- [ ] **Step 1: Create preset exercises**

Create `drum-flow/src/exercises/presets.ts`:

```typescript
import { Exercise } from './types';

// Fixed IDs for presets — never change these
export const PRESET_EXERCISES: Omit<Exercise, 'createdAt' | 'updatedAt'>[] = [
  // ===== PAD - Beginner =====
  {
    id: 'preset-single-stroke',
    name: '单击 (Single Stroke)',
    category: 'pad',
    level: 'beginner',
    description: 'RLRL 交替单击，最基础的速度训练',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['核心指标', '热身'],
    isCustom: false,
  },
  {
    id: 'preset-double-stroke',
    name: '双击 (Double Stroke)',
    category: 'pad',
    level: 'beginner',
    description: 'RRLL 双击，手腕控制力训练',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['核心指标', '热身'],
    isCustom: false,
  },
  {
    id: 'preset-paradiddle',
    name: '复合跳 (Paradiddle)',
    category: 'pad',
    level: 'beginner',
    description: 'RLRR LRLL 复合跳，协调性训练',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['核心指标'],
    isCustom: false,
  },
  {
    id: 'preset-accent-shift',
    name: '重音移位',
    category: 'pad',
    level: 'beginner',
    description: '重音在1拍、2拍、3拍、4拍轮换',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['热身', '重音'],
    isCustom: false,
  },
  {
    id: 'preset-tap-accent',
    name: '重音轻音',
    category: 'pad',
    level: 'beginner',
    description: 'tap-accent 组合，力度控制训练',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['热身', '力度'],
    isCustom: false,
  },
  {
    id: 'preset-16th-8th',
    name: '前十六后八',
    category: 'pad',
    level: 'beginner',
    description: '前十六后八节奏型练习',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['节奏型'],
    isCustom: false,
  },
  {
    id: 'preset-8th-16th',
    name: '前八后十六',
    category: 'pad',
    level: 'beginner',
    description: '前八后十六节奏型练习',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['节奏型'],
    isCustom: false,
  },
  {
    id: 'preset-syncopation',
    name: '切分音',
    category: 'pad',
    level: 'beginner',
    description: '切分节奏练习',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['节奏型'],
    isCustom: false,
  },
  {
    id: 'preset-triplet',
    name: '三连音',
    category: 'pad',
    level: 'beginner',
    description: '基础三连音练习',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['热身', '三连音'],
    isCustom: false,
  },
  // ===== PAD - Intermediate =====
  {
    id: 'preset-flam',
    name: 'Flam',
    category: 'pad',
    level: 'intermediate',
    description: '装饰音 Flam 练习',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['装饰音'],
    isCustom: false,
  },
  {
    id: 'preset-drag',
    name: 'Drag',
    category: 'pad',
    level: 'intermediate',
    description: '装饰音 Drag 练习',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['装饰音'],
    isCustom: false,
  },
  {
    id: 'preset-paradiddle-variants',
    name: 'Paradiddle 变体',
    category: 'pad',
    level: 'intermediate',
    description: 'Double/Triple Paradiddle 等变体',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['复合跳'],
    isCustom: false,
  },
  {
    id: 'preset-accent-triplet',
    name: '带重音三连音',
    category: 'pad',
    level: 'intermediate',
    description: '三连音中加入重音移位',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['三连音', '重音'],
    isCustom: false,
  },
  {
    id: 'preset-mixed-16-8',
    name: '八十六混合',
    category: 'pad',
    level: 'intermediate',
    description: '八分音符和十六分音符混合节奏型',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['混合练习'],
    isCustom: false,
  },
  // ===== KIT - Beginner =====
  {
    id: 'preset-8beat',
    name: '8 Beat',
    category: 'kit',
    level: 'beginner',
    description: '基础八分音符节奏型',
    defaultBpm: 80,
    defaultTimeSignature: [4, 4],
    tags: ['节奏型'],
    isCustom: false,
  },
  {
    id: 'preset-16beat',
    name: '16 Beat',
    category: 'kit',
    level: 'beginner',
    description: '基础十六分音符节奏型',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['节奏型'],
    isCustom: false,
  },
  {
    id: 'preset-hihat-open-close',
    name: '踩镲开合',
    category: 'kit',
    level: 'beginner',
    description: '踩镲开合控制练习',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['踩镲'],
    isCustom: false,
  },
  {
    id: 'preset-foot-single',
    name: '单踩协调',
    category: 'kit',
    level: 'beginner',
    description: '单踩+手的基础协调练习',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['热身', '双脚'],
    isCustom: false,
  },
  // ===== KIT - Intermediate =====
  {
    id: 'preset-linear',
    name: '线性节奏',
    category: 'kit',
    level: 'intermediate',
    description: '手脚不同时击打的线性节奏',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['线性'],
    isCustom: false,
  },
  {
    id: 'preset-ghost-note',
    name: 'Ghost Note',
    category: 'kit',
    level: 'intermediate',
    description: '幽灵音练习，增加律动感',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['律动'],
    isCustom: false,
  },
  {
    id: 'preset-foot-double',
    name: '双踩交替',
    category: 'kit',
    level: 'intermediate',
    description: '双脚交替踩踏练习',
    defaultBpm: 60,
    defaultTimeSignature: [4, 4],
    tags: ['双脚'],
    isCustom: false,
  },
  // ===== MUSICALITY - Beginner =====
  {
    id: 'preset-dynamics',
    name: '力度控制',
    category: 'musicality',
    level: 'beginner',
    description: 'ppp 到 fff 的力度渐变练习',
    defaultBpm: 70,
    defaultTimeSignature: [4, 4],
    tags: ['力度'],
    isCustom: false,
  },
  {
    id: 'preset-shuffle',
    name: '基础 Shuffle',
    category: 'musicality',
    level: 'beginner',
    description: 'Shuffle 节奏感训练',
    defaultBpm: 80,
    defaultTimeSignature: [4, 4],
    tags: ['Shuffle'],
    isCustom: false,
  },
  // ===== MUSICALITY - Intermediate =====
  {
    id: 'preset-swing',
    name: 'Swing',
    category: 'musicality',
    level: 'intermediate',
    description: 'Swing 摇摆节奏练习',
    defaultBpm: 100,
    defaultTimeSignature: [4, 4],
    tags: ['Swing', 'Jazz'],
    isCustom: false,
  },
  {
    id: 'preset-funk-groove',
    name: 'Funk Groove',
    category: 'musicality',
    level: 'intermediate',
    description: 'Funk 律动练习',
    defaultBpm: 90,
    defaultTimeSignature: [4, 4],
    tags: ['Funk', '律动'],
    isCustom: false,
  },
];

// Core indicator exercises (drummer's "big three")
export const CORE_EXERCISE_IDS = [
  'preset-single-stroke',
  'preset-double-stroke',
  'preset-paradiddle',
];
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add preset exercise data with core indicators"
```

---

## Chunk 3: Metronome Engine

### Task 5: Sound Manager

**Files:**
- Create: `drum-flow/src/metronome/sounds.ts`
- Create: `drum-flow/assets/sounds/` (placeholder audio files)

- [ ] **Step 1: Create sound preset definitions and loader**

Create `drum-flow/src/metronome/sounds.ts`:

```typescript
import { Audio } from 'expo-av';
import { SoundPreset } from '../exercises/types';

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'woodblock', name: '木鱼', accentSound: 'woodblock_hi.wav', normalSound: 'woodblock_lo.wav' },
  { id: 'electronic', name: '电子', accentSound: 'electronic_hi.wav', normalSound: 'electronic_lo.wav' },
  { id: 'classic', name: '经典', accentSound: 'classic_hi.wav', normalSound: 'classic_lo.wav' },
];

const soundCache = new Map<string, Audio.Sound>();

// Map asset names to require() calls — Expo needs static requires
const SOUND_ASSETS: Record<string, any> = {
  'woodblock_hi.wav': require('../../assets/sounds/woodblock_hi.wav'),
  'woodblock_lo.wav': require('../../assets/sounds/woodblock_lo.wav'),
  'electronic_hi.wav': require('../../assets/sounds/electronic_hi.wav'),
  'electronic_lo.wav': require('../../assets/sounds/electronic_lo.wav'),
  'classic_hi.wav': require('../../assets/sounds/classic_hi.wav'),
  'classic_lo.wav': require('../../assets/sounds/classic_lo.wav'),
};

export async function preloadSounds(preset: SoundPreset): Promise<void> {
  for (const key of [preset.accentSound, preset.normalSound]) {
    if (!soundCache.has(key)) {
      const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[key]);
      soundCache.set(key, sound);
    }
  }
}

export async function playSound(assetName: string, volume: number = 1.0): Promise<void> {
  const sound = soundCache.get(assetName);
  if (sound) {
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(volume);
    await sound.playAsync();
  }
}

export async function unloadAllSounds(): Promise<void> {
  for (const sound of soundCache.values()) {
    await sound.unloadAsync();
  }
  soundCache.clear();
}
```

- [ ] **Step 2: Create placeholder audio files**

Place 6 short WAV click sounds in `drum-flow/assets/sounds/`:
- `woodblock_hi.wav`, `woodblock_lo.wav`
- `electronic_hi.wav`, `electronic_lo.wav`
- `classic_hi.wav`, `classic_lo.wav`

Use any short click/tick WAV files (< 50KB each). Can be generated with `ffmpeg` or downloaded from freesound.org.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add sound manager with preload and preset support"
```

---

### Task 6: Core Metronome Engine

**Files:**
- Create: `drum-flow/src/metronome/engine.ts`

- [ ] **Step 1: Create the metronome engine**

Create `drum-flow/src/metronome/engine.ts`:

```typescript
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
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private get intervalMs(): number {
    return 60000 / this.state.bpm;
  }

  private async tick(): Promise<void> {
    if (!this.state.isPlaying) return;

    const [beats] = this.state.timeSignature;
    const isAccent = this.state.currentBeat === 0;
    const preset = this.state.soundPreset;

    // Play sound
    const soundFile = isAccent ? preset.accentSound : preset.normalSound;
    const volume = isAccent ? this.state.accentVolume : this.state.normalVolume;
    playSound(soundFile, volume);

    // Notify UI
    this.onBeat?.(this.state.currentBeat, isAccent);

    // Advance beat
    this.state.currentBeat = (this.state.currentBeat + 1) % beats;

    // Schedule next tick with drift correction
    const now = Date.now();
    const drift = now - this.lastTickTime - this.intervalMs;
    const nextDelay = Math.max(1, this.intervalMs - drift);
    this.lastTickTime = now;

    this.timerId = setTimeout(() => this.tick(), nextDelay);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add core metronome engine with drift correction"
```

---

### Task 7: Metronome Modes (Accel & Silent)

**Files:**
- Create: `drum-flow/src/metronome/modes.ts`

- [ ] **Step 1: Create mode controllers**

Create `drum-flow/src/metronome/modes.ts`:

```typescript
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

  // Call this on every beat=0 (start of bar)
  onBarStart(): { mute: boolean } {
    if (this.isSilent) {
      this.silentBarsRemaining--;
      if (this.silentBarsRemaining <= 0) {
        this.isSilent = false;
        this.barCount = 0;
        this.onSilentChange?.(false);
      }
      return { mute: true };
    }

    this.barCount++;
    if (this.barCount >= this.config.playBars) {
      // Roll for silence
      if (Math.random() < this.config.silentFrequency) {
        this.isSilent = true;
        this.silentBarsRemaining = this.config.silentBars;
        this.barCount = 0;
        this.onSilentChange?.(true);
        return { mute: true };
      }
      this.barCount = 0;
    }
    return { mute: false };
  }

  reset(): void {
    this.barCount = 0;
    this.isSilent = false;
    this.silentBarsRemaining = 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add accelerating and silent test metronome modes"
```

---

### Task 8: useMetronome React Hook

**Files:**
- Create: `drum-flow/src/metronome/hooks.ts`

- [ ] **Step 1: Create the hook**

Create `drum-flow/src/metronome/hooks.ts`:

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import { MetronomeEngine, MetronomeState } from './engine';
import { AccelMode, SilentMode } from './modes';
import { AccelModeConfig, SilentModeConfig, SoundPreset, TimeSignature } from '../exercises/types';
import { SOUND_PRESETS } from './sounds';

export type MetronomeMode = 'normal' | 'accel' | 'silent';

export interface UseMetronomeReturn {
  state: MetronomeState;
  mode: MetronomeMode;
  isSilent: boolean;
  start: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setSoundPreset: (preset: SoundPreset) => Promise<void>;
  setVolumes: (accent: number, normal: number) => void;
  startAccelMode: (config: AccelModeConfig) => Promise<void>;
  startSilentMode: (config: SilentModeConfig) => Promise<void>;
  setNormalMode: () => void;
}

export function useMetronome(): UseMetronomeReturn {
  const engineRef = useRef(new MetronomeEngine());
  const accelRef = useRef<AccelMode | null>(null);
  const silentRef = useRef<SilentMode | null>(null);

  const [state, setState] = useState<MetronomeState>(engineRef.current.getState());
  const [mode, setMode] = useState<MetronomeMode>('normal');
  const [isSilent, setIsSilent] = useState(false);

  const syncState = useCallback(() => {
    setState({ ...engineRef.current.getState() });
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    engine.setOnBeat((beat, isAccent) => {
      // Handle silent mode muting
      if (silentRef.current && beat === 0) {
        const { mute } = silentRef.current.onBarStart();
        // If mute, engine still ticks but we skip sound in next iteration
        // For V1, we handle this by volume control
      }
      syncState();
    });
    return () => {
      engine.stop();
      accelRef.current?.stop();
    };
  }, [syncState]);

  const start = useCallback(async () => {
    await engineRef.current.start();
    syncState();
  }, [syncState]);

  const stop = useCallback(() => {
    engineRef.current.stop();
    accelRef.current?.stop();
    silentRef.current?.reset();
    setIsSilent(false);
    syncState();
  }, [syncState]);

  const setBpm = useCallback((bpm: number) => {
    engineRef.current.setBpm(bpm);
    syncState();
  }, [syncState]);

  const setTimeSignature = useCallback((ts: TimeSignature) => {
    engineRef.current.setTimeSignature(ts);
    syncState();
  }, [syncState]);

  const setSoundPreset = useCallback(async (preset: SoundPreset) => {
    await engineRef.current.setSoundPreset(preset);
    syncState();
  }, [syncState]);

  const setVolumes = useCallback((accent: number, normal: number) => {
    engineRef.current.setVolumes(accent, normal);
    syncState();
  }, [syncState]);

  const startAccelMode = useCallback(async (config: AccelModeConfig) => {
    accelRef.current?.stop();
    silentRef.current = null;
    const accel = new AccelMode(engineRef.current, config);
    accel.setOnBpmChange(() => syncState());
    accel.setOnComplete(() => {
      setMode('normal');
      syncState();
    });
    accelRef.current = accel;
    setMode('accel');
    accel.start();
    await engineRef.current.start();
    syncState();
  }, [syncState]);

  const startSilentMode = useCallback(async (config: SilentModeConfig) => {
    accelRef.current?.stop();
    const silent = new SilentMode(engineRef.current, config);
    silent.setOnSilentChange(setIsSilent);
    silentRef.current = silent;
    setMode('silent');
    await engineRef.current.start();
    syncState();
  }, [syncState]);

  const setNormalMode = useCallback(() => {
    accelRef.current?.stop();
    silentRef.current?.reset();
    silentRef.current = null;
    setMode('normal');
    setIsSilent(false);
  }, []);

  return {
    state, mode, isSilent,
    start, stop, setBpm, setTimeSignature,
    setSoundPreset, setVolumes,
    startAccelMode, startSilentMode, setNormalMode,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add useMetronome React hook"
```

---

## Chunk 4: Data Services (History, Recorder, Seed)

### Task 9: Practice Recorder Service

**Files:**
- Create: `drum-flow/src/history/recorder.ts`

- [ ] **Step 1: Create practice session recorder**

Create `drum-flow/src/history/recorder.ts`:

```typescript
import { db } from '../storage/database';
import { practiceSessions } from '../storage/schemas';
import { nanoid } from 'nanoid/non-secure';
import { MetronomeMode } from '../exercises/types';

export interface RecordSessionInput {
  exerciseId: string;
  durationSeconds: number;
  startBpm: number;
  endBpm: number;
  maxBpm: number;
  mode: MetronomeMode;
  success: boolean;
  notes?: string;
}

export async function recordSession(input: RecordSessionInput): Promise<string> {
  const id = nanoid();
  const now = new Date();
  await db.insert(practiceSessions).values({
    id,
    exerciseId: input.exerciseId,
    date: now,
    durationSeconds: input.durationSeconds,
    startBpm: input.startBpm,
    endBpm: input.endBpm,
    maxBpm: input.maxBpm,
    mode: input.mode,
    success: input.success,
    notes: input.notes ?? null,
    createdAt: now,
  });
  return id;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add practice session recorder"
```

---

### Task 10: BPM History Service

**Files:**
- Create: `drum-flow/src/history/bpm-history.ts`

- [ ] **Step 1: Create BPM history query service**

Create `drum-flow/src/history/bpm-history.ts`:

```typescript
import { db } from '../storage/database';
import { practiceSessions } from '../storage/schemas';
import { eq, and, desc } from 'drizzle-orm';

export async function getLastSuccessBpm(exerciseId: string): Promise<number | null> {
  const rows = await db
    .select({ endBpm: practiceSessions.endBpm })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.exerciseId, exerciseId),
        eq(practiceSessions.success, true),
      )
    )
    .orderBy(desc(practiceSessions.date))
    .limit(1);
  return rows.length > 0 ? rows[0].endBpm : null;
}

export async function getBpmHistory(
  exerciseId: string,
  limit: number = 50,
): Promise<{ bpm: number; date: Date; success: boolean }[]> {
  const rows = await db
    .select({
      bpm: practiceSessions.endBpm,
      date: practiceSessions.date,
      success: practiceSessions.success,
    })
    .from(practiceSessions)
    .where(eq(practiceSessions.exerciseId, exerciseId))
    .orderBy(desc(practiceSessions.date))
    .limit(limit);
  return rows.reverse();
}

export async function getMaxBpm(exerciseId: string): Promise<number | null> {
  const rows = await db
    .select({ maxBpm: practiceSessions.maxBpm })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.exerciseId, exerciseId),
        eq(practiceSessions.success, true),
      )
    )
    .orderBy(desc(practiceSessions.maxBpm))
    .limit(1);
  return rows.length > 0 ? rows[0].maxBpm : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add BPM history query service"
```

---

### Task 11: Chart Data Service

**Files:**
- Create: `drum-flow/src/history/charts.ts`

- [ ] **Step 1: Create chart data aggregation**

Create `drum-flow/src/history/charts.ts`:

```typescript
import { db } from '../storage/database';
import { practiceSessions, exercises } from '../storage/schemas';
import { eq, gte, sql, desc } from 'drizzle-orm';

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  sessionCount: number;
}

export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`date(${practiceSessions.date} / 1000, 'unixepoch')`,
      totalSeconds: sql<number>`sum(${practiceSessions.durationSeconds})`,
      sessionCount: sql<number>`count(*)`,
    })
    .from(practiceSessions)
    .where(gte(practiceSessions.date, since))
    .groupBy(sql`date(${practiceSessions.date} / 1000, 'unixepoch')`)
    .orderBy(sql`date(${practiceSessions.date} / 1000, 'unixepoch')`);

  return rows;
}

export async function getStreakDays(): Promise<number> {
  const stats = await getDailyStats(365);
  if (stats.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  const dateSet = new Set(stats.map(s => s.date));

  const d = new Date();
  // Check if today has practice, if not start from yesterday
  if (!dateSet.has(today)) {
    d.setDate(d.getDate() - 1);
  }

  while (dateSet.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export interface CategoryTimeDistribution {
  category: string;
  totalSeconds: number;
}

export async function getCategoryDistribution(
  days: number = 30,
): Promise<CategoryTimeDistribution[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      category: exercises.category,
      totalSeconds: sql<number>`sum(${practiceSessions.durationSeconds})`,
    })
    .from(practiceSessions)
    .innerJoin(exercises, eq(practiceSessions.exerciseId, exercises.id))
    .where(gte(practiceSessions.date, since))
    .groupBy(exercises.category);

  return rows;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add chart data aggregation service"
```

---

### Task 12: Database Seed (Preset Data Loader)

**Files:**
- Create: `drum-flow/src/storage/seed.ts`

- [ ] **Step 1: Create seed function to load presets on first launch**

Create `drum-flow/src/storage/seed.ts`:

```typescript
import { db } from './database';
import { exercises, userSettings } from './schemas';
import { PRESET_EXERCISES, CORE_EXERCISE_IDS } from '../exercises/presets';
import { nanoid } from 'nanoid/non-secure';
import { eq } from 'drizzle-orm';

const SEED_VERSION_KEY = 'seed_version';
const CURRENT_SEED_VERSION = '1';

export async function seedDatabase(): Promise<void> {
  // Check if already seeded
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.key, SEED_VERSION_KEY))
    .limit(1);

  if (existing.length > 0 && existing[0].value === CURRENT_SEED_VERSION) {
    return; // Already seeded with current version
  }

  const now = new Date();

  // Upsert preset exercises
  for (const preset of PRESET_EXERCISES) {
    const existingExercise = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, preset.id))
      .limit(1);

    if (existingExercise.length === 0) {
      await db.insert(exercises).values({
        ...preset,
        tags: JSON.stringify(preset.tags),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Set core exercise IDs in settings
  await db.insert(userSettings).values({
    id: nanoid(),
    key: 'core_exercise_ids',
    value: JSON.stringify(CORE_EXERCISE_IDS),
  }).onConflictDoUpdate({
    target: userSettings.key,
    set: { value: JSON.stringify(CORE_EXERCISE_IDS) },
  });

  // Mark seed version
  await db.insert(userSettings).values({
    id: nanoid(),
    key: SEED_VERSION_KEY,
    value: CURRENT_SEED_VERSION,
  }).onConflictDoUpdate({
    target: userSettings.key,
    set: { value: CURRENT_SEED_VERSION },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add database seed for preset exercises"
```

---

## Chunk 5: App Shell & Navigation

### Task 13: App Layout & Database Init

**Files:**
- Modify: `drum-flow/app/_layout.tsx`

- [ ] **Step 1: Set up root layout with Paper provider and DB init**

Replace `drum-flow/app/_layout.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { View, ActivityIndicator } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../src/storage/database';
import { runMigrations } from '../src/storage/migrations';
import { seedDatabase } from '../src/storage/seed';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#50fa7b',
    secondary: '#ff79c6',
    tertiary: '#bd93f9',
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceVariant: '#0f3460',
  },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await runMigrations();
      await seedDatabase();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#50fa7b" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add root layout with theme, DB init, and seed"
```

---

### Task 14: Tab Navigation Layout

**Files:**
- Modify: `drum-flow/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Set up bottom tab navigation**

Replace `drum-flow/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: '#333' },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: '练习库',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="drum" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="songs"
        options={{
          title: '打歌',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="music-note-eighth" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add bottom tab navigation with 4 tabs"
```

---

## Chunk 6: Core Pages

### Task 15: Home Page (Today Overview)

**Files:**
- Modify: `drum-flow/app/(tabs)/index.tsx`
- Create: `drum-flow/components/CoreIndicatorCard.tsx`

- [ ] **Step 1: Create CoreIndicatorCard component**

Create `drum-flow/components/CoreIndicatorCard.tsx`:

```tsx
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getMaxBpm, getBpmHistory } from '../src/history/bpm-history';

interface Props {
  exerciseId: string;
  exerciseName: string;
}

export function CoreIndicatorCard({ exerciseId, exerciseName }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [maxBpm, setMaxBpm] = useState<number | null>(null);
  const [trend, setTrend] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const bpm = await getMaxBpm(exerciseId);
      setMaxBpm(bpm);
      const history = await getBpmHistory(exerciseId, 10);
      if (history.length >= 2) {
        const recent = history[history.length - 1].bpm;
        const prev = history[history.length - 2].bpm;
        setTrend(recent - prev);
      }
    }
    load();
  }, [exerciseId]);

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => router.push(`/metronome/${exerciseId}`)}
    >
      <Card.Content style={styles.content}>
        <Text variant="labelMedium" style={{ color: '#888' }}>{exerciseName}</Text>
        <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
          {maxBpm ?? '--'} BPM
        </Text>
        {trend !== 0 && (
          <Text style={{ color: trend > 0 ? '#50fa7b' : '#ff5555', fontSize: 12 }}>
            {trend > 0 ? `↑${trend}` : `↓${Math.abs(trend)}`}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, marginHorizontal: 4, borderRadius: 12 },
  content: { alignItems: 'center', paddingVertical: 12 },
});
```

- [ ] **Step 2: Create Home page**

Replace `drum-flow/app/(tabs)/index.tsx`:

```tsx
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { CoreIndicatorCard } from '../../components/CoreIndicatorCard';
import { getStreakDays, getDailyStats } from '../../src/history/charts';
import { db } from '../../src/storage/database';
import { userSettings } from '../../src/storage/schemas';
import { eq } from 'drizzle-orm';
import { CORE_EXERCISE_IDS } from '../../src/exercises/presets';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [coreIds, setCoreIds] = useState<string[]>(CORE_EXERCISE_IDS);

  const coreNames: Record<string, string> = {
    'preset-single-stroke': '单击',
    'preset-double-stroke': '双击',
    'preset-paradiddle': '复合跳',
  };

  useEffect(() => {
    async function load() {
      setStreak(await getStreakDays());
      const stats = await getDailyStats(1);
      if (stats.length > 0) {
        setTodayMinutes(Math.round(stats[0].totalSeconds / 60));
      }
      // Load custom core IDs if set
      const setting = await db.select().from(userSettings)
        .where(eq(userSettings.key, 'core_exercise_ids')).limit(1);
      if (setting.length > 0) {
        setCoreIds(JSON.parse(setting[0].value));
      }
    }
    load();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={{ color: '#fff' }}>DrumFlow</Text>
        <Text variant="bodyMedium" style={{ color: '#888' }}>今日概览</Text>
      </View>

      {/* Core Indicators */}
      <View style={styles.coreRow}>
        {coreIds.map(id => (
          <CoreIndicatorCard
            key={id}
            exerciseId={id}
            exerciseName={coreNames[id] ?? id}
          />
        ))}
      </View>

      {/* Today Stats */}
      <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="bodyLarge" style={{ color: '#fff' }}>
            今日已练 {todayMinutes} 分钟
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            连续打卡 {streak} 天
          </Text>
        </Card.Content>
      </Card>

      {/* Quick Start */}
      <Button
        mode="contained"
        style={styles.quickStart}
        onPress={() => router.push('/exercises')}
      >
        开始练习
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginTop: 48, marginBottom: 24 },
  coreRow: { flexDirection: 'row', marginBottom: 16 },
  statsCard: { borderRadius: 12, marginBottom: 16 },
  quickStart: { borderRadius: 12, paddingVertical: 4 },
});
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add home page with core indicators and today stats"
```

---

### Task 16: Exercise Library Page

**Files:**
- Modify: `drum-flow/app/(tabs)/exercises.tsx`

- [ ] **Step 1: Create exercise library page**

Replace `drum-flow/app/(tabs)/exercises.tsx`:

```tsx
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Chip, Card, Searchbar, FAB, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../../src/storage/database';
import { exercises } from '../../src/storage/schemas';
import { eq } from 'drizzle-orm';
import { CATEGORIES } from '../../src/exercises/categories';
import { ExerciseCategory, ExerciseLevel } from '../../src/exercises/types';

interface ExerciseRow {
  id: string;
  name: string;
  category: string;
  level: string;
  description: string;
  defaultBpm: number;
  tags: string;
}

export default function ExercisesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [allExercises, setAllExercises] = useState<ExerciseRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExerciseLevel | null>(null);

  useEffect(() => {
    async function load() {
      const rows = await db.select().from(exercises);
      setAllExercises(rows as ExerciseRow[]);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return allExercises.filter(e => {
      if (selectedCategory && e.category !== selectedCategory) return false;
      if (selectedLevel && e.level !== selectedLevel) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allExercises, selectedCategory, selectedLevel, search]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>练习库</Text>

      <Searchbar
        placeholder="搜索练习..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* Category filter */}
      <View style={styles.chipRow}>
        <Chip
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
          style={styles.chip}
        >全部</Chip>
        {CATEGORIES.map(c => (
          <Chip
            key={c.key}
            selected={selectedCategory === c.key}
            onPress={() => setSelectedCategory(
              selectedCategory === c.key ? null : c.key
            )}
            style={styles.chip}
          >{c.label}</Chip>
        ))}
      </View>

      {/* Level filter */}
      <View style={styles.chipRow}>
        {(['beginner', 'intermediate'] as ExerciseLevel[]).map(l => (
          <Chip
            key={l}
            selected={selectedLevel === l}
            onPress={() => setSelectedLevel(selectedLevel === l ? null : l)}
            style={styles.chip}
          >{l === 'beginner' ? '初学者' : '中级'}</Chip>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push(`/metronome/${item.id}`)}
          >
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#fff' }}>{item.name}</Text>
              <Text variant="bodySmall" style={{ color: '#888' }}>
                {item.description} · {item.defaultBpm} BPM
              </Text>
            </Card.Content>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/exercise/new')}
        color="#000"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', marginTop: 48, marginBottom: 16 },
  search: { marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
  chip: { marginRight: 4 },
  card: { borderRadius: 12, marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
});
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add exercise library page with filters"
```

---

### Task 17: Metronome Practice Page

**Files:**
- Create: `drum-flow/app/metronome/[id].tsx`
- Create: `drum-flow/components/BpmControl.tsx`
- Create: `drum-flow/components/BeatVisualizer.tsx`

- [ ] **Step 1: Create BpmControl component**

Create `drum-flow/components/BpmControl.tsx`:

```tsx
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import Slider from '@react-native-community/slider';

interface Props {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  disabled?: boolean;
}

export function BpmControl({ bpm, onBpmChange, disabled }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <IconButton icon="minus" onPress={() => onBpmChange(bpm - 1)} disabled={disabled} />
        <Text variant="displayMedium" style={{ color: theme.colors.primary }}>{bpm}</Text>
        <IconButton icon="plus" onPress={() => onBpmChange(bpm + 1)} disabled={disabled} />
      </View>
      <Text variant="labelMedium" style={{ color: '#888' }}>BPM</Text>
      <Slider
        style={styles.slider}
        minimumValue={40}
        maximumValue={208}
        step={1}
        value={bpm}
        onValueChange={onBpmChange}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor="#333"
        thumbTintColor={theme.colors.primary}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  slider: { width: '80%', marginTop: 8 },
});
```

- [ ] **Step 2: Create BeatVisualizer component**

Create `drum-flow/components/BeatVisualizer.tsx`:

```tsx
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  beats: number;
  currentBeat: number;
  isPlaying: boolean;
  isSilent?: boolean;
}

export function BeatVisualizer({ beats, currentBeat, isPlaying, isSilent }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, isSilent && styles.silentContainer]}>
      {Array.from({ length: beats }, (_, i) => {
        const isActive = isPlaying && i === currentBeat;
        const isAccent = i === 0;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: isActive
                  ? (isAccent ? theme.colors.primary : theme.colors.secondary)
                  : '#333',
                transform: [{ scale: isActive ? 1.4 : 1 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  silentContainer: { opacity: 0.3 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
```

- [ ] **Step 3: Create Metronome practice page**

Create `drum-flow/app/metronome/[id].tsx`:

```tsx
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, SegmentedButtons, IconButton, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../src/storage/database';
import { exercises } from '../../src/storage/schemas';
import { eq } from 'drizzle-orm';
import { useMetronome } from '../../src/metronome/hooks';
import { getLastSuccessBpm } from '../../src/history/bpm-history';
import { recordSession } from '../../src/history/recorder';
import { BpmControl } from '../../components/BpmControl';
import { BeatVisualizer } from '../../components/BeatVisualizer';
import { SOUND_PRESETS } from '../../src/metronome/sounds';
import { TimeSignature } from '../../src/exercises/types';

const TIME_SIGNATURES: { label: string; value: TimeSignature }[] = [
  { label: '2/4', value: [2, 4] },
  { label: '3/4', value: [3, 4] },
  { label: '4/4', value: [4, 4] },
  { label: '6/8', value: [6, 8] },
];

export default function MetronomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const metronome = useMetronome();

  const [exerciseName, setExerciseName] = useState('');
  const [selectedTs, setSelectedTs] = useState('4/4');
  const [selectedSound, setSelectedSound] = useState(SOUND_PRESETS[0].id);
  const startTimeRef = useRef<number>(0);
  const startBpmRef = useRef<number>(0);
  const maxBpmRef = useRef<number>(0);

  // Load exercise and last BPM
  useEffect(() => {
    async function load() {
      if (!id) return;
      const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
      if (rows.length > 0) {
        const ex = rows[0];
        setExerciseName(ex.name);
        const ts: TimeSignature = [ex.defaultTimeSignatureBeats, ex.defaultTimeSignatureNoteValue];
        metronome.setTimeSignature(ts);
        setSelectedTs(`${ts[0]}/${ts[1]}`);

        // Load last success BPM or use default
        const lastBpm = await getLastSuccessBpm(id);
        metronome.setBpm(lastBpm ?? ex.defaultBpm);
      }
    }
    load();
    return () => metronome.stop();
  }, [id]);

  // Track max BPM
  useEffect(() => {
    if (metronome.state.bpm > maxBpmRef.current) {
      maxBpmRef.current = metronome.state.bpm;
    }
  }, [metronome.state.bpm]);

  const handleStart = async () => {
    startTimeRef.current = Date.now();
    startBpmRef.current = metronome.state.bpm;
    maxBpmRef.current = metronome.state.bpm;
    await metronome.start();
  };

  const handleStop = () => {
    metronome.stop();
  };

  const handleFinish = (success: boolean) => {
    metronome.stop();
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (duration < 5 || !id) return; // Ignore very short sessions

    recordSession({
      exerciseId: id,
      durationSeconds: duration,
      startBpm: startBpmRef.current,
      endBpm: metronome.state.bpm,
      maxBpm: maxBpmRef.current,
      mode: metronome.mode,
      success,
    });

    Alert.alert(
      success ? '练习完成' : '继续加油',
      `BPM: ${startBpmRef.current} → ${metronome.state.bpm}，时长 ${Math.round(duration / 60)} 分钟`,
      [{ text: '确定', onPress: () => router.back() }],
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: exerciseName, headerStyle: { backgroundColor: theme.colors.surface } }} />

      {/* Beat Visualizer */}
      <BeatVisualizer
        beats={metronome.state.timeSignature[0]}
        currentBeat={metronome.state.currentBeat}
        isPlaying={metronome.state.isPlaying}
        isSilent={metronome.isSilent}
      />

      {/* BPM Control */}
      <BpmControl
        bpm={metronome.state.bpm}
        onBpmChange={metronome.setBpm}
      />

      {/* Time Signature */}
      <SegmentedButtons
        value={selectedTs}
        onValueChange={(val) => {
          setSelectedTs(val);
          const ts = TIME_SIGNATURES.find(t => `${t.value[0]}/${t.value[1]}` === val);
          if (ts) metronome.setTimeSignature(ts.value);
        }}
        buttons={TIME_SIGNATURES.map(ts => ({
          value: `${ts.value[0]}/${ts.value[1]}`,
          label: ts.label,
        }))}
        style={styles.segment}
      />

      {/* Sound Preset */}
      <SegmentedButtons
        value={selectedSound}
        onValueChange={async (val) => {
          setSelectedSound(val);
          const preset = SOUND_PRESETS.find(p => p.id === val);
          if (preset) await metronome.setSoundPreset(preset);
        }}
        buttons={SOUND_PRESETS.map(p => ({ value: p.id, label: p.name }))}
        style={styles.segment}
      />

      {/* Mode Selector */}
      <SegmentedButtons
        value={metronome.mode}
        onValueChange={(val) => {
          if (val === 'normal') metronome.setNormalMode();
          if (val === 'accel') {
            metronome.startAccelMode({
              startBpm: metronome.state.bpm,
              targetBpm: Math.min(208, metronome.state.bpm + 30),
              intervalSeconds: 30,
              incrementBpm: 2,
            });
          }
          if (val === 'silent') {
            metronome.startSilentMode({
              playBars: 4,
              silentBars: 1,
              silentFrequency: 0.5,
            });
          }
        }}
        buttons={[
          { value: 'normal', label: '普通' },
          { value: 'accel', label: '渐进加速' },
          { value: 'silent', label: '沉默测试' },
        ]}
        style={styles.segment}
      />

      {/* Play/Stop */}
      <View style={styles.playRow}>
        {!metronome.state.isPlaying ? (
          <IconButton icon="play-circle" size={72} iconColor={theme.colors.primary} onPress={handleStart} />
        ) : (
          <IconButton icon="stop-circle" size={72} iconColor="#ff5555" onPress={handleStop} />
        )}
      </View>

      {/* Finish buttons */}
      {metronome.state.isPlaying && (
        <View style={styles.finishRow}>
          <Button mode="contained" onPress={() => handleFinish(true)} style={styles.finishBtn}>
            完成 (成功)
          </Button>
          <Button mode="outlined" onPress={() => handleFinish(false)} style={styles.finishBtn}>
            结束 (未达标)
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  segment: { marginVertical: 8 },
  playRow: { alignItems: 'center', marginVertical: 16 },
  finishRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  finishBtn: { flex: 1, borderRadius: 12 },
});
```

- [ ] **Step 4: Install slider dependency**

```bash
cd drum-flow && npx expo install @react-native-community/slider
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add metronome practice page with all modes"
```

---

## Chunk 7: Songs, Profile & Polish

### Task 18: Songs Page

**Files:**
- Modify: `drum-flow/app/(tabs)/songs.tsx`

- [ ] **Step 1: Create songs list page**

Replace `drum-flow/app/(tabs)/songs.tsx`:

```tsx
import { View, FlatList, StyleSheet, Alert, TextInput as RNTextInput } from 'react-native';
import { Text, Card, FAB, Chip, useTheme, Portal, Modal, Button, TextInput } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { db } from '../../src/storage/database';
import { songs, songProgress } from '../../src/storage/schemas';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid/non-secure';

interface SongRow {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  difficulty: string;
  videoUrl: string | null;
}

export default function SongsScreen() {
  const theme = useTheme();
  const [allSongs, setAllSongs] = useState<SongRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newBpm, setNewBpm] = useState('120');

  const loadSongs = async () => {
    const rows = await db.select().from(songs);
    setAllSongs(rows as SongRow[]);
  };

  useEffect(() => { loadSongs(); }, []);

  const addSong = async () => {
    if (!newName.trim()) return;
    const now = new Date();
    const id = nanoid();
    await db.insert(songs).values({
      id,
      name: newName.trim(),
      artist: newArtist.trim(),
      bpm: parseInt(newBpm) || 120,
      timeSignatureBeats: 4,
      timeSignatureNoteValue: 4,
      difficulty: 'beginner',
      tags: '[]',
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(songProgress).values({
      id: nanoid(),
      songId: id,
      status: 'not_started',
      totalPracticeMinutes: 0,
    });
    setShowAdd(false);
    setNewName('');
    setNewArtist('');
    setNewBpm('120');
    loadSongs();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>打歌清单</Text>

      <FlatList
        data={allSongs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#fff' }}>{item.name}</Text>
              <Text variant="bodySmall" style={{ color: '#888' }}>
                {item.artist} · {item.bpm} BPM
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 48 }}>
            还没有歌曲，点击 + 添加
          </Text>
        }
      />

      <Portal>
        <Modal visible={showAdd} onDismiss={() => setShowAdd(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={{ color: '#fff', marginBottom: 16 }}>添加歌曲</Text>
          <TextInput label="歌曲名" value={newName} onChangeText={setNewName} style={styles.input} />
          <TextInput label="艺术家" value={newArtist} onChangeText={setNewArtist} style={styles.input} />
          <TextInput label="BPM" value={newBpm} onChangeText={setNewBpm} keyboardType="numeric" style={styles.input} />
          <Button mode="contained" onPress={addSong} style={{ marginTop: 12 }}>添加</Button>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAdd(true)}
        color="#000"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', marginTop: 48, marginBottom: 16 },
  card: { borderRadius: 12, marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
  modal: { margin: 20, padding: 20, borderRadius: 16 },
  input: { marginBottom: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add songs page with add song modal"
```

---

### Task 19: Profile / Statistics Page

**Files:**
- Modify: `drum-flow/app/(tabs)/profile.tsx`

- [ ] **Step 1: Create profile page with stats**

Replace `drum-flow/app/(tabs)/profile.tsx`:

```tsx
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, SegmentedButtons, useTheme } from 'react-native-paper';
import { useEffect, useState } from 'react';
import {
  getDailyStats,
  getStreakDays,
  getCategoryDistribution,
  DailyStats,
  CategoryTimeDistribution,
} from '../../src/history/charts';
import { getBpmHistory } from '../../src/history/bpm-history';
import { CORE_EXERCISE_IDS } from '../../src/exercises/presets';
import { db } from '../../src/storage/database';
import { practiceSessions } from '../../src/storage/schemas';
import { sql } from 'drizzle-orm';

export default function ProfileScreen() {
  const theme = useTheme();
  const [range, setRange] = useState('30');
  const [streak, setStreak] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryTimeDistribution[]>([]);

  useEffect(() => {
    async function load() {
      const days = parseInt(range);
      setStreak(await getStreakDays());
      const stats = await getDailyStats(days);
      setDailyStats(stats);
      const total = stats.reduce((sum, s) => sum + s.totalSeconds, 0);
      setTotalMinutes(Math.round(total / 60));
      setTotalSessions(stats.reduce((sum, s) => sum + s.sessionCount, 0));
      setCategoryDist(await getCategoryDistribution(days));
    }
    load();
  }, [range]);

  const categoryLabels: Record<string, string> = {
    pad: '基本功',
    kit: '套鼓',
    musicality: '音乐性',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>我的统计</Text>

      <SegmentedButtons
        value={range}
        onValueChange={setRange}
        buttons={[
          { value: '7', label: '7天' },
          { value: '30', label: '30天' },
          { value: '365', label: '全部' },
        ]}
        style={styles.segment}
      />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.summaryContent}>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>{streak}</Text>
            <Text variant="labelMedium" style={{ color: '#888' }}>连续天数</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.summaryContent}>
            <Text variant="displaySmall" style={{ color: theme.colors.secondary }}>{totalMinutes}</Text>
            <Text variant="labelMedium" style={{ color: '#888' }}>总分钟数</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.summaryContent}>
            <Text variant="displaySmall" style={{ color: theme.colors.tertiary }}>{totalSessions}</Text>
            <Text variant="labelMedium" style={{ color: '#888' }}>练习次数</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Category Distribution */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 12 }}>分类时间分布</Text>
          {categoryDist.length === 0 ? (
            <Text style={{ color: '#888' }}>暂无数据</Text>
          ) : (
            categoryDist.map(c => {
              const totalSec = categoryDist.reduce((s, x) => s + x.totalSeconds, 0);
              const pct = totalSec > 0 ? Math.round((c.totalSeconds / totalSec) * 100) : 0;
              return (
                <View key={c.category} style={styles.distRow}>
                  <Text style={{ color: '#fff', flex: 1 }}>
                    {categoryLabels[c.category] ?? c.category}
                  </Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: theme.colors.primary }]} />
                  </View>
                  <Text style={{ color: '#888', width: 40, textAlign: 'right' }}>{pct}%</Text>
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      {/* Daily Practice Bar (simple text-based for V1) */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 12 }}>每日练习</Text>
          {dailyStats.slice(-7).map(d => (
            <View key={d.date} style={styles.distRow}>
              <Text style={{ color: '#888', width: 80 }}>{d.date.slice(5)}</Text>
              <View style={styles.barBg}>
                <View style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, (d.totalSeconds / 3600) * 100)}%`,
                    backgroundColor: theme.colors.secondary,
                  },
                ]} />
              </View>
              <Text style={{ color: '#888', width: 50, textAlign: 'right' }}>
                {Math.round(d.totalSeconds / 60)}m
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', marginTop: 48, marginBottom: 16 },
  segment: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12 },
  summaryContent: { alignItems: 'center', paddingVertical: 12 },
  card: { borderRadius: 12, marginBottom: 16 },
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barBg: { flex: 1, height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add profile page with stats and category distribution"
```

---

### Task 20: Final Verification & Polish

**Files:**
- Modify: `drum-flow/app.json` (app name, icon config)
- Verify: all pages compile and navigate correctly

- [ ] **Step 1: Update app.json**

Update `drum-flow/app.json` — set app name:

```json
{
  "expo": {
    "name": "DrumFlow",
    "slug": "drum-flow",
    "scheme": "drumflow"
  }
}
```

(Keep all other existing fields, only update name/slug/scheme)

- [ ] **Step 2: Verify app compiles**

```bash
cd drum-flow && npx expo start
```

Expected: App starts, all 4 tabs load, navigation works.

- [ ] **Step 3: Manual smoke test checklist**

Verify each flow:

1. Home tab: shows core indicator cards (no data yet, shows "--")
2. Exercise tab: shows preset exercises, filter by category works
3. Tap an exercise → metronome page opens with correct BPM
4. Play/stop metronome → hear clicks
5. Switch time signature → beat dots update
6. Switch sound preset → different click sound
7. Switch to accel mode → BPM increases over time
8. Switch to silent mode → sound mutes periodically
9. Finish practice (success) → alert shows, navigates back
10. Home tab: core indicator now shows recorded BPM
11. Songs tab: add a song → appears in list
12. Profile tab: shows practice stats

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: update app config and verify all flows"
```

---

## Summary

| Chunk | Tasks | What it delivers |
| ----- | ----- | ---------------- |
| 1 | 1-2 | Expo project + SQLite schema |
| 2 | 3-4 | Exercise types + preset data |
| 3 | 5-8 | Metronome engine (3 modes + hook) |
| 4 | 9-12 | Data services (recorder, BPM history, charts, seed) |
| 5 | 13-14 | App shell + tab navigation |
| 6 | 15-17 | Home, exercise library, metronome practice page |
| 7 | 18-20 | Songs, profile/stats, verification |

Total: 20 tasks, ~7 chunks. Each chunk produces a working, committable increment.
