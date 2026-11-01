import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "quantum-superdense-simulator"


def test_protocol_metadata():
    response = client.get("/api/v1/protocols/superdense")
    assert response.status_code == 200
    data = response.json()
    assert data["protocol"] == "superdense-coding"
    assert "00" in data["aliceEncodingMap"]
    assert "11" in data["aliceEncodingMap"]


@pytest.mark.parametrize("msg", ["00", "01", "10", "11"])
def test_simulate_messages_api(msg):
    response = client.post("/api/v1/simulations", json={
        "protocol": "superdense-coding",
        "message": msg,
        "shots": 500,
        "seed": 123
    })
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == msg
    assert data["decodedMessage"] == msg
    assert data["success"] is True
    assert pytest.approx(data["finalProbabilities"][msg], abs=1e-6) == 1.0
    assert len(data["snapshots"]) == 8
    assert data["measurement"]["counts"][msg] == 500


def test_validation_error_invalid_message():
    response = client.post("/api/v1/simulations", json={
        "protocol": "superdense-coding",
        "message": "99",
        "shots": 100
    })
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "E_VALIDATION_MESSAGE"


def test_validation_error_negative_shots():
    response = client.post("/api/v1/simulations", json={
        "protocol": "superdense-coding",
        "message": "00",
        "shots": -5
    })
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "E_VALIDATION_SHOTS"


def test_measure_endpoint_success():
    response = client.post("/api/v1/simulations/measure", json={
        "probabilities": {"00": 1.0, "01": 0.0, "10": 0.0, "11": 0.0},
        "shots": 1000,
        "seed": 42
    })
    assert response.status_code == 200
    data = response.json()
    assert data["shots"] == 1000
    assert data["counts"]["00"] == 1000


def test_measure_endpoint_unnormalized_probabilities():
    response = client.post("/api/v1/simulations/measure", json={
        "probabilities": {"00": 0.2, "01": 0.1, "10": 0.0, "11": 0.0},
        "shots": 100,
        "seed": 42
    })
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "E_VALIDATION_PROBABILITIES"
