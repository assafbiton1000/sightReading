import { useSettings } from '../context/SettingsContext';

// Neutral/structural colors — background, surface, text, borders. These are what
// actually flip between light and dark. Each screen keeps its own semantic accent
// color (e.g. Learning's purple, Playback's green) unaffected by the theme; screens
// that use the app's default blue accent pull `primary`/`primaryTint` from here too.
export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  chipBg: string;
  primary: string;
  primaryTint: string;
  /** Semi-opaque scrim for overlays (countdown screen, loading states) — matches bg. */
  overlay: string;
}

export const LIGHT_THEME: ThemeColors = {
  bg: '#F7F7FB',
  card: '#FFFFFF',
  text: '#161821',
  muted: '#9096AC',
  border: '#EEEFF4',
  chipBg: '#F1F2F7',
  primary: '#4F6EF7',
  primaryTint: 'rgba(79,110,247,0.08)',
  overlay: 'rgba(255,255,255,0.88)',
};

export const DARK_THEME: ThemeColors = {
  bg: '#0F1117',
  card: '#1A1C25',
  text: '#F1F2F6',
  muted: '#8B90A3',
  border: '#2A2D3A',
  chipBg: '#22242F',
  primary: '#6C8CFF',
  primaryTint: 'rgba(108,140,255,0.16)',
  overlay: 'rgba(15,17,23,0.9)',
};

export function useTheme(): ThemeColors {
  const { settings } = useSettings();
  return settings.darkMode ? DARK_THEME : LIGHT_THEME;
}

export function useIsDark(): boolean {
  const { settings } = useSettings();
  return settings.darkMode;
}
