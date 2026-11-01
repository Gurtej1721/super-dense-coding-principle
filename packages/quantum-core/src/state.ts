import { BasisState, ComplexNumber, MeasurementSample } from '@quantum/contracts';
import { cMag, cMagSq, cMul, complex, cSub, EPSILON } from './complex.js';

export const BASIS_STATES: BasisState[] = ['00', '01', '10', '11'];

export type StateVector4 = [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber];

export function createInitialState(): StateVector4 {
  return [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)];
}

export function validateStateVector(state: StateVector4, tolerance = EPSILON): void {
  if (!Array.isArray(state) || state.length !== 4) {
    throw new Error(`State vector must be a 4-element array of complex numbers.`);
  }

  let normSq = 0;
  for (let i = 0; i < 4; i++) {
    const amp = state[i];
    if (
      !amp ||
      typeof amp.real !== 'number' ||
      typeof amp.imag !== 'number' ||
      !Number.isFinite(amp.real) ||
      !Number.isFinite(amp.imag)
    ) {
      throw new Error(`Invalid amplitude at index ${i}: ${JSON.stringify(amp)}`);
    }
    normSq += cMagSq(amp);
  }

  if (Math.abs(normSq - 1.0) > tolerance) {
    throw new Error(
      `State vector normalization violation: norm^2 = ${normSq.toFixed(10)}, expected 1.0 (tol=${tolerance})`
    );
  }
}

export function computeProbabilities(
  state: StateVector4,
  tolerance = EPSILON
): Record<BasisState, number> {
  validateStateVector(state, tolerance);

  const rawProbs: number[] = state.map((amp) => cMagSq(amp));
  let sum = rawProbs.reduce((acc, p) => acc + p, 0);

  if (Math.abs(sum - 1.0) > tolerance) {
    throw new Error(`Probabilities sum violation: sum = ${sum}, expected 1.0`);
  }

  // Clean numerical zeros and tiny roundoff
  const probs: Record<BasisState, number> = {
    '00': Math.max(0, rawProbs[0]),
    '01': Math.max(0, rawProbs[1]),
    '10': Math.max(0, rawProbs[2]),
    '11': Math.max(0, rawProbs[3])
  };

  return probs;
}

/**
 * 32-bit deterministic Mulberry32 PRNG for reproducible measurement sampling.
 */
export function createMulberry32(seed: number): () => number {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleMeasurements(
  probabilities: Record<BasisState, number>,
  shots = 1000,
  seed = 42
): MeasurementSample {
  if (shots < 0 || !Number.isInteger(shots) || shots > 100000) {
    throw new Error(`Invalid shots count: ${shots}. Must be integer between 0 and 100,000.`);
  }

  const counts: Record<BasisState, number> = {
    '00': 0,
    '01': 0,
    '10': 0,
    '11': 0
  };

  if (shots === 0) {
    return { counts, shots: 0, seed, probabilities };
  }

  const rng = createMulberry32(seed);

  const cumulative: { state: BasisState; threshold: number }[] = [];
  let accum = 0;
  for (const b of BASIS_STATES) {
    accum += probabilities[b];
    cumulative.push({ state: b, threshold: accum });
  }

  for (let s = 0; s < shots; s++) {
    const r = rng();
    let picked: BasisState = '11';
    for (const item of cumulative) {
      if (r <= item.threshold) {
        picked = item.state;
        break;
      }
    }
    counts[picked]++;
  }

  return {
    counts,
    shots,
    seed,
    probabilities
  };
}

/**
 * Computes concurrence C for a pure 2-qubit state |psi> = a|00> + b|01> + c|10> + d|11>.
 * Formula: C = 2 * |a*d - b*c|
 * C in [0, 1]: 0 = separable / product state, 1 = maximally entangled (e.g. Bell state).
 */
export function computeConcurrence(state: StateVector4): number {
  validateStateVector(state);
  const [a, b, c, d] = state;
  const ad = cMul(a, d);
  const bc = cMul(b, c);
  const diff = cSub(ad, bc);
  const mag = cMag(diff);
  const cVal = 2 * mag;
  return Math.min(1.0, Math.max(0.0, Math.round(cVal * 1e9) / 1e9));
}

/**
 * Computes reduced-state von Neumann entropy S(rho_A) for a pure 2-qubit state from concurrence C.
 * Range: [0, 1] ebit.
 */
export function computeEntropy(concurrence: number): number {
  if (concurrence <= 1e-9) return 0;
  if (concurrence >= 1 - 1e-9) return 1.0;
  const x = (1 + Math.sqrt(Math.max(0, 1 - concurrence * concurrence))) / 2;
  const term1 = x > 0 ? x * Math.log2(x) : 0;
  const term2 = 1 - x > 0 ? (1 - x) * Math.log2(1 - x) : 0;
  const entropy = -(term1 + term2);
  return Math.min(1.0, Math.max(0.0, Math.round(entropy * 1e6) / 1e6));
}
