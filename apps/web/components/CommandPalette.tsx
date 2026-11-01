'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from '@quantum/contracts';
import {
  Search,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sun,
  Layers,
  BookOpen,
  Info,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage?: (msg: Message) => void;
  onRun?: () => void;
  onReset?: () => void;
  onStepNext?: () => void;
  onStepPrev?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectMessage,
  onRun,
  onReset,
  onStepNext,
  onStepPrev
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'run',
      label: 'Run Simulation Protocol',
      icon: Play,
      action: () => {
        router.push('/?tab=workbench&run=true');
        if (onRun) onRun();
        onClose();
      }
    },
    {
      id: 'nav-workbench',
      label: 'Open Simulation Workbench',
      icon: Play,
      action: () => {
        router.push('/?tab=workbench');
        onClose();
      }
    },
    {
      id: 'reset',
      label: 'Reset State & Wires',
      icon: RotateCcw,
      action: () => {
        if (onReset) {
          onReset();
        } else {
          router.push('/?tab=workbench&step=0');
        }
        onClose();
      }
    },
    {
      id: 'step-next',
      label: 'Step Forward (→)',
      icon: ChevronRight,
      action: () => {
        if (onStepNext) {
          onStepNext();
        } else {
          router.push('/?tab=workbench');
        }
        onClose();
      }
    },
    {
      id: 'step-prev',
      label: 'Step Backwards (←)',
      icon: ChevronLeft,
      action: () => {
        if (onStepPrev) {
          onStepPrev();
        } else {
          router.push('/?tab=workbench');
        }
        onClose();
      }
    },
    {
      id: 'msg-00',
      label: 'Encode Message "00" (Identity)',
      icon: Search,
      action: () => {
        if (onSelectMessage) {
          onSelectMessage('00');
        } else {
          router.push('/?msg=00&tab=workbench&run=true');
        }
        onClose();
      }
    },
    {
      id: 'msg-01',
      label: 'Encode Message "01" (Pauli-X)',
      icon: Search,
      action: () => {
        if (onSelectMessage) {
          onSelectMessage('01');
        } else {
          router.push('/?msg=01&tab=workbench&run=true');
        }
        onClose();
      }
    },
    {
      id: 'msg-10',
      label: 'Encode Message "10" (Pauli-Z)',
      icon: Search,
      action: () => {
        if (onSelectMessage) {
          onSelectMessage('10');
        } else {
          router.push('/?msg=10&tab=workbench&run=true');
        }
        onClose();
      }
    },
    {
      id: 'msg-11',
      label: 'Encode Message "11" (Pauli-X · Pauli-Z)',
      icon: Search,
      action: () => {
        if (onSelectMessage) {
          onSelectMessage('11');
        } else {
          router.push('/?msg=11&tab=workbench&run=true');
        }
        onClose();
      }
    },
    { id: 'nav-compare', label: 'Open Compare All 4 Messages', icon: Layers, action: () => { router.push('/compare'); onClose(); } },
    { id: 'nav-learn', label: 'Open Protocol Documentation & Math', icon: BookOpen, action: () => { router.push('/learn'); onClose(); } },
    { id: 'nav-about', label: 'About Quantum Superdense Coding', icon: Info, action: () => { router.push('/about'); onClose(); } }
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#0B0E14] border border-white/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-white/10">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or jump to message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-3.5 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action list */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs text-zinc-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors group"
                >
                  <Icon className="h-4 w-4 text-zinc-400 group-hover:text-cyan-300" />
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/10 text-[10px] text-zinc-500 flex justify-between">
          <span>Navigate with arrows / click</span>
          <span>Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
}
