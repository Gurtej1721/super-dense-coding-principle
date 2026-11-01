'use client';

import React from 'react';
import { MeasurementSample, BasisState } from '@quantum/contracts';
import { Target, Dices } from 'lucide-react';

interface ShotHistogramProps {
  measurement: MeasurementSample;
  targetMessage: string;
  onRerollSeed?: () => void;
}

const BASIS: BasisState[] = ['00', '01', '10', '11'];

export function ShotHistogram({
  measurement,
  targetMessage,
  onRerollSeed
}: ShotHistogramProps) {
  const { counts, shots, seed } = measurement;

  if (shots <= 0) {
    return (
      <div className="rounded-2xl bg-zinc-900/60 p-4 border border-white/10 text-center text-xs text-zinc-400">
        Shots set to 0. Enable measurement shots in controls to generate Monte-Carlo sample counts.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-zinc-900/60 p-4 border border-white/10 dark:bg-zinc-900/60 light:bg-white transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Sampled Shot Counts ({shots.toLocaleString()} shots)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-white/10 text-[11px] font-mono text-zinc-400">
            <span>Seed:</span>
            <span className="text-cyan-400 font-bold">{seed}</span>
          </div>

          {onRerollSeed && (
            <button
              type="button"
              onClick={onRerollSeed}
              className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Reroll Seed"
            >
              <Dices className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Stacked / Grouped Bars */}
      <div className="space-y-2">
        {BASIS.map((b) => {
          const cnt = counts[b] || 0;
          const pct = shots > 0 ? (cnt / shots) * 100 : 0;
          const isTarget = b === targetMessage;

          return (
            <div key={b} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={`font-bold ${isTarget ? 'text-rose-400' : 'text-zinc-300'}`}>
                  |{b}⟩
                </span>
                <span className="text-zinc-400">
                  {cnt.toLocaleString()} counts ({pct.toFixed(1)}%)
                </span>
              </div>

              <div className="relative h-4 w-full rounded-md bg-zinc-950 border border-white/5 overflow-hidden">
                {/* Expected reference marker */}
                {isTarget && (
                  <div
                    className="absolute top-0 bottom-0 right-0 w-0.5 bg-rose-500 z-10"
                    title="Expected target 100%"
                  />
                )}

                <div
                  className={`h-full transition-all duration-300 ${
                    isTarget
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-zinc-700'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
