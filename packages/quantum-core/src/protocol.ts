import {
  BasisState,
  ComparisonSimulationResult,
  EntanglementMetric,
  ExperimentMode,
  GateOperation,
  Message,
  ProtocolMetadata,
  SimulationResult,
  SimulationSnapshot
} from '@quantum/contracts';
import { complex } from './complex.js';
import {
  applyCnot01,
  applyGateOnQubit0,
  CNOT_01_MATRIX,
  GATES_1Q
} from './gates.js';
import {
  computeConcurrence,
  computeEntropy,
  computeProbabilities,
  createInitialState,
  sampleMeasurements,
  StateVector4
} from './state.js';

export const PROTOCOL_METADATA: ProtocolMetadata = {
  protocol: 'superdense-coding',
  title: 'Quantum Superdense Coding Protocol',
  summary:
    'Enables transmission of two classical bits by sending a single physical qubit, using a pre-shared entangled Bell state.',
  basisOrdering: '|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)',
  aliceEncodingMap: {
    '00': { gates: ['I'], label: 'Identity (I)', math: 'I' },
    '01': { gates: ['X'], label: 'Bit Flip (X)', math: 'X' },
    '10': { gates: ['Z'], label: 'Phase Flip (Z)', math: 'Z' },
    '11': { gates: ['X', 'Z'], label: 'Bit & Phase Flip (XZ: X then Z)', math: 'Z \\cdot X' }
  },
  idealEndStateProbability: 1.0
};

export function isValidMessage(msg: unknown): msg is Message {
  return msg === '00' || msg === '01' || msg === '10' || msg === '11';
}

export interface SimulationOptions {
  mode?: ExperimentMode;
  noiseRate?: number;
}

