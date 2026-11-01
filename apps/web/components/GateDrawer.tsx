'use client';

import React, { useEffect, useRef } from 'react';
import { GateOperation, SimulationSnapshot } from '@quantum/contracts';
import { MathFormula } from '../lib/katex';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface GateDrawerProps {
  gate: GateOperation | null;
  beforeSnapshot?: SimulationSnapshot;
  afterSnapshot?: SimulationSnapshot;
  onClose: () => void;
}

export function GateDrawer({
  gate,
  beforeSnapshot,
  afterSnapshot,
  onClose
}: GateDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (gate) {
      closeButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [gate, onClose]);

  if (!gate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-drawer-title"
    >
      <div className="w-full max-w-md h-full bg-[#0B0E14] border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-lg">
                {gate.gate}
              </div>
              <div>
                <h3 id="gate-drawer-title" className="text-base font-bold text-white">
                  {gate.name}
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  Target: {gate.affectedQubitLabel}
                </span>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close gate drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Theoretical Explanation
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {gate.description}
            </p>
          </div>

          {/* Unitary Matrix in KaTeX */}
          {gate.matrixLatex && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Unitary Matrix Representation</span>
              </h4>
              <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center text-cyan-300 overflow-x-auto">
                <MathFormula math={`U = ${gate.matrixLatex}`} block />
              </div>
            </div>
          )}

          {/* State Before & After Transformation */}
          {(beforeSnapshot || afterSnapshot) && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                <span>Quantum State Vector Transformation</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Before */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">State Before</div>
                  {beforeSnapshot ? (
                    <div className="space-y-1 font-mono text-[11px]">
                      {['00', '01', '10', '11'].map((b, i) => (
                        <div key={b} className="flex justify-between text-zinc-300">
                          <span>|{b}⟩:</span>
                          <span className="text-zinc-400">
                            {beforeSnapshot.stateVector[i].real.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-zinc-500">Initial state</div>
                  )}
                </div>

                {/* After */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-cyan-500/30 space-y-2">
                  <div className="text-[11px] font-mono text-cyan-400 uppercase">State After</div>
                  {afterSnapshot ? (
                    <div className="space-y-1 font-mono text-[11px]">
                      {['00', '01', '10', '11'].map((b, i) => (
                        <div key={b} className="flex justify-between text-zinc-300">
                          <span>|{b}⟩:</span>
                          <span className="text-cyan-300 font-bold">
                            {afterSnapshot.stateVector[i].real.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-zinc-500">Not reached</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
