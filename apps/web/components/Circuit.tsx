'use client';

import React, { useState } from 'react';
import { GateOperation, SimulationSnapshot, Message } from '@quantum/contracts';
import { MathFormula } from '../lib/katex';
import { Eye, HelpCircle } from 'lucide-react';

interface CircuitProps {
  message: Message;
  currentStep: number;
  snapshots: SimulationSnapshot[];
  onSelectGate: (gate: GateOperation, beforeSnap?: SimulationSnapshot, afterSnap?: SimulationSnapshot) => void;
}

export function Circuit({
  message,
  currentStep,
  snapshots,
  onSelectGate
}: CircuitProps) {
  const [hoveredGate, setHoveredGate] = useState<GateOperation | null>(null);

  // Wires coordinates
  const wireY0 = 70; // q0 wire (Alice)
  const wireY1 = 150; // q1 wire (Bob)

  // Gate column positions along X axis
  // Total width: 760
  // Column 1: H on q0 (X = 140)
  // Column 2: CNOT prep (X = 220)
  // Column 3: Alice encoding (X = 330)
  // Column 4: Transmission zone (X = 420-500)
  // Column 5: Bob CNOT decode (X = 560)
  // Column 6: Bob H decode (X = 640)
  // Column 7: Measurement meter (X = 710)

  const isH0Active = currentStep === 1;
  const isCnotPrepActive = currentStep === 2;
  const isEncodeActive = currentStep === 3;
  const isTransmitActive = currentStep === 4;
  const isBobCnotActive = currentStep === 5;
  const isBobHActive = currentStep === 6;
  const isMeasureActive = currentStep === 7;

  // Gate objects definition
  const gateH0: GateOperation = {
    id: 'gate-bell-h0',
    gate: 'H',
    name: 'Hadamard (q0)',
    qubits: [0],
    stage: 'bell_prep_h',
    description: "Transforms |0⟩ into equal superposition (|0⟩+|1⟩)/√2.",
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

  const gateEncode: GateOperation = {
    id: 'gate-alice-encode',
    gate: message === '00' ? 'I' : message === '01' ? 'X' : message === '10' ? 'Z' : 'X',
    name: `Alice Encode '${message}'`,
    qubits: [0],
    stage: 'alice_encode',
    description: `Alice encodes "${message}" by applying ${
      message === '00' ? 'Identity (I)' : message === '01' ? 'Pauli-X' : message === '10' ? 'Pauli-Z' : 'Pauli-Z then Pauli-X'
    } to qubit 0.`,
    matrixLatex:
      message === '00'
        ? '\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}'
        : message === '01'
        ? '\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}'
        : message === '10'
        ? '\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}'
        : '\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}',
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
    description: 'Bob applies CNOT to disentangle qubit q1 from the Bell pair.',
    matrixLatex: '\\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&0&1\\\\0&0&1&0\\end{pmatrix}',
    affectedQubitLabel: 'q0 (control), q1 (target)'
  };

  const gateBobH: GateOperation = {
    id: 'gate-bob-h',
    gate: 'H',
    name: 'Hadamard Decode (q0)',
    qubits: [0],
    stage: 'bob_decode_h',
    description: 'Bob rotates q0 superposition into the computational basis |' + message + '⟩.',
    matrixLatex: '\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\ 1 & -1\\end{pmatrix}',
    affectedQubitLabel: 'q0 (Bob)'
  };

  const handleGateClick = (gate: GateOperation, stepIdx: number) => {
    const beforeSnap = snapshots[Math.max(0, stepIdx - 1)];
    const afterSnap = snapshots[stepIdx];
    onSelectGate(gate, beforeSnap, afterSnap);
  };

  return (
    <div className="relative rounded-2xl bg-zinc-900/60 p-4 border border-white/10 dark:bg-zinc-900/60 light:bg-white transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Interactive Quantum Circuit
          </span>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Click any gate to inspect math & matrices
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-zinc-300">q0: Alice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            <span className="text-zinc-300">q1: Bob</span>
          </div>
        </div>
      </div>

      {/* SVG Circuit Canvas */}
      <div className="relative w-full overflow-x-auto rounded-xl bg-zinc-950/80 border border-white/5 p-2">
        <svg
          viewBox="0 0 760 210"
          className="w-full min-w-[680px] h-auto select-none"
          aria-label="Quantum circuit diagram for superdense coding"
        >
          {/* Territory Backgrounds: Alice (left) & Bob (right) */}
          <rect x="100" y="20" width="310" height="170" rx="12" fill="rgba(244, 63, 94, 0.04)" stroke="rgba(244, 63, 94, 0.15)" strokeDasharray="4 4" />
          <text x="110" y="38" fill="#F43F5E" fontSize="11" fontWeight="600" fontFamily="monospace">
            Alice&apos;s Lab
          </text>

          <rect x="520" y="20" width="225" height="170" rx="12" fill="rgba(56, 189, 248, 0.04)" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="4 4" />
          <text x="530" y="38" fill="#38BDF8" fontSize="11" fontWeight="600" fontFamily="monospace">
            Bob&apos;s Lab
          </text>

          {/* Quantum Channel Transmission Band */}
          <rect x="420" y="50" width="90" height="40" rx="6" fill={isTransmitActive ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.02)'} stroke={isTransmitActive ? '#22D3EE' : 'rgba(255, 255, 255, 0.1)'} strokeDasharray={isTransmitActive ? undefined : '2 2'} />
          <text x="430" y="74" fill={isTransmitActive ? '#22D3EE' : '#71717A'} fontSize="9" fontWeight="600" fontFamily="monospace">
            Quantum Channel
          </text>

          {/* Wire Labels */}
          <text x="25" y={wireY0 + 5} fill="#FB7185" fontSize="13" fontWeight="bold" fontFamily="monospace">
            |0⟩ q0
          </text>
          <text x="25" y={wireY1 + 5} fill="#38BDF8" fontSize="13" fontWeight="bold" fontFamily="monospace">
            |0⟩ q1
          </text>

          {/* Horizontal Quantum Wires */}
          {/* Wire q0 */}
          <line
            x1="80"
            y1={wireY0}
            x2="690"
            y2={wireY0}
            stroke="#F43F5E"
            strokeWidth="2"
            strokeOpacity="0.7"
          />
          {/* Wire q1 */}
          <line
            x1="80"
            y1={wireY1}
            x2="690"
            y2={wireY1}
            stroke="#0284C7"
            strokeWidth="2"
            strokeOpacity="0.7"
          />

          {/* Animate transmitting qubit particle during step 4 */}
          {isTransmitActive && (
            <g className="transition-all duration-500">
              <circle cx="465" cy={wireY0} r="8" fill="#22D3EE" className="animate-ping opacity-75" />
              <circle cx="465" cy={wireY0} r="6" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          )}

          {/* GATE 1: Hadamard on q0 (X = 140) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="H — Hadamard on q0, Step 1"
            className="cursor-pointer group"
            onClick={() => handleGateClick(gateH0, 1)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateH0, 1); }}
            onMouseEnter={() => setHoveredGate(gateH0)}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <rect
              x="122"
              y={wireY0 - 18}
              width="36"
              height="36"
              rx="8"
              fill={isH0Active ? '#22D3EE' : '#1E293B'}
              stroke={isH0Active ? '#FFFFFF' : '#38BDF8'}
              strokeWidth={isH0Active ? '2.5' : '1.5'}
              className="transition-all group-hover:scale-105"
            />
            <text
              x="140"
              y={wireY0 + 6}
              textAnchor="middle"
              fill={isH0Active ? '#000000' : '#FFFFFF'}
              fontSize="14"
              fontWeight="bold"
              fontFamily="monospace"
            >
              H
            </text>
          </g>

          {/* GATE 2: Bell Prep CNOT (q0 control, q1 target) (X = 220) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="CNOT — Bell Preparation, Step 2"
            className="cursor-pointer group"
            onClick={() => handleGateClick(gateCnotPrep, 2)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateCnotPrep, 2); }}
            onMouseEnter={() => setHoveredGate(gateCnotPrep)}
            onMouseLeave={() => setHoveredGate(null)}
          >
            {/* Vertical connector line */}
            <line
              x1="220"
              y1={wireY0}
              x2="220"
              y2={wireY1}
              stroke={isCnotPrepActive ? '#22D3EE' : '#94A3B8'}
              strokeWidth={isCnotPrepActive ? '3' : '2'}
            />
            {/* Control dot on q0 */}
            <circle
              cx="220"
              cy={wireY0}
              r={isCnotPrepActive ? '6' : '5'}
              fill={isCnotPrepActive ? '#22D3EE' : '#F43F5E'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            {/* Target ⊕ on q1 */}
            <circle
              cx="220"
              cy={wireY1}
              r="14"
              fill={isCnotPrepActive ? '#22D3EE' : '#1E293B'}
              stroke={isCnotPrepActive ? '#FFFFFF' : '#38BDF8'}
              strokeWidth="2"
            />
            <line x1="210" y1={wireY1} x2="230" y2={wireY1} stroke={isCnotPrepActive ? '#000000' : '#FFFFFF'} strokeWidth="2" />
            <line x1="220" y1={wireY1 - 10} x2="220" y2={wireY1 + 10} stroke={isCnotPrepActive ? '#000000' : '#FFFFFF'} strokeWidth="2" />
          </g>

            {message === '11' ? (
              // XZ dual gates: separate interactive elements so accessible name matches visible text
              <>
                {/* Z gate first */}
                <g
                  role="button"
                  tabIndex={0}
                  aria-label="Z gate — Alice phase flip on q0, Step 3"
                  className="cursor-pointer group"
                  onClick={() => handleGateClick(gateEncode, 3)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateEncode, 3); }}
                  onMouseEnter={() => setHoveredGate(gateEncode)}
                  onMouseLeave={() => setHoveredGate(null)}
                >
                  <rect
                    x="295"
                    y={wireY0 - 18}
                    width="32"
                    height="36"
                    rx="6"
                    fill={isEncodeActive ? '#FB7185' : '#1E293B'}
                    stroke={isEncodeActive ? '#FFFFFF' : '#F43F5E'}
                    strokeWidth={isEncodeActive ? '2.5' : '1.5'}
                  />
                  <text x="311" y={wireY0 + 6} textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="monospace">
                    Z
                  </text>
                </g>
                {/* Then X gate */}
                <g
                  role="button"
                  tabIndex={0}
                  aria-label="X gate — Alice bit flip on q0, Step 3"
                  className="cursor-pointer group"
                  onClick={() => handleGateClick(gateEncode, 3)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateEncode, 3); }}
                  onMouseEnter={() => setHoveredGate(gateEncode)}
                  onMouseLeave={() => setHoveredGate(null)}
                >
                  <rect
                    x="335"
                    y={wireY0 - 18}
                    width="32"
                    height="36"
                    rx="6"
                    fill={isEncodeActive ? '#F43F5E' : '#1E293B'}
                    stroke={isEncodeActive ? '#FFFFFF' : '#F43F5E'}
                    strokeWidth={isEncodeActive ? '2.5' : '1.5'}
                  />
                  <text x="351" y={wireY0 + 6} textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="monospace">
                    X
                  </text>
                </g>
              </>
            ) : (
              // Single gate I, X, or Z
              <g
                role="button"
                tabIndex={0}
                aria-label={`${message === '00' ? 'I gate' : message === '01' ? 'X gate' : 'Z gate'} — Alice Encode ${message} on q0, Step 3`}
                className="cursor-pointer group"
                onClick={() => handleGateClick(gateEncode, 3)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateEncode, 3); }}
                onMouseEnter={() => setHoveredGate(gateEncode)}
                onMouseLeave={() => setHoveredGate(null)}
              >
                <rect
                  x="312"
                  y={wireY0 - 18}
                  width="36"
                  height="36"
                  rx="8"
                  fill={isEncodeActive ? '#F43F5E' : '#1E293B'}
                  stroke={isEncodeActive ? '#FFFFFF' : '#F43F5E'}
                  strokeWidth={isEncodeActive ? '2.5' : '1.5'}
                  className="transition-all group-hover:scale-105"
                />
                <text
                  x="330"
                  y={wireY0 + 6}
                  textAnchor="middle"
                  fill={isEncodeActive ? '#FFFFFF' : '#F43F5E'}
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {message === '00' ? 'I' : message === '01' ? 'X' : 'Z'}
                </text>
              </g>
            )}

          {/* GATE 5: Bob Decodes CNOT (q0 control, q1 target) (X = 570) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="CNOT — Bob CNOT Decode, Step 5"
            className="cursor-pointer group"
            onClick={() => handleGateClick(gateBobCnot, 5)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateBobCnot, 5); }}
            onMouseEnter={() => setHoveredGate(gateBobCnot)}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <line
              x1="570"
              y1={wireY0}
              x2="570"
              y2={wireY1}
              stroke={isBobCnotActive ? '#22D3EE' : '#94A3B8'}
              strokeWidth={isBobCnotActive ? '3' : '2'}
            />
            <circle
              cx="570"
              cy={wireY0}
              r={isBobCnotActive ? '6' : '5'}
              fill={isBobCnotActive ? '#22D3EE' : '#0284C7'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle
              cx="570"
              cy={wireY1}
              r="14"
              fill={isBobCnotActive ? '#22D3EE' : '#1E293B'}
              stroke={isBobCnotActive ? '#FFFFFF' : '#38BDF8'}
              strokeWidth="2"
            />
            <line x1="560" y1={wireY1} x2="580" y2={wireY1} stroke={isBobCnotActive ? '#000000' : '#FFFFFF'} strokeWidth="2" />
            <line x1="570" y1={wireY1 - 10} x2="570" y2={wireY1 + 10} stroke={isBobCnotActive ? '#000000' : '#FFFFFF'} strokeWidth="2" />
          </g>

          {/* GATE 6: Bob Decodes Hadamard on q0 (X = 645) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="H — Bob Hadamard Decode, Step 6"
            className="cursor-pointer group"
            onClick={() => handleGateClick(gateBobH, 6)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGateClick(gateBobH, 6); }}
            onMouseEnter={() => setHoveredGate(gateBobH)}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <rect
              x="627"
              y={wireY0 - 18}
              width="36"
              height="36"
              rx="8"
              fill={isBobHActive ? '#22D3EE' : '#1E293B'}
              stroke={isBobHActive ? '#FFFFFF' : '#38BDF8'}
              strokeWidth={isBobHActive ? '2.5' : '1.5'}
              className="transition-all group-hover:scale-105"
            />
            <text
              x="645"
              y={wireY0 + 6}
              textAnchor="middle"
              fill={isBobHActive ? '#000000' : '#FFFFFF'}
              fontSize="14"
              fontWeight="bold"
              fontFamily="monospace"
            >
              H
            </text>
          </g>

          {/* MEASUREMENT METERS on both wires (X = 710) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Measurement Meters, Step 7"
            className="cursor-pointer"
            onClick={() => handleGateClick({
              id: 'measurement-meter',
              gate: 'I',
              name: 'Computational Measurement',
              qubits: [0, 1],
              stage: 'measurement',
              description: 'Projective measurement in computational basis {|00⟩, |01⟩, |10⟩, |11⟩}.',
              affectedQubitLabel: 'q0 and q1'
            }, 7)}
          >
            {/* q0 Meter */}
            <rect
              x="690"
              y={wireY0 - 16}
              width="32"
              height="32"
              rx="6"
              fill={isMeasureActive ? '#10B981' : '#1E293B'}
              stroke={isMeasureActive ? '#FFFFFF' : '#10B981'}
              strokeWidth="1.5"
            />
            <path
              d="M 698 80 A 10 10 0 0 1 714 80"
              fill="none"
              stroke={isMeasureActive ? '#000000' : '#10B981'}
              strokeWidth="1.5"
            />
            <line
              x1="706"
              y1="80"
              x2="712"
              y2="68"
              stroke={isMeasureActive ? '#000000' : '#10B981'}
              strokeWidth="1.5"
            />

            {/* q1 Meter */}
            <rect
              x="690"
              y={wireY1 - 16}
              width="32"
              height="32"
              rx="6"
              fill={isMeasureActive ? '#10B981' : '#1E293B'}
              stroke={isMeasureActive ? '#FFFFFF' : '#10B981'}
              strokeWidth="1.5"
            />
            <path
              d="M 698 160 A 10 10 0 0 1 714 160"
              fill="none"
              stroke={isMeasureActive ? '#000000' : '#10B981'}
              strokeWidth="1.5"
            />
            <line
              x1="706"
              y1="160"
              x2="712"
              y2="148"
              stroke={isMeasureActive ? '#000000' : '#10B981'}
              strokeWidth="1.5"
            />
          </g>
        </svg>

        {/* Floating Tooltip when hovering gate */}
        {hoveredGate && (
          <div className="absolute bottom-2 left-4 z-20 rounded-lg bg-zinc-900/95 p-2.5 border border-white/20 shadow-xl max-w-sm pointer-events-none text-xs text-zinc-200">
            <div className="font-semibold text-white flex items-center justify-between gap-2">
              <span>{hoveredGate.name}</span>
              <span className="text-[10px] text-cyan-400 font-mono">{hoveredGate.affectedQubitLabel}</span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-1">{hoveredGate.description}</p>
            {hoveredGate.matrixLatex && (
              <div className="mt-1 pt-1 border-t border-white/10 text-cyan-300 font-mono text-[11px]">
                <MathFormula math={hoveredGate.matrixLatex} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screen Reader Adjacent Textual Fallback */}
      <div className="sr-only" aria-live="polite">
        Current circuit step {currentStep}: {snapshots[currentStep]?.description || 'Circuit initialized'}
      </div>
    </div>
  );
}