export function simulateSuperdense(
  message: Message,
  shots = 1000,
  seed = 42,
  options?: SimulationOptions
): SimulationResult {
  if (!isValidMessage(message)) {
    throw new Error(`Invalid message: "${message}". Allowed messages are '00', '01', '10', '11'.`);
  }

  const mode: ExperimentMode = options?.mode || 'with_entanglement';
  const noiseRate = Math.max(0, Math.min(0.5, options?.noiseRate ?? 0));
  const isEntangledMode = mode === 'with_entanglement';

  const snapshots: SimulationSnapshot[] = [];
  const gates: GateOperation[] = [];

  // Step 0: Initial state |00>
  let state: StateVector4 = createInitialState();
  const c0 = computeConcurrence(state);
  const e0 = computeEntropy(c0);
  let c2 = 0;
  let e2 = 0;

  snapshots.push({
    stepIndex: 0,
    stage: 'initial',
    title: 'Ground State Preparation',
    description: isEntangledMode
      ? 'System initialized to computational ground state |00⟩.'
      : 'Alice and Bob prepare two independent qubits in the separable product state |0⟩_A ⊗ |0⟩_B = |00⟩.',
    narration: isEntangledMode
      ? 'Alice and Bob start with two qubits initialized in the standard computational ground state |00⟩.'
      : 'In the unentangled baseline, qubits start independently in product state |00⟩. No shared entanglement is generated.',
    mathLatex: '|\\psi_0\\rangle = |00\\rangle = |0\\rangle_A \\otimes |0\\rangle_B',
    stateVector: [...state],
    probabilities: computeProbabilities(state),
    particlePosition: 'alice',
    concurrence: c0,
    entropy: e0
  });

  if (isEntangledMode) {
    // Step 1: Bell Prep - Hadamard on q0
    const gateH0: GateOperation = {
      id: 'gate-bell-h0',
      gate: 'H',
      name: 'Hadamard (q0)',
      qubits: [0],
      stage: 'bell_prep_h',
      description: "Applies Hadamard on Alice's qubit q0 to create superposition (|0⟩+|1⟩)/√2.",
      matrixLatex: '\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}',
      affectedQubitLabel: 'q0 (Alice)'
    };
    gates.push(gateH0);
    state = applyGateOnQubit0(GATES_1Q.H, state);
    const c1 = computeConcurrence(state);
    const e1 = computeEntropy(c1);

    snapshots.push({
      stepIndex: 1,
      stage: 'bell_prep_h',
      title: 'Superposition Creation',
      description: 'Hadamard gate applied to q0.',
      narration:
        "A Hadamard gate transforms Alice's qubit into an equal superposition: (|0⟩+|1⟩)/√2, while Bob's qubit remains |0⟩.",
      mathLatex:
        '|\\psi_1\\rangle = (H \\otimes I)|00\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle)',
      stateVector: [...state],
      probabilities: computeProbabilities(state),
      activeGateId: gateH0.id,
      particlePosition: 'alice',
      concurrence: c1,
      entropy: e1
    });

    // Step 2: Bell Prep - CNOT(q0 -> q1)
    const gateCnotPrep: GateOperation = {
      id: 'gate-bell-cnot',
      gate: 'CNOT',
      name: 'CNOT (q0 -> q1)',
      qubits: [0, 1],
      control: 0,
      target: 1,
      stage: 'bell_prep_cnot',
      description: 'Entangles q0 and q1 into the maximally entangled Bell pair |Φ+⟩.',
      matrixLatex:
        '\\begin{pmatrix}1 & 0 & 0 & 0\\\\ 0 & 1 & 0 & 0\\\\ 0 & 0 & 0 & 1\\\\ 0 & 0 & 1 & 0\\end{pmatrix}',
      affectedQubitLabel: 'q0 (control), q1 (target)'
    };
    gates.push(gateCnotPrep);
    state = applyCnot01(state);
    c2 = computeConcurrence(state);
    e2 = computeEntropy(c2);

    snapshots.push({
      stepIndex: 2,
      stage: 'bell_prep_cnot',
      title: 'Entanglement Generation',
      description: 'CNOT gate entangles q0 and q1 into the Bell state |Φ+⟩.',
      narration:
        'The CNOT gate uses q0 as control and q1 as target, establishing maximum quantum entanglement: |Φ+⟩ = (|00⟩ + |11⟩)/√2 (Concurrence C = 1.0).',
      mathLatex:
        '|\\psi_2\\rangle = \\text{CNOT}|\\psi_1\\rangle = |\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)',
      stateVector: [...state],
      probabilities: computeProbabilities(state),
      activeGateId: gateCnotPrep.id,
      particlePosition: 'alice',
      concurrence: c2,
      entropy: e2
    });
  } else {
    // Mode 2 (Without Entanglement): No entanglement gates applied
    const gateNoOp1: GateOperation = {
      id: 'gate-unentangled-skip-h',
      gate: 'NONE',
      name: 'No Entanglement Gate',
      qubits: [0],
      stage: 'bell_prep_h',
      description: 'Without entanglement, Hadamard is not applied. Alice qubit remains |0⟩.',
      matrixLatex: '\\text{Identity / Bypass}',
      affectedQubitLabel: 'q0 (Alice)'
    };
    gates.push(gateNoOp1);

    snapshots.push({
      stepIndex: 1,
      stage: 'bell_prep_h',
      title: 'Independent State (No Hadamard)',
      description: 'Qubits remain independent in product state |00⟩.',
      narration:
        'In the unentangled mode, no Hadamard superposition is applied. Alice and Bob hold isolated, unentangled qubits.',
      mathLatex: '|\\psi_1\\rangle = |00\\rangle = |0\\rangle_A \\otimes |0\\rangle_B',
      stateVector: [...state],
      probabilities: computeProbabilities(state),
      activeGateId: gateNoOp1.id,
      particlePosition: 'alice',
      concurrence: 0,
      entropy: 0
    });

    const gateNoOp2: GateOperation = {
      id: 'gate-unentangled-skip-cnot',
      gate: 'NONE',
      name: 'No Entanglement CNOT',
      qubits: [0, 1],
      stage: 'bell_prep_cnot',
      description: 'CNOT entanglement gate is skipped. System remains in separable product state |00⟩.',
      matrixLatex: '\\text{Identity / Bypass}',
      affectedQubitLabel: 'q0, q1 (Unentangled)'
    };
    gates.push(gateNoOp2);

    snapshots.push({
      stepIndex: 2,
      stage: 'bell_prep_cnot',
      title: 'Product State Maintained (No CNOT)',
      description: 'No entanglement generated. Concurrence C = 0.0.',
      narration:
        'Because no entangling CNOT gate is performed, the two qubits remain in the separable product state |00⟩ with zero concurrence (C = 0.0).',
      mathLatex: '|\\psi_2\\rangle = |00\\rangle, \\quad C(|\\psi_2\\rangle) = 0.0',
      stateVector: [...state],
      probabilities: computeProbabilities(state),
      activeGateId: gateNoOp2.id,
      particlePosition: 'alice',
      concurrence: 0,
      entropy: 0
    });
  }

  // Step 3: Alice Encodes Message (IDENTICAL operations in both modes!)
  let encodeMath = '';
  let encodeNarr = '';
  let activeEncodeGateId = '';

  if (message === '00') {
    const gateI: GateOperation = {
      id: 'gate-encode-i',
      gate: 'I',
      name: 'Identity (q0)',
      qubits: [0],
      stage: 'alice_encode',
      description: 'Alice applies Identity (no-op) to encode classical bitstring "00".',
      matrixLatex: '\\begin{pmatrix}1 & 0\\\\ 0 & 1\\end{pmatrix}',
      affectedQubitLabel: 'q0 (Alice)'
    };
    gates.push(gateI);
    state = applyGateOnQubit0(GATES_1Q.I, state);
    activeEncodeGateId = gateI.id;

    if (isEntangledMode) {
      encodeMath =
        '|\\psi_3\\rangle = (I \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle) = |\\Phi^+\\rangle';
      encodeNarr =
        'To encode "00", Alice applies the Identity operator (leaves qubit unchanged). The shared state remains |Φ+⟩.';
    } else {
      encodeMath = '|\\psi_3\\rangle = (I \\otimes I)|00\\rangle = |00\\rangle';
      encodeNarr =
        'Alice applies Identity to her qubit. The separable state remains |00⟩ with zero entanglement.';
    }
  } else if (message === '01') {
    const gateX: GateOperation = {
      id: 'gate-encode-x',
      gate: 'X',
      name: 'Pauli-X (q0)',
      qubits: [0],
      stage: 'alice_encode',
      description: 'Alice applies Pauli-X (bit flip) to encode classical bitstring "01".',
      matrixLatex: '\\begin{pmatrix}0 & 1\\\\ 1 & 0\\end{pmatrix}',
      affectedQubitLabel: 'q0 (Alice)'
    };
    gates.push(gateX);
    state = applyGateOnQubit0(GATES_1Q.X, state);
    activeEncodeGateId = gateX.id;

    if (isEntangledMode) {
      encodeMath =
        '|\\psi_3\\rangle = (X \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle + |10\\rangle) = |\\Psi^+\\rangle';
      encodeNarr =
        'To encode "01", Alice applies Pauli-X (bit flip) to q0, mapping |Φ+⟩ to the orthogonal Bell state |Ψ+⟩ = (|01⟩ + |10⟩)/√2.';
    } else {
      encodeMath = '|\\psi_3\\rangle = (X \\otimes I)|00\\rangle = |10\\rangle';
      encodeNarr =
        "Alice applies Pauli-X to flip her qubit from |0⟩ to |1⟩. The system becomes product state |10⟩ (Bob's qubit remains |0⟩).";
    }
  } else if (message === '10') {
    const gateZ: GateOperation = {
      id: 'gate-encode-z',
      gate: 'Z',
      name: 'Pauli-Z (q0)',
      qubits: [0],
      stage: 'alice_encode',
      description: 'Alice applies Pauli-Z (phase flip) to encode classical bitstring "10".',
      matrixLatex: '\\begin{pmatrix}1 & 0\\\\ 0 & -1\\end{pmatrix}',
      affectedQubitLabel: 'q0 (Alice)'
    };
    gates.push(gateZ);
    state = applyGateOnQubit0(GATES_1Q.Z, state);
    activeEncodeGateId = gateZ.id;

    if (isEntangledMode) {
      encodeMath =
        '|\\psi_3\\rangle = (Z \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle - |11\\rangle) = |\\Phi^-\\rangle';
      encodeNarr =
        'To encode "10", Alice applies Pauli-Z (phase flip) to q0, mapping |Φ+⟩ to the orthogonal Bell state |Φ-⟩ = (|00⟩ - |11⟩)/√2.';
    } else {
      encodeMath = '|\\psi_3\\rangle = (Z \\otimes I)|00\\rangle = Z|0\\rangle \\otimes |0\\rangle = |00\\rangle';
      encodeNarr =
        'Alice applies Pauli-Z to her qubit. But since Z|0⟩ = |0⟩, the state is completely unchanged! This is why message "10" collides with "00" without entanglement.';
    }
  } else {
    // message === '11': XZ encoding - apply X first, then Z
    const gateX: GateOperation = {
      id: 'gate-encode-x11',
      gate: 'X',
      name: 'Pauli-X (q0)',
      qubits: [0],
      stage: 'alice_encode',
      description: 'Alice applies Pauli-X first as part of the XZ sequence.',
      matrixLatex: '\\begin{pmatrix}0 & 1\\\\ 1 & 0\\end{pmatrix}',
      affectedQubitLabel: 'q0 (Alice)'
    };
    const gateZ: GateOperation = {
      id: 'gate-encode-z11',
      gate: 'Z',
      name: 'Pauli-Z (q0)',
      qubits: [0],
      stage: 'alice_encode',
      description: 'Alice applies Pauli-Z second as part of the XZ sequence to encode "11".',
      matrixLatex: '\\begin{pmatrix}1 & 0\\\\ 0 & -1\\end{pmatrix}',
      affectedQubitLabel: 'q0 (Alice)'
    };
    gates.push(gateX, gateZ);

    // Apply X first, then Z
    state = applyGateOnQubit0(GATES_1Q.X, state);
    state = applyGateOnQubit0(GATES_1Q.Z, state);
    activeEncodeGateId = gateZ.id;

    if (isEntangledMode) {
      encodeMath =
        '|\\psi_3\\rangle = (Z \\cdot X \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle - |10\\rangle) = -|\\Psi^-\\rangle';
      encodeNarr =
        'To encode "11", Alice applies Pauli-X (bit flip) followed by Pauli-Z (phase flip) to q0, mapping |Φ+⟩ to -|Ψ-⟩ = (|01⟩ - |10⟩)/√2.';
    } else {
      encodeMath = '|\\psi_3\\rangle = (Z \\cdot X \\otimes I)|00\\rangle = Z(|1\\rangle) \\otimes |0\\rangle = -|10\\rangle';
      encodeNarr =
        'Alice applies X then Z. The state becomes -|10⟩. The negative phase is a global phase for this pure product state, so it leaves measurement probabilities identical to message "01" (collision!).';
    }
  }

  const c3 = computeConcurrence(state);
  const e3 = computeEntropy(c3);

  snapshots.push({
    stepIndex: 3,
    stage: 'alice_encode',
    title: `Alice Encodes Message '${message}'`,
    description: `Alice applies local unitary gate(s) to her qubit q0.`,
    narration: encodeNarr,
    mathLatex: encodeMath,
    stateVector: [...state],
    probabilities: computeProbabilities(state),
    activeGateId: activeEncodeGateId,
    particlePosition: 'alice',
    concurrence: c3,
    entropy: e3
  });

  // Step 4: Transmission of q0 from Alice to Bob
  const c4 = computeConcurrence(state);
  const e4 = computeEntropy(c4);

  snapshots.push({
    stepIndex: 4,
    stage: 'transmit',
    title: 'Transmission Across Quantum Channel',
    description: 'Alice sends qubit q0 to Bob across the spatial quantum channel.',
    narration: isEntangledMode
      ? 'Alice physically transmits her single qubit q0 to Bob. The joint quantum state vector is invariant under spatial relocation; Bob now holds both qubits.'
      : 'Alice transmits her qubit q0 to Bob. Since no entanglement was shared, Bob holds two unentangled qubits with a product state.',
    mathLatex: '\\text{Transmit } q_0 \\text{ to Bob: State vector } |\\psi_4\\rangle = |\\psi_3\\rangle',
    stateVector: [...state],
    probabilities: computeProbabilities(state),
    particlePosition: 'in_transit',
    concurrence: c4,
    entropy: e4
  });

  // Step 5: Bob Decodes - CNOT(q0 -> q1) (IDENTICAL in both modes!)
  const gateBobCnot: GateOperation = {
    id: 'gate-bob-cnot',
    gate: 'CNOT',
    name: 'CNOT (q0 -> q1)',
    qubits: [0, 1],
    control: 0,
    target: 1,
    stage: 'bob_decode_cnot',
    description: isEntangledMode
      ? 'Bob applies CNOT to disentangle the two qubits.'
      : 'Bob applies standard superdense decoding CNOT(q0 -> q1) to the received qubits.',
    matrixLatex:
      '\\begin{pmatrix}1 & 0 & 0 & 0\\\\ 0 & 1 & 0 & 0\\\\ 0 & 0 & 0 & 1\\\\ 0 & 0 & 1 & 0\\end{pmatrix}',
    affectedQubitLabel: 'q0 (control), q1 (target)'
  };
  gates.push(gateBobCnot);
  state = applyCnot01(state);

  let bobCnotMath = '';
  let bobCnotNarr = '';

  if (isEntangledMode) {
    if (message === '00') {
      bobCnotMath =
        '|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle) = \\frac{|0\\rangle+|1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle';
    } else if (message === '01') {
      bobCnotMath =
        '|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle + |11\\rangle) = \\frac{|0\\rangle+|1\\rangle}{\\sqrt{2}} \\otimes |1\\rangle';
    } else if (message === '10') {
      bobCnotMath =
        '|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle - |10\\rangle) = \\frac{|0\\rangle-|1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle';
    } else {
      bobCnotMath =
        '|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle - |11\\rangle) = \\frac{|0\\rangle-|1\\rangle}{\\sqrt{2}} \\otimes |1\\rangle';
    }
    bobCnotNarr =
      'Bob applies CNOT(q0 -> q1). Notice how qubit q1 is now completely disentangled and fixed to the second bit of the message.';
  } else {
    // Unentangled mode
    if (message === '00' || message === '10') {
      bobCnotMath = '|\\psi_5\\rangle = \\text{CNOT}|00\\rangle = |00\\rangle';
      bobCnotNarr =
        'Bob applies CNOT. Because q0 is |0⟩, target q1 is not flipped. State remains |00⟩ for both messages "00" and "10".';
    } else if (message === '01') {
      bobCnotMath = '|\\psi_5\\rangle = \\text{CNOT}|10\\rangle = |11\\rangle';
      bobCnotNarr =
        'Bob applies CNOT. Because q0 is |1⟩, target q1 flips from |0⟩ to |1⟩, producing state |11⟩.';
    } else {
      bobCnotMath = '|\\psi_5\\rangle = \\text{CNOT}(-|10\\rangle) = -|11\\rangle';
      bobCnotNarr =
        'Bob applies CNOT to -|10⟩, producing -|11⟩. Target q1 is set to |1⟩.';
    }
  }

  const c5 = computeConcurrence(state);
  const e5 = computeEntropy(c5);

  snapshots.push({
    stepIndex: 5,
    stage: 'bob_decode_cnot',
    title: 'Bob Decodes: CNOT Disentanglement',
    description: 'Bob applies CNOT(q0 -> q1) as step 1 of decoding.',
    narration: bobCnotNarr,
    mathLatex: bobCnotMath,
    stateVector: [...state],
    probabilities: computeProbabilities(state),
    activeGateId: gateBobCnot.id,
    particlePosition: 'bob',
    concurrence: c5,
    entropy: e5
  });

  // Step 6: Bob Decodes - Hadamard on q0 (IDENTICAL in both modes!)
  const gateBobH: GateOperation = {
    id: 'gate-bob-h',
    gate: 'H',
    name: 'Hadamard (q0)',
    qubits: [0],
    stage: 'bob_decode_h',
    description: 'Bob applies Hadamard to q0 to bring it into the computational basis.',
    matrixLatex: '\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}',
    affectedQubitLabel: 'q0 (Bob)'
  };
  gates.push(gateBobH);
  state = applyGateOnQubit0(GATES_1Q.H, state);

  let bobHMath = '';
  let bobHNarr = '';

  if (isEntangledMode) {
    if (message === '00') {
      bobHMath = '|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |00\\rangle';
    } else if (message === '01') {
      bobHMath = '|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |01\\rangle';
    } else if (message === '10') {
      bobHMath = '|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |10\\rangle';
    } else {
      bobHMath = '|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |11\\rangle';
    }
    bobHNarr = `Bob applies the Hadamard gate to q0. Quantum interference constructively aligns the state exactly with computational basis state |${message}⟩.`;
  } else {
    // Unentangled mode
    if (message === '00' || message === '10') {
      bobHMath =
        '|\\psi_6\\rangle = (H \\otimes I)|00\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle)';
      bobHNarr =
        'Bob applies Hadamard to q0. The state splits into an equal superposition: (|00⟩ + |10⟩)/√2. Bob cannot know whether the first bit was 0 or 1!';
    } else if (message === '01') {
      bobHMath =
        '|\\psi_6\\rangle = (H \\otimes I)|11\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle - |11\\rangle)';
      bobHNarr =
        'Bob applies Hadamard to q0. The state splits into an equal superposition: (|01⟩ - |11⟩)/√2. Outcome is ambiguous between 01 and 11.';
    } else {
      bobHMath =
        '|\\psi_6\\rangle = (H \\otimes I)(-|11\\rangle) = \\frac{1}{\\sqrt{2}}(-|01\\rangle + |11\\rangle)';
      bobHNarr =
        'Bob applies Hadamard to q0. The state splits into equal probabilities for |01⟩ and |11⟩. The phase information cannot be distinguished.';
    }
  }

  const c6 = computeConcurrence(state);
  const e6 = computeEntropy(c6);

  snapshots.push({
    stepIndex: 6,
    stage: 'bob_decode_h',
    title: 'Bob Decodes: Hadamard Basis Rotation',
    description: 'Bob applies Hadamard to q0.',
    narration: bobHNarr,
    mathLatex: bobHMath,
    stateVector: [...state],
    probabilities: computeProbabilities(state),
    activeGateId: gateBobH.id,
    particlePosition: 'bob',
    concurrence: c6,
    entropy: e6
  });

  // Step 7: Final Measurement
  const idealProbabilities = computeProbabilities(state);

  // Apply optional noise to effective measurement probabilities if configured
  const effectiveProbabilities: Record<BasisState, number> = { ...idealProbabilities };
  if (noiseRate > 0) {
    for (const b of ['00', '01', '10', '11'] as BasisState[]) {
      effectiveProbabilities[b] = (1 - noiseRate) * idealProbabilities[b] + noiseRate * 0.25;
    }
  }

  // Sample actual measurements according to Born rule
  const measurement = sampleMeasurements(effectiveProbabilities, shots, seed);

  // Determine decoded message and success
  let decoded: Message | 'ambiguous' = 'ambiguous';
  let success = false;

  if (isEntangledMode) {
    let dominantState: BasisState = '00';
    let maxP = -1;
    for (const b of ['00', '01', '10', '11'] as BasisState[]) {
      if (effectiveProbabilities[b] > maxP) {
        maxP = effectiveProbabilities[b];
        dominantState = b;
      }
    }
    decoded = dominantState as Message;
    success = decoded === message && (noiseRate > 0 ? maxP > 0.5 : Math.abs(maxP - 1.0) < 1e-6);
  } else {
    // Unentangled: outcomes are 50/50 ambiguous
    decoded = 'ambiguous';
    success = false;
  }

  const c7 = computeConcurrence(state);
  const e7 = computeEntropy(c7);

  snapshots.push({
    stepIndex: 7,
    stage: 'measurement',
    title: 'Computational Basis Measurement',
    description: isEntangledMode
      ? `Measurement collapses state vector. Bob observes '${decoded}'.`
      : `Measurement reveals ambiguous distribution. Protocol fails to recover both bits without entanglement.`,
    narration: isEntangledMode
      ? `Bob performs projective computational measurement. In this ideal noiseless simulation, Bob measures bitstring '${decoded}' with certainty (P=1.0).`
      : `Without shared entanglement, Bob measures equal 50% probabilities across two states (${
          message === '00' || message === '10' ? '|00⟩ and |10⟩' : '|01⟩ and |11⟩'
        }). Alice's second bit of information is lost, adhering to Holevo's bound (max 1 bit per unentangled qubit).`,
    mathLatex: isEntangledMode
      ? `P(|${decoded}\\rangle) = ${effectiveProbabilities[decoded as BasisState].toFixed(
          4
        )}, \\quad \\text{Decoded: } ${decoded}`
      : `P = 0.5000 / 0.5000, \\quad \\text{Ambiguous Decoding (Holevo bound: } \\le 1 \\text{ bit)}`,
    stateVector: [...state],
    probabilities: effectiveProbabilities,
    particlePosition: 'bob',
    concurrence: c7,
    entropy: e7
  });

  const entanglementMetric: EntanglementMetric = {
    concurrence: c2,
    vonNeumannEntropy: e2,
    isEntangled: c2 > 0.5,
    description: isEntangledMode
      ? 'Maximal entanglement prepared via H and CNOT (Concurrence C = 1.0, Entropy S = 1.0 ebit).'
      : 'Separable product state |00⟩ with zero entanglement (Concurrence C = 0.0, Entropy S = 0.0 ebit).'
  };

  const warnings: string[] = [];
  if (!isEntangledMode) {
    warnings.push(
      'Unentangled product state: superdense coding protocol cannot deterministically decode both classical bits.'
    );
  }
  if (noiseRate > 0) {
    warnings.push(`Environmental decoherence enabled with noise rate ${(noiseRate * 100).toFixed(1)}%.`);
  }

  return {
    protocol: 'superdense-coding',
    message,
    mode,
    decodedMessage: decoded,
    success,
    qubitOrdering: '|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)',
    gates,
    snapshots,
    finalAmplitudes: [...state],
    finalProbabilities: effectiveProbabilities,
    theoreticalProbabilities: idealProbabilities,
    entanglementMetric,
    measurement,
    noiseRate,
    warnings
  };
}

/**
 * Runs a side-by-side comparative simulation of Superdense Coding with and without entanglement.
 */
export function simulateSuperdenseComparison(
  message: Message,
  shots = 1000,
  seed = 42,
  noiseRate = 0
): ComparisonSimulationResult {
  const entangled = simulateSuperdense(message, shots, seed, {
    mode: 'with_entanglement',
    noiseRate
  });
  const unentangled = simulateSuperdense(message, shots, seed, {
    mode: 'without_entanglement',
    noiseRate
  });

  return {
    message,
    entangled,
    unentangled,
    comparison: {
      entangledDecoded: (entangled.decodedMessage as Message) || message,
      unentangledDecoded: unentangled.decodedMessage,
      entangledSuccess: entangled.success,
      unentangledSuccess: unentangled.success,
      theoreticalFidelityEntangled: entangled.theoreticalProbabilities[message],
      theoreticalFidelityUnentangled: unentangled.theoreticalProbabilities[message] ?? 0.5,
      holevoLimitExplanation:
        'Holevo bound proves that 1 physical qubit transmitted without prior entanglement can convey at most 1 classical bit of information. Superdense coding achieves 2 bits strictly by utilizing the pre-shared Bell pair resource.'
    }
  };
}
