import numpy as np
from typing import Dict, List, Tuple, Literal
from .models import (
    ComplexNumber,
    EntanglementMetric,
    ExperimentModeLiteral,
    GateOperation,
    MeasurementSample,
    MessageLiteral,
    BasisStateLiteral,
    SimulationResult,
    SimulationSnapshot
)

TOLERANCE = 1e-9

INV_SQRT2 = 1.0 / np.sqrt(2.0)

I_2 = np.array([[1.0, 0.0], [0.0, 1.0]], dtype=np.complex128)
H_2 = np.array([[INV_SQRT2, INV_SQRT2], [INV_SQRT2, -INV_SQRT2]], dtype=np.complex128)
X_2 = np.array([[0.0, 1.0], [1.0, 0.0]], dtype=np.complex128)
Z_2 = np.array([[1.0, 0.0], [0.0, -1.0]], dtype=np.complex128)

CNOT_01 = np.array([
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 0.0]
], dtype=np.complex128)

BASIS_LABELS: List[BasisStateLiteral] = ["00", "01", "10", "11"]


def to_complex_models(state: np.ndarray) -> List[ComplexNumber]:
    return [ComplexNumber(real=float(c.real), imag=float(c.imag)) for c in state]


def compute_concurrence(state: np.ndarray) -> float:
    a, b, c, d = state[0], state[1], state[2], state[3]
    diff = a * d - b * c
    val = float(2.0 * np.abs(diff))
    return float(np.clip(val, 0.0, 1.0))


def compute_entropy(concurrence: float) -> float:
    if concurrence <= 1e-9:
        return 0.0
    if concurrence >= 1.0 - 1e-9:
        return 1.0
    x = (1.0 + np.sqrt(max(0.0, 1.0 - concurrence ** 2))) / 2.0
    t1 = x * np.log2(x) if x > 0 else 0.0
    t2 = (1.0 - x) * np.log2(1.0 - x) if (1.0 - x) > 0 else 0.0
    return float(np.clip(-(t1 + t2), 0.0, 1.0))


def compute_probabilities(state: np.ndarray) -> Dict[BasisStateLiteral, float]:
    norm_sq = float(np.sum(np.abs(state) ** 2))
    if abs(norm_sq - 1.0) > TOLERANCE:
        raise ValueError(f"State norm violation: {norm_sq} != 1.0 within tolerance {TOLERANCE}")
    
    probs_array = np.abs(state) ** 2
    probs: Dict[BasisStateLiteral, float] = {}
    for idx, label in enumerate(BASIS_LABELS):
        p = float(probs_array[idx])
        if p < 1e-15:
            p = 0.0
        elif abs(p - 1.0) < 1e-12:
            p = 1.0
        probs[label] = p
    return probs


def sample_measurements(probs: Dict[BasisStateLiteral, float], shots: int, seed: int) -> MeasurementSample:
    counts: Dict[BasisStateLiteral, int] = {"00": 0, "01": 0, "10": 0, "11": 0}
    if shots <= 0:
        return MeasurementSample(counts=counts, shots=0, seed=seed, probabilities=probs)

    p_vals = np.array([probs[b] for b in BASIS_LABELS], dtype=np.float64)
    p_sum = np.sum(p_vals)
    if abs(p_sum - 1.0) > 1e-6:
        raise ValueError(f"Probabilities must sum to 1.0 for sampling. Got {p_sum}")
    p_vals = p_vals / p_sum

    rng = np.random.default_rng(seed)
    chosen_indices = rng.choice(4, size=shots, p=p_vals)
    unique, counts_arr = np.unique(chosen_indices, return_counts=True)
    for u, cnt in zip(unique, counts_arr):
        counts[BASIS_LABELS[u]] = int(cnt)

    return MeasurementSample(counts=counts, shots=shots, seed=seed, probabilities=probs)


