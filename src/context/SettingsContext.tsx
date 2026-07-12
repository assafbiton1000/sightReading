import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PianoSoundThemeId, getPianoSoundTheme } from '../constants/pianoSounds';
import { timbreSettings } from '../utils/timbreSettings';

export type AudioInputSource = 'mic' | 'midi';
export type NoteNamingStyle = 'letters' | 'solfege';

export interface AppSettings {
  audioInputSource: AudioInputSource;
  micSensitivity: number;      // 0..1, higher = picks up quieter sounds
  audioFeedback: boolean;      // play a piano sound when a note is hit correctly
  pianoSoundTheme: PianoSoundThemeId; // Pop / Classic / Rock / Soft synth timbre preset
  noteNaming: NoteNamingStyle; // C-D-E vs Do-Re-Mi
  colorfulNotes: boolean;      // color notes by pitch instead of by state only
  staffSize: number;           // 0.8..1.3 scale factor for the staff
  darkMode: boolean;           // switches the whole app's color theme
  countIn: boolean;            // 4-beat countdown before practice starts
  liveErrorFeedback: boolean;  // show correct/wrong per-note in real time vs only at the end
  dailyReminder: boolean;      // preference only — no notification is scheduled yet
  dailyReminderTime: string;   // "HH:MM"
}

export const DEFAULT_SETTINGS: AppSettings = {
  audioInputSource: 'mic',
  micSensitivity: 0.5,
  audioFeedback: true,
  pianoSoundTheme: 'pop',
  noteNaming: 'solfege',
  colorfulNotes: false,
  staffSize: 1,
  darkMode: false,
  countIn: true,
  liveErrorFeedback: true,
  dailyReminder: false,
  dailyReminderTime: '18:00',
};

const STORAGE_KEY = '@sightreading/settings';

interface SettingsCtx {
  settings: AppSettings;
  loaded: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const merged = { ...DEFAULT_SETTINGS, ...parsed };
            setSettings(merged);
            // timbreSettings never persists on its own — re-apply the saved sound
            // theme so the synth matches what the user picked last session.
            const theme = getPianoSoundTheme(merged.pianoSoundTheme);
            timbreSettings.set({ brightness: theme.brightness, sustain: theme.sustain });
          } catch (_) {}
        }
      })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    if (key === 'pianoSoundTheme') {
      const theme = getPianoSoundTheme(value as PianoSoundThemeId);
      timbreSettings.set({ brightness: theme.brightness, sustain: theme.sustain });
    }
  }, []);

  return <Ctx.Provider value={{ settings, loaded, updateSetting }}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
