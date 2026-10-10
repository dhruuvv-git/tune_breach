export interface TuningString {
  readonly n: string;
  readonly f: number;
}

export interface TuningPreset {
  readonly label: string;
  readonly strings: readonly TuningString[];
}

export const TUNING_PRESETS = {
  standard: {
    label: 'Standard (E)',
    strings: [{ n: 'E2', f: 82.41 }, { n: 'A2', f: 110 }, { n: 'D3', f: 146.83 }, { n: 'G3', f: 196 }, { n: 'B3', f: 246.94 }, { n: 'E4', f: 329.63 }],
  },
  dropD: {
    label: 'Drop D',
    strings: [{ n: 'D2', f: 73.42 }, { n: 'A2', f: 110 }, { n: 'D3', f: 146.83 }, { n: 'G3', f: 196 }, { n: 'B3', f: 246.94 }, { n: 'E4', f: 329.63 }],
  },
  halfDown: {
    label: 'Half Step Down',
    strings: [{ n: 'Eb2', f: 77.78 }, { n: 'Ab2', f: 103.83 }, { n: 'Db3', f: 138.59 }, { n: 'Gb3', f: 185 }, { n: 'Bb3', f: 233.08 }, { n: 'Eb4', f: 311.13 }],
  },
  fullDown: {
    label: 'Full Step Down',
    strings: [{ n: 'D2', f: 73.42 }, { n: 'G2', f: 98 }, { n: 'C3', f: 130.81 }, { n: 'F3', f: 174.61 }, { n: 'A3', f: 220 }, { n: 'D4', f: 293.66 }],
  },
  openG: {
    label: 'Open G',
    strings: [{ n: 'D2', f: 73.42 }, { n: 'G2', f: 98 }, { n: 'D3', f: 146.83 }, { n: 'G3', f: 196 }, { n: 'B3', f: 246.94 }, { n: 'D4', f: 293.66 }],
  },
  openD: {
    label: 'Open D',
    strings: [{ n: 'D2', f: 73.42 }, { n: 'A2', f: 110 }, { n: 'D3', f: 146.83 }, { n: 'F#3', f: 185 }, { n: 'A3', f: 220 }, { n: 'D4', f: 293.66 }],
  },
  openE: {
    label: 'Open E',
    strings: [{ n: 'E2', f: 82.41 }, { n: 'B2', f: 123.47 }, { n: 'E3', f: 164.81 }, { n: 'G#3', f: 207.65 }, { n: 'B3', f: 246.94 }, { n: 'E4', f: 329.63 }],
  },
  dadgad: {
    label: 'DADGAD',
    strings: [{ n: 'D2', f: 73.42 }, { n: 'A2', f: 110 }, { n: 'D3', f: 146.83 }, { n: 'G3', f: 196 }, { n: 'A3', f: 220 }, { n: 'D4', f: 293.66 }],
  },
  doubleDropD: {
    label: 'Double Drop D',
    strings: [{ n: 'D2', f: 73.42 }, { n: 'A2', f: 110 }, { n: 'D3', f: 146.83 }, { n: 'G3', f: 196 }, { n: 'B3', f: 246.94 }, { n: 'D4', f: 293.66 }],
  },
} as const satisfies Record<string, TuningPreset>;

export interface PitchEstimate {
  readonly freq: number;
  readonly rms: number;
}

export interface StringMatch {
  readonly strIdx: number;
  readonly strName: string;
  readonly targetFreq: number;
  readonly cents: number;
  readonly effFreq: number;
}

const MIN_PITCH_HZ = 60;
const MAX_PITCH_HZ = 450;
const RMS_GATE = 0.0008;
const YIN_THRESHOLD = 0.15;
const MAX_YIN_DIFFERENCE = 0.35;

