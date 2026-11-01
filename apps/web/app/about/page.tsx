'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Info, ArrowLeft, Cpu, Terminal, Accessibility, ShieldCheck, Play } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-zinc-100">
      <Navbar soundEnabled={false} onToggleSound={() => {}} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              aria-label="Back to playground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Info className="h-6 w-6 text-cyan-400" />
                <span>About Quantum Superdense Simulator</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Engineering architecture, scientific validation, accessibility standards, and runtime environments.
              </p>
            </div>
          </div>

          <Link
            href="/?tab=workbench&run=true"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
            aria-label="Run Simulation"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Simulation</span>
          </Link>
        </div>

        {/* Stack Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>Scientific Quantum Engines</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Calculations are computed using exact state-vector algebra:
            </p>
            <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside font-mono">
              <li><strong className="text-white">Python Backend:</strong> FastAPI, NumPy 2.x, Pydantic 2.x</li>
              <li><strong className="text-white">TypeScript Core:</strong> Pure matrix engine with zero external math dependencies</li>
              <li><strong className="text-white">Tolerances:</strong> Normalization verified to $||\psi||^2 = 1.0 \pm 10^{-9}$</li>
              <li><strong className="text-white">Sampling:</strong> Deterministic 32-bit Mulberry32 seeded RNG</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              <span>Accessibility & Design System</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Engineered to meet WCAG 2.2 Level AA accessibility requirements:
            </p>
            <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
              <li>High-contrast scientific color palette with WCAG AA compliance</li>
              <li>Full keyboard navigation path (Tab, arrows, shortcuts)</li>
              <li>Screen reader live updates (<code className="text-cyan-400 font-mono">aria-live=&quot;polite&quot;</code>)</li>
              <li>Strict respect for <code className="text-cyan-400 font-mono">prefers-reduced-motion</code></li>
              <li>44×44px minimum touch targets on mobile viewports</li>
            </ul>
          </div>
        </div>

        {/* Repository layout */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span>Monorepo Architecture</span>
          </h2>
          <div className="p-4 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto">
            <pre>{`quantum-superdense/
├── apps/
│   └── web/                # Next.js 14+ App Router, Tailwind CSS, KaTeX
├── services/
│   └── simulator/          # FastAPI + NumPy state-vector backend service
├── packages/
│   ├── contracts/          # Shared TypeScript type definitions
│   └── quantum-core/       # Pure TypeScript quantum engine
├── docs/                   # Full documentation & BUILD_LOG.md
└── docker-compose.yml`}</pre>
          </div>
        </div>
      </main>
    </div>
  );
}
