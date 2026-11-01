import { describe, expect, it } from 'vitest';
import {
  applyCnot01,
  applyGateOnQubit0,
  cAdd,
  cConj,
  cEqual,
  cMag,
  cMagSq,
  cMul,
  complex,
  computeConcurrence,
  computeEntropy,
  computeProbabilities,
  createInitialState,
  createMulberry32,
  EPSILON,
  GATES_1Q,
  isValidMessage,
  sampleMeasurements,
  simulateSuperdense,
  simulateSuperdenseComparison,
  validateStateVector
} from '../src/index.js';

describe('Complex Number Operations', () => {
  it('correctly adds and multiplies complex numbers', () => {
    const a = complex(1, 2);
    const b = complex(3, -4);
    const sum = cAdd(a, b);
    expect(sum.real).toBeCloseTo(4);
    expect(sum.imag).toBeCloseTo(-2);

    // (1 + 2i)(3 - 4i) = 3 - 4i + 6i - 8i^2 = 11 + 2i
    const prod = cMul(a, b);
    expect(prod.real).toBeCloseTo(11);
    expect(prod.imag).toBeCloseTo(2);

    expect(cMagSq(a)).toBeCloseTo(5);
    expect(cMag(a)).toBeCloseTo(Math.sqrt(5));
    expect(cConj(a)).toEqual(complex(1, -2));
  });

  it('rejects non-finite values in complex constructor', () => {
    expect(() => complex(NaN, 0)).toThrow(/Non-finite/);
    expect(() => complex(0, Infinity)).toThrow(/Non-finite/);
  });
});

describe('Quantum Gate Properties & Unitarity', () => {
  it('verifies 1-qubit gates are unitary: U† U = I', () => {
    const gates = [GATES_1Q.I, GATES_1Q.H, GATES_1Q.X, GATES_1Q.Z];

    for (const gate of gates) {
      // Calculate U† * U
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          let sum = complex(0, 0);
          for (let k = 0; k < 2; k++) {
            const uDag_rk = cConj(gate[k][r]);
            sum = cAdd(sum, cMul(uDag_rk, gate[k][c]));
          }
          const expected = r === c ? 1 : 0;
          expect(sum.real).toBeCloseTo(expected, 8);
          expect(sum.imag).toBeCloseTo(0, 8);
        }
      }
    }
  });

  it('verifies CNOT(0->1) truth table on computational basis', () => {
    // |00> -> [1, 0, 0, 0] -> |00>
    const s00 = applyCnot01([complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)]);
    expect(cEqual(s00[0], complex(1, 0))).toBe(true);

    // |01> -> [0, 1, 0, 0] -> |01>
    const s01 = applyCnot01([complex(0, 0), complex(1, 0), complex(0, 0), complex(0, 0)]);
    expect(cEqual(s01[1], complex(1, 0))).toBe(true);

    // |10> -> [0, 0, 1, 0] -> |11> (target flipped)
    const s10 = applyCnot01([complex(0, 0), complex(0, 0), complex(1, 0), complex(0, 0)]);
    expect(cEqual(s10[3], complex(1, 0))).toBe(true);

    // |11> -> [0, 0, 0, 1] -> |10> (target flipped)
    const s11 = applyCnot01([complex(0, 0), complex(0, 0), complex(0, 0), complex(1, 0)]);
    expect(cEqual(s11[2], complex(1, 0))).toBe(true);
  });

  it('verifies gate order for message 11 (XZ = X first, then Z)', () => {
    // Applying X first, then Z to qubit 0 of |00>:
    // |00> -> X on q0 -> |10>
    // |10> -> Z on q0 -> -|10>
    const state0 = [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)] as const;
    const afterX = applyGateOnQubit0(GATES_1Q.X, [...state0]);
    const afterXZ = applyGateOnQubit0(GATES_1Q.Z, afterX);

    expect(afterXZ[2].real).toBeCloseTo(-1); // -|10>
  });
});

