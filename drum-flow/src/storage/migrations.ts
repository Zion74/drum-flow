import { db } from './database';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  // Create all tables via Drizzle schema push
  await db.run(sql`CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    default_bpm INTEGER NOT NULL DEFAULT 80,
    default_time_signature_beats INTEGER NOT NULL DEFAULT 4,
    default_time_signature_note_value INTEGER NOT NULL DEFAULT 4,
    tags TEXT NOT NULL DEFAULT '[]',
    media_url TEXT,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    date INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    start_bpm INTEGER NOT NULL,
    end_bpm INTEGER NOT NULL,
    max_bpm INTEGER NOT NULL,
    mode TEXT NOT NULL DEFAULT 'normal',
    success INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS training_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_minutes INTEGER NOT NULL,
    is_preset INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS plan_items (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES training_plans(id),
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    duration_minutes INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    mode TEXT NOT NULL DEFAULT 'normal'
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS warmup_routines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_preset INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS warmup_items (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL REFERENCES warmup_routines(id),
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    "order" INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    start_bpm INTEGER NOT NULL,
    target_bpm INTEGER,
    use_accel_mode INTEGER NOT NULL DEFAULT 0
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT '',
    bpm INTEGER NOT NULL,
    time_signature_beats INTEGER NOT NULL DEFAULT 4,
    time_signature_note_value INTEGER NOT NULL DEFAULT 4,
    difficulty TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    video_url TEXT,
    drum_sheet_images TEXT,
    notes TEXT,
    is_custom INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS song_progress (
    id TEXT PRIMARY KEY,
    song_id TEXT NOT NULL REFERENCES songs(id),
    status TEXT NOT NULL DEFAULT 'not_started',
    last_practiced INTEGER,
    total_practice_minutes INTEGER NOT NULL DEFAULT 0
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS section_progress (
    id TEXT PRIMARY KEY,
    song_progress_id TEXT NOT NULL REFERENCES song_progress(id),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    current_bpm INTEGER NOT NULL,
    target_bpm INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS drum_sheets (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL REFERENCES exercises(id)
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS bar_items (
    id TEXT PRIMARY KEY,
    drum_sheet_id TEXT NOT NULL REFERENCES drum_sheets(id),
    "order" INTEGER NOT NULL,
    image_uri TEXT NOT NULL,
    repeat_count INTEGER NOT NULL DEFAULT 1,
    label TEXT
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS exercise_patterns (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    pattern_ids TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  )`);

  // Indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ps_bpm_lookup
    ON practice_sessions(exercise_id, success, date DESC)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ps_date
    ON practice_sessions(date)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_warmup_items_order
    ON warmup_items(routine_id, "order")`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_plan_items_order
    ON plan_items(plan_id, "order")`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_bar_items_order
    ON bar_items(drum_sheet_id, "order")`);
}
