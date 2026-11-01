'use client';

import React from 'react';
import { SimulationSnapshot } from '@quantum/contracts';
import { MathFormula } from '../lib/katex';
import { Check } from 'lucide-react';

interface TimelineProps {
  snapshots: SimulationSnapshot[];
  currentStep: number;
  onSelectStep: (step: number) => void;
  learnMode?: boolean;
}

const STEP_LABELS = [
  '0. Ground',
  '1. Superposition',
  '2. Bell Pair',
  '3. Alice Encode',
  '4. Transmit',
  '5. Disentangle',
  '6. Basis Rotate',
  '7. Measure'
];

export function Timeline({
  snapshots,
  currentStep,
  onSelectStep,
  learnMode = false
}: TimelineProps) {
  const activeSnap = snapshots[currentStep] || snapshots[0];

  return (
    <div className="space-y-3 rounded-2xl bg-zinc-900/60 p-4 border border-white/10 dark:bg-zinc-900/60 light:bg-white transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Protocol Stage Progression
        </span>
        <span className="text-xs font-mono text-cyan-400 font-semibold">
          Step {currentStep} of {snapshots.length > 0 ? snapshots.length - 1 : 7}
        </span>
      </div>

      {/* Stepper bar */}
      <div
        className="flex items-center justify-between gap-1 overflow-x-auto pb-1"
        role="navigation"
        aria-label="Protocol timeline steps"
      >
        {STEP_LABELS.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectStep(idx)}
              aria-current={isActive ? 'step' : undefined}
              className={`flex-1 min-w-[70px] flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all select-none ${
                isActive
                  ? 'bg-cyan-500/15 border border-cyan-500/40 shadow-sm shadow-cyan-500/10 scale-105'
                  : isCompleted
                  ? 'bg-zinc-800/40 hover:bg-zinc-800/80 border border-white/5 text-zinc-300'
                  : 'bg-zinc-950/40 text-zinc-400 border border-transparent hover:border-white/5'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                    : isCompleted
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : idx}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight truncate w-full ${
                  isActive ? 'text-cyan-300 font-semibold' : 'text-zinc-400'
                }`}
              >
                {label.split('. ')[1]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active step narration & LaTeX formula box */}
      {activeSnap && (
        <div
          className="rounded-xl bg-zinc-950/80 p-3.5 border border-white/10 space-y-2"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {activeSnap.title}
            </h4>
            <span className="text-[11px] font-mono text-zinc-400 uppercase">
              {activeSnap.stage.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {activeSnap.narration}
          </p>

          {/* KaTeX math transformation */}
          {activeSnap.mathLatex && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-center overflow-x-auto text-cyan-300 py-1 text-sm">
              <MathFormula math={activeSnap.mathLatex} block />
            </div>
          )}

          {learnMode && (
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 mt-2">
              <strong>Educational Note:</strong>{' '}
              {activeSnap.stage === 'initial' &&
                'Both qubits are in pure state |0⟩. No entanglement or correlation exists yet.'}
              {activeSnap.stage === 'bell_prep_h' &&
                'Hadamard puts qubit 0 into equal superposition: (|0⟩+|1⟩)/√2. System is in product state.'}
              {activeSnap.stage === 'bell_prep_cnot' &&
                'CNOT entangles the two qubits. Now neither qubit has a definite state on its own; only the joint pair does.'}
              {activeSnap.stage === 'alice_encode' &&
                'Alice only touches her own qubit q0. Notice how this local operation rotates between the four orthogonal Bell states!'}
              {activeSnap.stage === 'transmit' &&
                'Alice sends only ONE qubit across space. No classical data was sent over a classical wire.'}
              {activeSnap.stage === 'bob_decode_cnot' &&
                'Bob uses CNOT to invert entanglement. Target qubit q1 immediately decouples from superposition!'}
              {activeSnap.stage === 'bob_decode_h' &&
                'Hadamard on q0 rotates the superposition back to computational basis vectors with constructive interference.'}
              {activeSnap.stage === 'measurement' &&
                'Projective measurement yields Alice’s exact 2-bit message with 100% theoretical fidelity!'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
