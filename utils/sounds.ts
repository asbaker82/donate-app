import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// ---------------------------------------------------------------------------
// Web — generate tones via AudioContext (no files needed)
// ---------------------------------------------------------------------------

function playWebTones(
  notes: { freq: number; startSec: number; duration: number }[],
  volume = 0.25,
) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    notes.forEach(({ freq, startSec, duration }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + startSec;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
    const total = Math.max(...notes.map(n => n.startSec + n.duration)) + 0.2;
    setTimeout(() => ctx.close(), total * 1000);
  } catch {
    // AudioContext unavailable or blocked — silent fail
  }
}

// ---------------------------------------------------------------------------
// Native — build a WAV buffer, write to cache, play via expo-av
// ---------------------------------------------------------------------------

function buildWav(
  notes: { freq: number; startMs: number; durationMs: number }[],
  totalMs: number,
  volume = 0.35,
): string {
  const sampleRate   = 22050;
  const totalSamples = Math.floor((sampleRate * totalMs) / 1000);
  const buf          = new ArrayBuffer(44 + totalSamples * 2);
  const view         = new DataView(buf);

  const ws = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  ws(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  ws(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);   // block align
  view.setUint16(34, 16, true);  // bits per sample
  ws(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  const samples = new Float32Array(totalSamples);
  for (const { freq, startMs, durationMs } of notes) {
    const start = Math.floor((startMs   / 1000) * sampleRate);
    const len   = Math.floor((durationMs / 1000) * sampleRate);
    for (let i = 0; i < len && start + i < totalSamples; i++) {
      const fade = Math.pow(1 - i / len, 0.6);
      samples[start + i] += Math.sin((2 * Math.PI * freq * i) / sampleRate) * volume * fade;
    }
  }

  for (let i = 0; i < totalSamples; i++) {
    view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
  }

  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function playNativeWav(base64: string) {
  try {
    const fileUri = `${FileSystem.cacheDirectory}snd_${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(status => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
        FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    });
  } catch {
    // Silent fail — animation still runs
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function playClaimSound() {
  if (Platform.OS === 'web') {
    // C5 → E5 → G5 arpeggio (bright, celebratory)
    playWebTones([
      { freq: 523.25, startSec: 0.00, duration: 0.45 },
      { freq: 659.25, startSec: 0.10, duration: 0.40 },
      { freq: 783.99, startSec: 0.20, duration: 0.55 },
    ]);
  } else {
    const base64 = buildWav([
      { freq: 523.25, startMs:   0, durationMs: 300 },
      { freq: 659.25, startMs: 100, durationMs: 300 },
      { freq: 783.99, startMs: 200, durationMs: 400 },
    ], 700);
    playNativeWav(base64);
  }
}

export function playWaitlistSound() {
  if (Platform.OS === 'web') {
    // Soft two-note ascending "boop"
    playWebTones([
      { freq: 440, startSec: 0.00, duration: 0.22 },
      { freq: 554, startSec: 0.09, duration: 0.28 },
    ], 0.2);
  } else {
    const base64 = buildWav([
      { freq: 440, startMs:  0, durationMs: 180 },
      { freq: 554, startMs: 80, durationMs: 220 },
    ], 320, 0.3);
    playNativeWav(base64);
  }
}
