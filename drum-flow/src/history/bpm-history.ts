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
  return rows.reverse() as { bpm: number; date: Date; success: boolean }[];
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
