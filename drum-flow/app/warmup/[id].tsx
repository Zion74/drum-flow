import { View, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { Text, Button, Card, IconButton, TextInput, Switch, useTheme, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { db } from '../../src/storage/database';
import { warmupRoutines, warmupItems, exercises } from '../../src/storage/schemas';
import { eq, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface WarmupItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  durationMinutes: number;
  startBpm: number;
  targetBpm: number | null;
  useAccelMode: boolean;
}

interface ExerciseOption {
  id: string;
  name: string;
  defaultBpm: number;
}

export default function WarmupEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [routineName, setRoutineName] = useState('');
  const [items, setItems] = useState<WarmupItem[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseOption[]>([]);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const routine = await db.select().from(warmupRoutines).where(eq(warmupRoutines.id, id)).limit(1);
      if (routine.length > 0) setRoutineName(routine[0].name);

      const rows = await db
        .select({
          id: warmupItems.id,
          exerciseId: warmupItems.exerciseId,
          exerciseName: exercises.name,
          order: warmupItems.order,
          durationMinutes: warmupItems.durationMinutes,
          startBpm: warmupItems.startBpm,
          targetBpm: warmupItems.targetBpm,
          useAccelMode: warmupItems.useAccelMode,
        })
        .from(warmupItems)
        .innerJoin(exercises, eq(warmupItems.exerciseId, exercises.id))
        .where(eq(warmupItems.routineId, id))
        .orderBy(asc(warmupItems.order));

      setItems(rows as WarmupItem[]);

      const exRows = await db.select({
        id: exercises.id,
        name: exercises.name,
        defaultBpm: exercises.defaultBpm,
      }).from(exercises);
      setAllExercises(exRows);
    }
    load();
  }, [id]);

  const updateItem = useCallback((itemId: string, patch: Partial<WarmupItem>) => {
    setItems((prev) => prev.map((it) => it.id === itemId ? { ...it, ...patch } : it));
  }, []);

  const moveItem = useCallback((index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((it, i) => ({ ...it, order: i }));
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId).map((it, i) => ({ ...it, order: i })));
  }, []);

  const addExercise = useCallback((ex: ExerciseOption) => {
    const newItem: WarmupItem = {
      id: nanoid(),
      exerciseId: ex.id,
      exerciseName: ex.name,
      order: items.length,
      durationMinutes: 3,
      startBpm: ex.defaultBpm,
      targetBpm: null,
      useAccelMode: false,
    };
    setItems((prev) => [...prev, newItem]);
    setShowAddPicker(false);
  }, [items.length]);

  const save = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      await db.update(warmupRoutines)
        .set({ name: routineName, updatedAt: new Date() })
        .where(eq(warmupRoutines.id, id));

      // Delete all existing items and re-insert
      await db.delete(warmupItems).where(eq(warmupItems.routineId, id));
      for (const item of items) {
        await db.insert(warmupItems).values({
          id: item.id,
          routineId: id,
          exerciseId: item.exerciseId,
          order: item.order,
          durationMinutes: item.durationMinutes,
          startBpm: item.startBpm,
          targetBpm: item.targetBpm ?? null,
          useAccelMode: item.useAccelMode,
        });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }, [id, routineName, items, router]);

  const totalMinutes = items.reduce((s, it) => s + it.durationMinutes, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '编辑热身方案',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: '#fff',
          headerRight: () => (
            <Button
              onPress={save}
              loading={saving}
              textColor={theme.colors.primary}
              compact
            >
              保存
            </Button>
          ),
        }}
      />

      {/* Routine name */}
      <TextInput
        label="方案名称"
        value={routineName}
        onChangeText={setRoutineName}
        mode="outlined"
        style={styles.nameInput}
        textColor="#fff"
      />

      {/* Summary */}
      <Text style={styles.summary}>
        共 {items.length} 项 · 约 {totalMinutes} 分钟
      </Text>

      {/* Items */}
      {items.map((item, index) => (
        <Card key={item.id} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {/* Header row */}
            <View style={styles.itemHeader}>
              <View style={styles.itemMeta}>
                <Text style={styles.itemOrder}>{index + 1}</Text>
                <Text style={styles.itemName}>{item.exerciseName}</Text>
              </View>
              <View style={styles.itemActions}>
                <IconButton
                  icon="chevron-up"
                  size={18}
                  onPress={() => moveItem(index, -1)}
                  disabled={index === 0}
                  iconColor="#888"
                />
                <IconButton
                  icon="chevron-down"
                  size={18}
                  onPress={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  iconColor="#888"
                />
                <IconButton
                  icon="close"
                  size={18}
                  onPress={() => removeItem(item.id)}
                  iconColor="#ff5555"
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Config row */}
            <View style={styles.configRow}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>时长(分钟)</Text>
                <View style={styles.stepper}>
                  <IconButton
                    icon="minus"
                    size={16}
                    onPress={() => updateItem(item.id, { durationMinutes: Math.max(1, item.durationMinutes - 1) })}
                    iconColor={theme.colors.primary}
                  />
                  <Text style={[styles.stepperVal, { color: '#fff' }]}>{item.durationMinutes}</Text>
                  <IconButton
                    icon="plus"
                    size={16}
                    onPress={() => updateItem(item.id, { durationMinutes: item.durationMinutes + 1 })}
                    iconColor={theme.colors.primary}
                  />
                </View>
              </View>

              <View style={styles.configItem}>
                <Text style={styles.configLabel}>起始 BPM</Text>
                <View style={styles.stepper}>
                  <IconButton
                    icon="minus"
                    size={16}
                    onPress={() => updateItem(item.id, { startBpm: Math.max(40, item.startBpm - 5) })}
                    iconColor={theme.colors.primary}
                  />
                  <Text style={[styles.stepperVal, { color: '#fff' }]}>{item.startBpm}</Text>
                  <IconButton
                    icon="plus"
                    size={16}
                    onPress={() => updateItem(item.id, { startBpm: Math.min(208, item.startBpm + 5) })}
                    iconColor={theme.colors.primary}
                  />
                </View>
              </View>
            </View>

            {/* Accel mode toggle */}
            <View style={styles.accelRow}>
              <Text style={styles.configLabel}>渐进加速</Text>
              <Switch
                value={item.useAccelMode}
                onValueChange={(v) => updateItem(item.id, { useAccelMode: v, targetBpm: v ? item.startBpm + 20 : null })}
                color={theme.colors.primary}
              />
              {item.useAccelMode && (
                <View style={styles.stepper}>
                  <Text style={styles.configLabel}>目标</Text>
                  <IconButton
                    icon="minus"
                    size={16}
                    onPress={() => updateItem(item.id, { targetBpm: Math.max(item.startBpm + 5, (item.targetBpm ?? item.startBpm + 20) - 5) })}
                    iconColor={theme.colors.primary}
                  />
                  <Text style={[styles.stepperVal, { color: '#fff' }]}>{item.targetBpm ?? item.startBpm + 20}</Text>
                  <IconButton
                    icon="plus"
                    size={16}
                    onPress={() => updateItem(item.id, { targetBpm: Math.min(208, (item.targetBpm ?? item.startBpm + 20) + 5) })}
                    iconColor={theme.colors.primary}
                  />
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      ))}

      {/* Add exercise button */}
      <Button
        mode="outlined"
        icon="plus"
        onPress={() => setShowAddPicker(true)}
        style={styles.addBtn}
        textColor={theme.colors.primary}
      >
        添加练习
      </Button>

      {/* Exercise picker */}
      {showAddPicker && (
        <Card style={[styles.pickerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>选择练习</Text>
              <IconButton icon="close" size={18} onPress={() => setShowAddPicker(false)} iconColor="#888" />
            </View>
            {allExercises.map((ex) => (
              <Pressable key={ex.id} onPress={() => addExercise(ex)} style={styles.pickerItem}>
                <Text style={styles.pickerItemText}>{ex.name}</Text>
                <Text style={styles.pickerItemBpm}>{ex.defaultBpm} BPM</Text>
              </Pressable>
            ))}
          </Card.Content>
        </Card>
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  nameInput: { marginBottom: 8, backgroundColor: '#1a1a1a' },
  summary: { color: '#888', fontSize: 12, marginBottom: 12 },
  itemCard: { borderRadius: 12, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  itemOrder: { color: '#666', fontSize: 12, width: 20 },
  itemName: { color: '#fff', fontSize: 14, fontWeight: '500', flex: 1 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  divider: { backgroundColor: '#2a2a2a', marginVertical: 8 },
  configRow: { flexDirection: 'row', gap: 16 },
  configItem: { flex: 1 },
  configLabel: { color: '#888', fontSize: 11, marginBottom: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepperVal: { fontSize: 16, fontWeight: '600', minWidth: 36, textAlign: 'center' },
  accelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addBtn: { borderRadius: 12, marginTop: 4, borderColor: '#333' },
  pickerCard: { borderRadius: 12, marginTop: 8 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pickerTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pickerItem: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  pickerItemText: { color: '#ddd', fontSize: 14 },
  pickerItemBpm: { color: '#666', fontSize: 12 },
});
