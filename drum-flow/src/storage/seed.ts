import { db } from './database';
import { exercises, userSettings } from './schemas';
import { PRESET_EXERCISES, CORE_EXERCISE_IDS } from '../exercises/presets';
import { nanoid } from 'nanoid/non-secure';
import { eq } from 'drizzle-orm';

const SEED_VERSION_KEY = 'seed_version';
const CURRENT_SEED_VERSION = '1';

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

  // Mark seed version
  if (existing.length === 0) {
    await db.insert(userSettings).values({ id: nanoid(), key: SEED_VERSION_KEY, value: CURRENT_SEED_VERSION });
  } else {
    await db.update(userSettings).set({ value: CURRENT_SEED_VERSION }).where(eq(userSettings.key, SEED_VERSION_KEY));
  }
}
