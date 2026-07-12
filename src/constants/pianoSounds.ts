export type PianoSoundThemeId = 'pop' | 'classic' | 'rock' | 'soft';

export interface PianoSoundTheme {
  id: PianoSoundThemeId;
  name: string;        // genre names are kept as-is across languages
  brightness: number;  // 0..1 — 2nd-harmonic overtone gain (higher = brighter/more electric)
  sustain: number;     // seconds — decay time constant (higher = longer, warmer tail)
}

export const PIANO_SOUND_THEMES: PianoSoundTheme[] = [
  { id: 'pop',     name: 'Pop',     brightness: 0.16, sustain: 0.18 },
  { id: 'classic', name: 'Classic', brightness: 0.10, sustain: 0.30 },
  { id: 'rock',    name: 'Rock',    brightness: 0.30, sustain: 0.10 },
  { id: 'soft',    name: 'Soft',    brightness: 0.06, sustain: 0.36 },
];

export function getPianoSoundTheme(id: PianoSoundThemeId): PianoSoundTheme {
  return PIANO_SOUND_THEMES.find(t => t.id === id) ?? PIANO_SOUND_THEMES[0];
}
