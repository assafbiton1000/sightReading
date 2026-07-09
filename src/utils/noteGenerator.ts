import { Level, Clef, NoteDuration } from '../constants/levels';
import { DURATION_BEATS, KEY_SIGNATURES } from '../constants/notes';
import { getNoteRange } from './musicTheory';

export type BothMode = 'sequential' | 'simultaneous';

export interface GeneratedNote {
  keys: string[];
  duration: NoteDuration;
  clef: 'treble' | 'bass';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateForClef(
  level: Level,
  activeClef: 'treble' | 'bass',
  noteCount: number
): GeneratedNote[] {
  const range = level.noteRange[activeClef];
  const availableNotes = getNoteRange(range[0], range[1]);
  const notes: GeneratedNote[] = [];

  for (let i = 0; i < noteCount; i++) {
    const duration = pickRandom(level.durations);
    const numNotes =
      level.allowChords && Math.random() < 0.3
        ? Math.min(level.chordSize, 2 + Math.floor(Math.random() * (level.chordSize - 1)))
        : 1;

    const keys: string[] = [];
    const rootNote = pickRandom(availableNotes);
    keys.push(rootNote);

    if (numNotes > 1) {
      const rootIdx = availableNotes.indexOf(rootNote);
      const intervals = [2, 4];
      for (let j = 0; j < numNotes - 1 && j < intervals.length; j++) {
        const idx = rootIdx + intervals[j];
        if (idx < availableNotes.length) keys.push(availableNotes[idx]);
      }
    }

    notes.push({ keys, duration, clef: activeClef });
  }

  return notes;
}

/**
 * Generate exercise notes.
 * - single clef ('treble' | 'bass'): returns noteCount notes for that clef
 * - 'both' + sequential: returns [treble×N, bass×N] — right hand then left
 * - 'both' + simultaneous: returns interleaved [t0, b0, t1, b1, …] — paired
 */
export function generateExercise(
  level: Level,
  clef: Clef,
  noteCount: number,
  bothMode: BothMode = 'sequential'
): GeneratedNote[] {
  if (clef !== 'both') {
    const activeClef = clef as 'treble' | 'bass';
    return generateForClef(level, activeClef, noteCount);
  }

  // Both clefs
  const treble = generateForClef(level, 'treble', noteCount);
  const bass = generateForClef(level, 'bass', noteCount);

  if (bothMode === 'sequential') {
    // Interleave by lines: [treble_line1, bass_line1, treble_line2, bass_line2, …]
    // So practice order follows the visual grand staff: right-hand line, then left-hand line, repeat.
    const NOTES_PER_LINE = 8;
    const result: GeneratedNote[] = [];
    for (let lineStart = 0; lineStart < noteCount; lineStart += NOTES_PER_LINE) {
      const lineEnd = Math.min(lineStart + NOTES_PER_LINE, noteCount);
      for (let i = lineStart; i < lineEnd; i++) result.push(treble[i]);
      for (let i = lineStart; i < lineEnd; i++) result.push(bass[i]);
    }
    return result;
  } else {
    // simultaneous: interleave [t0, b0, t1, b1, ...]
    const result: GeneratedNote[] = [];
    for (let i = 0; i < noteCount; i++) {
      result.push(treble[i]);
      result.push(bass[i]);
    }
    return result;
  }
}

export function getRandomKeySignature(maxSharpsFlats: number): string {
  const maxLevel = Math.min(maxSharpsFlats, 7);
  const count = Math.floor(Math.random() * (maxLevel + 1));
  const options = KEY_SIGNATURES[count] ?? ['C'];
  return pickRandom(options);
}