def run_superdense_simulation(
    message: MessageLiteral,
    shots: int = 1000,
    seed: int = 42,
    mode: ExperimentModeLiteral = "with_entanglement",
    noise_rate: float = 0.0
) -> SimulationResult:
    if message not in ("00", "01", "10", "11"):
        raise ValueError(f"Invalid message: {message}")

    is_entangled = mode == "with_entanglement"
    snapshots: List[SimulationSnapshot] = []
    gates: List[GateOperation] = []

    # Step 0: Initial state |00>
    state = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.complex128)
    c0 = compute_concurrence(state)
    e0 = compute_entropy(c0)

    snapshots.append(SimulationSnapshot(
        stepIndex=0,
        stage="initial",
        title="Ground State Preparation",
        description="System initialized to |00⟩." if is_entangled else "Alice and Bob initialize independent product state |0⟩_A ⊗ |0⟩_B = |00⟩.",
        narration="Alice and Bob start with two qubits initialized in the standard computational ground state |00⟩.",
        mathLatex="|\\psi_0\\rangle = |00\\rangle",
        stateVector=to_complex_models(state),
        probabilities=compute_probabilities(state),
        particlePosition="alice",
        concurrence=c0,
        entropy=e0
    ))

    c2 = 0.0
    e2 = 0.0

    if is_entangled:
        # Step 1: Bell Prep - Hadamard on q0
        gate_h0 = GateOperation(
            id="gate-bell-h0",
            gate="H",
            name="Hadamard (q0)",
            qubits=[0],
            stage="bell_prep_h",
            description="Applies Hadamard on Alice's qubit q0 to create superposition (|0⟩+|1⟩)/√2.",
            matrixLatex="\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}",
            affectedQubitLabel="q0 (Alice)"
        )
        gates.append(gate_h0)
        state = np.kron(H_2, I_2) @ state
        c1 = compute_concurrence(state)
        e1 = compute_entropy(c1)

        snapshots.append(SimulationSnapshot(
            stepIndex=1,
            stage="bell_prep_h",
            title="Superposition Creation",
            description="Hadamard gate applied to q0.",
            narration="A Hadamard gate transforms Alice's qubit into an equal superposition: (|0⟩+|1⟩)/√2, while Bob's qubit remains |0⟩.",
            mathLatex="|\\psi_1\\rangle = (H \\otimes I)|00\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle)",
            stateVector=to_complex_models(state),
            probabilities=compute_probabilities(state),
            activeGateId=gate_h0.id,
            particlePosition="alice",
            concurrence=c1,
            entropy=e1
        ))

        # Step 2: Bell Prep - CNOT(q0 -> q1)
        gate_cnot = GateOperation(
            id="gate-bell-cnot",
            gate="CNOT",
            name="CNOT (q0 -> q1)",
            qubits=[0, 1],
            control=0,
            target=1,
            stage="bell_prep_cnot",
            description="Entangles q0 and q1 into the Bell pair |Φ+⟩.",
            matrixLatex="\\begin{pmatrix}1 & 0 & 0 & 0\\\\ 0 & 1 & 0 & 0\\\\ 0 & 0 & 0 & 1\\\\ 0 & 0 & 1 & 0\\end{pmatrix}",
            affectedQubitLabel="q0 (control), q1 (target)"
        )
        gates.append(gate_cnot)
        state = CNOT_01 @ state
        c2 = compute_concurrence(state)
        e2 = compute_entropy(c2)

        snapshots.append(SimulationSnapshot(
            stepIndex=2,
            stage="bell_prep_cnot",
            title="Entanglement Generation",
            description="CNOT gate entangles q0 and q1 into the Bell state |Φ+⟩.",
            narration="The CNOT gate uses q0 as control and q1 as target, establishing maximum quantum entanglement: |Φ+⟩ = (|00⟩ + |11⟩)/√2.",
            mathLatex="|\\psi_2\\rangle = \\text{CNOT}|\\psi_1\\rangle = |\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)",
            stateVector=to_complex_models(state),
            probabilities=compute_probabilities(state),
            activeGateId=gate_cnot.id,
            particlePosition="alice",
            concurrence=c2,
            entropy=e2
        ))
    else:
        # Unentangled Mode: skip entanglement generation
        gate_none1 = GateOperation(
            id="gate-unentangled-skip-h",
            gate="NONE",
            name="No Entanglement Gate",
            qubits=[0],
            stage="bell_prep_h",
            description="Hadamard is not applied. Qubits remain independent in product state |00⟩.",
            matrixLatex="\\text{Identity / Bypass}",
            affectedQubitLabel="q0 (Alice)"
        )
        gates.append(gate_none1)
        snapshots.append(SimulationSnapshot(
            stepIndex=1,
            stage="bell_prep_h",
            title="Independent State (No Hadamard)",
            description="Qubits remain independent in product state |00⟩.",
            narration="In the unentangled mode, no Hadamard gate is applied. Alice and Bob hold isolated, unentangled qubits.",
            mathLatex="|\\psi_1\\rangle = |00\\rangle = |0\\rangle_A \\otimes |0\\rangle_B",
            stateVector=to_complex_models(state),
            probabilities=compute_probabilities(state),
            activeGateId=gate_none1.id,
            particlePosition="alice",
            concurrence=0.0,
            entropy=0.0
        ))

        gate_none2 = GateOperation(
            id="gate-unentangled-skip-cnot",
            gate="NONE",
            name="No Entanglement CNOT",
            qubits=[0, 1],
            stage="bell_prep_cnot",
            description="CNOT is skipped. System remains in separable product state |00⟩.",
            matrixLatex="\\text{Identity / Bypass}",
            affectedQubitLabel="q0, q1 (Unentangled)"
        )
        gates.append(gate_none2)
        snapshots.append(SimulationSnapshot(
            stepIndex=2,
            stage="bell_prep_cnot",
            title="Product State Maintained (No CNOT)",
            description="No entanglement generated. Concurrence C = 0.0.",
            narration="Because no CNOT gate is performed, the two qubits remain in the separable product state |00⟩ with zero concurrence.",
            mathLatex="|\\psi_2\\rangle = |00\\rangle, \\quad C(|\\psi_2\\rangle) = 0.0",
            stateVector=to_complex_models(state),
            probabilities=compute_probabilities(state),
            activeGateId=gate_none2.id,
            particlePosition="alice",
            concurrence=0.0,
            entropy=0.0
        ))

    # Step 3: Alice Encodes Message (IDENTICAL in both modes!)
    encode_math = ""
    encode_narr = ""
    active_encode_id = ""

    if message == "00":
        gate_i = GateOperation(
            id="gate-encode-i",
            gate="I",
            name="Identity (q0)",
            qubits=[0],
            stage="alice_encode",
            description='Alice applies Identity (no-op) to encode classical bitstring "00".',
            matrixLatex="\\begin{pmatrix}1 & 0\\\\ 0 & 1\\end{pmatrix}",
            affectedQubitLabel="q0 (Alice)"
        )
        gates.append(gate_i)
        active_encode_id = gate_i.id
        op_encode = np.kron(I_2, I_2)
        state = op_encode @ state
        if is_entangled:
            encode_math = "|\\psi_3\\rangle = (I \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle) = |\\Phi^+\\rangle"
            encode_narr = 'To encode "00", Alice applies the Identity operator (leaves qubit unchanged). The shared state remains |Φ+⟩.'
        else:
            encode_math = "|\\psi_3\\rangle = (I \\otimes I)|00\\rangle = |00\\rangle"
            encode_narr = 'Alice applies Identity to her qubit. The separable state remains |00⟩.'
    elif message == "01":
        gate_x = GateOperation(
            id="gate-encode-x",
            gate="X",
            name="Pauli-X (q0)",
            qubits=[0],
            stage="alice_encode",
            description='Alice applies Pauli-X (bit flip) to encode classical bitstring "01".',
            matrixLatex="\\begin{pmatrix}0 & 1\\\\ 1 & 0\\end{pmatrix}",
            affectedQubitLabel="q0 (Alice)"
        )
        gates.append(gate_x)
        active_encode_id = gate_x.id
        op_encode = np.kron(X_2, I_2)
        state = op_encode @ state
        if is_entangled:
            encode_math = "|\\psi_3\\rangle = (X \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle + |10\\rangle) = |\\Psi^+\\rangle"
            encode_narr = 'To encode "01", Alice applies Pauli-X (bit flip) to q0, mapping |Φ+⟩ to the Bell state |Ψ+⟩ = (|01⟩ + |10⟩)/√2.'
        else:
            encode_math = "|\\psi_3\\rangle = (X \\otimes I)|00\\rangle = |10\\rangle"
            encode_narr = "Alice applies Pauli-X to flip her qubit from |0⟩ to |1⟩. The system becomes product state |10⟩."
    elif message == "10":
        gate_z = GateOperation(
            id="gate-encode-z",
            gate="Z",
            name="Pauli-Z (q0)",
            qubits=[0],
            stage="alice_encode",
            description='Alice applies Pauli-Z (phase flip) to encode classical bitstring "10".',
            matrixLatex="\\begin{pmatrix}1 & 0\\\\ 0 & -1\\end{pmatrix}",
            affectedQubitLabel="q0 (Alice)"
        )
        gates.append(gate_z)
        active_encode_id = gate_z.id
        op_encode = np.kron(Z_2, I_2)
        state = op_encode @ state
        if is_entangled:
            encode_math = "|\\psi_3\\rangle = (Z \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle - |11\\rangle) = |\\Phi^-\\rangle"
            encode_narr = 'To encode "10", Alice applies Pauli-Z (phase flip) to q0, mapping |Φ+⟩ to the Bell state |Φ-⟩ = (|00⟩ - |11⟩)/√2.'
        else:
            encode_math = "|\\psi_3\\rangle = (Z \\otimes I)|00\\rangle = |00\\rangle"
            encode_narr = 'Alice applies Pauli-Z to her qubit. Since Z|0⟩ = |0⟩, the state is completely unchanged! Message "10" collides with "00".'
    else:  # message == "11": XZ encoding, applying X first and Z second
        gate_x = GateOperation(
            id="gate-encode-x11",
            gate="X",
            name="Pauli-X (q0)",
            qubits=[0],
            stage="alice_encode",
            description='Alice applies Pauli-X first as part of the XZ sequence.',
            matrixLatex="\\begin{pmatrix}0 & 1\\\\ 1 & 0\\end{pmatrix}",
            affectedQubitLabel="q0 (Alice)"
        )
        gate_z = GateOperation(
            id="gate-encode-z11",
            gate="Z",
            name="Pauli-Z (q0)",
            qubits=[0],
            stage="alice_encode",
            description="Alice applies Pauli-Z second as part of the XZ sequence to encode '11'.",
            matrixLatex="\\begin{pmatrix}1 & 0\\\\ 0 & -1\\end{pmatrix}",
            affectedQubitLabel="q0 (Alice)"
        )
        gates.extend([gate_x, gate_z])
        active_encode_id = gate_z.id
        # X first, then Z
        state = np.kron(X_2, I_2) @ state
        state = np.kron(Z_2, I_2) @ state
        if is_entangled:
            encode_math = "|\\psi_3\\rangle = (Z \\cdot X \\otimes I)|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle - |10\\rangle) = -|\\Psi^-\\rangle"
            encode_narr = 'To encode "11", Alice applies Pauli-X followed by Pauli-Z to q0, mapping |Φ+⟩ to -|Ψ-⟩ = (|01⟩ - |10⟩)/√2.'
        else:
            encode_math = "|\\psi_3\\rangle = (Z \\cdot X \\otimes I)|00\\rangle = -|10\\rangle"
            encode_narr = 'Alice applies X then Z. The state becomes -|10⟩. The negative phase is a global phase for this product state.'

    c3 = compute_concurrence(state)
    e3 = compute_entropy(c3)

    snapshots.append(SimulationSnapshot(
        stepIndex=3,
        stage="alice_encode",
        title=f"Alice Encodes Message '{message}'",
        description="Alice applies local unitary gate(s) to her qubit q0.",
        narration=encode_narr,
        mathLatex=encode_math,
        stateVector=to_complex_models(state),
        probabilities=compute_probabilities(state),
        activeGateId=active_encode_id,
        particlePosition="alice",
        concurrence=c3,
        entropy=e3
    ))

    # Step 4: Transmission across quantum channel
    c4 = compute_concurrence(state)
    e4 = compute_entropy(c4)

    snapshots.append(SimulationSnapshot(
        stepIndex=4,
        stage="transmit",
        title="Transmission Across Quantum Channel",
        description="Alice sends qubit q0 to Bob across the quantum channel.",
        narration="Alice physically transmits her single qubit q0 to Bob. The joint quantum state vector is invariant under spatial relocation; Bob now holds both qubits.",
        mathLatex="\\text{Transmit } q_0 \\text{ to Bob: State vector } |\\psi_4\\rangle = |\\psi_3\\rangle",
        stateVector=to_complex_models(state),
        probabilities=compute_probabilities(state),
        particlePosition="in_transit",
        concurrence=c4,
        entropy=e4
    ))

    # Step 5: Bob Decodes - CNOT(q0 -> q1) (IDENTICAL in both modes!)
    gate_bob_cnot = GateOperation(
        id="gate-bob-cnot",
        gate="CNOT",
        name="CNOT (q0 -> q1)",
        qubits=[0, 1],
        control=0,
        target=1,
        stage="bob_decode_cnot",
        description="Bob applies CNOT to disentangle the two qubits.",
        matrixLatex="\\begin{pmatrix}1 & 0 & 0 & 0\\\\ 0 & 1 & 0 & 0\\\\ 0 & 0 & 0 & 1\\\\ 0 & 0 & 1 & 0\\end{pmatrix}",
        affectedQubitLabel="q0 (control), q1 (target)"
    )
    gates.append(gate_bob_cnot)
    state = CNOT_01 @ state

    bob_cnot_math = ""
    bob_cnot_narr = ""

    if is_entangled:
        if message == "00":
            bob_cnot_math = "|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle) = \\frac{|0\\rangle+|1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle"
        elif message == "01":
            bob_cnot_math = "|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle + |11\\rangle) = \\frac{|0\\rangle+|1\\rangle}{\\sqrt{2}} \\otimes |1\\rangle"
        elif message == "10":
            bob_cnot_math = "|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle - |10\\rangle) = \\frac{|0\\rangle-|1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle"
        else:
            bob_cnot_math = "|\\psi_5\\rangle = \\text{CNOT}|\\psi_4\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle - |11\\rangle) = \\frac{|0\\rangle-|1\\rangle}{\\sqrt{2}} \\otimes |1\\rangle"
        bob_cnot_narr = "Bob applies CNOT(q0 -> q1). Notice how qubit q1 is now completely disentangled and fixed to the second bit of the message."
    else:
        if message in ("00", "10"):
            bob_cnot_math = "|\\psi_5\\rangle = \\text{CNOT}|00\\rangle = |00\\rangle"
            bob_cnot_narr = "Bob applies CNOT. Because q0 is |0⟩, target q1 is not flipped."
        elif message == "01":
            bob_cnot_math = "|\\psi_5\\rangle = \\text{CNOT}|10\\rangle = |11\\rangle"
            bob_cnot_narr = "Bob applies CNOT. Because q0 is |1⟩, target q1 flips from |0⟩ to |1⟩, producing |11⟩."
        else:
            bob_cnot_math = "|\\psi_5\\rangle = \\text{CNOT}(-|10\\rangle) = -|11\\rangle"
            bob_cnot_narr = "Bob applies CNOT to -|10⟩, producing -|11⟩."

    c5 = compute_concurrence(state)
    e5 = compute_entropy(c5)

    snapshots.append(SimulationSnapshot(
        stepIndex=5,
        stage="bob_decode_cnot",
        title="Bob Decodes: CNOT Disentanglement",
        description="Bob applies CNOT(q0 -> q1) to disentangle qubit q1.",
        narration=bob_cnot_narr,
        mathLatex=bob_cnot_math,
        stateVector=to_complex_models(state),
        probabilities=compute_probabilities(state),
        activeGateId=gate_bob_cnot.id,
        particlePosition="bob",
        concurrence=c5,
        entropy=e5
    ))

    # Step 6: Bob Decodes - Hadamard on q0 (IDENTICAL in both modes!)
    gate_bob_h = GateOperation(
        id="gate-bob-h",
        gate="H",
        name="Hadamard (q0)",
        qubits=[0],
        stage="bob_decode_h",
        description="Bob applies Hadamard to q0 to bring it into the computational basis.",
        matrixLatex="\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}",
        affectedQubitLabel="q0 (Bob)"
    )
    gates.append(gate_bob_h)
    state = np.kron(H_2, I_2) @ state

    bob_h_math = ""
    bob_h_narr = ""

    if is_entangled:
        if message == "00":
            bob_h_math = "|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |00\\rangle"
        elif message == "01":
            bob_h_math = "|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |01\\rangle"
        elif message == "10":
            bob_h_math = "|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |10\\rangle"
        else:
            bob_h_math = "|\\psi_6\\rangle = (H \\otimes I)|\\psi_5\\rangle = |11\\rangle"
        bob_h_narr = f"Bob applies the Hadamard gate to q0. The interference constructively aligns the state exactly with computational basis state |{message}⟩."
    else:
        if message in ("00", "10"):
            bob_h_math = "|\\psi_6\\rangle = (H \\otimes I)|00\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle)"
            bob_h_narr = "Bob applies Hadamard to q0. The state splits into equal probabilities for |00⟩ and |10⟩."
        elif message == "01":
            bob_h_math = "|\\psi_6\\rangle = (H \\otimes I)|11\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle - |11\\rangle)"
            bob_h_narr = "Bob applies Hadamard to q0. The state splits into equal probabilities for |01⟩ and |11⟩."
        else:
            bob_h_math = "|\\psi_6\\rangle = (H \\otimes I)(-|11\\rangle) = \\frac{1}{\\sqrt{2}}(-|01\\rangle + |11\\rangle)"
            bob_h_narr = "Bob applies Hadamard to q0. The state splits into equal probabilities for |01⟩ and |11⟩."

    c6 = compute_concurrence(state)
    e6 = compute_entropy(c6)

    snapshots.append(SimulationSnapshot(
        stepIndex=6,
        stage="bob_decode_h",
        title="Bob Decodes: Hadamard Basis Rotation",
        description="Bob applies Hadamard to q0, mapping superposition into computational basis.",
        narration=bob_h_narr,
        mathLatex=bob_h_math,
        stateVector=to_complex_models(state),
        probabilities=compute_probabilities(state),
        activeGateId=gate_bob_h.id,
        particlePosition="bob",
        concurrence=c6,
        entropy=e6
    ))

    # Step 7: Final Measurement
    ideal_probs = compute_probabilities(state)
    effective_probs = dict(ideal_probs)
    if noise_rate > 0.0:
        for b in BASIS_LABELS:
            effective_probs[b] = (1.0 - noise_rate) * ideal_probs[b] + noise_rate * 0.25

    measurement = sample_measurements(effective_probs, shots=shots, seed=seed)

    if is_entangled:
        dominant_b = max(effective_probs.keys(), key=lambda k: effective_probs[k])
        decoded = dominant_b
        success = (decoded == message) and (effective_probs[decoded] > (0.5 if noise_rate > 0 else 0.9999))
    else:
        decoded = "ambiguous"
        success = False

    c7 = compute_concurrence(state)
    e7 = compute_entropy(c7)

    snapshots.append(SimulationSnapshot(
        stepIndex=7,
        stage="measurement",
        title="Computational Basis Measurement",
        description=f"Measurement collapses state vector. Bob observes '{decoded}'." if is_entangled else "Measurement reveals ambiguous distribution.",
        narration=f"Bob performs projective computational measurement. In this ideal noiseless simulation, Bob measures bitstring '{decoded}' with certainty (P=1.0)." if is_entangled else "Without shared entanglement, Bob measures equal 50% probabilities across two states. Alice's classical information cannot be recovered completely.",
        mathLatex=f"P(|{decoded}\\rangle) = {effective_probs.get(decoded, 0.0):.4f}" if is_entangled else "P = 0.5000 / 0.5000, \\quad \\text{Ambiguous (Holevo bound: } \\le 1 \\text{ bit)}",
        stateVector=to_complex_models(state),
        probabilities=effective_probs,
        particlePosition="bob",
        concurrence=c7,
        entropy=e7
    ))

    entanglement_metric = EntanglementMetric(
        concurrence=c2,
        vonNeumannEntropy=e2,
        isEntangled=(c2 > 0.5),
        description="Maximal entanglement prepared via H and CNOT (C = 1.0, S = 1.0 ebit)." if is_entangled else "Separable product state |00⟩ (C = 0.0, S = 0.0 ebit)."
    )

    warnings: List[str] = []
    if not is_entangled:
        warnings.append("Unentangled product state: superdense coding protocol cannot deterministically decode both classical bits.")
    if noise_rate > 0.0:
        warnings.append(f"Environmental decoherence enabled with noise rate {noise_rate * 100:.1f}%.")

    return SimulationResult(
        protocol="superdense-coding",
        message=message,
        mode=mode,
        decodedMessage=decoded,
        success=success,
        qubitOrdering="|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)",
        gates=gates,
        snapshots=snapshots,
        finalAmplitudes=to_complex_models(state),
        finalProbabilities=effective_probs,
        theoreticalProbabilities=ideal_probs,
        entanglementMetric=entanglement_metric,
        measurement=measurement,
        noiseRate=noise_rate,
        warnings=warnings
    )
