import { View, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { RhythmPattern, ALL_PATTERNS, PATTERN_CATEGORIES } from '../src/metronome/patterns';

interface Props {
  visible: boolean;
  currentPatternId: string;
  beatIndex: number;
  onSelect: (pattern: RhythmPattern) => void;
  onClose: () => void;
}

function PatternItem({
  pattern,
  isSelected,
  onPress,
  primaryColor,
}: {
  pattern: RhythmPattern;
  isSelected: boolean;
  onPress: () => void;
  primaryColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        isSelected && { borderColor: primaryColor, borderWidth: 2 },
      ]}
    >
      {/* Sub-tick visualization */}
      <View style={styles.itemDots}>
        {pattern.subTicks.map((sub, i) => (
          <View
            key={i}
            style={[
              styles.itemDot,
              {
                backgroundColor: sub.isRest ? 'transparent' : (isSelected ? primaryColor : '#888'),
                borderColor: sub.isRest ? '#555' : 'transparent',
                borderWidth: sub.isRest ? 1 : 0,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.itemLabel, isSelected && { color: primaryColor }]}>
        {pattern.label}
      </Text>
      <Text style={styles.itemName}>{pattern.name}</Text>
    </Pressable>
  );
}

export function PatternSelectorModal({
  visible,
  currentPatternId,
  beatIndex,
  onSelect,
  onClose,
}: Props) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>拍 {beatIndex + 1} 节奏型</Text>
            <Button onPress={onClose} textColor={theme.colors.primary}>完成</Button>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {PATTERN_CATEGORIES.map((cat) => {
              const patterns = ALL_PATTERNS.filter((p) => p.category === cat.key);
              return (
                <View key={cat.key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{cat.label}</Text>
                  <View style={styles.grid}>
                    {patterns.map((p) => (
                      <PatternItem
                        key={p.id}
                        pattern={p}
                        isSelected={p.id === currentPatternId}
                        onPress={() => onSelect(p)}
                        primaryColor={theme.colors.primary}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  scroll: { paddingHorizontal: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { color: '#888', fontSize: 13, marginBottom: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '30%',
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemDots: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    minHeight: 12,
    alignItems: 'center',
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemLabel: { color: '#ccc', fontSize: 14, marginBottom: 2 },
  itemName: { color: '#666', fontSize: 10 },
});
