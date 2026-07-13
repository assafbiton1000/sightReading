import type { Lang, T } from './types';
import { he } from './he';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { ru } from './ru';
import { ar } from './ar';
import { pt } from './pt';
import { it } from './it';

export { LANGUAGE_META } from './types';
export type { Lang, T } from './types';

const translations: Record<Lang, T> = { he, en, es, fr, de, ru, ar, pt, it };

// Module-level singleton — survives navigation, cleared on app restart
let currentLang: Lang = 'en';

export const langSettings = {
  get: (): Lang => currentLang,
  set: (lang: Lang) => { currentLang = lang; },
  t: (): T => translations[currentLang],
};

export function tr(key: keyof T): string {
  return translations[currentLang][key] as string;
}
