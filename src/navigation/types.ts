import { Clef } from '../constants/levels';
import { BothMode } from '../utils/noteGenerator';

export type RootStackParamList = {
  Home: undefined;
  Practice: { levelId: number; clef: Clef; noteCount: number; bothMode: BothMode };
  Playback: { levelId: number; clef: Clef; noteCount: number; bothMode: BothMode };
  Search: undefined;
  Result: { correct: number; total: number; levelId: number; clef: Clef; noteCount: number; bothMode: BothMode };
  AudioTest: undefined;
  Learning: undefined;
};
