import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { AccelProgress } from '../src/metronome/hooks';

interface Props {
  progress: AccelProgress;
}

export function AccelProgressBar({ progress }: Props) {
  const theme = useTheme();
  const { startBpm, targetBpm, currentBpm } = progress;
  const ratio = (currentBpm - startBpm) / (targetBpm - startBpm);
  const pct = Math.max(0, Math.min(1, ratio));

  const width = useSharedValue(pct);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{startBpm}</Text>
        <Text style={[styles.current, { color: theme.colors.primary }]}>{currentBpm} BPM</Text>
        <Text style={styles.label}>{targetBpm}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: '#2a2a2a' }]}>
        <Animated.View
          style={[styles.fill, barStyle, { backgroundColor: theme.colors.primary }]}
        />
      </View>
      <Text style={styles.hint}>
        {pct >= 1 ? '目标达成 ✓' : `还差 ${targetBpm - currentBpm} BPM`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4, paddingVertical: 8 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { color: '#666', fontSize: 12 },
  current: { fontSize: 16, fontWeight: 'bold' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  hint: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
