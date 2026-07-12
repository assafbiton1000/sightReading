import { Clef } from '../constants/levels';
import { BothMode, GeneratedNote } from '../utils/noteGenerator';

export type RootStackParamList = {
  Home: undefined;
  Practice: {
    levelId: number; clef: Clef; noteCount: number; bothMode: BothMode;
    /** When set, Practice plays this fixed song instead of generating a random exercise.
     * bpm comes from the Song Library's own 1-5 difficulty scale, not `levelId`. */
    song?: { name: string; notes: GeneratedNote[]; bpm: number };
  };
  Playback: { levelId: number; clef: Clef; noteCount: number; bothMode: BothMode };
  SongLibrary: undefined;
  Result: {
    correct: number; total: number; levelId: number; clef: Clef; noteCount: number; bothMode: BothMode;
    /** Streak/accuracy as they stood right before this session — lets Result show what changed. */
    prevStreak: number; prevAvgAccuracy: number | null;
  };
  AudioTest: undefined;
  Learning: undefined;
  Settings: undefined;
  Statistics: undefined;
};
