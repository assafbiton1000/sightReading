export type Clef = 'treble' | 'bass' | 'both';
export type NoteDuration = 'w' | 'h' | 'q' | '8';

export interface Level {
  id: number;
  name: string;
  nameHe: string;
  bpm: number;
  clefs: Clef[];
  durations: NoteDuration[];
  noteRange: { treble: [string, string]; bass: [string, string] };
  maxSharpsFlats: number; // key signature complexity
  allowChords: boolean;
  chordSize: number;
  timeSignatures: [number, number][];
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Absolute Beginner',
    nameHe: 'מתחיל מוחלט',
    bpm: 60,
    clefs: ['treble'],
    durations: ['q'],
    noteRange: { treble: ['c/4', 'g/4'], bass: ['c/3', 'g/3'] },
    maxSharpsFlats: 0,
    allowChords: false,
    chordSize: 1,
    timeSignatures: [[4, 4]],
  },
  {
    id: 2,
    name: 'Beginner',
    nameHe: 'מתחיל',
    bpm: 65,
    clefs: ['treble'],
    durations: ['q', 'h'],
    noteRange: { treble: ['c/4', 'c/5'], bass: ['c/3', 'c/4'] },
    maxSharpsFlats: 0,
    allowChords: false,
    chordSize: 1,
    timeSignatures: [[4, 4]],
  },
  {
    id: 3,
    name: 'Elementary',
    nameHe: 'בסיסי',
    bpm: 70,
    clefs: ['treble'],
    durations: ['q', 'h', 'w'],
    noteRange: { treble: ['b/3', 'e/5'], bass: ['b/2', 'e/4'] },
    maxSharpsFlats: 1,
    allowChords: false,
    chordSize: 1,
    timeSignatures: [[4, 4]],
  },
  {
    id: 4,
    name: 'Elementary+',
    nameHe: 'בסיסי+',
    bpm: 75,
    clefs: ['treble', 'bass'],
    durations: ['q', 'h', 'w', '8'],
    noteRange: { treble: ['a/3', 'f/5'], bass: ['a/2', 'f/4'] },
    maxSharpsFlats: 2,
    allowChords: false,
    chordSize: 1,
    timeSignatures: [[4, 4], [3, 4]],
  },
  {
    id: 5,
    name: 'Intermediate',
    nameHe: 'בינוני',
    bpm: 80,
    clefs: ['treble', 'bass'],
    durations: ['q', 'h', '8'],
    noteRange: { treble: ['g/3', 'g/5'], bass: ['g/2', 'g/4'] },
    maxSharpsFlats: 2,
    allowChords: true,
    chordSize: 2,
    timeSignatures: [[4, 4], [3, 4]],
  },
  {
    id: 6,
    name: 'Intermediate+',
    nameHe: 'בינוני+',
    bpm: 90,
    clefs: ['treble', 'bass', 'both'],
    durations: ['q', 'h', '8'],
    noteRange: { treble: ['e/3', 'a/5'], bass: ['e/2', 'a/4'] },
    maxSharpsFlats: 3,
    allowChords: true,
    chordSize: 3,
    timeSignatures: [[4, 4], [3, 4], [6, 8]],
  },
  {
    id: 7,
    name: 'Advanced',
    nameHe: 'מתקדם',
    bpm: 100,
    clefs: ['treble', 'bass', 'both'],
    durations: ['q', 'h', '8', 'w'],
    noteRange: { treble: ['c/3', 'c/6'], bass: ['c/2', 'c/5'] },
    maxSharpsFlats: 4,
    allowChords: true,
    chordSize: 3,
    timeSignatures: [[4, 4], [3, 4], [6, 8]],
  },
  {
    id: 8,
    name: 'Expert',
    nameHe: 'מומחה',
    bpm: 120,
    clefs: ['treble', 'bass', 'both'],
    durations: ['q', 'h', '8', 'w'],
    noteRange: { treble: ['a/2', 'e/6'], bass: ['a/1', 'e/5'] },
    maxSharpsFlats: 7,
    allowChords: true,
    chordSize: 4,
    timeSignatures: [[4, 4], [3, 4], [6, 8], [2, 4]],
  },
];

export const NOTE_COUNT_OPTIONS = [4, 8, 12, 16];
