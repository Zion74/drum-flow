import { useState, useRef, useCallback, useEffect } from 'react';
import { MetronomeEngine, MetronomeState } from './engine';
import { AccelMode, SilentMode } from './modes';
import { AccelModeConfig, SilentModeConfig, SoundPreset, TimeSignature } from '../exercises/types';
import { SOUND_PRESETS } from './sounds';
import { RhythmPattern, DEFAULT_PATTERN } from './patterns';

export type ActiveMode = 'normal' | 'accel' | 'silent';

export interface AccelProgress {
  startBpm: number;
  targetBpm: number;
  currentBpm: number;
}

export interface UseMetronomeReturn {
  state: MetronomeState;
  mode: ActiveMode;
  isSilent: boolean;
  accelProgress: AccelProgress | null;
  start: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setSoundPreset: (preset: SoundPreset) => Promise<void>;
  setVolumes: (accent: number, normal: number) => void;
  setBeatPattern: (beatIndex: number, pattern: RhythmPattern) => void;
  setBeatPatterns: (patterns: RhythmPattern[]) => void;
  syncAllToFirst: () => void;
  resetAllPatterns: () => void;
  startAccelMode: (config: AccelModeConfig) => Promise<void>;
  startSilentMode: (config: SilentModeConfig) => Promise<void>;
  setNormalMode: () => void;
}

export function useMetronome(): UseMetronomeReturn {
  const engineRef = useRef(new MetronomeEngine());
  const accelRef = useRef<AccelMode | null>(null);
  const silentRef = useRef<SilentMode | null>(null);

  const [state, setState] = useState<MetronomeState>(engineRef.current.getState());
  const [mode, setMode] = useState<ActiveMode>('normal');
  const [isSilent, setIsSilent] = useState(false);
  const [accelProgress, setAccelProgress] = useState<AccelProgress | null>(null);
  const accelConfigRef = useRef<AccelModeConfig | null>(null);

  const syncState = useCallback(() => {
    setState({ ...engineRef.current.getState() });
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    engine.setOnBeat((beat, _isAccent, subTick) => {
      // Only trigger bar start on beat 0, sub-tick 0
      if (silentRef.current && beat === 0 && subTick === 0) {
        silentRef.current.onBarStart();
      }
      syncState();
    });
    return () => {
      engine.stop();
      accelRef.current?.stop();
    };
  }, [syncState]);

  const start = useCallback(async () => {
    await engineRef.current.start();
    syncState();
  }, [syncState]);

  const stop = useCallback(() => {
    engineRef.current.stop();
    accelRef.current?.stop();
    silentRef.current?.reset();
    setIsSilent(false);
    syncState();
  }, [syncState]);

  const setBpm = useCallback((bpm: number) => {
    engineRef.current.setBpm(bpm);
    syncState();
  }, [syncState]);

  const setTimeSignature = useCallback((ts: TimeSignature) => {
    engineRef.current.setTimeSignature(ts);
    syncState();
  }, [syncState]);

  const setSoundPreset = useCallback(async (preset: SoundPreset) => {
    await engineRef.current.setSoundPreset(preset);
    syncState();
  }, [syncState]);

  const setVolumes = useCallback((accent: number, normal: number) => {
    engineRef.current.setVolumes(accent, normal);
    syncState();
  }, [syncState]);

  const setBeatPattern = useCallback((beatIndex: number, pattern: RhythmPattern) => {
    engineRef.current.setBeatPattern(beatIndex, pattern);
    syncState();
  }, [syncState]);

  const setBeatPatterns = useCallback((patterns: RhythmPattern[]) => {
    engineRef.current.setBeatPatterns(patterns);
    syncState();
  }, [syncState]);

  const syncAllToFirst = useCallback(() => {
    const patterns = engineRef.current.getState().beatPatterns;
    if (patterns.length === 0) return;
    const first = patterns[0];
    engineRef.current.setBeatPatterns(patterns.map(() => first));
    syncState();
  }, [syncState]);

  const resetAllPatterns = useCallback(() => {
    const patterns = engineRef.current.getState().beatPatterns;
    engineRef.current.setBeatPatterns(patterns.map(() => DEFAULT_PATTERN));
    syncState();
  }, [syncState]);

  const startAccelMode = useCallback(async (config: AccelModeConfig) => {
    accelRef.current?.stop();
    silentRef.current?.reset();
    silentRef.current = null;
    accelConfigRef.current = config;
    const accel = new AccelMode(engineRef.current, config);
    accel.setOnBpmChange((bpm) => {
      setAccelProgress({ startBpm: config.startBpm, targetBpm: config.targetBpm, currentBpm: bpm });
      syncState();
    });
    accel.setOnComplete(() => {
      setMode('normal');
      setAccelProgress(null);
      accelConfigRef.current = null;
      syncState();
    });
    accelRef.current = accel;
    setMode('accel');
    setAccelProgress({ startBpm: config.startBpm, targetBpm: config.targetBpm, currentBpm: config.startBpm });
    accel.start();
    if (!engineRef.current.getState().isPlaying) {
      await engineRef.current.start();
    }
    syncState();
  }, [syncState]);

  const startSilentMode = useCallback(async (config: SilentModeConfig) => {
    accelRef.current?.stop();
    silentRef.current?.reset();
    const silent = new SilentMode(engineRef.current, config);
    silent.setOnSilentChange(setIsSilent);
    silentRef.current = silent;
    setMode('silent');
    if (!engineRef.current.getState().isPlaying) {
      await engineRef.current.start();
    }
    syncState();
  }, [syncState]);

  const setNormalMode = useCallback(() => {
    accelRef.current?.stop();
    silentRef.current?.reset();
    silentRef.current = null;
    accelRef.current = null;
    accelConfigRef.current = null;
    setMode('normal');
    setIsSilent(false);
    setAccelProgress(null);
  }, []);

  return {
    state, mode, isSilent, accelProgress,
    start, stop, setBpm, setTimeSignature,
    setSoundPreset, setVolumes,
    setBeatPattern, setBeatPatterns, syncAllToFirst, resetAllPatterns,
    startAccelMode, startSilentMode, setNormalMode,
  };
}
