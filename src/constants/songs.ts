import { GeneratedNote } from '../utils/noteGenerator';

// Song Library has its own independent 1–5 difficulty scale — separate from the
// main app's 8-level system used by Sight Reading / Playback. Same melody at every
// level; difficulty comes only from tempo (BPM), scaled with deliberately big jumps.
export interface SongDifficulty {
  id: number; // 1 (easiest) .. 5 (hardest)
  bpm: number;
}

export const SONG_DIFFICULTIES: SongDifficulty[] = [
  { id: 1, bpm: 50 },
  { id: 2, bpm: 70 },
  { id: 3, bpm: 85 },
  { id: 4, bpm: 100 },
  { id: 5, bpm: 120 },
];

export interface Song {
  id: string;
  name: string;      // English display name — also matched by search
  composer: string;   // "Traditional" for folk tunes, or the composer's name
  levelId: number;    // which SONG_DIFFICULTIES id (1-5) this song is practiced at
  notes: GeneratedNote[];
}

// First stage: a small local library of well-known, simple public-domain melodies.
// Notes are plain quarter/half notes in C major (treble clef) so they render with
// the existing SheetMusic/Practice pipeline exactly like a generated exercise.
export const SONGS: Song[] = [
  {
    id: 'hot-cross-buns',
    name: 'Hot Cross Buns',
    composer: 'Traditional',
    levelId: 1,
    notes: [
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'h', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'h', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'h', clef: 'treble' },
    ],
  },
  {
    id: 'twinkle-twinkle',
    name: 'Twinkle Twinkle Little Star',
    composer: 'Traditional',
    levelId: 1,
    notes: [
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['a/4'], duration: 'q', clef: 'treble' },
      { keys: ['a/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'h', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'h', clef: 'treble' },
    ],
  },
  {
    id: 'mary-had-a-little-lamb',
    name: 'Mary Had a Little Lamb',
    composer: 'Traditional',
    levelId: 1,
    notes: [
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'h', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'h', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'h', clef: 'treble' },
    ],
  },
  {
    id: 'row-row-row-your-boat',
    name: 'Row, Row, Row Your Boat',
    composer: 'Traditional',
    levelId: 1,
    notes: [
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'h', clef: 'treble' },
      // Merrily, merrily, merrily, merrily,
      { keys: ['c/5'], duration: 'q', clef: 'treble' },
      { keys: ['c/5'], duration: 'q', clef: 'treble' },
      { keys: ['c/5'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      // Life is but a dream.
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'h', clef: 'treble' },
    ],
  },
  {
    id: 'ode-to-joy',
    name: 'Ode to Joy',
    composer: 'Beethoven',
    levelId: 1,
    notes: [
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'h', clef: 'treble' },
      // Phrase 2 — same shape, cadences on C instead of D.
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'h', clef: 'treble' },
      // Bridge
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'h', clef: 'treble' },
      // Final phrase — full return of the main theme.
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['g/4'], duration: 'q', clef: 'treble' },
      { keys: ['f/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['e/4'], duration: 'q', clef: 'treble' },
      { keys: ['d/4'], duration: 'q', clef: 'treble' },
      { keys: ['c/4'], duration: 'h', clef: 'treble' },
    ],
  },
];
