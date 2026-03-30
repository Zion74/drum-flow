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
