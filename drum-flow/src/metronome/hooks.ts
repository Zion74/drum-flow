import { useState, useRef, useCallback, useEffect } from 'react';
import { MetronomeEngine, MetronomeState } from './engine';
import { AccelMode, SilentMode } from './modes';
import { AccelModeConfig, SilentModeConfig, SoundPreset, TimeSignature } from '../exercises/types';
import { SOUND_PRESETS } from './sounds';

export type ActiveMode = 'normal' | 'accel' | 'silent';

export interface UseMetronomeReturn {
  state: MetronomeState;
  mode: ActiveMode;
  isSilent: boolean;
  start: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setSoundPreset: (preset: SoundPreset) => Promise<void>;
  setVolumes: (accent: number, normal: number) => void;
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

  const syncState = useCallback(() => {
    setState({ ...engineRef.current.getState() });
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    engine.setOnBeat((beat, _isAccent) => {
      if (silentRef.current && beat === 0) {
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

  const startAccelMode = useCallback(async (config: AccelModeConfig) => {
    accelRef.current?.stop();
    silentRef.current?.reset();
    silentRef.current = null;
    const accel = new AccelMode(engineRef.current, config);
    accel.setOnBpmChange(() => syncState());
    accel.setOnComplete(() => { setMode('normal'); syncState(); });
    accelRef.current = accel;
    setMode('accel');
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
    setMode('normal');
    setIsSilent(false);
  }, []);

  return {
    state, mode, isSilent,
    start, stop, setBpm, setTimeSignature,
    setSoundPreset, setVolumes,
    startAccelMode, startSilentMode, setNormalMode,
  };
}
