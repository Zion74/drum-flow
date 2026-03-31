import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Button, FAB, useTheme, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { db } from '../../src/storage/database';
import { warmupRoutines, warmupItems } from '../../src/storage/schemas';
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RoutineRow {
  id: string;
  name: string;
  isPreset: boolean;
  itemCount: number;
}

export default function WarmupListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineRow[]>([]);

  const load = useCallback(async () => {
    const rows = await db.select().from(warmupRoutines);
    const withCounts = await Promise.all(
      rows.map(async (r) => {
        const cnt = await db
          .select({ count: count() })
          .from(warmupItems)
          .where(eq(warmupItems.routineId, r.id));
        return { id: r.id, name: r.name, isPreset: r.isPreset, itemCount: cnt[0]?.count ?? 0 };
      })
    );
    setRoutines(withCounts);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createNew = useCallback(async () => {
    const id = nanoid();
    await db.insert(warmupRoutines).values({
      id,
      name: '新热身方案',
      isPreset: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    router.push(`/warmup/${id}` as any);
  }, [router]);

  const deleteRoutine = useCallback(async (id: string) => {
    await db.delete(warmupItems).where(eq(warmupItems.routineId, id));
    await db.delete(warmupRoutines).where(eq(warmupRoutines.id, id));
    load();
  }, [load]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>热身方案</Text>
      <Text style={styles.subtitle}>练习前的热身编排，可跳过</Text>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push(`/warmup/${item.id}` as any)}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <Text variant="titleMedium" style={{ color: '#fff' }}>{item.name}</Text>
                <Text variant="bodySmall" style={{ color: '#888' }}>
                  {item.itemCount} 个练习{item.isPreset ? ' · 预设' : ''}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <IconButton
                  icon="pencil"
                  size={18}
                  iconColor={theme.colors.primary}
                  onPress={() => router.push(`/warmup/${item.id}` as any)}
                />
                {!item.isPreset && (
                  <IconButton
                    icon="delete"
                    size={18}
                    iconColor="#ff5555"
                    onPress={() => deleteRoutine(item.id)}
                  />
                )}
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: '#666', textAlign: 'center' }}>还没有热身方案</Text>
            <Text style={{ color: '#555', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
              点击右下角 + 创建
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={createNew}
        color="#000"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', marginTop: 56, marginBottom: 4 },
  subtitle: { color: '#666', fontSize: 12, marginBottom: 16 },
  card: { borderRadius: 12, marginBottom: 8 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  empty: { marginTop: 64 },
  fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
});
