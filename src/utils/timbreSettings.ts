// In-memory timbre settings — updated by AudioTestScreen calibration,
// consumed by PracticeScreen and PlaybackScreen synth HTML.
export interface TimbreSettings {
  brightness: number; // 0.05 – 0.40 (ratio of 2nd harmonic gain)
  sustain: number;    // 0.06 – 0.40 (setTargetAtTime time constant)
}

const defaults: TimbreSettings = { brightness: 0.16, sustain: 0.18 };
let current: TimbreSettings = { ...defaults };

export const timbreSettings = {
  get: (): TimbreSettings => ({ ...current }),
  set: (s: Partial<TimbreSettings>) => { current = { ...current, ...s }; },
  reset: () => { current = { ...defaults }; },
};
