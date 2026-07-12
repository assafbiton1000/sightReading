import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

// Wood-block style click: noise burst + tone, fast exponential decay.
// Parametrized so the accented (bar-opening) click can be brighter and louder.
function generateClickWavBase64(tone1Hz: number, tone2Hz: number, gain: number): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * 0.08); // 80ms
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  ws(8, 'WAVE'); ws(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ws(36, 'data'); view.setUint32(40, numSamples * 2, true);

  // Seeded pseudo-random for consistent sound
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed / 0x7fffffff) - 1; };

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Fast attack, exponential decay
    const env = Math.exp(-t * 60);
    // Mix: high-freq tone (wood character) + noise transient
    const tone1 = Math.sin(2 * Math.PI * tone1Hz * t) * 0.6;
    const tone2 = Math.sin(2 * Math.PI * tone2Hz * t) * 0.3 * Math.exp(-t * 120);
    const noise = rand() * 0.4 * Math.exp(-t * 200); // very short noise burst
    const sample = (tone1 + tone2 + noise) * env * gain;
    // Hard clip for "punch"
    const clipped = Math.max(-1, Math.min(1, sample * 1.4));
    view.setInt16(44 + i * 2, Math.round(clipped * 32000), true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

const CLICK_URI = generateClickWavBase64(1800, 3200, 1);
const ACCENT_URI = generateClickWavBase64(2400, 4200, 1.2);

export interface MetronomeOptions {
  /** Click loudness, 0..1. Read live — a settings change applies on the next click. */
  volume?: number;
  /** Accent the first beat of every N beats (4 for 4/4). 0/undefined = no accent. */
  accentEvery?: number;
  /** Optional per-beat callback. The practice screen deliberately does NOT use
   * this — its metronome is an audio aid only and must never touch the engine. */
  onTick?: (beat: number) => void;
}

export function useMetronome(bpm: number, opts: MetronomeOptions = {}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatRef = useRef(0);
  const clickRef = useRef<Audio.Sound | null>(null);
  const accentRef = useRef<Audio.Sound | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    Audio.Sound.createAsync({ uri: CLICK_URI }).then(({ sound }) => { clickRef.current = sound; });
    Audio.Sound.createAsync({ uri: ACCENT_URI }).then(({ sound }) => { accentRef.current = sound; });
    return () => {
      clickRef.current?.unloadAsync();
      accentRef.current?.unloadAsync();
    };
  }, []);

  const start = useCallback(() => {
    beatRef.current = 0;
    const ms = (60 / bpm) * 1000;
    intervalRef.current = setInterval(async () => {
      const { volume = 1, accentEvery = 0, onTick } = optsRef.current;
      const beat = beatRef.current;
      const isAccent = accentEvery > 0 && beat % accentEvery === 0;
      const sound = isAccent ? accentRef.current : clickRef.current;
      if (sound && volume > 0) {
        try {
          await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
          await sound.setPositionAsync(0);
          await sound.playAsync();
        } catch {}
      }
      onTick?.(beat);
      beatRef.current += 1;
    }, ms);
  }, [bpm]);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    beatRef.current = 0;
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { start, stop };
}
