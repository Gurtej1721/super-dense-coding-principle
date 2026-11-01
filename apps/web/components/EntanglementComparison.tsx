'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BasisState,
  ExperimentMode,
  GateOperation,
  Message,
  SimulationSnapshot,
  SimulationResult
} from '@quantum/contracts';
import { simulateSuperdense } from '@quantum/core';
import { ComparisonCircuit } from './ComparisonCircuit';
import { MathFormula } from '../lib/katex';
import { playSoftClick } from '../lib/audio';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  Layers,
  Radio,
  Sliders,
  Dices,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const ALL_MESSAGES: Message[] = ['00', '01', '10', '11'];
const BASIS_STATES: BasisState[] = ['00', '01', '10', '11'];

interface EntanglementComparisonProps {
  initialMessage?: Message;
  soundEnabled?: boolean;
}

export function EntanglementComparison({
  initialMessage = '11',
  soundEnabled = false
}: EntanglementComparisonProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message>(initialMessage);
  const [currentStep, setCurrentStep] = useState<number>(7); // Start at final measurement or 0
  const [shots, setShots] = useState<number>(1000);
  const [seed, setSeed] = useState<number>(42);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [noiseEnabled, setNoiseEnabled] = useState<boolean>(false);
  const [noiseRate, setNoiseRate] = useState<number>(0.05);

  // Active gate inspection modal
  const [inspectedGate, setInspectedGate] = useState<{
    gate: GateOperation;
    before?: SimulationSnapshot;
    after?: SimulationSnapshot;
  } | null>(null);

  // Compute entangled simulation
  const entangledResult: SimulationResult = React.useMemo(() => {
    return simulateSuperdense(selectedMessage, shots, seed, {
      mode: 'with_entanglement',
      noiseRate: noiseEnabled ? noiseRate : 0
    });
  }, [selectedMessage, shots, seed, noiseEnabled, noiseRate]);

  // Compute unentangled simulation
  const unentangledResult: SimulationResult = React.useMemo(() => {
    return simulateSuperdense(selectedMessage, shots, seed, {
      mode: 'without_entanglement',
      noiseRate: noiseEnabled ? noiseRate : 0
    });
  }, [selectedMessage, shots, seed, noiseEnabled, noiseRate]);

  // Snapshots at current step
  const entangledSnap = entangledResult.snapshots[currentStep] || entangledResult.snapshots[0];
  const unentangledSnap = unentangledResult.snapshots[currentStep] || unentangledResult.snapshots[0];

  // Playback timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(300, 1200 / speed);
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 7) {
            setIsPlaying(false);
            return 7;
          }
          if (soundEnabled) playSoftClick(false);
          return prev + 1;
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, speed, soundEnabled]);

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (soundEnabled) playSoftClick(true);
  };

  const handleRunBoth = () => {
    setIsPlaying(false);
    setCurrentStep(7);
    if (soundEnabled) playSoftClick(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    if (soundEnabled) playSoftClick(false);
  };

  const handleStepForward = () => {
    setCurrentStep((prev) => Math.min(7, prev + 1));
    if (soundEnabled) playSoftClick(false);
  };

  const handleStepBackward = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    if (soundEnabled) playSoftClick(false);
  };

  const handleRerollSeed = () => {
    const nextSeed = Math.floor(Math.random() * 999999);
    setSeed(nextSeed);
    if (soundEnabled) playSoftClick(false);
  };

  // Milestone Stages Definition
  const STAGES = [
    { label: '1. Entanglement', step: 2, icon: Zap, active: currentStep >= 0 && currentStep <= 2 },
    { label: '2. Encoding', step: 3, icon: Radio, active: currentStep === 3 },
    { label: '3. Transit', step: 4, icon: ArrowRight, active: currentStep === 4 },
    { label: '4. Decoding', step: 6, icon: Sliders, active: currentStep >= 5 && currentStep <= 6 },
    { label: '5. Results', step: 7, icon: CheckCircle2, active: currentStep === 7 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="rounded-2xl bg-zinc-900/70 border border-white/10 p-4 sm:p-6 backdrop-blur-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                Comparative Protocol Laboratory
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-violet-500/15 border border-violet-500/30 text-violet-300">
                Live State-Vector Simulation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Superdense Coding: Shared Entanglement vs Product State</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-4xl mt-1">
              Observe how Alice sends only <strong>1 physical qubit</strong> to Bob. With pre-shared entanglement (|Φ⁺⟩), Bob recovers both classical bits with 100% fidelity. Without entanglement, the protocol collapses under the Holevo bound (I &le; 1 bit).
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Entangled Fidelity</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {noiseEnabled ? `${((1 - noiseRate * 0.75) * 100).toFixed(1)}%` : '100.0%'}
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Unentangled Max</span>
              <span className="text-sm font-bold font-mono text-amber-400">50.0% (Ambiguous)</span>
            </div>
          </div>
        </div>

        {/* Message Selector & Experiment Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-white/10">
          {/* Message Selection */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Select 2-Bit Message
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                Encoding: {selectedMessage === '00' ? 'I (No-op)' : selectedMessage === '01' ? 'X (Bit Flip)' : selectedMessage === '10' ? 'Z (Phase Flip)' : 'XZ (X then Z)'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {ALL_MESSAGES.map((msg) => {
                const isSelected = selectedMessage === msg;
                const gateLabel =
                  msg === '00' ? 'I' : msg === '01' ? 'X' : msg === '10' ? 'Z' : 'XZ';

                return (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => handleSelectMessage(msg)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/25 to-blue-600/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-zinc-950/80 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="text-base font-extrabold font-mono tracking-wider">{msg}</span>
                    <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-cyan-300' : 'text-zinc-400'}`}>
                      Gate: {gateLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons (Run, Play, Step, Reset) */}
          <div className="md:col-span-7 flex flex-wrap items-center justify-start md:justify-end gap-2.5">
            {/* Run Both Button */}
            <button
              type="button"
              onClick={handleRunBoth}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Both Protocols</span>
            </button>

            {/* Play / Pause Walkthrough */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-white/10 transition-colors"
              title={isPlaying ? 'Pause walkthrough' : 'Play walkthrough'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Step Backward / Forward */}
            <div className="flex items-center rounded-xl bg-zinc-950/80 border border-white/10 p-0.5">
              <button
                type="button"
                onClick={handleStepBackward}
                disabled={currentStep <= 0}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-300 transition-colors"
                title="Step backwards"
                aria-label="Step backwards"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono text-xs text-zinc-300 select-none">
                {currentStep} / 7
              </span>
              <button
                type="button"
                onClick={handleStepForward}
                disabled={currentStep >= 7}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-300 transition-colors"
                title="Step forward"
                aria-label="Step forward"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
              title="Reset experiment state"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            {/* Shots Selector */}
            <div className="flex items-center rounded-xl bg-zinc-950/80 border border-white/10 p-1">
              {[100, 1000, 10000].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShots(s)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors ${
                    shots === s
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.toLocaleString()} shots
                </button>
              ))}
            </div>

            {/* Seed Reroll */}
            <button
              type="button"
              onClick={handleRerollSeed}
              className="p-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors"
              title={`Seed: ${seed}. Click to re-roll RNG seed`}
            >
              <Dices className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Environmental Noise Channel Configuration */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noiseEnabled}
                onChange={(e) => setNoiseEnabled(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-400 h-3.5 w-3.5"
              />
              <span className="text-zinc-300 font-medium">Environmental Decoherence / Noise</span>
            </label>

            {noiseEnabled && (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.01"
                  max="0.30"
                  step="0.01"
                  value={noiseRate}
                  onChange={(e) => setNoiseRate(parseFloat(e.target.value))}
                  className="w-24 accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-cyan-300 text-[11px]">
                  {(noiseRate * 100).toFixed(0)}% channel noise
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <span>Speed:</span>
            {[0.5, 1, 2].map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSpeed(sp)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  speed === sp ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* Synchronized Timeline & Stages Stepper */}
        <div className="pt-2 space-y-2">
          {/* Milestone Buttons */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
            {STAGES.map((stg) => {
              const Icon = stg.icon;
              return (
                <button
                  key={stg.label}
                  type="button"
                  onClick={() => {
                    setCurrentStep(stg.step);
                    if (soundEnabled) playSoftClick(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                    stg.active
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-sm'
                      : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{stg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Step Slider Track */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] font-mono text-zinc-400 shrink-0">Step 0</span>
            <input
              type="range"
              min="0"
              max="7"
              value={currentStep}
              onChange={(e) => setCurrentStep(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              aria-label="Simulation step progression slider"
            />
            <span className="text-[11px] font-mono text-zinc-400 shrink-0">Step 7</span>
          </div>
        </div>
      </div>

      {/* Main Side-by-Side Comparison Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* LEFT PANEL: WITH SHARED ENTANGLEMENT (|Φ⁺⟩ Bell State)       */}
        {/* ============================================================ */}
        <div className="flex flex-col rounded-2xl bg-zinc-900/60 border border-cyan-500/30 p-5 space-y-5 shadow-xl shadow-cyan-950/20">
          {/* Panel Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  With Shared Entanglement
                </h3>
              </div>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">
                Initial Resource: Bell State |Φ⁺⟩ = (|00⟩ + |11⟩)/√2
              </p>
            </div>

            {/* Entanglement Concurrence Metric */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Resource Concurrence</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="font-mono text-sm font-bold text-emerald-400">
                  C = {(entangledResult.entanglementMetric.concurrence).toFixed(3)}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  ({(entangledResult.entanglementMetric.vonNeumannEntropy).toFixed(2)} ebit)
                </span>
              </div>
            </div>
          </div>

          {/* Circuit Visualizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Quantum Circuit (Mode 1)
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                Step {currentStep}: {entangledSnap.title}
              </span>
            </div>
            <ComparisonCircuit
              mode="with_entanglement"
              message={selectedMessage}
              currentStep={currentStep}
              snapshots={entangledResult.snapshots}
              onSelectGate={(gate, before, after) => setInspectedGate({ gate, before, after })}
            />
          </div>

          {/* Current Step Narration & Math Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">
                Step {currentStep}: {entangledSnap.title}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Stage: {entangledSnap.stage}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {entangledSnap.narration}
            </p>
            <div
              tabIndex={0}
              role="region"
              aria-label="Entangled step mathematical formula"
              className="pt-1 overflow-x-auto text-xs text-cyan-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded"
            >
              <MathFormula math={entangledSnap.mathLatex} />
            </div>
          </div>

          {/* State Vector Amplitudes Inspector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Quantum State Vector $|\psi\rangle$ (Amplitudes)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BASIS_STATES.map((b, idx) => {
                const amp = entangledSnap.stateVector[idx];
                const prob = entangledSnap.probabilities[b] ?? 0;
                const isDominant = prob > 0.99;
                const isTarget = b === selectedMessage;

                return (
                  <div
                    key={b}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isDominant
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                        : isTarget
                        ? 'bg-cyan-950/20 border-cyan-500/30 text-zinc-200'
                        : 'bg-zinc-950/60 border-white/5 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <strong className={isDominant ? 'text-emerald-400' : 'text-zinc-200'}>
                        |{b}⟩
                      </strong>
                      <span className="text-[10px] text-zinc-400">{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[11px] font-mono truncate" title={`Amp: ${amp.real.toFixed(4)} + ${amp.imag.toFixed(4)}i`}>
                      {amp.real.toFixed(3)}{amp.imag >= 0 ? '+' : ''}{amp.imag.toFixed(3)}i
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Probability Bar Chart & Sampled Shot Counts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Measurement Probabilities & Counts ({shots.toLocaleString()} Shots)
              </span>
              <span className="text-[11px] font-mono text-emerald-400">Target: |{selectedMessage}⟩</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              {BASIS_STATES.map((b) => {
                const prob = entangledSnap.probabilities[b] ?? 0;
                const counts = entangledResult.measurement.counts[b] ?? 0;
                const isTarget = b === selectedMessage;

                return (
                  <div key={b} className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-zinc-400 mb-1">
                      {(prob * 100).toFixed(1)}%
                    </span>
                    {/* Bar Track */}
                    <div className="w-full h-24 rounded-lg bg-zinc-950/80 border border-white/5 p-1 flex items-end justify-center relative">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          isTarget
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20'
                            : 'bg-zinc-700'
                        }`}
                        style={{ height: `${Math.max(4, prob * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300 mt-1">|{b}⟩</span>
                    <span className="text-[10px] font-mono text-zinc-400">{counts} hits</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Outcome Indicator */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-emerald-300 font-mono">
                100% Deterministic Decoding (Ideal)
              </div>
              <p className="text-[11px] text-zinc-300">
                Bob recovered classical message <strong>&apos;{selectedMessage}&apos;</strong> with perfect fidelity. Local operations on 1 shared entangled qubit transmitted 2 full bits.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT PANEL: WITHOUT ENTANGLEMENT (Product State |00⟩)       */}
        {/* ============================================================ */}
        <div className="flex flex-col rounded-2xl bg-zinc-900/60 border border-rose-500/30 p-5 space-y-5 shadow-xl shadow-rose-950/10">
          {/* Panel Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Without Entanglement
                </h3>
              </div>
              <p className="text-xs text-rose-300 font-mono mt-0.5">
                Initial Resource: Product State |ψ⟩ = |0⟩_A ⊗ |0⟩_B = |00⟩
              </p>
            </div>

            {/* Entanglement Concurrence Metric */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Concurrence</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="font-mono text-sm font-bold text-zinc-400">
                  C = 0.000
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  (0.00 ebit)
                </span>
              </div>
            </div>
          </div>

          {/* Circuit Visualizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Quantum Circuit (Mode 2)
              </span>
              <span className="text-[11px] font-mono text-rose-300">
                Step {currentStep}: {unentangledSnap.title}
              </span>
            </div>
            <ComparisonCircuit
              mode="without_entanglement"
              message={selectedMessage}
              currentStep={currentStep}
              snapshots={unentangledResult.snapshots}
              onSelectGate={(gate, before, after) => setInspectedGate({ gate, before, after })}
            />
          </div>

          {/* Current Step Narration & Math Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">
                Step {currentStep}: {unentangledSnap.title}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Stage: {unentangledSnap.stage}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {unentangledSnap.narration}
            </p>
            <div
              tabIndex={0}
              role="region"
              aria-label="Unentangled step mathematical formula"
              className="pt-1 overflow-x-auto text-xs text-rose-200 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500/50 rounded"
            >
              <MathFormula math={unentangledSnap.mathLatex} />
            </div>
          </div>

          {/* State Vector Amplitudes Inspector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Quantum State Vector $|\psi\rangle$ (Amplitudes)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BASIS_STATES.map((b, idx) => {
                const amp = unentangledSnap.stateVector[idx];
                const prob = unentangledSnap.probabilities[b] ?? 0;
                const hasProb = prob > 0.01;

                return (
                  <div
                    key={b}
                    className={`p-2.5 rounded-xl border transition-all ${
                      hasProb
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                        : 'bg-zinc-950/60 border-white/5 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <strong className={hasProb ? 'text-amber-300' : 'text-zinc-200'}>
                        |{b}⟩
                      </strong>
                      <span className="text-[10px] text-zinc-400">{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[11px] font-mono truncate" title={`Amp: ${amp.real.toFixed(4)} + ${amp.imag.toFixed(4)}i`}>
                      {amp.real.toFixed(3)}{amp.imag >= 0 ? '+' : ''}{amp.imag.toFixed(3)}i
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Probability Bar Chart & Sampled Shot Counts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Measurement Probabilities & Counts ({shots.toLocaleString()} Shots)
              </span>
              <span className="text-[11px] font-mono text-amber-400">Ambiguous Split</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              {BASIS_STATES.map((b) => {
                const prob = unentangledSnap.probabilities[b] ?? 0;
                const counts = unentangledResult.measurement.counts[b] ?? 0;
                const isSelectedMsg = b === selectedMessage;

                return (
                  <div key={b} className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-zinc-400 mb-1">
                      {(prob * 100).toFixed(1)}%
                    </span>
                    {/* Bar Track */}
                    <div className="w-full h-24 rounded-lg bg-zinc-950/80 border border-white/5 p-1 flex items-end justify-center relative">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          prob > 0.4
                            ? isSelectedMsg
                              ? 'bg-amber-500 shadow-sm shadow-amber-500/20'
                              : 'bg-rose-500 shadow-sm shadow-rose-500/20'
                            : 'bg-zinc-800'
                        }`}
                        style={{ height: `${Math.max(4, prob * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300 mt-1">|{b}⟩</span>
                    <span className="text-[10px] font-mono text-zinc-400">{counts} hits</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Outcome Indicator */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-rose-300 font-mono">
                Ambiguous Decoding (50% / 50% Indeterminacy)
              </div>
              <p className="text-[11px] text-zinc-300">
                Without prior entanglement, Bob measures two outcomes with equal 50% probability ({selectedMessage === '00' || selectedMessage === '10' ? '00 and 10' : '01 and 11'}). Alice cannot communicate 2 bits across 1 unentangled qubit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Comparative Breakdown */}
      <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Scientific Synthesis: Why Superdense Coding Requires Entanglement
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 space-y-2">
            <h4 className="font-bold text-cyan-300 font-mono">1. The Holevo Bound (Limit)</h4>
            <p className="text-zinc-400 leading-relaxed">
              Holevo&apos;s theorem proves that transmitting n unentangled quantum two-level systems (qubits) can transmit at most n bits of classical information: &chi; &le; S(&rho;) &le; 1 bit. Sending 1 physical qubit alone without entanglement cannot communicate 2 bits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 space-y-2">
            <h4 className="font-bold text-violet-300 font-mono">2. Four Orthogonal Bell States</h4>
            <p className="text-zinc-400 leading-relaxed">
              In the entangled case, Alice&apos;s local unitary operations (I, X, Z, XZ) transform the single shared Bell state |Φ⁺⟩ into four mutually orthogonal Bell states: |Φ⁺⟩, |Ψ⁺⟩, |Φ⁻⟩, and -|Ψ⁻⟩. Because these 4 states are mutually orthogonal in 4D Hilbert space, Bob can distinguish them with 100% fidelity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 space-y-2">
            <h4 className="font-bold text-emerald-300 font-mono">3. No Faster-Than-Light Signaling</h4>
            <p className="text-zinc-400 leading-relaxed">
              Superdense coding does not allow instant communication. Alice and Bob must first physically distribute the entangled pair ahead of time (at or below light speed). Furthermore, Bob cannot read Alice&apos;s message until Alice physically transmits her encoded qubit to him.
            </p>
          </div>
        </div>
      </div>

      {/* Gate Inspection Modal / Drawer */}
      {inspectedGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-modal-title"
        >
          <div className="max-w-lg w-full rounded-2xl bg-zinc-900 border border-white/20 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 id="gate-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs">
                  {inspectedGate.gate.gate}
                </span>
                <span>{inspectedGate.gate.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setInspectedGate(null)}
                className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-zinc-800"
              >
                Close (ESC)
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              {inspectedGate.gate.description}
            </p>

            {inspectedGate.gate.matrixLatex && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 text-center font-mono text-sm text-cyan-300">
                <MathFormula math={inspectedGate.gate.matrixLatex} />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectedGate(null)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
