'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { MathFormula } from '../../lib/katex';
import { BookOpen, ArrowLeft, Lightbulb, ShieldCheck, Atom, Play } from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-zinc-100">
      <Navbar soundEnabled={false} onToggleSound={() => {}} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* Top Header */}
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
                <BookOpen className="h-6 w-6 text-cyan-400" />
                <span>The Quantum Superdense Coding Protocol</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Theoretical foundation, gate algebra, state transformations, and mathematical proofs.
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

        {/* Section 1: Executive Summary */}
        <section className="space-y-3 p-5 rounded-2xl bg-zinc-900/60 border border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Atom className="h-4 w-4" />
            <span>1. What is Superdense Coding?</span>
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Superdense coding (proposed by Charles H. Bennett and Stephen J. Wiesner in 1992) is a fundamental quantum information protocol.
            It allows a sender (Alice) to communicate <strong>two classical bits</strong> of information to a receiver (Bob) by transmitting only <strong>one physical qubit</strong>, provided they previously shared a pair of entangled qubits.
          </p>
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
            <strong>Key Insight:</strong> Sending a qubit without entanglement transmits at most 1 classical bit of information (Holevo’s Bound). Pre-shared entanglement doubles the classical channel capacity per transmitted qubit!
          </div>
        </section>

        {/* Section 2: Step-by-Step Mathematical Derivation */}
        <section className="space-y-4 p-5 rounded-2xl bg-zinc-900/60 border border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>2. Mathematical Step-by-Step Walkthrough</span>
          </h2>

          <div className="space-y-4 text-xs text-zinc-300">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">Step 1: Entanglement Preparation (Bell State |Φ+⟩)</h3>
              <p>
                Alice and Bob start with two qubits initialized to ground state |00⟩. A Hadamard gate is applied to q0, followed by a CNOT gate with q0 as control and q1 as target:
              </p>
              <div role="region" tabIndex={0} aria-label="Mathematical derivation of Bell state" className="py-2 text-cyan-300 overflow-x-auto text-center font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded">
                <MathFormula math="(H \otimes I)|00\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |10\rangle)" block />
                <MathFormula math="\text{CNOT}\frac{1}{\sqrt{2}}(|00\rangle + |10\rangle) = |\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)" block />
              </div>
              <p>Alice retains qubit q0, and Bob receives qubit q1.</p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">Step 2: Alice&apos;s Encoding Operation</h3>
              <p>
                Depending on the two classical bits Alice desires to send, she performs a local unitary operation on her qubit q0 alone:
              </p>
              <div role="region" tabIndex={0} aria-label="Encoding table" className="overflow-x-auto py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded">
                <table className="w-full text-left font-mono border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400">
                      <th className="py-2">Message</th>
                      <th className="py-2">Alice&apos;s Local Gate</th>
                      <th className="py-2">Resulting Global Quantum State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    <tr>
                      <td className="py-2 font-bold text-rose-400">00</td>
                      <td>Identity (I)</td>
                      <td><MathFormula math="|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}" /></td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-rose-400">01</td>
                      <td>Pauli-X (bit flip)</td>
                      <td><MathFormula math="|\Psi^+\rangle = \frac{|01\rangle + |10\rangle}{\sqrt{2}}" /></td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-rose-400">10</td>
                      <td>Pauli-Z (phase flip)</td>
                      <td><MathFormula math="|\Phi^-\rangle = \frac{|00\rangle - |11\rangle}{\sqrt{2}}" /></td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-rose-400">11</td>
                      <td>Pauli-X · Pauli-Z</td>
                      <td><MathFormula math="-|\Psi^-\rangle = \frac{-|01\rangle + |10\rangle}{\sqrt{2}}" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">Step 3: Physical Transmission</h3>
              <p>
                Alice physically sends her single qubit q0 to Bob across the quantum channel (e.g. an optical fiber carrying a single polarized photon). Bob now holds both qubits q0 and q1.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">Step 4: Bob&apos;s Decoding Circuit</h3>
              <p>
                Bob applies a CNOT gate with q0 as control and q1 as target, followed by a Hadamard gate on q0:
              </p>
              <div role="region" tabIndex={0} aria-label="Decoding operator math" className="py-2 text-cyan-300 overflow-x-auto text-center font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded">
                <MathFormula math="U_{\text{decode}} = (H \otimes I) \cdot \text{CNOT}" block />
              </div>
              <p>
                This unitary transformation perfectly rotates the 4 orthogonal Bell states into the 4 standard computational basis states |00⟩, |01⟩, |10⟩, and |11⟩.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm">Step 5: Measurement</h3>
              <p>
                Bob measures both qubits in the computational basis. In this ideal noiseless model, he recovers Alice&apos;s 2 classical bits with probability 1.0 (100% certainty).
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: No-Signaling Theorem */}
        <section className="space-y-3 p-5 rounded-2xl bg-zinc-900/60 border border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>3. Why This Does Not Violate No-Signaling</span>
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Before Alice transmits her qubit q0 across space, Bob’s reduced density matrix is the maximally mixed state:
          </p>
          <div role="region" tabIndex={0} aria-label="No-signaling density matrix formula" className="py-2 text-center text-cyan-300 font-mono text-xs overflow-x-auto focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded">
            <MathFormula math="\rho_B = \text{Tr}_A(|\Phi\rangle\langle\Phi|) = \frac{1}{2}\begin{pmatrix}1 & 0\\0 & 1\end{pmatrix} = \frac{I}{2}" block />
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Regardless of what operation Alice applies to her qubit, Bob&apos;s local density matrix remains completely unchanged until qubit q0 physically arrives at Bob&apos;s location. Therefore, faster-than-light communication is strictly impossible.
          </p>
        </section>

        {/* Call to Action: Run the live simulation */}
        <section className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 backdrop-blur-md">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Atom className="h-4 w-4 text-cyan-400" />
              <span>Ready to test the protocol live?</span>
            </h3>
            <p className="text-xs text-zinc-300">
              Launch the interactive state-vector laboratory to watch superposition, Bell-state encoding, and 100% deterministic decoding.
            </p>
          </div>
          <Link
            href="/?tab=workbench&run=true"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
            aria-label="Run Simulation in Workbench"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Run Simulation in Workbench &rarr;</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
