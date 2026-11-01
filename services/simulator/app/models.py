from typing import List, Literal, Optional, Dict
from pydantic import BaseModel, Field, field_validator

MessageLiteral = Literal["00", "01", "10", "11"]
BasisStateLiteral = Literal["00", "01", "10", "11"]
GateTypeLiteral = Literal["I", "H", "X", "Z", "CNOT", "NONE"]
ExperimentModeLiteral = Literal["with_entanglement", "without_entanglement"]
StageLiteral = Literal[
    "initial",
    "bell_prep_h",
    "bell_prep_cnot",
    "alice_encode",
    "transmit",
    "bob_decode_cnot",
    "bob_decode_h",
    "measurement"
]


class ComplexNumber(BaseModel):
    real: float
    imag: float = 0.0

    @field_validator("real", "imag")
    @classmethod
    def check_finite(cls, v: float) -> float:
        import math
        if not math.isfinite(v):
            raise ValueError("Amplitude component must be finite (not NaN or Inf).")
        return v


class EntanglementMetric(BaseModel):
    concurrence: float
    vonNeumannEntropy: float
    isEntangled: bool
    description: str


class GateOperation(BaseModel):
    id: str
    gate: GateTypeLiteral
    name: str
    qubits: List[int]
    control: Optional[int] = None
    target: Optional[int] = None
    stage: StageLiteral
    description: str
    matrixLatex: Optional[str] = None
    affectedQubitLabel: str


class SimulationSnapshot(BaseModel):
    stepIndex: int
    stage: StageLiteral
    title: str
    description: str
    narration: str
    mathLatex: str
    stateVector: List[ComplexNumber]
    probabilities: Dict[BasisStateLiteral, float]
    activeGateId: Optional[str] = None
    particlePosition: Optional[Literal["alice", "in_transit", "bob"]] = None
    concurrence: Optional[float] = None
    entropy: Optional[float] = None


class MeasurementSample(BaseModel):
    counts: Dict[BasisStateLiteral, int]
    shots: int
    seed: int
    probabilities: Dict[BasisStateLiteral, float]


class SimulationRequest(BaseModel):
    protocol: Literal["superdense-coding"] = "superdense-coding"
    message: MessageLiteral = Field(..., description="Two-bit classical message to encode: '00', '01', '10', or '11'")
    mode: ExperimentModeLiteral = Field(default="with_entanglement", description="Experiment mode")
    shots: int = Field(default=1000, ge=0, le=100000, description="Measurement shot count (0 to 100,000)")
    seed: int = Field(default=42, ge=0, le=2147483647, description="Deterministic seed for reproducible sampling")
    noiseRate: float = Field(default=0.0, ge=0.0, le=0.5, description="Environmental noise rate (0.0 to 0.5)")


class MeasureRequest(BaseModel):
    probabilities: Dict[BasisStateLiteral, float]
    shots: int = Field(default=1000, ge=0, le=100000)
    seed: int = Field(default=42, ge=0, le=2147483647)

    @field_validator("probabilities")
    @classmethod
    def validate_probabilities(cls, v: Dict[BasisStateLiteral, float]) -> Dict[BasisStateLiteral, float]:
        import math
        required_keys = {"00", "01", "10", "11"}
        if set(v.keys()) != required_keys:
            raise ValueError("Probabilities dictionary must contain exact keys: '00', '01', '10', '11'")
        total = 0.0
        for k, p in v.items():
            if not math.isfinite(p) or p < 0:
                raise ValueError(f"Probability for {k} must be non-negative and finite.")
            total += p
        if abs(total - 1.0) > 1e-5:
            raise ValueError(f"Probabilities must sum to 1.0 within tolerance. Got sum = {total}")
        return v


class SimulationResult(BaseModel):
    protocol: Literal["superdense-coding"] = "superdense-coding"
    message: MessageLiteral
    mode: ExperimentModeLiteral = "with_entanglement"
    decodedMessage: Literal["00", "01", "10", "11", "ambiguous"]
    success: bool
    qubitOrdering: str = "|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)"
    gates: List[GateOperation]
    snapshots: List[SimulationSnapshot]
    finalAmplitudes: List[ComplexNumber]
    finalProbabilities: Dict[BasisStateLiteral, float]
    theoreticalProbabilities: Optional[Dict[BasisStateLiteral, float]] = None
    entanglementMetric: Optional[EntanglementMetric] = None
    measurement: MeasurementSample
    noiseRate: float = 0.0
    warnings: List[str] = Field(default_factory=list)


class ProtocolMetadata(BaseModel):
    protocol: Literal["superdense-coding"] = "superdense-coding"
    title: str
    summary: str
    basisOrdering: str
    aliceEncodingMap: Dict[str, Dict[str, object]]
    idealEndStateProbability: float = 1.0


class HealthResponse(BaseModel):
    status: Literal["healthy"] = "healthy"
    version: str = "1.0.0"
    service: str = "quantum-superdense-simulator"
