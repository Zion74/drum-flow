import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card, Chip, useTheme, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { db } from '../../src/storage/database';
import { exercises } from '../../src/storage/schemas';
import { eq } from 'drizzle-orm';
import { getBpmHistory, getMaxBpm, getLastSuccessBpm } from '../../src/history/bpm-history';
import { LineChart } from 'react-native-gifted-charts';

interface ExerciseDetail {
  id: string;
  name: string;
  category: string;
  level: string;
  description: string;
  defaultBpm: number;
  tags: string[];
}

interface BpmPoint {
  value: number;
  date: Date;
  success: boolean;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: '初学者',
  intermediate: '中级',
  advanced: '高级',
};

const CATEGORY_LABEL: Record<string, string> = {
  pad: '哑鼓垫',
  kit: '套鼓',
  musicality: '音乐性',
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [history, setHistory] = useState<BpmPoint[]>([]);
  const [maxBpm, setMaxBpm] = useState<number | null>(null);
  const [lastBpm, setLastBpm] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
      if (rows.length > 0) {
        const ex = rows[0];
        setExercise({
          id: ex.id,
          name: ex.name,
          category: ex.category,
          level: ex.level,
          description: ex.description,
          defaultBpm: ex.defaultBpm,
          tags: JSON.parse(ex.tags ?? '[]'),
        });
      }
      const hist = await getBpmHistory(id, 30);
      setHistory(hist.map((h) => ({ value: h.bpm, date: h.date, success: h.success })));
      setMaxBpm(await getMaxBpm(id));
      setLastBpm(await getLastSuccessBpm(id));
    }
    load();
  }, [id]);

  if (!exercise) return null;

  const chartData = history.map((h) => ({
    value: h.value,
    dataPointColor: h.success ? theme.colors.primary : '#ff5555',
  }));

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: exercise.name,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: '#fff',
        }}
      />

      {/* Meta chips */}
      <View style={styles.chipRow}>
        <Chip compact style={styles.chip} textStyle={styles.chipText}>
          {CATEGORY_LABEL[exercise.category] ?? exercise.category}
        </Chip>
        <Chip compact style={styles.chip} textStyle={styles.chipText}>
          {LEVEL_LABEL[exercise.level] ?? exercise.level}
        </Chip>
        {exercise.tags.map((tag) => (
          <Chip key={tag} compact style={styles.chip} textStyle={styles.chipText}>
            {tag}
          </Chip>
        ))}
      </View>

      {/* Description */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>练习说明</Text>
          <Text style={styles.description}>{exercise.description}</Text>
          <Text style={styles.defaultBpm}>默认 BPM：{exercise.defaultBpm}</Text>
        </Card.Content>
      </Card>

      {/* Stats */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>进度统计</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {lastBpm ?? '—'}
              </Text>
              <Text style={styles.statLabel}>上次成功 BPM</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {maxBpm ?? '—'}
              </Text>
              <Text style={styles.statLabel}>历史最高 BPM</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {history.length}
              </Text>
              <Text style={styles.statLabel}>练习次数</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* BPM History Chart */}
      {chartData.length > 1 && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>BPM 进步曲线</Text>
            <Text style={styles.chartHint}>最近 {history.length} 次练习</Text>
            <View style={styles.chartWrap}>
              <LineChart
                data={chartData}
                width={280}
                height={140}
                color={theme.colors.primary}
                thickness={2}
                dataPointsColor={theme.colors.primary}
                dataPointsRadius={4}
                startFillColor={theme.colors.primary}
                startOpacity={0.2}
                endOpacity={0}
                areaChart
                hideYAxisText={false}
                yAxisTextStyle={{ color: '#666', fontSize: 10 }}
                xAxisColor="#333"
                yAxisColor="#333"
                rulesColor="#222"
                backgroundColor="transparent"
                noOfSections={4}
                curved
              />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={styles.legendText}>成功</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ff5555' }]} />
                <Text style={styles.legendText}>未达标</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {chartData.length === 0 && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 16 }}>
              还没有练习记录，开始第一次练习吧
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Start button */}
      <Button
        mode="contained"
        style={styles.startBtn}
        contentStyle={{ paddingVertical: 8 }}
        onPress={() => router.push(`/metronome/${id}` as any)}
      >
        开始练习
      </Button>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { backgroundColor: '#2a2a2a' },
  chipText: { color: '#aaa', fontSize: 11 },
  card: { borderRadius: 12, marginBottom: 12 },
  sectionTitle: { color: '#aaa', marginBottom: 8 },
  description: { color: '#ddd', lineHeight: 22, marginBottom: 8 },
  defaultBpm: { color: '#666', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 2 },
  chartWrap: { marginTop: 8, alignItems: 'center' },
  chartHint: { color: '#666', fontSize: 11, marginBottom: 4 },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#666', fontSize: 11 },
  startBtn: { borderRadius: 12, marginTop: 4 },
});
