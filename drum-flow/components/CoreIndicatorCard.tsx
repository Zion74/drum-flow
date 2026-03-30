import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getMaxBpm, getBpmHistory } from '../src/history/bpm-history';

interface Props {
  exerciseId: string;
  exerciseName: string;
}

export function CoreIndicatorCard({ exerciseId, exerciseName }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [maxBpm, setMaxBpm] = useState<number | null>(null);
  const [trend, setTrend] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const bpm = await getMaxBpm(exerciseId);
      setMaxBpm(bpm);
      const history = await getBpmHistory(exerciseId, 10);
      if (history.length >= 2) {
        const recent = history[history.length - 1].bpm;
        const prev = history[history.length - 2].bpm;
        setTrend(recent - prev);
      }
    }
    load();
  }, [exerciseId]);

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => router.push(`/metronome/${exerciseId}` as any)}
    >
      <Card.Content style={styles.content}>
        <Text variant="labelSmall" style={{ color: '#888', textAlign: 'center' }}>
          {exerciseName}
        </Text>
        <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
          {maxBpm ?? '--'}
        </Text>
        <Text variant="labelSmall" style={{ color: '#888' }}>BPM</Text>
        {trend !== 0 && (
          <Text style={{ color: trend > 0 ? '#50fa7b' : '#ff5555', fontSize: 11 }}>
            {trend > 0 ? `↑${trend}` : `↓${Math.abs(trend)}`}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, marginHorizontal: 4, borderRadius: 12 },
  content: { alignItems: 'center', paddingVertical: 12 },
});
