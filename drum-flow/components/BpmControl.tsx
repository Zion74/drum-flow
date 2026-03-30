import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import Slider from '@react-native-community/slider';

interface Props {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  disabled?: boolean;
}

export function BpmControl({ bpm, onBpmChange, disabled }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <IconButton
          icon="minus"
          size={28}
          onPress={() => onBpmChange(bpm - 1)}
          disabled={disabled}
          iconColor={theme.colors.primary}
        />
        <Text variant="displayMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', minWidth: 100, textAlign: 'center' }}>
          {bpm}
        </Text>
        <IconButton
          icon="plus"
          size={28}
          onPress={() => onBpmChange(bpm + 1)}
          disabled={disabled}
          iconColor={theme.colors.primary}
        />
      </View>
      <Text variant="labelMedium" style={{ color: '#888' }}>BPM</Text>
      <Slider
        style={styles.slider}
        minimumValue={40}
        maximumValue={208}
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
  row: { flexDirection: 'row', alignItems: 'center' },
  slider: { width: '85%', marginTop: 4 },
});
