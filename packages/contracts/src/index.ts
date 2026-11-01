/**
 * Authoritative shared contracts for the Quantum Superdense Coding Simulator.
 */

export type ClassicalBit = '0' | '1';
export type Message = '00' | '01' | '10' | '11';
export type BasisState = '00' | '01' | '10' | '11';
export type ExperimentMode = 'with_entanglement' | 'without_entanglement';

export interface ComplexNumber {
  real: number;
  imag: number;
}

export interface EntanglementMetric {
  concurrence: number;
  vonNeumannEntropy: number;
  isEntangled: boolean;
  description: string;
}

export type GateType = 'I' | 'H' | 'X' | 'Z' | 'CNOT' | 'NONE';

export type ProtocolStage =
  | 'initial'
  | 'bell_prep_h'
  | 'bell_prep_cnot'
  | 'alice_encode'
  | 'transmit'
  | 'bob_decode_cnot'
  | 'bob_decode_h'
  | 'measurement';

export interface GateOperation {
  id: string;
  gate: GateType;
  name: string;
  qubits: number[];
  control?: number;
  target?: number;
  stage: ProtocolStage;
  description: string;
  matrixLatex?: string;
  affectedQubitLabel: string;
}

export interface SimulationSnapshot {
  stepIndex: number;
  stage: ProtocolStage;
  title: string;
  description: string;
  narration: string;
  mathLatex: string;
  stateVector: [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber];
  probabilities: Record<BasisState, number>;
  activeGateId?: string;
  particlePosition?: 'alice' | 'in_transit' | 'bob';
  concurrence?: number;
  entropy?: number;
}

export interface SimulationRequest {
  protocol: 'superdense-coding';
  message: Message;
  mode?: ExperimentMode;
  shots?: number;
  seed?: number;
  noiseRate?: number;
}

export interface MeasurementSample {
  counts: Record<BasisState, number>;
  shots: number;
  seed: number;
  probabilities: Record<BasisState, number>;
}

export interface SimulationResult {
  protocol: 'superdense-coding';
  message: Message;
  mode: ExperimentMode;
  decodedMessage: Message | 'ambiguous';
  success: boolean;
  qubitOrdering: '|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)';
  gates: GateOperation[];
  snapshots: SimulationSnapshot[];
  finalAmplitudes: [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber];
  finalProbabilities: Record<BasisState, number>;
  theoreticalProbabilities: Record<BasisState, number>;
  entanglementMetric: EntanglementMetric;
  measurement: MeasurementSample;
  noiseRate?: number;
  warnings: string[];
}

export interface ComparisonSimulationResult {
  message: Message;
  entangled: SimulationResult;
  unentangled: SimulationResult;
  comparison: {
    entangledDecoded: Message;
    unentangledDecoded: Message | 'ambiguous';
    entangledSuccess: boolean;
    unentangledSuccess: boolean;
    theoreticalFidelityEntangled: number;
    theoreticalFidelityUnentangled: number;
    holevoLimitExplanation: string;
  };
}

export interface ProtocolMetadata {
  protocol: 'superdense-coding';
  title: string;
  summary: string;
  basisOrdering: string;
  aliceEncodingMap: Record<Message, { gates: GateType[]; label: string; math: string }>;
  idealEndStateProbability: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