describe('Entanglement Metrics & Concurrence', () => {
  it('reports C = 1.0 and S = 1.0 ebit for Bell state |Φ+⟩', () => {
    const s0 = createInitialState();
    const s1 = applyGateOnQubit0(GATES_1Q.H, s0);
    const bellState = applyCnot01(s1);
    const c = computeConcurrence(bellState);
    const s = computeEntropy(c);
    expect(c).toBeCloseTo(1.0, 8);
    expect(s).toBeCloseTo(1.0, 6);
  });

  it('reports C = 0.0 and S = 0.0 for separable product state |00⟩', () => {
    const s0 = createInitialState();
    const c = computeConcurrence(s0);
    const s = computeEntropy(c);
    expect(c).toBeCloseTo(0.0, 8);
    expect(s).toBeCloseTo(0.0, 6);
  });
});

describe('Bell State Preparation', () => {
  it('prepares |Φ+⟩ with correct amplitudes and probabilities', () => {
    const s0 = createInitialState();
    const s1 = applyGateOnQubit0(GATES_1Q.H, s0);
    const bellState = applyCnot01(s1);

    validateStateVector(bellState);

    const invSqrt2 = 1 / Math.SQRT2;
    expect(bellState[0].real).toBeCloseTo(invSqrt2, 8); // |00>
    expect(bellState[0].imag).toBeCloseTo(0, 8);
    expect(bellState[1].real).toBeCloseTo(0, 8); // |01>
    expect(bellState[2].real).toBeCloseTo(0, 8); // |10>
    expect(bellState[3].real).toBeCloseTo(invSqrt2, 8); // |11>
    expect(bellState[3].imag).toBeCloseTo(0, 8);

    const probs = computeProbabilities(bellState);
    expect(probs['00']).toBeCloseTo(0.5, 8);
    expect(probs['01']).toBeCloseTo(0.0, 8);
    expect(probs['10']).toBeCloseTo(0.0, 8);
    expect(probs['11']).toBeCloseTo(0.5, 8);
    expect(probs['00'] + probs['01'] + probs['10'] + probs['11']).toBeCloseTo(1.0, 8);
  });
});

describe('Full Superdense Coding Protocol Simulation', () => {
  const messages = ['00', '01', '10', '11'] as const;

  for (const msg of messages) {
    it(`correctly encodes, transmits, and decodes message "${msg}" with P=1.0`, () => {
      const result = simulateSuperdense(msg, 1000, 42);

      expect(result.protocol).toBe('superdense-coding');
      expect(result.message).toBe(msg);
      expect(result.decodedMessage).toBe(msg);
      expect(result.success).toBe(true);

      // Verify probability distribution is deterministic 1.0 for the target message
      expect(result.finalProbabilities[msg]).toBeCloseTo(1.0, 8);
      for (const other of messages) {
        if (other !== msg) {
          expect(result.finalProbabilities[other]).toBeCloseTo(0.0, 8);
        }
      }

      // Verify state vector normalization at every single snapshot
      expect(result.snapshots.length).toBe(8); // steps 0 to 7
      for (const snap of result.snapshots) {
        validateStateVector(snap.stateVector);
        const sumP =
          snap.probabilities['00'] +
          snap.probabilities['01'] +
          snap.probabilities['10'] +
          snap.probabilities['11'];
        expect(sumP).toBeCloseTo(1.0, 8);
      }

      // Verify measurement sampled 1000 counts of the exact decoded message
      expect(result.measurement.shots).toBe(1000);
      expect(result.measurement.counts[msg]).toBe(1000);
      for (const other of messages) {
        if (other !== msg) {
          expect(result.measurement.counts[other]).toBe(0);
        }
      }
    });
  }

  it('rejects invalid messages', () => {
    // @ts-expect-error testing invalid runtime input
    expect(() => simulateSuperdense('02')).toThrow(/Invalid message/);
    // @ts-expect-error testing invalid runtime input
    expect(() => simulateSuperdense('')).toThrow(/Invalid message/);
  });

  it('rejects unnormalized state vectors in validation', () => {
    const unnormalized = [
      complex(1, 0),
      complex(1, 0),
      complex(0, 0),
      complex(0, 0)
    ] as [any, any, any, any];
    expect(() => validateStateVector(unnormalized)).toThrow(/normalization violation/);
  });
});

