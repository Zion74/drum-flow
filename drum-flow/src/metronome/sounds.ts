import { Audio } from 'expo-av';
import { SoundPreset } from '../exercises/types';

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'woodblock', name: '木鱼', accentSound: 'woodblock_hi', normalSound: 'woodblock_lo' },
  { id: 'electronic', name: '电子', accentSound: 'electronic_hi', normalSound: 'electronic_lo' },
  { id: 'classic', name: '经典', accentSound: 'classic_hi', normalSound: 'classic_lo' },
];

// Static requires — Expo needs these at build time
const SOUND_ASSETS: Record<string, any> = {
  woodblock_hi: require('../../assets/sounds/woodblock_hi.wav'),
  woodblock_lo: require('../../assets/sounds/woodblock_lo.wav'),
  electronic_hi: require('../../assets/sounds/electronic_hi.wav'),
  electronic_lo: require('../../assets/sounds/electronic_lo.wav'),
  classic_hi: require('../../assets/sounds/classic_hi.wav'),
  classic_lo: require('../../assets/sounds/classic_lo.wav'),
};

const soundCache = new Map<string, Audio.Sound>();

export async function preloadSounds(preset: SoundPreset): Promise<void> {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  for (const key of [preset.accentSound, preset.normalSound]) {
    if (!soundCache.has(key)) {
      const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[key]);
      soundCache.set(key, sound);
    }
  }
}

export async function playSound(assetKey: string, volume: number = 1.0): Promise<void> {
  const sound = soundCache.get(assetKey);
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    await sound.playAsync();
  } catch {
    // Ignore playback errors (e.g. sound unloaded mid-session)
  }
}

export async function unloadAllSounds(): Promise<void> {
  for (const sound of soundCache.values()) {
    await sound.unloadAsync();
  }
  soundCache.clear();
}
