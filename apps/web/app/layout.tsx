import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quantum Superdense Coding Simulator | Interactive Protocol Laboratory',
  description:
    'Interactive educational quantum computing simulator demonstrating superdense coding. Alice encodes two classical bits into a single transmitted qubit via shared entanglement.',
  keywords: [
    'quantum computing',
    'superdense coding',
    'quantum state vector',
    'bell state',
    'hadamard',
    'cnot',
    'quantum physics simulator'
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚛️</text></svg>" />
      </head>
      <body className="min-h-screen bg-[#0B0E14] text-zinc-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
