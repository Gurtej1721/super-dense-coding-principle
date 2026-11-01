import { ComplexNumber, GateType } from '@quantum/contracts';
import { complex, cAdd, cMul, cScale } from './complex.js';

export type Matrix2x2 = [
  [ComplexNumber, ComplexNumber],
  [ComplexNumber, ComplexNumber]
];

export type Matrix4x4 = [
  [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber],
  [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber],
  [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber],
  [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber]
];

const INV_SQRT2 = 1 / Math.SQRT2;

export const GATES_1Q: Record<GateType | 'I', Matrix2x2> = {
  I: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(1, 0)]
  ],
  H: [
    [complex(INV_SQRT2, 0), complex(INV_SQRT2, 0)],
    [complex(INV_SQRT2, 0), complex(-INV_SQRT2, 0)]
  ],
  X: [
    [complex(0, 0), complex(1, 0)],
    [complex(1, 0), complex(0, 0)]
  ],
  Z: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(-1, 0)]
  ],
  CNOT: [
    // Placeholder to satisfy GateType indexing, 2-qubit CNOT is defined below
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(1, 0)]
  ],
  NONE: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(1, 0)]
  ]
};

/**
 * Standard CNOT with control qubit 0 (Alice, MSB) and target qubit 1 (Bob, LSB).
 * Computational basis order: |00>, |01>, |10>, |11>
 * |00> -> |00>
 * |01> -> |01>
 * |10> -> |11>
 * |11> -> |10>
 */
export const CNOT_01_MATRIX: Matrix4x4 = [
  [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)],
  [complex(0, 0), complex(1, 0), complex(0, 0), complex(0, 0)],
  [complex(0, 0), complex(0, 0), complex(0, 0), complex(1, 0)],
  [complex(0, 0), complex(0, 0), complex(1, 0), complex(0, 0)]
];

/**
 * Kronecker product (tensor product) of two 2x2 matrices -> 4x4 matrix.
 * (A (x) B)_{2i+k, 2j+l} = A_{ik} * B_{jl}
 */
export function tensorProduct2x2(a: Matrix2x2, b: Matrix2x2): Matrix4x4 {
  const result: ComplexNumber[][] = [];
  for (let r = 0; r < 4; r++) {
    result[r] = [];
    for (let c = 0; c < 4; c++) {
      const aRow = Math.floor(r / 2);
      const bRow = r % 2;
      const aCol = Math.floor(c / 2);
      const bCol = c % 2;
      result[r][c] = cMul(a[aRow][aCol], b[bRow][bCol]);
    }
  }
  return result as Matrix4x4;
}

/**
 * Apply 4x4 unitary matrix to a 4-dimensional state vector.
 */
export function applyMatrix4x4(
  matrix: Matrix4x4,
  state: [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber]
): [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber] {
  const out: ComplexNumber[] = [];
  for (let r = 0; r < 4; r++) {
    let sum = complex(0, 0);
    for (let c = 0; c < 4; c++) {
      sum = cAdd(sum, cMul(matrix[r][c], state[c]));
    }
    out.push(sum);
  }
  return [out[0], out[1], out[2], out[3]];
}

/**
 * Apply single-qubit gate to qubit 0 (control/Alice) in a 2-qubit system.
 * Operation is U (x) I.
 */
export function applyGateOnQubit0(
  gate: Matrix2x2,
  state: [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber]
): [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber] {
  const m = tensorProduct2x2(gate, GATES_1Q.I);
  return applyMatrix4x4(m, state);
}

/**
 * Apply single-qubit gate to qubit 1 (target/Bob) in a 2-qubit system.
 * Operation is I (x) U.
 */
export function applyGateOnQubit1(
  gate: Matrix2x2,
  state: [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber]
): [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber] {
  const m = tensorProduct2x2(GATES_1Q.I, gate);
  return applyMatrix4x4(m, state);
}

/**
 * Apply CNOT(q0 -> q1) to state vector.
 */
export function applyCnot01(
  state: [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber]
): [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber] {
  return applyMatrix4x4(CNOT_01_MATRIX, state);
}