/** Estimates the fundamental using YIN with a full-rate difference window. */
export function detectPitch(buffer: Float32Array, sampleRate: number): PitchEstimate {
  if (buffer.length < 512 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return { freq: -1, rms: 0 };
  }

  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquares / buffer.length);
  if (rms < RMS_GATE) return { freq: -1, rms };

  const minPeriod = Math.max(2, Math.floor(sampleRate / MAX_PITCH_HZ));
  const requestedMaxPeriod = Math.ceil(sampleRate / MIN_PITCH_HZ);
  // A longer comparison window is especially useful for the low E string:
  // it includes several cycles even when its fundamental is weak.
  const windowSize = Math.min(3072, buffer.length - requestedMaxPeriod - 1);
  const maxPeriod = Math.min(requestedMaxPeriod, buffer.length - windowSize - 1);
  if (windowSize < 256 || maxPeriod <= minPeriod) return { freq: -1, rms };

  // Use every sample in the difference function. Skipping alternate samples
  // can bias the minimum, especially on bright strings with strong harmonics.
  const difference = new Float64Array(maxPeriod + 1);
  for (let period = 1; period <= maxPeriod; period++) {
    let sum = 0;
    for (let i = 0; i < windowSize; i++) {
      const delta = buffer[i] - buffer[i + period];
      sum += delta * delta;
    }
    difference[period] = sum;
  }

  const normalizedDifference = new Float64Array(maxPeriod + 1);
  normalizedDifference[0] = 1;
  let runningSum = 0;
  for (let period = 1; period <= maxPeriod; period++) {
    runningSum += difference[period];
    normalizedDifference[period] = runningSum > 0
      ? (difference[period] * period) / runningSum
      : 1;
  }

  let periodEstimate = -1;
  let bestDifference = Number.POSITIVE_INFINITY;
  let bestPeriod = -1;
  for (let period = minPeriod; period <= maxPeriod; period++) {
    const value = normalizedDifference[period];
    if (value < bestDifference) {
      bestDifference = value;
      bestPeriod = period;
    }

    // Choose the first qualifying local minimum to favor the fundamental over
    // later subharmonic minima, then walk to the bottom of that same trough.
    if (value < YIN_THRESHOLD) {
      while (
        period + 1 <= maxPeriod &&
        normalizedDifference[period + 1] < normalizedDifference[period]
      ) {
        period++;
      }
      periodEstimate = period;
      break;
    }
  }

  if (periodEstimate < 0) {
    if (bestPeriod < 0 || bestDifference > MAX_YIN_DIFFERENCE) {
      return { freq: -1, rms };
    }
    periodEstimate = bestPeriod;
  }

  // Parabolic interpolation between adjacent lag values removes most of the
  // one-sample quantization error (several cents on the higher guitar strings).
  const left = normalizedDifference[periodEstimate - 1];
  const center = normalizedDifference[periodEstimate];
  const right = normalizedDifference[Math.min(periodEstimate + 1, maxPeriod)];
  const curvature = left - 2 * center + right;
  const offset = periodEstimate < maxPeriod && Math.abs(curvature) > Number.EPSILON
    ? Math.max(-0.5, Math.min(0.5, (0.5 * (left - right)) / curvature))
    : 0;
  const refinedPeriod = periodEstimate + offset;

  return { freq: sampleRate / refinedPeriod, rms };
}

function centsBetween(frequency: number, targetFrequency: number): number {
  return 1200 * Math.log2(frequency / targetFrequency);
}

function makeMatch(
  string: TuningString,
  index: number,
  frequency: number,
  cents: number,
): StringMatch {
  return {
    strIdx: index,
    strName: string.n,
    targetFreq: string.f,
    cents: Math.max(-50, Math.min(50, Math.round(cents))),
    effFreq: frequency,
  };
}

/** Matches a measured fundamental to the nearest open string in a preset. */
export function matchGuitarString(
  detectedFrequency: number,
  strings: readonly TuningString[] | undefined,
  selectedIndex: number,
): StringMatch | null {
  if (!Number.isFinite(detectedFrequency) || detectedFrequency <= 0 || !strings?.length) {
    return null;
  }

  const selected = strings[selectedIndex];
  if (selected) {
    // A strong second harmonic can dominate the fundamental. E2 can also lock
    // to its third partial, so only that selected string checks a third-harmonic
    // candidate. The 100-cent guard prevents relabeling unrelated notes.
    const octaveCandidates = selected.n === 'E2'
      ? [detectedFrequency, detectedFrequency / 2, detectedFrequency / 3, detectedFrequency * 2]
      : [detectedFrequency, detectedFrequency / 2, detectedFrequency * 2];
    let closestFrequency = detectedFrequency;
    let closestCents = centsBetween(detectedFrequency, selected.f);
    for (const candidate of octaveCandidates.slice(1)) {
      const cents = centsBetween(candidate, selected.f);
      if (Math.abs(cents) < Math.abs(closestCents)) {
        closestFrequency = candidate;
        closestCents = cents;
      }
    }

    if (Math.abs(closestCents) <= 100) {
      return makeMatch(selected, selectedIndex, closestFrequency, closestCents);
    }
  }

  let bestMatch: StringMatch | null = null;
  let smallestError = Number.POSITIVE_INFINITY;
  strings.forEach((string, index) => {
    const cents = centsBetween(detectedFrequency, string.f);
    const error = Math.abs(cents);
    if (error < smallestError) {
      smallestError = error;
      bestMatch = makeMatch(string, index, detectedFrequency, cents);
    }
  });

  return bestMatch;
}
