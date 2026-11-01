'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Message, GateOperation, SimulationSnapshot } from '@quantum/contracts';
import { simulateSuperdense } from '@quantum/core';
import { Navbar } from '../components/Navbar';
import { MessageSelector } from '../components/MessageSelector';
import { Circuit } from '../components/Circuit';
import { Controls } from '../components/Controls';
import { Timeline } from '../components/Timeline';
import { StateInspector } from '../components/StateInspector';
import { ProbabilityBars } from '../components/ProbabilityBars';
import { ShotHistogram } from '../components/ShotHistogram';
import { GateDrawer } from '../components/GateDrawer';
import { CommandPalette } from '../components/CommandPalette';
import { ShortcutsHelpModal } from '../components/ShortcutsHelpModal';
import { TourModal } from '../components/TourModal';
import { ClientSimulationResult, runSimulation } from '../lib/api-client';
import { playSoftClick } from '../lib/audio';
import { Sparkles, CheckCircle2, AlertTriangle, BookOpen, Scale, SlidersHorizontal } from 'lucide-react';
import { EntanglementComparison } from '../components/EntanglementComparison';

function PlaygroundInner() {
  const searchParams = useSearchParams();
  const [selectedMessage, setSelectedMessage] = useState<Message>('11');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [shots, setShots] = useState<number>(1000);
  const [seed, setSeed] = useState<number>(42);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [learnMode, setLearnMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'workbench' | 'comparison'>('workbench');
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedGate, setSelectedGate] = useState<GateOperation | null>(null);
  const [gateBeforeSnap, setGateBeforeSnap] = useState<SimulationSnapshot | undefined>();
  const [gateAfterSnap, setGateAfterSnap] = useState<SimulationSnapshot | undefined>();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);

  // Authoritative simulation state (initialized with pure core simulation)
  const [simulation, setSimulation] = useState<ClientSimulationResult>(() => {
    const res = simulateSuperdense('11', 1000, 42);
    return {
      ...res,
      engineSource: 'client-wasm-core',
      requestId: 1
    };
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Execute simulation (via FastAPI backend with fallback to TS engine)
  const executeSimulation = useCallback(
    async (msg: Message, targetShots = shots, targetSeed = seed) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsRunning(true);
      setError(null);

      try {
        const result = await runSimulation(msg, targetShots, targetSeed, controller.signal);
        setSimulation(result);
        setCurrentStep(7); // Jump to final measurement on run
        if (soundEnabled) playSoftClick(true);
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const msg = err instanceof Error ? err.message : 'Unknown simulation failure';
          setError(msg);
        }
      } finally {
        setIsRunning(false);
      }
    },
    [shots, seed, soundEnabled]
  );

  // Respond to URL query parameters (e.g. ?msg=01&run=true&tab=workbench)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const msgParam = searchParams.get('msg');
    const runParam = searchParams.get('run');

    if (tabParam === 'workbench') {
      setViewMode('workbench');
    } else if (tabParam === 'comparison') {
      setViewMode('comparison');
    }

    if (msgParam && (msgParam === '00' || msgParam === '01' || msgParam === '10' || msgParam === '11')) {
      setSelectedMessage(msgParam as Message);
      executeSimulation(msgParam as Message);
    } else if (runParam === 'true') {
      setViewMode('workbench');
      executeSimulation(selectedMessage);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle message selection: immediately recalculate simulation
  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    executeSimulation(msg, shots, seed);
  };

  // Reset experiment
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPlaying(false);
    setCurrentStep(0);
    setError(null);
  };

  // Step change with sound feedback
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    if (soundEnabled) playSoftClick(true);
  };

  // Autoplay progression effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1000 / speed);
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= simulation.snapshots.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        if (soundEnabled) playSoftClick(true);
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, simulation.snapshots.length, soundEnabled]);

  // Reroll seed and re-sample
  const handleRerollSeed = () => {
    const nextSeed = Math.floor(Math.random() * 100000);
    setSeed(nextSeed);
    executeSimulation(selectedMessage, shots, nextSeed);
  };

  // Gate click drawer handler
  const handleOpenGate = (
    gate: GateOperation,
    beforeSnap?: SimulationSnapshot,
    afterSnap?: SimulationSnapshot
  ) => {
    setSelectedGate(gate);
    setGateBeforeSnap(beforeSnap);
    setGateAfterSnap(afterSnap);
  };

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStep((prev) => Math.min(simulation.snapshots.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        executeSimulation(selectedMessage);
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      } else if (e.key === '1') {
        handleSelectMessage('00');
      } else if (e.key === '2') {
        handleSelectMessage('01');
      } else if (e.key === '3') {
        handleSelectMessage('10');
      } else if (e.key === '4') {
        handleSelectMessage('11');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeSimulation, selectedMessage, simulation.snapshots.length]);

  const activeSnapshot = simulation.snapshots[currentStep] || simulation.snapshots[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-zinc-100">
      {/* Global Navbar */}
      <Navbar
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Workbench Hero Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Quantum Superdense Coding Laboratory
              </h1>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Deterministic Protocol (P=1.0)
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Transmit 2 classical bits by sending 1 qubit through a quantum channel using shared Bell-state entanglement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Learn mode toggle button */}
            <button
              type="button"
              onClick={() => setLearnMode((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                learnMode
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{learnMode ? 'Learn Mode: ON' : 'Learn Mode: OFF'}</span>
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {error && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => executeSimulation(selectedMessage)}
              className="px-3 py-1 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-400"
            >
              Retry
            </button>
          </div>
        )}

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-950/80 border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setViewMode('workbench')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'workbench'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Circuit Workbench</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('comparison')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'comparison'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Entanglement Comparison (With vs Without)</span>
          </button>
        </div>

        {/* View Mode Content */}
        {viewMode === 'comparison' ? (
          <EntanglementComparison
            initialMessage={selectedMessage}
            soundEnabled={soundEnabled}
          />
        ) : (
          /* Two-Column Workbench Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Circuit, Message Selector, Controls, Timeline */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Tactical Message Selector */}
              <MessageSelector
                selectedMessage={selectedMessage}
                onSelect={handleSelectMessage}
                disabled={isRunning}
              />

              {/* 2. Interactive SVG Circuit Canvas */}
              <Circuit
                message={selectedMessage}
                currentStep={currentStep}
                snapshots={simulation.snapshots}
                onSelectGate={handleOpenGate}
              />

              {/* 3. Primary Controls Bar */}
              <Controls
                isRunning={isRunning}
                onRun={() => executeSimulation(selectedMessage)}
                onReset={handleReset}
                currentStep={currentStep}
                totalSteps={simulation.snapshots.length}
                onStepChange={handleStepChange}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((prev) => !prev)}
                speed={speed}
                onChangeSpeed={setSpeed}
                shots={shots}
                onChangeShots={(s) => {
                  setShots(s);
                  executeSimulation(selectedMessage, s, seed);
                }}
                seed={seed}
                onRerollSeed={handleRerollSeed}
                engineSource={simulation.engineSource}
              />

              {/* 4. Timeline Stage Stepper & KaTeX narration */}
              <Timeline
                snapshots={simulation.snapshots}
                currentStep={currentStep}
                onSelectStep={handleStepChange}
                learnMode={learnMode}
              />
            </div>

            {/* Right Column (5 cols): Inspector, Probabilities, Histogram, Summary */}
            <div className="lg:col-span-5 space-y-6">
              {/* Scientific Summary Callout */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 dark:bg-zinc-900/60 light:bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    What You Are Seeing
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    Decoded: &apos;{simulation.decodedMessage}&apos;
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Alice encoded message <strong className="text-rose-400 font-mono">&apos;{selectedMessage}&apos;</strong> onto her qubit.
                  After quantum channel transmission and Bob&apos;s disentangling CNOT + H operations, projective measurement recovers{' '}
                  <strong className="text-emerald-400 font-mono">&apos;{simulation.decodedMessage}&apos;</strong> with 100% fidelity.
                </p>
              </div>

              {/* State Inspector & Phasor Dial Indicators */}
              <StateInspector
                stateVector={activeSnapshot.stateVector}
                probabilities={activeSnapshot.probabilities}
                activeStep={currentStep}
              />

              {/* Computational Basis Probabilities */}
              <ProbabilityBars
                probabilities={activeSnapshot.probabilities}
                targetMessage={selectedMessage}
              />

              {/* Sampled Measurement Histogram */}
              <ShotHistogram
                measurement={simulation.measurement}
                targetMessage={selectedMessage}
                onRerollSeed={handleRerollSeed}
              />
            </div>
          </div>
        )}
      </main>

      {/* Slide Drawer for Gate Details */}
      <GateDrawer
        gate={selectedGate}
        beforeSnapshot={gateBeforeSnap}
        afterSnapshot={gateAfterSnap}
        onClose={() => setSelectedGate(null)}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectMessage={handleSelectMessage}
        onRun={() => {
          setViewMode('workbench');
          executeSimulation(selectedMessage);
        }}
        onReset={handleReset}
        onStepNext={() => setCurrentStep((prev) => Math.min(simulation.snapshots.length - 1, prev + 1))}
        onStepPrev={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
      />

      {/* Keyboard Shortcuts Help Modal (?) */}
      <ShortcutsHelpModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* First-visit guided walkthrough */}
      <TourModal />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0E14] text-zinc-400 p-8 flex items-center justify-center text-sm font-mono">Loading quantum workbench…</div>}>
      <PlaygroundInner />
    </Suspense>
  );
}
