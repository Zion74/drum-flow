import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, SegmentedButtons, useTheme } from 'react-native-paper';
import { useEffect, useState } from 'react';
import {
  getDailyStats,
  getStreakDays,
  getCategoryDistribution,
  DailyStats,
  CategoryTimeDistribution,
} from '../../src/history/charts';

export default function ProfileScreen() {
  const theme = useTheme();
  const [range, setRange] = useState('30');
  const [streak, setStreak] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryTimeDistribution[]>([]);

  useEffect(() => {
    async function load() {
      const days = parseInt(range);
      setStreak(await getStreakDays());
      const stats = await getDailyStats(days);
      setDailyStats(stats);
      const total = stats.reduce((sum, s) => sum + s.totalSeconds, 0);
      setTotalMinutes(Math.round(total / 60));
      setTotalSessions(stats.reduce((sum, s) => sum + s.sessionCount, 0));
      setCategoryDist(await getCategoryDistribution(days));
    }
    load();
  }, [range]);

  const categoryLabels: Record<string, string> = {
    pad: '基本功',
    kit: '套鼓',
    musicality: '音乐性',
  };

  const totalCatSec = categoryDist.reduce((s, x) => s + x.totalSeconds, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>我的统计</Text>

      <SegmentedButtons
        value={range}
        onValueChange={setRange}
        buttons={[
          { value: '7', label: '7天' },
          { value: '30', label: '30天' },
          { value: '365', label: '全部' },
        ]}
        style={styles.segment}
      />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.summaryContent}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>{streak}</Text>
            <Text variant="labelSmall" style={{ color: '#888' }}>连续天数</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.summaryContent}>
            <Text variant="headlineMedium" style={{ color: theme.colors.secondary }}>{totalMinutes}</Text>
            <Text variant="labelSmall" style={{ color: '#888' }}>总分钟</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.summaryContent}>
            <Text variant="headlineMedium" style={{ color: theme.colors.tertiary }}>{totalSessions}</Text>
            <Text variant="labelSmall" style={{ color: '#888' }}>练习次数</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Category Distribution */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 12 }}>分类时间分布</Text>
          {categoryDist.length === 0 ? (
            <Text style={{ color: '#888' }}>暂无数据，开始练习后会显示</Text>
          ) : (
            categoryDist.map((c) => {
              const pct = totalCatSec > 0 ? Math.round((c.totalSeconds / totalCatSec) * 100) : 0;
              return (
                <View key={c.category} style={styles.distRow}>
                  <Text style={{ color: '#fff', width: 60 }}>
                    {categoryLabels[c.category] ?? c.category}
                  </Text>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: theme.colors.primary },
                      ]}
                    />
                  </View>
                  <Text style={{ color: '#888', width: 36, textAlign: 'right' }}>{pct}%</Text>
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      {/* Daily Practice (last 7 days) */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 12 }}>每日练习</Text>
          {dailyStats.length === 0 ? (
            <Text style={{ color: '#888' }}>暂无数据</Text>
          ) : (
            dailyStats.slice(-7).map((d) => {
              const maxSec = Math.max(...dailyStats.map((x) => x.totalSeconds), 1);
              const pct = Math.round((d.totalSeconds / maxSec) * 100);
              return (
                <View key={d.date} style={styles.distRow}>
                  <Text style={{ color: '#888', width: 52, fontSize: 12 }}>{d.date.slice(5)}</Text>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: theme.colors.secondary },
                      ]}
                    />
                  </View>
                  <Text style={{ color: '#888', width: 40, textAlign: 'right', fontSize: 12 }}>
                    {Math.round(d.totalSeconds / 60)}m
                  </Text>
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', marginTop: 56, marginBottom: 16 },
  segment: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12 },
  summaryContent: { alignItems: 'center', paddingVertical: 12 },
  card: { borderRadius: 12, marginBottom: 16 },
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  barBg: { flex: 1, height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
