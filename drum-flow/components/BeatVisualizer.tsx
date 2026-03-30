import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface Props {
  beats: number;
  currentBeat: number;
  isPlaying: boolean;
  isSilent?: boolean;
}

export function BeatVisualizer({ beats, currentBeat, isPlaying, isSilent }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, isSilent && styles.silentContainer]}>
      {isSilent && (
        <Text style={styles.silentLabel}>静音中...</Text>
      )}
      <View style={styles.dotsRow}>
        {Array.from({ length: beats }, (_, i) => {
          const isActive = isPlaying && i === currentBeat;
          const isAccent = i === 0;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive
                    ? (isAccent ? theme.colors.primary : theme.colors.secondary)
                    : '#333',
                  transform: [{ scale: isActive ? 1.5 : 1 }],
                  opacity: isSilent ? 0.3 : 1,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  silentContainer: {
    backgroundColor: 'rgba(255,85,85,0.05)',
    borderRadius: 12,
  },
  silentLabel: {
    color: '#ff5555',
    fontSize: 12,
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
