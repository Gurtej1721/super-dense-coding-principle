'use client';

import React, { useState } from 'react';
import { BasisState, ComplexNumber } from '@quantum/contracts';
import { Copy, Check, SlidersHorizontal } from 'lucide-react';

interface StateInspectorProps {
  stateVector: [ComplexNumber, ComplexNumber, ComplexNumber, ComplexNumber];
  probabilities: Record<BasisState, number>;
  activeStep: number;
}

const BASIS: BasisState[] = ['00', '01', '10', '11'];

function formatComplex(c: ComplexNumber): string {
  const r = Math.abs(c.real) < 1e-12 ? 0 : c.real;
  const i = Math.abs(c.imag) < 1e-12 ? 0 : c.imag;

  const rStr = r.toFixed(4);
  if (Math.abs(i) < 1e-6) {
    return rStr;
  }
  const sign = i >= 0 ? '+' : '-';
  return `${rStr} ${sign} ${Math.abs(i).toFixed(4)}i`;
}

function computeMagnitude(c: ComplexNumber): number {
  return Math.sqrt(c.real * c.real + c.imag * c.imag);
}

function computePhase(c: ComplexNumber): number {
  if (c.real * c.real + c.imag * c.imag < 1e-14) return 0;
  return Math.atan2(c.imag, c.real); // -PI to PI
}

export function StateInspector({
  stateVector,
  probabilities,
  activeStep
}: StateInspectorProps) {
  const [viewMode, setViewMode] = useState<'amplitudes' | 'probabilities'>('amplitudes');
  const [copied, setCopied] = useState(false);

  const handleCopyJson = async () => {
    const payload = {
      activeStep,
      basisStates: BASIS.map((b, idx) => ({
        basis: b,
        amplitude: stateVector[idx],
        probability: probabilities[b],
        magnitude: computeMagnitude(stateVector[idx]),
        phaseRadians: computePhase(stateVector[idx])
      }))
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 rounded-2xl bg-zinc-900/60 p-4 border border-white/10 dark:bg-zinc-900/60 light:bg-white transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            State Inspector & Phasors
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-white/10 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('amplitudes')}
              className={`px-2 py-0.5 rounded transition-all ${
                viewMode === 'amplitudes'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Amplitudes
            </button>
            <button
              type="button"
              onClick={() => setViewMode('probabilities')}
              className={`px-2 py-0.5 rounded transition-all ${
                viewMode === 'probabilities'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Probabilities
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs border border-white/10 transition-all"
            title="Copy state JSON to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-zinc-400" />
                <span className="text-[11px]">JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Basis States Rows */}
      <div className="space-y-2.5">
        {BASIS.map((basis, idx) => {
          const amp = stateVector[idx];
          const prob = probabilities[basis];
          const mag = computeMagnitude(amp);
          const phase = computePhase(amp); // in radians
          const isDominant = prob > 0.99;

          // Phasor needle calculations: circle radius = 16, center = (18, 18)
          const needleLen = Math.max(2, mag * 14);
          const nx = 18 + needleLen * Math.cos(phase);
          const ny = 18 - needleLen * Math.sin(phase);

          return (
            <div
              key={basis}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isDominant
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-950/60 border-white/5 hover:border-white/15'
              }`}
            >
              {/* Basis label */}
              <div className="flex items-center gap-3 w-28">
                <span
                  className={`font-mono text-sm font-bold ${
                    isDominant ? 'text-emerald-400' : 'text-zinc-300'
                  }`}
                >
                  |{basis}⟩
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  q₀={basis[0]} q₁={basis[1]}
                </span>
              </div>

              {/* Phasor Dial Indicator */}
              <div className="flex items-center gap-2 w-24" title={`Phase: ${(phase * (180 / Math.PI)).toFixed(1)}°`}>
                <svg width="36" height="36" className="shrink-0">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                  <circle cx="18" cy="18" r="2" fill="#71717A" />
                  {/* Phase Needle */}
                  <line
                    x1="18"
                    y1="18"
                    x2={nx}
                    y2={ny}
                    stroke={isDominant ? '#10B981' : mag > 0.01 ? '#22D3EE' : '#52525B'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="text-[10px] font-mono text-zinc-400 leading-tight">
                  <div>{(phase * (180 / Math.PI)).toFixed(0)}°</div>
                  <div className="text-[9px] text-zinc-400">|ψ|={mag.toFixed(3)}</div>
                </div>
              </div>

              {/* Value & Bar */}
              <div className="flex-1 max-w-xs pl-2">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-300 truncate">
                    {viewMode === 'amplitudes' ? formatComplex(amp) : `${(prob * 100).toFixed(1)}%`}
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    {viewMode === 'amplitudes' ? `|α|²=${prob.toFixed(4)}` : `P=${prob.toFixed(4)}`}
                  </span>
                </div>

                {/* Magnitude / Probability bar */}
                <div className="h-2 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isDominant
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, prob * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
