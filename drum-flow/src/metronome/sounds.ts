import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { SoundPreset } from '../exercises/types';

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'woodblock', name: '木鱼', accentSound: 'woodblock_hi', normalSound: 'woodblock_lo' },
  { id: 'electronic', name: '电子', accentSound: 'electronic_hi', normalSound: 'electronic_lo' },
  { id: 'classic', name: '经典', accentSound: 'classic_hi', normalSound: 'classic_lo' },
];

const SOUND_ASSETS: Record<string, any> = {
  woodblock_hi: require('../../assets/sounds/woodblock_hi.wav'),
  woodblock_lo: require('../../assets/sounds/woodblock_lo.wav'),
  electronic_hi: require('../../assets/sounds/electronic_hi.wav'),
  electronic_lo: require('../../assets/sounds/electronic_lo.wav'),
  classic_hi: require('../../assets/sounds/classic_hi.wav'),
  classic_lo: require('../../assets/sounds/classic_lo.wav'),
};

const playerCache = new Map<string, AudioPlayer>();

export async function preloadSounds(preset: SoundPreset): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: true });
  for (const key of [preset.accentSound, preset.normalSound]) {
    if (!playerCache.has(key)) {
      const player = createAudioPlayer(SOUND_ASSETS[key]);
      playerCache.set(key, player);
    }
  }
}

export async function playSound(assetKey: string, volume: number = 1.0): Promise<void> {
  const player = playerCache.get(assetKey);
  if (!player) return;
  try {
    player.volume = Math.max(0, Math.min(1, volume));
    await player.seekTo(0);
    player.play();
  } catch {
    // Ignore playback errors
  }
}

export async function unloadAllSounds(): Promise<void> {
  for (const player of playerCache.values()) {
    player.remove();
  }
  playerCache.clear();
}
