import { NOTE_FREQUENCIES, CHROMATIC_NOTES, PITCH_TOLERANCE_CENTS } from '../constants/notes';

// Convert frequency (Hz) to MIDI note number
export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

// Convert MIDI note number to frequency
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Convert VexFlow note string (e.g. "c/4") to frequency
export function noteToFreq(note: string): number {
  return NOTE_FREQUENCIES[note] ?? 0;
}

// Compare detected frequency against expected note frequency
// Returns true if within PITCH_TOLERANCE_CENTS
export function isNoteMatch(detectedFreq: number, expectedNote: string): boolean {
  const expectedFreq = noteToFreq(expectedNote);
  if (expectedFreq === 0 || detectedFreq <= 0) return false;
  const centsDiff = 1200 * Math.abs(Math.log2(detectedFreq / expectedFreq));
  return centsDiff <= PITCH_TOLERANCE_CENTS;
}

// Get all VexFlow note strings between two notes (inclusive)
export function getNoteRange(low: string, high: string): string[] {
  const allNotes = Object.keys(NOTE_FREQUENCIES);
  const lowFreq = NOTE_FREQUENCIES[low] ?? 0;
  const highFreq = NOTE_FREQUENCIES[high] ?? 0;
  return allNotes.filter(n => {
    const f = NOTE_FREQUENCIES[n];
    return f >= lowFreq && f <= highFreq;
  });
}

// Count beats for a list of durations in a given time signature
export function countBeats(durations: string[], beatsPerBar: number): number {
  const BEATS: Record<string, number> = { w: 4, h: 2, q: 1, '8': 0.5 };
  return durations.reduce((sum, d) => sum + (BEATS[d] ?? 1), 0);
}

// Duration display label
export const DURATION_LABELS: Record<string, string> = {
  w: 'שלם',
  h: 'חצי',
  q: 'רבע',
  '8': 'שמינית',
};