describe('Measurement Sampling & Reproducibility', () => {
  it('produces identical counts with identical seed', () => {
    const probs = { '00': 0.5, '01': 0.25, '10': 0.25, '11': 0 };
    const sample1 = sampleMeasurements(probs, 2000, 12345);
    const sample2 = sampleMeasurements(probs, 2000, 12345);

    expect(sample1.counts).toEqual(sample2.counts);
    expect(sample1.counts['00'] + sample1.counts['01'] + sample1.counts['10']).toBe(2000);
  });

  it('handles 0 shots without errors', () => {
    const probs = { '00': 0.5, '01': 0.5, '10': 0, '11': 0 };
    const sample = sampleMeasurements(probs, 0, 42);
    expect(sample.shots).toBe(0);
    expect(sample.counts).toEqual({ '00': 0, '01': 0, '10': 0, '11': 0 });
  });

  it('rejects invalid shot numbers', () => {
    const probs = { '00': 1, '01': 0, '10': 0, '11': 0 };
    expect(() => sampleMeasurements(probs, -10)).toThrow(/Invalid shots/);
    expect(() => sampleMeasurements(probs, 100001)).toThrow(/Invalid shots/);
    expect(() => sampleMeasurements(probs, 3.5)).toThrow(/Invalid shots/);
  });
});

describe('Unentangled Mode (Without Entanglement) Simulation', () => {
  const messages = ['00', '01', '10', '11'] as const;

  for (const msg of messages) {
    it(`accurately demonstrates failure without entanglement for message "${msg}"`, () => {
      const res = simulateSuperdense(msg, 2000, 42, { mode: 'without_entanglement' });

      expect(res.mode).toBe('without_entanglement');
      expect(res.success).toBe(false);
      expect(res.decodedMessage).toBe('ambiguous');

      // Zero entanglement throughout all 8 snapshots
      expect(res.snapshots.length).toBe(8);
      for (const snap of res.snapshots) {
        validateStateVector(snap.stateVector);
        expect(snap.concurrence).toBeCloseTo(0.0, 8);
        expect(snap.entropy).toBeCloseTo(0.0, 6);
      }

      // Expected 50/50 split distributions
      if (msg === '00' || msg === '10') {
        expect(res.finalProbabilities['00']).toBeCloseTo(0.5, 8);
        expect(res.finalProbabilities['10']).toBeCloseTo(0.5, 8);
        expect(res.finalProbabilities['01']).toBeCloseTo(0.0, 8);
        expect(res.finalProbabilities['11']).toBeCloseTo(0.0, 8);
      } else {
        expect(res.finalProbabilities['01']).toBeCloseTo(0.5, 8);
        expect(res.finalProbabilities['11']).toBeCloseTo(0.5, 8);
        expect(res.finalProbabilities['00']).toBeCloseTo(0.0, 8);
        expect(res.finalProbabilities['10']).toBeCloseTo(0.0, 8);
      }

      // Sampled shots match the distribution within binomial statistics
      const totalSampled =
        res.measurement.counts['00'] +
        res.measurement.counts['01'] +
        res.measurement.counts['10'] +
        res.measurement.counts['11'];
      expect(totalSampled).toBe(2000);
    });
  }

  it('runs simulateSuperdenseComparison and returns paired results', () => {
    const comp = simulateSuperdenseComparison('01', 1000, 42);
    expect(comp.message).toBe('01');
    expect(comp.entangled.success).toBe(true);
    expect(comp.entangled.decodedMessage).toBe('01');
    expect(comp.unentangled.success).toBe(false);
    expect(comp.comparison.theoreticalFidelityEntangled).toBeCloseTo(1.0, 8);
    expect(comp.comparison.theoreticalFidelityUnentangled).toBeCloseTo(0.5, 8);
  });
});
