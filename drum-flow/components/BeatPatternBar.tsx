import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { RhythmPattern } from '../src/metronome/patterns';

interface Props {
  beatPatterns: RhythmPattern[];
  currentBeat: number;
  currentSubTick: number;
  isPlaying: boolean;
  isSilent?: boolean;
  onBeatPress: (beatIndex: number) => void;
}

function BeatCell({
  pattern,
  beatIndex,
  isCurrentBeat,
  currentSubTick,
  isPlaying,
  isSilent,
  isAccentBeat,
  onPress,
  primaryColor,
  secondaryColor,
}: {
  pattern: RhythmPattern;
  beatIndex: number;
  isCurrentBeat: boolean;
  currentSubTick: number;
  isPlaying: boolean;
  isSilent?: boolean;
  isAccentBeat: boolean;
  onPress: () => void;
  primaryColor: string;
  secondaryColor: string;
}) {
  const scale = useSharedValue(1);

  if (isCurrentBeat && isPlaying) {
    scale.value = withSpring(1.05, { damping: 10, stiffness: 300 });
  } else {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  }

  const cellAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeColor = isAccentBeat ? primaryColor : secondaryColor;

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.cell,
          cellAnim,
          {
            borderColor: isCurrentBeat && isPlaying ? activeColor : '#333',
            borderWidth: isCurrentBeat && isPlaying ? 2 : 1,
            opacity: isSilent ? 0.4 : 1,
          },
        ]}
      >
        {/* Beat number */}
        <Text style={[styles.beatNum, { color: isAccentBeat ? primaryColor : '#888' }]}>
          {beatIndex + 1}
        </Text>

        {/* Sub-tick dots */}
        <View style={styles.dotsRow}>
          {pattern.subTicks.map((sub, i) => {
            const isActiveSub = isCurrentBeat && isPlaying && i === currentSubTick;
            return (
              <View
                key={i}
                style={[
                  styles.subDot,
                  sub.isRest ? styles.restDot : null,
                  {
                    backgroundColor: sub.isRest
                      ? 'transparent'
                      : isActiveSub
                      ? activeColor
                      : '#555',
                    borderColor: sub.isRest ? '#555' : 'transparent',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Pattern label */}
        <Text style={styles.patternLabel} numberOfLines={1}>
          {pattern.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function BeatPatternBar({
  beatPatterns,
  currentBeat,
  currentSubTick,
  isPlaying,
  isSilent,
  onBeatPress,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {isSilent && <Text style={styles.silentLabel}>静音中...</Text>}
      <View style={styles.row}>
        {beatPatterns.map((pattern, i) => (
          <BeatCell
            key={i}
            pattern={pattern}
            beatIndex={i}
            isCurrentBeat={isPlaying && i === currentBeat}
            currentSubTick={currentSubTick}
            isPlaying={isPlaying}
            isSilent={isSilent}
            isAccentBeat={i === 0}
            onPress={() => onBeatPress(i)}
            primaryColor={theme.colors.primary}
            secondaryColor={theme.colors.secondary}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12, alignItems: 'center' },
  silentLabel: { color: '#ff5555', fontSize: 12, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  cell: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'space-between',
  },
  beatNum: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    minHeight: 24,
  },
  subDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  restDot: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  patternLabel: { fontSize: 10, color: '#666', marginTop: 4 },
});
