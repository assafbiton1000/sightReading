// YIN pitch detection algorithm
// Operates on a Float32Array of audio samples

const DEFAULT_THRESHOLD = 0.1;

export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const bufferSize = buffer.length;
  const yinBuffer = new Float32Array(bufferSize / 2);

  // Step 1: Difference function
  for (let tau = 0; tau < yinBuffer.length; tau++) {
    let sum = 0;
    for (let i = 0; i < yinBuffer.length; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // Step 2: Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBuffer.length; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
  }

  // Step 3: Absolute threshold — find first dip below threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < yinBuffer.length; tau++) {
    if (yinBuffer[tau] < DEFAULT_THRESHOLD) {
      while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) return -1; // no pitch detected

  // Step 4: Parabolic interpolation for better accuracy
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
  const x2 = tauEstimate + 1 < yinBuffer.length ? tauEstimate + 1 : tauEstimate;
  let betterTau: number;
  if (x0 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
  } else if (x2 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
  } else {
    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[x2];
    betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  return sampleRate / betterTau;
}

// Compute RMS energy — used to gate out silence
export function computeRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

export const SILENCE_THRESHOLD = 0.01; // RMS below this = silence
