'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { simulateSuperdense } from '@quantum/core';
import { Message } from '@quantum/contracts';
import { Navbar } from '../../components/Navbar';
import { EntanglementComparison } from '../../components/EntanglementComparison';
import { MathFormula } from '../../lib/katex';
import { CheckCircle2, ArrowLeft, Layers, Sparkles, Scale, Play } from 'lucide-react';

const ALL_MESSAGES: Message[] = ['00', '01', '10', '11'];

export default function ComparePage() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'matrix'>('comparison');

  const comparisons = useMemo(() => {
    return ALL_MESSAGES.map((msg) => {
      const res = simulateSuperdense(msg, 1000, 42);
      return {
        message: msg,
        result: res
      };
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-zinc-100">
      <Navbar soundEnabled={false} onToggleSound={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                aria-label="Back to playground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-400" />
                <span>Four-Message Comparative Matrix & Entanglement Comparison</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 max-w-3xl">
              Compare superdense coding with and without shared entanglement, and examine the side-by-side orthogonality of all four Bell states.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/?tab=workbench&run=true"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 active:scale-[0.98] transition-all"
              aria-label="Run Simulation"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Simulation</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="h-4 w-4" />
              <span>All 4 States Proven Orthogonal</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-950/80 border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'comparison'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Entanglement Comparison (With vs Without)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Four-Message Matrix (Orthogonality)</span>
          </button>
        </div>

        {/* Tab 1: Entanglement Comparison */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-zinc-300">
              <span>Looking for the full single-circuit step-by-step state inspector and Bloch phasor visualization?</span>
              <Link
                href="/?tab=workbench&run=true"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-medium transition-colors"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Run Full Simulation in Workbench &rarr;</span>
              </Link>
            </div>
            <EntanglementComparison initialMessage="11" soundEnabled={false} />
          </div>
        )}

        {/* Tab 2: 4-Message Comparative Matrix Cards Grid */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {comparisons.map(({ message, result }) => {
                const encodeGate =
                  message === '00'
                    ? 'Identity (I)'
                    : message === '01'
                    ? 'Pauli-X'
                    : message === '10'
                    ? 'Pauli-Z'
                    : 'Pauli-X then Pauli-Z (XZ)';

                const bellStateFormula =
                  message === '00'
                    ? '|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}'
                    : message === '01'
                    ? '|\\Psi^+\\rangle = \\frac{|01\\rangle + |10\\rangle}{\\sqrt{2}}'
                    : message === '10'
                    ? '|\\Phi^-\\rangle = \\frac{|00\\rangle - |11\\rangle}{\\sqrt{2}}'
                    : '-|\\Psi^-\\rangle = \\frac{-|01\\rangle + |10\\rangle}{\\sqrt{2}}';

                return (
                  <div
                    key={message}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Message & Gate Tag */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-zinc-400">Message</span>
                          <div className="font-mono text-3xl font-extrabold text-cyan-400">
                            {message}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono text-zinc-400">Alice Gate</span>
                          <div className="font-mono text-xs font-bold text-rose-400">
                            {encodeGate}
                          </div>
                        </div>
                      </div>

                      {/* Encoded Bell State Formula */}
                      <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 text-center text-xs text-cyan-300 overflow-x-auto">
                        <MathFormula math={bellStateFormula} block />
                      </div>

                      {/* Decoded result */}
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                        <span className="text-zinc-300">Bob Measured:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {result.decodedMessage} (100%)
                        </span>
                      </div>

                      {/* Probabilities list */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-mono uppercase text-zinc-400">
                          Final Probabilities
                        </span>
                        {(['00', '01', '10', '11'] as Message[]).map((b) => {
                          const prob = result.finalProbabilities[b];
                          const isMatch = b === message;

                          return (
                            <div
                              key={b}
                              className={`flex items-center justify-between p-1.5 rounded-lg text-xs font-mono ${
                                isMatch
                                  ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30'
                                  : 'text-zinc-400 bg-zinc-950/40'
                              }`}
                            >
                              <span>|{b}⟩</span>
                              <span>{(prob * 100).toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <Link
                        href={`/?msg=${message}&tab=workbench&run=true`}
                        className="flex items-center justify-center gap-1.5 w-full py-2 text-center rounded-xl bg-zinc-800 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/30 border border-transparent text-xs font-medium text-white transition-all"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Run Simulation for &apos;|{message}⟩&apos; &rarr;</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
