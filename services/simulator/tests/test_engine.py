import pytest
import numpy as np
from app.engine import (
    run_superdense_simulation,
    compute_probabilities,
    compute_concurrence,
    compute_entropy,
    sample_measurements,
    I_2, H_2, X_2, Z_2, CNOT_01
)


def test_gate_unitarity():
    gates = [I_2, H_2, X_2, Z_2]
    for g in gates:
        u_dag_u = g.conj().T @ g
        assert np.allclose(u_dag_u, np.eye(2, dtype=np.complex128), atol=1e-9)

    cnot_dag_cnot = CNOT_01.conj().T @ CNOT_01
    assert np.allclose(cnot_dag_cnot, np.eye(4, dtype=np.complex128), atol=1e-9)


def test_bell_state_properties():
    # Prepare |Phi+> = CNOT(H (x) I)|00>
    state = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.complex128)
    state = np.kron(H_2, I_2) @ state
    bell = CNOT_01 @ state

    probs = compute_probabilities(bell)
    assert pytest.approx(probs["00"], abs=1e-7) == 0.5
    assert pytest.approx(probs["01"], abs=1e-7) == 0.0
    assert pytest.approx(probs["10"], abs=1e-7) == 0.0
    assert pytest.approx(probs["11"], abs=1e-7) == 0.5


@pytest.mark.parametrize("msg", ["00", "01", "10", "11"])
def test_all_four_messages_deterministic_success(msg):
    res = run_superdense_simulation(msg, shots=1000, seed=42)
    assert res.message == msg
    assert res.decodedMessage == msg
    assert res.success is True
    assert pytest.approx(res.finalProbabilities[msg], abs=1e-7) == 1.0

    # Verify all other probabilities are 0
    for other in ["00", "01", "10", "11"]:
        if other != msg:
            assert pytest.approx(res.finalProbabilities[other], abs=1e-7) == 0.0

    # Verify all 8 snapshots exist and have normalized state vectors
    assert len(res.snapshots) == 8
    for snap in res.snapshots:
        norm_sq = sum(c.real ** 2 + c.imag ** 2 for c in snap.stateVector)
        assert pytest.approx(norm_sq, abs=1e-7) == 1.0

    # Verify measurement counts
    assert res.measurement.shots == 1000
    assert res.measurement.counts[msg] == 1000


def test_invalid_message_rejection():
    with pytest.raises(ValueError, match="Invalid message"):
        run_superdense_simulation("02")


def test_seeded_sampling_reproducibility():
    probs = {"00": 0.5, "01": 0.5, "10": 0.0, "11": 0.0}
    s1 = sample_measurements(probs, shots=5000, seed=999)
    s2 = sample_measurements(probs, shots=5000, seed=999)
    assert s1.counts == s2.counts
    assert s1.counts["00"] + s1.counts["01"] == 5000


def test_entanglement_concurrence_metrics():
    # Bell state |Phi+>
    bell = np.array([1.0 / np.sqrt(2), 0.0, 0.0, 1.0 / np.sqrt(2)], dtype=np.complex128)
    assert pytest.approx(compute_concurrence(bell), abs=1e-7) == 1.0
    assert pytest.approx(compute_entropy(1.0), abs=1e-7) == 1.0

    # Product state |00>
    prod = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.complex128)
    assert pytest.approx(compute_concurrence(prod), abs=1e-7) == 0.0
    assert pytest.approx(compute_entropy(0.0), abs=1e-7) == 0.0


@pytest.mark.parametrize("msg", ["00", "01", "10", "11"])
def test_unentangled_mode_failure_and_probabilities(msg):
    res = run_superdense_simulation(msg, shots=2000, seed=42, mode="without_entanglement")
    assert res.mode == "without_entanglement"
    assert res.success is False
    assert res.decodedMessage == "ambiguous"

    # Concurrence is zero for all snapshots
    for snap in res.snapshots:
        assert pytest.approx(snap.concurrence, abs=1e-7) == 0.0
        assert pytest.approx(snap.entropy, abs=1e-7) == 0.0

    if msg in ("00", "10"):
        assert pytest.approx(res.finalProbabilities["00"], abs=1e-7) == 0.5
        assert pytest.approx(res.finalProbabilities["10"], abs=1e-7) == 0.5
        assert pytest.approx(res.finalProbabilities["01"], abs=1e-7) == 0.0
        assert pytest.approx(res.finalProbabilities["11"], abs=1e-7) == 0.0
    else:
        assert pytest.approx(res.finalProbabilities["01"], abs=1e-7) == 0.5
        assert pytest.approx(res.finalProbabilities["11"], abs=1e-7) == 0.5
        assert pytest.approx(res.finalProbabilities["00"], abs=1e-7) == 0.0
        assert pytest.approx(res.finalProbabilities["10"], abs=1e-7) == 0.0
