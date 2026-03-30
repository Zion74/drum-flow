import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
  tags: text('tags').notNull().default('[]'),
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
  drumSheetImages: text('drum_sheet_images'),
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
