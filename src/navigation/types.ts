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
  Playback: {
    levelId: number; clef: Clef; noteCount: number; bothMode: BothMode;
    /** When set, Playback plays this fixed song instead of generating a random exercise. */
    song?: { name: string; notes: GeneratedNote[]; bpm: number };
  };
  SongLibrary: undefined;
  Result: {
    correct: number; total: number; levelId: number; clef: Clef; noteCount: number; bothMode: BothMode;
    /** Notes with the right pitch but a clearly wrong relative duration (free-tempo rhythm analysis). */
    rhythmErrors?: number;
    /** Notes never reached because the player stopped the exercise early. */
    skipped?: number;
    /** Streak/accuracy as they stood right before this session — lets Result show what changed. */
    prevStreak: number; prevAvgAccuracy: number | null;
  };
  AudioTest: undefined;
  Learning: undefined;
  Settings: undefined;
  Statistics: undefined;
  Help: undefined;
  About: undefined;
  Support: undefined;
  Leaderboard: undefined;
  Profile: undefined;
  /** In-app admin dashboard — reachable only when the signed-in user is is_admin. */
  Admin: undefined;
  /** Forum moderation queue — admin-only; approve or delete pending comments. */
  ForumModeration: undefined;
  Auth: { mode?: 'signin' | 'signup' } | undefined;
  /** Reached via the reset-password email deep link (App navigates here automatically). */
  ResetPassword: undefined;
};
