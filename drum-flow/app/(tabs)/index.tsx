import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { CoreIndicatorCard } from '../../components/CoreIndicatorCard';
import { getStreakDays, getDailyStats } from '../../src/history/charts';
import { db } from '../../src/storage/database';
import { userSettings } from '../../src/storage/schemas';
import { eq } from 'drizzle-orm';
import { CORE_EXERCISE_IDS } from '../../src/exercises/presets';

const CORE_NAMES: Record<string, string> = {
  'preset-single-stroke': '单击',
  'preset-double-stroke': '双击',
  'preset-paradiddle': '复合跳',
};

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [coreIds, setCoreIds] = useState<string[]>(CORE_EXERCISE_IDS);

  useEffect(() => {
    async function load() {
      setStreak(await getStreakDays());
      const stats = await getDailyStats(1);
      if (stats.length > 0) {
        setTodayMinutes(Math.round(stats[0].totalSeconds / 60));
      }
      const setting = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.key, 'core_exercise_ids'))
        .limit(1);
      if (setting.length > 0) {
        setCoreIds(JSON.parse(setting[0].value));
      }
    }
    load();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={{ color: '#fff', fontWeight: 'bold' }}>
          DrumFlow
        </Text>
        <Text variant="bodyMedium" style={{ color: '#888' }}>今日概览</Text>
      </View>

      {/* Core Indicators */}
      <View style={styles.coreRow}>
        {coreIds.map((id) => (
          <CoreIndicatorCard
            key={id}
            exerciseId={id}
            exerciseName={CORE_NAMES[id] ?? id}
          />
        ))}
      </View>

      {/* Today Stats */}
      <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="bodyLarge" style={{ color: '#fff' }}>
            今日已练 {todayMinutes} 分钟
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
            🔥 连续打卡 {streak} 天
          </Text>
        </Card.Content>
      </Card>

      {/* Quick Start */}
      <Button
        mode="contained"
        style={styles.quickStart}
        contentStyle={{ paddingVertical: 6 }}
        onPress={() => router.push('/(tabs)/exercises')}
      >
        开始练习
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginTop: 56, marginBottom: 24 },
  coreRow: { flexDirection: 'row', marginBottom: 16 },
  statsCard: { borderRadius: 12, marginBottom: 16 },
  quickStart: { borderRadius: 12 },
});
