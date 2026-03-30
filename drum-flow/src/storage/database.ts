import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schemas';

const expo = openDatabaseSync('drumflow.db');
export const db = drizzle(expo, { schema });
