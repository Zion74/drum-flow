import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

interface Props {
  beats: number;
  currentBeat: number;
  isPlaying: boolean;
  isSilent?: boolean;
}

function BeatDot({
  index,
  currentBeat,
  isPlaying,
  isSilent,
  accentColor,
  secondaryColor,
}: {
  index: number;
  currentBeat: number;
  isPlaying: boolean;
  isSilent?: boolean;
  accentColor: string;
  secondaryColor: string;
}) {
  const scale = useSharedValue(1);
  const bgIndex = useSharedValue(0); // 0=inactive, 1=accent, 2=secondary

  const isActive = isPlaying && index === currentBeat;
  const isAccent = index === 0;

  // Update scale on active change
  if (isActive) {
    scale.value = withSpring(1.6, { damping: 6, stiffness: 300 });
    bgIndex.value = isAccent ? 1 : 2;
  } else {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    bgIndex.value = 0;
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(isSilent ? 0.3 : 1, { duration: 200 }),
    backgroundColor:
      bgIndex.value === 1
        ? accentColor
        : bgIndex.value === 2
        ? secondaryColor
        : '#333',
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

export function BeatVisualizer({ beats, currentBeat, isPlaying, isSilent }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, isSilent && styles.silentContainer]}>
      {isSilent && <Text style={styles.silentLabel}>静音中...</Text>}
      <View style={styles.dotsRow}>
        {Array.from({ length: beats }, (_, i) => (
          <BeatDot
            key={i}
            index={i}
            currentBeat={currentBeat}
            isPlaying={isPlaying}
            isSilent={isSilent}
            accentColor={theme.colors.primary}
            secondaryColor={theme.colors.secondary}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24 },
  silentContainer: {
    backgroundColor: 'rgba(255,85,85,0.05)',
    borderRadius: 12,
  },
  silentLabel: { color: '#ff5555', fontSize: 12, marginBottom: 8 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  dot: { width: 28, height: 28, borderRadius: 14 },
});
