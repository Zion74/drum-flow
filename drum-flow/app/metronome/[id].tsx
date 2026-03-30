import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, SegmentedButtons, IconButton, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { db } from '../../src/storage/database';
import { exercises } from '../../src/storage/schemas';
import { eq } from 'drizzle-orm';
import { useMetronome } from '../../src/metronome/hooks';
import { getLastSuccessBpm } from '../../src/history/bpm-history';
import { recordSession } from '../../src/history/recorder';
import { BpmControl } from '../../components/BpmControl';
import { BeatVisualizer } from '../../components/BeatVisualizer';
import { SOUND_PRESETS } from '../../src/metronome/sounds';
import { TimeSignature } from '../../src/exercises/types';

const TIME_SIGNATURES: { label: string; value: TimeSignature }[] = [
  { label: '2/4', value: [2, 4] },
  { label: '3/4', value: [3, 4] },
  { label: '4/4', value: [4, 4] },
  { label: '6/8', value: [6, 8] },
];

export default function MetronomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const metronome = useMetronome();

  const [exerciseName, setExerciseName] = useState('练习');
  const [selectedTs, setSelectedTs] = useState('4/4');
  const [selectedSound, setSelectedSound] = useState(SOUND_PRESETS[0].id);
  const startTimeRef = useRef<number>(0);
  const startBpmRef = useRef<number>(0);
  const maxBpmRef = useRef<number>(0);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
      if (rows.length > 0) {
        const ex = rows[0];
        setExerciseName(ex.name);
        const ts: TimeSignature = [ex.defaultTimeSignatureBeats, ex.defaultTimeSignatureNoteValue];
        metronome.setTimeSignature(ts);
        setSelectedTs(`${ts[0]}/${ts[1]}`);
        const lastBpm = await getLastSuccessBpm(id);
        metronome.setBpm(lastBpm ?? ex.defaultBpm);
      }
    }
    load();
    return () => metronome.stop();
  }, [id]);

  useEffect(() => {
    if (metronome.state.bpm > maxBpmRef.current) {
      maxBpmRef.current = metronome.state.bpm;
    }
  }, [metronome.state.bpm]);

  const handleStart = async () => {
    startTimeRef.current = Date.now();
    startBpmRef.current = metronome.state.bpm;
    maxBpmRef.current = metronome.state.bpm;
    await metronome.start();
  };

  const handleStop = () => metronome.stop();

  const handleFinish = (success: boolean) => {
    metronome.stop();
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (duration < 3 || !id) return;

    recordSession({
      exerciseId: id,
      durationSeconds: duration,
      startBpm: startBpmRef.current,
      endBpm: metronome.state.bpm,
      maxBpm: maxBpmRef.current,
      mode: metronome.mode,
      success,
    });

    Alert.alert(
      success ? '练习完成 ✓' : '继续加油',
      `${startBpmRef.current} → ${metronome.state.bpm} BPM · ${Math.round(duration / 60)} 分钟`,
      [{ text: '确定', onPress: () => router.back() }],
    );
  };

  const handleModeChange = async (val: string) => {
    if (val === 'normal') {
      metronome.setNormalMode();
    } else if (val === 'accel') {
      await metronome.startAccelMode({
        startBpm: metronome.state.bpm,
        targetBpm: Math.min(208, metronome.state.bpm + 40),
        intervalSeconds: 30,
        incrementBpm: 2,
      });
    } else if (val === 'silent') {
      await metronome.startSilentMode({
        playBars: 4,
        silentBars: 1,
        silentFrequency: 0.5,
      });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: exerciseName,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: '#fff',
        }}
      />

      <BeatVisualizer
        beats={metronome.state.timeSignature[0]}
        currentBeat={metronome.state.currentBeat}
        isPlaying={metronome.state.isPlaying}
        isSilent={metronome.isSilent}
      />

      <BpmControl
        bpm={metronome.state.bpm}
        onBpmChange={metronome.setBpm}
      />

      <SegmentedButtons
        value={selectedTs}
        onValueChange={(val) => {
          setSelectedTs(val);
          const ts = TIME_SIGNATURES.find((t) => `${t.value[0]}/${t.value[1]}` === val);
          if (ts) metronome.setTimeSignature(ts.value);
        }}
        buttons={TIME_SIGNATURES.map((ts) => ({
          value: `${ts.value[0]}/${ts.value[1]}`,
          label: ts.label,
        }))}
        style={styles.segment}
      />

      <SegmentedButtons
        value={selectedSound}
        onValueChange={async (val) => {
          setSelectedSound(val);
          const preset = SOUND_PRESETS.find((p) => p.id === val);
          if (preset) await metronome.setSoundPreset(preset);
        }}
        buttons={SOUND_PRESETS.map((p) => ({ value: p.id, label: p.name }))}
        style={styles.segment}
      />

      <SegmentedButtons
        value={metronome.mode}
        onValueChange={handleModeChange}
        buttons={[
          { value: 'normal', label: '普通' },
          { value: 'accel', label: '渐进加速' },
          { value: 'silent', label: '沉默测试' },
        ]}
        style={styles.segment}
      />

      <View style={styles.playRow}>
        {!metronome.state.isPlaying ? (
          <IconButton
            icon="play-circle"
            size={80}
            iconColor={theme.colors.primary}
            onPress={handleStart}
          />
        ) : (
          <IconButton
            icon="stop-circle"
            size={80}
            iconColor="#ff5555"
            onPress={handleStop}
          />
        )}
      </View>

      {startTimeRef.current > 0 && !metronome.state.isPlaying && (
        <View style={styles.finishRow}>
          <Button
            mode="contained"
            onPress={() => handleFinish(true)}
            style={styles.finishBtn}
          >
            完成 (成功)
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleFinish(false)}
            style={styles.finishBtn}
          >
            结束 (未达标)
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  segment: { marginVertical: 6 },
  playRow: { alignItems: 'center', marginVertical: 8 },
  finishRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 32 },
  finishBtn: { flex: 1, borderRadius: 12 },
});
