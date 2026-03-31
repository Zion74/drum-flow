import { db } from './database';
import { exercises, userSettings, warmupRoutines, warmupItems } from './schemas';
import { PRESET_EXERCISES, CORE_EXERCISE_IDS } from '../exercises/presets';
import { nanoid } from 'nanoid/non-secure';
import { eq } from 'drizzle-orm';

const SEED_VERSION_KEY = 'seed_version';
const CURRENT_SEED_VERSION = '2';

const DEFAULT_WARMUP_ID = 'preset-warmup-default';

export async function seedDatabase(): Promise<void> {
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.key, SEED_VERSION_KEY))
    .limit(1);

  if (existing.length > 0 && existing[0].value === CURRENT_SEED_VERSION) {
    return;
  }

  const now = new Date();

  // Seed exercises
  for (const preset of PRESET_EXERCISES) {
    const existingEx = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, preset.id))
      .limit(1);

    if (existingEx.length === 0) {
      await db.insert(exercises).values({
        ...preset,
        tags: JSON.stringify(preset.tags),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Upsert core exercise IDs setting
  const coreVal = JSON.stringify(CORE_EXERCISE_IDS);
  const coreSetting = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.key, 'core_exercise_ids'))
    .limit(1);
  if (coreSetting.length === 0) {
    await db.insert(userSettings).values({ id: nanoid(), key: 'core_exercise_ids', value: coreVal });
  } else {
    await db.update(userSettings).set({ value: coreVal }).where(eq(userSettings.key, 'core_exercise_ids'));
  }

  // Seed default warmup routine (idempotent)
  const existingWarmup = await db
    .select()
    .from(warmupRoutines)
    .where(eq(warmupRoutines.id, DEFAULT_WARMUP_ID))
    .limit(1);

  if (existingWarmup.length === 0) {
    await db.insert(warmupRoutines).values({
      id: DEFAULT_WARMUP_ID,
      name: '基础热身',
      isPreset: true,
      createdAt: now,
      updatedAt: now,
    });

    const warmupPresets = [
      { exerciseId: 'preset-single-stroke', durationMinutes: 3, startBpm: 60 },
      { exerciseId: 'preset-double-stroke',  durationMinutes: 3, startBpm: 60 },
      { exerciseId: 'preset-triplet',        durationMinutes: 2, startBpm: 60 },
      { exerciseId: 'preset-accent-shift',   durationMinutes: 2, startBpm: 70 },
    ];

    for (let i = 0; i < warmupPresets.length; i++) {
      const wp = warmupPresets[i];
      await db.insert(warmupItems).values({
        id: nanoid(),
        routineId: DEFAULT_WARMUP_ID,
        exerciseId: wp.exerciseId,
        order: i,
        durationMinutes: wp.durationMinutes,
        startBpm: wp.startBpm,
        targetBpm: null,
        useAccelMode: false,
      });
    }
  }

  // Mark seed version
  if (existing.length === 0) {
    await db.insert(userSettings).values({ id: nanoid(), key: SEED_VERSION_KEY, value: CURRENT_SEED_VERSION });
  } else {
    await db.update(userSettings).set({ value: CURRENT_SEED_VERSION }).where(eq(userSettings.key, SEED_VERSION_KEY));
  }
}
