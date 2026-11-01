'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface TourModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TourModal({ isOpen: controlledIsOpen, onClose }: TourModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setInternalIsOpen(controlledIsOpen);
    } else {
      const seen = localStorage.getItem('tour_seen');
      if (!seen) {
        setInternalIsOpen(true);
      }
    }
  }, [controlledIsOpen]);

  const handleDismiss = () => {
    localStorage.setItem('tour_seen', 'true');
    setInternalIsOpen(false);
    onClose?.();
  };

  const steps = [
    {
      title: 'Welcome to Quantum Superdense Coding',
      desc: 'This interactive simulator demonstrates how two classical bits can be transmitted using only a single physical qubit, powered by pre-shared entanglement.',
      tip: 'The simulation runs on a mathematically rigorous state-vector engine.'
    },
    {
      title: '1. Select Alice’s Classical Message',
      desc: 'Pick between "00", "01", "10", or "11". Alice encodes this message onto her single qubit using local Pauli unitary operations (I, X, Z, or XZ).',
      tip: 'Notice how her operations rotate between the 4 orthogonal Bell states.'
    },
    {
      title: '2. Run & Follow Step-by-Step',
      desc: 'Click "Run Protocol" or use the stepper controls to watch superposition, entanglement, transmission, disentanglement, and measurement unfold.',
      tip: 'Click any gate in the circuit to inspect its 2×2 unitary matrix.'
    },
    {
      title: '3. Inspect Probabilities & Phasors',
      desc: 'Review complex amplitudes [α, β, γ, δ], phase angles on circular dials, and Monte-Carlo measurement histograms from seeded sampling.',
      tip: 'Press Space to play/pause, or ⌘K to open the command palette.'
    }
  ];

  if (!internalIsOpen) return null;

  const current = steps[currentStep];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0B0E14] border border-cyan-500/30 p-6 shadow-2xl relative space-y-4">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-white/10"
          aria-label="Close walkthrough"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Interactive Guided Tour ({currentStep + 1} of {steps.length})</span>
        </div>

        <h3 id="tour-title" className="text-lg font-bold text-white">
          {current.title}
        </h3>

        <p className="text-xs text-zinc-300 leading-relaxed">
          {current.desc}
        </p>

        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
          <strong>Tip:</strong> {current.tip}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white"
              >
                Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-black"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-black"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
