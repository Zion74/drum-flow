import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Chip, Card, Searchbar, FAB, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../../src/storage/database';
import { exercises } from '../../src/storage/schemas';
import { CATEGORIES } from '../../src/exercises/categories';
import { ExerciseCategory, ExerciseLevel } from '../../src/exercises/types';

interface ExerciseRow {
  id: string;
  name: string;
  category: string;
  level: string;
  description: string;
  defaultBpm: number;
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
    return allExercises.filter((e) => {
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

      <View style={styles.chipRow}>
        <Chip
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
          style={styles.chip}
        >
          全部
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.key}
            selected={selectedCategory === c.key}
            onPress={() => setSelectedCategory(selectedCategory === c.key ? null : c.key)}
            style={styles.chip}
          >
            {c.label}
          </Chip>
        ))}
      </View>

      <View style={styles.chipRow}>
        {(['beginner', 'intermediate'] as ExerciseLevel[]).map((l) => (
          <Chip
            key={l}
            selected={selectedLevel === l}
            onPress={() => setSelectedLevel(selectedLevel === l ? null : l)}
            style={styles.chip}
          >
            {l === 'beginner' ? '初学者' : '中级'}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push(`/metronome/${item.id}` as any)}
          >
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#fff' }}>{item.name}</Text>
              <Text variant="bodySmall" style={{ color: '#888' }}>
                {item.description} · {item.defaultBpm} BPM
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 48 }}>
            没有找到练习
          </Text>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
        color="#000"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', marginTop: 56, marginBottom: 16 },
  search: { marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
  chip: { marginRight: 4 },
  card: { borderRadius: 12, marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
});
