'use client';

import React, { useEffect, useRef } from 'react';
import { HelpCircle, X, Keyboard } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause snapshot autoplay' },
  { key: '→ / ←', desc: 'Step forward / Step backwards' },
  { key: 'R', desc: 'Run quantum protocol end-to-end' },
  { key: '0', desc: 'Reset circuit to initial step 0' },
  { key: '1, 2, 3, 4', desc: 'Select message 00, 01, 10, or 11' },
  { key: '⌘K / Ctrl+K', desc: 'Open Command Palette' },
  { key: '?', desc: 'Toggle keyboard shortcuts help' },
  { key: 'Esc', desc: 'Dismiss active modal or gate drawer' }
];

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0B0E14] border border-white/20 p-6 shadow-2xl relative space-y-4">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-white/10"
          aria-label="Close shortcuts modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-cyan-400" />
          <h3 id="shortcuts-title" className="text-base font-bold text-white">
            Keyboard Shortcuts
          </h3>
        </div>

        <p className="text-xs text-zinc-400">
          The quantum workbench is fully keyboard navigable. Use the shortcuts below to explore rapidly.
        </p>

        <div className="divide-y divide-white/5 border-y border-white/10 py-1">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2 text-xs">
              <span className="text-zinc-300">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-zinc-900 border border-white/10 font-mono text-[11px] text-cyan-400 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
