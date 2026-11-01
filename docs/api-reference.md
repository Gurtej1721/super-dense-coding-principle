# REST API Reference: Quantum Superdense Coding Simulator

Base URL: `http://localhost:8000/api/v1`  
OpenAPI / Swagger UI: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

---

## 1. Health Check

### `GET /api/v1/health`
Checks server readiness and operational status.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "quantum-superdense-simulator"
}
```

---

## 2. Protocol Metadata

### `GET /api/v1/protocols/superdense`
Retrieves protocol metadata, Alice's encoding gate matrix dictionary, and basis ordering conventions.

**Response `200 OK`**:
```json
{
  "protocol": "superdense-coding",
  "title": "Quantum Superdense Coding Protocol",
  "summary": "Transmits two classical bits by sending a single physical qubit using pre-shared entanglement.",
  "basisOrdering": "|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)",
  "aliceEncodingMap": {
    "00": {"gates": ["I"], "label": "Identity (I)", "math": "I"},
    "01": {"gates": ["X"], "label": "Bit Flip (X)", "math": "X"},
    "10": {"gates": ["Z"], "label": "Phase Flip (Z)", "math": "Z"},
    "11": {"gates": ["Z", "X"], "label": "Phase & Bit Flip (XZ)", "math": "X \\cdot Z"}
  },
  "idealEndStateProbability": 1.0
}
```

---

## 3. Run Protocol Simulation

### `POST /api/v1/simulations`
Executes the full superdense coding protocol end-to-end for a given 2-bit message, returning all 8 state-vector snapshots, gate definitions, final probabilities, and seeded measurement counts.

**Request Body**:
```json
{
  "protocol": "superdense-coding",
  "message": "11",
  "shots": 1000,
  "seed": 42
}
```

**Parameters**:
- `protocol`: `"superdense-coding"` (string, required)
- `message`: One of `"00"`, `"01"`, `"10"`, `"11"` (string, required)
- `shots`: Integer between `0` and `100,000` (default: 1000)
- `seed`: Integer between `0` and `2147483647` (default: 42)

**Response `200 OK`**:
```json
{
  "protocol": "superdense-coding",
  "message": "11",
  "decodedMessage": "11",
  "success": true,
  "qubitOrdering": "|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)",
  "gates": [
    {
      "id": "gate-bell-h0",
      "gate": "H",
      "name": "Hadamard (q0)",
      "qubits": [0],
      "stage": "bell_prep_h",
      "description": "Applies Hadamard on Alice's qubit q0...",
      "matrixLatex": "\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}",
      "affectedQubitLabel": "q0 (Alice)"
    }
  ],
  "snapshots": [
    {
      "stepIndex": 0,
      "stage": "initial",
      "title": "Ground State Preparation",
      "description": "System initialized to |00⟩.",
      "narration": "Alice and Bob start with two qubits initialized...",
      "mathLatex": "|\\psi_0\\rangle = |00\\rangle",
      "stateVector": [
        {"real": 1.0, "imag": 0.0},
        {"real": 0.0, "imag": 0.0},
        {"real": 0.0, "imag": 0.0},
        {"real": 0.0, "imag": 0.0}
      ],
      "probabilities": {
        "00": 1.0,
        "01": 0.0,
        "10": 0.0,
        "11": 0.0
      },
      "particlePosition": "alice"
    }
  ],
  "finalAmplitudes": [
    {"real": 0.0, "imag": 0.0},
    {"real": 0.0, "imag": 0.0},
    {"real": 0.0, "imag": 0.0},
    {"real": -1.0, "imag": 0.0}
  ],
  "finalProbabilities": {
    "00": 0.0,
    "01": 0.0,
    "10": 0.0,
    "11": 1.0
  },
  "measurement": {
    "counts": {
      "00": 0,
      "01": 0,
      "10": 0,
      "11": 1000
    },
    "shots": 1000,
    "seed": 42,
    "probabilities": {
      "00": 0.0,
      "01": 0.0,
      "10": 0.0,
      "11": 1.0
    }
  },
  "warnings": []
}
```

---

## 4. Measurement Sampling

### `POST /api/v1/simulations/measure`
Performs reproducible seeded Monte-Carlo sampling from a validated computational-basis probability distribution.

**Request Body**:
```json
{
  "probabilities": {
    "00": 0.5,
    "01": 0.0,
    "10": 0.0,
    "11": 0.5
  },
  "shots": 5000,
  "seed": 999
}
```

**Response `200 OK`**:
```json
{
  "counts": {
    "00": 2487,
    "01": 0,
    "10": 0,
    "11": 2513
  },
  "shots": 5000,
  "seed": 999,
  "probabilities": {
    "00": 0.5,
    "01": 0.0,
    "10": 0.0,
    "11": 0.5
  }
}
```

---

## 5. Error Codes

| HTTP Status | Error Code | Description |
|---|---|---|
| `422 Unprocessable Entity` | `E_VALIDATION_MESSAGE` | Message must be one of `"00"`, `"01"`, `"10"`, `"11"`. |
| `422 Unprocessable Entity` | `E_VALIDATION_SHOTS` | Shots count must be an integer between 0 and 100,000. |
| `422 Unprocessable Entity` | `E_VALIDATION_PROBABILITIES` | Probabilities must sum to 1.0 within tolerance. |
| `500 Internal Server Error` | `E_INTERNAL_SERVER_ERROR` | Sanitized server error. |
