'use client';

import React from 'react';
import { BasisState } from '@quantum/contracts';
import { BarChart3 } from 'lucide-react';

interface ProbabilityBarsProps {
  probabilities: Record<BasisState, number>;
  targetMessage: string;
}

const BASIS: BasisState[] = ['00', '01', '10', '11'];

export function ProbabilityBars({
  probabilities,
  targetMessage
}: ProbabilityBarsProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-zinc-900/60 p-4 border border-white/10 dark:bg-zinc-900/60 light:bg-white transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Computational Basis Probabilities
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Target: <strong className="text-rose-400 font-bold">{targetMessage}</strong>
        </span>
      </div>

      {/* Vertical Bars Container */}
      <div className="flex items-end justify-between gap-4 h-44 pt-6 pb-2 px-4 rounded-xl bg-zinc-950/80 border border-white/5">
        {BASIS.map((b) => {
          const p = probabilities[b] || 0;
          const percent = Math.min(100, Math.max(0, p * 100));
          const isTarget = b === targetMessage;
          const isDominant = p > 0.99;

          return (
            <div key={b} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Percentage label above bar */}
              <div
                className={`text-[11px] font-mono font-semibold mb-1 transition-colors ${
                  isDominant
                    ? 'text-emerald-400 font-bold scale-110'
                    : isTarget
                    ? 'text-cyan-300'
                    : 'text-zinc-400'
                }`}
              >
                {percent.toFixed(1)}%
              </div>

              {/* Bar track */}
              <div className="w-full max-w-[48px] h-32 bg-zinc-900/80 rounded-t-lg relative flex items-end overflow-hidden border border-white/5">
                {/* Expected reference line at 100% */}
                {isTarget && (
                  <div className="absolute top-0 inset-x-0 border-t-2 border-dashed border-rose-500/60 z-10" title="Expected target fidelity: 100%" />
                )}

                {/* Animated fill bar */}
                <div
                  className={`w-full transition-all duration-500 ease-out rounded-t-md ${
                    isDominant
                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/30'
                      : isTarget
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                      : 'bg-zinc-700'
                  }`}
                  style={{ height: `${percent}%` }}
                />
              </div>

              {/* Basis label */}
              <div className="mt-2 text-center">
                <span
                  className={`font-mono text-xs font-bold ${
                    isDominant
                      ? 'text-emerald-400'
                      : isTarget
                      ? 'text-rose-400'
                      : 'text-zinc-400'
                  }`}
                >
                  |{b}⟩
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
