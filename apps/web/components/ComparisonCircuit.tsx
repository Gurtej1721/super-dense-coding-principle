'use client';

import React from 'react';
import { ExperimentMode, GateOperation, Message, SimulationSnapshot } from '@quantum/contracts';
import { HelpCircle } from 'lucide-react';

interface ComparisonCircuitProps {
  mode: ExperimentMode;
  message: Message;
  currentStep: number;
  snapshots: SimulationSnapshot[];
  onSelectGate?: (gate: GateOperation, beforeSnap?: SimulationSnapshot, afterSnap?: SimulationSnapshot) => void;
}

export function ComparisonCircuit({
  mode,
  message,
  currentStep,
  snapshots,
  onSelectGate
}: ComparisonCircuitProps) {
  const isEntangled = mode === 'with_entanglement';

  // Wires coordinates
  const wireY0 = 65; // q0 wire (Alice)
  const wireY1 = 145; // q1 wire (Bob)

  // Step active booleans
  const isH0Active = currentStep === 1;
  const isCnotPrepActive = currentStep === 2;
  const isEncodeActive = currentStep === 3;
  const isTransmitActive = currentStep === 4;
  const isBobCnotActive = currentStep === 5;
  const isBobHActive = currentStep === 6;
  const isMeasureActive = currentStep === 7;

  // Gate definitions for inspections
  const gateH0: GateOperation = {
    id: 'gate-bell-h0',
    gate: 'H',
    name: 'Hadamard (q0)',
    qubits: [0],
    stage: 'bell_prep_h',
    description: "Applies Hadamard on Alice's qubit q0 to generate superposition (|0⟩+|1⟩)/√2.",
    matrixLatex: '\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}',
    affectedQubitLabel: 'q0 (Alice)'
  };

  const gateCnotPrep: GateOperation = {
    id: 'gate-bell-cnot',
    gate: 'CNOT',
    name: 'CNOT (q0 -> q1)',
    qubits: [0, 1],
    control: 0,
    target: 1,
    stage: 'bell_prep_cnot',
    description: 'Entangles q0 and q1 into maximally entangled Bell pair |Φ+⟩.',
    matrixLatex: '\\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&0&1\\\\0&0&1&0\\end{pmatrix}',
    affectedQubitLabel: 'q0 (control), q1 (target)'
  };

  const gateEncodeX: GateOperation = {
    id: 'gate-encode-x',
    gate: 'X',
    name: 'Pauli-X (q0)',
    qubits: [0],
    stage: 'alice_encode',
    description: 'Alice applies Pauli-X bit flip to encode classical bit 1.',
    matrixLatex: '\\begin{pmatrix}0 & 1\\\\ 1 & 0\\end{pmatrix}',
    affectedQubitLabel: 'q0 (Alice)'
  };

  const gateEncodeZ: GateOperation = {
    id: 'gate-encode-z',
    gate: 'Z',
    name: 'Pauli-Z (q0)',
    qubits: [0],
    stage: 'alice_encode',
    description: 'Alice applies Pauli-Z phase flip to encode classical bit 1.',
    matrixLatex: '\\begin{pmatrix}1 & 0\\\\ 0 & -1\\end{pmatrix}',
    affectedQubitLabel: 'q0 (Alice)'
  };

  const gateBobCnot: GateOperation = {
    id: 'gate-bob-cnot',
    gate: 'CNOT',
    name: 'CNOT Decode (q0 -> q1)',
    qubits: [0, 1],
    control: 0,
    target: 1,
    stage: 'bob_decode_cnot',
    description: isEntangled
      ? 'Bob applies CNOT to disentangle the received Bell state.'
      : 'Bob applies standard superdense decoding CNOT to unentangled input.',
    matrixLatex: '\\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&0&1\\\\0&0&1&0\\end{pmatrix}',
    affectedQubitLabel: 'q0 (control), q1 (target)'
  };

  const gateBobH: GateOperation = {
    id: 'gate-bob-h',
    gate: 'H',
    name: 'Hadamard Decode (q0)',
    qubits: [0],
    stage: 'bob_decode_h',
    description: 'Bob applies Hadamard to bring q0 into the computational basis.',
    matrixLatex: '\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}',
    affectedQubitLabel: 'q0 (Bob)'
  };

  const handleGateClick = (gate: GateOperation, stepIdx: number) => {
    if (!onSelectGate) return;
    const beforeSnap = snapshots[Math.max(0, stepIdx - 1)];
    const afterSnap = snapshots[stepIdx];
    onSelectGate(gate, beforeSnap, afterSnap);
  };

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={`${isEntangled ? 'Entangled' : 'Unentangled'} quantum circuit diagram canvas`}
      className="relative w-full overflow-x-auto rounded-xl bg-zinc-950/90 border border-white/10 p-2 sm:p-3 focus:outline-none focus:ring-1 focus:ring-white/20"
    >
      <svg
        viewBox="0 0 760 210"
        className="w-full min-w-[620px] h-auto select-none"
        aria-label={`Quantum circuit diagram for ${isEntangled ? 'entangled' : 'unentangled'} superdense coding`}
      >
        {/* Territory Backgrounds */}
        {/* Alice Lab */}
        <rect
          x="90"
          y="15"
          width="310"
          height="180"
          rx="10"
          fill="rgba(244, 63, 94, 0.04)"
          stroke="rgba(244, 63, 94, 0.18)"
          strokeDasharray="4 4"
        />
        <text x="100" y="32" fill="#FB7185" fontSize="10" fontWeight="700" fontFamily="monospace">
          ALICE&apos;S DOMAIN
        </text>

        {/* Bob Lab */}
        <rect
          x="520"
          y="15"
          width="230"
          height="180"
          rx="10"
          fill="rgba(56, 189, 248, 0.04)"
          stroke="rgba(56, 189, 248, 0.18)"
          strokeDasharray="4 4"
        />
        <text x="530" y="32" fill="#38BDF8" fontSize="10" fontWeight="700" fontFamily="monospace">
          BOB&apos;S DOMAIN
        </text>

        {/* Quantum Channel Transmission Band */}
        <rect
          x="410"
          y="45"
          width="100"
          height="40"
          rx="6"
          fill={isTransmitActive ? 'rgba(34, 211, 238, 0.25)' : 'rgba(255, 255, 255, 0.03)'}
          stroke={isTransmitActive ? '#22D3EE' : 'rgba(255, 255, 255, 0.15)'}
          strokeDasharray={isTransmitActive ? undefined : '2 2'}
        />
        <text
          x="420"
          y="69"
          fill={isTransmitActive ? '#22D3EE' : '#94A3B8'}
          fontSize="9"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {isTransmitActive ? '▶ TRANSMITTING ▶' : 'QUANTUM CHANNEL'}
        </text>

        {/* Wire Initial Labels */}
        <text x="15" y={wireY0 + 5} fill="#FB7185" fontSize="12" fontWeight="bold" fontFamily="monospace">
          |0⟩ q0
        </text>
        <text x="15" y={wireY1 + 5} fill="#38BDF8" fontSize="12" fontWeight="bold" fontFamily="monospace">
          |0⟩ q1
        </text>

        {/* Continuous Horizontal Wires */}
        {/* Wire 0 (q0) */}
        <line
          x1="65"
          y1={wireY0}
          x2="695"
          y2={wireY0}
          stroke="#F43F5E"
          strokeWidth="2"
          strokeOpacity="0.75"
        />
        {/* Wire 1 (q1) */}
        <line
          x1="65"
          y1={wireY1}
          x2="695"
          y2={wireY1}
          stroke="#0284C7"
          strokeWidth="2"
          strokeOpacity="0.75"
        />

        {/* Particle in transit during Step 4 */}
        {isTransmitActive && (
          <g className="transition-all duration-300">
            <circle cx="460" cy={wireY0} r="8" fill="#22D3EE" className="animate-ping opacity-75" />
            <circle cx="460" cy={wireY0} r="6" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}

        {/* ENTANGLEMENT PREPARATION STAGE (Steps 1 & 2) */}
        {isEntangled ? (
          <>
            {/* GATE 1: Hadamard on q0 (X = 130) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Hadamard gate on q0 (Step 1)"
              className="cursor-pointer group"
              onClick={() => handleGateClick(gateH0, 1)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateH0, 1); }}
            >
              <rect
                x="112"
                y={wireY0 - 18}
                width="36"
                height="36"
                rx="6"
                fill={isH0Active ? '#22D3EE' : '#1E293B'}
                stroke={isH0Active ? '#FFFFFF' : '#38BDF8'}
                strokeWidth={isH0Active ? '2.5' : '1.5'}
                className="transition-all group-hover:scale-105"
              />
              <text
                x="130"
                y={wireY0 + 6}
                textAnchor="middle"
                fill={isH0Active ? '#000000' : '#F8FAFC'}
                fontSize="14"
                fontWeight="bold"
                fontFamily="monospace"
              >
                H
              </text>
            </g>

            {/* GATE 2: Bell Prep CNOT (q0 -> q1) (X = 205) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="CNOT Entanglement Gate (Step 2)"
              className="cursor-pointer group"
              onClick={() => handleGateClick(gateCnotPrep, 2)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateCnotPrep, 2); }}
            >
              {/* Connecting line */}
              <line
                x1="205"
                y1={wireY0}
                x2="205"
                y2={wireY1}
                stroke={isCnotPrepActive ? '#22D3EE' : '#818CF8'}
                strokeWidth={isCnotPrepActive ? '3' : '2'}
              />
              {/* Control Dot on q0 */}
              <circle
                cx="205"
                cy={wireY0}
                r="6"
                fill={isCnotPrepActive ? '#22D3EE' : '#818CF8'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              {/* Target Symbol on q1 */}
              <circle
                cx="205"
                cy={wireY1}
                r="14"
                fill={isCnotPrepActive ? '#22D3EE' : '#1E293B'}
                stroke={isCnotPrepActive ? '#FFFFFF' : '#818CF8'}
                strokeWidth={isCnotPrepActive ? '2.5' : '2'}
              />
              <line
                x1="195"
                y1={wireY1}
                x2="215"
                y2={wireY1}
                stroke={isCnotPrepActive ? '#000000' : '#FFFFFF'}
                strokeWidth="2"
              />
              <line
                x1="205"
                y1={wireY1 - 10}
                x2="205"
                y2={wireY1 + 10}
                stroke={isCnotPrepActive ? '#000000' : '#FFFFFF'}
                strokeWidth="2"
              />
            </g>
          </>
        ) : (
          /* Unentangled Mode: Clear visual indicator that Bell prep is bypassed */
          <g>
            <rect
              x="110"
              y="40"
              width="130"
              height="130"
              rx="8"
              fill="rgba(245, 158, 11, 0.04)"
              stroke="rgba(245, 158, 11, 0.35)"
              strokeDasharray="4 4"
            />
            <text
              x="175"
              y="100"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
            >
              NO ENTANGLEMENT
            </text>
            <text
              x="175"
              y="118"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="9"
              fontFamily="monospace"
            >
              (Separable |00⟩)
            </text>
          </g>
        )}

        {/* ALICE ENCODING GATE(S) (Step 3: X = 300 to 360) */}
        {message === '00' && (
          <g
            role="button"
            tabIndex={0}
            aria-label="Alice Identity Gate (Step 3)"
            className="cursor-pointer group"
          >
            <rect
              x="310"
              y={wireY0 - 18}
              width="36"
              height="36"
              rx="6"
              fill={isEncodeActive ? '#F43F5E' : '#1E293B'}
              stroke={isEncodeActive ? '#FFFFFF' : '#FB7185'}
              strokeWidth={isEncodeActive ? '2.5' : '1.5'}
            />
            <text
              x="328"
              y={wireY0 + 6}
              textAnchor="middle"
              fill={isEncodeActive ? '#FFFFFF' : '#CBD5E1'}
              fontSize="14"
              fontWeight="bold"
              fontFamily="monospace"
            >
              I
            </text>
          </g>
        )}

        {message === '01' && (
          <g
            role="button"
            tabIndex={0}
            aria-label="Alice Pauli-X Gate (Step 3)"
            className="cursor-pointer group"
            onClick={() => handleGateClick(gateEncodeX, 3)}
          >
            <rect
              x="310"
              y={wireY0 - 18}
              width="36"
              height="36"
              rx="6"
              fill={isEncodeActive ? '#F43F5E' : '#1E293B'}
              stroke={isEncodeActive ? '#FFFFFF' : '#FB7185'}
              strokeWidth={isEncodeActive ? '2.5' : '1.5'}
            />
            <text
              x="328"
              y={wireY0 + 6}
              textAnchor="middle"
              fill={isEncodeActive ? '#FFFFFF' : '#CBD5E1'}
              fontSize="14"
              fontWeight="bold"
              fontFamily="monospace"
            >
              X
            </text>
          </g>
        )}

        {message === '10' && (
          <g
            role="button"
            tabIndex={0}
            aria-label="Alice Pauli-Z Gate (Step 3)"
            className="cursor-pointer group"
            onClick={() => handleGateClick(gateEncodeZ, 3)}
          >
            <rect
              x="310"
              y={wireY0 - 18}
              width="36"
              height="36"
              rx="6"
              fill={isEncodeActive ? '#A855F7' : '#1E293B'}
              stroke={isEncodeActive ? '#FFFFFF' : '#C084FC'}
              strokeWidth={isEncodeActive ? '2.5' : '1.5'}
            />
            <text
              x="328"
              y={wireY0 + 6}
              textAnchor="middle"
              fill={isEncodeActive ? '#FFFFFF' : '#CBD5E1'}
              fontSize="14"
              fontWeight="bold"
              fontFamily="monospace"
            >
              Z
            </text>
          </g>
        )}

        {message === '11' && (
          /* XZ encoding: X applied first (left), Z applied second (right) */
          <g className="cursor-pointer group">
            {/* Gate X (first) */}
            <rect
              x="290"
              y={wireY0 - 18}
              width="34"
              height="36"
              rx="6"
              fill={isEncodeActive ? '#F43F5E' : '#1E293B'}
              stroke={isEncodeActive ? '#FFFFFF' : '#FB7185'}
              strokeWidth={isEncodeActive ? '2.5' : '1.5'}
            />
            <text
              x="307"
              y={wireY0 + 6}
              textAnchor="middle"
              fill={isEncodeActive ? '#FFFFFF' : '#CBD5E1'}
              fontSize="13"
              fontWeight="bold"
              fontFamily="monospace"
            >
              X
            </text>

            {/* Gate Z (second) */}
            <rect
              x="332"
              y={wireY0 - 18}
              width="34"
              height="36"
              rx="6"
              fill={isEncodeActive ? '#A855F7' : '#1E293B'}
              stroke={isEncodeActive ? '#FFFFFF' : '#C084FC'}
              strokeWidth={isEncodeActive ? '2.5' : '1.5'}
            />
            <text
              x="349"
              y={wireY0 + 6}
              textAnchor="middle"
              fill={isEncodeActive ? '#FFFFFF' : '#CBD5E1'}
              fontSize="13"
              fontWeight="bold"
              fontFamily="monospace"
            >
              Z
            </text>
          </g>
        )}

        {/* BOB DECODING STAGE (Steps 5 & 6) */}
        {/* GATE 5: Bob CNOT decode (q0 -> q1) (X = 560) */}
        <g
          role="button"
          tabIndex={0}
          aria-label="Bob Decoding CNOT (Step 5)"
          className="cursor-pointer group"
          onClick={() => handleGateClick(gateBobCnot, 5)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateBobCnot, 5); }}
        >
          {/* Vertical connecting line */}
          <line
            x1="560"
            y1={wireY0}
            x2="560"
            y2={wireY1}
            stroke={isBobCnotActive ? '#22D3EE' : '#38BDF8'}
            strokeWidth={isBobCnotActive ? '3' : '2'}
          />
          {/* Control Dot on q0 */}
          <circle
            cx="560"
            cy={wireY0}
            r="6"
            fill={isBobCnotActive ? '#22D3EE' : '#38BDF8'}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {/* Target Symbol on q1 */}
          <circle
            cx="560"
            cy={wireY1}
            r="14"
            fill={isBobCnotActive ? '#22D3EE' : '#1E293B'}
            stroke={isBobCnotActive ? '#FFFFFF' : '#38BDF8'}
            strokeWidth={isBobCnotActive ? '2.5' : '2'}
          />
          <line
            x1="550"
            y1={wireY1}
            x2="570"
            y2={wireY1}
            stroke={isBobCnotActive ? '#000000' : '#FFFFFF'}
            strokeWidth="2"
          />
          <line
            x1="560"
            y1={wireY1 - 10}
            x2="560"
            y2={wireY1 + 10}
            stroke={isBobCnotActive ? '#000000' : '#FFFFFF'}
            strokeWidth="2"
          />
        </g>

        {/* GATE 6: Bob Hadamard on q0 (X = 635) */}
        <g
          role="button"
          tabIndex={0}
          aria-label="Bob Decoding Hadamard (Step 6)"
          className="cursor-pointer group"
          onClick={() => handleGateClick(gateBobH, 6)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateBobH, 6); }}
        >
          <rect
            x="617"
            y={wireY0 - 18}
            width="36"
            height="36"
            rx="6"
            fill={isBobHActive ? '#22D3EE' : '#1E293B'}
            stroke={isBobHActive ? '#FFFFFF' : '#38BDF8'}
            strokeWidth={isBobHActive ? '2.5' : '1.5'}
          />
          <text
            x="635"
            y={wireY0 + 6}
            textAnchor="middle"
            fill={isBobHActive ? '#000000' : '#F8FAFC'}
            fontSize="14"
            fontWeight="bold"
            fontFamily="monospace"
          >
            H
          </text>
        </g>

        {/* MEASUREMENT METERS ON BOTH QUBITS (Step 7: X = 710) */}
        {/* Meter on q0 */}
        <g
          role="button"
          tabIndex={0}
          aria-label="Measurement on q0 (Step 7)"
          className="cursor-pointer"
        >
          <rect
            x="695"
            y={wireY0 - 18}
            width="36"
            height="36"
            rx="6"
            fill={isMeasureActive ? '#10B981' : '#1E293B'}
            stroke={isMeasureActive ? '#FFFFFF' : '#34D399'}
            strokeWidth={isMeasureActive ? '2.5' : '1.5'}
          />
          {/* Arc symbol */}
          <path
            d={`M 703 ${wireY0 + 10} A 10 10 0 0 1 723 ${wireY0 + 10}`}
            fill="none"
            stroke={isMeasureActive ? '#000000' : '#34D399'}
            strokeWidth="1.5"
          />
          {/* Needle */}
          <line
            x1="713"
            y1={wireY0 + 10}
            x2="719"
            y2={wireY0 - 4}
            stroke={isMeasureActive ? '#000000' : '#34D399'}
            strokeWidth="2"
          />
        </g>

        {/* Meter on q1 */}
        <g
          role="button"
          tabIndex={0}
          aria-label="Measurement on q1 (Step 7)"
          className="cursor-pointer"
        >
          <rect
            x="695"
            y={wireY1 - 18}
            width="36"
            height="36"
            rx="6"
            fill={isMeasureActive ? '#10B981' : '#1E293B'}
            stroke={isMeasureActive ? '#FFFFFF' : '#34D399'}
            strokeWidth={isMeasureActive ? '2.5' : '1.5'}
          />
          <path
            d={`M 703 ${wireY1 + 10} A 10 10 0 0 1 723 ${wireY1 + 10}`}
            fill="none"
            stroke={isMeasureActive ? '#000000' : '#34D399'}
            strokeWidth="1.5"
          />
          <line
            x1="713"
            y1={wireY1 + 10}
            x2="719"
            y2={wireY1 - 4}
            stroke={isMeasureActive ? '#000000' : '#34D399'}
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}
