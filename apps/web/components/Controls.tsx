'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Dices,
  Loader2,
  Sparkles
} from 'lucide-react';

interface ControlsProps {
  isRunning: boolean;
  onRun: () => void;
  onReset: () => void;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onChangeSpeed: (spd: number) => void;
  shots: number;
  onChangeShots: (shots: number) => void;
  seed: number;
  onRerollSeed: () => void;
  engineSource?: 'backend-api' | 'client-wasm-core';
}

export function Controls({
  isRunning,
  onRun,
  onReset,
  currentStep,
  totalSteps,
  onStepChange,
  isPlaying,
  onTogglePlay,
  speed,
  onChangeSpeed,
  shots,
  onChangeShots,
  seed,
  onRerollSeed,
  engineSource
}: ControlsProps) {
  const [shotsInput, setShotsInput] = useState(shots.toString());
  const [shotsError, setShotsError] = useState<string | null>(null);

  const handleShotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setShotsInput(val);
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 100000) {
      setShotsError('Shots must be an integer between 0 and 100,000');
    } else {
      setShotsError(null);
      onChangeShots(parsed);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-zinc-900/60 p-4 border border-white/10 dark:bg-zinc-900/60 dark:border-white/10 light:bg-white light:border-black/10 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Primary Run & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={isRunning}
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-white font-medium text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label="Run Protocol / Run Simulation — full quantum simulation"
            title="Run Simulation Protocol (R)"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Simulating…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-cyan-200" />
                <span>Run Protocol</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            disabled={isRunning}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-[0.98] text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
            aria-label="Reset experiment state"
            title="Reset to step 0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Center: Stepper & Play/Pause */}
        <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep <= 0 || isRunning}
            type="button"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            aria-label="Step backwards (Left Arrow)"
            title="Previous step (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={isRunning}
            type="button"
            className={`p-2 rounded-lg text-white transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'hover:bg-white/10 text-zinc-200'
            }`}
            aria-label={isPlaying ? 'Pause automated playback' : 'Play automated walkthrough'}
            title={isPlaying ? 'Pause playback' : 'Play walkthrough (Space)'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
            disabled={currentStep >= totalSteps - 1 || isRunning}
            type="button"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            aria-label="Step forward (Right Arrow)"
            title="Next step (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Speed selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded ${
                  speed === spd
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'hover:text-zinc-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Engine Indicator */}
        {engineSource && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/60 border border-white/5 text-[11px] font-mono text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                engineSource === 'backend-api' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            <span>{engineSource === 'backend-api' ? 'FastAPI Python Server' : 'Client Quantum Core'}</span>
          </div>
        )}
      </div>

      {/* Sampling Parameters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <label htmlFor="shots-input" className="font-medium text-zinc-300">
            Measurement Shots:
          </label>
          <input
            id="shots-input"
            type="number"
            min={0}
            max={100000}
            step={100}
            value={shotsInput}
            onChange={handleShotsChange}
            disabled={isRunning}
            className="w-24 px-2 py-1 rounded-lg bg-zinc-950 border border-white/10 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="font-medium text-zinc-300">RNG Seed:</span>
          <span className="font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-white/10 text-cyan-400">
            {seed}
          </span>
          <button
            type="button"
            onClick={onRerollSeed}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Generate new reproducible seed and re-sample"
          >
            <Dices className="h-3.5 w-3.5 text-zinc-400" />
            <span>Reroll</span>
          </button>
        </div>
      </div>

      {shotsError && (
        <div className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/30">
          {shotsError}
        </div>
      )}
    </div>
  );
}
