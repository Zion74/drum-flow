import { db } from '../storage/database';
import { practiceSessions, exercises } from '../storage/schemas';
import { eq, gte, sql } from 'drizzle-orm';

export interface DailyStats {
  date: string;
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

  return rows as DailyStats[];
}

export async function getStreakDays(): Promise<number> {
  const stats = await getDailyStats(365);
  if (stats.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const dateSet = new Set(stats.map((s) => s.date));
  let streak = 0;
  const d = new Date();

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

  return rows as CategoryTimeDistribution[];
}
