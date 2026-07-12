// Note name to frequency (Hz) mapping — A4 = 440 Hz
export const NOTE_FREQUENCIES: Record<string, number> = {
  'a/1': 55.0,  'b/1': 61.74,
  'c/2': 65.41, 'd/2': 73.42, 'e/2': 82.41, 'f/2': 87.31,
  'g/2': 98.0,  'a/2': 110.0, 'b/2': 123.47,
  'c/3': 130.81,'d/3': 146.83,'e/3': 164.81,'f/3': 174.61,
  'g/3': 196.0, 'a/3': 220.0, 'b/3': 246.94,
  'c/4': 261.63,'d/4': 293.66,'e/4': 329.63,'f/4': 349.23,
  'g/4': 392.0, 'a/4': 440.0, 'b/4': 493.88,
  'c/5': 523.25,'d/5': 587.33,'e/5': 659.25,'f/5': 698.46,
  'g/5': 783.99,'a/5': 880.0, 'b/5': 987.77,
  'c/6': 1046.5,'d/6': 1174.66,'e/6': 1318.51,
};

// Chromatic note order for range arithmetic
export const CHROMATIC_NOTES = ['c','d','e','f','g','a','b'];

// VexFlow key signature map (sharps/flats count → key name)
export const KEY_SIGNATURES: Record<number, string[]> = {
  0: ['C'],
  1: ['G', 'F'],
  2: ['D', 'Bb'],
  3: ['A', 'Eb'],
  4: ['E', 'Ab'],
  5: ['B', 'Db'],
  6: ['F#', 'Gb'],
  7: ['C#', 'Cb'],
};

export const DURATION_BEATS: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  '8': 0.5,
};

// Tolerance in cents for pitch matching
export const PITCH_TOLERANCE_CENTS = 50;
