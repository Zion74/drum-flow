import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useRef, useCallback } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface Props {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  disabled?: boolean;
}

const MIN_BPM = 40;
const MAX_BPM = 208;
const LONG_PRESS_DELAY = 400;
const REPEAT_INTERVAL = 80;

function clamp(val: number) {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, val));
}

function StepButton({
  icon,
  delta,
  bpm,
  onBpmChange,
  disabled,
  color,
}: {
  icon: string;
  delta: number;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  disabled?: boolean;
  color: string;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const startRepeat = useCallback(() => {
    intervalRef.current = setInterval(() => {
      onBpmChange(clamp(bpmRef.current + delta));
    }, REPEAT_INTERVAL);
  }, [delta, onBpmChange]);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.88, { damping: 8, stiffness: 300 });
    onBpmChange(clamp(bpmRef.current + delta));
    timeoutRef.current = setTimeout(startRepeat, LONG_PRESS_DELAY);
  }, [disabled, delta, onBpmChange, startRepeat, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 300 });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [scale]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={12}
    >
      <Animated.View style={[styles.stepBtn, animStyle]}>
        <Text style={[styles.stepIcon, { color: disabled ? '#555' : color }]}>{icon}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function BpmControl({ bpm, onBpmChange, disabled }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StepButton
          icon="−"
          delta={-1}
          bpm={bpm}
          onBpmChange={onBpmChange}
          disabled={disabled}
          color={theme.colors.primary}
        />
        <Animated.Text
          style={[styles.bpmText, { color: theme.colors.primary }]}
        >
          {bpm}
        </Animated.Text>
        <StepButton
          icon="+"
          delta={1}
          bpm={bpm}
          onBpmChange={onBpmChange}
          disabled={disabled}
          color={theme.colors.primary}
        />
      </View>
      <Text variant="labelMedium" style={{ color: '#888' }}>BPM</Text>
      <Slider
        style={styles.slider}
        minimumValue={MIN_BPM}
        maximumValue={MAX_BPM}
        step={1}
        value={bpm}
        onValueChange={onBpmChange}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor="#333"
        thumbTintColor={theme.colors.primary}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: { fontSize: 28, lineHeight: 32, fontWeight: '300' },
  bpmText: {
    fontSize: 64,
    fontWeight: 'bold',
    minWidth: 110,
    textAlign: 'center',
    lineHeight: 72,
  },
  slider: { width: '85%', marginTop: 4 },
});
